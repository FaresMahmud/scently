import "server-only"
import { db } from "@/lib/db"

export interface EditorialContent {
  comoCheira:     string
  paraQuem:       string
  quandoUsar:     string
  comoSeComporta: string
}

/**
 * Returns editorial content for a perfume, or null if none exists.
 * Only the ~116 enriched perfumes have editorial rows — callers must
 * handle the null case by falling back to the existing layout.
 */
export async function getEditorialContent(perfumeId: string): Promise<EditorialContent | null> {
  try {
    const row = await db.perfumeEditorial.findUnique({
      where: { perfumeId },
      select: { comoCheira: true, paraQuem: true, quandoUsar: true, comoSeComporta: true },
    })
    return row ?? null
  } catch {
    return null
  }
}
