import { MeshStandardMaterial } from 'three';
import { RoundedBox } from '@react-three/drei';

const cloth = (color: string) => new MeshStandardMaterial({ color, roughness: 1 });
const terracotta = cloth('#b56854');
const lip = cloth('#ce8c70');
const soil = cloth('#655044');
const dark = cloth('#402b29');
const mint = cloth('#82a978');
const sage = cloth('#60895e');
const thread = cloth('#e7a385');

export function PotPlush() {
  return (
    <group name="7B: hidden pot plush" position={[-7.84, 0.943, -4.54]} rotation={[0.05, 0.56, -0.11]}>
      <RoundedBox args={[0.29, 0.225, 0.25]} radius={0.077} smoothness={3} position={[0, 0.118, 0]} material={terracotta} />
      <RoundedBox args={[0.328, 0.068, 0.28]} radius={0.029} smoothness={3} position={[0, 0.223, 0.006]} material={lip} />
      <mesh position={[0, 0.257, 0]} scale={[0.115, 0.023, 0.082]} material={soil}><sphereGeometry args={[1, 12, 8]} /></mesh>
      <mesh position={[-0.065, 0.322, 0.006]} scale={[0.051, 0.105, 0.032]} rotation-z={0.64} material={mint}><sphereGeometry args={[1, 12, 8]} /></mesh>
      <mesh position={[0.05, 0.335, 0.006]} scale={[0.049, 0.114, 0.032]} rotation-z={-0.46} material={sage}><sphereGeometry args={[1, 12, 8]} /></mesh>
      {[-1, 1].map(side => <group key={side}>
        <mesh position={[side * 0.054, 0.143, 0.124]} scale={[0.016, 0.021, 0.008]} material={dark}><sphereGeometry args={[1, 8, 6]} /></mesh>
        <mesh position={[side * 0.09, 0.115, 0.123]} scale={[0.022, 0.009, 0.007]} material={thread}><sphereGeometry args={[1, 8, 6]} /></mesh>
        <mesh position={[side * 0.01, 0.104, 0.129]} rotation-z={side * 0.34} material={dark}><boxGeometry args={[0.023, 0.006, 0.008]} /></mesh>
      </group>)}
    </group>
  );
}
