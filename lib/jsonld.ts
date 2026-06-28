/** Serialize data for a JSON-LD <script> tag, escaping chars that could break
 *  out of the script element (e.g. "</script>" inside a catalog description). */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}
