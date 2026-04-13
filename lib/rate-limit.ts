type RateEntry = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateEntry>()

export function hitRateLimit(key: string, maxHits: number, windowMs: number): boolean {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  current.count += 1
  return current.count > maxHits
}
