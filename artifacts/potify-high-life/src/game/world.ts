import type { Area, Interactable, NpcId, ZoneName } from '@/game/runtime';

export type AABB = [number, number, number, number]; // minX, maxX, minZ, maxZ
export const TX = 80; // town origin x

export const BEDS = Array.from({ length: 6 }, (_, i) => ({ index: i, x: [-4, 0, 4][i % 3], z: i < 3 ? 6.6 : 9.8 }));

export const ROOF_BOUNDS = { minX: -11.6, maxX: 11.6, minZ: -9.6, maxZ: 11.6 };
export const TOWN_BOUNDS = { minX: 62.5, maxX: 97.5, minZ: -15.5, maxZ: 13.9 };

export const ROOF_COLLIDERS: AABB[] = [
  // apartment walls (door gap x -8..-6 on south)
  [-11, -3, -9, -8.7], [-11, -10.7, -9, -2], [-3.3, -3, -9, -2], [-11, -8, -2.3, -2], [-6, -3, -2.3, -2],
  [-10.7, -8.3, -8.7, -6.9], [-4.4, -3.3, -8.7, -7.9], [-6.6, -5.4, -8.7, -8.1],
  // greenhouse walls (door gap x 6..8)
  [3, 11, -9, -8.7], [3, 3.3, -9, -2], [10.7, 11, -9, -2], [3, 6, -2.3, -2], [8, 11, -2.3, -2],
  [4, 10, -8.7, -7.9],
  ...BEDS.map(b => [b.x - 1.3, b.x + 1.3, b.z - 0.8, b.z + 0.8] as AABB),
  [8.6, 11.8, 8.2, 11.8], // stair hut
  [-11.8, -9.4, 3, 5.4], // water tank
  [-10.6, -7.4, 9.2, 10.4], // bench
];

export const SHOPS = {
  seed: { name: 'Seed & Signal', x: 68, z: -11, w: 8, d: 6, door: [68, -7.3] as const, color: '#1f9e89', roof: '#fbd255' },
  rootworks: { name: 'Rootworks', x: 80, z: -12, w: 8, d: 6, door: [80, -8.3] as const, color: '#ef6f7c', roof: '#13293a' },
  exchange: { name: 'Green Exchange', x: 92, z: -11, w: 8, d: 6, door: [92, -7.3] as const, color: '#fbd255', roof: '#f2703f' },
  lab: { name: 'Petri & Pistil Lab', x: 66, z: 6, w: 6, d: 8, door: [69.7, 6] as const, color: '#8fd6e2', roof: '#fff7e8' },
  cafe: { name: 'Low Tide Listening Cafe', x: 94, z: 6, w: 6, d: 8, door: [90.3, 6] as const, color: '#f2703f', roof: '#1f9e89' },
};

const box = (x: number, z: number, w: number, d: number): AABB => [x - w / 2, x + w / 2, z - d / 2, z + d / 2];
export const TOWN_TREES: [number, number][] = [[71, -1], [89, -1], [72, 12], [88, 12], [64, -3], [96, -3]];
export const TOWN_COLLIDERS: AABB[] = [
  ...Object.values(SHOPS).map(s => box(s.x, s.z, s.w, s.d)),
  [76, 84, 15, 19], // home building
  [78, 82, -2, 2], // fountain
  [83.6, 84.4, -4.2, -3.6], // board
  ...TOWN_TREES.map(([x, z]) => box(x, z, 1, 1)),
  [74.5, 76.5, 4.3, 5.1], [83.5, 85.5, 4.3, 5.1], // benches
];

export function zoneAt(area: Area, x: number, z: number): ZoneName {
  if (area === 'town') return 'town';
  if (x > -11 && x < -3 && z > -9 && z < -2) return 'apartment';
  if (x > 3 && x < 11 && z > -9 && z < -2) return 'greenhouse';
  return 'rooftop';
}

export const STATIC_TARGETS: Interactable[] = [
  ...BEDS.map(b => ({ id: `bed-${b.index}`, kind: 'bed' as const, x: b.x, z: b.z, r: 2.0, label: `Bed ${b.index + 1}`, verb: 'Tend', area: 'roof' as Area, index: b.index })),
  { id: 'stairs', kind: 'door-down', x: 8.0, z: 9.9, r: 1.7, label: 'Stairwell to town', verb: 'Go down', area: 'roof' },
  { id: 'sleep', kind: 'sleep', x: -9.5, z: -6.2, r: 1.5, label: 'Your bed', verb: 'Sleep', area: 'roof' },
  { id: 'wardrobe', kind: 'wardrobe', x: -3.9, z: -7.2, r: 1.4, label: 'Wardrobe', verb: 'Change', area: 'roof' },
  { id: 'radio', kind: 'radio', x: -6, z: -7.4, r: 1.4, label: 'Rooftop radio', verb: 'Toggle', area: 'roof' },
  { id: 'rack', kind: 'rack', x: 7, z: -7.1, r: 1.8, label: 'Drying rack', verb: 'Check', area: 'roof' },
  { id: 'planner', kind: 'planner', x: 4.1, z: -4.6, r: 1.4, label: 'Grow planner', verb: 'Read', area: 'roof' },
  { id: 'home', kind: 'door-up', x: 80, z: 14.2, r: 1.9, label: 'Your building', verb: 'Climb up', area: 'town' },
  { id: 'board', kind: 'board', x: 84, z: -2.9, r: 1.5, label: 'Town board', verb: 'Read', area: 'town' },
  ...(Object.entries(SHOPS) as [keyof typeof SHOPS, (typeof SHOPS)[keyof typeof SHOPS]][]).map(([id, s]) => ({
    id: `shop-${id}`, kind: 'shop' as const, x: s.door[0], z: s.door[1], r: 2.0, label: s.name, verb: 'Enter', area: 'town' as Area, shop: id,
  })),
];

export const NPCS: Record<NpcId, { name: string; role: string; color: string; shirt: string; skin: string; hair: string }> = {
  mira: { name: 'Mira', role: 'Keeper of Seed & Signal', color: '#1f9e89', shirt: '#1f9e89', skin: '#c98b5e', hair: '#2b2140' },
  moss: { name: 'Moss', role: 'Soil mixer at Rootworks', color: '#7a8f3a', shirt: '#7a8f3a', skin: '#f0c9a4', hair: '#b4682e' },
  jun: { name: 'Jun', role: 'Barista and radio host, Low Tide', color: '#ef6f7c', shirt: '#ef6f7c', skin: '#e8b48e', hair: '#1a1a24' },
};

export function npcSchedule(id: NpcId, minute: number, day: number, met: boolean): { area: Area; x: number; z: number; place: string } {
  const h = minute / 60;
  if (id === 'mira') {
    if (!met || (day === 1 && h < 14)) return { area: 'roof', x: 2.5, z: 2.2, place: 'Your rooftop' };
    if (h >= 6 && h < 12) return { area: 'town', x: 69.5, z: -5.6, place: 'Seed & Signal' };
    if (h >= 12 && h < 18) return { area: 'town', x: 76.5, z: 2.8, place: 'The square' };
    return { area: 'town', x: 89, z: 8.5, place: 'Low Tide Cafe' };
  }
  if (id === 'moss') {
    if (h >= 6 && h < 13) return { area: 'town', x: 82, z: -6.6, place: 'Rootworks' };
    if (h >= 13 && h < 19) return { area: 'town', x: 71.5, z: 8.5, place: 'Petri & Pistil Lab' };
    return { area: 'town', x: 82.5, z: 3.4, place: 'Square bench' };
  }
  if (h >= 8 && h < 15) return { area: 'town', x: 88.6, z: 4, place: 'Low Tide Cafe' };
  if (h >= 15 && h < 20) return { area: 'town', x: 79, z: -3.6, place: 'The fountain' };
  return { area: 'town', x: 90, z: -5.6, place: 'Green Exchange' };
}
