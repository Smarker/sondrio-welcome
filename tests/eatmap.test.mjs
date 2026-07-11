import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eatEmbedUrl, eatRouteUrl, myMapsEmbedUrl } from '../js/eatmap.js';

test('myMapsEmbedUrl wraps a configured map id and is empty without one', () => {
  assert.equal(myMapsEmbedUrl('1abcDEF_xyz'), 'https://www.google.com/maps/d/embed?mid=1abcDEF_xyz');
  assert.equal(myMapsEmbedUrl(''), '');
  assert.equal(myMapsEmbedUrl(undefined), '');
});

test('eatRouteUrl chains every place into one walking-directions embed', () => {
  const url = eatRouteUrl(['A, Sondrio', 'B, Sondrio', 'C, Sondrio'], 'en');
  assert.equal(url,
    'https://www.google.com/maps?saddr=A%2C%20Sondrio&daddr=B%2C%20Sondrio+to:C%2C%20Sondrio&dirflg=w&hl=en&output=embed');
});

test('eatRouteUrl falls back to a single-pin embed for one place', () => {
  assert.equal(eatRouteUrl(['A, Sondrio'], 'it'), eatEmbedUrl('A, Sondrio', 'it'));
  assert.equal(eatRouteUrl([], 'en'), '');
});

test('eatEmbedUrl builds a keyless Google Maps embed URL', () => {
  assert.equal(
    eatEmbedUrl('Trattoria Olmo, Sondrio', 'en'),
    'https://www.google.com/maps?q=Trattoria%20Olmo%2C%20Sondrio&hl=en&output=embed',
  );
});

test('eatEmbedUrl encodes query and language', () => {
  const url = eatEmbedUrl('Il Tabernario · Enoteca delle Alpi, Sondrio', 'it');
  assert.match(url, /^https:\/\/www\.google\.com\/maps\?q=/);
  assert.match(url, /&hl=it&output=embed$/);
  assert.doesNotMatch(url, / /);
});
