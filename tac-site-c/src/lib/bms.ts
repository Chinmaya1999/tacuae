import { useEffect, useRef, useState } from 'react'
import { api } from './api'
import type { Alarm, Catalog, Live } from '../data/bms'

let cat: Promise<Catalog> | null = null
export function useCatalog(): Catalog | null {
  const [c, setC] = useState<Catalog | null>(null)
  useEffect(() => {
    cat ??= api<Catalog>('/api/bms/catalog').catch((e) => { cat = null; throw e })
    let alive = true; cat.then((x) => alive && setC(x)).catch(() => {})
    return () => { alive = false }
  }, [])
  return c
}

/** Polls the project's simulated live state every `ms` while the tab is visible. */
export function useLive(projectId: string | undefined, ms = 5000) {
  const [live, setLive] = useState<Live | null>(null), [error, setError] = useState('')
  const busy = useRef(false)
  useEffect(() => {
    if (!projectId) return
    let stop = false
    const tick = async () => {
      if (busy.current || document.visibilityState !== 'visible') return
      busy.current = true
      try { const d = await api<Live>(`/api/bms/projects/${projectId}/live`); if (!stop) { setLive(d); setError('') } } catch (e) { if (!stop) setError((e as Error).message) } finally { busy.current = false }
    }
    tick(); const t = setInterval(tick, ms)
    return () => { stop = true; clearInterval(t) }
  }, [projectId, ms])
  return { live, error }
}

/** Number of unresolved alarms across the builder's projects (for the sidebar badge). */
export function useAlarmCount(enabled: boolean) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let stop = false
    const tick = () => document.visibilityState === 'visible' && api<{ items: Alarm[] }>('/api/bms/alarms').then((d) => !stop && setN(d.items.filter((a) => a.state === 'active').length)).catch(() => {})
    tick(); const t = setInterval(tick, 20000)
    return () => { stop = true; clearInterval(t) }
  }, [enabled])
  return n
}
