import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickForDate, daysSinceEpoch, PICKS } from '../js/picks.js';

const pool = ['a','b','c'];

test('same date gives same pick', () => {
  const d = new Date('2026-07-06T09:00:00Z');
  assert.equal(pickForDate(d, pool), pickForDate(new Date('2026-07-06T21:00:00Z'), pool));
});
test('consecutive days advance by one', () => {
  const d1 = new Date('2026-07-06T09:00:00Z');
  const d2 = new Date('2026-07-07T09:00:00Z');
  assert.equal(daysSinceEpoch(d2) - daysSinceEpoch(d1), 1);
});
test('pick is always in the pool', () => {
  for (let i = 0; i < 10; i++){
    const d = new Date(2026, 0, 1 + i);
    assert.ok(pool.includes(pickForDate(d, pool)));
  }
});
test('PICKS entries reference name and desc keys', () => {
  assert.ok(PICKS.length > 1);
  for (const p of PICKS){ assert.equal(typeof p.name, 'string'); assert.equal(typeof p.desc, 'string'); }
});
