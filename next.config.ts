import type { NextConfig } from "next"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  headers: async () => [
    {
      // Remove Referer nas requisições de imagem — contorna hotlink protection (fimgs.net)
      source: "/_next/image(.*)",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.groq.com https://generativelanguage.googleapis.com;" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
      ],
    },
  ],
}

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/app-build-manifest\.json$/, /middleware-manifest\.json$/, /api\//],
  runtimeCaching: [
    {
      // API routes — never cache, always network
      urlPattern: /\/api\//,
      handler: "NetworkOnly",
    },
    {
      // Next.js static chunks — long-lived, cache first
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // Icons and manifest — cache first
      urlPattern: /\/(icons|manifest\.json).*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "pwa-assets",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      // All other requests (pages) — network first with offline fallback
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
  ],
})(nextConfig)
