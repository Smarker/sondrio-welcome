import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dateKeyInSondrio,
  phaseForStay,
  parseStayConfig,
  resolvePhase,
  navPhaseFor,
  heroSubKeyForPhase,
  tipKeyForHour,
  tipTargetForHour,
} from '../js/journey.js';

test('phase: before check-in is welcome', () =>
  assert.equal(phaseForStay('2026-07-07', '2026-07-08', '2026-07-12'), 'welcome'));

test('phase: check-in day is arrive', () =>
  assert.equal(phaseForStay('2026-07-08', '2026-07-08', '2026-07-12'), 'arrive'));

test('phase: mid-stay is stay', () =>
  assert.equal(phaseForStay('2026-07-10', '2026-07-08', '2026-07-12'), 'stay'));

test('phase: checkout day is leave', () =>
  assert.equal(phaseForStay('2026-07-12', '2026-07-08', '2026-07-12'), 'leave'));

test('phase: after checkout is after', () =>
  assert.equal(phaseForStay('2026-07-13', '2026-07-08', '2026-07-12'), 'after'));

test('phase: missing dates falls back to stay', () =>
  assert.equal(phaseForStay('2026-07-10', null, null), 'stay'));

test('parseStayConfig accepts valid config', () => {
  assert.deepEqual(parseStayConfig({ checkIn: '2026-07-08', checkOut: '2026-07-12' }), {
    checkIn: '2026-07-08',
    checkOut: '2026-07-12',
  });
});

test('parseStayConfig rejects invalid config', () => {
  assert.equal(parseStayConfig(null), null);
  assert.equal(parseStayConfig({ checkIn: 'bad' }), null);
  assert.equal(parseStayConfig({ checkIn: '2026-07-12', checkOut: '2026-07-08' }), null);
});

test('resolvePhase uses override when provided', () => {
  const stay = { checkIn: '2026-07-08', checkOut: '2026-07-12' };
  const now = new Date('2026-07-10T12:00:00Z');
  assert.equal(resolvePhase(stay, now, 'welcome'), 'welcome');
  assert.equal(resolvePhase(stay, now, null), 'stay');
});

test('navPhaseFor maps after to welcome', () =>
  assert.equal(navPhaseFor('after'), 'welcome'));

test('heroSubKeyForPhase returns phase-specific keys', () => {
  assert.equal(heroSubKeyForPhase('arrive'), 'heroSubArrive');
  assert.equal(heroSubKeyForPhase('after'), 'heroSubAfter');
});

test('tipKeyForHour covers day parts', () => {
  assert.equal(tipKeyForHour(8), 'jTipMorning');
  assert.equal(tipKeyForHour(14), 'jTipDay');
  assert.equal(tipKeyForHour(20), 'jTipEvening');
});

test('tipTargetForHour points at relevant sections', () => {
  assert.equal(tipTargetForHour(8), '#card-daytrips');
  assert.equal(tipTargetForHour(14), '#card-explore');
  assert.equal(tipTargetForHour(20), '#card-eat');
});

test('dateKeyInSondrio returns YYYY-MM-DD', () => {
  assert.match(dateKeyInSondrio(new Date('2026-07-08T10:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
});
