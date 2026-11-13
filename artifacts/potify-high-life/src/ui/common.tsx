import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { closeModal } from '@/game/runtime';
import { sfx } from '@/game/audio';
import type { Resident } from '@/game/story';
import { NPCS, PLAYER_HAIR } from '@/game/world';

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

export function AvatarFigure({ shirt, skin, size = 64, variant = 'player' }: { shirt: string; skin: string; size?: number; variant?: Resident | 'player' }) {
  const hair = variant === 'player' ? PLAYER_HAIR : NPCS[variant].hair;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0 rounded-2xl bg-[#dfc79c] border-[2.5px] border-ink">
      <path d="M12 64 15 49 24 42 40 42 49 49 52 64Z" fill={shirt} stroke="#473b37" strokeWidth="2" />
      <path d="M26 36H38V46L32 50 26 46Z" fill={skin} />
      {variant === 'mira' ? (
        <path d="M23 43 26 39 32 42 38 39 42 45 36 51 36 60 31 61 30 50Z" fill="#c09474" />
      ) : (
        <path d="M23 64V48H28V54H36V48H41V64Z" fill={variant === 'moss' ? '#716244' : '#5e694b'} />
      )}
      <path d="M16 22 23 12 41 12 48 22 46 36 39 43 25 43 18 36Z" fill={skin} stroke="#473b37" strokeWidth="2" />
      <path d="M15 29 15 18 22 10 42 10 49 19 48 28 42 23 37 16 28 24 22 22 19 30Z" fill={hair} />
      <rect x="24" y="27" width="4" height="6" rx="1" fill="#2d2530" />
      <rect x="36" y="27" width="4" height="6" rx="1" fill="#2d2530" />
      <path d="M29 36Q32 38 35 36" fill="none" stroke="#8f4d4b" strokeWidth="1.5" strokeLinecap="round" />
      {variant === 'player' && <path d="M16 20 18 12 28 7 41 8 47 15 48 18 53 22 44 24 32 20Z" fill="#666045" stroke="#473b37" strokeWidth="1.5" />}
      {variant === 'mira' && (
        <>
          <path d="M17 25 15 36 20 42 23 39 22 25M47 25 50 35 47 42 43 39 44 24" fill={hair} />
          <path d="M25 16H39" stroke="#be9559" strokeWidth="3" />
          <circle cx="25" cy="16" r="5" fill="#475c58" stroke="#be9559" strokeWidth="2" />
          <circle cx="39" cy="16" r="5" fill="#475c58" stroke="#be9559" strokeWidth="2" />
        </>
      )}
      {variant === 'moss' && (
        <>
          <path d="M20 35 25 32 32 35 39 32 44 35 42 42 32 47 22 42Z" fill={hair} />
          <path d="M26 29H38" stroke="#514438" strokeWidth="2" />
          <circle cx="25" cy="29" r="6" fill="none" stroke="#514438" strokeWidth="1.6" />
          <circle cx="39" cy="29" r="6" fill="none" stroke="#514438" strokeWidth="1.6" />
          <path d="M10 20 18 16 23 8 40 7 46 15 54 18 56 22 10 24Z" fill="#747453" stroke="#514438" strokeWidth="1.7" />
        </>
      )}
      {variant === 'jun' && (
        <>
          <path d="M15 30V24a17 17 0 0 1 34 0v6" fill="none" stroke="#6c6269" strokeWidth="3" />
          <rect x="12" y="26" width="7" height="11" rx="2" fill="#38333f" stroke="#bc8d61" />
          <rect x="45" y="26" width="7" height="11" rx="2" fill="#38333f" stroke="#bc8d61" />
        </>
      )}
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
