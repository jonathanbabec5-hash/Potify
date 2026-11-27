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

test('first receipt builds either roof project, freight survives reload, and a warehouse run pays once per day', async () => {
  localStorage.removeItem(SAVE_KEY);
  const { game: g, WAREHOUSE } = await import('../store.ts?canal-projects');
  g.start();
  assert.equal(g.getState().position.zone, 'tower');
  assert.equal(g.getState().position.floor, 7);
  g.buildProject('glasshouse');
  assert.equal(g.getState().plots.length, 6);
  const harvestBeds = count => {
    for (let i = 0; i < count; i++) {
      if (!g.getState().seeds.sunhaze) g.buySeed('sunhaze');
      g.plant(i, 'sunhaze'); g.water(i);
    }
    for (let i = 0; i < 364; i++) g.tick(0.25);
    for (let i = 0; i < count; i++) g.harvest(i);
  };
  harvestBeds(1);
  const sale = harvestValue(g.getState().harvest[0]);
  g.sellAll();
  assert.ok(sale >= 4);
  const before = g.getState().money;
  const legacy = JSON.parse(localStorage.getItem(SAVE_KEY));
  for (const key of ['projects', 'warehouse', 'crate', 'deliveries']) delete legacy[key];
  localStorage.setItem(SAVE_KEY, JSON.stringify(legacy));
  const { game: greenhouse } = await import('../store.ts?legacy-works');
  greenhouse.buildProject('glasshouse');
  greenhouse.buildProject('glasshouse');
  greenhouse.buildProject('cart');
  assert.equal(greenhouse.getState().money, before - 4);
  assert.equal(greenhouse.getState().plots.length, 8);
  greenhouse.plant(7, 'sunhaze');
  greenhouse.water(7);
  const { game: annex } = await import('../store.ts?annex');
  assert.equal(annex.getState().plots[7].water, 100);
  assert.equal(annex.getState().saveError, null);

  g.buildProject('cart');
  assert.equal(g.getState().money, before - 4);
  harvestBeds(2);
  const batch = g.getState().harvest[0];
  g.packCrate();
  g.packCrate();
  g.sellAll();
  const { game: courier } = await import('../store.ts?cart-loaded');
  const till = courier.getState().money;
  courier.deliverCrate('lab');
  assert.deepEqual(courier.getState().crate, batch);
  courier.deliverCrate('cafe'); courier.deliverCrate('cafe');
  assert.equal(courier.getState().deliveries, 1);
  assert.equal(courier.getState().money, Math.round((till + harvestValue(batch) + 5) * 100) / 100);

  g.leaseWarehouse();
  assert.equal(g.getState().warehouse.leased, false);
  for (let run = 0; run < 3; run++) { harvestBeds(6); g.sellAll(); }
  const balance = g.getState().money;
  g.leaseWarehouse(); g.leaseWarehouse();
  assert.equal(g.getState().money, balance - WAREHOUSE.price);
  harvestBeds(4);
  const freight = g.getState().harvest;
  const earnings = harvestValue(freight[0]) + harvestValue(freight[1]) + WAREHOUSE.dispatchFee;
  const wallet = g.getState().money;
  g.dispatchFreight(); g.dispatchFreight();
  assert.deepEqual(g.getState().harvest, freight.slice(2));
  assert.equal(g.getState().money, Math.round((wallet + earnings) * 100) / 100);
  const { game: tenant } = await import('../store.ts?ward-reloaded');
  tenant.dispatchFreight();
  assert.deepEqual(tenant.getState().harvest, freight.slice(2));
  tenant.sleep(); tenant.dispatchFreight();
  assert.equal(tenant.getState().harvest.length, 0);
});

test('Canopy House connects every landing and dates the four neighborhood gatherings', async () => {
  const { crossing, stairHeight, STOREY, TOP_FLOOR, houseDate, meetingFloor } = await import('../house.ts');
  let floor = 1;
  for (let target = 2; target <= TOP_FLOOR + 1; target++) {
    assert.equal(stairHeight(7, 1), 0);
    assert.equal(stairHeight(7, -4.5), STOREY / 2);
    assert.equal(stairHeight(4, -4.5), STOREY / 2);
    assert.ok(Math.abs(stairHeight(4, 0.99999) - STOREY) < 0.001);
    floor += crossing(7, 1.1, 0.9) + crossing(4, 0.9, 1.1);
    assert.equal(floor, target);
  }
  for (let target = TOP_FLOOR; target > 0; target--) {
    floor += crossing(4, 1.1, 0.9) + crossing(7, 0.9, 1.1);
    assert.equal(floor, target);
  }
  for (let i=0;i<4;i++) {
    const date=houseDate(i*10+4);
    assert.equal(date.active, true);
    assert.equal(houseDate(i*10+7).active,false);
    assert.equal(meetingFloor('tessa',i*10+4,i===1?480:720,null),date.festival.floor);
  }
  assert.deepEqual([houseDate(41).season,houseDate(41).date,houseDate(41).year],['Spring',1,2]);
});

test('neighbors remember a personal scene, shared home and family across multiple years', async () => {
  localStorage.removeItem(SAVE_KEY);
  const {game:g}=await import('../store.ts?house-life');
  const {houseDate,childStage,favorite,meetingFloor}=await import('../house.ts');
  const visitFloor=level=>g.setPosition({zone:'tower',floor:level,x:-3.8,z:-1.35});
  g.start(); const childhood='Juniper';
  for(let day=1;day<=5;day++){
    visitFloor(meetingFloor('jax',day,g.getState().minute,null));
    g.visitNeighbor('jax');g.visitNeighbor('jax');
    assert.equal(g.getState().life.visits.jax,day);
    if(day===3){
      assert.equal(g.shareMoment('jax',1),true);assert.equal(g.shareMoment('jax',0),false);
      assert.equal(g.openArchive(),true);assert.equal(g.openArchive(),false);
    }
    if(day<5){assert.equal(g.invitePartner('jax'),false);g.sleep();}
  }
  assert.equal(g.invitePartner('jax'),true);
  visitFloor(7);assert.equal(g.welcomeChild(childhood),false);
  while(g.getState().day<45){
    const date=houseDate(g.getState().day);
    if(date.active && date.date===4){visitFloor(date.festival.floor);assert.equal(g.celebrate(1),true);assert.equal(g.celebrate(0),false);}
    g.sleep();
  }
  visitFloor(21);assert.equal(g.restoreCommons('seeds'),true);assert.equal(g.restoreCommons('tapes'),false);
  assert.equal(g.takeCommonsSeed(),true);assert.equal(g.takeCommonsSeed(),false);
  visitFloor(7);assert.equal(g.welcomeChild(childhood),true);assert.equal(g.welcomeChild('Other'),false);
  assert.equal(g.familyTime('Making'),true);assert.equal(g.familyTime('Music'),false);
  assert.equal(childStage(45,45),'Little one');
  const {game:loaded}=await import('../store.ts?home-reload');
  assert.equal(loaded.getState().life.child.name,childhood);assert.equal(loaded.getState().life.archiveOpen,true);
  assert.equal(Object.keys(loaded.getState().life.festivals).length,4);
  assert.equal(loaded.getState().life.moments.jax,1);
  for(let i=0;i<720;i++)loaded.sleep();
  assert.equal(childStage(loaded.getState().day,45),'Grown up');
  assert.equal(favorite(loaded.getState().life.child.interests),'Making');
  assert.equal(loaded.familyTime('Cooking'),false);
});

test('pre-tower saves retain their address and a stair save restores the exact floor', async () => {
  const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
  delete saved.life;
  saved.position={zone:'apartment',x:-7.4,z:-4.6};
  localStorage.setItem(SAVE_KEY,JSON.stringify(saved));
  const {game:g}=await import('../store.ts?pre-house');
  assert.deepEqual(g.getState().position,saved.position);
  assert.deepEqual(g.getState().plots,saved.plots);
  g.setPosition({zone:'tower',floor:23,x:7,z:-1.3});g.save();
  const {game:restored}=await import('../store.ts?stair-save');
  assert.equal(restored.getState().position.floor,23);
  assert.equal(restored.getState().position.z,-1.3);
  assert.equal(validateSave({...restored.getState(),position:{zone:'tower',floor:0,x:7,z:2}}),false);
});
