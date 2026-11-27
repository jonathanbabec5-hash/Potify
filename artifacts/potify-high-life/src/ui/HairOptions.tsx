import { useId } from 'react';
import { HAIR_STYLES, type HeadLook, type HairStyle } from '@/game/appearance';

export function HairOptions({ look, onChange }: { look: HeadLook; onChange: (look: HeadLook) => void }) {
  const group = useId();
  return <fieldset className="mt-3 min-w-0">
    <legend className="font-display">Hairstyle</legend>
    <div className="mt-1.5 flex flex-wrap gap-2">
      {(Object.keys(HAIR_STYLES) as HairStyle[]).map(style => <label key={style}
        className="cursor-pointer rounded-full border px-3 py-2 text-sm font-bold has-[:focus-visible]:outline"
        style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', background: look.hairStyle === style ? '#354f40' : '#f6f3e8', color: look.hairStyle === style ? '#fff7e2' : '#304436' }}>
        <input className="sr-only" type="radio" name={group} value={style} checked={style === look.hairStyle}
          onChange={() => onChange({ ...look, hairStyle: style })} />
        {HAIR_STYLES[style]}
      </label>)}
    </div>
    <label className="flex cursor-pointer items-center gap-2 font-bold" style={{minHeight:44}}>
      <input type="checkbox" role="switch" className="h-5 w-5 accent-[#354f40]" checked={look.wearsCap}
        onChange={event => onChange({ ...look, wearsCap: event.target.checked })} />
      POTIFY knit cap
    </label>
  </fieldset>;
}
