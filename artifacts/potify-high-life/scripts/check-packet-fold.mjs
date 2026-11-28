// Start with pre-encounter saves and use the shop, bed and kitchen controls.
// Position fixtures shorten the walks between those three places.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
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
const captures = process.env.PACKET_CAPTURE_DIR;
const counter = { zone: 'town', x: 68, z: -6.55 };
const bed = { zone: 'tower', floor: 7, x: -7.15, z: -3.45 };
const table = { zone: 'tower', floor: 4, x: -4.3, z: 2.68 };
const errors = [];

async function continueAt(page, position) {
  await page.evaluate(pos => sessionStorage.setItem('packet-test-position', JSON.stringify(pos)), position);
  await page.reload();
  await page.getByTestId('button-continue').tap();
}

async function inspect(page) {
  await page.getByTestId('button-action').filter({ hasText: 'Seed & Signal' }).tap();
  await page.getByTestId('packet-inspect').tap();
}

async function checkImage(image) {
  await image.waitFor();
  assert.ok(await image.evaluate(async element => {
    await element.decode();
    const rect = element.getBoundingClientRect();
    return element.alt.trim().length > 0 && element.naturalWidth >= rect.width &&
      rect.width >= 250 && rect.right <= window.innerWidth && rect.left >= 0;
  }), 'the close-up is decoded, labeled and fits the phone viewport');
}

async function capture(page, name) {
  if (captures) await page.screenshot({ path: resolve(captures, name + '.png') });
}

try {
  if (captures) await mkdir(captures, { recursive: true });
  for (const [noticed, answer, remembersTessa] of [
    ['fold', 'pencil', true], ['pencil', 'fold', true], ['pencil', 'pencil', false],
  ]) {
    const state = structuredClone(game.getState());
    const day = remembersTessa ? 25 : 1;
    Object.assign(state, { started: true, acknowledged: true, day, minute: 540, position: counter });
    state.settings.muted = remembersTessa;
    state.settings.music = false;
    state.settings.showHud = false;
    if (remembersTessa) {
      state.quest.met = true;
      state.life.festivals['2'] = 0;
      state.life.fourthMug = { choice: 'please', day: 24 };
    }
    delete state.packetFold;
    assert.ok(validateSave(state), 'saves made before this encounter still load');

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, offline: true,
    });
    const page = await context.newPage();
    page.on('pageerror', err => errors.push(err.message));
    await page.addInitScript(({ initial, key }) => {
      window.packetSounds = 0;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {
        if (/^(data:audio\/(?:x-)?wav)|packet-unfold[^/]*\.wav/.test(this.src)) {
          this.addEventListener('playing', () => { window.packetSounds++; }, { once: true });
        }
        return play.apply(this, args);
      };
      const json = localStorage.getItem(key);
      const save = json === null ? initial : JSON.parse(json);
      const nextPosition = sessionStorage.getItem('packet-test-position');
      if (nextPosition !== null) save.position = JSON.parse(nextPosition);
      sessionStorage.removeItem('packet-test-position');
      localStorage.setItem(key, JSON.stringify(save));
    }, { initial: state, key: SAVE_KEY });
    await page.goto(url);
    await page.getByTestId('button-continue').tap();
    await page.getByTestId('button-action').filter({ hasText: 'Seed & Signal' }).waitFor();
    if (noticed === 'fold') await capture(page, 'counter-approach');
    if (remembersTessa) {
      await continueAt(page, table);
      await page.getByTestId('button-action').filter({ hasText: 'Supper table' }).tap();
      assert.equal(await page.getByTestId('mug-sugar-tin').innerText(), MUG_SCENE.sugarTin.invitation);
      await continueAt(page, counter);
    }

    await inspect(page);
    await checkImage(page.getByTestId('packet-folded'));
    if (noticed === 'fold') await capture(page, 'folded-inspection');
    assert.equal(await page.getByTestId('packet-tessa').count(), Number(remembersTessa));
    await page.getByTestId('packet-note-' + noticed).tap();
    const firstNote = await page.getByTestId('packet-first-note').innerText();
    await page.getByTestId('packet-shop-back').tap();
    await page.getByTestId('card-seed-moonmint').waitFor();
    await continueAt(page, counter);
    await inspect(page);
    assert.equal(await page.getByTestId('packet-first-note').innerText(), firstNote);
    assert.equal(await page.getByTestId('packet-turn').count(), 0);

    await continueAt(page, bed);
    await page.getByTestId('button-action').filter({ hasText: 'Your bed' }).tap();
    await page.getByTestId('button-sleep').tap();
    await page.waitForFunction(({ key, day }) => JSON.parse(localStorage.getItem(key)).day > day, { key: SAVE_KEY, day });
    await continueAt(page, counter);
    await inspect(page);
    await page.getByTestId('packet-turn').tap();
    await checkImage(page.getByTestId('packet-open'));
    if (!state.settings.muted) await page.waitForFunction(() => window.packetSounds === 1);
    assert.equal(await page.evaluate(() => window.packetSounds), state.settings.muted ? 0 : 1);
    if (noticed === 'fold') await capture(page, 'opened-inspection');
    await page.getByTestId('packet-answer-' + answer).tap();
    const reply = await page.getByTestId('packet-reply').innerText();
    await continueAt(page, counter);
    await inspect(page);
    await checkImage(page.getByTestId('packet-open'));
    assert.equal(await page.getByTestId('packet-reply').innerText(), reply);
    assert.equal(await page.getByTestId('packet-answer-' + answer).count(), 0);
    await page.getByText('Look back at the first visit', { exact: true }).tap();
    assert.equal(await page.getByTestId('packet-first-note').innerText(), firstNote);
    await checkImage(page.getByTestId('packet-folded'));
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    assert.deepEqual(saved.packetFold, { day, noticed, response: { day: day + 1, clue: answer } });
    assert.equal(saved.money, state.money);
    assert.deepEqual(saved.seeds, state.seeds);
    if (remembersTessa) {
      await continueAt(page, table);
      await page.getByTestId('button-action').filter({ hasText: 'Supper table' }).tap();
      assert.equal(await page.getByTestId('mug-sugar-tin').innerText(), MUG_SCENE.sugarTin[answer]);
    }
    console.log('Noticed ' + noticed + ', answered ' + answer + ', fourth mug ' + remembersTessa + ': passed');
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
