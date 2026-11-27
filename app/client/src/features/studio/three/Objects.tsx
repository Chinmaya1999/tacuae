import { useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Edges, RoundedBox } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import { deviceById, furnitureById, type PlacedDevice, type PlacedFurniture, type Room } from '../../../shared/data/catalog'
import { levelOf, placeDevice, toWorld, dims } from './geometry'

type V3 = [number, number, number]
type BoxProps = { s: V3; p?: V3; c: string; rough?: number; metal?: number; shadow?: boolean }
const Box = ({ s, p = [0, 0, 0], c, rough = 0.7, metal = 0.05, shadow = true }: BoxProps) => (
  <RoundedBox args={s} radius={Math.min(0.045, Math.min(...s) * 0.3)} smoothness={3} position={p} castShadow={shadow} receiveShadow><meshStandardMaterial color={c} roughness={rough} metalness={metal} /></RoundedBox>
)
/** Furniture parts are written as width × depth × height, like the catalogue sizes. */
const Part = ({ s: [w, d, h], ...rest }: BoxProps) => <Box s={[w, h, d]} {...rest} />
const Led = ({ on, color = '#8b93ff', p, r = 0.022 }: { on: boolean; color?: string; p: V3; r?: number }) => (
  <mesh position={p}><sphereGeometry args={[r, 12, 12]} /><meshStandardMaterial color={on ? color : '#222'} emissive={on ? color : '#000'} emissiveIntensity={on ? 3 : 0} /></mesh>
)

// ---------------------------------------------------------------- furniture
function FurnitureBody({ type }: { type: PlacedFurniture['type'] }) {
  const f = furnitureById[type], [w, d, h] = f.size, c = f.color
  switch (type) {
    case 'bed': return <><Part s={[w, d, 0.3]} p={[0, 0.15, 0]} c="#4a4f5c" /><Part s={[w - 0.08, d - 0.1, 0.22]} p={[0.02, 0.41, 0]} c="#e8ecf3" rough={0.95} /><Part s={[0.12, d, 0.9]} p={[-w / 2 + 0.06, 0.45, 0]} c="#6b5a48" /><Part s={[0.4, 0.55, 0.12]} p={[-w / 2 + 0.4, 0.58, -0.42]} c="#fff" rough={1} /><Part s={[0.4, 0.55, 0.12]} p={[-w / 2 + 0.4, 0.58, 0.42]} c="#fff" rough={1} /></>
    case 'sofa': return <><Part s={[w, d, 0.4]} p={[0, 0.2, 0]} c={c} rough={0.95} /><Part s={[w, 0.22, 0.45]} p={[0, 0.62, -d / 2 + 0.11]} c={c} rough={0.95} /><Part s={[0.2, d, 0.3]} p={[-w / 2 + 0.1, 0.55, 0]} c={c} rough={0.95} /><Part s={[0.2, d, 0.3]} p={[w / 2 - 0.1, 0.55, 0]} c={c} rough={0.95} /></>
    case 'coffee-table': return <><Part s={[w, d, 0.05]} p={[0, h, 0]} c={c} />{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Part key={i} s={[0.05, 0.05, h]} p={[a * (w / 2 - 0.05), h / 2, b * (d / 2 - 0.05)]} c="#2a2a2a" />)}</>
    case 'tv-unit': return <><Part s={[w, d, 0.45]} p={[0, 0.225, 0]} c={c} /><mesh position={[0, 0.82, 0]} castShadow><boxGeometry args={[w * 0.85, 0.05, 0.55]} /><meshStandardMaterial color="#0b0d12" roughness={0.2} metalness={0.6} /></mesh></>
    case 'wardrobe': return <><Part s={[w, d, h]} p={[0, h / 2, 0]} c={c} /><Part s={[0.02, d + 0.01, h - 0.1]} p={[0, h / 2, 0]} c="#6d5640" /><Part s={[0.03, 0.03, 0.3]} p={[-0.1, 1.0, d / 2 + 0.01]} c="#ccc" metal={0.8} /><Part s={[0.03, 0.03, 0.3]} p={[0.1, 1.0, d / 2 + 0.01]} c="#ccc" metal={0.8} /></>
    case 'desk': return <><Part s={[w, d, 0.04]} p={[0, h, 0]} c={c} /><Part s={[0.04, d - 0.05, h]} p={[-w / 2 + 0.05, h / 2, 0]} c={c} /><Part s={[0.04, d - 0.05, h]} p={[w / 2 - 0.05, h / 2, 0]} c={c} /></>
    case 'chair': return <><Part s={[w, d, 0.06]} p={[0, 0.45, 0]} c={c} />{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Part key={i} s={[0.04, 0.04, 0.45]} p={[a * 0.2, 0.225, b * 0.2]} c="#222" />)}<Part s={[0.05, d, 0.45]} p={[-w / 2 + 0.03, 0.7, 0]} c={c} /></>
    case 'dining-table': return <><Part s={[w, d, 0.05]} p={[0, h, 0]} c={c} />{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Part key={i} s={[0.07, 0.07, h]} p={[a * (w / 2 - 0.1), h / 2, b * (d / 2 - 0.1)]} c="#3a2c1e" />)}</>
    case 'plant': return <><mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.15, 0.4, 16]} /><meshStandardMaterial color="#8c5a3c" roughness={0.9} /></mesh><mesh position={[0, 0.75, 0]} castShadow><icosahedronGeometry args={[0.38, 1]} /><meshStandardMaterial color={c} roughness={0.9} flatShading /></mesh></>
    case 'rug': return <mesh position={[0, 0.011, 0]} receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={c} roughness={1} /></mesh>
  }
}

export function FurnitureMesh({ f, room, selected, onDown }: { f: PlacedFurniture; room: Room; selected: boolean; onDown: (e: ThreeEvent<PointerEvent>) => void }) {
  const { w, l } = dims(room), [wx, wz] = toWorld(f.x, f.y, w, l), [sw, sd, sh] = furnitureById[f.type].size
  // rotate "rot" degrees around Y; the rug's [w,d,h] map to x,z,y so its box needs swapped axes (handled in FurnitureBody)
  return (
    <group position={[wx, 0, wz]} rotation={[0, (-f.rot * Math.PI) / 180, 0]}>
      <FurnitureBody type={f.type} />
      <mesh position={[0, Math.max(sh, 0.05) / 2, 0]} onPointerDown={onDown}>
        <boxGeometry args={[sw, Math.max(sh, 0.05), sd]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
        {selected && <Edges color="#8b93ff" />}
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------- smart devices
function Curtain({ open, W, H }: { open: number; W: number; H: number }) {
  const l = useRef<Mesh>(null), r = useRef<Mesh>(null), cur = useRef(open)
  useFrame((_, dt) => {
    cur.current += (open - cur.current) * Math.min(1, dt * 3)
    const frac = 1 - 0.82 * cur.current, pw = (W / 2) * frac
    if (l.current && r.current) { l.current.scale.x = frac; r.current.scale.x = frac; l.current.position.x = -(W / 2 - pw / 2); r.current.position.x = W / 2 - pw / 2 }
  })
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.04, 0.03]}><cylinderGeometry args={[0.015, 0.015, W + 0.2, 8]} /><meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} /></mesh>
      {[l, r].map((ref, i) => <mesh key={i} ref={ref} position={[0, -H / 2, 0.04]} castShadow><boxGeometry args={[W / 2, H, 0.05]} /><meshStandardMaterial color="#8d7bb8" roughness={1} /></mesh>)}
    </group>
  )
}
function Fan({ on, level }: { on: boolean; level: number }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => { if (g.current && on) g.current.rotation.y += dt * (3 + level / 8) })
  return (
    <group>
      <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.012, 0.012, 0.24, 8]} /><meshStandardMaterial color="#888" /></mesh>
      <group ref={g} position={[0, -0.26, 0]}>
        <mesh><cylinderGeometry args={[0.09, 0.09, 0.07, 16]} /><meshStandardMaterial color="#cfd6e2" metalness={0.4} roughness={0.4} /></mesh>
        {[0, 1, 2, 3].map((i) => <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[Math.cos((i * Math.PI) / 2) * 0.35, 0, -Math.sin((i * Math.PI) / 2) * 0.35]} castShadow><boxGeometry args={[0.55, 0.018, 0.12]} /><meshStandardMaterial color="#e7ebf2" roughness={0.5} /></mesh>)}
      </group>
    </group>
  )
}
function Pulse({ on, color, base = 1, children }: { on: boolean; color: string; base?: number; children?: ReactNode }) {
  const m = useRef<Mesh>(null)
  useFrame(({ clock }) => { if (m.current) { const s = on ? base + Math.sin(clock.elapsedTime * 3) * 0.12 : base; m.current.scale.setScalar(s); (m.current.material as { opacity: number }).opacity = on ? 0.35 : 0 } })
  return <group><mesh ref={m}><ringGeometry args={[0.12, 0.14, 32]} /><meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} /></mesh>{children}</group>
}
function Blink({ on }: { on: boolean }) {
  const m = useRef<Mesh>(null)
  useFrame(({ clock }) => { if (m.current) (m.current.material as unknown as { emissiveIntensity: number }).emissiveIntensity = on ? (Math.sin(clock.elapsedTime * 10) > 0 ? 4 : 0.2) : 0 })
  return <mesh ref={m} position={[0, 0, 0.05]}><sphereGeometry args={[0.04, 12, 12]} /><meshStandardMaterial color="#ff3030" emissive="#ff3030" emissiveIntensity={0} /></mesh>
}

function DeviceBody({ d, room }: { d: PlacedDevice; room: Room }) {
  const def = deviceById[d.cat], on = d.on, level = levelOf(d), h = dims(room).h
  const tint = d.color || def.tint || '#ffe9a8', glow = on ? 0.6 + (level / 100) * 2.4 : 0
  switch (def.kind) {
    case 'light': {
      const strip = d.cat === 'rgb-lighting'
      return (
        <group>
          <mesh position={[0, -0.025, 0]}>{strip ? <boxGeometry args={[1.3, 0.03, 0.06]} /> : <cylinderGeometry args={[d.cat === 'dali-dimming' ? 0.26 : 0.18, d.cat === 'dali-dimming' ? 0.26 : 0.18, 0.05, 28]} />}
            <meshStandardMaterial color={on ? tint : '#d7dbe3'} emissive={on ? tint : '#000'} emissiveIntensity={glow} roughness={0.4} /></mesh>
          {on && <pointLight position={[0, -0.35, 0]} color={tint} intensity={10 * (level / 100) + 1} distance={Math.max(6, h * 2.4)} decay={1.6} />}
        </group>)
    }
    case 'fan': return <Fan on={on} level={level} />
    case 'sensor': return <group><mesh position={[0, -0.03, 0]}><sphereGeometry args={[0.07, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#f3f5f8" /></mesh><Led on={on} color="#ff9b2f" p={[0, -0.07, 0]} /></group>
    case 'camera': return (
      <group>
        <Box s={[0.1, 0.1, 0.16]} p={[0, 0, 0.08]} c="#e9edf3" /><mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 0.04, 16]} /><meshStandardMaterial color="#111" /></mesh><Led on={on} color="#ff3030" p={[0.04, 0.04, 0.16]} />
        {on && <mesh position={[0, -0.55, 1.3]} rotation={[-Math.PI / 2 - 0.35, 0, 0]}><coneGeometry args={[0.9, 2.6, 24, 1, true]} /><meshBasicMaterial color="#ff5050" transparent opacity={0.1} depthWrite={false} side={2} /></mesh>}
      </group>)
    case 'ac': return (
      <group>
        <Box s={[1.0, 0.28, 0.2]} p={[0, 0, 0.1]} c="#f4f6fa" rough={0.4} /><Box s={[0.9, 0.025, 0.02]} p={[0, -0.08, 0.205]} c={on ? '#a5b4fc' : '#9aa3b2'} shadow={false} />
        {on && <mesh position={[0, -0.7, 0.75]} rotation={[-0.75, 0, 0]}><coneGeometry args={[0.5, 1.5, 20, 1, true]} /><meshBasicMaterial color="#a5b4fc" transparent opacity={0.13} depthWrite={false} side={2} /></mesh>}
        <Led on={on} color="#a5b4fc" p={[0.4, 0.06, 0.205]} />
      </group>)
    case 'alarm': return <group><Box s={[0.14, 0.14, 0.07]} p={[0, 0, 0.035]} c="#e4e7ee" /><Blink on={on} /></group>
    case 'curtain': return <Curtain open={on ? level / 100 : 0} W={2.2} H={Math.max(1.2, h - 0.35)} />
    case 'lock': return <group><Box s={[0.07, 0.22, 0.03]} p={[0, 0, 0.015]} c="#20242c" metal={0.6} /><Led on={true} color={on ? '#35e07c' : '#ff4545'} p={[0, 0.07, 0.035]} r={0.012} /></group>
    case 'switch': return <group><Box s={[0.09, 0.09, 0.012]} p={[0, 0, 0.006]} c="#101419" rough={0.1} metal={0.5} /><Box s={[0.075, 0.075, 0.004]} p={[0, 0, 0.014]} c={on ? '#8b93ff' : '#1a1f27'} shadow={false} /></group>
    case 'panel': return <group><Box s={[0.36, 0.23, 0.02]} p={[0, 0, 0.01]} c="#0d1016" rough={0.2} /><mesh position={[0, 0, 0.022]}><planeGeometry args={[0.32, 0.19]} /><meshStandardMaterial color={on ? '#0a2a3a' : '#050608'} emissive={on ? '#8b93ff' : '#000'} emissiveIntensity={on ? 1.2 : 0} /></mesh></group>
    case 'meter': return <group><Box s={[0.14, 0.18, 0.05]} p={[0, 0, 0.025]} c="#dfe3ea" /><Led on={on} color="#35e07c" p={[0, 0.05, 0.055]} r={0.014} /></group>
    case 'plug': return <group><Box s={[0.09, 0.09, 0.025]} p={[0, 0, 0.012]} c="#f1f3f7" /><Led on={on} color="#35e07c" p={[0.03, 0.03, 0.028]} r={0.008} /></group>
    case 'voice': return <group><mesh position={[0, -0.4, 0]}><cylinderGeometry args={[0.2, 0.2, 0.02, 20]} /><meshStandardMaterial color="#6e5a46" /></mesh><mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.012, 0.012, 0.4, 8]} /><meshStandardMaterial color="#555" /></mesh><mesh position={[0, 0.05, 0]} castShadow><cylinderGeometry args={[0.07, 0.08, 0.14, 20]} /><meshStandardMaterial color="#1b1f27" /></mesh><Pulse on={on} color="#6aa9ff"><group /></Pulse><Led on={on} color="#6aa9ff" p={[0, 0.125, 0]} r={0.02} /></group>
    case 'cloud': return <group><mesh position={[0, -0.4, 0]}><cylinderGeometry args={[0.2, 0.2, 0.02, 20]} /><meshStandardMaterial color="#6e5a46" /></mesh><mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.012, 0.012, 0.4, 8]} /><meshStandardMaterial color="#555" /></mesh><Box s={[0.16, 0.05, 0.16]} p={[0, 0.03, 0]} c="#e9edf3" /><Led on={on} color="#6aa9ff" p={[0, 0.06, 0.08]} /></group>
    case 'speaker': return <group><Box s={[0.28, 0.9, 0.28]} p={[0, 0.45, 0]} c="#16191f" rough={0.5} /><mesh position={[0, 0.3, 0.145]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.01, 20]} /><meshStandardMaterial color="#333" /></mesh><group position={[0, 0.3, 0.16]}><Pulse on={on} color="#6aa9ff" base={1.4}><group /></Pulse></group></group>
  }
}

export function DeviceMesh({ d, room, selected, onDown }: { d: PlacedDevice; room: Room; selected: boolean; onDown: (e: ThreeEvent<PointerEvent>) => void }) {
  const { pos, rotY, mount } = placeDevice(d, room)
  // ceiling devices hang DOWN from the ceiling, so their local space is just translated; wall devices face into the room.
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <DeviceBody d={d} room={room} />
      <mesh position={mount === 'ceiling' ? [0, -0.15, 0] : mount === 'floor' ? [0, 0.45, 0] : mount === 'table' ? [0, 0, 0] : [0, 0, 0.08]} onPointerDown={onDown}>
        <sphereGeometry args={[mount === 'floor' ? 0.5 : 0.32, 12, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {selected && <mesh position={mount === 'ceiling' ? [0, -0.15, 0] : mount === 'floor' ? [0, 0.45, 0] : [0, 0, 0.08]}><sphereGeometry args={[mount === 'floor' ? 0.55 : 0.34, 16, 12]} /><meshBasicMaterial color="#8b93ff" wireframe transparent opacity={0.45} /></mesh>}
    </group>
  )
}
