// Original, fully synthesized sound. Nothing is loaded from disk.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let ambBus: GainNode | null = null;
let muted = false;
let musicOn = true;
let musicTimer: number | null = null;
let nextNote = 0;
let step = 0;

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.7;
      master.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = musicOn ? 0.22 : 0;
      musicBus.connect(master);
      ambBus = ctx.createGain();
      ambBus.gain.value = 0.05;
      ambBus.connect(master);
      startAmbience();
      startMusic();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* audio is optional */
  }
}

export function configureAudio(opts: { muted: boolean; music: boolean }) {
  muted = opts.muted;
  musicOn = opts.music;
  if (!ctx || !master || !musicBus) return;
  master.gain.setTargetAtTime(muted ? 0 : 0.7, ctx.currentTime, 0.1);
  musicBus.gain.setTargetAtTime(musicOn ? 0.22 : 0, ctx.currentTime, 0.3);
}

function tone(freq: number, dur: number, type: OscillatorType = 'triangle', vol = 0.2, slide?: number, delay = 0, bus?: GainNode | null) {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(bus ?? master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol: number, freq: number, delay = 0) {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + delay;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t);
}

export const sfx = {
  step: () => noise(0.06, 0.18, 900 + Math.random() * 500),
  open: () => { tone(520, 0.09, 'square', 0.05); tone(780, 0.12, 'triangle', 0.08, undefined, 0.05); },
  close: () => tone(600, 0.1, 'triangle', 0.07, 380),
  click: () => tone(880, 0.05, 'square', 0.04),
  error: () => { tone(220, 0.12, 'square', 0.06); tone(196, 0.16, 'square', 0.06, undefined, 0.1); },
  plant: () => { noise(0.18, 0.3, 400); tone(330, 0.15, 'triangle', 0.12, 494, 0.08); },
  water: () => { for (let i = 0; i < 6; i++) tone(900 + Math.random() * 700, 0.06, 'sine', 0.07, 400, i * 0.045); },
  feed: () => { noise(0.25, 0.35, 260); tone(262, 0.2, 'triangle', 0.1, 392, 0.1); },
  harvest: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, undefined, i * 0.07)),
  coin: () => { tone(988, 0.08, 'square', 0.06); tone(1318, 0.25, 'square', 0.06, undefined, 0.07); },
  door: () => { noise(0.3, 0.25, 180); tone(150, 0.25, 'sine', 0.15, 90); },
  talk: () => [440, 554, 494].forEach((f, i) => tone(f, 0.07, 'square', 0.04, undefined, i * 0.06)),
  sleep: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.5, 'sine', 0.1, undefined, i * 0.22)),
  upgrade: () => [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, undefined, i * 0.06)),
};

// gentle wind + distant city hum
function startAmbience() {
  if (!ctx || !ambBus) return;
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = (last + (Math.random() * 2 - 1) * 0.02) * 0.995; d[i] = last * 6; }
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
  src.connect(f); f.connect(ambBus); src.start();
}

// Original lazy rooftop loop: four-chord pentatonic plucks.
const CHORDS = [[220, 277, 330, 415], [196, 247, 294, 370], [174, 220, 262, 330], [196, 247, 294, 392]];
const MEL = [0, 2, 1, 3, 2, -1, 1, 0, 3, -1, 2, 1, 0, -1, 2, -1];
function startMusic() {
  if (!ctx || musicTimer !== null) return;
  nextNote = ctx.currentTime + 0.2;
  musicTimer = window.setInterval(() => {
    if (!ctx || !musicBus) return;
    while (nextNote < ctx.currentTime + 0.4) {
      const chord = CHORDS[Math.floor(step / 16) % 4];
      const m = MEL[step % 16];
      const delay = Math.max(0, nextNote - ctx.currentTime);
      if (step % 8 === 0) tone(chord[0] / 2, 1.6, 'sine', 0.35, undefined, delay, musicBus);
      if (m >= 0) tone(chord[m] * 2, 0.5, 'triangle', 0.16, undefined, delay, musicBus);
      if (step % 4 === 2) tone(chord[(step / 2) % 4 | 0], 0.3, 'sine', 0.08, undefined, delay, musicBus);
      nextNote += 0.3;
      step++;
    }
  }, 120);
}
