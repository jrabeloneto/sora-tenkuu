// components/Overlay.tsx — DOM layer: lens flare, boot, scroll cue, frost panel
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/* ---------- Anamorphic starburst flare (screen-space DOM, mix-blend: screen) ----------
   Tracks a world position published by the 3D scene; cheap and crisp at any DPR. */
export function LensFlare({
  target,
  camera,
}: {
  target: React.RefObject<THREE.Vector3>
  camera: React.RefObject<THREE.Camera | null>
}) {
  const el = useRef<HTMLDivElement>(null!)
  const v = useRef(new THREE.Vector3())

  useEffect(() => {
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const cam = camera.current
      if (!cam || !target.current || !el.current) return
      v.current.copy(target.current).project(cam)
      const x = (v.current.x * 0.5 + 0.5) * window.innerWidth
      const y = (-v.current.y * 0.5 + 0.5) * window.innerHeight
      const flicker = 0.85 + Math.sin(performance.now() * 0.0023) * 0.12
      el.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${flicker})`
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [camera, target])

  return (
    <div ref={el} className="lens-flare" aria-hidden>
      <svg width="520" height="520" viewBox="0 0 520 520" fill="none">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="22%" stopColor="#EAF4FF" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#7FE0E8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#7FE0E8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="streakH" x1="0" x2="1">
            <stop offset="0%" stopColor="#7FE0E8" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C5B8E8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="streakV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C5B8E8" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#7FE0E8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* anamorphic horizontal streak — the money shot */}
        <rect x="0" y="258" width="520" height="4" fill="url(#streakH)" />
        {/* vertical + diagonals = 6-point starburst */}
        <rect x="258.5" y="120" width="3" height="280" fill="url(#streakV)" />
        <rect x="258.5" y="170" width="2" height="180" fill="url(#streakV)" transform="rotate(45 260 260)" />
        <rect x="258.5" y="170" width="2" height="180" fill="url(#streakV)" transform="rotate(-45 260 260)" />
        <circle cx="260" cy="260" r="120" fill="url(#core)" />
      </svg>
    </div>
  )
}

/* ---------- Scroll cue ---------- */
export function ScrollCue() {
  return (
    <div className="scroll-cue" aria-hidden>
      <span>scroll · 下へ</span>
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
        <path d="M1 1l8 7 8-7" stroke="#082567" strokeOpacity="0.6" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/* ---------- Boot sequence (replaces a plain spinner, brief §4) ---------- */
export function LoadingBoot({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDone(true)
      onDone()
    }, 1800)
    return () => window.clearTimeout(t)
  }, [onDone])

  return (
    <div className={`boot${done ? ' done' : ''}`} role="status" aria-label="Loading">
      <div className="chrome-type boot-logo">SORA</div>
      <div className="boot-bar"><i /></div>
      <div className="boot-status">initializing sky · 天空起動中</div>
    </div>
  )
}

/* ---------- Frost glass panel ---------- */
export function FrostPanel({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div className="frost-panel" style={{ padding: '1.6rem 2rem', ...style }}>
      {children}
    </div>
  )
}
