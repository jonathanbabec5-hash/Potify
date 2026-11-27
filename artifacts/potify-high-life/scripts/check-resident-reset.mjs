// Run on a standalone build in a disposable offline browser context. Node 24 and
// Playwright/Chromium are the same optional tools used by profile-mobile.mjs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { game, SAVE_KEY } from '../src/game/store.ts';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: JSON.parse(process.env.CHROMIUM_ARGS || '[]'), headless: true });
const url = pathToFileURL(resolve(process.argv[2] || 'dist/offline/POTIFY-A-Wonderful-High-Life.html')).href;
const errors = [];
try {
  for (const route of ['title', 'settings']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, offline: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const original = structuredClone(game.getState());
    Object.assign(original, { started: true, acknowledged: true, name: 'Old resident',
      position: route === 'title' ? { zone: 'town', x: 81.6, z: 5 } : { zone: 'tower', floor: 24, x: 0, z: 3 } });
    original.settings.music = false; original.settings.muted = true;
    await page.addInitScript(({ key, original }) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, JSON.stringify(original));
        sessionStorage.setItem('seeded','yes');
      }
      window.blockReset = true;
      const remove = Storage.prototype.removeItem;
      Storage.prototype.removeItem = function (item) {
        if (window.blockReset && this === localStorage && item === key) throw Error('Storage unavailable');
        return remove.call(this, item);
      };
    }, { key: SAVE_KEY, original });
    await page.goto(url);
    const button = id => page.getByTestId(id);
    if (route === 'title') {
      await button('button-new-game').tap(); await button('button-cancel-reset').tap();
      assert.ok((await button('panel-start').innerText()).includes('Old resident'));
      await button('button-new-game').tap();
    } else {
      await button('button-continue').tap(); await button('button-pause').tap();
      await button('button-pause-settings').tap(); await button('button-reset').tap();
    }
    const erase = button(route === 'title' ? 'button-confirm-reset' : 'button-confirm-reset-settings');
    await erase.tap();
    await page.getByRole('alert').filter({ hasText: 'could not erase' }).waitFor();
    const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    assert.equal((await saved()).name, 'Old resident');
    await page.evaluate(() => { window.blockReset = false; });
    await erase.tap();
    if (route === 'settings') await button('button-continue').tap();
    await button('panel-create').waitFor();
    await page.waitForTimeout(800); // idle render frames before beginning
    assert.equal(await saved(), null);
    await button('input-name').fill('New resident');
    await button('checkbox-ack').tap(); await button('button-begin').tap();
    await button('button-action').filter({ hasText: 'Lease for Roof 7B' }).waitFor();
    await button('button-action').tap();
    assert.equal((await saved()).story.leaseRead, true);
    assert.deepEqual((await saved()).position, game.getState().position);
    await page.reload(); await button('button-continue').tap();
    await button('button-action').filter({ hasText: 'Lease for Roof 7B' }).waitFor();
    assert.equal((await saved()).name, 'New resident');
    console.log(route + ': failed removal, retry, move-in, lease interaction and reload passed');
    await context.close();
  }
} finally { await browser.close(); }
assert.deepEqual(errors, []);
