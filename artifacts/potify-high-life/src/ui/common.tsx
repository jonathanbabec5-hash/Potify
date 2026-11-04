import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { closeModal } from '@/game/runtime';
import { sfx } from '@/game/audio';

export const SHIRTS = ['#c7774f', '#f2703f', '#1f9e89', '#fbd255', '#ef6f7c', '#4c8fb0', '#8fbf4a', '#fff1d6', '#2b3a4f'];
export const SKINS = ['#f6d2b4', '#e8b48e', '#c98b5e', '#9c6440', '#6e4429', '#4a2e1e'];

export function Swatches({ colors, value, onChange, test }: { colors: string[]; value: string; onChange: (c: string) => void; test: string }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {colors.map(c => (
        <button key={c} onClick={() => { sfx.click(); onChange(c); }} aria-label={c} data-testid={`swatch-${test}-${c.slice(1)}`}
          className={`w-9 h-9 rounded-full border-[2.5px] border-ink transition-transform ${value === c ? 'scale-110 ring-4 ring-butter' : 'hover:scale-105'}`}
          style={{ background: c, boxShadow: '0 3px 0 #13293a' }} />
      ))}
    </div>
  );
}

export function AvatarFigure({ shirt, skin, size = 64 }: { shirt: string; skin: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0 rounded-2xl bg-aqua border-[2.5px] border-ink">
      <polygon points="20,62 22,40 42,40 44,62" fill={shirt} stroke="#13293a" strokeWidth="2.5" />
      <polygon points="32,10 44,16 46,30 38,38 26,38 18,30 20,16" fill={skin} stroke="#13293a" strokeWidth="2.5" />
      <rect x="25" y="24" width="3" height="5" fill="#13293a" />
      <rect x="36" y="24" width="3" height="5" fill="#13293a" />
      <path d="M17 17 Q32 2 47 17 L52 19 L12 19 Z" fill="#13293a" />
    </svg>
  );
}

export function Sheet({ title, kicker, children, wide, accent = 'bg-tangerine', test }: { title: string; kicker?: string; children: ReactNode; wide?: boolean; accent?: string; test?: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3" data-testid={test ?? 'modal'}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={() => closeModal()} />
      <div className={`relative panel pop w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[88dvh] flex flex-col overflow-hidden`}>
        <div className={`${accent} border-b-[3px] border-ink px-5 py-3 flex items-center gap-3`}>
          <div className="flex-1 min-w-0">
            {kicker && <p className="text-[11px] font-black uppercase tracking-[0.2em] text-ink/70">{kicker}</p>}
            <h2 className="font-display text-2xl md:text-3xl text-cream [text-shadow:0_2px_0_#13293a] leading-tight truncate">{title}</h2>
          </div>
          <button onClick={() => closeModal()} className="chunk bg-cream w-10 h-10 flex items-center justify-center shrink-0" aria-label="Close" data-testid="button-close-modal">
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
        <div className="overflow-auto p-4 md:p-5">{children}</div>
      </div>
    </div>
  );
}

export function Meter({ label, value, color, testid }: { label: string; value: number; color: string; testid?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div data-testid={testid}>
      <div className="flex justify-between text-xs font-black uppercase tracking-wider"><span>{label}</span><span className="font-mono">{Math.round(v)}%</span></div>
      <div className="h-4 mt-1 rounded-full border-[2.5px] border-ink bg-white/60 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${v}%`, background: color }} />
      </div>
    </div>
  );
}

export function Sim({ v }: { v: number }) {
  return <span className="font-mono whitespace-nowrap">{v.toFixed(2)} <span className="text-[0.8em] font-black">simSOL</span></span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <span className="key">{children}</span>;
}
