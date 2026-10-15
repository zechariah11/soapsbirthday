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
  function banner(str) {
    str = String(str).toUpperCase();
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

  /* ---------------- little Princess Soap ---------------- */
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
    };
  }

  /* ---------------- kitchen props for the mini-games ---------------- */
  const BOWL_ROWS = ['WWWWWWWWWWWWWWWW', 'bBBBBBBBBBBBBBBb', '.bBBhBBBBBBBBBb.', '..bBBBBBBBBBBb..', '...bbbbbbbbbb...', '.....ffffff.....'];
  const BOWLS = {
    soap: outline(spr(BOWL_ROWS, { W: '#ffffff', B: '#a9d0ff', b: '#7fb2f0', h: '#e4f2ff', f: '#7fb2f0' })),
    zech: outline(spr(BOWL_ROWS, { W: '#f4f6fa', B: '#c9ced8', b: '#9aa1b0', h: '#eef0f5', f: '#9aa1b0' })),
  };
  const WHISK_ROWS = ['...h...', '...h...', '...h...', '...h...', '..www..', '.w.w.w.', 'w..w..w', 'w..w..w', 'w..w..w', '.w.w.w.', '..www..'];
  const WHISKS = {
    soap: outline(spr(WHISK_ROWS, { h: '#ff9ec4', w: '#dfe4ee' }), '#5b6380'),
    zech: outline(spr(WHISK_ROWS, { h: '#5a6b45', w: '#dfe4ee' }), '#5b6380'),
  };
  const STRAW_O = outline(STRAW);
  const GOLD_STRAW = outline(spr(['..gGg..', '.YgYgY.', 'YhYYYYY', 'YYwYYwY', 'YwYYYYY', '.YYYwY.', '..YYY..'],
    { Y: '#ffcf3a', h: '#fff4b8', w: '#fffbe6', g: '#3d9a52', G: '#7ad37a' }), '#9a6a1a');
  const TOAST = outline(spr(['.dddddd.', 'dTTTTTTd', 'dTkTTkTd', 'dTTkkTTd', 'dTkTTTTd', 'dTTTTkTd', '.dddddd.'],
    { d: '#4a2a14', T: '#6b3a1c', k: '#231510' }), '#120a06');
  const counterCache = new Map();
  function counter(w, h, cloth) { // little kitchen counter: wooden top, gingham cloth front
    const key = `${w}x${h}${cloth}`;
    if (counterCache.has(key)) return counterCache.get(key);
    const c = mk(w, h), x = ctxOf(c);
    const [a, b, d] = cloth === 'soap' ? ['#ffffff', '#cfe2ff', '#a9c8f5'] : ['#f3ecd8', '#d9cda6', '#b9ab82'];
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
    const R = (col, X, Y, w = 1, h = 1) => { if (w > 0 && h > 0) { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); } };
    const put = (img, X, Y) => x.drawImage(img, Math.round(X), Math.round(Y));
    const box = (X, Y, w, h, fillCol, line) => { R(line, X - 1, Y - 1, w + 2, h + 2); R(fillCol, X, Y, w, h); };
    const portrait = ih > iw * 1.1;
    const floorY = Math.round(ih * (portrait ? 0.7 : 0.67));
    const wy = floorY - 16;

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
    const win = portrait ? { x: 7, y: Math.round(ih * 0.27), w: 22, h: 28 } : { x: 18, y: 14, w: 30, h: 32 };
    R('#b98a55', win.x - 9, win.y - 5, win.w + 18, 2);
    box(win.x - 2, win.y - 2, win.w + 4, win.h + 4, '#ffffff', '#8aa6d4');
    R('#a8dcff', win.x, win.y, win.w, win.h); R('#c6e9ff', win.x, win.y + Math.round(win.h * 0.6), win.w, Math.round(win.h * 0.4));
    for (const [cx, cy] of [[0.25, 0.25], [0.7, 0.55]]) {
      const X = win.x + Math.round(win.w * cx), Y = win.y + Math.round(win.h * cy);
      R('#ffffff', X, Y, 7, 2); R('#ffffff', X + 2, Y - 1, 3, 1); R('#ffffff', X - 1, Y + 1, 9, 1);
    }
    R('#ffffff', win.x + Math.floor(win.w / 2) - 1, win.y, 2, win.h); R('#ffffff', win.x, win.y + Math.floor(win.h / 2) - 1, win.w, 2);
    R('#e8f6ff', win.x + 2, win.y + 2, 1, 4); R('#e8f6ff', win.x + 3, win.y + 2, 1, 2);
    R('#ffffff', win.x - 5, win.y + win.h + 2, win.w + 10, 2); R('#c9d6ea', win.x - 5, win.y + win.h + 4, win.w + 10, 1);
    for (const side of [0, 1]) {
      for (let j = 0; j < win.h + 8; j++) {
        const w0 = 6 + Math.round(Math.sin(j / 5) * 1) + (j > win.h ? 1 : 0);
        const X = side ? win.x + win.w + 3 - (w0 - 6) : win.x - 3 - 6;
        R('#ffb7cf', X, win.y - 3 + j, w0, 1);
        R('#ef8db3', X + (side ? 1 : 4), win.y - 3 + j, 1, 1);
      }
    }

    // framed bread picture (she loves bread)
    const pic = portrait ? { x: iw - 22, y: Math.round(ih * 0.3) } : { x: win.x + win.w + 13, y: 22 };
    box(pic.x, pic.y, 16, 13, '#c9935a', '#7a5232');
    R('#fff6e3', pic.x + 2, pic.y + 2, 12, 9); R('#d9eeff', pic.x + 2, pic.y + 2, 12, 4);
    put(BREAD, pic.x + 3, pic.y + 5);

    // TV with the birthday number, on a wooden cabinet
    const tvCx = Math.round(portrait ? iw / 2 : iw * 0.3);
    const rw = Math.round(Math.min(iw * 0.6, 92)), rx = tvCx - Math.round(rw / 2), ry = floorY + 5;
    R('#ffffff', rx, ry - 1, rw, 1); R('#ffffff', rx, ry + 9, rw, 1);
    R('#6f9ff0', rx, ry, rw, 9); R('#9cc2ff', rx + 2, ry + 1, rw - 4, 7); R('#6f9ff0', rx + 4, ry + 3, rw - 8, 3);
    for (let X = rx + 6; X < rx + rw - 5; X += 4) R('#ffffff', X, ry + 4);
    const cw = 48, cx0 = tvCx - 24, cy = floorY - 10;
    box(cx0, cy, cw, 12, '#c08d57', '#7a5232');
    R('#e2b27b', cx0, cy, cw, 2); R('#e8bd8a', cx0 + 1, cy + 3, cw / 2 - 2, 7); R('#e8bd8a', cx0 + cw / 2 + 1, cy + 3, cw / 2 - 2, 7);
    R('#8a5a2b', cx0 + cw / 2 - 3, cy + 6, 1, 2); R('#8a5a2b', cx0 + cw / 2 + 2, cy + 6, 1, 2);
    R('#7a5232', cx0 + 2, cy + 13, 2, 3); R('#7a5232', cx0 + cw - 4, cy + 13, 2, 3);
    const tw = 38, th = 24, tx0 = tvCx - 19, ty0 = cy - th - 5;
    box(tx0, ty0, tw, th, '#2e3352', OUT);
    R('#bfe8a0', tx0 + 2, ty0 + 2, tw - 4, th - 4);
    for (let j = ty0 + 3; j < ty0 + th - 2; j += 2) R('#b3e192', tx0 + 2, j, tw - 4, 1);
    if (opt.age != null && opt.age !== '') {
      const num = foil(String(opt.age).slice(0, 4), 2);
      put(num, tvCx - Math.floor(num.width / 2), ty0 + Math.floor((th - num.height) / 2));
    } else put(HEART, tvCx - 4, ty0 + 8);
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
    const ban = portrait
      ? { x0: 8, x1: iw - 8, y0: 14, y1: Math.round(ih * 0.21) }
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
    const l1 = banner('HAPPY'), l2 = banner('BIRTHDAY');
    const ly0 = ban.y0 + Math.max(4, Math.round((Math.min(ban.y1, ban.y0 + 44) - ban.y0 - l1.height - l2.height - 4) / 2));
    put(l1, (ban.x0 + ban.x1) / 2 - l1.width / 2, ly0);
    put(l2, (ban.x0 + ban.x1) / 2 - l2.width / 2, ly0 + l1.height + 3);

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
    // hanging stars
    const stars = portrait ? [[0.05, ban.y1, Math.round(ih * 0.2)], [0.86, ban.y1, Math.round(ih * 0.19)]] : [[0.335, 0, 18]];
    stars.forEach(([f, top, len]) => {
      const X = Math.round(iw * f);
      R('#ffffff', X + 4, top, 1, len); put(STAR, X, top + len);
    });

    // party table (left) and sofa (right): proper furniture standing on the floor, with floor showing around them
    const floorH = ih - floorY;
    const tW = Math.round(iw * (portrait ? 0.4 : 0.26)), tb0 = 3, tb1 = tb0 + tW;
    const tBottom = floorY + Math.round(floorH * 0.55), tTop = tBottom - 20, hem = tTop + 10;
    R('rgba(110,60,20,.2)', tb0 - 1, tBottom - 1, tW + 2, 3);                       // shadow on the floor
    for (const lx of [tb0 + 3, tb1 - 5]) { R('#7a5232', lx - 1, hem, 4, tBottom - hem); R('#b98a55', lx, hem, 2, tBottom - hem - 1); }
    R('#7a5232', tb0 + 7, hem, 1, Math.round((tBottom - hem) * 0.6)); R('#7a5232', tb1 - 8, hem, 1, Math.round((tBottom - hem) * 0.6)); // back legs
    const items = [[PLATE], [PRESENTS[0]], [MINI_CAKE], [HAT], [PRESENTS[1]], [PLATE], [HAT]];
    let ix = tb0 + 2;
    for (const [img] of items) {
      if (ix + img.width > tb1 - 1) break;
      put(img, ix, tTop + 2 - img.height + (img === PLATE ? 1 : 0));
      ix += img.width + 1;
    }
    R('#8aa6d4', tb0 - 1, tTop - 1, tW + 2, 1); R('#8aa6d4', tb0 - 1, tTop - 1, 1, hem - tTop + 2); R('#8aa6d4', tb1, tTop - 1, 1, hem - tTop + 2);
    R('#ffffff', tb0, tTop, tW, 3);
    for (let j = tTop + 3; j < hem; j++) for (let X = tb0; X < tb1; X++) { // blue gingham tablecloth
      const a = ((X - tb0) >> 2) % 2, b = ((j - tTop) >> 2) % 2;
      R(a && b ? '#b9d3fb' : a || b ? '#dde9fd' : '#ffffff', X, j);
    }
    for (let X = tb0; X < tb1; X++) { const sc = (X - tb0) % 4 === 1 || (X - tb0) % 4 === 2; R(sc ? '#dde9fd' : '#8aa6d4', X, hem, 1, 1); if (sc) R('#8aa6d4', X, hem + 1, 1, 1); } // scalloped hem
    R('#9fbbe3', tb0, tTop + 3, tW, 1);

    const sW = Math.min(Math.round(iw * (portrait ? 0.4 : 0.3)), 84), sx0 = iw - sW - 3, sx1 = sx0 + sW;
    const sBottom = floorY + Math.round(floorH * 0.6), sTop = sBottom - 26, seatY = sTop + 12, baseY = sTop + 19, legY = sBottom - 3;
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
    if (sW - 30 - bw0 > 14) { box(sx1 - 22, sTop + 4, 11, 8, '#eef0f5', '#7d8599'); R('#ffffff', sx1 - 21, sTop + 5, 3, 1); } // pillow

    // balloons are drawn every frame so they can bob
    const balloons = [];
    const clusters = portrait ? [[0.06, 0.3], [0.7, 0.96]] : [[0.02, 0.2], [0.42, 0.56], [0.8, 0.98]];
    clusters.forEach(([a, b]) => {
      const n = Math.max(3, Math.round((b - a) * iw / 9));
      for (let i = 0; i < n; i++) {
        balloons.push({ x: Math.round(iw * a + rnd() * (b - a) * iw - 4), y: Math.round(rnd() * 10) - 2, img: BALLOONS[(rnd() * BALLOONS.length) | 0], phase: rnd() * 6.28, str: 4 + ((rnd() * 8) | 0) });
      }
    });
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

  return {
    OUT, mk, spr, outline, flip, silhouette, foil, textWidth, seeded,
    girl, GIRL_W, GIRL_H, GRIP, baguette, buildCake, buildRoom, envelope,
    STRAW, HEART, STAR,
    zech, zechWhisk, ZECH_W, ZECH_H, BOWLS, WHISKS, STRAW_O, GOLD_STRAW, TOAST, counter,
  };
})();
