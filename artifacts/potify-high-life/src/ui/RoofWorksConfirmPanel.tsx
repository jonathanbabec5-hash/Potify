import type { RoofProject } from '@/game/store';

const COPY: Record<RoofProject, { title: string; impact: string }> = {
  glasshouse: {
    title: 'Glasshouse extension',
    impact: 'Add two covered beds. Moss can also use a leftover pane to help with a neighbor’s window.',
  },
  cart: {
    title: 'Neighborhood delivery cart',
    impact: 'Deliver a harvest to a neighbor for the market price plus 5 simSOL. Jun is making room for your first delivery.',
  },
};

export function RoofWorksConfirmPanel({ project, first, onConfirm, onCancel }: {
  project: RoofProject;
  first: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const choice = COPY[project];
  return (
    <section aria-label="Review roof project" className="mt-4 rounded-xl border border-[#a58e67] bg-[#f6ecd6] p-4 text-[#38382e]" data-testid="roof-works-confirm">
      <p className="text-xs font-bold uppercase tracking-wide">Review your {first ? 'first' : 'next'} job</p>
      <h4 className="font-display text-xl mt-1">{choice.title}</h4>
      <p className="mt-2 text-sm">{choice.impact}</p>
      <p className="mt-3 text-sm font-bold">{first
        ? 'First job: 4 simSOL · The other job can be built later for 80 simSOL.'
        : 'Second job: 80 simSOL · Your first job cost 4 simSOL.'}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" className="chunk bg-butter min-h-11 px-3 py-2" data-testid="confirm-roof-job" onClick={onConfirm}>
          Confirm {first ? 'first' : 'second'} job
        </button>
        <button type="button" className="chunk bg-cream min-h-11 px-3 py-2" data-testid="cancel-roof-job" onClick={onCancel}>Keep looking</button>
      </div>
    </section>
  );
}
