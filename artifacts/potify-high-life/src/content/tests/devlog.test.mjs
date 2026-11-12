import assert from 'node:assert/strict';
import { test } from 'node:test';

const { devlogSections, devlogChangelog, devlogDisclosure } = await import('../devlogRegistry.ts');
const expectedIds = ['ROOT', 'ART', 'GEO', 'VEN', 'TIME', 'GROW', 'ITEM', 'ECON', 'NPC', 'LORE', 'QUEST', 'EGG', 'SYS', 'SOC', 'AUDIO', 'TECH', 'PUB', 'ROAD'];

test('the public registry has 18 useful sections and stable, unique entry IDs', () => {
  assert.deepEqual(devlogSections.map(section => section.id), expectedIds);
  const allIds = devlogSections.flatMap(section => {
    assert.ok(section.entries.length >= 2 && section.entries.length <= 6, `${section.id} representative count`);
    for (const entry of section.entries) {
      assert.ok(entry.id.startsWith(`${section.id}-`), `${entry.id} uses the section prefix`);
      assert.ok(['Concept', 'In Development', 'Verified Playable'].includes(entry.status), `${entry.id} has an allowed status`);
    }
    return section.entries.map(entry => entry.id);
  });
  assert.equal(new Set(allIds).size, allIds.length, 'no duplicate public IDs');
});

test('the devlog keeps the dated baseline, economy disclosure and spoiler-safe hints', () => {
  assert.equal(devlogChangelog[0].date, '2026-11-04');
  assert.equal(devlogChangelog.length, 1);
  assert.match(devlogChangelog[0].version, /^v0\./);
  assert.match(devlogDisclosure, /simSOL is nontransferable in-game money/);
  assert.match(devlogDisclosure, /not the real \$POTIFY token/);
  const publicText = JSON.stringify({ devlogSections, devlogChangelog, devlogDisclosure });
  assert.doesNotMatch(publicText, /4:19|4:20|private key|seed phrase|0x[a-f0-9]{20,}/i);
  assert.match(publicText, /The First Cycle/);
  assert.match(publicText, /The Soil Remembers/);
  assert.match(publicText, /unmarked media|old media/i);
});
