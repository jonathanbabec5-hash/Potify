import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ui } from '@/game/runtime';
import { FrameBudget, recordFrameReport } from '@/game/frameBudget';

export function Performance({ mobile, ceiling }: { mobile: boolean; ceiling: number }) {
  const controller = useMemo(() => new FrameBudget(), []);
  const setDpr = useThree(s => s.setDpr);
  useEffect(() => {
    const reset = () => controller.reset();
    document.addEventListener('visibilitychange', reset);
    recordFrameReport(null);
    return () => document.removeEventListener('visibilitychange', reset);
  }, [controller]);
  useFrame(({gl}) => {
    const state = ui.get();
    if (!state.inGame || state.modal || state.fading || state.glLost || document.hidden) {
      controller.reset();
      return;
    }
    const place = state.area === 'tower' ? 'Canopy House · ' + state.floor : state.zone;
    const dpr = gl.getPixelRatio();
    const result = controller.sample(performance.now(), place, gl.info.render.calls, dpr,
      Math.min(0.64, ceiling), ceiling);
    if (!result) return;
    recordFrameReport(result.report);
    if (mobile && Math.abs(result.next - dpr) > 0.005) setDpr(result.next);
  });
  return null;
}
