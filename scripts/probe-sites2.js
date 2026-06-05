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
    const hasProduct = /data-product-id|productName|item_name|"@type"\s*:\s*"Product"|product-item|product-card/i.test(html)
    const hasPrice   = /R\$|"price"|preco|reais/i.test(html)
    const nuvemCount = (html.match(/data-product-id=/g) || []).length
    // extract all <a href> containing product-hint words
    const links = [...html.matchAll(/href="(https?:\/\/[^"]*(?:perfum|product|colec|categor|shop|catalog)[^"]*?)"/gi)]
      .map(m => m[1]).slice(0, 5)
    console.log(
      label.padEnd(40) + '| HTTP ' + r.status +
      ' | prod:' + (hasProduct ? 'YES' : 'no') +
      ' | nuvem:' + nuvemCount
    )
    if (links.length) console.log('  links: ' + links.join(' | '))
  } catch (e) {
    console.log(label.padEnd(40) + '| ERROR: ' + e.message.slice(0, 60))
  }
}

;(async () => {
  console.log('\n--- Paris Elysees ---')
  await probe('PE root (js)',            'https://paris-elysees.com',               true)
  await probe('PE /loja',               'https://paris-elysees.com/loja',           true)
  await probe('PE /shop',               'https://paris-elysees.com/shop',           true)
  await probe('PE /produtos',           'https://paris-elysees.com/produtos',       true)
  await probe('PE /catalogo',           'https://paris-elysees.com/catalogo',       true)
  await probe('PE /linha-de-perfumes',  'https://paris-elysees.com/linha-de-perfumes', true)
  await probe('PE /fragrancias',        'https://paris-elysees.com/fragrancias',    true)

  console.log('\n--- La Rive ---')
  await probe('LR root (js)',           'https://www.larive-parfums.com',           true)
  await probe('LR /perfumes',           'https://www.larive-parfums.com/perfumes',  true)
  await probe('LR /fragrancias',        'https://www.larive-parfums.com/fragrancias', true)
  await probe('LR /shop',              'https://www.larive-parfums.com/shop',       true)
  await probe('LR /produto',           'https://www.larive-parfums.com/produto',    true)
  await probe('LR /br',               'https://www.larive-parfums.com/br',          true)
})()
