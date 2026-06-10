// App.tsx — SORA / 天空 · master composition
// Persistent R3F camera + Lenis-driven GSAP master timeline (rooms cross-fade, never hard cut).
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { HeroScene, SkyEnvironment } from './scenes/Hero.tsx'
import { LensFlare, LoadingBoot, ScrollCue, FrostPanel } from './components/Overlay.tsx'
import { useLenis, useReducedMotion } from './hooks/useLenis.ts'

gsap.registerPlugin(ScrollTrigger)

const IS_COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/* Exposes the live camera to the DOM flare without re-renders */
function CameraBridge({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    cameraRef.current = camera
  }, [camera, cameraRef])
  return null
}

/* Camera choreography — scroll progress (0..1 across the whole page) flies the
   camera up and past the blob, through the cloud layers. Weightless, damped. */
function ScrollRig({ progress }: { progress: React.MutableRefObject<number> }) {
  const reduced = useReducedMotion()
  useFrame(({ camera }) => {
    if (reduced) return
    const p = progress.current
    // ascend + pull back: hero room occupies p 0→~0.16 (1 of 6 screens)
    const targetY = p * 14            // climb into the zenith
    const targetZ = 6 + p * 5         // drift away from the blob
    const targetRotX = -p * 0.35      // tilt down toward the cloud sea
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06)
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotX, 0.06)
  })
  return null
}

/* PostFX pass — tuned on the hero (build order step 3).
   Mobile fallback: drop chromatic aberration, lighter bloom (brief §5). */
function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={IS_COARSE ? 0.7 : 1.15} luminanceThreshold={0.78} luminanceSmoothing={0.2} />
      {IS_COARSE ? <></> : <ChromaticAberration offset={new THREE.Vector2(0.0009, 0.0006)} />}
      <Noise opacity={0.055} />
      <Vignette eskil={false} offset={0.18} darkness={0.42} />
    </EffectComposer>
  )
}

const ROOMS = [
  { id: 'room-chrome-forms', num: '§01', title: 'CHROME FORMS', jp: '鏡', copy: 'A swarm of liquid-metal bodies, drawn to your touch.' },
  { id: 'room-crystal-city', num: '§02', title: 'CRYSTAL CITY', jp: '未来', copy: 'A flythrough above the cloud sea — glass towers, ribbon roads.' },
  { id: 'room-crt', num: '§03', title: 'CRT ROOM', jp: '監視', copy: 'A cold breath of static. The monitors are watching back.' },
  { id: 'room-archive', num: '§04', title: 'ARTIFACT ARCHIVE', jp: '2000', copy: 'The device museum — translucent plastic, monophonic dreams.' },
  { id: 'room-outro', num: '§05', title: 'DISSOLVE', jp: '夢', copy: 'Everything returns to the sky.' },
]

export default function App() {
  useLenis()
  const reduced = useReducedMotion()

  const assembly = useRef(0)                       // 0 = shards scattered → 1 = blob assembled
  const scrollProgress = useRef(0)                 // 0..1 across the full document
  const mouse = useRef({ x: 0, y: 0 })             // normalized -1..1, window-level
  const flareTarget = useRef(new THREE.Vector3(0, 0.7, 0))
  const cameraRef = useRef<THREE.Camera | null>(null)
  const lockupRef = useRef<HTMLDivElement>(null!)
  const [booted, setBooted] = useState(false)

  /* boot done → run the chrome assembly entry */
  const onBootDone = useCallback(() => {
    setBooted(true)
    gsap.to(assembly, { current: 1, duration: reduced ? 0 : 2.6, ease: 'power3.inOut' })
    if (lockupRef.current && !reduced) {
      gsap.fromTo(
        lockupRef.current,
        { opacity: 0, y: 40, filter: 'blur(12px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.8, ease: 'power3.out', delay: 0.6 }
      )
    }
  }, [reduced])

  /* single window-level mouse listener feeds 3D parallax + logotype micro-shift.
     (Canvas is pointer-events:none so scroll/touch always pass through it.) */
  useEffect(() => {
    if (reduced || IS_COARSE) return
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
      if (lockupRef.current) {
        gsap.to(lockupRef.current, { x: mouse.current.x * 14, y: mouse.current.y * 9, duration: 1.2, ease: 'power2.out' })
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduced])

  /* master scroll wiring:
     1) global progress for the camera rig
     2) hero DOM (lockup + cue + flare) fades out while leaving room 00
     3) room cards drift in */
  useEffect(() => {
    const global = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => (scrollProgress.current = self.progress),
    })

    const heroFade = gsap.to('#hero-dom', {
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#room-hero', start: 'center top', end: 'bottom top', scrub: true },
    })

    const cardTweens = gsap.utils.toArray<HTMLElement>('.room-card').map((card) =>
      gsap.fromTo(
        card,
        { opacity: 0, y: 60, filter: 'blur(10px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)', ease: 'power3.out', duration: 1.1,
          scrollTrigger: { trigger: card, start: 'top 75%' },
        }
      )
    )

    return () => {
      global.kill()
      heroFade.scrollTrigger?.kill()
      heroFade.kill()
      cardTweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill() })
    }
  }, [])

  return (
    <>
      <LoadingBoot onDone={onBootDone} />

      {/* Persistent 3D layer — pointer-events:none so wheel/touch scroll is never swallowed */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <Canvas
          gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 6], fov: 35 }}
          eventSource={document.body}
          style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
        >
          <CameraBridge cameraRef={cameraRef} />
          <ScrollRig progress={scrollProgress} />
          <Suspense fallback={null}>
            <SkyEnvironment />
            <HeroScene assembly={assembly} flareTarget={flareTarget} mouse={mouse} />
            <PostFX />
          </Suspense>
          <AdaptiveDpr pixelated />
        </Canvas>
      </div>

      {/* Hero DOM layer (fades together on scroll) */}
      <div id="hero-dom">
        {booted && <LensFlare target={flareTarget} camera={cameraRef} />}
        <div className="hero-overlay">
          <div className="hero-lockup" ref={lockupRef} style={{ opacity: booted ? undefined : 0 }}>
            <div className="hero-kicker">est. 2002 — above the clouds</div>
            <h1 className="chrome-type hero-title">SORA</h1>
            <div className="hero-jp">天空</div>
            <div className="hero-sub">a y2k japanese-futurism experience</div>
          </div>
        </div>
        <ScrollCue />
      </div>

      {/* Scroll rooms — §01–§05 mount their 3D scenes here as they're built */}
      <main>
        <section className="beat" id="room-hero" data-room="hero" />
        {ROOMS.map((room) => (
          <section className="beat" id={room.id} data-room={room.id.replace('room-', '')} key={room.id}>
            <div className="room-card">
              <FrostPanel>
                <div className="room-num">{room.num} · {room.jp}</div>
                <div className="chrome-type room-title">{room.title}</div>
                <p className="room-copy">{room.copy}</p>
                <div className="room-status">scene in production · 製作中</div>
              </FrostPanel>
            </div>
          </section>
        ))}
      </main>
    </>
  )
}
