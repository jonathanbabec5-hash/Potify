export const HIGH_CAMERA = 2;
export const FADE_MS = 4000;
export const PAN_MS = 840;
export const FIRST_LIGHT_YAW = -.48;
export const FIRST_LIGHT_PITCH = -.06;
export type IntroState = { began: number; reduced: boolean; turnedAt: number | null };

export const WELCOME = [
  { line: 'Well. The light found you before I did. I’m Tessa Bloom. I look after Canopy House, and you’re our new rooftop grower.' },
  { line: 'Six beds, a glasshouse and your own key. Start with one bed. Give it time, meet the neighbors, and bring your first harvest to Green Exchange.' },
  { line: 'First, read the lease on the desk in front of you. Then take the lift to R. Mira will meet you on the roof.' },
] as const;

// Restrict the distant high camera along the roof's edge. At a parapet, keep the
// viewpoint above the playable deck instead of putting the facade in the foreground.
export function highRoofLens(x:number, z:number, backwardX:number, backwardZ:number, b:{minX:number;maxX:number;minZ:number;maxZ:number}) {
  const xEdge = Math.abs(backwardX) < 0.0001 ? Infinity : ((backwardX > 0 ? b.maxX : b.minX) - x) / backwardX;
  const zEdge = Math.abs(backwardZ) < 0.0001 ? Infinity : ((backwardZ > 0 ? b.maxZ : b.minZ) - z) / backwardZ;
  const d = Math.max(3.3, Math.min(12, Math.min(xEdge,zEdge) + 2.3));
  return { d, h: Math.min(12, Math.max(5.45, d)) };
}
