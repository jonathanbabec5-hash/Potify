import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { game } from '@/game/store';
import { joy, npcPos, player, ui, useG, useUI, type Interactable, type NpcId } from '@/game/runtime';
import { NPCS, ROOF_BOUNDS, ROOF_COLLIDERS, STATIC_TARGETS, TOWN_BOUNDS, TOWN_COLLIDERS, npcSchedule, zoneAt, type AABB } from '@/game/world';
import { sfx } from '@/game/audio';
import { Character } from '@/scene/Character';

export type Ctl = 'forward' | 'back' | 'left' | 'right' | 'run';
const R = 0.35;

function blocked(x: number, z: number, cols: AABB[]) {
  for (const c of cols) if (x + R > c[0] && x - R < c[1] && z + R > c[2] && z - R < c[3]) return true;
  return false;
}

function bedPrompt(i: number): string {
  const p = game.getState().plots[i];
  if (!p) return 'Tend';
  if (!p.strain) return 'Plant';
  if (p.growth >= 100) return 'Harvest';
  if (p.water < 45) return 'Water';
  if (!p.fed) return 'Nourish';
  return 'Check';
}

export function Player() {
  const group = useRef<THREE.Group>(null);
  const speed = useRef(0);
  const [, getKeys] = useKeyboardControls<Ctl>();
  const shirt = useG(s => s.shirt);
  const skin = useG(s => s.skin);
  const lastSave = useRef(0);
  const stepAcc = useRef(0);

  useEffect(() => {
    const p = game.getState().position;
    const area = p.zone === 'town' ? 'town' : 'roof';
    const cols = area === 'town' ? TOWN_COLLIDERS : ROOF_COLLIDERS;
    const ok = Number.isFinite(p.x) && Number.isFinite(p.z) && !blocked(p.x, p.z, cols);
    player.x = ok ? p.x : area === 'town' ? 80 : 0;
    player.z = ok ? p.z : area === 'town' ? 12 : 4;
    ui.set({ area, zone: zoneAt(area, player.x, player.z) });
  }, []);

  useFrame((st, raw) => {
    const dt = Math.min(raw, 0.05);
    const u = ui.get();
    let mx = 0, mz = 0, run = false;
    if (u.inGame && !u.modal && !u.fading) {
      const k = getKeys();
      mx = (k.right ? 1 : 0) - (k.left ? 1 : 0) + joy.x;
      mz = (k.back ? 1 : 0) - (k.forward ? 1 : 0) + joy.y;
      run = k.run;
    }
    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }
    const sp = (run ? 7 : 4.4) * Math.min(1, len);
    const cols = u.area === 'town' ? TOWN_COLLIDERS : ROOF_COLLIDERS;
    const b = u.area === 'town' ? TOWN_BOUNDS : ROOF_BOUNDS;
    if (len > 0.08) {
      const nx = THREE.MathUtils.clamp(player.x + mx * sp * dt, b.minX, b.maxX);
      if (!blocked(nx, player.z, cols)) player.x = nx;
      const nz = THREE.MathUtils.clamp(player.z + mz * sp * dt, b.minZ, b.maxZ);
      if (!blocked(player.x, nz, cols)) player.z = nz;
      const target = Math.atan2(mx, mz);
      let d = target - player.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      player.yaw += d * Math.min(1, dt * 12);
      stepAcc.current += sp * dt;
      if (stepAcc.current > (run ? 1.1 : 0.85)) { stepAcc.current = 0; sfx.step(); }
    }
    player.speed = len > 0.08 ? sp : 0;
    speed.current = THREE.MathUtils.lerp(speed.current, player.speed, Math.min(1, dt * 10));
    if (group.current) {
      group.current.position.set(player.x, 0, player.z);
      group.current.rotation.y = player.yaw;
    }

    const zone = zoneAt(u.area, player.x, player.z);
    if (zone !== u.zone) { ui.set({ zone }); game.setPosition({ x: player.x, z: player.z, zone }); }
    const now = st.clock.elapsedTime;
    if (u.inGame && now - lastSave.current > 0.25) {
      lastSave.current = now;
      game.setPosition({ x: player.x, z: player.z, zone });
    }

    // nearest interaction target
    let best: Interactable | null = null;
    let bd = Infinity;
    for (const t of STATIC_TARGETS) {
      if (t.area !== u.area) continue;
      const d = Math.hypot(t.x - player.x, t.z - player.z);
      if (d < t.r && d < bd) { bd = d; best = t; }
    }
    for (const id of Object.keys(npcPos) as NpcId[]) {
      const n = npcPos[id];
      if (n.area !== u.area) continue;
      const d = Math.hypot(n.x - player.x, n.z - player.z);
      if (d < 2.1 && d - 0.3 < bd) {
        bd = d - 0.3;
        best = { id: `npc-${id}`, kind: 'npc', x: n.x, z: n.z, r: 2.1, label: NPCS[id].name, verb: 'Talk', area: u.area, npc: id };
      }
    }
    if (best && best.kind === 'bed') best = { ...best, verb: bedPrompt(best.index ?? 0) };
    if (!u.inGame) best = null;
    const prev = u.prompt;
    if ((prev?.id ?? null) !== (best?.id ?? null) || prev?.verb !== best?.verb || (best?.kind === 'npc' && prev && Math.hypot(prev.x - best.x, prev.z - best.z) > 0.3)) {
      ui.set({ prompt: best });
    }
  });

  return (
    <group ref={group}>
      <Character shirt={shirt} skin={skin} hair="#13293a" variant="player" speed={speed} />
    </group>
  );
}

function Npc({ id }: { id: NpcId }) {
  const g = useRef<THREE.Group>(null);
  const speed = useRef(0);
  const area = useUI(s => s.area);
  const def = NPCS[id];
  const init = useRef(false);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const s = game.getState();
    const tgt = npcSchedule(id, s.minute, s.day, s.quest.met);
    const n = npcPos[id];
    if (!init.current || tgt.area !== n.area) { init.current = true; n.area = tgt.area; n.x = tgt.x; n.z = tgt.z; }
    const dx = tgt.x - n.x, dz = tgt.z - n.z;
    const d = Math.hypot(dx, dz);
    const paused = ui.get().modal?.type === 'talk' && (ui.get().modal as { npc: string }).npc === id;
    if (d > 0.1 && !paused) {
      const v = Math.min(d, 1.7 * dt);
      n.x += (dx / d) * v; n.z += (dz / d) * v;
      n.yaw = Math.atan2(dx, dz);
      n.speed = 1.7;
    } else {
      n.speed = 0;
      const toP = Math.atan2(player.x - n.x, player.z - n.z);
      if (Math.hypot(player.x - n.x, player.z - n.z) < 4) {
        let dd = toP - n.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); n.yaw += dd * Math.min(1, dt * 5);
      }
    }
    speed.current = n.speed;
    if (g.current) {
      g.current.visible = n.area === area;
      g.current.position.set(n.x, 0, n.z);
      g.current.rotation.y = n.yaw;
    }
  });
  return (
    <group ref={g}>
      <Character shirt={def.shirt} skin={def.skin} hair={def.hair} variant={id} speed={speed} />
    </group>
  );
}

export function NPCs() {
  return (<><Npc id="mira" /><Npc id="moss" /><Npc id="jun" /></>);
}

export function PromptMarker() {
  const prompt = useUI(s => s.prompt);
  const r = useRef<THREE.Group>(null);
  useFrame(st => {
    if (!r.current) return;
    const p = ui.get().prompt;
    if (p?.kind === 'npc' && p.npc) { r.current.position.x = npcPos[p.npc].x; r.current.position.z = npcPos[p.npc].z; }
    r.current.rotation.y = st.clock.elapsedTime * 1.5;
    r.current.scale.setScalar(1 + Math.sin(st.clock.elapsedTime * 5) * 0.06);
  });
  if (!prompt) return null;
  const h = prompt.kind === 'npc' ? 2.7 : prompt.kind === 'bed' ? 0.7 : 0.05;
  return (
    <group ref={r} position={[prompt.x, 0, prompt.z]}>
      <mesh position={[0, h + 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[prompt.kind === 'bed' ? 1.55 : 0.7, prompt.kind === 'bed' ? 1.72 : 0.84, 6]} />
        <meshBasicMaterial color="#fbd255" transparent opacity={0.9} depthWrite={false} />
      </mesh>
      {prompt.kind === 'npc' && (
        <mesh position={[0, h + 0.5, 0]}>
          <octahedronGeometry args={[0.18, 0]} />
          <meshBasicMaterial color="#fbd255" />
        </mesh>
      )}
    </group>
  );
}
