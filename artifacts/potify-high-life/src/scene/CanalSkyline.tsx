import { useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, CanvasTexture, Color, InstancedMesh, Matrix4, SRGBColorSpace } from 'three';
import { lampMat, mat, seeded } from './materials';

type Block = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };
const masonry = ['#815d4d', '#87796b', '#776e65', '#867d67', '#64736d'];
const towers = ['#535d67', '#646574', '#576d73', '#6d6875'];
function block(x: number, y: number, z: number, w: number, h: number, d: number, color: string): Block {
  return { x, y, z, w, h, d, color };
}

function neighborhood() {
  const rand = seeded(713);
  const buildings: Block[] = [], caps: Block[] = [];
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
      caps.push(block(x, h + 0.25, z, w + 0.35, 0.5, d + 0.35, '#484c50'));
      caps.push(block(x, h + 1.1, z, w * 0.62, 1.7, d * 0.55, '#626466'));
      if (far && h > 43) caps.push(block(x, h + 4, z, 0.14, 6, 0.14, '#51575a'));

    }
  }
  return { buildings, caps };
}

// Window rows are painted on the four outer walls. Rooftops and ledges stay
// solid, and distant windows no longer submit thousands of separate faces.
function makeFacade() {
  const canvas = document.createElement('canvas');
  canvas.width = 96; canvas.height = 192;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#f2eae0'; g.fillRect(0,0,96,192);
  const random = seeded(802);
  for (let y=6;y<184;y+=16) {
    g.fillStyle = '#c8bdaf'; g.fillRect(0,y+8,96,2);
    for (let x=8;x<94;x+=24) {
      g.fillStyle = random()<0.26 ? '#ffdd9e' : '#6b7980';
      g.fillRect(x,y,11,7);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
let facade: CanvasTexture | undefined;
const wallGeometry = new BoxGeometry();
const uv = wallGeometry.attributes.uv;
for (let i=8;i<16;i++) uv.setXY(i,0.01,0.99); // top and bottom faces

function Blocks({ items, walls = false }: { items: Block[]; walls?: boolean }) {
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
  return <instancedMesh ref={ref} args={[walls ? wallGeometry : undefined, undefined, items.length]}>
    {!walls && <boxGeometry />}<meshLambertMaterial map={walls ? (facade ??= makeFacade()) : null} />
  </instancedMesh>;
}

export function CanalSkyline() {
  const city = useMemo(neighborhood, []);
  return <group>
    <mesh rotation-x={-Math.PI / 2} material={mat('#64695c')}><planeGeometry args={[250, 250]} /></mesh>
    <mesh position={[0, 0.09, -24]} rotation-x={-Math.PI / 2} material={mat('#4a686c', 0.28)}><planeGeometry args={[180, 13]} /></mesh>
    {[-30.6, -17.4].map(z => <mesh key={z} position={[0, 0.6, z]} material={mat('#706d61')}><boxGeometry args={[170, 1.25, 0.7]} /></mesh>)}
    {[-23, 27].map(x => <group key={x} position={[x, 0, -24]}>
      <mesh position-y={3.5} material={mat('#545b55')}><boxGeometry args={[4.2, 0.7, 17]} /></mesh>
      {[-6, 0, 6].map(z => <mesh key={z} position={[0, 1.6, z]} material={mat('#716f64')}><boxGeometry args={[3.5, 3.3, 1]} /></mesh>)}
      {[-1.95, 1.95].map(dx => <mesh key={dx} position={[dx, 4.25, 0]} material={mat('#515955')}><boxGeometry args={[0.14, 0.8, 17]} /></mesh>)}
      {[-6, 6].map(z => <mesh key={z} position={[-1.95, 5.1, z]} material={lampMat}><sphereGeometry args={[0.22, 6, 4]} /></mesh>)}
    </group>)}
    <Blocks items={city.buildings} walls /><Blocks items={city.caps} />
  </group>;
}
