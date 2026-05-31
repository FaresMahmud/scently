# Skill: Revisão de Arquitetura — Nozze

## Quando usar
- "revisa a arquitetura do projeto"
- "verifica se o código está seguindo as regras"
- "checa a estrutura do projeto"
- "faz uma auditoria do código"
- "está tudo certo no projeto?"

## O que fazer ao ativar

1. Lê os arquivos principais listados abaixo
2. Verifica se cada um segue as regras definidas
3. Gera um relatório com: ✅ OK | ⚠️ Atenção | ❌ Problema

---

## Estrutura de pastas esperada

```
nozze/
├── app/
│   ├── page.tsx                  # Página inicial
│   ├── catalogo/page.tsx         # Catálogo com filtros
│   ├── consultor/page.tsx        # Quiz + resultado IA
│   ├── perfume/[id]/page.tsx     # Página individual de perfume
│   ├── marca/[slug]/page.tsx     # Página de marca
│   └── api/
│       ├── consultor/route.ts    # Endpoint da IA
│       └── cron/tendencias/      # Cron job semanal
├── components/
│   ├── layout/Header.tsx         # Header com Logo
│   ├── ui/Logo.tsx               # SVG do logo
│   ├── perfume/
│   │   ├── CardPerfume.tsx       # Card do catálogo
│   │   ├── NotasPerfume.tsx      # Pirâmide olfativa colorida
│   │   ├── AcordesPerfume.tsx    # Barras de acordes
│   │   ├── TagInfo.tsx           # Tags coloridas por tipo
│   │   └── ImagemPerfume.tsx     # Imagem com fallback
│   ├── catalogo/CatalogClient.tsx # Filtros + scroll infinito
│   └── consultor/
│       ├── QuizConsultor.tsx     # Perguntas do quiz
│       └── ResultadoConsultor.tsx # Resultado da IA
├── lib/
│   ├── ai.ts                     # Lógica IA (Groq + Gemini fallback)
│   ├── fragella.ts               # API Fragella (interface + funções)
│   ├── catalogoFragella.ts       # Leitura do JSON local com cache (server-only)
│   ├── ebayData.ts               # 1.211 perfumes base
│   ├── coresNotas.ts             # Cores por nota olfativa
│   ├── utils.ts                  # slugify, traduzir, familiaParaIngles
│   ├── types.ts                  # Tipos compartilhados (Acorde, etc.)
│   ├── mockData.ts               # Dados mock para desenvolvimento
│   ├── tendencias.ts             # Helpers para tendências semanais
│   ├── fragrancefinder.ts        # Integração RapidAPI (dupes e alternativas)
│   └── repositories/
│       ├── EbayPerfumeRepository.ts
│       ├── ContratipoRepository.ts
│       └── TendenciasRepository.ts
├── data/
│   ├── catalogo-fragella.json    # 11.022 perfumes Fragella
│   ├── contratipos.json          # 495 contratipos BR
│   └── tendencias.json           # Tendências semanais
├── scripts/
│   ├── popular-catalogo.ts       # Popula catálogo via Fragella API
│   ├── scrape-contratipos.ts     # Scraping sites BR
│   └── scrape-tendencias.ts      # Scraping Sephora + Fragrantica
└── config/
    └── site.ts                   # Quiz, textos, configurações
```

---

## Regras a verificar

### Design

- Espaçamentos seguem Fibonacci: 8, 13, 21, 34, 55px
- Paleta correta: `#F5F2ED` base, `#C4714A` terracota destaque, `#C9A84C` dourado, `#3A2E28` charcoal
- Fontes: Cormorant Garamond títulos, DM Sans corpo
- Nenhum texto hardcoded em inglês visível ao usuário

### Código

- Componentes `"use client"` só quando necessário (hover, estado, interação)
- Server components usam `server-only` quando leem arquivos
- Todos os arquivos têm cabeçalho com `// O QUE FAZ`, `// QUANDO MANDAR PRA IA`, `// DEPENDE DE`
- Nenhuma chave de API exposta no frontend
- Funções de fallback implementadas (eBay quando Fragella falha, Gemini quando Groq falha)

### Performance

- Catálogo usa scroll infinito (48 por vez)
- Cache em memória no `catalogoFragella.ts`
- Páginas de marca usam `revalidate = 86400`
- Top 500 perfumes gerados estaticamente, resto ISR

### Segurança (Grupo 1 — já implementado)

- CSP headers em `next.config.ts`
- CORS restrito nas rotas de API
- `CRON_SECRET` protegendo endpoint de tendências
- Rate limiting na API do consultor

### Pendente (Grupo 2 — implementar com cadastro)

- bcrypt + JWT
- Cookies HttpOnly
- MFA opcional
- Sentry para tracking de erros

---

## Variáveis de ambiente necessárias

```
GROQ_API_KEY=           # IA principal
GEMINI_API_KEY=         # IA fallback
FRAGELLA_API_KEY=       # API de perfumes
SCRAPINGBEE_API_KEY=    # Scraping
CRON_SECRET=            # Proteção do cron job
```

---

## Comandos úteis

```bash
npm run dev                    # Desenvolvimento
npm run build                  # Build de produção
npm run catalogo:popular       # Popula catálogo (todas as marcas)
npm run catalogo:continuar     # Continua marcas faltantes
npm run contratipos:scrape     # Scraping contratipos BR
npm run scrape:tendencias      # Scraping tendências
```
