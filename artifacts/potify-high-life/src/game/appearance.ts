export const CAMPAIGN_SHIRT = '#ebe2e6';
export const CAMPAIGN_SKIN = '#d9a67d';

export const HAIR_STYLES = {
  sweep: 'Swept crop',
  coils: 'Coils',
  tail: 'Low ponytail',
} as const;

export type HairStyle = keyof typeof HAIR_STYLES;
export interface HeadLook {
  hairStyle: HairStyle;
  wearsCap: boolean;
}

export const ORIGINAL_LOOK: HeadLook = { hairStyle: 'sweep', wearsCap: true };

export function isHairStyle(value: unknown): value is HairStyle {
  return typeof value === 'string' && Object.hasOwn(HAIR_STYLES, value);
}

export function readHeadLook(value: { hairStyle?: unknown; wearsCap?: unknown }, fallback = ORIGINAL_LOOK): HeadLook {
  return {
    hairStyle: isHairStyle(value.hairStyle) ? value.hairStyle : fallback.hairStyle,
    wearsCap: typeof value.wearsCap === 'boolean' ? value.wearsCap : fallback.wearsCap,
  };
}
