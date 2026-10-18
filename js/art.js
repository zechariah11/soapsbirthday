/* All of the pixel art, drawn in code so the site needs no image files.
   Sprites are written as rows of characters; each character maps to a palette colour. */
window.Art = (() => {
  const OUT = '#2b2745';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
  const ctxOf = (c) => c.getContext('2d');
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

  function spr(rows, pal) {
    const w = Math.max(...rows.map((r) => r.length));
    const c = mk(w, rows.length), x = ctxOf(c);
    rows.forEach((r, j) => {
      for (let i = 0; i < r.length; i++) {
        const col = pal[r[i]];
        if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
      }
    });
    return c;
  }
  // 1px outline around everything opaque (the classic handheld-game look)
  function outline(src, col = OUT) {
    const w = src.width + 2, h = src.height + 2, c = mk(w, h), x = ctxOf(c);
    x.drawImage(src, 1, 1);
    const a = x.getImageData(0, 0, w, h).data;
    const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && a[(j * w + i) * 4 + 3] > 0;
    x.fillStyle = col;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (!solid(i, j) && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1))) x.fillRect(i, j, 1, 1);
    }
    return c;
  }
  function flip(src) {
    const c = mk(src.width, src.height), x = ctxOf(c);
    x.scale(-1, 1); x.drawImage(src, -src.width, 0);
    return c;
  }
  function silhouette(src, col) {
    const c = mk(src.width, src.height), x = ctxOf(c);
    x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in';
    x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  /* ---------------- tiny 3x5 pixel font ---------------- */
  const FONT = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
    J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
    P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
    3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
    6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
    9: ['###', '#.#', '###', '..#', '##.'], '!': ['.#.', '.#.', '.#.', '...', '.#.'], ' ': ['...', '...', '...', '...', '...'],
  };
  const textWidth = (str, s = 1) => Math.max(0, String(str).length * 4 * s - s);
  // shiny silver foil-balloon letters
  function foil(str, s = 2) {
    str = String(str).toUpperCase();
    const c = mk(textWidth(str, s), 5 * s), x = ctxOf(c);
    let cx = 0;
    for (const ch of str) {
      const gl = FONT[ch] || FONT[' '], on = (i, j) => j >= 0 && j < 5 && i >= 0 && i < 3 && gl[j][i] === '#';
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (on(i, j)) {
        const X = cx + i * s, Y = j * s;
        x.fillStyle = '#e2e7f2'; x.fillRect(X, Y, s, s);
        if (!on(i, j - 1)) { x.fillStyle = '#ffffff'; x.fillRect(X, Y, s, 1); }
        if (s > 1 && !on(i, j + 1)) { x.fillStyle = '#a3acc4'; x.fillRect(X, Y + s - 1, s, 1); }
      }
      cx += 4 * s;
    }
    return outline(c, '#59607c');
  }

  // bolder 5x7 letters for the big HAPPY BIRTHDAY balloons
  const FONT57 = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  };
  function banner(str, big = false) {
    str = String(str).toUpperCase();
    if (big) { // twice the size for tall phone walls, still shaded one pixel at a time
      const w = str.length * 12 - 2, c = mk(w, 14), x = ctxOf(c);
      str.split('').forEach((ch, n) => {
        const gl = FONT57[ch] || FONT57[' '];
        const on = (i, j) => i >= 0 && i < 10 && j >= 0 && j < 14 && gl[j >> 1][i >> 1] === '#';
        for (let j = 0; j < 14; j++) for (let i = 0; i < 10; i++) if (on(i, j)) {
          x.fillStyle = !on(i, j - 1) ? '#ffffff' : !on(i, j + 1) ? '#a3acc4' : !on(i + 1, j) ? '#c6cddd' : '#dfe4f0';
          x.fillRect(n * 12 + i, j, 1, 1);
        }
      });
      return outline(c, '#59607c');
    }
    const w = str.length * 7 - 1, c = mk(w, 7), x = ctxOf(c);
    str.split('').forEach((ch, n) => {
      const gl = FONT57[ch] || FONT57[' '];
      const on = (i, j) => j >= 0 && j < 7 && ((i >= 0 && i < 5 && gl[j][i] === '#') || (i - 1 >= 0 && i - 1 < 5 && gl[j][i - 1] === '#')); // bold: each pixel doubled sideways
      for (let j = 0; j < 7; j++) for (let i = 0; i < 6; i++) if (on(i, j)) {
        x.fillStyle = !on(i, j - 1) ? '#ffffff' : !on(i, j + 1) ? '#a3acc4' : '#dfe4f0';
        x.fillRect(n * 7 + i, j, 1, 1);
      }
    });
    return outline(c, '#59607c');
  }

  /* ---------------- little Princess Sophia ---------------- */
  // same pose as the reference photo (one hand on her hip, the other at her side holding the
  // baguette), now in a light-blue Cinderella ball gown with puff sleeves, gloves and a crown
  const GIRL_PAL = {
    H: '#3d2c3a', h: '#6e4f66', S: '#ffd9b8', s: '#efb28c', E: OUT, P: '#ff9db2', M: '#d65f7c',
    Y: '#ffd54a', y: '#e0a82a', B: '#3d7bff', D: '#9fd4ff', d: '#6fb0ef', L: '#dcf1ff', W: '#ffffff', G: '#bfe8ff',
  };
  const GIRL = [
    '.....Y...YY...Y.....',   // crown
    '.....YY.YYYY.YY.....',
    '.....YYYYYYYYYY.....',
    '.....yyByyyyByy.....',
    '......HHHHHHHH......',
    '....HHHHHHHHHHHH....',
    '...HHHhhhHHHHHHHH...',
    '..HHHhhHHHHHHHHHHH..',
    '..HHHHHHHHHHHHHHHH..',
    '..HHHHSHHHHHHSHHHH..',
    '..HHSSSSSSSSSSSSHH..',
    '..HHSSSESSSSESSSHH..',
    '..HHSSSESSSSESSSHH..',
    '..HHSPPSSSSSSPPSHH..',
    '..HHSSSSSMMSSSSSHH..',
    '..HHHsSSSSSSSSsHHH..',
    '..HHH...ssss...HHH..',
    '...LLLsDDDDDDsLLL...',   // puff sleeves + bodice
    '..LLLLDDDDDDDDLLLL..',
    '..LLLDDDDDDDDDDLLLL.',
    '..WW.DDDDDDDDDD.WW..',   // long white gloves
    '..WW.dDDDDDDDDd.WW..',
    '..WW..BBBBBBBBWW....',   // sash, hand on her hip
    '..WW.DDDDDDDDDD.....',
    '..WW.DLDDDDDDLD.....',   // baguette hand
    '....DDLDDDDDDLDD....',   // the skirt flares out
    '...DDLDDWDDDDDLDD...',
    '...DLDDDDDDDWDDLD...',
    '..DDLDDWDDDDDDWLDD..',
    '..DLDDDDDDWDDDDDLD..',
  ];
  const HEM = ['.DDLDDDDDDDDDDDDLDD.', '.dDDdDDdDDdDDdDDdDd.', '..WWWWWWWWWWWWWWWW..'];
  const LEGS = {   // glass slippers peeking out under the lace
    idle: HEM.concat(['.....GG......GG.....']),
    walkA: HEM.concat(['....GG.........GG...']),
    walkB: HEM.concat(['......GG....GG......']),
  };
  const girl = {};
  for (const legs of Object.keys(LEGS)) for (const happy of [0, 1]) {
    const rows = GIRL.concat(LEGS[legs]);
    if (happy) rows[12] = '..HHSSESESSESESSHH..';
    const img = outline(spr(rows, GIRL_PAL));
    girl[`${legs}${happy}L`] = img;          // baguette hand on the left
    girl[`${legs}${happy}R`] = flip(img);    // mirrored
    if (legs === 'idle') { // whisking pose: that arm is drawn separately so it can move with the whisk
      const w = rows.map((r, j) => (j >= 19 && j <= 23 ? r.slice(0, 2) + '..' + r.slice(4) : r));
      girl[`whisk${happy}R`] = flip(outline(spr(w, GIRL_PAL)));
    }
  }
  const GIRL_W = 22, GIRL_H = 36;
  const GRIP = { L: { x: 3, y: 25 }, R: { x: GIRL_W - 1 - 3, y: 25 } };

  /* ---------------- Zech (Korean Army uniform) ---------------- */
  // chibi like her: big round head, shiny eyes, rosy cheeks; green beret with a gold badge,
  // black hair peeking out, digital-camo top and bottom, flag patch, name tape, belt, black boots
  const ZECH_PAL = {
    B: '#4e8a3a', b: '#7cb359', V: '#2f5a24', Y: '#f0c94a', H: '#1f1c26', h: '#4a4658', S: '#ffd9b8', s: '#efb28c', E: OUT, W: '#ffffff',
    P: '#ff9db2', M: '#c0606f', u: '#3d4a2e', K: '#15151c', k: '#454556', Q: '#c9b47a', F: '#ffffff', R: '#d23b3b', L: '#2f5fbf',
    T: '#d8cfae', D: '#7fc4ff',
  };
  const CAMO = ['#7b8758', '#7b8758', '#7b8758', '#7b8758', '#4d5a37', '#4d5a37', '#4d5a37', '#7a5c3e', '#7a5c3e', '#2b2a25', '#b9a77d'];
  const ZECH = [
    '.....bBBBBBB........',   // green beret, tilted, with a gold badge
    '...bBBBBBBBBBB......',
    '..BBBBYBBBBBBBBB....',
    '..VBBBBBBBBBBBBBV...',
    '...HHHhhHHHHHHHHH...',   // black hair peeking out
    '..HHHSSSSSSSSSSHHH..',
    '..HSSSSSSSSSSSSSSH..',
    '..HSSWESSSSSSWESSH..',   // shiny eyes
    '..HSSEESSSSSSEESSH..',
    '..HSPPSSSMMSSSPPSH..',   // rosy cheeks, little smile
    '...sSSSSSSSSSSSSs...',
    '.....ssssssssss.....',
    '....CCCCuuuuCCCC....',
    '...CCCCCCuuCCCCCC...',
    '..CFFCCCCCCCCCCCCC..',
    '..CRLCCCCCCTTTTCCC..',
    '..CCCCCCCCCCCCCCCC..',
    '..CC.CCCCCCCCCC.CC..',
    '..CC.CCCCCCCCCC.CC..',
    '..SS.KKKKQQKKKK.SS..',
    '.....CCCCCCCCCC.....',
    '.....CCCC..CCCC.....',
    '.....CCCC..CCCC.....',
    '.....CCCC..CCCC.....',
    '.....CCCC..CCCC.....',
    '.....CCCC..CCCC.....',
    '.....KKKK..KKKK.....',
    '....KkKKK..KKkKK....',
    '....KKKKK..KKKKK....',
  ];
  const ZECH_FACES = {
    normal: {},
    tired: { 7: '..HSSSSSSSSSSSSSSH.D', 8: '..HSSEESSSSSSEESSHDD', 10: '...sSSSSSMMSSSSSs...' },
    lose: { 7: '..HSSEEESSSSEEESSH..', 8: '..HSSSESSSSSSESSSH..', 9: '..HSPPDSSMMSSDPPSH..' },
    happy: { 7: '..HSSSESSSSSSESSSH..', 8: '..HSSESESSSSESESSH..', 9: '..HSPPSSMSSMSSPPSH..', 10: '...sSSSSSMMSSSSSs...' },
  };
  function camoSprite(rows) {
    const c = mk(rows[0].length, rows.length), x = ctxOf(c);
    rows.forEach((r, j) => {
      for (let i = 0; i < r.length; i++) {
        // digital camo: pick a pattern colour per 2x2 block (plus a little per-pixel noise)
        const col = r[i] === 'C' ? CAMO[(((((i >> 1) + 1) * 2654435761) ^ (((j >> 1) + 3) * 40503) ^ (i * 977)) >>> 0) % CAMO.length] : ZECH_PAL[r[i]];
        if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
      }
    });
    return outline(c);
  }
  const zech = {}, zechWhisk = {};
  for (const f of Object.keys(ZECH_FACES)) {
    const rows = ZECH.slice();
    for (const [j, row] of Object.entries(ZECH_FACES[f])) rows[j] = row;
    zech[f] = camoSprite(rows);
    // whisking pose: his left arm is drawn separately so it can move with the whisk
    zechWhisk[f] = camoSprite(rows.map((r, j) => (j >= 17 && j <= 19 ? r.slice(0, 2) + '..' + r.slice(4) : r)));
  }
  const ZECH_W = 22, ZECH_H = ZECH.length + 2;

  /* ---------------- the baguette (rasterised at any angle, cached) ---------------- */
  const bagCache = new Map();
  function baguette(angle) {
    const steps = 64, k = ((Math.round((angle / (Math.PI * 2)) * steps) % steps) + steps) % steps;
    if (bagCache.has(k)) return bagCache.get(k);
    const a = (k / steps) * Math.PI * 2, R = 24, size = R * 2 + 1, c = mk(size, size), x = ctxOf(c);
    const dx = Math.sin(a), dy = -Math.cos(a), px = Math.cos(a), py = Math.sin(a);
    const U0 = -3, U1 = 20;
    const mask = new Uint8Array(size * size);
    const col = [];
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const qx = i - R, qy = j - R, u = qx * dx + qy * dy, v = qx * px + qy * py;
      if (u < U0 || u > U1) continue;
      let r = 1.9;
      if (u > U1 - 2.5) r -= (u - (U1 - 2.5)) * 0.55;
      if (u < U0 + 1.5) r -= (U0 + 1.5 - u) * 0.55;
      if (Math.abs(v) > r) continue;
      mask[j * size + i] = 1;
      let c0 = v < -0.7 ? '#f6cf86' : v > 0.75 ? '#b8732f' : '#e29b48';
      if (u > 1 && u < U1 - 3 && v < 0.75 && ((((u - v * 0.9) % 5) + 5) % 5) < 1.1) c0 = '#fde8b5';
      col.push([i, j, c0]);
    }
    for (const [i, j, c0] of col) { x.fillStyle = c0; x.fillRect(i, j, 1, 1); }
    x.fillStyle = '#5a3418';
    const on = (i, j) => i >= 0 && j >= 0 && i < size && j < size && mask[j * size + i];
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) x.fillRect(i, j, 1, 1);
    }
    const out = { c, ox: R, oy: R, len: U1 };
    bagCache.set(k, out);
    return out;
  }

  /* ---------------- the boss: a giant Sungsimdang strawberry cake ---------------- */
  const STRAW = spr([
    '..gGg..',
    '.RgRgR.',
    'RhRRRRR',
    'RRyRRyR',
    'RyRRRRR',
    '.RRRyR.',
    '..RRR..',
  ], { R: '#e8405a', h: '#ff9aa8', y: '#ffe3a3', g: '#3d9a52', G: '#7ad37a' });
  const HALF = spr(['.RRR.', 'RpPpR', 'RpWpR', '.RpR.', '..R..'], { R: '#e8405a', p: '#ff8fa3', P: '#ffd3da', W: '#fff2f4' });
  const BOW = spr(['BB.....BB', 'BbB.K.BbB', 'BbbBKBbbB', 'BbB.K.BbB', 'BB.....BB'], { B: '#3d7bff', b: '#a9d0ff', K: '#1d48c4' });
  const FACE_PAL = { K: '#3a1c2c', W: '#ffffff', P: '#ff8fb0', B: '#7fc4ff' };
  const FACES = {
    angry: [
      '....KKKK..............KKKK....',
      '........KK..........KK........',
      '..............................',
      '......WKK............WKK......',
      '......KKK............KKK......',
      '......KKK............KKK......',
      '...PPPP................PPPP...',
      '.............KKKK.............',
      '............K....K............',
    ],
    hurt: [
      '..............................',
      '..............................',
      '..............................',
      '......K................K......',
      '.......KK............KK.......',
      '......K................K......',
      '...PPPP................PPPP...',
      '..............KK..............',
      '.............K..K.............',
      '..............KK..............',
    ],
    worried: [
      '........KK..........KK......B.',
      '....KKKK..............KKKK..BB',
      '............................BB',
      '......WKK............WKK......',
      '......KKK............KKK......',
      '......KKK............KKK......',
      '...PPPP................PPPP...',
      '............KKKKKK............',
    ],
    ko: [
      '..............................',
      '..............................',
      '..............................',
      '......K.K............K.K......',
      '.......K..............K.......',
      '......K.K............K.K......',
      '..............................',
      '............KKKKKK............',
      '...........K......K...........',
    ],
  };
  function buildCake() {
    const FW = 56, SW = 6, MH = 13, BH = 36;
    const W = FW + SW, H = MH + BH + 4;
    const c = mk(W, H), x = ctxOf(c);
    const P = (col, i, j, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(i, j, w, h); };
    const layers = [['cream', 3], ['sponge', 6], ['fill', 7], ['sponge', 6], ['fill', 7], ['sponge', 5], ['cream', 3]];
    const faceCx = Math.floor(FW / 2);
    const colorAt = (t, j, h, i, y) => t === 'sponge'
      ? (j === 0 ? '#fde5a6' : ((i * 5 + y * 3) % 9 === 0 ? '#e7b35d' : '#f7cf7d'))
      : (j === h - 1 ? '#f1e4d4' : '#fffaf1');
    const SIDE = { '#fde5a6': '#e9c682', '#e7b35d': '#cf9a48', '#f7cf7d': '#e2b360', '#f1e4d4': '#d9cbbb', '#fffaf1': '#e9e1d6' };
    let y = MH;
    layers.forEach(([t, h], li) => {
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < FW; i++) P(colorAt(t, j, h, i, y + j), i, y + j);
        for (let s = 0; s < SW; s++) P(SIDE[colorAt(t, j, h, s, y + j)], FW + s, y + j - Math.floor((s + 1) / 2));
      }
      if (t === 'fill') {
        for (let hx = 3 + (li === 4 ? 4 : 0); hx < FW - 4; hx += 8) {
          if (li === 4 && Math.abs(hx + 2 - faceCx) < 9) continue; // leave room for the boss's mouth
          x.drawImage(HALF, hx, y + 1);
        }
      }
      y += h;
    });
    // blue cake board
    P('#a9d0ff', 0, MH + BH, FW, 1); P('#3d7bff', 0, MH + BH + 1, FW, 2); P('#2a5bd0', 0, MH + BH + 3, FW, 1);
    for (let s = 0; s < SW; s++) { const o = MH + BH - Math.floor((s + 1) / 2); P('#7fb2f0', FW + s, o, 1, 1); P('#2c62d6', FW + s, o + 1, 1, 3); }
    // acetate-wrap glint
    for (let j = MH + 2; j < MH + BH - 3; j += 2) P('#e4f2ff', 2, j);
    for (let j = MH + 2; j < MH + 14; j += 2) P('#e4f2ff', 4, j);
    // mountain of strawberries (back row first)
    [[3, 7], [5, 3], [7, 0]].forEach(([yy, start]) => {
      for (let sx = start; sx < W - 6; sx += 7) x.drawImage(STRAW, sx, yy);
    });
    for (const [i, j] of [[10, 4], [23, 3], [37, 4], [48, 6], [16, 8], [30, 7], [44, 9], [5, 9]]) P('#ffffff', i, j); // sugar dust
    for (let rx = 1; rx < FW - 3; rx += 5) { P('#c9b9a6', rx, MH - 2, 4, 1); P('#ffffff', rx + 1, MH - 2, 2, 1); P('#fffaf1', rx, MH - 1, 4, 1); P('#f1e4d4', rx + 3, MH - 1, 1, 1); } // piped cream swirls
    x.drawImage(BOW, Math.floor((W - BOW.width) / 2), 0);

    const img = outline(c);
    const faces = {};
    for (const k of Object.keys(FACES)) faces[k] = spr(FACES[k], FACE_PAL);
    return {
      img, white: silhouette(img, '#ffffff'), faces,
      w: img.width, h: img.height,
      faceX: 1 + faceCx - 15, faceY: 1 + MH + 15,
      ropeX: Math.floor(img.width / 2) - 1,
      // where each layer starts (from the bottom up), for building the cake in the cutscene:
      // board, sponge, cream+berries, sponge, cream+berries, sponge+cream, strawberry mountain
      layerCuts: [1 + MH + BH, 1 + MH + 29, 1 + MH + 22, 1 + MH + 16, 1 + MH + 9, 1 + MH, 0],
      geo: { FW, SW, MH, BH }, // (inside the 1px outline) for icing the top in the icing stage
    };
  }

  /* ---------------- kitchen props for the mini-games ---------------- */
  const BOWL_ROWS = ['WWWWWWWWWWWWWWWW', 'bBBBBBBBBBBBBBBb', '.bBBhBBBBBBBBBb.', '..bBBBBBBBBBBb..', '...bbbbbbbbbb...', '.....ffffff.....'];
  const BOWLS = {
    sophia: outline(spr(BOWL_ROWS, { W: '#ffffff', B: '#a9d0ff', b: '#7fb2f0', h: '#e4f2ff', f: '#7fb2f0' })),
    zech: outline(spr(BOWL_ROWS, { W: '#f4f6fa', B: '#c9ced8', b: '#9aa1b0', h: '#eef0f5', f: '#9aa1b0' })),
  };
  const WHISK_ROWS = ['...h...', '...h...', '...h...', '...h...', '..www..', '.w.w.w.', 'w..w..w', 'w..w..w', 'w..w..w', '.w.w.w.', '..www..'];
  const WHISKS = {
    sophia: outline(spr(WHISK_ROWS, { h: '#ff9ec4', w: '#dfe4ee' }), '#5b6380'),
    zech: outline(spr(WHISK_ROWS, { h: '#5a6b45', w: '#dfe4ee' }), '#5b6380'),
  };
  const STRAW_O = outline(STRAW);
  // a freshly baked sponge (they stack up on top of the oven)
  const SPONGE = outline(spr([
    '..cccccccccccccccc..', '.cCCCCCCCCCCCCCCCCc.', 'cyyyyyyyyyyyyyyyyyyc', 'cyyhyyyyhyyyyyhyyyyc', 'cyyyyyhyyyyyyyyyhyyc', 'cyyyyyyyyyyhyyyyyyyc', '.cccccccccccccccccc.',
  ], { c: '#c98a3e', C: '#e7b35d', y: '#f7cf7d', h: '#e2b360' }));
  const GOLD_STRAW = outline(spr(['..gGg..', '.YgYgY.', 'YhYYYYY', 'YYwYYwY', 'YwYYYYY', '.YYYwY.', '..YYY..'],
    { Y: '#ffcf3a', h: '#fff4b8', w: '#fffbe6', g: '#3d9a52', G: '#7ad37a' }), '#9a6a1a');
  const TOAST = outline(spr(['.dddddd.', 'dTTTTTTd', 'dTkTTkTd', 'dTTkkTTd', 'dTkTTTTd', 'dTTTTkTd', '.dddddd.'],
    { d: '#4a2a14', T: '#6b3a1c', k: '#231510' }), '#120a06');
  const counterCache = new Map();
  function counter(w, h, cloth) { // little kitchen counter: wooden top, gingham cloth front
    const key = `${w}x${h}${cloth}`;
    if (counterCache.has(key)) return counterCache.get(key);
    const c = mk(w, h), x = ctxOf(c);
    const [a, b, d] = cloth === 'sophia' ? ['#ffffff', '#cfe2ff', '#a9c8f5'] : ['#f3ecd8', '#d9cda6', '#b9ab82'];
    x.fillStyle = '#e2b27b'; x.fillRect(0, 0, w, 2); x.fillStyle = '#c08d57'; x.fillRect(0, 2, w, 1);
    for (let j = 3; j < h; j++) for (let i = 0; i < w; i++) {
      const p = (i >> 1) % 2, q = ((j - 3) >> 1) % 2;
      x.fillStyle = p && q ? d : p || q ? b : a; x.fillRect(i, j, 1, 1);
    }
    const out = outline(c, '#7a5232');
    counterCache.set(key, out);
    return out;
  }

  /* ---------------- small props ---------------- */
  const BALLOON_ROWS = ['.bbbbb.', 'bhhbbbb', 'bhbbbbb', 'bbbbbbd', 'bbbbbbd', '.bbbbd.', '..bdd..', '...k...'];
  const BALLOON_PALS = [
    { b: '#ff9ec4', h: '#ffd6e8', d: '#e0739f', k: '#e0739f' }, { b: '#7fb2ff', h: '#cfe3ff', d: '#4f86e0', k: '#4f86e0' },
    { b: '#8fe3c4', h: '#d6f7ea', d: '#5ab894', k: '#5ab894' }, { b: '#ffe27a', h: '#fff6c8', d: '#e0b440', k: '#e0b440' },
    { b: '#c8aaff', h: '#ece2ff', d: '#9878e0', k: '#9878e0' }, { b: '#3f9a86', h: '#86d6c2', d: '#2a6e60', k: '#2a6e60' },
    { b: '#f4f6fb', h: '#ffffff', d: '#c9d1e3', k: '#c9d1e3' },
  ];
  const BALLOONS = BALLOON_PALS.map((p) => outline(spr(BALLOON_ROWS, p)));
  const STAR = outline(spr(['....y....', '...yyy...', 'yyyyhyyyy', '.yyhhyyy.', '..yyyyd..', '..yyydd..', '.yyd.ddd.', '.yd...dd.'],
    { y: '#ffd54a', h: '#fff3b0', d: '#e0a82a' }), '#9a6a1a');
  const BIG_BALLOON_ROWS = ['...bbbbb...', '.bbhhbbbbb.', 'bhhbbbbbbbb', 'bhbbbbbbbbb', 'bbbbbbbbbbd', 'bbbbbbbbbbd', 'bbbbbbbbbdd',
    '.bbbbbbbbd.', '..bbbbbbd..', '...bbbdd...', '....bdd....', '.....k.....', '....kkk....'];
  const BALLOONS_BIG = BALLOON_PALS.map((p) => outline(spr(BIG_BALLOON_ROWS, p)));
  const STAR_BIG = outline(spr(['......y......', '.....yyy.....', '.....yhy.....', '....yyhyy....', 'yyyyyhhyyyyyy', '.yyyhhyyyyyy.',
    '..yyhyyyyyd..', '...yyyyyydd..', '...yyyyyddd..', '..yyyy.dddd..', '..yyd...ddd..', '.yd.......dd.'],
    { y: '#ffd54a', h: '#fff3b0', d: '#e0a82a' }), '#9a6a1a');
  // the cake monster's whipped-cream hand (fingers spread, reaching right)
  const CREAM_HAND = outline(spr(['.........cc.', '........ccc.', '..ccccc.cc..', '.cccccccc...', 'ccccccccsccc', 'cpcccccccccc', 'ccccccccsccc',
    '.cccccccc...', '..ccccc.cc..', '........ccc.', '.........cc.'], { c: '#fffaf1', s: '#eadbc8', p: '#ffb3cf' }));
  const HEART = outline(spr(['.RR.RR.', 'RhRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#ff6b98', h: '#ffc2d6' }));
  const PRESENT_ROWS = ['..RR...RR..', '.R..R.R..R.', '..RRRRRRR..', 'LLLLLRLLLLL', 'DDDDDRDDDDD', '.BBBBRBBBB.', '.BBBBRBBBB.', '.RRRRRRRRR.', '.BBBBRBBBB.', '.BBBBRBBBB.', '.DDDDRDDDD.'];
  const PRESENTS = [
    { L: '#ffc1d6', B: '#ffa6c5', D: '#e57fa6', R: '#ffffff' },
    { L: '#b8d6ff', B: '#8fbaff', D: '#6893e0', R: '#ff8fb5' },
    { L: '#c9f2dd', B: '#a6e6c6', D: '#76c9a0', R: '#ffe27a' },
  ].map((p) => outline(spr(PRESENT_ROWS, p)));
  const MINI_CAKE = outline(spr(['..f..f..f...', '..c..c..c...', '..c..c..c...', '.WWWWWWWWWW.', '.PPWPPWPPWP.', '.WWWWWWWWWW.', '.PPPPPPPPPP.', '.WWWWWWWWWW.', 'SSSSSSSSSSSS', '....SSSS....', '...SSSSSS...'],
    { f: '#ffcf4a', c: '#8ec5ff', W: '#ffffff', P: '#ffb3cf', S: '#d6dcea' }));
  const HAT = outline(spr(['..y...', '..P...', '.PWP..', '.WPW..', 'PWPWP.', 'WPWPW.', 'PPPPPP'], { y: '#ffe27a', P: '#ff9ec4', W: '#ffffff' }));
  const PLATE = outline(spr(['.BBBBBBB.', 'BbbbbbbbB', '.BBBBBBB.'], { B: '#7fb2ff', b: '#d5e6ff' }));
  const PLANT = outline(spr([
    '....LL....LL..', '...LlL...LlL..', '..LlLL..LlLL..', '.LLLL.LLLLL...', 'LlLL.LlLLL..L.', 'LLL.LLLL...LlL',
    '.L.LlLLL..LLLL', '...LLLLL.LlLL.', '..LL.LL.LLL...', '..L..LL.L.....', '.....LL.......', '....PPPPP.....',
    '...PPPPPPP....', '....PpPPP.....', '....PPPPP.....', '....PPPPP.....',
  ], { L: '#3e9a58', l: '#7dd38a', P: '#f4f4f4', p: '#d9dde6' }));
  const BREAD = spr(['..bbbbbb..', '.bBBBBBBb.', 'bBBhBBhBBb', 'bBBBBBBBBb', '.bbbbbbbb.'], { b: '#c7813c', B: '#e7a95a', h: '#fbe0a6' });

  /* ---------------- the party room ---------------- */
  function buildRoom(iw, ih, opt = {}) {
    const c = mk(iw, ih), x = ctxOf(c), rnd = seeded(11);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const R = (col, X, Y, w = 1, h = 1) => { if (w > 0 && h > 0) { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); } };
    const put = (img, X, Y) => x.drawImage(img, Math.round(X), Math.round(Y));
    const box = (X, Y, w, h, fillCol, line) => { R(line, X - 1, Y - 1, w + 2, h + 2); R(fillCol, X, Y, w, h); };
    const portrait = ih > iw * 1.1;
    const T = Math.max(0, opt.top | 0);   // rows hidden behind the HUD boxes at the top
    const floorY = Math.round(ih * (portrait ? 0.7 : 0.67));
    const wy = floorY - 16;

    // upright screens (phones, tablets): bigger decorations and furniture running off the edges.
    // Work out the wall top-down: banner, bunting, then a window band that has to clear the TV.
    let plan = null;
    const TVW = portrait ? 46 : 38, TVH = portrait ? 30 : 24, tvTop = floorY - 15 - TVH;
    if (portrait) {
      const y0 = Math.max(4, T - 6);
      const make = (big, swag) => {
        const a = banner('HAPPY', big), b = banner('BIRTHDAY', big);
        const ly = Math.max(T + 3, y0 + 5), y1 = ly + a.height + 3 + b.height + 6;
        const winY = (swag ? y1 + 14 : y1) + 8;
        return { a, b, ly, y0, y1, swag, winY, winH: tvTop - 8 - winY };
      };
      const bigFits = banner('BIRTHDAY', true).width <= iw - 18;
      // big letters matter most, then the bunting, then a tall window
      for (const [big, swag, minH] of [[true, true, 30], [true, false, 24], [false, true, 30], [false, false, 0]]) {
        if (big && !bigFits) continue;
        const P = make(big, swag);
        if (!plan || P.winH > plan.winH) plan = P;
        if (P.winH >= minH) { plan = P; break; }
      }
      if (plan.winH < 22) plan = null; // too squat: fall back to the compact arrangement
    }

    // wall with a little diamond wallpaper, then wainscoting
    R('#cfe3ff', 0, 0, iw, floorY);
    for (let y = 9, r = 0; y < wy - 3; y += 8, r++) for (let X = 3 + (r % 2) * 5; X < iw; X += 10) {
      R('#bcd6fb', X, y); R('#bcd6fb', X - 1, y + 1, 3, 1); R('#bcd6fb', X, y + 2);
    }
    R('#f6f9ff', 0, 0, iw, 3); R('#a9c4ec', 0, 3, iw, 1);
    R('#f3f7ff', 0, wy, iw, 16); R('#ffffff', 0, wy, iw, 1); R('#9fbbe3', 0, wy + 2, iw, 1);
    for (let X = 3; X < iw; X += 20) { R('#d5e1f3', X, wy + 5, 14, 1); R('#d5e1f3', X, wy + 5, 1, 7); R('#ffffff', X, wy + 12, 14, 1); R('#ffffff', X + 13, wy + 5, 1, 8); }
    R('#dbe5f5', 0, floorY - 2, iw, 2); R('#a9bcdb', 0, floorY - 1, iw, 1);

    // wooden floor
    R('#e9b87d', 0, floorY, iw, ih - floorY);
    for (let y = floorY, r = 0; y < ih; y += 6, r++) {
      R('#f3c992', 0, y, iw, 1); R('#d09c62', 0, y + 5, iw, 1);
      for (let X = (r * 17) % 31; X < iw; X += 31) R('#d09c62', X, y + 1, 1, 4);
    }

    // window with curtains
    let win, cur = 6;
    if (plan) {
      cur = 8;
      const w = clamp(Math.round(iw * 0.29), 24, 40);
      win = { x: cur + 3, y: plan.winY, w, h: clamp(plan.winH, 18, Math.round(w * 1.2)) };
    } else win = portrait ? { x: 7, y: Math.round(ih * 0.27), w: 22, h: 28 } : { x: 18, y: 14, w: 30, h: 32 };
    R('#b98a55', win.x - cur - 3, win.y - 5, win.w + 2 * cur + 6, 2);
    box(win.x - 2, win.y - 2, win.w + 4, win.h + 4, '#ffffff', '#8aa6d4');
    R('#a8dcff', win.x, win.y, win.w, win.h); R('#c6e9ff', win.x, win.y + Math.round(win.h * 0.6), win.w, Math.round(win.h * 0.4));
    const clouds = plan ? [[0.12, 0.2], [0.58, 0.14], [0.3, 0.62]] : [[0.25, 0.25], [0.7, 0.55]];
    for (const [cx, cy] of clouds) {
      const X = win.x + Math.round(win.w * cx), Y = win.y + Math.round(win.h * cy);
      R('#ffffff', X, Y, 7, 2); R('#ffffff', X + 2, Y - 1, 3, 1); R('#ffffff', X - 1, Y + 1, 9, 1);
    }
    R('#ffffff', win.x + Math.floor(win.w / 2) - 1, win.y, 2, win.h); R('#ffffff', win.x, win.y + Math.floor(win.h / 2) - 1, win.w, 2);
    R('#e8f6ff', win.x + 2, win.y + 2, 1, 4); R('#e8f6ff', win.x + 3, win.y + 2, 1, 2);
    R('#ffffff', win.x - 5, win.y + win.h + 2, win.w + 10, 2); R('#c9d6ea', win.x - 5, win.y + win.h + 4, win.w + 10, 1);
    for (const side of [0, 1]) {
      for (let j = 0; j < win.h + 8; j++) {
        const w0 = cur + Math.round(Math.sin(j / 5) * 1) + (j > win.h ? 1 : 0);
        const X = side ? win.x + win.w + 3 - (w0 - cur) : win.x - 3 - cur;
        R('#ffb7cf', X, win.y - 3 + j, w0, 1);
        R('#ef8db3', X + (side ? 1 : cur - 2), win.y - 3 + j, 1, 1);
        if (plan) R('#ef8db3', X + (side ? 4 : cur - 5), win.y - 3 + j, 1, 1);
      }
      if (plan) { // tie-backs
        const ty = win.y + Math.round(win.h * 0.55);
        R('#7fb2ff', side ? win.x + win.w + 3 : win.x - 3 - cur, ty, cur, 2);
      }
    }

    // framed bread picture (she loves bread)
    if (plan) {
      const pw = 28, ph = 22, px = iw - pw - 7, py = win.y + Math.max(0, Math.round((win.h - ph) / 2) - 3);
      R('#ffffff', px + pw / 2, py - 7, 1, 6); R('#ffffff', px + pw / 2 - 3, py - 2, 1, 1); R('#ffffff', px + pw / 2 + 3, py - 2, 1, 1);
      R('#ffffff', px + pw / 2 - 2, py - 3, 1, 1); R('#ffffff', px + pw / 2 + 2, py - 3, 1, 1); R('#ffffff', px + pw / 2 - 1, py - 4, 3, 1);
      box(px, py, pw, ph, '#c9935a', '#7a5232');
      R('#e2b27b', px, py, pw, 1); R('#a8743e', px, py + ph - 1, pw, 1);
      R('#7a5232', px + 2, py + 2, pw - 4, ph - 4);
      R('#d9eeff', px + 3, py + 3, pw - 6, ph - 6); R('#fff6e3', px + 3, py + 3 + Math.round((ph - 6) * 0.55), pw - 6, ph - 6 - Math.round((ph - 6) * 0.55));
      R('#ffffff', px + 5, py + 5, 4, 1); R('#ffffff', px + 4, py + 6, 6, 1);
      // a baguette leaning behind a round loaf
      const bx = px + 6, by = py + 7;
      for (let i = 0; i < 16; i++) { const yy = by + 6 - Math.round(i * 0.4); R('#9a5a24', bx + i, yy - 1, 1, 4); R('#e7a95a', bx + i, yy, 1, 2); }
      for (let i = 2; i < 15; i += 4) R('#fbe0a6', bx + i, by + 6 - Math.round(i * 0.4), 2, 1);
      put(BREAD, px + 9, py + ph - 10);
    } else {
      const pic = portrait ? { x: iw - 22, y: Math.round(ih * 0.3) } : { x: win.x + win.w + 13, y: 22 };
      box(pic.x, pic.y, 16, 13, '#c9935a', '#7a5232');
      R('#fff6e3', pic.x + 2, pic.y + 2, 12, 9); R('#d9eeff', pic.x + 2, pic.y + 2, 12, 4);
      put(BREAD, pic.x + 3, pic.y + 5);
    }

    // TV with the birthday number, on a wooden cabinet
    const tvCx = Math.round(portrait ? iw / 2 : iw * 0.3);
    const rw = Math.round(Math.min(iw * 0.6, 92)), rx = tvCx - Math.round(rw / 2), ry = floorY + 5;
    R('#ffffff', rx, ry - 1, rw, 1); R('#ffffff', rx, ry + 9, rw, 1);
    R('#6f9ff0', rx, ry, rw, 9); R('#9cc2ff', rx + 2, ry + 1, rw - 4, 7); R('#6f9ff0', rx + 4, ry + 3, rw - 8, 3);
    for (let X = rx + 6; X < rx + rw - 5; X += 4) R('#ffffff', X, ry + 4);
    const cw = plan ? 56 : 48, cx0 = tvCx - cw / 2, cy = floorY - 10;
    box(cx0, cy, cw, 12, '#c08d57', '#7a5232');
    R('#e2b27b', cx0, cy, cw, 2); R('#e8bd8a', cx0 + 1, cy + 3, cw / 2 - 2, 7); R('#e8bd8a', cx0 + cw / 2 + 1, cy + 3, cw / 2 - 2, 7);
    R('#8a5a2b', cx0 + cw / 2 - 3, cy + 6, 1, 2); R('#8a5a2b', cx0 + cw / 2 + 2, cy + 6, 1, 2);
    R('#7a5232', cx0 + 2, cy + 13, 2, 3); R('#7a5232', cx0 + cw - 4, cy + 13, 2, 3);
    const tw = plan ? TVW : 38, th = plan ? TVH : 24, tx0 = tvCx - tw / 2, ty0 = cy - th - 5;
    box(tx0, ty0, tw, th, '#2e3352', OUT);
    R('#bfe8a0', tx0 + 2, ty0 + 2, tw - 4, th - 4);
    for (let j = ty0 + 3; j < ty0 + th - 2; j += 2) R('#b3e192', tx0 + 2, j, tw - 4, 1);
    if (opt.age != null && opt.age !== '') {
      const num = foil(String(opt.age).slice(0, 4), plan && String(opt.age).length <= 2 ? 3 : 2);
      put(num, tvCx - Math.floor(num.width / 2), ty0 + Math.floor((th - num.height) / 2));
    } else put(HEART, tvCx - 4, ty0 + Math.round(th / 2) - 4);
    R('#e8ffd6', tx0 + 3, ty0 + 3, 4, 1); R('#e8ffd6', tx0 + 3, ty0 + 4, 1, 2);
    R('#fff4c8', cx0 + cw - 9, cy - 6, 5, 6); R('#ffffff', cx0 + cw - 8, cy - 5, 1, 2); R('#fffbe8', cx0 + cw - 10, cy - 5, 1, 4); R('#fffbe8', cx0 + cw - 4, cy - 5, 1, 4);
    put(PLANT, cx0 - 15, floorY - PLANT.height + 4);

    // floor lamp (glowing)
    if (!portrait) {
      const lx = 6, ly = wy - 26;
      R('#fff6d8', lx - 2, ly - 2, 14, 12);
      box(lx, ly, 10, 8, '#fff1c2', '#c9a06a'); R('#ffffff', lx + 1, ly + 1, 2, 5);
      R('#c9a06a', lx + 4, ly + 9, 2, floorY + 8 - ly - 9); R('#c9a06a', lx + 1, floorY + 8, 8, 1);
    }

    // HAPPY BIRTHDAY balloons on a tinsel curtain, with paper chains
    const ban = plan ? { x0: 4, x1: iw - 5, y0: plan.y0, y1: plan.y1 }
      : portrait ? { x0: 8, x1: iw - 8, y0: 14, y1: Math.round(ih * 0.21) }
      : { x0: Math.round(iw * 0.6), x1: iw - 8, y0: 16, y1: floorY - 3 };
    const TIN = ['#ffd1e8', '#d9ccff', '#c3e6ff', '#c8f5e1', '#ffffff', '#ffe9c2'];
    for (let X = ban.x0; X <= ban.x1; X++) {
      const bottom = ban.y1 - Math.floor(rnd() * 4);
      R(TIN[(X * 7 + (X >> 2)) % TIN.length], X, ban.y0, 1, bottom - ban.y0);
      for (let y = ban.y0 + ((X * 5) % 13); y < bottom; y += 13) R('#ffffff', X, y);
    }
    const RAINBOW = ['#ff9a9a', '#ffc78a', '#fff08a', '#9ee6a8', '#8ec5ff', '#c9a6ff'];
    for (let X = ban.x0 - 2, i = 0; X <= ban.x1; X += 3, i++) {
      const Y = ban.y0 - 2 + Math.round(Math.sin(((X - ban.x0) / (ban.x1 - ban.x0)) * Math.PI) * 3);
      const col = RAINBOW[i % 6];
      R(col, X, Y, 3, 1); R(col, X, Y + 2, 3, 1); R(col, X, Y + 1); R(col, X + 2, Y + 1);
    }
    for (const sx of [ban.x0 + 1, ban.x1 - 2]) for (let Y = ban.y0, i = 0; Y < ban.y1 - 4; Y += 3, i++) {
      const col = RAINBOW[i % 6]; R(col, sx, Y, 1, 3); R(col, sx + 2, Y, 1, 3); R(col, sx + 1, Y); R(col, sx + 1, Y + 2);
    }
    if (plan) {
      put(plan.a, (ban.x0 + ban.x1) / 2 - plan.a.width / 2, plan.ly);
      put(plan.b, (ban.x0 + ban.x1) / 2 - plan.b.width / 2, plan.ly + plan.a.height + 3);
    } else {
      const l1 = banner('HAPPY'), l2 = banner('BIRTHDAY');
      const ly0 = ban.y0 + Math.max(4, Math.round((Math.min(ban.y1, ban.y0 + 44) - ban.y0 - l1.height - l2.height - 4) / 2));
      put(l1, (ban.x0 + ban.x1) / 2 - l1.width / 2, ly0);
      put(l2, (ban.x0 + ban.x1) / 2 - l2.width / 2, ly0 + l1.height + 3);
    }

    // bunting + a paper chain swag across the ceiling
    const FLAG = ['#ff9ec4', '#7fb2ff', '#ffe27a', '#8fe3c4', '#c8aaff', '#ffffff'];
    const curve = (X, y0, sag) => y0 + Math.round(sag * Math.sin(Math.PI * (X / iw)));
    for (let X = 0, i = 0; X < iw; X += 3, i++) {
      const Y = curve(X, 4, 16), col = ['#ffc6a8', '#ffffff', '#ffb3c8'][i % 3];
      R(col, X, Y, 3, 1); R(col, X, Y + 2, 3, 1); R(col, X, Y + 1); R(col, X + 2, Y + 1);
    }
    for (let X = 0; X < iw; X++) R('#ffffff', X, curve(X, 3, 10));
    for (let X = 2, i = 0; X < iw - 6; X += 9, i++) {
      const Y = curve(X + 3, 3, 10) + 1, col = FLAG[i % FLAG.length];
      [7, 7, 5, 5, 3, 3, 1].forEach((w0, r) => R(col, X + (7 - w0) / 2, Y + r, w0, 1));
      R('rgba(43,39,69,.18)', X + 4, Y + 1, 2, 3);
    }
    if (plan && plan.swag) { // big pennants strung under the banner
      const base = ban.y1 - 2, sy = (X) => curve(X, base, 6);
      for (let X = 0; X < iw; X++) R('#ffffff', X, sy(X));
      for (let X = 1, i = 0; X < iw - 3; X += 11, i++) {
        const Y = sy(X + 4) + 1, col = FLAG[(i + 1) % FLAG.length];
        [9, 9, 7, 7, 5, 5, 3, 3, 1, 1].forEach((w0, r) => {
          const X0 = X + (9 - w0) / 2;
          R('#8aa6d4', X0 - 1, Y + r, w0 + 2, 1); R(col, X0, Y + r, w0, 1);
          if (r < 7) R('rgba(255,255,255,.55)', X0, Y + r, 1, 1);
        });
        R('#8aa6d4', X + 4, Y + 10);
        R('rgba(43,39,69,.15)', X + 5, Y + 1, 2, 5);
      }
    }

    // hanging stars
    if (plan) {
      const gapL = win.x + win.w + 3 + cur, gapR = iw - 35, mid = Math.round((gapL + gapR) / 2);
      const top = ban.y1 - 2;
      const hang = [[mid - 7, Math.round(win.y + win.h * 0.3 - top), STAR_BIG], [mid + 6, Math.round(win.y + win.h * 0.62 - top), STAR]];
      (gapR - gapL >= 30 ? hang : hang.slice(0, 1)).forEach(([X, len, img]) => {
        const sx = X + (img === STAR_BIG ? 6 : 5);
        R('#ffffff', sx, top, 1, len); put(img, X, top + len);
      });
    } else {
      const stars = portrait ? [[0.05, ban.y1, Math.round(ih * 0.2)], [0.86, ban.y1, Math.round(ih * 0.19)]] : [[0.335, 0, 18]];
      stars.forEach(([f, top, len]) => {
        const X = Math.round(iw * f);
        R('#ffffff', X + 4, top, 1, len); put(STAR, X, top + len);
      });
    }

    // party table (left) and sofa (right): proper furniture standing on the floor, with floor showing around them.
    // On tall phones they're drawn bigger and run off the screen edges.
    const floorH = ih - floorY, feet = Math.min(ih - 6, floorY + Math.round(floorH * 0.42)); // where the characters stand
    const big = !!plan, gs = big ? 5 : 4;
    const tW = Math.round(iw * (big ? 0.7 : portrait ? 0.4 : 0.26)), tb0 = big ? -Math.round(iw * 0.26) : 3, tb1 = tb0 + tW;
    const tBottom = feet - 3, tTop = tBottom - (big ? 30 : 20), hem = tTop + (big ? 14 : 10); // its feet sit behind hers, so she's in front of it
    R('rgba(110,60,20,.2)', tb0 - 1, tBottom - 1, tW + 2, 3);                       // shadow on the floor
    const legW = big ? 3 : 2;
    for (const lx of [tb0 + 3, tb1 - 3 - legW]) { R('#7a5232', lx - 1, hem, legW + 2, tBottom - hem); R('#b98a55', lx, hem, legW, tBottom - hem - 1); }
    R('#7a5232', tb0 + 7, hem, 1, Math.round((tBottom - hem) * 0.6)); R('#7a5232', tb1 - 8 - (big ? 3 : 0), hem, big ? 2 : 1, Math.round((tBottom - hem) * 0.6)); // back legs
    const items = big ? [[PRESENTS[2]], [PLATE], [MINI_CAKE], [HAT], [PRESENTS[0]], [PLATE]] : [[PLATE], [PRESENTS[0]], [MINI_CAKE], [HAT], [PRESENTS[1]], [PLATE], [HAT]];
    let ix = Math.max(tb0 + 2, 2);
    for (const [img] of items) {
      if (ix + img.width > tb1 - 1) break;
      put(img, ix, tTop + 2 - img.height + (img === PLATE ? 1 : 0));
      if (big && img === PRESENTS[2]) put(PRESENTS[1], ix + 1, tTop + 2 - img.height - PRESENTS[1].height + 3); // a stack of presents
      ix += img.width + (big ? 2 : 1);
    }
    R('#8aa6d4', tb0 - 1, tTop - 1, tW + 2, 1); R('#8aa6d4', tb0 - 1, tTop - 1, 1, hem - tTop + 2); R('#8aa6d4', tb1, tTop - 1, 1, hem - tTop + 2);
    R('#ffffff', tb0, tTop, tW, 3);
    for (let j = tTop + 3; j < hem; j++) for (let X = Math.max(tb0, 0); X < tb1; X++) { // blue gingham tablecloth
      const a = Math.floor((X - tb0) / gs) % 2, b = Math.floor((j - tTop) / gs) % 2;
      R(a && b ? '#b9d3fb' : a || b ? '#dde9fd' : '#ffffff', X, j);
    }
    for (let X = Math.max(tb0, 0); X < tb1; X++) { // scalloped hem
      const k = (X - tb0) % (big ? 6 : 4), sc = big ? k >= 1 && k <= 4 : k === 1 || k === 2;
      R(sc ? '#dde9fd' : '#8aa6d4', X, hem, 1, 1); if (sc) R('#8aa6d4', X, hem + 1, 1, 1);
      if (big && (k === 2 || k === 3)) { R('#dde9fd', X, hem + 1, 1, 1); R('#8aa6d4', X, hem + 2, 1, 1); }
    }
    R('#9fbbe3', tb0, tTop + 3, tW, 1);

    if (big) {
      // a big comfy sofa coming in from the right edge
      const sW = Math.round(iw * 0.8), sx0 = iw - Math.round(iw * 0.43), sx1 = sx0 + sW;
      const sBottom = feet - 3, sTop = sBottom - 38, seatY = sTop + 17, baseY = sTop + 26, legY = sBottom - 4;
      R('rgba(60,60,90,.2)', sx0 - 1, sBottom - 1, sW + 2, 3);
      for (const lx of [sx0 + 3, sx0 + 40]) R('#6b4a2c', lx, legY, 4, 4);
      box(sx0 + 9, sTop, sW - 18, 19, '#c5cbd8', '#7d8599'); R('#e0e4ec', sx0 + 9, sTop, sW - 18, 2);   // back cushions
      for (let X = sx0 + 9 + 26; X < sx1 - 9; X += 26) R('#a9b0c0', X, sTop + 2, 1, 16);
      box(sx0 + 9, seatY, sW - 18, 10, '#d0d5e0', '#7d8599'); R('#e6e9f0', sx0 + 9, seatY, sW - 18, 2);   // seat
      for (let X = sx0 + 9 + 26; X < sx1 - 9; X += 26) R('#a9b0c0', X, seatY + 2, 1, 8);
      box(sx0 + 4, baseY, sW - 8, legY - baseY, '#aeb5c5', '#7d8599');                                  // front base
      box(sx0, sTop + 9, 10, legY - sTop - 9, '#b3bacb', '#7d8599'); R('#d3d8e3', sx0 + 1, sTop + 9, 8, 3); R('#9aa2b5', sx0 + 9, sTop + 12, 1, legY - sTop - 13); // arm
      const bx0 = sx0 + 13, bw0 = 26;                                                                  // checkered blanket over the back
      for (let j = 0; j < 22; j++) for (let i = 0; i < bw0; i++) R(((i >> 2) + (j >> 2)) % 2 ? '#f6f1dd' : '#a6cf8b', bx0 + i, sTop + 1 + j);
      for (let i = 0; i < bw0; i += 2) R('#f6f1dd', bx0 + i, sTop + 23);
      R('#7e9f6a', bx0 - 1, sTop + 1, 1, 22); R('#7e9f6a', bx0 + bw0, sTop + 1, 1, 22);
      const pl = sx0 + 13 + bw0 + 4;                                                                  // a square grey cushion
      box(pl, sTop + 3, 14, 14, '#8f9298', '#585b63'); R('#a5a8ae', pl + 1, sTop + 4, 12, 1); R('#7f8288', pl + 1, sTop + 15, 12, 1);
    } else {
      const sW = Math.min(Math.round(iw * (portrait ? 0.4 : 0.3)), 84), sx0 = iw - sW - 3, sx1 = sx0 + sW;
      const sBottom = feet - 3, sTop = sBottom - 26, seatY = sTop + 12, baseY = sTop + 19, legY = sBottom - 3;
      R('rgba(60,60,90,.2)', sx0 - 1, sBottom - 1, sW + 2, 3);                        // shadow
      for (const lx of [sx0 + 2, sx1 - 5]) R('#6b4a2c', lx, legY, 3, 3);              // little wooden feet
      box(sx0 + 6, sTop, sW - 12, 13, '#c5cbd8', '#7d8599');                          // back cushions
      R('#e0e4ec', sx0 + 6, sTop, sW - 12, 2);
      for (let X = sx0 + 6 + Math.round((sW - 12) / 2); X < sx1 - 6; X += 99) R('#a9b0c0', X, sTop + 2, 1, 10);
      box(sx0 + 6, seatY, sW - 12, 7, '#d0d5e0', '#7d8599'); R('#e6e9f0', sx0 + 6, seatY, sW - 12, 2);   // seat
      R('#a9b0c0', sx0 + 6 + Math.round((sW - 12) / 2), seatY + 2, 1, 5);
      box(sx0 + 3, baseY, sW - 6, legY - baseY, '#aeb5c5', '#7d8599');               // front base
      for (const ax of [sx0, sx1 - 7]) { box(ax, sTop + 6, 7, legY - sTop - 6, '#b3bacb', '#7d8599'); R('#d3d8e3', ax + 1, sTop + 6, 5, 2); } // arms
      const bx0 = sx0 + 9, bw0 = Math.min(22, sW - 30);                                // checkered blanket over the back
      for (let j = 0; j < 15; j++) for (let i = 0; i < bw0; i++) R(((i / 3 | 0) + (j / 3 | 0)) % 2 ? '#f6f1dd' : '#a6cf8b', bx0 + i, sTop + 1 + j);
      for (let i = 0; i < bw0; i += 2) R('#f6f1dd', bx0 + i, sTop + 16);
      if (sW - 30 - bw0 > 14) { box(sx1 - 21, sTop + 2, 10, 10, '#8f9298', '#585b63'); R('#a5a8ae', sx1 - 20, sTop + 3, 8, 1); R('#7f8288', sx1 - 20, sTop + 10, 8, 1); } // a square grey cushion
    }

    // balloons are drawn every frame so they can bob (sx/sy: where the string starts on the sprite)
    const balloons = [];
    if (plan) { // two big bunches in the top corners, just below the HUD
      const bunch = [[-3, -7, 0], [8, -3, 2], [0, 4, 4], [12, 7, 1]];
      for (const side of [0, 1]) bunch.forEach(([dx, dy, pal], i) => {
        const img = BALLOONS_BIG[(pal + side * 3) % BALLOONS_BIG.length];
        balloons.push({ x: side ? iw - img.width - dx : dx, y: T + dy, img, phase: side * 2 + i * 1.3, str: 5 + ((i * 3) % 6), sx: 6, sy: 14 });
      });
    } else {
      const clusters = portrait ? [[0.06, 0.3], [0.7, 0.96]] : [[0.02, 0.2], [0.42, 0.56], [0.8, 0.98]];
      clusters.forEach(([a, b]) => {
        const n = Math.max(3, Math.round((b - a) * iw / 9));
        for (let i = 0; i < n; i++) {
          balloons.push({ x: Math.round(iw * a + rnd() * (b - a) * iw - 4), y: Math.round(rnd() * 10) - 2, img: BALLOONS[(rnd() * BALLOONS.length) | 0], phase: rnd() * 6.28, str: 4 + ((rnd() * 8) | 0), sx: 4, sy: 9 });
        }
      });
    }
    balloons.sort((p, q) => p.y - q.y);
    return { canvas: c, floorY, balloons, tinsel: ban, tv: { x: tx0 + 2, y: ty0 + 2, w: tw - 4, h: th - 4 } };
  }

  /* ---------------- envelope ---------------- */
  function envelope(open) {
    const c = mk(32, 34), x = ctxOf(c), by = 12;
    const R = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    if (open) {
      for (let r = 0; r <= 12; r++) { const hw = Math.round((r / 12) * 16); R('#5b9cff', 16 - hw, r, hw * 2, 1); }
      R('#3d7cf0', 0, by, 32, 22);
      R('#fffaf0', 4, 3, 24, 22); R('#c9d6ee', 7, 7, 18, 1); R('#c9d6ee', 7, 10, 14, 1); R('#c9d6ee', 7, 13, 16, 1);
      R('#ff6b98', 14, 16, 2, 2); R('#ff6b98', 17, 16, 2, 2); R('#ff6b98', 14, 18, 5, 1); R('#ff6b98', 15, 19, 3, 1); R('#ff6b98', 16, 20, 1, 1);
      for (let yy = by; yy < 34; yy++) for (let xx = 0; xx < 32; xx++) {
        if (yy >= by + 6 + (16 - Math.abs(xx - 15.5)) * 0.4) R(yy === 33 ? '#1d48c4' : '#8ec5ff', xx, yy);
      }
    } else {
      R('#8ec5ff', 0, by, 32, 22); R('#1d48c4', 0, 33, 32, 1);
      for (let r = 0; r <= 12; r++) { const hw = Math.round(((12 - r) / 12) * 16); R('#5b9cff', 16 - hw, by + r, hw * 2, 1); }
      R('#ff6b98', 13, by + 9, 2, 2); R('#ff6b98', 17, by + 9, 2, 2); R('#ff6b98', 13, by + 11, 6, 1); R('#ff6b98', 14, by + 12, 4, 1); R('#ff6b98', 15, by + 13, 2, 1);
      R('#ffffff', 13, by + 9);
    }
    return outline(c, '#13204a'); // 34x36
  }

  /* ---------------- the icing close-up (drawn with finer pixels than the room) ---------------- */
  const CU = (() => {
    const cache = new Map();
    const memo = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };
    const pick = (b, steps) => { for (const [lim, col] of steps) if (b >= lim) return col; return steps[steps.length - 1][1]; };
    // a star-tip cream swirl, piped in stages (s = 1…5, 5 = finished with its little curled peak)
    function rosette(r, s) {
      return memo(`ros${r}-${s}`, () => {
        const rr = r * [0.4, 0.58, 0.74, 0.88, 1][s - 1], ry = rr * 0.82, size = Math.ceil(r * 2) + 5, c = mk(size, size), x = ctxOf(c), cx = size / 2 - 0.5, cy = size / 2 - 0.5;
        const inside = (i, j) => ((i - cx) / rr) ** 2 + ((j - cy) / ry) ** 2 <= 1;
        for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
          if (!inside(i, j)) continue;
          const dx = (i - cx) / rr, dy = (j - cy) / ry, rho = Math.min(1, Math.hypot(dx, dy)), th = Math.atan2(dy, dx);
          const ridge = Math.cos(6 * (th + 2.4 * rho) - s * 0.7);
          const b = 0.8 - 0.22 * (dx + dy) * 0.7 + 0.13 * ridge * (0.4 + rho) - 0.28 * rho ** 3;
          x.fillStyle = pick(b, [[0.9, '#ffffff'], [0.78, '#fffbf5'], [0.66, '#f8f0e5'], [0.54, '#eee3d2'], [-9, '#e0d0b9']]);
          x.fillRect(i, j, 1, 1);
        }
        for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { // soft outline, darker underneath
          if (inside(i, j)) continue;
          if (inside(i - 1, j) || inside(i + 1, j) || inside(i, j - 1) || inside(i, j + 1)) { x.fillStyle = j > cy ? '#c9b195' : '#e0cdb4'; x.fillRect(i, j, 1, 1); }
        }
        if (s === 5) { // the curled peak where the nozzle lifted off
          const px = Math.round(cx - rr * 0.15), py = Math.round(cy - ry * 0.3);
          x.fillStyle = '#ffffff'; x.fillRect(px, py, 2, 1); x.fillRect(px + 1, py - 1, 1, 1);
          x.fillStyle = '#e6d7c2'; x.fillRect(px, py + 1, 2, 1);
        }
        return c;
      });
    }
    // a strawberry seen from above: whole (lying on its side, leafy top) or halved (cut side up), at any angle
    function berry(sr, kind, ang) {
      return memo(`berry${sr}-${kind}-${ang.toFixed(2)}`, () => {
        const size = Math.ceil(sr * 3.2) + 4, c = mk(size, size), x = ctxOf(c), cx = size / 2 - 0.5, cy = size / 2 - 0.5;
        const ca = Math.cos(ang), sa = Math.sin(ang), tipL = 1.35 * sr, topL = kind === 'half' ? 0.95 * sr : 0.85 * sr, W = 0.92 * sr;
        const hw = (u) => (u < 0 ? W * (1 - 0.62 * (-u / tipL)) * Math.sqrt(Math.max(0, 1 - (u / tipL) ** 6)) : W * Math.sqrt(Math.max(0, 1 - (u / topL) ** 2)));
        const local = (i, j) => { const dx = i - cx, dy = j - cy; return [dx * ca + dy * sa, -dx * sa + dy * ca]; };
        const inside = (i, j) => { const [u, v] = local(i, j); return u >= -tipL && u <= topL && Math.abs(v) <= hw(u); };
        for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
          if (!inside(i, j)) continue;
          const [u, v] = local(i, j), e = Math.abs(v) / Math.max(0.5, hw(u)), nx = (i - cx) / sr, ny = (j - cy) / sr;
          let col;
          if (kind === 'half') { // cut face: red skin at the rim, pink flesh, a pale heart down the middle
            const rim = e > 0.78 || u < -tipL + 1.4 || u > topL - 1.2;
            const core = Math.abs(v) < 0.22 * sr && u > -tipL * 0.75 && u < topL * 0.6;
            col = rim ? (e > 0.9 ? '#c22a44' : '#e8405a') : core ? '#fff1f3' : e > 0.55 ? '#ff8fa3' : e > 0.3 ? '#ffb3c1' : '#ffd6dc';
            if (!rim && !core && ((Math.round(u * 1.7) + Math.round(v * 1.7)) % 7 === 0)) col = '#ffc4cf';
          } else {
            const b = 0.62 - 0.22 * nx - 0.26 * ny - 0.3 * e * e;
            col = pick(b, [[0.78, '#ff7a8c'], [0.6, '#f04a63'], [0.42, '#d93450'], [0.26, '#bd2741'], [-9, '#9c1d36']]);
            const gu = (u + tipL) / 2.3, gv = v / 2.3; // seeds in a little diamond lattice
            if (Math.abs(gu - Math.round(gu)) < 0.22 && Math.abs(gv - Math.round(gv) - (Math.round(gu) % 2) * 0.5) < 0.22 && e < 0.85) col = b > 0.55 ? '#ffe9a0' : '#e8c048';
          }
          x.fillStyle = col; x.fillRect(i, j, 1, 1);
        }
        for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { // outline
          if (inside(i, j)) continue;
          if (inside(i - 1, j) || inside(i + 1, j) || inside(i, j - 1) || inside(i, j + 1)) { x.fillStyle = kind === 'half' ? '#9a2234' : '#7a1828'; x.fillRect(i, j, 1, 1); }
        }
        if (kind !== 'half') {
          // a glossy highlight
          const hx = Math.round(cx - sr * 0.35), hy = Math.round(cy - sr * 0.4);
          x.fillStyle = '#ffd3da'; x.fillRect(hx, hy, 2, 1); x.fillStyle = '#ffffff'; x.fillRect(hx, hy, 1, 1);
          // the leafy green top
          const tx = cx + ca * topL * 0.85, ty = cy + sa * topL * 0.85;
          for (const da of [0, 0.95, -0.95, 2.1, -2.1]) {
            const a2 = ang + da, len = sr * (Math.abs(da) > 2 ? 0.55 : 0.7);
            for (let k = 0; k <= len; k += 0.5) {
              const px = Math.round(tx + Math.cos(a2) * k), py = Math.round(ty + Math.sin(a2) * k);
              x.fillStyle = k < len * 0.4 ? '#2f7a43' : '#43a85c'; x.fillRect(px, py, 1, 1);
              if (k < len * 0.6) { x.fillStyle = '#2f7a43'; x.fillRect(px + (Math.abs(Math.sin(a2)) > 0.7 ? 1 : 0), py + (Math.abs(Math.sin(a2)) > 0.7 ? 0 : 1), 1, 1); }
            }
          }
          x.fillStyle = '#7ad37a'; x.fillRect(Math.round(tx), Math.round(ty), 1, 1);
          x.fillStyle = '#255c33'; x.fillRect(Math.round(tx + ca), Math.round(ty + sa), 1, 1);
        }
        return c;
      });
    }
    // a pale blue bowl from above
    function bowl(R) {
      return memo(`bowl${R}`, () => {
        const size = R * 2 + 4, c = mk(size, size), x = ctxOf(c), cx = size / 2 - 0.5, cy = size / 2 - 0.5;
        for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
          const d = Math.hypot(i - cx, j - cy);
          if (d > R + 1) continue;
          let col;
          if (d > R) col = '#5b7fc0';
          else if (d > R - 3) col = (i - cx) + (j - cy) < -R * 0.3 ? '#ffffff' : (i - cx) + (j - cy) > R * 0.6 ? '#a9c8f5' : '#d5e6ff';
          else if (d > R - 4) col = '#8aaee6';
          else { const sh = (j - cy) / R; col = sh < -0.35 ? '#9fc0f0' : sh < 0.2 ? '#b5d1f7' : '#c6dcfa'; }
          x.fillStyle = col; x.fillRect(i, j, 1, 1);
        }
        return c;
      });
    }
    // the piping bag (nozzle down), and a squeezed version of it
    function pipingBag(h, squeezed) {
      return memo(`bag${h}-${squeezed ? 1 : 0}`, () => {
        const w = Math.round(h * 0.62), c = mk(w + 2, h + 2), x = ctxOf(c), cx = (w + 2) / 2;
        const top = 1, cuff = Math.round(h * 0.16), coneEnd = Math.round(h * 0.82);
        for (let j = 0; j <= coneEnd; j++) {
          const t = j / coneEnd, half = (w / 2) * (1 - t * 0.82) * (squeezed && t > 0.2 && t < 0.7 ? 0.86 : 1);
          for (let i = Math.round(cx - half); i <= Math.round(cx + half); i++) {
            const e = (i - (cx - half)) / Math.max(1, half * 2);
            let col = j < cuff ? (j < 2 ? '#bcd7ff' : e < 0.3 ? '#9cc3ff' : '#7fb2ff') : t > 0.45 ? (e < 0.35 ? '#fff7ec' : e > 0.8 ? '#efe2cf' : '#fdf1e2') : (e < 0.3 ? '#ffffff' : e > 0.8 ? '#e3e9f3' : '#f5f8fc');
            if (j === cuff) col = '#5b8fe0';
            x.fillStyle = col; x.fillRect(i, j + top, 1, 1);
          }
        }
        x.fillStyle = '#9fb2cf'; // outline of the cone
        for (let j = 0; j <= coneEnd; j++) { const t = j / coneEnd, half = (w / 2) * (1 - t * 0.82) * (squeezed && t > 0.2 && t < 0.7 ? 0.86 : 1); x.fillRect(Math.round(cx - half) - 1, j + top, 1, 1); x.fillRect(Math.round(cx + half) + 1, j + top, 1, 1); }
        x.fillRect(Math.round(cx - w / 2), top - 1 + 1, w + 1, 1);
        const nz = Math.max(2, Math.round(w * 0.16)); // the star nozzle
        for (let j = coneEnd; j < h; j++) {
          const half = nz * (1 - (j - coneEnd) / (h - coneEnd) * 0.5);
          for (let i = Math.round(cx - half); i <= Math.round(cx + half); i++) { x.fillStyle = (i + j) % 2 ? '#c9d1e3' : '#eef2f8'; x.fillRect(i, j + top, 1, 1); }
          x.fillStyle = '#7d8599'; x.fillRect(Math.round(cx - half) - 1, j + top, 1, 1); x.fillRect(Math.round(cx + half) + 1, j + top, 1, 1);
        }
        return c;
      });
    }
    // a sugar sifter from above: a round mesh with a little handle
    function sifter(R) {
      return memo(`sift${R}`, () => {
        const size = R * 2 + 4, c = mk(size + R + 2, size), x = ctxOf(c), cx = size / 2 - 0.5, cy = size / 2 - 0.5;
        x.fillStyle = '#7d8599'; x.fillRect(size - 2, Math.round(cy) - 2, R + 3, 5); x.fillStyle = '#c9d1e3'; x.fillRect(size - 2, Math.round(cy) - 1, R + 2, 3);
        for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
          const d = Math.hypot(i - cx, j - cy);
          if (d > R + 1) continue;
          let col = d > R ? '#6b7389' : d > R - 2 ? ((i - cx) + (j - cy) < 0 ? '#eef2f8' : '#aeb7cb') : (i + j) % 3 === 0 || (i - j + 99) % 3 === 0 ? '#b8c2d6' : ((i * 7 + j * 3) % 5 === 0 ? '#ffffff' : '#f4f6fb');
          x.fillStyle = col; x.fillRect(i, j, 1, 1);
        }
        return c;
      });
    }
    // a soft oval shadow (darker in the middle, dithered at the edge)
    function shadow(rx, ry, col = '90,45,15') {
      rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry));
      return memo(`sh${rx}x${ry}${col}`, () => {
        const c = mk(rx * 2 + 1, ry * 2 + 1), x = ctxOf(c);
        for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
          const e = (i / (rx + 0.5)) ** 2 + (j / (ry + 0.5)) ** 2;
          if (e > 1 || (e > 0.75 && (i + j) % 2)) continue;
          x.fillStyle = `rgba(${col},${e < 0.45 ? 0.26 : 0.16})`; x.fillRect(i + rx, j + ry, 1, 1);
        }
        return c;
      });
    }
    // powdered sugar settling on a strawberry: its shape in white, drawn over it a little at a time
    const frost = (sr, kind, ang) => memo(`frost${sr}-${kind}-${ang.toFixed(2)}`, () => silhouette(berry(sr, kind, ang), '#ffffff'));
    // the piping bag, put down on the counter on its side
    function bagDown(h) {
      return memo(`bagdown${h}`, () => {
        const src = pipingBag(h, false), c = mk(src.height + 4, src.width + 4), x = ctxOf(c);
        x.translate(c.width / 2, c.height / 2); x.rotate(-Math.PI / 2 - 0.12); x.drawImage(src, -src.width / 2, -src.height / 2);
        const d = x.getImageData(0, 0, c.width, c.height), a = d.data; // keep it crisp: no half-see-through pixels
        for (let i = 3; i < a.length; i += 4) a[i] = a[i] > 110 ? 255 : 0;
        x.setTransform(1, 0, 0, 1, 0, 0); x.putImageData(d, 0, 0);
        return c;
      });
    }
    return { rosette, berry, bowl, pipingBag, sifter, shadow, frost, bagDown };
  })();

  return {
    OUT, mk, spr, outline, flip, silhouette, foil, textWidth, seeded,
    girl, GIRL_W, GIRL_H, GRIP, baguette, buildCake, buildRoom, envelope,
    STRAW, HEART, STAR, CREAM_HAND,
    zech, zechWhisk, ZECH_W, ZECH_H, BOWLS, WHISKS, STRAW_O, GOLD_STRAW, TOAST, counter, SPONGE, CU,
  };
})();
