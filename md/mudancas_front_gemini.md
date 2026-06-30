# Relatório de Mudanças — Frontend & Script de Enriquecimento (Gemini)

Olá, Claude! Este documento resume todas as alterações e melhorias feitas pelo Gemini no projeto **Nozze** para polimento visual, responsividade mobile e estabilidade de scripts. 

A pasta `md/` foi criada especificamente para centralizar esse compartilhamento de contexto de forma a otimizar o uso de tokens e evitar retrabalho.

---

## 1. Melhorias no Script de Enriquecimento de Dados
* **Arquivo:** [enrich-expandido-gemini.mjs](file:///C:/Users/fares/scently/scripts/enrich-expandido-gemini.mjs)
* **Mudanças:**
  * **Modo JSON Estrito:** Configurado `responseMimeType: "application/json"` nas chamadas da API do Gemini para garantir retornos em JSON puro e sem formatações de markdown adicionais.
  * **Tamanho do Output:** Elevado o `maxOutputTokens` para `2048` para evitar que os dados gerados de famílias, acordes e descrições fossem truncados ao meio pela metade.
  * **Resiliência a Falhas:** Adicionado um loop de até 3 tentativas com **backoff exponencial** para contornar erros transitórios de rede, erros de cota (429) ou indisponibilidade temporária de serviço (503).

---

## 2. Refatoração e Correção de Responsividade Mobile

### A. Correção Crítica do Menu Mobile (Drawer)
* **Arquivo:** [MenuMobileToggle.tsx](file:///C:/Users/fares/scently/components/layout/MenuMobileToggle.tsx)
* **Motivo:** O menu hambúrguer abria, mas a gaveta lateral (drawer) ficava invisível ou cortada, exibindo apenas o botão (✕) no canto superior direito do header, enquanto o conteúdo do site continuava ativo por baixo.
* **Bug Encontrado:** O cabeçalho fixo (`<header>`) possui `backdrop-filter: blur(...)`. No CSS, aplicar `backdrop-filter` cria um novo contexto de empilhamento (*containing block*) para elementos `position: "fixed"`. Isso limitava a altura da gaveta do menu à altura do próprio header (`64px`), escondendo os links pelo `overflow: hidden`.
* **Solução:** Refatoramos a gaveta lateral e o overlay cinza para renderizarem no escopo do `document.body` utilizando **React Portals** (`createPortal`). Adicionamos recuo de safe-area no topo (`paddingTop: "env(safe-area-inset-top)"`) para evitar que notches/câmeras de iPhones cubram os botões de fechar.

### B. Otimização de Espaço Vertical e Grade Dupla
* **Arquivo:** [globals.css](file:///C:/Users/fares/scently/styles/globals.css) (final do arquivo)
* **Classe `.perfumes-grid`:** Mudança drástica para diminuir a verticalização cansativa do site em dispositivos móveis. Em telas menores que 640px, a listagem de perfumes (no catálogo, destaque da home e marcas) passa a exibir **2 colunas de perfumes lado a lado** com espaçamento reduzido (`13px`).
* **Estilos dos Cards:** Criadas as classes `.card-perfume-info`, `.card-perfume-title` e `.card-perfume-brand` para diminuir o padding interno e o tamanho dos títulos nos cards quando exibidos em duas colunas, evitando quebras de texto feias no mobile.
* **Pills de Filtro Deslizantes:** O catálogo usava quebra de linha nas pills de filtragem de Gênero, Categoria e Ordenação, gerando grande empilhamento. Adicionamos a classe `.scroll-pills-container` que permite que elas **deslizem horizontalmente** no celular sem quebrar linhas, e oculta o divisor vertical no mobile.

---

## 3. Detalhamento de Arquivos Modificados no Frontend

### [Header.tsx](file:///C:/Users/fares/scently/components/layout/Header.tsx)
* Mudança do fundo sólido para semi-transparente (`rgba(245, 242, 237, 0.8)`), permitindo que o efeito de desfoque real do `backdropFilter: "blur(8px)"` funcione ao rolar a página.

### [PerguntaBinariaDupla.tsx](file:///C:/Users/fares/scently/components/consultor/PerguntaBinariaDupla.tsx)
* Adicionada a classe `.opcao-binaria-container` para substituir o flexbox inline. Em celulares pequenos (< 480px), as opções de quiz de múltipla escolha com respostas longas se empilham verticalmente para evitar estouros laterais de botões.

### [CatalogClient.tsx](file:///C:/Users/fares/scently/components/catalogo/CatalogClient.tsx)
* Aplicação das classes `.scroll-pills-container` e `.ordenacao-row` na estrutura de cabeçalho dos filtros e substituição do grid inline pela classe `.perfumes-grid` (permitindo o layout de duas colunas).

### [CardPerfume.tsx](file:///C:/Users/fares/scently/components/perfume/CardPerfume.tsx)
* Aplicação de `.card-perfume-info`, `.card-perfume-brand` e `.card-perfume-title` nos elementos correspondentes, removendo as propriedades antigas inlined que travavam o tamanho dos textos.

### [page.tsx](file:///C:/Users/fares/scently/app/page.tsx) (Homepage)
* Aplicação da classe `.hero-section` (altura do hero flexível em mobile para não forçar rolagens vazias), centralização do separador de cor laranja no mobile (`.separador-hero`), animação de entrada de fade-in no texto e aplicação do grid em duas colunas.
* Adicionado um feixe de laser animado verticalmente no teaser do scanner (`.laser-scan-line`).

### [page.tsx](file:///C:/Users/fares/scently/app/perfume/[id]/page.tsx) (Página do Perfume)
* Alterada a largura mínima da coluna de `repeat(auto-fit, minmax(290px, 1fr))` para `repeat(auto-fit, minmax(min(290px, 100%), 1fr))` para garantir que o layout nunca transborde a tela horizontalmente em celulares estreitos (como iPhone SE).

### [page.tsx](file:///C:/Users/fares/scently/app/marca/[slug]/page.tsx) (Página da Marca)
* Substituição do grid inlined rígido por `.perfumes-grid` para alinhar com o grid móvel de duas colunas.

---

## 4. Implementação de Modo Noturno (Tema Escuro)
* **Status:** Concluído e 100% Funcional.
* **Mapeamento de Variáveis:**
  * O CSS global foi atualizado com o seletor `[data-theme="dark"]`, redefinindo as variáveis de cores principais (`--cor-base`, `--cor-texto`, `--cor-card`, `--cor-borda`, etc.) para tons escuros sofisticados, preservando o terracota e dourado originais.
* **Prevenção de Flicker (Flicker Prevention):**
  * Injetamos um script render-blocking na tag `<head>` em [layout.tsx](file:///C:/Users/fares/scently/app/layout.tsx) para ler a preferência do `localStorage` ou o padrão do sistema operacional do usuário (`prefers-color-scheme`), atribuindo `data-theme` imediatamente antes do carregamento da interface.
* **Refatoração de Cores Inlined:**
  * Modificamos elementos com cores anteriormente fixadas em hexadecimal (como botões de links afiliados em `OndeComprar.tsx` e botões da gaveta em `MenuMobileToggle.tsx`) para utilizarem as variáveis do CSS (ex: `var(--cor-texto)`, `var(--cor-base)`).
* **Novo Componente `<ThemeToggle />`:**
  * Desenvolvemos o componente cliente [ThemeToggle.tsx](file:///C:/Users/fares/scently/components/ui/ThemeToggle.tsx) com ícones vetoriais de Sol e Lua para alternar dinamicamente os modos. O botão foi posicionado no canto superior direito do cabeçalho global ([Header.tsx](file:///C:/Users/fares/scently/components/layout/Header.tsx)) ao lado do botão de menu mobile.

---

## 5. Inversão de Prioridade e Ajustes do Catálogo (Camada de Dados)
* **Arquivo:** [ai.ts](file:///C:/Users/fares/scently/lib/ai.ts)
* **Mudanças:**
  * **Inversão de Prioridade:** Ajustamos o fluxo de montagem em `montarContextoCatalogo` para priorizar o catálogo `expandido` (nossos perfumes nacionais, contratipos e árabes) como fonte de dados primária, alimentando até **25 vagas** (slice de 25) e inserindo o catálogo `Fragella` apenas como complemento de até **15 vagas** secundárias.
  * **Camada C (Shuffle do Expandido):** A Camada C de diversidade forçada foi modificada para realizar o shuffle e seleção aleatória exclusivamente em cima do catálogo `expandido`, em vez de misturar com o `catalogo` (Fragella).
  * **Mapeamento Bilíngue na Camada B:** Garantimos a utilização da função helper `familiaMatch` (com o dicionário `FAMILIA_PT_EN` mapeando categorias em português para termos em inglês como *woody*, *ozonic*, *fougere*, etc.) na Camada B para relacionar corretamente as famílias olfativas com as do catálogo Fragella.
  * **Tratamento de Notas Estruturadas (Fix Gemini):** Corrigimos o tipo de dados `notas` do catálogo `PerfumeExpandido` para aceitar tanto `string[]` quanto objetos com a estrutura `{ topo?: string[]; coracao?: string[]; fundo?: string[] }`. Implementamos o mapeamento seguro usando `Array.isArray()` no método `addExpandido` (linha 542). No método `gerarFallback` (linha 870), revertemos para o fatiador básico `.slice()`, uma vez que os itens do repositório de contratipos têm o tipo `string[]` estaticamente garantido e a checagem dinâmica redundante gerava erros de compilação de tipo `never`.
  * **Resolução de Slugs do Quiz (Servidor):** Aprimoramos o retorno da rota de IA para resolver o `slug` correspondente ao perfume recomendado cruzando com as bases de dados locais. O `slug` gerado é acoplado no JSON retornado ao cliente.
* **Comando Executado:**
  * Executado o script `scripts/enrich-expandido-gemini.mjs` que concluiu o enriquecimento com o modelo Gemini.
  * Executado `git rm --cached -r scripts/output/` para remover do índice do Git arquivos locais temporários gerados de depuração.

---

## 6. Ajustes de Contraste, Links e Texto do Quiz (UI/Lógica)

### A. ResultadoQuiz.tsx (UI/Interativo)
* **Arquivo:** [ResultadoQuiz.tsx](file:///C:/Users/fares/scently/components/consultor/ResultadoQuiz.tsx)
* **Mudanças:**
  * **Contraste Modo Noturno:** Substituímos as cores fixas de texto escuras (como `#1A1A18`, `rgba(26,26,24,0.85)` e `rgba(26,26,24,0.6)`) por variáveis globais semânticas (`var(--cor-texto)` e `var(--cor-texto-suave)`). Agora, os nomes dos perfumes e as explicações nos cards herdam as cores corretas no tema escuro, garantindo máxima legibilidade.
  * **Link "Ver perfume →" Dinâmico:** Inserimos o link condicional "Ver perfume →" entre o botão "Onde comprar" e o link de busca no catálogo. Ele só é renderizado caso a IA tenha resolvido um `slug` válido no servidor. O visual do link segue o padrão do design system (cor `#C9A84C` dourado, fonte DM Sans 14px, sem fundo, sem borda).

### B. TransicaoQuiz.tsx (Textos)
* **Arquivo:** [TransicaoQuiz.tsx](file:///C:/Users/fares/scently/components/consultor/TransicaoQuiz.tsx)
* **Mudanças:**
  * **Remoção de Em-Dash (—):** Alteramos o separador de frases que unia as opções de ousadia e projeção ("Algo diferente e marcante — discreto") para uma vírgula simples, cumprindo a diretriz de não utilizar em-dash em textos voltados para o cliente final.



