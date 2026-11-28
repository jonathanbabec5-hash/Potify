import { useRef, useSyncExternalStore } from 'react';
import { game } from '@/game/store';
import { sfx } from '@/game/audio';
import type { Resident, StoryItem, StoryPage } from '@/game/story';

export type GS = ReturnType<typeof game.getState>;
export type Area = 'roof' | 'town';
export type ZoneName = 'rooftop' | 'town' | 'greenhouse' | 'apartment';
export type ShopId = 'seed' | 'rootworks' | 'exchange' | 'lab' | 'cafe';
export type NpcId = Resident;

export type Modal =
  | null
  | { type: 'pause' | 'inventory' | 'avatar' | 'map' | 'calendar' | 'settings' | 'roadmap' | 'sleep' | 'field-notes' }
  | { type: 'bed'; index: number }
  | { type: 'shop'; shop: ShopId }
  | { type: 'talk'; npc: NpcId; line: string }
  | { type: 'story-page'; page: StoryPage; fromNotes?: boolean };

export type InteractKind = 'bed' | 'door-down' | 'door-up' | 'shop' | 'npc' | 'sleep' | 'wardrobe' | 'radio' | 'rack' | 'planner' | 'board' | 'story-item';

export interface Interactable {
  id: string;
  kind: InteractKind;
  x: number;
  z: number;
  r: number;
  label: string;
  verb: string;
  area: Area;
  index?: number;
  shop?: ShopId;
  npc?: NpcId;
  storyItem?: StoryItem;
}

export interface Toast { id: number; text: string; tone: 'good' | 'bad' }

interface UIState {
  inGame: boolean;
  modal: Modal;
  prompt: Interactable | null;
  toasts: Toast[];
  fading: boolean;
  ready: boolean;
  glLost: boolean;
  area: Area;
  zone: ZoneName;
}

let uiState: UIState = {
  inGame: false, modal: null, prompt: null, toasts: [], fading: false, ready: false, glLost: false,
  area: 'roof', zone: 'rooftop',
};
const uiListeners = new Set<() => void>();
export const ui = {
  get: () => uiState,
  set(p: Partial<UIState>) { uiState = { ...uiState, ...p }; uiListeners.forEach(l => l()); },
  subscribe(fn: () => void) { uiListeners.add(fn); return () => { uiListeners.delete(fn); }; },
};
export function useUI<T>(sel: (s: UIState) => T): T {
  return useSyncExternalStore(ui.subscribe, () => sel(uiState), () => sel(uiState));
}

/** Selector hook over the game store; re-renders only when the selected JSON value changes. */
export function useG<T>(sel: (s: GS) => T): T {
  const cache = useRef<{ k: string; v: T } | null>(null);
  const get = () => {
    const v = sel(game.getState());
    const k = JSON.stringify(v);
    if (cache.current && cache.current.k === k) return cache.current.v;
    cache.current = { k, v };
    return v;
  };
  return useSyncExternalStore(game.subscribe, get, get);
}

export function openModal(m: Modal) { ui.set({ modal: m }); if (m) sfx.open(); }
export function closeModal() { if (uiState.modal) sfx.close(); ui.set({ modal: null }); }

let toastId = 1;
export function toast(text: string, tone: 'good' | 'bad' = 'good') {
  const t = { id: toastId++, text, tone };
  ui.set({ toasts: [...uiState.toasts.slice(-3), t] });
  setTimeout(() => ui.set({ toasts: uiState.toasts.filter(x => x.id !== t.id) }), 3200);
}

const BAD = /(not enough|need |can't|cannot|no seeds|nothing|already|must|insufficient|isn't|is not|only|too |unable|first|locked|error|invalid|unknown|empty)/i;
/** Run a store action, toast its message, return true on success. */
export function act(fn: () => unknown, quiet = false): boolean {
  const r = fn();
  if (typeof r === 'string' && r) {
    const bad = BAD.test(r) && !/harvested|sold|bought|planted|watered/i.test(r);
    if (!quiet || bad) toast(r, bad ? 'bad' : 'good');
    if (bad) sfx.error();
    return !bad;
  }
  return true;
}

export const player = { x: 0, z: 4, yaw: Math.PI, speed: 0 };
export const joy = { x: 0, y: 0 };
export const npcPos: Record<NpcId, { x: number; z: number; yaw: number; speed: number; area: Area }> = {
  mira: { x: 2.5, z: 2, yaw: 0, speed: 0, area: 'roof' },
  moss: { x: 82, z: -6.5, yaw: 0, speed: 0, area: 'town' },
  jun: { x: 89, z: 4, yaw: 0, speed: 0, area: 'town' },
};

export interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; color: string }
export const fx = {
  parts: [] as Particle[],
  pending: [] as Particle[],
  emit(x: number, z: number, color: string, n = 14, y = 0.8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 2.2;
      fx.pending.push({ x, y, z, vx: Math.cos(a) * s, vy: 3 + Math.random() * 3, vz: Math.sin(a) * s, life: 1, color });
    }
  },
};

export const camCtl = { yawOffset: 0 };
