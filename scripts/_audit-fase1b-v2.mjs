import { config } from "dotenv"
config({ path: ".env.local" })
import fs from "fs"
import path from "path"

const ROOT = process.cwd()

function normalizar(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function canonConcentracao(texto) {
  const t = (texto ?? "").toLowerCase()
  if (!t) return null
  if (/extrait/.test(t)) return "extrait"
  if (/elixir/.test(t)) return "elixir"
  if (/eau de parfum|^edp$/.test(t)) return "edp"
  if (/eau de toilette|^edt$/.test(t)) return "edt"
  if (/eau de cologne|^edc$|cologne/.test(t)) return "edc"
  if (/desodorante col[oô]nia|col[oô]nia/.test(t)) return "colonia"
  if (/profumo/.test(t)) return "profumo"
  if (/^parfum$|^le parfum$/.test(t)) return "parfum"
  return null
}

function concentracaoDoCatalogo(entry, source) {
  if (source === "fragella") return canonConcentracao(entry.concentracao)
  return canonConcentracao(entry.tipo)
}

function carregarJSON(nomeArquivo) {
  const p = path.join(ROOT, "data", nomeArquivo)
  const raw = JSON.parse(fs.readFileSync(p, "utf8"))
  return Array.isArray(raw) ? raw : (raw.perfumes ?? [])
}

const fragella    = carregarJSON("catalogo-fragella.json")
const contratipos = carregarJSON("contratipos.json")
const expandido   = carregarJSON("perfumes-expandido.json")

const TODAS_ENTRADAS = [
  ...fragella.map(e => ({ source: "fragella", entry: e })),
  ...contratipos.map(e => ({ source: "contratipos", entry: e })),
  ...expandido.map(e => ({ source: "expandido", entry: e })),
]

function buscarPorNucleoMarca(nucleo, marca) {
  const palavrasNucleo = normalizar(nucleo).split(" ").filter(w => w.length > 2)
  const palavraMarca = normalizar(marca).split(" ").filter(w => w.length > 2)[0] ?? normalizar(marca)
  if (palavrasNucleo.length === 0) return []
  return TODAS_ENTRADAS.filter(({ entry }) => {
    const textoNome = normalizar(entry.nome ?? "")
    const textoMarca = normalizar(entry.marca ?? "")
    const textoTotal = `${textoNome} ${textoMarca}`
    const nucleoBate = palavrasNucleo.every(p => textoTotal.includes(p))
    const marcaBate = palavraMarca.length > 0 && textoMarca.includes(palavraMarca)
    return nucleoBate && marcaBate
  })
}

// ── DADOS EXATOS DO RELATÓRIO ORIGINAL (AUDIT-CATALOG-ESSENCIAIS.md) ────────
// Hardcoded — NÃO reconsulta o Gemini, que é não-determinístico (grounding search
// muda a cada chamada). Reconsultar geraria uma lista diferente da que o usuário
// está revisando.

const VERSAO_DIFERENTE_ORIGINAL = [
  { nome: "Carolina Herrera 212 Vip Black Eau de Parfum", marca: "Carolina Herrera", idCatalogo: "212-vip-black-carolina-herrera", nucleo: "212 Vip Black" },
  { nome: "Giorgio Armani Acqua di Giò Profumo", marca: "Giorgio Armani", idCatalogo: "acqua-di-gio-profumo-giorgio-armani", nucleo: "Acqua di Giò Profumo" },
  { nome: "Hugo Boss Bottled Eau de Toilette", marca: "Hugo Boss", idCatalogo: "boss-bottled-hugo-boss", nucleo: "Boss Bottled" },
  { nome: "O Boticário Zaad Eau de Parfum", marca: "O Boticário", idCatalogo: "o-boticario-zaad", nucleo: "Zaad" },
  { nome: "Lancôme La Vie Est Belle Eau de Parfum", marca: "Lancôme", idCatalogo: "la-vie-est-belle-lancome", nucleo: "La Vie Est Belle" },
  { nome: "Dior J'adore Eau de Parfum", marca: "Dior", idCatalogo: "jadore-christian-dior", nucleo: "J'adore" },
  { nome: "Carolina Herrera Good Girl Eau de Parfum", marca: "Carolina Herrera", idCatalogo: "ch-good-girl-carolina-herrera", nucleo: "Good Girl" },
  { nome: "Dolce & Gabbana Light Blue Eau de Toilette", marca: "Dolce & Gabbana", idCatalogo: "d-g-light-blue-dolce-gabbana", nucleo: "Light Blue" },
  { nome: "Kenzo Flower by Kenzo Eau de Parfum", marca: "Kenzo", idCatalogo: "flowerbykenzo-kenzo", nucleo: "Flower by Kenzo" },
  { nome: "Giorgio Armani Sì Passione Eau de Parfum", marca: "Giorgio Armani", idCatalogo: "armani-si-passione-giorgio-armani", nucleo: "Sì Passione" },
  { nome: "Chloé Chloé Eau de Parfum", marca: "Chloé", idCatalogo: "chloe-chloe", nucleo: "Chloé" },
  { nome: "Ralph Lauren Woman by Ralph Lauren Eau de Parfum", marca: "Ralph Lauren", idCatalogo: "ralph-lauren-woman-ralph-lauren", nucleo: "Woman by Ralph Lauren" },
  { nome: "Mugler Angel Eau de Parfum", marca: "Mugler", idCatalogo: "angel-thierry-mugler", nucleo: "Angel" },
  { nome: "O Boticário Lily Eau de Parfum", marca: "O Boticário", idCatalogo: "o-boticario-lily", nucleo: "Lily" },
  { nome: "Calvin Klein CK One Eau de Toilette", marca: "Calvin Klein", idCatalogo: "ck-one-calvin-klein", nucleo: "CK One" },
  { nome: "Calvin Klein CK Be Eau de Toilette", marca: "Calvin Klein", idCatalogo: "obsessed-calvin-klein", nucleo: "CK Be" },
  { nome: "Bvlgari Black Eau de Toilette", marca: "Bvlgari", idCatalogo: "bvlgari-man-in-black", nucleo: "Black" },
  { nome: "Byredo Mojave Ghost Eau de Parfum", marca: "Byredo", idCatalogo: "mojave-ghost-byredo-byredo", nucleo: "Mojave Ghost" },
]

const NAO_EXISTE_ORIGINAL = [
  { nome: "Calvin Klein CK In2U Him Eau de Toilette", marca: "Calvin Klein", ano: 2007, genero: "masculino", familia: "Amadeirado Aromático" },
  { nome: "O Boticário Malbec Gold Eau de Parfum", marca: "O Boticário", ano: 2018, genero: "masculino", familia: "Amadeirado Âmbarado" },
  { nome: "O Boticário Arbo Puro Desodorante Colônia", marca: "O Boticário", ano: 2021, genero: "masculino", familia: "Fougère Verde" },
  { nome: "Natura Essencial Oud Masculino Eau de Parfum", marca: "Natura", ano: 2017, genero: "masculino", familia: "Amadeirado Especiado" },
  { nome: "Natura Kaiak Aero Masculino Desodorante Colônia", marca: "Natura", ano: 2018, genero: "masculino", familia: "Aromático Aquático" },
  { nome: "Eudora Club 6 Intenso Desodorante Colônia", marca: "Eudora", ano: 2017, genero: "masculino", familia: "Fougère Amadeirado" },
  { nome: "Gabriela Sabatini Eau de Toilette", marca: "Gabriela Sabatini", ano: 1989, genero: "feminino", familia: "Floral Amadeirado Almiscarado" },
  { nome: "O Boticário Floratta Red Desodorante Colônia", marca: "O Boticário", ano: 2019, genero: "feminino", familia: "Floral Frutado" },
  { nome: "Eudora Kiss Me Lovely Desodorante Colônia", marca: "Eudora", ano: 2017, genero: "feminino", familia: "Floral Frutado" },
  { nome: "Jo Malone English Pear & Freesia Cologne", marca: "Jo Malone London", ano: 2010, genero: "unissex", familia: "Chipre Frutado" },
  { nome: "Tiziana Terenzi Kirke Extrait de Parfum", marca: "Tiziana Terenzi", ano: 2015, genero: "unissex", familia: "Chipre Frutado" },
  { nome: "O.U.i Madeleine 862 La Pistacherie Eau de Parfum", marca: "O.U.i Original Unique Individual", ano: 2023, genero: "feminino", familia: "Âmbar Baunilha" },
  { nome: "Amyi 5.21 Eau de Parfum", marca: "Amyi", ano: 2019, genero: "unissex", familia: "Amadeirado Floral Almiscarado" },
  { nome: "Granado Fervo Intenso Eau de Parfum", marca: "Granado", ano: 2023, genero: "unissex", familia: "Âmbar Especiado" },
]

const INCOMPLETO_ORIGINAL = [
  { nome: "Paco Rabanne Invictus Eau de Toilette", marca: "Paco Rabanne", idCatalogo: "invictus-paco-rabanne" },
  { nome: "Paco Rabanne 1 Million Eau de Toilette", marca: "Paco Rabanne", idCatalogo: "paco-rabanne-1-million-paco-rabanne" },
  { nome: "Paco Rabanne Invictus Victory Elixir", marca: "Paco Rabanne", idCatalogo: "invictus-victory-elixir-paco-rabanne" },
  { nome: "Paco Rabanne Lady Million Eau de Parfum", marca: "Paco Rabanne", idCatalogo: "paco-rabanne-lady-million-paco-rabanne" },
]

// ── PASSO 1: revisão dos 18 'versão diferente' — concentração + sanity check de núcleo ──
console.log("Passo 1/2: revisando os 18 'versão diferente' originais...")

const analiseVersao = VERSAO_DIFERENTE_ORIGINAL.map(v => {
  const candidatos = buscarPorNucleoMarca(v.nucleo, v.marca)
  const matchAtual = candidatos.find(c => c.entry.id === v.idCatalogo)
  const nucleoCatalogo = normalizar(matchAtual?.entry?.nome ?? "")
  const nucleoPedido = normalizar(v.nucleo)

  // sanity check: o núcleo do catálogo é REALMENTE o mesmo nome-base, ou só compartilha uma palavra?
  // (ex: "CK Be" vs "Obsessed" não compartilham núcleo nenhum — é erro de matching, não truncamento)
  const nucleoBateDeVerdade = nucleoCatalogo.includes(nucleoPedido) || nucleoPedido.includes(nucleoCatalogo)

  const concSolicitada = canonConcentracao(v.nome)
  const concCatalogo = matchAtual ? concentracaoDoCatalogo(matchAtual.entry, matchAtual.source) : null
  const candidatoComConcCerta = candidatos.find(c => {
    const conc = concentracaoDoCatalogo(c.entry, c.source)
    return concSolicitada && conc === concSolicitada
  })

  let decisao
  if (!nucleoBateDeVerdade) {
    decisao = "ERRO DE MATCHING — nomes não relacionados, não é a mesma fragrância"
  } else if (!concSolicitada || concCatalogo === concSolicitada) {
    decisao = "MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada)"
  } else if (candidatoComConcCerta) {
    decisao = `MESMA FRAGRÂNCIA (existe ${candidatoComConcCerta.entry.id} com a concentração certa)`
  } else {
    decisao = "DISTINTO — concentração pedida não existe no catálogo"
  }

  return {
    nome: v.nome, marca: v.marca, nomeCatalogo: matchAtual?.entry?.nome ?? "?", idCatalogo: v.idCatalogo,
    concSolicitada, concCatalogo, decisao,
    reclassificar: decisao.startsWith("DISTINTO") || decisao.startsWith("ERRO"),
  }
})

const reclassificados = analiseVersao.filter(a => a.reclassificar)
console.log(`  ${reclassificados.length}/18 reclassificados (DISTINTO ou ERRO DE MATCHING).\n`)

// ── PASSO 2: categorização (sem chamar Gemini de novo — usa listas hardcoded) ──
console.log("Passo 2/2: categorizando os 14 originais + 18 reclassificados...")

const MARCAS_BR_GRANDES = ["o boticário", "boticario", "natura", "eudora", "avon", "jequiti", "granado"]
const MARCAS_NICHO_HYPE = ["tiziana terenzi", "amyi", "xerjoff", "parfums de marly", "initio", "mancera", "nishane", "kilian", "maison francis kurkdjian", "byredo", "o.u.i"]

function categorizar(marca, ano) {
  const m = marca.toLowerCase()
  if (MARCAS_BR_GRANDES.some(b => m.includes(b))) return "ESSENCIAL"
  if (MARCAS_NICHO_HYPE.some(b => m.includes(b))) return "HYPE ATUAL"
  if (ano && ano <= 2015) return "CLÁSSICO RELEVANTE"
  return "DUVIDOSO"
}

const categorizados = [
  ...NAO_EXISTE_ORIGINAL.map(r => ({ nome: r.nome, marca: r.marca, ano: r.ano, categoria: categorizar(r.marca, r.ano), origem: "Fase 1 (não existe)" })),
  ...reclassificados.map(r => ({ nome: r.nome, marca: r.marca, ano: null, categoria: categorizar(r.marca, null), origem: r.decisao.startsWith("ERRO") ? "Reclassificado (erro de matching)" : "Reclassificado (SKU distinto)" })),
]

const duvidosos = categorizados.filter(c => c.categoria === "DUVIDOSO")

// ── Relatório ────────────────────────────────────────────────────────────────
const linhas = []
linhas.push("# Auditoria Fase 1b (v2) — Revisão de versões + categorização")
linhas.push("")
linhas.push(`Gerado em: ${new Date().toISOString()}`)
linhas.push("")
linhas.push("**Nota:** esta revisão usa os dados EXATOS do relatório original (AUDIT-CATALOG-ESSENCIAIS.md), sem reconsultar o Gemini — a busca com grounding é não-determinística e geraria uma lista diferente.")
linhas.push("")

linhas.push("## 1. Revisão dos 18 'versão diferente' originais")
linhas.push("")
linhas.push("| Nome pedido | Encontrado | Conc. pedida | Conc. catálogo | Decisão |")
linhas.push("|---|---|---|---|---|")
analiseVersao.forEach(a => {
  linhas.push(`| ${a.nome} | ${a.nomeCatalogo} (\`${a.idCatalogo}\`) | ${a.concSolicitada ?? "—"} | ${a.concCatalogo ?? "—"} | ${a.decisao} |`)
})
linhas.push("")
linhas.push(`**${reclassificados.length} reclassificados:**`)
linhas.push("")
if (reclassificados.length === 0) {
  linhas.push("Nenhum.")
} else {
  reclassificados.forEach(a => linhas.push(`- **${a.nome}** — ${a.decisao}`))
}
linhas.push("")

linhas.push("## 2. Faltantes categorizados")
linhas.push("")
linhas.push("| Nome | Marca | Categoria | Origem |")
linhas.push("|---|---|---|---|")
categorizados.forEach(c => linhas.push(`| ${c.nome} | ${c.marca} | ${c.categoria} | ${c.origem} |`))
linhas.push("")
linhas.push(`**${duvidosos.length} marcados como DUVIDOSO:**`)
linhas.push("")
duvidosos.forEach(c => linhas.push(`- ${c.nome} (${c.marca})`))
linhas.push("")

linhas.push("## 3. Incompletos (só falta `ano`)")
linhas.push("")
INCOMPLETO_ORIGINAL.forEach(i => linhas.push(`- ${i.nome} (${i.marca}) — \`${i.idCatalogo}\``))
linhas.push("")

fs.writeFileSync(path.join(ROOT, "scripts", "AUDIT-FASE1B.md"), linhas.join("\n"), "utf8")
console.log("Relatório salvo em scripts/AUDIT-FASE1B.md")
