import { useEffect, useState } from 'react'
import { api } from './api'

let cache: Promise<boolean> | null = null
export const fetchDemo = () => (cache ??= api<{ demo: boolean }>('/api/demo/config').then((d) => d.demo).catch(() => { cache = null; return false }))
/** True only when the server runs in demo mode: simulated sign-in, payments, messaging, assistant and Arabic preview. */
export function useDemo() {
  const [demo, setDemo] = useState(false)
  useEffect(() => { let on = true; fetchDemo().then((d) => on && setDemo(d)); return () => { on = false } }, [])
  return demo
}
