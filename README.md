# 🌸 Nozze

Uma plataforma inteligente de descoberta e recomendação de perfumes alimentada por inteligência artificial. O Nozze ajuda usuários a encontrar o perfume ideal através de um consultor interativo baseado em IA e um catálogo abrangente de fragrâncias.

## ✨ Funcionalidades

- **Consultor de Perfumes com IA**: Assistente interativo que faz perguntas sobre preferências e recomenda perfumes personalizados
- **Catálogo de Fragrâncias**: Banco de dados completo com informações sobre notas de saída, família olfativa e características
- **Análise de Acordes**: Visualização detalhada das notas olfativas (topo, meio e base)
- **Interface Responsiva**: Experiência otimizada para desktop e mobile
- **Autenticação de API**: Integração segura com APIs de IA (Google Generative AI e Groq)

## 🚀 Primeiros Passos

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd nozze
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto com as seguintes chaves:
```
GEMINI_API_KEY=sua_chave_aqui
GROQ_API_KEY=sua_chave_aqui
```

### Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

A aplicação será recarregada automaticamente quando você fizer alterações nos arquivos.

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila a aplicação para produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter do ESLint
- `npm test` - Executa os testes com Jest
- `npm run test:coverage` - Gera relatório de cobertura de testes
- `npm run scrape` - Executa o script de coleta de dados de perfumes

## 🗂️ Estrutura do Projeto

```
nozze/
├── app/                 # Rotas e layouts Next.js
│   ├── api/            # Rotas de API
│   ├── catalogo/       # Página do catálogo
│   ├── consultor/      # Página do consultor de IA
│   └── perfume/        # Páginas de detalhes de perfumes
├── components/         # Componentes React reutilizáveis
│   ├── consultor/      # Componentes do consultor
│   ├── layout/         # Componentes de layout
│   ├── perfume/        # Componentes de perfume
│   └── ui/             # Componentes UI genéricos
├── lib/                # Funções utilitárias e lógica compartilhada
├── config/             # Arquivos de configuração
├── public/             # Arquivos estáticos
└── styles/             # Estilos globais
```

## 🛠️ Tecnologias Utilizadas

- **Next.js 16** - Framework React moderno
- **React 19** - Biblioteca de componentes
- **TypeScript** - Tipagem de dados
- **Tailwind CSS** - Framework de estilos
- **Google Generative AI** - API de IA para recomendações
- **Groq API** - Processamento de IA adicional
- **Jest** - Framework de testes
- **ESLint** - Linter de código

## 📝 Licença

Este projeto é proprietário.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para fazer um fork, criar uma branch e enviar um pull request.

Para mais informações sobre Next.js, visite a [documentação oficial](https://nextjs.org/docs).
