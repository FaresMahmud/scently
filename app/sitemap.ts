// ============================================
// ARQUIVO: app/sitemap.ts
// O QUE FAZ: gera o sitemap.xml automaticamente para o Google indexar o site
// QUANDO MANDAR PRA IA: quando quiser adicionar novas páginas ao sitemap
// DEPENDE DE: config/site.ts, lib/mockData.ts
// ============================================

import type { MetadataRoute } from "next"
import { siteMeta } from "@/config/site"
import { PERFUMES_MOCK } from "@/lib/mockData"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteMeta.url

  // Páginas estáticas do site
  const paginasEstaticas: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/consultor`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ]

  // Página de cada perfume do catálogo
  const paginasPerfumes: MetadataRoute.Sitemap = PERFUMES_MOCK.map((perfume) => ({
    url: `${base}/perfume/${perfume.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...paginasEstaticas, ...paginasPerfumes]
}
