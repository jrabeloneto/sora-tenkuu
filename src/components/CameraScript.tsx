// components/CameraScript.tsx — the master camera choreography.
// One persistent camera flies a station-to-station path; stations sit at the
// document positions of each scroll room (measured at runtime, so section
// heights can change freely). Damped lerp everywhere — floating in liquid.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export const ROOM_IDS = [
  'room-hero',
  'room-chrome-forms',
  'room-crystal-city',
  'room-crt',
  'room-archive',
  'room-outro',
] as const

type Station = { pos: THREE.Vector3; look: THREE.Vector3 }
const S = (px: number, py: number, pz: number, lx: number, ly: number, lz: number): Station => ({
  pos: new THREE.Vector3(px, py, pz),
  look: new THREE.Vector3(lx, ly, lz),
})

/* 7 stations = 6 room segments. World is one continuous vertical ascent:
   hero(0) → forms(18) → city(28–52) → crt(~64) → archive(76) → outro(96+) */
export const STATIONS: Station[] = [
  S(0, 0, 6,      0, 0.3, 0),    // B0 hero entry
  S(0, 12, 7,     0, 18, 0),     // B1 → chrome forms
  S(0, 26, 13,    0, 34, -2),    // B2 → crystal city gates
  S(0, 54, 9,     -1, 60, -2),   // B3 → crt room
  S(-9, 76, 9,    -9, 76, 0),    // B4 → archive, left end
  S(9, 76, 9,     9, 76, 0),     // B5 → archive right end / outro
  S(0, 100, 17,   0, 106, 0),    // B6 dissolve into the sky
]

export function CameraScript() {
  const bounds = useRef<number[]>([])
  const cur = useRef({ pos: new THREE.Vector3(0, 0, 6), look: new THREE.Vector3(0, 0.3, 0) })

  useEffect(() => {
    const measure = () => {
      const tops = ROOM_IDS.map((id) => document.getElementById(id)?.offsetTop ?? 0)
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        tops[tops.length - 1] + 1
      )
      bounds.current = [...tops, max]
    }
    measure()
    const late = window.setTimeout(measure, 600) // re-measure after fonts/layout settle
    window.addEventListener('resize', measure)
    return () => {
      window.clearTimeout(late)
      window.removeEventListener('resize', measure)
    }
  }, [])

  useFrame(({ camera }) => {
    const b = bounds.current
    if (b.length < 2) return
    const sy = window.scrollY

    let i = 0
    while (i < b.length - 2 && sy >= b[i + 1]) i++
    let t = THREE.MathUtils.clamp((sy - b[i]) / Math.max(b[i + 1] - b[i], 1), 0, 1)
    t = t * t * (3 - 2 * t) // smoothstep within the segment

    const A = STATIONS[i]
    const B = STATIONS[i + 1]
    const pos = A.pos.clone().lerp(B.pos, t)
    const look = A.look.clone().lerp(B.look, t)

    // room flavor: gentle lateral sway gliding through the crystal city
    if (ROOM_IDS[i] === 'room-crystal-city') {
      pos.x += Math.sin(t * Math.PI * 2) * 1.4
    }

    cur.current.pos.lerp(pos, 0.07)
    cur.current.look.lerp(look, 0.07)
    camera.position.copy(cur.current.pos)
    camera.lookAt(cur.current.look)
  })

  return null
}

/* Visibility culling per room — heavy scenes skip render when the camera is far
   (brief §5: never render everything at once). */
export function RoomGroup({
  centerY,
  range,
  children,
}: {
  centerY: number
  range: number
  children: React.ReactNode
}) {
  const g = useRef<THREE.Group>(null!)
  useFrame(({ camera }) => {
    g.current.visible = Math.abs(camera.position.y - centerY) < range
  })
  return <group ref={g}>{children}</group>
}
