// scenes/CRTRoom.tsx — §03 CRT ROOM · 監視 (webcore interlude)
// A wall of CRT monitors at y≈64 glowing deep-blue, each screen running the
// blinking-eye glitch shader. Shells are one InstancedMesh; cables are bezier
// tubes. The DOM handles the void backdrop + scanline overlay cranking up here.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { darkShellMat, steelMat } from '../materials/chrome.ts'
import { crtVertex, crtFragment } from '../shaders/crt.glsl.ts'

const COLS = 7
const ROWS = 5
const GAP_X = 2.05
const GAP_Y = 1.65
const WALL = { x: -3, y: 64, z: -2.5 }

function gridPositions() {
  const out: THREE.Vector3[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push(
        new THREE.Vector3(
          WALL.x + (c - (COLS - 1) / 2) * GAP_X,
          WALL.y + (r - (ROWS - 1) / 2) * GAP_Y,
          WALL.z + (((r * COLS + c) * 7919) % 5) * 0.06 // slight, stable depth jitter
        )
      )
    }
  }
  return out
}

function Cables() {
  const curves = useMemo(() => {
    const floorY = WALL.y - (ROWS / 2) * GAP_Y - 0.6
    const mk = (x0: number, x1: number, sag: number) =>
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(x0, floorY + 0.4, WALL.z + 0.4),
        new THREE.Vector3(x0 + 1, floorY - sag, WALL.z + 1.6),
        new THREE.Vector3(x1 - 1, floorY - sag, WALL.z + 2.2),
        new THREE.Vector3(x1, floorY + 0.2, WALL.z + 0.6)
      )
    return [mk(-8, -2, 0.5), mk(-6, 2, 0.8), mk(-1, 3.5, 0.4), mk(-4, 1, 1.0)]
  }, [])
  return (
    <group>
      {curves.map((c, i) => (
        <mesh key={i} material={darkShellMat}>
          <tubeGeometry args={[c, 32, 0.045, 8]} />
        </mesh>
      ))}
    </group>
  )
}

export function CRTRoomScene() {
  const positions = useMemo(gridPositions, [])
  const shells = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const screenMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: crtVertex,
        fragmentShader: crtFragment,
        uniforms: { uTime: { value: 0 } },
      }),
    []
  )

  // set instance matrices once
  useMemo(() => {
    // deferred to first frame via ref check in useFrame below
    return null
  }, [])

  const placed = useRef(false)
  useFrame(({ clock }) => {
    screenMat.uniforms.uTime.value = clock.getElapsedTime()
    if (!placed.current && shells.current) {
      positions.forEach((p, i) => {
        dummy.position.copy(p)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        shells.current.setMatrixAt(i, dummy.matrix)
      })
      shells.current.instanceMatrix.needsUpdate = true
      placed.current = true
    }
  })

  return (
    <group>
      {/* monitor shells — one draw call */}
      <instancedMesh ref={shells} args={[undefined, undefined, positions.length]} material={darkShellMat} frustumCulled={false}>
        <boxGeometry args={[1.9, 1.5, 1.4]} />
      </instancedMesh>

      {/* screens — shared shader, per-monitor behavior derives from world pos */}
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z + 0.71]} material={screenMat}>
          <planeGeometry args={[1.55, 1.15]} />
        </mesh>
      ))}

      {/* floor slab + cables */}
      <mesh position={[WALL.x, WALL.y - (ROWS / 2) * GAP_Y - 0.9, WALL.z + 2]} material={steelMat}>
        <boxGeometry args={[18, 0.15, 8]} />
      </mesh>
      <Cables />

      {/* cold key light so the shells read against the void */}
      <pointLight position={[WALL.x, WALL.y, WALL.z + 6]} intensity={14} color="#2A5FE8" distance={18} decay={2} />
    </group>
  )
}
