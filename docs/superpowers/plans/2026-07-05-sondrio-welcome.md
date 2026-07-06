# Sondrio Welcome Packet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, mobile-first, five-language digital welcome packet for a Sondrio Airbnb, hosted on GitHub Pages, with client-side passphrase-encrypted private details.

**Architecture:** A single-page, no-build static site: one `index.html`, one stylesheet, and a few small ES-module scripts. All guest copy lives in one translations object; language and season are signals that filter/render that content. Door code and Wi-Fi are AES-encrypted at author time and decrypted in the browser via Web Crypto after the guest enters a shared passphrase.

**Tech Stack:** Plain HTML5, CSS (custom properties, fl/grid, `clamp()`), vanilla JS ES modules, Web Crypto API. Tests use Node's built-in test runner (`node --test`) — zero npm dependencies. Local preview via `python3 -m http.server`.

**Reference:** `docs/prototype.html` is the approved, working prototype. It is the source of truth for exact markup, copy, palette, and the full 5-language translations object. Port from it; do not redesign. The spec is `docs/superpowers/specs/2026-07-05-sondrio-welcome-design.md`.

## Global Constraints

- **No build step, no runtime dependencies, no external hosts.** No font/script/style CDNs, no remote images/fetch. Everything self-hosted. (GitHub Pages CSP-friendly.)
- **Fonts:** system stacks only — serif `"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`; sans `-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif`.
- **Palette (Tricolore Rustico):** bg `#F3ECDD` · ink `#2C2620` · brick red `#A2402F` · pine green `#3F5C43` · gold `#C58A3A` · card `#FAF4E8` · line `#E3D8C1` · muted `#867A67`. Red = host/urgent/copy; green = navigate/maps; gold = accents.
- **Languages:** it, en, es, fr, de. Auto-detect from `navigator.language`; fallback `en`; remember choice in `localStorage` key `sw-lang`.
- **Copy rules:** no em dashes (`—`) anywhere in guest-facing copy. Active voice. No ad-speak.
- **Secrets:** door code and Wi-Fi password must never appear as plaintext in the repo or served HTML. Ciphertext only.
- **Motion:** all animation must be disabled under `@media (prefers-reduced-motion: reduce)`.
- **Responsive:** no horizontal scroll from 320px to desktop; iOS Safari + Android Chrome primary; safe-area insets honored.
- **Commit** after every task with a `feat:`/`chore:`/`docs:` message.

---

### Task 1: Project scaffold and local preview

**Files:**
- Create: `index.html`, `css/styles.css`, `js/content.js`, `js/i18n.js`, `js/seasons.js`, `js/unlock.js`, `.nojekyll`

**Interfaces:**
- Produces: the page shell that loads `css/styles.css` and `js/i18n.js` (as `type="module"`), with a root container the later tasks populate.

- [ ] **Step 1: Create `.nojekyll`** (empty file) so GitHub Pages serves paths starting with `_`/`.` as-is.

- [ ] **Step 2: Create `index.html` shell**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="light">
  <title>Sondrio Stay</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <main class="phone-flow" id="app"><!-- sections injected/authored in later tasks --></main>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script type="module" src="js/i18n.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create empty stub files** `css/styles.css` (with `:root{}`), and `js/content.js`, `js/seasons.js`, `js/unlock.js` each `export {};` so module imports resolve.

- [ ] **Step 4: Serve and verify**

Run: `cd /Users/stephaniemarker/Projects/sondrio-welcome && python3 -m http.server 8080`
Then load `http://localhost:8080/` in a browser.
Expected: blank page, **no console errors** (modules load), tab title "Sondrio Stay".

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold static site shell"
```

---

### Task 2: Design system stylesheet

**Files:**
- Modify: `css/styles.css`
- Reference: `docs/prototype.html` `<style>` block (everything inside the `.screen` scope becomes page-level here — there is no phone frame in the real site).

**Interfaces:**
- Produces: CSS custom properties on `:root` (the Global Constraints palette + `--serif`, `--sans`, `--ease`, `--dur`, `--rise`), and component classes: `.card`, `.chead`, `.cicon`, `.ctitle`, `.row`, `.rlabel`, `.rval`, `.copy`, `.btn`/`.btn.red`/`.btn.green`, `.directions`, `.chips`/`.chip`, `.steps`, `.note`, `.band`, `.gallery`/`.slot`/`.frame`, `.trips`/`.trip`, `.eat`/`.ename`/`.edesc`/`.emap`, `.seasons`/`.szbtn`, `.act`/`.aicon`, `.privacy`/`.unlockbtn`, `.secret .mask`/`.secret .real`, `.langbar`/`.lang`, `.hero`/`.htitle`/`.hsub`/`.kicker`, `.toast`, `.reveal`.

- [ ] **Step 1: Port tokens and base.** Copy the `:root` custom properties (palette, `--serif`, `--sans`) and the Tricolore Rustico values from the prototype's `.pv--rustico`/`.screen` block into `:root` in `css/styles.css`. Add:

```css
:root{
  --bg:#F3ECDD; --ink:#2C2620; --muted:#867A67; --line:#E3D8C1; --card:#FAF4E8;
  --accent:#A2402F; --g:#3F5C43; --gold:#C58A3A;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  --ease:cubic-bezier(.2,.7,.2,1); --dur:.7s; --rise:16px;
}
*{box-sizing:border-box} html,body{margin:0}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.5}
```

- [ ] **Step 2: Port component classes.** Copy the component CSS (all selectors listed in Interfaces above) verbatim from `docs/prototype.html`, dropping the phone-frame rules (`.phone`, `.notch`, `.stage`, `.screen` wrapper, `.wrap`, `.intro`, `.legend`, `.hint`) and the `.pv--*` theme wrappers (fold their token values into `:root`). Keep the fancy button rules (gradient + glow + lift, no underline) exactly.

- [ ] **Step 3: Add the page layout wrapper.** The real site has no phone frame; content flows in a centered column:

```css
.phone-flow{max-width:480px;margin:0 auto;padding-bottom:56px;padding-bottom:calc(56px + env(safe-area-inset-bottom))}
.body{padding:18px 16px 40px;display:flex;flex-direction:column;gap:14px}
```

- [ ] **Step 4: Verify visually.** Reload `http://localhost:8080/`. Expected: still blank (no markup yet) but no CSS parse errors in console, and `document.documentElement` computed `--accent` is `#A2402F` (check in devtools).

- [ ] **Step 5: Commit**

```bash
git add css/styles.css && git commit -m "feat: add Tricolore Rustico design system"
```

---

### Task 3: Content model and section markup

**Files:**
- Modify: `js/content.js` (the full translations object), `index.html` (the authored sections with `data-t` keys)
- Reference: `docs/prototype.html` — copy the `const T = {...}` object and the `.body` section markup.

**Interfaces:**
- Consumes: design-system classes from Task 2.
- Produces: `export const T` (translations, keyed by string id, each `{it,en,es,fr,de}`), and semantic section markup inside `#app` where every translatable node has a `data-t="<key>"` attribute. Secret values use the `.secret` structure. Activities use `data-season`.

- [ ] **Step 1: Port the translations object.** Copy the entire `const T = {...}` from `docs/prototype.html` into `js/content.js`, prefixed with `export`. Verify no `—` characters: `grep -n "—" js/content.js` must print nothing.

- [ ] **Step 2: Author the sections into `index.html`.** Inside `<main id="app">`, add: the language bar (`.langbar` with 5 `.lang` buttons), the hero (`.hero` with looped-video placeholder for now — a `<div class="heromedia">` holding the prototype SVG, replaced in Task 7), and a `<div class="body">` containing, in order: privacy banner, welcome note, arrival & departure (door code + checkout 12:00 + steps), Wi-Fi (password), EV & amenities (coffee/washer/dryer/linens/heating chips), a peek inside gallery, band photo, neighbourhood, where to eat (3 restaurants), things to do (season toggle + 6 acts), day trips (4 trip cards + Hertz footnote), hosts (portrait + Call/WhatsApp), emergency. Copy this markup verbatim from `docs/prototype.html`'s `.body`, keeping every `data-t` key and the `.secret` blocks.

- [ ] **Step 3: Verify markup renders (untranslated).** Reload the page. Expected: all sections visible in Tricolore Rustico styling, English default text as authored, door code/Wi-Fi showing masked `••••`. No console errors.

- [ ] **Step 4: Commit**

```bash
git add js/content.js index.html && git commit -m "feat: add content model and section markup"
```

---

### Task 4: i18n engine (detect, render, switch, remember)

**Files:**
- Modify: `js/i18n.js`
- Test: `tests/i18n.test.mjs`

**Interfaces:**
- Consumes: `export const T` from `js/content.js`.
- Produces: `export function resolveLanguage(navLang, available)` → a 2-letter code; `export function applyLanguage(lang, doc=document)` → sets text of all `[data-t]` from `T`, toggles `.lang[aria-pressed]`, sets `<html lang>`. Also wires switcher clicks and initial detection on load, persisting to `localStorage['sw-lang']`.

- [ ] **Step 1: Write failing tests**

```js
// tests/i18n.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLanguage } from '../js/i18n.js';

const AVAIL = ['it','en','es','fr','de'];
test('exact match', () => assert.equal(resolveLanguage('fr', AVAIL), 'fr'));
test('region stripped', () => assert.equal(resolveLanguage('de-AT', AVAIL), 'de'));
test('case-insensitive', () => assert.equal(resolveLanguage('ES', AVAIL), 'es'));
test('unknown falls back to en', () => assert.equal(resolveLanguage('ja', AVAIL), 'en'));
test('empty falls back to en', () => assert.equal(resolveLanguage(undefined, AVAIL), 'en'));
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `node --test`
Expected: FAIL (`resolveLanguage` is not exported).

- [ ] **Step 3: Implement `resolveLanguage` and the engine**

```js
// js/i18n.js
import { T } from './content.js';
const AVAILABLE = ['it','en','es','fr','de'];

export function resolveLanguage(navLang, available = AVAILABLE){
  const code = String(navLang || '').toLowerCase().split('-')[0];
  return available.includes(code) ? code : 'en';
}

export function applyLanguage(lang, doc = document){
  doc.querySelectorAll('[data-t]').forEach(el => {
    const k = el.getAttribute('data-t');
    if (T[k] && T[k][lang]) el.textContent = T[k][lang];
  });
  doc.querySelectorAll('.lang').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  doc.documentElement.lang = lang;
}

function initI18n(){
  const saved = localStorage.getItem('sw-lang');
  const lang = saved || resolveLanguage(navigator.language);
  applyLanguage(lang);
  document.querySelectorAll('.lang').forEach(b =>
    b.addEventListener('click', () => {
      localStorage.setItem('sw-lang', b.dataset.lang);
      applyLanguage(b.dataset.lang);
    }));
}
if (typeof document !== 'undefined') initI18n();
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `node --test`
Expected: 5 tests PASS.

- [ ] **Step 5: Verify in browser.** Reload. Expected: page renders in your browser language (or English), clicking IT/ES/FR/DE re-renders all copy including day-trip descriptions and activities; reloading keeps the last chosen language.

- [ ] **Step 6: Commit**

```bash
git add js/i18n.js tests/i18n.test.mjs && git commit -m "feat: add i18n detection, render, and switcher"
```

---

### Task 5: Seasonal activities

**Files:**
- Modify: `js/seasons.js`, `js/i18n.js` (import + init call)
- Test: `tests/seasons.test.mjs`

**Interfaces:**
- Produces: `export function seasonForMonth(month1to12)` → `'winter'|'summer'`; `export function applySeason(season, doc=document)` → toggles `.act.hide` (show when `data-season===season || data-season==='all'`) and `.szbtn[aria-pressed]`; `export function initSeasons()` wires the toggle and sets default from `new Date()`.

- [ ] **Step 1: Write failing tests**

```js
// tests/seasons.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonForMonth } from '../js/seasons.js';

test('january is winter', () => assert.equal(seasonForMonth(1), 'winter'));
test('march is winter', () => assert.equal(seasonForMonth(3), 'winter'));
test('july is summer', () => assert.equal(seasonForMonth(7), 'summer'));
test('november is winter', () => assert.equal(seasonForMonth(11), 'winter'));
test('october is summer', () => assert.equal(seasonForMonth(10), 'summer'));
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `node --test`
Expected: FAIL (`seasonForMonth` not exported).

- [ ] **Step 3: Implement**

```js
// js/seasons.js
export function seasonForMonth(m){ return (m >= 11 || m <= 3) ? 'winter' : 'summer'; }

export function applySeason(season, doc = document){
  doc.querySelectorAll('.szbtn').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.season === season)));
  doc.querySelectorAll('#acts .act').forEach(a => {
    const show = a.dataset.season === season || a.dataset.season === 'all';
    a.classList.toggle('hide', !show);
  });
}

export function initSeasons(){
  document.querySelectorAll('.szbtn').forEach(b =>
    b.addEventListener('click', () => applySeason(b.dataset.season)));
  applySeason(seasonForMonth(new Date().getMonth() + 1));
}
```

- [ ] **Step 4: Wire init.** In `js/i18n.js` `initI18n()`, add `import { initSeasons } from './seasons.js';` at top and call `initSeasons();` at the end of `initI18n()`.

- [ ] **Step 5: Run tests + browser check**

Run: `node --test` → all seasons + i18n tests PASS.
Browser: reload; "Things to do" shows summer activities (current month July), toggling to Winter swaps to skiing; year-round items (terme, Bernina) stay in both.

- [ ] **Step 6: Commit**

```bash
git add js/seasons.js js/i18n.js tests/seasons.test.mjs && git commit -m "feat: add seasonal activity filtering"
```

---

### Task 6: Passphrase-encrypted private details

**Files:**
- Create: `data/secrets.enc.json`, `tools/encrypt.mjs`, `js/unlock.js`
- Modify: `js/i18n.js` (init call), `index.html` (unlock input UI)
- Test: `tests/unlock.test.mjs`

**Interfaces:**
- Produces: `export async function decryptSecrets(passphrase, enc)` → resolves to an object like `{ doorCode:"4827", wifiPassword:"valtellina26" }` or throws on wrong passphrase; `export function initUnlock()` wires the unlock button/input, calls `decryptSecrets`, fills `.secret .real[data-secret="<name>"]` nodes, and adds `.unlocked` to the flow on success.
- `tools/encrypt.mjs` is a Node CLI: `node tools/encrypt.mjs "<passphrase>"` reads plaintext values (edit the object at the top of the file) and writes `data/secrets.enc.json`.
- Format of `secrets.enc.json`: `{ "salt":"<base64>", "iv":"<base64>", "ciphertext":"<base64>" }`. Key = PBKDF2(passphrase, salt, 150000, SHA-256) → AES-GCM 256.

- [ ] **Step 1: Write `tools/encrypt.mjs`**

```js
// tools/encrypt.mjs — run: node tools/encrypt.mjs "your-passphrase"
import { writeFile } from 'node:fs/promises';
const PLAINTEXT = { doorCode: '4827', wifiPassword: 'valtellina26' }; // edit these
const b64 = (buf) => Buffer.from(buf).toString('base64');
const pass = process.argv[2];
if (!pass) { console.error('Usage: node tools/encrypt.mjs "<passphrase>"'); process.exit(1); }
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const baseKey = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name:'PBKDF2', salt, iterations:150000, hash:'SHA-256' },
  baseKey, { name:'AES-GCM', length:256 }, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(JSON.stringify(PLAINTEXT)));
await writeFile('data/secrets.enc.json', JSON.stringify({ salt:b64(salt), iv:b64(iv), ciphertext:b64(ct) }, null, 2));
console.log('Wrote data/secrets.enc.json');
```

- [ ] **Step 2: Generate the encrypted file**

Run: `cd /Users/stephaniemarker/Projects/sondrio-welcome && node tools/encrypt.mjs "valtellina-2026"`
Expected: `Wrote data/secrets.enc.json`; the file contains only base64 fields (no plaintext). Verify: `grep -i "4827\|valtellina26" data/secrets.enc.json` prints nothing.

- [ ] **Step 3: Write failing test** (round-trips against the real file)

```js
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
```

- [ ] **Step 4: Run test, verify it fails**

Run: `node --test tests/unlock.test.mjs`
Expected: FAIL (`decryptSecrets` not exported).

- [ ] **Step 5: Implement `js/unlock.js`**

```js
// js/unlock.js
const b64d = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function decryptSecrets(passphrase, enc){
  const dec = new TextDecoder(), te = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', te.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name:'PBKDF2', salt:b64d(enc.salt), iterations:150000, hash:'SHA-256' },
    baseKey, { name:'AES-GCM', length:256 }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv:b64d(enc.iv) }, key, b64d(enc.ciphertext));
  return JSON.parse(dec.decode(pt)); // throws if passphrase wrong (GCM auth fail)
}

export function initUnlock(){
  const btn = document.getElementById('unlockBtn');
  const input = document.getElementById('unlockInput');
  const flow = document.querySelector('.phone-flow');
  if (!btn) return;
  async function attempt(){
    try {
      const enc = await fetch('data/secrets.enc.json').then(r => r.json());
      const secrets = await decryptSecrets(input.value.trim(), enc);
      document.querySelectorAll('.secret .real[data-secret]').forEach(el => {
        const name = el.dataset.secret;
        if (secrets[name] != null) el.firstChild.textContent = secrets[name];
      });
      flow.classList.add('unlocked');
    } catch { input.setAttribute('aria-invalid','true'); input.value=''; input.placeholder='Try again'; }
  }
  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}
```

- [ ] **Step 6: Update markup for real secrets.** In `index.html`: (a) the privacy banner's Unlock button gets `id="unlockBtn"` and gains a text `<input id="unlockInput" ... placeholder="Access phrase">`; (b) each `.secret .real` node wraps its value in a text node plus the copy button, and carries `data-secret="doorCode"` / `data-secret="wifiPassword"` so `initUnlock` can fill it. Remove the hard-coded `4827` / `valtellina26` plaintext from `index.html` (leave the real span empty until unlocked). Verify: `grep -i "4827\|valtellina26" index.html` prints nothing.

- [ ] **Step 7: Wire init.** In `js/i18n.js`, `import { initUnlock } from './unlock.js';` and call `initUnlock();` in `initI18n()`.

- [ ] **Step 8: Run tests + browser check**

Run: `node --test` → all tests PASS.
Browser: door code + Wi-Fi show masked; entering `valtellina-2026` and pressing Unlock reveals `4827` / `valtellina26` and the copy buttons work; a wrong phrase clears the field and shows "Try again".

- [ ] **Step 9: Commit**

```bash
git add js/unlock.js tools/encrypt.mjs data/secrets.enc.json index.html js/i18n.js tests/unlock.test.mjs && git commit -m "feat: passphrase-encrypted door code and wifi"
```

---

### Task 7: Media — looped hero video and photo/clip slots

**Files:**
- Modify: `index.html` (hero + gallery/band/trip media), `css/styles.css` (media rules), `js/i18n.js` (reduced-motion pause)
- Create: `media/README.md` (what files to drop in), `media/.gitkeep`

**Interfaces:**
- Produces: a hero `<video>` with `poster`, `muted`, `loop`, `playsinline`, `autoplay`, plus a graceful state when no file exists; `data-slot` labelled placeholders for guest photos/clips that render as tasteful frames until a file is present.

- [ ] **Step 1: Hero video markup.** Replace the hero media placeholder with:

```html
<div class="heromedia">
  <video class="herovideo" poster="media/hero-poster.jpg" muted loop playsinline autoplay preload="none"></video>
  <div class="heromedia-fallback" aria-hidden="true"><!-- prototype SVG scene as fallback --></div>
</div>
```

Keep the prototype's SVG scene inside `.heromedia-fallback` so the hero always looks intentional even before a video/poster is added. Add `<source>` wiring in Step 2.

- [ ] **Step 2: Graceful video handling.** In `css/styles.css`, `.herovideo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}` and `.herovideo:not([src]){display:none}` so the SVG fallback shows until a real file is set. Document in `media/README.md`: "Drop `hero.mp4` + `hero-poster.jpg` into `media/`, then set `herovideo` `src="media/hero.mp4"`." (Keeping `src` unset by default means no broken-media icon.)

- [ ] **Step 3: Reduced-motion + save-data pause.** In `js/i18n.js` init, add:

```js
const v = document.querySelector('.herovideo');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
if (v && (reduce || saveData)) { v.removeAttribute('autoplay'); v.pause?.(); }
```

- [ ] **Step 4: Photo/clip slots.** Confirm the `.frame`/`.slot`, `.band`, and `.trip .tframe` placeholders (ported in Task 3) render as dashed/solid labelled frames. Add `media/README.md` guidance: replace a `.frame` with `<img class="shot" src="media/bedroom.jpg" alt="Bedroom">` (and `.tframe` similarly) when photos are ready; add `.shot{width:100%;height:100%;object-fit:cover;border-radius:inherit}`.

- [ ] **Step 5: Verify.** Reload: hero shows the SVG scene (no video yet), no broken-image icons anywhere, galleries show labelled frames. Toggle OS reduced-motion and confirm no autoplay attempt / no motion.

- [ ] **Step 6: Commit**

```bash
git add index.html css/styles.css js/i18n.js media/ && git commit -m "feat: hero video with graceful fallback and media slots"
```

---

### Task 8: Responsive layout and animations

**Files:**
- Modify: `css/styles.css`, `js/i18n.js` (scroll-reveal observer)

**Interfaces:**
- Produces: a centered column that widens tastefully on desktop, a sticky language bar that clears safe areas, scroll-reveal on `.reveal` elements, and full `prefers-reduced-motion` compliance.

- [ ] **Step 1: Sticky language bar + safe areas.**

```css
.langbar{position:sticky;top:0;z-index:5;display:flex;gap:6px;justify-content:center;
  padding:calc(11px + env(safe-area-inset-top)) 12px 11px;
  background:color-mix(in srgb,var(--bg) 88%,transparent);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
```

- [ ] **Step 2: Desktop widening + two-column cards.**

```css
@media (min-width:900px){
  .phone-flow{max-width:760px}
  .body{display:grid;grid-template-columns:1fr 1fr;align-items:start}
  .hero,.privacy,.note,.band{grid-column:1 / -1}
}
```

- [ ] **Step 3: Scroll-reveal.** In `js/i18n.js` init:

```js
const io = new IntersectionObserver((ents) => {
  ents.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold:.12 });
document.querySelectorAll('.reveal').forEach((el,i) => { el.style.transitionDelay=(i*55)+'ms'; io.observe(el); });
```

Ensure `.reveal`/`.reveal.in` CSS (ported from prototype) is present.

- [ ] **Step 4: Reduced-motion guard.** Confirm `@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.reveal{opacity:1;transform:none}}` is in `styles.css`.

- [ ] **Step 5: Verify at widths.** In devtools responsive mode, check **320px, 390px, 768px, 1200px**: no horizontal scroll at any width; single column on phones, two-column body on desktop; galleries scroll within their own row; language bar stays legible. Cards reveal on scroll; with reduced-motion on, everything is visible with no motion.

- [ ] **Step 6: Commit**

```bash
git add css/styles.css js/i18n.js && git commit -m "feat: responsive layout and scroll-reveal animations"
```

---

### Task 9: README and deployment docs

**Files:**
- Modify: `README.md`

**Interfaces:** none (docs).

- [ ] **Step 1: Write the README** covering: (a) local preview (`python3 -m http.server`), (b) editing copy — one object in `js/content.js`, all 5 languages together, no em dashes, (c) adding media — drop files in `media/`, set the `src`, poster guidance, (d) **setting private details** — edit `PLAINTEXT` in `tools/encrypt.mjs`, run `node tools/encrypt.mjs "<passphrase>"`, share the passphrase with guests privately (Airbnb/WhatsApp), never print it beside the QR code, rotate per season by re-running, (e) filling placeholders — checklist of host inputs (phone/WhatsApp numbers as `tel:`/`https://wa.me/<intl-number>` links, Google Maps URLs for property/restaurants/day trips, exact times, pharmacy distance), (f) deploying — push to GitHub, Settings → Pages → Deploy from `main` branch root; the QR code should point at the Pages URL.

- [ ] **Step 2: Run the test suite once more.** Run: `node --test` → all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add README.md && git commit -m "docs: add editing, secrets, and deploy guide"
```

---

### Task 10: Final verification pass

**Files:** none (verification only). Use the `verify` skill if available.

- [ ] **Step 1: Full test run.** `node --test` → all i18n, seasons, unlock tests PASS.
- [ ] **Step 2: Secret leak check.** `grep -rInE "4827|valtellina26" index.html js/ css/` prints nothing (plaintext only lives in `tools/encrypt.mjs`, which is not deployed — confirm it is the only hit).
- [ ] **Step 3: No em dashes.** `grep -rn "—" index.html js/content.js` prints nothing.
- [ ] **Step 4: Browser smoke test** at 320px and desktop: language auto-detect + manual switch across all 5 (spot-check day trips + activities translate); season toggle; unlock with the passphrase reveals code/Wi-Fi and copy works; directions/map/Call/WhatsApp are correct link types; no console errors; no horizontal scroll.
- [ ] **Step 5: Reduced-motion** on: page fully usable, no animation, hero static.
- [ ] **Step 6: Final commit** if any fixes were needed.

```bash
git add -A && git commit -m "chore: final verification fixes" || echo "nothing to fix"
```

---

## Self-Review (completed)

**Spec coverage:** no-build static site (T1), Tricolore Rustico (T2), content model + sections (T3), 5-language auto-detect/switch/remember (T4), seasonal activities (T5), passphrase-encrypted secrets (T6), looped hero video + media slots (T7), responsive + animations + reduced-motion (T8), README/deploy incl. Hertz + host placeholders (T9), verification incl. secret-leak + em-dash checks (T10). Hosts-at-bottom / no floating button and the full section order are realized in T3 by porting the approved prototype. All spec sections map to a task.

**Placeholder scan:** logic tasks (i18n resolve, season, crypto) contain complete runnable code and tests. Markup/CSS tasks reference `docs/prototype.html` as the exact, committed source to port from rather than restating hundreds of lines — the content is concrete and in-repo, not "TBD".

**Type consistency:** `resolveLanguage`/`applyLanguage` (T4), `seasonForMonth`/`applySeason`/`initSeasons` (T5), `decryptSecrets`/`initUnlock` + the `{salt,iv,ciphertext}` file shape and `{doorCode,wifiPassword}` payload (T6) are used consistently across their producing/consuming tasks.
