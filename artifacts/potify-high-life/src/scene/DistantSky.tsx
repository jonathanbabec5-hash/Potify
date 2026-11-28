import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BackSide, DataTexture, LinearFilter, LinearMipmapLinearFilter,
  RepeatWrapping, RGBAFormat, ShaderMaterial, Vector3,
} from 'three';
import { game } from '@/game/store';

// Tileable value-noise fields for the two cloud layers. No photo, sky asset download,
// or per-pixel noise octaves: the shader only needs two filtered texture lookups.
function makeCloudField() {
  const size = 128, bytes = new Uint8Array(size * size * 4);
  let seed = 7919;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const octave = (cells: number) => {
    const grid = Float32Array.from({ length: cells * cells }, random);
    return (u: number, v: number) => {
      const ix = Math.floor(u *= cells), iy = Math.floor(v *= cells);
      const x = u - ix, y = v - iy;
      const fx = x * x * (3 - 2 * x), fy = y * y * (3 - 2 * y);
      const at = (i: number, j: number) => grid[(j % cells) * cells + i % cells];
      const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * fx;
      const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * fx;
      return a + (b - a) * fy;
    };
  };
  const lower = [octave(4), octave(9), octave(22)];
  const upper = [octave(5), octave(13), octave(32)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + .5) / size, v = (y + .5) / size;
    const i = (x + y * size) * 4;
    bytes[i] = Math.round(255 * (.58 * lower[0](u, v) + .28 * lower[1](u, v) + .14 * lower[2](u, v)));
    bytes[i + 1] = Math.round(255 * (.56 * upper[0](u, v) + .29 * upper[1](u, v) + .15 * upper[2](u, v)));
    bytes[i + 3] = 255;
  }
  const texture = new DataTexture(bytes, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

let cloudField: DataTexture | undefined;
const vertex = /* glsl */`
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    // Keep the dome infinitely far away: use camera rotation, but no translation.
    vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = clip.xyww;
  }
`;
const fragment = /* glsl */`
  uniform sampler2D uClouds;
  uniform vec3 uSun;
  uniform vec3 uMoon;
  uniform float uDrift;
  varying vec3 vDirection;

  float starField(vec3 d) {
    // A three-dimensional directional grid has no meridian or pole seam.
    vec3 p = d * 104.0;
    vec3 cell = floor(p);
    float n = fract(sin(dot(cell, vec3(19.71, 53.13, 79.93))) * 43758.54);
    float spot = 1.0 - smoothstep(0.035, 0.22, length(fract(p) - 0.5));
    return spot * smoothstep(0.982, 0.998, n);
  }

  void main() {
    vec3 d = normalize(vDirection);
    float h = max(0.0, d.y);
    float day = smoothstep(-0.13, 0.25, uSun.y);
    float twilight = 1.0 - smoothstep(0.01, 0.36, abs(uSun.y));
    float sunAim = dot(d, uSun);
    float sunward = max(0.0, sunAim * 0.5 + 0.5);
    float haze = exp(-h * 4.4);

    vec3 horizon = mix(vec3(0.15, 0.22, 0.34), vec3(0.79, 0.89, 0.92), day);
    vec3 upper = mix(vec3(0.035, 0.06, 0.125), vec3(0.30, 0.58, 0.78), day);
    vec3 dusk = mix(vec3(0.60, 0.44, 0.56), vec3(1.0, 0.63, 0.38), sunward * sunward);
    horizon = mix(horizon, dusk, twilight * 0.72);
    vec3 col = mix(upper, horizon, haze);
    col = mix(col, horizon * vec3(0.88, 0.90, 0.95), smoothstep(0.02, 0.62, -d.y));
    col += vec3(1.0, 0.56, 0.25) * pow(max(sunAim, 0.0), 10.0) * twilight * 0.16;

    float cloudMask = 0.0;
    if (d.y > 0.025) {
      // Each cloud layer is a plane seen in perspective. Projecting from the same
      // direction around the whole world gives correct wrap and a receding horizon.
      vec2 plane = d.xz / (d.y + 0.24);
      float high = texture2D(uClouds, plane * vec2(0.24, 0.43) + vec2(0.19, uDrift * 0.34)).g;
      float low = texture2D(uClouds, plane * vec2(0.37, 0.58) + vec2(uDrift, -uDrift * 0.21)).r;
      float ramp = smoothstep(0.025, 0.22, h);
      float cirrus = smoothstep(0.55, 0.74, high) * ramp;
      float body = smoothstep(0.48, 0.68, low) * ramp;
      vec3 cloudBright = mix(vec3(0.19, 0.23, 0.33), vec3(0.98, 0.98, 0.95), day);
      vec3 cloudShade = mix(vec3(0.09, 0.13, 0.23), vec3(0.53, 0.67, 0.76), day);
      cloudBright = mix(cloudBright, mix(vec3(0.74, 0.61, 0.70), vec3(1.0, 0.78, 0.56), sunward), twilight * 0.68);
      col = mix(col, cloudBright, cirrus * 0.39);
      col = mix(col, mix(cloudBright, cloudShade, smoothstep(0.56, 0.80, low) * 0.66), body * 0.79);
      cloudMask = max(cirrus * 0.45, body * 0.7);
    }

    float sunVisible = smoothstep(-0.041, 0.012, uSun.y);
    float sunDisk = smoothstep(0.99968, 0.99983, sunAim) * sunVisible;
    float sunHalo = pow(max(0.0, sunAim), 160.0) * sunVisible;
    col = mix(col, vec3(1.0, 0.91, 0.72), sunHalo * 0.35 * (1.0 - cloudMask));
    col = mix(col, vec3(1.0, 0.975, 0.86), sunDisk * (1.0 - cloudMask * 0.75));

    if (day < 0.64 && d.y > 0.025) {
      float moonAim = dot(d, uMoon);
      float moonDisk = smoothstep(0.99942, 0.99964, moonAim);
      float moonVisible = smoothstep(-0.035, 0.085, uMoon.y) * (1.0 - day);
      float stars = starField(d) * smoothstep(0.02, 0.27, h) * (1.0 - day) * (1.0 - cloudMask);
      col += vec3(0.66, 0.79, 0.98) * stars * 0.75;
      col = mix(col, vec3(0.89, 0.93, 1.0), moonDisk * moonVisible * (1.0 - cloudMask));
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function DistantSky() {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uClouds: { value: cloudField ??= makeCloudField() },
    uSun: { value: new Vector3(1, 0, -.45).normalize() },
    uMoon: { value: new Vector3(-1, 0, .45).normalize() },
    uDrift: { value: 0 },
  }), []);
  const drift = useRef(0);

  useFrame((_state, delta) => {
    if (!material.current) return;
    const minute = game.getState().minute % 1440;
    const phase = (minute - 360) * Math.PI / 720;
    const x = Math.cos(phase), y = Math.sin(phase);
    uniforms.uSun.value.set(x, y, -.45).normalize();
    uniforms.uMoon.value.set(-x, -y, .45).normalize();
    drift.current += Math.min(delta, 0.05) * 0.012;
    uniforms.uDrift.value = drift.current;
  });

  return <mesh renderOrder={-100} frustumCulled={false}>
    <sphereGeometry args={[100, 28, 16]} />
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}
      side={BackSide} depthTest={false} depthWrite={false} fog={false} toneMapped={false} />
  </mesh>;
}
