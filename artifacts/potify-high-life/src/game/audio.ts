import recordingUrl from '../assets/the-soil-remembers-grow-room.mp3';

export const RECORD_TITLE = 'The Soil Remembers (Grow Room Version)';
// The released First Cycle master, shared by the rooftop radio, café and listening rooms.
let radio: HTMLAudioElement | null = null;
let playingGame = false;
let playPending = false;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambBus: GainNode | null = null;
let muted = false;
let musicOn = true;
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) { syncRadio(); return; }
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.7;
      master.connect(ctx.destination);
      ambBus = ctx.createGain();
      ambBus.gain.value = 0.05;
      ambBus.connect(master);
      startAmbience();
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  } catch {
    /* The recording can also play without Web Audio effects. */
  }
  syncRadio();
}

function syncRadio() {
  if (!playingGame || muted || !musicOn || document.hidden) {
    radio?.pause();
    return;
  }
  if (!radio) {
    radio = new Audio(recordingUrl);
    radio.loop = true;
    radio.volume = 0.48;
    // iOS manages element volume in hardware. Route through a gain node for the game mix.
    if (ctx && master) {
      const gain = ctx.createGain();
      gain.gain.value = 0.48;
      ctx.createMediaElementSource(radio).connect(gain);
      gain.connect(master);
      radio.volume = 1;
    }
    document.addEventListener('visibilitychange', syncRadio);
  }
  if (radio.paused && !playPending) {
    playPending = true;
    void radio.play().catch(() => { /* Retry on the next player gesture. */ }).finally(() => { playPending = false; });
  }
}

export function configureAudio(opts: { muted: boolean; music: boolean }, inGame: boolean) {
  muted = opts.muted;
  musicOn = opts.music;
  playingGame = inGame;
  if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : 0.7, ctx.currentTime, 0.1);
  syncRadio();
}

export function restartRecord() {
  if (radio) radio.currentTime = 0;
  syncRadio();
}

function tone(freq: number, dur: number, type: OscillatorType = 'triangle', vol = 0.2, slide?: number, delay = 0) {
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
  g.connect(master);
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
