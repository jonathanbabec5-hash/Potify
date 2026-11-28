import { useEffect, useRef, useState } from 'react';
import { Backpack, BookOpen, CalendarDays, Map as MapIcon, Menu, Moon, Shirt, Sun, Volume2, VolumeX, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react';
import { game, objective, formatTime } from '@/game/store';
import { joy, openModal, ui, useG, useUI, type Modal } from '@/game/runtime';
import { interact } from '@/game/interact';
import { sfx } from '@/game/audio';
import { CAMERA_PRESETS } from '@/scene/GameCanvas';
import { Kbd, Sim } from '@/ui/common';

const ZONE_TITLES: Record<string, [string, string]> = {
  rooftop: ['The Rooftop', 'Six beds and a view'],
  greenhouse: ['The Greenhouse', 'Glass, warmth, drying rack'],
  apartment: ['Home 7B', 'Bed, wardrobe, radio'],
  town: ['Canopy Quarter', 'Shops, square and neighbors'],
};

export function setCamera(delta: number) {
  const c = game.getState().settings.camera;
  const n = Math.max(0, Math.min(CAMERA_PRESETS.length - 1, Math.round(c) + delta));
  if (n !== c) { game.setSettings({ camera: n }); sfx.click(); }
}

function HudButton({ icon, label, k, modal }: { icon: React.ReactNode; label: string; k: string; modal: Modal }) {
  return (
    <button onClick={() => openModal(modal)} className="chunk bg-cream w-11 h-11 md:w-auto md:h-11 md:px-3 flex items-center justify-center gap-2" aria-label={label} data-testid={`button-hud-${label.toLowerCase()}`}>
      {icon}
      <span className="hidden lg:inline text-sm">{label}</span>
      <span className="hidden md:inline key">{k}</span>
    </button>
  );
}

export function HUD({ touch }: { touch: boolean }) {
  const minute = useG(s => Math.floor(s.minute / 10) * 10);
  const day = useG(s => s.day);
  const money = useG(s => s.money);
  const muted = useG(s => s.settings.muted);
  const obj = useG(s => objective(s));
  const showNotes = useG(s => s.quest.met || s.story.leaseRead);
  const prompt = useUI(s => s.prompt);
  const zone = useUI(s => s.zone);
  const [objOpen, setObjOpen] = useState(true);
  const [banner, setBanner] = useState(zone);
  const [bannerKey, setBannerKey] = useState(0);
  useEffect(() => { setBanner(zone); setBannerKey(k => k + 1); }, [zone]);
  const isDay = minute >= 360 && minute < 1170;
  const dayPct = (minute % 1440) / 1440;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* top-left: clock, money, objective */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 max-w-[min(340px,62vw)] pointer-events-auto">
        <div className="flex gap-2 flex-wrap">
          <div className="chip pl-1.5 pr-4 py-1 flex items-center gap-2" data-testid="text-clock">
            <span className={`w-8 h-8 rounded-full border-[2.5px] border-ink flex items-center justify-center ${isDay ? 'bg-butter' : 'bg-[#21406a] text-cream'}`}>
              {isDay ? <Sun className="w-4 h-4" strokeWidth={3} /> : <Moon className="w-4 h-4" strokeWidth={3} />}
            </span>
            <div className="leading-none">
              <p className="font-display text-lg">{formatTime(minute)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Day {day}</span>
                <span className="w-12 h-1.5 rounded-full bg-ink/15 overflow-hidden"><span className="block h-full bg-tangerine" style={{ width: `${dayPct * 100}%` }} /></span>
              </div>
            </div>
          </div>
          <div className="chip px-4 py-1 flex items-center gap-2" data-testid="text-money" title="simSOL is simulated money with no real value">
            <span className="w-4 h-4 rounded-full bg-butter border-2 border-ink" />
            <span className="font-display text-lg leading-none"><Sim v={money} /></span>
          </div>
        </div>
        <button onClick={() => { sfx.click(); setObjOpen(o => !o); }} className="panel !rounded-2xl text-left px-3.5 py-2.5 !shadow-[0_4px_0_#13293a]" data-testid="card-objective">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-jade">Next up · {Math.min(obj.step + 1, obj.total)}/{obj.total}</span>
            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${objOpen ? '' : '-rotate-90'}`} strokeWidth={3} />
          </div>
          <p className="font-display text-base leading-tight mt-0.5">{obj.title}</p>
          {objOpen && <p className="text-xs font-bold text-muted-foreground mt-1 leading-snug">{obj.description}</p>}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: obj.total }).map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < obj.step ? 'bg-jade' : i === obj.step ? 'bg-tangerine' : 'bg-ink/15'}`} />
            ))}
          </div>
        </button>
        {showNotes && (
          <button className="chunk bg-cream w-fit px-3 py-2 flex items-center gap-2 text-sm" onClick={() => openModal({ type: 'field-notes' })} data-testid="button-field-notes">
            <BookOpen className="w-4 h-4 text-jade" aria-hidden="true" />Field notes
          </button>
        )}
      </div>

      {/* top-right: menus */}
      <div className="absolute top-3 right-3 flex flex-col md:flex-row gap-2 pointer-events-auto">
        <HudButton icon={<Backpack className="w-5 h-5" />} label="Bag" k="I" modal={{ type: 'inventory' }} />
        <HudButton icon={<MapIcon className="w-5 h-5" />} label="Map" k="M" modal={{ type: 'map' }} />
        <HudButton icon={<CalendarDays className="w-5 h-5" />} label="Day" k="L" modal={{ type: 'calendar' }} />
        <HudButton icon={<Shirt className="w-5 h-5" />} label="Look" k="C" modal={{ type: 'avatar' }} />
        <button onClick={() => { game.setSettings({ muted: !muted }); }} className="chunk bg-cream w-11 h-11 flex items-center justify-center" aria-label="Toggle sound" data-testid="button-mute">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button onClick={() => openModal({ type: 'pause' })} className="chunk bg-tangerine text-cream w-11 h-11 flex items-center justify-center" aria-label="Pause" data-testid="button-pause">
          <Menu className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>

      {/* zone banner */}
      <div key={bannerKey} className="banner absolute top-[18%] left-1/2 -translate-x-1/2 text-center">
        <p className="font-display text-3xl md:text-5xl text-cream [-webkit-text-stroke:2px_#13293a] [paint-order:stroke_fill] [text-shadow:0_4px_0_#13293a]">{ZONE_TITLES[banner]?.[0]}</p>
        <p className="font-black text-xs uppercase tracking-[0.25em] text-cream [text-shadow:0_2px_0_#13293a] mt-1">{ZONE_TITLES[banner]?.[1]}</p>
      </div>

      {/* interaction prompt */}
      {prompt && !touch && (
        <button onClick={() => interact(ui.get().prompt)} className="pop absolute bottom-8 left-1/2 -translate-x-1/2 chip pointer-events-auto pl-2 pr-5 py-2 flex items-center gap-3" data-testid="button-prompt">
          <span className="key !h-8 !min-w-8 text-base">E</span>
          <span className="font-display text-lg">{prompt.verb}</span>
          <span className="font-bold text-muted-foreground">{prompt.label}</span>
        </button>
      )}

      {/* camera controls */}
      {!touch && (
        <div className="absolute bottom-6 right-4 flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setCamera(-1)} className="chunk bg-cream h-10 px-2.5 flex items-center gap-1.5" aria-label="Camera closer" data-testid="button-cam-in"><ZoomIn className="w-4 h-4" /><span className="key">Q</span></button>
          <button onClick={() => setCamera(1)} className="chunk bg-cream h-10 px-2.5 flex items-center gap-1.5" aria-label="Camera higher" data-testid="button-cam-out"><ZoomOut className="w-4 h-4" /><span className="key">R</span></button>
        </div>
      )}
      {!touch && (
        <div className="absolute bottom-6 left-4 chip px-3 py-1.5 text-xs font-bold hidden md:flex items-center gap-1.5">
          <Kbd>WASD</Kbd> walk <Kbd>Shift</Kbd> jog <Kbd>E</Kbd> act <Kbd>Esc</Kbd> pause
        </div>
      )}
      {touch && <TouchControls />}
    </div>
  );
}

function TouchControls() {
  const prompt = useUI(s => s.prompt);
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pid = useRef<number | null>(null);
  const move = (e: React.PointerEvent) => {
    if (pid.current !== e.pointerId || !base.current) return;
    const r = base.current.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2 - 18;
    const l = Math.hypot(dx, dy);
    if (l > max) { dx = (dx / l) * max; dy = (dy / l) * max; }
    setKnob({ x: dx, y: dy });
    joy.x = dx / max; joy.y = dy / max;
  };
  const end = () => { pid.current = null; setKnob({ x: 0, y: 0 }); joy.x = 0; joy.y = 0; };
  return (
    <>
      <div ref={base} className="absolute bottom-6 left-5 w-36 h-36 rounded-full border-[3px] border-ink bg-cream/50 backdrop-blur-sm pointer-events-auto touch-none"
        onPointerDown={e => { pid.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); move(e); }}
        onPointerMove={move} onPointerUp={end} onPointerCancel={end} data-testid="joystick">
        <div className="absolute left-1/2 top-1/2 w-14 h-14 -ml-7 -mt-7 rounded-full bg-tangerine border-[3px] border-ink shadow-[0_4px_0_#13293a]"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="absolute bottom-6 right-5 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex gap-2">
          <button onClick={() => setCamera(-1)} className="chunk bg-cream w-12 h-12 flex items-center justify-center" aria-label="Camera closer"><ZoomIn className="w-5 h-5" /></button>
          <button onClick={() => setCamera(1)} className="chunk bg-cream w-12 h-12 flex items-center justify-center" aria-label="Camera higher"><ZoomOut className="w-5 h-5" /></button>
        </div>
        <button onClick={() => interact(ui.get().prompt)} disabled={!prompt}
          className={`chunk w-28 h-28 !rounded-full flex flex-col items-center justify-center text-center px-2 ${prompt ? 'bg-butter' : 'bg-cream/70'}`} data-testid="button-action">
          <span className="font-display text-xl leading-none">{prompt ? prompt.verb : 'Action'}</span>
          {prompt && <span className="text-[11px] font-black leading-tight mt-1 line-clamp-2">{prompt.label}</span>}
        </button>
      </div>
    </>
  );
}

export function Toasts() {
  const toasts = useUI(s => s.toasts);
  return (
    <div className="fixed top-24 md:top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-[min(92vw,460px)]">
      {toasts.map(t => (
        <div key={t.id} className={`pop chip px-4 py-2 text-sm font-bold text-center ${t.tone === 'bad' ? '!bg-coral text-cream' : ''}`} data-testid="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function Fade() {
  const fading = useUI(s => s.fading);
  return <div className={`fixed inset-0 z-[45] bg-ink pointer-events-none transition-opacity duration-300 ${fading ? 'opacity-100' : 'opacity-0'}`} />;
}
