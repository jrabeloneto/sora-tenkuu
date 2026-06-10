# SORA / 天空 — AESTHETIC_SPEC.md (source of truth)

**Status:** FULL EXPERIENCE — §00–§05 shipped (v0.2.0)

## Direction
Y2K Japanese futurism — bright, cold, glossy, ethereal. Above the clouds.
80% blue/white/chrome · ~15% cobalt accents · ~5% iridescent shimmer (glows/fresnel/flares only).
Never flat fills. Everything is gradient, glass, or metal. Icy blue, NOT dark dreamcore.

## Palette & type
- Single source: `src/styles/tokens.css`. Three.js mirrors these hex values (sync manually if changed).
- Display: Clash Display 700 + CSS chrome bevel (`.chrome-type`) · Body: Space Grotesk · JP accents: Noto Sans JP (天空 未来 鏡 夢 監視 引力 無重力) · HUD: Space Mono.

## World layout (one continuous vertical ascent)
| Room | y center | Content |
|---|---|---|
| §00 Hero | 0 | chrome blob (MeshDistortMaterial, 64-sub icosa), 42-shard assembly, 3 fbm cloud layers, DOM anamorphic flare |
| §01 Chrome Forms | 18 | 9-body swarm (sphere/torus/capsule/icosa), magnetic raycast attraction to z=0 plane, proximity pulse via per-clone envMapIntensity |
| §02 Crystal City | 28–52 | 16 procedural glass towers (seeded rng 20020607) flanking the corridor, 3 chrome ribbon tori, cloud sea, 160 sparkles |
| §03 CRT Room | 64 | 7×5 monitor wall — shells 1 InstancedMesh, screens share one ShaderMaterial (blinking eye + glitch, seed from world pos), bezier cables, cobalt point light |
| §04 Archive | 76 | 4 devices (clamshell/3310/CRT/MiniDisc) on rotating chrome pedestals at x −9/−3/3/9 |
| §05 Outro | ~101 | chrome torus rising + sparkles; DOM logotype reprise + frost footer w/ irid shimmer line |

## Camera (components/CameraScript.tsx)
7 stations keyed to measured section offsetTops (re-measured on resize + 600ms post-load).
Per-segment smoothstep + global damped lerp 0.07. City segment adds sin lateral sway.
Archive sweep is encoded in the stations themselves (x −9 → +9).

## Materials (src/materials/chrome.ts — singletons, never mutate)
chromeMat (metal 1 / rough .07) · steelMat (rough .28) · blueGlassMat (MeshPhysicalMaterial transmission .95, thickness 2.2, ior 1.4 — mobile: transmission 0, opacity .45) · darkShellMat.
Environment: one procedural Lightformer sky (zenith dome + bright horizon band + anisotropic white strips + irid circles), shared by all rooms.

## Post FX
Base: Bloom mipmapBlur 1.15 / threshold .78 · CA (0.0009, 0.0006) · Noise .055 · Vignette .42.
§03 crank: crtFx ref (sin triangle over the crt section) → CA ×(1+7k), noise +0.3k, DOM #scanlines opacity .5k, #bg-void opacity ≤.92.
Outro: #bg-white scrubbed to 1. Mobile: CA dropped, bloom .7, AdaptiveDpr, dpr ≤1.75.

## Interaction
Lenis 1.4s expo-out synced to ScrollTrigger via gsap ticker. Canvas is pointer-events:none (touch-action pan-y) — scroll can never be swallowed; mouse comes from one window listener.
Custom cursor: chrome orb + 6-dot iridescent chain (lerp .28/.32), magnetic to [data-magnetic], hidden on coarse pointers/reduced motion.
Archive: sticky viewport + horizontal strip scrubbed to section progress; "inspect" opens frost detail card (DOM modal).
Reveals: .reveal elements blur-in at top 80%.

## Accessibility / fallbacks
prefers-reduced-motion: native scroll, no distort/parallax/spin/sparkle motion, static frames; custom cursor off.
Focus-visible rings on buttons. Per-room visibility culling (RoomGroup, camera-y distance) keeps off-screen scenes unrendered.

## Done / next ideas
All six rooms + cursor + fallbacks shipped. Possible polish passes: god-rays in §02, Mylar foil transition surfaces, draco-compressed GLB devices to replace primitives, leva tuning session for bloom/CA per room.
