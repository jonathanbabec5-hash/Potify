import assert from 'node:assert/strict';
import { test } from 'node:test';

// Browser storage is emulated here; the UI/renderer is checked separately.
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.window = { addEventListener() {} };
globalThis.document = { addEventListener() {}, visibilityState: 'visible' };
const model = await import('../store.ts');
const { game, SEEDS, UPGRADES, harvestValue, SAVE_KEY, validateSave } = model;
const growFor = seconds => { for (let i = 0; i < seconds * 4; i++) game.tick(0.25); };

test('complete first-day loop, all upgrades, time, friendship and browser reload', async () => {
  assert.equal(game.getState().started, false);
  game.start({ name: 'Test grower', shirt: '#225533' });
  assert.equal(game.getState().acknowledged, true);
  assert.equal(game.getState().name, 'Test grower');
  game.talk('mira');
  game.talk('mira');
  assert.equal(game.getState().friendship.mira, 10, 'repeated same-day dialogue cannot farm friendship');
  const balance = game.getState().money;
  game.buySeed('sunhaze', -1);
  game.buySeed('invalid');
  assert.equal(game.getState().money, balance);
  game.buySeed('sunhaze');
  assert.equal(game.getState().seeds.sunhaze, 3);
  game.plant(0, 'sunhaze');
  game.water(0);
  game.feed(0);
  game.plant(1, 'sunhaze');
  const initialSeeds = game.getState().seeds.sunhaze;
  game.plant(1, 'sunhaze');
  assert.equal(game.getState().seeds.sunhaze, initialSeeds, 'occupied beds cannot consume a second packet');
  game.harvest(0);
  assert.equal(game.getState().harvest.length, 0, 'cannot harvest early');
  growFor(91);
  assert.equal(game.getState().plots[0].growth, 100);
  assert.ok(game.getState().plots[1].growth < 20, 'dry plants grow more slowly');
  game.harvest(0);
  const crop = game.getState().harvest[0];
  assert.ok(crop.units > 0);
  assert.equal(crop.quality, 3, 'water and nourishment improve grade');
  const beforeSell = game.getState().money;
  const saleValue = harvestValue(crop);
  game.sellAll();
  assert.equal(game.getState().harvest.length, 0);
  assert.equal(game.getState().money, Math.round((beforeSell + saleValue) * 100) / 100);
  game.buyUpgrade('watering');
  assert.ok(game.getState().upgrades.includes('watering'));
  assert.equal(game.getState().quest.rewarded, true);
  const upgradedBalance = game.getState().money;
  game.buyUpgrade('watering');
  assert.equal(game.getState().money, upgradedBalance, 'owned upgrades cannot charge twice');

  // Repeatable loop funds every upgrade without external payments or cheats.
  for (let cycle = 0; cycle < 4; cycle++) {
    for (const plot of game.getState().plots) {
      if (!plot.strain) {
        if (!game.getState().seeds.sunhaze) game.buySeed('sunhaze');
        game.plant(plot.id, 'sunhaze');
      }
    }
    game.water(0);
    assert.ok(game.getState().plots.filter(p => p.strain).every(p => p.water === 100), `watering upgrade affects every planted bed: cycle ${cycle}`);
    growFor(91);
    for (const plot of game.getState().plots) game.harvest(plot.id);
    game.sellAll();
    for (const upgrade of UPGRADES) {
      if (!game.getState().upgrades.includes(upgrade.id) && game.getState().money >= upgrade.price) {
        game.buyUpgrade(upgrade.id);
      }
    }
  }
  assert.equal(game.getState().upgrades.length, 3);
  assert.ok(Object.values(game.getState().quest).every(Boolean));
  game.buySeed('moonmint');
  game.plant(0, 'moonmint');
  game.water(0);
  assert.equal(game.getState().plots[0].health, 83, 'living soil raises starting health');
  growFor(10);
  game.setPosition({ x: 7.5, z: -4, zone: 'town' });
  game.setSettings({ muted: true, quality: 'low' });
  const day = game.getState().day;
  game.sleep();
  assert.equal(game.getState().day, day + 1);
  game.talk('mira');
  assert.equal(game.getState().friendship.mira, 20);
  game.save();
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
  assert.ok(validateSave(saved));
  const reloaded = await import(`../store.ts?reload=${Date.now()}`);
  for (const field of ['position', 'money', 'plots', 'upgrades', 'quest', 'seeds', 'settings', 'friendship']) {
    assert.deepEqual(reloaded.game.getState()[field], saved[field], `${field} survives reload`);
  }
  assert.ok(SEEDS.length >= 3);
});

test('corrupt local saves remain intact and visibly report an error', async () => {
  const corrupt = '{"version":1,"money":"broken"}';
  localStorage.setItem(SAVE_KEY, corrupt);
  const broken = await import(`../store.ts?corrupt=${Date.now()}`);
  assert.ok(broken.game.getState().saveError);
  broken.game.start();
  broken.game.save();
  assert.equal(localStorage.getItem(SAVE_KEY), corrupt, 'invalid save is not silently overwritten');
  broken.game.reset();
  broken.game.start({ name: 'Fresh start' });
  assert.equal(broken.game.getState().saveError, null);
  assert.equal(JSON.parse(localStorage.getItem(SAVE_KEY)).name, 'Fresh start');
});
