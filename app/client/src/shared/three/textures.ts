// Surfaces painted on a canvas (no downloads). Floors are light greys so the chosen colour tints them.
import { useMemo } from 'react'
import * as THREE from 'three'

export type Surface = 'wood' | 'tile' | 'marble' | 'plaster' | 'grass' | 'paving'

export function useTexture(kind: Surface, rx: number, ry: number) {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512
    const g = c.getContext('2d')!
    let n = 29
    const rnd = () => (n = (n * 16807) % 2147483647) / 2147483647
    const speck = (count: number, color: () => string, w = 2, h = 2) => { for (let i = 0; i < count; i++) { g.fillStyle = color(); g.fillRect(rnd() * 512, rnd() * 512, w, h) } }
    const grey = (v: number) => `rgb(${v},${v},${v})`
    g.fillStyle = grey(235); g.fillRect(0, 0, 512, 512)
    if (kind === 'wood') for (let row = 0; row < 8; row++) {
      const shift = rnd() * 300
      for (let k = -2; k < 3; k++) { g.fillStyle = grey(200 + Math.round(rnd() * 50)); g.fillRect(shift + k * 340, row * 64, 338, 62) }
      for (let i = 0; i < 130; i++) { g.fillStyle = `rgba(60,40,20,${0.05 + rnd() * 0.12})`; g.fillRect(rnd() * 512, row * 64 + rnd() * 62, 30 + rnd() * 140, 1) }
    }
    if (kind === 'tile' || kind === 'paving') for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = grey((kind === 'tile' ? 222 : 150) + Math.round(rnd() * 30)); g.fillRect(x * 128 + 2, y * 128 + 2, 124, 124) }
    if (kind === 'marble') { speck(6000, () => `rgba(90,90,100,${rnd() * 0.12})`); for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(100,100,115,${0.12 + rnd() * 0.25})`; g.lineWidth = 0.5 + rnd() * 2; g.beginPath(); let x = rnd() * 512, y = 0; g.moveTo(x, y); while (y < 512) { x += (rnd() - 0.5) * 90; y += 30 + rnd() * 50; g.lineTo(x, y) } g.stroke() } }
    if (kind === 'plaster') speck(26000, () => grey(205 + Math.round(rnd() * 50)))
    if (kind === 'grass') { g.fillStyle = '#41692f'; g.fillRect(0, 0, 512, 512); speck(16000, () => `hsl(${85 + rnd() * 40}, ${35 + rnd() * 25}%, ${18 + rnd() * 27}%)`, 2, 5) }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
    return t
  }, [kind, rx, ry])
}

/** The view through a window: sky, sun or moon and a city skyline. */
export function useCityView(night: boolean) {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 288
    const g = c.getContext('2d')!, sky = g.createLinearGradient(0, 0, 0, 288)
    sky.addColorStop(0, night ? '#070b22' : '#4f9be8'); sky.addColorStop(1, night ? '#2a2a66' : '#d9ecff')
    g.fillStyle = sky; g.fillRect(0, 0, 512, 288)
    g.fillStyle = night ? '#e8eeff' : '#fff4c2'; g.beginPath(); g.arc(400, 62, night ? 16 : 24, 0, Math.PI * 2); g.fill()
    let n = 41
    const rnd = () => (n = (n * 16807) % 2147483647) / 2147483647
    for (const [base, shade] of [[170, night ? '#141a3a' : '#9db6d4'], [215, night ? '#0b0f26' : '#6f89a8']] as const)
      for (let x = 0; x < 512;) {
        const w = 24 + rnd() * 40, h = 40 + rnd() * (288 - base)
        g.fillStyle = shade; g.fillRect(x, base - h / 2, w, 288)
        if (night) for (let yy = base - h / 2 + 8; yy < 280; yy += 12) for (let xx = x + 5; xx < x + w - 6; xx += 10) if (rnd() > 0.62) { g.fillStyle = rnd() > 0.5 ? '#ffd98a' : '#bcd4ff'; g.fillRect(xx, yy, 4, 5) }
        x += w + 3
      }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [night])
}
