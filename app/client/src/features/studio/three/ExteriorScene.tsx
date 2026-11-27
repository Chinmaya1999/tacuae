// Villa exterior: lit windows, garden lights, gate and cameras that react to the same simulated devices.
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Group } from 'three'
import { deviceById, type PlacedDevice } from '../../../shared/data/catalog'
import { useStudioUI } from './store'

type V3 = [number, number, number]
const Box = ({ s, p, c, glow }: { s: V3; p: V3; c: string; glow?: string }) => (
  <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} emissive={glow ?? '#000000'} emissiveIntensity={glow ? 1.2 : 0} roughness={0.8} /></mesh>
)
function Gate({ open }: { open: boolean }) {
  const left = useRef<Group>(null), right = useRef<Group>(null)
  useFrame((_, dt) => { const t = open ? 2.6 : 0.8, k = Math.min(1, dt * 2.5); for (const [g, s] of [[left, -1], [right, 1]] as const) if (g.current) g.current.position.x += (s * t - g.current.position.x) * k })
  return <>{[left, right].map((ref, i) => <group key={i} ref={ref} position={[(i ? 1 : -1) * 0.8, 0.6, 5]}>{Array.from({ length: 6 }, (_, n) => <Box key={n} s={[0.08, 1.2, 0.08]} p={[-0.65 + n * 0.26, 0, 0]} c="#2c3442" />)}<Box s={[1.5, 0.08, 0.1]} p={[0, 0.55, 0]} c="#2c3442" /></group>)}</>
}
export default function ExteriorScene({ devices }: { devices: PlacedDevice[] }) {
  const night = useStudioUI((s) => s.night)
  const on = (kind: string) => devices.some((d) => deviceById[d.cat]?.kind === kind && d.on)
  const light = devices.find((d) => deviceById[d.cat]?.kind === 'light' && d.on)
  const glow = light ? light.color || '#ffd9a0' : undefined, curtainsOpen = on('curtain')
  const unlocked = devices.some((d) => deviceById[d.cat]?.kind === 'lock' && !d.on)
  return (
    <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ fov: 45, position: [9, 6, 13] }}>
      <color attach="background" args={[night ? '#071022' : '#a9d4f5']} />
      <hemisphereLight args={[night ? '#5566a0' : '#ffffff', '#2b2f25', night ? 0.6 : 1.2]} />
      <directionalLight position={[6, 10, 8]} intensity={night ? 0.25 : 1.8} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#3f6b43" /></mesh>
      <Box s={[2.4, 0.04, 6]} p={[0, 0.03, 3]} c="#8d8f94" />
      <Box s={[7, 2.4, 3.6]} p={[0, 1.2, -1.8]} c="#e8e1d4" /><Box s={[4.2, 2, 3.2]} p={[-1.2, 3.4, -2]} c="#d9d0bf" />
      <Box s={[7.3, 0.18, 3.9]} p={[0, 2.5, -1.8]} c="#6b5b49" /><Box s={[4.5, 0.18, 3.5]} p={[-1.2, 4.5, -2]} c="#6b5b49" />
      <Box s={[1, 1.7, 0.1]} p={[0, 0.85, 0.03]} c={unlocked ? '#3fbf7f' : '#5a4331'} />
      {([[-2.4, 1.3, 0.05], [2.4, 1.3, 0.05], [-2.2, 3.4, -0.36], [-0.2, 3.4, -0.36]] as V3[]).map((p, i) => <group key={i}>
        <Box s={[1.4, 1, 0.06]} p={p} c={night ? '#17233f' : '#d5dbff'} glow={glow} />
        {!curtainsOpen && <Box s={[1.36, 0.96, 0.02]} p={[p[0], p[1], p[2] + 0.045]} c="#7a6c8f" />}</group>)}
      {[-3.5, -2, 2, 3.5].map((x) => <group key={x}><Box s={[0.08, 0.6, 0.08]} p={[x, 0.3, 2]} c="#333" /><mesh position={[x, 0.66, 2]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={glow ?? '#555'} emissive={glow ?? '#000'} emissiveIntensity={2} /></mesh>{glow && night && <pointLight position={[x, 0.8, 2]} intensity={2} distance={4} color={glow} />}</group>)}
      {[-3.3, 3.3].map((x) => <group key={x}><Box s={[0.3, 0.18, 0.35]} p={[x, 2.2, 0.15]} c="#222" /><mesh position={[x, 2.2, 0.34]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color={on('camera') ? '#ff3b3b' : '#333'} emissive={on('camera') ? '#ff3b3b' : '#000'} emissiveIntensity={3} /></mesh></group>)}
      {[-4.4, 4.4].map((x) => <Box key={x} s={[5, 1, 0.2]} p={[x, 0.5, 5]} c="#cfc6b4" />)}
      <Gate open={unlocked} />
      <OrbitControls target={[0, 1.5, 0]} maxPolarAngle={Math.PI / 2.05} minDistance={6} maxDistance={24} />
    </Canvas>
  )
}
