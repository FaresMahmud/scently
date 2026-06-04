import * as fs from "fs"

async function main() {
  // ITB
  const res1 = await fetch("https://www.intheboxperfumes.com.br/perfumes", {
    headers: { "User-Agent": "Mozilla/5.0 Chrome/124" }
  })
  console.log("ITB status:", res1.status)
  const html1 = await res1.text()
  console.log("ITB size:", html1.length)
  fs.writeFileSync("scripts/output/itb-debug.html", html1)
  const hrefs1 = Array.from(html1.matchAll(/href="([^"]+)"/g)).map((m: RegExpMatchArray) => m[1]).slice(0, 30)
  console.log("ITB hrefs:", hrefs1)

  // MV
  const res2 = await fetch("https://maisonviegas.com.br/perfumes-masculinos/", {
    headers: { "User-Agent": "Mozilla/5.0 Chrome/124" }
  })
  console.log("\nMV status:", res2.status)
  const html2 = await res2.text()
  console.log("MV size:", html2.length)
  fs.writeFileSync("scripts/output/mv-debug.html", html2)
  const hrefs2 = Array.from(html2.matchAll(/href="([^"]+)"/g)).map((m: RegExpMatchArray) => m[1]).slice(0, 30)
  console.log("MV hrefs:", hrefs2)
}
main().catch(console.error)
