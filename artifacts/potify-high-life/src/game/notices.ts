import { houseDate } from './house.ts';
import { DELIVERY_STOPS, WAREHOUSE, projectPrice, type GameState } from './store.ts';

type BoardState = Pick<GameState, 'day' | 'life' | 'quest' | 'story' | 'projects' | 'crate' | 'deliveries' | 'warehouse' | 'totalSold'>;
type Notice = { title: string; signed: string; body: string };
const post = (title: string, signed: string, body: string): Notice => ({ title, signed, body });

function market(s: BoardState) {
  if (!s.quest.sold) return post('Buying the first cut', 'Green Exchange', 'Bring your rooftop harvest down to the market. Keep the first receipt. It gets you the growers’ price on a bigger glasshouse or a delivery cart.');
  if (s.projects.length === 0) return post('What does 7B need first?', 'Green Exchange', `Your receipt came through. We can put two more beds under glass or send a delivery cart upstairs. Circle one at the counter. First job is ${projectPrice(0)} simSOL.`);
  if (s.projects.length === 1) return post('The other half of the order', 'Green Exchange', `We’ve crossed the ${s.projects[0] === 'cart' ? 'cart' : 'glasshouse'} off the work slip. If you still want the ${s.projects[0] === 'cart' ? 'two beds under glass' : 'delivery cart'}, the quote at the counter is ${projectPrice(1)} simSOL.`);
  return post('From one roof', 'Green Exchange', 'A little sketch is pinned beside the first receipt from 7B. Two beds are pencilled onto the glasshouse. Below them, somebody has drawn the cart that carries the harvest downstairs.');
}

function deliveries(s: BoardState) {
  if (!s.projects.includes('cart')) return post('Room for a delivery cart', 'Jun · Low Tide', 'I’ve cleared the shelf by the turntable for the first crate from 7B. If you go for the cart at Green Exchange, the café gets the first delivery.');
  const stop = DELIVERY_STOPS[s.deliveries % DELIVERY_STOPS.length];
  return post(s.crate ? 'Crate ready for the street' : 'Next crate from 7B', stop.name,
    s.crate ? `The packed crate is due at ${stop.name}. Bring it to the counter and we’ll sign for it.` : `Next stop is ${stop.name}. Pack a batch at the cart by the roof stairs. We pay market price and another 5 simSOL for bringing it down.`);
}

function freight(s: BoardState) {
  if (s.warehouse.leased) return post('Canal freight slip', 'Canal warehouse', s.warehouse.lastDispatchDay === s.day ? 'Today’s two batches are on the barge. The bench opens for another load tomorrow.' : 'The freight bench is open. Bring two batches to the brick warehouse for today’s barge.');
  return post('Lease on the canal', 'Canal warehouse', `One completed roof project and ${WAREHOUSE.minimumUnits} traded units qualify a grower to sign. The lease costs ${WAREHOUSE.price} simSOL. The tally beside 7B reads ${s.totalSold} units.`);
}

function gathering(s: BoardState) {
  const d = houseDate(s.day);
  const memory = s.life.festivals[d.key];
  if (memory !== undefined) return post(d.festival.title, 'Canopy House residents', d.festival.memories[memory] + ' Your keepsake is on the shelf in 7B.');
  const next = d.date > 6 ? houseDate(s.day + 11 - d.date) : d;
  const host = ['Rowan', 'Jax', 'Tessa', 'Jax'][next.index];
  const invitations = ['I’m saving the last two spaces by the canal rail. Come plant the spring bulbs with me.', 'Bring a rhythm or a tune to the listening room. I’ll take the first shift at the mixing desk.', 'Come set the long table with me, or help pack supper for the neighbors working late.', 'I’ve got the old desk lamp and the lobby bell on the bench. Pick one and we’ll fix it together.'];
  return post(next.festival.title, host + ' · Canopy House', `${invitations[next.index]} ${next.season} 4–6, floor ${next.festival.floor}.`);
}

function commons(s: BoardState) {
  if (s.life.commons === 'seeds') return post('The seed drawer on 21', 'Residents’ seed exchange',
    s.life.seedSeason === Math.floor((s.day - 1) / 10) ? 'The seasonal packet for 7B is signed out. We’ll put another aside when the season turns.' : 'There’s a packet marked 7B in this season’s drawer. Pick it up in the commons on 21.');
  if (s.life.commons === 'tapes') return post('The listening bench on 21', 'Residents’ tape library', 'The bench is open. Jun left a copy of the POTIFY Grow Room recording for anyone who wants to sit through a side.');
  return post('A room for the house', 'Residents’ meeting · Floor 21', 'Mira wants the empty lockers for a seed exchange. Jun says they’d hold a fine tape collection. We’ll settle it in the commons once we’ve lived through a year together.');
}

const landingPosts: Record<number, (s: BoardState) => Notice> = {
  1: s => post('For the grower in 7B', 'Tessa · Night desk', !s.story.leaseRead ? 'Your lease is on the table in 7B. R in the lift takes you to the beds. If you walk up, the roof gate is past the sky garden on 24.' : 'The lift stops at the roof beds and the Quarter. If you take the stairs home from the street, come through my desk on one.'),
  2: () => post('Supper after shift', 'Tessa · Common kitchen', 'If you come off the roof after dark, look in on four. I keep one end of the kitchen table clear for whoever gets in last. Muddy boots can stay by mine.'),
  3: () => post('What went in the first bed', 'Mira · Seed & Signal', 'Sunhaze is the one in the green packet. It’s the first crop I grew on this roof. If you’ve still got a packet in your bag, take it up to an empty bed.'),
  5: market,
  6: () => post('The soil stays', 'Moss · Rootworks', 'The last grower left the soil in 7B. Good call. I mix the bags at Rootworks myself. Take one up and feed a planted bed before you judge it by its leaves.'),
  8: () => post('Ink on the seed packets', 'Mira · Seed & Signal', 'Those blue tips belong to Moonmint. I started writing the names on both ends of the packets after I sold my mother her own seeds back. She still brings it up.'),
  9: () => post('A note from the roof', 'Rowan · Sky garden', 'There was a bare patch where everyone leaned over the rail to see the canal. We moved the planter a foot. Now the plants get their space and we still get the view.'),
  10: () => post('Cloudburst can', 'Moss · Rootworks', 'I made the first long-spout can for a neighbor whose shoulder gave out halfway down the row. The one at Rootworks waters every planted bed on the roof in one go.'),
  11: () => post('On the turntable', 'Jun · Low Tide', 'Tonight’s house pick is The Soil Remembers, the Grow Room Version. I’m playing the POTIFY recording at Low Tide. The rooftop radio carries the same feed.'),
  13: deliveries,
  14: s => {
    const stage = s.story.tasks.ledger;
    if (stage === 'complete') return post('Both addresses were right', 'Mira · Seed & Signal', 'Roof 7B and the canal beds used to split a delivery. Thank you for reading the old crate tag with me. I’d nearly forgotten carrying it upstairs.');
    return post('Two addresses on a crate', 'Mira · Seed & Signal', stage === 'found' ? 'If you’ve read the tag outside Green Exchange, come find me. I know the handwriting.' : 'I’m trying to place a delivery tag on the crate outside Green Exchange. If you’re walking past the market, have a look, then come find me.');
  },
  15: () => post('Which batch was that?', 'Petri & Pistil Lab', 'If two cuts of Sunhaze came out differently, bring your harvest bag to the lab counter. You can look at the quality of each batch before you sell it.'),
  16: s => post('The old roof plans', 'Jax · Repair bench', s.life.archiveOpen ? 'The plans are back in the tin on eighteen. That pass you found is for the tape booth in the listening room on twelve.' : 'The roof plan is older than the lift. I keep it in a biscuit tin in the cabinet on eighteen. Catch me at the repair bench and I’ll tell you whose idea that was.'),
  17: () => post('Where the old beds went', 'Moss · Rootworks', 'See the brass pin on the greenhouse door? The notch is just wide enough for a gloved thumb. Nobody makes them that shape anymore.'),
  19: freight,
  20: commons,
  22: () => post('Moonmint on the rail', 'Rowan · Sky garden', 'You can spot a Moonmint grower after sundown. They’re the one still leaning on the rail trying to decide whether those tips really are blue. I’ve missed supper doing it.'),
  23: gathering,
};

export const hasLandingBoard = (floor: number) => Object.hasOwn(landingPosts, floor);
export function landingNotice(floor: number, state: BoardState) {
  return landingPosts[floor]?.(state);
}
export function townNotices(state: BoardState) {
  return [market(state), state.warehouse.leased ? freight(state) : deliveries(state), gathering(state)];
}
