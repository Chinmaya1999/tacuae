// Pictures of the equipment: each 3D model is rendered once to a small PNG (cached), so cards and panels show the real model.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { modelDef } from './models'

let renderer: THREE.WebGLRenderer | null = null, env: THREE.Texture | null = null
const cache = new Map<string, Promise<string | null>>()
let chain: Promise<unknown> = Promise.resolve()
const SIZE = 256

function init() {
  if (renderer) return renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1); renderer.setSize(SIZE, SIZE); renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true
  env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  return renderer
}

function render(typeId: string): string | null {
  try {
    const r = init(), scene = new THREE.Scene(), def = modelDef(typeId), model = def.build()
    scene.environment = env; scene.add(new THREE.HemisphereLight('#ffffff', '#445566', 0.8))
    const sun = new THREE.DirectionalLight('#ffffff', 2.2); sun.position.set(3, 5, 4); sun.castShadow = true; scene.add(sun)
    const size = new THREE.Vector3(...(model.userData.size as number[])), min = new THREE.Vector3(...(model.userData.min as number[])), center = min.clone().add(size.clone().multiplyScalar(0.5))
    model.position.sub(new THREE.Vector3(center.x, min.y, center.z)); scene.add(model)
    const floor = new THREE.Mesh(new THREE.CircleGeometry(Math.max(size.x, size.z) * 0.9, 48), new THREE.ShadowMaterial({ opacity: 0.35 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
    const radius = Math.max(size.length() * 0.5, 0.1), cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100), dist = radius / Math.sin((cam.fov * Math.PI) / 360) * 1.05
    cam.position.set(dist * 0.62, size.y * 0.5 + dist * 0.38, dist * 0.78); cam.lookAt(0, size.y * 0.46, 0)
    r.render(scene, cam)
    const url = r.domElement.toDataURL('image/png')
    scene.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose() })
    return url
  } catch { return null }
}

/** Picture of an equipment type (data URL), or null when WebGL is unavailable. Renders are queued one per tick so the page stays responsive. */
export function thumbFor(typeId: string): Promise<string | null> {
  let p = cache.get(typeId)
  if (!p) { p = new Promise((res) => { chain = chain.then(() => new Promise<void>((done) => setTimeout(() => { res(render(typeId)); done() }, 0))) }); cache.set(typeId, p) }
  return p
}
