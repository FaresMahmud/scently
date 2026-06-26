"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Turnstile from "@/components/auth/Turnstile"

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  global?: string
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        animation: "spin 0.6s linear infinite",
      }}
    />
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.08-1.81 2.72v2.26h2.92c1.71-1.57 2.69-3.88 2.69-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.55-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72c-.18-.55-.28-1.13-.28-1.72s.1-1.17.28-1.72V4.95H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  )
}

function DividerOu() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "13px", margin: "34px 0" }}>
      <span style={{ flex: 1, height: "1px", backgroundColor: "var(--cor-borda)" }} />
      <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.72rem", letterSpacing: "0.1em", color: "var(--cor-texto-suave)" }}>OU</span>
      <span style={{ flex: 1, height: "1px", backgroundColor: "var(--cor-borda)" }} />
    </div>
  )
}

export default function PaginaCadastro() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get("redirect") ?? "/"

  const [mode,      setMode]      = useState<"senha" | "magico">("senha")
  const [name,      setName]      = useState("")
  const [email,     setEmail]     = useState("")
  const [password,  setPassword]  = useState("")
  const [errors,    setErrors]    = useState<FieldErrors>({})
  const [loading,   setLoading]   = useState(false)
  const [turnToken, setTurnToken] = useState<string | null>(null)

  const [magicEmail,   setMagicEmail]   = useState("")
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicSent,    setMagicSent]    = useState(false)
  const [magicError,   setMagicError]   = useState<string | null>(null)

  const onTurnstile = useCallback((t: string) => setTurnToken(t), [])

  async function handleMagicLink(ev: React.FormEvent) {
    ev.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(magicEmail)) {
      setMagicError("E-mail inválido.")
      return
    }
    setMagicLoading(true)
    setMagicError(null)
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: magicEmail, redirect: redirectTo }),
      })
      if (res.status === 429) {
        const { error } = await res.json()
        setMagicError(error)
        return
      }
      setMagicSent(true)
    } catch {
      setMagicError("Erro de conexão. Tente novamente.")
    } finally {
      setMagicLoading(false)
    }
  }

  function validate(): boolean {
    const e: FieldErrors = {}
    if (!name.trim()) e.name = "Nome é obrigatório."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "E-mail inválido."
    if (password.length < 8) e.password = "Senha deve ter no mínimo 8 caracteres."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, turnstileToken: turnToken ?? undefined }),
      })

      if (res.status === 429) {
        const { error } = await res.json()
        setErrors({ global: error })
        return
      }

      if (res.status === 409) {
        setErrors({ email: "Este e-mail já está cadastrado." })
        return
      }

      if (!res.ok) {
        const { error } = await res.json()
        setErrors({ global: error ?? "Erro ao criar conta." })
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setErrors({ global: "Erro de conexão. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontFamily: "var(--fonte-corpo)",
    fontSize: "16px",
    color: "var(--cor-texto)",
    backgroundColor: "var(--cor-card)",
    border: "1px solid var(--cor-borda)",
    borderRadius: "var(--raio-borda-suave)",
    padding: "0 21px",
    height: "44px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--fonte-corpo)",
    fontSize: "0.78rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    color: "var(--cor-texto-suave)",
    display: "block",
    marginBottom: "8px",
  }

  const errorStyle: React.CSSProperties = {
    fontFamily: "var(--fonte-corpo)",
    fontSize: "0.78rem",
    color: "#C0392B",
    marginTop: "6px",
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main
        style={{
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "var(--cor-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "55px 21px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Header */}
          <p
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontSize: "0.78rem",
              letterSpacing: "0.22em",
              color: "var(--cor-destaque)",
              marginBottom: "13px",
            }}
          >
            nozze
          </p>
          <h1
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontWeight: 300,
              fontSize: "42px",
              lineHeight: 1.1,
              marginBottom: "8px",
            }}
          >
            Criar conta
          </h1>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "16px",
              color: "var(--cor-texto-suave)",
              marginBottom: "34px",
            }}
          >
            Sem cadastro obrigatório. Resultado em 2 minutos.
          </p>

          {/* Google */}
          <a
            href={`/api/auth/google${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            style={{
              width: "100%",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "13px",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--cor-texto)",
              backgroundColor: "var(--cor-card)",
              border: "1px solid var(--cor-borda)",
              borderRadius: "var(--raio-borda)",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            <GoogleIcon />
            Continuar com Google
          </a>

          <DividerOu />

          {/* Mode tabs */}
          <div style={{ display: "flex", gap: "21px", marginBottom: "21px" }}>
            <button
              type="button"
              onClick={() => setMode("senha")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                paddingBottom: "8px",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.82rem",
                fontWeight: 500,
                letterSpacing: "0.05em",
                color: mode === "senha" ? "var(--cor-destaque)" : "var(--cor-texto-suave)",
                borderBottom: mode === "senha" ? "2px solid var(--cor-destaque)" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              SENHA
            </button>
            <button
              type="button"
              onClick={() => setMode("magico")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                paddingBottom: "8px",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.82rem",
                fontWeight: 500,
                letterSpacing: "0.05em",
                color: mode === "magico" ? "var(--cor-destaque)" : "var(--cor-texto-suave)",
                borderBottom: mode === "magico" ? "2px solid var(--cor-destaque)" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              LINK MÁGICO
            </button>
          </div>

          {/* Global error */}
          {errors.global && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "var(--raio-borda-suave)",
                padding: "13px 21px",
                marginBottom: "21px",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.85rem",
                color: "#C0392B",
              }}
            >
              {errors.global}
            </div>
          )}

          {mode === "senha" && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div style={{ marginBottom: "21px" }}>
              <label htmlFor="name" style={labelStyle}>NOME</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.name ? "#EF4444" : "var(--cor-borda)",
                }}
                disabled={loading}
              />
              {errors.name && <p style={errorStyle}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: "21px" }}>
              <label htmlFor="email" style={labelStyle}>E-MAIL</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.email ? "#EF4444" : "var(--cor-borda)",
                }}
                disabled={loading}
              />
              {errors.email && <p style={errorStyle}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: "34px" }}>
              <label htmlFor="password" style={labelStyle}>SENHA</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.password ? "#EF4444" : "var(--cor-borda)",
                }}
                disabled={loading}
              />
              {errors.password && <p style={errorStyle}>{errors.password}</p>}
              <p
                style={{
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.72rem",
                  color: "var(--cor-texto-suave)",
                  marginTop: "6px",
                }}
              >
                Mínimo 8 caracteres.
              </p>
            </div>

            {/* Turnstile */}
            <div style={{ marginBottom: "21px" }}>
              <Turnstile onVerify={onTurnstile} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.875rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
                backgroundColor: loading ? "var(--cor-destaque-hover)" : "var(--cor-destaque)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--raio-borda)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                opacity: loading ? 0.85 : 1,
              }}
            >
              {loading ? <><Spinner /> Criando conta…</> : "Criar conta"}
            </button>

            {/* Privacy note */}
            <p
              style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.72rem",
                color: "var(--cor-texto-suave)",
                textAlign: "center",
                marginTop: "13px",
                lineHeight: 1.5,
              }}
            >
              Ao criar conta, você concorda com os{" "}
              <Link href="/termos" style={{ color: "var(--cor-destaque)" }}>
                termos de uso
              </Link>{" "}
              e{" "}
              <Link href="/privacidade" style={{ color: "var(--cor-destaque)" }}>
                política de privacidade
              </Link>
              .
            </p>
          </form>
          )}

          {mode === "magico" && (
            magicSent ? (
              <div
                style={{
                  backgroundColor: "var(--cor-card)",
                  border: "1px solid var(--cor-borda)",
                  borderRadius: "var(--raio-borda-suave)",
                  padding: "21px",
                  fontFamily: "var(--fonte-corpo)",
                  fontSize: "0.875rem",
                  color: "var(--cor-texto)",
                  lineHeight: 1.5,
                }}
              >
                Enviamos um link para <strong>{magicEmail}</strong>. Abra seu e-mail e clique no link para entrar. Ele expira em 15 minutos.
              </div>
            ) : (
              <form onSubmit={handleMagicLink} noValidate>
                <div style={{ marginBottom: "21px" }}>
                  <label htmlFor="magicEmail" style={labelStyle}>E-MAIL</label>
                  <input
                    id="magicEmail"
                    type="email"
                    autoComplete="email"
                    value={magicEmail}
                    onChange={e => setMagicEmail(e.target.value)}
                    style={{
                      ...inputStyle,
                      borderColor: magicError ? "#EF4444" : "var(--cor-borda)",
                    }}
                    disabled={magicLoading}
                  />
                  {magicError && <p style={errorStyle}>{magicError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={magicLoading}
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontFamily: "var(--fonte-corpo)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    letterSpacing: "0.07em",
                    backgroundColor: magicLoading ? "var(--cor-destaque-hover)" : "var(--cor-destaque)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--raio-borda)",
                    cursor: magicLoading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                    opacity: magicLoading ? 0.85 : 1,
                  }}
                >
                  {magicLoading ? <><Spinner /> Enviando…</> : "Enviar link mágico"}
                </button>
              </form>
            )
          )}

          {/* Footer link */}
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "0.82rem",
              color: "var(--cor-texto-suave)",
              textAlign: "center",
              marginTop: "34px",
            }}
          >
            Já tem conta?{" "}
            <Link
              href="/entrar"
              style={{ color: "var(--cor-destaque)", fontWeight: 500 }}
            >
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
