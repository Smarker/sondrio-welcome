# Concierge Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static Sondrio welcome page into a boutique in-stay concierge: time-of-day styling, one-tap access to key info, an interactive checkout checklist, a daily pick, a curated guestbook, a warm send-off, snappier reveals, and a layout that holds on phone/tablet/desktop.

**Architecture:** Keep the existing static, no-build, no-dependency, phone-first architecture. Each new behaviour is a focused ES module in `js/` that exports pure, testable functions plus an `init*()` that wires the DOM, imported and called from `initI18n()` in `js/i18n.js` (the same pattern as `js/seasons.js` and `js/unlock.js`). All guest copy lives in the `T` object in `js/content.js` in all five languages and is applied via `data-t`. New palettes and layout are pure CSS in `css/styles.css`.

**Tech Stack:** Vanilla ES modules, plain CSS custom properties, `Intl.DateTimeFormat`, `IntersectionObserver`, `localStorage`/`sessionStorage`, `fetch`. Tests use the Node built-in test runner (`node --test`), pure functions only (no DOM, no jsdom).

## Global Constraints

Every task's requirements implicitly include these. Copied verbatim from the spec:

- Fully static. No build step, no dependencies, no framework, no external hosts or CDNs. Everything is local files served over HTTP.
- Phone-first, opened from a QR code, but must look intentional on tablet and desktop too.
- All guest-facing copy lives in the `T` object in `js/content.js` with all five languages present (it/en/es/fr/de), referenced from markup via `data-t` (and `data-t-placeholder` for inputs). English fallback text stays inline in the HTML.
- **No em dashes in guest copy.** Use commas, periods, or parentheses.
- Respect `prefers-reduced-motion` and `navigator.connection.saveData`. Keep thumb-friendly tap targets and existing `aria` state.
- Module pattern: a focused `js/*.js` exporting pure functions + an `init*()` wired from `initI18n()` in `js/i18n.js`. Each new pure-function module gets a `tests/*.test.mjs`.
- Run tests with: `node --test tests/*.mjs`. Preview locally with: `python3 -m http.server 8080` then open `http://localhost:8080/`.
- Work happens on branch `feat/concierge-upgrade` (already created).

---

## File Structure

**New files**
- `js/timeofday.js` — Sondrio-clock reader, `phaseForHour`, `greetingKeyForHour`, `applyTimeOfDay`, `initTimeOfDay`.
- `js/quickaccess.js` — `QUICK_TARGETS`, `initQuickAccess` (pill scroll + focus).
- `js/checkout.js` — pure checkout-state helpers + `initCheckout`.
- `js/picks.js` — `daysSinceEpoch`, `pickForDate`, `initPicks`.
- `js/guestbook.js` — `escapeHtml`, `guestbookHtml`, `initGuestbook`.
- `data/guestbook.json` — curated notes (committed, no secrets).
- `tests/timeofday.test.mjs`, `tests/quickaccess.test.mjs`, `tests/checkout.test.mjs`, `tests/picks.test.mjs`, `tests/guestbook.test.mjs`.

**Modified files**
- `index.html` — new markup sections + `data-t` keys.
- `css/styles.css` — time-of-day palettes, new component styles, faster reveals, responsive refinements.
- `js/content.js` — new copy in five languages.
- `js/i18n.js` — import/call new `init*()`; snappier reveal logic.
- `README.md` — document guestbook editing, picks pool, day/night behaviour.

---

## Task 1: Time-of-day engine (greeting + live Sondrio clock)

**Files:**
- Create: `js/timeofday.js`
- Test: `tests/timeofday.test.mjs`
- Modify: `index.html` (add greeting + clock nodes in the hero), `js/content.js` (greeting keys), `js/i18n.js` (import + call `initTimeOfDay`)

**Interfaces:**
- Produces:
  - `phaseForHour(h: number) -> 'day' | 'golden' | 'night'`
  - `greetingKeyForHour(h: number) -> 'greetMorning' | 'greetAfternoon' | 'greetEvening'`
  - `sondrioNow(date?: Date) -> { hour: number, minute: number }` (Europe/Rome)
  - `applyTimeOfDay(doc?, date?)` — sets `data-tod` on `<html>`, greeting text, clock text
  - `initTimeOfDay()` — runs `applyTimeOfDay` now and every 60s

- [ ] **Step 1: Write the failing test**

Create `tests/timeofday.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/timeofday.test.mjs`
Expected: FAIL — `Cannot find module '../js/timeofday.js'`.

- [ ] **Step 3: Write the module**

Create `js/timeofday.js`:

```javascript
import { T } from './content.js';

export function phaseForHour(h){
  if (h >= 21 || h < 6) return 'night';
  if (h < 8 || h >= 18) return 'golden';
  return 'day';
}

export function greetingKeyForHour(h){
  if (h >= 5 && h < 12) return 'greetMorning';
  if (h >= 12 && h < 18) return 'greetAfternoon';
  return 'greetEvening';
}

export function sondrioNow(date = new Date()){
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(date);
  const get = t => Number(parts.find(p => p.type === t).value);
  let hour = get('hour');
  if (hour === 24) hour = 0; // some engines emit 24 for midnight
  return { hour, minute: get('minute') };
}

export function applyTimeOfDay(doc = document, date = new Date()){
  const { hour, minute } = sondrioNow(date);
  doc.documentElement.setAttribute('data-tod', phaseForHour(hour));

  const lang = doc.documentElement.lang || 'en';
  const greetEl = doc.querySelector('[data-greeting]');
  if (greetEl){
    const key = greetingKeyForHour(hour);
    greetEl.setAttribute('data-t', key); // so language switches re-translate it
    if (T[key] && T[key][lang]) greetEl.textContent = T[key][lang];
  }
  const clockEl = doc.querySelector('[data-clock]');
  if (clockEl){
    clockEl.textContent = String(hour).padStart(2,'0') + ':' + String(minute).padStart(2,'0');
  }
}

export function initTimeOfDay(){
  applyTimeOfDay();
  setInterval(() => applyTimeOfDay(), 60000);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/timeofday.test.mjs`
Expected: PASS (13 tests).

- [ ] **Step 5: Add greeting copy to `js/content.js`**

Add these keys inside the `T` object (e.g. right after the `welcome` key on line 2):

```javascript
  greetMorning:{it:"Buongiorno",en:"Good morning",es:"Buenos días",fr:"Bonjour",de:"Guten Morgen"},
  greetAfternoon:{it:"Buon pomeriggio",en:"Good afternoon",es:"Buenas tardes",fr:"Bon après-midi",de:"Guten Tag"},
  greetEvening:{it:"Buonasera",en:"Good evening",es:"Buenas noches",fr:"Bonsoir",de:"Guten Abend"},
```

- [ ] **Step 6: Add greeting + clock nodes to the hero in `index.html`**

In `index.html`, replace the kicker line (line 39):

```html
          <div class="kicker" data-t="welcome">Welcome</div>
```

with:

```html
          <div class="kicker" data-t="welcome">Welcome</div>
          <div class="timeline"><span class="greeting" data-greeting data-t="greetEvening">Good evening</span><span class="clock" data-clock aria-hidden="true"></span></div>
```

- [ ] **Step 7: Wire `initTimeOfDay` into `js/i18n.js`**

In `js/i18n.js`, add to the imports (after line 3):

```javascript
import { initTimeOfDay } from './timeofday.js';
```

and inside `initI18n()`, right after `initUnlock();` (line 35), add:

```javascript
  initTimeOfDay();
```

- [ ] **Step 8: Verify in the browser**

Run: `python3 -m http.server 8080`, open `http://localhost:8080/`.
Expected: under the "Welcome" kicker, a localized greeting and a live `HH:MM` Sondrio clock appear; `<html>` has a `data-tod` attribute (check devtools). Switching language changes the greeting text.

- [ ] **Step 9: Commit**

```bash
git add js/timeofday.js tests/timeofday.test.mjs index.html js/content.js js/i18n.js
git commit -m "feat: time-of-day greeting and live Sondrio clock

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Day / golden / night palettes

**Files:**
- Modify: `css/styles.css` (add palette blocks + `.timeline` styles)

**Interfaces:**
- Consumes: `data-tod="day|golden|night"` on `<html>` from Task 1.
- Produces: nothing for JS; purely visual.

- [ ] **Step 1: Add `.timeline` styles**

In `css/styles.css`, after the `.kicker` rule (line 47), add:

```css
.timeline{display:flex;align-items:baseline;gap:9px;margin-top:9px}
.greeting{font-family:var(--serif);font-size:19px;font-weight:600;color:var(--ink)}
.clock{font-size:12.5px;font-variant-numeric:tabular-nums;color:var(--muted);font-weight:600}
```

- [ ] **Step 2: Add the three palettes**

In `css/styles.css`, immediately after the `:root{...}` block (after line 15), add:

```css
/* ---- time-of-day palettes (set via html[data-tod] from js/timeofday.js) ---- */
html{transition:background-color .8s var(--ease)}
html[data-tod="golden"]{
  --bg:#F4E6CE; --card:#FBEFDA; --line:#E8D3AE; --muted:#8A7350;
  --sky1:#F3D7A0; --sky2:#F4E6CE; --m1:#D9B06A; --m2:#7C7A45; --m3:#A85A2E; --sun:#E58B3C;
}
html[data-tod="night"]{
  --bg:#1C2230; --ink:#EDE7DA; --card:#252C3C; --line:#39435A; --muted:#9AA6BE;
  --accent:#D9705F; --g:#7FA283; --gold:#E0B15E;
  --sky1:#2A3348; --sky2:#1C2230; --m1:#3C4A66; --m2:#4B5D50; --m3:#2E3A52; --sun:#CBD5E8;
}
/* sun becomes a soft moon at night */
html[data-tod="night"] .heromedia-fallback circle[fill="var(--sun)"]{opacity:.85}
```

- [ ] **Step 3: Keep transitions honest under reduced motion**

The existing `@media (prefers-reduced-motion:reduce)` block (line 205) already sets `transition:none!important` on `*`, which covers `html`. No change needed, but confirm it is still the last rule in the file so it wins.

- [ ] **Step 4: Verify in the browser**

Reload `http://localhost:8080/`. Temporarily force each phase by running in the devtools console:
`document.documentElement.setAttribute('data-tod','night')` (then `'golden'`, then `'day'`).
Expected: background, cards, hero sky, and accents recolor cohesively; text stays clearly readable in all three; night is a deep dusk-blue, golden is warm amber.

- [ ] **Step 5: Commit**

```bash
git add css/styles.css
git commit -m "feat: day, golden, and night time-of-day palettes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Quick-access pills (Door code · Wi-Fi · Directions)

**Files:**
- Create: `js/quickaccess.js`
- Test: `tests/quickaccess.test.mjs`
- Modify: `index.html` (pill row + section ids), `css/styles.css` (pill styles), `js/i18n.js` (wire), `js/content.js` (aria label key)

**Interfaces:**
- Produces:
  - `QUICK_TARGETS: { [key: string]: string }` — pill key to CSS selector
  - `resolveTarget(key: string) -> string | null`
  - `initQuickAccess()` — wires pill clicks to smooth-scroll + focus unlock input if still locked

- [ ] **Step 1: Write the failing test**

Create `tests/quickaccess.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTarget, QUICK_TARGETS } from '../js/quickaccess.js';

test('door pill targets the arrival card', () => assert.equal(resolveTarget('door'), '#card-arrival'));
test('wifi pill targets the wifi card', () => assert.equal(resolveTarget('wifi'), '#card-wifi'));
test('unknown key resolves to null', () => assert.equal(resolveTarget('nope'), null));
test('every target is a non-empty selector', () => {
  for (const sel of Object.values(QUICK_TARGETS)) assert.match(sel, /^#/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/quickaccess.test.mjs`
Expected: FAIL — `Cannot find module '../js/quickaccess.js'`.

- [ ] **Step 3: Write the module**

Create `js/quickaccess.js`:

```javascript
export const QUICK_TARGETS = {
  door: '#card-arrival',
  wifi: '#card-wifi',
};

export function resolveTarget(key){
  return Object.prototype.hasOwnProperty.call(QUICK_TARGETS, key) ? QUICK_TARGETS[key] : null;
}

export function initQuickAccess(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.qpill[data-quick]').forEach(pill => {
    pill.addEventListener('click', () => {
      const sel = resolveTarget(pill.dataset.quick);
      if (!sel) return;
      const el = document.querySelector(sel);
      if (!el) return;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      const locked = !document.getElementById('app')?.classList.contains('unlocked');
      if (locked){
        const input = document.getElementById('unlockInput');
        if (input) setTimeout(() => input.focus(), reduce ? 0 : 500);
      }
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/quickaccess.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the pill row + section ids to `index.html`**

Add `id="card-arrival"` to the Arrival card (line 63) and `id="card-wifi"` to the Wi-Fi card (line 80):

```html
      <article class="card reveal" id="card-arrival">
```
```html
      <article class="card reveal" id="card-wifi">
```

Then, directly after the closing `</section>` of the hero (line 48) and before `<div class="body">` (line 50), add:

```html
    <nav class="quickbar reveal" data-t-arialabel="quickNav" aria-label="Quick access">
      <button class="qpill" data-quick="door"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span data-t="doorCode">Door code</span></button>
      <button class="qpill" data-quick="wifi"><svg viewBox="0 0 24 24"><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/></svg><span data-t="wifi">Wi-Fi</span></button>
      <a class="qpill" href="#" data-quick-directions><svg viewBox="0 0 24 24"><path d="M12 21s7-5.7 7-11a7 7 0 0 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg><span data-t="getDirections">Directions</span></a>
    </nav>
```

Note: the Directions pill reuses the same maps URL as the hero link. In `js/quickaccess.js` `initQuickAccess`, append after the `forEach` block (before the closing brace):

```javascript
  const heroDir = document.querySelector('.directions');
  const pillDir = document.querySelector('[data-quick-directions]');
  if (heroDir && pillDir) pillDir.setAttribute('href', heroDir.getAttribute('href') || '#');
```

- [ ] **Step 6: Add `quickNav` aria label copy to `js/content.js`**

The `data-t-arialabel` attribute is not handled by the current `applyLanguage`. Rather than extend i18n, keep the static English `aria-label="Quick access"` already in the markup and **remove** the `data-t-arialabel` attribute from the `<nav>` to avoid a dangling reference. (No `content.js` change needed.) Update the markup from Step 5 to:

```html
    <nav class="quickbar reveal" aria-label="Quick access">
```

- [ ] **Step 7: Add pill styles to `css/styles.css`**

After the `.hero` block (after line 59), add:

```css
/* ---- quick-access pills ---- */
.quickbar{display:flex;gap:9px;padding:6px 16px 2px;flex-wrap:wrap}
.qpill{flex:1 1 0;min-width:96px;display:inline-flex;align-items:center;justify-content:center;gap:7px;
  border:1px solid var(--line);background:var(--card);color:var(--ink);font-family:var(--sans);font-size:12.5px;font-weight:700;
  padding:10px 12px;border-radius:999px;cursor:pointer;text-decoration:none;transition:transform .18s var(--ease),background .18s,border-color .18s}
.qpill svg{width:15px;height:15px;stroke:var(--accent);fill:none;stroke-width:1.8}
.qpill:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--accent) 40%,var(--line))}
.qpill:active{transform:translateY(0)}
```

- [ ] **Step 8: Wire `initQuickAccess` into `js/i18n.js`**

Add to imports:

```javascript
import { initQuickAccess } from './quickaccess.js';
```

and inside `initI18n()` after `initTimeOfDay();`:

```javascript
  initQuickAccess();
```

- [ ] **Step 9: Verify in the browser**

Reload. Expected: three pills under the hero. Tapping "Door code" scrolls to the arrival card and focuses the unlock input (while locked); "Wi-Fi" scrolls to the Wi-Fi card; "Directions" has the same href as the hero Get directions link.

- [ ] **Step 10: Commit**

```bash
git add js/quickaccess.js tests/quickaccess.test.mjs index.html css/styles.css js/i18n.js
git commit -m "feat: quick-access pills for door code, wifi, and directions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Interactive checkout checklist

**Files:**
- Create: `js/checkout.js`
- Test: `tests/checkout.test.mjs`
- Modify: `index.html` (replace `.steps` line in arrival card), `css/styles.css` (checklist styles), `js/content.js` (item + title + done copy), `js/i18n.js` (wire)

**Interfaces:**
- Produces:
  - `loadState(storage) -> { [id: string]: boolean }`
  - `toggleState(state, id) -> newState` (pure, returns a new object)
  - `isComplete(state, ids) -> boolean`
  - `initCheckout()` — renders checkboxes, persists to `localStorage['sw-checkout']`, shows done state

- [ ] **Step 1: Write the failing test**

Create `tests/checkout.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleState, isComplete, loadState } from '../js/checkout.js';

test('toggle sets an unset id to true', () => {
  assert.deepEqual(toggleState({}, 'bins'), { bins: true });
});
test('toggle flips a set id to false', () => {
  assert.deepEqual(toggleState({ bins: true }, 'bins'), { bins: false });
});
test('toggle does not mutate input', () => {
  const s = { bins: true };
  toggleState(s, 'bins');
  assert.deepEqual(s, { bins: true });
});
test('isComplete true only when all ids true', () => {
  assert.equal(isComplete({ a: true, b: true }, ['a','b']), true);
  assert.equal(isComplete({ a: true, b: false }, ['a','b']), false);
  assert.equal(isComplete({ a: true }, ['a','b']), false);
});
test('loadState reads and parses JSON from storage', () => {
  const store = { getItem: () => JSON.stringify({ a: true }) };
  assert.deepEqual(loadState(store), { a: true });
});
test('loadState returns empty object on missing or bad data', () => {
  assert.deepEqual(loadState({ getItem: () => null }), {});
  assert.deepEqual(loadState({ getItem: () => 'not json' }), {});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/checkout.test.mjs`
Expected: FAIL — `Cannot find module '../js/checkout.js'`.

- [ ] **Step 3: Write the module**

Create `js/checkout.js`:

```javascript
import { T } from './content.js';

const KEY = 'sw-checkout';
const ITEMS = ['bins','dishwasher','keys']; // ids map to coItem1/2/3 copy
const COPY = { bins:'coItem1', dishwasher:'coItem2', keys:'coItem3' };

export function loadState(storage){
  try { return JSON.parse(storage.getItem(KEY)) || {}; }
  catch { return {}; }
}
export function toggleState(state, id){
  return { ...state, [id]: !state[id] };
}
export function isComplete(state, ids){
  return ids.every(id => state[id] === true);
}

export function initCheckout(){
  const mount = document.getElementById('checkout');
  if (!mount) return;
  const lang = () => document.documentElement.lang || 'en';
  let state = loadState(localStorage);

  function render(){
    const t = k => (T[k] && T[k][lang()]) || '';
    mount.innerHTML =
      ITEMS.map(id => `
        <button class="coitem${state[id] ? ' done' : ''}" data-co="${id}" role="checkbox" aria-checked="${!!state[id]}">
          <span class="cobox"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-11"/></svg></span>
          <span class="colabel" data-t="${COPY[id]}">${t(COPY[id])}</span>
        </button>`).join('') +
      `<div class="codone${isComplete(state, ITEMS) ? ' show' : ''}" data-t="coDone">${t('coDone')}</div>`;
    mount.querySelectorAll('.coitem').forEach(btn => {
      btn.addEventListener('click', () => {
        state = toggleState(state, btn.dataset.co);
        localStorage.setItem(KEY, JSON.stringify(state));
        render();
      });
    });
  }
  render();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/checkout.test.mjs`
Expected: PASS (6 tests).

- [ ] **Step 5: Add copy to `js/content.js`**

Add near the `departSteps` key (line 12):

```javascript
  coTitle:{it:"Prima di partire",en:"Before you go",es:"Antes de salir",fr:"Avant de partir",de:"Vor der Abreise"},
  coItem1:{it:"Rifiuti fuori",en:"Bins out",es:"Basura fuera",fr:"Poubelles sorties",de:"Müll raus"},
  coItem2:{it:"Lavastoviglie avviata",en:"Dishwasher on",es:"Lavavajillas puesto",fr:"Lave-vaisselle lancé",de:"Spülmaschine an"},
  coItem3:{it:"Chiavi nella cassetta",en:"Keys in the lockbox",es:"Llaves en la caja",fr:"Clés dans la boîte",de:"Schlüssel in die Box"},
  coDone:{it:"Tutto pronto, buon viaggio!",en:"All set, safe travels!",es:"¡Todo listo, buen viaje!",fr:"Tout est prêt, bon voyage !",de:"Alles erledigt, gute Reise!"},
```

- [ ] **Step 6: Replace the static steps line in `index.html`**

In the arrival card, replace the `.steps` div (line 71):

```html
        <div class="steps"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-11"/></svg><span data-t="departSteps">Before you go: bins out, dishwasher on, keys back in the lockbox.</span></div>
```

with:

```html
        <div class="cotitle" data-t="coTitle">Before you go</div>
        <div class="colist" id="checkout"></div>
```

- [ ] **Step 7: Add checklist styles to `css/styles.css`**

After the `.steps` block (after line 81), add:

```css
/* ---- interactive checkout checklist ---- */
.cotitle{margin:14px 0 8px;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.colist{display:flex;flex-direction:column;gap:8px}
.coitem{display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;
  border:1px solid var(--line);background:color-mix(in srgb,var(--g) 5%,var(--card));border-radius:12px;padding:11px 13px;
  font-family:var(--sans);font-size:14px;color:var(--ink);transition:background .18s,border-color .18s}
.cobox{width:22px;height:22px;flex:none;border-radius:7px;border:1.5px solid color-mix(in srgb,var(--muted) 55%,var(--card));
  display:grid;place-items:center;transition:.18s}
.cobox svg{width:14px;height:14px;stroke:#fff;fill:none;stroke-width:2.4;opacity:0;transition:opacity .18s}
.coitem.done{border-color:color-mix(in srgb,var(--g) 45%,var(--line));background:color-mix(in srgb,var(--g) 12%,var(--card))}
.coitem.done .cobox{background:var(--g);border-color:var(--g)}
.coitem.done .cobox svg{opacity:1}
.coitem.done .colabel{color:var(--muted);text-decoration:line-through}
.codone{max-height:0;overflow:hidden;opacity:0;font-family:var(--serif);font-size:15px;font-style:italic;color:var(--g);
  transition:max-height .3s var(--ease),opacity .3s var(--ease),margin .3s var(--ease);margin:0}
.codone.show{max-height:60px;opacity:1;margin-top:6px}
```

- [ ] **Step 8: Wire `initCheckout` into `js/i18n.js`**

Add to imports:

```javascript
import { initCheckout } from './checkout.js';
```

and inside `initI18n()` after `initQuickAccess();`:

```javascript
  initCheckout();
```

- [ ] **Step 9: Verify in the browser**

Reload. In the Arrival card, expected: three tappable rows under "Before you go". Tapping ticks the box, strikes the label, and persists across reload. Ticking all three reveals "All set, safe travels!". Switch language: item labels and the done line translate.

- [ ] **Step 10: Commit**

```bash
git add js/checkout.js tests/checkout.test.mjs index.html css/styles.css js/content.js js/i18n.js
git commit -m "feat: interactive checkout checklist with saved state

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Today's pick

**Files:**
- Create: `js/picks.js`
- Test: `tests/picks.test.mjs`
- Modify: `index.html` (pick card after the welcome note), `css/styles.css` (pick styles), `js/content.js` (pick title/lead copy), `js/i18n.js` (wire)

**Interfaces:**
- Produces:
  - `daysSinceEpoch(date: Date) -> number`
  - `pickForDate(date: Date, pool: Array) -> poolItem`
  - `PICKS: Array<{ name: string, desc: string }>` (each references existing `T` keys)
  - `initPicks()` — renders today's pick into `#todayspick`

- [ ] **Step 1: Write the failing test**

Create `tests/picks.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickForDate, daysSinceEpoch, PICKS } from '../js/picks.js';

const pool = ['a','b','c'];

test('same date gives same pick', () => {
  const d = new Date('2026-07-06T09:00:00Z');
  assert.equal(pickForDate(d, pool), pickForDate(new Date('2026-07-06T21:00:00Z'), pool));
});
test('consecutive days advance by one', () => {
  const d1 = new Date('2026-07-06T09:00:00Z');
  const d2 = new Date('2026-07-07T09:00:00Z');
  assert.equal(daysSinceEpoch(d2) - daysSinceEpoch(d1), 1);
});
test('pick is always in the pool', () => {
  for (let i = 0; i < 10; i++){
    const d = new Date(2026, 0, 1 + i);
    assert.ok(pool.includes(pickForDate(d, pool)));
  }
});
test('PICKS entries reference name and desc keys', () => {
  assert.ok(PICKS.length > 1);
  for (const p of PICKS){ assert.equal(typeof p.name, 'string'); assert.equal(typeof p.desc, 'string'); }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/picks.test.mjs`
Expected: FAIL — `Cannot find module '../js/picks.js'`.

- [ ] **Step 3: Write the module**

Create `js/picks.js`:

```javascript
import { T } from './content.js';

// Each pick references existing localized item keys already in content.js.
export const PICKS = [
  { name:'actHike',    desc:'actHikeD' },
  { name:'actWine',    desc:'actWineD' },
  { name:'actTerme',   desc:'actTermeD' },
  { name:'actBernina', desc:'actBerninaD' },
  { name:'actClimb',   desc:'actClimbD' },
  { name:'actSki',     desc:'actSkiD' },
];

export function daysSinceEpoch(date){
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
}
export function pickForDate(date, pool){
  return pool[daysSinceEpoch(date) % pool.length];
}

export function initPicks(){
  const nameEl = document.querySelector('#todayspick [data-pick-name]');
  const descEl = document.querySelector('#todayspick [data-pick-desc]');
  if (!nameEl || !descEl) return;
  const pick = pickForDate(new Date(), PICKS);
  const lang = document.documentElement.lang || 'en';
  // set data-t so future language switches re-translate automatically
  nameEl.setAttribute('data-t', pick.name);
  descEl.setAttribute('data-t', pick.desc);
  if (T[pick.name] && T[pick.name][lang]) nameEl.textContent = T[pick.name][lang];
  if (T[pick.desc] && T[pick.desc][lang]) descEl.textContent = T[pick.desc][lang];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/picks.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Add pick chrome copy to `js/content.js`**

Add near the top of `T`:

```javascript
  tpTitle:{it:"La scelta di oggi",en:"Today's pick",es:"La elección de hoy",fr:"Le choix du jour",de:"Heutiger Tipp"},
  tpLead:{it:"Oggi faremmo così.",en:"Here's what we'd do today.",es:"Esto es lo que haríamos hoy.",fr:"Voici ce qu'on ferait aujourd'hui.",de:"Das würden wir heute machen."},
```

- [ ] **Step 6: Add the pick card to `index.html`**

Directly after the `.note` block (after line 61), add:

```html
      <article class="card pickcard reveal">
        <div class="chead">
          <span class="cicon" style="--tint:var(--gold)"><svg viewBox="0 0 24 24"><path d="M12 2 15 9l7 .5-5.5 4.5 1.8 6.9L12 17l-6.3 3.9 1.8-6.9L2 9.5 9 9Z"/></svg></span>
          <span class="ctitle" data-t="tpTitle">Today's pick</span>
        </div>
        <p class="ptext" data-t="tpLead">Here's what we'd do today.</p>
        <div id="todayspick" class="pickbody">
          <div class="pickname" data-pick-name></div>
          <div class="pickdesc" data-pick-desc></div>
        </div>
      </article>
```

- [ ] **Step 7: Add pick styles to `css/styles.css`**

After the `.chips`/`.chip` block (after line 84), add:

```css
/* ---- today's pick ---- */
.pickcard{background:linear-gradient(180deg,color-mix(in srgb,var(--gold) 10%,var(--card)),var(--card));
  border-color:color-mix(in srgb,var(--gold) 30%,var(--line))}
.pickbody{margin-top:12px}
.pickname{font-family:var(--serif);font-weight:600;font-size:18px;line-height:1.2;color:var(--ink)}
.pickdesc{font-size:13.5px;color:var(--muted);line-height:1.5;margin-top:5px}
```

- [ ] **Step 8: Wire `initPicks` into `js/i18n.js`**

Add to imports:

```javascript
import { initPicks } from './picks.js';
```

and inside `initI18n()` after `initCheckout();`:

```javascript
  initPicks();
```

- [ ] **Step 9: Verify in the browser**

Reload. Expected: a "Today's pick" card below the welcome note showing one activity name + description. Switching language translates it. (Optional check: run `import('/js/picks.js').then(m => console.log(m.pickForDate(new Date(Date.now()+86400000), m.PICKS)))` in console to confirm tomorrow differs.)

- [ ] **Step 10: Commit**

```bash
git add js/picks.js tests/picks.test.mjs index.html css/styles.css js/content.js js/i18n.js
git commit -m "feat: daily rotating today's pick

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Curated guestbook

**Files:**
- Create: `js/guestbook.js`, `data/guestbook.json`
- Test: `tests/guestbook.test.mjs`
- Modify: `index.html` (guestbook card), `css/styles.css` (guestbook styles), `js/content.js` (title/empty/CTA/message copy), `js/i18n.js` (wire)

**Interfaces:**
- Produces:
  - `escapeHtml(s: string) -> string`
  - `guestbookHtml(entries: Array<{name,note,date}>, emptyText: string) -> string`
  - `initGuestbook()` — fetches `data/guestbook.json`, renders wall, wires WhatsApp CTA

- [ ] **Step 1: Write the failing test**

Create `tests/guestbook.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, guestbookHtml } from '../js/guestbook.js';

test('escapeHtml neutralizes angle brackets and ampersands', () => {
  assert.equal(escapeHtml('<b>&"x"</b>'), '&lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;');
});
test('empty entries render the empty state', () => {
  const html = guestbookHtml([], 'Be the first');
  assert.match(html, /Be the first/);
  assert.doesNotMatch(html, /gbnote/);
});
test('entries render one note each with escaped text', () => {
  const html = guestbookHtml([
    { name:'Ana', note:'Lovely <3', date:'2026-06' },
    { name:'Bo', note:'Great', date:'2026-05' },
  ], 'empty');
  assert.equal((html.match(/gbnote/g) || []).length, 2);
  assert.match(html, /Lovely &lt;3/);
  assert.match(html, /Ana/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/guestbook.test.mjs`
Expected: FAIL — `Cannot find module '../js/guestbook.js'`.

- [ ] **Step 3: Write the module**

Create `js/guestbook.js`:

```javascript
import { T } from './content.js';

export function escapeHtml(s){
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function guestbookHtml(entries, emptyText){
  if (!Array.isArray(entries) || entries.length === 0){
    return `<div class="gbempty">${escapeHtml(emptyText)}</div>`;
  }
  return entries.map(e => `
    <figure class="gbnote">
      <blockquote>${escapeHtml(e.note || '')}</blockquote>
      <figcaption><span class="gbname">${escapeHtml(e.name || '')}</span>${e.date ? `<span class="gbdate">${escapeHtml(e.date)}</span>` : ''}</figcaption>
    </figure>`).join('');
}

export function initGuestbook(){
  const wall = document.getElementById('guestbook');
  const lang = () => document.documentElement.lang || 'en';
  if (wall){
    const emptyText = () => (T.gbEmpty && T.gbEmpty[lang()]) || '';
    fetch('data/guestbook.json')
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then(entries => { wall.innerHTML = guestbookHtml(entries, emptyText()); });
  }
  const cta = document.querySelector('[data-gb-cta]');
  const host = document.querySelector('[data-host-wa]');
  if (cta){
    const num = (host && host.getAttribute('data-host-wa')) || '';
    const msg = encodeURIComponent((T.gbWaMsg && T.gbWaMsg[lang()]) || '');
    cta.setAttribute('href', num ? `https://wa.me/${num}?text=${msg}` : '#');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/guestbook.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Create `data/guestbook.json`**

```json
[
  { "name": "Marta e Luca", "note": "Un soggiorno perfetto, torneremo di sicuro.", "date": "2026-05" },
  { "name": "The Bennett family", "note": "We woke up to the mountains every morning. Pure magic.", "date": "2026-06" },
  { "name": "Sophie", "note": "So cozy and thoughtfully prepared. Grazie mille!", "date": "2026-06" }
]
```

- [ ] **Step 6: Add copy to `js/content.js`**

```javascript
  gbTitle:{it:"Diario degli ospiti",en:"Guestbook",es:"Libro de visitas",fr:"Livre d'or",de:"Gästebuch"},
  gbText:{it:"Qualche pensiero di chi è stato qui prima di voi.",en:"A few words from guests who came before you.",es:"Unas palabras de quienes estuvieron antes que vosotros.",fr:"Quelques mots de voyageurs passés avant vous.",de:"Ein paar Worte von Gästen vor Ihnen."},
  gbEmpty:{it:"Sarete i primi a lasciare un pensiero.",en:"Be the first to leave a note.",es:"Sé el primero en dejar una nota.",fr:"Soyez les premiers à laisser un mot.",de:"Hinterlassen Sie den ersten Gruß."},
  gbLeave:{it:"Lascia un pensiero",en:"Leave us a note",es:"Déjanos una nota",fr:"Laissez-nous un mot",de:"Hinterlassen Sie einen Gruß"},
  gbWaMsg:{it:"Ciao! Vorremmo lasciare un pensiero sul nostro soggiorno: ",en:"Hi! We'd love to leave a note about our stay: ",es:"¡Hola! Nos gustaría dejar una nota sobre nuestra estancia: ",fr:"Bonjour ! Nous aimerions laisser un mot sur notre séjour : ",de:"Hallo! Wir möchten einen Gruß zu unserem Aufenthalt hinterlassen: "},
```

- [ ] **Step 7: Add the guestbook card to `index.html`**

Add before the host card (before line 247, the `<article class="card reveal">` with `.hostrow`):

```html
      <article class="card reveal">
        <div class="chead">
          <span class="cicon" style="--tint:var(--gold)"><svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-3 2Z"/><path d="M8 7h7M8 11h7"/></svg></span>
          <span class="ctitle" data-t="gbTitle">Guestbook</span>
        </div>
        <p class="ptext" data-t="gbText">A few words from guests who came before you.</p>
        <div id="guestbook" class="gbwall"></div>
        <a class="btn green" data-gb-cta href="#"><svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-3 2Z"/></svg><span data-t="gbLeave">Leave us a note</span></a>
      </article>
```

The CTA reads the host WhatsApp number from a `data-host-wa` attribute. On the existing WhatsApp host button (line 257), add `data-host-wa=""` (the host fills in their international number here, matching the README placeholder step):

```html
          <a class="btn green" href="#" data-host-wa=""><svg viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.7 1.7c.1.1.1.3 0 .5l-.3.5-.3.3c-.1.1-.3.3-.1.6.1.3.7 1.1 1.4 1.7.9.8 1.7 1.1 2 1.2.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.6.8c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg><span data-t="waHost">WhatsApp</span></a>
```

- [ ] **Step 8: Add guestbook styles to `css/styles.css`**

After the `.foot` rule (after line 166), add:

```css
/* ---- guestbook ---- */
.gbwall{display:flex;flex-direction:column;gap:11px;margin:13px 0 4px}
.gbnote{margin:0;padding:13px 15px;border-radius:14px;border:1px solid var(--line);
  background:color-mix(in srgb,var(--gold) 6%,var(--card))}
.gbnote blockquote{margin:0;font-family:var(--serif);font-style:italic;font-size:14.5px;line-height:1.5;color:var(--ink)}
.gbnote figcaption{margin-top:8px;display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.gbname{font-size:12.5px;font-weight:700;color:var(--muted)}
.gbdate{font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}
.gbempty{padding:16px;text-align:center;font-family:var(--serif);font-style:italic;color:var(--muted);
  border:1.5px dashed color-mix(in srgb,var(--muted) 45%,var(--card));border-radius:14px;margin:13px 0 4px}
```

- [ ] **Step 9: Wire `initGuestbook` into `js/i18n.js`**

Add to imports:

```javascript
import { initGuestbook } from './guestbook.js';
```

and inside `initI18n()` after `initPicks();`:

```javascript
  initGuestbook();
```

- [ ] **Step 10: Verify in the browser**

Reload (served over HTTP, since `fetch` needs it). Expected: a Guestbook card with three sample notes; text is escaped safely; "Leave us a note" is present (href is `#` until a host number is set in `data-host-wa`). Temporarily empty `data/guestbook.json` to `[]` and reload to confirm the graceful empty state, then restore the sample notes.

- [ ] **Step 11: Commit**

```bash
git add js/guestbook.js tests/guestbook.test.mjs data/guestbook.json index.html css/styles.css js/content.js js/i18n.js
git commit -m "feat: curated guestbook wall with WhatsApp note CTA

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Warm send-off

**Files:**
- Modify: `index.html` (send-off block before footer), `css/styles.css` (send-off styles), `js/content.js` (send-off copy), `js/i18n.js` or a tiny wiring in an existing module for the season nudge

**Interfaces:**
- Consumes: `applySeason` and `seasonForMonth` from `js/seasons.js`; the Things-to-do card id.

- [ ] **Step 1: Add send-off copy to `js/content.js`**

```javascript
  soTitle:{it:"A presto",en:"Come back soon",es:"Vuelve pronto",fr:"À bientôt",de:"Bis bald"},
  soText:{it:"Grazie per essere stati con noi. Ci piacerebbe rivedervi in un'altra stagione.",en:"Thank you for staying with us. We'd love to see you back in another season.",es:"Gracias por quedaros con nosotros. Nos encantaría veros en otra estación.",fr:"Merci d'avoir séjourné chez nous. Au plaisir de vous revoir à une autre saison.",de:"Danke für Ihren Aufenthalt. Wir würden uns freuen, Sie in einer anderen Jahreszeit wiederzusehen."},
  soCta:{it:"Scopri l'altra stagione",en:"See the other season",es:"Ver la otra estación",fr:"Voir l'autre saison",de:"Andere Jahreszeit ansehen"},
```

- [ ] **Step 2: Give the Things-to-do card an id**

In `index.html`, on the Things-to-do card (line 210, the `<article class="card reveal">` that contains `ttTitle`), add `id="card-things"`:

```html
      <article class="card reveal" id="card-things">
```

- [ ] **Step 3: Add the send-off block to `index.html`**

Immediately before `<div class="foot">` (line 271), add:

```html
      <div class="sendoff reveal">
        <div class="sotitle" data-t="soTitle">Come back soon</div>
        <p class="sotext" data-t="soText">Thank you for staying with us. We'd love to see you back in another season.</p>
        <button class="btn green" id="seasonNudge"><svg viewBox="0 0 24 24"><path d="M12 2v20M4 7l16 10M20 7 4 17"/></svg><span data-t="soCta">See the other season</span></button>
      </div>
```

- [ ] **Step 4: Add send-off styles to `css/styles.css`**

After the guestbook styles (from Task 6), add:

```css
/* ---- warm send-off ---- */
.sendoff{text-align:center;padding:22px 18px;border-radius:20px;
  background:linear-gradient(180deg,color-mix(in srgb,var(--g) 10%,var(--card)),var(--card));border:1px solid var(--line)}
.sotitle{font-family:var(--serif);font-weight:600;font-size:22px;color:var(--ink)}
.sotext{font-size:14px;line-height:1.55;color:var(--muted);margin:8px 0 0}
.sendoff .btn{max-width:280px;margin-left:auto;margin-right:auto}
```

- [ ] **Step 5: Wire the season nudge**

In `js/i18n.js`, add to imports (alongside the existing `initSeasons` import on line 2):

```javascript
import { applySeason, seasonForMonth } from './seasons.js';
```

and inside `initI18n()` after `initGuestbook();`, add:

```javascript
  const nudge = document.getElementById('seasonNudge');
  if (nudge) nudge.addEventListener('click', () => {
    const pressed = document.querySelector('.szbtn[aria-pressed="true"]');
    const current = pressed ? pressed.dataset.season : seasonForMonth(new Date().getMonth() + 1);
    applySeason(current === 'winter' ? 'summer' : 'winter');
    document.getElementById('card-things')?.scrollIntoView({ behavior:'smooth', block:'start' });
  });
```

Note: `applySeason` and `seasonForMonth` are already exported from `js/seasons.js` (verified). No changes to `seasons.js` needed.

- [ ] **Step 6: Verify in the browser**

Reload. Expected: a warm send-off block before the footer. Tapping "See the other season" flips the Winter/Summer toggle in Things-to-do and scrolls up to it; the activity list updates accordingly. Copy translates on language switch.

- [ ] **Step 7: Commit**

```bash
git add index.html css/styles.css js/content.js js/i18n.js
git commit -m "feat: warm send-off with come-back-another-season nudge

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Snappier scroll reveals

**Files:**
- Modify: `js/i18n.js` (reveal observer), `css/styles.css` (`--dur`)

**Interfaces:** none (behavioural polish).

- [ ] **Step 1: Speed up the reveal transition**

In `css/styles.css`, in `:root` (line 14), change `--dur:.7s;` to:

```css
  --ease:cubic-bezier(.2,.7,.2,1); --dur:.45s; --rise:16px;
```

- [ ] **Step 2: Remove the cumulative stagger and reveal earlier**

In `js/i18n.js`, replace the reveal block (lines 41-44):

```javascript
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:.12 });
  document.querySelectorAll('.reveal').forEach((el,i) => { el.style.transitionDelay=(i*55)+'ms'; io.observe(el); });
```

with:

```javascript
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:0, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
```

- [ ] **Step 3: Verify in the browser**

Reload and scroll. Expected: cards fade/rise in promptly as they approach the viewport, with no sluggish escalating delay deeper down the page. With OS "reduce motion" on, everything is visible immediately (unchanged by the existing reduced-motion rule).

- [ ] **Step 4: Commit**

```bash
git add js/i18n.js css/styles.css
git commit -m "perf: snappier scroll reveals without cumulative delay

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Responsive across mobile / tablet / desktop

**Files:**
- Modify: `css/styles.css` (refine the existing `@media (min-width:900px)` block; add a tablet breakpoint; make the hero side-by-side; place new sections in the grid)

**Interfaces:** none (layout only). Builds on the existing desktop grid at lines 197-203.

- [ ] **Step 1: Replace the existing desktop block with refined breakpoints**

In `css/styles.css`, replace the whole `/* ---- desktop widening ---- */` block (lines 197-203):

```css
/* ---- desktop widening ---- */
@media (min-width:900px){
  .phone-flow{max-width:760px}
  .body{display:grid;grid-template-columns:1fr 1fr;align-items:start}
  .body>*{min-width:0}
  .hero,.privacy,.note,.band{grid-column:1 / -1}
}
```

with:

```css
/* ---- tablet ---- */
@media (min-width:640px) and (max-width:899px){
  .phone-flow{max-width:600px}
  .quickbar{padding-left:0;padding-right:0}
}

/* ---- desktop widening ---- */
@media (min-width:900px){
  .phone-flow{max-width:840px}
  .hero{display:grid;grid-template-columns:1.1fr 1fr;gap:24px;align-items:center}
  .heroText{padding-top:0}
  .body{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
  .body>*{min-width:0}
  /* full-width sections span both columns */
  .quickbar,.privacy,.note,.pickcard,.band,.sendoff,.foot{grid-column:1 / -1}
}
```

- [ ] **Step 2: Verify at three widths in the browser**

Reload `http://localhost:8080/` and use devtools responsive mode at ~390px, ~820px, and ~1280px.
Expected at each:
- **390px:** single column, comfortable tap targets, no horizontal scrollbar.
- **820px:** slightly wider centered column, quick-access pills spread nicely, no overflow.
- **1280px:** hero media and text sit side by side; cards form a tidy two-column grid; quick-access / welcome note / today's pick / guestbook / send-off span the full width; content stays centered with tasteful margins (not stretched edge to edge).
Also toggle `data-tod` to `night` at 1280px and confirm the palette holds across the grid.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: responsive hero and layout for tablet and desktop

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the new features**

Add a new section to `README.md` (after the "Seasonal activities" section, before "Deploying") covering:

- **Time of day and day/night styling:** the page reads Sondrio's local time (`Europe/Rome`) via `js/timeofday.js`, sets `data-tod="day|golden|night"` on `<html>`, and the palettes in `css/styles.css` restyle accordingly. It also shows a localized greeting and a live clock. No configuration needed.
- **Today's pick:** `js/picks.js` rotates through the `PICKS` pool deterministically by date. To change what can appear, edit the `PICKS` array (each entry references existing `T` keys in `js/content.js`).
- **Checkout checklist:** the departure steps are now a tappable checklist; ticked state is saved per device in `localStorage` under `sw-checkout`. Edit items via `coItem1..3` in `js/content.js` and the `ITEMS`/`COPY` maps in `js/checkout.js`.
- **Guestbook:** edit `data/guestbook.json` (an array of `{ "name", "note", "date" }`) to curate the notes shown. It is safe to commit (no secrets). The "Leave us a note" button uses the host WhatsApp number from the `data-host-wa` attribute on the host WhatsApp button in `index.html`.

Also add to the "Filling in placeholders before going live" checklist:

```markdown
- [ ] Host WhatsApp number in the `data-host-wa` attribute on the host WhatsApp button
      (powers the guestbook "Leave us a note" link), same international format as the
      WhatsApp `href` (digits only, no `+`).
- [ ] Curate `data/guestbook.json` with real guest notes (or leave `[]` for the graceful
      empty state).
```

- [ ] **Step 2: Verify**

Run: `node --test tests/*.mjs`
Expected: all tests pass (existing 12 + new: timeofday 13, quickaccess 4, checkout 6, picks 4, guestbook 3).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document time-of-day, picks, checkout, and guestbook

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification (after all tasks)

- [ ] Run `node --test tests/*.mjs` — all pass.
- [ ] Serve with `python3 -m http.server 8080` and walk the whole page at 390 / 820 / 1280 px, in at least two languages, confirming: greeting + clock, day/night palette (force via `data-tod`), quick-access pills, checkout checklist persistence, today's pick, guestbook + empty state, send-off season nudge, snappy reveals, no horizontal overflow.
- [ ] Grep for em dashes in new copy: `grep -n "—" js/content.js` returns nothing new.
- [ ] Merge/PR per the finishing-a-development-branch skill.

---

## Self-review notes

- **Spec coverage:** §1 time engine → Task 1; §2 palettes → Task 2; §3 quick-access → Task 3; §4 checkout → Task 4; §5 today's pick → Task 5; §6 guestbook → Task 6; §7 send-off → Task 7; §8 snappier reveals → Task 8; §9 responsive → Task 9; docs → Task 10. All sections covered.
- **Deviation from spec (intentional):** the spec listed four greeting keys including a night greeting; this plan uses three (`greetMorning/Afternoon/Evening`) because a literal night greeting ("good night" / "gute Nacht") reads as a goodbye. Evening copy covers the late hours. Palette phases remain three (day/golden/night) as specified.
- **Type consistency:** `applyTimeOfDay`, `pickForDate`, `toggleState`/`isComplete`/`loadState`, `guestbookHtml`/`escapeHtml`, `resolveTarget`/`QUICK_TARGETS` names are used identically in their tasks and tests. Each `init*()` is imported and called from `initI18n()` in order: timeOfDay, quickAccess, checkout, picks, guestbook, then the season-nudge wiring.
- **No external deps or hosts introduced.** Guestbook is a local JSON file; WhatsApp CTA is a `wa.me` link (a URL, not a fetch). Tests are DOM-free pure functions run by the Node built-in runner.
