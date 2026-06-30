// ============================================
// ARQUIVO: lib/quiz/questions.ts
// O QUE FAZ: perguntas e opções dos quizzes free (6q) e premium (8q)
// QUANDO MANDAR PRA IA: quando quiser adicionar, remover ou alterar perguntas
// DEPENDE DE: nada — apenas tipos e constantes
// ============================================

export interface OpcaoQuiz {
  id: string
  texto: string
}

/** Um par binário A/B dentro de uma pergunta "binaria-dupla" (ex: projeção, ousadia). */
export interface ParBinario {
  /** Vira a chave do campo nas respostas resolvidas (ex: "projecao", "ousadia"). */
  id: string
  opcaoA: OpcaoQuiz
  opcaoB: OpcaoQuiz
}

export interface PerguntaQuiz {
  id: string
  pergunta: string
  /**
   * "escolha"       (padrão) = múltipla escolha, 1 resposta, via `opcoes`.
   * "texto"         = resposta livre (autocomplete de perfume, texto digitado).
   * "multipla"      = seleciona 1 ou mais `opcoes` (checkboxes).
   * "binaria-dupla" = 2 pares A/B na mesma tela (`pares`), conta como 1 pergunta na barra de progresso.
   */
  tipo?: "escolha" | "texto" | "multipla" | "binaria-dupla"
  opcoes?: OpcaoQuiz[]
  /** Apenas para tipo "binaria-dupla". */
  pares?: ParBinario[]
  /** Apenas para tipo "texto" — placeholder do input. */
  placeholder?: string
  /** Apenas para tipo "texto" — se true, a pergunta pode ser pulada sem resposta. */
  opcional?: boolean
  /**
   * Apenas para tipo "multipla" — id de uma opção mutuamente exclusiva com todas
   * as outras (ex: "nenhum" / "Nada específico"). Selecioná-la desmarca o resto;
   * selecionar qualquer outra desmarca ela.
   */
  exclusiva?: string
}

// ── Quiz gratuito — 6 perguntas ───────────────────────────────────────────────

export const FREE_QUIZ_QUESTIONS: PerguntaQuiz[] = [
  {
    id: "genero",
    pergunta: "Você busca um perfume...",
    opcoes: [
      { id: "a", texto: "Masculino" },
      { id: "b", texto: "Feminino" },
      { id: "c", texto: "Unissex" },
      { id: "d", texto: "Tanto faz" },
    ],
  },
  {
    id: "ocasiao",
    pergunta: "Para que você está procurando esse perfume?",
    opcoes: [
      { id: "a", texto: "Uso diário — quero algo para todo dia" },
      { id: "b", texto: "Trabalho ou faculdade" },
      { id: "c", texto: "Encontros e noites" },
      { id: "d", texto: "Minha assinatura pessoal — para tudo" },
    ],
  },
  {
    id: "clima",
    pergunta: "Qual o clima da sua cidade na maior parte do ano?",
    opcoes: [
      { id: "quente",     texto: "Quente o ano todo" },
      { id: "temperado",  texto: "Calor no verão, frio no inverno" },
      { id: "frio",       texto: "Frio a maior parte do ano" },
    ],
  },
  {
    id: "estacao",
    pergunta: "Pra qual época do ano?",
    opcoes: [
      { id: "verao",        texto: "Verão, dias quentes" },
      { id: "inverno",      texto: "Inverno, dias frios" },
      { id: "meia-estacao", texto: "Primavera ou outono" },
      { id: "ano-todo",     texto: "Quero usar o ano todo" },
    ],
  },
  {
    id: "cena",
    pergunta: "Qual dessas cenas combina mais com você?",
    opcoes: [
      { id: "a", texto: "Café da manhã em casa, janela aberta, luz natural" },
      { id: "b", texto: "Reunião importante, roupa bem escolhida, postura firme" },
      { id: "c", texto: "Noite na cidade, luzes, energia" },
      { id: "d", texto: "Fim de semana livre — natureza, viagem, ar livre" },
    ],
  },
  {
    id: "preferencia",
    pergunta: "O que você prefere?",
    tipo: "binaria-dupla",
    pares: [
      {
        id: "projecao",
        opcaoA: { id: "discreto", texto: "Algo que só quem se aproxima sente" },
        opcaoB: { id: "rastro", texto: "Algo que deixa rastro por onde passa" },
      },
      {
        id: "ousadia",
        opcaoA: { id: "classico", texto: "Clássico e seguro" },
        opcaoB: { id: "diferente", texto: "Diferente e marcante" },
      },
    ],
  },
  {
    id: "perfume-existente",
    pergunta: "Tem algum perfume que você já usa e gosta?",
    tipo: "texto",
    placeholder: "Ex: Sauvage, 212 VIP, Malbec...",
    opcional: true,
  },
  {
    id: "preco",
    pergunta: "Qual é seu orçamento para esse perfume?",
    opcoes: [
      { id: "ate-150",    texto: "Até R$150" },
      { id: "150-300",    texto: "R$150 – R$300" },
      { id: "300-500",    texto: "R$300 – R$500" },
      { id: "500-1000",   texto: "R$500 – R$1.000" },
      { id: "sem-limite", texto: "Acima de R$1.000" },
    ],
  },
]

// ── Quiz premium (Nozze+) — 10 perguntas (as 8 do free + 2 exclusivas) ───────

export const PREMIUM_QUIZ_QUESTIONS: PerguntaQuiz[] = [
  ...FREE_QUIZ_QUESTIONS,
  {
    id: "rejeicao",
    pergunta: 'Tem algo que você NÃO gosta em perfume?',
    tipo: "multipla",
    exclusiva: "nenhum",
    opcoes: [
      { id: "muito-doce", texto: "Muito doce" },
      { id: "enjoativo", texto: "Muito forte, enjoa" },
      { id: "some-rapido", texto: "Some rápido" },
      { id: "cheiro-velho", texto: 'Cheiro de "velho"' },
      { id: "nenhum", texto: "Nada específico" },
    ],
  },
  {
    id: "impressao",
    pergunta: "Quando você entra em um lugar, o que prefere que as pessoas sintam?",
    opcoes: [
      { id: "a", texto: "Que chegou alguém seguro e tranquilo" },
      { id: "b", texto: "Que chegou alguém que sabe o que quer" },
      { id: "c", texto: "Curiosidade — quem é essa pessoa?" },
      { id: "d", texto: "Que a energia do lugar mudou" },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the full questions array for a given mode. */
export function getQuizQuestions(mode: "free" | "premium"): PerguntaQuiz[] {
  return mode === "premium" ? PREMIUM_QUIZ_QUESTIONS : FREE_QUIZ_QUESTIONS
}

/**
 * Resolves a raw answers map into human-readable text.
 *
 * - "escolha": { ocasiao: "c" } → { ocasiao: "Encontros e noites" }
 * - "texto": valor já é texto livre — passa direto.
 * - "multipla": valor é uma string com ids separados por vírgula
 *   (ex: "muito-doce,enjoativo") → resolve cada um e junta com ", ".
 * - "binaria-dupla": as respostas chegam pelas chaves dos PARES, não da
 *   pergunta-pai (ex: respostas.projecao / respostas.ousadia, não
 *   respostas.preferencia) — cada par é resolvido contra opcaoA/opcaoB.
 */
export function resolverRespostas(
  respostas: Record<string, string>,
  mode: "free" | "premium"
): Record<string, string> {
  const perguntas = getQuizQuestions(mode)
  const resultado: Record<string, string> = {}

  const paresPorId = new Map<string, ParBinario>()
  for (const p of perguntas) {
    if (p.tipo === "binaria-dupla" && p.pares) {
      for (const par of p.pares) paresPorId.set(par.id, par)
    }
  }

  for (const [id, valor] of Object.entries(respostas)) {
    const par = paresPorId.get(id)
    if (par) {
      resultado[id] =
        valor === par.opcaoA.id ? par.opcaoA.texto :
        valor === par.opcaoB.id ? par.opcaoB.texto :
        valor
      continue
    }

    const pergunta = perguntas.find(p => p.id === id)
    if (!pergunta || pergunta.tipo === "texto") {
      resultado[id] = valor
      continue
    }

    if (pergunta.tipo === "multipla") {
      const idsSelecionados = valor.split(",").map(v => v.trim()).filter(Boolean)
      resultado[id] = idsSelecionados
        .map(sel => pergunta.opcoes?.find(o => o.id === sel)?.texto ?? sel)
        .join(", ")
      continue
    }

    const opcao = pergunta.opcoes?.find(o => o.id === valor)
    resultado[id] = opcao ? opcao.texto : valor
  }

  return resultado
}
