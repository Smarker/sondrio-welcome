import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTarget, QUICK_TARGETS } from '../js/quickaccess.js';

test('door pill targets the arrival card', () => assert.equal(resolveTarget('door'), '#card-arrival'));
test('wifi pill targets the wifi card', () => assert.equal(resolveTarget('wifi'), '#card-wifi'));
test('unknown key resolves to null', () => assert.equal(resolveTarget('nope'), null));
test('every target is a non-empty selector', () => {
  for (const sel of Object.values(QUICK_TARGETS)) assert.match(sel, /^#/);
});
