// After npm run build:offline, use Node 24 with Playwright and its Chromium installed.
// PROFILE_SECONDS=60 lengthens each route. --check enforces a 30 FPS average
// per route. The separately reported p95 exposes hitches hidden by an average.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { game, SAVE_KEY } from '../src/game/store.ts';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const seconds = Number(process.env.PROFILE_SECONDS || 8.8);
assert.ok(seconds >= 4 && Number.isFinite(seconds), 'PROFILE_SECONDS must be at least four seconds');
const args = process.argv.slice(2);
const build = args.find(arg => !arg.startsWith('--')) || 'dist/offline/POTIFY-A-Wonderful-High-Life.html';
const routes = [
  { name: 'Rooftop beds', zone: 'rooftop', x: 0, z: 11.3, minute: 510 },
  { name: 'Greenhouse', zone: 'greenhouse', x: 6.9, z: -4.4, minute: 1110 },
  { name: 'Canopy House', zone: 'tower', x: 0, z: 3, floor: 24, minute: 570 },
  { name: 'Market square', zone: 'town', x: 81.6, z: 5, minute: 550 },
];

function installMeter() {
  let draws = 0, previous = null;
  const prototype = WebGL2RenderingContext.prototype;
  for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
    const draw = prototype[name];
    prototype[name] = function (...args) {
      draws++;
      return draw.apply(this, args);
    };
  }
  function sample(now) {
    if (draws > 0) {
      if (window.playSamples && previous !== null) {
        window.playSamples.push({ ms: now - previous, draws, width: document.querySelector('canvas').width });
      }
      previous = now;
      draws = 0;
    }
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: JSON.parse(process.env.CHROMIUM_ARGS || '[]'),
});
const errors = [], results = [];
try {
  for (const { name, zone, x, z, floor, minute } of routes) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, offline: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /shader|webgl|3d scene crashed/i.test(message.text())) errors.push(message.text());
    });
    const save = structuredClone(game.getState());
    Object.assign(save, {
      started: true, acknowledged: true, minute, projects: ['glasshouse', 'cart'],
      position: { zone, x, z, floor },
      plots: Array.from({ length: 8 }, (_, id) => ({
        id, strain: ['sunhaze', 'moonmint', 'amber'][id % 3], growth: 100, health: 90, water: 65, fed: true,
      })),
      settings: { ...save.settings, muted: true, music: false, camera: 1, quality: 'high' },
    });
    await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: SAVE_KEY, save });
    await page.addInitScript(installMeter);
    await page.goto(pathToFileURL(resolve(build)).href);
    await page.getByTestId('button-continue').click();
    await page.getByTestId('joystick').waitFor();
    await page.waitForTimeout(4500);
    await page.evaluate(() => { window.playSamples = []; });
    // Short passes keep the player moving through the same area during long runs.
    const repeats = Math.max(1, Math.round(seconds / 8.8));
    for (let i = 0; i < repeats; i++) {
      for (const key of ['a', 'd', 'a', 'd']) {
        await page.keyboard.down(key);
        await page.waitForTimeout(seconds * 1000 / (repeats * 4));
        await page.keyboard.up(key);
      }
    }
    const samples = await page.evaluate(() => window.playSamples);
    assert.ok(samples.length >= 8, name + ' did not render enough frames');
    const percentile = (key, fraction) => {
      const values = samples.map(sample => sample[key]).sort((a, b) => a - b);
      return values[Math.ceil(values.length * fraction) - 1];
    };
    const fps = 1000 * samples.length / samples.reduce((total, sample) => total + sample.ms, 0);
    results.push({ name, fps });
    console.log(JSON.stringify({ name, fps: +fps.toFixed(1), frames: samples.length,
      p95Ms: +percentile('ms', 0.95).toFixed(1), medianDraws: percentile('draws', 0.5),
      medianCanvasWidth: percentile('width', 0.5) }));
    await context.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(errors, []);
if (args.includes('--check')) {
  for (const result of results) assert.ok(result.fps >= 30, result.name + ' fell below 30 FPS');
}
