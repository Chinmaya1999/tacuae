// The 3D window of the solutions showcase. Loaded only when the section comes into view.
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Cinematic from '../../../../shared/three/Cinematic'
import { damp } from '../../smart-home/scene/parts'
import { SCENES, VIEW } from './scenes'

/** Glides to each set's viewpoint with a slow cinematic drift; visitors can drag to look around. */
function Camera({ slug, still }: { slug: string; still: boolean }) {
  const { camera, size } = useThree(), controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const eye = useMemo(() => new THREE.Vector3(), []), look = useMemo(() => new THREE.Vector3(), []), held = useRef(false)
  useEffect(() => { held.current = false }, [slug])
  useFrame(({ clock }, dt) => {
    const v = VIEW[slug], c = controls.current!
    if (held.current) return
    look.set(...v.look); eye.set(...v.eye).sub(look)
    eye.multiplyScalar(Math.max(1, 1.6 / (size.width / size.height))) // step back on narrow screens
    if (!still) eye.applyAxisAngle(camera.up, Math.sin(clock.elapsedTime * 0.22) * 0.17)
    eye.add(look)
    camera.position.set(damp(camera.position.x, eye.x, 2.2, dt), damp(camera.position.y, eye.y, 2.2, dt), damp(camera.position.z, eye.z, 2.2, dt))
    c.target.set(damp(c.target.x, look.x, 2.2, dt), damp(c.target.y, look.y, 2.2, dt), damp(c.target.z, look.z, 2.2, dt))
    c.update()
  })
  return <OrbitControls ref={controls} makeDefault enableZoom={false} enablePan={false} minPolarAngle={0.4} maxPolarAngle={1.45} onStart={() => { held.current = true }} />
}

/** Without a graphics card, draw a few frames a second so the page stays responsive. */
function Throttle() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => { const t = setInterval(() => invalidate(), 170); return () => clearInterval(t) }, [invalidate])
  return null
}

export default function ServiceStage({ slug, step, running, still, rich, slow }: { slug: string; step: number; running: boolean; still: boolean; rich: boolean; slow: boolean }) {
  const Scene = SCENES[slug], sun = VIEW[slug].sun
  return (
    <Canvas shadows={rich ? 'percentage' : false} dpr={slow ? 0.8 : [1, rich ? 1.6 : 1.25]} frameloop={!running ? 'never' : slow ? 'demand' : 'always'} camera={{ fov: 34, position: VIEW[slug].eye }} style={{ touchAction: 'pan-y' }}>
      {slow && <Throttle />}
      <color attach="background" args={['#0d1330']} />
      <fog attach="fog" args={['#0d1330', 16, 34]} />
      <hemisphereLight args={['#cfe0ff', '#3b3040', 0.22 + sun * 0.45]} />
      <directionalLight position={[5, 8, 6]} intensity={sun * 1.5} castShadow={rich} shadow-mapSize={[1536, 1536]} shadow-bias={-0.0003} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, 0]} receiveShadow><circleGeometry args={[14, 64]} /><meshStandardMaterial color="#161d44" roughness={0.85} /></mesh>
      <Scene key={slug} step={step} />
      <Cinematic environment={0.06 + sun * 0.1} bloom={0.18} threshold={1.25} ao={0.4} />
      <Camera slug={slug} still={still || slow} />
    </Canvas>
  )
}
