// "Game-quality" rendering shared by the 3D views: soft reflections everywhere, and on capable devices
// ambient occlusion (soft contact shading) and bloom (glow around lamps and screens).
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { isSoftwareGL } from '../lib/webgl'
import { isCoarse } from '../lib/useReducedMotion'

export function Reflections({ intensity }: { intensity: number }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl), map = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = map
    return () => { scene.environment = null; map.dispose(); pm.dispose() }
  }, [gl, scene])
  useEffect(() => { scene.environmentIntensity = intensity }, [scene, intensity])
  return null
}

type FxProps = { bloom: number; threshold: number; ao: number }
function Effects({ bloom, threshold, ao }: FxProps) {
  const { gl, scene, camera, size } = useThree()
  const fx = useMemo(() => {
    const composer = new EffectComposer(gl)
    composer.addPass(new RenderPass(scene, camera))
    if (ao > 0) {
      const pass = new GTAOPass(scene, camera)
      pass.updateGtaoMaterial({ radius: ao, distanceExponent: 1.4, thickness: 1, scale: 1.1 })
      const draw = pass.render.bind(pass)
      // invisible click targets and light cones must not cast contact shading
      pass.render = (...args: Parameters<typeof draw>) => {
        const hidden: THREE.Object3D[] = []
        scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (o.visible && m && !Array.isArray(m) && m.transparent) { o.visible = false; hidden.push(o) } })
        draw(...args)
        for (const o of hidden) o.visible = true
      }
      composer.addPass(pass)
    }
    const glow = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.5, 0.9)
    composer.addPass(glow)
    composer.addPass(new OutputPass())
    return { composer, glow }
  }, [gl, scene, camera, ao])
  useEffect(() => { fx.composer.setPixelRatio(gl.getPixelRatio()); fx.composer.setSize(size.width, size.height) }, [fx, gl, size])
  useEffect(() => { fx.glow.strength = bloom; fx.glow.threshold = threshold }, [fx, bloom, threshold])
  useEffect(() => () => { fx.composer.passes.forEach((p) => p.dispose()); fx.composer.dispose() }, [fx])
  useFrame(() => fx.composer.render(), 1) // takes over drawing from react-three-fiber
  return null
}

export default function Cinematic({ environment, ...fx }: FxProps & { environment?: number }) {
  const rich = useMemo(() => !isSoftwareGL() && !isCoarse(), [])
  return <>{environment !== undefined && <Reflections intensity={environment} />}{rich && <Effects {...fx} />}</>
}
