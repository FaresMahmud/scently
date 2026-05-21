// ============================================
// ARQUIVO: lib/utils.ts
// O QUE FAZ: funções utilitárias compartilhadas
// QUANDO MANDAR PRA IA: quando precisar de novas utilities
// DEPENDE DE: nada
// ============================================

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
