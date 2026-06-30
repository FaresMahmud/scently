import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")

// SECURITY: connect-src should ONLY include domains the browser directly fetches.
// Server-side API calls (DeepSeek, Gemini, Groq, Neon, ScrapingBee) do NOT go
// through the browser and must NOT appear here — they would leak infrastructure.
const CSP = [
  "default-src 'self'",
  // SECURITY: 'unsafe-eval' is required by Next.js 16 SSR hydration.
  // 'unsafe-inline' is required for styled-jsx and inline styles.
  // Nonce-based CSP would be the ideal solution but requires middleware rewrite.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // SECURITY: img-src restricted to same-origin, data URIs, blobs, and HTTPS only
  "img-src 'self' data: blob: https:",
  // SECURITY: Only browser-initiated fetch targets allowed here.
  // Server-side services (DeepSeek, Gemini, Neon, ScrapingBee) removed — they don't run in browser
  "connect-src 'self' https://challenges.cloudflare.com https://accounts.google.com https://oauth2.googleapis.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ")

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    // Reduce static generation workers to avoid OOM with large JSON data files
    cpus: 2,
  },
  images: {
    // SECURITY: Restrict to known perfume image CDNs only.
    // hostname:"**" was an open SSRF-like proxy — any attacker could probe
    // internal hosts or abuse bandwidth by passing arbitrary URLs.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.fragella.com" },
      { protocol: "https", hostname: "fimgs.net" },
      { protocol: "https", hostname: "**.fimgs.net" },
      { protocol: "https", hostname: "img.fragrantica.com" },
      { protocol: "https", hostname: "**.fragrantica.com" },
      { protocol: "https", hostname: "cdn.fragrancenet.com" },  // imagemFallbacks CDN
      { protocol: "https", hostname: "**.fragrancenet.com" },
      { protocol: "https", hostname: "**.sephora.com.br" },
    ],
  },
  headers: async () => [
    {
      // Hotlink protection — strip Referer on image requests to CDNs
      source: "/_next/image(.*)",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy",        value: CSP },
        { key: "X-Frame-Options",                value: "DENY" },
        { key: "X-Content-Type-Options",          value: "nosniff" },
        { key: "Referrer-Policy",                 value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy",              value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()" },
        { key: "Strict-Transport-Security",       value: "max-age=63072000; includeSubDomains; preload" },
        // SECURITY: DNS prefetching disabled — prevents leaking navigation patterns
        { key: "X-DNS-Prefetch-Control",          value: "off" },
        { key: "X-Download-Options",              value: "noopen" },
        { key: "Cross-Origin-Opener-Policy",      value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy",    value: "same-origin" },
      ],
    },
  ],
}

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/app-build-manifest\.json$/, /middleware-manifest\.json$/, /api\//],
  runtimeCaching: [
    { urlPattern: /\/api\//, handler: "NetworkOnly" },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/(icons|manifest\.json).*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "pwa-assets",
        expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
})(nextConfig)

export default withSentryConfig(pwaConfig, {
  org:     process.env.SENTRY_ORG     ?? "",
  project: process.env.SENTRY_PROJECT ?? "nozze",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  telemetry: false,
})
