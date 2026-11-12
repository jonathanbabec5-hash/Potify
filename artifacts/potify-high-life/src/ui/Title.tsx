import { useState } from 'react';
import { ArrowRight, Check, Play, RotateCcw, Sprout } from 'lucide-react';
import { game } from '@/game/store';
import { act, ui, useG } from '@/game/runtime';
import { sfx, unlockAudio } from '@/game/audio';
import { SHIRTS, SKINS, Swatches, AvatarFigure } from '@/ui/common';

export function Title() {
  const started = useG(s => s.started);
  const acknowledged = useG(s => s.acknowledged);
  const saved = useG(s => ({ name: s.name, shirt: s.shirt, skin: s.skin, day: s.day, money: s.money }));
  const [step, setStep] = useState<'menu' | 'create' | 'confirmReset'>('menu');
  const [name, setName] = useState(saved.name || 'Rooftop Rookie');
  const [shirt, setShirt] = useState(saved.shirt || '#c7774f');
  const [skin, setSkin] = useState(saved.skin || SKINS[1]);
  const [ack, setAck] = useState(false);

  const enter = () => { unlockAudio(); sfx.harvest(); ui.set({ inGame: true }); };
  const cont = () => { unlockAudio(); if (started && acknowledged) enter(); else { setStep('create'); sfx.open(); } };
  const begin = () => {
    if (!ack) return;
    if (act(() => game.start({ name: name.trim() || 'Rooftop Rookie', shirt, skin }), true)) enter();
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-r from-[#13293a]/75 via-[#13293a]/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#13293a]/60 to-transparent" />
      <div className="relative flex-1 flex flex-col md:flex-row items-center md:items-stretch gap-6 p-5 md:p-12 overflow-auto pointer-events-auto">
        <div className="flex flex-col justify-center md:max-w-xl text-center md:text-left pt-6 md:pt-0">
          <p className="font-black uppercase tracking-[0.3em] text-butter text-xs md:text-sm">A rooftop life above the Canopy Quarter</p>
          <h1 className="logo-type text-[19vw] md:text-[9.5rem] leading-[0.85] mt-3 -rotate-2 bob" data-testid="text-title">POTIFY</h1>
          <p className="font-display text-cream text-2xl md:text-4xl mt-5 [text-shadow:0_3px_0_#13293a]">A Wonderful High Life</p>
          <p className="text-cream/85 font-bold mt-4 max-w-md mx-auto md:mx-0 text-sm md:text-base">
            New keys, six empty grow beds, a glass greenhouse, and a whole little city of neighbors downstairs. Start small. Water often. Say hello.
          </p>
        </div>

        <div className="md:ml-auto self-center w-full max-w-md">
          {step === 'menu' && (
            <div className="panel p-5 md:p-6 pop" data-testid="panel-start">
              {started ? (
                <div className="flex items-center gap-3 mb-4 rounded-2xl bg-muted p-3">
                  <AvatarFigure shirt={saved.shirt} skin={saved.skin} size={52} />
                  <div className="min-w-0">
                    <p className="font-display text-xl truncate">{saved.name}</p>
                    <p className="text-sm font-bold text-muted-foreground">Day {saved.day} · {saved.money.toFixed(2)} simSOL (simulated)</p>
                  </div>
                </div>
              ) : (
                <p className="font-bold text-muted-foreground mb-4">No save on this device yet. Your rooftop is waiting.</p>
              )}
              <div className="grid gap-3">
                <button className="chunk bg-tangerine text-cream py-4 text-xl flex items-center justify-center gap-2" onClick={cont} data-testid="button-continue">
                  <Play className="w-5 h-5 fill-current" /> {started ? 'Continue' : 'New life'}
                </button>
                {started && (
                  <button className="chunk bg-cream py-3 flex items-center justify-center gap-2" onClick={() => { sfx.click(); setStep('confirmReset'); }} data-testid="button-new-game">
                    <RotateCcw className="w-4 h-4" /> Start over
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-4 leading-relaxed">
                Fictional, cannabis-themed simulation for adults. simSOL is play money with no real value. Saves stay in this browser only.
              </p>
              <a
                href={`${import.meta.env.BASE_URL}devlog/`}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-ink/20 px-4 py-2 text-sm font-black text-foreground underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                City Devlog · Build in Public
              </a>
            </div>
          )}

          {step === 'confirmReset' && (
            <div className="panel p-6 pop">
              <h2 className="font-display text-2xl">Start a brand-new life?</h2>
              <p className="font-bold text-muted-foreground mt-2">This erases your rooftop, harvests, friendships and simSOL on this device. It cannot be undone.</p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button className="chunk bg-cream py-3" onClick={() => setStep('menu')} data-testid="button-cancel-reset">Keep my roof</button>
                <button className="chunk bg-coral text-cream py-3" data-testid="button-confirm-reset" onClick={() => {
                  act(() => game.reset());
                  setName('Rooftop Rookie'); setShirt('#c7774f'); setSkin(SKINS[1]); setAck(false); setStep('create');
                }}>Erase and begin</button>
              </div>
            </div>
          )}

          {step === 'create' && (
            <div className="panel p-5 md:p-6 pop max-h-[78dvh] overflow-auto" data-testid="panel-create">
              <div className="flex items-start gap-4">
                <AvatarFigure shirt={shirt} skin={skin} size={84} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-jade">New resident</p>
                  <label className="block font-display text-lg mt-1" htmlFor="name">Your name</label>
                  <input id="name" value={name} maxLength={20} onChange={e => setName(e.target.value)}
                    className="w-full mt-1 rounded-xl border-[2.5px] border-ink bg-white/70 px-3 py-2 font-bold outline-none focus:ring-4 ring-butter" data-testid="input-name" />
                </div>
              </div>
              <p className="font-display mt-4">Shirt</p>
              <Swatches colors={SHIRTS} value={shirt} onChange={setShirt} test="shirt" />
              <p className="font-display mt-3">Skin tone</p>
              <Swatches colors={SKINS} value={skin} onChange={setSkin} test="skin" />

              <div className="mt-5 rounded-2xl border-[2.5px] border-ink bg-butter/40 p-3 text-sm font-bold leading-relaxed">
                <p className="font-display text-base mb-1">Before you move in</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>POTIFY: A Wonderful High Life is a fictional, adult-themed (18+) cannabis growing simulation.</li>
                  <li><b>simSOL</b> is simulated in-game money with no real value. There are no real SOL or $POTIFY transfers, no rewards, and no real cannabis purchases.</li>
                  <li><b>$POTIFY harvest units</b> are a fictional inventory measure, not actual POTIFY tokens and not a real-world quantity.</li>
                  <li>Nothing here is financial advice or an investment.</li>
                </ul>
              </div>
              <button className="mt-3 flex items-start gap-3 text-left w-full" onClick={() => { sfx.click(); setAck(a => !a); }} data-testid="checkbox-ack">
                <span className={`mt-0.5 w-7 h-7 shrink-0 rounded-lg border-[2.5px] border-ink flex items-center justify-center ${ack ? 'bg-jade text-cream' : 'bg-white/70'}`}>
                  {ack && <Check className="w-5 h-5" strokeWidth={4} />}
                </span>
                <span className="font-bold text-sm">I am 18 or older (or of legal age where I live) and I understand this is a fictional simulation.</span>
              </button>
              <button disabled={!ack} onClick={begin} className="chunk w-full mt-4 bg-tangerine text-cream py-4 text-xl flex items-center justify-center gap-2" data-testid="button-begin">
                <Sprout className="w-5 h-5" /> Move in <ArrowRight className="w-5 h-5" />
              </button>
              <button className="w-full mt-2 text-sm font-bold text-muted-foreground underline" onClick={() => setStep('menu')}>Back</button>
            </div>
          )}
        </div>
      </div>
      <div className="relative px-5 pb-4 flex justify-between text-[11px] font-bold text-cream/70 pointer-events-none">
        <span>An original game. Offline. No accounts. No wallets.</span>
        <span className="hidden md:inline">v0.1 · first slice</span>
      </div>
    </div>
  );
}
