import * as fs from "fs"

async function main() {
  // ITB produto
  const r1 = await fetch("https://www.intheboxperfumes.com.br/produto/celtic-legacy-100ml-267", {
    headers: { "User-Agent": "Mozilla/5.0 Chrome/124" }
  })
  const h1 = await r1.text()
  fs.writeFileSync("scripts/output/itb-produto.html", h1)
  console.log("ITB produto size:", h1.length)
  // Mostra blocos relevantes
  const nome1 = h1.match(/<h1[^>]*>([\s\S]{0,200}?)<\/h1>/i)
  console.log("ITB h1:", nome1?.[1]?.replace(/<[^>]+>/g,"").trim())
  const preco1 = h1.match(/R\$\s*[^0-9]*([\d]+[,.]\d{2})/)
  console.log("ITB preco:", preco1?.[1])
  // Notas
  const notasIdx = h1.toLowerCase().indexOf("nota")
  if (notasIdx > -1) console.log("ITB notas context:\n", h1.slice(notasIdx, notasIdx+500).replace(/<[^>]+>/g," ").replace(/\s+/g," "))

  // MV produto
  const r2 = await fetch("https://maisonviegas.com.br/produtos/ultramare-inspirado-em-megamare/", {
    headers: { "User-Agent": "Mozilla/5.0 Chrome/124" }
  })
  const h2 = await r2.text()
  fs.writeFileSync("scripts/output/mv-produto.html", h2)
  console.log("\nMV produto size:", h2.length)
  const nome2 = h2.match(/<h1[^>]*>([\s\S]{0,200}?)<\/h1>/i)
  console.log("MV h1:", nome2?.[1]?.replace(/<[^>]+>/g,"").trim())
  const preco2 = h2.match(/R\$\s*[^0-9]*([\d]+[,.]\d{2})/)
  console.log("MV preco:", preco2?.[1])
  // Notas e JSON-LD
  const jlds = Array.from(h2.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi))
  console.log("MV json-ld count:", jlds.length)
  if (jlds.length) console.log("MV json-ld[0]:", jlds[0][1].slice(0,300))
  const notasIdx2 = h2.toLowerCase().indexOf("nota")
  if (notasIdx2 > -1) console.log("MV notas context:\n", h2.slice(notasIdx2, notasIdx2+500).replace(/<[^>]+>/g," ").replace(/\s+/g," "))
}
main().catch(console.error)
