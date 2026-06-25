import { readFileSync } from "fs"

const data = JSON.parse(readFileSync("data/catalogo-fragella.json", "utf8"))
const expandido = JSON.parse(readFileSync("data/perfumes-expandido.json", "utf8"))

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// Check fragella catalog
const fragArr = Array.isArray(data) ? data : Object.values(data)[0]
const fragSauvage = fragArr.filter(p => p.nome?.toLowerCase().includes("sauvage") && p.marca?.toLowerCase().includes("dior"))
console.log("=== Fragella catalog - Sauvage/Dior ===")
fragSauvage.slice(0, 3).forEach(p => {
  console.log(`  nome: "${p.nome}" | marca: "${p.marca}" → id: ${slugify(p.nome)}-${slugify(p.marca)}`)
})

// Check expandido
const expArr = Array.isArray(expandido) ? expandido : Object.values(expandido)[0]
const expSauvage = expArr.filter(p => p.nome?.toLowerCase().includes("sauvage") && p.marca?.toLowerCase().includes("dior"))
console.log("\n=== perfumes-expandido - Sauvage/Dior ===")
expSauvage.slice(0, 3).forEach(p => {
  console.log(`  nome: "${p.nome}" | marca: "${p.marca}" → id: ${slugify(p.nome)}-${slugify(p.marca)}`)
})
