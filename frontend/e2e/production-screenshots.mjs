import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const base = "https://receitando.miguelpita.com.br";
console.log("Auditoria pos-deploy: nova vitrine e matching PostgreSQL corrigido");
const output = path.resolve("audit-captures");
const routes = [
  ["inicio", "/"],
  ["catalogo", "/receitas"],
  ["receita-detalhe", "/receitas/santa-receita-pao-caseiro-economico"],
  ["combinar", "/combinar"],
  ["despensa", "/despensa"],
  ["favoritos", "/favoritos"],
  ["inspiracoes", "/inspiracoes"],
  ["entrar", "/entrar"],
  ["cadastro", "/cadastro"],
  ["recuperar-senha", "/recuperar-senha"],
  ["conta", "/conta"],
  ["enviar-receita", "/enviar-receita"],
];
const sizes = [
  { name: "mobile", width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
];
const report = [];
const browser = await chromium.launch({ headless: true });
await fs.mkdir(output, { recursive: true });
for (const size of sizes) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1, isMobile: size.isMobile ?? false, hasTouch: size.hasTouch ?? false });
  await fs.mkdir(path.join(output, size.name), { recursive: true });
  for (const [name, route] of routes) {
    const page = await context.newPage();
    const jsErrors = [];
    page.on("pageerror", (error) => jsErrors.push(String(error).slice(0, 180)));
    const target = base + route;
    let status = 0;
    let error = null;
    let title = "";
    try {
      const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
      status = response?.status() ?? 0;
      await page.waitForTimeout(1100);
      title = await page.title();
      await page.screenshot({ path: path.join(output,size.name,name+".png"), fullPage: true, animations: "disabled", timeout: 20000 });
    } catch (e) { error = String(e).slice(0, 350); }
    const result = { name, route, viewport: size.name, status, finalUrl: page.url(), title, error, jsErrors };
    report.push(result);
    console.log(JSON.stringify(result));
    await page.close();
  }
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
const table = ["# Capturas do Receitando", "", "Capturas das rotas públicas reais em mobile (390 px) e desktop (1440 px).", "",
  "| Tela | Viewport | HTTP | URL final | Erro de captura |", "|---|---|---:|---|---|",
  ...report.map(x => `| ${x.name} | ${x.viewport} | ${x.status} | ${x.finalUrl.replaceAll("|","/")} | ${(x.error??"—").replaceAll("|","/")} |`),
  "", "## Critério de rebranding",
  "Comparar tipografia, cabeçalho, paleta, cards e espaçamento com a home nova. As capturas são evidências para revisão, não aprovação automática de identidade visual."
];
await fs.writeFile(path.join(output, "README.md"), table.join("\n"));

const probe = async (route, method, body) => {
  try {
    const res = await fetch("https://api.receitando.miguelpita.com.br" + route, {
      method, headers: { "Content-Type": "application/json", Origin: base },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
    });
    let text = await res.text();
    return {route, method, status: res.status, body: text.slice(0, 500)};
  } catch(e) {return {route, method, error:String(e)};}
};
const probes = [
  await probe("/api/home-feed","GET"),
  await probe("/api/recipes/match","POST",{ingredients:["leite","ovo","queijo","polvilho doce","óleo","sal"]}),
];
await fs.writeFile(path.join(output, "api-diagnostics.json"), JSON.stringify(probes, null, 2));
console.log("API_DIAGNOSTICS "+JSON.stringify(probes));
