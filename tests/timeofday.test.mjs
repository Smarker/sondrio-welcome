import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phaseForHour, greetingKeyForHour } from '../js/timeofday.js';

test('phase: deep night is night', () => assert.equal(phaseForHour(23), 'night'));
test('phase: 5am is night', () => assert.equal(phaseForHour(5), 'night'));
test('phase: dawn 6-7 is golden', () => assert.equal(phaseForHour(6), 'golden'));
test('phase: 8am is day', () => assert.equal(phaseForHour(8), 'day'));
test('phase: noon is day', () => assert.equal(phaseForHour(12), 'day'));
test('phase: 5pm is day', () => assert.equal(phaseForHour(17), 'day'));
test('phase: dusk 18-20 is golden', () => assert.equal(phaseForHour(19), 'golden'));
test('phase: 9pm is night', () => assert.equal(phaseForHour(21), 'night'));

test('greeting: 8am is morning', () => assert.equal(greetingKeyForHour(8), 'greetMorning'));
test('greeting: 5am is morning', () => assert.equal(greetingKeyForHour(5), 'greetMorning'));
test('greeting: noon is afternoon', () => assert.equal(greetingKeyForHour(12), 'greetAfternoon'));
test('greeting: 6pm is evening', () => assert.equal(greetingKeyForHour(18), 'greetEvening'));
test('greeting: 2am is evening', () => assert.equal(greetingKeyForHour(2), 'greetEvening'));
