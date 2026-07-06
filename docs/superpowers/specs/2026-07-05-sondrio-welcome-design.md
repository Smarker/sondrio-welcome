# Sondrio Stay — Guest Welcome Packet: Design Spec

**Date:** 2026-07-05
**Status:** Approved design, pending spec review
**Live prototype:** https://claude.ai/code/artifact/a2e82231-0e7f-49d9-a583-142729cddfca

## Purpose

A public, mobile-first web page that serves as the digital welcome packet for an Airbnb apartment in Sondrio (Valtellina, Italy). Guests reach it by scanning a QR code in the unit or via a pre-arrival link. It must feel modern and calming, work in five languages, and answer the questions guests actually ask, so the hosts field fewer messages.

Hosted on **GitHub Pages** from the `sondrio-welcome` repo. No build step, no backend, no external runtime dependencies.

## Success criteria

- A guest can, within seconds on a phone: get directions, find the door code and Wi-Fi (after unlocking), learn check-in/out, and reach the hosts.
- Reads cleanly in Italian, English, Spanish, French, German; auto-selects the guest's language.
- Loads instantly and works offline-ish (all assets self-hosted); no horizontal scroll from ~320px up to desktop.
- Door code and Wi-Fi password are **never** exposed in plain text on the public page.
- Looks intentional and place-specific, not templated.

## Technical approach

Chosen: **single-page, no-build static site** — `index.html` + CSS + vanilla JS, with all copy in one structured translations file. Rejected alternatives: a static-site generator (adds a build step and deps to maintain, overkill) and one-HTML-file-per-language (duplicates markup 5×).

### File structure

```
sondrio-welcome/
├── index.html            # semantic sections, data-t keys for i18n
├── css/styles.css        # Tricolore Rustico design system
├── js/
│   ├── content.js        # ALL guest copy, all 5 languages, one object
│   ├── i18n.js           # detect → localStorage → render; language switcher
│   ├── seasons.js        # date-based season detect + Winter/Summer toggle
│   └── unlock.js         # decrypt private details with guest passphrase
├── data/
│   └── secrets.enc.json  # AES-encrypted door code + Wi-Fi (ciphertext only)
├── media/                # host-provided photos + looped/short videos (+ poster stills)
├── .nojekyll             # serve as-is on GitHub Pages
└── README.md             # how to edit copy, add media, set the passphrase, deploy
```

### Content model

Every guest-visible string is keyed and holds all five languages together, so translating or editing is done in one place:

```js
doorCode: { it:"Codice porta", en:"Door code", es:"Código puerta", fr:"Code porte", de:"Türcode" }
```

Activities additionally carry a `season` tag (`winter` | `summer` | `all`). Day-trip and restaurant entries carry a `mapUrl`.

## Visual design — "Tricolore Rustico"

Warm, grounded Valtellina palette that threads the Italian tricolore (red · white · green) plus a warm gold as accents, never as a literal flag.

- **Palette:** cream `#F3ECDD` ground · warm stone ink `#2C2620` · brick red `#A2402F` (primary/urgent) · pine green `#3F5C43` (navigate/go) · warm gold `#C58A3A` (highlights) · sand card `#FAF4E8` · muted `#867A67`.
- **Color meaning is consistent:** red = host/urgent/copy actions; green = directions/maps/navigation; gold = eyebrows, hero sun, welcome accents.
- **Type:** serif display (system stack: Iowan Old Style / Palatino / Georgia) for headings and place names; system sans for body and UI. Self-hosted or system fonts only — no font CDN.
- **Cards** with soft 1px borders, generous radius, restrained shadows. No colored accent rails (reads as templated).
- **Buttons:** top-lit gradient, a soft color-matched glow shadow, gentle lift on press. No underlines on links.
- **Theme:** the welcome packet deliberately commits to its warm light palette (a calm, single visual world). The design tokens are structured so a dark variant could be added later if wanted.

## Sections (in order)

1. **Hero** — looped, muted, autoplaying **vibe video** (with a poster still that shows instantly and a static fallback; paused under `prefers-reduced-motion` / save-data). Property wordmark ("Sondrio Stay", placeholder), one-line welcome, location, and a prominent **Get directions** (Google Maps) button at the very top.
2. **Private details banner** — explains the code/Wi-Fi are guest-only, with an **Unlock** action (see Security).
3. **Welcome note** — short signed host note ("With love, Stephanie & Julian"). Clean card, no rail.
4. **Arrival & departure** — check-in from 15:00, **door code (locked)**, check-out by 12:00, and departure steps.
5. **Wi-Fi & house manual** — network, **password (locked)**, appliance how-tos (scannable steps).
6. **EV charger & amenities** — 22 kW charger right outside, next to the apartment; included: coffee, washer, dryer, fresh linens, heating.
7. **A peek inside** — photo gallery slots (bedroom, living room, kitchen) + a short-clip slot.
8. **The neighbourhood** — walking times: train to Milan ~7 min, grocery ~5, main piazza ~5, restaurants ~5.
9. **Where to eat** — Il Tabernario · Enoteca delle Alpi; Trattoria Olmo; Pizzeria Vesuvio — each with a one-line description and a map link.
10. **Things to do (seasonal)** — Winter/Summer toggle, auto-set by date. Winter: Ski Bormio & Santa Caterina. Summer: hike the valley trails, rock climbing & via ferrata, Valtellina wine tasting. Year-round: Bormio thermal baths (Bagni Vecchi & Bagni Nuovi), Bernina Express.
11. **Day trips** — visual cards (photo + one-line "what it is" + travel time): Lake Como ~1h15, Tirano (Bernina Express) ~30min, Bormio ~1h, St. Moritz ~2h. Car-rental footnote: Hertz and Avis in Sondrio (links to Hertz Sondrio).
12. **Your hosts — Stephanie & Julian** — portrait slot, Call + WhatsApp. Kept at the bottom (intentionally not a floating always-on button).
13. **Emergency** — plain copy: "112 reaches ambulance, fire and police from any phone." Nearest pharmacy distance.

## Internationalization

- Languages: IT, EN, ES, FR, DE.
- On first visit, detect from `navigator.language`; fall back to English if unmatched.
- Remember the guest's explicit choice in `localStorage`.
- Always-visible switcher (labels **IT · EN · ES · FR · DE**). Switching re-renders instantly with a short cross-fade, no reload.
- All copy hand-written per language (not machine auto-translate) for quality.

## Seasonal content

- Reuses the content-driven pattern: each activity tagged `winter` / `summer` / `all`.
- Season auto-detected from the current month (Nov–Mar → winter, else summer), with a manual Winter/Summer toggle.
- `all` items always show. Combines cleanly with language (a French guest in January sees skiing, in French).

## Security — private details

**Approach: passphrase-unlock with client-side encryption.**

- Door code and Wi-Fi password are **AES-encrypted at author time** and committed only as ciphertext (`data/secrets.enc.json`). The plaintext never enters the repo or the served page.
- The guest taps **Unlock** and enters a passphrase the host shares out-of-band (Airbnb message / WhatsApp). `unlock.js` derives a key (PBKDF2) and decrypts in the browser via the Web Crypto API; on success the real values replace the masked ones and the unlocked state is remembered for the session.
- Security is as strong as the passphrase; the host can rotate it (re-encrypt) per season or per guest. Everything else on the page stays open.
- A small author script (documented in the README) encrypts new secrets so the host can update codes without hand-editing ciphertext.

## Animations

Clean and restrained (the "calming" brief): scroll-reveal on cards (staggered fade + rise), gentle button press/lift, language cross-fade, hero video loop, a drifting-cloud ambient touch. All motion respects `prefers-reduced-motion`.

## Responsiveness

- Mobile-first; primary targets **iOS Safari and Android Chrome**. Big tap targets, tap-to-copy (codes/Wi-Fi), tap-to-call/WhatsApp, safe-area insets for notches.
- Tablet and desktop are first-class: content sits in a calm centered column (not stretched); cards may flow into two columns on wide screens.
- Fluid type and spacing via `clamp()`; no horizontal scroll from ~320px to desktop; horizontally-scrolling galleries scroll within their own container.
- Verified in the real browser before completion.

## Host-provided inputs (placeholders until supplied)

Door code, Wi-Fi network + password, unlock passphrase, exact walk/drive times, nearest pharmacy distance, host phone + WhatsApp number, Google Maps URLs (property + restaurants + day trips), and all photos/videos (with poster stills). All are isolated to be one-line edits.

## Out of scope (for now)

Booking/payments, a printed version, analytics, dark theme, and any per-guest personalization beyond the shared passphrase.

## Deployment

Push the static files to the `sondrio-welcome` GitHub repo; enable Pages on `main`. The README documents editing copy, adding media, encrypting secrets, and deploying. (Creating the GitHub remote / pushing is done only when the host asks.)
