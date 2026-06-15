const SESSION_KEY = "nozze_sid"

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr"
  let sid = localStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

export async function track(
  tipo: string,
  dados?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, sessionId: getSessionId(), dados }),
      keepalive: true,
    })
  } catch {
    // ignore — analytics never block UX
  }
}
