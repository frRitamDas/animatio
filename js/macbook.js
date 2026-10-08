/* ═══════════════════════════════════════════════════════════
   macbook.js — builds the machine and holds the frame storyboard
   ═══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const A = global.Animatio = global.Animatio || {};

  /* ── how many frames the film is cut into ───────────────── */
  A.TOTAL = 121;              /* frames 000 … 120 */
  A.OPEN  = 107;              /* degrees the lid swings (real MBP ≈ 107°) */

  /* ── ANSI keyboard, [label, width-in-units] ─────────────────*/
  const KB = [
    [['esc',1],['F1',1],['F2',1],['F3',1],['F4',1],['F5',1],['F6',1],
     ['F7',1],['F8',1],['F9',1],['F10',1],['F11',1],['F12',1],['',1.5,'touch']],
    [['`',1],['1',1],['2',1],['3',1],['4',1],['5',1],['6',1],['7',1],['8',1],
     ['9',1],['0',1],['-',1],['=',1],['delete',1.5]],
    [['tab',1.5],['Q',1],['W',1],['E',1],['R',1],['T',1],['Y',1],['U',1],['I',1],
     ['O',1],['P',1],['[',1],[']',1],['\\',1.5]],
    [['caps',1.75],['A',1],['S',1],['D',1],['F',1],['G',1],['H',1],['J',1],['K',1],
     ['L',1],[';',1],["'",1],['return',2.25]],
    [['shift',2.25],['Z',1],['X',1],['C',1],['V',1],['B',1],['N',1],['M',1],
     [',',1],['.',1],['/',1],['shift',2.75]],
    [['fn',1],['⌃',1.25],['⌥',1.25],['⌘',1.5],['',5.5],['⌘',1.5],['⌥',1.25],
     ['←',1],['→',1]]
  ];

  function buildKeyboard(host) {
    if (!host) return [];
    const frag = document.createDocumentFragment();
    const keys = [];
    KB.forEach(row => {
      const r = document.createElement('div');
      r.className = 'krow';
      row.forEach(([label, u, mod]) => {
        const k = document.createElement('div');
        k.className = 'key' + (u >= 1.5 ? ' key--wide' : '') + (mod ? ' key--' + mod : '');
        k.style.setProperty('--u', u);
        const b = document.createElement('b');
        b.textContent = label;
        k.appendChild(b);
        r.appendChild(k);
        keys.push(k);
      });
      frag.appendChild(r);
    });
    host.appendChild(frag);
    return keys;
  }

  /* ── frame rail down the right edge ──────────────────────── */
  function buildRail(host, total) {
    if (!host) return [];
    const frag = document.createDocumentFragment();
    const ticks = [];
    for (let i = 0; i < total; i++) {
      const t = document.createElement('i');
      frag.appendChild(t);
      ticks.push(t);
    }
    host.appendChild(frag);
    return ticks;
  }

  /* ── little window grid on the display ───────────────────── */
  function buildWinGrid(host, n) {
    if (!host) return [];
    const frag = document.createDocumentFragment();
    const cells = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      frag.appendChild(c);
      cells.push(c);
    }
    host.appendChild(frag);
    return cells;
  }

  /* ═══════════════════════════════════════════════════════════
     THE STORYBOARD
     121 frames. Every column below is a plotted animation curve.
       lid    — hinge angle, 0° closed → 107° open
       elev   — camera elevation above the deck (negative = looking down)
       spin   — azimuth of the machine
       scale  — object scale (× the responsive fit)
       cam-*  — screen-space camera translation / dolly
       glow   — light the panel throws onto the deck
       power  — display wake
       ui     — macOS interface opacity (fades in as we push in)
       lit    — keyboard backlight
       shade  — contact shadow strength
     ═══════════════════════════════════════════════════════════ */
  A.RIG = {
    '--lid': {
      unit: 'deg', ease: 'inOut',
      keys: [[0, 0], [10, 0], [64, A.OPEN], [120, A.OPEN]]
    },
    '--elev': {
      unit: 'deg', ease: 'inOut',
      keys: [[0,-76],[12,-71],[24,-65],[36,-60],[48,-52],[58,-45],[64,-40],
             [72,-34],[80,-28],[88,-30],[94,-35],[100,-40],[110,-37],[120,-32]]
    },
    '--spin': {
      unit: 'deg', ease: 'inOut',
      keys: [[0,0],[72,0],[80,11],[88,19],[94,17],[100,14],[110,11],[120,6]]
    },
    '--scale': {
      unit: '', ease: 'inOut', fit: true,
      keys: [[0,0.70],[12,0.75],[24,0.80],[36,0.85],[48,0.88],[58,0.89],[64,0.93],
             [72,0.96],[80,1.52],[88,1.40],[94,1.41],[96,0.88],[97,0.87],[98,0.86],
             [100,0.85],[110,0.88],[120,0.93]]
    },
    '--cam-x': {
      unit: 'px', ease: 'inOut', fit: true,
      keys: [[0,0],[72,0],[80,-75],[88,-118],[94,-107],[96,-15],[97,-14],
             [98,-13],[100,-12],[110,-10],[120,-6]]
    },
    '--cam-y': {
      unit: 'px', ease: 'inOut', fit: true,
      keys: [[0,-61],[12,-61],[24,-61],[36,-62],[48,7],[58,72],[64,105],[72,117],
             [80,387],[88,349],[94,366],[96,99],[97,96],[98,94],[100,90],[110,99],[120,113]]
    },
    '--cam-z': {
      unit: 'px', ease: 'inOut',
      keys: [[0,0],[64,0],[72,180],[80,420],[88,420],[94,420],[96,240],[97,150],[98,60],[100,0]]
    },
    '--glow': {
      unit: '', ease: 'smooth',
      keys: [[0, 0], [10, 0], [64, 1], [120, 1]]
    },
    '--power': {
      unit: '', ease: 'out',
      keys: [[0, 0], [8, 0], [24, 1]]
    },
    '--ui': {
      unit: '', ease: 'smooth',
      keys: [[58, 0], [78, 1], [120, 1]]
    },
    '--lit': {
      unit: '', ease: 'smooth',
      keys: [[0, 0], [40, 0], [66, 1], [120, 1]]
    },
    '--shade': {
      unit: '', ease: 'smooth',
      keys: [[0, 1], [64, .82], [80, .42], [100, .85], [120, .92]]
    }
  };

  A.buildKeyboard = buildKeyboard;
  A.buildRail = buildRail;
  A.buildWinGrid = buildWinGrid;
})(window);
