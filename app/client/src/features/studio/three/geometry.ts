import { mountOf, deviceById, type Room, type PlacedDevice, type Mount } from '../../../shared/data/catalog'

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
export type Wall = 'left' | 'right' | 'back' | 'front'
export const dims = (r: Room) => ({ w: r.w ?? 5, l: r.l ?? 4, h: r.h ?? 2.8 })

/** Design coordinates are percentages (0-100) of the room; the 3D world is in metres, centred on the origin. */
export const toWorld = (x: number, y: number, w: number, l: number): [number, number] => [(x / 100 - 0.5) * w, (y / 100 - 0.5) * l]
export const toPct = (wx: number, wz: number, w: number, l: number): [number, number] => [clamp((wx / w + 0.5) * 100, 2, 98), clamp((wz / l + 0.5) * 100, 2, 98)]

/** Pushes a point onto the nearest wall. */
export function snapWall(x: number, y: number, w: number, l: number): { x: number; y: number; wall: Wall } {
  const d = { left: (x / 100) * w, right: (1 - x / 100) * w, back: (y / 100) * l, front: (1 - y / 100) * l }
  const wall = (Object.keys(d) as Wall[]).reduce((a, b) => (d[b] < d[a] ? b : a))
  return { wall, x: wall === 'left' ? 0 : wall === 'right' ? 100 : clamp(x, 8, 92), y: wall === 'back' ? 0 : wall === 'front' ? 100 : clamp(y, 8, 92) }
}
export const wallRot: Record<Wall, number> = { back: 0, left: Math.PI / 2, right: -Math.PI / 2, front: Math.PI }

export const isWallMount = (m: Mount) => m.startsWith('wall')
export const mountHeight = (m: Mount, h: number) => ({ ceiling: h, 'wall-high': Math.min(2.15, h - 0.4), 'wall-mid': 1.25, 'wall-low': 0.35, table: 0.8, floor: 0 })[m]
export const mountFor = (cat: string): Mount => mountOf[deviceById[cat]?.kind] ?? 'floor'

/** World position + rotation for a placed device. Wall devices sit on the wall, facing into the room. */
export function placeDevice(d: PlacedDevice, room: Room): { pos: [number, number, number]; rotY: number; mount: Mount } {
  const { w, l, h } = dims(room), mount = mountFor(d.cat), y = mountHeight(mount, h)
  if (isWallMount(mount)) {
    const s = snapWall(d.x, d.y, w, l), [wx, wz] = toWorld(s.x, s.y, w, l), off = 0.06
    const inward: Record<Wall, [number, number]> = { left: [off, 0], right: [-off, 0], back: [0, off], front: [0, -off] }
    return { pos: [wx + inward[s.wall][0], y, wz + inward[s.wall][1]], rotY: wallRot[s.wall], mount }
  }
  const [wx, wz] = toWorld(d.x, d.y, w, l)
  return { pos: [wx, y, wz], rotY: 0, mount }
}

/** Default level when a device is created / loaded from a 2D design. */
export const defaultLevel = (cat: string) => { const k = deviceById[cat]?.kind; return k === 'ac' ? 24 : 100 }
export const levelOf = (d: PlacedDevice) => d.level ?? defaultLevel(d.cat)
