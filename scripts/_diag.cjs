const { Client } = require('pg')
const client = new Client({ connectionString: process.env.DATABASE_URL })
async function main() {
  await client.connect()
  const rows = await client.query(`
    SELECT id, nome, marca, tipo, perfume_id, badge, posicao, ativo, "scrapedAt"
    FROM tendencias
    ORDER BY posicao NULLS LAST, nome
  `)
  console.log('=== ALL TENDENCIA ROWS ===')
  console.log('Total:', rows.rowCount)
  console.log()
  for (const r of rows.rows) {
    console.log('---')
    console.log('id:        ', r.id)
    console.log('nome:      ', r.nome)
    console.log('marca:     ', r.marca)
    console.log('perfume_id:', r.perfume_id ?? 'NULL')
    console.log('posicao:   ', r.posicao)
    console.log('ativo:     ', r.ativo)
    console.log('badge:     ', r.badge)
    console.log('scraped:   ', r.scrapedAt)
  }
  await client.end()
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
