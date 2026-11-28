/** A display-only view of the existing plot state; no additional save data. */
export type PlotStatus = 'empty' | 'growing' | 'needs-water' | 'ready';

export interface PlotStatusInput {
  strain: string | null;
  growth: number;
  water: number;
}

export function getPlotStatus(plot: PlotStatusInput): PlotStatus {
  if (!plot.strain) return 'empty';
  if (plot.growth >= 100) return 'ready';
  if (plot.water <= 0) return 'needs-water';
  return 'growing';
}

export const PLOT_STATUS_LABEL: Record<PlotStatus, string> = {
  empty: 'Empty',
  growing: 'Growing',
  'needs-water': 'Needs water',
  ready: 'Ready to harvest',
};
