import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dateKeyInSondrio,
  phaseForStay,
  parseStayConfig,
  resolvePhase,
  navPhaseFor,
  heroSubKeyForPhase,
  welcomeNoteKeyForPhase,
  visibleForPhase,
  formatStayDates,
  tipKeyForHour,
  tipTargetForHour,
  applyJourney,
} from '../js/journey.js';

function makeEl(attrs = {}){
  const el = {
    _attrs: { ...attrs },
    getAttribute(name){ return this._attrs[name] ?? null; },
    setAttribute(name, value){ this._attrs[name] = value; },
    hasAttribute(name){ return name in this._attrs; },
  };
  return el;
}

// Mirrors the real DOM: document.querySelectorAll('[data-journey]') matches
// documentElement too, once applyJourney has tagged <html> with data-journey.
function makeFakeDoc(){
  const documentElement = makeEl({ lang: 'en' });
  const cards = [
    makeEl({ 'data-journey': 'arrive' }),
    makeEl({ 'data-journey': 'stay' }),
  ];
  const body = {
    querySelectorAll(sel){
      if (sel === '[data-journey]:not(.jpill)') return cards;
      if (sel === '.jpill') return [];
      return [];
    },
  };
  const doc = {
    documentElement,
    body,
    querySelector: () => null,
    getElementById: () => null,
    querySelectorAll(sel){
      // Real document.querySelectorAll also matches documentElement itself
      // once it carries the matched attribute/class.
      if (sel === '[data-journey]:not(.jpill)'){
        return [documentElement, ...cards];
      }
      if (sel === '.jpill') return [];
      return [];
    },
  };
  return { doc, documentElement, cards };
}

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

test('welcomeNoteKeyForPhase uses pre-arrival copy on welcome', () => {
  assert.equal(welcomeNoteKeyForPhase('welcome'), 'welcomeNoteWelcome');
  assert.equal(welcomeNoteKeyForPhase('stay'), 'welcomeNote');
  assert.equal(welcomeNoteKeyForPhase('arrive'), 'welcomeNote');
});

test('visibleForPhase respects data-journey lists', () => {
  const peek = { getAttribute: () => 'welcome stay' };
  const eat = { getAttribute: () => 'stay' };
  assert.equal(visibleForPhase(peek, 'welcome'), true);
  assert.equal(visibleForPhase(peek, 'stay'), true);
  assert.equal(visibleForPhase(peek, 'leave'), false);
  assert.equal(visibleForPhase(eat, 'welcome'), false);
  assert.equal(visibleForPhase({ getAttribute: () => '' }, 'welcome'), true);
});

test('formatStayDates compacts same-month stays', () => {
  assert.equal(formatStayDates({ checkIn: '2026-07-08', checkOut: '2026-07-12' }, 'en'), '8–12 July');
  assert.equal(formatStayDates({ checkIn: '2026-07-08', checkOut: '2026-07-12' }, 'it'), '8–12 luglio');
});

test('formatStayDates spells out cross-month stays', () => {
  assert.equal(
    formatStayDates({ checkIn: '2026-06-28', checkOut: '2026-07-02' }, 'en'),
    '28 June – 2 July',
  );
});

test('formatStayDates returns empty string without a stay', () => {
  assert.equal(formatStayDates(null, 'en'), '');
  assert.equal(formatStayDates({}, 'en'), '');
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

test('applyJourney never hides the document root, including in the after phase', () => {
  const { doc, documentElement } = makeFakeDoc();
  applyJourney(doc, 'stay');
  assert.notEqual(documentElement.hidden, true);

  applyJourney(doc, 'after');
  assert.notEqual(documentElement.hidden, true,
    'documentElement.hidden=true blanks the entire page, since [hidden] is display:none');
});
