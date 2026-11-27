// Building blocks for the 3D house: materials, painted textures, lamps, particles and curtains.
import { useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

export type V3 = [number, number, number]
export const damp = THREE.MathUtils.damp
type Mat = { color: string; rough?: number; metal?: number; glow?: string; power?: number; map?: THREE.Texture; see?: number }
export const M = ({ color, rough = 0.72, metal = 0, glow = '#000000', power = 0, map, see }: Mat) => <meshStandardMaterial color={color} map={map} roughness={rough} metalness={metal} emissive={glow} emissiveIntensity={power} transparent={see !== undefined} opacity={see ?? 1} />
export const Box = ({ p, s, r, cast = true, ...m }: { p: V3; s: V3; r?: V3; cast?: boolean } & Mat) => <mesh position={p} rotation={r} castShadow={cast} receiveShadow><boxGeometry args={s} /><M {...m} /></mesh>
export const Soft = ({ p, s, r, radius = 0.08, ...m }: { p: V3; s: V3; r?: V3; radius?: number } & Mat) => <RoundedBox args={s} radius={radius} smoothness={3} position={p} rotation={r} castShadow receiveShadow><M {...m} /></RoundedBox>
export const Cyl = ({ p, a, r, ...m }: { p: V3; a: [number, number, number, number?]; r?: V3 } & Mat) => <mesh position={p} rotation={r} castShadow receiveShadow><cylinderGeometry args={[a[0], a[1], a[2], a[3] ?? 24]} /><M {...m} /></mesh>
export const Ball = ({ p, radius, detail = 2, ...m }: { p: V3; radius: number; detail?: number } & Mat) => <mesh position={p} castShadow><icosahedronGeometry args={[radius, detail]} /><M {...m} /></mesh>

export type Surface = 'wood' | 'marble' | 'tile' | 'grass' | 'rug' | 'paving'
/** Floor materials painted on a canvas, so nothing has to be downloaded. */
export function useSurface(kind: Surface, rx: number, ry: number) {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512
    const g = c.getContext('2d')!
    let n = 11
    const rnd = () => (n = (n * 16807) % 2147483647) / 2147483647
    const speck = (count: number, color: () => string, w = 2, h = 2) => { for (let i = 0; i < count; i++) { g.fillStyle = color(); g.fillRect(rnd() * 512, rnd() * 512, w, h) } }
    if (kind === 'wood') for (let row = 0; row < 10; row++) {
      const shift = rnd() * 300
      for (let k = -2; k < 3; k++) { g.fillStyle = `hsl(${26 + rnd() * 6}, ${32 + rnd() * 12}%, ${38 + rnd() * 11}%)`; g.fillRect(shift + k * 300, row * 51.2, 299, 50) }
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(50,26,10,${0.05 + rnd() * 0.1})`; g.fillRect(rnd() * 512, row * 51.2 + rnd() * 50, 30 + rnd() * 110, 1) }
    }
    if (kind === 'marble') {
      g.fillStyle = '#e9e6e1'; g.fillRect(0, 0, 512, 512); speck(5000, () => `rgba(120,115,110,${rnd() * 0.12})`)
      for (let i = 0; i < 16; i++) { g.strokeStyle = `rgba(120,118,124,${0.1 + rnd() * 0.22})`; g.lineWidth = 0.5 + rnd() * 2; g.beginPath(); let x = rnd() * 512, y = 0; g.moveTo(x, y); while (y < 512) { x += (rnd() - 0.5) * 90; y += 30 + rnd() * 50; g.lineTo(x, y) } g.stroke() }
      g.fillStyle = 'rgba(0,0,0,.12)'; for (let v = 0; v <= 512; v += 256) { g.fillRect(v, 0, 2, 512); g.fillRect(0, v, 512, 2) }
    }
    if (kind === 'tile' || kind === 'paving') for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = kind === 'tile' ? `hsl(200, 12%, ${66 + rnd() * 12}%)` : `hsl(30, 6%, ${42 + rnd() * 14}%)`; g.fillRect(x * 64 + 1, y * 64 + 1, 62, 62) }
    if (kind === 'grass') { g.fillStyle = '#3c6332'; g.fillRect(0, 0, 512, 512); speck(14000, () => `hsl(${85 + rnd() * 40}, ${35 + rnd() * 25}%, ${17 + rnd() * 26}%)`, 2, 5) }
    if (kind === 'rug') { g.fillStyle = '#d9d2c4'; g.fillRect(0, 0, 512, 512); speck(20000, () => `rgba(90,80,70,${rnd() * 0.22})`); g.strokeStyle = '#7c7fb8'; g.lineWidth = 14; g.strokeRect(34, 34, 444, 444) }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
    return t
  }, [kind, rx, ry])
}
export function Floor({ at, size, surface, rough = 0.5, y = 0 }: { at: [number, number]; size: [number, number]; surface: Surface; rough?: number; y?: number }) {
  const map = useSurface(surface, Math.max(1, Math.round(size[0] / 2.6)), Math.max(1, Math.round(size[1] / 2.6)))
  return <mesh position={[at[0], y, at[1]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={size} /><meshStandardMaterial map={map} roughness={rough} metalness={surface === 'marble' ? 0.08 : 0} /></mesh>
}

/** A real light plus its glowing shade; brightness eases to the target like a dimmer. */
export function Lamp({ at, level, children, reach = 6, strength = 16, color = '#ffd9a0' }: { at: V3; level: number; children?: (m: RefObject<THREE.MeshStandardMaterial | null>) => ReactNode; reach?: number; strength?: number; color?: string }) {
  const light = useRef<THREE.PointLight>(null), glow = useRef<THREE.MeshStandardMaterial>(null), target = useMemo(() => new THREE.Color(), [])
  useFrame((_, dt) => {
    const l = light.current!
    l.intensity = damp(l.intensity, (level / 100) * strength, 4, dt)
    l.color.lerp(target.set(color), 1 - Math.exp(-3 * dt))
    if (glow.current) glow.current.emissiveIntensity = (l.intensity / strength) * 2.6
  })
  return <group position={at}><pointLight ref={light} color={color} distance={reach} decay={1.6} intensity={0} />{children?.(glow)}</group>
}
export const Shade = ({ m, p = [0, 0, 0], a = [0.2, 0.28, 0.3], color = '#fff1d6' }: { m: RefObject<THREE.MeshStandardMaterial | null>; p?: V3; a?: V3; color?: string }) => <mesh position={p}><cylinderGeometry args={[a[0], a[1], a[2], 28, 1, true]} /><meshStandardMaterial ref={m} color={color} emissive="#ffd9a0" side={THREE.DoubleSide} /></mesh>

/** Falling, rising or drifting points: rain, cool air, steam, smoke, sprinklers, sound. */
export function Particles({ count, area, origin, velocity, color, size, active, opacity = 0.8 }: { count: number; area: V3; origin: V3; velocity: V3; color: string; size: number; active: boolean; opacity?: number }) {
  const ref = useRef<THREE.Points>(null), time = useRef(0)
  const seed = useMemo(() => Float32Array.from({ length: count * 3 }, (_, i) => ((Math.sin(i * 91.7) * 43758.5) % 1 + 1) % 1), [count])
  const pos = useMemo(() => new Float32Array(count * 3), [count])
  useFrame((_, dt) => {
    const p = ref.current!, m = p.material as THREE.PointsMaterial
    m.opacity = damp(m.opacity, active ? opacity : 0, 3, dt)
    p.visible = m.opacity > 0.02
    if (!p.visible) return
    time.current += dt
    for (let i = 0; i < count; i++) for (let a = 0; a < 3; a++) {
      const k = i * 3 + a, span = area[a] || 1, travel = seed[k] * span + velocity[a] * time.current
      pos[k] = origin[a] + (velocity[a] === 0 ? (seed[k] - 0.5) * area[a] : ((travel % span) + span) % span)
    }
    p.geometry.attributes.position.needsUpdate = true
  })
  return <points ref={ref} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry><pointsMaterial color={color} size={size} transparent opacity={0} depthWrite={false} /></points>
}

export function Curtains({ at, width, open, color }: { at: V3; width: number; open: number; color: string }) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null)
  useFrame((_, dt) => { const s = damp(left.current!.scale.x, 1 - (open / 100) * 0.82, 2.2, dt); left.current!.scale.x = right.current!.scale.x = s })
  const half = width / 2 + 0.12
  const drape = (dir: 1 | -1) => Array.from({ length: 7 }, (_, i) => <Cyl key={i} p={[dir * (i + 0.5) * (half / 7), 0, 0]} a={[half / 12, half / 10.5, 1.75, 10]} color={color} rough={0.95} />)
  return (
    <group position={at}>
      <group ref={left} position={[-half, 0, 0]}>{drape(1)}</group>
      <group ref={right} position={[half, 0, 0]}>{drape(-1)}</group>
      <Box p={[0, 0.93, 0]} s={[width + 0.5, 0.06, 0.1]} color="#b9b2a6" metal={0.5} rough={0.35} />
    </group>
  )
}

export function Fan({ at, speed, ceiling }: { at: V3; speed: number; ceiling?: boolean }) {
  const blades = useRef<THREE.Group>(null), v = useRef(0)
  useFrame((_, dt) => { v.current = damp(v.current, speed * 5, 1.5, dt); if (ceiling) blades.current!.rotation.y += v.current * dt; else blades.current!.rotation.z += v.current * dt })
  const n = ceiling ? 4 : 3
  return (
    <group position={at}>
      {ceiling ? <Cyl p={[0, 0.25, 0]} a={[0.025, 0.025, 0.5]} color="#8e93a8" metal={0.7} /> : <><Cyl p={[0, -0.63, 0]} a={[0.02, 0.02, 1.2]} color="#c9ccd8" metal={0.7} /><Cyl p={[0, -1.24, 0]} a={[0.22, 0.24, 0.06]} color="#d9dce6" /><mesh><torusGeometry args={[0.32, 0.012, 8, 40]} /><M color="#c9ccd8" metal={0.6} /></mesh></>}
      <group ref={blades}>{Array.from({ length: n }, (_, i) => <group key={i} rotation={ceiling ? [0, (i * Math.PI * 2) / n, 0] : [0, 0, (i * Math.PI * 2) / n]}><Soft p={ceiling ? [0.5, 0, 0] : [0, 0.15, 0]} s={ceiling ? [0.8, 0.025, 0.16] : [0.14, 0.26, 0.02]} radius={0.008} color={ceiling ? '#7a5b43' : '#8f96c8'} /></group>)}<Cyl p={[0, 0, 0]} a={[0.09, 0.09, 0.09]} color="#e7e9f1" r={ceiling ? undefined : [Math.PI / 2, 0, 0]} /></group>
    </group>
  )
}

/** Wall-mounted air conditioner with visible air flow (blue when cooling, amber when warming). */
export function Aircon({ at, on, warm }: { at: V3; on: boolean; warm: boolean }) {
  return (
    <group position={at}>
      <Soft p={[0, 0, 0]} s={[0.9, 0.3, 0.24]} radius={0.06} color="#fbfbfd" rough={0.3} />
      <mesh position={[0.3, 0.03, 0.13]}><circleGeometry args={[0.018, 10]} /><meshBasicMaterial color={on ? '#30d158' : '#8b90a3'} /></mesh>
      <Particles active={on} count={55} origin={[-0.4, -1.15, 0.1]} area={[0.8, 1.0, 1.1]} velocity={[0, -0.5, 0.5]} color={warm ? '#ffb46b' : '#a5dcff'} size={0.045} />
    </group>
  )
}
