# 📝 Prompts para Claude Code (Próximos Passos)

Este documento contém os prompts técnicos detalhados e estruturados para implementar as próximas funcionalidades da plataforma. Eles foram preparados para que o Claude Code (ou outro agente de desenvolvimento) consiga executá-los de forma autônoma e precisa assim que as definições de dados forem aprovadas.

---

## 💾 Prompt 1: Wishlist / "Minha Prateleira" no Banco de Dados (Prisma)

### Contexto Técnico
Atualmente, a prateleira e a lista de desejos são salvas em memória local (ROADMAP.md prevê localStorage inicial). Precisamos persistir essa coleção no banco de dados via Prisma para permitir sincronização de contas, histórico permanente e enriquecimento de perfil do usuário.

```text
Você é um desenvolvedor sênior Next.js/Prisma. Sua tarefa é implementar o sistema de persistência "Minha Prateleira" no banco de dados.

Siga estas instruções:
1. Modelagem Prisma (prisma/schema.prisma):
   - Adicione ou atualize o schema para incluir a tabela/modelo `ScentWardrobe`:
     - id (String, UUID, @id)
     - userId (String, chave estrangeira para o User)
     - perfumeId (String, correspondente ao ID do perfume no catálogo)
     - status (Enum ou String: 'HAVE' para "Já tenho", 'WANT' para "Quero ter")
     - createdAt (DateTime, @default(now))
     - @@unique([userId, perfumeId]) para evitar duplicatas.
   - Execute `npx prisma generate` e aplique as migrações necessárias.

2. API Routes (app/api/wardrobe/route.ts):
   - GET: Retorna todas as fragrâncias salvas do usuário atual autenticado. Deve formatar os payloads de retorno como `CardUnificado` compatível com a listagem.
   - POST: Salva um perfume com status 'HAVE' ou 'WANT'. Trate erros de item duplicado.
   - DELETE: Remove um perfume da prateleira do usuário.

3. Integração na Interface:
   - Crie um botão de toggle/marcador de estado no card de perfume (components/perfume/CardPerfume.tsx) e na página de detalhes (app/perfume/[id]/page.tsx).
   - O botão deve mostrar visualmente se o perfume já está na prateleira ("Coleção") ou na lista de desejos ("Quero ter"), mudando o ícone/cor e salvando em tempo real.
   - Trate o estado do botão para usuários não autenticados (abrir um modal simples de login/aviso ou salvar em localStorage temporário antes da autenticação).
```

---

## 📊 Prompt 2: Comparador de Perfumes Lado a Lado (Comparação Olfativa)

### Contexto Técnico
O usuário deseja comparar dois perfumes para entender qual se encaixa melhor no seu gosto ou ocasião. O banco já possui famílias, notas e ratings de estações/ocasiões formatados.

```text
Você é um engenheiro de frontend especialista em UI/UX. Sua tarefa é implementar a interface e o algoritmo de comparação lado a lado de perfumes no Nozze.

Siga estas instruções:
1. Interface do Comparador (app/comparador/page.tsx):
   - Desenhe uma página responsiva e luxuosa com tema claro/escuro.
   - Forneça duas caixas de busca que utilizem autocomplete para que o usuário escolha os dois perfumes.
   - Uma vez selecionados, exiba uma visualização de duas colunas comparativas lado a lado.

2. Itens de Comparação:
   - Pirâmide Olfativa: Exiba notas de Topo, Coração e Fundo lado a lado de forma clara e visual.
   - Acordes: Desenhe barras de progresso horizontais (ex: Cítrico: 80% vs 40%; Amadeirado: 20% vs 90%).
   - Adequação (Clima & Ocasião): Mostre os ratings Bayesianos (Estação/Ocasião) usando ícones e cores indicadoras (ótimo/ruim).
   - Preço Médio e Link: Compare o preço estimado do BRL de cada um e coloque botões diretos de compra.

3. Algoritmo de Similaridade Olfativa:
   - Calcule e mostre uma porcentagem de similaridade entre as duas fragrâncias com base nas famílias em comum e na interseção de acordes olfativos dominantes.
   - Insira uma explicação curta gerada localmente (ex: "Ambos compartilham o DNA cítrico da saída, mas o Perfume A seca de forma mais doce enquanto o Perfume B é mais amadeirado").
```
