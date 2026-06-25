// ============================================
// ARQUIVO: app/consultor/chat/page.tsx
// O QUE FAZ: página do chat aberto com a consultora de fragrâncias
// QUANDO MANDAR PRA IA: quando quiser mudar o layout da página ou o SEO
// DEPENDE DE: components/consultor/ChatConsultor.tsx
// ============================================

import type { Metadata } from "next"
import { siteMeta } from "@/config/site"
import ChatConsultor from "@/components/consultor/ChatConsultor"

export const metadata: Metadata = {
  title: "Consultora de fragrâncias",
  description: `Converse livremente sobre perfumes com a consultora de fragrâncias do ${siteMeta.nome}.`,
}

export default function PaginaChatConsultor() {
  return <ChatConsultor />
}
