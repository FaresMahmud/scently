/**
 * SECURITY: only allow same-origin path redirects (open-redirect prevention).
 * Rejects absolute URLs, protocol-relative ("//host"), and anything not starting with "/".
 */
export function safeRedirect(target: string | null | undefined, fallback = "/"): string {
  if (!target) return fallback
  if (!target.startsWith("/") || target.startsWith("//")) return fallback
  if (target.includes("://")) return fallback
  return target
}
