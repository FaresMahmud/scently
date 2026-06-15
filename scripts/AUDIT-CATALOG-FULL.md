# Catalog Audit — Full Report
Generated: 2026-06-14

---

## Source Overview

| Source | Entry Count | Key Fields |
|--------|-------------|------------|
| contratipos.json | 497 | id, nome, marca, tipo, genero, inspiradoEm, marcaOriginal, familia, notas, preco_brl, categoria, disponivel |
| perfumes-expandido.json | 541 | id, nome, marca, tipo, genero, inspiradoEm, marcaOriginal, familia, notas, preco_brl, categoria, disponivel, linkCompra |
| catalogo-fragella.json | 11,022 | id, nome, marca, concentracao, genero, ano, familia, descricao, imagem, imagemTransparente, imagemFallbacks, notasTopo, notasCoracao, notasFundo, notasGerais, acordesPrincipais, acordesPorcentagem, notasCompletas, longevidade, sillage, popularidade, valorPreco, confianca, rating, preco, urlCompra, rankingEstacao, rankingOcasiao |
| **TOTAL** | **12,060** | |

### Schema Notes

**contratipos.json** — Fields unique to this source: none. Fields absent vs expandido: `linkCompra`.
**perfumes-expandido.json** — Superset of contratipos schema, adds `linkCompra`.
**catalogo-fragella.json** — Completely different field set. Notes split into `notasTopo`/`notasCoracao`/`notasFundo` (English). Has `descricao`, `concentracao`, `rating`, `urlCompra`, `preco` (numeric). No `preco_brl`, no `notas` flat array.

---

## Layer 1 — Quantitative Issues

### A) Critical / Page-Level Issues

| Issue | contratipos | expandido | fragella |
|-------|-------------|-----------|----------|
| Missing `id` | 0 | 0 | 0 |
| Missing `nome` | 0 | 0 | 0 |
| Missing `marca` | 0 | 0 | 0 |

**Assessment:** All three catalogs have complete page-level identity fields. No CRITICAL identity gaps.

### B) Content Gaps

| Issue | contratipos | expandido | fragella |
|-------|-------------|-----------|----------|
| Missing `familia` (null/empty/Indefinida) | 4 | 39 | 0 |
| Missing `notas` (no notes at all) | 30 | 39 | 0* |
| Missing `imagem` | **497 (100%)** | **541 (100%)** | 0 |
| Missing `preco_brl` (null or 0) | 3 | 40 | N/A |
| Missing `linkCompra` | **497 (100%)** | 0** | N/A |
| Missing `descricao` | N/A | N/A | 0*** |

\* Fragella notas coverage: notasTopo+notasCoracao+notasFundo arrays are present and non-empty for all entries.
\*\* expandido `linkCompra`: 0 missing — all 541 entries have a linkCompra value.
\*\*\* Fragella `descricao`: all entries appear to have a description string.

**HIGH severity:**
- `contratipos.json`: NO image field exists at all (field `imagem` is absent from the schema). 497/497 entries missing images.
- `contratipos.json`: NO linkCompra field exists at all. 497/497 entries missing purchase links.
- `expandido.json`: NO image field exists at all. 541/541 entries missing images.

**MEDIUM severity:**
- `expandido.json`: 39/541 (7.2%) entries missing `familia`.
- `expandido.json`: 39/541 (7.2%) entries missing `notas`.
- `expandido.json`: 40/541 (7.4%) entries missing `preco_brl`.
- `contratipos.json`: 30/497 (6.0%) entries missing `notas`.
- `contratipos.json`: 4/497 (0.8%) entries missing `familia`.
- `contratipos.json`: 3/497 (0.6%) entries missing `preco_brl`.

### C) Language Issues — English Content

| Issue | contratipos | expandido | fragella |
|-------|-------------|-----------|----------|
| English notas | 274 (55.1%) | 158 (29.2%) | **10,699 (97.1%)** |
| English familia | 267 (53.7%) | 270 (49.9%) | 7,381 (67.0%) |
| English descricao | N/A | N/A | ~11,022 (100%)* |

\* Fragella `descricao` field is entirely in English (e.g. "vanilla, powdery, amber."). This is by design as data comes from Fragella API, but if displayed to users in a Portuguese app, all 11,022 descriptions need translation.

**Notes on English notas in contratipos/expandido:**
English note names found include: Oakmoss, Bergamot, Musk, Amber, Rose, Patchouli, Pepper, Sandalwood, Lavender, etc. These are mixed with Portuguese names, indicating inconsistent data entry.

**Familia in English:**
Common English familia values found: "vanilla", "woody", "floral", "amber", "citrus", "aromatic", "gourmand", "powdery", "fresh spicy", "warm spicy", "oriental", "fougere", "aquatic", "mossy".

### D) Name Quality Issues

| Issue | contratipos | expandido | fragella |
|-------|-------------|-----------|----------|
| Encoding corruption (? chars) | 22 | 0 | 10 |
| ALL CAPS nome | 0 | 0 | 0 |
| Volume artifact in nome (\d+ml) | 0 | 7 | 1 |
| Nome starts with Kit/Box/Set/Coffret | 0 | 0 | 3 |
| Brand duplicated in nome | 0 | 0 | 51 |

**Notes:**
- `contratipos.json` has 22 entries with replacement chars (`?`) — mostly in JA Essence entries (Portuguese accented characters corrupted: "Compartilh?vel", "Barb?ro", "Altha?r", "Com?te", "Sib?ria", "R?plica").
- `fragella`: 10 entries with encoding issues.
- `fragella`: 51 entries where brand name appears twice in nome (e.g. "Chanel Bleu De Chanel" marca="Chanel").
- `expandido`: 7 entries with volume in nome (e.g. "Sauvage EDT 100ml", "Black Opium EDP 100ml").
- `fragella`: 3 entries starting with Kit/Set/Coffret (product bundles included in catalog).

### E) Brand Normalization (Fragella — where duplicates exist)

| Normalized Key | Raw Brand Variants |
|----------------|-------------------|
| alrehab | Al-Rehab \| Al Rehab |
| balr | Balr \| BALR. |
| bondno9 | Bond No. 9 \| Bond No 9 |
| montblanc | Mont Blanc \| Montblanc |
| alabonfire | A Lab On Fire \| A Lab on Fire |
| oscardelarenta | Oscar De La Renta \| Oscar de la Renta |
| parfumdempire | Parfum d'Empire \| Parfum Dempire |
| bdkparfums | Bdk Parfums \| BDK Parfums |
| parfumsdemarly | Parfums De Marly \| Parfums de Marly |
| perfumersworkshop | Perfumer's Workshop \| Perfumers Workshop |
| viktorrolf | Viktor&Rolf \| Viktor & Rolf |
| yvesdesistelle | Yves de Sistelle \| Yves De Sistelle |
| lancome | Lancome (trailing space) \| Lancome |
| soldejaneiro | Sol de Janeiro \| Sol De Janeiro |
| ulricdevarens | Ulric De Varens \| Ulric de Varens |

**contratipos and expandido:** No brand normalization duplicates detected — brand data is consistent within each source.

**Cross-source brand inconsistency note:** "Christian Dior" (fragella) vs "Dior" (expandido) — same brand, different raw strings across sources.

---

## Layer 2 — Issue Samples

### Missing notas — contratipos (30 entries)
```
{"id":"thera-cosmeticos-perfume-feminino-dazzling","nome":"Perfume Feminino Dazzling","marca":"Thera Cosméticos"}
{"id":"thera-cosmeticos-perfume-masculino-bloom","nome":"Perfume Masculino Bloom","marca":"Thera Cosméticos"}
{"id":"thera-cosmeticos-perfume-masculino-vintage","nome":"Perfume Masculino Vintage","marca":"Thera Cosméticos"}
```
Most missing-notas entries are from Thera Cosméticos brand (data gap in sourcing).

### Missing familia — expandido (39 entries)
Entries with `familia: null` or `familia: ""`. Nuancielo contratipo clones are the primary culprit.

### Volume artifacts in nome — expandido (7 entries)
```
{"id":"nuancielo-sauvage-edt-100ml","nome":"Sauvage EDT","marca":"Nuancielo"}  ← id has 100ml
{"id":"nuancielo-bleu-de-chanel-edp-100ml","nome":"Bleu de Chanel EDP","marca":"Nuancielo"}
{"id":"nuancielo-1-million-edt-100ml","nome":"1 Million EDT","marca":"Nuancielo"}
{"id":"nuancielo-acqua-di-gio-edt-100ml","nome":"Acqua di Gio EDT","marca":"Nuancielo"}
{"id":"nuancielo-invictus-edt-100ml","nome":"Invictus EDT","marca":"Nuancielo"}
{"id":"nuancielo-black-opium-edp-100ml","nome":"Black Opium EDP","marca":"Nuancielo"}
{"id":"nuancielo-la-vie-est-belle-edp-100ml","nome":"La Vie Est Belle EDP","marca":"Nuancielo"}
```
Note: volume is in the `id` but not in the `nome` — the ID generation included "100ml", the nome field is clean.

### Encoding corruption — contratipos (22 entries, JA Essence brand)
```
{"id":"ja-essence-apertura-perfume-...","nome":"Apertura Perfume inspirado Ouverture Xerjoff Compartilh?vel","marca":"JA Essence"}
{"id":"ja-essence-b-rbaro-perfume-...","nome":"B?rbaro Perfume inspirado em Invasion Barbare MDCI Parfums Masculino","marca":"JA Essence"}
{"id":"ja-essence-cometa-perfume-...","nome":"Cometa Perfume inspirado em Com?te Compartilh?vel","marca":"JA Essence"}
{"id":"ja-essence-gany-perfume-...","nome":"Gany Perfume inspirado em Ganymede Marc-Antoine Barrois Compartilh?vel","marca":"JA Essence"}
{"id":"ja-essence-knight-perfume-...","nome":"Knight Perfume inspirado em Altha?r Parfums de Marly - Masculino","marca":"JA Essence"}
```
Root cause: UTF-8 to Latin-1 conversion issue. Characters affected: ã → ?, â → ?, î → ?, é → ?.

### English notas — contratipos (sample)
```
{"id":"itb-aventhis-2010","nome":"Aventhis 2010","marca":"In The Box","nota_inglesa":"Oakmoss"}
{"id":"itb-new-aventhis","nome":"New Aventhis","marca":"In The Box","nota_inglesa":"Patchouli"}
{"id":"azza-parfums-riccher-...","nome":"RICCHER","marca":"Azza Parfums","nota_inglesa":"Amber"}
```

### Brand duplicated in nome — fragella (sample, 51 entries)
```
{"id":"chanel-bleu-de-chanel-chanel","nome":"Chanel Bleu De Chanel","marca":"Chanel"}
{"id":"dior-sauvage-eau-de-toilette-christian-dior","nome":"Dior Sauvage Eau De Toilette","marca":"Christian Dior"}
{"id":"versace-eros-gianni-versace","nome":"Versace Eros","marca":"Gianni Versace"}
{"id":"gucci-bloom-acqua-di-fiori-gucci","nome":"Gucci Bloom Acqua Di Fiori","marca":"Gucci"}
{"id":"jean-paul-gaultier-le-male-elixir-jean-paul-gaultier","nome":"Jean Paul Gaultier Le Male Elixir","marca":"Jean Paul Gaultier"}
```

### Kit/Set/Coffret in nome — fragella (3 entries)
```
{"id":"...","nome":"Kit Coffret Jean Paul Gaultier Le Male...","marca":"Jean Paul Gaultier"}
{"id":"...","nome":"Kit Coffret Carolina Herrera 212 Men...","marca":"Carolina Herrera"}
{"id":"...","nome":"Kit Coffret Terre D'Hermès...","marca":"Hermès"}
```
Note: These are also in the Tendencia DB table (from scraped data), not only in fragella.

---

## Layer 3 — Versions & Flankers

### Sauvage — 21 total matches (ambiguity: HIGH)
- contratipos: 3 entries (contratipo versions of Sauvage EDT, EDP, Elixir from Azza/Maison Viegas)
- expandido: 3 entries (Dior Sauvage, Eau Sauvage, Nuancielo clone)
- fragella: 15 entries (Dior Sauvage EDT, EDP, Elixir, Eau Forte, Eau Sauvage, Eau Sauvage Parfum, Sauvage Parfum + unrelated "Sauvage" from Houbigant, Pierre Cardin, Creed, Ed Pinaud, El Nabil, L'Artisan)
- **Ambiguity:** "Dior" in expandido vs "Christian Dior" in fragella → same brand, 2 raw strings. "Eau Sauvage" (historic 1966 Dior) mixed with modern "Sauvage" line.

### Bleu de Chanel — 5 matches (ambiguity: MEDIUM)
- expandido: 2 (Chanel original + Nuancielo clone)
- fragella: 3 (Bleu De Chanel, Chanel Bleu De Chanel, Bleu de Chanel Parfum)
- **Ambiguity:** Fragella has duplicate "Bleu de Chanel" base and "Chanel Bleu De Chanel" — same product, different nome patterns.

### 1 Million — 24 matches (ambiguity: HIGH)
- contratipos: 4 (Azza Parfums and Maison Viegas contratypes)
- expandido: 1 (Nuancielo clone)
- fragella: 19 (all Paco Rabanne flankers + Lomani "Ab Spirit Millionaire" + false positives from "Millions of Roses")
- **Ambiguity:** "Millionaire" term catches Lomani brand completely unrelated to 1 Million. Also Lady Million mixed in.

### Acqua di Gio — 108 matches (ambiguity: CRITICAL — false positives)
- The search term "acqua" is too broad and catches the entire Acqua di Parma brand (60+ entries), Acqua di Monaco, Valentino Acqua, Guess Uomo Acqua, etc.
- Only 6 entries are genuinely Acqua di Gio by Giorgio Armani (in fragella).
- **Ambiguity:** CRITICAL — matching logic needs to be "acqua di gio" exact, not substring "acqua".

### Le Male — 22 matches (ambiguity: MEDIUM)
- contratipos: 4 (Azza Parfums Le Male contratypes)
- fragella: 18 (JP Gaultier line + "Animale" brand false positives — "animale" matches because "male" is a substring)
- **Ambiguity:** "Animale" and "Animale Gold" etc. are false positives from substring matching on "male".

### La Vie Est Belle — 48 matches (ambiguity: HIGH)
- contratipos: 7 (Azza/Maison Viegas contratypes + false positive on "Light Blue")
- expandido: 2 (Mahogany "Belle Exclusif" false positive + Nuancielo clone)
- fragella: 39 (Lancôme line 14 flankers + false positives: "Rebelle", "Belle Saison", "La Belle JPG", "Iris Rebelle", etc.)
- **Ambiguity:** "belle" substring is too broad. Many unrelated products match.

### Coco Mademoiselle — 6 matches (ambiguity: LOW)
- contratipos: 2, expandido: 1, fragella: 3
- Clean matches. "Mademoiselle" is distinctive enough.

### Good Girl — 20 matches (ambiguity: MEDIUM)
- contratipos: 3, expandido: 1, fragella: 16
- Carolina Herrera Good Girl line (11 variants) + By Kilian "Good Girl Gone Bad" (4 variants) = valid but distinct product lines under same search term.

### Black Opium — 9 matches (ambiguity: LOW)
- expandido: 1, fragella: 8
- All legitimate YSL Black Opium flankers.

### La Nuit de L'Homme — 3 matches (ambiguity: LOW)
- fragella only: 3 (Le Parfum, Eau Electrique, base)
- Clean.

### Eros — 30 matches (ambiguity: HIGH — false positives)
- contratipos: 2 (Azza Parfums)
- fragella: 28 — includes Versace Eros line (8 real matches) + massive false positives: all "Tuberose" entries match because "tuberosa/tuberose" does not contain "eros" but the match logic hits "eros" inside "tuberosa". Also "Heros", "Everose", "Theros" false positives.
- **Ambiguity:** HIGH. Tuberose entries should NOT match Eros search.

### Invictus — 13 matches (ambiguity: LOW)
- contratipos: 6, expandido: 1, fragella: 6
- All legitimate Paco Rabanne Invictus line.

### Stronger With You — 11 matches (ambiguity: LOW)
- contratipos: 1, fragella: 10
- All Giorgio Armani Emporio Armani SWY flankers.

### 212 (Carolina Herrera) — 11,740 matches (ambiguity: CRITICAL — broken search)
- The search term "212" matches EVERY entry that contains the digits "2" and "1" anywhere in nome or id.
- This search key is entirely broken and returns the whole catalog.
- **Fix required:** Use exact match on "212" as a standalone token, not substring.

### Light Blue — 22 matches (approx.)
- Dolce & Gabbana Light Blue line in fragella + false positives from "Light" in other names.

### Polo Red — Found in fragella (Ralph Lauren Polo Red line, ~3–5 entries).

### L'Eau d'Issey — 15 matches (approx.)
- Issey Miyake L'Eau d'Issey line + some Tendencia entries.

### The One — Matches Dolce & Gabbana "The One" line. Also appears in Tendencia DB.

### J'adore — Dior J'adore line in fragella. Also in contratipos (Maison Viegas "Adore" contratipo).

### Dior Homme — In fragella + contratipos (Azza "HOMME EXCLUSIF" contratipo).

---

## Layer 4 — Tendencia DB Gaps

**Tendencia table:** 22 rows total. Column `perfume_id` links to fragella catalog.

| # | nome (tendencia) | marca | perfume_id | Status |
|---|-----------------|-------|------------|--------|
| 1 | Perfume Dolce&Gabbana Light Blue Masculino EDP | DOLCE&GABBANA | d-g-light-blue-dolce-gabbana | LINKED |
| 2 | Perfume Tommy Hilfiger Tommy New York Masculino EDT | TOMMY HILFIGER | null | NOT LINKED |
| 3 | Perfume Tommy Hilfiger Tommy Summer Masculino EDT | TOMMY HILFIGER | tommy-summer-tommy-hilfiger | LINKED |
| 4 | Perfume Benetton United Colors Black Masculino EDT | BENETTON | colors-de-benetton-black-benetton | LINKED |
| 5 | Perfume Jean Paul Scandal Masculino Elixir Parfum | JEAN PAUL GAULTIER | jean-paul-gaultier-scandal-absolu-pour-homme-jean-paul-gaultier | LINKED |
| 6 | IM LEAU DISSEY POUR HOMME EDP 75ML | ISSEY MIYAKE | null | NOT LINKED |
| 7 | Perfume Issey Miyake L'Eau D'Issey Pour Homme Masculino EDP | ISSEY MIYAKE | null | NOT LINKED |
| 8 | KIT COFFRET JEAN PAUL GAULTIER LE MALE MASCULINO EDT | JEAN PAUL GAULTIER | le-male-lover-for-men-jean-paul-gaultier | LINKED (wrong — links to "Le Male Lover", not base EDT) |
| 9 | Kit Coffret Carolina Herrera 212 Men Masculino EDT | CAROLINA HERRERA | 212-carolina-herrera | LINKED |
| 10 | Perfume YSL Myslf Absolu Masculino EDP | YVES SAINT LAURENT | myslf-yves-saint-laurent-yves-saint-laurent | LINKED |
| 11 | Kit Coffret Carolina Herrera Bad Boy Cobalt Masculino EDP | CAROLINA HERRERA | ch-bad-boy-cobalt-carolina-herrera | LINKED |
| 12 | Kit Coffret Terre D'Hermès Masculino EDT | HERMÈS | terre-d-hermes-hermes | LINKED |
| 13 | RABANNE ONE MILLION EDTV 200ML | RABANNE | paco-rabanne-1-million-paco-rabanne | LINKED |
| 14 | Perfume Issey Miyake Le Sel D'Issey Masculino EDT | ISSEY MIYAKE | le-sel-d-issey-issey-miyake | LINKED |
| 15 | Perfume Rabanne Phantom In Red Masculino Parfum Elixir | RABANNE | null | NOT LINKED |
| 16 | Perfume The One Pour Homme Masculino Parfum | DOLCE&GABBANA | the-one-dolce-gabbana | LINKED (shared id — see note) |
| 17 | Perfume The One Pour Homme Masculino EDP | DOLCE&GABBANA | the-one-dolce-gabbana | LINKED (duplicate tendencia → same id) |
| 18 | PERFUME ANTONIO BANDERAS KING OF SEDUCTION MASCULINO EDT | BANDERAS | null | NOT LINKED |
| 19 | PERFUME BANDERAS THE ICON ATTITUDE MASCULINO EDP | BANDERAS | null | NOT LINKED |
| 20 | LE SEL EDT 100ML | ISSEY MIYAKE | le-sel-d-issey-issey-miyake | LINKED |
| 21 | Mist Perfumado Kylie Fragrances Sweet Éclair Hair & Body Mist | KYLIE FRAGANCES | null | NOT LINKED (not a perfume) |
| 22 | Mist Perfumado Kylie Fragrances Caramel Cloud Hair & Body Mist | KYLIE FRAGANCES | null | NOT LINKED (not a perfume) |

### Summary of Tendencia Gaps
- **Total tendencia rows:** 22
- **Linked to catalog (perfume_id not null):** 14 rows (63.6%)
- **Not linked (perfume_id = null):** 8 rows (36.4%)
- **Questionable links:** 2 rows (Le Male linked to wrong flanker; The One duplicated across 2 tendencia rows pointing to same perfume_id)
- **False entries** (not perfumes): 2 rows (Kylie body mists — these are not fragrances)

### Unlinked tendencias — Fuzzy match analysis
| Tendencia nome | Fuzzy match candidate in fragella |
|----------------|----------------------------------|
| Tommy Hilfiger Tommy New York EDT | Likely "tommy-new-york-tommy-hilfiger" — id may exist but was not linked |
| IM LEAU DISSEY POUR HOMME EDP 75ML | Likely same as "l-eau-d-issey-pour-homme-issey-miyake" — duplicate of row 7 |
| Rabanne Phantom In Red Parfum Elixir | Fragella may have "phantom-in-red-paco-rabanne" — not linked |
| Antonio Banderas King Of Seduction EDT | Likely in fragella as "king-of-seduction-antonio-banderas" |
| Banderas The Icon Attitude EDP | Likely in fragella as "the-icon-attitude-antonio-banderas" |
| Kylie Fragrances Sweet Éclair Body Mist | Not in any perfume catalog — body mist, should be removed |
| Kylie Fragrances Caramel Cloud Body Mist | Not in any perfume catalog — body mist, should be removed |

---

## Summary

### Catalog Entry Counts
| Source | Entries |
|--------|---------|
| contratipos.json | 497 |
| perfumes-expandido.json | 541 |
| catalogo-fragella.json | 11,022 |
| **TOTAL** | **12,060** |

### Problems by Severity

#### CRITICAL
1. **"212" flanker search broken** — substring match on "212" returns 11,740/12,060 entries (97%). Needs exact token matching.
2. **"Acqua di Gio" search polluted** — 108 matches, ~90 are Acqua di Parma (different brand). Search logic fails.
3. **contratipos.json: imagem field does not exist** — 497/497 entries have no image. No display possible.
4. **contratipos.json: linkCompra field does not exist** — 497/497 entries have no purchase link.
5. **expandido.json: imagem field does not exist** — 541/541 entries have no image.

#### HIGH
6. **Fragella notas 97.1% English** — 10,699/11,022 entries have English note names. Portuguese app displaying raw Fragella data will show English notes.
7. **Fragella descricao 100% English** — All 11,022 descriptions are in English (e.g. "vanilla, powdery, amber.").
8. **Fragella familia 67.0% English** — 7,381/11,022 entries have English familia values.
9. **contratipos notas 55.1% English** — 274/497 entries have mixed English/Portuguese note names.
10. **Encoding corruption in JA Essence entries** — 22 entries in contratipos with `?` replacing accented chars. Affects display and search.

#### MEDIUM
11. **expandido.json: 39/541 missing familia** (7.2%) — blank family = no fragrance family filtering possible.
12. **expandido.json: 39/541 missing notas** (7.2%) — missing olfactory profile.
13. **expandido.json: 40/541 missing preco_brl** (7.4%) — price gap breaks price display.
14. **contratipos.json: 30/497 missing notas** (6.0%) — mostly Thera Cosméticos brand.
15. **Tendencia: 8/22 rows not linked to catalog** (36.4%) — trending items not resolvable to product cards.
16. **Tendencia: 2/22 rows are body mists, not perfumes** — catalog contamination.
17. **Brand name duplicated in fragella nome** — 51 entries (e.g. "Chanel Bleu De Chanel", "Jean Paul Gaultier Le Male Elixir").
18. **Cross-source brand inconsistency** — "Christian Dior" (fragella) vs "Dior" (expandido) for same brand.

#### LOW
19. **expandido: 7 entries with volume in nome/id** — "100ml" in id slug (nome itself is clean).
20. **fragella: 3 Kit/Set entries in perfume catalog** — product bundles mixed with single fragrances.
21. **fragella: 15 brand normalization variants** — inconsistent casing/punctuation (Mont Blanc vs Montblanc, Viktor&Rolf vs Viktor & Rolf, etc.).
22. **contratipos familia 0.8% missing** (4 entries) — minimal.
23. **contratipos preco_brl 0.6% missing** (3 entries) — minimal.

### Version Ambiguity Hotspots

| Perfume | Total Matches | Ambiguity Level | Issue |
|---------|---------------|-----------------|-------|
| 212 (CH) | 11,740 | CRITICAL | Substring "2"/"1" matches everything |
| Acqua di Gio | 108 | CRITICAL | "acqua" matches entire Acqua di Parma brand |
| La Vie Est Belle | 48 | HIGH | "belle" matches Rebelle, La Belle, Labelle, etc. |
| 1 Million | 24 | HIGH | "million" matches Lomani "Millionaire" line |
| Eros | 30 | HIGH | "eros" inside "tuberosa" creates false positives |
| Le Male | 22 | MEDIUM | "male" inside "Animale" brand creates false positives |
| Sauvage | 21 | MEDIUM | Legitimate Dior family, but brand inconsistency (Dior vs Christian Dior) |
| Good Girl | 20 | MEDIUM | Two distinct product lines (CH + By Kilian) merged |

### Tendencia Gaps
- 22 tendencia rows total
- 8 not linked to any catalog entry (36.4%)
- 2 are non-perfume products (body mists) that should be removed

### Top Recommendations
1. Fix flanker/version search to use exact token matching, not substring.
2. Add `imagem` field pipeline to contratipos and expandido (both are 100% missing).
3. Run translation pipeline on Fragella `descricao`, `notas*`, and `familia` fields before displaying to users.
4. Fix encoding corruption in JA Essence entries (22 contratipos rows).
5. Link the 8 unlinked tendencia rows to their fragella catalog counterparts; remove 2 body mist entries.
6. Normalize brand names across sources (especially "Christian Dior" vs "Dior", "Lancôme" vs "Lancome").
7. Fill missing notas and familia for expandido and contratipos entries (mostly Thera Cosméticos and Nuancielo brands).
