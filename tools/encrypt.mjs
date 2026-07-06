// tools/encrypt.mjs — run: node tools/encrypt.mjs "your-passphrase"
import { readFile, writeFile } from 'node:fs/promises';
const b64 = (buf) => Buffer.from(buf).toString('base64');
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

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const baseKey = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name:'PBKDF2', salt, iterations:150000, hash:'SHA-256' },
  baseKey, { name:'AES-GCM', length:256 }, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(JSON.stringify(PLAINTEXT)));
await writeFile(new URL('../data/secrets.enc.json', import.meta.url), JSON.stringify({ salt:b64(salt), iv:b64(iv), ciphertext:b64(ct) }, null, 2));
console.log('Wrote data/secrets.enc.json');
