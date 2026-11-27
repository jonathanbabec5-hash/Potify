import { validFourthMug, type FourthMugMemory } from './fourthMug.ts';

export const TOP_FLOOR = 24;
export const STOREY = 3.6;
export const STAIR_START = 1;
export const TURN = -3.7;
export const DIVIDER = 5.45;
export const FLOOR_NAMES: Record<number, string> = {
  1: 'Night desk',
  4: 'Common kitchen',
  7: 'Apartment 7B',
  12: 'Listening room',
  18: 'Repair archive',
  21: 'Residents’ commons',
  24: 'Sky garden',
};
export function floorName(floor: number) {
  return FLOOR_NAMES[floor] ?? 'Residential landing';
}
export function validFloor(floor: unknown): floor is number {
  return typeof floor === 'number' && Number.isInteger(floor) && floor >= 1 && floor <= TOP_FLOOR;
}

export function stairHeight(x: number, z: number) {
  if (x < 2.75 || z >= STAIR_START) return 0;
  const fraction = Math.max(0, Math.min(1, (STAIR_START - z) / (STAIR_START - TURN)));
  return ((x > DIVIDER ? fraction : 2 - fraction) * STOREY) / 2;
}

// The left-hand flight meets the next floor at the hall. The right-hand flight
// meets the current floor. Both share a half-height landing at the far window.
export function crossing(x: number, fromZ: number, toZ: number) {
  if (x < 2.75 || x >= DIVIDER) return 0;
  if (fromZ >= STAIR_START && toZ < STAIR_START) return -1;
  if (fromZ < STAIR_START && toZ >= STAIR_START) return 1;
  return 0;
}

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
export const FESTIVALS = [
  {
    title: 'Spring Bloom Fest',
    floor: 24,
    color: '#aac48d',
    detail: 'Rowan has coaxed the last winter bulbs into bloom. There are two empty spots facing the canal.',
    choices: ['Plant the pale bells', 'Plant the red cups'],
    memories: ['Pale bells lined the canal rail.', 'Red cups caught the last light.'],
  },
  {
    title: 'Summer Sunrise Jam',
    floor: 12,
    color: '#e0b85f',
    detail:
      'Someone has left a contact mic on the radiator. The pipes are humming in D. Jax gives you the first bar.',
    choices: ['Tap a brass rhythm', 'Play the river melody'],
    memories: ['The whole floor kept time on the pipes.', 'The river melody made it onto the house tape.'],
  },
  {
    title: 'Autumn Harvest Fest',
    floor: 4,
    color: '#cf855a',
    detail:
      'Tessa has the first pot of stew ready. Some of the growers are still upstairs bringing in the last cut. “Can you give me a hand before it gets cold?”',
    choices: ['Set a long table', 'Pack bowls for late shifts'],
    memories: [
      'Dinner stretched all the way to the lift.',
      'The night crew found warm bowls at their doors.',
    ],
  },
  {
    title: 'Winter Repair Fair',
    floor: 18,
    color: '#8fabc0',
    detail:
      'On the workbench lie a crooked desk lamp and the lobby bell. Both have been waiting since last winter.',
    choices: ['Mend the lamp', 'Tune the bell'],
    memories: [
      'The old desk lamp glowed amber again.',
      'The lobby bell rang clearly for the first time in years.',
    ],
  },
] as const;
export function houseDate(day: number) {
  const index = Math.floor((day - 1) / 10) % 4;
  const date = ((day - 1) % 10) + 1;
  const year = Math.floor((day - 1) / 40) + 1;
  return {
    year,
    date,
    index,
    season: SEASONS[index],
    festival: FESTIVALS[index],
    active: date >= 4 && date <= 6,
    key: String(Math.floor((day - 1) / 10)),
  };
}

export const PEOPLE = {
  tessa: {
    name: 'Tessa Bloom',
    role: 'Innkeeper',
    shirt: '#9e7350',
    skin: '#ab765c',
    hair: '#47392f',
    job: 1,
    rest: 4,
    lines: [
      'You must be the new grower in 7B. I put a clean mug in the kitchen on four for you. Last person through makes the next pot.',
      'When I got here I could tell who was home by the sound of the lift. It needed oil. I let it squeak for another week.',
      'There’s a mug up there with your name on it. Written underneath. Didn’t want to make a whole thing of it.',
    ],
    together: 'I still turn two mugs right-side up before the kettle boils. I like that I get to do that.',
  },
  jax: {
    name: 'Jax Quarry',
    role: 'Building mechanic',
    shirt: '#66787d',
    skin: '#a98265',
    hair: '#58453c',
    job: 18,
    rest: 12,
    lines: [
      'That dent in my toolbox is from hauling greenhouse glass up twenty-four flights. First thing I fixed after that was the lift.',
      'See that worn patch? My dad rested his thumb there when he taught me to solder. I reach for the very same spot.',
      'I made you a key for the archive cabinet. The old roof plans survived a leak because somebody stored them in a biscuit tin.',
    ],
    together:
      'Hear that? Just the fridge and the rain on the sill. Took me years to get this place that quiet.',
  },
  rowan: {
    name: 'Rowan Pike',
    role: 'Rival rooftop grower',
    shirt: '#65784d',
    skin: '#bd9176',
    hair: '#473d39',
    job: 24,
    rest: 4,
    lines: [
      'So you’ve got 7B. Good. I’ve been trying to settle an argument about which roof gets the last light. Come up to the rail one evening.',
      'My first Moonmint up here barely filled the jar. I still wrote the date on the lid. I like knowing where I started.',
      'Left the window seat free for you. Best part of this roof comes after the work is finished.',
    ],
    together:
      'Your keys in the bowl, my boots in the way. I spent half my life trying to grow a place that felt like this.',
  },
} as const;
export type Neighbor = keyof typeof PEOPLE;
export const NEIGHBORS = Object.keys(PEOPLE) as Neighbor[];
export function residentFloor(id: Neighbor, minute: number) {
  return minute >= 420 && minute < 1080 ? PEOPLE[id].job : PEOPLE[id].rest;
}
export function meetingFloor(id: Neighbor, day: number, minute: number, partner: Neighbor | null) {
  const date = houseDate(day);
  const start = date.index === 1 ? 360 : 600;
  if (date.active && minute >= start && minute < start + 240) return date.festival.floor;
  if (id === partner && (minute >= 1080 || minute < 420)) return 7;
  return residentFloor(id, minute);
}
export function residentX(id: Neighbor) {
  return id === 'tessa' ? -6.3 : id === 'jax' ? -3.8 : -1.5;
}

export const PASTIMES = ['Music', 'Cooking', 'Making'] as const;
export type Pastime = (typeof PASTIMES)[number];
export interface HouseLife {
  visits: Record<Neighbor, number>;
  lastVisit: Record<Neighbor, number>;
  partner: Neighbor | null;
  partneredDay: number;
  child: { name: string; arrival: number; lastDay: number; interests: Record<Pastime, number> } | null;
  commons: 'seeds' | 'tapes' | null;
  seedSeason: number;
  archiveOpen: boolean;
  moments: Partial<Record<Neighbor, 0 | 1>>;
  festivals: Record<string, 0 | 1>;
  fourthMug?: FourthMugMemory;
}
export function freshLife(): HouseLife {
  return {
    visits: { tessa: 0, jax: 0, rowan: 0 },
    lastVisit: { tessa: 0, jax: 0, rowan: 0 },
    partner: null,
    partneredDay: 0,
    child: null,
    commons: null,
    seedSeason: -1,
    archiveOpen: false,
    moments: {},
    festivals: {},
  };
}
export function childStage(day: number, arrival: number) {
  const years = Math.floor((day - arrival) / 40);
  return years < 2
    ? 'Little one'
    : years < 6
      ? 'Curious kid'
      : years < 13
        ? 'School years'
        : years < 18
          ? 'Teen years'
          : 'Grown up';
}
export function favorite(interests: Record<Pastime, number>) {
  return PASTIMES.reduce((a, b) => (interests[b] > interests[a] ? b : a));
}
export function validLife(value: unknown, day: number): value is HouseLife {
  if (!value || typeof value !== 'object') return false;
  const s = value as HouseLife;
  const count = (n: unknown, max = day) =>
    typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max;
  if (
    !s.moments ||
    typeof s.moments !== 'object' ||
    Array.isArray(s.moments) ||
    !Object.entries(s.moments).every(
      ([id, choice]) => NEIGHBORS.includes(id as Neighbor) && (choice === 0 || choice === 1),
    )
  )
    return false;
  if (
    !(s.commons === null || s.commons === 'seeds' || s.commons === 'tapes') ||
    !Number.isSafeInteger(s.seedSeason) ||
    s.seedSeason < -1 ||
    s.seedSeason > Math.floor((day - 1) / 10) ||
    (s.seedSeason >= 0 && s.commons !== 'seeds')
  )
    return false;
  if (typeof s.archiveOpen !== 'boolean') return false;
  if (
    !s.visits ||
    !s.lastVisit ||
    !NEIGHBORS.every((id) => count(s.visits[id]) && count(s.lastVisit[id]) && s.visits[id] <= s.lastVisit[id])
  )
    return false;
  if (
    !(s.partner === null || NEIGHBORS.includes(s.partner)) ||
    !count(s.partneredDay) ||
    !!s.partner !== !!s.partneredDay
  )
    return false;
  if (
    !s.festivals ||
    typeof s.festivals !== 'object' ||
    Array.isArray(s.festivals) ||
    !Object.entries(s.festivals).every(
      ([key, v]) => /^(0|[1-9]\d*)$/.test(key) && +key <= Math.floor((day - 1) / 10) && (v === 0 || v === 1),
    )
  )
    return false;
  if (!validFourthMug(s.fourthMug, s.festivals, day)) return false;
  const c = s.child;
  return (
    c === null ||
    Boolean(
      s.partner &&
      c &&
      typeof c.name === 'string' &&
      c.name.trim() &&
      c.name.length <= 24 &&
      count(c.arrival) &&
      c.arrival >= s.partneredDay &&
      count(c.lastDay) &&
      c.interests &&
      PASTIMES.every((p) => count(c.interests[p])),
    )
  );
}

export const FRIEND_SCENES = {
  tessa: {
    title: 'The last place setting',
    detail:
      'Supper is over. Tessa puts out one more plate. “My brother worked nights. Forty years of setting this out and now the habit feels like a person.” She waits with her hand on the chair.',
    answers: ['Sit with her a while', 'Set a second late plate'],
    replies: [
      'You sat until the kettle clicked cold. Tessa never asked you to fill the silence.',
      'You wrote NIGHT SHIFT on the napkin. By morning both plates were clean.',
    ],
  },
  jax: {
    title: 'The second knock',
    detail:
      'Jax is holding a tin against the heating pipe. Two knocks come back. “We used to say goodnight that way before we could afford the phones. Somebody on sixteen still remembers.”',
    answers: ['Knock goodnight', 'Record the reply'],
    replies: [
      'Two soft knocks, a pause, two more. Jax gives you the tin to take home.',
      'On the tape you can just hear him laughing between the knocks. He asks for a copy.',
    ],
  },
  rowan: {
    title: 'One yellow leaf',
    detail:
      'Rowan pulls a frame from behind the radiator. There really is a leaf inside. “This was the year my dad got sick. I kept one thing alive up here. Seems silly to give it a prize.”',
    answers: ['Hang it by the sky garden', 'Keep it between you'],
    replies: [
      'Nobody laughed at the single leaf. Someone left a tiny blue ribbon by the frame.',
      'The frame went back by the radiator. Rowan left a second chair beside it.',
    ],
  },
} as const;
