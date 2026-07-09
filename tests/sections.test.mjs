import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sectionsOrderFor, labelKeyForItem } from '../js/sections.js';

const arrival = { id: 'arrival', label: { default: 'tabArrival', leave: 'arrival' } };
const hosts = { id: 'hosts', label: { default: 'navHosts', leave: 'hostNames' } };

test('sectionsOrderFor prioritises checkout essentials', () => {
  assert.deepEqual(sectionsOrderFor('leave').slice(0, 5), [
    'arrival', 'hosts', 'emergency', 'guestbook', 'sendoff',
  ]);
});

test('sectionsOrderFor keeps trip options after checkout essentials', () => {
  assert.deepEqual(sectionsOrderFor('leave').slice(5), [
    'peek', 'explore', 'eat', 'daytrips',
  ]);
});

test('labelKeyForItem uses checkout labels on leave day', () => {
  assert.equal(labelKeyForItem(arrival, 'leave'), 'arrival');
  assert.equal(labelKeyForItem(hosts, 'leave'), 'hostNames');
});

test('labelKeyForItem keeps default labels on other phases', () => {
  assert.equal(labelKeyForItem(arrival, 'stay'), 'tabArrival');
  assert.equal(labelKeyForItem(hosts, 'arrive'), 'navHosts');
});
