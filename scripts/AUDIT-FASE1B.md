# Auditoria Fase 1b (v2) — Revisão de versões + categorização

Gerado em: 2026-06-22T23:32:21.902Z

**Nota:** esta revisão usa os dados EXATOS do relatório original (AUDIT-CATALOG-ESSENCIAIS.md), sem reconsultar o Gemini — a busca com grounding é não-determinística e geraria uma lista diferente.

## 1. Revisão dos 18 'versão diferente' originais

| Nome pedido | Encontrado | Conc. pedida | Conc. catálogo | Decisão |
|---|---|---|---|---|
| Carolina Herrera 212 Vip Black Eau de Parfum | 212 Vip Black (`212-vip-black-carolina-herrera`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Giorgio Armani Acqua di Giò Profumo | Acqua Di Gio Profumo (`acqua-di-gio-profumo-giorgio-armani`) | profumo | edp | DISTINTO — concentração pedida não existe no catálogo |
| Hugo Boss Bottled Eau de Toilette | Boss Bottled (`boss-bottled-hugo-boss`) | edt | edp | MESMA FRAGRÂNCIA (existe boss-bottled-night-hugo-boss com a concentração certa) |
| O Boticário Zaad Eau de Parfum | Zaad (`o-boticario-zaad`) | edp | edt | DISTINTO — concentração pedida não existe no catálogo |
| Lancôme La Vie Est Belle Eau de Parfum | La Vie Est Belle (`la-vie-est-belle-lancome`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Dior J'adore Eau de Parfum | Jadore (`jadore-christian-dior`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Carolina Herrera Good Girl Eau de Parfum | Ch Good Girl (`ch-good-girl-carolina-herrera`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Dolce & Gabbana Light Blue Eau de Toilette | D & G Light Blue (`d-g-light-blue-dolce-gabbana`) | edt | edt | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Kenzo Flower by Kenzo Eau de Parfum | Flowerbykenzo (`flowerbykenzo-kenzo`) | edp | edt | ERRO DE MATCHING — nomes não relacionados, não é a mesma fragrância |
| Giorgio Armani Sì Passione Eau de Parfum | Armani Si Passione (`armani-si-passione-giorgio-armani`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Chloé Chloé Eau de Parfum | Chloe (`chloe-chloe`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Ralph Lauren Woman by Ralph Lauren Eau de Parfum | Ralph Lauren Woman (`ralph-lauren-woman-ralph-lauren`) | edp | edp | ERRO DE MATCHING — nomes não relacionados, não é a mesma fragrância |
| Mugler Angel Eau de Parfum | Angel (`angel-thierry-mugler`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| O Boticário Lily Eau de Parfum | Lily (`o-boticario-lily`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Calvin Klein CK One Eau de Toilette | Ck One (`ck-one-calvin-klein`) | edt | edt | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |
| Calvin Klein CK Be Eau de Toilette | ? (`obsessed-calvin-klein`) | edt | — | DISTINTO — concentração pedida não existe no catálogo |
| Bvlgari Black Eau de Toilette | Man In Black (`bvlgari-man-in-black`) | edt | edp | DISTINTO — concentração pedida não existe no catálogo |
| Byredo Mojave Ghost Eau de Parfum | Mojave Ghost Byredo (`mojave-ghost-byredo-byredo`) | edp | edp | MESMA FRAGRÂNCIA (nome truncado, concentração compatível ou não especificada) |

**6 reclassificados:**

- **Giorgio Armani Acqua di Giò Profumo** — DISTINTO — concentração pedida não existe no catálogo
- **O Boticário Zaad Eau de Parfum** — DISTINTO — concentração pedida não existe no catálogo
- **Kenzo Flower by Kenzo Eau de Parfum** — ERRO DE MATCHING — nomes não relacionados, não é a mesma fragrância
- **Ralph Lauren Woman by Ralph Lauren Eau de Parfum** — ERRO DE MATCHING — nomes não relacionados, não é a mesma fragrância
- **Calvin Klein CK Be Eau de Toilette** — DISTINTO — concentração pedida não existe no catálogo
- **Bvlgari Black Eau de Toilette** — DISTINTO — concentração pedida não existe no catálogo

## 2. Faltantes categorizados

| Nome | Marca | Categoria | Origem |
|---|---|---|---|
| Calvin Klein CK In2U Him Eau de Toilette | Calvin Klein | CLÁSSICO RELEVANTE | Fase 1 (não existe) |
| O Boticário Malbec Gold Eau de Parfum | O Boticário | ESSENCIAL | Fase 1 (não existe) |
| O Boticário Arbo Puro Desodorante Colônia | O Boticário | ESSENCIAL | Fase 1 (não existe) |
| Natura Essencial Oud Masculino Eau de Parfum | Natura | ESSENCIAL | Fase 1 (não existe) |
| Natura Kaiak Aero Masculino Desodorante Colônia | Natura | ESSENCIAL | Fase 1 (não existe) |
| Eudora Club 6 Intenso Desodorante Colônia | Eudora | ESSENCIAL | Fase 1 (não existe) |
| Gabriela Sabatini Eau de Toilette | Gabriela Sabatini | CLÁSSICO RELEVANTE | Fase 1 (não existe) |
| O Boticário Floratta Red Desodorante Colônia | O Boticário | ESSENCIAL | Fase 1 (não existe) |
| Eudora Kiss Me Lovely Desodorante Colônia | Eudora | ESSENCIAL | Fase 1 (não existe) |
| Jo Malone English Pear & Freesia Cologne | Jo Malone London | CLÁSSICO RELEVANTE | Fase 1 (não existe) |
| Tiziana Terenzi Kirke Extrait de Parfum | Tiziana Terenzi | HYPE ATUAL | Fase 1 (não existe) |
| O.U.i Madeleine 862 La Pistacherie Eau de Parfum | O.U.i Original Unique Individual | HYPE ATUAL | Fase 1 (não existe) |
| Amyi 5.21 Eau de Parfum | Amyi | HYPE ATUAL | Fase 1 (não existe) |
| Granado Fervo Intenso Eau de Parfum | Granado | ESSENCIAL | Fase 1 (não existe) |
| Giorgio Armani Acqua di Giò Profumo | Giorgio Armani | DUVIDOSO | Reclassificado (SKU distinto) |
| O Boticário Zaad Eau de Parfum | O Boticário | ESSENCIAL | Reclassificado (SKU distinto) |
| Kenzo Flower by Kenzo Eau de Parfum | Kenzo | DUVIDOSO | Reclassificado (erro de matching) |
| Ralph Lauren Woman by Ralph Lauren Eau de Parfum | Ralph Lauren | DUVIDOSO | Reclassificado (erro de matching) |
| Calvin Klein CK Be Eau de Toilette | Calvin Klein | DUVIDOSO | Reclassificado (SKU distinto) |
| Bvlgari Black Eau de Toilette | Bvlgari | DUVIDOSO | Reclassificado (SKU distinto) |

**5 marcados como DUVIDOSO:**

- Giorgio Armani Acqua di Giò Profumo (Giorgio Armani)
- Kenzo Flower by Kenzo Eau de Parfum (Kenzo)
- Ralph Lauren Woman by Ralph Lauren Eau de Parfum (Ralph Lauren)
- Calvin Klein CK Be Eau de Toilette (Calvin Klein)
- Bvlgari Black Eau de Toilette (Bvlgari)

## 3. Incompletos (só falta `ano`)

- Paco Rabanne Invictus Eau de Toilette (Paco Rabanne) — `invictus-paco-rabanne`
- Paco Rabanne 1 Million Eau de Toilette (Paco Rabanne) — `paco-rabanne-1-million-paco-rabanne`
- Paco Rabanne Invictus Victory Elixir (Paco Rabanne) — `invictus-victory-elixir-paco-rabanne`
- Paco Rabanne Lady Million Eau de Parfum (Paco Rabanne) — `paco-rabanne-lady-million-paco-rabanne`
