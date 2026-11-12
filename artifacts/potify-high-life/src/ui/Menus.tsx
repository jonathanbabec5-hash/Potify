import { useState } from 'react';
import { Droplets, Heart, Leaf, Lock, Moon, Package, Save, Scissors, Sparkles, Sprout } from 'lucide-react';
import { ECONOMY, SEEDS, UPGRADES, game, harvestValue, objective, formatTime } from '@/game/store';
import { act, closeModal, fx, openModal, player, ui, useG, useUI, type NpcId, type ShopId } from '@/game/runtime';
import { BEDS, NPCS, SHOPS, npcSchedule } from '@/game/world';
import { doSleep } from '@/game/interact';
import { sfx } from '@/game/audio';
import { CAMERA_PRESETS } from '@/scene/GameCanvas';
import { AvatarFigure, Kbd, Meter, SHIRTS, SKINS, Sheet, Sim, Swatches } from '@/ui/common';

const seedName = (id: string | null) => SEEDS.find(s => s.id === id)?.name ?? 'Unknown';
const stageName = (g: number) => (g < 6 ? 'Seed' : g < 25 ? 'Sprout' : g < 60 ? 'Vegetative' : g < 100 ? 'Budding' : 'Ready to harvest');

export function Modals() {
  const modal = useUI(s => s.modal);
  if (!modal) return null;
  switch (modal.type) {
    case 'bed': return <BedPanel index={modal.index} />;
    case 'shop': return <ShopPanel shop={modal.shop} />;
    case 'talk': return <Talk npc={modal.npc} line={modal.line} />;
    case 'inventory': return <Inventory />;
    case 'map': return <MapPanel />;
    case 'calendar': return <Calendar />;
    case 'avatar': return <AvatarPanel />;
    case 'settings': return <SettingsPanel />;
    case 'roadmap': return <Roadmap />;
    case 'pause': return <Pause />;
    case 'sleep': return <SleepPanel />;
  }
}

/* ---------------- Grow bed ---------------- */
function BedPanel({ index }: { index: number }) {
  const plot = useG(s => s.plots[index]);
  const seeds = useG(s => s.seeds);
  const supplies = useG(s => s.supplies);
  const b = BEDS[index];
  if (!plot) return null;
  const seed = SEEDS.find(s => s.id === plot.strain);
  const ready = !!plot.strain && plot.growth >= 100;
  const run = (fn: () => unknown, ok: () => void) => { if (act(fn)) ok(); };
  return (
    <Sheet title={`Bed ${index + 1}`} kicker={plot.strain ? `${seedName(plot.strain)} · ${stageName(plot.growth)}` : 'Empty grow bed'} accent={ready ? 'bg-butter' : 'bg-jade'} test="modal-bed">
      {!plot.strain ? (
        <>
          <p className="font-bold text-muted-foreground mb-3">Pick a seed packet from your bag to plant here.</p>
          <div className="grid gap-2">
            {SEEDS.map(s => (
              <button key={s.id} disabled={!seeds[s.id]} data-testid={`button-plant-${s.id}`}
                onClick={() => run(() => game.plant(plot.id, s.id), () => { sfx.plant(); fx.emit(b.x, b.z, '#8a5a3b', 12); closeModal(); })}
                className="chunk bg-cream p-3 flex items-center gap-3 text-left">
                <span className="w-10 h-10 rounded-xl border-[2.5px] border-ink" style={{ background: s.color }} />
                <span className="flex-1"><span className="font-display text-lg block leading-tight">{s.name}</span><span className="text-xs font-bold text-muted-foreground">{s.growSeconds}s to grow when hydrated</span></span>
                <span className="font-mono text-sm">x{seeds[s.id] ?? 0}</span>
              </button>
            ))}
          </div>
          {!Object.values(seeds).some(Boolean) && <p className="mt-3 text-sm font-bold text-coral">No seeds. Seed & Signal in town sells packets.</p>}
        </>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border-[2.5px] border-ink flex items-center justify-center" style={{ background: seed?.color }}>
              <Leaf className="w-8 h-8" style={{ transform: `scale(${0.6 + plot.growth / 200})` }} />
            </div>
            <div className="flex-1 grid gap-2">
              <Meter label="Growth" value={plot.growth} color="#8fbf4a" testid="meter-growth" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Meter label="Water" value={plot.water} color="#4fb3e8" testid="meter-water" />
            <Meter label="Health" value={plot.health} color="#ef6f7c" testid="meter-health" />
          </div>
          <p className="text-xs font-bold text-muted-foreground mt-3">
            {plot.fed ? 'Nourished with Rootworks soil: health climbs faster.' : 'Not nourished yet. Adding soil boosts health and harvest quality.'}
            {plot.water < 30 && ' Dry soil barely grows and hurts health.'}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button className="chunk bg-aqua py-3 flex flex-col items-center gap-1" disabled={ready} data-testid="button-water"
              onClick={() => run(() => game.water(plot.id), () => { sfx.water(); fx.emit(b.x, b.z, '#4fb3e8', 18); })}>
              <Droplets className="w-5 h-5" /> Water
            </button>
            <button className="chunk bg-[#e6c49a] py-3 flex flex-col items-center gap-1" disabled={plot.fed || ready} data-testid="button-feed"
              onClick={() => run(() => game.feed(plot.id), () => { sfx.feed(); fx.emit(b.x, b.z, '#8a5a3b', 14); })}>
              <Package className="w-5 h-5" /> Soil <span className="text-[10px] font-mono">({supplies} left)</span>
            </button>
            <button className={`chunk py-3 flex flex-col items-center gap-1 ${ready ? 'bg-butter' : 'bg-cream'}`} disabled={!ready} data-testid="button-harvest"
              onClick={() => run(() => game.harvest(plot.id), () => { sfx.harvest(); fx.emit(b.x, b.z, seed?.color ?? '#fbd255', 30, 1.4); closeModal(); })}>
              <Scissors className="w-5 h-5" /> Harvest
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ---------------- Shops ---------------- */
const SHOP_COPY: Record<ShopId, { kicker: string; blurb: string; accent: string }> = {
  seed: { kicker: 'Seed packets and a pirate radio upstairs', blurb: 'Mira hand-labels every packet. All cultivars are fictional.', accent: 'bg-jade' },
  rootworks: { kicker: 'Soil, tools and Moss’s strong opinions', blurb: 'Soil nourishment and equipment upgrades for your roof.', accent: 'bg-coral' },
  exchange: { kicker: 'The neighborhood market', blurb: 'Trade fictional harvest units for simulated simSOL. No real value, no real goods.', accent: 'bg-tangerine' },
  lab: { kicker: 'Small lab, big notebooks', blurb: 'The lab grades harvest quality and keeps a city plant catalog.', accent: 'bg-aqua' },
  cafe: { kicker: 'Coffee by day, records by night', blurb: 'Jun spins the house radio here. Sit, listen, breathe.', accent: 'bg-tangerine' },
};

function ShopPanel({ shop }: { shop: ShopId }) {
  const c = SHOP_COPY[shop];
  return (
    <Sheet title={SHOPS[shop].name} kicker={c.kicker} accent={c.accent} wide={shop !== 'cafe'} test={`modal-shop-${shop}`}>
      <p className="font-bold text-muted-foreground mb-4">{c.blurb}</p>
      {shop === 'seed' && <SeedShop />}
      {shop === 'rootworks' && <Rootworks />}
      {shop === 'exchange' && <Exchange />}
      {shop === 'lab' && <Lab />}
      {shop === 'cafe' && <Cafe />}
    </Sheet>
  );
}

function Wallet() {
  const money = useG(s => s.money);
  return <div className="chip inline-flex px-3 py-1 mb-3 font-display" data-testid="text-wallet">Wallet: <span className="ml-2"><Sim v={money} /></span></div>;
}

function SeedShop() {
  const seeds = useG(s => s.seeds);
  const money = useG(s => s.money);
  return (
    <>
      <Wallet />
      <div className="grid sm:grid-cols-3 gap-3">
        {SEEDS.map(s => (
          <div key={s.id} className="rounded-2xl border-[2.5px] border-ink bg-white/60 p-3 flex flex-col" data-testid={`card-seed-${s.id}`}>
            <div className="h-16 rounded-xl border-[2.5px] border-ink flex items-center justify-center" style={{ background: s.color }}>
              <Sprout className="w-8 h-8" />
            </div>
            <p className="font-display text-xl mt-2">{s.name}</p>
            <p className="text-xs font-bold text-muted-foreground flex-1">{s.description}</p>
            <p className="text-xs font-bold mt-2">{s.growSeconds}s grow · ~{s.baseYield} units</p>
            <p className="text-xs font-bold">Owned: <span className="font-mono">{seeds[s.id] ?? 0}</span></p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button className="chunk bg-butter py-2 text-sm" disabled={money < s.price} data-testid={`button-buy-${s.id}`}
                onClick={() => { if (act(() => game.buySeed(s.id, 1))) sfx.coin(); }}>Buy 1 · {s.price}</button>
              <button className="chunk bg-cream py-2 text-sm" disabled={money < s.price * 3} data-testid={`button-buy3-${s.id}`}
                onClick={() => { if (act(() => game.buySeed(s.id, 3))) sfx.coin(); }}>Buy 3 · {s.price * 3}</button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs font-bold text-muted-foreground mt-3">Prices in simSOL, a simulated currency with no real value.</p>
    </>
  );
}

function Rootworks() {
  const supplies = useG(s => s.supplies);
  const owned = useG(s => s.upgrades);
  const money = useG(s => s.money);
  return (
    <>
      <Wallet />
      <div className="rounded-2xl border-[2.5px] border-ink bg-[#e6c49a]/60 p-3 flex items-center gap-3">
        <Package className="w-9 h-9 shrink-0" />
        <div className="flex-1">
          <p className="font-display text-lg leading-tight">Rootworks soil bag</p>
          <p className="text-xs font-bold text-muted-foreground">Nourish one planted bed. You have <span className="font-mono">{supplies}</span>.</p>
        </div>
        <button className="chunk bg-butter px-4 py-2" disabled={money < ECONOMY.supplyPrice} data-testid="button-buy-supply"
          onClick={() => { if (act(() => game.buySupply())) sfx.coin(); }}>Buy · {ECONOMY.supplyPrice}</button>
      </div>
      <p className="font-display text-xl mt-4 mb-2">Upgrades</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {UPGRADES.map(u => {
          const has = owned.includes(u.id);
          return (
            <div key={u.id} className={`rounded-2xl border-[2.5px] border-ink p-3 flex flex-col ${has ? 'bg-jade/20' : 'bg-white/60'}`} data-testid={`card-upgrade-${u.id}`}>
              <Sparkles className="w-6 h-6" />
              <p className="font-display text-lg mt-1 leading-tight">{u.name}</p>
              <p className="text-xs font-bold text-muted-foreground flex-1 mt-1">{u.description}</p>
              <button className={`chunk mt-3 py-2 text-sm ${has ? 'bg-jade text-cream' : 'bg-tangerine text-cream'}`} disabled={has || money < u.price} data-testid={`button-upgrade-${u.id}`}
                onClick={() => { if (act(() => game.buyUpgrade(u.id))) { sfx.upgrade(); fx.emit(player.x, player.z, '#fbd255', 24, 1.5); } }}>
                {has ? 'Installed' : `Buy · ${u.price} simSOL`}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Exchange() {
  const harvest = useG(s => s.harvest);
  const totalSold = useG(s => s.totalSold);
  const total = harvest.reduce((a, h) => a + harvestValue(h), 0);
  return (
    <>
      <Wallet />
      {harvest.length === 0 ? (
        <div className="rounded-2xl border-[2.5px] border-dashed border-ink/40 p-6 text-center">
          <Leaf className="w-10 h-10 mx-auto text-jade" />
          <p className="font-display text-xl mt-2">Nothing to trade yet</p>
          <p className="text-sm font-bold text-muted-foreground">Harvest a fully grown bed on your rooftop, then come back.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {harvest.map(h => (
            <div key={h.id} className="flex items-center gap-3 rounded-xl border-[2.5px] border-ink bg-white/60 px-3 py-2" data-testid={`row-harvest-${h.id}`}>
              <span className="w-6 h-6 rounded-full border-2 border-ink" style={{ background: SEEDS.find(s => s.id === h.strain)?.color }} />
              <span className="font-display flex-1">{seedName(h.strain)}</span>
              <span className="text-xs font-bold">Q{h.quality}</span>
              <span className="font-mono text-sm">{h.units} $POTIFY units</span>
              <span className="font-bold text-sm"><Sim v={harvestValue(h)} /></span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button className="chunk bg-butter px-6 py-3 text-lg" disabled={!harvest.length} data-testid="button-sell-all"
          onClick={() => { if (act(() => game.sellAll())) { sfx.coin(); fx.emit(player.x, player.z, '#fbd255', 26, 1.6); } }}>
          Sell all for {total.toFixed(2)} simSOL
        </button>
        <span className="text-xs font-bold text-muted-foreground">Lifetime traded: <Sim v={totalSold} /></span>
      </div>
      <p className="text-xs font-bold text-muted-foreground mt-3">$POTIFY units are a fictional inventory measure, not tokens and not a real-world quantity. simSOL has no real value and cannot be withdrawn.</p>
    </>
  );
}

function Lab() {
  const harvest = useG(s => s.harvest);
  return (
    <>
      <p className="font-display text-lg">Quality readout</p>
      {harvest.length ? (
        <div className="grid gap-2 mt-2">
          {harvest.map(h => (
            <div key={h.id} className="rounded-xl border-[2.5px] border-ink bg-white/60 p-2.5">
              <div className="flex justify-between font-bold text-sm"><span>{seedName(h.strain)} batch</span><span>Quality tier {h.quality}</span></div>
              <div className="flex gap-1 mt-1.5">{[1, 2, 3].map(i => <span key={i} className={`h-2 flex-1 rounded-full ${i <= h.quality ? 'bg-jade' : 'bg-ink/15'}`} />)}</div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm font-bold text-muted-foreground mt-1">Bring a harvest by and the lab will grade it. Healthy, nourished beds grade higher.</p>}
      <div className="grid sm:grid-cols-3 gap-2 mt-4">
        {SEEDS.map(s => (
          <div key={s.id} className="rounded-xl border-[2.5px] border-ink p-2.5" style={{ background: `${s.color}55` }}>
            <p className="font-display">{s.name}</p>
            <p className="text-xs font-bold">{s.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border-[2.5px] border-dashed border-ink/50 p-3 flex items-center gap-3">
        <Lock className="w-5 h-5 shrink-0" />
        <p className="text-sm font-bold"><span className="text-coral font-black">FUTURE:</span> genetics and cross-breeding. Not in this build.</p>
      </div>
    </>
  );
}

function Cafe() {
  const music = useG(s => s.settings.music);
  return (
    <>
      <div className="rounded-2xl border-[2.5px] border-ink bg-ink text-cream p-4 flex items-center gap-4">
        <div className="flex items-end gap-1 h-10">
          {[0, 1, 2, 3, 4].map(i => <span key={i} className="w-2 bg-butter rounded-sm origin-bottom" style={{ height: '100%', animation: music ? `bars ${0.6 + i * 0.13}s ease-in-out infinite` : undefined, transform: music ? undefined : 'scaleY(.2)' }} />)}
        </div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-butter">On the speakers</p>
          <p className="font-display text-xl">Low Tide House Radio</p>
        </div>
      </div>
      <button className="chunk w-full mt-3 bg-butter py-3" data-testid="button-cafe-music" onClick={() => { game.setSettings({ music: !music }); sfx.click(); }}>
        {music ? 'Turn the house radio off' : 'Ask Jun to start the radio'}
      </button>
      <p className="text-sm font-bold text-muted-foreground mt-3">Jun is usually behind the counter from 8 AM to 3 PM, then at the fountain until evening.</p>
    </>
  );
}

/* ---------------- Talk ---------------- */
function Talk({ npc, line }: { npc: NpcId; line: string }) {
  const def = NPCS[npc];
  const f = useG(s => s.friendship[npc] ?? 0);
  const obj = useG(s => objective(s));
  const hearts = Math.min(5, Math.floor(f / 1));
  return (
    <Sheet title={def.name} kicker={def.role} accent="bg-butter" test="modal-talk">
      <div className="flex gap-4">
        <div className="shrink-0"><AvatarFigure shirt={def.shirt} skin={def.skin} size={76} /></div>
        <div className="flex-1">
          <div className="relative rounded-2xl border-[2.5px] border-ink bg-white/70 p-3 font-bold leading-relaxed" data-testid="text-dialogue">
            {line || `${def.name} smiles and waves.`}
          </div>
          <div className="flex items-center gap-1 mt-3" data-testid="text-friendship">
            {Array.from({ length: 5 }).map((_, i) => <Heart key={i} className={`w-5 h-5 ${i < hearts ? 'fill-coral text-ink' : 'text-ink/30'}`} />)}
            <span className="text-xs font-black ml-2 text-muted-foreground">Friendship {f}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-muted p-3 text-sm font-bold">
        <span className="text-jade font-black uppercase text-xs tracking-wider">Tip</span>
        <p>{npc === 'mira' ? `Next for you: ${obj.title}. ${obj.description}` : npc === 'moss' ? 'Soil bags cost a little but a nourished bed stays healthy longer.' : 'Green Exchange buys harvests. Higher quality, better simSOL.'}</p>
      </div>
      <p className="text-xs font-bold text-muted-foreground mt-3">Friendship grows once per day when you stop by to chat.</p>
      <button className="chunk w-full bg-tangerine text-cream py-3 mt-3" onClick={() => closeModal()} data-testid="button-bye">See you around</button>
    </Sheet>
  );
}

/* ---------------- Inventory ---------------- */
function Inventory() {
  const s = useG(st => ({ money: st.money, seeds: st.seeds, supplies: st.supplies, harvest: st.harvest, upgrades: st.upgrades, name: st.name, shirt: st.shirt, skin: st.skin }));
  return (
    <Sheet title="Your bag" kicker={s.name} wide test="modal-inventory">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="rounded-2xl border-[2.5px] border-ink bg-butter/50 p-3">
            <p className="text-xs font-black uppercase tracking-wider">Wallet</p>
            <p className="font-display text-3xl"><Sim v={s.money} /></p>
            <p className="text-[11px] font-bold text-muted-foreground">simSOL is simulated money with no real value.</p>
          </div>
          <p className="font-display text-lg mt-4">Seed packets</p>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {SEEDS.map(x => (
              <div key={x.id} className="rounded-xl border-[2.5px] border-ink p-2 text-center" style={{ background: `${x.color}66` }} data-testid={`inv-seed-${x.id}`}>
                <p className="font-display leading-tight">{x.name}</p>
                <p className="font-mono text-xl">x{s.seeds[x.id] ?? 0}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border-[2.5px] border-ink p-2.5 flex items-center gap-2 bg-[#e6c49a]/50">
            <Package className="w-5 h-5" /><span className="font-bold flex-1">Soil bags</span><span className="font-mono text-lg">x{s.supplies}</span>
          </div>
        </div>
        <div>
          <p className="font-display text-lg">Harvest</p>
          {s.harvest.length ? s.harvest.map(h => (
            <div key={h.id} className="flex items-center gap-2 rounded-xl border-[2.5px] border-ink bg-white/60 px-3 py-2 mt-1.5">
              <span className="w-5 h-5 rounded-full border-2 border-ink" style={{ background: SEEDS.find(x => x.id === h.strain)?.color }} />
              <span className="font-bold flex-1">{seedName(h.strain)} · Q{h.quality}</span>
              <span className="font-mono text-sm">{h.units} $POTIFY units</span>
            </div>
          )) : <p className="text-sm font-bold text-muted-foreground mt-1">No harvest yet.</p>}
          <p className="text-[11px] font-bold text-muted-foreground mt-2">$POTIFY units are a fictional inventory measure, not actual tokens and not a real-world quantity.</p>
          <p className="font-display text-lg mt-4">Upgrades installed</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {UPGRADES.map(u => (
              <span key={u.id} className={`chip px-3 py-1 text-xs font-black ${s.upgrades.includes(u.id) ? '!bg-jade text-cream' : 'opacity-50'}`}>{u.name}</span>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------------- Map & objectives ---------------- */
function MapPanel() {
  const area = useUI(s => s.area);
  const quest = useG(s => s.quest);
  const obj = useG(s => objective(s));
  const minute = useG(s => Math.floor(s.minute / 30) * 30);
  const day = useG(s => s.day);
  const steps: [keyof typeof quest, string][] = [['met', 'Say hello to Mira'], ['bought', 'Buy seeds at Seed & Signal'], ['planted', 'Plant a rooftop bed'], ['watered', 'Water a bed'], ['harvested', 'Harvest a grown plant'], ['sold', 'Sell at Green Exchange'], ['upgraded', 'Buy a Rootworks upgrade']];
  const px = player.x, pz = player.z;
  return (
    <Sheet title="Map & goals" kicker="No fast travel. Walk, take the stairs, say hi." wide accent="bg-jade" test="modal-map">
      <div className="grid md:grid-cols-[1.4fr_1fr] gap-4">
        <div className="grid grid-cols-2 gap-3">
          <MapCard title="Rooftop" here={area === 'roof'}>
            <svg viewBox="-13 -11 26 24" className="w-full">
              <rect x="-12.5" y="-10.5" width="25" height="23" rx="1.5" fill="#f3b38b" stroke="#13293a" strokeWidth=".4" />
              <rect x="-11" y="-9" width="8" height="7" fill="#fbd255" stroke="#13293a" strokeWidth=".3" />
              <text x="-7" y="-5" fontSize="1.4" textAnchor="middle" fontWeight="900">HOME</text>
              <rect x="3" y="-9" width="8" height="7" fill="#bfeff0" stroke="#13293a" strokeWidth=".3" />
              <text x="7" y="-5" fontSize="1.2" textAnchor="middle" fontWeight="900">GLASS</text>
              {BEDS.map(b => <rect key={b.index} x={b.x - 1.3} y={b.z - 0.8} width="2.6" height="1.6" fill="#f2703f" stroke="#13293a" strokeWidth=".25" />)}
              <rect x="8.6" y="8.2" width="3.2" height="3.6" fill="#1f9e89" stroke="#13293a" strokeWidth=".3" />
              <text x="10.2" y="10.4" fontSize="1" textAnchor="middle" fill="#fff" fontWeight="900">STAIRS</text>
              {area === 'roof' && <circle cx={px} cy={pz} r=".8" fill="#ef6f7c" stroke="#13293a" strokeWidth=".3" />}
            </svg>
          </MapCard>
          <MapCard title="Canopy Quarter" here={area === 'town'}>
            <svg viewBox="61 -17 38 34" className="w-full">
              <rect x="62" y="-16" width="36" height="30" rx="1.5" fill="#f6d9b2" stroke="#13293a" strokeWidth=".4" />
              {Object.entries(SHOPS).map(([id, s]) => (
                <g key={id}>
                  <rect x={s.x - s.w / 2} y={s.z - s.d / 2} width={s.w} height={s.d} fill={s.color} stroke="#13293a" strokeWidth=".3" />
                  <text x={s.x} y={s.z + 0.5} fontSize="1.25" textAnchor="middle" fontWeight="900">{s.name.split(' ')[0]}</text>
                </g>
              ))}
              <circle cx="80" cy="0" r="2.2" fill="#8fd6e2" stroke="#13293a" strokeWidth=".3" />
              <rect x="76" y="14.4" width="8" height="2" fill="#fff1d6" stroke="#13293a" strokeWidth=".3" />
              <text x="80" y="15.8" fontSize="1.1" textAnchor="middle" fontWeight="900">HOME</text>
              {area === 'town' && <circle cx={px} cy={pz} r=".9" fill="#ef6f7c" stroke="#13293a" strokeWidth=".3" />}
            </svg>
          </MapCard>
          <div className="col-span-2 rounded-xl bg-muted p-3 text-xs font-bold">
            <p className="font-black uppercase tracking-wider mb-1">Neighbors right now</p>
            {(Object.keys(NPCS) as NpcId[]).map(id => <p key={id}>{NPCS[id].name}: {npcSchedule(id, minute, day, quest.met).place}</p>)}
          </div>
        </div>
        <div>
          <div className="rounded-2xl border-[2.5px] border-ink bg-butter/50 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-jade">Current goal</p>
            <p className="font-display text-xl">{obj.title}</p>
            <p className="text-sm font-bold">{obj.description}</p>
          </div>
          <ul className="mt-3 grid gap-1.5">
            {steps.map(([k, label]) => (
              <li key={k} className="flex items-center gap-2 font-bold text-sm" data-testid={`goal-${k}`}>
                <span className={`w-5 h-5 rounded-md border-2 border-ink ${quest[k] ? 'bg-jade' : 'bg-white/60'}`} />
                <span className={quest[k] ? 'line-through text-muted-foreground' : ''}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Sheet>
  );
}
function MapCard({ title, here, children }: { title: string; here: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border-[2.5px] border-ink p-2 ${here ? 'bg-butter/40' : 'bg-white/50'}`}>
      <p className="font-display text-sm flex justify-between">{title}{here && <span className="text-coral text-xs">YOU</span>}</p>
      {children}
    </div>
  );
}

/* ---------------- Calendar ---------------- */
function Calendar() {
  const s = useG(st => ({ day: st.day, minute: Math.floor(st.minute / 10) * 10, plots: st.plots, harvest: st.harvest.length, friendship: st.friendship, lastTalkDay: st.lastTalkDay, met: st.quest.met }));
  const planted = s.plots.filter(p => p.strain);
  const watered = planted.filter(p => p.water >= 45).length;
  const fed = planted.filter(p => p.fed).length;
  const ready = planted.filter(p => p.growth >= 100).length;
  const weekStart = Math.floor((s.day - 1) / 7) * 7 + 1;
  const names = ['Sprout', 'Mist', 'Root', 'Bloom', 'Market', 'Signal', 'Hush'];
  const routine = [
    { done: planted.length === 6, text: `Fill your beds (${planted.length}/6 planted)` },
    { done: planted.length > 0 && watered === planted.length, text: `Keep soil damp (${watered}/${planted.length} hydrated)` },
    { done: planted.length > 0 && fed === planted.length, text: `Nourish with soil (${fed}/${planted.length})` },
    { done: ready === 0, text: ready ? `${ready} bed(s) ready to harvest` : 'Nothing waiting to harvest' },
    { done: s.harvest === 0, text: s.harvest ? `Sell ${s.harvest} batch(es) at Green Exchange` : 'Market run: nothing to sell' },
    ...(Object.keys(NPCS) as NpcId[]).map(id => ({ done: s.lastTalkDay[id] === s.day, text: `Chat with ${NPCS[id].name}` })),
  ];
  return (
    <Sheet title={`Day ${s.day}`} kicker={`${formatTime(s.minute)} · 8-minute days`} accent="bg-aqua" test="modal-calendar">
      <div className="grid grid-cols-7 gap-1.5">
        {names.map((n, i) => {
          const d = weekStart + i;
          const cur = d === s.day;
          return (
            <div key={n} className={`rounded-xl border-[2.5px] border-ink text-center py-2 ${cur ? 'bg-tangerine text-cream' : d < s.day ? 'bg-ink/10' : 'bg-white/60'}`}>
              <p className="text-[9px] font-black uppercase">{n}</p>
              <p className="font-display text-xl">{d}</p>
            </div>
          );
        })}
      </div>
      <p className="font-display text-lg mt-4">Today’s routine</p>
      <ul className="grid gap-1.5 mt-1">
        {routine.map((r, i) => (
          <li key={i} className="flex items-center gap-2 text-sm font-bold">
            <span className={`w-5 h-5 rounded-md border-2 border-ink ${r.done ? 'bg-jade' : 'bg-white/60'}`} />{r.text}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl bg-muted p-3 text-sm font-bold flex items-center gap-3">
        <Moon className="w-5 h-5 shrink-0" />
        Sleep in your apartment bed to skip to a fresh morning. Plants keep growing overnight.
      </div>
    </Sheet>
  );
}

/* ---------------- Avatar ---------------- */
function AvatarPanel() {
  const cur = useG(s => ({ name: s.name, shirt: s.shirt, skin: s.skin }));
  const [name, setName] = useState(cur.name);
  const [shirt, setShirt] = useState(cur.shirt);
  const [skin, setSkin] = useState(cur.skin);
  return (
    <Sheet title="Wardrobe" kicker="Change your look anytime" accent="bg-coral" test="modal-avatar">
      <div className="flex gap-4 items-center">
        <AvatarFigure shirt={shirt} skin={skin} size={96} />
        <div className="flex-1">
          <label className="font-display" htmlFor="avatar-name">Name</label>
          <input id="avatar-name" value={name} maxLength={20} onChange={e => setName(e.target.value)} data-testid="input-avatar-name"
            className="w-full mt-1 rounded-xl border-[2.5px] border-ink bg-white/70 px-3 py-2 font-bold outline-none focus:ring-4 ring-butter" />
        </div>
      </div>
      <p className="font-display mt-4">Shirt</p>
      <Swatches colors={SHIRTS} value={shirt} onChange={setShirt} test="av-shirt" />
      <p className="font-display mt-3">Skin tone</p>
      <Swatches colors={SKINS} value={skin} onChange={setSkin} test="av-skin" />
      <button className="chunk w-full bg-tangerine text-cream py-3 mt-5" data-testid="button-save-avatar"
        onClick={() => { if (act(() => game.customize({ name: name.trim() || cur.name, shirt, skin }))) { sfx.upgrade(); closeModal(); } }}>Save look</button>
    </Sheet>
  );
}

/* ---------------- Settings ---------------- */
function Toggle({ on, onClick, label, test }: { on: boolean; onClick: () => void; label: string; test: string }) {
  return (
    <button onClick={() => { sfx.click(); onClick(); }} className="flex items-center justify-between w-full py-2" data-testid={test}>
      <span className="font-bold">{label}</span>
      <span className={`w-14 h-8 rounded-full border-[2.5px] border-ink p-0.5 transition-colors ${on ? 'bg-jade' : 'bg-ink/15'}`}>
        <span className={`block w-6 h-6 rounded-full bg-cream border-2 border-ink transition-transform ${on ? 'translate-x-6' : ''}`} />
      </span>
    </button>
  );
}

function SettingsPanel() {
  const st = useG(s => s.settings);
  const saveError = useG(s => s.saveError);
  const savedAt = useG(s => s.savedAt);
  const [confirm, setConfirm] = useState(false);
  return (
    <Sheet title="Settings" kicker="Sound, camera, graphics, save" accent="bg-jade" test="modal-settings">
      <Toggle on={!st.muted} onClick={() => game.setSettings({ muted: !st.muted })} label="Sound effects and audio" test="toggle-sound" />
      <Toggle on={st.music} onClick={() => game.setSettings({ music: !st.music })} label="Radio music" test="toggle-music" />
      <p className="font-bold mt-3">Camera <span className="text-xs text-muted-foreground">(<Kbd>Q</Kbd> closer, <Kbd>R</Kbd> higher)</span></p>
      <div className="grid grid-cols-4 gap-2 mt-1.5">
        {CAMERA_PRESETS.map((c, i) => (
          <button key={c.name} onClick={() => { game.setSettings({ camera: i }); sfx.click(); }} data-testid={`button-camera-${i}`}
            className={`chunk py-2 text-sm ${Math.round(st.camera) === i ? 'bg-butter' : 'bg-cream'}`}>{c.name}</button>
        ))}
      </div>
      <p className="font-bold mt-4">Graphics</p>
      <div className="grid grid-cols-2 gap-2 mt-1.5">
        {(['low', 'high'] as const).map(q => (
          <button key={q} onClick={() => { game.setSettings({ quality: q }); sfx.click(); }} data-testid={`button-quality-${q}`}
            className={`chunk py-2 text-sm ${st.quality === q ? 'bg-butter' : 'bg-cream'}`}>{q === 'low' ? 'Light (battery saver)' : 'Full (shadows)'}</button>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-muted p-3">
        <p className="text-sm font-bold">{saveError ? <span className="text-coral">{saveError}</span> : savedAt ? `Last saved ${new Date(savedAt).toLocaleTimeString()}` : 'Not saved yet.'}</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button className="chunk bg-cream py-2 flex items-center justify-center gap-2" data-testid="button-save" onClick={() => act(() => game.save())}><Save className="w-4 h-4" /> Save now</button>
          {!confirm ? (
            <button className="chunk bg-coral text-cream py-2" onClick={() => setConfirm(true)} data-testid="button-reset">Reset save</button>
          ) : (
            <button className="chunk bg-destructive text-cream py-2" data-testid="button-confirm-reset-settings"
              onClick={() => { act(() => game.reset()); ui.set({ modal: null, inGame: false, area: 'roof', zone: 'rooftop' }); player.x = 0; player.z = 4; }}>Really erase?</button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

/* ---------------- Roadmap ---------------- */
const FUTURE = [
  ['Seasons', 'Weather and seasonal cultivars changing the rooftop rhythm.'],
  ['Genetics', 'Cross-breeding fictional cultivars at Petri & Pistil Lab.'],
  ['Routines', 'Automations and daily schedules for your beds.'],
  ['Decorating', 'Furnish Home 7B and dress up the roof.'],
  ['Community', 'Festivals, shared gardens and neighbor quests.'],
  ['Warehouse & districts', 'New neighborhoods beyond the Canopy Quarter.'],
  ['Read-only wallet profiles', 'Optional, display-only profile badges. No transfers, no on-chain actions.'],
];
function Roadmap() {
  return (
    <Sheet title="Roadmap" kicker="What might come later" accent="bg-butter" test="modal-roadmap">
      <p className="font-bold text-muted-foreground mb-3">Everything below is <b>FUTURE</b> and not implemented in this build. This slice is offline, single player, and uses only simulated simSOL.</p>
      <div className="grid gap-2">
        {FUTURE.map(([t, d]) => (
          <div key={t} className="rounded-xl border-[2.5px] border-dashed border-ink/60 p-3 flex gap-3 items-start opacity-90">
            <span className="text-[10px] font-black bg-ink text-butter px-2 py-1 rounded-md shrink-0">FUTURE</span>
            <div><p className="font-display text-lg leading-tight">{t}</p><p className="text-sm font-bold text-muted-foreground">{d}</p></div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- Pause & sleep ---------------- */
function Pause() {
  const items: [string, () => void, string][] = [
    ['Resume', () => closeModal(), 'Esc'],
    ['Bag', () => openModal({ type: 'inventory' }), 'I'],
    ['Map & goals', () => openModal({ type: 'map' }), 'M'],
    ['Daily calendar', () => openModal({ type: 'calendar' }), 'L'],
    ['Wardrobe', () => openModal({ type: 'avatar' }), 'C'],
    ['Settings', () => openModal({ type: 'settings' }), 'O'],
    ['Roadmap', () => openModal({ type: 'roadmap' }), ''],
    ['Save game', () => act(() => game.save()), ''],
    ['City Devlog', () => { game.save(); window.location.assign(`${import.meta.env.BASE_URL}devlog/`); }, ''],
    ['Title screen', () => { game.save(); ui.set({ modal: null, inGame: false }); }, ''],
  ];
  return (
    <Sheet title="Paused" kicker="The clock stops while menus are open" test="modal-pause">
      <div className="grid gap-2">
        {items.map(([l, fn, k], i) => (
          <button key={l} onClick={fn} className={`chunk py-3 px-4 flex items-center justify-between ${i === 0 ? 'bg-tangerine text-cream' : 'bg-cream'}`} data-testid={`button-pause-${l.toLowerCase().replace(/\W+/g, '-')}`}>
            <span className="font-display text-lg">{l}</span>{k && <Kbd>{k}</Kbd>}
          </button>
        ))}
      </div>
      <p className="text-xs font-bold text-muted-foreground mt-4">Controls: WASD or arrows to walk, Shift to jog, E / Enter / Space to interact, Q / R camera, N mute.</p>
    </Sheet>
  );
}

function SleepPanel() {
  const minute = useG(s => s.minute);
  return (
    <Sheet title="Turn in for the night?" kicker={`It is ${formatTime(minute)}`} accent="bg-[#21406a]" test="modal-sleep">
      <p className="font-bold">You will wake at a fresh morning. Planted beds keep growing overnight, so water them before bed.</p>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button className="chunk bg-cream py-3" onClick={() => closeModal()}>Stay up</button>
        <button className="chunk bg-[#21406a] text-cream py-3 flex items-center justify-center gap-2" onClick={doSleep} data-testid="button-sleep"><Moon className="w-4 h-4" /> Sleep</button>
      </div>
    </Sheet>
  );
}
