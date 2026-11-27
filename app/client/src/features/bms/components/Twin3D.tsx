import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Edges, Environment, Lightformer, OrbitControls, Sky, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh } from 'three'
import { FH, footprint } from './geometry'
import { modelDef } from './models'
import { asphaltTex, concreteTex, facadeSet, lobbySet, paletteFor, type Palette } from './facade'
import { statusColor, worst, type Catalog, type Equip, type EquipType, type Live, type Project, type Status } from '../data/bms'
import Cinematic from '../../../shared/three/Cinematic'

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

type Sel = { towerId: string; level: number } | null
type Props = {
  night: boolean; xray: boolean; resetKey: number; zoom: { n: number; dir: 1 | -1 }
  project: Project; equipment: Equip[]; live: Live | null; catalog: Catalog; sel: Sel; selectedEquip: string | null; moduleFilter: string | null; placing: string | null; editable: boolean
  onFloor: (towerId: string, level: number) => void; onEquip: (id: string | null) => void; onPlace: (towerId: string, level: number, x: number, y: number) => void; onMove: (id: string, x: number, y: number) => void
}


/** Text label as a sprite (canvas texture): pure WebGL, so there is no DOM to clean up when the scene changes. */
function Label({ text, position, px = 14, color = '#8b93ff' }: { text: string; position: [number, number, number]; px?: number; color?: string }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'), ctx = c.getContext('2d')!, font = '600 40px Inter, system-ui, sans-serif'
    ctx.font = font; const w = Math.ceil(ctx.measureText(text).width) + 44; c.width = w; c.height = 72
    ctx.font = font; ctx.fillStyle = 'rgba(11,16,32,.88)'; ctx.strokeStyle = color; ctx.lineWidth = 3
    ctx.beginPath(); ctx.roundRect(2, 2, w - 4, 68, 34); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle'; ctx.fillText(text, 22, 38)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { t, w, h: 72 }
  }, [text, color])
  useEffect(() => () => tex.t.dispose(), [tex])
  return <sprite position={position} scale={[(tex.w / 72) * (px / 4), px / 4, 1]} raycast={() => null}><spriteMaterial map={tex.t} transparent depthTest={false} toneMapped={false} /></sprite>
}

function Marker({ e, def, status, selected, onDown, pos, w, l }: { e: Equip; def: EquipType; status: Status; selected: boolean; w: number; l: number; onDown: (ev: ThreeEvent<PointerEvent>) => void; pos?: { x: number; y: number } }) {
  const md = useMemo(() => modelDef(def.id), [def.id]), model = useMemo(() => md.build(), [md])
  const beacon = useRef<Mesh>(null), [hover, setHover] = useState(false)
  const [sx, sy, sz] = model.userData.size as number[], k = md.scale, color = statusColor[status], hot = status === 'alarm' || status === 'fault'
  const lift = md.mount === 'ceiling' ? Math.max(0.2, 2.75 - sy * k) : md.mount === 'wall' ? 1.4 : 0, top = lift + sy * k, reach = Math.max(sx, sz) * k * 0.55 + 0.35
  useFrame(({ clock }, dt) => {
    if (status === 'online' || status === 'warning') for (const f of (model.userData.spin as THREE.Object3D[] | undefined) ?? []) f.rotation.y += dt * 7
    if (beacon.current) beacon.current.scale.setScalar(hot ? 1 + Math.sin(clock.elapsedTime * 6) * 0.3 : 1)
  })
  const px = ((pos?.x ?? e.x) / 100 - 0.5) * w, pz = ((pos?.y ?? e.y) / 100 - 0.5) * l
  return (
    <group position={[px, 0.16, pz]}>
      <primitive object={model} position={[0, lift, 0]} scale={k} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} raycast={() => null}><ringGeometry args={[reach, reach + 0.09, 48]} /><meshBasicMaterial color={color} transparent opacity={status === 'offline' ? 0.5 : 0.95} /></mesh>
      {md.mount !== 'floor' && <mesh position={[0, lift / 2, 0]} raycast={() => null}><cylinderGeometry args={[0.025, 0.025, lift, 6]} /><meshBasicMaterial color={color} transparent opacity={0.45} /></mesh>}
      <mesh ref={beacon} position={[0, top + 0.45, 0]} raycast={() => null}><sphereGeometry args={[0.17, 14, 10]} /><meshBasicMaterial color={color} /></mesh>
      {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} raycast={() => null}><ringGeometry args={[reach + 0.28, reach + 0.46, 48]} /><meshBasicMaterial color="#8b93ff" /></mesh>}
      <mesh position={[0, lift + (sy * k) / 2, 0]} onPointerDown={onDown} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <boxGeometry args={[Math.max(sx * k, 0.9) + 0.3, Math.max(sy * k, 0.9) + 0.3, Math.max(sz * k, 0.9) + 0.3]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {(hover || selected) && <Label text={e.tag} position={[0, top + 1.5, 0]} px={3.4} color="#ffffff" />}
    </group>
  )
}

function Beacon({ y, w, l, color }: { y: number; w: number; l: number; color: string }) {
  const m = useRef<Mesh>(null)
  useFrame(({ clock }) => { if (m.current) { const s = 1 + (Math.sin(clock.elapsedTime * 5) + 1) * 0.35; m.current.scale.setScalar(s) } })
  return <mesh ref={m} position={[w / 2 + 0.6, y + FH / 2, l / 2 + 0.6]}><sphereGeometry args={[0.45, 12, 10]} /><meshBasicMaterial color={color} /></mesh>
}


/** Facade materials for one tower: 8 floor variants (different lit windows) per side, a lobby, concrete. */
function useTowerMaterials(pal: Palette, w: number, l: number, night: boolean, seed: number) {
  const mats = useMemo(() => {
    const fs = facadeSet(pal), ls = lobbySet(pal), concrete = new THREE.MeshStandardMaterial({ map: concreteTex(pal.frame, Math.max(w, l) / 8), roughness: 0.92 })
    const bays = (len: number) => Math.max(2, Math.round(len / pal.bayW)), clones: THREE.Texture[] = []
    const mk = (len: number, v: number) => {
      const map = fs.day.clone(), em = fs.lit.clone()
      for (const t of [map, em]) { t.needsUpdate = true; t.repeat.set(bays(len) / fs.cols, 1 / fs.rows); t.offset.set(Math.floor(((seed * 7 + v * 5) % fs.cols)) / fs.cols, (v % fs.rows) / fs.rows); clones.push(t) }
      return new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: '#ffffff', emissiveIntensity: night ? 1.15 : 0, roughness: 0.2, metalness: 0.55, envMapIntensity: 1.3 })
    }
    const lobby = (len: number) => {
      const map = ls.day.clone(), em = ls.lit.clone()
      for (const t of [map, em]) { t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(bays(len) / 4)), 1); clones.push(t) }
      return new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: '#ffffff', emissiveIntensity: night ? 1.5 : 0.35, roughness: 0.25, metalness: 0.4, envMapIntensity: 1.2 })
    }
    const arr = (mx: THREE.Material, mz: THREE.Material) => [mx, mx, concrete, concrete, mz, mz] // +x −x +y −y +z −z
    const variants = Array.from({ length: 8 }, (_, v) => arr(mk(l, v), mk(w, v)))
    const lob = arr(lobby(l), lobby(w))
    return { concrete, variants, lobby: lob, clones }
  }, [pal, w, l, night, seed])
  useEffect(() => () => { mats.clones.forEach((t) => t.dispose()); mats.variants.flat().forEach((m) => m.dispose()); mats.lobby.forEach((m) => m.dispose()) }, [mats])
  return mats
}

/** Balconies as two instanced meshes (slabs + glass rails). Floors above the cut-away are simply not counted. */
function Balconies({ w, l, floors, bayW, cut, color }: { w: number; l: number; floors: number; bayW: number; cut: number; color: string }) {
  const slabs = useRef<THREE.InstancedMesh>(null), rails = useRef<THREE.InstancedMesh>(null)
  const n = Math.max(1, Math.floor(w / (bayW * 3))), perLevel = n * 2, total = Math.max(0, floors - 1) * perLevel
  useLayoutEffect(() => {
    if (!slabs.current || !rails.current) return
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1)
    let i = 0
    for (let lv = 1; lv < floors; lv++) for (const face of [1, -1]) for (let k = 0; k < n; k++) {
      const x = -w / 2 + (k + 0.5) * (w / n), sw = (w / n) * 0.78
      slabs.current.setMatrixAt(i, m.compose(new THREE.Vector3(x, lv * FH + 0.02, face * (l / 2 + 0.8)), q, new THREE.Vector3(sw, 0.2, 1.6)))
      rails.current.setMatrixAt(i, m.compose(new THREE.Vector3(x, lv * FH + 0.72, face * (l / 2 + 1.55)), q, new THREE.Vector3(sw, 1.0, 0.05)))
      i++
    }
    void one; slabs.current.instanceMatrix.needsUpdate = true; rails.current.instanceMatrix.needsUpdate = true
  }, [w, l, floors, n])
  useEffect(() => { const c = Math.max(0, Math.min(cut, floors - 1)) * perLevel; if (slabs.current) slabs.current.count = c; if (rails.current) rails.current.count = c }, [cut, floors, perLevel])
  if (!total) return null
  return (
    <>
      <instancedMesh ref={slabs} args={[undefined, undefined, total]} castShadow receiveShadow raycast={() => null}><boxGeometry /><meshStandardMaterial color={color} roughness={0.9} /></instancedMesh>
      <instancedMesh ref={rails} args={[undefined, undefined, total]} raycast={() => null}><boxGeometry /><meshStandardMaterial color="#a9dcef" transparent opacity={0.38} roughness={0.1} metalness={0.3} depthWrite={false} /></instancedMesh>
    </>
  )
}

/** Plant room, water tank, cooling units, solar panels, antenna: what a real roof looks like. */
function Rooftop({ w, l, y, pal, night }: { w: number; l: number; y: number; pal: Palette; night: boolean }) {
  const blink = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => { if (blink.current) (blink.current.material as THREE.MeshBasicMaterial).color.set(Math.sin(clock.elapsedTime * 3) > 0 ? '#ff2b2b' : '#401010') })
  const conc = <meshStandardMaterial color={pal.frame} roughness={0.9} />, metal = <meshStandardMaterial color="#9aa4ad" metalness={0.6} roughness={0.4} />
  return (
    <group position={[0, y + 0.15, 0]}>
      {[[0, l / 2 - 0.15, w, 0.3], [0, -l / 2 + 0.15, w, 0.3]].map(([x, z, len, t], i) => <mesh key={i} position={[x, 0.6, z]} castShadow><boxGeometry args={[len, 1.2, t]} />{conc}</mesh>)}
      {[w / 2 - 0.15, -w / 2 + 0.15].map((x, i) => <mesh key={i} position={[x, 0.6, 0]} castShadow><boxGeometry args={[0.3, 1.2, l]} />{conc}</mesh>)}
      <mesh position={[-w * 0.22, 1.7, -l * 0.15]} castShadow><boxGeometry args={[w * 0.3, 3.4, l * 0.26]} />{conc}</mesh>
      <mesh position={[-w * 0.22, 3.5, -l * 0.15]}><boxGeometry args={[w * 0.31, 0.25, l * 0.27]} /><meshStandardMaterial color={pal.roof} /></mesh>
      <mesh position={[w * 0.28, 1.5, -l * 0.2]} castShadow><cylinderGeometry args={[1.9, 1.9, 2.8, 24]} /><meshStandardMaterial color="#d9dde1" roughness={0.5} metalness={0.3} /></mesh>
      {[0, 1, 2].map((i) => <group key={i} position={[w * 0.05 + i * 3.2, 0.9, l * 0.22]}><mesh castShadow><boxGeometry args={[2.6, 1.8, 2.6]} />{metal}</mesh><mesh position={[0, 0.92, 0]}><cylinderGeometry args={[1, 1, 0.08, 20]} /><meshStandardMaterial color="#222" /></mesh></group>)}
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[-w * 0.3 + i * 2.2, 0.55, l * 0.28]} rotation={[-0.45, 0, 0]} castShadow><boxGeometry args={[1.9, 0.08, 3.2]} /><meshStandardMaterial color="#1b2f5c" metalness={0.7} roughness={0.25} /></mesh>)}
      <mesh position={[w * 0.35, 8, l * 0.3]}><cylinderGeometry args={[0.07, 0.12, 15, 8]} /><meshStandardMaterial color="#cfd3d6" /></mesh>
      <mesh ref={blink} position={[w * 0.35, 15.6, l * 0.3]}><sphereGeometry args={[0.28, 10, 8]} /><meshBasicMaterial color="#ff2b2b" /></mesh>
      {night && <pointLight position={[w * 0.35, 14, l * 0.3]} color="#ff3b3b" intensity={2} distance={14} />}
    </group>
  )
}

/** Plaza, roads with lane markings, lawn, trees, street lights and the surrounding city. */
function Site({ totalW, depth, night, xray, hideGround }: { totalW: number; depth: number; night: boolean; xray: boolean; hideGround: boolean }) {
  const Hx = (totalW + 34) / 2, Hz = (depth + 34) / 2, R = 14
  const trunks = useRef<THREE.InstancedMesh>(null), crowns = useRef<THREE.InstancedMesh>(null), dashes = useRef<THREE.InstancedMesh>(null), lamps = useRef<THREE.InstancedMesh>(null)
  const trees = useMemo(() => { const out: [number, number, number][] = []; let a = 7; const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647
    for (let i = 0; i < 70; i++) { const ang = rnd() * Math.PI * 2, rad = 1 + rnd() * 0.9, x = Math.cos(ang) * (Hx + 40 + rnd() * 70) * rad, z = Math.sin(ang) * (Hz + 36 + rnd() * 60) * rad; out.push([x, z, 0.8 + rnd() * 0.9]) }
    for (let i = 0; i < 14; i++) out.push([-Hx + 6 + (i / 13) * (2 * Hx - 12), Hz - 3, 0.9]); return out }, [Hx, Hz])
  const dashN = Math.floor((2 * (Hx + 20)) / 7), city = useMemo(() => { let a = 11; const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647
    return Array.from({ length: 22 }, (_, i) => { const ang = (i / 22) * Math.PI * 2 + rnd() * 0.2, rad = 260 + rnd() * 170; return { x: Math.cos(ang) * rad * 1.35, z: Math.sin(ang) * rad, w: 28 + rnd() * 26, d: 28 + rnd() * 26, h: 45 + rnd() * 140 } }) }, [])
  const cityMat = useMemo(() => { const fs = facadeSet(paletteFor('office')); const map = fs.day.clone(), em = fs.lit.clone(); for (const t of [map, em]) { t.needsUpdate = true; t.repeat.set(4, 4) }
    return new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: '#fff', emissiveIntensity: night ? 0.8 : 0, roughness: 0.4, metalness: 0.3, color: '#9aa6b4' }) }, [night])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
    trees.forEach(([x, z, k], i) => { trunks.current?.setMatrixAt(i, m.compose(V(x, 1.5 * k, z), q, V(k, k, k))); crowns.current?.setMatrixAt(i, m.compose(V(x, 4.6 * k, z), q, V(k, k, k))) })
    for (let i = 0; i < dashN; i++) { dashes.current?.setMatrixAt(i * 2, m.compose(V(-Hx - 10 + i * 7, 0.09, -(Hz + 11)), q, V(1, 1, 1))); dashes.current?.setMatrixAt(i * 2 + 1, m.compose(V(-Hx - 10 + i * 7, 0.09, Hz + 11), q, V(1, 1, 1))) }
    for (let i = 0; i < 16; i++) lamps.current?.setMatrixAt(i, m.compose(V(-Hx + 4 + (i % 8) * ((2 * Hx - 8) / 7), 4, i < 8 ? Hz + 3 : -Hz - 3), q, V(1, 1, 1)))
    for (const r of [trunks, crowns, dashes, lamps]) if (r.current) r.current.instanceMatrix.needsUpdate = true
  }, [trees, Hx, Hz, dashN])
  return (
    <group>
      {!hideGround && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow><circleGeometry args={[700, 64]} /><meshStandardMaterial color="#3a5440" roughness={1} transparent={xray} opacity={xray ? 0.3 : 1} depthWrite={!xray} /></mesh>}
      {!hideGround && <>
        <mesh position={[0, -0.09, 0]} receiveShadow><boxGeometry args={[2 * Hx, 0.2, 2 * Hz]} /><meshStandardMaterial map={concreteTex('#b9b4aa', 14)} roughness={0.85} transparent={xray} opacity={xray ? 0.35 : 1} depthWrite={!xray} /></mesh>
        {[[0, -(Hz + 11), 2 * (Hx + 21), R], [0, Hz + 11, 2 * (Hx + 21), R]].map(([x, z, lx, lz], i) => <mesh key={i} position={[x, 0, z]} receiveShadow><boxGeometry args={[lx, 0.14, lz]} /><meshStandardMaterial map={asphaltTex()} roughness={0.95} /></mesh>)}
        {[-(Hx + 11), Hx + 11].map((x, i) => <mesh key={i} position={[x, 0, 0]} receiveShadow><boxGeometry args={[R, 0.14, 2 * (Hz + 4)]} /><meshStandardMaterial map={asphaltTex()} roughness={0.95} /></mesh>)}
      </>}
      <instancedMesh ref={dashes} args={[undefined, undefined, dashN * 2]} raycast={() => null}><boxGeometry args={[3, 0.04, 0.3]} /><meshBasicMaterial color="#e9e6d8" /></instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} castShadow raycast={() => null}><cylinderGeometry args={[0.25, 0.35, 3, 8]} /><meshStandardMaterial color="#5a4632" roughness={1} /></instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, trees.length]} castShadow raycast={() => null}><icosahedronGeometry args={[2.4, 1]} /><meshStandardMaterial color="#2f6b3f" roughness={0.95} /></instancedMesh>
      <instancedMesh ref={lamps} args={[undefined, undefined, 16]} raycast={() => null}><cylinderGeometry args={[0.12, 0.16, 8, 6]} /><meshStandardMaterial color="#8b939a" metalness={0.6} roughness={0.4} /></instancedMesh>
      {city.map((c, i) => <mesh key={i} position={[c.x, c.h / 2, c.z]} material={cityMat} castShadow raycast={() => null}><boxGeometry args={[c.w, c.h, c.d]} /></mesh>)}
    </group>
  )
}

function Rig({ goal, animKey, minD, maxD, zoom }: { goal: { pos: [number, number, number]; target: [number, number, number] }; animKey: string; minD: number; maxD: number; zoom: { n: number; dir: 1 | -1 } }) {
  const controls = useRef<any>(null), { camera } = useThree(), anim = useRef(true)
  useEffect(() => { anim.current = true }, [animKey])
  useEffect(() => { // zoom buttons: move the camera along its line to the target
    const c = controls.current
    if (!c || !zoom.n) return
    anim.current = false
    const off = camera.position.clone().sub(c.target), len = Math.min(maxD, Math.max(minD, off.length() * (zoom.dir > 0 ? 0.76 : 1.32)))
    camera.position.copy(c.target).add(off.setLength(len)); c.update()
  }, [zoom.n]) // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((_, dt) => {
    const c = controls.current
    if (!c || !anim.current) return
    const k = 1 - Math.exp(-dt * 4)
    camera.position.x += (goal.pos[0] - camera.position.x) * k; camera.position.y += (goal.pos[1] - camera.position.y) * k; camera.position.z += (goal.pos[2] - camera.position.z) * k
    c.target.x += (goal.target[0] - c.target.x) * k; c.target.y += (goal.target[1] - c.target.y) * k; c.target.z += (goal.target[2] - c.target.z) * k
    c.update()
    if (Math.abs(goal.pos[0] - camera.position.x) + Math.abs(goal.pos[1] - camera.position.y) + Math.abs(goal.pos[2] - camera.position.z) < 0.15) anim.current = false
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.02} minDistance={minD} maxDistance={maxD} zoomSpeed={0.8} onStart={() => { anim.current = false }} />
}

function TowerBody({ t, ox, w, l, seed, pal, night, xray, sel, status, levelStatus, onSlab }: {
  t: Project['towers'][number]; ox: number; w: number; l: number; seed: number; pal: Palette; night: boolean; xray: boolean; sel: Sel; status: (id: string) => Status
  levelStatus: Map<string, Status>; onSlab: (towerId: string, level: number, ox: number, w: number, l: number) => (e: ThreeEvent<PointerEvent>) => void; equipmentLevels?: never
}) {
  const mats = useTowerMaterials(pal, w, l, night, seed), isSelTower = sel?.towerId === t.id, levels = Array.from({ length: t.floors + t.basements + 1 }, (_, i) => i - t.basements)
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8fb4ff', transparent: true, opacity: 0.13, depthWrite: false, roughness: 0.1 }), [])
  const basement = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3b424c', roughness: 0.95 }), [])
  void status
  return (
    <>
      {levels.map((lv) => {
        const st = levelStatus.get(`${t.id}:${lv}`), hot = st === 'alarm' || st === 'fault', warn = st === 'warning', isSel = isSelTower && sel!.level === lv
        if (isSelTower && sel!.level < lv && lv < t.floors) return null // floors above the selected one are removed (invisible meshes would still catch clicks)
        const slabCol = hot ? statusColor[st!] : warn ? statusColor.warning : '#000000'
        return (
          <group key={lv}>
            <mesh position={[0, lv * FH, 0]} receiveShadow castShadow material={mats.concrete} onPointerDown={onSlab(t.id, lv, ox, w, l)}>
              <boxGeometry args={[w, 0.3, l]} />
              {isSel && <Edges color="#8b93ff" />}
            </mesh>
            {isSel && <mesh position={[0, lv * FH + 0.158, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}><planeGeometry args={[w - 0.3, l - 0.3]} /><meshStandardMaterial color="#1a2a42" roughness={0.6} emissive="#0a2a40" emissiveIntensity={0.5} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} /></mesh>}
            {lv < 0 && !isSel && <mesh position={[0, lv * FH + FH / 2, 0]} material={basement} onPointerDown={onSlab(t.id, lv, ox, w, l)}><boxGeometry args={[w - 0.2, FH - 0.3, l - 0.2]} /></mesh>}
            {lv >= 0 && lv < t.floors && !isSel && (
              <mesh position={[0, lv * FH + FH / 2, 0]} castShadow receiveShadow={!xray} material={xray ? glass : lv === 0 ? mats.lobby : mats.variants[(lv * 5 + seed) % 8]} onPointerDown={onSlab(t.id, lv, ox, w, l)}>
                <boxGeometry args={[w - 0.2, FH - 0.3, l - 0.2]} />
              </mesh>)}
            {(hot || warn) && !isSel && lv >= 0 && lv < t.floors && (
              <mesh position={[0, lv * FH, 0]} raycast={() => null}><boxGeometry args={[w + 0.45, 0.34, l + 0.45]} /><meshStandardMaterial color={slabCol} emissive={slabCol} emissiveIntensity={hot ? 1.6 : 0.9} /></mesh>)}
            {hot && !isSel && lv >= 0 && lv < t.floors && <Beacon y={lv * FH} w={w} l={l} color={statusColor[st!]} />}
          </group>)
      })}
      {pal.balconies && <Balconies w={w} l={l} floors={t.floors} bayW={pal.bayW} cut={isSelTower ? sel!.level : t.floors - 1} color={pal.frame} />}
      {!(isSelTower && sel!.level <= t.floors) && <Rooftop w={w} l={l} y={t.floors * FH} pal={pal} night={night} />}
      {isSelTower && (
        <group position={[0, sel!.level * FH + 0.16, 0]}>
          <gridHelper args={[Math.max(w, l), Math.round(Math.max(w, l) / 2), '#2a5a8a', '#1b3a5c']} position={[0, 0.01, 0]} />
          <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[4, 1.8, 5]} /><meshStandardMaterial color="#8a93a0" roughness={0.8} /></mesh>
          {[-0.9, 0.9].map((x) => <mesh key={x} position={[x, 0.85, 2.52]} raycast={() => null}><boxGeometry args={[1.3, 1.6, 0.05]} /><meshStandardMaterial color="#c9ced2" metalness={0.85} roughness={0.28} /></mesh>)}
          {[[0, l / 2 - 0.1, w, 0.12], [0, -l / 2 + 0.1, w, 0.12]].map(([x, z, len, th], i) => <mesh key={i} position={[x, 0.55, z]} raycast={() => null}><boxGeometry args={[len, 1.1, th]} /><meshStandardMaterial color="#a9dcef" transparent opacity={0.3} roughness={0.1} /></mesh>)}
          {[w / 2 - 0.1, -w / 2 + 0.1].map((x, i) => <mesh key={i} position={[x, 0.55, 0]} raycast={() => null}><boxGeometry args={[0.12, 1.1, l]} /><meshStandardMaterial color="#a9dcef" transparent opacity={0.3} roughness={0.1} /></mesh>)}
        </group>)}
    </>
  )
}

function Scene({ night, xray, resetKey, zoom, project, equipment, live, catalog, sel, selectedEquip, moduleFilter, placing, editable, onFloor, onEquip, onPlace, onMove }: Props) {
  const defs = useMemo(() => Object.fromEntries(catalog.equipment.map((d) => [d.id, d])), [catalog])
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const dragRef = useRef(drag); dragRef.current = drag
  const pal = paletteFor(project.type)

  const layout = useMemo(() => { // towers side by side along X, centred
    const gap = 12, fps = project.towers.map((t) => footprint(t.unitsPerFloor)), total = fps.reduce((a, f) => a + f.w, 0) + gap * (project.towers.length - 1)
    let x = -total / 2
    return project.towers.map((t, i) => { const ox = x + fps[i].w / 2; x += fps[i].w + gap; return { t, ox, ...fps[i] } })
  }, [project.towers])
  const totalW = layout.reduce((a, b) => a + b.w, 0) + 12 * (layout.length - 1), depth = Math.max(...layout.map((x) => x.l)), maxH = Math.max(...project.towers.map((t) => t.floors)) * FH

  const status = (id: string): Status => live?.items[id]?.status ?? 'online'
  const levelStatus = useMemo(() => { const m = new Map<string, Status>(); for (const e of equipment) { const k = `${e.towerId}:${e.level}`, s = status(e.id); m.set(k, worst(m.get(k), s)) } return m }, [equipment, live]) // eslint-disable-line react-hooks/exhaustive-deps

  const selTower = sel ? layout.find((x) => x.t.id === sel.towerId) : undefined
  const goal = selTower && sel ? { pos: [selTower.ox + selTower.w * 0.25, sel.level * FH + Math.max(selTower.w, selTower.l) * 1.15, selTower.l * 1.45] as [number, number, number], target: [selTower.ox, sel.level * FH, 0] as [number, number, number] }
    : (() => { const R = Math.max(totalW / 2, maxH / 1.15) + 30; return { pos: [R * 0.8, maxH * 0.5 + R * 0.38, R * 1.5] as [number, number, number], target: [0, maxH * 0.42, 0] as [number, number, number] } })()
  const basementSel = !!sel && sel.level < 0

  useEffect(() => { // commit a drag wherever the pointer is released
    if (!drag) return
    const end = () => { const d = dragRef.current; setDrag(null); if (d) onMove(d.id, d.x, d.y) }
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end)
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end) }
  }, [!!drag]) // eslint-disable-line react-hooks/exhaustive-deps

  const slabClick = (towerId: string, level: number, ox: number, w: number, l: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (placing && sel && sel.towerId === towerId && sel.level === level) return onPlace(towerId, level, clamp(((e.point.x - ox) / w + 0.5) * 100, 2, 98), clamp((e.point.z / l + 0.5) * 100, 2, 98))
    onFloor(towerId, level)
  }
  const dragPlane = drag && selTower && sel ? { ox: selTower.ox, y: sel.level * FH + 0.2, w: selTower.w, l: selTower.l } : null
  const sky = night ? '#050b16' : '#b9d0e6', R = Math.max(totalW, 120) + 80

  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 180, 1100]} />
      {night ? <Stars radius={600} depth={60} count={2500} factor={5} fade speed={0.4} /> : <Sky distance={450000} sunPosition={[120, 70, 90]} turbidity={5} rayleigh={1.1} mieCoefficient={0.004} mieDirectionalG={0.85} />}
      <hemisphereLight args={night ? ['#41567f', '#0a0f18', 0.5] : ['#dde1ff', '#6b7a5a', 0.75]} />
      <directionalLight position={night ? [-80, 140, -60] : [120, 190, 90]} color={night ? '#8fa8ff' : '#fff0dc'} intensity={night ? 0.55 : 2.7} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003}
        shadow-camera-left={-R} shadow-camera-right={R} shadow-camera-top={R} shadow-camera-bottom={-R} shadow-camera-far={700} />
      <Environment key={night ? 'n' : 'd'} resolution={128} frames={1}>
        <Lightformer form="rect" intensity={night ? 0.5 : 3.2} color={night ? '#6c84c8' : '#e2e6ff'} position={[0, 30, -40]} scale={[120, 40, 1]} />
        <Lightformer form="rect" intensity={night ? 0.3 : 5} color={night ? '#8da2d8' : '#fff0d8'} position={[60, 20, 40]} rotation-y={-Math.PI / 3} scale={[60, 30, 1]} />
        <Lightformer form="rect" intensity={night ? 0.2 : 1.2} color="#c9d6c0" position={[0, -10, 0]} rotation-x={Math.PI / 2} scale={[200, 200, 1]} />
      </Environment>

      <Site totalW={totalW} depth={depth} night={night} xray={xray} hideGround={basementSel} />
      {night && Array.from({ length: 16 }, (_, i) => <pointLight key={i} position={[-(totalW + 34) / 2 + 4 + (i % 8) * ((totalW + 26) / 7), 8.4, (i < 8 ? 1 : -1) * ((depth + 34) / 2 + 3)]} color="#ffd9a0" intensity={30} distance={42} decay={2} />)}

      {layout.map(({ t, ox, w, l }, ti) => (
        <group key={t.id} position={[ox, 0, 0]}>
          {sel?.towerId !== t.id && <Label text={t.name} position={[0, (t.floors + 1) * FH + 4, 0]} px={Math.max(10, w * 0.5)} />}
          <TowerBody t={t} ox={ox} w={w} l={l} seed={ti + 1} pal={pal} night={night} xray={xray} sel={sel} status={status} levelStatus={levelStatus} onSlab={slabClick} />
          {sel?.towerId === t.id && equipment.filter((e) => e.towerId === t.id && e.level === sel.level && (!moduleFilter || defs[e.type]?.module === moduleFilter)).map((e) => defs[e.type] && (
            <group key={e.id} position={[0, sel.level * FH, 0]}>
              <Marker e={e} def={defs[e.type]} status={status(e.id)} selected={selectedEquip === e.id} w={w} l={l} pos={drag?.id === e.id ? drag : undefined}
                onDown={(ev) => { ev.stopPropagation(); onEquip(e.id); if (editable && !placing) setDrag({ id: e.id, x: e.x, y: e.y }) }} />
            </group>))}
        </group>))}
      {dragPlane && (
        <mesh position={[dragPlane.ox, dragPlane.y, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={(e) => setDrag((d) => (d ? { ...d, x: clamp(((e.point.x - dragPlane.ox) / dragPlane.w + 0.5) * 100, 2, 98), y: clamp((e.point.z / dragPlane.l + 0.5) * 100, 2, 98) } : d))}>
          <planeGeometry args={[dragPlane.w * 3, dragPlane.l * 3]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>)}
      {/* glowing windows after dark; daytime keeps the plain renderer, no ambient occlusion at city scale */}
      {night && <Cinematic bloom={0.55} threshold={0.75} ao={0} />}
      <Rig goal={goal} animKey={`${sel?.towerId ?? ''}:${sel?.level ?? 'all'}:${project.id}:${resetKey}`} minD={sel ? 16 : 45} maxD={sel ? 220 : 800} zoom={zoom} />
    </>
  )
}

export default function Twin3D(p: Props) {
  return (
    <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ fov: 45, near: 0.5, far: 1200, position: [90, 60, 120] }} gl={{ antialias: true, preserveDrawingBuffer: true, toneMappingExposure: 1.05 }} onPointerMissed={() => p.onEquip(null)}>
      <Scene {...p} />
    </Canvas>
  )
}
