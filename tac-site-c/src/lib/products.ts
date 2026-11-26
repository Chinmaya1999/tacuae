import { useEffect, useState } from 'react'
import { api } from './api'
import { useAuth } from './auth'
import type { Design, Estimate, Room } from '../data/catalog'

export type Product = { id: string; name: string; group: string; unitPrice: number; installPrice: number; connectivity: string[]; protocol: string; specs: string; desc: string; active: boolean; sku?: string; imageUrl?: string; datasheetUrl?: string; model3d?: string; accessoryPrice?: number; prices?: { trade?: number; partner?: number } }

let cache: Promise<Record<string, Product>> | null = null
/** Priced catalogue (signed-in users). Returns {} while loading or if unavailable. */
export function useProducts(): Record<string, Product> {
  const [p, setP] = useState<Record<string, Product>>({}), signedIn = !!useAuth().user
  useEffect(() => {
    if (!signedIn) return // guests previewing a design have no access to the account price APIs
    cache ??= api<{ items: Product[] }>('/api/products').then((d) => Object.fromEntries(d.items.map((x) => [x.id, x]))).catch(() => { cache = null; return {} })
    let alive = true; cache.then((x) => alive && setP(x))
    return () => { alive = false }
  }, [signedIn])
  return p
}

/** Live estimate from the server (debounced), so the formula lives in exactly one place. */
export function useEstimate(rooms: Room[], base?: Design['estimate']): Estimate | null {
  const [e, setE] = useState<Estimate | null>(base ?? null), signedIn = !!useAuth().user
  const key = JSON.stringify(rooms.map((r) => [r.id, r.name, r.devices.map((d) => d.cat)]))
  useEffect(() => {
    if (!signedIn) return
    const t = setTimeout(() => {
      api<{ estimate: Estimate }>('/api/products/estimate', { method: 'POST', body: { rooms } }).then((d) => setE(d.estimate)).catch(() => {})
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, signedIn])
  return e
}
