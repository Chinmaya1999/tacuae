import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Alarm, Project } from '../../data/bms'

export type Overview = { projects: Project[]; alarms: Alarm[]; activeAlarms: number }
/** All of a builder's projects with live summary figures, refreshed every 10 s while the tab is visible. */
export function useOverview() {
  const [data, setData] = useState<Overview | null>(null), [error, setError] = useState('')
  useEffect(() => {
    let stop = false
    const tick = () => document.visibilityState === 'visible' && api<Overview>('/api/bms/overview').then((d) => { if (!stop) { setData(d); setError('') } }).catch((e) => !stop && setError(e.message))
    tick(); const t = setInterval(tick, 10000)
    return () => { stop = true; clearInterval(t) }
  }, [])
  return { data, error }
}
