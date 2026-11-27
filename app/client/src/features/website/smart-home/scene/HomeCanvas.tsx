// The 3D view: cinematic camera, sun, moon and reflections, room markers, the house and the family.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useHome } from '../store'
import { ROOMS, VIEWS } from '../data/home'
import House from './House'
import Outdoor from './Outdoor'
import People from './People'
import { damp } from './parts'
import { createOverlay, type Overlay } from './overlay'

export type CameraApi = { zoom: (factor: number) => void; reset: () => void }
/** Pixels of the canvas covered by text and controls. */
export type Insets = { left: number; top: number; bottom: number }

/** Flies to the chosen view, then leaves the visitor free to orbit it. */
function Rig({ api, still, orbit, insets }: { api: React.RefObject<CameraApi | null>; still: boolean; orbit: boolean; insets: Insets }) {
  const view = useHome((s) => s.view)
  const { camera, size } = useThree()
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const flying = useRef(true), eye = useMemo(() => new THREE.Vector3(), []), look = useMemo(() => new THREE.Vector3(), [])
  const frame = () => {
    const v = VIEWS.find((x) => x.id === view)!, c = camera as THREE.PerspectiveCamera
    look.set(...v.look); eye.set(...v.eye)
    // keep the subject fully in frame on narrow screens
    const half = Math.tan(THREE.MathUtils.degToRad(c.fov / 2)), need = (v.fit ?? 4.2) * (size.width < size.height * 1.3 ? 0.82 : 1) // phones crop the garden edges to show the house larger
    // fit the subject into the uncovered part of the screen, and centre it there
    const freeW = Math.max(200, size.width - insets.left), freeH = Math.max(200, size.height - insets.top - insets.bottom)
    c.setViewOffset(size.width, size.height, -insets.left / 2, (insets.bottom - insets.top) / 2, size.width, size.height)
    const dist = eye.distanceTo(look), min = Math.max(need / (half * (freeW / size.height)), (v.tall ?? 0) / (half * (freeH / size.height)))
    if (min > dist) eye.sub(look).multiplyScalar(min / dist).add(look)
    flying.current = true
  }
  useEffect(frame, [view, size.width, size.height, insets.left, insets.top, insets.bottom]) // eslint-disable-line react-hooks/exhaustive-deps
  api.current = {
    reset: () => { useHome.getState().look('cutaway'); frame() },
    zoom: (f) => { flying.current = false; const t = controls.current!.target, off = camera.position.clone().sub(t); off.setLength(THREE.MathUtils.clamp(off.length() * f, 4, 60)); camera.position.copy(t).add(off); controls.current!.update() },
  }
  useFrame((_, dt) => {
    const c = controls.current
    if (!c || !flying.current) return
    const k = still ? 1 : 1 - Math.exp(-2.4 * dt)
    camera.position.lerp(eye, k); c.target.lerp(look, k); c.update()
    if (camera.position.distanceTo(eye) < 0.05) flying.current = false
  })
  return <OrbitControls ref={controls} makeDefault enableZoom={false} enablePan={false} enableRotate={orbit} minPolarAngle={0.25} maxPolarAngle={1.42} onStart={() => { flying.current = false }} />
}

/** Daylight, sunset, moonlight and soft reflections that follow the clock and weather. */
function Sky({ shadows }: { shadows: boolean }) {
  const min = useHome((s) => s.min), weather = useHome((s) => s.weather)
  const sun = useRef<THREE.DirectionalLight>(null), fill = useRef<THREE.HemisphereLight>(null), tint = useMemo(() => new THREE.Color(), [])
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl), room = new RoomEnvironment(), map = pm.fromScene(room, 0.04).texture
    scene.environment = map
    return () => { scene.environment = null; map.dispose(); pm.dispose() }
  }, [gl, scene])
  useFrame((_, dt) => {
    const hour = min / 60
    const day = THREE.MathUtils.clamp(Math.sin(((hour - 5.75) / 13.25) * Math.PI), 0, 1), low = day > 0 && day < 0.45
    const dim = weather === 'rainy' ? 0.45 : weather === 'cold' ? 0.75 : 1, s = sun.current!, f = fill.current!, k = 1 - Math.exp(-2.5 * dt)
    s.color.lerp(tint.set(day === 0 ? '#8aa2ff' : low ? '#ffab6e' : weather === 'rainy' || weather === 'cold' ? '#c3d0e6' : weather === 'hot' ? '#ffe9bd' : '#fff3df'), k)
    s.intensity = damp(s.intensity, (day === 0 ? 0.55 : 0.7 + day * 1.9) * dim, 2.5, dt)
    f.intensity = damp(f.intensity, (0.42 + day * 0.55) * (weather === 'rainy' ? 0.85 : 1), 2.5, dt)
    f.color.lerp(tint.set(day === 0 ? '#5566b5' : '#cfe3ff'), k)
    scene.environmentIntensity = damp(scene.environmentIntensity, 0.09 + day * 0.3 * dim, 2.5, dt)
    const angle = day === 0 ? 0.6 : ((hour - 5.75) / 13.25) * Math.PI
    s.position.set(damp(s.position.x, Math.cos(angle) * -14, 1.5, dt), damp(s.position.y, 6 + day * 11, 1.5, dt), 9)
  })
  return (<>
    <hemisphereLight ref={fill} args={['#cfe3ff', '#5a4a3c', 0.7]} />
    <directionalLight ref={sun} position={[-6, 14, 9]} intensity={1.4} castShadow={shadows} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.02} shadow-camera-left={-17} shadow-camera-right={15} shadow-camera-top={13} shadow-camera-bottom={-12} />
  </>)
}

const MARKER_HEIGHT = (id: string) => (id === 'garden' ? 0.4 : id === 'entrance' ? 2.7 : 1.9)

/** A ring pulses on the floor where a device has just changed. */
function Rings() {
  const flash = useHome((s) => s.flash)
  const rings = useRef<THREE.Group>(null), age = useRef(9), seen = useRef(0)
  useFrame((_, dt) => {
    if (seen.current !== flash.key) { seen.current = flash.key; age.current = 0 }
    age.current += dt
    rings.current!.children.forEach((m) => { const mat = (m as THREE.Mesh).material as THREE.MeshBasicMaterial; mat.opacity = Math.max(0, 0.85 - age.current * 0.45); m.scale.setScalar(0.7 + Math.min(age.current, 1.9) * 0.45) })
  })
  return <group ref={rings}>{flash.rooms.map((id) => { const r = ROOMS.find((x) => x.id === id)!; return <mesh key={id} position={[r.at[0], 0.06, r.at[1]]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1, 1.12, 48]} /><meshBasicMaterial color="#a5adff" transparent opacity={0} depthWrite={false} /></mesh> })}</group>
}

/** Moves each label to where its point appears on screen. */
function Projector({ overlay }: { overlay: Overlay }) {
  const point = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    for (const [key, el] of overlay.elements) {
      const anchor = overlay.anchors.get(key)
      if (anchor) point.copy(anchor).project(camera)
      const shown = Boolean(anchor) && point.z < 1
      el.style.opacity = shown ? '1' : '0'
      if (shown) el.style.transform = `translate(-50%, -50%) translate(${((point.x + 1) / 2) * size.width}px, ${((1 - point.y) / 2) * size.height}px)`
    }
  })
  return null
}

/** Clickable room markers and the speech bubble of whoever gave a command. */
function Labels({ overlay }: { overlay: Overlay }) {
  const view = useHome((s) => s.view), room = useHome((s) => s.room), pick = useHome((s) => s.pick), say = useHome((s) => s.say)
  const [bubble, setBubble] = useState(say)
  useEffect(() => { setBubble(say); if (!say) return; const t = setTimeout(() => setBubble(null), 4200); return () => clearTimeout(t) }, [say])
  const attach = (key: string) => (el: HTMLElement | null) => { if (el) overlay.elements.set(key, el); else overlay.elements.delete(key) }
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ROOMS.map((r) => (
        <div key={r.id} ref={attach(r.id)} className="absolute left-0 top-0 opacity-0">
          <button type="button" onClick={() => pick(r.id)} aria-label={`Select ${r.name}`} style={{ visibility: view === 'exterior' ? 'hidden' : 'visible' }} className={`pointer-events-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[0.65rem] font-semibold shadow-lg backdrop-blur transition ${room === r.id ? 'border-white bg-primary text-white' : 'border-white/25 bg-black/45 text-white/90 hover:border-white'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /><span className={room === r.id ? '' : 'hidden 2xl:inline'}>{r.name}</span>
          </button>
        </div>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} ref={attach(`say-${i}`)} className="absolute left-0 top-0 opacity-0">
          {bubble?.who === i && <div className="w-max max-w-[220px] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[0.78rem] font-semibold leading-snug text-[#111827] shadow-xl">“{bubble.text}”</div>}
        </div>
      ))}
    </div>
  )
}

/** Without a graphics card, draw a few frames a second so the page stays responsive. */
function Throttle() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => { const t = setInterval(() => invalidate(), 160); return () => clearInterval(t) }, [invalidate])
  return null
}

export default function HomeCanvas({ api, insets, running, still, rich, slow }: { api: React.RefObject<CameraApi | null>; insets: Insets; running: boolean; still: boolean; rich: boolean; slow: boolean }) {
  const pick = useHome((s) => s.pick)
  const overlay = useMemo(() => {
    const o = createOverlay()
    for (const r of ROOMS) o.anchors.set(r.id, new THREE.Vector3(r.at[0], MARKER_HEIGHT(r.id), r.at[1]))
    return o
  }, [])
  return (
    <>
    <Canvas shadows={rich ? 'percentage' : false} dpr={slow ? 0.8 : [1, rich ? 1.6 : 1.25]} frameloop={!running ? 'never' : slow ? 'demand' : 'always'} camera={{ fov: 32, near: 0.5, far: 160, position: [-1.6, 22, 24] }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} style={{ touchAction: 'pan-y' }}>
      {slow && <Throttle />}
      <Rig api={api} insets={insets} still={still || slow} orbit={rich} />
      <Sky shadows={rich} />
      {/* clicking a floor selects that room */}
      <group onClick={(e) => { const r = ROOMS.find((x) => x.id !== 'entrance' && Math.abs(e.point.x - x.at[0]) < x.size[0] / 2 && Math.abs(e.point.z - x.at[1]) < x.size[1] / 2); if (r && e.delta < 6) { e.stopPropagation(); pick(r.id) } }}>
        <House />
        <Outdoor lite={!rich} />
      </group>
      <People instant={still || slow} overlay={overlay} />
      <Rings />
      <Projector overlay={overlay} />
    </Canvas>
    <Labels overlay={overlay} />
    </>
  )
}
