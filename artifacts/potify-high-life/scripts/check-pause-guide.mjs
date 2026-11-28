// Exercise the real selector and store through a rendered guide without a browser.
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

process.env.PORT ??= '5173';
process.env.BASE_PATH ??= '/';
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.window = { addEventListener() {} };
globalThis.document = { addEventListener() {}, visibilityState: 'visible' };

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { PauseGuideCard } = await vite.ssrLoadModule('/src/ui/PauseGuideCard.tsx');
  const { game, objective, PROJECTS, SAVE_KEY, validateSave } = await vite.ssrLoadModule('/src/game/store.ts');
  const { ui } = await vite.ssrLoadModule('/src/game/runtime.ts');
  const render = () => renderToStaticMarkup(createElement(PauseGuideCard));
  const check = title => {
    const before = structuredClone(game.getState());
    const html = render();
    assert.equal(objective(before).title, title);
    assert.ok(html.includes(title), `guide shows ${title}`);
    assert.ok(html.includes('Open map &amp; goals'));
    assert.deepEqual(game.getState(), before, 'rendering guide never changes progress');
    return html;
  };
  const grow = () => { for (let i = 0; i < 364; i++) game.tick(0.25); };
  const buySecondProject = (first, second) => {
    while (game.getState().money < 80) {
      for (let i = 0; i < 6; i++) {
        if (!game.getState().seeds.sunhaze) game.buySeed('sunhaze');
        game.plant(i, 'sunhaze'); game.water(i);
      }
      grow();
      for (let i = 0; i < 6; i++) game.harvest(i);
      game.sellAll();
    }
    game.buildProject(second);
    assert.deepEqual(game.getState().projects, [first, second]);
    assert.equal(PROJECTS[game.getState().projects[0]].signedBy, first === 'glasshouse' ? 'Moss' : 'Jun');
    game.save();
    assert.ok(validateSave(JSON.parse(storage.get(SAVE_KEY))));
  };
  const startAndSell = () => {
    game.start();
    check('The key to 7B');
    game.readStoryItem('lease');
    check('Meet Mira on the rooftop');
    game.talk('mira');
    check('Seed → Soil → Your story');
    game.buySeed('sunhaze');
    check('Put down roots');
    game.plant(0, 'sunhaze');
    check('A little care goes far');
    game.water(0);
    check('Your first rooftop harvest');
    grow(); game.harvest(0);
    check('Meet the neighborhood market');
    game.sellAll();
    check('What will you build?');
  };

  startAndSell();
  assert.equal(game.getState().settings.showHud, false);
  ui.set({ prompt: { id: 'test-bed', kind: 'bed', x: 0, z: 0, r: 1, area: 'roof', label: 'Bed 1', verb: 'Inspect' } });
  assert.match(check('What will you build?'), /Nearby: Bed 1.*press E, Enter, or Space to inspect/);
  ui.set({ prompt: null });
  assert.doesNotMatch(render(), /pause-guide-nearby/);
  game.buildProject('glasshouse');
  check('Make this roof your own');
  assert.equal(game.getState().projects[0], 'glasshouse');
  assert.equal(PROJECTS[game.getState().projects[0]].signedBy, 'Moss');
  assert.ok(validateSave(JSON.parse(storage.get(SAVE_KEY))));
  assert.equal(game.getState().settings.showHud, false);
  buySecondProject('glasshouse', 'cart');
  const glassSaved = JSON.parse(storage.get(SAVE_KEY));
  const glassReload = await import('../src/game/store.ts?pause-guide-glass');
  for (const field of ['projects', 'harvest', 'plots', 'money', 'quest', 'settings']) {
    assert.deepEqual(glassReload.game.getState()[field], glassSaved[field], `${field} survives reload`);
  }

  game.reset();
  startAndSell();
  game.buildProject('cart');
  check('Make this roof your own');
  assert.equal(game.getState().projects[0], 'cart');
  assert.equal(PROJECTS[game.getState().projects[0]].signedBy, 'Jun');
  assert.ok(validateSave(JSON.parse(storage.get(SAVE_KEY))));
  buySecondProject('cart', 'glasshouse');
  const cartSaved = JSON.parse(storage.get(SAVE_KEY));
  const cartReload = await import('../src/game/store.ts?pause-guide-cart');
  for (const field of ['projects', 'harvest', 'plots', 'money', 'quest', 'settings']) {
    assert.deepEqual(cartReload.game.getState()[field], cartSaved[field], `${field} survives reload`);
  }
  console.log('Guide renders every first-harvest objective, handles nearby prompts, and leaves progress and hidden-HUD saves intact for both first projects.');
} finally {
  await vite.close();
}
