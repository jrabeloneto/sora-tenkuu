// components/CustomCursor.tsx — chrome orb + trailing iridescent streak (brief §4)
// Magnetic to anything carrying [data-magnetic]. Disabled on coarse pointers
// and under prefers-reduced-motion (native cursor returns via CSS).
import { useEffect, useRef } from 'react'

const TRAIL = 6

export function CustomCursor() {
  const orb = useRef<HTMLDivElement>(null!)
  const dots = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (coarse || reduced) return

    document.documentElement.classList.add('custom-cursor-on')

    const target = { x: innerWidth / 2, y: innerHeight / 2 }
    const chain = Array.from({ length: TRAIL + 1 }, () => ({ x: target.x, y: target.y }))
    let magnet: DOMRect | null = null
    let raf = 0

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
    }
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.('[data-magnetic]')
      magnet = el ? el.getBoundingClientRect() : null
      orb.current?.classList.toggle('magnet', !!magnet)
    }

    const loop = () => {
      raf = requestAnimationFrame(loop)
      // magnetic pull toward the hovered element's center
      let tx = target.x
      let ty = target.y
      if (magnet) {
        tx = tx * 0.45 + (magnet.left + magnet.width / 2) * 0.55
        ty = ty * 0.45 + (magnet.top + magnet.height / 2) * 0.55
      }
      // springy chain: head chases the pointer, each dot chases the previous
      chain[0].x += (tx - chain[0].x) * 0.28
      chain[0].y += (ty - chain[0].y) * 0.28
      for (let i = 1; i < chain.length; i++) {
        chain[i].x += (chain[i - 1].x - chain[i].x) * 0.32
        chain[i].y += (chain[i - 1].y - chain[i].y) * 0.32
      }
      if (orb.current) orb.current.style.transform = `translate(${chain[0].x}px, ${chain[0].y}px) translate(-50%, -50%)`
      for (let i = 0; i < TRAIL; i++) {
        const d = dots.current[i]
        if (d) d.style.transform = `translate(${chain[i + 1].x}px, ${chain[i + 1].y}px) translate(-50%, -50%)`
      }
    }
    loop()

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      document.documentElement.classList.remove('custom-cursor-on')
    }
  }, [])

  return (
    <div aria-hidden>
      {Array.from({ length: TRAIL }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { dots.current[i] = el }}
          className="cursor-dot"
          style={{ width: 8 - i, height: 8 - i, opacity: 0.5 - i * 0.07 }}
        />
      ))}
      <div ref={orb} className="cursor-orb" />
    </div>
  )
}
