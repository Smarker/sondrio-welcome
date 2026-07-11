import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonForMonth, otherSeason } from '../js/seasons.js';

test('january is winter', () => assert.equal(seasonForMonth(1), 'winter'));
test('march is winter', () => assert.equal(seasonForMonth(3), 'winter'));
test('july is summer', () => assert.equal(seasonForMonth(7), 'summer'));
test('november is winter', () => assert.equal(seasonForMonth(11), 'winter'));
test('october is summer', () => assert.equal(seasonForMonth(10), 'summer'));
test('otherSeason flips winter and summer', () => {
  assert.equal(otherSeason('winter'), 'summer');
  assert.equal(otherSeason('summer'), 'winter');
});

test('goToOtherSeason flips season and targets Plan Excursions', async () => {
  const { goToOtherSeason, applySeason } = await import('../js/seasons.js');
  const phases = [];
  const doc = {
    querySelector: sel => {
      if (sel === '.szbtn[aria-pressed="true"]') return { dataset: { season: 'summer' } };
      if (sel === '.seasons') return { classList: { remove(){}, add(){} }, offsetWidth: 0 };
      return null;
    },
    querySelectorAll: () => [],
    getElementById: id => id === 'season-acts'
      ? { scrollIntoView(){ doc._scrolled = true; } }
      : null,
    dispatchEvent(e){ phases.push(e.detail?.phase); },
    _scrolled: false,
  };
  // Stub matchMedia / rAF for Node
  globalThis.matchMedia = () => ({ matches: true });
  globalThis.requestAnimationFrame = cb => cb();

  applySeason('summer', doc);
  const next = goToOtherSeason(doc);
  assert.equal(next, 'winter');
  assert.deepEqual(phases, ['stay']);
  assert.equal(doc._scrolled, true);
});
