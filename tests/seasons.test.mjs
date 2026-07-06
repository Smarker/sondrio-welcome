import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonForMonth } from '../js/seasons.js';

test('january is winter', () => assert.equal(seasonForMonth(1), 'winter'));
test('march is winter', () => assert.equal(seasonForMonth(3), 'winter'));
test('july is summer', () => assert.equal(seasonForMonth(7), 'summer'));
test('november is winter', () => assert.equal(seasonForMonth(11), 'winter'));
test('october is summer', () => assert.equal(seasonForMonth(10), 'summer'));
