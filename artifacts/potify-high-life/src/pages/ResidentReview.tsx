import { useState } from 'react';
import { isHairStyle, readHeadLook, type HeadLook } from '@/game/appearance';
import { useG } from '@/game/runtime';
import { game } from '@/game/store';
import { ResidentView } from '@/scene/ResidentView';
import { HairOptions } from '@/ui/HairOptions';

export default function ResidentReview() {
  const shirt = useG(s => s.shirt), skin = useG(s => s.skin);
  const [look, setLook] = useState<HeadLook>(() => {
    const preset = new URL(location.href).searchParams.get('tryHair');
    return isHairStyle(preset) ? { hairStyle: preset, wearsCap: false } : readHeadLook(game.getState());
  });
  const [message, setMessage] = useState('');
  const play = new URL(location.href);
  play.searchParams.delete('resident');
  play.searchParams.delete('tryHair');
  function save() {
    const result = game.saveStudioLook(look);
    setMessage(result.message);
    if (result.ok) {
      const current = new URL(location.href);
      current.searchParams.delete('tryHair');
      history.replaceState(null, '', current.href);
    }
  }
  return <main style={{ minHeight:'100dvh', background:'#ece8da', color:'#263c32', padding:'max(16px,env(safe-area-inset-top)) 16px 24px', fontFamily:'system-ui,sans-serif' }}>
    <div style={{maxWidth:760,margin:'0 auto'}}>
      <header className="flex items-center justify-between gap-3 mb-3">
        <div><p className="text-xs font-bold tracking-widest uppercase">POTIFY · A Wonderful High Life</p><h1 className="text-3xl font-bold">Your resident</h1></div>
        <a href={play.href} className="rounded-full border border-current px-4 py-2 font-bold">Play game</a>
      </header>
      <ResidentView shirt={shirt} skin={skin} look={look} studio />
      <HairOptions look={look} onChange={value => { setLook(value); setMessage(''); }} />
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-full px-5 py-2 font-bold" style={{background:'#354f40',color:'#fff7e2'}} onClick={save}>Save look</button>
        <span role="status" className="text-sm">{message}</span>
      </div>
    </div>
  </main>;
}
