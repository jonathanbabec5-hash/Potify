export type PacketClue = 'fold' | 'pencil';

export interface PacketFoldMemory {
  day: number;
  noticed: PacketClue;
  response?: { day: number; clue: PacketClue };
}

export const isPacketClue = (value: unknown): value is PacketClue =>
  value === 'fold' || value === 'pencil';

export function validPacketFold(value: unknown, today: number): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const memory = value as Partial<PacketFoldMemory>;
  if (typeof memory.day !== 'number' || !Number.isSafeInteger(memory.day) ||
      memory.day < 1 || memory.day > today || !isPacketClue(memory.noticed)) {
    return false;
  }
  if (memory.response === undefined) return true;
  const response = memory.response;
  return Boolean(response && Number.isSafeInteger(response.day) && response.day > memory.day &&
    response.day <= today && isPacketClue(response.clue));
}

export const PACKET_FOLD = {
  title: 'The Fold',
  first: 'Mira has tucked an empty Moonmint sleeve by the till. A thumb has polished one crease smooth. On the counter slip she’s written, “I’ll set this one out again tomorrow. See if you can tell what I’ve done to it.”',
  tessa: 'You recognize the shop paper. Tessa’s old packet fit in the palm of her hand like this when she took it from the sugar tin.',
  firstNotes: {
    fold: 'You mark the direction of the crease on the counter slip. One little corner sticks out far enough to catch with a thumb.',
    pencil: 'You copy the graphite crescent beside the seam onto the counter slip. It takes two tries to get the curve right.',
  },
  later: 'The same Moonmint sleeve is waiting by the till. There’s a new line under your mark. “Try it from the other end.”',
  opened: 'The little crescent now hangs upside down. Beneath your sketch on the counter slip, Mira has squeezed in one more question.',
  question: 'What gave it away, the fold or my handwriting?',
  replies: {
    fold: 'Under FOLD, Mira has written, “My mother used to leave that corner out for me. I could open a packet with one thumb and keep my other hand under the crate. She got tired of hearing the lid hit the stairs.”',
    pencil: 'Under HANDWRITING, Mira has written, “That’s where I try the pencil before I write the name. My mother once brought me three blank packets and said, ‘These are yours.’ Three little moons. She got every one right.”',
  },
} as const;
