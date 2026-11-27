import { SolidSurfaces } from './SolidSurfaces';
import { useG } from '@/game/runtime';
import { CART } from '@/game/world';
import { glassMat, lampMat, mat } from './materials';

function GlasshouseExtension() {
  return <group position={[0, 0, -5.3]}>
    <SolidSurfaces>
    {[-2, 2].map(x => <group key={x} position-x={x}>
      {[-3.25, 0, 3.25].map(z => <mesh key={z} position={[0, 1.25, z]} material={mat('#414c41')}><boxGeometry args={[0.09, 2.5, 0.09]} /></mesh>)}
      <mesh position-y={2.5} material={mat('#414c41')}><boxGeometry args={[0.11, 0.12, 6.6]} /></mesh>
      <mesh position={[-x / 2, 2.9, 0]} rotation-z={x < 0 ? 0.38 : -0.38} material={glassMat}><boxGeometry args={[2.16, 0.05, 6.6]} /></mesh>
      {[-3.25, 0, 3.25].map(z => <mesh key={z} position={[-x / 2, 2.9, z]} rotation-z={x < 0 ? 0.38 : -0.38} material={mat('#414c41')}><boxGeometry args={[2.16, 0.09, 0.09]} /></mesh>)}
    </group>)}
    <mesh position={[0, 3.29, 0]} material={mat('#414c41')}><boxGeometry args={[0.1, 0.1, 6.6]} /></mesh>
    <mesh position={[0, 2.75, 3.25]} material={lampMat}><sphereGeometry args={[0.15, 8, 6]} /></mesh>
    </SolidSurfaces>
  </group>;
}

function DeliveryCart() {
  const packed = useG(s => !!s.crate);
  return <group position={[CART.x, 0, CART.z]}>
    <SolidSurfaces revision={String(packed)}>
    <mesh position-y={0.46} material={mat('#986d41')} castShadow><boxGeometry args={[1.45, 0.18, 1.02]} /></mesh>
    {[-0.53, 0.53].map(x => [-0.48, 0.48].map(z => <mesh key={x + ':' + z} position={[x, 0.22, z]} rotation-x={Math.PI / 2} material={mat('#373b37')}><cylinderGeometry args={[0.21, 0.21, 0.11, 12]} /></mesh>))}
    {[-0.39, 0.39].map(z => <mesh key={z} position={[0.67, 0.9, z]} material={mat('#434d47')}><boxGeometry args={[0.07, 0.95, 0.07]} /></mesh>)}
    <mesh position={[0.67, 1.35, 0]} material={mat('#775435')}><boxGeometry args={[0.1, 0.11, 0.85]} /></mesh>
    <mesh position={[0, 0.78, 0]} material={mat('#a17b52')}><boxGeometry args={[0.95, 0.49, 0.77]} /></mesh>
    {[-0.32, 0.32].map(x => <mesh key={x} position={[x, 0.78, 0]} material={mat('#674f38')}><boxGeometry args={[0.09, 0.5, 0.8]} /></mesh>)}
    <mesh position={[0, 1.04, 0]} material={mat(packed ? '#708259' : '#594534')}><boxGeometry args={[0.84, packed ? 0.15 : 0.01, 0.68]} /></mesh>
    </SolidSurfaces>
  </group>;
}

export function RoofProjects() {
  const projects = useG(s => s.projects);
  return <>{projects.includes('glasshouse') && <GlasshouseExtension />}{projects.includes('cart') && <DeliveryCart />}</>;
}
