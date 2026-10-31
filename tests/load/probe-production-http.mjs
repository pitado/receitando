// Real Cloudflare Worker deployment; synthetic temporary Durable Object rooms only.
// This measures HTTP + Cloudflare Workers + Durable Objects, NOT Neon writes.
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
const api='https://api.receitando.miguelpita.com.br';
const origin='https://receitando.miguelpita.com.br';
const targetWrites=Number(process.env.TARGET_WRITES||1000);
const targetReads=Number(process.env.TARGET_READS||2000);
if(targetWrites>10000||targetReads>20000||targetWrites<1||targetReads<1)throw Error('Out of bounded range for production.');
const stats={writes:[],reads:[], errors:[],counts:{writes:0,reads:0}, statuses:{}};
const startedAt=new Date().toISOString(),t0=performance.now();
async function req(path,method='GET',data){
 const t=performance.now();let status=0,payload=null,error=null;
 try{
  const r=await fetch(api+path,{method,signal:AbortSignal.timeout(12000),headers:{
   Accept:'application/json', Origin:origin, ...(data?{'Content-Type':'application/json'}:{})}, body:data?JSON.stringify(data):undefined});
  status=r.status;payload=await r.json().catch(()=>null);
 }catch(e){error=String(e)}
 return {status,payload,error,ms:Math.round((performance.now()-t)*100)/100};
}
function record(result,group,expected){
 stats[group].push(result.ms);
 stats.statuses[result.status]=(stats.statuses[result.status]||0)+1;
 if(result.status===expected && result.payload){
  stats.counts[group]++;return true;
 }
 if(stats.errors.length<30)stats.errors.push({group,status:result.status,error:result.error,body:JSON.stringify(result.payload).slice(0,150)});
 return false;
}
const seed=await req('/api/v2/cooking-rooms','POST',{recipeSlug:'fase4-probe-seed',title:'Sala automática de teste',steps:['Etapa de teste']});
if(seed.status!==201||!seed.payload?.id)throw Error('Could not create isolated seed room in production: '+JSON.stringify(seed));
const seedUrl='/api/v2/cooking-rooms/'+seed.payload.id;
const sanity=await req(seedUrl);
if(sanity.status!==200||sanity.payload?.version!==0)throw Error('Could not verify seed room: '+JSON.stringify(sanity));
let canceled=false;
async function pool(group,target,concurrency,perform){
 let cursor=0;
 async function worker(){
  while(!canceled){
   const i=cursor++;
   if(i>=target)break;
   const response=await perform(i);
   const ok=record(response,group,group==='writes'?201:200);
   if(group==='writes' && ok && typeof response.payload?.id!=='string'){
    stats.counts.writes--;
    if(stats.errors.length<30)stats.errors.push({group,error:'response missing room id'});
   }
   if(group==='reads' && ok && response.payload?.version!==0){
    stats.counts.reads--;
    if(stats.errors.length<30)stats.errors.push({group,error:'version mismatch'});
   }
   const attempts=stats.writes.length+stats.reads.length,success=stats.counts.writes+stats.counts.reads;
   if(attempts>=100 && (attempts-success)/attempts>0.10)canceled=true;
   await new Promise(r=>setTimeout(r,120));
  }
 }
 await Promise.all(Array.from({length:concurrency},()=>worker()));
}
await Promise.all([
 pool('writes',targetWrites,4, i=>req('/api/v2/cooking-rooms','POST',{
  recipeSlug:'fase4-benchmark-'+i,title:'Teste de escala HTTP — sem usuário',steps:['Etapa sintética']
 })),
 pool('reads',targetReads,8,()=>req(seedUrl))
]);
const elapsed=(performance.now()-t0)/1000;
function summarize(xs){
 const z=[...xs].sort((a,b)=>a-b),n=z.length;
 return {attempted:n,p50ms:z[Math.ceil(n*.50)-1]??null,p95ms:z[Math.ceil(n*.95)-1]??null,p99ms:z[Math.ceil(n*.99)-1]??null};
}
const attempts=stats.reads.length+stats.writes.length,successful=stats.counts.reads+stats.counts.writes;
const result={environment:'Production HTTPS, Cloudflare Worker + Durable Object rooms',startedAt,endedAt:new Date().toISOString(),targets:{writes:targetWrites,reads:targetReads},
 real:{...stats.counts,attempts,successful,errors:attempts-successful, errorRate:attempts?((attempts-successful)/attempts):1,
 durationSeconds:+elapsed.toFixed(2),httpRps:+(attempts/elapsed).toFixed(2), statusCounts:stats.statuses,
 writes:summarize(stats.writes),reads:summarize(stats.reads)},
 stoppedEarly:canceled, errors:stats.errors,
 caution:'POST creates temporary synthetic CookingRoom Durable Objects with 24h expiration. No user records, no production PostgreSQL writes. The separate Neon load test must measure relational writes and Hyperdrive.'};
await mkdir('results/load',{recursive:true});
await writeFile('results/load/production-http-read-probe.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,
 '## Teste HTTP — produção Cloudflare\n'+
 '- POST salas: '+stats.counts.writes+'/'+targetWrites+'; GET salas: '+stats.counts.reads+'/'+targetReads+'\n'+
 '- Tempo: '+result.real.durationSeconds+' s; RPS: '+result.real.httpRps+'; erro: '+(result.real.errorRate*100).toFixed(2)+'%\n'+
 '- p95 POST: '+result.real.writes.p95ms+' ms; p95 GET: '+result.real.reads.p95ms+' ms\n'+
 '- **Limite:** escrita no Durable Object; não é escrita PostgreSQL.\n');
if(canceled||stats.counts.writes!==targetWrites||stats.counts.reads!==targetReads||result.real.errorRate>=.01)process.exitCode=1;
