// tools/encrypt.mjs — run: node tools/encrypt.mjs "your-passphrase"
import { readFile, writeFile } from 'node:fs/promises';
import { encryptSecrets } from '../js/unlock.js';

const pass = process.argv[2];
if (!pass) { console.error('Usage: node tools/encrypt.mjs "<passphrase>"'); process.exit(1); }

const secretsUrl = new URL('./secrets.local.json', import.meta.url);
let PLAINTEXT;
try {
  PLAINTEXT = JSON.parse(await readFile(secretsUrl, 'utf8'));
} catch {
  console.error('Create tools/secrets.local.json from tools/secrets.local.example.json with your real doorCode and wifiPassword.');
  process.exit(1);
}

const enc = await encryptSecrets(pass, PLAINTEXT);
await writeFile(new URL('../data/secrets.enc.json', import.meta.url), JSON.stringify(enc, null, 2));
console.log('Wrote data/secrets.enc.json');
