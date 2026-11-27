import type { GameState } from './store';
import type { Interactable } from './runtime';
import type { AABB } from './world';
import { hasLandingBoard } from './notices';
import { NEIGHBORS, PEOPLE, houseDate, meetingFloor, residentX } from './house';

export const TOWER_BOUNDS = { minX: -8.45, maxX: 8.25, minZ: -5.62, maxZ: 5.35 };
const CORE: AABB[] = [
  [2.55, 2.75, -6, 1],
  [5.36, 5.54, -3.7, 1],
  [-8.8, 2.45, -5.98, -5.5],
  [-8.3, -0.9, -5.5, -4.05],
  [-0.15, 1.65, 1.5, 1.8], // lift jamb and doors
];
export function towerColliders(floor: number, open: boolean): AABB[] {
  if (floor !== 12) return CORE;
  return [
    ...CORE,
    [-5.4, -5.2, -5.5, -0.5],
    [-8.6, -7.3, -0.55, -0.35],
    ...(open ? [] : [[-7.3, -5.2, -0.55, -0.35] as AABB]),
  ];
}
export function personFloor(id: keyof typeof PEOPLE, state: Pick<GameState, 'day' | 'minute' | 'life'>) {
  return meetingFloor(id, state.day, state.minute, state.life.partner);
}
const site = (
  id: string,
  kind: Interactable['kind'],
  x: number,
  z: number,
  label: string,
  verb: string,
  extra: Partial<Interactable> = {},
): Interactable => ({ id, kind, x, z, label, verb, area: 'tower', r: 1.75, ...extra });
export function towerTargets(
  floor: number,
  state: Pick<GameState, 'minute' | 'day' | 'life'>,
): Interactable[] {
  const date = houseDate(state.day);
  const list = [site('house-lift', 'house', 0.75, 2.25, 'Passenger lift', 'Call', { room: 'lift' })];
  if (floor === 1) list.push(site('house-street', 'street', -6, 4.8, 'Canopy Quarter', 'Go outside'));
  if (floor === 24) list.push(site('house-roof', 'house', -6, 4.8, 'Roof garden gate', 'Go outside'));
  if (floor === 7)
    list.push(
      site('flat-bed', 'sleep', -7.15, -3.6, 'Your bed', 'Sleep'),
      site('flat-lease', 'story-item', -4.4, -3.65, 'Lease for Roof 7B', 'Read', { storyItem: 'lease' }),
      site('flat-album', 'house', -1.6, -3.65, 'Household album', 'Open', { room: 'album' }),
      site('flat-radio', 'story-item', -7.35, 1, 'Broadcast log', 'Read', { storyItem: 'signal' }),
    );
  if (floor === 21)
    list.push(
      site('house-commons', 'house', -4.5, -3.55, 'Residents’ commons', 'Visit', { room: 'commons' }),
    );
  if (floor === 18)
    list.push(site('house-archive', 'house', -4.5, -3.65, 'Archive cabinet', 'Inspect', { room: 'archive' }));
  if (floor === 12 && state.life.archiveOpen)
    list.push(site('house-record', 'house', -6.65, -3.6, 'Tape booth', 'Listen', { room: 'record' }));
  if (floor === date.festival.floor)
    list.push(site('house-fest', 'house', -2, 1.2, date.festival.title, 'Visit', { room: 'festival' }));
  if (hasLandingBoard(floor))
    list.push(site('house-doors', 'house', -5.15, -3.65, 'Landing notices', 'Read', { room: 'doors' }));
  for (const id of NEIGHBORS) {
    if (personFloor(id, state) === floor)
      list.push(
        site('house-' + id, 'neighbor', residentX(id), -1.35, PEOPLE[id].name, 'Talk', { who: id, r: 1.55 }),
      );
  }
  return list;
}
