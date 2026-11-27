import { freshLife, validLife, validFloor, childStage, houseDate, NEIGHBORS, PASTIMES, PEOPLE, meetingFloor, type Neighbor, type Pastime, type HouseLife } from './house.ts';
import { useSyncExternalStore } from 'react';
import { chooseStory, freshStory, readStory, validateStory, type ChoiceId, type Resident, type StoryItem, type StoryProgress } from './story.ts';

export type Zone = 'tower' | 'rooftop' | 'town' | 'greenhouse' | 'apartment';
export interface Plot {
  id: number;
  strain: string | null;
  growth: number;
  water: number;
  health: number;
  fed: boolean;
}
export interface Harvest {
  id: string;
  strain: string;
  units: number;
  quality: number;
}
export type RoofProject = 'glasshouse' | 'cart';
export const PROJECTS = {
  glasshouse: { name: 'Glasshouse extension', detail: 'Moss can glaze the strip beside the old greenhouse. Two new beds will fit under the glass.' },
  cart: { name: 'Neighborhood delivery cart', detail: 'Pack a harvest by the roof stairs and bring it to a neighbor for the market price plus 5 simSOL.' },
} as const;
export const WAREHOUSE = { price: 90, minimumUnits: 250, dispatchFee: 12 };
export const DELIVERY_STOPS = [
  { shop: 'cafe', name: 'Low Tide Listening Cafe', note: 'Jun has cleared the shelf beside the record player.' },
  { shop: 'lab', name: 'Petri & Pistil Lab', note: 'The lab has a clean tray waiting for a whole local batch.' },
] as const;

export function projectPrice(installed: number) {
  return installed === 0 ? 4 : 80;
}

const emptyPlot = (id: number): Plot => ({ id, strain: null, growth: 0, water: 0, health: 50, fed: false });

export interface Settings {
  showHud?: boolean;
  muted: boolean;
  music: boolean;
  camera: number;
  quality: 'low' | 'high';
}
export interface GameState {
  version: 1;
  started: boolean;
  acknowledged: boolean;
  name: string;
  shirt: string;
  skin: string;
  day: number;
  minute: number;
  elapsed: number;
  money: number;
  seeds: Record<string, number>;
  supplies: number;
  harvest: Harvest[];
  plots: Plot[];
  upgrades: string[];
  friendship: Record<string, number>;
  lastTalkDay: Record<string, number>;
  quest: {
    met: boolean;
    bought: boolean;
    planted: boolean;
    watered: boolean;
    harvested: boolean;
    sold: boolean;
    upgraded: boolean;
    rewarded: boolean;
  };
  projects: RoofProject[];
  crate: Harvest | null;
  deliveries: number;
  warehouse: { leased: boolean; lastDispatchDay: number };
  story: StoryProgress;
  life: HouseLife;
  position: { x: number; z: number; zone: Zone; floor?: number };
  settings: Settings;
  savedAt: number;
  saveError: string | null;
  totalSold: number;
}

// Deliberately fictional game values, not real-world cultivation instructions.
export const ECONOMY = {
  startingMoney: 35,
  supplyPrice: 2,
  upgradeReward: 15,
  daySeconds: 480,
  unitPrices: [0, 0.1, 0.15, 0.21],
  waterDrain: 0.24,
  saveInterval: 5,
};
export const SEEDS = [
  { id: 'sunhaze', name: 'Sunhaze', price: 3, growSeconds: 90, color: '#a6ce56', description: 'A cheerful fictional rooftop favorite. Quick to grow.', baseYield: 60 },
  { id: 'moonmint', name: 'Moonmint', price: 5, growSeconds: 120, color: '#9dbce8', description: 'A blue-tipped city cultivar with a generous yield.', baseYield: 95 },
  { id: 'amber', name: 'Amber Glow', price: 7, growSeconds: 150, color: '#e7b65f', description: 'A patient grower’s fictional golden specialty.', baseYield: 135 },
];
export const UPGRADES = [
  { id: 'watering', name: 'Cloudburst watering can', price: 24, description: 'Waters every planted bed at once and slows moisture loss by 50%.' },
  { id: 'beds', name: 'Deep-root grow beds', price: 36, description: 'Larger beds produce 40% more harvest units per crop.' },
  { id: 'soil', name: 'Living-soil system', price: 48, description: 'Grows crops 20% faster and boosts starting plant health.' },
];
export const SAVE_KEY = 'potify-wonderful-high-life-v1';

function freshState(): GameState {
  return {
    version: 1, started: false, acknowledged: false,
    name: 'Rookie', shirt: '#c7774f', skin: '#d9a67d',
    day: 1, minute: 480, elapsed: 0, money: ECONOMY.startingMoney,
    seeds: { sunhaze: 2, moonmint: 0, amber: 0 }, supplies: 1,
    harvest: [],
    plots: Array.from({ length: 6 }, (_, id) => emptyPlot(id)),
    upgrades: [], friendship: { mira: 0, moss: 0, jun: 0 },
    lastTalkDay: {},
    quest: { met: false, bought: false, planted: false, watered: false, harvested: false, sold: false, upgraded: false, rewarded: false },
    projects: [], crate: null, deliveries: 0, warehouse: { leased: false, lastDispatchDay: 0 }, story: freshStory(),
    life: freshLife(),
    position: { x: -4.4, z: -2.55, zone: 'tower', floor: 7 },
    settings: { muted: false, music: true, camera: 1, quality: 'high' },
    savedAt: 0, saveError: null, totalSold: 0,
  };
}

const finite = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const validColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const seedExists = (id: string) => SEEDS.some(s => s.id === id);

type Additions = 'story' | 'projects' | 'crate' | 'deliveries' | 'warehouse' | 'life';
type SavedGame = Omit<GameState, Additions> & Partial<Pick<GameState, Additions>>;
function validBatch(h: unknown): h is Harvest {
  return object(h) && typeof h.id === 'string' && typeof h.strain === 'string' && seedExists(h.strain) &&
    finite(h.units, 1) && finite(h.quality, 1, 3) && Number.isInteger(h.quality);
}

/** Accept earlier v1 saves and reject corrupt saves before writing anything. */
export function validateSave(value: unknown): value is SavedGame {
  if (!object(value) || value.version !== 1) return false;
  const s = value;
  if (typeof s.started !== 'boolean' || typeof s.acknowledged !== 'boolean' ||
      typeof s.name !== 'string' || s.name.length > 24 || !validColor(s.shirt) || !validColor(s.skin) ||
      !finite(s.day, 1) || !Number.isInteger(s.day) || !finite(s.minute, 0, 1440) ||
      !finite(s.money) || !finite(s.elapsed) || !finite(s.supplies) ||
      !finite(s.savedAt) || !finite(s.totalSold)) return false;
  if (!object(s.seeds) || SEEDS.some(seed => !finite((s.seeds as Record<string, unknown>)[seed.id]))) return false;
  const projects = s.projects === undefined ? [] : s.projects;
  if (!Array.isArray(projects) || projects.some(p => p !== 'glasshouse' && p !== 'cart') ||
      new Set(projects).size !== projects.length) return false;
  if (s.deliveries !== undefined && !(finite(s.deliveries) && Number.isInteger(s.deliveries))) return false;
  if (s.warehouse !== undefined) {
    const w = s.warehouse;
    if (!object(w) || typeof w.leased !== 'boolean' || !finite(w.lastDispatchDay, 0, s.day) ||
        !Number.isInteger(w.lastDispatchDay) || (!w.leased && w.lastDispatchDay !== 0) ||
        (w.leased && projects.length === 0)) return false;
  }
  if (s.crate != null && !(projects.includes('cart') && validBatch(s.crate))) return false;
  if (!Array.isArray(s.plots) || s.plots.length !== (projects.includes('glasshouse') ? 8 : 6) || !s.plots.every((p, i) =>
    object(p) && p.id === i && (p.strain === null || (typeof p.strain === 'string' && seedExists(p.strain))) &&
    finite(p.growth, 0, 100) && finite(p.water, 0, 100) && finite(p.health, 0, 100) && typeof p.fed === 'boolean')) return false;
  if (!Array.isArray(s.harvest) || !s.harvest.every(validBatch)) return false;
  if (!Array.isArray(s.upgrades) || !s.upgrades.every(id => typeof id === 'string' && UPGRADES.some(u => u.id === id))) return false;
  if (s.life !== undefined && !validLife(s.life, s.day)) return false;
  if (!object(s.position) || !finite(s.position.x, -1000, 1000) || !finite(s.position.z, -1000, 1000) ||
      !(s.position.zone === 'tower' ? validFloor(s.position.floor) : ['rooftop', 'town', 'greenhouse', 'apartment'].includes(s.position.zone as string))) return false;
  if (!object(s.settings) || typeof s.settings.muted !== 'boolean' || typeof s.settings.music !== 'boolean' ||
      (s.settings.showHud !== undefined && typeof s.settings.showHud !== 'boolean') ||
      !finite(s.settings.camera, 0, 30) || !['low', 'high'].includes(s.settings.quality as string)) return false;
  if (!object(s.friendship) || !Object.values(s.friendship).every(v => finite(v, 0, 100)) ||
      !object(s.lastTalkDay) || !Object.values(s.lastTalkDay).every(v => finite(v, 1))) return false;
  if (!object(s.quest) || Object.keys(freshState().quest).some(k => typeof (s.quest as Record<string, unknown>)[k] !== 'boolean')) return false;
  return s.story === undefined || validateStory(s.story, s.quest.sold === true);
}

function load(): GameState {
  const initial = freshState();
  if (typeof window === 'undefined') return initial;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initial;
    const parsed: unknown = JSON.parse(raw);
    if (!validateSave(parsed)) return { ...initial, saveError: 'Your saved game could not be read. It has not been overwritten. Reset from settings to start fresh.' };
    return { ...parsed, life: parsed.life ?? initial.life, warehouse: parsed.warehouse ?? initial.warehouse, projects: parsed.projects ?? [], deliveries: parsed.deliveries ?? 0, crate: parsed.crate ?? null, story: parsed.story ?? initial.story, saveError: null };
  } catch {
    return { ...initial, saveError: 'Local save storage is unavailable or unreadable. Progress cannot be saved until browser storage is available.' };
  }
}

let state = load();
const listeners = new Set<() => void>();
let pendingTime = 0;
let sinceSave = 0;
let saveLocked = Boolean(state.saveError);
const emit = () => listeners.forEach(fn => fn());
const update = (next: GameState) => { state = next; emit(); };
const cents = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const questWith = (key: keyof GameState['quest']) => ({ ...state.quest, [key]: true });

function persist(notify = true): boolean {
  if (saveLocked) return false;
  try {
    const savedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt, saveError: null }));
    state = { ...state, savedAt, saveError: null };
    if (notify) emit();
    sinceSave = 0;
    return true;
  } catch {
    state = { ...state, saveError: 'Could not save progress. Browser storage may be full or disabled. Keep this tab open and enable storage.' };
    if (notify) emit();
    return false;
  }
}
function commit(next: GameState) {
  update(next);
  persist();
}

export function harvestValue(harvest: Harvest): number {
  return cents(harvest.units * (ECONOMY.unitPrices[harvest.quality] ?? 0.1));
}
export function formatTime(minute: number): string {
  const hours = Math.floor(minute / 60) % 24;
  return `${hours % 12 || 12}:${String(Math.floor(minute % 60)).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

export function objective(s: GameState) {
  if (s.position.zone === 'tower' && !s.quest.met) {
    const read = s.story.leaseRead;
    return { title:read?'Meet Mira on the rooftop':'The key to 7B', description:read?'Walk to the lift at the east end of the hall and choose R for the rooftop beds.':'The paper on the table in Apartment 7B is your lease. Walk up and read it.', step:0,total:8 };
  }
  const steps = [
    { key: 'met', title: 'A rooftop welcome', description: 'Find Mira and say hello. Press E or the action button near a neighbor.' },
    { key: 'bought', title: 'Seed → Soil → Your story', description: 'Walk to Seed & Signal in town and buy a fictional seed packet.' },
    { key: 'planted', title: 'Put down roots', description: 'Return to a rooftop grow bed and plant any seed.' },
    { key: 'watered', title: 'A little care goes far', description: 'Water a planted bed. Add soil nourishment for a healthier, higher-quality crop.' },
    { key: 'harvested', title: 'Your first rooftop harvest', description: 'Keep a plant hydrated until fully grown (about 90 seconds for Sunhaze), then harvest.' },
    { key: 'sold', title: 'Meet the neighborhood market', description: 'Walk to Green Exchange in town and sell your fictional harvest for virtual simSOL.' },
    { key: 'project', title: 'What will you build?', description: 'Commission the glasshouse extension or delivery cart at Green Exchange for 4 simSOL.' },
    { key: 'upgraded', title: 'Make this roof your own', description: 'Visit Rootworks and purchase a useful equipment upgrade. Keep growing if you need more simSOL.' },
  ] as const;
  const index = steps.findIndex(step => step.key === 'project' ? s.projects.length === 0 : !s.quest[step.key]);
  if (index === -1) return s.warehouse.leased
    ? { title: 'The morning freight', description: 'The warehouse takes two batches per daily freight run. Your rooftop beds and neighborhood deliveries stay open.', step: steps.length, total: steps.length }
    : { title: 'A place on the canal', description: 'Find the brick warehouse east of Green Exchange. One roof project, 250 traded units and 90 simSOL qualify you for the lease.', step: steps.length, total: steps.length };
  return { ...steps[index], step: index, total: steps.length };
}

function advancePlants(seconds: number) {
  const season = houseDate(state.day).index;
  const outdoorRate = [1, 1.12, 0.96, 0.78][season];
  return state.plots.map(plot => {
    if (!plot.strain || plot.growth >= 100) return plot;
    const seed = SEEDS.find(s => s.id === plot.strain);
    if (!seed) return plot;
    const drainage = ECONOMY.waterDrain * (state.upgrades.includes('watering') ? 0.5 : 1);
    const water = clamp(plot.water - seconds * drainage);
    const wetSeconds = Math.min(seconds, plot.water / drainage);
    const drySeconds = seconds - wetSeconds;
    const soilBoost = state.upgrades.includes('soil') ? 1.2 : 1;
    const growth = clamp(plot.growth + ((wetSeconds + drySeconds * 0.15) / seed.growSeconds) * 100 * soilBoost * (plot.id < 6 ? outdoorRate : 1));
    const health = clamp(plot.health + wetSeconds * (plot.fed ? 0.12 : 0.06) - drySeconds * 0.14, 10);
    return { ...plot, water, growth, health };
  });
}

const NPC_DIALOGUE: Record<string, string[]> = {
  mira: [
    'Welcome to the Canopy Quarter! This roof is your fresh start. Take your seeds to a bed, give them a little water, and let the city slow down.',
    'I used to carry the seed crates up from the canal two at a time. Now I write the roof number on every packet. Saves me a second trip.',
    'I can pick out 7B from the square at dusk. Yours is the last greenhouse that catches the light.',
  ],
  moss: [
    'See the dark flecks on my cuffs? Mixed a fresh batch this morning. If your roof beds could use feeding, there are soil bags at Rootworks.',
    'My Cloudburst can tends every bed at once. Less rushing, more rooftop sunsets.',
    'The living-soil system speeds things up. A good tool should give you more time to enjoy the neighborhood.',
  ],
  jun: [
    'Jun. I run Low Tide. First time down from the roof? Green Exchange buys the harvest. Come by the café after you’ve weighed in.',
    'When the last café shift runs long, I put on the Grow Room recording. Usually somebody stays to hear the end.',
    'My favorite part of closing is turning the chairs over and finding out which record the night crew left me.',
  ],
};

export const game = {
  getState: () => state,
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  start(avatar: Partial<Pick<GameState, 'name' | 'shirt' | 'skin'>> = {}): string {
    if (saveLocked) return state.saveError ?? 'Resolve the save error before starting.';
    const name = avatar.name?.trim().slice(0, 24) || state.name;
    commit({ ...state, name, shirt: validColor(avatar.shirt) ? avatar.shirt : state.shirt,
      skin: validColor(avatar.skin) ? avatar.skin : state.skin, started: true, acknowledged: true });
    return `Welcome home, ${name}. Your rooftop story starts here.`;
  },
  buySeed(id: string, quantity = 1): string {
    const seed = SEEDS.find(s => s.id === id);
    if (!seed || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return 'Choose a valid seed packet.';
    const cost = seed.price * quantity;
    if (state.money < cost) return 'Not enough virtual simSOL. Grow and sell a crop first.';
    commit({ ...state, money: cents(state.money - cost), seeds: { ...state.seeds, [id]: (state.seeds[id] ?? 0) + quantity }, quest: questWith('bought') });
    return `Bought ${quantity} ${seed.name} seed packet${quantity > 1 ? 's' : ''} for ${cost.toFixed(2)} virtual simSOL.`;
  },
  buySupply(): string {
    if (state.money < ECONOMY.supplyPrice) return 'You need 2.00 virtual simSOL for soil nourishment.';
    commit({ ...state, money: cents(state.money - ECONOMY.supplyPrice), supplies: state.supplies + 1 });
    return 'Soil nourishment added to your bag.';
  },
  plant(plotId: number, seedId: string): string {
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot || !seedExists(seedId)) return 'Choose a grow bed and seed packet.';
    if (plot.strain) return 'This bed already has a plant.';
    if (!(state.seeds[seedId] > 0)) return 'No seeds of that cultivar in your bag. Visit Seed & Signal.';
    commit({ ...state, seeds: { ...state.seeds, [seedId]: state.seeds[seedId] - 1 },
      plots: state.plots.map(p => p.id === plotId ? { ...p, strain: seedId, growth: 0, water: 0, health: state.upgrades.includes('soil') ? 75 : 50, fed: false } : p),
      quest: questWith('planted') });
    return 'Planted! Give this bed some water to help it grow.';
  },
  water(plotId: number): string {
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot?.strain) return 'Plant a seed before watering this bed.';
    const all = state.upgrades.includes('watering');
    commit({ ...state, plots: state.plots.map(p => p.strain && (all || p.id === plotId)
      ? { ...p, water: 100, health: clamp(p.health + (p.water < 75 ? 8 : 0)) } : p), quest: questWith('watered') });
    return all ? 'Cloudburst watered all your planted beds.' : 'Watered. Your plant is feeling refreshed.';
  },
  feed(plotId: number): string {
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot?.strain) return 'Plant a seed first.';
    if (plot.fed) return 'This crop already has soil nourishment.';
    if (state.supplies < 1) return 'Pick up soil nourishment at Rootworks.';
    commit({ ...state, supplies: state.supplies - 1,
      plots: state.plots.map(p => p.id === plotId ? { ...p, fed: true, health: clamp(p.health + 25) } : p) });
    return 'Soil nourished. Healthier plants earn a better virtual harvest grade.';
  },
  harvest(plotId: number): string {
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot?.strain) return 'Nothing planted in this bed yet.';
    if (plot.growth < 100) return `Still growing: ${Math.floor(plot.growth)}%. Keep it hydrated.`;
    const seed = SEEDS.find(s => s.id === plot.strain)!;
    const quality = plot.health >= 80 ? 3 : plot.health >= 60 ? 2 : 1;
    const units = Math.max(1, Math.round(seed.baseYield * (0.6 + plot.health / 100) * (state.upgrades.includes('beds') ? 1.4 : 1)));
    const batch: Harvest = { id: `crop-${Date.now()}-${plotId}-${state.elapsed}`, strain: seed.id, units, quality };
    commit({ ...state, harvest: [...state.harvest, batch],
      plots: state.plots.map(p => p.id === plotId ? { ...p, strain: null, growth: 0, water: 0, health: 50, fed: false } : p),
      quest: questWith('harvested') });
    return `Harvested ${units} fictional $POTIFY harvest units · grade ${quality}/3. Visit Green Exchange to sell.`;
  },
  sellAll(): string {
    if (!state.harvest.length) return 'Your harvest bag is empty. Grow a crop first.';
    const value = cents(state.harvest.reduce((sum, h) => sum + harvestValue(h), 0));
    const units = state.harvest.reduce((sum, h) => sum + h.units, 0);
    commit({ ...state, harvest: [], money: cents(state.money + value), totalSold: state.totalSold + units, quest: questWith('sold') });
    return `Sold ${units} fictional harvest units for ${value.toFixed(2)} virtual simSOL. No real money or tokens exchanged.`;
  },
  buildProject(id: RoofProject): string {
    if (!Object.hasOwn(PROJECTS, id)) return 'Unknown roof project.';
    if (!state.quest.sold) return 'Sell your first rooftop harvest at Green Exchange.';
    if (state.projects.includes(id)) return 'Already built on your roof.';
    const cost = projectPrice(state.projects.length);
    if (state.money < cost) return `You need ${cost} simSOL for this job.`;
    const plots = id === 'glasshouse' ? [...state.plots, emptyPlot(6), emptyPlot(7)] : state.plots;
    commit({ ...state, plots, money: cents(state.money - cost), projects: [...state.projects, id] });
    return `${PROJECTS[id].name} is ready on Roof 7B.`;
  },
  leaseWarehouse(): string {
    if (state.warehouse.leased) return 'Warehouse already leased.';
    if (!state.projects.length || state.totalSold < WAREHOUSE.minimumUnits || state.money < WAREHOUSE.price) {
      return 'You need one roof project, 250 traded units and 90 simSOL for the lease.';
    }
    commit({ ...state, money: cents(state.money - WAREHOUSE.price), warehouse: { leased: true, lastDispatchDay: 0 } });
    return 'The shutter is open. Your packing bench is inside.';
  },
  dispatchFreight(): string {
    if (!state.warehouse.leased) return 'Lease the warehouse first.';
    if (state.warehouse.lastDispatchDay === state.day) return 'The freight run already left today.';
    if (state.harvest.length < 2) return 'You need two harvested batches for the freight run.';
    const [one, two, ...remaining] = state.harvest;
    const payout = cents(harvestValue(one) + harvestValue(two) + WAREHOUSE.dispatchFee);
    commit({ ...state, harvest: remaining, money: cents(state.money + payout),
      totalSold: state.totalSold + one.units + two.units,
      warehouse: { leased: true, lastDispatchDay: state.day } });
    return `Two loads dispatched. Earned ${payout.toFixed(2)} simSOL.`;
  },
  packCrate(): string {
    if (!state.projects.includes('cart')) return 'Build the delivery cart first.';
    if (state.crate) return 'A crate is already packed.';
    const [batch, ...harvest] = state.harvest;
    if (!batch) return 'Your harvest bag is empty.';
    commit({ ...state, harvest, crate: batch });
    return `Crate packed for ${DELIVERY_STOPS[state.deliveries % DELIVERY_STOPS.length].name}.`;
  },
  deliverCrate(shop: string): string {
    const batch = state.crate;
    if (!batch) return 'Pack a harvest at the rooftop cart first.';
    const stop = DELIVERY_STOPS[state.deliveries % DELIVERY_STOPS.length];
    if (stop.shop !== shop) return `This crate belongs at ${stop.name}.`;
    const payment = cents(harvestValue(batch) + 5);
    commit({ ...state, crate: null, deliveries: state.deliveries + 1,
      totalSold: state.totalSold + batch.units, money: cents(state.money + payment) });
    return `Delivery signed for. Earned ${payment.toFixed(2)} simSOL.`;
  },
  buyUpgrade(id: string): string {
    const upgrade = UPGRADES.find(u => u.id === id);
    if (!upgrade) return 'Choose a valid upgrade.';
    if (state.upgrades.includes(id)) return 'You already own this upgrade.';
    if (state.money < upgrade.price) return `You need ${upgrade.price.toFixed(2)} virtual simSOL. Keep growing!`;
    const quest = questWith('upgraded');
    const complete = quest.met && quest.bought && quest.planted && quest.watered && quest.harvested && quest.sold && !quest.rewarded;
    if (complete) quest.rewarded = true;
    commit({ ...state, money: cents(state.money - upgrade.price + (complete ? ECONOMY.upgradeReward : 0)),
      upgrades: [...state.upgrades, id], quest });
    return `${upgrade.name} installed!${complete ? ' First-day story complete: +15.00 virtual simSOL neighborhood grant.' : ''}`;
  },
  talk(npcId: string): string {
    const id = npcId.toLowerCase();
    const lines = NPC_DIALOGUE[id];
    if (!lines) return 'The neighborhood is glad you are here.';
    const already = state.lastTalkDay[id] === state.day;
    const friendship = state.friendship[id] ?? 0;
    const line = lines[Math.floor(friendship / 10) % lines.length];
    commit({ ...state, friendship: { ...state.friendship, [id]: clamp(friendship + (already ? 0 : 10)) },
      lastTalkDay: { ...state.lastTalkDay, [id]: state.day }, quest: id === 'mira' ? questWith('met') : state.quest });
    return `${line}${already ? ' Come say hello again tomorrow.' : ' (+10 friendship)'}`;
  },
  readStoryItem(item: StoryItem): void {
    if (saveLocked) return;
    const story = readStory(state.story, item);
    if (story !== state.story) commit({ ...state, story });
  },
  chooseStoryReply(resident: Resident, id: ChoiceId) {
    if (saveLocked) return null;
    const change = chooseStory(state.story, resident, id, state.quest.sold);
    if (!change) return null;
    const next = { ...state, story: change.story };
    switch (change.reward) {
      case 'latch': next.supplies += 1; break;
      case 'signal': next.money = cents(next.money + 3); break;
      case 'ledger': next.seeds = { ...next.seeds, moonmint: next.seeds.moonmint + 1 }; break;
    }
    commit(next);
    return { message: change.message, reply: change.reply };
  },
  visitNeighbor(id: Neighbor): string {
    const { life, position, day, minute } = state;
    if (!NEIGHBORS.includes(id) || position.zone !== 'tower') return '';
    if (position.floor !== meetingFloor(id,day,minute,life.partner)) return '';
    const person = PEOPLE[id];
    const visits = life.visits[id];
    if (life.lastVisit[id] !== day) {
      commit({ ...state, life: { ...life, visits: { ...life.visits, [id]: visits + 1 }, lastVisit: { ...life.lastVisit, [id]: day } } });
    }
    return life.partner === id ? person.together : person.lines[Math.min(state.life.visits[id] - 1, 2)];
  },
  shareMoment(id: Neighbor, choice: 0 | 1): boolean {
    const { life, position, minute, day } = state;
    if (!NEIGHBORS.includes(id) || (choice !== 0 && choice !== 1) || life.visits[id] < 3 || life.lastVisit[id] !== day ||
        Object.hasOwn(life.moments,id) || position.zone !== 'tower' || position.floor !== meetingFloor(id,day,minute,life.partner)) return false;
    commit({ ...state, life: { ...life, moments: { ...life.moments, [id]: choice } } });
    return true;
  },
  invitePartner(id: Neighbor): boolean {
    const { life, day, position, minute } = state;
    if (!NEIGHBORS.includes(id) || life.partner || life.visits[id] < 5 || !Object.hasOwn(life.moments,id) || life.lastVisit[id] !== day ||
        position.zone !== 'tower' || position.floor !== meetingFloor(id,day,minute,life.partner)) return false;
    commit({ ...state, life: { ...life, partner: id, partneredDay: day } });
    return true;
  },
  celebrate(choice: 0 | 1): boolean {
    const date = houseDate(state.day);
    if ((choice !== 0 && choice !== 1) || !date.active || state.position.zone !== 'tower' ||
        state.position.floor !== date.festival.floor || Object.hasOwn(state.life.festivals, date.key)) return false;
    commit({ ...state, life: { ...state.life, festivals: { ...state.life.festivals, [date.key]: choice } } });
    return true;
  },
  openArchive(): boolean {
    if (state.position.zone !== 'tower' || state.position.floor !== 18 || state.life.visits.jax < 3 || state.life.archiveOpen) return false;
    commit({ ...state, life: { ...state.life, archiveOpen: true }, seeds: { ...state.seeds, moonmint: state.seeds.moonmint + 1 } });
    return true;
  },
  restoreCommons(use: 'seeds' | 'tapes'): boolean {
    const {life,position,day} = state;
    if ((use !== 'seeds' && use !== 'tapes') || life.commons || position.zone !== 'tower' || position.floor !== 21 ||
      day < 41 || Object.keys(life.festivals).length < 2 || !NEIGHBORS.some(id=>life.visits[id]>=3)) return false;
    commit({...state,life:{...life,commons:use}});
    return true;
  },
  takeCommonsSeed(): boolean {
    const cycle=Math.floor((state.day-1)/10);
    if (state.position.zone !== 'tower' || state.position.floor !== 21 || state.life.commons!=='seeds' || state.life.seedSeason===cycle) return false;
    const seed=SEEDS[cycle % SEEDS.length].id;
    commit({...state,seeds:{...state.seeds,[seed]:state.seeds[seed]+1},life:{...state.life,seedSeason:cycle}});
    return true;
  },
  welcomeChild(rawName: string): boolean {
    const { position, life, day } = state;
    const name = rawName.trim().slice(0,24);
    if (!name || !life.partner || life.child || day < life.partneredDay + 40 || position.zone !== 'tower' || position.floor !== 7) return false;
    commit({ ...state, life: { ...life, child: { name, arrival: day, lastDay: 0, interests: { Music: 0, Cooking: 0, Making: 0 } } } });
    return true;
  },
  familyTime(pastime: Pastime): boolean {
    const c = state.life.child;
    if (!c || c.lastDay === state.day || childStage(state.day, c.arrival) === 'Grown up' || !PASTIMES.includes(pastime) ||
        state.position.zone !== 'tower' || state.position.floor !== 7) return false;
    commit({ ...state, life: { ...state.life, child: { ...c, lastDay: state.day, interests: { ...c.interests, [pastime]: c.interests[pastime] + 1 } } } });
    return true;
  },
  sleep(): string {
    const plants = advancePlants(60);
    commit({ ...state, plots: plants, day: state.day + 1, minute: 480, elapsed: state.elapsed + 60 });
    return `Good morning! Day ${state.day}. Your plants had a little time to grow overnight.`;
  },
  customize(avatar: Partial<Pick<GameState, 'name' | 'shirt' | 'skin'>>): string {
    commit({ ...state, name: avatar.name?.trim().slice(0, 24) || state.name,
      shirt: validColor(avatar.shirt) ? avatar.shirt : state.shirt,
      skin: validColor(avatar.skin) ? avatar.skin : state.skin });
    return 'Looking good. Your character has been updated.';
  },
  setSettings(settings: Partial<Settings>): string {
    const next = { ...state.settings, ...settings };
    if (!finite(next.camera, 0, 30)) next.camera = state.settings.camera;
    commit({ ...state, settings: next });
    return 'Settings updated.';
  },
  setPosition(position: GameState['position']): void {
    if (!finite(position.x, -1000, 1000) || !finite(position.z, -1000, 1000) ||
      !(position.zone === 'tower' ? validFloor(position.floor) : ['town', 'rooftop', 'greenhouse', 'apartment'].includes(position.zone))) return;
    if (position.x === state.position.x && position.z === state.position.z && position.zone === state.position.zone && position.floor === state.position.floor) return;
    update({ ...state, position: { ...position } });
  },
  tick(deltaSeconds: number): void {
    if (!state.started || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    // Ignore background-tab catch-up and smooth 3D frame deltas into 4Hz state updates.
    pendingTime += Math.min(deltaSeconds, 0.25);
    if (pendingTime < 0.25) return;
    const dt = pendingTime;
    pendingTime = 0;
    const minute = state.minute + dt * (1440 / ECONOMY.daySeconds);
    state = { ...state, elapsed: state.elapsed + dt, minute: minute % 1440,
      day: state.day + Math.floor(minute / 1440), plots: advancePlants(dt) };
    sinceSave += dt;
    if (sinceSave >= ECONOMY.saveInterval) persist(false);
    emit();
  },
  save(): string {
    return persist() ? 'Game saved on this browser.' : (state.saveError ?? 'Saving is unavailable.');
  },
  reset(): string {
    try { localStorage.removeItem(SAVE_KEY); } catch { return 'Could not clear browser storage. Your game has not been reset.'; }
    saveLocked = false;
    pendingTime = 0;
    sinceSave = 0;
    update(freshState());
    return 'A fresh rooftop story is ready. Your previous local game was cleared.';
  },
};

export function useGame(): GameState {
  return useSyncExternalStore(game.subscribe, game.getState, game.getState);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { if (state.started) persist(false); });
  document.addEventListener('visibilitychange', () => {
    pendingTime = 0;
    if (document.visibilityState === 'hidden' && state.started) persist(false);
  });
}
