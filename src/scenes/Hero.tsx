// scenes/Hero.tsx — §00 HERO · 天空 / SORA (above the clouds)
// Liquid-chrome morphing blob + shard assembly + cloud layers + sky environment.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, Environment, Lightformer, Sparkles, MeshDistortMaterial } from '@react-three/drei'
import { cloudVertex, cloudFragment } from '../shaders/cloud.glsl.ts'
import { useReducedMotion } from '../hooks/useLenis.ts'

const TOKENS = {
  skyZenith: '#4A90D9',
  skyMid: '#87BFE8',
  skyHorizon: '#C5E4F7',
  frostWhite: '#F0F6FF',
  chromeLight: '#EAF4FF',
  iridCyan: '#7FE0E8',
  iridLilac: '#C5B8E8',
}

/* ---------- Procedural sky environment (one shared HDRI-like env, brief §5) ---------- */
export function SkyEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      {/* zenith dome */}
      <Lightformer form="rect" intensity={2.2} color={TOKENS.skyZenith} scale={[40, 18, 1]} position={[0, 14, -18]} rotation-x={Math.PI / 6} />
      {/* horizon haze band — gives chrome its bright equator line */}
      <Lightformer form="rect" intensity={4.5} color={TOKENS.frostWhite} scale={[60, 3.2, 1]} position={[0, -0.5, -20]} />
      <Lightformer form="rect" intensity={1.6} color={TOKENS.skyHorizon} scale={[60, 10, 1]} position={[0, -8, -20]} />
      {/* anisotropic white strips — the streaky Y2K chrome highlights */}
      <Lightformer form="rect" intensity={6} color="#ffffff" scale={[1.2, 14, 1]} position={[-9, 4, -12]} rotation-z={0.4} />
      <Lightformer form="rect" intensity={5} color="#ffffff" scale={[0.8, 12, 1]} position={[8, 6, -10]} rotation-z={-0.5} />
      {/* iridescent micro-accents (~5%, glow only) */}
      <Lightformer form="circle" intensity={1.4} color={TOKENS.iridCyan} scale={6} position={[12, -2, -14]} />
      <Lightformer form="circle" intensity={1.0} color={TOKENS.iridLilac} scale={5} position={[-12, -3, -14]} />
    </Environment>
  )
}

/* ---------- Chrome shards that assemble into the blob on load ---------- */
function AssemblyShards({ progress }: { progress: React.MutableRefObject<number> }) {
  const COUNT = 42
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        dir: new THREE.Vector3().randomDirection(),
        dist: 4 + Math.random() * 7,
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale: 0.06 + Math.random() * 0.16,
        spin: (Math.random() - 0.5) * 2,
      })),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const p = progress.current // 0 → scattered, 1 → assembled
    const ease = 1 - Math.pow(1 - p, 3)
    seeds.forEach((s, i) => {
      const d = s.dist * (1 - ease)
      dummy.position.copy(s.dir).multiplyScalar(d)
      dummy.rotation.set(s.rot.x + t * s.spin, s.rot.y + t * s.spin * 0.7, 0)
      const sc = s.scale * (1 - ease) // shards shrink into the blob
      dummy.scale.setScalar(Math.max(sc, 0.0001))
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.visible = p < 0.995
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={TOKENS.chromeLight} metalness={1} roughness={0.08} envMapIntensity={1.6} />
    </instancedMesh>
  )
}

/* ---------- The liquid chrome blob ---------- */
export function ChromeBlob({
  assembly,
  flareTarget,
  mouse,
}: {
  assembly: React.MutableRefObject<number>
  flareTarget: React.MutableRefObject<THREE.Vector3>
  mouse: React.MutableRefObject<{ x: number; y: number }>
}) {
  const group = useRef<THREE.Group>(null!)
  const blob = useRef<THREE.Mesh>(null!)
  const reduced = useReducedMotion()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const p = assembly.current
    const ease = 1 - Math.pow(1 - p, 3)

    // breathing scale + slow rotation (brief §3.00)
    const breathe = 1 + Math.sin(t * 0.6) * 0.035
    blob.current.scale.setScalar(ease * breathe)
    if (!reduced) {
      blob.current.rotation.y = t * 0.12
      blob.current.rotation.x = Math.sin(t * 0.2) * 0.15
      // mouse parallax — micro, weightless
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, mouse.current.x * 0.25, 0.04)
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -mouse.current.y * 0.18, 0.04)
    }

    // publish the brightest-specular point (upper-left rim) for the DOM lens flare
    flareTarget.current.set(
      group.current.position.x - 0.55,
      group.current.position.y + 0.7,
      0
    )
  })

  return (
    <group ref={group}>
      <Float speed={reduced ? 0 : 1.2} rotationIntensity={reduced ? 0 : 0.25} floatIntensity={reduced ? 0 : 0.6}>
        <mesh ref={blob} scale={0}>
          <icosahedronGeometry args={[1.15, 64]} />
          {/* liquid chrome: full metal, near-zero roughness, env map does the work */}
          <MeshDistortMaterial
            distort={reduced ? 0.18 : 0.38}
            speed={reduced ? 0 : 1.4}
            metalness={1}
            roughness={0.06}
            envMapIntensity={1.8}
            color="#ffffff"
          />
        </mesh>
      </Float>
      <AssemblyShards progress={assembly} />
      {/* sparkle dust around the blob — sells the dream */}
      <Sparkles count={40} scale={5} size={2.2} speed={reduced ? 0 : 0.35} color={TOKENS.iridCyan} opacity={0.55} />
    </group>
  )
}

/* ---------- Parallax cloud layers (procedural fbm, no textures) ---------- */
function CloudLayer({
  y, z, scale, drift, coverage, opacityMul,
}: { y: number; z: number; scale: [number, number]; drift: number; coverage: number; opacityMul: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const reduced = useReducedMotion()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDrift: { value: reduced ? 0 : drift },
      uCoverage: { value: coverage },
      uTint: { value: new THREE.Color(TOKENS.frostWhite) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  useFrame(({ clock }) => {
    mat.current.uniforms.uTime.value = clock.getElapsedTime()
  })
  return (
    <mesh position={[0, y, z]}>
      <planeGeometry args={scale} />
      <shaderMaterial
        ref={mat}
        vertexShader={cloudVertex}
        fragmentShader={cloudFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        opacity={opacityMul}
      />
    </mesh>
  )
}

export function HeroScene({
  assembly,
  flareTarget,
  mouse,
}: {
  assembly: React.MutableRefObject<number>
  flareTarget: React.MutableRefObject<THREE.Vector3>
  mouse: React.MutableRefObject<{ x: number; y: number }>
}) {
  return (
    <group>
      <ChromeBlob assembly={assembly} flareTarget={flareTarget} mouse={mouse} />
      {/* sea of clouds below + drifting haze behind */}
      <CloudLayer y={-2.6} z={-3} scale={[26, 7]} drift={0.012} coverage={0.55} opacityMul={1} />
      <CloudLayer y={-1.8} z={-6} scale={[36, 9]} drift={0.008} coverage={0.45} opacityMul={0.8} />
      <CloudLayer y={2.8} z={-9} scale={[44, 10]} drift={0.005} coverage={0.3} opacityMul={0.5} />
    </group>
  )
}
