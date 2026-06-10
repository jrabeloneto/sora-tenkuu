// scenes/ArtifactArchive.tsx — §04 ARTIFACT ARCHIVE · 2000 (+ §05 outro reprise)
// Four icons of the era as procedural 3D objects on rotating chrome pedestals
// at y=76, x = -9/-3/3/9 — the camera sweeps laterally past each one while the
// DOM strip carries the Nokia-poster editorial captions.
import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import { blueGlassMat, chromeMat, darkShellMat, steelMat } from '../materials/chrome.ts'
import { useReducedMotion } from '../hooks/useLenis.ts'

const Y = 76
export const DEVICE_X = [-9, -3, 3, 9]

const screenGlow = new THREE.MeshStandardMaterial({
  color: '#9fd8ff',
  emissive: '#7FE0E8',
  emissiveIntensity: 1.6,
  roughness: 0.3,
})
const lcdGlow = new THREE.MeshStandardMaterial({
  color: '#cfe8b0',
  emissive: '#b8e890',
  emissiveIntensity: 1.1,
  roughness: 0.4,
})

/* translucent clamshell flip phone, open */
function FlipPhone() {
  return (
    <group scale={1.1}>
      <mesh material={blueGlassMat} position={[0, 0, 0]}>
        <boxGeometry args={[0.75, 0.12, 1.5]} />
      </mesh>
      {/* keypad dots */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} material={chromeMat} position={[((i % 3) - 1) * 0.2, 0.075, 0.25 + Math.floor(i / 3) * 0.26]}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 12]} />
        </mesh>
      ))}
      {/* lid, open ~110° */}
      <group position={[0, 0.05, -0.75]} rotation-x={-Math.PI * 0.62}>
        <mesh material={blueGlassMat} position={[0, 0, -0.72]}>
          <boxGeometry args={[0.75, 0.1, 1.45]} />
        </mesh>
        <mesh material={screenGlow} position={[0, -0.06, -0.72]} rotation-x={Math.PI}>
          <planeGeometry args={[0.58, 1.1]} />
        </mesh>
      </group>
    </group>
  )
}

/* the indestructible one */
function Nokia3310() {
  return (
    <group scale={1.2}>
      <mesh material={darkShellMat}>
        <capsuleGeometry args={[0.42, 1.0, 8, 16]} />
      </mesh>
      <mesh material={darkShellMat} position={[0, 0, 0.3]} scale={[1, 1.15, 0.4]}>
        <sphereGeometry args={[0.42, 24, 24]} />
      </mesh>
      <mesh material={lcdGlow} position={[0, 0.32, 0.46]} rotation-x={-0.08}>
        <planeGeometry args={[0.46, 0.36]} />
      </mesh>
      {/* navi button + keys */}
      <mesh material={steelMat} position={[0, -0.02, 0.47]}>
        <cylinderGeometry args={[0.1, 0.12, 0.05, 16]} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} material={steelMat} position={[((i % 3) - 1) * 0.18, -0.28 - Math.floor(i / 3) * 0.16, 0.45]} rotation-x={Math.PI / 2}>
          <capsuleGeometry args={[0.05, 0.1, 4, 8]} />
        </mesh>
      ))}
    </group>
  )
}

/* desk CRT — little sibling of room §03 */
function MiniCRT() {
  return (
    <group scale={0.9}>
      <mesh material={chromeMat}>
        <boxGeometry args={[1.5, 1.2, 1.2]} />
      </mesh>
      <mesh material={screenGlow} position={[0, 0.05, 0.61]}>
        <planeGeometry args={[1.15, 0.85]} />
      </mesh>
      <mesh material={steelMat} position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 0.3, 16]} />
      </mesh>
    </group>
  )
}

/* MiniDisc — translucent square shell, chrome disc peeking */
function MiniDisc() {
  return (
    <group scale={1.25} rotation-x={-0.35}>
      <mesh material={blueGlassMat}>
        <boxGeometry args={[1.1, 0.07, 1.1]} />
      </mesh>
      <mesh material={chromeMat} position={[0, 0.045, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.42, 40]} />
      </mesh>
      <mesh material={darkShellMat} position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.06, 0.12, 24]} />
      </mesh>
      <mesh material={steelMat} position={[0.42, 0.045, -0.35]}>
        <boxGeometry args={[0.2, 0.03, 0.35]} />
      </mesh>
    </group>
  )
}

const DEVICES = [FlipPhone, Nokia3310, MiniCRT, MiniDisc]

function Pedestal({ x, index }: { x: number; index: number }) {
  const spinner = useRef<THREE.Group>(null!)
  const reduced = useReducedMotion()
  const Device = DEVICES[index]
  useFrame(({ clock }) => {
    if (reduced) return
    spinner.current.rotation.y = clock.getElapsedTime() * 0.35 + index * 1.3
  })
  return (
    <group position={[x, Y, 0]}>
      <group ref={spinner} position={[0, 0.4, 0]}>
        <Device />
      </group>
      {/* chrome pedestal */}
      <mesh material={chromeMat} position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.9, 1.05, 0.5, 40]} />
      </mesh>
      <mesh material={steelMat} position={[0, -1.42, 0]}>
        <cylinderGeometry args={[1.25, 1.35, 0.14, 40]} />
      </mesh>
      <pointLight position={[0, 1.8, 2]} intensity={6} color="#EAF4FF" distance={6} decay={2} />
    </group>
  )
}

export function ArtifactArchiveScene() {
  return (
    <group>
      {DEVICE_X.map((x, i) => (
        <Pedestal x={x} index={i} key={i} />
      ))}
      <Sparkles count={60} scale={[24, 6, 6]} position={[0, Y + 1, 0]} size={1.8} speed={0.2} color="#C5B8E8" opacity={0.4} />
    </group>
  )
}

/* §05 — a single chrome ring rising into the light, everything else is DOM */
export function OutroScene() {
  const ring = useRef<THREE.Mesh>(null!)
  const reduced = useReducedMotion()
  useFrame(({ clock }) => {
    if (reduced) return
    const t = clock.getElapsedTime()
    ring.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.3) * 0.15
    ring.current.rotation.z = t * 0.08
  })
  return (
    <group position={[0, 102, 0]}>
      <mesh ref={ring} material={chromeMat}>
        <torusGeometry args={[2.4, 0.16, 24, 96]} />
      </mesh>
      <Sparkles count={80} scale={[14, 12, 10]} size={3} speed={reduced ? 0 : 0.3} color="#F0F6FF" opacity={0.7} />
    </group>
  )
}
