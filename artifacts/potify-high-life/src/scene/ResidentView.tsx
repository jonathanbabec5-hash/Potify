import { Suspense, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, PerspectiveCamera } from 'three';
import { Resident } from './Resident';

type Shot = 'Face' | 'Outfit';
function Fitting({ shirt, skin, shot, walk, yaw }: {
  shirt: string; skin: string; shot: Shot; walk: boolean; yaw: number;
}) {
  const { camera, size, invalidate } = useThree();
  const turn = useRef<Group>(null), speed = useRef(0);
  useLayoutEffect(() => {
    // Keep the framing independent of portrait/landscape viewport and pixel density.
    const close = shot === 'Face';
    const lens = camera as PerspectiveCamera;
    lens.fov = 28;
    const height = close ? .50 : 1.99;
    const distance = Math.max(height, (close ? .40 : .76) * size.height / size.width) / (2 * Math.tan(Math.PI * lens.fov / 360));
    const target = close ? 1.572 : .89;
    lens.position.set(0, target + (close ? .022 : .07), distance + .085);
    lens.lookAt(0, target, .085);
    lens.updateProjectionMatrix();
    if (turn.current) turn.current.rotation.y = yaw;
    speed.current = walk ? 4.4 : 0;
    invalidate();
  }, [camera, size, shot, walk, yaw, invalidate]);
  useFrame(() => { if (turn.current) turn.current.rotation.y = yaw; });
  return <>
    <hemisphereLight args={['#e6edee', '#8c8276', 1.08]} />
    <directionalLight color="#fff0df" intensity={2.45} position={[-2.6, 3.4, 2.4]} />
    <directionalLight color="#c5e5ea" intensity={1.5} position={[1.6, 1.9, -2]} />
    <directionalLight color="#ffe7d4" intensity={.45} position={[3, .9, 2]} />
    <group ref={turn}><Resident shirt={shirt} skin={skin} speed={speed} /></group>
  </>;
}

export function ResidentView({ shirt, skin, compact, studio = false }: {
  shirt: string; skin: string; compact?: number; studio?: boolean;
}) {
  const [shot, setShot] = useState<Shot>('Face');
  const [walk, setWalk] = useState(false);
  const [yaw, setYaw] = useState(-.28);
  const lastX = useRef<number | null>(null);
  const style: CSSProperties = compact ? { width: compact, height: compact, flexShrink: 0 } :
    { height: studio ? 'min(69dvh,680px)' : 'clamp(160px,26dvh,260px)' };
  return <div>
    <div style={{ ...style, overflow:'hidden', position:'relative', borderRadius: compact ? 12 : 18,
      background:'radial-gradient(ellipse at 48% 33%, #c5c2ac 0%, #a3a998 43%, #6a7b70 77%, #485f56 100%)', touchAction:compact ? 'auto' : 'none' }}
      role="img" aria-label={compact ? 'Resident portrait' : '3D resident. Drag to rotate.'} data-testid="resident-view"
      onPointerDown={e => { if (!compact) { lastX.current=e.clientX; e.currentTarget.setPointerCapture(e.pointerId); } }}
      onPointerMove={e => { if (lastX.current !== null) { const dx=e.clientX-lastX.current; lastX.current=e.clientX; setYaw(r => r+dx*.013); } }}
      onPointerUp={() => { lastX.current=null; }} onPointerCancel={() => { lastX.current=null; }}>
      <Canvas frameloop={compact ? 'demand' : 'always'} dpr={[1,1.5]} gl={{ alpha:true, antialias:true }} camera={{near:.03,far:20}}>
        <Suspense fallback={null}><Fitting shirt={shirt} skin={skin} shot={shot} walk={walk} yaw={yaw}/></Suspense>
      </Canvas>
    </div>
    {!compact && <div className="flex justify-center gap-2 mt-2 flex-wrap">
      {(['Face','Outfit'] as const).map(s => <button type="button" className="rounded-full px-3 py-1 font-bold border border-current" style={{background:shot===s?'#d1d6b8':undefined}} key={s} aria-pressed={s===shot} onClick={() => setShot(s)}>{s}</button>)}
      <button type="button" className="rounded-full px-3 py-1 font-bold border border-current" aria-pressed={walk} onClick={() => { setWalk(!walk); if(!walk) setShot('Outfit'); }}>{walk?'Stand':'Walk'}</button>
      <button type="button" className="rounded-full px-3 py-1 font-bold border border-current" onClick={() => setYaw(r=>r+Math.PI/4)}>Turn ↻</button>
    </div>}
  </div>;
}
