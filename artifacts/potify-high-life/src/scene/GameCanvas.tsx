import { DistantSky } from './DistantSky';
import { Performance } from './Performance';
import { Tower } from './Tower';
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { game } from '@/game/store';
import { camCtl, fx, player, ui, useG, useUI } from '@/game/runtime';
import { lampMat, windowMat } from '@/scene/materials';
import { Rooftop } from '@/scene/Rooftop';
import { Town } from '@/scene/Town';
import { NPCs, Player, PromptMarker, type Ctl } from '@/scene/Actors';

const KEYMAP: { name: Ctl; keys: string[] }[] = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'back', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
];

export const CAMERA_PRESETS = [
  { name: 'Shoulder', d: 3.6, h: 2.45 },
  { name: 'Eye level', d: 0, h: 1.57 },
  { name: 'High', d: 12, h: 12 },
  { name: 'Aerial', d: 15, h: 19 },
];

// Saved camera IDs predate the eye-level view. Keep the IDs stable when cycling.
export const CAMERA_ORDER = [1, 0, 2, 3];

const SKY: [number, string][] = [
  [0, '#16304a'], [300, '#21406a'], [360, '#f4a07c'], [450, '#ffd09c'], [600, '#9fdbe2'], [1000, '#a8e0e0'],
  [1100, '#f8a66c'], [1170, '#ec7577'], [1250, '#2d4a72'], [1440, '#16304a'],
];
const tmpA = new THREE.Color();
const tmpB = new THREE.Color();
function skyAt(m: number, out: THREE.Color) {
  for (let i = 0; i < SKY.length - 1; i++) {
    const [a, ca] = SKY[i];
    const [b, cb] = SKY[i + 1];
    if (m >= a && m <= b) return out.copy(tmpA.set(ca)).lerp(tmpB.set(cb), (m - a) / (b - a));
  }
  return out.set(SKY[0][1]);
}

function Atmosphere({ shadows }: { shadows: boolean }) {
  const { scene, gl } = useThree();
  const shadowStamp = useRef('');
  const area = useUI(s => s.area);
  const zone = useUI(s => s.zone);
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sunBall = useRef<THREE.Mesh>(null);
  const moon = useRef<THREE.Mesh>(null);
  const stars = useRef<THREE.Points>(null);
  const col = useMemo(() => new THREE.Color(), []);
  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts: number[] = [];
    let s = 3;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2, e = 0.15 + r() * 1.3;
      pts.push(Math.cos(a) * Math.cos(e) * 90, Math.sin(e) * 90, Math.sin(a) * Math.cos(e) * 90);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => {
    scene.fog = new THREE.Fog('#9fdbe2', 34, 95);
    scene.background = new THREE.Color('#9fdbe2');
  }, [scene]);
  useFrame(() => {
    const m = game.getState().minute % 1440;
    skyAt(m, col);
    (scene.background as THREE.Color).copy(col);
    scene.fog?.color.copy(col);
    const ang = ((m - 360) / 1440) * Math.PI * 2; // sunrise 6:00
    const el = Math.sin(ang);
    const day = THREE.MathUtils.smoothstep(el, -0.12, 0.25);
    const night = 1 - day;
    const sx = Math.cos(ang) * 40, sy = Math.max(el, 0.15) * 40;
    if (sun.current) {
      const u = ui.get();
      const tx = mobile ? (u.area === 'town' ? 84 : 0) : player.x;
      const tz = mobile ? 0 : player.z, ty = mobile && u.area === 'tower' ? (u.floor-1)*3.6 : player.y;
      sun.current.position.set(tx + sx, ty + sy, tz - 18);
      sun.current.target.position.set(tx, ty, tz);
      if (mobile && shadows) {
        const stamp = u.area + '/' + u.floor + '/' + u.zone + '/' + Math.floor(m / 3);
        if (shadowStamp.current !== stamp) { gl.shadowMap.needsUpdate = true; shadowStamp.current = stamp; }
      }
      sun.current.target.updateMatrixWorld();
      sun.current.intensity = 0.25 + day * 1.9;
      sun.current.color.set(el < 0.3 && day > 0.1 ? '#ffc08a' : day > 0.1 ? '#fff1d6' : '#9fb8ff');
    }
    if (hemi.current) {
      hemi.current.intensity = 0.55 + day * 0.6;
      hemi.current.color.copy(col).lerp(tmpA.set('#ffffff'), 0.4);
    }
    if (sunBall.current) { sunBall.current.position.set(player.x + Math.cos(ang) * 80, el * 70, player.z - 60); sunBall.current.visible = el > -0.1; }
    if (moon.current) { moon.current.position.set(player.x - Math.cos(ang) * 80, -el * 70, player.z - 60); moon.current.visible = el < 0.1; }
    if (stars.current) { stars.current.visible = night > 0.01; stars.current.position.set(player.x, 0, player.z); (stars.current.material as THREE.PointsMaterial).opacity = night * 0.9; }
    windowMat.emissiveIntensity = night * 1.3;
    lampMat.emissiveIntensity = 0.2 + night * 2.4;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#fff1d6', '#c7774f', 0.9]} />
      <directionalLight ref={sun} castShadow={shadows && (!mobile || area === 'tower' || zone === 'greenhouse')} shadow-mapSize={mobile ? [512,512] : [1024,1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-camera-far={90} shadow-bias={-0.0006} shadow-normalBias={0.025} />
      <mesh ref={sunBall}><icosahedronGeometry args={[5, 1]} /><meshBasicMaterial color="#fff0b8" fog={false} /></mesh>
      <mesh ref={moon}><icosahedronGeometry args={[3, 1]} /><meshBasicMaterial color="#e8f2ff" fog={false} /></mesh>
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial color="#fff7e8" size={0.6} transparent opacity={0} fog={false} />
      </points>
    </>
  );
}

function CameraRig() {
  const camIdx = useG(s => s.settings.camera);
  const cam = useRef(camIdx);
  cam.current = camIdx;
  const canvas = useThree(st => st.gl.domElement);
  const t = useRef(0);
  const look = useMemo(() => new THREE.Vector3(), []);
  const want = useMemo(() => new THREE.Vector3(), []);
  const previous = useRef('');
  useEffect(() => {
    let id: number | null = null, x = 0, y = 0;
    const down = (e: PointerEvent) => {
      const state = ui.get();
      if (!state.inGame || state.modal || id !== null || e.button !== 0) return;
      id = e.pointerId; x = e.clientX; y = e.clientY;
      canvas.setPointerCapture(id);
    };
    const move = (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      if (ui.get().inGame && !ui.get().modal) {
        camCtl.yawOffset += (e.clientX - x) * 0.007;
        camCtl.pitch = THREE.MathUtils.clamp(camCtl.pitch - (e.clientY - y) * 0.005, -1.22, 0.86);
      }
      x = e.clientX; y = e.clientY;
    };
    const release = (e: PointerEvent) => { if (id === e.pointerId) id = null; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('lostpointercapture', release);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('lostpointercapture', release);
    };
  }, [canvas]);
  useFrame((st, raw) => {
    const dt = Math.min(raw, 0.05);
    const u = ui.get(), c = st.camera as THREE.PerspectiveCamera;
    const eye = u.inGame && cam.current === 1;
    const fov = eye ? 74 : 50;
    if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
    if (!u.inGame) {
      previous.current = '';
      t.current += dt * 0.06;
      want.set(player.x + Math.sin(t.current) * 12, player.y + 7, player.z + Math.cos(t.current) * 12);
      c.position.copy(want);
      c.lookAt(player.x, player.y + 0.8, player.z);
      return;
    }
    const yaw = camCtl.yawOffset, pitch = camCtl.pitch;
    const dx = Math.sin(yaw), dz = -Math.cos(yaw);
    if (eye) {
      c.position.set(player.x, player.y + 1.57, player.z);
      c.lookAt(player.x + dx * Math.cos(pitch), c.position.y + Math.sin(pitch), player.z + dz * Math.cos(pitch));
      previous.current = 'eye';
      return;
    }
    const p = CAMERA_PRESETS[Math.round(cam.current)] ?? CAMERA_PRESETS[0];
    const marker = u.area + '/' + u.floor + '/' + cam.current;
    const blend = previous.current === marker ? 1 - Math.exp(-dt * 8) : 1;
    previous.current = marker;
    const angle = THREE.MathUtils.clamp(Math.atan2(p.h - 0.9, p.d) - (pitch + 0.15), 0.12, 1.25);
    const radius = Math.hypot(p.d, p.h - 0.9);
    want.set(player.x - dx * radius * Math.cos(angle), player.y + 0.9 + radius * Math.sin(angle), player.z - dz * radius * Math.cos(angle));
    c.position.lerp(want, blend);
    look.lerp(tmpV.set(player.x, player.y + 0.95, player.z), blend);
    c.lookAt(look);
  });
  return null;
}
const tmpV = new THREE.Vector3();

function GameLoop() {
  const first = useRef(false);
  useFrame((_, raw) => {
    if (!first.current) { first.current = true; ui.set({ ready: true }); }
    const u = ui.get();
    if (u.inGame && !u.modal && !u.fading && !document.hidden) game.tick(Math.min(raw, 0.1));
  });
  return null;
}

const MAX_P = 80;
function FX() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const c = useMemo(() => new THREE.Color(), []);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.count = 0;
  }, []);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const im = ref.current;
    if (!im || (!im.count && !fx.pending.length && !fx.parts.length)) return;
    while (fx.pending.length) { fx.parts.push(fx.pending.shift()!); if (fx.parts.length > MAX_P) fx.parts.shift(); }
    let count = 0;
    for (const p of fx.parts) {
      p.life -= dt * 1.2;
      if (p.life <= 0) continue;
      p.vy -= 12 * dt; p.x += p.vx * dt; p.y = Math.max(0.1, p.y + p.vy * dt); p.z += p.vz * dt;
      const size = 0.16 * p.life;
      m.makeScale(size, size, size).setPosition(p.x, p.y, p.z);
      im.setMatrixAt(count, m);
      im.setColorAt(count, c.set(p.color));
      fx.parts[count++] = p;
    }
    fx.parts.length = im.count = count;
    im.visible = count > 0;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX_P]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

function World({ shadows }: { shadows: boolean }) {
  const area = useUI(s => s.area);
  return (
    <>
      <DistantSky />
      <Atmosphere shadows={shadows} />
      {area === 'tower' ? <Tower /> : area === 'roof' ? <Rooftop /> : <Town />}
      <Player />
      <NPCs />
      <PromptMarker />
      <FX />
      <CameraRig />
      <GameLoop />
    </>
  );
}

class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: unknown) { console.error('3D scene crashed', e); this.props.onError(); }
  render() { return this.state.err ? null : this.props.children; }
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export default function GameCanvas({ onCrash }: { onCrash: () => void }) {
  const quality = useG(s => s.settings.quality);
  const mobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const maxDpr = Math.min(window.devicePixelRatio || 1, quality === 'high' ? (mobile ? 1.35 : 2) : 1);
  const initialDpr = mobile ? Math.min(maxDpr, quality === 'high' ? 1 : 0.85) : maxDpr;
  const shadows = quality === 'high';
  return (
    <CanvasBoundary onError={onCrash}>
      <KeyboardControls map={KEYMAP}>
        <Canvas
          key={quality}
          shadows={shadows}
          dpr={initialDpr}
          gl={{ alpha: false, antialias: !mobile && quality === 'high', powerPreference: 'high-performance' }}
          camera={{ fov: 45, near: 0.1, far: 220, position: [18, 12, 18] }}
          onCreated={({ gl }) => {
            if (mobile) { gl.shadowMap.type = THREE.BasicShadowMap; gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true; }
            gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); ui.set({ glLost: true }); });
            gl.domElement.addEventListener('webglcontextrestored', () => ui.set({ glLost: false }));
          }}
          style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <World shadows={shadows} />
            <Performance mobile={mobile} ceiling={maxDpr} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </CanvasBoundary>
  );
}
