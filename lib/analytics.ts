import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"

export type EventoTipo =
  | "quiz_start"
  | "quiz_question_answered"
  | "quiz_completed"
  | "quiz_result_shown"
  | "affiliate_click"
  | "scanner_used"
  | "user_session"
  | "acervo_item_added"
  | "perfume_viewed"
  | "catalog_search"
  | "premium_click"

export function trackEvent(
  tipo: EventoTipo,
  sessionId: string,
  dados?: Record<string, unknown>,
  userId?: string
): void {
  db.analyticsEvent
    .create({ data: { tipo, sessionId, userId: userId ?? null, dados: (dados ?? undefined) as Prisma.InputJsonValue | undefined } })
    .catch(() => null)
}
