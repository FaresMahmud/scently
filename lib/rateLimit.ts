interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

export function resetRateLimitStore() {
  store.clear()
}

function check(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

// Purge expired entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

/** 10 attempts per IP per 15 minutes */
export function loginRateLimit(ip: string) {
  return check(`login:${ip}`, 10, 15 * 60 * 1000)
}

/** 5 attempts per IP per hour */
export function registerRateLimit(ip: string) {
  return check(`register:${ip}`, 5, 60 * 60 * 1000)
}

/** 10 scans per IP per hour */
export function scannerRateLimit(ip: string) {
  return check(`scanner:${ip}`, 10, 60 * 60 * 1000)
}

/** 20 consultor requests per IP per hour */
export function consultorRateLimit(ip: string) {
  return check(`consultor:${ip}`, 20, 60 * 60 * 1000)
}

/** 60 perfil requests per authenticated userId per hour */
export function perfilRateLimit(userId: string) {
  return check(`perfil:${userId}`, 60, 60 * 60 * 1000)
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}
