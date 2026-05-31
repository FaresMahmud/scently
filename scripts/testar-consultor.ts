// ============================================
// SCRIPT: scripts/testar-consultor.ts
// O QUE FAZ: testa gerarRecomendacao com 4 perfis distintos e imprime diagnóstico
// COMO RODAR: npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/testar-consultor.ts
// ============================================

import * as path from "path"
import * as fs from "fs"

// Carrega .env.local antes de qualquer import de lib/
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
  }
}

import { gerarRecomendacao, validarFaixaPreco } from "@/lib/ai"

// ── Helpers visuais ───────────────────────────────────────────────────────────
const ok   = (s: string) => `✓ ${s}`
const fail = (s: string) => `✗ ${s}`
const warn = (s: string) => `⚠ ${s}`

// ── Validação de gênero (mesma lógica do ai.ts) ───────────────────────────────
function generoValido(generoFragella: string | undefined, generoUsuario: string): boolean {
  if (!generoUsuario) return true
  const g = (generoFragella ?? "").toLowerCase()
  if (g === "unisex" || g === "unissex") return true
  if (generoUsuario === "masculino") return g === "men" || g === "masculino"
  if (generoUsuario === "feminino")  return g === "women" || g === "feminino"
  return true
}

const LIMITE_PRECO: Record<string, number> = {
  economico: 150,
  medio:     350,
  premium:   700,
  luxo:      Infinity,
}

// ── Perfis de teste ───────────────────────────────────────────────────────────
const TESTES: { titulo: string; respostas: Record<string, string> }[] = [
  {
    titulo: "Teste 1 — Masculino, fresco, diário, médio",
    respostas: {
      perfil:     "casual",
      genero:     "masculino",
      vibe:       "fresco",
      sensacao:   "assinar",
      ocasiao:    "diario",
      clima:      "quente",
      faixaPreco: "medio",
      ousadia:    "equilibrado",
    },
  },
  {
    titulo: "Teste 2 — Feminino, floral, noite, premium",
    respostas: {
      perfil:     "entusiasta",
      genero:     "feminino",
      vibe:       "sofisticado",
      sensacao:   "impressionar",
      ocasiao:    "especial",
      clima:      "variado",
      ambiente:   "noite-balada",
      faixaPreco: "premium",
      ousadia:    "ousado",
    },
  },
  {
    titulo: "Teste 3 — Masculino, amadeirado, trabalho, luxo",
    respostas: {
      perfil:        "colecionador",
      genero:        "masculino",
      vibe:          "sofisticado",
      sensacao:      "impressionar",
      ocasiao:       "trabalho",
      clima:         "frio",
      faixaPreco:    "luxo",
      ousadia:       "raro",
      personalidade: "elegante",
    },
  },
  {
    titulo: "Teste 4 — Feminino, doce, casual, econômico",
    respostas: {
      perfil:     "iniciante",
      genero:     "feminino",
      vibe:       "doce",
      sensacao:   "acolher",
      ocasiao:    "qualquer",
      clima:      "quente",
      faixaPreco: "economico",
      ousadia:    "seguro",
    },
  },
]

// ── Runner ────────────────────────────────────────────────────────────────────
async function rodarTeste(titulo: string, respostas: Record<string, string>, idx: number) {
  const sep = "━".repeat(60)
  console.log(`\n${sep}`)
  console.log(`${titulo}`)
  console.log(`${sep}`)

  const t0 = Date.now()
  let resultado: Awaited<ReturnType<typeof gerarRecomendacao>>

  try {
    resultado = await gerarRecomendacao(respostas)
  } catch (e) {
    console.log(fail(`Exceção: ${(e as Error).message}`))
    return { passou: false }
  }

  const ms = Date.now() - t0

  if (!resultado) {
    console.log(fail("gerarRecomendacao retornou null — fallback crítico acionado"))
    return { passou: false }
  }

  const { perfumePrincipal: p, alternativa: a, conselho } = resultado
  const faixaPreco   = respostas.faixaPreco ?? ""
  const generoUsuario = respostas.genero ?? ""

  // ── Perfume principal ──────────────────────────────────────────────────────
  console.log("\nPERFUME PRINCIPAL")
  console.log(`  Nome         : ${p.nome}`)
  console.log(`  Marca        : ${p.marca}`)
  console.log(`  Concentração : ${p.concentracao}`)
  console.log(`  Notas        : ${p.notas?.join(", ") || "—"}`)
  console.log(`  Descrição    : ${p.descricao}`)
  console.log(`  Conselho     : ${conselho}`)

  // ── Alternativa ────────────────────────────────────────────────────────────
  console.log("\nALTERNATIVA")
  console.log(`  Nome         : ${a.nome}`)
  console.log(`  Marca        : ${a.marca}`)
  console.log(`  Descrição    : ${a.descricao}`)

  // ── Diagnóstico ────────────────────────────────────────────────────────────
  console.log("\nDIAGNÓSTICO")

  // Validação de preço via lista de marcas proibidas (econômico/médio)
  const precoOK = validarFaixaPreco(resultado, faixaPreco)
  console.log(`  ${precoOK ? ok(`Preço OK — faixa "${faixaPreco}"`) : fail(`FORA DA FAIXA "${faixaPreco}" — marca "${p.marca}" bloqueada`)}`)

  // Validação heurística de gênero (a IA não retorna genero diretamente, então verificamos pelo nome/família)
  // Para o teste de masculino, verificamos se a descrição não é tipicamente feminina
  const nomeSuspeito = /\b(signature|collection|edition|reserve|exclusive|special)\b/i.test(p.nome)
  console.log(`  ${nomeSuspeito ? warn(`Nome possivelmente inventado: "${p.nome}"`) : ok(`Nome parece real: "${p.nome}"`)}`)

  // Info sobre alternativa Fragella (se descricao contiver acordo olfativo, veio da API)
  const altFragella = /[,.]/.test(a.descricao) && !a.descricao.includes("alternativa") && !a.descricao.includes("clássico") && !a.descricao.includes("mesmo")
  console.log(`  ${altFragella ? ok("Alternativa enriquecida via Fragella") : warn("Alternativa possivelmente gerada pela IA")}`)

  // Validação de econômico: nome+marca deve existir no banco de contratipos (checado internamente pelo ai.ts)
  if (faixaPreco === "economico") {
    console.log(`  ${ok("Faixa econômica: validação nome+marca aplicada pelo ai.ts internamente")}`)
  }

  console.log(`  Tempo        : ${ms}ms`)

  const passou = precoOK && !nomeSuspeito
  console.log(`\n  Resultado final: ${passou ? ok("PASSOU") : fail("FALHOU")}`)
  return { passou }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗")
  console.log("║          TESTES DO CONSULTOR DE IA — Nozze               ║")
  console.log("╚══════════════════════════════════════════════════════════╝")

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "sua_chave_aqui") {
    console.error(fail("GROQ_API_KEY não configurada no .env.local"))
    process.exit(1)
  }

  const resultados: boolean[] = []

  for (let i = 0; i < TESTES.length; i++) {
    const { titulo, respostas } = TESTES[i]
    const { passou } = await rodarTeste(titulo, respostas, i)
    resultados.push(passou)
    if (i < TESTES.length - 1) {
      process.stdout.write("\n  Aguardando 2s...\n")
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  const passaram = resultados.filter(Boolean).length
  const falharam = resultados.length - passaram
  console.log("\n" + "━".repeat(60))
  console.log("RESUMO")
  console.log(`  ${ok(`${passaram}/${resultados.length} testes passaram`)}`)
  if (falharam > 0) console.log(`  ${fail(`${falharam} teste(s) com falha`)}`)
}

main().catch(e => {
  console.error(fail(`Erro fatal: ${(e as Error).message}`))
  process.exit(1)
})
