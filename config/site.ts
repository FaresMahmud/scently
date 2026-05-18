// ============================================
// ARQUIVO: config/site.ts
// O QUE FAZ: centraliza todos os textos e configurações do site — mude aqui sem tocar no código
// QUANDO MANDAR PRA IA: quando quiser mudar textos, taglines, perguntas do quiz ou mensagens da IA
// DEPENDE DE: nada
// ============================================

// Informações gerais do site
export const siteMeta = {
  nome: "scently",
  tagline: "O perfume certo para quem você é hoje.",
  descricao: "Descubra fragrâncias que combinam com você. Consultoria personalizada, curadoria humana.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://scently.com.br",
  idioma: "pt-BR",
}

// Textos da página inicial
export const textosHome = {
  heroTitulo: "O perfume que você\nainda não conhece\nestá aqui.",
  heroSubtitulo: "Responda algumas perguntas. Seu consultor encontra a fragrância que é sua.",
  heroBotao: "Iniciar consulta",
  heroBotaoSecundario: "Explorar perfumes",
  secaoConsultor: "Como funciona",
  secaoConsultorDescricao: "Seu consultor particular de perfumaria. Gratuito, sem cadastro, resultado em minutos.",
  secaoCatalogo: "Fragrâncias para descobrir",
  rodapeTexto: "Consultoria de perfumaria guiada por IA. Sem cadastro obrigatório.",
}

// Textos do consultor de IA
export const textosConsultor = {
  titulo: "seu consultor",
  subtituloInicio: "Vamos encontrar o perfume certo para você.",
  botaoModoRapido: "Consulta rápida",
  botaoModoRapidoDescricao: "8 perguntas — resultado em 1 minuto",
  botaoModoAprofundado: "Consulta completa",
  botaoModoAprofundadoDescricao: "18 perguntas — recomendação mais precisa",
  mensagemCarregando: "Analisando seu perfil...",
  mensagemErro: "Não consegui encontrar uma recomendação agora. Tente novamente.",
  tituloPerfumePrincipal: "Minha recomendação",
  tituloAlternativa: "Uma alternativa para considerar",
  tituloDica: "Conselho de especialista",
  botaoSalvar: "Salvar recomendação",
  botaoRecomecar: "Fazer nova consulta",
  botaoVerPerfume: "Ver detalhes",
}

// Perguntas do quiz — modo rápido (6 perguntas)
export const perguntasRapidas = [
  {
    id: "perfil",
    pergunta: "Como você se relaciona com perfumes?",
    opcoes: [
      { valor: "iniciante", texto: "Uso pouco, não sei muito sobre o assunto" },
      { valor: "casual", texto: "Tenho um ou dois preferidos e fico neles" },
      { valor: "entusiasta", texto: "Gosto de explorar e tenho vários" },
      { valor: "colecionador", texto: "Sou apaixonado, acompanho lançamentos" },
    ],
  },
  {
    id: "genero",
    pergunta: "Qual é a sua preferência de fragrância?",
    tipo: "multipla",
    opcoes: [
      { valor: "masculino", texto: "Masculino" },
      { valor: "feminino", texto: "Feminino" },
      { valor: "unissex", texto: "Unissex" },
    ],
  },
  {
    id: "vibe",
    pergunta: "Qual é a vibe?",
    opcoes: [
      { valor: "fresco", texto: "Fresco e leve" },
      { valor: "quente", texto: "Quente e envolvente" },
      { valor: "sofisticado", texto: "Sofisticado e seco" },
      { valor: "doce", texto: "Doce e aconchegante" },
    ],
  },
  {
    id: "sensacao",
    pergunta: "Que sensação você quer causar?",
    opcoes: [
      { valor: "intrigar", texto: "Intrigar — que as pessoas perguntem o que é" },
      { valor: "acolher", texto: "Acolher — passar conforto e proximidade" },
      { valor: "impressionar", texto: "Impressionar — presença marcante" },
      { valor: "assinar", texto: "Assinar — algo sutil que seja só seu" },
    ],
  },
  {
    id: "ocasiao",
    pergunta: "Quando vai usar?",
    opcoes: [
      { valor: "diario", texto: "Dia a dia" },
      { valor: "trabalho", texto: "Trabalho" },
      { valor: "especial", texto: "Ocasiões especiais" },
      { valor: "qualquer", texto: "Qualquer momento" },
    ],
  },
  {
    id: "clima",
    pergunta: "Qual é o clima onde você vive?",
    opcoes: [
      { valor: "quente", texto: "Quente o ano todo" },
      { valor: "frio", texto: "Frio o ano todo" },
      { valor: "variado", texto: "Os dois" },
    ],
  },
  {
    id: "estacao",
    pergunta: "Em qual estação você mais usaria esse perfume?",
    opcoes: [
      { valor: "verao", texto: "Verão" },
      { valor: "inverno", texto: "Inverno" },
      { valor: "primavera-outono", texto: "Primavera e outono" },
      { valor: "ano-todo", texto: "Ano todo" },
    ],
  },
  {
    id: "hora",
    pergunta: "Quando costuma usar perfume?",
    opcoes: [
      { valor: "manha", texto: "Pela manhã" },
      { valor: "noite", texto: "À noite" },
      { valor: "trabalho", texto: "No trabalho" },
      { valor: "qualquer", texto: "Qualquer hora" },
    ],
  },
]

// Perguntas adicionais — modo aprofundado (mais 5 perguntas, total 11)
export const perguntasAprofundadas = [
  {
    id: "notas",
    pergunta: "Tem alguma nota que você ama ou odeia?",
    tipo: "selecao-visual",
    notasParaAmar: [
      { valor: "citrico", texto: "Cítrico", icone: "🍋" },
      { valor: "floral", texto: "Floral", icone: "🌸" },
      { valor: "amadeirado", texto: "Amadeirado", icone: "🪵" },
      { valor: "oriental", texto: "Oriental", icone: "🌙" },
      { valor: "musgo", texto: "Musgo / Aquático", icone: "🌊" },
      { valor: "especiado", texto: "Especiado", icone: "🌶" },
      { valor: "gourmand", texto: "Gourmand / Doce", icone: "🍪" },
      { valor: "verde", texto: "Verde / Herbal", icone: "🌿" },
    ],
  },
  {
    id: "preco",
    pergunta: "Quanto você costuma investir em um perfume?",
    opcoes: [
      { valor: "economico", texto: "Até R$ 200" },
      { valor: "medio", texto: "R$ 200 a R$ 500" },
      { valor: "premium", texto: "R$ 500 a R$ 1.000" },
      { valor: "luxo", texto: "Acima de R$ 1.000" },
    ],
  },
  {
    id: "perfume-atual",
    pergunta: "Você já usa algum perfume atualmente?",
    tipo: "texto-livre",
    placeholder: "Ex: Sauvage, La Vie Est Belle, Aventus... (deixe em branco se não usa)",
    opcional: true,
  },
  {
    id: "referencia-cheiro",
    pergunta: "Tem algum cheiro do dia a dia que te agrada muito?",
    tipo: "texto-livre",
    placeholder: "Ex: café, madeira, terra molhada, baunilha, sabonete, couro...",
    opcional: true,
  },
  {
    id: "ousadia",
    pergunta: "Como você prefere sua recomendação?",
    opcoes: [
      { valor: "seguro", texto: "Algo consagrado e aprovado por muitos" },
      { valor: "equilibrado", texto: "Conhecido mas com personalidade" },
      { valor: "ousado", texto: "Algo diferente, fora do óbvio" },
      { valor: "raro", texto: "Nicho ou indie, pouca gente conhece" },
    ],
  },
  {
    id: "prioridade",
    pergunta: "O que mais importa para você?",
    opcoes: [
      { valor: "fixacao", texto: "Durar o dia todo" },
      { valor: "sillage", texto: "Deixar rastro" },
      { valor: "discreto", texto: "Ser discreto" },
      { valor: "unico", texto: "Ser único" },
    ],
  },
  {
    id: "personalidade",
    pergunta: "Qual dessas palavras mais te define?",
    opcoes: [
      { valor: "elegante", texto: "Elegante e refinado" },
      { valor: "aventureiro", texto: "Aventureiro e livre" },
      { valor: "romantico", texto: "Romântico e sensível" },
      { valor: "intenso", texto: "Intenso e marcante" },
    ],
  },
  {
    id: "ambiente",
    pergunta: "Em qual ambiente você mais usa perfume?",
    opcoes: [
      { valor: "trabalho-formal", texto: "Trabalho formal" },
      { valor: "social-casual", texto: "Encontros casuais" },
      { valor: "noite-balada", texto: "Noite e balada" },
      { valor: "dia-a-dia", texto: "Dia a dia em casa" },
    ],
  },
  {
    id: "fixacao-projecao",
    pergunta: "Como prefere que seu perfume se comporte?",
    opcoes: [
      { valor: "discreto-pele", texto: "Só quem se aproxima sente" },
      { valor: "moderado", texto: "Presente mas não invasivo" },
      { valor: "rastro", texto: "Deixa rastro por onde passa" },
      { valor: "marcante", texto: "Anunciado antes de chegar" },
    ],
  },
  {
    id: "inspiracao-sensorial",
    pergunta: "Qual dessas imagens mais combina com o perfume que você busca?",
    opcoes: [
      { valor: "floresta-chuva", texto: "Floresta depois da chuva" },
      { valor: "cafeteria-madeira", texto: "Cafeteria com madeira e especiarias" },
      { valor: "praia-maresia", texto: "Brisa do mar na praia" },
      { valor: "jantar-elegante", texto: "Jantar elegante com velas" },
    ],
  },
]

// Tom de voz da IA — mantido aqui como referência (o prompt real está em lib/ai.ts)
export const instrucaoIA = `
Você é o consultor de perfumaria do site scently, um portal sofisticado e brasileiro.
Tom: sofisticado mas próximo, frases curtas, sem travessões, explicação sensorial.
Responda em JSON com: perfumePrincipal (nome, marca, concentracao, descricao, notas[]), conselho, alternativa (nome, marca, descricao).
`
