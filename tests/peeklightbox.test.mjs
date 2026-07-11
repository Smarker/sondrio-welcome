import { test } from 'node:test';
import assert from 'node:assert/strict';
import { peekCaption, stepIndex } from '../js/peeklightbox.js';

test('stepIndex wraps around in both directions', () => {
  assert.equal(stepIndex(0, 1, 3), 1);
  assert.equal(stepIndex(2, 1, 3), 0);
  assert.equal(stepIndex(0, -1, 3), 2);
  assert.equal(stepIndex(1, 0, 3), 1);
  assert.equal(stepIndex(0, 1, 0), 0);
});

test('peekCaption prefers slot label text', () => {
  const slot = {
    querySelector(sel){
      if (sel === '.slotlabel') return { textContent: '  Kitchen  ' };
      if (sel === '.shot') return { alt: 'Kitchen and dining' };
    }
  };
  assert.equal(peekCaption(slot), 'Kitchen');
});

test('peekCaption falls back to image alt', () => {
  const slot = {
    querySelector(sel){
      if (sel === '.slotlabel') return null;
      if (sel === '.shot') return { alt: 'Office' };
    }
  };
  assert.equal(peekCaption(slot), 'Office');
});
