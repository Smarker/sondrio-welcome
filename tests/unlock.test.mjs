// tests/unlock.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptSecrets, decryptSecrets } from '../js/unlock.js';

test('round-trips', async () => {
  const fixture = { doorCode: 'A1B2', wifiPassword: 'unit-test-pw' };
  const enc = await encryptSecrets('unit-pass', fixture);
  const out = await decryptSecrets('unit-pass', enc);
  assert.deepEqual(out, fixture);
});

test('wrong passphrase rejects', async () => {
  const enc = await encryptSecrets('unit-pass', { doorCode: 'x', wifiPassword: 'y' });
  await assert.rejects(() => decryptSecrets('WRONG', enc));
});
