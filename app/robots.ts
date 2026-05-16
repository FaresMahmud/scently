// ============================================
// ARQUIVO: app/robots.ts
// O QUE FAZ: gera o robots.txt — diz ao Google o que pode e não pode ser indexado
// QUANDO MANDAR PRA IA: quando quiser bloquear páginas específicas dos mecanismos de busca
// DEPENDE DE: config/site.ts
// ============================================

import type { MetadataRoute } from "next"
import { siteMeta } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Bloqueia a API do consultor — não precisa ser indexada
      disallow: "/api/",
    },
    sitemap: `${siteMeta.url}/sitemap.xml`,
  }
}
