// shaders/cloud.glsl.ts — fbm cloud layer, no textures needed
export const cloudVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const cloudFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDrift;     // horizontal drift speed
  uniform float uCoverage;  // 0..1 cloud density
  uniform vec3  uTint;      // cloud color (frost white)
  varying vec2 vUv;

  // --- simplex-ish value noise + fbm ---
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.04 + vec2(13.7, 7.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vUv * vec2(3.4, 1.4);
    p.x += uTime * uDrift;

    float base = fbm(p + fbm(p * 0.7) * 0.6);
    float cloud = smoothstep(1.0 - uCoverage, 1.0, base + uCoverage * 0.45);

    // soften vertically — denser at the plane's middle band
    float band = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
    float alpha = cloud * band;

    // inner glow toward the dense core
    vec3 col = mix(uTint * 0.92, vec3(1.0), cloud * 0.8);

    gl_FragColor = vec4(col, alpha * 0.85);
    if (gl_FragColor.a < 0.01) discard;
  }
`
