// A realistic picture of a project's building, rendered from the same materials as the 3D twin.
// Loaded on demand (it pulls in three.js) and cached per project version.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { concreteTex, facadeSet, lobbySet, paletteFor, type Palette } from './facade'
import { FH, footprint } from './geometry'
import type { Project } from '../../data/bms'

const W = 800, H = 450
let renderer: THREE.WebGLRenderer | null = null, env: THREE.Texture | null = null, chain: Promise<unknown> = Promise.resolve()
const cache = new Map<string, Promise<string | null>>()

function init() {
  if (renderer) return renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap
  env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture
  return renderer
}
function skyTexture() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d')!, gr = g.createLinearGradient(0, 0, 0, 256)
  gr.addColorStop(0, '#3f78c0'); gr.addColorStop(0.55, '#9cc4e8'); gr.addColorStop(0.85, '#dbe9f4'); gr.addColorStop(1, '#eef3f6'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}
const std = (color: string, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o })
function mesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m
}

function facadeMats(pal: Palette, w: number, l: number, floors: number, seed: number) {
  const fs = facadeSet(pal), concrete = std(pal.frame, { map: concreteTex(pal.frame, Math.max(w, l) / 8) }), bays = (len: number) => Math.max(2, Math.round(len / pal.bayW))
  const mk = (len: number) => { const map = fs.day.clone(); map.needsUpdate = true; map.repeat.set(bays(len) / fs.cols, floors / fs.rows); map.offset.set(((seed * 3) % fs.cols) / fs.cols, 0); return new THREE.MeshStandardMaterial({ map, roughness: 0.22, metalness: 0.5, envMapIntensity: 1.3 }) }
  const mx = mk(l), mz = mk(w)
  return [mx, mx, concrete, concrete, mz, mz]
}

function build(project: Project) {
  const pal = paletteFor(project.type), scene = new THREE.Scene()
  scene.background = skyTexture(); scene.environment = env; scene.fog = new THREE.Fog('#dbe7f1', 240, 900)
  scene.add(new THREE.HemisphereLight('#cfe3ff', '#6b7a5a', 0.8))
  const sun = new THREE.DirectionalLight('#fff0dc', 2.8); sun.position.set(130, 170, 100); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, far: 700 }); sun.shadow.bias = -0.0003; scene.add(sun)

  const fps = project.towers.map((t) => footprint(t.unitsPerFloor)), gap = 12, total = fps.reduce((a, f) => a + f.w, 0) + gap * (project.towers.length - 1), depth = Math.max(...fps.map((f) => f.l))
  const maxH = Math.max(...project.towers.map((t) => t.floors)) * FH, Hx = (total + 34) / 2, Hz = (depth + 34) / 2

  // site: lawn, plaza, roads, trees
  mesh(scene, new THREE.CircleGeometry(700, 48), std('#3d5a42'), 0, -0.12, 0, false).rotation.x = -Math.PI / 2
  mesh(scene, new THREE.BoxGeometry(2 * Hx, 0.2, 2 * Hz), std('#b9b4aa', { map: concreteTex('#b9b4aa', 14) }), 0, -0.09, 0, false)
  const road = std('#2c2f35')
  for (const z of [-(Hz + 11), Hz + 11]) mesh(scene, new THREE.BoxGeometry(2 * (Hx + 21), 0.14, 14), road, 0, 0, z, false)
  for (const x of [-(Hx + 11), Hx + 11]) mesh(scene, new THREE.BoxGeometry(14, 0.14, 2 * (Hz + 4)), road, x, 0, 0, false)
  const dash = std('#e9e6d8')
  for (let i = 0; i < Math.floor((2 * (Hx + 20)) / 7); i++) for (const z of [-(Hz + 11), Hz + 11]) mesh(scene, new THREE.BoxGeometry(3, 0.04, 0.3), dash, -Hx - 10 + i * 7, 0.09, z, false)
  const trunk = std('#5a4632'), crown = std('#2f6b3f'); let a = 7; const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647
  const tree = (x: number, z: number, k: number) => { mesh(scene, new THREE.CylinderGeometry(0.25, 0.35, 3, 8), trunk, x, 1.5 * k, z).scale.setScalar(k); mesh(scene, new THREE.IcosahedronGeometry(2.4, 1), crown, x, 4.6 * k, z).scale.setScalar(k) }
  for (let i = 0; i < 14; i++) tree(-Hx + 6 + (i / 13) * (2 * Hx - 12), Hz - 3, 0.9)
  for (let i = 0; i < 36; i++) { const ang = rnd() * Math.PI * 2, rad = 1 + rnd() * 0.8; tree(Math.cos(ang) * (Hx + 40 + rnd() * 60) * rad, Math.sin(ang) * (Hz + 36 + rnd() * 50) * rad, 0.8 + rnd() * 0.9) }

  // neighbouring city
  const cityPal = paletteFor('office'), cfs = facadeSet(cityPal)
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2 + rnd() * 0.2, rad = 250 + rnd() * 160, bw = 28 + rnd() * 24, bh = 50 + rnd() * 130
    const map = cfs.day.clone(); map.needsUpdate = true; map.repeat.set(4, bh / 24)
    mesh(scene, new THREE.BoxGeometry(bw, bh, bw), new THREE.MeshStandardMaterial({ map, color: '#9aa6b4', roughness: 0.4, metalness: 0.3 }), Math.cos(ang) * rad * 1.35, bh / 2, Math.sin(ang) * rad, false)
  }

  // towers
  let x = -total / 2; const lobby = lobbySet(pal), conc = std(pal.frame, { map: concreteTex(pal.frame, 4) })
  project.towers.forEach((t, i) => {
    const { w, l } = fps[i], ox = x + w / 2; x += w + gap
    const g = new THREE.Group(); g.position.set(ox, 0, 0); scene.add(g)
    const floors = Math.max(1, t.floors - 1)
    mesh(g, new THREE.BoxGeometry(w - 0.2, floors * FH, l - 0.2), facadeMats(pal, w, l, floors, i + 1), 0, FH + (floors * FH) / 2 - 0.15, 0)
    const lm = lobby.day.clone(); lm.needsUpdate = true; lm.repeat.set(Math.max(1, Math.round(w / pal.bayW / 4)), 1)
    const lobbyMat = new THREE.MeshStandardMaterial({ map: lm, roughness: 0.25, metalness: 0.4, envMapIntensity: 1.2 }), lm2 = lm.clone(); lm2.needsUpdate = true; lm2.repeat.set(Math.max(1, Math.round(l / pal.bayW / 4)), 1)
    const lobbySide = new THREE.MeshStandardMaterial({ map: lm2, roughness: 0.25, metalness: 0.4, envMapIntensity: 1.2 })
    mesh(g, new THREE.BoxGeometry(w - 0.2, FH - 0.3, l - 0.2), [lobbySide, lobbySide, conc, conc, lobbyMat, lobbyMat], 0, FH / 2, 0)
    for (let lv = 0; lv <= t.floors; lv++) mesh(g, new THREE.BoxGeometry(w, 0.3, l), conc, 0, lv * FH, 0, lv % 3 === 0)
    if (pal.balconies) { const n = Math.max(1, Math.floor(w / (pal.bayW * 3))), bw = (w / n) * 0.78, slab = std(pal.frame), rail = new THREE.MeshStandardMaterial({ color: '#a9dcef', transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0.3, depthWrite: false })
      for (let lv = 1; lv < t.floors; lv++) for (const f of [1, -1]) for (let k = 0; k < n; k++) { const bx = -w / 2 + (k + 0.5) * (w / n); mesh(g, new THREE.BoxGeometry(bw, 0.2, 1.6), slab, bx, lv * FH + 0.02, f * (l / 2 + 0.8), false); mesh(g, new THREE.BoxGeometry(bw, 1.0, 0.05), rail, bx, lv * FH + 0.72, f * (l / 2 + 1.55), false) } }
    const top = t.floors * FH + 0.15, plant = std('#cfd4d8')
    mesh(g, new THREE.BoxGeometry(w, 1.2, 0.3), conc, 0, top + 0.6, l / 2 - 0.15); mesh(g, new THREE.BoxGeometry(w, 1.2, 0.3), conc, 0, top + 0.6, -l / 2 + 0.15)
    mesh(g, new THREE.BoxGeometry(0.3, 1.2, l), conc, w / 2 - 0.15, top + 0.6, 0); mesh(g, new THREE.BoxGeometry(0.3, 1.2, l), conc, -w / 2 + 0.15, top + 0.6, 0)
    mesh(g, new THREE.BoxGeometry(w * 0.3, 3.4, l * 0.26), plant, -w * 0.22, top + 1.7, -l * 0.15); mesh(g, new THREE.CylinderGeometry(1.9, 1.9, 2.8, 20), std('#d9dde1', { roughness: 0.5 }), w * 0.28, top + 1.4, -l * 0.2)
    for (let k = 0; k < 3; k++) mesh(g, new THREE.BoxGeometry(2.6, 1.8, 2.6), std('#9aa4ad', { metalness: 0.6, roughness: 0.4 }), w * 0.05 + k * 3.2, top + 0.9, l * 0.22)
    mesh(g, new THREE.CylinderGeometry(0.07, 0.12, 15, 8), std('#cfd3d6'), w * 0.35, top + 8, l * 0.3)
  })

  const R = Math.max(total / 2, maxH / 1.25) + 22, cam = new THREE.PerspectiveCamera(36, W / H, 1, 2500)
  cam.position.set(R * 0.78, maxH * 0.34 + R * 0.26, R * 1.3); cam.lookAt(0, maxH * 0.44, 0)
  return { scene, cam }
}

function render(project: Project): string | null {
  try {
    const r = init(), { scene, cam } = build(project)
    r.render(scene, cam)
    const url = r.domElement.toDataURL('image/jpeg', 0.86)
    scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose() })
    return url
  } catch { return null }
}

/** Picture of the project's building (JPEG data URL), cached by `key`. Renders are queued so the page stays responsive. */
export function buildingThumb(key: string, project: Project): Promise<string | null> {
  let p = cache.get(key)
  if (!p) { p = new Promise((res) => { chain = chain.then(() => new Promise<void>((done) => setTimeout(() => { res(render(project)); done() }, 30))) }); cache.set(key, p) }
  return p
}
