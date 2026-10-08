/* ═══════════════════════════════════════════════════════════
   main.js — scroll → frame → CSS custom properties
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const A = window.Animatio;
  const F = A.frames;
  const { Timeline, clamp } = F;

  const $  = id => document.getElementById(id);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── nodes ───────────────────────────────────────────────── */
  const hero   = $('hero');
  const scene  = $('scene');
  const hudNum = $('hudNum');
  const railEl = $('rail');
  const hint   = $('heroHint');
  const nav    = $('nav');
  const lines  = $$('.hero__copy .line');

  /* ── build the machine ───────────────────────────────────── */
  A.buildKeyboard($('kbd'));
  const ticks = A.buildRail(railEl, A.TOTAL);
  const cells = A.buildWinGrid($('winGrid'), 16);

  /* flat keyboard for the keyboard chapter */
  const keysStage = $('keysStage');
  const keyEls = A.buildKeyboard($('keysWell'));

  /* chip dies */
  $$('.chip__die').forEach(die => {
    const n = +die.dataset.cores;
    const cols = n <= 10 ? 4 : n <= 14 ? 5 : 6;
    die.style.setProperty('--cols', cols);
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('i');
      dot.style.setProperty('--i', i);
      die.appendChild(dot);
    }
  });

  const tl = new Timeline(A.RIG, A.TOTAL);

  /* ── responsive fit ──────────────────────────────────────── */
  let fit = 1;
  let finishMax = 0;

  function measure() {
    const vw = window.innerWidth, vh = window.innerHeight;
    /* The nav (≈70px) and the copy block (≈190px) are fixed heights, so the
       band the machine may occupy scales faster than the viewport does.
       Solved against the transform chain: clean from 900×600 to 2560×1440. */
    const avail = Math.max(240, vh - 260);
    fit = clamp(Math.min(vw / 1280, avail / 650), 0.34, 1.20);
    const track = $('finishTrack');
    if (track) finishMax = Math.max(0, track.scrollWidth - vw);
  }

  /* ── helpers ─────────────────────────────────────────────── */
  const ss = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const inView = (node) => {
    const r = node.getBoundingClientRect();
    return r.bottom > -200 && r.top < window.innerHeight + 200;
  };
  const passProg = (node) => {
    const r = node.getBoundingClientRect();
    return clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
  };

  /* ── hero render ─────────────────────────────────────────── */
  let lastIdx = -1;

  function render(frame) {
    tl.apply(scene, frame, fit);

    if (manual) {
      scene.style.setProperty('--lid',   manual.lid + 'deg');
      scene.style.setProperty('--elev',  manual.elev + 'deg');
      scene.style.setProperty('--spin',  manual.spin + 'deg');
      scene.style.setProperty('--scale', (fit * manual.zoom).toFixed(4));
    }

    /* copy — fade in/out around each line's frame window */
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const a = +line.dataset.from, b = +line.dataset.to;
      const t = Math.min(ss(a, a + 6, frame), 1 - ss(b - 6, b, frame));
      const o = clamp(t, 0, 1);
      line.style.opacity = o.toFixed(3);
      line.style.transform = 'translate3d(0,' + ((1 - o) * 26).toFixed(2) + 'px,0)';
    }

    const idx = Math.round(frame);
    if (idx === lastIdx) return;
    lastIdx = idx;

    hudNum.textContent = String(idx).padStart(3, '0');

    for (let i = 0; i < ticks.length; i++) {
      const on = i <= idx;
      if (ticks[i]._on !== on) { ticks[i].classList.toggle('is-on', on); ticks[i]._on = on; }
      const now = i === idx;
      if (ticks[i]._now !== now) { ticks[i].classList.toggle('is-now', now); ticks[i]._now = now; }
    }

    /* the window grid on the display fills up with the timeline */
    const filled = Math.round(ss(56, 96, frame) * cells.length);
    for (let i = 0; i < cells.length; i++) {
      const on = i < filled;
      if (cells[i]._lit !== on) { cells[i].classList.toggle('is-lit', on); cells[i]._lit = on; }
    }

    hint.classList.toggle('is-out', idx > 3);
  }

  /* ── chapter: display ────────────────────────────────────── */
  const xdr = $('xdr'), bloom = $('xdrBloom'), meter = $('xdrMeter'), xdrVal = $('xdrVal');
  let xdrP = -1;
  function renderXdr() {
    if (!xdr || !inView(xdr)) return;
    const p = passProg(xdr);
    if (Math.abs(p - xdrP) < 0.001) return;
    xdrP = p;
    const b = ss(0.12, 0.92, p);
    bloom.style.opacity = (b * 0.92).toFixed(3);
    bloom.style.transform = 'scale(' + (1 + b * 0.55).toFixed(3) + ')';
    meter.style.width = (p * 100).toFixed(1) + '%';
    const nits = Math.round(Math.pow(10, p * Math.log10(1600)));
    xdrVal.textContent = nits.toLocaleString() + ' nits';
  }

  /* ── chapter: keyboard wave ──────────────────────────────── */
  let keysP = -1;
  function renderKeys() {
    if (!keysStage || !inView(keysStage)) return;
    const p = passProg(keysStage);
    if (Math.abs(p - keysP) < 0.0015) return;
    keysP = p;
    const head = p * (keyEls.length + 30) - 15;
    for (let i = 0; i < keyEls.length; i++) {
      const lit = clamp(1 - Math.abs(i - head) / 12, 0, 1);
      keyEls[i].style.setProperty('--lit', lit.toFixed(3));
    }
  }

  /* ── chapter: finish (horizontal) ────────────────────────── */
  const finishSec = $('finish'), finishTrack = $('finishTrack');
  let finP = -1;
  function renderFinish() {
    if (!finishSec) return;
    const r = finishSec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const total = finishSec.offsetHeight - window.innerHeight;
    const p = clamp(-r.top / total, 0, 1);
    if (Math.abs(p - finP) < 0.0008) return;
    finP = p;
    finishTrack.style.transform = 'translate3d(' + (-p * finishMax).toFixed(1) + 'px,0,0)';
  }

  /* ── main loop ───────────────────────────────────────────── */
  let targetP = 0, curP = 0;
  const K = REDUCE ? 1 : 0.13;

  function heroProgress() {
    const r = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    return clamp(-r.top / Math.max(1, total), 0, 1);
  }

  function loop() {
    targetP = heroProgress();
    curP += (targetP - curP) * K;
    if (Math.abs(targetP - curP) < 0.00012) curP = targetP;

    let f = curP * (A.TOTAL - 1);
    if (snap) f = Math.round(f);
    render(f);

    renderXdr();
    renderKeys();
    renderFinish();

    requestAnimationFrame(loop);
  }

  /* ── scroll reveals (added by JS so content never hides if JS dies) ── */
  $$('.sec__head, .chip, .stats li, .xdr, .keys, .buy > *, .finish h3').forEach((n, i) => {
    n.setAttribute('data-rv', '');
    n.style.setProperty('--rv-d', ((i % 4) * 65) + 'ms');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  $$('[data-rv]').forEach(n => io.observe(n));

  /* ── number counters ─────────────────────────────────────── */
  function countTo(node) {
    const to = +node.dataset.count || 0;
    const suffix = node.dataset.suffix || '';
    const dur = 1600;
    const t0 = performance.now();
    (function step(now) {
      const t = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - t, 4);
      node.textContent = Math.round(to * e).toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countTo(e.target);
      cio.unobserve(e.target);
    });
  }, { threshold: 0.55 });
  $$('[data-count]').forEach(n => cio.observe(n));

  /* ── nav auto-hide ───────────────────────────────────────── */
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-hidden', y > 160 && y > lastY + 3);
    lastY = y;
  }, { passive: true });

  /* ── QA overlay (press D) ────────────────────────────────── */
  const qa = $('qa');
  let manual = null;
  let snap = false;

  if (qa) {
    const qaLid = $('qaLid'), qaElev = $('qaElev'), qaSpin = $('qaSpin'), qaZoom = $('qaZoom');
    const qaSnap = $('qaSnap');

    function sync() {
      manual = {
        lid: +qaLid.value, elev: +qaElev.value,
        spin: +qaSpin.value, zoom: +qaZoom.value / 100
      };
      $('qaLidV').textContent  = manual.lid + '°';
      $('qaElevV').textContent = manual.elev + '°';
      $('qaSpinV').textContent = manual.spin + '°';
      $('qaZoomV').textContent = manual.zoom.toFixed(2) + '×';
    }
    [qaLid, qaElev, qaSpin, qaZoom].forEach(s => s.addEventListener('input', sync));
    qaSnap.addEventListener('change', () => { snap = qaSnap.checked; });
    $('qaReset').addEventListener('click', () => {
      manual = null; snap = false; qaSnap.checked = false; qa.hidden = true;
    });

    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'd' || e.key === 'D') { qa.hidden = !qa.hidden; if (!qa.hidden) sync(); else manual = null; }
    });
  }

  /* ── boot ────────────────────────────────────────────────── */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { measure(); finP = -1; keysP = -1; xdrP = -1; }, 120);
  }, { passive: true });

  measure();
  curP = heroProgress();
  render(curP * (A.TOTAL - 1));
  requestAnimationFrame(loop);
})();
