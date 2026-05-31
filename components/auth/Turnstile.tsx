"use client"

import { useEffect, useRef } from "react"

interface Props {
  onVerify: (token: string) => void
  onError?: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, opts: object) => string
      remove: (widgetId: string) => void
    }
  }
}

export default function Turnstile({ onVerify, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return // dev mode — no widget rendered

    function renderWidget() {
      if (!containerRef.current || !window.turnstile) return
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "error-callback": onError,
        theme: "light",
        size: "normal",
      })
    }

    // If script already loaded
    if (window.turnstile) {
      renderWidget()
      return
    }

    const script = document.createElement("script")
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
    script.async = true
    script.defer = true
    script.onload = renderWidget
    document.head.appendChild(script)

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
      }
    }
  }, [siteKey, onVerify, onError])

  if (!siteKey) return null

  return <div ref={containerRef} />
}
