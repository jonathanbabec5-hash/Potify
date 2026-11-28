import { game } from '@/game/store';
import { act, camCtl, fx, joy, openModal, player, toast, ui, type Area, type Interactable } from '@/game/runtime';
import { RECORD_TITLE, sfx } from '@/game/audio';
import { STOREY, stairHeight } from './house';
import { zoneAt } from '@/game/world';
import { FIRST_LIGHT_YAW, FIRST_LIGHT_PITCH } from './opening';
import { newWalkHeading } from './walkCamera';

let transferTimer: ReturnType<typeof setTimeout> | undefined;
let fadeTimer: ReturnType<typeof setTimeout> | undefined;

export function restoreResident(inGame: boolean, opening: ReturnType<typeof ui.get>['opening'] = null) {
  const { x, z, zone, floor = 7 } = game.getState().position;
  const area = zone === 'tower' || zone === 'town' ? zone : 'roof';
  player.x = x;
  player.z = z;
  player.y = zone === 'tower' ? (floor - 1) * STOREY + stairHeight(x, z) : 0;
  player.speed = joy.x = joy.y = 0;
  camCtl.walk = newWalkHeading(); camCtl.manualUntil = 0; camCtl.dragging = false;
  if (opening) { camCtl.yawOffset = FIRST_LIGHT_YAW; camCtl.pitch = FIRST_LIGHT_PITCH; player.yaw = Math.PI; }
  ui.set({ area, zone, floor, inGame, opening, modal: null, prompt: null, fading: false, toasts: [] });
}

export function resetResident() {
  const result = game.reset();
  if (result.ok) {
    clearTimeout(transferTimer);
    clearTimeout(fadeTimer);
    fx.parts.length = fx.pending.length = 0;
    player.yaw = Math.PI;
    camCtl.yawOffset = 0;
    camCtl.pitch = -0.15;
    restoreResident(false);
  }
  return result;
}

export function teleport(area: Area, x: number, z: number, yaw: number, floor = 1) {
  if (ui.get().fading) return;
  ui.set({ fading: true, prompt: null });
  sfx.door();
  transferTimer = setTimeout(() => {
    player.x = x; player.z = z; player.yaw = yaw;
    camCtl.walk = newWalkHeading();
    const zone = zoneAt(area, x, z);
    ui.set({ area, zone, floor, prompt: null });
    game.setPosition({ x, z, zone, ...(area === 'tower' ? { floor } : {}) });
    game.save();
  }, 380);
  fadeTimer = setTimeout(() => ui.set({ fading: false }), 820);
}

export function interact(t: Interactable | null) {
  const u = ui.get();
  if (!t || !u.inGame || u.opening || u.modal || u.fading) return;
  switch (t.kind) {
    case 'bed': openModal({ type: 'bed', index: t.index ?? 0 }); break;
    case 'door-down': teleport('tower', 0.7, 2.9, Math.PI, 24); break;
    case 'door-up': teleport('tower', 0.7, 2.9, Math.PI, 1); break;
    case 'street': teleport('town',80,13.1,Math.PI); break;
    case 'house': if (t.id === 'house-roof') { teleport('roof',7.2,9.9,-Math.PI/2); break; } if (t.room) openModal({ type: 'house', room: t.room }); break;
    case 'neighbor':
      if (t.who) { const line = game.visitNeighbor(t.who); if (line) { openModal({ type:'neighbor', who:t.who, line }); sfx.murmur(t.who); } }
      break;
    case 'shop': openModal({ type: 'shop', shop: t.shop! }); break;
    case 'npc': {
      const line = game.talk(t.npc!);
      sfx.murmur(t.npc!);
      fx.emit(t.x, t.z, '#ef6f7c', 8, 2);
      openModal({ type: 'talk', npc: t.npc!, line: typeof line === 'string' ? line : '' });
      break;
    }
    case 'sleep': openModal({ type: 'sleep' }); break;
    case 'wardrobe': openModal({ type: 'avatar' }); break;
    case 'radio': {
      const { music, muted } = game.getState().settings;
      const m = !music || muted;
      game.setSettings(m ? { music: true, muted: false } : { music: false });
      sfx.click();
      toast(m ? 'POTIFY radio · ' + RECORD_TITLE : 'Radio off. Just the city hum now.');
      break;
    }
    case 'warehouse-lease': case 'freight': openModal({ type: t.kind }); break;
    case 'cart': openModal({ type: 'cart' }); break;
    case 'rack': openModal({ type: 'inventory' }); break;
    case 'planner': openModal({ type: 'calendar' }); break;
    case 'board': openModal({ type: 'house', room: 'town-board' }); break;
    case 'story-item': {
      if (!t.storyItem) break;
      game.readStoryItem(t.storyItem);
      openModal({ type: 'story-page', page: t.storyItem });
      break;
    }
  }
}

export function doSleep() {
  ui.set({ fading: true, modal: null });
  sfx.sleep();
  transferTimer = setTimeout(() => { act(() => game.sleep()); }, 400);
  fadeTimer = setTimeout(() => ui.set({ fading: false }), 1300);
}
