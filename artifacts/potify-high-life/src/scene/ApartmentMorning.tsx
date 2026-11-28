import { mat } from './materials';
import { SolidSurfaces } from './SolidSurfaces';

type Vec = [number, number, number];

function Box({ at, size, color }: { at: Vec; size: Vec; color: string }) {
  return <mesh position={at} material={mat(color)} castShadow receiveShadow><boxGeometry args={size} /></mesh>;
}

/** Room dressing stays above existing surfaces and outside the walkable path. */
export function ApartmentMorning() {
  return <SolidSurfaces>
    {/* Heavy linen panels frame the canal windows without covering the view. */}
    {[-8.19, 2.05].map((edge, side) => <group key={edge}>
      {Array.from({ length: 5 }, (_, i) => {
        const x = edge + (side ? -1 : 1) * i * 0.115;
        return <Box key={i} at={[x, 1.96, -5.40 + (i % 2) * 0.025]} size={[0.13, 1.72, 0.08]}
          color={i % 2 ? '#bbaa87' : '#d6c9a7'} />;
      })}
      <Box at={[edge + (side ? -0.23 : 0.23), 1.61, -5.34]} size={[0.64, 0.075, 0.055]} color="#7e795f" />
    </group>)}
    <Box at={[-3.07, 2.88, -5.37]} size={[10.85, 0.055, 0.055]} color="#786b50" />

    {/* A woven rug gives the room a proper center; it is flush with the floor. */}
    <Box at={[-4.73, 0.004, -1.86]} size={[4.25, 0.035, 2.72]} color="#716e53" />
    <Box at={[-4.73, 0.023, -1.86]} size={[4.08, 0.004, 2.55]} color="#b5a17c" />
    {[-2.96, -0.76].map(z => <Box key={z} at={[-4.73, 0.026, z]} size={[3.82, 0.003, 0.075]} color="#77765b" />)}
    {[-6.43, -3.03].map(x => <Box key={x} at={[x, 0.027, -1.86]} size={[0.055, 0.003, 2.2]} color="#77765b" />)}

    {/* A folded throw and end rail make the existing bed read as a lived-in bed. */}
    <Box at={[-6.52, 0.848, -4.77]} size={[0.86, 0.085, 1.42]} color="#627768" />
    <Box at={[-6.61, 0.896, -4.77]} size={[0.13, 0.016, 1.36]} color="#d1c19d" />
    <Box at={[-5.94, 0.88, -4.77]} size={[0.075, 0.75, 1.61]} color="#624d3c" />
  </SolidSurfaces>;
}
