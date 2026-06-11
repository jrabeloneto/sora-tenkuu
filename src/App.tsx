// App.tsx — SORA / 天空 · master composition (full experience)
// One persistent Canvas + camera flying a continuous vertical ascent:
// hero → chrome forms → crystal city → crt room → artifact archive → dissolve.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { ChromaticAberrationEffect, NoiseEffect, BlendFunction } from 'postprocessing'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { HeroScene, SkyEnvironment } from './scenes/Hero.tsx'
import { ChromeFormsScene } from './scenes/ChromeForms.tsx'
import { CrystalCityScene } from './scenes/CrystalCity.tsx'
import { CRTRoomScene } from './scenes/CRTRoom.tsx'
import { ArtifactArchiveScene, OutroScene } from './scenes/ArtifactArchive.tsx'
import { CameraScript, RoomGroup } from './components/CameraScript.tsx'
import { LensFlare, LoadingBoot, ScrollCue, FrostPanel } from './components/Overlay.tsx'
import { CustomCursor } from './components/CustomCursor.tsx'
import { ErrorBoundary, webglOK } from './components/ErrorBoundary.tsx'
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

/* PostFX — tuned on the hero; CRT room cranks aberration + grain via crtFx ref.
   NOTE: never pass `ref` to wrapped effects — in React 19 the ref lands in props
   and wrapEffect JSON.stringify(props) chokes on the circular scene graph
   (this was the "Converting circular structure to JSON" crash). The effects we
   need to mutate per-frame are instantiated directly and mounted as primitives. */
function PostFX({ crtFx }: { crtFx: React.MutableRefObject<number> }) {
  const ca = useMemo(
    () =>
      new ChromaticAberrationEffect({
        offset: new THREE.Vector2(0.0009, 0.0006),
        radialModulation: false,
        modulationOffset: 0.15,
      }),
    []
  )
  const noise = useMemo(() => {
    const n = new NoiseEffect({ blendFunction: BlendFunction.COLOR_DODGE, premultiply: true })
    n.blendMode.opacity.value = 0.055
    return n
  }, [])
  useEffect(() => () => { ca.dispose(); noise.dispose() }, [ca, noise])

  useFrame(() => {
    const k = crtFx.current
    ca.offset.set(0.0009 * (1 + k * 7), 0.0006 * (1 + k * 7))
    noise.blendMode.opacity.value = 0.055 + k * 0.3
  })

  if (IS_COARSE) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.78} luminanceSmoothing={0.2} />
        <primitive object={noise} />
        <Vignette eskil={false} offset={0.18} darkness={0.42} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.78} luminanceSmoothing={0.2} />
      <primitive object={ca} />
      <primitive object={noise} />
      <Vignette eskil={false} offset={0.18} darkness={0.42} />
    </EffectComposer>
  )
}

/* §01 floating captions */
const FORM_CAPTIONS = [
  { top: '18%', side: 'left', off: '8%', jp: '鏡', title: 'MIRROR BODIES', copy: 'Liquid metal holds no shape of its own — only the sky it reflects.' },
  { top: '46%', side: 'right', off: '8%', jp: '引力', title: 'MAGNETIC', copy: 'Move closer. The swarm leans toward your hand like iron to a lodestone.' },
  { top: '74%', side: 'left', off: '12%', jp: '無重力', title: 'WEIGHTLESS', copy: 'Nothing here falls. 2002 never believed in gravity.' },
] as const

/* §04 device dossiers */
const DEVICES = [
  { year: '2002', name: 'CLAMSHELL', jp: 'ガラケー', copy: 'Translucent blue polycarbonate, a hinge that snapped shut like punctuation. Calls ended with a gesture.', detail: 'The keitai-era flip phone — a pocket future in frosted shell, the circuit visible like an x-ray, antenna charms swinging from the hinge. Its dual screens promised a world where hardware itself was jewelry.' },
  { year: '2000', name: 'NOKIA 3310', jp: '不滅', copy: 'Monophonic dreams and a battery that outlived the weekend. 86 grams of certainty.', detail: 'Snake II. Composer ringtones. Xpress-on covers in cobalt and silver. The 3310 never needed a case — the floor needed protection from it. The most honest industrial design of its decade.' },
  { year: '1999', name: 'CRT MONITOR', jp: 'ブラウン管', copy: 'Seventeen inches of curved glass, humming at 60Hz. The static kissed your arm hair.', detail: 'The whole early web lived behind this glass — degaussing with a THUNK, scanlines you could lean into, phosphor glow at 2AM. Every Y2K render-farm dream was previewed on one of these.' },
  { year: '2001', name: 'MINIDISC', jp: '光学', copy: 'A disc inside a shield inside your pocket. ATRAC compression, anti-shock memory, pure object.', detail: 'A beautiful failure: 74 minutes of magneto-optical music in a 7cm square, the shutter sliding open like a tiny garage door. It lost the war to MP3 but won the design century.' },
] as const

export default function App() {
  useLenis()
  const reduced = useReducedMotion()

  const assembly = useRef(0)
  const crtFx = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  const flareTarget = useRef(new THREE.Vector3(0, 0.7, 0))
  const cameraRef = useRef<THREE.Camera | null>(null)
  const lockupRef = useRef<HTMLDivElement>(null!)
  const [booted, setBooted] = useState(false)
  const [device, setDevice] = useState<number | null>(null)

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

  /* window-level mouse → 3D parallax + logotype micro-shift (canvas is pointer-events:none) */
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

  /* master scroll wiring */
  useEffect(() => {
    const kills: (() => void)[] = []
    const regTween = (x: gsap.core.Tween) => {
      kills.push(() => { x.scrollTrigger?.kill(); x.kill() })
      return x
    }
    const regST = (x: ScrollTrigger) => {
      kills.push(() => x.kill())
      return x
    }

    // hero DOM fades out leaving room 00
    regTween(gsap.to('#hero-dom', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#room-hero', start: 'center top', end: 'bottom top', scrub: true },
    }))

    // frost captions / cards blur in
    gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) =>
      regTween(gsap.fromTo(el,
        { opacity: 0, y: 50, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 80%' } }
      ))
    )

    // CRT room: void backdrop + scanline overlay + postfx crank (triangle curve)
    const voidEl = document.getElementById('bg-void')
    const scanEl = document.getElementById('scanlines')
    regST(ScrollTrigger.create({
      trigger: '#room-crt', start: 'top 70%', end: 'bottom 30%', scrub: true,
      onUpdate: (self) => {
        const k = Math.sin(self.progress * Math.PI)
        crtFx.current = k
        if (voidEl) voidEl.style.opacity = String(Math.min(k * 1.4, 0.92))
        if (scanEl) scanEl.style.opacity = String(k * 0.5)
      },
    }))

    // archive: editorial strip slides horizontally with the camera sweep
    const strip = document.getElementById('archive-strip')
    if (strip) {
      regTween(gsap.to(strip, {
        x: () => -(strip.scrollWidth - window.innerWidth), ease: 'none',
        scrollTrigger: { trigger: '#room-archive', start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
      }))
    }

    // outro: white dissolve + logotype reprise
    regTween(gsap.to('#bg-white', {
      opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '#room-outro', start: 'center center', end: 'bottom bottom', scrub: true },
    }))
    regTween(gsap.fromTo('#outro-lockup',
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '#room-outro', start: 'top center', end: 'center center', scrub: true } }
    ))

    ScrollTrigger.refresh()
    return () => kills.forEach((k) => k())
  }, [])

  return (
    <>
      <LoadingBoot onDone={onBootDone} />
      <CustomCursor />

      {/* backdrop layers: body gradient < void (crt) < canvas < white (outro) */}
      <div id="bg-void" />

      {/* Persistent 3D layer — pointer-events:none so scroll/touch always pass through */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {webglOK() ? (
          <ErrorBoundary label="canvas">
            <Canvas
              gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
              dpr={[1, 1.75]}
              camera={{ position: [0, 0, 6], fov: 35 }}
              style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
              onCreated={({ gl }) => console.info('[SORA] canvas ready ·', gl.capabilities.isWebGL2 ? 'webgl2' : 'webgl1')}
            >
              <CameraBridge cameraRef={cameraRef} />
              <CameraScript />
              <Suspense fallback={null}>
                <SkyEnvironment />
                <RoomGroup centerY={0} range={22}>
                  <HeroScene assembly={assembly} flareTarget={flareTarget} mouse={mouse} />
                </RoomGroup>
                <RoomGroup centerY={18} range={18}>
                  <ChromeFormsScene mouse={mouse} />
                </RoomGroup>
                <RoomGroup centerY={40} range={26}>
                  <CrystalCityScene />
                </RoomGroup>
                <RoomGroup centerY={64} range={17}>
                  <CRTRoomScene />
                </RoomGroup>
                <RoomGroup centerY={76} range={15}>
                  <ArtifactArchiveScene />
                </RoomGroup>
                <RoomGroup centerY={101} range={18}>
                  <OutroScene />
                </RoomGroup>
                <PostFX crtFx={crtFx} />
              </Suspense>
              <AdaptiveDpr pixelated />
            </Canvas>
          </ErrorBoundary>
        ) : (
          <div className="frost-panel" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', padding: '1.4rem 1.8rem', pointerEvents: 'auto' }}>
            WebGL2 indisponível neste navegador — a experiência 3D não pode iniciar. · WebGL2が必要です
          </div>
        )}
      </div>

      <div id="bg-white" />
      <div id="scanlines" />

      {/* Hero DOM layer */}
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

      <main>
        {/* §00 */}
        <section className="beat" id="room-hero" data-room="hero" />

        {/* §01 — chrome forms */}
        <section className="beat" id="room-chrome-forms" style={{ height: '170vh' }}>
          {FORM_CAPTIONS.map((c, i) => (
            <div
              className="form-caption reveal"
              key={i}
              style={{ top: c.top, ...(c.side === 'left' ? { left: c.off } : { right: c.off }) }}
            >
              <FrostPanel style={{ padding: '1.2rem 1.5rem' }}>
                <div className="room-num">§01 · {c.jp}</div>
                <div className="caption-title">{c.title}</div>
                <p className="room-copy">{c.copy}</p>
              </FrostPanel>
            </div>
          ))}
        </section>

        {/* §02 — crystal city (long, slow beat) */}
        <section className="beat" id="room-crystal-city" style={{ height: '280vh' }}>
          <div className="form-caption reveal" style={{ top: '12%', left: '8%' }}>
            <FrostPanel style={{ padding: '1.2rem 1.5rem' }}>
              <div className="room-num">§02 · 未来</div>
              <div className="caption-title">CRYSTAL CITY</div>
              <p className="room-copy">Glass towers grown above the cloud sea. Refraction is the only weather here.</p>
            </FrostPanel>
          </div>
          <div className="form-caption reveal" style={{ top: '68%', right: '8%' }}>
            <FrostPanel style={{ padding: '1.2rem 1.5rem' }}>
              <div className="room-num">§02 · 水晶</div>
              <div className="caption-title">RIBBON ROADS</div>
              <p className="room-copy">Chrome orbitals thread the skyline — traffic for a city with no ground.</p>
            </FrostPanel>
          </div>
        </section>

        {/* §03 — crt room */}
        <section className="beat" id="room-crt" style={{ height: '150vh' }}>
          <div className="crt-hud reveal">
            <div className="crt-line">§03 // SURVEILLANCE FEED · 監視中</div>
            <div className="crt-line dim">SIGNAL: 35 NODES · BLINK INTERVAL ASYNC</div>
            <div className="crt-line dim">DO NOT ADJUST YOUR SET</div>
          </div>
        </section>

        {/* §04 — artifact archive: sticky viewport + horizontal editorial strip */}
        <section className="beat" id="room-archive" style={{ height: '320vh' }}>
          <div className="archive-sticky">
            <div className="archive-strip" id="archive-strip">
              {DEVICES.map((d, i) => (
                <article className="archive-slide" key={i}>
                  <div className="archive-year">{d.year}</div>
                  <div className="archive-card frost-panel">
                    <div className="room-num">§04 · {d.jp}</div>
                    <h2 className="archive-name">{d.name}</h2>
                    <p className="room-copy">{d.copy}</p>
                    <button className="archive-btn" data-magnetic onClick={() => setDevice(i)}>
                      inspect · 詳細 →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* §05 — outro */}
        <section className="beat" id="room-outro" style={{ height: '190vh' }}>
          <div className="outro-sticky">
            <div id="outro-lockup">
              <h2 className="chrome-type outro-title">SORA</h2>
              <div className="hero-jp" style={{ fontSize: 'clamp(14px,1.8vw,24px)' }}>夢の終わり</div>
            </div>
          </div>
          <footer className="outro-footer">
            <div className="footer-shimmer" />
            <div className="footer-row">
              <span className="footer-item">SORA / 天空 — a y2k japanese-futurism experience</span>
              <span className="footer-item mono">built with three.js · r3f · gsap · lenis</span>
              <span className="footer-item mono">© 2026 · 空はまだ青い</span>
            </div>
          </footer>
        </section>
      </main>

      {/* §04 detail card */}
      {device !== null && (
        <div className="detail-veil" onClick={() => setDevice(null)}>
          <div className="detail-card frost-panel" onClick={(e) => e.stopPropagation()}>
            <div className="room-num">{DEVICES[device].year} · {DEVICES[device].jp}</div>
            <h3 className="archive-name" style={{ marginBottom: '0.8rem' }}>{DEVICES[device].name}</h3>
            <p className="room-copy" style={{ marginBottom: '1.4rem' }}>{DEVICES[device].detail}</p>
            <button className="archive-btn" data-magnetic onClick={() => setDevice(null)}>close · 閉じる</button>
          </div>
        </div>
      )}
    </>
  )
}
