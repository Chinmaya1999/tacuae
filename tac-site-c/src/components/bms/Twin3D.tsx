import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Edges, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'
import { statusColor, worst, type Catalog, type Equip, type EquipType, type Live, type Project, type Status } from '../../data/bms'

export const FH = 3.2 // floor height (m)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
export const footprint = (units: number) => ({ w: 16 + Math.min(units, 30) * 0.7, l: 14 + Math.min(units, 30) * 0.3 })

type Sel = { towerId: string; level: number } | null
type Props = {
  project: Project; equipment: Equip[]; live: Live | null; catalog: Catalog; sel: Sel; selectedEquip: string | null; moduleFilter: string | null; placing: string | null; editable: boolean
  onFloor: (towerId: string, level: number) => void; onEquip: (id: string | null) => void; onPlace: (towerId: string, level: number, x: number, y: number) => void; onMove: (id: string, x: number, y: number) => void
}


/** Text label as a sprite (canvas texture): pure WebGL, so there is no DOM to clean up when the scene changes. */
function Label({ text, position, px = 14, color = '#00d5ff' }: { text: string; position: [number, number, number]; px?: number; color?: string }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'), ctx = c.getContext('2d')!, font = '600 40px Inter, system-ui, sans-serif'
    ctx.font = font; const w = Math.ceil(ctx.measureText(text).width) + 44; c.width = w; c.height = 72
    ctx.font = font; ctx.fillStyle = 'rgba(7,17,31,.88)'; ctx.strokeStyle = color; ctx.lineWidth = 3
    ctx.beginPath(); ctx.roundRect(2, 2, w - 4, 68, 34); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle'; ctx.fillText(text, 22, 38)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { t, w, h: 72 }
  }, [text, color])
  useEffect(() => () => tex.t.dispose(), [tex])
  return <sprite position={position} scale={[(tex.w / 72) * (px / 4), px / 4, 1]} raycast={() => null}><spriteMaterial map={tex.t} transparent depthTest={false} toneMapped={false} /></sprite>
}

function Marker({ e, def, status, selected, w, l, onDown, pos }: { e: Equip; def: EquipType; status: Status; selected: boolean; w: number; l: number; onDown: (ev: ThreeEvent<PointerEvent>) => void; pos?: { x: number; y: number } }) {
  const ref = useRef<Group>(null), body = useRef<Mesh>(null), [hover, setHover] = useState(false)
  const color = statusColor[status], hot = status === 'alarm' || status === 'fault'
  useFrame(({ clock }) => { if (body.current) body.current.scale.setScalar(hot ? 1 + Math.sin(clock.elapsedTime * 6) * 0.18 : 1) })
  const px = ((pos?.x ?? e.x) / 100 - 0.5) * w, pz = ((pos?.y ?? e.y) / 100 - 0.5) * l
  const geo = def.shape === 'cyl' ? <cylinderGeometry args={[0.55, 0.55, 1, 20]} /> : def.shape === 'sphere' ? <sphereGeometry args={[0.5, 16, 12]} /> : def.shape === 'tall' ? <boxGeometry args={[1, 2.2, 1]} /> : def.shape === 'cone' ? <coneGeometry args={[0.5, 1, 16]} /> : def.shape === 'octa' ? <octahedronGeometry args={[0.6]} /> : <boxGeometry args={[1.1, 0.9, 1.1]} />
  const h = def.shape === 'tall' ? 2.2 : 1
  return (
    <group ref={ref} position={[px, 0.125 + h / 2 + 0.05, pz]}>
      <mesh ref={body} castShadow onPointerDown={onDown} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        {geo}<meshStandardMaterial color={color} emissive={color} emissiveIntensity={status === 'offline' ? 0.1 : hot ? 1.2 : 0.55} roughness={0.4} metalness={0.2} />
        {selected && <Edges color="#ffffff" />}
      </mesh>
      {selected && <mesh position={[0, -h / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.9, 1.05, 32]} /><meshBasicMaterial color="#00d5ff" /></mesh>}
      {(hover || selected) && <Label text={e.tag} position={[0, h / 2 + 1.1, 0]} px={3.2} color="#ffffff" />}
    </group>
  )
}

function Beacon({ y, w, l, color }: { y: number; w: number; l: number; color: string }) {
  const m = useRef<Mesh>(null)
  useFrame(({ clock }) => { if (m.current) { const s = 1 + (Math.sin(clock.elapsedTime * 5) + 1) * 0.35; m.current.scale.setScalar(s) } })
  return <mesh ref={m} position={[w / 2 + 0.6, y + FH / 2, l / 2 + 0.6]}><sphereGeometry args={[0.45, 12, 10]} /><meshBasicMaterial color={color} /></mesh>
}

function Rig({ goal, animKey }: { goal: { pos: [number, number, number]; target: [number, number, number] }; animKey: string }) {
  const controls = useRef<any>(null), { camera } = useThree(), anim = useRef(true)
  useEffect(() => { anim.current = true }, [animKey])
  useFrame((_, dt) => {
    const c = controls.current
    if (!c || !anim.current) return
    const k = 1 - Math.exp(-dt * 4)
    camera.position.x += (goal.pos[0] - camera.position.x) * k; camera.position.y += (goal.pos[1] - camera.position.y) * k; camera.position.z += (goal.pos[2] - camera.position.z) * k
    c.target.x += (goal.target[0] - c.target.x) * k; c.target.y += (goal.target[1] - c.target.y) * k; c.target.z += (goal.target[2] - c.target.z) * k
    c.update()
    if (Math.abs(goal.pos[0] - camera.position.x) + Math.abs(goal.pos[1] - camera.position.y) + Math.abs(goal.pos[2] - camera.position.z) < 0.15) anim.current = false
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.02} minDistance={6} maxDistance={400} onStart={() => { anim.current = false }} />
}

function Scene({ project, equipment, live, catalog, sel, selectedEquip, moduleFilter, placing, editable, onFloor, onEquip, onPlace, onMove }: Props) {
  const defs = useMemo(() => Object.fromEntries(catalog.equipment.map((d) => [d.id, d])), [catalog])
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const dragRef = useRef(drag); dragRef.current = drag

  const layout = useMemo(() => { // towers side by side along X, centred
    const gap = 10, fps = project.towers.map((t) => footprint(t.unitsPerFloor)), total = fps.reduce((a, f) => a + f.w, 0) + gap * (project.towers.length - 1)
    let x = -total / 2
    return project.towers.map((t, i) => { const ox = x + fps[i].w / 2; x += fps[i].w + gap; return { t, ox, ...fps[i] } })
  }, [project.towers])
  const totalW = layout.reduce((a, b) => a + b.w, 0) + 10 * (layout.length - 1), maxH = Math.max(...project.towers.map((t) => t.floors)) * FH

  const status = (id: string): Status => live?.items[id]?.status ?? 'online'
  const levelStatus = useMemo(() => { const m = new Map<string, Status>(); for (const e of equipment) { const k = `${e.towerId}:${e.level}`, s = status(e.id); m.set(k, worst(m.get(k), s)) } return m }, [equipment, live]) // eslint-disable-line react-hooks/exhaustive-deps

  const selTower = sel ? layout.find((x) => x.t.id === sel.towerId) : undefined
  const goal = selTower && sel ? { pos: [selTower.ox + selTower.w * 0.25, sel.level * FH + Math.max(selTower.w, selTower.l) * 1.15, selTower.l * 1.45] as [number, number, number], target: [selTower.ox, sel.level * FH, 0] as [number, number, number] }
    : (() => { const R = Math.max(totalW / 2, maxH / 1.4) + 24; return { pos: [R * 0.8, maxH * 0.5 + R * 0.35, R * 1.5] as [number, number, number], target: [0, maxH * 0.38, 0] as [number, number, number] } })()

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
  const dragPlane = drag && selTower && sel ? { ox: selTower.ox, y: sel.level * FH + 0.15, w: selTower.w, l: selTower.l } : null

  return (
    <>
      <color attach="background" args={['#070f1c']} />
      <hemisphereLight args={['#9db8ff', '#0b1220', 0.9]} />
      <directionalLight position={[60, 120, 80]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-120} shadow-camera-right={120} shadow-camera-top={120} shadow-camera-bottom={-120} shadow-camera-far={400} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow onPointerDown={() => onEquip(null)}><circleGeometry args={[Math.max(120, totalW)]} /><meshStandardMaterial color="#0c1626" roughness={1} /></mesh>
      <gridHelper args={[Math.max(240, totalW * 2), 60, '#16304f', '#10223a']} position={[0, -0.04, 0]} />

      {layout.map(({ t, ox, w, l }) => {
        const isSelTower = sel?.towerId === t.id
        const levels = Array.from({ length: t.floors + t.basements + 1 }, (_, i) => i - t.basements) // -B .. F (roof)
        return (
          <group key={t.id} position={[ox, 0, 0]}>
            <Label text={t.name} position={[0, (t.floors + 1) * FH + 3, 0]} px={Math.max(10, w * 0.5)} />
            {levels.map((lv) => {
              const st = levelStatus.get(`${t.id}:${lv}`), hot = st === 'alarm' || st === 'fault', warn = st === 'warning'
              const isSel = isSelTower && sel!.level === lv, hidden = isSelTower && sel!.level < lv && lv < t.floors // cut away the floors above the selected one
              if (hidden) return null // not rendered at all: invisible meshes would still catch clicks
              const slabColor = hot ? statusColor[st!] : warn ? statusColor.warning : isSel ? '#00d5ff' : lv < 0 ? '#1d2940' : '#33445f'
              return (
                <group key={lv}>
                  <mesh position={[0, lv * FH, 0]} receiveShadow castShadow onPointerDown={slabClick(t.id, lv, ox, w, l)}>
                    <boxGeometry args={[w, 0.25, l]} /><meshStandardMaterial color={isSel ? '#1b2b44' : '#26354e'} emissive={slabColor} emissiveIntensity={isSel ? 0.07 : hot ? 0.9 : warn ? 0.45 : 0.12} roughness={0.7} />
                    {isSel && <Edges color="#00d5ff" />}
                  </mesh>
                  {lv < t.floors && !isSel && (
                    <mesh position={[0, lv * FH + FH / 2, 0]} onPointerDown={slabClick(t.id, lv, ox, w, l)}>
                      <boxGeometry args={[w - 0.2, FH - 0.3, l - 0.2]} /><meshStandardMaterial color={lv < 0 ? '#243049' : '#8fb4ff'} transparent opacity={lv < 0 ? 0.32 : sel && !isSelTower ? 0.06 : isSelTower ? 0.1 : 0.16} depthWrite={false} />
                    </mesh>)}
                  {hot && !isSel && lv < t.floors && <Beacon y={lv * FH} w={w} l={l} color={statusColor[st!]} />}
                </group>)
            })}
            {/* roof plant + selected-floor plan decoration */}
            {!(isSelTower && sel!.level < t.floors) && <mesh position={[0, t.floors * FH + 0.9, 0]} castShadow><boxGeometry args={[w * 0.35, 1.4, l * 0.3]} /><meshStandardMaterial color="#3b4c68" /></mesh>}
            {isSelTower && (
              <group position={[0, sel!.level * FH + 0.14, 0]}>
                <gridHelper args={[Math.max(w, l), Math.round(Math.max(w, l) / 2), '#1f3b5e', '#16304f']} />
                <mesh position={[0, 0.3, 0]}><boxGeometry args={[4, 0.6, 5]} /><meshStandardMaterial color="#2c3d58" /></mesh>
              </group>)}
            {/* equipment on the selected floor */}
            {isSelTower && equipment.filter((e) => e.towerId === t.id && e.level === sel!.level && (!moduleFilter || defs[e.type]?.module === moduleFilter)).map((e) => defs[e.type] && (
              <group key={e.id} position={[0, sel!.level * FH, 0]}>
                <Marker e={e} def={defs[e.type]} status={status(e.id)} selected={selectedEquip === e.id} w={w} l={l} pos={drag?.id === e.id ? drag : undefined}
                  onDown={(ev) => { ev.stopPropagation(); onEquip(e.id); if (editable && !placing) setDrag({ id: e.id, x: e.x, y: e.y }) }} />
              </group>))}
          </group>)
      })}
      {dragPlane && (
        <mesh position={[dragPlane.ox, dragPlane.y, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={(e) => setDrag((d) => (d ? { ...d, x: clamp(((e.point.x - dragPlane.ox) / dragPlane.w + 0.5) * 100, 2, 98), y: clamp((e.point.z / dragPlane.l + 0.5) * 100, 2, 98) } : d))}>
          <planeGeometry args={[dragPlane.w * 3, dragPlane.l * 3]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>)}
      <Rig goal={goal} animKey={`${sel?.towerId ?? ''}:${sel?.level ?? 'all'}:${project.id}`} />
    </>
  )
}

export default function Twin3D(p: Props) {
  return (
    <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ fov: 45, near: 0.5, far: 1200, position: [90, 60, 120] }} gl={{ antialias: true, preserveDrawingBuffer: true }} onPointerMissed={() => p.onEquip(null)}>
      <Scene {...p} />
    </Canvas>
  )
}
