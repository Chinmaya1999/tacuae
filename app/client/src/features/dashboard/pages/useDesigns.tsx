import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../../../shared/lib/api'
import type { Design } from '../../../shared/data/catalog'

type Ctx = { items: Design[] | null; error: string; reload: () => Promise<void> }
const C = createContext<Ctx | null>(null)

/** The signed-in user's designs, loaded once and shared by the sidebar badge, home and list pages. */
export function DesignsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Design[] | null>(null), [error, setError] = useState('')
  const reload = useCallback(() => api<{ items: Design[] }>('/api/designs').then((d) => { setItems(d.items); setError('') }).catch((e) => setError(e.message)), [])
  useEffect(() => { reload() }, [reload])
  const v = useMemo(() => ({ items, error, reload }), [items, error, reload])
  return <C.Provider value={v}>{children}</C.Provider>
}
export function useDesigns() { const c = useContext(C); if (!c) throw new Error('useDesigns outside DesignsProvider'); return c }
