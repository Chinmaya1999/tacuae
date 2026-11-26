// 3D preview of a configuration, built from the engine's per-room bill and shown in the existing 3D studio.
import { useMemo } from 'react'
import Studio3D from '../studio3d/Studio3D'
import { deviceById, newRoom, roomTypeById, type Design, type RoomType } from '../../data/catalog'
import type { Pricing } from '../../lib/quote'

export function designFromPricing(rooms: NonNullable<Pricing['rooms']>): Design {
  const list = rooms.filter((r) => r.type !== 'property')
  const whole = rooms.find((r) => r.type === 'property')?.items ?? []
  return {
    name: 'Preview', clientName: '', siteAddress: '', notes: '',
    rooms: list.map((r, i) => {
      const base = newRoom((r.type in roomTypeById ? r.type : 'other') as RoomType)
      // whole-home devices (locks, panels…) are shown in the first room
      const items = (i === 0 ? [...r.items, ...whole] : r.items).flatMap((it) => (deviceById[it.productId] ? Array.from({ length: Math.min(it.qty, 8) }, () => it.productId) : []))
      return {
        ...base, id: r.id, name: r.name,
        devices: items.map((cat, n) => ({ id: `${r.id}-${n}`, cat, on: true, level: deviceById[cat].kind === 'ac' ? 24 : 80, x: 15 + ((n * 29) % 70), y: 12 + ((n * 41) % 76) })),
      }
    }),
  }
}

export default function Preview3D({ rooms }: { rooms: NonNullable<Pricing['rooms']> }) {
  const design = useMemo(() => designFromPricing(rooms), [rooms])
  if (!design.rooms.length) return null
  // remount when the device list changes so the viewer never holds a stale room
  return <Studio3D key={design.rooms.map((r) => r.devices.length).join('-')} design={design} readOnly />
}
