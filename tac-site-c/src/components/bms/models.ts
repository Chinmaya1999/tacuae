// Detailed procedural 3D models of real building equipment (1 unit = 1 metre, origin at the floor, front faces +Z).
// The same models are used in the digital twin and rendered to pictures for the UI, so what you see in a card is what is in the building.
import * as THREE from 'three'

export type Mount = 'floor' | 'wall' | 'ceiling'
export type ModelDef = { build: () => THREE.Group; scale: number; mount: Mount }

const mats = new Map<string, THREE.MeshStandardMaterial>()
const mat = (color: string, o: { metal?: number; rough?: number; emissive?: string; ei?: number; opacity?: number } = {}) => {
  const k = JSON.stringify([color, o]); let m = mats.get(k)
  if (!m) { m = new THREE.MeshStandardMaterial({ color, metalness: o.metal ?? 0.15, roughness: o.rough ?? 0.55, emissive: o.emissive ?? '#000000', emissiveIntensity: o.ei ?? 0, transparent: o.opacity !== undefined, opacity: o.opacity ?? 1 }); mats.set(k, m) }
  return m
}
const C = { grey: '#cdd2d6', dark: '#2a2e35', darker: '#15181d', steel: '#b9c0c6', white: '#f1f3f4', yellow: '#f0b400', blue: '#1d5fa8', red: '#c2262d', green: '#2f9e5b', glass: '#10161c' }

type G = THREE.Group
const mk = (g: G, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o }
const box = (g: G, w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => mk(g, new THREE.BoxGeometry(w, h, d), m, x, y, z)
const cyl = (g: G, rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, seg = 24) => mk(g, new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z, rx, ry, rz)
const led = (g: G, x: number, y: number, z: number, c = '#35e07c', r = 0.012) => mk(g, new THREE.SphereGeometry(r, 8, 6), mat(c, { emissive: c, ei: 2.2, rough: 0.3 }), x, y, z)
const screen = (g: G, w: number, h: number, x: number, y: number, z: number, c = '#38d6ff') => box(g, w, h, 0.01, mat('#06222e', { emissive: c, ei: 0.9, rough: 0.2 }), x, y, z)

function fan(g: G, x: number, y: number, z: number, r: number, spin: THREE.Object3D[]) {
  const f = new THREE.Group(); f.position.set(x, y, z); g.add(f)
  cyl(f, r * 0.12, r * 0.12, 0.08, mat(C.dark), 0, 0.04, 0)
  for (let i = 0; i < 5; i++) { const b = box(f, r * 0.85, 0.015, r * 0.2, mat('#3a4048'), 0, 0.05, 0); b.position.set(Math.cos((i * 2 * Math.PI) / 5) * r * 0.45, 0.05, Math.sin((i * 2 * Math.PI) / 5) * r * 0.45); b.rotation.y = -(i * 2 * Math.PI) / 5 + 0.25 }
  spin.push(f)
}
const louvers = (g: G, n: number, w: number, x: number, y0: number, dy: number, z: number, m = mat(C.dark)) => { for (let i = 0; i < n; i++) box(g, w, 0.012, 0.02, m, x, y0 + i * dy, z) }
const seams = (g: G, xs: number[], h: number, y: number, z: number) => { for (const x of xs) box(g, 0.008, h, 0.01, mat(C.dark), x, y, z) }
const handle = (g: G, x: number, y: number, z: number) => box(g, 0.025, 0.14, 0.03, mat('#222', { metal: 0.8, rough: 0.3 }), x, y, z)

const B: Record<string, () => G> = {
  'lt-panel': () => { const g = new THREE.Group(), body = mat('#c7ccd0', { rough: 0.45 })
    box(g, 1.7, 0.12, 0.7, mat(C.darker), 0, 0.06, 0); box(g, 1.6, 2.02, 0.6, body, 0, 1.13, 0); box(g, 1.64, 0.05, 0.64, mat('#9aa1a7'), 0, 2.16, 0)
    seams(g, [-0.27, 0.27], 1.9, 1.1, 0.302); [-0.53, 0, 0.53].forEach((x) => handle(g, x + 0.2, 1.1, 0.31)); louvers(g, 5, 1.2, 0, 1.92, 0.04, 0.302)
    screen(g, 0.34, 0.16, 0, 1.6, 0.305); [['#35e07c', -0.12], ['#ffd166', 0], ['#ff4d4d', 0.12]].forEach(([c, x]) => led(g, x as number, 1.42, 0.305, c as string))
    box(g, 0.26, 0.3, 0.012, mat('#222'), 0.53, 1.55, 0.303); return g },
  'energy-meter': () => { const g = new THREE.Group()
    box(g, 0.32, 0.42, 0.12, mat('#d9dcde'), 0, 0.21, 0); box(g, 0.26, 0.34, 0.01, mat('#aeb4b8', { opacity: 0.8 }), 0, 0.21, 0.062); screen(g, 0.2, 0.09, 0, 0.3, 0.07, '#7dff9f'); [-0.06, 0.06].forEach((x) => box(g, 0.05, 0.03, 0.015, mat('#444'), x, 0.14, 0.066)); led(g, 0.1, 0.38, 0.066); return g },
  dg: () => { const g = new THREE.Group()
    box(g, 3.7, 0.28, 1.4, mat(C.darker), 0, 0.14, 0); box(g, 3.5, 1.5, 1.22, mat(C.yellow, { rough: 0.5 }), 0, 1.03, 0); box(g, 3.54, 0.06, 1.26, mat('#d29b00'), 0, 1.8, 0)
    louvers(g, 9, 0.5, -1.1, 0.7, 0.1, 0.62); louvers(g, 9, 0.5, 0.5, 0.7, 0.1, 0.62); seams(g, [0.02], 1.4, 1.03, 0.617)
    box(g, 0.38, 0.62, 0.04, mat(C.dark), 1.4, 1.1, 0.62); screen(g, 0.28, 0.14, 1.4, 1.25, 0.645); led(g, 1.32, 0.95, 0.645, '#ff4d4d'); led(g, 1.48, 0.95, 0.645)
    cyl(g, 0.34, 0.34, 0.95, mat('#555b62', { metal: 0.7, rough: 0.35 }), 1.15, 2.3, -0.2); cyl(g, 0.1, 0.1, 0.9, mat('#555b62', { metal: 0.7 }), 1.15, 3.2, -0.2); cyl(g, 0.16, 0.1, 0.1, mat(C.dark), 1.15, 3.7, -0.2)
    box(g, 0.5, 0.18, 0.18, mat(C.red), -1.6, 0.35, 0.72); return g },
  ups: () => { const g = new THREE.Group(), b = mat('#3b4048', { rough: 0.5 })
    box(g, 0.8, 1.8, 0.8, b, -0.42, 0.9, 0); box(g, 0.8, 1.8, 0.8, mat('#444b54'), 0.42, 0.9, 0); screen(g, 0.3, 0.14, -0.42, 1.5, 0.402, '#38d6ff'); louvers(g, 8, 0.6, -0.42, 0.4, 0.07, 0.402, mat('#111'))
    ;[-0.5, -0.4, -0.3].forEach((x, i) => led(g, x, 1.3, 0.402, ['#35e07c', '#35e07c', '#ffd166'][i])); seams(g, [0.42], 1.7, 0.9, 0.402); handle(g, 0.7, 0.9, 0.41); return g },
  'solar-inverter': () => { const g = new THREE.Group()
    box(g, 0.62, 0.82, 0.18, mat('#eef0f1'), 0, 0.41, 0); for (let i = 0; i < 8; i++) box(g, 0.5, 0.012, 0.1, mat('#9aa1a7'), 0, 0.15 + i * 0.085, -0.13); screen(g, 0.3, 0.12, 0, 0.62, 0.095, '#ffd166'); led(g, -0.2, 0.3, 0.095); led(g, -0.14, 0.3, 0.095, '#ffd166'); return g },
  chiller: () => { const g = new THREE.Group(), spin: THREE.Object3D[] = [], b = mat('#d5dde3', { rough: 0.45 })
    box(g, 5.2, 0.36, 2.3, mat(C.darker), 0, 0.18, 0); box(g, 5.0, 1.4, 2.1, b, 0, 1.06, 0)
    for (const z of [1.07, -1.07]) box(g, 4.8, 1.25, 0.05, mat('#20262d', { rough: 0.9 }), 0, 1.08, z)
    box(g, 5.04, 0.12, 2.14, mat('#8f9aa3'), 0, 1.82, 0); [-1.7, 0, 1.7].forEach((x) => { cyl(g, 0.78, 0.78, 0.24, mat('#aab3ba', { metal: 0.5 }), x, 1.95, 0, 0, 0, 0, 32); fan(g, x, 1.99, 0, 0.72, spin) })
    box(g, 0.1, 0.9, 1.0, mat('#c1c9ce'), 2.55, 1.0, 0); screen(g, 0.01, 0.2, 2.61, 1.2, 0.1, '#38d6ff'); cyl(g, 0.1, 0.1, 0.5, mat('#2c6fd0'), 2.78, 0.55, -0.45, 0, 0, Math.PI / 2); cyl(g, 0.1, 0.1, 0.5, mat('#d0402c'), 2.78, 0.55, 0.45, 0, 0, Math.PI / 2)
    g.userData.spin = spin; return g },
  ahu: () => { const g = new THREE.Group(), b = mat('#d6dce0', { rough: 0.5 })
    box(g, 4.2, 0.2, 1.7, mat('#29517e'), 0, 0.1, 0); box(g, 4.0, 1.5, 1.5, b, 0, 0.95, 0); box(g, 4.04, 0.06, 1.54, mat('#a9b2b9'), 0, 1.73, 0); seams(g, [-1.3, -0.3, 0.9], 1.45, 0.95, 0.752)
    ;[[-1.65, 0.5], [-0.8, 0.5], [0.3, 0.5], [1.5, 0.5]].forEach(([x]) => { handle(g, x + 0.28, 0.95, 0.76); box(g, 0.5, 0.7, 0.012, mat('#aeb6bc'), x, 1.0, 0.756) })
    box(g, 0.7, 0.9, 1.0, mat('#b7bfc5'), -2.35, 0.95, 0); box(g, 0.7, 0.9, 1.0, mat('#b7bfc5'), 2.35, 0.95, 0); cyl(g, 0.1, 0.1, 0.8, mat('#2c6fd0'), 0.4, 1.95, -0.4); cyl(g, 0.1, 0.1, 0.8, mat('#d0402c'), 0.7, 1.95, -0.4)
    screen(g, 0.22, 0.12, -0.8, 1.45, 0.76); led(g, -0.95, 1.45, 0.76); return g },
  fcu: () => { const g = new THREE.Group(), s: THREE.Object3D[] = []
    box(g, 0.62, 0.1, 0.62, mat(C.white), 0, 0.05, 0); box(g, 0.4, 0.02, 0.4, mat('#cfd3d6'), 0, 0.0, 0); for (const [x, z, w, d] of [[0, 0.24, 0.5, 0.04], [0, -0.24, 0.5, 0.04], [0.24, 0, 0.04, 0.5], [-0.24, 0, 0.04, 0.5]]) box(g, w, 0.015, d, mat('#8d9499'), x, -0.005, z)
    led(g, 0.26, 0.0, 0.26, '#35e07c', 0.01); void s; return g },
  vrf: () => { const g = new THREE.Group()
    box(g, 1.0, 0.3, 0.22, mat(C.white, { rough: 0.35 }), 0, 0.15, 0); box(g, 0.92, 0.03, 0.12, mat('#d3d7da'), 0, 0.03, 0.1); const f = box(g, 0.9, 0.012, 0.1, mat('#c9ced1'), 0, 0.02, 0.16); f.rotation.x = -0.5
    screen(g, 0.1, 0.03, 0.38, 0.22, 0.112, '#38d6ff'); led(g, 0.45, 0.22, 0.112, '#35e07c', 0.008); return g },
  'exhaust-fan': () => { const g = new THREE.Group(), s: THREE.Object3D[] = []
    cyl(g, 0.5, 0.5, 0.3, mat('#c3c9ce', { metal: 0.4 }), 0, 0.15, 0, Math.PI / 2, 0, 0, 32); for (const r of [0.2, 0.32, 0.44]) mk(g, new THREE.TorusGeometry(r, 0.012, 6, 32), mat('#565d64', { metal: 0.6 }), 0, 0.15, 0.16); fan(g, 0, 0.15, 0.04, 0.42, s); (s[0] as THREE.Group).rotation.x = Math.PI / 2; return g },
  'temp-sensor': () => { const g = new THREE.Group()
    box(g, 0.1, 0.1, 0.03, mat(C.white), 0, 0.05, 0); screen(g, 0.07, 0.035, 0, 0.065, 0.017, '#7dff9f'); for (let i = 0; i < 3; i++) box(g, 0.05, 0.004, 0.005, mat('#999'), 0, 0.03 - i * 0.008 + 0.01, 0.017); return g },
  'co2-sensor': () => { const g = new THREE.Group()
    box(g, 0.17, 0.11, 0.05, mat(C.white), 0, 0.055, 0); for (let i = 0; i < 5; i++) box(g, 0.1, 0.004, 0.006, mat('#9aa0a5'), 0, 0.03 + i * 0.01, 0.026); box(g, 0.12, 0.012, 0.006, mat('#35e07c', { emissive: '#35e07c', ei: 1.5 }), 0, 0.095, 0.026); return g },
  'access-door': () => { const g = new THREE.Group()
    box(g, 1.2, 2.25, 0.16, mat('#8e969c', { metal: 0.5 }), 0, 1.125, 0); box(g, 0.94, 2.1, 0.06, mat('#8a5a3a', { rough: 0.7 }), 0, 1.05, 0.04); handle(g, 0.36, 1.0, 0.1); box(g, 0.5, 0.08, 0.06, mat('#111', { metal: 0.6 }), 0, 2.16, 0.1)
    box(g, 0.12, 0.2, 0.04, mat('#15181d'), 0.78, 1.25, 0.04); led(g, 0.78, 1.3, 0.065, '#38d6ff'); box(g, 0.07, 0.07, 0.03, mat('#2f9e5b'), 0.78, 1.08, 0.05); return g },
  'rfid-reader': () => { const g = new THREE.Group()
    box(g, 0.1, 0.16, 0.03, mat('#15181d'), 0, 0.08, 0); mk(g, new THREE.TorusGeometry(0.03, 0.006, 6, 20), mat('#38d6ff', { emissive: '#38d6ff', ei: 1.8 }), 0, 0.09, 0.017); return g },
  biometric: () => { const g = new THREE.Group(), p = box(g, 0.14, 0.22, 0.04, mat('#15181d'), 0, 0.11, 0); p.rotation.x = -0.12
    screen(g, 0.1, 0.07, 0, 0.16, 0.022, '#38d6ff'); mk(g, new THREE.CylinderGeometry(0.025, 0.025, 0.006, 16), mat('#2a5a7a', { emissive: '#38d6ff', ei: 0.7 }), 0, 0.07, 0.022, Math.PI / 2); return g },
  pump: () => { const g = new THREE.Group(), blue = mat(C.blue, { rough: 0.4, metal: 0.25 }), pipe = mat('#8f979d', { metal: 0.7, rough: 0.35 })
    box(g, 1.5, 0.08, 0.55, mat(C.darker), 0.05, 0.04, 0); cyl(g, 0.24, 0.24, 0.8, blue, 0.5, 0.42, 0, 0, 0, Math.PI / 2); cyl(g, 0.26, 0.26, 0.08, mat('#3b78c4'), 0.12, 0.42, 0, 0, 0, Math.PI / 2)
    for (let i = 0; i < 6; i++) box(g, 0.012, 0.4, 0.5, mat('#164b86'), 0.2 + i * 0.12, 0.42, 0); cyl(g, 0.33, 0.33, 0.24, mat('#3d444b', { metal: 0.6, rough: 0.4 }), -0.15, 0.42, 0, 0, 0, Math.PI / 2, 28)
    cyl(g, 0.1, 0.1, 0.5, pipe, -0.55, 0.42, 0, 0, 0, Math.PI / 2); cyl(g, 0.1, 0.1, 0.5, pipe, -0.15, 0.82, 0); for (const [x, y, rz] of [[-0.8, 0.42, Math.PI / 2], [-0.15, 1.06, 0]]) cyl(g, 0.16, 0.16, 0.04, pipe, x, y, 0, 0, 0, rz); box(g, 0.16, 0.12, 0.1, mat(C.dark), 0.7, 0.72, 0); led(g, 0.7, 0.74, 0.055); return g },
  tank: () => { const g = new THREE.Group(), w = mat('#cfe2f2', { rough: 0.4 })
    cyl(g, 1.3, 1.3, 2.5, w, 0, 1.3, 0, 0, 0, 0, 40); cyl(g, 1.3, 1.3, 0.1, mat('#9fb6c9'), 0, 0.05, 0, 0, 0, 0, 40); mk(g, new THREE.SphereGeometry(1.3, 32, 12, 0, Math.PI * 2, 0, Math.PI / 5), w, 0, 2.55, 0).scale.y = 0.5
    for (let i = 0; i < 5; i++) box(g, 0.5, 0.03, 0.04, mat('#555'), 0.9, 0.4 + i * 0.5, 1.0); box(g, 0.03, 2.3, 0.03, mat('#555'), 0.7, 1.3, 1.05); box(g, 0.03, 2.3, 0.03, mat('#555'), 1.1, 1.3, 0.9)
    cyl(g, 0.04, 0.04, 2.0, mat('#7fc3e8', { opacity: 0.7 }), -1.2, 1.3, 0.5); cyl(g, 0.12, 0.12, 0.5, mat('#8f979d', { metal: 0.7 }), -1.4, 0.4, 0, 0, 0, Math.PI / 2); box(g, 0.4, 0.04, 0.4, mat('#aaa'), 0, 2.78, 0); return g },
  'flow-meter': () => { const g = new THREE.Group(), pipe = mat('#8f979d', { metal: 0.7, rough: 0.35 })
    cyl(g, 0.12, 0.12, 1.1, pipe, 0, 0.3, 0, 0, 0, Math.PI / 2); for (const x of [-0.38, 0.38]) cyl(g, 0.19, 0.19, 0.05, pipe, x, 0.3, 0, 0, 0, Math.PI / 2); cyl(g, 0.08, 0.08, 0.2, mat('#2c3037'), 0, 0.5, 0); box(g, 0.22, 0.2, 0.14, mat('#1f2933'), 0, 0.68, 0); screen(g, 0.16, 0.07, 0, 0.7, 0.075, '#7dff9f'); return g },
  'leak-sensor': () => { const g = new THREE.Group()
    cyl(g, 0.06, 0.06, 0.03, mat('#f0c400'), 0, 0.015, 0); for (const x of [-0.025, 0.025]) cyl(g, 0.004, 0.004, 0.03, mat('#cfcfcf', { metal: 0.9 }), x, 0.0, 0.03); led(g, 0, 0.034, 0, '#38d6ff', 0.008); return g },
  stp: () => { const g = new THREE.Group()
    cyl(g, 0.9, 0.9, 1.9, mat('#a9c4b4'), -0.6, 0.95, 0, 0, 0, 0, 36); cyl(g, 0.9, 0.9, 1.9, mat('#9cb8a8'), 1.2, 0.95, 0, 0, 0, 0, 36); box(g, 0.8, 0.7, 0.8, mat(C.green), 0.3, 0.35, 1.3); cyl(g, 0.07, 0.07, 1.6, mat('#8f979d', { metal: 0.7 }), 0.3, 0.9, 0.2, 0, 0, Math.PI / 2); box(g, 2.6, 0.04, 0.5, mat('#777'), 0.3, 1.95, 0); return g },
  elevator: () => { const g = new THREE.Group(), st = mat('#c9ced2', { metal: 0.85, rough: 0.28 })
    box(g, 1.7, 2.6, 0.22, mat('#7f878d', { metal: 0.6 }), 0, 1.3, -0.02); box(g, 0.56, 2.3, 0.05, st, -0.29, 1.15, 0.1); box(g, 0.56, 2.3, 0.05, st, 0.29, 1.15, 0.1); box(g, 0.008, 2.3, 0.06, mat(C.dark), 0, 1.15, 0.12)
    box(g, 0.36, 0.14, 0.03, mat('#220606', { emissive: '#ff3b3b', ei: 1.1 }), 0, 2.45, 0.1); box(g, 0.1, 0.26, 0.03, mat('#b9bfc4', { metal: 0.8 }), 0.95, 1.2, 0.05); led(g, 0.95, 1.25, 0.07, '#ffd166'); led(g, 0.95, 1.15, 0.07); return g },
  'lighting-zone': () => { const g = new THREE.Group()
    box(g, 0.62, 0.05, 0.62, mat('#e9ecee'), 0, 0.025, 0); box(g, 0.54, 0.01, 0.54, mat('#fff8e0', { emissive: '#fff1c0', ei: 1.6 }), 0, -0.002, 0); return g },
  'occupancy-sensor': () => { const g = new THREE.Group()
    cyl(g, 0.06, 0.06, 0.02, mat(C.white), 0, 0.01, 0); mk(g, new THREE.SphereGeometry(0.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f4f5f6', { opacity: 0.9 }), 0, 0, 0, Math.PI, 0, 0); led(g, 0.04, 0.0, 0.0, '#ffd166', 0.007); return g },
  cctv: () => { const g = new THREE.Group()
    cyl(g, 0.1, 0.1, 0.035, mat(C.white), 0, 0.02, 0); mk(g, new THREE.SphereGeometry(0.085, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#0b0e12', { rough: 0.1, metal: 0.5, opacity: 0.85 }), 0, 0.0, 0, Math.PI, 0, 0); cyl(g, 0.02, 0.02, 0.05, mat('#222'), 0.02, -0.04, 0.03, 0.9, 0, 0); led(g, 0.07, 0.02, 0.0, '#ff3b3b', 0.007); return g },
  'intrusion-sensor': () => { const g = new THREE.Group()
    box(g, 0.075, 0.11, 0.05, mat(C.white), 0, 0.055, 0); box(g, 0.05, 0.04, 0.01, mat('#d9d4c4', { opacity: 0.9 }), 0, 0.065, 0.027); led(g, 0, 0.1, 0.027, '#ff3b3b', 0.006); return g },
  'smoke-detector': () => { const g = new THREE.Group()
    cyl(g, 0.058, 0.058, 0.045, mat(C.white), 0, 0.022, 0, 0, 0, 0, 32); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; box(g, 0.008, 0.02, 0.02, mat('#8a9096'), Math.cos(a) * 0.05, 0.022, Math.sin(a) * 0.05).rotation.y = -a }; led(g, 0, 0.0, 0.0, '#ff3b3b', 0.008); return g },
  'fire-panel': () => { const g = new THREE.Group()
    box(g, 0.62, 0.82, 0.16, mat(C.red, { rough: 0.4 }), 0, 0.41, 0); box(g, 0.5, 0.66, 0.012, mat('#7a1519'), 0, 0.41, 0.085); screen(g, 0.3, 0.12, 0, 0.62, 0.095, '#ffd166'); for (let i = 0; i < 6; i++) led(g, -0.16 + (i % 3) * 0.16, 0.44 - Math.floor(i / 3) * 0.08, 0.095, i === 0 ? '#35e07c' : '#ffd166', 0.014); for (let i = 0; i < 4; i++) box(g, 0.07, 0.04, 0.02, mat('#ddd'), -0.18 + i * 0.12, 0.2, 0.095); return g },
  'ev-charger': () => { const g = new THREE.Group()
    box(g, 0.42, 0.1, 0.3, mat('#555b62'), 0, 0.05, 0); box(g, 0.34, 1.42, 0.22, mat('#eef1f2', { rough: 0.35 }), 0, 0.8, 0); box(g, 0.34, 0.22, 0.22, mat(C.green), 0, 1.6, 0); screen(g, 0.2, 0.22, 0, 1.2, 0.115, '#7dff9f'); box(g, 0.1, 0.16, 0.08, mat(C.dark), 0.2, 0.7, 0.05)
    mk(g, new THREE.TorusGeometry(0.2, 0.014, 6, 24, Math.PI * 1.3), mat('#111'), 0.2, 0.55, 0.12, 0, 0, Math.PI * 0.6); led(g, 0, 1.45, 0.115, '#7dff9f', 0.016); return g },
  'parking-counter': () => { const g = new THREE.Group()
    cyl(g, 0.05, 0.06, 2.3, mat('#6c7379', { metal: 0.6 }), 0, 1.15, 0); box(g, 1.3, 0.62, 0.12, mat('#0e1115'), 0, 2.45, 0); for (let i = 0; i < 3; i++) box(g, 0.2, 0.28, 0.01, mat('#0a2a10', { emissive: '#35e07c', ei: 1.4 }), -0.35 + i * 0.35, 2.45, 0.066); return g },
}

const D: Record<string, { scale: number; mount: Mount }> = {
  'lt-panel': { scale: 1, mount: 'floor' }, 'energy-meter': { scale: 3, mount: 'wall' }, dg: { scale: 1, mount: 'floor' }, ups: { scale: 1, mount: 'floor' }, 'solar-inverter': { scale: 2.2, mount: 'wall' },
  chiller: { scale: 1, mount: 'floor' }, ahu: { scale: 1, mount: 'floor' }, fcu: { scale: 2.6, mount: 'ceiling' }, vrf: { scale: 2.2, mount: 'wall' }, 'exhaust-fan': { scale: 1.6, mount: 'wall' }, 'temp-sensor': { scale: 6, mount: 'wall' }, 'co2-sensor': { scale: 5, mount: 'wall' },
  'access-door': { scale: 1, mount: 'floor' }, 'rfid-reader': { scale: 5, mount: 'wall' }, biometric: { scale: 4, mount: 'wall' },
  pump: { scale: 1.7, mount: 'floor' }, tank: { scale: 1, mount: 'floor' }, 'flow-meter': { scale: 2, mount: 'floor' }, 'leak-sensor': { scale: 7, mount: 'floor' }, stp: { scale: 1, mount: 'floor' },
  elevator: { scale: 1, mount: 'floor' }, 'lighting-zone': { scale: 2.2, mount: 'ceiling' }, 'occupancy-sensor': { scale: 6, mount: 'ceiling' },
  cctv: { scale: 5, mount: 'ceiling' }, 'intrusion-sensor': { scale: 6, mount: 'wall' }, 'smoke-detector': { scale: 7, mount: 'ceiling' }, 'fire-panel': { scale: 2.4, mount: 'wall' },
  'ev-charger': { scale: 1.5, mount: 'floor' }, 'parking-counter': { scale: 1.3, mount: 'floor' },
}

/** Every catalogue id has a model; unknown ids get a plain cabinet so the scene never breaks. */
export function modelDef(id: string): ModelDef {
  const d = D[id] ?? { scale: 1.5, mount: 'floor' as Mount }
  return { ...d, build: () => { const g = (B[id] ?? (() => { const x = new THREE.Group(); box(x, 0.6, 0.8, 0.5, mat(C.grey), 0, 0.4, 0); return x }))(); const bb = new THREE.Box3().setFromObject(g); g.userData.size = bb.getSize(new THREE.Vector3()).toArray(); g.userData.min = bb.min.toArray(); return g } }
}
export const MODEL_IDS = Object.keys(B)
