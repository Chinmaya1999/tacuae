// The cut-away house: seven indoor spaces and their smart devices, driven by the simulation values.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useHome } from '../store'
import { OUTSIDE, isDark } from '../engine/automation'
import { Aircon, Ball, Box, Curtains, Cyl, Fan, Floor, Lamp, Particles, Shade, Soft, damp, useSurface, type V3 } from './parts'

const WALL = '#ece6dc', TRIM = '#8f89a6'
/** A wall seen from above: low walls inside so every room stays visible. */
const Wall = ({ p, s, color = WALL }: { p: V3; s: V3; color?: string }) => <><Box p={p} s={s} color={color} rough={0.9} /><Box p={[p[0], p[1] + s[1] / 2 + 0.025, p[2]]} s={[s[0] + 0.03, 0.05, s[2] + 0.03]} color={TRIM} cast={false} /></>

function Window({ at, width, glass }: { at: V3; width: number; glass: THREE.MeshBasicMaterial }) {
  return (
    <group position={at}>
      <mesh material={glass}><planeGeometry args={[width, 1.55]} /></mesh>
      {[-width / 2, 0, width / 2].map((v) => <Box key={v} p={[v, 0, 0.02]} s={[0.06, 1.62, 0.06]} color="#2c2f3d" />)}
      {[-0.8, 0.8].map((v) => <Box key={v} p={[0, v, 0.02]} s={[width + 0.06, 0.06, 0.08]} color="#2c2f3d" />)}
    </group>
  )
}

function Screen({ at, size, on, rot = 0, hue = 0.58 }: { at: V3; size: [number, number]; on: boolean; rot?: number; hue?: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null), light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, m = mat.current!
    m.emissive.setHSL(hue + Math.sin(t * 0.7) * 0.1, on ? 0.7 : 0, on ? 0.44 + Math.sin(t * 5.3) * 0.07 : 0)
    if (light.current) { light.current.intensity = on ? 5 + Math.sin(t * 6) : 0; light.current.color.copy(m.emissive) }
  })
  return (
    <group position={at} rotation={[0, rot, 0]}>
      <Box p={[0, 0, 0]} s={[size[0] + 0.07, size[1] + 0.07, 0.06]} color="#0a0a0d" rough={0.3} />
      <mesh position={[0, 0, 0.036]}><planeGeometry args={size} /><meshStandardMaterial ref={mat} color="#05070c" roughness={0.15} metalness={0.4} emissiveIntensity={1.35} /></mesh>
      {size[0] > 1.4 && <pointLight ref={light} position={[0, 0, 0.8]} distance={4.5} intensity={0} />}
    </group>
  )
}

const Bed = ({ at, w, cover, head }: { at: [number, number]; w: number; cover: string; head: string }) => (
  <group position={[at[0], 0, at[1]]}>
    <Soft p={[0, 0.22, 0]} s={[w + 0.12, 0.3, 2.15]} color="#6d4f3c" rough={0.5} /><Soft p={[0, 0.45, 0.03]} s={[w, 0.22, 2.04]} color="#f6f3ee" rough={0.95} />
    <Soft p={[0, 0.85, -1.1]} s={[w + 0.18, 0.95, 0.14]} color={head} rough={0.9} />
    {(w > 1.4 ? [-0.43, 0.43] : [0]).map((x) => <Soft key={x} p={[x, 0.62, -0.72]} s={[0.62, 0.15, 0.36]} color="#ffffff" rough={1} />)}
    <Soft p={[0, 0.59, 0.5]} s={[w + 0.04, 0.2, 1.08]} color={cover} rough={1} />
  </group>
)
const Plant = ({ at, s = 1 }: { at: [number, number]; s?: number }) => <group position={[at[0], 0, at[1]]} scale={s}><Cyl p={[0, 0.2, 0]} a={[0.17, 0.12, 0.36]} color="#c9a27e" /><Ball p={[0, 0.65, 0]} radius={0.3} color="#3f8a52" rough={0.9} /><Ball p={[0.14, 0.85, 0.05]} radius={0.18} color="#4c9a5c" rough={0.9} /></group>
const Chair = ({ at, rot = 0 }: { at: [number, number]; rot?: number }) => <group position={[at[0], 0, at[1]]} rotation={[0, rot, 0]}><Soft p={[0, 0.42, 0]} s={[0.46, 0.09, 0.46]} radius={0.03} color="#c49a6c" /><Soft p={[0, 0.74, -0.2]} s={[0.46, 0.55, 0.07]} radius={0.03} color="#c49a6c" />{[-0.18, 0.18].flatMap((x) => [-0.18, 0.18].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.2, z]} a={[0.018, 0.018, 0.4]} color="#2b2f3d" />))}</group>

function Siren({ on }: { on: boolean }) {
  const light = useRef<THREE.PointLight>(null), dome = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => { const k = on ? (Math.sin(clock.elapsedTime * 9) > 0 ? 1 : 0.08) : 0; light.current!.intensity = k * 26; dome.current!.emissiveIntensity = k * 3 })
  return <group position={[-3, 2.75, -5.35]}><mesh><sphereGeometry args={[0.14, 20, 12]} /><meshStandardMaterial ref={dome} color="#7a1d1a" emissive="#ff2a1f" emissiveIntensity={0} /></mesh><pointLight ref={light} color="#ff2a1f" distance={11} intensity={0} /></group>
}

function FrontDoor({ open, locked, armed }: { open: boolean; locked: boolean; armed: boolean }) {
  const leaf = useRef<THREE.Group>(null)
  useFrame((_, dt) => { leaf.current!.rotation.y = damp(leaf.current!.rotation.y, open ? -1.3 : 0, 3, dt) })
  return (
    <group position={[1.6, 0, 4.2]}>
      {[-0.6, 0.6].map((x) => <Box key={x} p={[x, 1.15, 0]} s={[0.14, 2.3, 0.2]} color="#3a3d4f" />)}
      <Box p={[0, 2.36, 0]} s={[1.34, 0.14, 0.22]} color="#3a3d4f" />
      <group ref={leaf} position={[-0.52, 0, 0]}><Soft p={[0.52, 1.13, 0]} s={[1.03, 2.24, 0.08]} radius={0.02} color="#6d4a33" rough={0.45} /><Cyl p={[0.88, 1.05, 0.09]} a={[0.025, 0.025, 0.22]} color="#d8c48a" metal={0.95} rough={0.2} /></group>
      <Box p={[0.86, 1.3, 0.08]} s={[0.2, 0.32, 0.06]} color="#151a2a" />
      <mesh position={[0.86, 1.38, 0.115]}><circleGeometry args={[0.035, 16]} /><meshBasicMaterial color={armed ? '#ff453a' : locked ? '#ff9f0a' : '#30d158'} /></mesh>
      <mesh position={[0.86, 1.24, 0.115]}><circleGeometry args={[0.028, 16]} /><meshBasicMaterial color="#8b93ff" /></mesh>
    </group>
  )
}

export default function House() {
  const v = useHome((s) => s.values), min = useHome((s) => s.min), weather = useHome((s) => s.weather), hazard = useHome((s) => s.hazard)
  const warm = OUTSIDE[weather] < 20
  const rug = useSurface('rug', 1, 1)
  const glass = useMemo(() => new THREE.MeshBasicMaterial({ color: '#8cc8ff', toneMapped: false }), [])
  const sky = useMemo(() => new THREE.Color(), [])
  useFrame((_, dt) => {
    const night = isDark(min), dusk = !night && (min < 450 || min > 1020)
    sky.set(night ? '#18244f' : weather === 'rainy' ? '#7d8ba3' : dusk ? '#f3a56f' : weather === 'hot' ? '#ffe3ae' : '#96ceff')
    glass.color.lerp(sky, 1 - Math.exp(-3 * dt))
  })
  const party = useHome((s) => s.mode) === 'Party mode'
  const romance = useHome((s) => s.mode) === 'Romantic mode'

  return (
    <group>
      <Box p={[0, -0.13, -0.7]} s={[14.4, 0.22, 10.1]} color="#bdb6aa" />
      <Floor at={[-0.1, 1.7]} size={[5.4, 5]} surface="wood" y={0.002} />
      <Floor at={[-4.9, 1.7]} size={[4.2, 5]} surface="wood" y={0.003} />
      <Floor at={[4.8, 1.7]} size={[4.4, 5]} surface="wood" y={0.004} />
      <Floor at={[-4.8, -3.2]} size={[4.4, 4.8]} surface="marble" rough={0.28} y={0.005} />
      <Floor at={[-1.6, -3.2]} size={[2, 4.8]} surface="paving" y={0.006} />
      <Floor at={[0.6, -3.2]} size={[2.4, 4.8]} surface="tile" rough={0.3} y={0.007} />
      <Floor at={[4.4, -3.2]} size={[5.2, 4.8]} surface="wood" y={0.008} />

      {/* outer walls: tall at the back and sides, a low kerb at the front */}
      <Wall p={[0, 1.5, -5.68]} s={[14.2, 3, 0.16]} />
      <Wall p={[-7.08, 0.8, -0.7]} s={[0.16, 1.6, 9.8]} /><Wall p={[7.08, 0.8, -0.7]} s={[0.16, 1.6, 9.8]} />
      <Wall p={[-3.1, 0.2, 4.2]} s={[8.1, 0.4, 0.16]} /><Wall p={[4.7, 0.2, 4.2]} s={[4.9, 0.4, 0.16]} />
      {/* partitions, with openings along the middle corridor */}
      {[[-2.6, -3.7, 3.8], [-0.6, -3.7, 3.8], [1.8, -3.7, 3.8], [-2.8, 2.2, 3.9], [2.6, 2.2, 3.9]].map(([x, z, len]) => <Wall key={`${x}${z}`} p={[x, 0.55, z]} s={[0.12, 1.1, len]} />)}
      {[[-5.85, 2.3], [5.9, 2.3], [3.35, 1.1]].map(([x, len]) => <Wall key={x} p={[x, 0.55, -0.8]} s={[len, 1.1, 0.12]} />)}
      <FrontDoor open={!v['entrance.lock']} locked={!!v['entrance.lock']} armed={!!v['security.armed']} />
      <Lamp at={[0.55, 2.1, 4.42]} level={v['entrance.light']} strength={7} reach={3.5}>{(m) => <Shade m={m} a={[0.08, 0.1, 0.2]} />}</Lamp>

      {/* kitchen */}
      <Soft p={[-5.3, 0.46, -5.2]} s={[3.3, 0.92, 0.7]} radius={0.04} color="#33495a" rough={0.4} /><Box p={[-5.3, 0.95, -5.17]} s={[3.4, 0.07, 0.78]} color="#f1ede6" rough={0.15} />
      <Soft p={[-6.65, 0.46, -3.55]} s={[0.7, 0.92, 2.2]} radius={0.04} color="#33495a" rough={0.4} /><Box p={[-6.65, 0.95, -3.55]} s={[0.78, 0.07, 2.3]} color="#f1ede6" rough={0.15} />
      {[-6.55, -3.9].map((x) => <Soft key={x} p={[x, 2.3, -5.42]} s={[0.8, 0.7, 0.34]} radius={0.03} color="#33495a" />)}
      <Window at={[-5.2, 1.85, -5.59]} width={1.5} glass={glass} />
      {/* fridge with status screen */}
      <Soft p={[-3.1, 1.05, -5.15]} s={[0.85, 2.1, 0.75]} radius={0.05} color="#c9ced9" metal={0.75} rough={0.25} /><Screen at={[-3.1, 1.45, -4.75]} size={[0.3, 0.38]} on={!!v['kitchen.fridge']} />
      {/* oven and hood */}
      <Box p={[-4.2, 0.5, -4.83]} s={[0.7, 0.55, 0.04]} color="#10121a" rough={0.2} metal={0.5} />
      <mesh position={[-4.2, 0.5, -4.8]}><planeGeometry args={[0.55, 0.35]} /><meshBasicMaterial color={v['kitchen.oven'] ? '#ff8a2a' : '#1a1d28'} toneMapped={false} /></mesh>
      <Box p={[-4.2, 2.1, -5.35]} s={[0.85, 0.16, 0.5]} color="#aeb3c0" metal={0.85} rough={0.25} /><Box p={[-4.2, 2.5, -5.48]} s={[0.3, 0.65, 0.2]} color="#aeb3c0" metal={0.85} rough={0.25} />
      <Particles active={!!v['kitchen.oven'] && !v['kitchen.exhaust']} count={30} origin={[-4.5, 1.05, -5.3]} area={[0.6, 0.8, 0.3]} velocity={[0, 0.25, 0]} color="#ffffff" size={0.06} opacity={0.5} />
      <Particles active={!!v['kitchen.exhaust']} count={40} origin={[-4.55, 1.05, -5.35]} area={[0.7, 1.0, 0.4]} velocity={[0, 0.75, 0]} color="#bfe0ff" size={0.04} />
      <Soft p={[-6.65, 1.2, -4.2]} s={[0.32, 0.42, 0.3]} radius={0.04} color="#20232d" rough={0.25} /><Cyl p={[-6.4, 1.04, -4.2]} a={[0.055, 0.045, 0.11]} color="#fff" />
      <Particles active={!!v['kitchen.coffee']} count={28} origin={[-6.46, 1.12, -4.25]} area={[0.1, 0.6, 0.1]} velocity={[0, 0.22, 0]} color="#ffffff" size={0.05} opacity={0.6} />
      <Soft p={[-4.7, 0.46, -3.05]} s={[1.9, 0.9, 0.75]} radius={0.04} color="#e8e3da" rough={0.35} /><Box p={[-4.7, 0.94, -3.05]} s={[2.05, 0.06, 0.88]} color="#4a4e5e" rough={0.12} metal={0.3} />
      <Lamp at={[-4.7, 2.35, -3.3]} level={v['kitchen.light']} strength={22}>{(m) => <>{[-0.55, 0.55].map((x) => <group key={x} position={[x, 0, 0.25]}><Cyl p={[0, 0.35, 0]} a={[0.006, 0.006, 0.6]} color="#222" /></group>)}<Shade m={m} p={[-0.55, 0, 0.25]} a={[0.05, 0.19, 0.2]} color="#f0b45f" /></>}</Lamp>
      <Siren on={hazard === 'smoke' || hazard === 'gas'} />
      <Particles active={hazard === 'smoke'} count={130} origin={[-5.8, 1, -5.4]} area={[2.8, 1.9, 1.2]} velocity={[0.12, 0.45, 0.1]} color="#9aa0aa" size={0.22} opacity={0.65} />
      <Particles active={hazard === 'gas'} count={90} origin={[-5.4, 0.3, -4.9]} area={[2.2, 0.8, 1.4]} velocity={[0.2, 0.12, 0.2]} color="#e8f06a" size={0.12} opacity={0.5} />

      {/* security control area */}
      <Screen at={[-1.95, 1.9, -5.55]} size={[0.65, 0.42]} on={!!v['security.cameras']} hue={0.4} /><Screen at={[-1.2, 1.9, -5.55]} size={[0.65, 0.42]} on={!!v['security.cameras']} hue={0.55} />
      <Screen at={[-1.95, 1.38, -5.55]} size={[0.65, 0.42]} on={!!v['security.cameras']} hue={0.62} /><Screen at={[-1.2, 1.38, -5.55]} size={[0.65, 0.42]} on={!!v['security.armed']} hue={0} />
      <Soft p={[-1.6, 0.72, -5.15]} s={[1.6, 0.08, 0.65]} radius={0.03} color="#2d3142" /><Chair at={[-1.6, -4.5]} rot={Math.PI} />
      <Box p={[-0.74, 1.15, -2.6]} s={[0.06, 0.42, 0.34]} color="#151a2a" /><mesh position={[-0.78, 1.2, -2.6]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.26, 0.2]} /><meshBasicMaterial color={v['security.armed'] ? '#ff453a' : '#30d158'} /></mesh>

      {/* bathroom */}
      <Soft p={[1.15, 0.3, -4.7]} s={[1, 0.58, 1.75]} radius={0.22} color="#ffffff" rough={0.18} /><Box p={[1.15, 0.57, -4.7]} s={[0.72, 0.04, 1.45]} color="#9fd8ee" rough={0.05} see={0.85} />
      <Soft p={[-0.15, 0.42, -5.2]} s={[0.7, 0.84, 0.5]} radius={0.04} color="#7a553a" /><Cyl p={[-0.15, 0.9, -5.2]} a={[0.22, 0.16, 0.12]} color="#fff" rough={0.15} /><mesh position={[-0.15, 1.75, -5.58]}><circleGeometry args={[0.42, 40]} /><meshStandardMaterial color="#cfe2ee" metalness={1} roughness={0.08} /></mesh>
      <Soft p={[-0.2, 0.3, -2.2]} s={[0.42, 0.45, 0.6]} radius={0.16} color="#fff" rough={0.2} />
      <Cyl p={[1.2, 2.3, -5.3]} a={[0.28, 0.28, 0.75]} color="#e9ebf2" rough={0.3} /><mesh position={[1.2, 2.2, -5.01]}><circleGeometry args={[0.04, 14]} /><meshBasicMaterial color={v['bath.heater'] ? '#ff6a2a' : '#6a7088'} /></mesh>
      <Particles active={!!v['bath.heater']} count={36} origin={[0.7, 0.65, -5.2]} area={[0.9, 1, 1.2]} velocity={[0, 0.2, 0]} color="#ffffff" size={0.08} opacity={0.35} />
      <Particles active={!!v['bath.exhaust']} count={24} origin={[0, 1.4, -5.5]} area={[0.7, 1.4, 0.4]} velocity={[0, 0.7, 0]} color="#bfe0ff" size={0.035} />
      <Particles active={hazard === 'leak'} count={90} origin={[0, 0.05, -3.9]} area={[1.4, 0.12, 1.6]} velocity={[0.15, 0, 0.15]} color="#4fb8ff" size={0.1} />
      <Lamp at={[0.6, 2.4, -3.8]} level={v['bath.light']} strength={14} reach={4.5} color="#eef6ff" />

      {/* master bedroom */}
      <Bed at={[4.3, -4.2]} w={1.9} cover="#6f6ab8" head="#454273" />
      {[3.05, 5.6].map((x) => <group key={x}><Soft p={[x, 0.28, -5.15]} s={[0.48, 0.5, 0.45]} radius={0.04} color="#8c6a50" /><Cyl p={[x, 0.65, -5.15]} a={[0.025, 0.07, 0.2]} color="#d8c48a" metal={0.8} /></group>)}
      <Lamp at={[3.05, 0.88, -5.15]} level={v['master.light']} strength={9} reach={4}>{(m) => <Shade m={m} a={[0.11, 0.17, 0.2]} />}</Lamp>
      <Lamp at={[4.6, 2.6, -2.8]} level={v['master.light'] * 0.7} strength={18} />
      <Window at={[6.25, 1.75, -5.59]} width={1.15} glass={glass} /><Curtains at={[6.25, 1.75, -5.45]} width={1.15} open={v['master.curtain']} color="#6f6cc4" />
      <Aircon at={[2.7, 2.55, -5.45]} on={!!v['master.ac']} warm={warm} />
      <Soft p={[6.65, 1.0, -2.4]} s={[0.6, 2, 1.5]} radius={0.04} color="#8c6a50" /><Box p={[6.34, 1, -2.4]} s={[0.02, 1.85, 0.025]} color="#4c3627" />
      <Fan at={[2.35, 1.3, -1.4]} speed={v['master.fan']} />

      {/* living room: television on the corridor side, sofa facing it */}
      <mesh position={[0, 0.012, 1.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[3.8, 2.8]} /><meshStandardMaterial map={rug} roughness={1} /></mesh>
      <Soft p={[0, 0.25, -0.5]} s={[2.5, 0.42, 0.45]} radius={0.04} color="#4b3a2e" rough={0.4} />
      <Screen at={[0, 1.08, -0.55]} size={[1.9, 1.05]} on={!!v['living.tv']} />
      <group position={[0.1, 0, 2.75]}>
        <Soft p={[0, 0.25, 0]} s={[3.1, 0.34, 0.9]} color="#2f7f86" rough={0.95} /><Soft p={[0, 0.62, 0.42]} s={[3.1, 0.62, 0.24]} color="#2f7f86" rough={0.95} />
        {[-1.65, 1.65].map((x) => <Soft key={x} p={[x, 0.45, 0.05]} s={[0.24, 0.44, 0.95]} color="#276a70" rough={0.95} />)}
        {[-1.15, 1.2].map((x) => <Soft key={x} p={[x, 0.55, 0.22]} s={[0.42, 0.36, 0.14]} r={[-0.2, 0, 0]} color="#f2b66d" rough={0.9} />)}
      </group>
      <Soft p={[0.05, 0.36, 1.2]} s={[1.3, 0.07, 0.65]} radius={0.025} color="#2d2a2e" rough={0.12} metal={0.3} />{[-0.5, 0.6].map((x) => <Cyl key={x} p={[x, 0.17, 1.2]} a={[0.03, 0.03, 0.34]} color="#c8b27a" metal={0.9} />)}<Cyl p={[-0.25, 0.47, 1.2]} a={[0.09, 0.07, 0.14]} color="#e8e4dc" />
      {[-1.6, 1.6].map((x) => <group key={x}><Soft p={[x, 0.45, -0.45]} s={[0.26, 0.9, 0.26]} radius={0.06} color="#23263a" /><Particles active={!!v['living.speaker']} count={10} origin={[x - 0.2, 0.95, -0.4]} area={[0.4, 0.8, 0.3]} velocity={[0.1, 0.35, 0]} color="#c4a8ff" size={0.09} /></group>)}
      <Lamp at={[2.25, 1.65, 3.4]} level={v['living.light']} strength={16}>{(m) => <><Cyl p={[0, -0.82, 0]} a={[0.02, 0.02, 1.6]} color="#26293a" /><Cyl p={[0, -1.62, 0]} a={[0.2, 0.22, 0.05]} color="#26293a" /><Shade m={m} /></>}</Lamp>
      <Lamp at={[-0.1, 2.5, 1.4]} level={v['living.light'] * 0.75} strength={24} />
      <Lamp at={[-2.3, 0.5, 0.4]} level={v['living.ambient']} strength={9} reach={4.5} color={party ? '#ff4fd8' : romance ? '#ff7a45' : '#8b5cf6'}>{(m) => <Cyl p={[0, -0.05, 0]} a={[0.05, 0.05, 0.85]} color="#c4a8ff" glow="#8b5cf6" power={m ? 0.6 : 0} />}</Lamp>
      <Lamp at={[2.3, 0.5, 0.2]} level={v['living.ambient']} strength={9} reach={4.5} color={party ? '#22d3ee' : romance ? '#ff5470' : '#8b5cf6'} />
      <Aircon at={[-2.62, 1.5, 3.1]} on={!!v['living.ac']} warm={warm} />
      <Fan at={[-0.1, 2.35, 1.5]} speed={v['living.fan']} ceiling />
      {/* motorised drapes on the side opening */}
      <group position={[2.48, 0, 2.2]} rotation={[0, -Math.PI / 2, 0]}><Curtains at={[0, 0.95, 0]} width={1.9} open={v['living.curtain']} color="#b9644f" /></group>
      <Plant at={[-2.35, 3.7]} />

      {/* dining room */}
      <Cyl p={[-4.9, 0.74, 1.8]} a={[0.95, 0.95, 0.07, 48]} color="#a9774f" rough={0.25} /><Cyl p={[-4.9, 0.37, 1.8]} a={[0.09, 0.4, 0.72]} color="#3d4152" />
      <Chair at={[-6.15, 1.6]} rot={Math.PI / 2} /><Chair at={[-3.65, 1.6]} rot={-Math.PI / 2} /><Chair at={[-4.9, 2.95]} rot={Math.PI} /><Chair at={[-4.9, 0.65]} />
      {[[-5.2, 1.6], [-4.6, 1.6], [-4.9, 2.2]].map(([x, z]) => <Cyl key={`${x}${z}`} p={[x, 0.8, z]} a={[0.17, 0.15, 0.03]} color="#fdfdfd" rough={0.2} />)}
      <Lamp at={[-4.9, 1.95, 1.8]} level={v['dining.light']} strength={14}>{(m) => <><Cyl p={[0, 0.5, 0]} a={[0.006, 0.006, 0.9]} color="#222" /><Shade m={m} a={[0.1, 0.38, 0.26]} color="#e8c28a" /></>}</Lamp>
      <Soft p={[-6.75, 0.45, 3.3]} s={[0.45, 0.9, 1.3]} radius={0.03} color="#4b3a2e" /><Plant at={[-3.25, 3.7]} s={0.8} />

      {/* children's bedroom */}
      <Bed at={[3.5, 1.9]} w={1} cover="#f29fb0" head="#d46c85" /><Bed at={[6.1, 1.9]} w={1} cover="#5fb3e8" head="#3a7fb5" />
      <Soft p={[4.8, 0.28, 0.35]} s={[0.55, 0.5, 0.45]} radius={0.04} color="#c49a6c" />
      <Lamp at={[4.8, 0.85, 0.35]} level={v['kids.light']} strength={12} reach={5}>{(m) => <Shade m={m} a={[0.1, 0.16, 0.22]} />}</Lamp>
      <Lamp at={[4.8, 2.4, 2]} level={v['kids.light'] * 0.65} strength={16} />
      <group position={[6.98, 0, 3]} rotation={[0, -Math.PI / 2, 0]}><Curtains at={[0, 0.95, 0]} width={1.4} open={v['kids.curtain']} color="#7fb0a0" /></group>
      <Aircon at={[6.86, 1.35, 0.5]} on={!!v['kids.ac']} warm={warm} />
      <Ball p={[4.3, 0.18, 3.5]} radius={0.17} color="#f59e0b" /><Soft p={[5.35, 0.12, 3.55]} s={[0.4, 0.22, 0.3]} radius={0.05} color="#ef4444" />
    </group>
  )
}
