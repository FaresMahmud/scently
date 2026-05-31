"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Turnstile from "@/components/auth/Turnstile"

interface FieldErrors {
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

export default function PaginaEntrar() {
  const router = useRouter()
  const params = useSearchParams()
  const next   = params.get("next") ?? "/"

  const [email,     setEmail]     = useState("")
  const [password,  setPassword]  = useState("")
  const [errors,    setErrors]    = useState<FieldErrors>({})
  const [loading,   setLoading]   = useState(false)
  const [lockedMsg, setLockedMsg] = useState<string | null>(null)
  const [turnToken, setTurnToken] = useState<string | null>(null)

  const onTurnstile = useCallback((t: string) => setTurnToken(t), [])

  function validate(): boolean {
    const e: FieldErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "E-mail inválido."
    if (password.length < 8) e.password = "Senha deve ter no mínimo 8 caracteres."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    setLockedMsg(null)
    setErrors({})

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken: turnToken ?? undefined }),
      })

      if (res.status === 429) {
        const { error } = await res.json()
        setErrors({ global: error })
        return
      }

      if (res.status === 423) {
        const { lockedUntil } = await res.json()
        const minutes = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000)
        setLockedMsg(`Conta bloqueada por ${minutes} minuto${minutes !== 1 ? "s" : ""}. Tente novamente mais tarde.`)
        return
      }

      if (!res.ok) {
        const { error } = await res.json()
        setErrors({ global: error ?? "Erro ao entrar." })
        return
      }

      router.push(next)
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
            Entrar
          </h1>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "16px",
              color: "var(--cor-texto-suave)",
              marginBottom: "34px",
            }}
          >
            Bem-vindo de volta.
          </p>

          {/* Locked message */}
          {lockedMsg && (
            <div
              style={{
                backgroundColor: "#FFF3CD",
                border: "1px solid #FBBF24",
                borderRadius: "var(--raio-borda-suave)",
                padding: "13px 21px",
                marginBottom: "21px",
                fontFamily: "var(--fonte-corpo)",
                fontSize: "0.85rem",
                color: "#92400E",
              }}
            >
              {lockedMsg}
            </div>
          )}

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

          <form onSubmit={handleSubmit} noValidate>
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
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.password ? "#EF4444" : "var(--cor-borda)",
                }}
                disabled={loading}
              />
              {errors.password && <p style={errorStyle}>{errors.password}</p>}
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
              {loading ? <><Spinner /> Entrando…</> : "Entrar"}
            </button>
          </form>

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
            Não tem conta?{" "}
            <Link
              href="/cadastro"
              style={{ color: "var(--cor-destaque)", fontWeight: 500 }}
            >
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
