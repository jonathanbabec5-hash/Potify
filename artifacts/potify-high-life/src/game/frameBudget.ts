// The target is a 33.3 ms frame. Measure complete active gameplay intervals
// and keep a gap between reducing and restoring resolution to avoid pulsing.
export const TARGET_FPS = 30;
const WINDOW_MS = 2000;
export type FrameReport = { place: string; fps: number; p95: number; calls: number; dpr: number };

export class FrameBudget {
  private samples: number[] = [];
  private elapsed = 0;
  private calls = 0;
  private fastWindows = 0;
  private lastTime: number | null = null;
  private readyAt = 0;
  private place = '';

  reset() {
    this.samples.length = 0;
    this.lastTime = null;
    this.readyAt = this.elapsed = this.calls = this.fastWindows = 0;
    this.place = '';
  }

  sample(now: number, place: string, calls: number, dpr: number, min: number, max: number) {
    if (place !== this.place || this.lastTime === null) {
      this.reset();
      this.place = place;
      this.lastTime = now;
      this.readyAt = now + 600;
      return;
    }
    const delta = now - this.lastTime;
    this.lastTime = now;
    if (now < this.readyAt || delta <= 0) return;
    this.samples.push(delta);
    this.elapsed += delta;
    this.calls += calls;
    if (this.elapsed < WINDOW_MS) return;
    const count = this.samples.length;
    this.samples.sort((a,b) => a-b);
    const p95 = this.samples[Math.ceil(0.95 * count) - 1];
    const fps = count * 1000 / this.elapsed;
    const report: FrameReport = { place, fps, p95, calls: Math.round(this.calls / count), dpr };
    this.elapsed = this.calls = this.samples.length = 0;
    this.fastWindows = fps > 44 && p95 < 27 ? this.fastWindows + 1 : 0;
    let next = dpr;
    if (fps < TARGET_FPS - 1 || (fps < 45 && p95 > 44)) {
      next = Math.max(min, dpr * (fps < 23 ? 0.76 : 0.88));
    } else if (this.fastWindows >= 4) {
      this.fastWindows = 0;
      next = Math.min(max, dpr + 0.08);
    }
    return { report, next };
  }
}

let latest: FrameReport | null = null;
export function lastFrameReport() { return latest; }
export function recordFrameReport(report: FrameReport | null) { latest = report; }
