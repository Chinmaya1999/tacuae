// Third-person walk-through of the designed room: move like in a game and switch devices with E.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { deviceById, furnitureById, type Room } from '../../../shared/data/catalog'
import { clamp, dims, placeDevice, toWorld } from './geometry'
import { pushOut, usePlay } from './play'

const RADIUS = 0.2, REACH = 1.7
const Limb = ({ r, len, color }: { r: number; len: number; color: string }) => <mesh position={[0, -len / 2, 0]} castShadow><capsuleGeometry args={[r, len - r, 8, 16]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>

export default function Player({ room, onToggle }: { room: Room; onToggle: (id: string) => void }) {
  const { camera, gl } = useThree()
  const { w, l } = dims(room)
  const body = useRef<THREE.Group>(null), hips = useRef<(THREE.Group | null)[]>([]), arms = useRef<(THREE.Group | null)[]>([])
  const pos = useRef(new THREE.Vector3(0, 0, l / 2 - 0.5)), yaw = useRef(0), pitch = useRef(0.36), phase = useRef(0), keys = useRef<Record<string, boolean>>({})
  const target = useRef(new THREE.Vector3()), want = useRef(new THREE.Vector3())

  useEffect(() => {
    const fov = (camera as THREE.PerspectiveCamera).fov
    ;(camera as THREE.PerspectiveCamera).fov = 62; camera.updateProjectionMatrix()
    pos.current.set(0, 0, l / 2 - 0.5)
    const typing = (e: KeyboardEvent) => ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return
      const k = e.key.toLowerCase()
      if (k.startsWith('arrow') || 'wasdqe'.includes(k)) e.preventDefault()
      if (k === 'e' && !e.repeat) usePlay.getState().press()
      keys.current[k] = true
    }
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    // drag to look around
    const el = gl.domElement
    let from: { x: number; y: number } | null = null
    const start = (e: PointerEvent) => { from = { x: e.clientX, y: e.clientY } }
    const move = (e: PointerEvent) => { if (!from) return; yaw.current -= (e.clientX - from.x) * 0.006; pitch.current = clamp(pitch.current + (e.clientY - from.y) * 0.004, 0.08, 1.15); from = { x: e.clientX, y: e.clientY } }
    const end = () => { from = null }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); el.addEventListener('pointerdown', start); window.addEventListener('pointermove', move); window.addEventListener('pointerup', end)
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); el.removeEventListener('pointerdown', start); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end)
      ;(camera as THREE.PerspectiveCamera).fov = fov; camera.updateProjectionMatrix()
      usePlay.getState().setNear(null); usePlay.getState().setStick(0, 0)
    }
  }, [camera, gl, l, room.id])

  const act = usePlay((s) => s.act), seen = useRef(act)
  useEffect(() => { if (act === seen.current) return; seen.current = act; const n = usePlay.getState().near; if (n) onToggle(n.id) }, [act, onToggle])

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05), k = keys.current, stick = usePlay.getState().stick
    if (k['q']) yaw.current += step * 2
    const forward = clamp((k['w'] || k['arrowup'] ? 1 : 0) - (k['s'] || k['arrowdown'] ? 1 : 0) - stick.y, -1, 1)
    const side = clamp((k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0) + stick.x, -1, 1)
    const moving = Math.abs(forward) + Math.abs(side) > 0.05, p = pos.current
    if (moving) {
      const fx = -Math.sin(yaw.current), fz = -Math.cos(yaw.current)
      let mx = fx * forward - fz * side, mz = fz * forward + fx * side
      const len = Math.max(1, Math.hypot(mx, mz)); mx /= len; mz /= len
      let x = p.x + mx * 1.9 * step, z = p.z + mz * 1.9 * step
      for (const f of room.furniture ?? []) {
        if (f.type === 'rug') continue
        const [bx, bz] = toWorld(f.x, f.y, w, l), [fw, fd] = furnitureById[f.type].size
        ;[x, z] = pushOut(x, z, { x: bx, z: bz, w: fw, d: fd, rot: (-f.rot * Math.PI) / 180 }, RADIUS)
      }
      p.x = clamp(x, -w / 2 + RADIUS, w / 2 - RADIUS); p.z = clamp(z, -l / 2 + RADIUS, l / 2 - RADIUS)
      const heading = Math.atan2(mx, mz), turn = Math.atan2(Math.sin(heading - body.current!.rotation.y), Math.cos(heading - body.current!.rotation.y))
      body.current!.rotation.y += turn * Math.min(1, step * 12)
      phase.current += step * 8.5
    }
    body.current!.position.set(p.x, moving ? Math.abs(Math.cos(phase.current)) * 0.035 : 0, p.z)
    const swing = moving ? Math.sin(phase.current) * 0.65 : 0
    for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; hips.current[i]!.rotation.x = THREE.MathUtils.damp(hips.current[i]!.rotation.x, swing * s, 14, step); arms.current[i]!.rotation.x = THREE.MathUtils.damp(arms.current[i]!.rotation.x, -swing * s * 0.8, 14, step) }

    // camera follows over the shoulder; a wall between it and the player is hidden by the room
    const dist = 3.1
    target.current.set(p.x, 1.25, p.z)
    want.current.set(p.x + Math.sin(yaw.current) * dist * Math.cos(pitch.current), 1.25 + Math.sin(pitch.current) * dist, p.z + Math.cos(yaw.current) * dist * Math.cos(pitch.current))
    camera.position.lerp(want.current, 1 - Math.exp(-9 * step)); camera.lookAt(target.current)

    // the closest device in reach can be switched
    let best: { id: string; name: string; on: boolean } | null = null, near = REACH
    for (const d of room.devices) { const [x, , z] = placeDevice(d, room).pos, gap = Math.hypot(x - p.x, z - p.z); if (gap < near) { near = gap; best = { id: d.id, name: deviceById[d.cat].name, on: d.on } } }
    usePlay.getState().setNear(best)
  })

  return (
    <group ref={body}>
      {[-0.1, 0.1].map((x, i) => <group key={x} ref={(g) => { hips.current[i] = g }} position={[x, 0.8, 0]}><Limb r={0.085} len={0.74} color="#273050" /><RoundedBox args={[0.13, 0.09, 0.25]} radius={0.04} position={[0, -0.76, 0.05]} castShadow><meshStandardMaterial color="#eef0f6" roughness={0.45} /></RoundedBox></group>)}
      <mesh position={[0, 1.1, 0]} scale={[1.1, 1, 0.72]} castShadow><capsuleGeometry args={[0.18, 0.32, 10, 22]} /><meshStandardMaterial color="#4f46e5" roughness={0.8} /></mesh>
      {[-0.25, 0.25].map((x, i) => <group key={x} ref={(g) => { arms.current[i] = g }} position={[x, 1.3, 0]} rotation={[0, 0, x > 0 ? 0.09 : -0.09]}><Limb r={0.058} len={0.3} color="#4f46e5" /><group position={[0, -0.3, 0]}><Limb r={0.044} len={0.28} color="#c68a63" /></group></group>)}
      <mesh position={[0, 1.6, 0]} scale={[0.93, 1.08, 0.98]} castShadow><sphereGeometry args={[0.15, 28, 22]} /><meshStandardMaterial color="#c68a63" roughness={0.6} /></mesh>
      <mesh position={[0, 1.63, -0.012]} rotation={[-0.34, 0, 0]} scale={[0.96, 1.08, 1.02]} castShadow><sphereGeometry args={[0.16, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.54]} /><meshStandardMaterial color="#1d1512" roughness={0.9} /></mesh>
    </group>
  )
}
