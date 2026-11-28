import * as THREE from 'three';
import type { PlotStatus } from '@/game/plotStatus';
import { mat } from '@/scene/materials';

type PlantedStatus = Exclude<PlotStatus, 'empty'>;

// Marks are painted onto a small wooden stake laid above the soil, not HUD sprites.
// Shared geometries keep each marker to two static meshes without new textures.
function polygon(points: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(...points[0]);
  for (const point of points.slice(1)) shape.lineTo(...point);
  shape.closePath();
  return shape;
}

const markShapes: Record<PlantedStatus, THREE.Shape[]> = {
  growing: [
    polygon([[-0.015, -0.12], [0.015, -0.12], [0.015, 0.08], [-0.015, 0.08]]),
    polygon([[0, 0.01], [-0.12, 0.05], [-0.14, 0.13], [-0.06, 0.12]]),
    polygon([[0, 0.01], [0.06, 0.12], [0.14, 0.13], [0.12, 0.05]]),
  ],
  'needs-water': [
    polygon([[-0.015, -0.12], [0.015, -0.12], [0.015, 0.06], [-0.015, 0.06]]),
    polygon([[0, 0.02], [-0.10, 0.07], [-0.15, 0.02], [-0.13, -0.07], [-0.08, 0.00]]),
    polygon([[0, 0.02], [0.10, 0.07], [0.15, 0.02], [0.13, -0.07], [0.08, 0.00]]),
  ],
  ready: [
    polygon([[-0.015, -0.13], [0.015, -0.13], [0.015, 0.04], [-0.015, 0.04]]),
    polygon([[-0.055, 0.04], [-0.055, 0.11], [0, 0.16], [0.055, 0.11], [0.055, 0.04], [0, 0.00]]),
    polygon([[-0.025, -0.05], [-0.11, -0.02], [-0.13, 0.04], [-0.06, 0.03]]),
    polygon([[0.025, -0.05], [0.06, 0.03], [0.13, 0.04], [0.11, -0.02]]),
  ],
};
const marks = Object.fromEntries(
  Object.entries(markShapes).map(([status, shapes]) => [status, new THREE.ShapeGeometry(shapes)]),
) as Record<PlantedStatus, THREE.ShapeGeometry>;
const wood = mat('#d2b48b');
const ink = mat('#3f4d36');

export function PlotStatusMarker({ status }: { status: PlotStatus }) {
  if (status === 'empty') return null;
  return (
    <group position={[0.94, 0.57, 0.48]}>
      <mesh material={wood}>
        <boxGeometry args={[0.4, 0.045, 0.4]} />
      </mesh>
      <mesh geometry={marks[status]} material={ink} rotation-x={-Math.PI / 2} position={[0, 0.024, 0]} />
    </group>
  );
}
