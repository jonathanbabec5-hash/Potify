import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { game } from '@/game/store';
import { WELCOME, FADE_MS, PAN_MS, FIRST_LIGHT_YAW, FIRST_LIGHT_PITCH } from '@/game/opening';
import { camCtl, player, ui, useG, useUI } from '@/game/runtime';
import { endOpeningAudio, sfx, unlockAudio } from '@/game/audio';
import sunrise from '@/assets/cinematic/first-light.webp';
import tessa from '@/assets/cinematic/tessa.webp';
import clip from '@/assets/cinematic/turn.mp4';
import './opening.css';

let firstLight: HTMLImageElement[] | undefined;
export function preloadFirstLight() {
  firstLight ??= [sunrise, tessa].map(src => { const image = new Image(); image.src = src; return image; });
}

export function Opening() {
  const opening = useUI(s => s.opening);
  const muted = useG(s => s.settings.muted);
  const [line, setLine] = useState(-1);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const start = useRef<HTMLImageElement>(null);
  const movie = useRef<HTMLVideoElement>(null);
  const readyButton = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const voiced = useRef(-1);
  const go = () => {
    movie.current?.pause();
    endOpeningAudio();
    camCtl.yawOffset = FIRST_LIGHT_YAW;
    camCtl.pitch = FIRST_LIGHT_PITCH;
    player.yaw = Math.PI;
    ui.set({ opening: null, prompt: null, toasts: [] });
  };
  useEffect(() => {
    if (start.current?.complete) setImageReady(true);
  }, []);
  useEffect(() => {
    if (!opening || ready || !imageReady) return;
    const id = window.setTimeout(() => setReady(true), opening.reduced ? 0 : FADE_MS);
    return () => window.clearTimeout(id);
  }, [imageReady, opening, ready]);
  useEffect(() => {
    if (ready && (document.activeElement === document.body || !document.activeElement)) readyButton.current?.focus({ preventScroll: true });
  }, [ready]);
  const reveal = () => {
    setPlaying(false);
    setLine(prev => Math.max(0, prev));
  };
  useEffect(() => {
    if (opening?.turnedAt == null || line >= 0) return;
    // Slow loads, unsupported video, and interrupted playback cannot trap the player.
    const id = window.setTimeout(reveal, PAN_MS + 650);
    return () => window.clearTimeout(id);
  }, [opening, line]);
  const turn = () => {
    const current = ui.get().opening;
    if (!ready || !current || current.turnedAt !== null) return;
    unlockAudio();
    ui.set({ opening: { ...current, turnedAt: performance.now() } });
    const video = movie.current;
    if (current.reduced || !video || video.error || video.readyState < 2) { reveal(); return; }
    setPlaying(true);
    void video.play().catch(reveal);
  };
  useEffect(() => {
    if (line < 0) return;
    next.current?.focus({ preventScroll: true });
    if (voiced.current !== line) { voiced.current = line; sfx.murmur('tessa', line); }
  }, [line]);
  if (!opening) return null;
  return <section className="welcome-scene first-light-scene" aria-label="First Light at Canopy House" data-testid="opening-scene">
    <div className="opening-film" data-testid="cinematic-stage">
      <img ref={start} src={sunrise} onLoad={() => setImageReady(true)} onError={() => setImageReady(true)} alt="Sunrise pours through the window onto the desk in Apartment 7B." />
      <img src={tessa} alt="Tessa Bloom holds a small ring of brass keys." hidden={line < 0} />
      <video ref={movie} src={clip} muted playsInline preload="auto" aria-hidden="true" className={playing ? 'film-playing' : ''}
        onEnded={reveal} onError={() => { if (ui.get().opening?.turnedAt != null) reveal(); }} />
      {imageReady && <div className="welcome-fade" aria-hidden="true" style={{ animationDuration: opening.reduced ? '0ms' : FADE_MS + 'ms' }} />}
    </div>
    <div className="welcome-top">
      <button aria-label={muted ? 'Unmute intro' : 'Mute intro'} onClick={() => { unlockAudio(); game.setSettings({ muted: !muted }); }} className="welcome-top-button">
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <button onClick={go} className="welcome-top-button" data-testid="opening-skip">Skip intro</button>
    </div>
    {ready && opening.turnedAt === null && <div className="welcome-hold">
      <button ref={readyButton} onClick={turn} data-testid="opening-turn">Turn to Tessa <ArrowRight size={17} aria-hidden="true" /></button>
    </div>}
    {line >= 0 && <div className="welcome-dialogue" data-testid="opening-dialogue">
      <div className="welcome-meta"><span>CANOPY HOUSE · APARTMENT 7B</span><span>{line + 1} / {WELCOME.length}</span></div>
      <h1>Tessa Bloom <span>Building keeper</span></h1>
      <p aria-live="polite" aria-atomic="true">{WELCOME[line].line}</p>
      <button ref={next} onClick={() => { unlockAudio(); if (line + 1 >= WELCOME.length) go(); else setLine(line + 1); }} data-testid="opening-next">
        {line + 1 >= WELCOME.length ? 'Take the keys' : 'Continue'} <ArrowRight size={17} aria-hidden="true" />
      </button>
    </div>}
  </section>;
}
