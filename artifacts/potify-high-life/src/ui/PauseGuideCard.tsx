import { objective } from '@/game/store';
import { openModal, useG, useUI } from '@/game/runtime';

/** An optional, read-only reminder of the current game objective. */
export function PauseGuideCard() {
  const current = useG(objective);
  const prompt = useUI(state => state.prompt);

  return (
    <section aria-labelledby="pause-guide-title" data-testid="pause-guide"
      className="mb-4 rounded-xl border-2 border-[#a58e67] bg-[#f6ecd6] p-4 text-[#38382e] shadow-sm">
      <p id="pause-guide-title" className="text-xs font-black uppercase tracking-wider text-[#496753]">What next?</p>
      <p className="font-display text-xl leading-tight mt-1" data-testid="pause-guide-objective">{current.title}</p>
      <p className="mt-1 text-sm leading-snug">{current.description}</p>
      {prompt && (
        <p className="hidden [@media(pointer:fine)]:block mt-3 border-t border-[#a58e67]/50 pt-2 text-sm"
          data-testid="pause-guide-nearby">
          Nearby: {prompt.label}. Close this menu, then press E, Enter, or Space to {prompt.verb.toLowerCase()}.
        </p>
      )}
      <button type="button" className="chunk mt-3 min-h-11 bg-[#496753] px-3 py-2 text-sm text-[#f6ecd6]"
        data-testid="pause-guide-map" onClick={() => openModal({ type: 'map' })}>
        Open map &amp; goals
      </button>
    </section>
  );
}
