import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { game } from '@/game/store';
import { closeModal, openModal, ui, useG, useUI } from '@/game/runtime';
import { configureAudio, unlockAudio } from '@/game/audio';
import { interact } from '@/game/interact';
import GameCanvas, { hasWebGL } from '@/scene/GameCanvas';
import { Title } from '@/ui/Title';
import { HUD, Toasts, Fade, setCamera } from '@/ui/HUD';
import { Modals } from '@/ui/Menus';

function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      unlockAudio();
      const target = e.target instanceof Element ? e.target : null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.code === 'Enter' || e.code === 'Space') && target?.closest('button, a[href]')) return;
      const u = ui.get();
      if (!u.inGame) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { if (u.modal) closeModal(); else openModal({ type: 'pause' }); return; }
      if (e.repeat) return;
      if (u.modal) {
        const map: Record<string, string> = { KeyI: 'inventory', KeyM: 'map', KeyL: 'calendar', KeyC: 'avatar' };
        if (map[e.code] && u.modal.type === map[e.code]) closeModal();
        return;
      }
      switch (e.code) {
        case 'KeyE': case 'Enter': case 'Space': e.preventDefault(); interact(u.prompt); break;
        case 'KeyI': openModal({ type: 'inventory' }); break;
        case 'KeyM': openModal({ type: 'map' }); break;
        case 'KeyL': case 'KeyJ': openModal({ type: 'calendar' }); break;
        case 'KeyC': openModal({ type: 'avatar' }); break;
        case 'KeyO': openModal({ type: 'settings' }); break;
        case 'KeyQ': setCamera(-1); break;
        case 'KeyR': setCamera(1); break;
        case 'KeyN': game.setSettings({ muted: !game.getState().settings.muted }); break;
      }
    };
    const onPointer = () => unlockAudio();
    const onHide = () => { if (document.hidden) game.save(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    document.addEventListener('visibilitychange', onHide);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onPointer); document.removeEventListener('visibilitychange', onHide); };
  }, []);
}

function Loader() {
  const ready = useUI(s => s.ready);
  const [gone, setGone] = useState(false);
  useEffect(() => { if (ready) { const t = setTimeout(() => setGone(true), 700); return () => clearTimeout(t); } return undefined; }, [ready]);
  if (gone) return null;
  return (
    <div className={`fixed inset-0 z-[60] bg-[#f4a07c] flex flex-col items-center justify-center transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}>
      <p className="logo-type text-7xl md:text-8xl -rotate-2">POTIFY</p>
      <div className="flex gap-1.5 mt-8 h-8 items-end">
        {[0, 1, 2, 3, 4].map(i => <span key={i} className="w-3 h-full bg-jade border-2 border-ink rounded-md origin-bottom" style={{ animation: `bars ${0.7 + i * 0.1}s ease-in-out infinite` }} />)}
      </div>
      <p className="font-black text-ink mt-4 uppercase tracking-[0.25em] text-xs">Watering the rooftop</p>
    </div>
  );
}

function Recovery({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-[#f4a07c] flex items-center justify-center p-5">
      <div className="panel p-6 max-w-md text-center pop">
        <p className="logo-type text-5xl">POTIFY</p>
        <h1 className="font-display text-2xl mt-4">{title}</h1>
        <p className="font-bold text-muted-foreground mt-2">{body}</p>
        <p className="text-xs font-bold text-muted-foreground mt-2">Your save is kept in this browser.</p>
        <div className="grid gap-2 mt-5">
          {onRetry && <button className="chunk bg-tangerine text-cream py-3 flex items-center justify-center gap-2" onClick={onRetry} data-testid="button-retry"><RefreshCw className="w-4 h-4" /> Try again</button>}
          <button className="chunk bg-cream py-3" onClick={() => { game.save(); window.location.reload(); }} data-testid="button-reload">Reload page</button>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  useHotkeys();
  const inGame = useUI(s => s.inGame);
  const glLost = useUI(s => s.glLost);
  const muted = useG(s => s.settings.muted);
  const music = useG(s => s.settings.music);
  const [crashKey, setCrashKey] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [webgl] = useState(() => hasWebGL());
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => { configureAudio({ muted, music }); }, [muted, music]);

  if (!webgl) return <Recovery title="3D isn't available here" body="This browser or device has WebGL turned off. Try a recent Chrome, Firefox, Safari or Edge, or enable hardware acceleration." />;

  return (
    <div className="fixed inset-0 grain overflow-hidden bg-ink">
      {!crashed && <GameCanvas key={crashKey} onCrash={() => { setCrashed(true); ui.set({ modal: null }); }} />}
      {inGame ? (<><HUD touch={touch} /><Modals /></>) : <Title />}
      <Toasts />
      <Fade />
      <Loader />
      {crashed && <Recovery title="The rooftop flickered" body="The 3D scene hit a problem. Retry to rebuild it." onRetry={() => { setCrashed(false); setCrashKey(k => k + 1); }} />}
      {glLost && !crashed && <Recovery title="Graphics paused" body="The graphics context was lost (common on phones when switching apps)." onRetry={() => { ui.set({ glLost: false }); setCrashKey(k => k + 1); }} />}
    </div>
  );
}
