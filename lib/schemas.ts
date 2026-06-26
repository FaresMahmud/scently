import { z } from "zod"
import { NextResponse } from "next/server"

/** Returns a 400 NextResponse from the first Zod issue. */
export function zodError(result: { success: false; error: z.ZodError }): NextResponse {
  const first = result.error.issues[0]
  return NextResponse.json(
    { error: first?.message ?? "Entrada inválida.", field: first?.path[0] as string | undefined },
    { status: 400 }
  )
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email:          z.string().email("E-mail inválido.").max(254, "E-mail muito longo."),
  // SECURITY: max(72) prevents bcrypt silent truncation attack
  // bcrypt only uses first 72 bytes — passwords differing only after byte 72 would match
  password:       z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres.")
    .max(72, "Senha deve ter no máximo 72 caracteres."),
  name:           z.string().min(2, "Nome deve ter no mínimo 2 caracteres.").max(50, "Nome muito longo.").trim(),
  turnstileToken: z.string().optional(),
})

export const loginSchema = z.object({
  email:          z.string().email("E-mail inválido.").max(254),
  password:       z.string().min(1, "Senha é obrigatória.").max(72, "Senha inválida."),
  turnstileToken: z.string().optional(),
})

export const magicLinkSchema = z.object({
  email:    z.string().email("E-mail inválido.").max(254),
  redirect: z.string().max(2048).optional(),
})

// ── Perfil ────────────────────────────────────────────────────────────────────

const perfumeStatusEnum = z.enum(["TENHO", "JA_SENTI_GOSTEI", "QUERO_EXPERIMENTAR"])

export const acervoPostSchema = z.object({
  perfumeId:   z.string().min(1).max(100),
  perfumeName: z.string().min(1).max(100),
  brand:       z.string().min(1).max(100),
  status:      perfumeStatusEnum,
  rating:      z.number().int().min(1).max(5).nullable().optional(),
  notes:       z.string().max(280).nullable().optional(),
})

const stringArrayField = z
  .array(z.string().max(50))
  .max(20)
  .optional()

export const preferenciasSchema = z.object({
  favoriteNotes:     stringArrayField,
  avoidNotes:        stringArrayField,
  favoriteOccasions: stringArrayField,
  favoriteFamilies:  stringArrayField,
  intensity:         z.enum(["LEVE", "MODERADO", "INTENSO", "QUALQUER"]).optional(),
})

// ── Scanner ───────────────────────────────────────────────────────────────────

const MAX_BASE64_CHARS = Math.ceil((10 * 1024 * 1024) / 3) * 4 // ~10 MB in base64

export const scannerSchema = z.object({
  imageBase64: z
    .string()
    .min(1, "Imagem obrigatória.")
    .max(MAX_BASE64_CHARS, "Imagem muito grande (máximo 10 MB)."),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"] as const, {
    error: "Tipo de imagem inválido. Use JPEG, PNG ou WebP.",
  }),
})

// ── Consultor ─────────────────────────────────────────────────────────────────

export const consultorSchema = z.object({
  respostas: z
    .record(z.string(), z.unknown())
    .refine(obj => Object.keys(obj).length > 0, { message: "Respostas não podem estar vazias." }),
  // Optional quiz mode — when present routes to the new 4-rec quiz engine
  mode: z.enum(["free", "premium"]).optional(),
})

// ── Consultor Chat ───────────────────────────────────────────────────────────

export const consultorChatSchema = z.object({
  mensagem: z.string().trim().min(1).max(1000),
  historico: z
    .array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(2000),
    }))
    .max(40)
    .default([]),
})
