// Affiliate tags are NEXT_PUBLIC_ so the OndeComprar client component can
// read them directly. Affiliate tags are non-sensitive — they appear in
// rendered HTML and can safely be in the client bundle.

export interface AffiliateLink {
  loja: string
  url: string
  tag: string
  available: boolean
}

const MARCAS_BOTICARIO = ["o boticário", "boticario", "o boticario"]

function isBoticario(brand: string): boolean {
  const b = brand.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  return MARCAS_BOTICARIO.some(m => b.includes(m))
}

export function getAffiliateLinks(perfumeName: string, brand: string): AffiliateLink[] {
  const query = encodeURIComponent(`${perfumeName} ${brand}`)

  const sephoraTag = process.env.NEXT_PUBLIC_SEPHORA_AFF_TAG ?? ""
  const amazonTag  = process.env.NEXT_PUBLIC_AMAZON_AFF_TAG  ?? "nozze-20"
  const epocaTag   = process.env.NEXT_PUBLIC_EPOCA_AFF_TAG   ?? ""

  const links: AffiliateLink[] = []

  // Sephora BR
  links.push({
    loja:      "Sephora",
    url:       sephoraTag
      ? `https://www.sephora.com.br/search?q=${query}&affTag=${encodeURIComponent(sephoraTag)}`
      : `https://www.sephora.com.br/search?q=${query}`,
    tag:       sephoraTag,
    available: true, // always show Sephora even without tag
  })

  // Amazon BR — always show; tag defaults to "nozze-20"
  links.push({
    loja:      "Amazon",
    url:       amazonTag
      ? `https://www.amazon.com.br/s?k=${query}&tag=${encodeURIComponent(amazonTag)}`
      : `https://www.amazon.com.br/s?k=${query}`,
    tag:       amazonTag,
    available: amazonTag !== "",
  })

  // Época Cosméticos
  links.push({
    loja:      "Época Cosméticos",
    url:       epocaTag
      ? `https://www.epocacosmeticos.com.br/busca?q=${query}&affTag=${encodeURIComponent(epocaTag)}`
      : `https://www.epocacosmeticos.com.br/busca?q=${query}`,
    tag:       epocaTag,
    available: true, // always show Época even without tag
  })

  // O Boticário — only for Boticário brand perfumes
  if (isBoticario(brand)) {
    links.push({
      loja:      "O Boticário",
      url:       `https://www.boticario.com.br/busca?q=${query}`,
      tag:       "",
      available: true,
    })
  }

  return links.filter(l => l.available)
}
