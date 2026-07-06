import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLanguage } from '../js/i18n.js';

const AVAIL = ['it','en','es','fr','de'];
test('exact match', () => assert.equal(resolveLanguage('fr', AVAIL), 'fr'));
test('region stripped', () => assert.equal(resolveLanguage('de-AT', AVAIL), 'de'));
test('case-insensitive', () => assert.equal(resolveLanguage('ES', AVAIL), 'es'));
test('unknown falls back to en', () => assert.equal(resolveLanguage('ja', AVAIL), 'en'));
test('empty falls back to en', () => assert.equal(resolveLanguage(undefined, AVAIL), 'en'));
