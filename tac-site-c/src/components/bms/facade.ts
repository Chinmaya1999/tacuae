// Procedural architectural materials for the digital twin: curtain-wall facades, concrete, asphalt.
// Everything is drawn on canvases at runtime, so there are no image files to download or license.
import * as THREE from 'three'

export type Palette = {
  key: string; spandrel: string; glassTop: string; glassBottom: string; mullion: string; frame: string; roof: string
  winX: number; winY: number; winH: number; divider: 'none' | 'center' | 'thirds'; bayW: number; balconies: boolean; litChance: number
}
const P = (key: string, o: Partial<Palette>): Palette => ({ key, spandrel: '#d8cdbd', glassTop: '#8fc0d6', glassBottom: '#2f6784', mullion: '#e9e6df', frame: '#cfc6b8', roof: '#7d7f84', winX: 12, winY: 12, winH: 80, divider: 'center', bayW: 3.4, balconies: false, litChance: 0.42, ...o })

/** Real-world colour schemes by building type (sand/white concrete, blue-green reflective glass, metal mullions). */
export const palettes: Record<string, Palette> = {
  residential: P('residential', { balconies: true, winX: 7, winY: 9, winH: 90 }),
  hotel: P('hotel', { winX: 7, winY: 9, winH: 90, spandrel: '#ece6dc', frame: '#e3dccf', glassTop: '#9ec1cf', glassBottom: '#3f6070', mullion: '#9a7a4a', balconies: true, bayW: 3.6 }),
  villas: P('villas', { spandrel: '#efe3cf', frame: '#e8dcc6', glassTop: '#a9c8d3', glassBottom: '#4a6e7d', mullion: '#f4efe6', balconies: true, divider: 'thirds' }),
  mixed: P('mixed', { spandrel: '#cfc5b6', frame: '#c4baa9', balconies: true, glassTop: '#86b4cc', glassBottom: '#2b5f7f' }),
  commercial: P('commercial', { spandrel: '#56626f', frame: '#6b7683', glassTop: '#9cc3dc', glassBottom: '#2a5578', mullion: '#aab4be', winX: 5, winY: 8, winH: 96, divider: 'none', bayW: 2.8 }),
  office: P('office', { spandrel: '#3d4c5c', frame: '#4d5b6b', glassTop: '#b4d3e8', glassBottom: '#35607f', mullion: '#c8d0d8', winX: 3, winY: 6, winH: 104, divider: 'none', bayW: 2.4, litChance: 0.35 }),
  mall: P('mall', { spandrel: '#b8694b', frame: '#a85d41', glassTop: '#a5c9d8', glassBottom: '#3d6a80', mullion: '#e2d9cc', winX: 8, winH: 70, divider: 'thirds', bayW: 4.4 }),
  hospital: P('hospital', { spandrel: '#f1f4f6', frame: '#e6ebee', glassTop: '#a8cde6', glassBottom: '#4a7ea3', mullion: '#f7f9fa', winX: 8, winH: 76, bayW: 3.2 }),
  education: P('education', { spandrel: '#a65d45', frame: '#98543d', glassTop: '#9fc1d3', glassBottom: '#41667b', mullion: '#e8e2d6', winX: 10, winH: 74, bayW: 3.4, divider: 'thirds' }),
  industrial: P('industrial', { spandrel: '#8a949c', frame: '#7a848c', glassTop: '#a4bccb', glassBottom: '#4c6779', mullion: '#c5ccd1', winX: 4, winY: 38, winH: 46, divider: 'none', bayW: 5, litChance: 0.25 }),
}
export const paletteFor = (type: string) => palettes[type] ?? palettes.residential

// deterministic random so towers look the same on every load
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16), c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)))
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`
}
const tex = (c: HTMLCanvasElement, srgb = true) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t }
const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

export const FACADE_COLS = 16, FACADE_ROWS = 8
const cache = new Map<string, unknown>()
const memo = <T,>(key: string, make: () => T): T => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key) as T }

/** 16 bays × 8 floors of curtain wall (day colour + night "lit windows" emissive). Repeat/offset it to cover any facade. */
export function facadeSet(p: Palette) {
  return memo(`facade:${p.key}`, () => {
    const cw = 128, day = canvas(cw * FACADE_COLS, cw * FACADE_ROWS), lit = canvas(cw * FACADE_COLS, cw * FACADE_ROWS), d = day.getContext('2d')!, l = lit.getContext('2d')!, r = rng(p.key.length * 9973 + 17)
    l.fillStyle = '#000'; l.fillRect(0, 0, lit.width, lit.height)
    for (let row = 0; row < FACADE_ROWS; row++) for (let col = 0; col < FACADE_COLS; col++) {
      const x = col * cw, y = row * cw, gx = x + p.winX, gy = y + p.winY, gw = cw - 2 * p.winX, gh = p.winH
      d.fillStyle = shade(p.spandrel, (r() - 0.5) * 0.05); d.fillRect(x, y, cw, cw)
      d.fillStyle = 'rgba(0,0,0,.18)'; d.fillRect(x, y + cw - 5, cw, 5) // slab shadow line
      const g = d.createLinearGradient(0, gy, 0, gy + gh); g.addColorStop(0, shade(p.glassTop, (r() - 0.5) * 0.06)); g.addColorStop(1, shade(p.glassBottom, (r() - 0.5) * 0.05))
      d.fillStyle = g; d.fillRect(gx, gy, gw, gh)
      const sky = d.createLinearGradient(gx, gy, gx + gw, gy + gh); sky.addColorStop(0, 'rgba(255,255,255,.28)'); sky.addColorStop(0.45, 'rgba(255,255,255,0)'); d.fillStyle = sky; d.fillRect(gx, gy, gw, gh) // sky reflection
      if (r() < 0.2) { d.fillStyle = `rgba(${225 + r() * 20},${210 + r() * 20},${185 + r() * 20},.75)`; d.fillRect(gx, gy, gw, gh * (0.35 + r() * 0.4)) } // curtains / blinds
      d.strokeStyle = p.mullion; d.lineWidth = 4; d.strokeRect(gx, gy, gw, gh)
      d.lineWidth = 3
      if (p.divider === 'center') { d.beginPath(); d.moveTo(gx + gw / 2, gy); d.lineTo(gx + gw / 2, gy + gh); d.stroke() }
      if (p.divider === 'thirds') { d.beginPath(); for (const k of [1 / 3, 2 / 3]) { d.moveTo(gx + gw * k, gy); d.lineTo(gx + gw * k, gy + gh) } d.stroke() }
      if (r() < p.litChance) {
        const warm = r() < 0.86; l.fillStyle = warm ? `rgb(255,${200 + Math.floor(r() * 35)},${130 + Math.floor(r() * 50)})` : 'rgb(170,200,255)'
        l.globalAlpha = 0.55 + r() * 0.45; l.fillRect(gx + 2, gy + 2, gw - 4, gh - 4); l.globalAlpha = 1
      }
    }
    return { day: tex(day), lit: tex(lit), cols: FACADE_COLS, rows: FACADE_ROWS }
  })
}

/** Ground-floor lobby / storefront glazing: tall dark glass, warm light inside. */
export function lobbySet(p: Palette) {
  return memo(`lobby:${p.key}`, () => {
    const day = canvas(512, 128), lit = canvas(512, 128), d = day.getContext('2d')!, l = lit.getContext('2d')!
    d.fillStyle = shade(p.frame, -0.08); d.fillRect(0, 0, 512, 128)
    for (let i = 0; i < 4; i++) { const x = i * 128 + 6; const g = d.createLinearGradient(0, 6, 0, 124); g.addColorStop(0, '#4a6c82'); g.addColorStop(1, '#1d3446'); d.fillStyle = g; d.fillRect(x, 6, 116, 118)
      d.fillStyle = 'rgba(255,255,255,.14)'; d.fillRect(x, 6, 40, 118); d.strokeStyle = '#b8c2cb'; d.lineWidth = 4; d.strokeRect(x, 6, 116, 118) }
    l.fillStyle = '#000'; l.fillRect(0, 0, 512, 128); l.fillStyle = 'rgb(255,214,150)'; l.globalAlpha = 0.7
    for (let i = 0; i < 4; i++) l.fillRect(i * 128 + 10, 12, 108, 106)
    return { day: tex(day), lit: tex(lit) }
  })
}

export function concreteTex(color: string, repeat = 1) {
  return memo(`concrete:${color}:${repeat}`, () => {
    const c = canvas(256, 256), x = c.getContext('2d')!, r = rng(color.length * 31 + 5)
    x.fillStyle = color; x.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 2200; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.07})`; x.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3) }
    const t = tex(c); t.repeat.set(repeat, repeat); return t
  })
}
export function asphaltTex() {
  return memo('asphalt', () => {
    const c = canvas(256, 256), x = c.getContext('2d')!, r = rng(99)
    x.fillStyle = '#2a2d33'; x.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 3500; i++) { const v = 40 + r() * 40; x.fillStyle = `rgba(${v},${v},${v + 4},${0.25 + r() * 0.3})`; x.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2) }
    const t = tex(c); t.repeat.set(30, 4); return t
  })
}
export const isNightNow = () => { const h = (new Date().getUTCHours() + 4) % 24; return h < 6 || h >= 18.5 } // Dubai local time
