# NOZZE — Cronograma de Evolução & Roadmap Técnico

Este documento serve como guia e especificação técnica de melhorias futuras para a plataforma **Nozze**. Ele detalha a ordem de prioridades recomendada e as diretrizes de implementação para desenvolvedores e agentes de IA (como Claude ou Antigravity).

---

## 📅 Roadmap de Implementação

### 🚀 FASE 1: Polimento Estético, UX & Micro-interações (Baixa complexidade, Alto impacto visual)
Foco em tornar a plataforma visualmente impecável, alinhada com as melhores práticas de design moderno (luxo, minimalismo e transições limpas).

#### 1.1. Skeleton Loaders Premium (Shimmer Dourado)
* **Objetivo:** Substituir telas estáticas ou loaders brutos por blocos pulsantes que imitam a silhueta dos cards e textos.
* **Locais de aplicação:**
  * No carregamento da página `/perfume/[id]`.
  * Durante o processamento das respostas no quiz (`/consultor`).
* **Design:** Gradiente metálico suave oscilando entre `--cor-card` e um tom sutil de dourado/bronze transparente.

#### 1.2. Transição Suave de Filtros no Catálogo
* **Objetivo:** Adicionar transições de opacidade e posicionamento nos cards de perfume quando o usuário troca de categoria ou família no catálogo, evitando cortes secos.
* **Locais de aplicação:** [CatalogClient.tsx](file:///C:/Users/fares/scently/components/catalogo/CatalogClient.tsx)
* **Técnica:** Pode ser feito via animações CSS nativas aplicadas no estado de mudança da lista ou integrando animações de layout.

#### 1.3. Animação de Scanner Laser na Home
* **Objetivo:** Tornar o mockup do scanner interativo na página inicial.
* **Locais de aplicação:** [page.tsx](file:///C:/Users/fares/scently/app/page.tsx)
* **Design:** Um feixe luminoso horizontal (`box-shadow` neon vermelho/bronze) que percorre verticalmente o vidro do perfume em loop infinito (`animation: pulseScanner 3s infinite ease-in-out`).

---

### 💾 FASE 2: Personalização Sem Cadastro (Wishlist & Prateleira)
Foco em engajar o usuário permitindo que ele crie coleções locais, agregando inteligência com base em seu gosto olfativo.

#### 2.1. "Minha Prateleira" (Wishlist / Have list) via localStorage
* **Objetivo:** Permitir que o usuário adicione perfumes a duas coleções locais:
  1. **"Já tenho"** (meus perfumes atuais).
  2. **"Quero ter"** (lista de desejos).
* **Ação na UI:** Adicionar um botão discreto de marcador (ex: ícone de frasco ou coração) no card de perfume e na página de detalhes.
* **Persistência:** Salvar em um array estruturado no `localStorage` sob a chave `nozze_scent_wardrobe`.

#### 2.2. Geração da "Assinatura Olfativa"
* **Objetivo:** Analisar as notas e famílias dos perfumes que o usuário adicionou à sua prateleira e calcular suas preferências.
* **Ação na UI:** Uma aba ou seção chamada "Meu Perfil" onde o usuário vê um gráfico de pizza ou radar (ex: "Amadeirado: 50%, Cítrico: 30%, Âmbar: 20%").
* **Uso da IA:** Ajustar o prompt do consultor para considerar o perfil gerado pelo guarda-roupa local do usuário nas recomendações.

---

### 🧠 FASE 3: Recursos Avançados de IA & Dados
Elevar as capacidades técnicas de recomendação olfativa no front-end e no back-end.

#### 3.1. "Encontre Similares" (Régua de Custo-Benefício)
* **Objetivo:** Exibir alternativas acessíveis para perfumes de grife.
* **Como funciona:** Se o usuário entra na página de um perfume importado caro (ex: *Bleu de Chanel*), exibe-se uma seção: *"Alternativas e Contratipos Recomendados"*, listando contratipos nacionais e árabes mapeados em nosso banco que possuem a mesma inspiração.
* **Lógica:** Cruzar o campo `inspiradoEm` do catálogo expandido com o ID do perfume original.

#### 3.2. Comparador Lado a Lado
* **Objetivo:** Permitir que o usuário compare dois perfumes em detalhes.
* **UI:** Uma interface de duas colunas comparando:
  * Pirâmide olfativa (Notas de Topo/Coração/Fundo).
  * Principais acordes (sobreposição gráfica).
  * Clima/Estação mais adequada.
  * Faixa de preço estimada.

#### 3.3. Pirâmide Olfativa Visual Interativa
* **Objetivo:** Facilitar a compreensão do desenvolvimento do perfume na pele.
* **UI:** Desenhar um triângulo isósceles dividido em três faixas (Topo, Coração, Fundo). Clicar em cada faixa destaca as notas olfativas correspondentes com uma breve explicação sobre a duração daquela fase (ex: *Topo = Primeiros 15 min; Coração = Próximas 4 horas; Fundo = Fixação final*).

---

### 💸 FASE 4: Cupons & Monetização de Afiliados
Aumentar a rentabilidade por meio de links de compras altamente atraentes.

#### 4.1. Destaque de Cupons Exclusivos
* **Objetivo:** Exibir cupons de desconto de parceiros nacionais ao lado das ofertas.
* **Locais de aplicação:** [OndeComprar.tsx](file:///C:/Users/fares/scently/components/perfume/OndeComprar.tsx)
* **UI:** Tags com borda tracejada dourada e botão de copiar em um clique (ex: `"Use o cupom NOZZE5 para obter 5% de desconto na Thera Cosméticos"`).

---

## 🛠️ Onde Mudar no Código (Guias para Claude / Devs)

1. **Skeleton Loaders & Transições:**
   * Criar arquivo de estilos utilitários em `styles/globals.css` com a animação de shimmer:
     ```css
     @keyframes shimmer {
       0% { background-position: -200% 0; }
       100% { background-position: 200% 0; }
     }
     .loading-shimmer {
       background: linear-gradient(90deg, var(--cor-card) 25%, #2a2a26 50%, var(--cor-card) 75%);
       background-size: 200% 100%;
       animation: shimmer 1.5s infinite;
     }
     ```
   * Modificar [CatalogClient.tsx](file:///C:/Users/fares/scently/components/catalogo/CatalogClient.tsx) para implementar as transições de estado da listagem.

2. **Minha Prateleira / Coleção Local:**
   * Desenvolver um hook personalizado React em `lib/useScentWardrobe.ts` para abstrair as chamadas do `localStorage`.
   * Integrar o gatilho visual de adicionar à prateleira em [CardPerfume.tsx](file:///C:/Users/fares/scently/components/perfume/CardPerfume.tsx) e na página `/perfume/[id]/page.tsx`.

3. **Scanner Laser:**
   * Procurar a div com ID `#mockup-scanner` ou similar em [app/page.tsx](file:///C:/Users/fares/scently/app/page.tsx) e injetar a tag `<div className="laser-beam" />` com estilos relativos absolutos.

4. **Encontre Similares:**
   * No backend do resolvedor do perfume (`resolverPerfume` em [app/perfume/[id]/page.tsx]), adicionar uma query que busca no `expandidoData` qualquer perfume cujo `inspiradoEm` seja similar ou que possua o mesmo ID de referência, injetando esse array no payload sob o nome de `alternativas`.
