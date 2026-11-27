import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FrameBudget } from '../frameBudget.ts';

function measure(interval, count, initial = 1) {
  const budget = new FrameBudget(), results = [];
  let now = 0, dpr = initial;
  for (let i = 0; i < count; i++) {
    const result = budget.sample(now, 'rooftop', 84, dpr, 0.64, 1.35);
    if (result) { results.push(result); dpr = result.next; }
    now += interval;
  }
  return results;
}

test('slow frames reduce resolution to its floor and stable 30 FPS holds it', () => {
  const slow = measure(50, 240);
  assert.equal(slow[0].report.fps, 20);
  assert.equal(slow[0].report.p95, 50);
  assert.equal(slow[0].report.calls, 84);
  assert.equal(slow[0].next, 0.76);
  assert.equal(slow.at(-1).next, 0.64);
  const steady = measure(1000 / 30, 230);
  assert.ok(steady.length >= 3);
  assert.ok(steady.every(result => result.next === 1));
});

test('restoring resolution requires four consecutive fast windows and respects the ceiling', () => {
  const fast = measure(16, 960, 1.32);
  assert.deepEqual(fast.slice(0, 4).map(result => result.next), [1.32, 1.32, 1.32, 1.35]);
  assert.equal(fast.at(-1).next, 1.35);
});

test('zone changes and explicit pauses start a fresh window, while active stalls count', () => {
  const budget = new FrameBudget();
  const sample = (now, zone = 'roof') => budget.sample(now, zone, 44, 1, 0.64, 1.35);
  for (let now = 0; now <= 1000; now += 20) sample(now);
  assert.equal(sample(1030, 'town'), undefined);
  for (let now = 1050; now <= 2050; now += 20) assert.equal(sample(now, 'town'), undefined);
  assert.ok(sample(4050, 'town').report.fps < 15);
  budget.reset();
  assert.equal(sample(80000), undefined);
  assert.equal(sample(80020), undefined);
});
