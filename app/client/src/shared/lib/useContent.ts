import { useEffect, useState } from 'react'

export type Overrides = { products?: Record<string, string>; projects?: Record<string, string> }
let cache: Promise<Overrides> | null = null

/** Admin-editable descriptions (from /api/content). Falls back to {} if the API is unavailable. */
export function useContent(): Overrides {
  const [c, setC] = useState<Overrides>({})
  useEffect(() => {
    cache ??= fetch('/api/content').then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
    let alive = true
    cache.then((x) => alive && setC(x))
    return () => { alive = false }
  }, [])
  return c
}
