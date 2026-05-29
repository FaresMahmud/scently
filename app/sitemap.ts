// ============================================
// ARQUIVO: app/sitemap.ts
// O QUE FAZ: gera o sitemap.xml — top 500 perfumes + todas as marcas + páginas estáticas
// QUANDO MANDAR PRA IA: quando quiser adicionar novas páginas ao sitemap
// DEPENDE DE: lib/catalogoFragella, lib/utils
// ============================================

import type { MetadataRoute } from "next"
import { perfumesPopulares, marcasUnicas } from "@/lib/catalogoFragella"
import { slugify } from "@/lib/utils"

const BASE = "https://scently.com.br"

export default function sitemap(): MetadataRoute.Sitemap {
  // Páginas estáticas
  const estaticas: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/catalogo`,      lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/consultor`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/privacidade`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ]

  // Top 500 perfumes por popularidade
  const perfumes: MetadataRoute.Sitemap = perfumesPopulares(500).map(p => ({
    url: `${BASE}/perfume/${slugify(p.nome)}-${slugify(p.marca)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  // Páginas de marca
  const marcas: MetadataRoute.Sitemap = marcasUnicas().map(m => ({
    url: `${BASE}/marca/${slugify(m)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...estaticas, ...perfumes, ...marcas]
}
