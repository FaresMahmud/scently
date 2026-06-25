import pg from 'C:/Users/fares/scently/node_modules/pg/lib/index.js'
const { Client } = pg
const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const dels = [
  ["#2  Tommy New York",     "nome ILIKE '%Tommy New York%'"],
  ["#6  IM LEAU artifact",   "nome ILIKE '%IM LEAU DISSEY%'"],
  ["#15 Phantom In Red",     "nome ILIKE '%Phantom In Red%'"],
  ["#16 The One Parfum dup", "nome ILIKE '%The One%' AND nome ILIKE '%Parfum%' AND marca ILIKE '%dolce%'"],
  ["#21 Kylie Sweet Eclair", "nome ILIKE '%Sweet%clair%'"],
  ["#22 Kylie Caramel Cloud","nome ILIKE '%Caramel Cloud%'"],
]
for (const [lbl, wh] of dels) {
  const r = await client.query('DELETE FROM tendencias WHERE ' + wh + ' RETURNING nome')
  console.log('DELETE', lbl + ':', r.rowCount, 'row(s)', r.rows.map(x=>x.nome).join(' | '))
}

const upd = [
  ["#1  Light Blue masc", "d-g-light-blue-eau-intense-dolce-gabbana",             "nome ILIKE '%Light Blue%' AND nome ILIKE '%Masculino%'"],
  ["#7  LEau dIssey EDP", "l-eau-d-issey-pour-homme-intense-issey-miyake",         "nome ILIKE '%Issey%Pour Homme%Masculino%'"],
  ["#8  Le Male EDT",     "jean-paul-gaultier-le-male-edt-1-jean-paul-gaultier",   "nome ILIKE '%Le Male%' AND nome ILIKE '%EAU DE TOILETTE%'"],
  ["#17 The One EDP",     "the-one-intense-dolce-gabbana",                         "nome ILIKE '%The One%' AND nome ILIKE '%Eau de Parfum%' AND marca ILIKE '%dolce%'"],
]
for (const [lbl, pid, wh] of upd) {
  const r = await client.query('UPDATE tendencias SET perfume_id = $1 WHERE ' + wh + ' RETURNING nome, perfume_id', [pid])
  console.log('REPOINT', lbl + ':', r.rowCount, 'row(s) ->', pid)
}

const dis = [
  ["#18 Banderas King", "nome ILIKE '%King of Seduction%'"],
  ["#19 Banderas Icon", "nome ILIKE '%The Icon Attitude%'"],
]
for (const [lbl, wh] of dis) {
  const r = await client.query('UPDATE tendencias SET ativo = false WHERE ' + wh + ' RETURNING nome')
  console.log('DISABLE', lbl + ':', r.rowCount, 'row(s)')
}

await client.end()
console.log('ALL DONE')
