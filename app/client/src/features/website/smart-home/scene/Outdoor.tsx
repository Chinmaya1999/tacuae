// Garden, garage, gate, car, weather and the roof used by the exterior view.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useHome } from '../store'
import { Ball, Box, Cyl, Floor, Lamp, M, Particles, Soft, damp, useSurface } from './parts'

function GarageDoor({ open }: { open: boolean }) {
  const door = useRef<THREE.Group>(null)
  useFrame((_, dt) => { const g = door.current!; g.scale.y = damp(g.scale.y, open ? 0.08 : 1, 2.2, dt) })
  return <group ref={door} position={[-9.8, 2.2, 4.15]}>{Array.from({ length: 7 }, (_, i) => <Box key={i} p={[0, -0.155 - i * 0.31, 0]} s={[4.5, 0.29, 0.07]} color="#8c93a8" metal={0.6} rough={0.35} />)}</group>
}

function Car({ away, charging }: { away: boolean; charging: boolean }) {
  const car = useRef<THREE.Group>(null), light = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }, dt) => {
    const g = car.current!
    g.position.z = damp(g.position.z, away ? 15 : 1.2, 1.1, dt)
    g.visible = g.position.z < 12.5
    light.current!.opacity = charging ? 0.5 + Math.sin(clock.elapsedTime * 4) * 0.5 : 0.1
  })
  const paint = <meshPhysicalMaterial color="#27386e" metalness={0.75} roughness={0.28} clearcoat={1} clearcoatRoughness={0.08} />
  return (
    <>
      <group ref={car} position={[-9.8, 0, 1.2]}>
        <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[2, 0.5, 4]} />{paint}</mesh>
        <mesh position={[0, 0.98, -0.2]} castShadow><boxGeometry args={[1.8, 0.42, 2.1]} /><meshPhysicalMaterial color="#0d1424" metalness={0.4} roughness={0.05} clearcoat={1} /></mesh>
        <mesh position={[0, 1.23, -0.25]} castShadow><boxGeometry args={[1.7, 0.1, 1.6]} />{paint}</mesh>
        {[-1.02, 1.02].flatMap((x) => [-1.3, 1.3].map((z) => <group key={`${x}${z}`} position={[x, 0.34, z]} rotation={[0, 0, Math.PI / 2]}><Cyl p={[0, 0, 0]} a={[0.34, 0.34, 0.24]} color="#111216" rough={0.9} /><Cyl p={[0, 0, 0]} a={[0.18, 0.18, 0.26]} color="#c9ced9" metal={0.9} rough={0.2} /></group>))}
        {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 0.62, 2.01]}><planeGeometry args={[0.4, 0.12]} /><meshBasicMaterial color="#eef4ff" toneMapped={false} /></mesh>)}
      </group>
      <Soft p={[-12.15, 1, 0]} s={[0.22, 0.7, 0.42]} radius={0.05} color="#e8ebf4" />
      <mesh position={[-12.02, 1.15, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.07, 20]} /><meshBasicMaterial ref={light} color="#30d158" transparent toneMapped={false} /></mesh>
      {charging && !away && <mesh position={[-11.5, 0.65, 0]} rotation={[0, 0, -1.25]}><cylinderGeometry args={[0.025, 0.025, 1.15, 8]} /><M color="#1c1f2b" /></mesh>}
    </>
  )
}

function Gate({ open }: { open: boolean }) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null)
  useFrame((_, dt) => { left.current!.rotation.y = damp(left.current!.rotation.y, open ? 1.45 : 0, 2, dt); right.current!.rotation.y = -left.current!.rotation.y })
  const leaf = (dir: 1 | -1) => <>{Array.from({ length: 8 }, (_, i) => <Box key={i} p={[dir * (0.12 + i * 0.2), 0.55, 0]} s={[0.05, 1, 0.05]} color="#23263a" metal={0.7} />)}<Box p={[dir * 0.82, 0.95, 0]} s={[1.62, 0.07, 0.07]} color="#23263a" metal={0.7} /><Box p={[dir * 0.82, 0.2, 0]} s={[1.62, 0.07, 0.07]} color="#23263a" metal={0.7} /></>
  return <group position={[1.6, 0, 8.5]}><group ref={left} position={[-1.65, 0, 0]}>{leaf(1)}</group><group ref={right} position={[1.65, 0, 0]}>{leaf(-1)}</group>{[-1.8, 1.8].map((x) => <Box key={x} p={[x, 0.65, 0]} s={[0.28, 1.3, 0.28]} color="#cfc8bd" />)}</group>
}

function Roof({ show }: { show: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const g = group.current!
    g.position.y = damp(g.position.y, show ? 0 : 5, 2.5, dt)
    g.visible = show || g.position.y < 4.6
  })
  return (
    <group ref={group} position={[0, 5, 0]} visible={false}>
      <Box p={[0, 3.25, -0.9]} s={[14.8, 0.28, 10.2]} color="#2f3347" rough={0.5} />
      <Box p={[1.6, 2.95, 4.5]} s={[4.2, 0.16, 1.3]} color="#c9a27e" rough={0.4} />
      <Box p={[0, 3.05, 4.28]} s={[14.8, 0.14, 0.12]} color="#d8c48a" metal={0.7} />
      {/* glazed front */}
      {[-6, -4.4, -2.8, -1.2, 3.6, 5.2, 6.4].map((x) => <group key={x}><mesh position={[x, 1.75, 4.18]}><planeGeometry args={[1.45, 2.65]} /><meshStandardMaterial color="#9fc6ee" metalness={0.9} roughness={0.08} transparent opacity={0.45} /></mesh><Box p={[x - 0.76, 1.75, 4.2]} s={[0.07, 2.7, 0.1]} color="#23263a" /></group>)}
      {[-7.08, 7.08].map((x) => <Box key={x} p={[x, 2.35, -0.7]} s={[0.18, 1.55, 9.8]} color="#ece6dc" />)}
      {[-3, 0, 3].map((x) => <Box key={x} p={[x, 3.5, -2.4]} s={[2.4, 0.08, 1.6]} r={[0.25, 0, 0]} color="#101a3a" metal={0.8} rough={0.2} />)}
    </group>
  )
}

export default function Outdoor({ lite }: { lite: boolean }) {
  const v = useHome((s) => s.values), weather = useHome((s) => s.weather), view = useHome((s) => s.view)
  const away = useHome((s) => s.family[0].pose === 'away')
  const grass = useSurface('grass', 12, 9)
  return (
    <group>
      <mesh position={[-1.5, -0.25, 1]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]} receiveShadow><circleGeometry args={[16, 96]} /><meshStandardMaterial map={grass} roughness={1} /></mesh>
      <mesh position={[-1.5, -0.85, 1]} scale={[1, 1, 0.72]}><cylinderGeometry args={[16, 14.5, 1.15, 96, 1, true]} /><M color="#3b2f2a" rough={1} /></mesh>
      <Floor at={[1.6, 6.9]} size={[1.9, 5.4]} surface="paving" y={-0.2} rough={0.7} />
      <Floor at={[-9.8, 7]} size={[4.4, 5.6]} surface="paving" y={-0.19} rough={0.7} />
      {/* garage */}
      <Floor at={[-9.8, 1.15]} size={[5.2, 6]} surface="paving" y={-0.01} />
      <Box p={[-9.8, 1.2, -1.9]} s={[5.3, 2.4, 0.14]} color="#d9d3c8" /><Box p={[-12.4, 0.9, 1.15]} s={[0.14, 1.8, 6]} color="#d9d3c8" />
      {[-12.2, -7.4].map((x) => <Box key={x} p={[x, 1.15, 4.15]} s={[0.3, 2.3, 0.2]} color="#3a3d4f" />)}<Box p={[-9.8, 2.38, 4.15]} s={[5.1, 0.22, 0.24]} color="#3a3d4f" />
      <GarageDoor open={!!v['garage.door']} />
      <Car away={away} charging={!!v['garage.ev']} />
      <Lamp at={[-9.8, 2.2, -1]} level={v['garage.light']} strength={18} color="#eef4ff" />
      {/* security cameras */}
      {[[-7.2, 2.2, 4.35], [7.15, 1.9, 4.3]].map(([x, y, z]) => <group key={x} position={[x, y, z]}><Soft p={[0, 0, 0.1]} s={[0.18, 0.16, 0.36]} radius={0.06} color="#f2f4fa" /><mesh position={[0, 0, 0.29]}><circleGeometry args={[0.04, 14]} /><meshBasicMaterial color={v['security.cameras'] ? '#ff453a' : '#333846'} /></mesh></group>)}
      {/* garden lamps, planting, pool */}
      {[-6.2, -2.6, 0.1, 3.1, 6.2].map((x) => <group key={x} position={[x, 0, 5.4]}><Cyl p={[0, 0.2, 0]} a={[0.04, 0.04, 0.8]} color="#2a2f3f" /><mesh position={[0, 0.66, 0]}><sphereGeometry args={[0.12, 20, 14]} /><meshStandardMaterial color="#fff3da" emissive="#ffd596" emissiveIntensity={(v['garden.light'] / 100) * 2.6} /></mesh></group>)}
      <Lamp at={[-4.4, 0.9, 6]} level={v['garden.light']} strength={10} reach={7} />
      {!lite && <Lamp at={[4.6, 0.9, 6]} level={v['garden.light']} strength={10} reach={7} />}
      <Box p={[10.2, -0.17, 3]} s={[3.8, 0.14, 5]} color="#d9d3c8" /><mesh position={[10.2, -0.09, 3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.2, 4.4]} /><meshPhysicalMaterial color="#2f9fd0" roughness={0.06} metalness={0.3} clearcoat={1} emissive="#0a5a80" emissiveIntensity={(v['garden.light'] / 100) * 0.9} /></mesh>
      {[[-14, -3.4, 1.2], [-13.6, 5.6, 0.85], [9.4, -4.4, 1.3], [13, -1.2, 1], [12.4, 7, 0.8], [-6.5, -8, 1.35], [-0.5, -8.4, 1.1], [5, -8.1, 1.3]].map(([x, z, s]) => <group key={`${x}${z}`} position={[x, -0.2, z]} scale={s}><Cyl p={[0, 0.7, 0]} a={[0.11, 0.18, 1.5]} color="#6a4a33" />{[[0, 1.95, 0, 0.85], [-0.55, 1.55, 0.2, 0.55], [0.55, 1.65, -0.1, 0.62]].map(([a, b, c, r], i) => <Ball key={i} p={[a, b, c]} radius={r} color={i ? '#356b3d' : '#43854d'} rough={1} />)}</group>)}
      {[-6.4, -5.2, -4, -2.8, 3.8, 5, 6.2].map((x) => <Ball key={x} p={[x, -0.02, 8.2]} radius={0.38} color="#3f7d48" rough={1} />)}
      <Gate open={!!v['garden.gate']} />
      {[-4.8, -1.4, 4.8].map((x) => <group key={x}><Cyl p={[x, -0.1, 6.7]} a={[0.06, 0.08, 0.2]} color="#222" /><Particles active={!!v['garden.irrigation']} count={90} origin={[x - 0.9, -0.1, 5.9]} area={[1.8, 0.9, 1.6]} velocity={[0, 1.1, 0]} color="#bfe6ff" size={0.045} /></group>)}
      <Particles active={weather === 'rainy'} count={lite ? 500 : 1300} origin={[-16, -0.2, -10]} area={[30, 9, 6]} velocity={[-0.7, -10, 0]} color="#bcd6ff" size={0.055} opacity={0.75} />
      <Particles active={weather === 'rainy'} count={lite ? 220 : 600} origin={[-15, -0.2, 7.4]} area={[28, 7, 5]} velocity={[-0.7, -10, 0]} color="#bcd6ff" size={0.045} opacity={0.65} />
      <Particles active={weather === 'cold'} count={lite ? 250 : 600} origin={[-16, -0.2, 1]} area={[30, 8, 18]} velocity={[0.15, -0.8, 0]} color="#ffffff" size={0.05} opacity={0.5} />
      <Roof show={view === 'exterior'} />
    </group>
  )
}
