# Sondrio Stay — Boutique Concierge Upgrade

**Date:** 2026-07-06
**Status:** Approved design, ready for implementation plan
**Builds on:** `2026-07-05-sondrio-welcome-design.md` (the original static welcome page)

## Goal

Turn the existing static welcome page into something guests want to reopen throughout
their stay *and* remember fondly afterward. Two outcomes matter equally:

1. **In-stay utility** — the reliable reference a guest reopens for the door code,
   Wi-Fi, checkout steps, and what to do today.
2. **Warmth and return** — an emotionally warm, boutique-feeling experience that nudges
   guests to come back (or refer friends).

Check-in and check-out should feel seamless. The tone is **subtle and elegant** (boutique
hotel app), not game-y.

## Hard constraints (carried from the original design)

These are non-negotiable and every feature below respects them:

- **Fully static.** No build step, no dependencies, no framework, no external hosts or
  CDNs. Everything is local files served over HTTP.
- **Phone-first**, opened from a QR code in the unit, but must also look intentional on
  tablet and desktop.
- **Multilingual.** All guest-facing copy lives in the `T` object in `js/content.js` with
  all five languages present (it/en/es/fr/de), referenced from markup via `data-t` (and
  `data-t-placeholder` for inputs). English fallback text stays inline in the HTML.
- **No em dashes in guest copy.** Use commas, periods, or parentheses.
- **Accessibility / performance.** Respect `prefers-reduced-motion` and
  `navigator.connection.saveData`. Maintain thumb-friendly tap targets and `aria` state
  already present.
- **Module pattern.** New behaviour follows the existing convention: a focused `js/*.js`
  module exporting pure, testable functions plus an `init*()` that wires the DOM, imported
  and called from `initI18n()` in `js/i18n.js`. Each module gets a `tests/*.test.mjs`
  mirroring the existing Node test-runner style (`node --test`).

## Features

### 1. Time-of-day engine — `js/timeofday.js`

The foundation for the greeting, live clock, and day/night palette.

- Reads **Sondrio's** local hour via
  `Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', hour12: false })`
  (and equivalent for minutes), so it is correct even when the guest's phone is still on
  their home timezone.
- Pure function `phaseForHour(h)` returns one of `day | golden | night`:
  - **night**: 21:00–05:59
  - **golden** (dawn and dusk): 06:00–07:59 and 18:00–20:59
  - **day**: 08:00–17:59
- Pure function `greetingKeyForHour(h)` returns a `T` key for the greeting:
  - `greetMorning` 05–11, `greetAfternoon` 12–17, `greetEvening` 18–21, `greetNight`
    22–04.
- `applyTimeOfDay(doc, now)` sets `data-tod="…"` on `<html>`, swaps in the greeting text,
  and renders the live Sondrio clock (HH:MM).
- `initTimeOfDay()` calls `applyTimeOfDay` on load and re-runs on a 60s interval so the
  clock, greeting, and palette drift naturally across an evening. The interval runs
  regardless of motion preference (updating text and a clock is not motion); only the
  palette cross-fade is suppressed under reduced-motion (see §2).
- With no JS, `<html>` has no `data-tod` and CSS falls back to the day palette.

**Tests (`tests/timeofday.test.mjs`):** boundary hours for `phaseForHour` (5/6/8/18/21 and
wraparound), `greetingKeyForHour` boundaries, and that `applyTimeOfDay` sets the right
`data-tod` and greeting for representative times (inject a fixed `now`).

### 2. Full time-of-day palette — `css/styles.css`

Three palettes expressed as overrides of the existing CSS custom properties, keyed off
`html[data-tod="…"]`:

- **day** — the current bright alpine palette (also the default when `data-tod` is absent).
- **golden** — warm amber sky, honeyed accents, slightly warmer background.
- **night** — deep dusk-blue background, softened (lower-contrast-but-still-AA) text,
  cooler accents.

Scope: the hero sky gradient (`--sky1/--sky2/--sun`), the page background tint, and accent
warmth shift per phase. The hero's sun becomes a pale moon at night via a CSS-toggled class
on the existing hero SVG (adjust `--sun` and radius/opacity; no new asset). The page
background transitions smoothly between phases; the transition is disabled inside a
`@media (prefers-reduced-motion: reduce)` block. All three palettes must keep text at least
WCAG AA contrast.

### 3. Quick-access pills — `index.html` + `initQuickAccess()`

A restrained, **non-sticky** row placed directly under the hero: **Door code · Wi-Fi ·
Directions**.

- Door code and Wi-Fi pills smooth-scroll to their card and, if the secrets are still
  locked, focus the unlock input.
- Directions opens the same maps link as the hero "Get directions" link (single source of
  truth for the URL).
- **Message host is deliberately not in this row.** Host contact stays in its existing host
  card lower down, unchanged.
- Copy localized via `data-t`. Pills are real `<button>`/`<a>` with accessible labels.

**Tests:** covered via the interactions module test (§4) or a light DOM test; at minimum
assert the pills exist and target the right anchors. Scroll behaviour itself is not unit
tested.

### 4. Interactive checkout checklist — replaces the static "before you go" line

The three departure steps (bins out, dishwasher on, keys in the lockbox) become tappable
checklist items.

- Module `js/checkout.js` (or a shared `js/interactions.js`) exporting pure state helpers
  and `initCheckout()`.
- State persisted in `localStorage` under `sw-checkout` as a map of item-id → boolean.
- Each item is a labelled control with a checkbox and an `aria-checked` state; tapping the
  row toggles it.
- When all items are checked, a warm completion state appears ("All set, safe travels")
  with a subtle celebratory touch (e.g. a checkmark flourish) that is disabled under
  reduced-motion.
- Items are localized; the host can add/remove items by editing markup + `T` keys.

**Tests (`tests/checkout.test.mjs`):** pure state functions — toggling an item, computing
"all complete", round-tripping through a fake storage object.

### 5. Today's pick — `js/picks.js` + a card

A warm "Today we'd…" card that changes daily so reopening feels alive.

- A `PICKS` pool defined in one place (in `js/content.js` alongside `T`, or in `picks.js`),
  each entry referencing an existing localized item (an activity, restaurant, or day trip)
  by its `T` key plus an optional localized "why today" line (also a `T` key).
- Pure function `pickForDate(date, pool)` selects deterministically:
  `daysSinceEpoch(date) % pool.length`. Stable within a calendar day, fresh the next day.
- `initPicks()` renders the selected pick into the card. Placed near the top of the body
  (after the welcome note) so it greets warmly.

**Tests (`tests/picks.test.mjs`):** determinism (same date → same pick), rotation (adjacent
days differ when pool length > 1), and index bounds.

### 6. Curated guestbook — `js/guestbook.js` + `data/guestbook.json`

A warm wall of past guests' notes, curated by the host. Stays fully static.

- `data/guestbook.json`: a committed array of `{ name, note, date }` objects that the host
  edits by hand. Safe to commit (no secrets). Fetched at runtime over HTTP like
  `data/secrets.enc.json`.
- `renderGuestbook(entries, doc)` builds a warm stack/wall of note cards. If the array is
  empty or the file is missing, a tasteful empty state shows ("Be the first to leave a
  note") — never a broken slot, matching the media-placeholder philosophy.
- Notes display as written (not translated); surrounding chrome (heading, empty state,
  button) is localized.
- A **"Leave us a note"** button opens WhatsApp pre-filled with a localized message,
  reusing the host WhatsApp number placeholder (`https://wa.me/<number>?text=…`). Single
  source of truth for the number shared with the host card.

**Tests (`tests/guestbook.test.mjs`):** `renderGuestbook` with several entries produces the
right number of note nodes with escaped text; empty/missing input produces the empty state.

### 7. Warm send-off — near the end of the page

A heartfelt closing block before the footer:

- A short thank-you note (localized).
- A gentle "come back in another season" nudge that flips the existing Winter/Summer season
  toggle and scrolls to "Things to do" (reuses `applySeason` from `js/seasons.js`; no new
  season logic).
- The guestbook "Leave us a note" CTA (shared with §6).

### 8. Snappier scroll reveals — `js/i18n.js`

Current behaviour sets `el.style.transitionDelay = (i * 55) + 'ms'` using each element's
**global** index, so cards deep in the page inherit a large cumulative delay and feel
sluggish. Fix:

- Remove the global cumulative delay. Use no stagger, or a small capped stagger applied
  only to elements entering the viewport together (e.g. `min(localIndex, 3) * 40ms`).
- Shorten the reveal transition duration.
- Trigger slightly before the element is fully in view using a negative-bottom `rootMargin`
  on the `IntersectionObserver` (and/or a lower threshold), so content is settling as the
  guest reaches it.
- Under `prefers-reduced-motion`, reveal everything immediately (no transform/opacity
  animation), as today.

### 9. Responsive across mobile / tablet / desktop — `css/styles.css`

Today the layout is a fixed narrow phone column (`.phone-flow`) that leaves dead space on
wider screens. Make it intentional at every width while staying single-column and
thumb-friendly on phones.

- **Mobile (default, < ~720px):** unchanged single-column flow, comfortable tap targets.
- **Tablet (~720–1024px):** container widens to a comfortable reading measure; grid
  sections that are lists of tiles flow to **2-up** — the "A peek inside" / "Explore
  Valtellina" galleries, day trips, guestbook notes, and quick-access pills spread to use
  the width.
- **Desktop (> ~1024px):** container caps at a tasteful max-width and stays centered
  (boutique feel, no ultra-wide stretch). The hero goes **side-by-side** (media beside
  text) instead of stacked. Multi-tile sections may go 2–3-up where it reads well.
- Use existing spacing tokens; verify no horizontal overflow and that the day/night
  palettes hold at all widths.

**Verification:** manually check the served page at mobile, tablet, and desktop widths
(e.g. ~390px, ~820px, ~1280px) and confirm layout, tap targets, and palettes all hold.

## Files touched

**New**
- `js/timeofday.js` — phase/greeting/clock + `data-tod`.
- `js/picks.js` — today's pick selection + render.
- `js/guestbook.js` — fetch/render guestbook + empty state + WhatsApp CTA.
- `js/checkout.js` (or a shared `js/interactions.js` also housing `initQuickAccess`) —
  checklist state + quick-access wiring, kept focused.
- `data/guestbook.json` — curated notes (committed, no secrets).
- `tests/timeofday.test.mjs`, `tests/picks.test.mjs`, `tests/guestbook.test.mjs`,
  `tests/checkout.test.mjs`.

**Edited**
- `index.html` — new sections (quick-access pills, today's pick, guestbook, send-off),
  checkout checklist markup, greeting/clock nodes, and their `data-t` keys.
- `css/styles.css` — three time-of-day palettes, new component styles, responsive
  breakpoints, faster reveal timing.
- `js/content.js` — all new copy in five languages.
- `js/i18n.js` — import and call the new `init*()`; snappier reveal logic.
- `README.md` — document editing `data/guestbook.json`, the today's-pick pool, day/night
  behaviour, and any new placeholders (host WhatsApp number is reused).

## Out of scope (YAGNI)

- Any server, database, or third-party form service (guestbook is curated + WhatsApp).
- Live weather or anything needing an external API.
- Pre-arrival countdown via URL params, offline "save this page" prompt (considered in
  approach C, cut to protect the subtle-elegant tone and the no-external rule).
- Scratch-to-reveal / quiz / badges (game-y, rejected in favour of subtle elegance).

## Success criteria

- A returning guest reaches the door code, Wi-Fi, or directions in one tap from the top.
- Checkout steps are tappable and their checked state survives a page reload.
- The greeting, clock, and palette reflect Sondrio's time of day and shift across day →
  golden → night.
- "Today's pick" differs across consecutive days and is stable within a day.
- The guestbook shows curated notes (or a graceful empty state) and "Leave us a note" opens
  a pre-filled WhatsApp message.
- Cards reveal promptly, with no sluggish cumulative delay.
- The page looks intentional and has no horizontal overflow at ~390px, ~820px, and ~1280px.
- All new copy is present in all five languages with no em dashes.
- `node --test` passes; existing tests still pass.
