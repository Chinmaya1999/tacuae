import { useEffect, useRef, type ElementRef } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Group } from 'three'
import { type Room } from '../../../shared/data/catalog'
import { DeviceMesh, FurnitureMesh } from './Objects'
import { clamp, dims, mountFor, mountHeight, snapWall, toPct, type Wall } from './geometry'
import { useStudioUI } from './store'

export type MoveFn = (kind: 'device' | 'furniture', id: string, x: number, y: number) => void
type Props = { resetKey: number; zoom: { n: number; dir: 1 | -1 }; room: Room; readOnly?: boolean; onBegin: () => void; onMove: MoveFn; onToggle: (id: string) => void; onCapture: (fn: () => string) => void }

function Lights({ w, l, h }: { w: number; l: number; h: number }) {
  const night = useStudioUI((s) => s.night), r = Math.max(w, l)
  return (
    <>
      <hemisphereLight args={[night ? '#6a7bb0' : '#ffffff', '#1a1d26', night ? 0.9 : 1.15]} />
      <directionalLight position={[w * 0.8, h * 2.6, l * 0.9]} intensity={night ? 0.35 : 1.7} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-r} shadow-camera-right={r} shadow-camera-top={r} shadow-camera-bottom={-r} shadow-camera-far={r * 6} />
    </>
  )
}

/** Four walls (hidden when the camera is outside them, so you can see in), floor, ceiling (walk mode), window and door. */
function Shell({ room }: { room: Room }) {
  const { w, l, h } = dims(room), night = useStudioUI((s) => s.night), cam = useStudioUI((s) => s.cam)
  const refs = useRef<Partial<Record<Wall, Group | null>>>({})
  const wallColor = room.wall || '#d9dee7', gw = Math.min(2.2, w * 0.45)
  useFrame(({ camera }) => {
    const c = camera.position, e = 0.15, walk = cam === 'walk'
    const hide: Record<Wall, boolean> = { front: !walk && c.z > l / 2 + e, back: !walk && c.z < -l / 2 - e, left: !walk && c.x < -w / 2 - e, right: !walk && c.x > w / 2 + e }
    ;(Object.keys(hide) as Wall[]).forEach((k) => { const g = refs.current[k]; if (g) g.visible = !hide[k] })
  })
  const walls: { k: Wall; pos: [number, number, number]; rot: number; len: number }[] = [
    { k: 'back', pos: [0, h / 2, -l / 2], rot: 0, len: w }, { k: 'front', pos: [0, h / 2, l / 2], rot: Math.PI, len: w },
    { k: 'left', pos: [-w / 2, h / 2, 0], rot: Math.PI / 2, len: l }, { k: 'right', pos: [w / 2, h / 2, 0], rot: -Math.PI / 2, len: l },
  ]
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, l]} /><meshStandardMaterial color={room.floor || '#8a6f55'} roughness={0.55} metalness={0.05} /></mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} visible={cam === 'walk'} receiveShadow><planeGeometry args={[w, l]} /><meshStandardMaterial color="#eef1f6" roughness={1} /></mesh>
      {walls.map(({ k, pos, rot, len }) => (
        <group key={k} ref={(g) => { refs.current[k] = g }} position={pos} rotation={[0, rot, 0]}>
          <mesh position={[0, 0, -0.06]} receiveShadow castShadow><boxGeometry args={[len + 0.12, h, 0.12]} /><meshStandardMaterial color={wallColor} roughness={0.9} /></mesh>
          <mesh position={[0, -h / 2 + 0.05, 0.012]}><boxGeometry args={[len, 0.1, 0.02]} /><meshStandardMaterial color="#ffffff" roughness={0.6} /></mesh>
          {k === 'back' && <group position={[0, 1.55 - h / 2, 0]}>
            <mesh position={[0, 0, 0.02]}><boxGeometry args={[gw + 0.12, 1.32, 0.04]} /><meshStandardMaterial color="#cfd5df" /></mesh>
            <mesh position={[0, 0, 0.045]}><planeGeometry args={[gw, 1.2]} /><meshStandardMaterial color={night ? '#16234a' : '#d5dbff'} emissive={night ? '#16234a' : '#d5dbff'} emissiveIntensity={night ? 0.5 : 1.4} /></mesh>
          </group>}
          {k === 'right' && <mesh position={[0, 1.025 - h / 2, 0.03]} castShadow><boxGeometry args={[0.95, 2.05, 0.06]} /><meshStandardMaterial color="#6b5543" roughness={0.7} /></mesh>}
        </group>
      ))}
    </group>
  )
}

function Rig({ room, flat, resetKey, zoom }: { room: Room; flat: boolean; resetKey: number; zoom: { n: number; dir: 1 | -1 } }) {
  const cam = useStudioUI((s) => s.cam), drag = useStudioUI((s) => s.drag), { camera } = useThree()
  const controls = useRef<ElementRef<typeof OrbitControls>>(null)
  const { w, l, h } = dims(room), keys = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const c = controls.current; if (!c) return
    const d = Math.max(w, l) * 1.05 + 1
    const set = (p: [number, number, number], t: [number, number, number]) => { camera.position.set(...p); c.target.set(...t); c.update() }
    if (cam === 'orbit' || cam === 'free') set([d * 0.75, d * 0.75, d * 0.95], [0, h * 0.3, 0])
    else if (cam === 'top') set([0, d * 1.15 + h, 0.001], [0, 0, 0])
    else if (cam === 'front') set([0, h * 0.55, l / 2 + d * 1.1], [0, h * 0.42, 0])
    else set([0, 1.6, l / 2 - 0.7], [0, 1.6, l / 2 - 0.71])
  }, [cam, w, l, h, room.id, camera, resetKey])

  useEffect(() => { // zoom buttons: dolly along the line to the target (not while walking)
    const c = controls.current
    if (!c || !zoom.n || cam === 'walk') return
    const off = camera.position.clone().sub(c.target), len = Math.min(60, Math.max(2.5, off.length() * (zoom.dir > 0 ? 0.78 : 1.3)))
    camera.position.copy(c.target).add(off.setLength(len)); c.update()
  }, [zoom.n]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const typing = (e: KeyboardEvent) => ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
    const dn = (e: KeyboardEvent) => { if (!typing(e)) keys.current[e.key.toLowerCase()] = true }
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  useFrame((_, dt) => { // WASD / arrows walk, clamped inside the room
    const c = controls.current, k = keys.current
    if (cam !== 'walk' || !c) return
    const f = (k['w'] || k['arrowup'] ? 1 : 0) - (k['s'] || k['arrowdown'] ? 1 : 0), r = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0)
    if (!f && !r) return
    const dir = camera.getWorldDirection(camera.position.clone()); dir.y = 0; dir.normalize()
    const mx = (dir.x * f + -dir.z * r) * 2.2 * dt, mz = (dir.z * f + dir.x * r) * 2.2 * dt
    const nx = clamp(camera.position.x + mx, -w / 2 + 0.3, w / 2 - 0.3), nz = clamp(camera.position.z + mz, -l / 2 + 0.3, l / 2 - 0.3)
    c.target.x += nx - camera.position.x; c.target.z += nz - camera.position.z; camera.position.x = nx; camera.position.z = nz
  })

  const walk = cam === 'walk'
  return <OrbitControls ref={controls} makeDefault enabled={!drag} enableRotate={cam !== 'top' && cam !== 'front'} enablePan={!walk && !flat} screenSpacePanning enableZoom={!walk}
    rotateSpeed={walk ? -0.35 : 0.8} minDistance={walk ? 0.01 : 1.5} maxDistance={walk ? 0.05 : 60} maxPolarAngle={walk || cam === 'free' ? Math.PI : Math.PI / 2.02} enableDamping dampingFactor={0.08} />
}

function Capture({ onCapture }: { onCapture: (fn: () => string) => void }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => { onCapture(() => gl.domElement.toDataURL('image/png')) }, [gl, onCapture])
  return null
}

export default function RoomScene({ resetKey, zoom, room, readOnly, onBegin, onMove, onToggle, onCapture }: Props) {
  const { sel, drag, select, setDrag } = useStudioUI()
  const { w, l } = dims(room), info = useRef<{ kind: 'device' | 'furniture'; id: string; moved: boolean; sx: number; sz: number } | null>(null)

  const down = (kind: 'device' | 'furniture', id: string, height: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation(); select({ id, kind })
    if (readOnly) { if (kind === 'device') onToggle(id); return }
    info.current = { kind, id, moved: false, sx: e.point.x, sz: e.point.z }; onBegin(); setDrag({ id, kind, height })
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    const i = info.current; if (!i) return
    if (!i.moved && Math.hypot(e.point.x - i.sx, e.point.z - i.sz) < 0.08) return
    i.moved = true
    const [x, y] = toPct(e.point.x, e.point.z, w, l)
    if (i.kind === 'device') {
      const d = room.devices.find((p) => p.id === i.id)
      if (d && mountFor(d.cat).startsWith('wall')) { const s = snapWall(x, y, w, l); return onMove('device', i.id, s.x, s.y) }
    }
    onMove(i.kind, i.id, x, y)
  }
  useEffect(() => { // end a drag wherever the pointer is released; a press without movement toggles a device
    if (!drag) return
    const end = () => { const i = info.current; info.current = null; setDrag(null); if (i && !i.moved && i.kind === 'device') onToggle(i.id) }
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end)
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end) }
  }, [drag, setDrag, onToggle])

  return (
    <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ fov: 50, near: 0.05, far: 200, position: [8, 7, 9] }} gl={{ preserveDrawingBuffer: true, antialias: true }} onPointerMissed={() => select(null)}>
      <color attach="background" args={['#0a1220']} />
      <Lights w={w} l={l} h={room.h ?? 2.8} />
      <Shell room={room} />
      {(room.furniture ?? []).map((f) => <FurnitureMesh key={f.id} f={f} room={room} selected={sel?.id === f.id} onDown={down('furniture', f.id, 0)} />)}
      {room.devices.map((d) => <DeviceMesh key={d.id} d={d} room={room} selected={sel?.id === d.id} onDown={down('device', d.id, Math.max(0.05, mountHeight(mountFor(d.cat), room.h ?? 2.8) - (mountFor(d.cat) === 'ceiling' ? 0.1 : 0)))} />)}
      {drag && <mesh position={[0, drag.height, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={move}><planeGeometry args={[80, 80]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
      <Rig room={room} flat={false} resetKey={resetKey} zoom={zoom} />
      <Capture onCapture={onCapture} />
    </Canvas>
  )
}
