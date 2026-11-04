import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { game } from '@/game/store';
import { fx, player, ui, useG, useUI } from '@/game/runtime';
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
  { name: 'Close', d: 6, h: 4.2 },
  { name: 'Classic', d: 9, h: 7.5 },
  { name: 'High', d: 12, h: 12 },
  { name: 'Aerial', d: 15, h: 19 },
];

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
  const { scene } = useThree();
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
      sun.current.position.set(player.x + sx, sy, player.z + 18);
      sun.current.target.position.set(player.x, 0, player.z);
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
    if (stars.current) { stars.current.position.set(player.x, 0, player.z); (stars.current.material as THREE.PointsMaterial).opacity = night * 0.9; }
    windowMat.emissiveIntensity = night * 1.3;
    lampMat.emissiveIntensity = 0.2 + night * 2.4;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#fff1d6', '#c7774f', 0.9]} />
      <directionalLight ref={sun} castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-camera-far={90} shadow-bias={-0.0008} />
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
  const t = useRef(0);
  const look = useMemo(() => new THREE.Vector3(), []);
  const want = useMemo(() => new THREE.Vector3(), []);
  useFrame((st, raw) => {
    const dt = Math.min(raw, 0.05);
    const u = ui.get();
    const c = st.camera;
    if (!u.inGame) {
      t.current += dt * 0.06;
      const cx = u.area === 'town' ? 80 : 0, cz = u.area === 'town' ? 0 : 2;
      want.set(cx + Math.sin(t.current) * 21, 11 + Math.sin(t.current * 0.7) * 2, cz + Math.cos(t.current) * 21);
      c.position.lerp(want, Math.min(1, dt * 1.5));
      look.lerp(tmpV.set(cx, 0.5, cz), Math.min(1, dt * 2));
      c.lookAt(look);
      return;
    }
    const p = CAMERA_PRESETS[Math.max(0, Math.min(CAMERA_PRESETS.length - 1, Math.round(cam.current)))] ?? CAMERA_PRESETS[1];
    const indoor = u.zone === 'apartment' || u.zone === 'greenhouse';
    const d = indoor ? Math.min(p.d, 7) : p.d;
    const h = indoor ? Math.max(p.h, 8.5) : p.h;
    want.set(player.x, h, player.z + d);
    const k = 1 - Math.exp(-dt * 5);
    c.position.lerp(want, k);
    look.lerp(tmpV.set(player.x, 0.9, player.z - 0.6), k * 1.4 > 1 ? 1 : k * 1.4);
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
    for (let i = 0; i < MAX_P; i++) { ref.current.setColorAt(i, c.set('#ffffff')); m.makeScale(0, 0, 0); ref.current.setMatrixAt(i, m); }
  }, [c, m]);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const im = ref.current;
    if (!im) return;
    while (fx.pending.length) { fx.parts.push(fx.pending.shift()!); if (fx.parts.length > MAX_P) fx.parts.shift(); }
    fx.parts = fx.parts.filter(p => (p.life -= dt * 1.2) > 0);
    for (let i = 0; i < MAX_P; i++) {
      const p = fx.parts[i];
      if (!p) { m.makeScale(0, 0, 0); im.setMatrixAt(i, m); continue; }
      p.vy -= 12 * dt; p.x += p.vx * dt; p.y = Math.max(0.1, p.y + p.vy * dt); p.z += p.vz * dt;
      const s = 0.16 * p.life;
      m.makeScale(s, s, s).setPosition(p.x, p.y, p.z);
      im.setMatrixAt(i, m);
      im.setColorAt(i, c.set(p.color));
    }
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
      <Atmosphere shadows={shadows} />
      {area === 'roof' ? <Rooftop /> : <Town />}
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
  const maxDpr = quality === 'high' ? (mobile ? 1.5 : 2) : 1;
  const shadows = quality === 'high' && !mobile;
  return (
    <CanvasBoundary onError={onCrash}>
      <KeyboardControls map={KEYMAP}>
        <Canvas
          key={quality}
          shadows={shadows}
          dpr={[1, maxDpr]}
          gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}
          camera={{ fov: 45, near: 0.1, far: 220, position: [18, 12, 18] }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); ui.set({ glLost: true }); });
            gl.domElement.addEventListener('webglcontextrestored', () => ui.set({ glLost: false }));
          }}
          style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <World shadows={shadows} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </CanvasBoundary>
  );
}
