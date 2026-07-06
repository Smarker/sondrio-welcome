// js/unlock.js
import { T } from './content.js';

const b64d = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64e = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

export async function encryptSecrets(passphrase, obj){
  const te = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await crypto.subtle.importKey('raw', te.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:150000, hash:'SHA-256' },
    baseKey, { name:'AES-GCM', length:256 }, false, ['encrypt']);
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, te.encode(JSON.stringify(obj)));
  return { salt:b64e(salt), iv:b64e(iv), ciphertext:b64e(ct) };
}

export async function decryptSecrets(passphrase, enc){
  const dec = new TextDecoder(), te = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', te.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name:'PBKDF2', salt:b64d(enc.salt), iterations:150000, hash:'SHA-256' },
    baseKey, { name:'AES-GCM', length:256 }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv:b64d(enc.iv) }, key, b64d(enc.ciphertext));
  return JSON.parse(dec.decode(pt)); // throws if passphrase wrong (GCM auth fail)
}

function showToast(){
  const toast = document.getElementById('toast');
  if (!toast) return;
  const lang = document.documentElement.lang || 'en';
  toast.textContent = (T.copied && T.copied[lang]) || T.copied?.en || 'Copied';
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 1400);
}

function showUnlockedToast(){
  const toast = document.getElementById('toast');
  if (!toast) return;
  const lang = document.documentElement.lang || 'en';
  toast.textContent = (T.unlockedMsg && T.unlockedMsg[lang]) || 'Unlocked';
  toast.classList.add('show');
  clearTimeout(showUnlockedToast._t);
  showUnlockedToast._t = setTimeout(() => toast.classList.remove('show'), 1500);
}

function reveal(secrets){
  document.querySelectorAll('.secret .real[data-secret]').forEach(el => {
    const name = el.dataset.secret;
    if (secrets[name] != null) {
      const sval = el.querySelector('.sval');
      if (sval) sval.textContent = secrets[name];
      const copyBtn = el.querySelector('.copy');
      if (copyBtn) copyBtn.dataset.copy = secrets[name];
    }
  });
  document.querySelector('.phone-flow').classList.add('unlocked');
}

const UNLOCK_KEY = 'sw-unlock';

export function initUnlock(){
  const btn = document.getElementById('unlockBtn');
  const input = document.getElementById('unlockInput');
  const flow = document.querySelector('.phone-flow');

  if (btn && input && flow) {
    async function attempt(passphrase, { silent = false } = {}){
      try {
        const enc = await fetch('data/secrets.enc.json').then(r => r.json());
        const secrets = await decryptSecrets(passphrase, enc);
        reveal(secrets);
        sessionStorage.setItem(UNLOCK_KEY, passphrase);
        if (!silent) {
          input.removeAttribute('aria-invalid');
          showUnlockedToast();
        }
      } catch {
        if (!silent) {
          input.setAttribute('aria-invalid', 'true');
          input.value = '';
          const lang = document.documentElement.lang || 'en';
          input.placeholder = (T.tryAgain && T.tryAgain[lang]) || 'Try again';
        } else {
          sessionStorage.removeItem(UNLOCK_KEY);
        }
      }
    }
    btn.addEventListener('click', () => attempt(input.value.trim()));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(input.value.trim()); });

    const stored = sessionStorage.getItem(UNLOCK_KEY);
    if (stored) attempt(stored, { silent: true });
  }

  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy');
    if (!copyBtn) return;
    if (!copyBtn.dataset.copy) return;
    navigator.clipboard?.writeText(copyBtn.dataset.copy);
    showToast();
  });
}
