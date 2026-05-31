"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { GeminiResult } from "@/app/api/scanner/route"
import ResultadoScanner from "./ResultadoScanner"

interface CatalogMatch {
  id: string
  nome: string
  marca: string
  concentracao?: string
  familia?: string
}

type Estado = "idle" | "solicitando" | "streaming" | "capturando" | "carregando" | "resultado" | "negado" | "erro"

function Spinner({ cor = "currentColor" }: { cor?: string }) {
  return (
    <>
      <span style={{
        display: "inline-block", width: "20px", height: "20px", borderRadius: "50%",
        border: `2px solid ${cor}`, borderTopColor: "transparent",
        animation: "spin 0.6s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

interface Props {
  isDesktop: boolean
}

export default function ScannerCamera({ isDesktop }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  const [estado,  setEstado]  = useState<Estado>(isDesktop ? "idle" : "idle")
  const [perfume, setPerfume] = useState<GeminiResult | null>(null)
  const [match,   setMatch]   = useState<CatalogMatch | null>(null)
  const [erroMsg, setErroMsg] = useState("")

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const iniciarCamera = useCallback(async () => {
    setEstado("solicitando")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setEstado("streaming")
    } catch (err: unknown) {
      const name = (err as { name?: string }).name
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setEstado("negado")
      } else {
        setEstado("idle") // No camera — fall through to upload
      }
    }
  }, [])

  // Auto-start camera on mobile
  useEffect(() => {
    if (!isDesktop) iniciarCamera()
  }, [isDesktop, iniciarCamera])

  async function enviarParaApi(imageBase64: string, mimeType: string) {
    setEstado("carregando")
    try {
      const res = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      })
      if (res.status === 429) {
        setErroMsg("Limite de scans atingido. Tente de novo em alguns minutos.")
        setEstado("erro")
        return
      }
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setErroMsg(data.error ?? "Não consegui identificar. Tente outro ângulo.")
        setEstado("erro")
        return
      }
      const data = await res.json() as { perfume: GeminiResult; catalogMatch: CatalogMatch | null }
      if (!data.perfume.found || data.perfume.confidence === "low") {
        setErroMsg("Não consegui identificar. Tente outro ângulo ou melhor iluminação.")
        setEstado("erro")
        return
      }
      setPerfume(data.perfume)
      setMatch(data.catalogMatch)
      // Stop camera stream when result is shown
      streamRef.current?.getTracks().forEach(t => t.stop())
      setEstado("resultado")
    } catch {
      setErroMsg("Erro de conexão. Verifique sua internet e tente novamente.")
      setEstado("erro")
    }
  }

  function capturarFrame() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
    const base64  = dataUrl.split(",")[1]
    enviarParaApi(base64, "image/jpeg")
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64  = dataUrl.split(",")[1]
      enviarParaApi(base64, file.type || "image/jpeg")
    }
    reader.readAsDataURL(file)
    e.target.value = "" // Reset input so same file can be re-selected
  }

  function reiniciar() {
    setPerfume(null)
    setMatch(null)
    setErroMsg("")
    if (isDesktop) {
      setEstado("idle")
    } else {
      iniciarCamera()
    }
  }

  // ── Negado ───────────────────────────────────────────────────
  if (estado === "negado") {
    return (
      <div style={{ textAlign: "center", padding: "55px 21px", maxWidth: "400px", margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "21px", color: "var(--cor-texto)" }}>
          Câmera bloqueada.
        </p>
        <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "var(--cor-texto-suave)", lineHeight: 1.6, marginBottom: "34px" }}>
          Permita o acesso à câmera nas configurações do seu navegador, ou use a opção de enviar foto.
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 34px", backgroundColor: "var(--cor-destaque)", color: "#fff", border: "none", borderRadius: "var(--raio-borda)", cursor: "pointer", fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500, letterSpacing: "0.07em" }}
        >
          Enviar foto
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </div>
    )
  }

  // ── Resultado ───────────────────────────────────────────────
  if (estado === "resultado" && perfume) {
    return (
      <ResultadoScanner
        perfume={perfume}
        catalogMatch={match}
        onReiniciar={reiniciar}
      />
    )
  }

  // ── Desktop: upload only ─────────────────────────────────────
  if (isDesktop && estado !== "streaming") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "34px", padding: "55px 21px" }}>
        {/* Drop zone */}
        <label
          htmlFor="upload-desktop"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "21px",
            width: "100%",
            maxWidth: "480px",
            aspectRatio: "16/9",
            border: "1px solid var(--cor-borda)",
            borderRadius: "var(--raio-borda-suave)",
            backgroundColor: "var(--cor-card)",
            cursor: "pointer",
            padding: "34px",
            textAlign: "center",
          }}
        >
          {estado === "carregando" ? (
            <>
              <Spinner cor="var(--cor-destaque)" />
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "var(--cor-texto-suave)" }}>
                Identificando perfume…
              </p>
            </>
          ) : estado === "erro" ? (
            <>
              <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "#C0392B", lineHeight: 1.5 }}>
                {erroMsg}
              </p>
              <span style={{ fontFamily: "var(--fonte-corpo)", fontSize: "0.82rem", color: "var(--cor-destaque)" }}>
                Clique para tentar outra foto
              </span>
            </>
          ) : (
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--cor-texto-suave)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div>
                <p style={{ fontFamily: "var(--fonte-titulo)", fontWeight: 300, fontSize: "26px", marginBottom: "8px" }}>
                  Envie uma foto do frasco
                </p>
                <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "var(--cor-texto-suave)" }}>
                  JPG ou PNG — máxima qualidade possível
                </p>
              </div>
            </>
          )}
        </label>
        <input id="upload-desktop" type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} disabled={estado === "carregando"} />
      </div>
    )
  }

  // ── Mobile: live viewfinder ──────────────────────────────────
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "100vw" }}>
      {/* Viewfinder */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          backgroundColor: "#1A1A18",
          overflow: "hidden",
          border: "1px solid rgba(196,113,74,0.4)",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Corner frame decoration */}
        {["top-left","top-right","bottom-left","bottom-right"].map(pos => {
          const t = pos.startsWith("top")    ? "13px" : "auto"
          const b = pos.startsWith("bottom") ? "13px" : "auto"
          const l = pos.endsWith("left")     ? "13px" : "auto"
          const r = pos.endsWith("right")    ? "13px" : "auto"
          const borderT = pos.startsWith("top")    ? "2px solid #C4714A" : "none"
          const borderB = pos.startsWith("bottom") ? "2px solid #C4714A" : "none"
          const borderL = pos.endsWith("left")     ? "2px solid #C4714A" : "none"
          const borderR = pos.endsWith("right")    ? "2px solid #C4714A" : "none"
          return (
            <div key={pos} style={{ position: "absolute", top: t, bottom: b, left: l, right: r, width: "24px", height: "24px", borderTop: borderT, borderBottom: borderB, borderLeft: borderL, borderRight: borderR }} />
          )
        })}

        {/* Solicitando / loading overlay */}
        {(estado === "solicitando" || estado === "carregando") && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(26,26,24,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "21px" }}>
            <Spinner cor="#F5F2ED" />
            <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "#F5F2ED", letterSpacing: "0.04em" }}>
              {estado === "carregando" ? "Identificando perfume…" : "Ativando câmera…"}
            </p>
          </div>
        )}

        {/* Error overlay */}
        {estado === "erro" && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(26,26,24,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "21px", padding: "34px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--fonte-corpo)", fontSize: "16px", color: "#F5F2ED", lineHeight: 1.6 }}>
              {erroMsg}
            </p>
            <button
              onClick={reiniciar}
              style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 21px", backgroundColor: "#C4714A", color: "#F5F2ED", border: "none", borderRadius: "var(--raio-borda)", cursor: "pointer", fontFamily: "var(--fonte-corpo)", fontSize: "0.875rem", fontWeight: 500 }}
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "34px",
          padding: "34px 21px",
          backgroundColor: "#1A1A18",
        }}
      >
        {/* Upload fallback */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={estado === "carregando"}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--fonte-corpo)", fontSize: "0.75rem", color: "rgba(245,242,237,0.55)", minHeight: "44px", minWidth: "44px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4"/><line x1="7" y1="5" x2="7" y2="15"/>
          </svg>
          Enviar foto
        </button>

        {/* Capture button */}
        <button
          onClick={capturarFrame}
          disabled={estado !== "streaming"}
          aria-label="Capturar"
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: estado === "streaming" ? "#C4714A" : "rgba(196,113,74,0.3)",
            border: "3px solid rgba(245,242,237,0.3)",
            cursor: estado === "streaming" ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
        >
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#F5F2ED", opacity: estado === "streaming" ? 1 : 0.4 }} />
        </button>

        {/* Placeholder right side for visual balance */}
        <div style={{ width: "44px", minHeight: "44px" }} />
      </div>

      {/* Hidden elements */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
    </div>
  )
}
