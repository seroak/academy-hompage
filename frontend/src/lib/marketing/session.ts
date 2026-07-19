import { z } from 'zod'

export const MARKETING_SESSION_STORAGE_KEY = 'openmath-marketing-session-v1'
export const MARKETING_SESSION_TIMEOUT_MS = 30 * 60 * 1000

const StoredSessionSchema = z.object({
  id: z.string(),
  lastActivityAt: z.number(),
})

export function getMarketingSessionId(now = Date.now()): string {
  const raw = window.localStorage.getItem(MARKETING_SESSION_STORAGE_KEY)
  if (raw) {
    try {
      const stored = StoredSessionSchema.parse(JSON.parse(raw))
      if (stored.id && now - stored.lastActivityAt < MARKETING_SESSION_TIMEOUT_MS) {
        window.localStorage.setItem(MARKETING_SESSION_STORAGE_KEY, JSON.stringify({ ...stored, lastActivityAt: now }))
        return stored.id
      }
    } catch {
      window.localStorage.removeItem(MARKETING_SESSION_STORAGE_KEY)
    }
  }
  const next = { id: crypto.randomUUID(), lastActivityAt: now }
  window.localStorage.setItem(MARKETING_SESSION_STORAGE_KEY, JSON.stringify(next))
  return next.id
}
