import { create } from 'zustand'

export type CamMode = 'orbit' | 'top' | 'front' | 'walk' | 'free'
export type Sel = { id: string; kind: 'device' | 'furniture' } | null
export type Drag = { id: string; kind: 'device' | 'furniture'; height: number } | null

/** UI-only state for the 3D studio. The design itself stays with the page (so saving/undo are explicit). */
type S = {
  cam: CamMode; night: boolean; sel: Sel; drag: Drag
  setCam: (c: CamMode) => void; setNight: (n: boolean) => void; select: (s: Sel) => void; setDrag: (d: Drag) => void
}
export const useStudioUI = create<S>()((set) => ({
  cam: 'orbit', night: true, sel: null, drag: null,
  setCam: (cam) => set({ cam, sel: null }), setNight: (night) => set({ night }),
  select: (sel) => set({ sel }), setDrag: (drag) => set({ drag }),
}))
