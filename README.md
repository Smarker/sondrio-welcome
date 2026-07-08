# Sondrio Welcome

A digital welcome packet for guests staying at an Airbnb in Sondrio (Valtellina, Italy).
Static, no build step, no dependencies, multilingual (Italian, English, Spanish, French,
German). Designed to be opened from a QR code posted in the unit and to work well on a
guest's phone.

See `docs/superpowers/specs/` for the original design spec.

## Local preview

There is no build step and no `npm install`. Any static file server works. From the repo
root:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080/ in a browser. Opening `index.html` directly via
`file://` will not work for the language/season scripts and secrets fetch, which rely on
being served over HTTP.

## Editing the guest-facing copy

All guest-facing text lives in one place: the `T` object in `js/content.js`. Every key
holds all five languages together, for example:

```js
welcome: { it: "Benvenuti", en: "Welcome", es: "Bienvenidos", fr: "Bienvenue", de: "Willkommen" },
```

To change existing copy, edit the strings for each language under the relevant key. Keep
all five languages in sync when you change one.

To add a new piece of copy:

1. Add a new key to the `T` object in `js/content.js` with all five languages filled in.
2. Reference it in `index.html` with `data-t="yourKey"` on the element whose text content
   should be replaced, for example:

   ```html
   <span data-t="yourKey">Fallback English text</span>
   ```

   The fallback text inside the tag is only ever shown if JavaScript fails to load; the
   real content always comes from `T` via `js/i18n.js`, which walks every `[data-t]`
   element and swaps in the string for the active language.

**Style rule: no em dashes anywhere in guest copy.** Use commas, periods, or parentheses
instead.

## Adding media (photos, hero video, clips)

Real photos and video are dropped into the `media/` folder. Nothing there is required for
the site to look intentional; every image/video slot has a tasteful placeholder (SVG
scene, dashed frame, or labelled band) until a real file exists. Everything referenced
from `index.html` must be a local file inside `media/`, no external hosts or CDNs.

Full details are in `media/README.md`. Summary:

- **Hero video**: add `media/hero.mp4` (short, muted-friendly, loops cleanly) and
  `media/hero-poster.jpg` (a representative frame, shown while the video loads), then set
  the `src` on the `.herovideo` element in `index.html`:

  ```html
  <video class="herovideo" poster="media/hero-poster.jpg" muted loop playsinline autoplay preload="none" src="media/hero.mp4"></video>
  ```

  Until `src` is set, the empty video is hidden by CSS and the SVG fallback scene shows
  instead, so there is never a broken-media icon.

- **Room photos and other image slots**: each slot is a `.frame` or `.tframe` placeholder
  inside a `.slot`/`.trip` card. Replace the placeholder `<div class="frame">...</div>`
  with:

  ```html
  <img class="shot" src="media/bedroom.jpg" alt="Bedroom">
  ```

  `.shot` fills the frame's aspect ratio via `object-fit: cover`. Do the same for
  `.tframe` (day-trip cards) and any `.band` image bands.

- **Short clips**: the "Short clip" slot (`.frame.video`) works the same way; add the clip
  to `media/` and either link a poster image out to it or embed a local, muted, looping
  `<video class="shot">`.

## Setting private details (door code, Wi-Fi password)

The door code and Wi-Fi password are never committed to git in plaintext. They are
encrypted client-side into `data/secrets.enc.json`, the only artifact that gets committed,
and guests decrypt them in the browser after entering a passphrase you share separately.

To set or rotate the real values:

1. Copy the example file to a local, gitignored file (only needs to be done once):

   ```bash
   cp tools/secrets.local.example.json tools/secrets.local.json
   ```

   Edit `tools/secrets.local.json` with the real values:

   ```json
   { "doorCode": "1234", "wifiPassword": "correct-horse-battery" }
   ```

   `tools/secrets.local.json` is listed in `.gitignore` and will never be committed.
   `tools/secrets.local.example.json` (with dummy placeholder values) is the only one of
   the two that is tracked in git.

2. Generate the encrypted, committed artifact by running:

   ```bash
   node tools/encrypt.mjs "<passphrase>"
   ```

   This reads `tools/secrets.local.json`, encrypts it with the passphrase you pass on the
   command line, and (re)writes `data/secrets.enc.json`. That file contains only
   ciphertext (salt, IV, and encrypted bytes), nothing readable. It is safe, and required,
   to commit `data/secrets.enc.json`.

3. Share the passphrase with each guest privately, for example in the Airbnb message
   thread or a WhatsApp message, never printed next to the QR code or posted anywhere
   near the door. On the site, guests enter the passphrase once to unlock the door code
   and Wi-Fi password for their stay.

To rotate the passphrase or the underlying secrets (e.g. a new door code each season),
just edit `tools/secrets.local.json` and/or choose a new passphrase, then re-run step 2 and
commit the new `data/secrets.enc.json`. The real plaintext values never enter git history;
only the encrypted `data/secrets.enc.json` is ever committed.

## Filling in placeholders before going live

Before pointing a guest at this site, replace the following placeholders in `index.html`
(and set the real secrets as described above):

- [ ] Check-in and check-out dates in `data/stay.json` (see **Guest journey navigation**
      below).
- [ ] Door code and Wi-Fi password and network name (secrets flow above; network name
      `CasaSondrio` in `index.html` is a placeholder, edit the `.rval` text directly).
- [ ] The unlock passphrase itself, chosen when running `node tools/encrypt.mjs`.
- [ ] Host phone number as a `tel:` link (the "Call" button, currently `href="#"`), e.g.
      `href="tel:+390000000000"`.
- [ ] Host WhatsApp number as `https://wa.me/<international-number>` (the "WhatsApp"
      button, currently `href="#"`, international number with no `+`, spaces, or
      leading zeros, e.g. `https://wa.me/390000000000`).
- [ ] Google Maps URL for directions to the property itself (the "Get directions"
      quick-access pill under the hero, `data-quick-directions`, currently `href="#"`).
- [ ] Google Maps URL for each restaurant listed under "Where to eat" (each "Open map"
      link, currently `href="#"`).
- [ ] Google Maps URL for each day trip (Como, Tirano, Bormio, St. Moritz) and for the
      "Explore Valtellina" button.
- [ ] Exact walk/drive times currently shown as placeholders: train to Milan, grocery,
      main piazza, restaurants (all under "The neighbourhood"), and each restaurant/day
      trip's travel time.
- [ ] Distance/time to the nearest pharmacy (under "Emergency").
- [ ] Real photos and video per `media/README.md`: hero video + poster, bedroom/living
      room/kitchen photos, a short clip, the two wide "band" shots, and the three
      "Explore Valtellina" images (vineyards, trails, old town).
- [ ] Host WhatsApp number in the `data-host-wa` attribute on the host WhatsApp button
      (powers the guestbook "Leave us a note" link), same international format as the
      WhatsApp `href` (digits only, no `+`).
- [ ] Curate `data/guestbook.json` with real guest notes (or leave `[]` for the graceful
      empty state).

## Guest journey navigation

The site adapts to where a guest is in their trip using check-in and check-out
dates in `data/stay.json`:

```json
{
  "checkIn": "2026-07-15",
  "checkOut": "2026-07-20"
}
```

**Update these dates before each booking.** Dates use Sondrio local time
(`Europe/Rome`). The journey module (`js/journey.js`) picks a phase
automatically:

| Phase | When |
|-------|------|
| **Discover** | Before check-in day |
| **Getting here** | Check-in day |
| **Your stay** | Between check-in and checkout |
| **Checkout** | Checkout day |
| **After** | After checkout (guestbook focus, nav shows Discover) |

The active phase highlights relevant cards (via CSS reordering), updates the
hero subtitle, and shows the utility quick bar (Door / Wi-Fi / Directions) on
arrival and checkout days only. Guests can tap any phase pill to override; the
override is stored in `sessionStorage` under `sw-journey` and clears when the
date-based phase changes.

You can also deep-link a phase in Airbnb messages, for example
`https://your-site/?view=arrive` or `#stay`.

If `stay.json` is missing or invalid, the site defaults to the **Your stay**
phase so it remains usable between guests.

## Language behavior

The site auto-detects the guest's browser language (`navigator.language`) on first visit,
matches it against the five supported languages (it/en/es/fr/de), and falls back to
English for anything else. Once a guest picks a language manually using the language
buttons, that choice is remembered in `localStorage` under the key `sw-lang` and used on
future visits, overriding auto-detection. This logic lives in `js/i18n.js`.

## Seasonal activities

The "Things to do" section shows different activities depending on the season. The season
is chosen automatically from the current date (`js/seasons.js`: November through March is
winter, April through October is summer), and guests can override it with the
Winter/Summer toggle buttons. Activities tagged for the other season are hidden;
activities tagged "all" (year-round) always show.

## Time of day, checkout checklist, and guestbook

**Day/night styling.** The page reads Sondrio's local time (`Europe/Rome`, via
`js/timeofday.js`, independent of the guest's own device timezone), sets
`data-tod="day"`, `data-tod="golden"`, or `data-tod="night"` on `<html>`, and the
palettes in `css/styles.css` restyle accordingly (golden covers early morning and
early evening, night covers 21:00 to 06:00). The same script swaps in a localized
greeting (morning/afternoon/evening, from the `greetMorning`/`greetAfternoon`/
`greetEvening` keys in `js/content.js`) and shows a live clock, refreshed every
minute. No configuration needed.

**Checkout checklist.** The departure steps are a tappable checklist (bins out,
dishwasher on, keys in the lockbox). Ticked state is saved per device in
`localStorage` under the key `sw-checkout`, so it persists across a guest's stay on
the same phone but is not shared between devices. To change the wording, edit the
`coItem1`/`coItem2`/`coItem3` keys in `js/content.js`. To change which steps exist,
edit the `ITEMS` array and `COPY` map in `js/checkout.js` (they must stay in sync).

**Guestbook.** Past guests' notes are curated by hand in `data/guestbook.json`, an
array of objects with `name`, `note`, and `date` fields, for example:

```json
{ "name": "Sophie", "note": "So cozy and thoughtfully prepared. Grazie mille!", "date": "2026-06" }
```

This file is safe to commit (no secrets, just whatever notes you choose to include).
Leave it as `[]` for a graceful empty state (a "be the first to leave a note"
message) until you have real notes to add. The "Leave us a note" button builds a
WhatsApp link using the host's number from the `data-host-wa` attribute on the host
WhatsApp button in `index.html`, so that attribute must be set for the button to
work (see the placeholders checklist below).

## Deploying

This is a static site, so deployment is just GitHub Pages:

1. Push this repository to GitHub.
2. In the repo, go to **Settings -> Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, select the `main`
   branch and the `/ (root)` folder, then save.
4. GitHub Pages will build and publish the site at the resulting Pages URL
   (`https://<user>.github.io/<repo>/`).
5. Point the in-unit QR code at that Pages URL.

This site currently lives on the `build/welcome-site` branch; it needs to be merged into
`main` before the steps above will pick it up.
