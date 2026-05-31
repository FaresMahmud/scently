import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.SENTRY_DSN,

  tracesSampleRate: 0.05,

  beforeSend(event) {
    const status = event.contexts?.response?.status_code as number | undefined
    if (status === 401 || status === 404 || status === 429) return null
    return event
  },
})
