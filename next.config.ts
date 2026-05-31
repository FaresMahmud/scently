import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.groq.com https://generativelanguage.googleapis.com https://app.scrapingbee.com https://*.neon.tech",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ")

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  headers: async () => [
    {
      // Hotlink protection workaround — strip Referer on image requests
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
        { key: "Permissions-Policy",              value: "camera=(self), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security",       value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-DNS-Prefetch-Control",          value: "on" },
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
  // Upload source maps only when auth token is present
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  // Disable source map upload if no auth token (local / CI without Sentry)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Disable Sentry telemetry
  telemetry: false,
})
