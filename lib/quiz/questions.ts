// ============================================
// ARQUIVO: lib/quiz/questions.ts
// O QUE FAZ: perguntas e opções dos quizzes free (7q) e premium (18q)
// QUANDO MANDAR PRA IA: quando quiser adicionar, remover ou alterar perguntas
// DEPENDE DE: nada — apenas tipos e constantes
// ============================================

export interface OpcaoQuiz {
  id: "a" | "b" | "c" | "d"
  texto: string
}

export interface PerguntaQuiz {
  id: string
  pergunta: string
  opcoes: OpcaoQuiz[]
  multiSelect?: boolean
}

// ── Quiz gratuito — 7 perguntas ───────────────────────────────────────────────

export const FREE_QUIZ_QUESTIONS: PerguntaQuiz[] = [
  {
    id: "contexto",
    pergunta: "Para qual momento você quer esse perfume?",
    opcoes: [
      { id: "a", texto: "Do dia a dia — quero usar toda manhã sem pensar" },
      { id: "b", texto: "Para o trabalho ou faculdade" },
      { id: "c", texto: "Para encontros, saídas e momentos especiais" },
      { id: "d", texto: "Minha assinatura — para tudo" },
    ],
  },
  {
    id: "genero",
    pergunta: "Você busca um perfume...",
    multiSelect: true,
    opcoes: [
      { id: "a", texto: "Masculino" },
      { id: "b", texto: "Feminino" },
      { id: "c", texto: "Unissex" },
      { id: "d", texto: "Tanto faz" },
    ],
  },
  {
    id: "presenca",
    pergunta: "Como você gostaria de ser lembrado depois de sair de um ambiente?",
    opcoes: [
      { id: "a", texto: "Discreto, quase imperceptível" },
      { id: "b", texto: "Presença sutil e elegante" },
      { id: "c", texto: "Marcante e único" },
      { id: "d", texto: "Todo mundo perguntou o que eu estava usando" },
    ],
  },
  {
    id: "cena",
    pergunta: "Qual dessas cenas combina mais com você?",
    opcoes: [
      { id: "a", texto: "Café da manhã em casa, janela aberta, luz natural" },
      { id: "b", texto: "Reunião importante, roupa bem escolhida, postura firme" },
      { id: "c", texto: "Jantar fora, mesa boa, conversa que vai até meia-noite" },
      { id: "d", texto: "Final de semana livre — praia, trilha ou viagem" },
    ],
  },
  {
    id: "cidade",
    pergunta: "Se seu estilo de vida fosse uma cidade, qual seria?",
    opcoes: [
      { id: "a", texto: "São Paulo — urbano, sempre em movimento" },
      { id: "b", texto: "Paris ou Milão — elegância cotidiana" },
      { id: "c", texto: "Nova York — energia e ambição" },
      { id: "d", texto: "Lisboa ou Buenos Aires — alma e profundidade" },
    ],
  },
  {
    id: "sensacao",
    pergunta: "Qual dessas sensações você mais quer transmitir?",
    opcoes: [
      { id: "a", texto: "Limpeza e frescor — presença agradável, nunca invasiva" },
      { id: "b", texto: "Confiança e autoridade — pessoa que sabe o que quer" },
      { id: "c", texto: "Sensualidade e mistério — algo que atrai sem explicar" },
      { id: "d", texto: "Aconchego e calma — quem está perto se sente bem" },
    ],
  },
  {
    id: "olfato",
    pergunta: "Qual dessas experiências mais te agrada?",
    opcoes: [
      { id: "a", texto: "Roupa limpa, sabonete, ar puro" },
      { id: "b", texto: "Madeira, couro, biblioteca antiga" },
      { id: "c", texto: "Baunilha, café, especiarias quentes" },
      { id: "d", texto: "Flores frescas, jardim molhado, natureza viva" },
    ],
  },
  {
    id: "orcamento",
    pergunta: "Qual é seu orçamento para esse perfume?",
    opcoes: [
      { id: "a", texto: "Até R$150" },
      { id: "b", texto: "Entre R$150 e R$300" },
      { id: "c", texto: "Entre R$300 e R$500" },
      { id: "d", texto: "Sem limite — quero o mais certeiro" },
    ],
  },
]

// ── Quiz premium (Nozze+) — 18 perguntas ────────────────────────────────────

export const PREMIUM_QUIZ_QUESTIONS: PerguntaQuiz[] = [
  // ETAPA 1 — PERFIL GERAL
  {
    id: "idade",
    pergunta: "Qual é a sua faixa de idade?",
    opcoes: [
      { id: "a", texto: "16–22 anos" },
      { id: "b", texto: "23–30 anos" },
      { id: "c", texto: "31–40 anos" },
      { id: "d", texto: "41 anos ou mais" },
    ],
  },
  {
    id: "experiencia",
    pergunta: "Você já tem um perfume favorito ou está começando do zero?",
    opcoes: [
      { id: "a", texto: "Começando do zero — nunca me aprofundei nisso" },
      { id: "b", texto: "Uso sempre o mesmo há anos e quero algo parecido" },
      { id: "c", texto: "Já explorei bastante e quero descobrir algo novo" },
      { id: "d", texto: "Sou apaixonado por perfumes e conheço bem o universo" },
    ],
  },
  {
    id: "clima",
    pergunta: "Em qual clima você vive a maior parte do ano?",
    opcoes: [
      { id: "a", texto: "Quente e úmido — verão quase o ano todo" },
      { id: "b", texto: "Quente e seco" },
      { id: "c", texto: "Temperado — estações bem definidas" },
      { id: "d", texto: "Frio — outono e inverno dominam" },
    ],
  },
  // ETAPA 2 — ESTILO DE VIDA
  {
    id: "rotina",
    pergunta: "Como é a maior parte dos seus dias?",
    opcoes: [
      { id: "a", texto: "Home office ou ambientes fechados e controlados" },
      { id: "b", texto: "Escritório, reuniões, ambiente profissional" },
      { id: "c", texto: "Em movimento — carro, rua, deslocamentos constantes" },
      { id: "d", texto: "Variado — cada dia é diferente" },
    ],
  },
  {
    id: "vida_social",
    pergunta: "Com que frequência você sai à noite ou vai a eventos?",
    opcoes: [
      { id: "a", texto: "Raramente — sou mais caseiro" },
      { id: "b", texto: "Às vezes — ocasiões especiais" },
      { id: "c", texto: "Com frequência" },
      { id: "d", texto: "Muito — minha vida social é intensa" },
    ],
  },
  {
    id: "fds",
    pergunta: "Imagine seu fim de semana ideal. Qual se aproxima mais?",
    opcoes: [
      { id: "a", texto: "Em casa, séries, comida boa, descanso total" },
      { id: "b", texto: "Almoço com família ou amigos próximos" },
      { id: "c", texto: "Aventura — trilha, viagem rápida, algo novo" },
      { id: "d", texto: "Evento, restaurante bom, cidade em movimento" },
    ],
  },
  {
    id: "frequencia",
    pergunta: "Você usa perfume todos os dias?",
    opcoes: [
      { id: "a", texto: "Só em ocasiões especiais" },
      { id: "b", texto: "Algumas vezes por semana" },
      { id: "c", texto: "Todo dia, faz parte da minha rotina" },
      { id: "d", texto: "Não saio sem perfume — é essencial" },
    ],
  },
  // ETAPA 3 — IDENTIDADE E ARQUÉTIPO
  {
    id: "personalidade",
    pergunta: "Como as pessoas que te conhecem bem te descreveriam?",
    opcoes: [
      { id: "a", texto: "Calmo, confiável, a pessoa que todo mundo quer por perto" },
      { id: "b", texto: "Ambicioso, determinado, sempre com um objetivo claro" },
      { id: "c", texto: "Criativo, diferente, difícil de colocar em uma caixa" },
      { id: "d", texto: "Carismático, animado, quem ilumina o ambiente" },
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
  {
    id: "identidade",
    pergunta: "Qual dessas frases mais combina com você?",
    opcoes: [
      { id: "a", texto: "Prefiro o que é testado e confiável" },
      { id: "b", texto: "Gosto do que é refinado e atemporal" },
      { id: "c", texto: "Me atraio pelo que é diferente e inesperado" },
      { id: "d", texto: "Quero algo que poucas pessoas têm" },
    ],
  },
  {
    id: "luxo",
    pergunta: "Qual é a sua relação com luxo?",
    opcoes: [
      { id: "a", texto: "Não me importa — o que importa é funcionar bem" },
      { id: "b", texto: "Aprecio qualidade, mas não preciso de rótulos" },
      { id: "c", texto: "Gosto quando o luxo é discreto e inteligente" },
      { id: "d", texto: "O luxo faz parte de como me expresso" },
    ],
  },
  // ETAPA 4 — ESTÉTICA E REFERÊNCIAS
  {
    id: "estilo",
    pergunta: "Qual dessas palavras melhor descreve seu guarda-roupa?",
    opcoes: [
      { id: "a", texto: "Básico e funcional — conforto em primeiro lugar" },
      { id: "b", texto: "Clássico — peças atemporais, cores neutras" },
      { id: "c", texto: "Contemporâneo — moderno sem ser exagerado" },
      { id: "d", texto: "Autoral — tenho um estilo que é claramente meu" },
    ],
  },
  {
    id: "imagem",
    pergunta: "Qual dessas imagens mais combina com você?",
    opcoes: [
      { id: "a", texto: "Casa de campo ao entardecer — madeira, lareira, silêncio" },
      { id: "b", texto: "Hotel de design europeu — mármore, flores brancas, ar frio" },
      { id: "c", texto: "Mercado ao ar livre — frutas, flores, gente, barulho vivo" },
      { id: "d", texto: "Bar escuro com boa música — couro, conversa intensa" },
    ],
  },
  // ETAPA 5 — PREFERÊNCIAS SENSORIAIS
  {
    id: "bebida",
    pergunta: "Se seu perfume ideal fosse uma bebida, qual seria?",
    opcoes: [
      { id: "a", texto: "Água com gás ou chá verde — leve e refrescante" },
      { id: "b", texto: "Vinho tinto — complexo, encorpado, com profundidade" },
      { id: "c", texto: "Café espresso — intenso, quente, concentrado" },
      { id: "d", texto: "Champagne — efervescente, festivo, elegante" },
    ],
  },
  {
    id: "estacao",
    pergunta: "Para qual momento do ano você quer esse perfume?",
    opcoes: [
      { id: "a", texto: "Ano todo — quero usar em qualquer estação" },
      { id: "b", texto: "Nos meses quentes — verão, calor, sol" },
      { id: "c", texto: "Nos meses frios — outono, inverno, aconchego" },
      { id: "d", texto: "Tenho uma ocasião específica em mente" },
    ],
  },
  {
    id: "memoria",
    pergunta: "Existe algum cheiro que te faz lembrar de algo bom?",
    opcoes: [
      { id: "a", texto: "Chuva ou terra molhada" },
      { id: "b", texto: "Madeira, livros, ambientes antigos" },
      { id: "c", texto: "Bolo, baunilha, algo que lembra infância" },
      { id: "d", texto: "Mar, brisa, férias" },
    ],
  },
  {
    id: "incomodo",
    pergunta: "O que te incomoda em um perfume?",
    opcoes: [
      { id: "a", texto: "Quando é forte demais e gruda no ambiente" },
      { id: "b", texto: "Quando é doce demais — parece artificial" },
      { id: "c", texto: "Quando some rápido e não deixa rastro" },
      { id: "d", texto: "Quando não tem personalidade — parece genérico" },
    ],
  },
  // ETAPA 6 — RESTRIÇÕES
  {
    id: "orcamento",
    pergunta: "Qual é o seu orçamento para esse perfume?",
    opcoes: [
      { id: "a", texto: "Até R$150" },
      { id: "b", texto: "Entre R$150 e R$300" },
      { id: "c", texto: "Entre R$300 e R$500" },
      { id: "d", texto: "Sem teto — quero o mais certeiro possível" },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the full questions array for a given mode. */
export function getQuizQuestions(mode: "free" | "premium"): PerguntaQuiz[] {
  return mode === "premium" ? PREMIUM_QUIZ_QUESTIONS : FREE_QUIZ_QUESTIONS
}

/**
 * Resolves a raw answers map { questionId: optionId } into human-readable text.
 * e.g. { contexto: "c" } → { contexto: "Para encontros, saídas e momentos especiais" }
 */
export function resolverRespostas(
  respostas: Record<string, string>,
  mode: "free" | "premium"
): Record<string, string> {
  const perguntas = getQuizQuestions(mode)
  const resultado: Record<string, string> = {}

  for (const [id, valor] of Object.entries(respostas)) {
    const pergunta = perguntas.find(p => p.id === id)
    if (!pergunta) {
      resultado[id] = valor
      continue
    }
    const opcao = pergunta.opcoes.find(o => o.id === valor)
    resultado[id] = opcao ? opcao.texto : valor
  }

  return resultado
}
