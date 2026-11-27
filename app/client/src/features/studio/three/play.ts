// "Play" camera: shared between the 3D character, the on-screen controls and the page.
import { create } from 'zustand'

type Near = { id: string; name: string; on: boolean } | null
export const usePlay = create<{ near: Near; stick: { x: number; y: number }; act: number; setNear: (n: Near) => void; setStick: (x: number, y: number) => void; press: () => void }>()((set, get) => ({
  near: null, stick: { x: 0, y: 0 }, act: 0,
  setNear: (near) => { const a = get().near; if (a?.id !== near?.id || a?.on !== near?.on) set({ near }) },
  setStick: (x, y) => set({ stick: { x, y } }),
  press: () => set((s) => ({ act: s.act + 1 })),
}))

/** Keeps a circle (the player) out of a rotated rectangle (a piece of furniture). */
export function pushOut(x: number, z: number, box: { x: number; z: number; w: number; d: number; rot: number }, radius: number): [number, number] {
  const c = Math.cos(box.rot), s = Math.sin(box.rot), dx = x - box.x, dz = z - box.z
  const lx = dx * c - dz * s, lz = dx * s + dz * c, hw = box.w / 2 + radius, hd = box.d / 2 + radius
  if (Math.abs(lx) >= hw || Math.abs(lz) >= hd) return [x, z]
  const byX = hw - Math.abs(lx) < hd - Math.abs(lz)
  const nx = byX ? Math.sign(lx || 1) * hw : lx, nz = byX ? lz : Math.sign(lz || 1) * hd
  return [box.x + nx * c + nz * s, box.z - nx * s + nz * c]
}
