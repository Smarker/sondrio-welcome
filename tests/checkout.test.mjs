import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleState, isComplete, loadState } from '../js/checkout.js';

test('toggle sets an unset id to true', () => {
  assert.deepEqual(toggleState({}, 'bins'), { bins: true });
});
test('toggle flips a set id to false', () => {
  assert.deepEqual(toggleState({ bins: true }, 'bins'), { bins: false });
});
test('toggle does not mutate input', () => {
  const s = { bins: true };
  toggleState(s, 'bins');
  assert.deepEqual(s, { bins: true });
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
