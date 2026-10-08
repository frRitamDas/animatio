# Animatio 03 — MacBook Pro, frame by frame

A scroll-driven product film built the way Apple builds them: a **frame counter**,
a **keyframe table**, and geometry — not a video, not a sprite sheet, not a
canvas image sequence.

Scroll position → frame index → keyframe lookup → CSS custom properties →
real 3D geometry. 121 frames. No images anywhere.

```bash
python3 -m http.server 3000     # or any static server
```

---

## The machine

Modelled from the real 14-inch MacBook Pro at **18px = 1cm**:

| part | real | px |
|---|---|---|
| width | 31.26 cm | 562 |
| depth | 22.12 cm | 398 |
| base height | 1.10 cm | 20 |
| lid thickness | 0.45 cm | 8 |
| **closed height** | **1.55 cm** | **28** ✓ |

Built as a six-face base (deck, underside, four walls) plus a five-face lid
(anodised back, display, three machined edges) hinged on the back edge.
The lid swings **0° → 107°** — the real maximum.

Every surface is drawn: speaker grilles, a 78-key ANSI keyboard with backlit
legends, a 300 × 178 trackpad, the front foot notch, MagSafe / Thunderbolt /
HDMI / SD / headphone ports, the 46 × 11 notch with its camera, and a full
macOS interface that fades in as the camera pushes into the panel.

### Coordinate system

`.mb` is a 562 × 398 box laid flat with `rotateX(90deg)`, so inside it:

```
local +x  =  right
local +y  =  front of the machine (toward the user)
local +z  =  up (out of the deck)
```

The deck plane is `z = 0`, the underside is `z = -20px`, and the lid hinges on
the back edge (`y = -199px`). Two consequences worth knowing if you edit it:

- **The lid's front face is the aluminium back**, and the display lives on the
  backface via `rotateX(180deg)`. The browser shows the display once the lid
  tilts past the camera elevation — so the screen artwork is authored normally,
  the right way up.
- **The aluminium back is seen from behind**, so its inner wrapper is
  pre-rotated `rotate(180deg)` to keep the logo upright.

The aluminium-vs-display swap point is `θ = |elevation|`: below it you see the
closed lid, above it the panel. That is not a hack, it is the geometry.

---

## The engine

`js/frames.js` — `Track` / `Timeline`. A rig is a table of named curves:

```js
'--lid': {
  unit: 'deg', ease: 'inOut',
  keys: [[0, 0], [10, 0], [64, 107], [120, 107]]
}
```

`js/macbook.js` — `A.RIG`, the whole storyboard. Nine plotted curves
(lid, elevation, azimuth, scale, camera x/y/z, glow, power, interface,
backlight, shadow) sampled at a frame index and written to CSS variables.

`js/main.js` — scroll → progress → lerped frame → `render()`. Also the five
chapters below the hero.

### The camera curves were solved, not guessed

Every scale and camera offset in `A.RIG` was produced by re-implementing the
CSS 3D transform chain (perspective, `translate3d`, `rotateX/Y/Z`, `scale3d`)
in numpy and solving, per frame, for the largest machine that still clears the
nav bar and the copy block — then centring it. Verified clean at
1440×900, 1512×982, 1920×1080, 1680×1050, 1024×768 and 2560×1440.

Press <kbd>D</kbd> anywhere for a QA overlay: scrub lid / elevation / azimuth /
zoom by hand, snap to whole frames, reset.

---

## Chapters

1. **Hero** — 121 frames, closed → open → push into the panel → ¾ hero.
2. **Display** — an XDR bloom that scrubs with scroll, 1 → 1600 nits.
3. **Keyboard** — backlight sweeps key by key as you scroll.
4. **Silicon** — M4 / M4 Pro / M4 Max.
5. **Finish** — Space Black and Silver on a horizontal scroll.

---

## Notes

- `prefers-reduced-motion` disables the smoothing and the reveal animations.
- Reveal attributes are injected by JS, so content is never hidden if JS fails.
- No build step, no dependencies, no fonts, no network requests.
