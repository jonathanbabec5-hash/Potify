// Exercise the real market and both resident conversations with isolated browser saves.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { game, PROJECTS, SAVE_KEY } from '../src/game/store.ts';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: JSON.parse(process.env.CHROMIUM_ARGS || '[]'),
});
const url = pathToFileURL(resolve(process.argv[2] || 'dist/offline/POTIFY-A-Wonderful-High-Life.html')).href;
const errors = [];

async function openSave(save) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, offline: true,
  });
  const page = await context.newPage();
  page.on('pageerror', err => errors.push(err.message));
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, state: save });
  await page.goto(url);
  await page.getByTestId('button-continue').tap();
  return { context, page };
}
const saved = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), SAVE_KEY);

try {
  for (const first of ['glasshouse', 'cart']) {
    const initial = structuredClone(game.getState());
    Object.assign(initial, {
      started: true, acknowledged: true, minute: 550, money: 85,
      position: { zone: 'town', x: 92, z: -7.3 },
      harvest: [{ id: 'first-cut', strain: 'sunhaze', units: 3, quality: 2 }],
    });
    initial.settings.muted = true;
    const { context, page } = await openSave(initial);
    const market = page.getByTestId('button-action').filter({ hasText: 'Green Exchange' });
    await market.tap();
    const slip = page.getByTestId('work-slip');
    assert.equal(await slip.count(), 0);
    assert.equal(await page.getByTestId('build-' + first).isDisabled(), true);
    await page.getByTestId('button-sell-all').tap();
    assert.equal(await slip.count(), 0);
    await page.getByTestId('build-' + first).tap();
    await slip.locator('summary').tap();
    const order = PROJECTS[first];
    assert.equal(await slip.locator('blockquote').innerText(), order.pencilNote);
    const balance = (await saved(page)).money;
    await slip.locator('summary').tap();
    await slip.locator('summary').tap();
    assert.equal((await saved(page)).money, balance);
    const second = first === 'cart' ? 'glasshouse' : 'cart';
    await page.getByTestId('build-' + second).tap();
    assert.deepEqual((await saved(page)).projects, [first, second]);
    await page.reload();
    await page.getByTestId('button-continue').tap();
    await market.tap();
    await slip.locator('summary').tap();
    assert.equal(await slip.locator('blockquote').innerText(), order.pencilNote);
    const after = await saved(page);
    await context.close();

    // The next context starts beside the signer during their regular morning shift.
    const positions = { moss: [82, -6.6], jun: [88.6, 4] };
    const [x, z] = positions[order.neighbor];
    after.position = { zone: 'town', x, z };
    after.minute = 550;
    const visit = await openSave(after);
    await visit.page.getByTestId('button-action').filter({ hasText: order.signedBy }).tap();
    await visit.page.getByTestId('ask-first-job').tap();
    await visit.page.getByText(order.followUp, { exact: true }).waitFor();
    assert.equal((await saved(visit.page)).money, after.money);
    await visit.context.close();
    console.log(first + ' first: sale, purchase, reread, second job, reload and signer dialogue passed');
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
