import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedMesh, Matrix4 } from 'three';
import { lampMat, mat, seeded } from './materials';

type Block = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };
const masonry = ['#815d4d', '#87796b', '#776e65', '#867d67', '#64736d'];
const towers = ['#535d67', '#646574', '#576d73', '#6d6875'];
function block(x: number, y: number, z: number, w: number, h: number, d: number, color: string): Block {
  return { x, y, z, w, h, d, color };
}

function neighborhood() {
  const rand = seeded(713);
  const buildings: Block[] = [], windows: Block[] = [];
  for (let row = -5; row <= 3; row++) {
    for (let col = -5; col <= 5; col++) {
      // Keep the canal, the player's roof, and the camera approach open.
      if (row === -2 || (Math.abs(row) < 2 && Math.abs(col) < 2)) continue;
      const far = row <= -4 || Math.abs(col) >= 4;
      const x = col * 10 + rand() * 1.2, z = row * 12 + rand();
      const w = 5 + rand() * 3, d = 6 + rand() * 3;
      const h = far ? 22 + rand() * 28 : 8 + rand() * 13;
      const colors = far ? towers : masonry;
      buildings.push(block(x, h / 2, z, w, h, d, colors[Math.floor(rand() * colors.length)]));
      buildings.push(block(x, h + 0.25, z, w + 0.35, 0.5, d + 0.35, '#484c50'));
      buildings.push(block(x, h + 1.1, z, w * 0.62, 1.7, d * 0.55, '#626466'));
      if (far && h > 43) buildings.push(block(x, h + 4, z, 0.14, 6, 0.14, '#51575a'));
      for (let level = 2; level < h - 1; level += 3) {
        for (const offset of [-0.29, 0, 0.29]) {
          const glow = rand() < 0.3 ? '#f1c480' : '#47565c';
          windows.push(block(x + w * offset, level, z + d / 2 + 0.02, w * 0.14, 1.05, 0.07, glow));
        }
      }
    }
  }
  return { buildings, windows };
}

function Blocks({ items }: { items: Block[] }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const transform = new Matrix4(), color = new Color();
    items.forEach((b, i) => {
      mesh.setMatrixAt(i, transform.makeScale(b.w, b.h, b.d).setPosition(b.x, b.y, b.z));
      mesh.setColorAt(i, color.set(b.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[undefined, undefined, items.length]}>
    <boxGeometry /><meshStandardMaterial roughness={0.85} />
  </instancedMesh>;
}

export function CanalSkyline() {
  const city = useMemo(neighborhood, []);
  return <group position={[0, -24, 0]}>
    <mesh rotation-x={-Math.PI / 2} material={mat('#64695c')}><planeGeometry args={[250, 250]} /></mesh>
    <mesh position={[0, 0.09, -24]} rotation-x={-Math.PI / 2} material={mat('#4a686c', 0.28)}><planeGeometry args={[180, 13]} /></mesh>
    {[-30.6, -17.4].map(z => <mesh key={z} position={[0, 0.6, z]} material={mat('#706d61')}><boxGeometry args={[170, 1.25, 0.7]} /></mesh>)}
    {[-23, 27].map(x => <group key={x} position={[x, 0, -24]}>
      <mesh position-y={3.5} material={mat('#545b55')}><boxGeometry args={[4.2, 0.7, 17]} /></mesh>
      {[-6, 0, 6].map(z => <mesh key={z} position={[0, 1.6, z]} material={mat('#716f64')}><boxGeometry args={[3.5, 3.3, 1]} /></mesh>)}
      {[-1.95, 1.95].map(dx => <mesh key={dx} position={[dx, 4.25, 0]} material={mat('#515955')}><boxGeometry args={[0.14, 0.8, 17]} /></mesh>)}
      {[-6, 6].map(z => <mesh key={z} position={[-1.95, 5.1, z]} material={lampMat}><sphereGeometry args={[0.22, 6, 4]} /></mesh>)}
    </group>)}
    <Blocks items={city.buildings} /><Blocks items={city.windows} />
  </group>;
}
