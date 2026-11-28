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

test('legacy saves can start The Lease and carry their first sale into the story', async () => {
  localStorage.removeItem(SAVE_KEY);
  const { game: beforeUpdate } = await import('../store.ts?before-story');
  beforeUpdate.start();
  beforeUpdate.plant(0, 'sunhaze');
  beforeUpdate.water(0);
  for (let i = 0; i < 364; i++) beforeUpdate.tick(0.25);
  beforeUpdate.harvest(0);
  beforeUpdate.sellAll();
  const original = beforeUpdate.getState();
  assert.ok(original.quest.sold);
  const { story: _story, ...legacy } = original;
  localStorage.setItem(SAVE_KEY, JSON.stringify(legacy));
  const { game: migrated } = await import('../store.ts?legacy-story');
  assert.equal(migrated.getState().saveError, null);
  assert.equal(migrated.getState().totalSold, original.totalSold);
  assert.deepEqual(migrated.getState().quest, original.quest);
  assert.deepEqual(migrated.getState().plots, original.plots);
  assert.deepEqual(migrated.getState().story.tasks, { latch: 'available', signal: 'available', ledger: 'available' });

  migrated.readStoryItem('latch');
  assert.equal(migrated.getState().story.tasks.latch, 'found', 'an early discovery is recorded');
  assert.equal(migrated.chooseStoryReply('moss', 'return-latch'), null, 'the lease opens the jobs');
  migrated.readStoryItem('lease');
  assert.ok(migrated.chooseStoryReply('mira', 'ask-moss'));
  assert.equal(migrated.chooseStoryReply('mira', 'ask-jun'), null, 'the chosen lead stays on file');
  assert.equal(migrated.chooseStoryReply('jun', 'return-latch'), null, 'only Moss can close this job');
  assert.equal(migrated.chooseStoryReply('mira', 'file-lease'), null, 'a sale alone cannot close the lease');
  const supplies = migrated.getState().supplies;
  assert.ok(migrated.chooseStoryReply('moss', 'return-latch'));
  migrated.readStoryItem('latch');
  assert.equal(migrated.chooseStoryReply('moss', 'return-latch'), null);
  assert.equal(migrated.getState().supplies, supplies + 1);
  assert.ok(migrated.chooseStoryReply('mira', 'file-lease'));
  assert.equal(migrated.getState().story.filed, true);
  assert.equal(migrated.chooseStoryReply('mira', 'file-lease'), null);
  const { game: reloaded } = await import('../store.ts?legacy-story-finished');
  assert.deepEqual(reloaded.getState().story, migrated.getState().story);
  assert.equal(reloaded.getState().supplies, supplies + 1);
});

test('Jun’s route requires a real in-game sale and each side job pays once', async () => {
  localStorage.removeItem(SAVE_KEY);
  const { game: fresh } = await import('../store.ts?jun-story');
  fresh.start({ name: 'Night grower' });
  fresh.readStoryItem('lease');
  assert.ok(fresh.chooseStoryReply('mira', 'ask-jun'));
  assert.ok(fresh.chooseStoryReply('jun', 'accept-signal'));
  assert.equal(fresh.chooseStoryReply('jun', 'return-signal'), null);
  fresh.readStoryItem('signal');
  const balance = fresh.getState().money;
  assert.ok(fresh.chooseStoryReply('jun', 'return-signal'));
  assert.equal(fresh.chooseStoryReply('jun', 'return-signal'), null);
  assert.equal(fresh.getState().money, balance + 3);

  assert.ok(fresh.chooseStoryReply('mira', 'accept-ledger'));
  fresh.readStoryItem('ledger');
  assert.ok(fresh.chooseStoryReply('mira', 'return-ledger'));
  fresh.readStoryItem('ledger');
  assert.equal(fresh.chooseStoryReply('mira', 'return-ledger'), null);
  assert.equal(fresh.getState().seeds.moonmint, 1);
  assert.equal(fresh.chooseStoryReply('mira', 'file-lease'), null);

  fresh.plant(0, 'sunhaze');
  fresh.water(0);
  for (let i = 0; i < 364; i++) fresh.tick(0.25);
  fresh.harvest(0);
  fresh.sellAll();
  assert.ok(fresh.chooseStoryReply('mira', 'file-lease'));
  const { game: reloaded } = await import('../store.ts?jun-story-finished');
  assert.equal(reloaded.getState().story.lead, 'jun');
  assert.equal(reloaded.getState().story.filed, true);
  assert.equal(reloaded.getState().story.tasks.latch, 'available', 'the other route remains optional');
  assert.equal(reloaded.getState().seeds.moonmint, 1);
  assert.equal(reloaded.chooseStoryReply('jun', 'return-signal'), null, 'reload cannot pay a reward twice');
});

test('invalid story data is preserved for recovery', async () => {
  const invalid = JSON.parse(localStorage.getItem(SAVE_KEY));
  invalid.story.tasks.signal = 'rewarded';
  const raw = JSON.stringify(invalid);
  localStorage.setItem(SAVE_KEY, raw);
  const { game: broken } = await import('../store.ts?corrupt-story');
  assert.ok(broken.getState().saveError);
  broken.readStoryItem('lease');
  assert.equal(broken.chooseStoryReply('mira', 'ask-jun'), null);
  broken.save();
  assert.equal(localStorage.getItem(SAVE_KEY), raw);
});
