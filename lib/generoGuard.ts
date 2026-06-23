// ============================================
// ARQUIVO: lib/generoGuard.ts
// O QUE FAZ: detecta e mapeia gênero de fragrâncias a partir de texto livre ou do
//            campo `genero` do catálogo Fragella — usado pra evitar que matching
//            fuzzy devolva o gênero errado (ex: "Light Blue Pour Femme" → masculino)
// QUANDO MANDAR PRA IA: quando quiser ajustar tokens de gênero reconhecidos
// EXTRAÍDO DE: app/api/cron/tendencias/route.ts (2026-06-23) — lógica idêntica,
//              só movida pra ser reusável em lib/catalogoFragella.ts também
// ============================================

// Remove sufixos de gênero do nome — "212 VIP Men" → "212 VIP", "Light Blue Pour Homme" → "Light Blue"
export function removerSufixoGenero(nome: string): string {
  return nome
    .replace(/\b(pour homme|pour femme|for men|for women|men|women|homme|femme)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Detecta gênero por tokens no texto (testa feminino ANTES de masculino —
// "for women" contém "men", teste inverso daria falso positivo masculino)
export function detectarGenero(texto: string): "masculino" | "feminino" | "neutro" {
  const t = texto.toLowerCase()
  if (/\b(pour femme|for women|femme|women|feminino)\b/.test(t)) return "feminino"
  if (/\b(pour homme|for men|homme|men|masculino)\b/.test(t))    return "masculino"
  return "neutro"
}

// Mapeia campo `genero` do catálogo Fragella para o vocabulário interno.
// Valores conhecidos no catálogo: 'women', 'men', 'Men' (typo), 'unisex', ''
export function mapearGeneroFragella(genero: string): "masculino" | "feminino" | "neutro" {
  const g = (genero ?? "").toLowerCase().trim()
  if (g === "women")              return "feminino"
  if (g === "men")                return "masculino"
  if (g === "unisex" || g === "") return "neutro"
  return "neutro" // qualquer valor inesperado → neutro (conservador)
}
