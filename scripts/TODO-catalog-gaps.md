# TODO — Catalog Gaps & Enrichment Priorities

## PRIORIDADE ALTA — escolherMelhorMatch confunde fragrâncias homônimas/prefixos (2026-06-22)

O algoritmo `escolherMelhorMatch` (auditoria de catálogo, scripts/_audit-fase1b-v2.mjs) e o
`rankearCandidatoGemini` (app/api/cron/tendencias/route.ts) podem escolher o candidato errado
quando dois perfumes compartilham nome parcial mas são fragrâncias completamente diferentes.

Casos documentados:
- **"CK Be"** → matchou com **"Obsessed"** (Calvin Klein) — fragrâncias completamente diferentes,
  sem relação de nome real além de pertencerem à mesma marca.
- **"Bvlgari Black"** (1998, unissex icônico) → matchou com **"Man in Black"** (2014, perfil
  totalmente diferente) — anos e perfis olfativos divergentes.
- **"Sauvage"** (2015, moderno) → matchou com **"Eau Sauvage"** (1966) — 49 anos de diferença,
  fragrâncias completamente distintas. (Esse caso específico já foi corrigido no cron via
  `rankearCandidatoGemini` com penalização de prefixos antigos — ver commit `0e5622e` — mas o
  princípio geral do problema permanece para outros pares homônimos não cobertos pela lista de
  prefixos conhecidos.)

**Risco:** o scanner pode identificar o perfume errado em produção, e o cron de tendências pode
direcionar para a página de detalhe errada.

**Próxima sessão:** revisitar `rankearCandidatoGemini` (route.ts) com testes adicionais de
fragrâncias homônimas/prefixos — provavelmente precisa de uma lista curada de pares conhecidos
"parecem iguais mas são diferentes" (CK Be/Obsessed, Bvlgari Black/Man in Black, etc.) além da
heurística de prefixo antigo já existente, já que esses dois casos não compartilham prefixo
algum — são apenas nomes de marca cujos produtos têm pouca relação textual mas caíram no mesmo
grupo de candidatos fuzzy.

**CONFIRMADO (2026-06-22, Fase 2 da auditoria de catálogo):** "CK Be" e "Acqua di Giò Profumo"
JÁ EXISTIAM corretamente em `catalogo-fragella.json` (ids `ck-be-calvin-klein` e
`acqua-di-gio-profumo-giorgio-armani`) — o algoritmo de matching da auditoria escolheu o
candidato errado (`obsessed-calvin-klein` no caso do CK Be) quando o candidato certo estava
disponível no mesmo pool. Isso prova que o bug é de **ranking de candidatos**, não de
**cobertura de catálogo** — adicionar uma entrada nova para esses dois casos teria criado uma
duplicata (e de fato criou — removida em seguida). Ao corrigir `rankearCandidatoGemini`/
`escolherMelhorMatch`, usar esses dois pares como casos de teste de regressão.

**Achado relacionado (não corrigido nesta sessão):** existem pelo menos 2 IDs duplicados entre
`perfumes-expandido.json` e `catalogo-fragella.json`, pré-existentes a esta sessão (não
introduzidos por ela): `jimmy-choo-jimmy-choo` e `chanel-gabrielle-chanel`. Precisa de
investigação separada pra decidir qual fonte é a autoritativa e remover a duplicata.

**RESOLVIDO (2026-06-23):** `buscarNoCatalogo` (lib/catalogoFragella.ts) foi reescrita com cascade
de 3 tiers + `normalizarMarca` (aliases CK/Calvin Klein, YSL/Yves Saint Laurent, Christian
Dior/Dior, D&G/Dolce Gabbana) + gender guard reusando `lib/generoGuard.ts`. Os casos CK Be e
Acqua di Giò Profumo agora resolvem corretamente — confirmado em dry-run com 10/10 testes.
`detectarGenero`/`mapearGeneroFragella`/`removerSufixoGenero` foram extraídos de `route.ts` para
`lib/generoGuard.ts` (módulo compartilhado, sem mudança de lógica).

**Novo achado durante o dry-run da reescrita:** `catalogo-fragella.json` tem uma duplicata real
— `dior-sauvage-christian-dior` (nome "Dior Sauvage") e
`dior-sauvage-eau-de-toilette-christian-dior` (nome "Dior Sauvage Eau De Toilette") têm
concentração, gênero e ano idênticos — são o mesmo SKU, provavelmente de dois scrapes
diferentes do mesmo produto. Não é bug de matching, é dado duplicado na fonte. Fica pra dedup
numa sessão futura de limpeza de catálogo.

---

## HIGH PRIORITY — Tendências automáticas (Gemini algorithm)

**Enriquecer os 11.000+ perfumes restantes do catálogo que não têm PerfumeEditorial linkado.**

Impacto direto no algoritmo de tendências automáticas: candidatos com `PerfumeEditorial` ganham
+10 pontos no score composto, sendo priorizados sobre perfumes sem editorial. Quanto mais perfumes
enriquecidos existirem, mais opções de qualidade o algoritmo tem para escolher nos top 5 semanais.

Prioridade de enriquecimento:
1. Perfumes das marcas mais frequentes nas tendências (Dior, Chanel, YSL, Tom Ford, Armani, Lancôme)
2. Perfumes com alto rating/popularidade no catálogo (`perfumesPopulares()`)
3. Clássicos masculinos e femininos (Sauvage, Bleu de Chanel, La Vie est Belle, etc.)

---

# TODO — Catalog Gaps (Tendencia entries with no catalog match)

These perfumes exist in the `tendencias` DB table but have no matching entry
in any of our three catalogs (catalogo-fragella, contratipos, perfumes-expandido).

Impact: the /tendencias page may link to a /perfume/[id] page that 404s,
or fall back to a generic "not found" state when the user taps on the card.

Each entry below was discovered during the editorial enrichment run (2026-06-14)
when the fuzzy fallback (buscarPorNomeMarca) also failed to recover them.

---

## Entries to fix

| # | perfume_id (in DB) | nome (from DB) | marca (from DB) | Likely fix |
|---|---|---|---|---|
| 1 | perfume-tommy-hilfiger-tommy-new-york-masculino-eau-de-toilette-tommy-hilfiger | Perfume Tommy Hilfiger Tommy New York Masculino Eau de Toilette | TOMMY HILFIGER | Add "Tommy New York" to fragella catalog or expandido |
| 2 | perfume-issey-miyake-leau-dissey-pour-homme-masculino-eau-de-parfum-issey-miyake | Perfume Issey Miyake L'Eau D'Issey Pour Homme Masculino Eau de Parfum | ISSEY MIYAKE | Catalog has "L'Eau d'Issey pour Homme" (EDT) but not EDP variant — add EDP entry |
| 3 | im-leau-dissey-pour-homme-edp-75ml-issey-miyake | IM LEAU DISSEY POUR HOMME EDP 75ML | ISSEY MIYAKE | Duplicate of #2 (different SKU slug for same perfume) — deduplicate in DB |
| 4 | perfume-rabanne-phantom-in-red-masculino-parfum-elixir-rabanne | Perfume Rabanne Phantom In Red Masculino Parfum Elixir | RABANNE | Add "Phantom In Red" to catalog (Rabanne 2024 release) |
| 5 | perfume-antonio-banderas-king-of-seduction-masculino-eau-de-toilette-banderas | PERFUME ANTONIO BANDERAS KING OF SEDUCTION MASCULINO EAU DE TOILETTE | BANDERAS | Scraper uses "BANDERAS" as marca; catalog uses "Antonio Banderas" — fix scraper marca normalization OR add entry |
| 6 | perfume-banderas-the-icon-attitude-masculino-eau-de-parfum-banderas | PERFUME BANDERAS THE ICON ATTITUDE MASCULINO EAU DE PARFUM | BANDERAS | Same brand normalization issue as #5 |
| 7 | mist-perfumado-kylie-fragrances-sweet-eclair-hair-body-mist-kylie-fragances | Mist Perfumado Kylie Fragrances Sweet Éclair Hair & Body Mist | KYLIE FRAGANCES | Body mist — not in fragella (niche/beauty brand). Decide: add to expandido or exclude from tendencias |
| 8 | mist-perfumado-kylie-fragrances-caramel-cloud-hair-body-mist-kylie-fragances | Mist Perfumado Kylie Fragrances Caramel Cloud Hair & Body Mist | KYLIE FRAGANCES | Same as #7 |
| 9 | _(no DB entry)_ | Light Blue Pour Homme | Dolce & Gabbana | Classic men's flanker not in catalog; only limited-edition variants (Discover Vulcano, Living Stromboli) exist. Add canonical entry to perfumes-expandido.json |

---

## Root causes

1. **Brand name normalization**: scraper stores "BANDERAS" / "KYLIE FRAGANCES" but catalog uses
   canonical "Antonio Banderas" / "Kylie Fragrances". Fix: normalize marca in scraper OR add
   a brand alias map in the catalog lookup.

2. **Missing variants**: EDP variants of established fragrances (L'Eau d'Issey EDP) not in fragella
   catalog (which tends to cover the canonical EDT). Fix: add variants to perfumes-expandido.json.

3. **New releases**: Phantom In Red (Rabanne 2024) not yet in catalog. Fix: run catalog expansion
   script or add manually.

4. **Out-of-scope products**: Kylie Fragrances body mists are not fine fragrances.
   Fix: add a scraper filter to exclude "mist" / "body spray" product types from tendencias.

---

## How to act on this

- Short-term: entries 5–6 (Banderas) can likely be recovered by adding brand aliases
  to the fuzzy lookup. Entries 7–8 (Kylie mists) should be excluded from tendencias scraping.
- Medium-term: add missing entries (1, 2, 4) to perfumes-expandido.json via the catalog:expand script.
- Entry 3 is a DB duplicate — run a dedup query on the tendencias table.
