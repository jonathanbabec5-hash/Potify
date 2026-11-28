import { game } from '@/game/store';
import { act, fx, openModal, player, toast, ui, type Area, type Interactable } from '@/game/runtime';
import { sfx } from '@/game/audio';
import { zoneAt } from '@/game/world';

export function teleport(area: Area, x: number, z: number, yaw: number) {
  if (ui.get().fading) return;
  ui.set({ fading: true, prompt: null });
  sfx.door();
  setTimeout(() => {
    player.x = x; player.z = z; player.yaw = yaw;
    const zone = zoneAt(area, x, z);
    ui.set({ area, zone });
    game.setPosition({ x, z, zone });
  }, 380);
  setTimeout(() => ui.set({ fading: false }), 820);
}

export function interact(t: Interactable | null) {
  const u = ui.get();
  if (!t || !u.inGame || u.modal || u.fading) return;
  switch (t.kind) {
    case 'bed': openModal({ type: 'bed', index: t.index ?? 0 }); break;
    case 'door-down': teleport('town', 80, 13.2, Math.PI); break;
    case 'door-up': teleport('roof', 7.0, 9.9, -Math.PI / 2); break;
    case 'shop': openModal({ type: 'shop', shop: t.shop! }); break;
    case 'npc': {
      const line = game.talk(t.npc!);
      sfx.talk();
      fx.emit(t.x, t.z, '#ef6f7c', 8, 2);
      openModal({ type: 'talk', npc: t.npc!, line: typeof line === 'string' ? line : '' });
      break;
    }
    case 'sleep': openModal({ type: 'sleep' }); break;
    case 'wardrobe': openModal({ type: 'avatar' }); break;
    case 'radio': {
      const m = !game.getState().settings.music;
      game.setSettings({ music: m });
      sfx.click();
      toast(m ? 'Radio on: Low Tide late-night set.' : 'Radio off. Just the city hum now.');
      break;
    }
    case 'rack': openModal({ type: 'inventory' }); break;
    case 'planner': openModal({ type: 'calendar' }); break;
    case 'board': openModal({ type: 'map' }); break;
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
  setTimeout(() => { act(() => game.sleep()); }, 400);
  setTimeout(() => ui.set({ fading: false }), 1300);
}
