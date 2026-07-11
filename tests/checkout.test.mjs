import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleState, isComplete, loadState } from '../js/checkout.js';

test('toggle sets an unset id to true', () => {
  assert.deepEqual(toggleState({}, 'dishwasher'), { dishwasher: true });
});
test('toggle flips a set id to false', () => {
  assert.deepEqual(toggleState({ dishwasher: true }, 'dishwasher'), { dishwasher: false });
});
test('toggle does not mutate input', () => {
  const s = { dishwasher: true };
  toggleState(s, 'dishwasher');
  assert.deepEqual(s, { dishwasher: true });
});
test('isComplete true only when all ids true', () => {
  assert.equal(isComplete({ a: true, b: true }, ['a','b']), true);
  assert.equal(isComplete({ a: true, b: false }, ['a','b']), false);
  assert.equal(isComplete({ a: true }, ['a','b']), false);
});
test('loadState reads and parses JSON from storage', () => {
  const store = { getItem: () => JSON.stringify({ a: true }) };
  assert.deepEqual(loadState(store), { a: true });
});
test('loadState returns empty object on missing or bad data', () => {
  assert.deepEqual(loadState({ getItem: () => null }), {});
  assert.deepEqual(loadState({ getItem: () => 'not json' }), {});
});
