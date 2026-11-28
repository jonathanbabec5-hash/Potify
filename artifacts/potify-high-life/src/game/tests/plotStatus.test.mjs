import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlotStatus } from '../plotStatus.ts';

const planted = { strain: 'sunhaze', growth: 50, water: 50 };

test('empty beds have no planted status', () => {
  assert.equal(getPlotStatus({ strain: null, growth: 100, water: 0 }), 'empty');
});
test('a watered, immature plant is growing', () => {
  assert.equal(getPlotStatus(planted), 'growing');
});
test('a plant needs water only when its water reaches zero', () => {
  assert.equal(getPlotStatus({ ...planted, water: 0 }), 'needs-water');
  assert.equal(getPlotStatus({ ...planted, water: 0.01 }), 'growing');
});
test('99.99 percent growth is not harvest-ready', () => {
  assert.equal(getPlotStatus({ ...planted, growth: 99.99 }), 'growing');
});
test('100 percent growth is ready even when water is zero', () => {
  assert.equal(getPlotStatus({ ...planted, growth: 100, water: 0 }), 'ready');
});
