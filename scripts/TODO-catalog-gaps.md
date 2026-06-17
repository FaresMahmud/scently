# TODO — Catalog Gaps & Enrichment Priorities

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
