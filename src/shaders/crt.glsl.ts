// shaders/crt.glsl.ts — blinking eye + glitch screen for the CRT wall (§03)
export const crtVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const crtFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorld;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;
    // per-monitor seed from world position → every screen behaves differently
    float seed = hash(floor(vWorld.xy * 0.55));
    float t = uTime + seed * 137.0;

    // glitch: random row displacement bursts
    float row = floor(uv.y * 42.0);
    float burst = step(0.965, hash(vec2(row, floor(t * 7.0))));
    uv.x += burst * (hash(vec2(row, floor(t * 7.0) + 1.0)) - 0.5) * 0.22;

    // the eye — blinks on its own rhythm
    vec2 c = uv - 0.5;
    c.x *= 1.35;
    float blinkPhase = abs(fract(t * 0.11) - 0.5) * 2.0;     // 0..1..0
    float lid = smoothstep(0.04, 0.16, blinkPhase);          // 0 = closed
    c.y /= max(lid, 0.04);
    float d = length(c);
    float sclera = smoothstep(0.40, 0.34, d);
    float iris   = smoothstep(0.24, 0.21, d);
    float pupil  = smoothstep(0.095, 0.075, d);

    vec3 col = vec3(0.015, 0.035, 0.14);                     // deep CRT blue base
    col += vec3(0.10, 0.25, 0.75) * sclera * 0.5;
    col += vec3(0.30, 0.75, 1.00) * iris;
    col -= vec3(0.28, 0.70, 0.95) * pupil;

    // iris glint
    float glint = smoothstep(0.05, 0.0, length(c - vec2(0.07, 0.09)));
    col += vec3(1.0) * glint * iris;

    // scanlines + flicker + vignette per screen
    col *= 0.82 + 0.18 * sin(uv.y * 260.0 + t * 3.0);
    col *= 0.72 + 0.28 * hash(vec2(floor(t * 21.0), seed));
    float vig = smoothstep(0.95, 0.45, length(vUv - 0.5) * 1.6);
    col *= vig;

    gl_FragColor = vec4(col * 2.1, 1.0); // pushed >1 so bloom catches it
  }
`
