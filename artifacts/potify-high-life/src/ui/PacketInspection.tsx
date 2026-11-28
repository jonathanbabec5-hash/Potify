import { useState } from 'react';
import foldedPacket from '@/assets/lore/seed-and-signal/mira-packet-folded.webp';
import openedPacket from '@/assets/lore/seed-and-signal/mira-packet-open.webp';
import { sfx } from '@/game/audio';
import { PACKET_FOLD, type PacketClue } from '@/game/packetFold';
import { useG } from '@/game/runtime';
import { game } from '@/game/store';

const actions = 'chunk bg-cream px-4 py-3 text-left';
const clues: readonly PacketClue[] = ['fold', 'pencil'];
const labels = {
  note: { fold: 'Trace the fold', pencil: 'Sketch the pencil mark' },
  answer: { fold: 'The fold', pencil: 'Your handwriting' },
};

function PacketPicture({ open }: { open: boolean }) {
  return <img
    className="block h-auto w-full rounded-xl border border-ink/25"
    width={960} height={640}
    src={open ? openedPacket : foldedPacket}
    alt={open
      ? 'The Moonmint sleeve turned end for end, with the cuff lifted. Its lettering and the graphite crescent at the upper left are upside down.'
      : 'Mira’s Moonmint sleeve folded flat. A small graphite crescent sits near the right edge of the lower cuff.'}
    data-testid={open ? 'packet-open' : 'packet-folded'}
  />;
}

export function PacketInspection({ onBack }: { onBack: () => void }) {
  const memory = useG(s => s.packetFold);
  const day = useG(s => s.day);
  const knowsMug = useG(s => Boolean(s.life.fourthMug));
  const [turned, setTurned] = useState(false);
  const response = memory?.response;
  const canTurn = Boolean(memory && day > memory.day);
  const open = Boolean(response || (canTurn && turned));
  const prompt = open ? PACKET_FOLD.opened : canTurn ? PACKET_FOLD.later : PACKET_FOLD.first;

  return <section aria-labelledby="mira-fold-title" className="space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h3 id="mira-fold-title" className="font-display text-2xl">{PACKET_FOLD.title}</h3>
      <button type="button" className="underline font-bold py-2" data-testid="packet-shop-back" onClick={onBack}>
        Back to shop
      </button>
    </div>
    <PacketPicture open={open} />
    <p className="leading-relaxed">{prompt}</p>
    {knowsMug && <p className="text-sm italic" data-testid="packet-tessa">{PACKET_FOLD.tessa}</p>}
    {!open && memory && <p className="leading-relaxed" data-testid="packet-first-note" role="status">{PACKET_FOLD.firstNotes[memory.noticed]}</p>}
    {open && <p className="font-display text-xl">“{PACKET_FOLD.question}”</p>}
    {!memory && <div className="grid gap-2 sm:grid-cols-2">
      {clues.map(clue => <button type="button" key={clue} className={actions} data-testid={'packet-note-' + clue}
        onClick={() => game.observePacket(clue)}>{labels.note[clue]}</button>)}
    </div>}
    {canTurn && !open && <button type="button" className={actions} data-testid="packet-turn"
      onClick={() => { setTurned(true); sfx.unfoldPacket(); }}>Open the other end</button>}
    {open && !response && <div className="grid gap-2 sm:grid-cols-2">
      {clues.map(clue => <button type="button" key={clue} className={actions} data-testid={'packet-answer-' + clue}
        onClick={() => game.answerPacket(clue)}>{labels.answer[clue]}</button>)}
    </div>}
    {memory && response && <>
      <p role="status" className="font-medium leading-relaxed" data-testid="packet-reply">{PACKET_FOLD.replies[response.clue]}</p>
      <details className="rounded-xl border border-ink/25 px-3 pb-1">
        <summary className="cursor-pointer py-3 font-bold">Look back at the first visit</summary>
        <PacketPicture open={false} />
        <p className="my-3">{PACKET_FOLD.first}</p>
        <p className="mb-3" data-testid="packet-first-note">{PACKET_FOLD.firstNotes[memory.noticed]}</p>
      </details>
    </>}
  </section>;
}
