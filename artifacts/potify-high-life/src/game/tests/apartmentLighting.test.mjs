import assert from 'node:assert/strict';
import test from 'node:test';
import { apartmentDaylight } from '../../scene/apartmentLighting.ts';

test('the apartment window light follows the clock through the day', () => {
  assert.equal(apartmentDaylight(0), 0);
  assert.equal(apartmentDaylight(360), 0);
  assert.ok(Math.abs(apartmentDaylight(480) - 0.18) < 1e-10);
  assert.ok(Math.abs(apartmentDaylight(720) - 0.36) < 1e-10);
  assert.ok(Math.abs(apartmentDaylight(960) - 0.18) < 1e-10);
  assert.ok(apartmentDaylight(1080) < 1e-10);
  assert.equal(apartmentDaylight(1200), 0);
});
