/* ═══════════════════════════════════════════════════════════
   frames.js — the scroll-frame engine

   A scroll position becomes a FRAME INDEX; the frame index is
   looked up in a keyframe table; the result is written to CSS
   custom properties. Nothing is a video, nothing is a sprite
   sheet — the machine is real geometry, interpolated per frame.
   ═══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── easing ─────────────────────────────────────────────── */
  const EASE = {
    linear: t => t,
    smooth: t => t * t * (3 - 2 * t),
    smooth2: t => { const s = t * t * (3 - 2 * t); return s * s * (3 - 2 * s); },
    inOut:  t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out:    t => 1 - Math.pow(1 - t, 3),
    in:     t => t * t * t,
    out5:   t => 1 - Math.pow(1 - t, 5),
    expo:   t => (t <= 0 ? 0 : t >= 1 ? 1 : t < .5
              ? Math.pow(2, 20 * t - 10) / 2
              : (2 - Math.pow(2, -20 * t + 10)) / 2),
    back:   t => { const c = 1.70158 + 1; return 1 + c * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2); }
  };

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp  = (a, b, t) => a + (b - a) * t;

  /**
   * A single animated value.
   * keys: [ [frame, value, easeName?], ... ]
   * easeName eases the segment that STARTS at that key.
   */
  class Track {
    constructor(keys, defaultEase) {
      this.defaultEase = defaultEase || 'smooth';
      this.keys = keys
        .slice()
        .sort((a, b) => a[0] - b[0])
        .map(k => ({ f: k[0], v: k[1], e: k[2] || this.defaultEase }));
      this.min = this.keys[0].f;
      this.max = this.keys[this.keys.length - 1].f;
    }

    at(frame) {
      const k = this.keys;
      if (frame <= this.min) return k[0].v;
      if (frame >= this.max) return k[k.length - 1].v;

      for (let i = 0; i < k.length - 1; i++) {
        const a = k[i], b = k[i + 1];
        if (frame >= a.f && frame <= b.f) {
          const span = b.f - a.f;
          const t = span === 0 ? 1 : (frame - a.f) / span;
          const fn = EASE[a.e] || EASE[this.defaultEase] || EASE.linear;
          return lerp(a.v, b.v, fn(t));
        }
      }
      return k[k.length - 1].v;
    }
  }

  /**
   * A table of named tracks sampled at a frame index.
   *   rig = { '--lid': { keys: [...], unit: 'deg', ease: 'out' }, ... }
   */
  class Timeline {
    constructor(rig, totalFrames) {
      this.total = totalFrames;
      this.tracks = {};
      for (const name in rig) {
        const def = rig[name];
        this.tracks[name] = {
          track: new Track(def.keys, def.ease),
          unit: def.unit || '',
          fit: !!def.fit,
          fixed: def.fixed == null ? 3 : def.fixed
        };
      }
      this._cache = {};
    }

    /** @returns {Object} name → value (number) */
    sample(frame) {
      const out = {};
      for (const name in this.tracks) out[name] = this.tracks[name].track.at(frame);
      return out;
    }

    /** write sampled values onto an element as CSS custom properties */
    apply(el, frame, fit) {
      const f = clamp(frame, 0, this.total - 1);
      for (const name in this.tracks) {
        const t = this.tracks[name];
        let v = t.track.at(f) * (t.fit ? fit : 1);
        if (t.fixed >= 0) v = Math.round(v * 1e3) / 1e3;
        this._cache[name] = v;
        el.style.setProperty(name, v + t.unit);
      }
      return this._cache;
    }
  }

  global.Animatio = global.Animatio || {};
  global.Animatio.frames = { EASE, Track, Timeline, clamp, lerp };
})(window);
