# SORA / 天空 — AESTHETIC_SPEC.md (source of truth)

**Status:** §00 HERO shipped · §01–§05 stubbed (scroll rooms wired)

## Direction
Y2K Japanese futurism — bright, cold, glossy, ethereal. Above the clouds.
80% blue/white/chrome · ~15% cobalt accents · ~5% iridescent shimmer (glows/fresnel/flares only).
Never flat fills. Everything is gradient, glass, or metal. Icy blue, NOT dark dreamcore.

## Palette
Defined once in `src/styles/tokens.css` (sky zenith→horizon, chrome triad, cobalt/electric/deep-blue, irid micro-accents, --void for CRT room). Three.js scenes mirror these hex values — change tokens.css first, then sync scene constants.

## Type
- Display/logotype: Clash Display 700 + CSS chrome gradient/bevel (`.chrome-type`)
- Body/editorial: Space Grotesk
- JP accents (decorative): Noto Sans JP — 天空 · 未来 · 鏡 · 夢 · 監視
- HUD/mono: Space Mono, wide tracking

## Materials
- Liquid chrome: MeshDistortMaterial, metalness 1, roughness 0.06, envMapIntensity 1.8 — reflects the shared procedural sky Environment (Lightformers: zenith dome + bright horizon band + white anisotropic strips + irid circles)
- Frost glass: `.frost-panel` (backdrop-blur 22px, inner 1px highlight, cold glow)
- Crystal city (§02): MeshTransmissionMaterial, blue-tinted, frosted

## Post FX (tuned on hero — inherit everywhere)
Bloom mipmapBlur 1.15 / threshold 0.78 · CA offset (0.0009, 0.0006) · Noise 0.055 · Vignette 0.42.
DOM anamorphic 6-point flare tracks the blob's specular point (mix-blend: screen).
Mobile (pointer:coarse): bloom 0.7, CA dropped, AdaptiveDpr, dpr cap 1.75.

## Motion
Lenis (duration 1.4, expo-out ease) synced to ScrollTrigger via gsap.ticker.
Boot: chrome shard assembly (42 instanced tetrahedrons → blob scales in, power3.inOut 2.6s).
Blob: breathing scale (sin 0.6Hz, ±3.5%), rotation 0.12 rad/s, mouse parallax lerp 0.04.
Easing: power2/3.inOut only. Nothing linear, nothing snappy.
prefers-reduced-motion: native scroll, no distort animation, no parallax, static beauty frame.

## Rooms (scroll choreography)
00 HERO (done) → 01 CHROME FORMS → 02 CRYSTAL CITY (signature, slow scroll) → 03 CRT ROOM (--void, scanlines) → 04 ARTIFACT ARCHIVE (pinned horizontal) → 05 OUTRO (dissolve to sky).
Cross-fade via fog/bloom, never hard cuts. Sections lazy-mount; heavy scenes unmount off-screen.

## Build order remaining
1. ~~Scaffold + tokens + boot~~ ✓
2. ~~§00 hero (sky + chrome blob + flare)~~ ✓
3. ~~PostFX pass tuned on hero~~ ✓
4. §02 Crystal City (next — the hero set-piece)
5. §01, §03, §04, §05 + custom cursor + magnetic hover
6. Performance pass + strip leva

## Changelog
- v0.1.1 — Scroll fix: Canvas is pointer-events:none (touch-action pan-y) so wheel/touch never get swallowed; mouse parallax now reads a window-level listener. Added ScrollRig: global scroll progress flies the camera up/back/tilting through the cloud layers (damped lerp 0.06). Hero DOM (#hero-dom: lockup+cue+flare) fades while leaving room 00. §01–§05 now render frost-glass placeholder cards with blur-in reveals so the journey has visible beats until the scenes land.
