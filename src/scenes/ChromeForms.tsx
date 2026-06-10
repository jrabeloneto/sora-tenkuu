// scenes/ChromeForms.tsx — §01 CHROME FORMS (the BLUST gallery) · 鏡
// A swarm of liquid-metal bodies at y≈18. The pointer magnetically attracts
// the nearest forms; proximity makes them swell and brighten (fresnel pulse).
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { chromeMat } from '../materials/chrome.ts'
import { useReducedMotion } from '../hooks/useLenis.ts'

const CENTER_Y = 18

type FormDef = {
  geo: 'sphere' | 'torus' | 'capsule' | 'icosa'
  base: THREE.Vector3
  scale: number
  spin: number
  bob: number
}

const FORMS: FormDef[] = [
  { geo: 'sphere',  base: new THREE.Vector3(0, CENTER_Y + 0.2, 0),    scale: 1.05, spin: 0.10, bob: 0.6 },
  { geo: 'sphere',  base: new THREE.Vector3(-2.4, CENTER_Y + 1.1, -1), scale: 0.62, spin: 0.18, bob: 0.9 },
  { geo: 'sphere',  base: new THREE.Vector3(2.2, CENTER_Y - 0.9, -0.5), scale: 0.5, spin: 0.22, bob: 1.1 },
  { geo: 'torus',   base: new THREE.Vector3(1.9, CENTER_Y + 1.4, -2),  scale: 0.55, spin: 0.30, bob: 0.7 },
  { geo: 'torus',   base: new THREE.Vector3(-2.0, CENTER_Y - 1.3, -2), scale: 0.45, spin: 0.26, bob: 1.0 },
  { geo: 'capsule', base: new THREE.Vector3(-0.9, CENTER_Y + 2.0, -1.4), scale: 0.4, spin: 0.34, bob: 0.8 },
  { geo: 'capsule', base: new THREE.Vector3(1.0, CENTER_Y - 2.0, -1.8), scale: 0.36, spin: 0.28, bob: 1.2 },
  { geo: 'icosa',   base: new THREE.Vector3(3.1, CENTER_Y + 0.4, -2.6), scale: 0.34, spin: 0.40, bob: 0.9 },
  { geo: 'icosa',   base: new THREE.Vector3(-3.2, CENTER_Y - 0.1, -2.2), scale: 0.3, spin: 0.36, bob: 1.0 },
]

function FormGeometry({ kind }: { kind: FormDef['geo'] }) {
  switch (kind) {
    case 'torus':   return <torusGeometry args={[1, 0.42, 32, 64]} />
    case 'capsule': return <capsuleGeometry args={[0.6, 1.2, 8, 24]} />
    case 'icosa':   return <icosahedronGeometry args={[1, 1]} />
    default:        return <sphereGeometry args={[1, 48, 48]} />
  }
}

export function ChromeFormsScene({
  mouse,
}: {
  mouse: React.MutableRefObject<{ x: number; y: number }>
}) {
  const reduced = useReducedMotion()
  const refs = useRef<(THREE.Mesh | null)[]>([])
  // per-form clones: the proximity pulse mutates envMapIntensity, and the base
  // chrome material is shared with other rooms — never mutate the singleton
  const materials = useMemo(() => FORMS.map(() => chromeMat.clone()), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime()

    // pointer ray → world point on the swarm's plane (z = 0)
    let hasHit = false
    if (!reduced) {
      ndc.set(mouse.current.x, -mouse.current.y)
      raycaster.setFromCamera(ndc, camera)
      hasHit = raycaster.ray.intersectPlane(plane, hit) !== null
    }

    FORMS.forEach((f, i) => {
      const m = refs.current[i]
      if (!m) return

      // idle drift: orbit-ish bob + slow spin
      tmp.copy(f.base)
      tmp.y += Math.sin(t * f.bob + i * 1.7) * 0.22
      tmp.x += Math.cos(t * f.bob * 0.7 + i) * 0.14

      // magnetic attraction (falls off with distance, capped pull)
      let pulse = 0
      if (hasHit) {
        const d = hit.distanceTo(f.base)
        const influence = Math.max(0, 1 - d / 4.5)
        pulse = influence
        tmp.lerp(hit, influence * 0.28)
      }

      m.position.lerp(tmp, 0.06)
      m.rotation.y = t * f.spin
      m.rotation.x = Math.sin(t * f.spin * 0.8 + i) * 0.4

      // proximity pulse — swell + brighten the rim (reads as fresnel glow under bloom)
      const s = f.scale * (1 + pulse * 0.18 + Math.sin(t * 2.2 + i) * 0.015)
      m.scale.setScalar(s)
      const mat = m.material as THREE.MeshStandardMaterial
      mat.envMapIntensity = 1.7 + pulse * 1.4
    })
  })

  return (
    <group>
      {FORMS.map((f, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el }}
          position={f.base}
          material={materials[i]}
        >
          <FormGeometry kind={f.geo} />
        </mesh>
      ))}
      <Sparkles count={50} scale={[10, 6, 5]} position={[0, CENTER_Y, -1]} size={2} speed={reduced ? 0 : 0.3} color="#7FE0E8" opacity={0.5} />
    </group>
  )
}
