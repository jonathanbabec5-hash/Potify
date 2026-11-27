import { useG } from '@/game/runtime';
import { ResidentView } from '@/scene/ResidentView';

export default function ResidentReview() {
  const shirt = useG(s => s.shirt), skin = useG(s => s.skin);
  const play = new URL(location.href);
  play.searchParams.delete('resident');
  return <main style={{ minHeight:'100dvh', background:'#ece8da', color:'#263c32', padding:'max(16px,env(safe-area-inset-top)) 16px 24px', fontFamily:'system-ui,sans-serif' }}>
    <div style={{maxWidth:760,margin:'0 auto'}}>
      <header className="flex items-center justify-between gap-3 mb-3">
        <div><p className="text-xs font-bold tracking-widest uppercase">POTIFY · A Wonderful High Life</p><h1 className="text-3xl font-bold">Your resident</h1></div>
        <a href={play.href} className="rounded-full border border-current px-4 py-2 font-bold">Play game</a>
      </header>
      <ResidentView shirt={shirt} skin={skin} studio />
    </div>
  </main>;
}
