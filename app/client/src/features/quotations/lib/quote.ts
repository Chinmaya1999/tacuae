// Types and hooks for the configurators and quotations. All prices come from the server (integer fils).
import { useEffect, useState } from 'react'
import { api } from '../../../shared/lib/api'

export type Option = { id: string; label: string }
export type Options = {
  categories: Option[]; levels: Option[]; controls: Option[]; homeTypes: string[]; projectTypes: string[]; emirates: string[]
  tags: { popular: string; bestValue: string }; pricesVisible: boolean; amcAvailable: boolean
  includes: { roomType: string; category: string; level: string; items: { name: string; qty: number }[] }[]
  products: { id: string; name: string; group: string; price?: number }[]
}
export type RoomInput = { id: string; type: string; name: string; adjustments: Record<string, number> }
export type UnitConfig = { rooms: RoomInput[]; levels: Record<string, string>; control: string }
export type HomeInput = UnitConfig & { homeType: string; areaSqft: number; build: string; connectivity: string; emirate: string; community: string; timeline: string; amc: boolean }
export type UnitType = { id: string; name: string; quantity: number; areaSqft: number; phase: string; config: UnitConfig }
export type ProjectInput = {
  project: { name: string; type: string; location: string; stage: string; handover: string; buildingSystems: string }
  connectivity: string; unitTypes: UnitType[]; common: { productId: string; qty: number }[]; amc: boolean
}
export type Line = { productId: string; name: string; group: string; qty: number; unit?: number; accessory?: number; install?: number }
export type Totals = Record<'deviceCount' | 'devices' | 'accessories' | 'cabling' | 'installation' | 'programming' | 'commissioning' | 'subtotal' | 'volumeDiscountPct' | 'volumeDiscount' | 'discountPct' | 'discount' | 'amc' | 'taxable' | 'vat' | 'total', number>
export type Pricing = {
  hidden?: boolean; segment: string; lines: Line[]; totals?: Totals; charges?: { vatRate: number }
  rooms?: { id: string; name: string; type: string; items: { productId: string; qty: number }[] }[]
  unitTypes?: { id: string; name: string; quantity: number; phase: string; perUnit?: number; subtotal?: number }[]
  phases?: { name: string; subtotal: number }[]; metrics?: { units: number; areaSqft: number; costPerUnit?: number; costPerSqft?: number | null }
  warnings: { unmapped: string[]; unpriced: string[]; incompatible: string[] }
}
export type Smart = { score: number; kwh: number; aed: number; badges: { name: string; earned: boolean }[]; assumptions: { areaSqft: number; areaAssumed: boolean; kwhPerSqft: number; tariff: number; savingPct: number } }
export type Fx = { USD: number | null; EUR: number | null; asOf: string }
export type QuoteStatus = 'draft' | 'shared' | 'revision_requested' | 'reviewed' | 'final' | 'accepted' | 'survey'
export type Quote = {
  id: string; ref: string; kind: 'home' | 'project'; name: string; status: QuoteStatus; version: number; indicative: boolean; expired: boolean
  validUntil: string; trn: string; terms: string; exclusions: string; fx: Fx; total: number; createdAt: string; updatedAt: string; preparedFor?: string
  input: any; pricing: Pricing; comments: { by: string; text: string; at: string; staff: boolean }[]
  versions?: { version: number; at: string; note: string; author: string; status: QuoteStatus; discountPct: number; total: number; lines: { productId: string; name: string; qty: number }[] }[]
  discount?: { pct: number; approval?: string; requestedBy?: string }; shared?: boolean; shareExpiresAt?: string | null
  needsApproval?: boolean; smart?: Smart | null; deposit?: { amount: number; pct: number; at: string } | null; staffNote?: string; assignedTo?: string; segment?: string
  owner?: { name: string; email: string; phone: string; company: string; role: string }
}

export const money = (fils: number, currency = 'AED', rate = 1) => `${currency} ${((fils / 100) * rate).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const day = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
export const rid = () => Math.random().toString(36).slice(2, 9)
export const pretty = (s: string) => s.replace(/^apartment-(\d)$/, '$1 bedroom apartment').replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export function useOptions(userKey: string) {
  const [data, setData] = useState<Options | null>(null), [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    api<Options>('/api/configurator/options').then((d) => alive && setData(d)).catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [userKey]) // prices depend on who is signed in
  return { options: data, error }
}

/** Live price from the server's pricing engine (debounced). */
export function useQuoteEstimate(kind: 'home' | 'project', input: unknown, userKey: string, enabled = true) {
  const [pricing, setPricing] = useState<Pricing | null>(null), [smart, setSmart] = useState<Smart | null>(null), [fx, setFx] = useState<Fx | undefined>(), [error, setError] = useState('')
  const key = JSON.stringify(input)
  useEffect(() => {
    if (!enabled) { setPricing(null); setError(''); return }
    let alive = true
    const t = setTimeout(() => {
      api<{ pricing: Pricing; fx: Fx; smart: Smart | null }>('/api/configurator/estimate', { method: 'POST', body: { kind, input: JSON.parse(key) } })
        .then((d) => { if (alive) { setPricing(d.pricing); setSmart(d.smart); setFx(d.fx); setError('') } }).catch((e) => alive && setError(e.message))
    }, 200)
    return () => { alive = false; clearTimeout(t) }
  }, [kind, key, userKey, enabled])
  return { pricing, smart, fx, error }
}

/** Autosave in this browser, so a guest's work survives registration, reloads and navigation. */
export function useDraft<T>(key: string | null, initial: () => T) {
  const [value, setValue] = useState<T>(() => {
    try { const s = key && localStorage.getItem(key); if (s) return JSON.parse(s) as T } catch { /* storage unavailable or corrupt: start fresh */ }
    return initial()
  })
  useEffect(() => { if (key) try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode */ } }, [key, value])
  return [value, setValue] as const
}
export const clearDraft = (key: string) => { try { localStorage.removeItem(key) } catch { /* ignore */ } }

export function downloadBoq(ref: string, p: Pricing) {
  const cell = (v: unknown) => { const s = String(v ?? ''); return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replaceAll('"', '""')}"` }
  const aed = (f?: number) => (f === undefined ? '' : (f / 100).toFixed(2))
  const rows: unknown[][] = [['Category', 'Item', 'Quantity', 'Unit price (AED)', 'Accessories / unit (AED)', 'Installation / unit (AED)', 'Line total (AED)'],
    ...p.lines.map((l) => [l.group, l.name, l.qty, aed(l.unit), aed(l.accessory), aed(l.install), l.unit === undefined ? '' : aed((l.unit + (l.accessory ?? 0) + (l.install ?? 0)) * l.qty)])]
  if (p.totals) for (const [label, k] of [['Cabling allowance', 'cabling'], ['Programming', 'programming'], ['Commissioning', 'commissioning'], ['Subtotal', 'subtotal'], ['Volume discount', 'volumeDiscount'], ['Discount', 'discount'], ['AMC', 'amc'], ['VAT', 'vat'], ['Total', 'total']] as const) rows.push(['', label, '', '', '', '', aed(p.totals[k])])
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv' }))
  a.download = `${ref}-BOQ.csv`; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
