// One small animated 3D set per service. `step` (0–3) drives what is happening in it.
import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Aircon, Ball, Box, Curtains, Cyl, Fan, Floor, Lamp, Particles, Shade, Soft, damp, type V3 } from '../../smart-home/scene/parts'

type Props = { step: number }
const Glow = ({ p, s, color, on, power = 2 }: { p: V3; s: V3; color: string; on: boolean; power?: number }) => <mesh position={p}><boxGeometry args={s} /><meshStandardMaterial color={on ? color : '#2a2f45'} emissive={color} emissiveIntensity={on ? power : 0} toneMapped={false} /></mesh>

/** Slides or turns towards a target value every frame. */
function Move({ to, children, from = [0, 0, 0], speed = 2.5, spin }: { to: V3; from?: V3; speed?: number; spin?: V3; children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => { const p = g.current!.position; p.set(damp(p.x, to[0], speed, dt), damp(p.y, to[1], speed, dt), damp(p.z, to[2], speed, dt)); if (spin) { g.current!.rotation.x += spin[0] * dt; g.current!.rotation.y += spin[1] * dt; g.current!.rotation.z += spin[2] * dt } })
  return <group ref={g} position={from}>{children}</group>
}

/** A person who walks smoothly to wherever they are needed. */
function Person({ at, shirt, sit, scale = 1, face = 0 }: { at: [number, number]; shirt: string; sit?: boolean; scale?: number; face?: number }) {
  const root = useRef<THREE.Group>(null), legs = useRef<(THREE.Group | null)[]>([]), arms = useRef<(THREE.Group | null)[]>([]), phase = useRef(0)
  useFrame((_, dt) => {
    const g = root.current!, step = Math.min(dt, 0.05), dx = at[0] - g.position.x, dz = at[1] - g.position.z, far = Math.hypot(dx, dz), walking = far > 0.06
    if (walking) { const m = Math.min(far, 1.5 * step); g.position.x += (dx / far) * m; g.position.z += (dz / far) * m; phase.current += step * 8 }
    const want = walking ? Math.atan2(dx, dz) : face, turn = Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y))
    g.rotation.y += turn * Math.min(1, step * 9)
    const swing = walking ? Math.sin(phase.current) * 0.6 : 0, seated = sit && !walking
    for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; legs.current[i]!.rotation.x = damp(legs.current[i]!.rotation.x, seated ? -1.45 : swing * s, 12, step); arms.current[i]!.rotation.x = damp(arms.current[i]!.rotation.x, seated ? -0.6 : -swing * s * 0.8, 12, step) }
    g.position.y = damp(g.position.y, seated ? -0.28 * scale : walking ? Math.abs(Math.cos(phase.current)) * 0.03 : 0, 8, step)
  })
  const limb = (r: number, len: number, color: string) => <mesh position={[0, -len / 2, 0]} castShadow><capsuleGeometry args={[r, len - r, 8, 14]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
  return (
    <group ref={root} position={[at[0], 0, at[1]]} scale={scale}>
      {[-0.1, 0.1].map((x, i) => <group key={x} ref={(g) => { legs.current[i] = g }} position={[x, 0.78, 0]}>{limb(0.083, 0.74, '#2a2f45')}</group>)}
      <mesh position={[0, 1.07, 0]} scale={[1.1, 1, 0.72]} castShadow><capsuleGeometry args={[0.175, 0.28, 10, 20]} /><meshStandardMaterial color={shirt} roughness={0.8} /></mesh>
      {[-0.24, 0.24].map((x, i) => <group key={x} ref={(g) => { arms.current[i] = g }} position={[x, 1.26, 0]}>{limb(0.055, 0.5, shirt)}</group>)}
      <mesh position={[0, 1.55, 0]} scale={[0.93, 1.08, 0.98]} castShadow><sphereGeometry args={[0.15, 24, 18]} /><meshStandardMaterial color="#c68a63" roughness={0.6} /></mesh>
      <mesh position={[0, 1.58, -0.012]} rotation={[-0.34, 0, 0]} scale={[0.96, 1.08, 1.02]}><sphereGeometry args={[0.16, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.54]} /><meshStandardMaterial color="#1d1512" roughness={0.9} /></mesh>
    </group>
  )
}

const Room = ({ floor = 'wood', wall = '#e8e1d5' }: { floor?: 'wood' | 'marble' | 'tile'; wall?: string }) => <>
  <Floor at={[0, 0]} size={[8, 5.6]} surface={floor} rough={0.35} />
  <Box p={[0, 1.5, -2.88]} s={[8.2, 3, 0.16]} color={wall} rough={0.9} /><Box p={[-4.08, 1.5, 0]} s={[0.16, 3, 5.6]} color={wall} rough={0.9} />
  <Box p={[0, -0.12, 0]} s={[8.3, 0.2, 5.9]} color="#2a2d3c" />
</>
const Screen = ({ at, size, on, color = '#3b6cff', rot = 0 }: { at: V3; size: [number, number]; on: boolean; color?: string; rot?: number }) => <group position={at} rotation={[0, rot, 0]}><Box p={[0, 0, 0]} s={[size[0] + 0.07, size[1] + 0.07, 0.06]} color="#0a0a0d" rough={0.3} /><Glow p={[0, 0, 0.036]} s={[size[0], size[1], 0.005]} color={color} on={on} power={1.1} /></group>

function Bms({ step }: Props) {
  const floors = 5, H = 0.72
  return (
    <group position={[-0.9, 0, 0]}>
      <Box p={[0, -0.12, 0]} s={[5, 0.2, 3.2]} color="#2f3347" />
      <pointLight position={[-0.4, 1.2, 1.6]} color="#ffe3b0" intensity={7} distance={7} /><pointLight position={[-0.4, 3, 1.6]} color="#bcd4ff" intensity={7} distance={7} />
      {Array.from({ length: floors }, (_, f) => (
        <group key={f} position={[0, f * H, 0]}>
          <Box p={[0, H - 0.04, 0]} s={[4.4, 0.08, 2.6]} color="#767fa8" rough={0.6} />
          <Box p={[0, H / 2, -1.27]} s={[4.4, H, 0.06]} color="#222a52" />
          {[-2.17, 2.17].map((x) => <Box key={x} p={[x, H / 2, 0]} s={[0.07, H, 2.6]} color="#4b5688" />)}
          {[-1.5, -0.5, 0.5].map((x, i) => <group key={x}><Glow p={[x, H - 0.1, 0.3]} s={[0.6, 0.03, 0.24]} color="#ffdc9a" on={step === 3 ? true : (f + i) % 2 === 0} power={2.6} /><Soft p={[x, 0.17, -0.5]} s={[0.55, 0.06, 0.4]} color="#8c6a50" /><Screen at={[x, 0.36, -0.62]} size={[0.28, 0.18]} on color="#5aa8ff" /></group>)}
          {/* cooling ducts carry air when HVAC is shown */}
          <Cyl p={[-0.45, H - 0.18, -0.95]} a={[0.06, 0.06, 3.2]} r={[0, 0, Math.PI / 2]} color={step === 1 ? '#7fd4ff' : '#8b93a8'} metal={0.7} glow="#38bdf8" power={step === 1 ? 0.9 : 0} />
          <Particles active={step === 1} count={22} origin={[-2, 0.05, -0.8]} area={[3.2, 0.5, 0.8]} velocity={[0, -0.28, 0.1]} color="#a5dcff" size={0.05} />
          {step === 3 && <Glow p={[1.75, 0.3, 1.27]} s={[0.35, 0.55, 0.03]} color="#35e07c" on power={1.4} />}
        </group>
      ))}
      {/* elevator shaft and car */}
      <Box p={[1.55, (floors * H) / 2, -0.75]} s={[0.06, floors * H, 0.06]} color="#6b7194" metal={0.7} /><Box p={[2.05, (floors * H) / 2, -0.75]} s={[0.06, floors * H, 0.06]} color="#6b7194" metal={0.7} />
      <Move to={[1.8, [0.4, 1.8, 3.2, 1.1][step], -0.75]} speed={1.4}><Soft p={[0, 0, 0]} s={[0.42, 0.55, 0.45]} color="#d8c48a" metal={0.8} rough={0.25} /></Move>
      {/* roof plant */}
      <group position={[-1.2, floors * H + 0.25, 0]}><Soft p={[0, 0, 0]} s={[1.1, 0.45, 0.9]} color="#d6d9e6" metal={0.5} /><Move to={[0, 0.27, 0]} spin={[0, step === 1 ? 14 : 2, 0]}>{[0, 1, 2].map((i) => <Box key={i} p={[0, 0, 0]} r={[0, (i * Math.PI) / 3, 0]} s={[0.7, 0.03, 0.09]} color="#23263a" />)}</Move></group>
      {/* pump room */}
      <group position={[3.25, 0.3, 0.5]}><Cyl p={[0, 0.2, -0.5]} a={[0.35, 0.35, 1]} color="#2f7fb8" metal={0.6} rough={0.3} /><Cyl p={[0, -0.1, 0.3]} a={[0.22, 0.22, 0.45]} r={[Math.PI / 2, 0, 0]} color="#3f8f5a" metal={0.5} />
        <Move to={[0, -0.1, 0.56]} spin={[0, 0, step === 2 ? 12 : 1]}>{[0, 1].map((i) => <Box key={i} p={[0, 0, 0]} r={[0, 0, (i * Math.PI) / 2]} s={[0.36, 0.05, 0.03]} color="#f0f2fa" />)}</Move></group>
      {/* control desk: the one platform */}
      <group position={[3.1, 0.55, 1.5]} rotation={[0, -0.5, 0]}><Screen at={[0, 0.35, 0]} size={[1.15, 0.7]} on color="#141c4a" />{[0, 1, 2, 3].map((i) => <Move key={i} to={[-0.4 + i * 0.27, 0.22 + (i === step ? 0.17 : 0.04), 0.05]}><Glow p={[0, 0, 0]} s={[0.15, i === step ? 0.34 : 0.12, 0.01]} color={['#35e07c', '#5ec8ff', '#b09cff', '#ffd27a'][i]} on /></Move>)}<Soft p={[0, -0.18, 0.1]} s={[1.4, 0.1, 0.5]} color="#2d3142" /></group>
    </group>
  )
}

function SmartHome({ step }: Props) {
  const night = step === 3
  return (
    <>
      <Room />
      <Floor at={[0, 0.5]} size={[3.4, 2.4]} surface="marble" y={0.006} rough={0.7} />
      <group position={[0.2, 0, 1.15]}><Soft p={[0, 0.27, 0]} s={[2.6, 0.36, 0.9]} color="#2f7f86" rough={0.95} /><Soft p={[0, 0.65, 0.4]} s={[2.6, 0.6, 0.22]} color="#2f7f86" rough={0.95} />{[-1.4, 1.4].map((x) => <Soft key={x} p={[x, 0.48, 0]} s={[0.22, 0.44, 0.95]} color="#276a70" />)}</group>
      <Soft p={[0.2, 0.25, -2.55]} s={[2.6, 0.45, 0.45]} color="#4b3a2e" /><Screen at={[0.2, 1.15, -2.72]} size={[1.9, 1.05]} on={step === 2} />
      <Curtains at={[-2.4, 1.55, -2.68]} width={1.5} open={step >= 2 ? 0 : 100} color="#b9644f" /><Glow p={[-2.4, 1.55, -2.79]} s={[1.5, 1.55, 0.02]} color="#9fd0ff" on={!night} power={0.9} />
      <Lamp at={[2.7, 1.65, -1.4]} level={night ? 0 : step === 2 ? 20 : 90} strength={8}>{(m) => <><Cyl p={[0, -0.82, 0]} a={[0.02, 0.02, 1.6]} color="#26293a" /><Shade m={m} /></>}</Lamp>
      <Lamp at={[-0.3, 2.7, 0]} level={night ? 3 : step === 2 ? 12 : step === 0 ? 100 : 60} strength={12} color={step === 1 ? '#b79bff' : '#ffd9a0'} />
      <Aircon at={[2.4, 2.4, -2.7]} on warm={false} />
      <group position={[-1.9, 0, -0.2]}><Cyl p={[0, 0.3, 0]} a={[0.35, 0.35, 0.05]} color="#7a553a" /><Cyl p={[0, 0.15, 0]} a={[0.05, 0.2, 0.3]} color="#2b2f3d" /><Cyl p={[0, 0.45, 0]} a={[0.12, 0.14, 0.24]} color="#16191f" /><mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.1, 0.018, 8, 32]} /><meshStandardMaterial color="#8b93ff" emissive="#8b93ff" emissiveIntensity={step === 1 ? 3 : 0.3} toneMapped={false} /></mesh><Particles active={step === 1} count={20} origin={[-0.3, 0.65, -0.2]} area={[0.6, 0.9, 0.4]} velocity={[0, 0.4, 0]} color="#c4a8ff" size={0.08} /></group>
      <Box p={[-3.97, 1.1, 1.4]} s={[0.05, 2.1, 1]} color="#6d4a33" /><Glow p={[-3.92, 1.35, 0.7]} s={[0.04, 0.22, 0.16]} color={night ? '#ff453a' : '#35e07c'} on />
      <Person at={[[-3.1, 1.4], [-1.2, 0.3], [0.2, 0.95], [2.9, 1.2]][step] as [number, number]} shirt="#4f46e5" sit={step === 2} face={step === 2 ? Math.PI : step === 1 ? -1.2 : 0.6} />
    </>
  )
}

function Grms({ step }: Props) {
  const here = step === 1 || step === 2
  return (
    <>
      <Room floor="wood" wall="#d9d2c4" />
      <group position={[0.4, 0, -1.5]}><Soft p={[0, 0.25, 0]} s={[2.3, 0.34, 2.2]} color="#6d4f3c" /><Soft p={[0, 0.5, 0.03]} s={[2.15, 0.24, 2.1]} color="#f8f6f2" rough={0.95} /><Soft p={[0, 1.05, -1.1]} s={[2.5, 1.2, 0.14]} color="#454273" />{[-0.5, 0.5].map((x) => <Soft key={x} p={[x, 0.72, -0.7]} s={[0.75, 0.17, 0.4]} color="#fff" rough={1} />)}<Soft p={[0, 0.64, 0.55]} s={[2.18, 0.2, 0.9]} color="#a34f63" rough={1} /></group>
      {[-1.15, 1.95].map((x) => <group key={x}><Soft p={[x, 0.28, -2.4]} s={[0.5, 0.52, 0.45]} color="#8c6a50" /><Lamp at={[x, 0.9, -2.4]} level={here ? 80 : 0} strength={4} reach={4}>{(m) => <><Cyl p={[0, -0.23, 0]} a={[0.03, 0.08, 0.22]} color="#d8c48a" metal={0.8} /><Shade m={m} a={[0.12, 0.18, 0.22]} /></>}</Lamp></group>)}
      <Lamp at={[0, 2.7, 0.2]} level={here ? 90 : step === 0 ? 8 : 0} strength={12} />
      <Glow p={[-3.1, 1.55, -2.79]} s={[1.4, 1.7, 0.02]} color="#8cc4ff" on power={0.9} /><Curtains at={[-3.1, 1.55, -2.66]} width={1.4} open={step === 2 ? 100 : 0} color="#6f6cc4" />
      <Screen at={[-3.96, 1.5, -0.2]} size={[1.5, 0.85]} on={step === 2} rot={Math.PI / 2} />
      <Aircon at={[3.1, 2.4, -2.7]} on={here} warm={false} />
      {/* door, key card reader and bedside control panel */}
      <group position={[3.2, 0, 1.5]}><Box p={[0, 1.1, 0.55]} s={[0.12, 2.25, 0.14]} color="#3a3d4f" /><Box p={[0, 1.1, -0.55]} s={[0.12, 2.25, 0.14]} color="#3a3d4f" /><Move to={[0, 0, step === 0 || step === 3 ? -0.85 : 0]} speed={3}><Soft p={[0, 1.07, 0]} s={[0.09, 2.1, 0.96]} color="#6d4a33" rough={0.4} /></Move><Glow p={[-0.1, 1.2, 0.72]} s={[0.05, 0.22, 0.15]} color={step === 3 ? '#ff9f0a' : '#35e07c'} on /></group>
      <Screen at={[-1.15, 1.45, -2.76]} size={[0.34, 0.24]} on={here} color="#5ee6c8" />
      <Soft p={[2.55, 0.22, -0.2]} s={[0.55, 0.42, 0.75]} color="#c49a6c" />{step > 0 && step < 3 && <Soft p={[2.55, 0.62, -0.2]} s={[0.5, 0.35, 0.65]} color="#b45309" />}
      <Person at={[[2.7, 1.5], [1.7, 0.9], [-2, 0.2], [4.6, 1.5]][step] as [number, number]} shirt="#334155" face={step === 2 ? -1.6 : -0.7} />
    </>
  )
}

function LightingHall({ step }: Props) {
  const xs = [-3, -1.8, -0.6, 0.6, 1.8, 3], walker = ([[-3, 1], [0, 1], [3, 1], [3.8, 2]] as [number, number][])[step]
  const wall = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => { const m = wall.current!; m.emissive.setHSL((clock.elapsedTime * 0.12) % 1, 0.85, 0.55); m.emissiveIntensity = damp(m.emissiveIntensity, step === 2 ? 0.85 : 0, 3, 0.016) })
  const level = (i: number) => step === 0 ? 100 : step === 1 ? 15 + i * 17 : step === 2 ? 25 : 0
  return (
    <>
      <Room floor="marble" wall="#c8c9d6" />
      <mesh position={[0, 1.25, -2.78]}><planeGeometry args={[7.4, 2.1]} /><meshStandardMaterial ref={wall} color="#2b2f45" emissive="#8b5cf6" emissiveIntensity={0} transparent opacity={0.92} toneMapped={false} /></mesh>
      {xs.map((x, i) => <group key={x}><Cyl p={[x, 2.82, -0.4]} a={[0.006, 0.006, 0.4]} color="#222" /><Lamp at={[x, 2.55, -0.4]} level={step === 0 ? (Math.abs(x - walker[0]) < 1.7 ? 100 : 8) : level(i)} strength={4} reach={4.2}>{(m) => <Shade m={m} a={[0.06, 0.26, 0.24]} color="#e9e4da" />}</Lamp>
        <Soft p={[x, 0.55, -2.35]} s={[0.55, 0.08, 0.4]} color="#e8e4dc" /><Cyl p={[x, 0.27, -2.35]} a={[0.06, 0.1, 0.52]} color="#c9ccd8" metal={0.7} /><Ball p={[x, 0.78, -2.35]} radius={0.17} color={['#d8a35d', '#7c78c8', '#5fb8a0'][i % 3]} metal={0.4} rough={0.3} /></group>)}
      <group position={[-3.96, 1.35, 1]} rotation={[0, Math.PI / 2, 0]}><Soft p={[0, 0, 0]} s={[0.55, 0.4, 0.05]} color="#10131f" />{[-0.14, 0, 0.14].map((x, i) => <Glow key={x} p={[x, 0, 0.035]} s={[0.09, 0.24, 0.01]} color="#8b93ff" on={step === i} />)}</group>
      <Person at={walker} shirt="#0f766e" face={0.3} />
    </>
  )
}

/** A bead of light travelling along the bus cable from the panel to a device. */
function Signal({ path, on }: { path: V3[]; on: boolean }) {
  const dot = useRef<THREE.Mesh>(null), curve = useRef(new THREE.CatmullRomCurve3(path.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.05))
  useFrame(({ clock }) => { dot.current!.visible = on; if (on) dot.current!.position.copy(curve.current.getPointAt((clock.elapsedTime * 0.75) % 1)) })
  return <><mesh><tubeGeometry args={[curve.current, 80, 0.028, 8, false]} /><meshStandardMaterial color="#1f9d55" emissive="#35e07c" emissiveIntensity={on ? 0.9 : 0.08} /></mesh><mesh ref={dot}><sphereGeometry args={[0.09, 16, 12]} /><meshBasicMaterial color="#eaffd9" toneMapped={false} /></mesh></>
}

function Knx({ step }: Props) {
  const z = -2.72, from: V3 = [-2.9, 1.35, z]
  return (
    <>
      <Room floor="wood" wall="#e4e7f0" />
      {/* touch panel */}
      <Screen at={[-2.9, 1.35, -2.76]} size={[0.75, 0.52]} on color="#1d2b6b" />{[-0.18, 0.18].flatMap((x) => [-0.1, 0.1].map((y) => <Glow key={`${x}${y}`} p={[-2.9 + x, 1.35 + y, -2.7]} s={[0.26, 0.13, 0.008]} color="#8b93ff" on={step === 0} />))}
      {/* distribution board with KNX actuators */}
      <group position={[-0.9, 0.45, -2.72]}><Soft p={[0, 0, 0]} s={[1.5, 0.65, 0.12]} color="#c9ced9" metal={0.5} />{[0, 1, 2, 3, 4].map((i) => <group key={i} position={[-0.54 + i * 0.27, 0, 0.09]}><Soft p={[0, 0, 0]} s={[0.2, 0.46, 0.08]} color="#f4f5fa" /><Glow p={[0, 0.13, 0.05]} s={[0.05, 0.05, 0.01]} color="#35e07c" on={step === (i % 3) + 1 || i === 4} /></group>)}</group>
      <Signal path={[from, [-2.9, 0.12, z], [-0.9, 0.12, z], [-0.9, 0.45, z]]} on={step === 0} />
      <Signal path={[[-0.9, 0.8, z], [-0.9, 2.75, z], [0.3, 2.75, z], [0.3, 2.45, -2.0]]} on={step === 1} />
      <Lamp at={[0.3, 2.2, -1.95]} level={step >= 1 ? 100 : 0} strength={9}>{(m) => <Shade m={m} a={[0.12, 0.42, 0.34]} color="#f0b45f" />}</Lamp>
      <Signal path={[[-0.15, 0.45, z], [1.35, 0.45, z], [1.35, 2.6, z], [2.3, 2.6, z]]} on={step === 2} />
      <Glow p={[2.4, 1.5, -2.8]} s={[1.5, 1.6, 0.02]} color="#9fd0ff" on power={0.9} />
      <Box p={[2.4, 2.42, -2.68]} s={[1.62, 0.16, 0.14]} color="#8b90a8" metal={0.6} />
      <Move to={[2.4, step >= 2 ? 1.55 : 2.32, -2.7]} speed={1.6}>{Array.from({ length: 11 }, (_, i) => <Box key={i} p={[0, step >= 2 ? 0.7 - i * 0.14 : -i * 0.006, 0]} s={[1.5, 0.1, 0.035]} color="#c9a27e" />)}</Move>
      <Signal path={[[-0.6, 0.12, -2.6], [3.4, 0.12, -2.6], [3.4, 1.3, -2.7]]} on={step === 3} />
      <group position={[3.4, 1.4, -2.74]}><Soft p={[0, 0, 0]} s={[0.4, 0.4, 0.08]} color="#10131f" /><mesh position={[0, 0, 0.05]}><torusGeometry args={[0.11, 0.022, 10, 40, step === 3 ? Math.PI * 1.7 : Math.PI]} /><meshBasicMaterial color={step === 3 ? '#5ec8ff' : '#ffb46b'} toneMapped={false} /></mesh></group>
      <Fan at={[1.2, 2.4, 0.2]} speed={step === 3 ? 3 : 0} ceiling />
      <Soft p={[0.2, 0.38, 0.4]} s={[1.6, 0.08, 0.9]} color="#7a553a" /><Cyl p={[0.2, 0.18, 0.4]} a={[0.08, 0.3, 0.34]} color="#2b2f3d" />
      <Person at={step === 0 ? [-2.9, -1.7] : [-2.2, -0.2]} shirt="#7c3aed" face={step === 0 ? Math.PI : 1.2} />
    </>
  )
}

function Training({ step }: Props) {
  return (
    <>
      <Room floor="tile" wall="#dfe3ee" />
      <Screen at={[0, 1.75, -2.76]} size={[3.2, 1.55]} on color="#101a4a" />
      {[0, 1, 2, 3, 4].map((i) => <Move key={i} to={[-1.15 + i * 0.57, 1.45 + (step === 1 ? 0.1 : i === step ? 0.18 : 0), -2.68]}><Glow p={[0, 0, 0]} s={[0.4, 0.5, 0.01]} color={step === 3 ? '#35e07c' : '#8b93ff'} on={step === 1 ? true : i <= step + 1} power={0.9} /></Move>)}
      <Glow p={[0, 2.3, -2.69]} s={[2.2, 0.1, 0.01]} color="#ffffff" on />
      {[-2.1, 0, 2.1].map((x, i) => <group key={x}><Soft p={[x, 0.72, 0.25]} s={[1.5, 0.08, 0.75]} color="#a9774f" />{[-0.65, 0.65].map((a) => <Cyl key={a} p={[x + a, 0.36, 0.25]} a={[0.03, 0.03, 0.7]} color="#4a4f60" metal={0.6} />)}
        <group position={[x, 1.02, 0.05]}><Soft p={[0, 0, 0]} s={[0.95, 0.5, 0.06]} color="#c9ced9" metal={0.5} />{[-0.3, -0.1, 0.1, 0.3].map((a, k) => <Glow key={a} p={[a, 0.06, 0.04]} s={[0.11, 0.22, 0.01]} color={['#35e07c', '#5ec8ff', '#ffd27a', '#b09cff'][k]} on={step === 2 ? (k + i) % 2 === 0 : k === i} />)}</group>
        <Soft p={[x, 0.45, 1.05]} s={[0.5, 0.09, 0.5]} color="#2d3142" /><Person at={[x, 1.05]} shirt={['#0f766e', '#b45309', '#be185d'][i]} sit face={Math.PI} /></group>)}
      <Person at={step === 3 ? [-2.6, -1.6] : [[2.5, -1.7], [2, -1.7], [-2.2, -0.9]][step] as [number, number]} shirt="#1d4ed8" face={step === 2 ? 0.6 : 0.2} />
      {step === 3 && <Move to={[2.5, 1.6, -1.2]} from={[2.5, 0.6, -1.2]}><Box p={[0, 0, 0]} s={[0.9, 0.65, 0.03]} color="#fdf6e3" /><Ball p={[0.25, -0.15, 0.04]} radius={0.09} color="#d4a017" metal={0.8} />{[0.18, 0.04, -0.1].map((y) => <Box key={y} p={[-0.12, y, 0.02]} s={[0.42, 0.035, 0.01]} color="#454273" />)}</Move>}
      <Lamp at={[0, 2.8, 0.3]} level={75} strength={11} color="#f2f4ff" />
      <RoundedBox args={[0.5, 1, 0.5]} radius={0.05} position={[-3.5, 0.5, -2.3]} castShadow><meshStandardMaterial color="#4b3a2e" /></RoundedBox>
    </>
  )
}

export const SCENES: Record<string, (p: Props) => ReactNode> = {
  'building-management-system': Bms, 'smart-home-automation': SmartHome, 'guest-room-management-system': Grms,
  'lighting-and-dimming-control': LightingHall, 'knx-automation': Knx, 'knx-training': Training,
}
/** Where the camera sits, and how bright the daylight is, for each set. */
export const VIEW: Record<string, { eye: V3; look: V3; sun: number }> = {
  'building-management-system': { eye: [3.4, 2.5, 10], look: [0.45, 1.5, 0], sun: 0.85 },
  'smart-home-automation': { eye: [4.6, 4.1, 7.4], look: [-0.2, 0.9, -0.4], sun: 0.4 },
  'guest-room-management-system': { eye: [4.4, 4.3, 7.4], look: [-0.1, 0.85, -0.5], sun: 0.35 },
  'lighting-and-dimming-control': { eye: [3.4, 3.4, 8], look: [-0.2, 1.1, -0.6], sun: 0.22 },
  'knx-automation': { eye: [2.2, 3, 7.4], look: [0, 1.2, -1.2], sun: 0.38 },
  'knx-training': { eye: [3.6, 3.9, 7.6], look: [0, 1.05, -0.6], sun: 0.5 },
}
