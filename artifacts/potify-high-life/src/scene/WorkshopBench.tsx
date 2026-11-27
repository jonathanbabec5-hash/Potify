import { SurfaceBlock } from './Surfaces';
import { RoundedBox } from '@react-three/drei';
import { mat } from './materials';
import { SolidSurfaces } from './SolidSurfaces';

type Triple = [number, number, number];
function Part({ at, size, color, tilt = 0 }: { at: Triple; size: Triple; color: string; tilt?: number }) {
  return <mesh position={at} rotation-z={tilt} material={mat(color)} castShadow receiveShadow>
    <boxGeometry args={size} />
  </mesh>;
}

export function WorkshopBench() {
  const steel = '#496448';
  return <group position={[7, 0, -8.3]}>
    <SolidSurfaces>
      {[-2.72, 0, 2.72].flatMap(x => [-0.33,0.33].map(z =>
        <Part key={x+'/'+z} at={[x,0.47,z]} size={[0.075,0.94,0.075]} color={steel} />))}
      {[-0.34,0.34].map(z => <Part key={z} at={[0,0.84,z]} size={[5.7,0.12,0.08]} color={steel} />)}
      {[-1.4,1.4].map((x,i) => <Part key={x} at={[x,0.49,-0.29]} size={[1.54,0.06,0.06]}
        tilt={i ? -0.45 : 0.45} color={steel} />)}
      {[-0.29,-0.10,0.09,0.28].map((z,i) => <SurfaceBlock key={z} at={[0,0.95,z]}
        size={[5.78,0.085,0.18]} finish="cedar" color={i%2?'#d3c0ae':'#ebd0ad'} />)}
      <Part at={[1.4,0.25,0]} size={[2.72,0.08,0.7]} color="#806446" />
      <Part at={[-1.6,1.02,0]} size={[1.1,0.05,0.57]} color="#443e36" />
      {[-0.255,0.255].map(z => <Part key={z} at={[-1.6,1.06,z]} size={[1.1,0.085,0.045]} color="#584c3f" />)}
      {[-0.33,0.24].map((x,i) => <group key={x} position-x={x}>
        <RoundedBox args={[0.30,0.34,0.23]} radius={0.043} smoothness={2} position={[0,1.17,-0.05]} material={mat(i?'#d2c7a2':'#ae6749')} />
        <mesh position={[0.055,1.352,-0.05]} material={mat(i?'#c4b998':'#995a3d')}><torusGeometry args={[0.052,0.015,7,14]}/></mesh>
        <Part at={[0,1.18,0.069]} size={[0.18,0.12,0.007]} color="#ada58b" />
        <mesh position={[-0.08,1.36,-0.05]} material={mat('#48473c')}><cylinderGeometry args={[0.041,0.046,0.062,10]}/></mesh>
      </group>)}
      <mesh position={[1.46,1.18,0]} material={mat('#9c9b88')} castShadow receiveShadow>
        <cylinderGeometry args={[0.235,0.17,0.41,12,1,true]} /></mesh>
      <mesh position={[1.46,1.27,0]} rotation-x={-Math.PI/2} material={mat('#55554c')}>
        <circleGeometry args={[0.21,12]} /></mesh>
      <Part at={[2.26,1.075,0]} size={[0.64,0.18,0.42]} color="#546d66" />
      {[-0.18,-0.05,0.13,0.21].map((x,i) => <group key={x} position={[2.26+x,1.16,i%2?0.07:-0.06]}>
        <mesh position-y={0.065} material={mat('#d8ccb2')}><cylinderGeometry args={[0.016,0.021,0.13,5]}/></mesh>
        <mesh position-y={0.13} material={mat('#bc8950')}><sphereGeometry args={[0.064,7,3,0,Math.PI*2,0,Math.PI/2]}/></mesh>
      </group>)}
    </SolidSurfaces>
  </group>;
}
