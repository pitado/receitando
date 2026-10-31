// Read-only bounded test against production REST catalogue, which queries Neon PostgreSQL via Hyperdrive.
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
const url='https://api.receitando.miguelpita.com.br/api/v2/recipes?limit=5';
const target=2000, concurrency=12;
const times=[],failures=[],statuses={};let completed=0,started=0,errors=0,abort=false;
const begin=performance.now(),startUtc=new Date().toISOString();
async function user(){
 for(;;){
  if(abort)return;
  const i=started++;
  if(i>=target)return;
  const t=performance.now();let status=0,error=null,shape=false;
  try{
   const r=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
   status=r.status;const data=await r.json().catch(()=>null);
   shape=Array.isArray(data?.items);
  }catch(e){error=String(e)}
  times.push(Math.round((performance.now()-t)*100)/100);
  statuses[status]=(statuses[status]||0)+1;
  if(status===200 && shape)completed++;
  else {errors++;if(failures.length<12)failures.push({index:i,status,error,shape})}
  if(times.length>=100 && errors/times.length>0.1)abort=true;
  await new Promise(r=>setTimeout(r,45));
 }
}
await Promise.all(Array.from({length:concurrency},()=>user()));
const elapsed=(performance.now()-begin)/1000,sorted=times.toSorted((a,b)=>a-b);
const p=v=>sorted[Math.ceil(sorted.length*v)-1]??null;
const result={
 service:'Cloudflare Worker REST → Hyperdrive → Neon PostgreSQL production',
 endpoint:'/api/v2/recipes?limit=5',startUtc,endUtc:new Date().toISOString(),target,
 concurrentUsers:concurrency,attempted:times.length,success:completed,errors,errorRate:errors/Math.max(times.length,1),
 durationSeconds:+elapsed.toFixed(2),requestsPerSecond:+(times.length/elapsed).toFixed(2),
 p50ms:p(.5),p95ms:p(.95),p99ms:p(.99),statuses,stoppedEarly:abort,sampleFailures:failures,
 note:'GET only, synthetic sustained load window; does not prove production writes or 24h endurance.'
};
await mkdir('results/load',{recursive:true});
await writeFile('results/load/production-neon-read-evidence.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,
 '## Leituras reais em produção (Neon)\n- '+completed+'/'+target+' GET válidos; taxa erro '+(result.errorRate*100).toFixed(2)+'%; p95 '+result.p95ms+'ms; média '+result.requestsPerSecond+' req/s.\n');
if(abort||completed!==target||result.errorRate>=.01)process.exitCode=1;
