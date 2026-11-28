import { useG } from '@/game/runtime';
import { mat, signTex, windowMat } from './materials';

export function Warehouse() {
  const leased = useG(s => s.warehouse.leased);
  const shipped = useG(s => s.warehouse.lastDispatchDay === s.day);
  const brick = mat('#8c624d'), iron = mat('#414d4a');
  return <group position={[108, 0, -2]}>
    <mesh position={[0, 0.03, -4.5]} material={mat('#8a8478')}><boxGeometry args={[12, 0.06, 9]} /></mesh>
    <mesh position={[0, 2.25, -9]} material={brick}><boxGeometry args={[12, 4.5, 0.28]} /></mesh>
    {[-6, 6].map(x => <mesh key={x} position={[x, 1.85, -4.5]} material={brick}><boxGeometry args={[0.28, 3.7, 9]} /></mesh>)}
    {[-4, 4].map(x => <group key={x}>
      <mesh position={[x, 1.65, 0]} material={brick}><boxGeometry args={[4, 3.3, 0.3]} /></mesh>
      <mesh position={[x, 2, 0.17]} material={windowMat}><boxGeometry args={[2.5, 1.1, 0.05]} /></mesh>
    </group>)}
    <mesh position={[0, 3.58, 0]} material={iron}><boxGeometry args={[12.3, 0.6, 0.5]} /></mesh>
    <mesh position={[0, 3.6, 0.27]}><planeGeometry args={[7.2, 0.7]} /><meshBasicMaterial map={signTex('CANAL WAREHOUSE', '#37483e', '#f2d9a3')} /></mesh>
    <mesh position={[0, leased ? 3.03 : 1.65, 0]} material={mat('#63736b')}><boxGeometry args={[4, leased ? 0.6 : 3.3, 0.22]} /></mesh>
    {[-4, 0, 4].map(x => <mesh key={x} position={[x, 3.2, -8.82]} material={windowMat}><boxGeometry args={[2.5, 1.0, 0.06]} /></mesh>)}
    <mesh position={[0, 0.67, -7.6]} material={mat('#866241')}><boxGeometry args={[8, 1.34, 1.4]} /></mesh>
    {[-2.8, -1.1, 2].map((x, i) => <mesh key={x} position={[x, 1.65, -7.6]} material={mat(shipped ? '#72583d' : ['#9a7952', '#95764e', '#ae8a5d'][i])}><boxGeometry args={[1.2, 0.64, 0.8]} /></mesh>)}
    <mesh position={[2.9, 1.05, 0.19]}><planeGeometry args={[0.6, 0.78]} /><meshStandardMaterial color="#e7d7b9" /></mesh>
  </group>;
}
