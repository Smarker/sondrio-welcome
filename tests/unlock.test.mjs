// tests/unlock.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decryptSecrets } from '../js/unlock.js';

const enc = JSON.parse(await readFile(new URL('../data/secrets.enc.json', import.meta.url)));
test('correct passphrase decrypts', async () => {
  const out = await decryptSecrets('valtellina-2026', enc);
  assert.equal(out.doorCode, '4827');
  assert.equal(out.wifiPassword, 'valtellina26');
});
test('wrong passphrase throws', async () => {
  await assert.rejects(() => decryptSecrets('nope', enc));
});
