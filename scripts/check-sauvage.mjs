import { readFileSync } from "fs"
import pg from "pg"
const { Client } = pg

// Load env manually
const env = readFileSync(".env.local", "utf8")
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
}

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const r = await client.query("SELECT perfume_id FROM perfume_editorial WHERE perfume_id LIKE '%sauvage%'")
console.log("=== perfume_editorial rows with 'sauvage' ===")
console.log(JSON.stringify(r.rows, null, 2))

// Also check what slugify produces for "Sauvage" / "Dior"
const nome = "Sauvage"
const marca = "Dior"
function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
const expectedId = `${slugify(nome)}-${slugify(marca)}`
console.log("\n=== Expected catalogMatch.id for Sauvage/Dior ===")
console.log(expectedId)

await client.end()
