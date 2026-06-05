const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const SBEE_KEY = process.env.SCRAPINGBEE_API_KEY

async function probe(label, targetUrl, renderJs) {
  const url = new URL('https://app.scrapingbee.com/api/v1/')
  url.searchParams.set('api_key',   SBEE_KEY)
  url.searchParams.set('url',       targetUrl)
  url.searchParams.set('render_js', renderJs ? 'true' : 'false')
  if (renderJs) url.searchParams.set('wait', '2000')
  try {
    const r    = await fetch(url.toString())
    const html = await r.text()
    const hasProduct = /data-product-id|productName|item_name|"@type"\s*:\s*"Product"/i.test(html)
    const hasPrice   = /R\$|"price"|preco_brl/i.test(html)
    const title      = (html.match(/<title[^>]*>([^<]{1,80})<\/title>/i) || [])[1] || '(no title)'
    const nuvemCount = (html.match(/data-product-id=/g) || []).length
    console.log(
      label.padEnd(35) + '| HTTP ' + r.status +
      ' | product:' + (hasProduct ? 'YES' : 'no ') +
      ' | price:' + (hasPrice ? 'YES' : 'no ') +
      ' | nuvem_ids:' + nuvemCount +
      ' | ' + title.trim().slice(0, 50)
    )
  } catch (e) {
    console.log(label.padEnd(35) + '| ERROR: ' + e.message.slice(0, 60))
  }
}

;(async () => {
  console.log('Probing 4 failed sites...\n')
  await probe('Nuancielo /produtos',     'https://www.nuancielo.com.br/produtos',         true)
  await probe('Nuancielo /colecoes',     'https://www.nuancielo.com.br/colecoes',         true)
  await probe('Nuancielo root',          'https://www.nuancielo.com.br',                  false)
  await probe('Vivere /perfumes',        'https://www.vivereperfumes.com.br/perfumes',    true)
  await probe('Vivere root',             'https://www.vivereperfumes.com.br',             false)
  await probe('Vivere /produtos',        'https://www.vivereperfumes.com.br/produtos',    true)
  await probe('Paris Elysees root',      'https://paris-elysees.com',                     false)
  await probe('Paris Elysees /perfumes', 'https://paris-elysees.com/perfumes',            true)
  await probe('Paris Elysees /colecoes', 'https://paris-elysees.com/colecoes',            true)
  await probe('LaRive root',             'https://www.larive-parfums.com',                false)
  await probe('LaRive /collections/all', 'https://www.larive-parfums.com/collections/all', false)
})()
