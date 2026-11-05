import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = "https://receitando.miguelpita.com.br";
const viewports = [320, 360, 375, 390, 430, 768, 1280];
const output = "header-layout-captures";
const report = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const width of viewports) {
  const context = await browser.newContext({
    viewport: { width, height: 850 },
    deviceScaleFactor: 1,
    isMobile: width <= 430,
    hasTouch: width <= 430,
  });
  for (const session of ["visitante", "perfil-simulado"]) {
    if (session === "perfil-simulado") {
      // Apenas mock de rede dentro do teste, sem criar usuários ou tocar no banco real.
      await context.route("**/api/auth/me", async route => {
        await route.fulfill({
          contentType: "application/json",
          status: 200,
          body: JSON.stringify({id:"test-only", name:"Pessoa Teste", email:"teste@example.invalid",role:"USER",handle:"receitando_teste",avatarKey:"avocado"})
        });
      });
    }
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(String(error).slice(0, 250)));
    let status = 0;
    let issue = null;
    let positions = {};
    try {
      const response = await page.goto(base+"/entrar", { waitUntil: "domcontentloaded", timeout: 25000 });
      status = response?.status() ?? 0;
      await page.waitForTimeout(1500);
      const search = page.getByRole("button", {name:"Buscar",exact:true});
      const logo = page.getByRole("link", {name:"Receitando — início"});
      const send = page.getByRole("link", {name: /Enviar/}).first();
      const account = session === "perfil-simulado"
        ? page.getByRole("button", {name:"Conta @receitando_teste"})
        : page.getByRole("link", {name:"Entrar na minha conta"});
      await account.waitFor({state:"visible",timeout:9000});
      const [a,b,c,d] = await Promise.all([search.boundingBox(),logo.boundingBox(),account.boundingBox(),send.boundingBox()]);
      if (!a || !b || !c || !d) throw new Error("Elemento de cabeçalho não foi renderizado");
      positions = {search:a,logo:b,profile:c,send:d};
      const order = [a,b,c,d].every((box,index,array)=>index===0||array[index-1].x+array[index-1].width<=box.x+1);
      const bounds = [a,b,c,d].every(box=>box.x>=-1&&box.x+box.width<=width+1);
      if (!order||!bounds) issue = "Colisão ou componente fora da tela";
      await page.screenshot({path:`${output}/header-${width}-${session}.png`,fullPage:false,animations:"disabled"});
    } catch (error) {
      issue = String(error).slice(0,350);
    }
    report.push({width,session,status,issue,positions,errors});
    console.log(JSON.stringify(report[report.length-1]));
    await page.close();
  }
  await context.close();
}
await browser.close();
await writeFile(output+"/report.json",JSON.stringify(report,null,2));
const failed = report.filter(x=>x.status!==200||x.issue);
if (failed.length) {
  console.error("Falhas de layout:", JSON.stringify(failed));
  process.exitCode = 1;
} else {
  console.log("Cabeçalho sem colisões em "+report.length+" cenários.");
}
