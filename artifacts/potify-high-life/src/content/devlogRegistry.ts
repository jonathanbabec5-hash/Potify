export type PublicStatus = 'Concept' | 'In Development' | 'Verified Playable';

export interface RegistryEntry {
  id: string;
  title: string;
  detail: string;
  status: PublicStatus;
}

export interface RegistrySection {
  id: string;
  title: string;
  intro: string;
  entries: RegistryEntry[];
}

const inDev: PublicStatus = 'In Development';
const concept: PublicStatus = 'Concept';

/** Public selection only; exact secret triggers and unreleased story details stay private. */
export const devlogSections: RegistrySection[] = [
  {
    id: 'ROOT',
    title: 'Game identity and boundaries',
    intro: 'A quiet, original neighborhood life sim with clearly fictional growing and currency systems.',
    entries: [
      { id: 'ROOT-001', title: 'A rooftop life above the Canopy Quarter', detail: 'A small start, familiar faces and work done at an unhurried pace.', status: inDev },
      { id: 'ROOT-002', title: 'Seed → Soil → Solana', detail: 'The world’s motto; in-game balances remain an offline simulation.', status: inDev },
      { id: 'ROOT-003', title: 'Original world, original cast', detail: 'An homage to early-2000s 3D farming rhythms, never a copy of another game’s assets or characters.', status: inDev },
    ],
  },
  {
    id: 'ART',
    title: 'Visual direction',
    intro: 'Warm light, weathered materials and a small city with signs of everyday life.',
    entries: [
      { id: 'ART-001', title: 'An earthy, early-2000s 3D sensibility', detail: 'Muted olive, soil brown, faded timber and cloudy blue are the approved direction.', status: inDev },
      { id: 'ART-002', title: 'A lived-in rooftop greenhouse', detail: 'Handmade growing spaces and ordinary city details anchor the scene.', status: inDev },
      { id: 'ART-003', title: 'Weather and the hour change the mood', detail: 'Golden afternoons and gray mornings are part of the visual target.', status: concept },
    ],
  },
  {
    id: 'GEO',
    title: 'Geography',
    intro: 'A walkable home roof opens onto the Canopy Quarter and its neighborhood streets.',
    entries: [
      { id: 'GEO-001', title: 'Six beds on a modest roof', detail: 'A compact home plot is the starting point for the current 3D prototype.', status: inDev },
      { id: 'GEO-002', title: 'The Canopy Quarter', detail: 'A short walk links the roof, shops and central square.', status: inDev },
      { id: 'GEO-003', title: 'A natural edge beyond the blocks', detail: 'A quieter rural boundary is a later world-expansion idea.', status: concept },
    ],
  },
  {
    id: 'VEN',
    title: 'Venues',
    intro: 'Neighborhood places have different purposes, regulars and rhythms.',
    entries: [
      { id: 'VEN-001', title: 'Seed & Signal', detail: 'The seed counter is part of the first-day route.', status: inDev },
      { id: 'VEN-002', title: 'Rootworks and Green Exchange', detail: 'Supplies and fictional crop sales belong to places in the world.', status: inDev },
      { id: 'VEN-003', title: 'Petri & Pistil Lab and Low Tide Cafe', detail: 'Research notes and local music give the block room to grow.', status: inDev },
    ],
  },
  {
    id: 'TIME',
    title: 'Daily time and seasons',
    intro: 'A relaxed clock makes room for morning errands, late conversations and a reason to sleep.',
    entries: [
      { id: 'TIME-001', title: 'A day-night clock', detail: 'The prototype has an in-game clock that changes its 3D lighting.', status: inDev },
      { id: 'TIME-002', title: 'Sleep to start a new morning', detail: 'A home bed advances the local game day.', status: inDev },
      { id: 'TIME-003', title: 'Four changing seasons', detail: 'Seasonal weather, storefronts and routines remain planned work.', status: concept },
    ],
  },
  {
    id: 'GROW',
    title: 'Virtual cultivation and genetics',
    intro: 'Plant care is simplified fictional game logic, not real-world growing guidance.',
    entries: [
      { id: 'GROW-001', title: 'Plant, tend, watch and harvest', detail: 'Crop stages and care actions are implemented in the simulation model.', status: inDev },
      { id: 'GROW-002', title: 'Soil, moisture and plant health', detail: 'Attention changes growth pace and the fictional harvest grade.', status: inDev },
      { id: 'GROW-003', title: 'Earned cultivar discoveries', detail: 'Genetics with different fictional traits are a future progression system.', status: concept },
    ],
  },
  {
    id: 'ITEM',
    title: 'Items and tools',
    intro: 'Useful things should be felt in the world, not only counted in a menu.',
    entries: [
      { id: 'ITEM-001', title: 'Starter seed packets', detail: 'Three fictional cultivars can be planted in the current model.', status: inDev },
      { id: 'ITEM-002', title: 'Watering and soil nourishment', detail: 'Two basic care actions affect simulated crops.', status: inDev },
      { id: 'ITEM-003', title: 'Upgraded beds, care and soil', detail: 'Three gameplay upgrades change the grow loop.', status: inDev },
    ],
  },
  {
    id: 'ECON',
    title: 'Fictional economy',
    intro: 'All balances and exchanges are local game mechanics with no external value.',
    entries: [
      { id: 'ECON-001', title: 'simSOL is play money', detail: 'Nontransferable in-game currency only; no real SOL, wallet or cash-out.', status: inDev },
      { id: 'ECON-002', title: 'Virtual POTIFY harvest units', detail: 'A fictional inventory measurement, not the fungible $POTIFY token or real cannabis.', status: inDev },
      { id: 'ECON-003', title: 'Care makes a difference', detail: 'Fictional grade changes simulated market value; no investment or return claims.', status: inDev },
    ],
  },
  {
    id: 'NPC',
    title: 'NPCs and relationships',
    intro: 'The people who live here have their own work, words and reasons to come back.',
    entries: [
      { id: 'NPC-001', title: 'Mira at Seed & Signal', detail: 'A neighbor who welcomes new growers and knows the quarter’s stories.', status: inDev },
      { id: 'NPC-002', title: 'Moss at Rootworks', detail: 'A soil-minded shopkeeper whose practical advice has a poetic streak.', status: inDev },
      { id: 'NPC-003', title: 'Jun and the Low Tide radio', detail: 'An archivist-musician with changing lines and a growing friendship.', status: inDev },
      { id: 'NPC-004', title: 'Shylo, an occasional neighborhood companion', detail: 'A Norwegian Elkhound in a few quiet moments, never the center of the story.', status: concept },
    ],
  },
  {
    id: 'LORE',
    title: 'Chronicles lore',
    intro: 'The city’s history is best found in old objects and unfinished conversations.',
    entries: [
      { id: 'LORE-001', title: 'Book I — The First Cycle', detail: 'The beginning of the neighborhood’s original Chronicles.', status: inDev },
      { id: 'LORE-002', title: 'Book II — The Soil Remembers', detail: 'A second title appears in the world’s public lore.', status: concept },
      { id: 'LORE-003', title: 'The plant-doctor perspective', detail: 'A future educational theme about observation and care, kept fictional and non-instructional.', status: concept },
    ],
  },
  {
    id: 'QUEST',
    title: 'Quests',
    intro: 'Small requests give everyday routines a personal reason.',
    entries: [
      { id: 'QUEST-001', title: 'First-day neighbor welcome', detail: 'Meet Mira and take the first steps on the roof.', status: inDev },
      { id: 'QUEST-002', title: 'A useful first improvement', detail: 'Earn enough virtual simSOL for an upgrade that changes play.', status: inDev },
      { id: 'QUEST-003', title: 'Seasonal errands and local favors', detail: 'Short quests tied to weather, days and relationships are planned.', status: concept },
    ],
  },
  {
    id: 'EGG',
    title: 'Subtle Easter eggs',
    intro: 'Small things in the neighborhood may reward players who take their time.',
    entries: [
      { id: 'EGG-001', title: 'An old book in a quiet corner', detail: 'A missing-page story is waiting to be noticed.', status: concept },
      { id: 'EGG-002', title: 'A clock with a curious reputation', detail: 'Someone in town insists it has never quite kept good time.', status: concept },
      { id: 'EGG-003', title: 'Seven understated packet labels', detail: 'The labels share a family resemblance, but their connection is left for curious players to notice.', status: concept },
      { id: 'EGG-004', title: 'Old media, local music and a strange van', detail: 'A tape and a vehicle that does not quite fit the street have both been mentioned around town.', status: concept },
      { id: 'EGG-005', title: 'Weathered marks and quiet paths', detail: 'Faint city symbols and overlooked routes may reward a slower walk.', status: concept },
    ],
  },
  {
    id: 'SYS',
    title: 'Controls and UX',
    intro: 'The game should remain legible on a phone without hiding the world.',
    entries: [
      { id: 'SYS-001', title: 'Walk and interact in 3D', detail: 'Keyboard and on-screen touch controls are part of the prototype.', status: inDev },
      { id: 'SYS-002', title: 'Inventory, goals and calendar', detail: 'In-game references are designed to stay lightweight and contextual.', status: inDev },
      { id: 'SYS-003', title: 'Mobile-first readability', detail: 'Performance and comfortable touch targets remain an active quality goal.', status: inDev },
    ],
  },
  {
    id: 'SOC',
    title: 'Festivals and social features',
    intro: 'Shared neighborhood traditions can make the calendar feel lived in.',
    entries: [
      { id: 'SOC-001', title: 'A changing community noticeboard', detail: 'Small updates and optional errands can give familiar streets new texture.', status: concept },
      { id: 'SOC-002', title: 'Seasonal gathering days', detail: 'Future local events are planned as fictional social moments.', status: concept },
      { id: 'SOC-003', title: 'Friendship that takes time', detail: 'Current relationships grow through conversations; richer story arcs are planned.', status: inDev },
    ],
  },
  {
    id: 'AUDIO',
    title: 'Audio and marketing',
    intro: 'The soundscape belongs to the neighborhood and its quieter hours.',
    entries: [
      { id: 'AUDIO-001', title: 'A soft rooftop radio', detail: 'Original in-game music can be toggled from settings.', status: inDev },
      { id: 'AUDIO-002', title: 'Small sounds for everyday actions', detail: 'Movement and interactions use light synthesized effects.', status: inDev },
      { id: 'AUDIO-003', title: 'Concept imagery stays labeled', detail: 'Any teaser stays marked as in development until its claims are verified.', status: inDev },
    ],
  },
  {
    id: 'TECH',
    title: 'Architecture and QA',
    intro: 'A small browser game is being built to keep the world easy to iterate on.',
    entries: [
      { id: 'TECH-001', title: 'Three.js with React Three Fiber', detail: 'The existing 3D scene uses a browser-based renderer.', status: inDev },
      { id: 'TECH-002', title: 'A versioned local save', detail: 'Progress is saved in this browser; corrupt saves are reported rather than silently replaced.', status: inDev },
      { id: 'TECH-003', title: 'Core-loop and reload checks', detail: 'Model-level checks exist; full browser playtesting remains distinct from those checks.', status: inDev },
    ],
  },
  {
    id: 'PUB',
    title: 'Community and build in public',
    intro: 'This page is a selective, spoiler-safe view of development, not the private world bible.',
    entries: [
      { id: 'PUB-001', title: '18 public design categories', detail: 'A public selection from a larger 469-entry, 18-category planning bible; this is not a count of shipped features.', status: inDev },
      { id: 'PUB-002', title: '51 discovery ideas in the private plan', detail: 'Only broad hints are public; exact triggers, coordinates and solutions stay out of this page.', status: concept },
      { id: 'PUB-003', title: 'A place to share grounded feedback', detail: 'Day length, farm tools and NPC routines are the most useful questions right now.', status: inDev },
    ],
  },
  {
    id: 'ROAD',
    title: 'Roadmap',
    intro: 'A direction for future work, not a promise that every system already exists.',
    entries: [
      { id: 'ROAD-001', title: 'Weather, seasons and a longer first week', detail: 'A slower farming calendar is planned after the prototype loop is stable.', status: concept },
      { id: 'ROAD-002', title: 'A deeper town and more personal stories', detail: 'Additional shops, schedules and relationship arcs can build on the current neighborhood.', status: concept },
      { id: 'ROAD-003', title: 'Secrets and optional places', detail: 'Discoveries can grow through objects and hidden paths without revealing their solutions here.', status: concept },
    ],
  },
];

export const devlogChangelog = [
  {
    date: '2026-11-04',
    version: 'v0.1 · First rooftop build',
    title: 'The first rooftop build',
    body: 'A locally saved 3D neighborhood prototype began taking shape around a small rooftop grow loop. In-world controls and the complete browser play path still need hands-on verification.',
    status: 'In Development' as const,
  },
];

export const devlogDisclosure =
  'This is a fictional adult-themed simulation. simSOL is nontransferable in-game money with no real value. Virtual POTIFY harvest units are not the real $POTIFY token and do not represent real cannabis. There are no wallet transactions, real-world cannabis sales, cash-outs, or live crypto rewards.';
