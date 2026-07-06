# Media

This folder is where real photos/video get dropped in. Nothing here is required for the
site to look intentional — every slot has a tasteful placeholder (SVG scene, dashed frame,
or labelled band) until a real file exists. No external hosts/CDNs: everything referenced
from `index.html` must live in this folder as a local file.

## Hero video

1. Add `hero.mp4` (short, muted-friendly, loops cleanly) and `hero-poster.jpg` (a frame
   from the video, used while it loads) to this folder.
2. In `index.html`, set the `src` on the `.herovideo` element:

   ```html
   <video class="herovideo" poster="media/hero-poster.jpg" muted loop playsinline autoplay preload="none" src="media/hero.mp4"></video>
   ```

   Until `src` is set, `.herovideo:not([src]){display:none}` (see `css/styles.css`) hides
   the empty video element and the prototype SVG scene inside `.heromedia-fallback` shows
   instead — so there's never a broken-media icon.
3. Autoplay is skipped automatically for guests with `prefers-reduced-motion: reduce` or
   `navigator.connection.saveData` (see the guard in `js/i18n.js`); the poster/fallback
   stands in for them instead.

## Room photos

Each guest-photo slot in `index.html` is a `.frame`/`.tframe` placeholder (inside a
`.slot`/`.trip`) with an icon and a label like "Bedroom" or "add photo". When a real photo
is ready, replace the placeholder markup:

```html
<!-- before -->
<div class="frame">...icon svg...</div>

<!-- after -->
<img class="shot" src="media/bedroom.jpg" alt="Bedroom">
```

`.shot` (in `css/styles.css`) fills the frame's aspect ratio via `object-fit:cover` and
inherits the frame's rounded corners. Do the same for `.tframe` (day-trip cards) and any
`.band` image bands — swap the placeholder contents for `<img class="shot" ...>`.

## Short clips

The "Short clip" slot (`.frame.video`) works the same way as a room photo slot, except the
source file is a short muted video instead of a still. Add the clip (e.g. `clip.mp4`) to
this folder and either:

- Swap the placeholder for an `<img class="shot" src="media/clip-poster.jpg" ...>` that
  links out to the clip, or
- Use another local `<video class="shot" muted loop playsinline preload="none" poster="media/clip-poster.jpg" src="media/clip.mp4"></video>` in place of the frame.

Keep clips short, muted, and local — no third-party video embeds.
