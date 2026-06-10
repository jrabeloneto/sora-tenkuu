// scenes/CrystalCity.tsx — §02 CRYSTAL CITY · 未来 (signature flythrough)
// The camera glides up through translucent glass/chrome architecture above a
// sea of clouds (path y≈28→52). All procedural: lathe/cylinder/torus modules
// sharing one transmissive material — no GLBs, instanced where it matters.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { blueGlassMat, chromeMat, steelMat } from '../materials/chrome.ts'
import { CloudLayer } from './Hero.tsx'
import { useReducedMotion } from '../hooks/useLenis.ts'

/* deterministic pseudo-random so the city is stable between mounts */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

type Tower = {
  pos: [number, number, number]
  height: number
  radius: number
  twist: number
  kind: 'tower' | 'spire'
}

function buildTowers(): Tower[] {
  const rand = rng(20020607)
  const towers: Tower[] = []
  // towers flank the camera's ascent corridor (camera x ∈ [-1.4, 1.4], z 13→9)
  for (let i = 0; i < 16; i++) {
    const side = i % 2 === 0 ? -1 : 1
    const x = side * (3.2 + rand() * 5.5)
    const y = 28 + rand() * 22
    const z = 12 - rand() * 22 // from in front of the gates to deep behind
    towers.push({
      pos: [x, y, z],
      height: 5 + rand() * 9,
      radius: 0.5 + rand() * 0.9,
      twist: rand() * Math.PI,
      kind: rand() > 0.7 ? 'spire' : 'tower',
    })
  }
  return towers
}

function GlassTower({ t }: { t: Tower }) {
  return (
    <group position={t.pos} rotation-y={t.twist}>
      {t.kind === 'tower' ? (
        <>
          <mesh material={blueGlassMat}>
            <cylinderGeometry args={[t.radius * 0.8, t.radius, t.height, 6]} />
          </mesh>
          {/* chrome crown ring */}
          <mesh position={[0, t.height / 2 + 0.1, 0]} material={chromeMat} rotation-x={Math.PI / 2}>
            <torusGeometry args={[t.radius * 0.85, 0.07, 12, 32]} />
          </mesh>
        </>
      ) : (
        <>
          <mesh material={blueGlassMat}>
            <coneGeometry args={[t.radius, t.height, 5]} />
          </mesh>
          <mesh position={[0, -t.height * 0.25, 0]} material={steelMat} rotation-x={Math.PI / 2}>
            <torusGeometry args={[t.radius * 1.15, 0.05, 10, 28]} />
          </mesh>
        </>
      )}
    </group>
  )
}

/* Ribbon roads — sweeping chrome tori that arc across the corridor */
function Ribbons() {
  const g = useRef<THREE.Group>(null!)
  const reduced = useReducedMotion()
  useFrame(({ clock }) => {
    if (reduced) return
    const t = clock.getElapsedTime()
    g.current.children.forEach((c, i) => {
      c.rotation.z = t * 0.04 * (i % 2 === 0 ? 1 : -1) + i
    })
  })
  return (
    <group ref={g}>
      <mesh position={[0, 34, -4]} rotation={[Math.PI / 2.3, 0, 0]} material={chromeMat}>
        <torusGeometry args={[7.5, 0.12, 12, 96]} />
      </mesh>
      <mesh position={[0, 42, -6]} rotation={[Math.PI / 1.9, 0.4, 0]} material={steelMat}>
        <torusGeometry args={[9.5, 0.1, 12, 96]} />
      </mesh>
      <mesh position={[0, 49, -3]} rotation={[Math.PI / 2.6, -0.3, 0]} material={chromeMat}>
        <torusGeometry args={[6.5, 0.09, 12, 96]} />
      </mesh>
    </group>
  )
}

export function CrystalCityScene() {
  const towers = useMemo(buildTowers, [])
  const reduced = useReducedMotion()
  return (
    <group>
      {towers.map((t, i) => (
        <GlassTower t={t} key={i} />
      ))}
      <Ribbons />
      {/* sea of clouds the city floats on */}
      <CloudLayer y={27} z={-10} scale={[60, 14]} drift={0.006} coverage={0.6} opacityMul={1} />
      <CloudLayer y={31} z={2} scale={[50, 10]} drift={0.01} coverage={0.4} opacityMul={0.7} />
      {/* glitter in the air — heavy bloom does the god-ray work */}
      <Sparkles count={reduced ? 0 : 120} scale={[18, 26, 18]} position={[0, 40, -2]} size={2.4} speed={0.25} color="#EAF4FF" opacity={0.6} />
      <Sparkles count={reduced ? 0 : 40} scale={[14, 20, 12]} position={[0, 42, 0]} size={3.2} speed={0.15} color="#7FE0E8" opacity={0.4} />
    </group>
  )
}
