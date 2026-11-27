// Check both supper memories through the touch controls in the offline edition.
// Position fixtures shorten the routes between the festival, kitchen table and bed.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { game, SAVE_KEY, validateSave } from '../src/game/store.ts';
import { MUG_SCENE } from '../src/game/fourthMug.ts';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: JSON.parse(process.env.CHROMIUM_ARGS || '[]'),
});
const url = pathToFileURL(resolve(process.argv[2] || 'dist/offline/POTIFY-A-Wonderful-High-Life.html')).href;
const table = { zone: 'tower', floor: 4, x: -4.30, z: 2.68 };
const gathering = { zone: 'tower', floor: 4, x: -2, z: 1.2 };
const bed = { zone: 'tower', floor: 7, x: -7.15, z: -3.45 };
const errors = [];

async function continueAt(page, position) {
  await page.evaluate(pos => sessionStorage.setItem('test-position', JSON.stringify(pos)), position);
  await page.reload();
  await page.getByTestId('button-continue').tap();
}

try {
  for (const [meal, projects, choice] of [
    [0, ['glasshouse', 'cart'], 'tea'],
    [1, ['cart', 'glasshouse'], 'please'],
  ]) {
    const state = structuredClone(game.getState());
    Object.assign(state, { started: true, acknowledged: true, day: 24, minute: 720, projects, position: table });
    state.quest.sold = true;
    state.plots.push(...[6, 7].map(id => ({ ...state.plots[0], id })));
    state.settings.muted = true;
    state.settings.showHud = false;
    assert.ok(validateSave(state));

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, offline: true,
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ key, initial }) => {
      const stored = localStorage.getItem(key);
      const next = stored === null ? initial : JSON.parse(stored);
      const position = sessionStorage.getItem('test-position');
      if (position) next.position = JSON.parse(position);
      sessionStorage.removeItem('test-position');
      localStorage.setItem(key, JSON.stringify(next));
    }, { key: SAVE_KEY, initial: state });
    await page.goto(url);
    await page.getByTestId('button-continue').tap();
    const action = page.getByTestId('button-action');
    await action.waitFor();
    assert.doesNotMatch(await action.innerText(), /Blue kitchen mug/);

    await continueAt(page, gathering);
    await action.filter({ hasText: 'Autumn Harvest Fest' }).tap();
    await page.getByTestId('festival-' + meal).tap();
    await continueAt(page, table);
    await action.filter({ hasText: 'Blue kitchen mug' }).tap();
    await page.getByText(MUG_SCENE.project[projects[0]], { exact: true }).waitFor();
    await page.getByText(MUG_SCENE.supper[meal === 0 ? 'table' : 'bowls'], { exact: true }).waitFor();
    await page.getByTestId('mug-' + choice).tap();
    const memory = page.getByTestId('mug-memory');
    assert.equal(await memory.innerText(), MUG_SCENE.replies[choice]);
    assert.equal(await page.getByTestId('mug-' + choice).count(), 0);

    await page.reload();
    await page.getByTestId('button-continue').tap();
    await action.filter({ hasText: 'Supper table' }).tap();
    assert.equal(await memory.innerText(), MUG_SCENE.replies[choice]);
    await continueAt(page, bed);
    await action.filter({ hasText: 'Your bed' }).tap();
    await page.getByTestId('button-sleep').tap();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key)).day === 25, SAVE_KEY);
    await continueAt(page, table);
    await action.filter({ hasText: 'Supper table' }).tap();
    assert.equal(await memory.innerText(), MUG_SCENE.later[choice]);
    await page.getByText('Remember that supper', { exact: true }).tap();
    await page.getByText(MUG_SCENE.replies[choice], { exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).life.fourthMug, SAVE_KEY),
      { choice, day: 24 });
    console.log(projects[0] + ' first: supper, inspection, choice, reload, sleep, return and reread passed');
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
