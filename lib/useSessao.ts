"use client"

import { useState, useEffect, useCallback } from "react"

interface UsuarioSessao {
  id: string
  email: string
  name: string | null
}

interface SessaoState {
  usuario: UsuarioSessao | null
  carregando: boolean
}

/** Busca a sessão atual via /api/auth/me e expõe um logout que limpa os cookies de auth. */
export function useSessao() {
  const [{ usuario, carregando }, setState] = useState<SessaoState>({ usuario: null, carregando: true })

  useEffect(() => {
    let ativo = true
    fetch("/api/auth/me")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (ativo) setState({ usuario: data?.user ?? null, carregando: false })
      })
      .catch(() => {
        if (ativo) setState({ usuario: null, carregando: false })
      })
    return () => { ativo = false }
  }, [])

  const sair = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    setState({ usuario: null, carregando: false })
    window.location.href = "/"
  }, [])

  return { usuario, carregando, sair }
}
