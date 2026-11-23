// Cost estimate for a design: devices + per-device installation + VAT. Furniture is design-only and not priced.
import * as Product from '../models/product.model.js'
import { CURRENCY, VAT_RATE } from '../constants/index.js'

const r2 = (n) => Math.round(n * 100) / 100

/** Pure function: easy to test. `products` is an array of catalogue entries. */
export function computeEstimate(rooms, products) {
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  const items = new Map(), byRoom = [], byCat = new Map(), unpriced = new Set()
  let devices = 0, installation = 0
  for (const room of rooms) {
    let rd = 0, ri = 0, rq = 0
    for (const d of room.devices) {
      const p = byId[d.cat]
      if (!p) { unpriced.add(d.cat); continue }
      if (!(p.unitPrice > 0)) unpriced.add(p.id)
      const unit = p.unitPrice || 0, inst = p.installPrice || 0
      const it = items.get(p.id) ?? { id: p.id, name: p.name, group: p.group, qty: 0, unitPrice: unit, installPrice: inst, subtotal: 0, install: 0 }
      it.qty++; it.subtotal = r2(it.subtotal + unit); it.install = r2(it.install + inst); items.set(p.id, it)
      const c = byCat.get(p.group) ?? { group: p.group, qty: 0, total: 0 }
      c.qty++; c.total = r2(c.total + unit + inst); byCat.set(p.group, c)
      rd += unit; ri += inst; rq++
    }
    devices += rd; installation += ri
    byRoom.push({ id: room.id, room: room.name, qty: rq, devices: r2(rd), installation: r2(ri), total: r2(rd + ri) })
  }
  const subtotal = r2(devices + installation), vat = r2(subtotal * VAT_RATE)
  return {
    currency: CURRENCY, vatRate: VAT_RATE, items: [...items.values()], byRoom, byCategory: [...byCat.values()],
    devices: r2(devices), installation: r2(installation), subtotal, vat, total: r2(subtotal + vat), unpriced: [...unpriced], estimated: true,
  }
}

export async function estimateRooms(rooms) { return computeEstimate(rooms, await Product.listAll()) }
