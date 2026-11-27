import type { RoofProject } from './store.ts';

export type MugChoice = 'tea' | 'please';
export type FourthMugMemory = { choice: MugChoice; day: number };

export const MUG_SCENE = {
  title: 'The Fourth Mug',
  opening: [
    'You were drying your own mug, the one with your name underneath. Three dirty plates were still on the table. Tessa took a fourth mug down from its hook. Blue, with a chip in the rim. She turned the good edge toward the empty chair.',
    '“I can wash that one too,” you said. Tessa kept a finger through the handle. “Leave that one. She always came down after the kettle went quiet.”',
    'Out of the sugar tin came an old seed packet. On the back somebody had written STRONG ENOUGH TO STAND THE SPOON UP. A tiny PLEASE ran uphill along the seam. “That part took six years,” Tessa said.',
  ],
  supper: {
    table: 'You remember clearing up after the harvest supper. You’d put the tables end to end. It took two trips just to get the spoons back.',
    bowls: 'You remember clearing up after the harvest supper. You’d packed stew for the late shifts. Tessa made you take the string off your wrist before you put your hands in the dishwater.',
  },
  project: {
    glasshouse: 'The strip of greenhouse glass Moss fitted over the supper counter puts a green edge on the white plates. There’s the thumbprint he missed when he cleaned it.',
    cart: 'A wheel squeaks on the fourth-floor landing. You know that wheel. So does the neighbor calling up the stairs. “Hold the cart a second! I’ve got an empty going back to Jun.”',
    none: 'On the supper counter, three saucers are stacked by the sink. One has a brown ring the dishcloth never quite gets out.',
  },
  choices: {
    tea: 'Make the tea her way',
    please: 'Ask about the tiny PLEASE',
  },
  replies: {
    tea: 'You let the tea go almost black. Tessa tried the spoon. It fell against the rim. “Another minute, then.” She was smiling when she put the saucer over it.',
    please: '“Oh, I wrote the please,” Tessa said. “Got tired of waiting.” The next week her friend sent the packet back. Tessa opened the last fold for you. Inside, in the same big block letters as the order, it said THANK YOU.',
  },
  later: {
    tea: 'The blue mug is back on its hook. On the counter, a saucer covers a fresh cup. Lift it and steam wets your knuckles. A slip in Tessa’s hand reads JAX · NO MILK. Someone working late has tea to come home to.',
    please: 'A fresh packet leans against the sugar tin. FOURTH FLOOR NEEDS TEA, it says. Under the flap, in Tessa’s uphill handwriting, PLEASE. She’s tucked a pencil in the fold for whoever answers.',
  },
};

type FestivalRecord = Record<string, 0 | 1>;

function firstAutumnSupper(festivals: FestivalRecord) {
  // Season numbers are the calendar's zero-based keys, in chronological order.
  return Object.keys(festivals).find(key => Number(key) % 4 === 2);
}

export function hasFourthMugSupper(festivals: FestivalRecord): boolean {
  return firstAutumnSupper(festivals) !== undefined;
}

export function fourthMugOpening(festivals: FestivalRecord, firstProject?: RoofProject) {
  const season = firstAutumnSupper(festivals);
  if (season === undefined) return [];
  const supper = festivals[season] === 0 ? 'table' : 'bowls';
  return [MUG_SCENE.project[firstProject ?? 'none'], MUG_SCENE.supper[supper], ...MUG_SCENE.opening];
}

export function validFourthMug(memory: unknown, festivals: FestivalRecord, today: number): boolean {
  if (memory === undefined) return true;
  if (!memory || typeof memory !== 'object') return false;
  const entry = memory as Partial<FourthMugMemory>;
  const season = firstAutumnSupper(festivals);
  // The first day of a gathering is the fourth of its season.
  return (entry.choice === 'tea' || entry.choice === 'please') &&
    typeof entry.day === 'number' && Number.isSafeInteger(entry.day) &&
    season !== undefined && entry.day >= Number(season) * 10 + 4 && entry.day <= today;
}
