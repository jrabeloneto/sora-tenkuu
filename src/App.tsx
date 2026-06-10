// App.tsx — SORA / 天空 · master composition
// Persistent R3F camera + Lenis-driven GSAP master timeline (rooms cross-fade, never hard cut).
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { HeroScene, SkyEnvironment } from './scenes/Hero.tsx'
import { LensFlare, LoadingBoot, ScrollCue } from './components/Overlay.tsx'
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

export default function App() {
  const lenis = useLenis()
  const reduced = useReducedMotion()

  const assembly = useRef(0) // 0 = shards scattered → 1 = blob assembled
  const flareTarget = useRef(new THREE.Vector3(0, 0.7, 0))
  const cameraRef = useRef<THREE.Camera | null>(null)
  const lockupRef = useRef<HTMLDivElement>(null!)
  const [booted, setBooted] = useState(false)

  /* boot done → run the chrome assembly entry */
  const onBootDone = useCallback(() => {
    setBooted(true)
    gsap.to(assembly, {
      current: 1,
      duration: reduced ? 0 : 2.6,
      ease: 'power3.inOut',
    })
    if (lockupRef.current && !reduced) {
      gsap.fromTo(
        lockupRef.current,
        { opacity: 0, y: 40, filter: 'blur(12px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.8, ease: 'power3.out', delay: 0.6 }
      )
    }
  }, [reduced])

  /* logotype mouse parallax (micro-shift, brief §4) */
  useEffect(() => {
    if (reduced || IS_COARSE) return
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      gsap.to(lockupRef.current, { x: x * 14, y: y * 9, duration: 1.2, ease: 'power2.out' })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [reduced])

  /* master scroll timeline skeleton — hero fades as we leave the room */
  useEffect(() => {
    const st = gsap.to('.hero-overlay, .scroll-cue, .lens-flare', {
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: '#room-hero', start: 'bottom 70%', end: 'bottom 25%', scrub: true },
    })
    return () => {
      st.scrollTrigger?.kill()
      st.kill()
    }
  }, [])

  return (
    <>
      <LoadingBoot onDone={onBootDone} />

      {/* Persistent 3D layer */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
        <Canvas
          gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 6], fov: 35 }}
        >
          <CameraBridge cameraRef={cameraRef} />
          <Suspense fallback={null}>
            <SkyEnvironment />
            <HeroScene assembly={assembly} flareTarget={flareTarget} />
            <PostFX />
          </Suspense>
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Canvas>
      </div>

      {/* Flare lives in the DOM (screen-space, blend: screen) */}
      {booted && <LensFlare target={flareTarget} camera={cameraRef} />}

      {/* Hero lockup */}
      <div className="hero-overlay">
        <div className="hero-lockup" ref={lockupRef} style={{ opacity: booted ? undefined : 0 }}>
          <div className="hero-kicker">est. 2002 — above the clouds</div>
          <h1 className="chrome-type hero-title">SORA</h1>
          <div className="hero-jp">天空</div>
          <div className="hero-sub">a y2k japanese-futurism experience</div>
        </div>
      </div>
      <ScrollCue />

      {/* Scroll rooms — §01–§05 mount their scenes here as they're built */}
      <main>
        <section className="beat" id="room-hero" data-room="hero" />
        <section className="beat" id="room-chrome-forms" data-room="chrome-forms">
          <span className="beat-label">§01 — chrome forms · 鏡</span>
        </section>
        <section className="beat" id="room-crystal-city" data-room="crystal-city">
          <span className="beat-label">§02 — crystal city · 未来</span>
        </section>
        <section className="beat" id="room-crt" data-room="crt">
          <span className="beat-label">§03 — crt room · 監視</span>
        </section>
        <section className="beat" id="room-archive" data-room="archive">
          <span className="beat-label">§04 — artifact archive · 2000</span>
        </section>
        <section className="beat" id="room-outro" data-room="outro">
          <span className="beat-label">§05 — outro · 夢</span>
        </section>
      </main>
    </>
  )
}
