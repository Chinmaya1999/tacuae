// The family: walk between rooms along the corridor, sit, sleep, and leave through the front door.
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useHome } from '../store'
import { roomOf } from '../engine/automation'
import type { Spot } from '../data/schedule'
import { damp } from './parts'
import type { Overlay } from './overlay'

type Look = { height: number; shirt: string; legs: string; skin: string; hair: string; long?: boolean; speed: number }
const LOOKS: Look[] = [
  { height: 1, shirt: '#3c6fd1', legs: '#2a2f45', skin: '#c68a63', hair: '#1d1512', speed: 2.2 },
  { height: 0.95, shirt: '#c94f76', legs: '#40335e', skin: '#d6a07a', hair: '#2b1a12', long: true, speed: 2.1 },
  { height: 0.74, shirt: '#eda12c', legs: '#3c6a8c', skin: '#d29a74', hair: '#241610', long: true, speed: 2.4 },
  { height: 0.68, shirt: '#2fa380', legs: '#34405c', skin: '#cc926c', hair: '#150f0c', speed: 2.6 },
]
const CORRIDOR = -0.95

function Limb({ r, len, color }: { r: number; len: number; color: string }) {
  return <mesh position={[0, -len / 2, 0]} castShadow><capsuleGeometry args={[r, len - r, 8, 16]} /><meshStandardMaterial color={color} roughness={0.82} /></mesh>
}

function Person({ spot, look, instant, index, overlay }: { spot: Spot; look: Look; instant: boolean; index: number; overlay: Overlay }) {
  const head3d = useRef(new THREE.Vector3())
  const root = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null)
  const hips = useRef<(THREE.Group | null)[]>([]), knees = useRef<(THREE.Group | null)[]>([]), arms = useRef<(THREE.Group | null)[]>([]), elbows = useRef<(THREE.Group | null)[]>([])
  const path = useRef<{ x: number; z: number }[]>([]), phase = useRef(index * 1.7), gone = useRef(spot.pose === 'away')

  useEffect(() => {
    const g = root.current!
    if (instant) { g.position.set(spot.x, 0, spot.z); gone.current = spot.pose === 'away'; path.current = []; return }
    if (spot.pose !== 'away' && gone.current) { g.position.set(1.6, 0, 4.9); gone.current = false }
    const from = { x: g.position.x, z: g.position.z }, to = { x: spot.x, z: spot.z }
    const same = roomOf({ ...from, pose: 'stand' }) && roomOf({ ...from, pose: 'stand' }) === roomOf({ ...to, pose: 'stand' })
    // between rooms: out to the corridor, along it, then in. Leaving: through the front door.
    const route = same ? [to] : spot.pose === 'away' ? [{ x: from.x, z: CORRIDOR }, { x: 2, z: CORRIDOR }, { x: 1.6, z: 3.6 }, to] : from.z > 4.2 ? [{ x: 1.6, z: 3.6 }, { x: 2.1, z: CORRIDOR }, { x: to.x, z: CORRIDOR }, to] : [{ x: from.x, z: CORRIDOR }, { x: to.x, z: CORRIDOR }, to]
    path.current = route
  }, [spot, instant])

  useFrame((_, dt) => {
    const g = root.current!, step = Math.min(dt, 0.05)
    let walking = false
    const next = path.current[0]
    if (next && !gone.current) {
      const dx = next.x - g.position.x, dz = next.z - g.position.z, dist = Math.hypot(dx, dz), move = look.speed * step
      if (dist <= move) { g.position.x = next.x; g.position.z = next.z; path.current.shift() } else {
        walking = true
        g.position.x += (dx / dist) * move; g.position.z += (dz / dist) * move
        const want = Math.atan2(dx, dz), turn = Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y))
        g.rotation.y += turn * Math.min(1, dt * 9)
      }
    }
    const arrived = !path.current.length
    if (arrived && spot.pose === 'away') gone.current = true
    g.visible = !gone.current
    // where this person's speech bubble belongs (none while out of the house)
    if (gone.current) overlay.anchors.delete(`say-${index}`)
    else overlay.anchors.set(`say-${index}`, head3d.current.set(g.position.x, 2.25 * look.height, g.position.z))
    const pose = arrived ? spot.pose : 'stand'
    if (arrived) g.rotation.y = damp(g.rotation.y, pose === 'sleep' ? 0 : (spot.face ?? 0), 6, dt)
    phase.current += walking ? step * 4 * look.speed : step * 1.5
    const swing = walking ? Math.sin(phase.current) * 0.6 : 0, idle = Math.sin(phase.current * 0.6 + index)
    const b = body.current!
    b.rotation.x = damp(b.rotation.x, pose === 'sleep' ? -Math.PI / 2 : walking ? 0.05 : 0, 5, dt)
    b.position.y = damp(b.position.y, pose === 'sleep' ? (spot.y ?? 0.62) + 0.08 : pose === 'sit' ? -0.27 * look.height : walking ? Math.abs(Math.cos(phase.current)) * 0.04 : idle * 0.006, 6, dt)
    b.position.z = damp(b.position.z, pose === 'sleep' ? 0.75 * look.height : 0, 5, dt)
    head.current!.rotation.y = damp(head.current!.rotation.y, walking || pose === 'sleep' ? 0 : Math.sin(phase.current * 0.23 + index * 2) * 0.45, 3, dt)
    for (let i = 0; i < 2; i++) {
      const side = i ? -1 : 1
      hips.current[i]!.rotation.x = damp(hips.current[i]!.rotation.x, pose === 'sit' ? -1.45 : swing * side, 12, dt)
      knees.current[i]!.rotation.x = damp(knees.current[i]!.rotation.x, pose === 'sit' ? 1.4 : walking ? Math.max(0, -swing * side) * 1.3 : 0, 12, dt)
      arms.current[i]!.rotation.x = damp(arms.current[i]!.rotation.x, pose === 'sit' ? -0.5 : pose === 'sleep' ? 0 : -swing * side * 0.75 + (walking ? 0 : idle * 0.03), 12, dt)
      elbows.current[i]!.rotation.x = damp(elbows.current[i]!.rotation.x, pose === 'sit' ? -0.75 : walking ? -0.35 : -0.1, 10, dt)
    }
  })

  const skin = <meshStandardMaterial color={look.skin} roughness={0.62} />
  return (
    <group ref={root} position={[spot.x, 0, spot.z]}>
      <group ref={body}>
        <group scale={look.height * 1.1}>
          {[-0.1, 0.1].map((x, i) => (
            <group key={x} ref={(el) => { hips.current[i] = el }} position={[x, 0.74, 0]}>
              <Limb r={0.082} len={0.39} color={look.legs} />
              <group ref={(el) => { knees.current[i] = el }} position={[0, -0.38, 0]}><Limb r={0.066} len={0.35} color={look.legs} /><RoundedBox args={[0.12, 0.08, 0.23]} radius={0.035} position={[0, -0.35, 0.05]} castShadow><meshStandardMaterial color="#eef0f6" roughness={0.5} /></RoundedBox></group>
            </group>
          ))}
          <mesh position={[0, 0.79, 0]} scale={[1, 1, 0.72]} castShadow><capsuleGeometry args={[0.165, 0.06, 8, 18]} /><meshStandardMaterial color={look.legs} roughness={0.85} /></mesh>
          <mesh position={[0, 1.04, 0]} scale={[1.08, 1, 0.74]} castShadow><capsuleGeometry args={[0.175, 0.25, 10, 22]} /><meshStandardMaterial color={look.shirt} roughness={0.88} /></mesh>
          {[-0.235, 0.235].map((x, i) => (
            <group key={x} ref={(el) => { arms.current[i] = el }} position={[x, 1.2, 0]} rotation={[0, 0, x > 0 ? 0.1 : -0.1]}>
              <Limb r={0.06} len={0.27} color={look.shirt} />
              <group ref={(el) => { elbows.current[i] = el }} position={[0, -0.27, 0]}><Limb r={0.045} len={0.24} color={look.skin} /><mesh position={[0, -0.27, 0]} scale={[0.8, 1.2, 0.6]}><sphereGeometry args={[0.048, 12, 10]} />{skin}</mesh></group>
            </group>
          ))}
          <mesh position={[0, 1.32, 0]}><cylinderGeometry args={[0.055, 0.065, 0.1, 16]} />{skin}</mesh>
          <group ref={head} position={[0, 1.49, 0]}>
            <mesh scale={[0.93, 1.08, 0.98]} castShadow><sphereGeometry args={[0.155, 32, 26]} />{skin}</mesh>
            <mesh position={[0, 0.035, -0.014]} rotation={[-0.34, 0, 0]} scale={[0.96, 1.08, 1.02]} castShadow><sphereGeometry args={[0.165, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]} /><meshStandardMaterial color={look.hair} roughness={0.9} /></mesh>
            {look.long && <RoundedBox args={[0.29, 0.36, 0.12]} radius={0.058} position={[0, -0.09, -0.1]} castShadow><meshStandardMaterial color={look.hair} roughness={0.9} /></RoundedBox>}
            {[-0.052, 0.052].map((x) => <group key={x} position={[x, 0.008, 0.142]}><mesh scale={[1.35, 0.85, 0.5]}><sphereGeometry args={[0.016, 12, 10]} /><meshStandardMaterial color="#fff" roughness={0.3} /></mesh><mesh position={[0, 0, 0.007]}><sphereGeometry args={[0.0085, 10, 8]} /><meshBasicMaterial color="#1a1210" /></mesh><mesh position={[0, 0.028, 0.002]}><boxGeometry args={[0.042, 0.007, 0.008]} /><meshBasicMaterial color={look.hair} /></mesh></group>)}
            <mesh position={[0, -0.028, 0.152]} scale={[0.75, 1.15, 0.8]}><sphereGeometry args={[0.022, 12, 10]} />{skin}</mesh>
            <mesh position={[0, -0.074, 0.14]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.03, 0.0055, 8, 18, Math.PI]} /><meshStandardMaterial color="#9a4a40" roughness={0.5} /></mesh>
            {[-0.148, 0.148].map((x) => <mesh key={x} position={[x, -0.005, 0]} scale={[0.5, 1, 0.8]}><sphereGeometry args={[0.032, 10, 8]} />{skin}</mesh>)}
          </group>
        </group>
      </group>
    </group>
  )
}

export default function People({ instant, overlay }: { instant: boolean; overlay: Overlay }) {
  const family = useHome((s) => s.family)
  return <>{family.map((spot, i) => <Person key={i} index={i} spot={spot} look={LOOKS[i]} instant={instant} overlay={overlay} />)}</>
}
