(() => {
  const C = Object.assign({
    name: 'you', from: 'me', hitsToBreak: 10, cakeName: 'strawberry cake',
    intro: '', letter: [], background: 'assets/party.jpg', sprite: 'assets/kid.png', hand: [4, 53],
  }, window.BIRTHDAY || {});

  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cv = $('#game'), g = cv.getContext('2d');

  /* ================= pixel-art helpers ================= */
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function fromRows(rows, pal) {
    const c = mk(rows[0].length, rows.length), x = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } }));
    return c;
  }
  function silhouette(src, color) {
    const c = mk(src.width, src.height), x = c.getContext('2d');
    x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in';
    x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function outline(src, color = '#1a1530') {
    const c = mk(src.width + 2, src.height + 2), x = c.getContext('2d'), s = silhouette(src, color);
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) x.drawImage(s, dx, dy);
    x.drawImage(src, 1, 1);
    return c;
  }
  function seeded(s) { return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }
  function line(x, x0, y0, x1, y1, col) { // bresenham, crisp pixels
    x.fillStyle = col;
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
    for (;;) {
      x.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }

  /* ================= sprites ================= */
  const STRAW = fromRows([
    '..g.g..',
    '.ggGgg.',
    '.RRgRR.',
    'RRrRRRR',
    'RyRRRyR',
    'RRRyRRR',
    '.RRRRR.',
    '..RRR..',
  ], { g: '#2f8f4a', G: '#6cd06b', R: '#e8344e', r: '#ffb0b8', y: '#ffd99a' });
  const HALF = fromRows([
    '.RRRRR.',
    'RRpppRR',
    'RpPWPpR',
    'RRpPpRR',
    '.RRpRR.',
    '..RRR..',
  ], { R: '#e02e4a', p: '#ff8fa0', P: '#ffc2cb', W: '#fff1f3' });
  const BOW = fromRows([
    'BB.....BB',
    'BbB.K.BbB',
    'BbbBKBbbB',
    'BbB.K.BbB',
    'BB.....BB',
  ], { B: '#2f6bff', b: '#9fd0ff', K: '#163a9e' });
  const FACE = {
    happy: fromRows(['.K.......K.', 'K.K.....K.K', '...........', 'pp..K.K..pp', '....KKK....'], { K: '#3a1424', p: '#ff7fa6' }),
    ouch: fromRows(['K.........K', '.K.......K.', 'K.........K', 'pp..KKK..pp', '....K.K....', '....KKK....'], { K: '#3a1424', p: '#ff7fa6' }),
  };

  // the massive Sungsimdang 딸기시루: cream + sponge + strawberry layers, buried in strawberries
  function buildCake() {
    const W = 84, top = 18, bodyH = 50, H = top + bodyH + 4;
    const raw = mk(W, H), x = raw.getContext('2d'), rnd = seeded(27);
    const bx0 = 4, bx1 = W - 4;
    const layers = [['cream', 4], ['sponge', 8], ['fill', 10], ['sponge', 7], ['fill', 10], ['sponge', 8], ['cream', 3]];
    let y = top, faceY = 0;
    layers.forEach(([t, h], li) => {
      for (let yy = y; yy < y + h; yy++) for (let xx = bx0; xx < bx1; xx++) {
        const r = rnd();
        x.fillStyle = t === 'sponge' ? (r < 0.12 ? '#d9a24f' : r < 0.22 ? '#fbe2a6' : '#f3c46f') : (r < 0.06 ? '#f1e2d6' : '#fffaf3');
        x.fillRect(xx, yy, 1, 1);
      }
      if (t === 'fill') for (let xx = bx0 + 1 + (li % 4 ? 5 : 0); xx < bx1 - 7; xx += 10) x.drawImage(HALF, xx, y + 2);
      if (li === 3) faceY = y + 1;
      y += h;
    });
    for (let xx = bx0; xx < bx1; xx++) { // cream drips
      const d = rnd() < 0.3 ? 1 + ((rnd() * 3) | 0) : 0;
      x.fillStyle = '#fffaf3'; x.fillRect(xx, top + 4, 1, d);
    }
    x.fillStyle = 'rgba(90,30,50,.13)'; x.fillRect(bx1 - 6, top, 6, bodyH);      // shaded side
    x.fillStyle = 'rgba(160,210,255,.6)';                                       // acetate glint
    x.fillRect(bx0 + 2, top + 2, 1, bodyH - 6); x.fillRect(bx0 + 4, top + 2, 1, 18);
    x.fillStyle = '#2f6bff'; x.fillRect(0, top + bodyH, W, 4);                  // blue cake board
    x.fillStyle = '#9fd0ff'; x.fillRect(0, top + bodyH, W, 1);
    x.fillStyle = '#1d48c4'; x.fillRect(0, top + bodyH + 3, W, 1);
    // strawberry mountain on top (back rows first)
    [[top - 14, 22, 6], [top - 11, 12, 7], [top - 7, 4, 13]].forEach(([yy, start, n]) => {
      const step = (W - 2 * start) / n;
      for (let i = 0; i < n; i++) x.drawImage(STRAW, Math.round(start + i * step + rnd() * 2 - 1), yy + ((rnd() * 2) | 0));
    });
    for (let i = 0; i < 26; i++) { x.fillStyle = '#ffffff'; x.fillRect((bx0 + rnd() * (bx1 - bx0)) | 0, (2 + rnd() * (top - 2)) | 0, 1, 1); } // sugar dust
    x.drawImage(BOW, (W - BOW.width) >> 1, 0);

    // cracks get drawn in as the cake takes damage
    const CRACKS = [[[20, 24], [26, 32], [22, 38], [28, 46]], [[62, 22], [57, 31], [63, 37], [56, 47]],
      [[42, 68], [39, 60], [45, 53], [40, 44]], [[6, 40], [16, 44], [13, 52], [22, 58]],
      [[78, 34], [68, 40], [72, 48], [62, 54]], [[42, 20], [44, 28], [40, 34], [45, 40]],
      [[10, 62], [18, 58], [24, 64]], [[74, 62], [66, 57], [60, 64]]];
    const cracks = CRACKS.map((pts) => {
      const c = mk(W, H), cx = c.getContext('2d');
      for (let i = 1; i < pts.length; i++) {
        line(cx, pts[i - 1][0] + 1, pts[i - 1][1], pts[i][0] + 1, pts[i][1], '#ffffff');
        line(cx, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], '#5b2333');
      }
      return outline(c, 'rgba(0,0,0,0)');
    });
    const img = outline(raw);
    return { img, white: silhouette(img, '#ffffff'), cracks, faceX: (W - 11) / 2 + 1, faceY: faceY + 1 };
  }

  function buildBaguette() {
    const w = 6, L = 44, c = mk(w, L), x = c.getContext('2d');
    for (let y = 0; y < L; y++) {
      const end = y === 0 || y === L - 1, near = y === 1 || y === L - 2;
      for (let i = 0; i < w; i++) {
        if (end && (i === 0 || i === w - 1)) continue;
        x.fillStyle = i <= 1 ? '#f2bf6c' : i >= 4 ? '#a9622a' : '#d8913d';
        if (near && (i === 0)) x.fillStyle = '#d8913d';
        x.fillRect(i, y, 1, 1);
      }
    }
    for (let y = 5; y < L - 4; y += 7) { x.fillStyle = '#fbe0a4'; x.fillRect(1, y + 2, 1, 1); x.fillRect(2, y + 1, 1, 1); x.fillRect(3, y, 1, 1); x.fillStyle = '#f6cf86'; x.fillRect(4, y - 1, 1, 1); }
    return outline(c, '#3a1f12');
  }

  function drawEnvelope(open) {
    const c = $('#envCanvas'), x = c.getContext('2d');
    x.clearRect(0, 0, 32, 34);
    const by = 12, fill = (col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(x0, y0, w, h); };
    if (open) {
      for (let r = 0; r <= 12; r++) { const hw = Math.round((r / 12) * 16); fill('#5b9cff', 16 - hw, r, hw * 2, 1); } // flap up
      fill('#3d7cf0', 0, by, 32, 22);
      fill('#fffaf0', 4, 3, 24, 22); fill('#c9d6ee', 7, 7, 18, 1); fill('#c9d6ee', 7, 10, 14, 1); fill('#c9d6ee', 7, 13, 16, 1);
      fill('#ff6b98', 14, 16, 2, 2); fill('#ff6b98', 17, 16, 2, 2); fill('#ff6b98', 14, 18, 5, 1); fill('#ff6b98', 15, 19, 3, 1); fill('#ff6b98', 16, 20, 1, 1);
      for (let yy = by; yy < 34; yy++) for (let xx = 0; xx < 32; xx++) { // front pocket
        if (yy >= by + 6 + (16 - Math.abs(xx - 15.5)) * 0.4) fill(yy === 33 ? '#1d48c4' : '#8ec5ff', xx, yy, 1, 1);
      }
    } else {
      fill('#8ec5ff', 0, by, 32, 22); fill('#1d48c4', 0, 33, 32, 1);
      for (let r = 0; r <= 12; r++) { const hw = Math.round(((12 - r) / 12) * 16); fill('#5b9cff', 16 - hw, by + r, hw * 2, 1); } // flap down
      fill('#ff6b98', 13, by + 9, 2, 2); fill('#ff6b98', 17, by + 9, 2, 2); fill('#ff6b98', 13, by + 11, 6, 1); fill('#ff6b98', 14, by + 12, 4, 1); fill('#ff6b98', 15, by + 13, 2, 1);
      fill('#ffffff', 13, by + 9, 1, 1);
    }
    // outline
    const img = x.getImageData(0, 0, 32, 34), d = img.data, solid = (i, j) => i >= 0 && j >= 0 && i < 32 && j < 34 && d[(j * 32 + i) * 4 + 3] > 0;
    const edge = [];
    for (let j = 0; j < 34; j++) for (let i = 0; i < 32; i++) if (solid(i, j) && (!solid(i - 1, j) || !solid(i + 1, j) || !solid(i, j - 1) || !solid(i, j + 1))) edge.push([i, j]);
    x.fillStyle = '#13204a'; edge.forEach(([i, j]) => x.fillRect(i, j, 1, 1));
  }

  const CAKE = buildCake();
  const BAG = buildBaguette();
  const BAG_GRIP = BAG.height - 8;
  let KID = null, BG = null;

  /* ================= sound: tiny 8-bit synth ================= */
  const sfx = (() => {
    let ac = null, out, nbuf, muted = false;
    function init() {
      if (!ac) {
        try {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          out = ac.createGain(); out.gain.value = 0.32; out.connect(ac.destination);
          nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
          const d = nbuf.getChannelData(0); let v = 0;
          for (let i = 0; i < d.length; i++) { if (i % 6 === 0) v = Math.random() * 2 - 1; d[i] = v; } // crunchy 8-bit noise
        } catch (e) { ac = null; }
      }
      if (ac && ac.state === 'suspended') ac.resume();
    }
    const ok = () => ac && !muted;
    function tone(f, t, dur, vol, type = 'square', to) {
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      gn.gain.setValueAtTime(vol, t); gn.gain.setValueAtTime(vol, t + dur * 0.7); gn.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(gn).connect(out); o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(t, dur, vol, freq, type = 'bandpass') {
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
      s.buffer = nbuf; f.type = type; f.frequency.value = freq;
      gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f).connect(gn).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur);
    }
    const now = () => ac.currentTime;
    return {
      init,
      toggle: () => (muted = !muted),
      hit(p) { if (!ok()) return; const t = now(); noise(t, 0.12, 0.7, 900 + p * 800); tone(240 + p * 80, t, 0.12, 0.35, 'square', 60); },
      whoosh() { if (!ok()) return; const t = now(); const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain(); s.buffer = nbuf; f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.14); gn.gain.setValueAtTime(0.25, t); gn.gain.linearRampToValueAtTime(0, t + 0.16); s.connect(f).connect(gn).connect(out); s.start(t); s.stop(t + 0.17); },
      boom() {
        if (!ok()) return; const t = now();
        noise(t, 0.7, 0.9, 1400, 'lowpass'); tone(120, t, 0.4, 0.4, 'square', 30);
        [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => tone(f, t + 0.25 + i * 0.09, i === 5 ? 0.45 : 0.08, 0.16));
      },
      coin() { if (!ok()) return; const t = now(); tone(987.77, t, 0.07, 0.15); tone(1318.5, t + 0.07, 0.3, 0.15); },
      blip() { if (!ok()) return; tone(rand(880, 1000), now(), 0.025, 0.05); },
      birthday() {
        if (!ok()) return;
        const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
        const song = 'G4 .75,G4 .25,A4 1,G4 1,C5 1,B4 2,G4 .75,G4 .25,A4 1,G4 1,D5 1,C5 2,G4 .75,G4 .25,G5 1,E5 1,C5 1,B4 1,A4 2,F5 .75,F5 .25,E5 1,C5 1,D5 1,C5 2';
        let t = now() + 0.1; const beat = 0.3;
        song.split(',').forEach((n) => { const [k, d] = n.split(' '); tone(N[k], t, d * beat * 0.9, 0.09, 'square'); tone(N[k] / 2, t, d * beat * 0.9, 0.05, 'triangle'); t += d * beat; });
      },
    };
  })();

  /* ================= layout ================= */
  let W, H, dpr, U, Uc, cw, ch, L, D, kidW, kidH;
  let ropeK = 1; // 1 = full rope, shrinks to 0 after the cake breaks
  function layout() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    U = clamp(H * 0.0026, 1.4, 3);                        // size of one "pixel" of little her
    Uc = Math.min(U * 1.5, (W * 0.74) / CAKE.img.width);  // the cake is chunkier
    cw = CAKE.img.width * Uc; ch = CAKE.img.height * Uc;
    L = Math.max(30, H * 0.4 - ch / 2);
    D = L + ch / 2;
    if (KID) { kidW = KID.width * U; kidH = KID.height * U; }
    buildBG();
  }

  function buildBG() {
    if (!BG) return;
    const px = Math.max(3, Math.round(U * 1.6 * dpr));     // background pixel size (device px)
    const sw = Math.ceil(cv.width / px), sh = Math.ceil(cv.height / px);
    const small = mk(sw, sh), x = small.getContext('2d');
    const s = Math.max(sw / BG.width, sh / BG.height);
    x.imageSmoothingQuality = 'high';
    x.drawImage(BG, (sw - BG.width * s) / 2, (sh - BG.height * s) / 2, BG.width * s, BG.height * s);
    const id = x.getImageData(0, 0, sw, sh), d = id.data;
    for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / 20) * 20; // posterize
    x.putImageData(id, 0, 0);
    const grd = x.createRadialGradient(sw / 2, sh / 2, Math.min(sw, sh) * 0.3, sw / 2, sh / 2, Math.max(sw, sh) * 0.75);
    grd.addColorStop(0, 'rgba(19,32,74,0)'); grd.addColorStop(1, 'rgba(19,32,74,.45)');
    x.fillStyle = grd; x.fillRect(0, 0, sw, sh);
    BGs = { img: small, px };
  }
  let BGs = null;

  /* ================= state ================= */
  const ptr = { x: 0, y: 0 };
  const kid = { x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, face: 1, hop: 0, hopT: 0, sq: 0 };
  const bag = { a: -0.6, w: 0 };       // baguette angle (0 = straight up) and angular velocity
  let theta = 0.3, omega = 0;          // cake pendulum
  let hits = 0, broken = false, started = false;
  let hitCD = 0, swingCD = 0, stopT = 0, shakeT = 0, shakeA = 0, flashT = 0, ouchT = 0, cakeSq = 0;
  const parts = [];

  /* ================= HUD ================= */
  document.querySelectorAll('[data-name]').forEach((el) => (el.textContent = C.name));
  document.title = `happy birthday, ${C.name} ♡`;
  $('#cakeName').textContent = C.cakeName;
  $('#introText').textContent = C.intro;
  $('#from').textContent = C.from;
  const hint = $('#hint');
  hint.textContent = coarse ? 'DRAG TO WALK · TAP TO SWING' : 'MOVE TO WALK · CLICK TO SWING';
  const hp = $('#hpBar');
  for (let i = 0; i < C.hitsToBreak; i++) hp.appendChild(document.createElement('i'));
  const hpCells = [...hp.children];

  /* ================= input ================= */
  const touchLift = () => (coarse ? kidH * 0.45 : 0); // keep her above your finger on phones
  function setPtr(e) { ptr.x = e.clientX; ptr.y = e.clientY; }
  addEventListener('pointermove', setPtr, { passive: true });
  addEventListener('pointerdown', (e) => {
    sfx.init(); setPtr(e);
    if (started && !broken && !e.target.closest('button, .letter-overlay')) swing();
  });
  addEventListener('keydown', (e) => { if (e.code === 'Space' && started) { e.preventDefault(); swing(); } });

  function swing() {
    if (swingCD > 0) return;
    swingCD = 0.32;
    bag.w = kid.face * 34;
    sfx.whoosh();
  }

  /* ================= geometry ================= */
  const toLocal = (px, py) => { // world → cake frame (origin at pivot, y down the rope)
    const x = px - W / 2, c = Math.cos(theta), s = Math.sin(theta);
    return [x * c - py * s, x * s + py * c];
  };
  const toWorld = (lx, ly) => { const c = Math.cos(theta), s = Math.sin(theta); return [W / 2 + lx * c + ly * s, -lx * s + ly * c]; };
  const inCake = (px, py) => { const [lx, ly] = toLocal(px, py); return Math.abs(lx) < cw / 2 - Uc && ly > L + 10 * Uc && ly < L + ch; };
  function handPos() {
    const hx = (C.hand[0] + 0.5 - KID.width / 2) * U * -kid.face, hy = (C.hand[1] - KID.height / 2) * U;
    const t = clamp(kid.vx / 2400, -0.28, 0.28), c = Math.cos(t), s = Math.sin(t);
    return [kid.x + hx * c - hy * s, kid.y + kid.hop + hx * s + hy * c];
  }

  /* ================= gameplay ================= */
  const WORDS = ['BONK!', 'WHACK!', 'CRUNCH!', 'POW!', 'SMACK!', 'BREAD\'D!', 'CRUMBS!', '+1 LOVE', 'YUM!', 'THWAP!'];
  function popWord(x, y, text, big) {
    const el = document.createElement('span');
    el.className = 'pop' + (big ? ' big' : '');
    el.textContent = text || pick(WORDS);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    if (!big) el.style.color = pick(['#ffffff', '#8ec5ff', '#ffd1e0', '#fff3a8']);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), big ? 1700 : 800);
  }

  function spray(x, y, n, f, dirX = 0) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(120, 520) * f, r = Math.random();
      parts.push({
        kind: r < 0.12 ? 'img' : 'sq', img: STRAW,
        x, y, vx: Math.cos(a) * sp + dirX * 260 * f, vy: Math.sin(a) * sp - 320 * f,
        s: Math.round(rand(1, 3)), col: r < 0.45 ? pick(['#f3c46f', '#d9a24f', '#fbe2a6']) : r < 0.75 ? '#fffaf3' : pick(['#e8344e', '#ff8fa0']),
        rot: rand(0, 6), vr: rand(-8, 8), life: rand(1.6, 3), bounce: true, g: 1500,
      });
    }
  }

  function onHit(x, y, power) {
    hits++;
    hitCD = 0.22; stopT = 0.06 + power * 0.05; shakeT = 0.25; shakeA = 4 + power * 8; flashT = 0.07; ouchT = 0.4; cakeSq = 1;
    bag.w *= -0.3;
    omega += kid.face * (1.1 + power * 1.6);
    sfx.hit(power);
    popWord(x, y);
    spray(x, y, 14 + power * 16, 0.7 + power * 0.5, kid.face);
    hpCells.forEach((c, i) => c.classList.toggle('gone', i >= C.hitsToBreak - hits));
    hp.classList.remove('hurt'); void hp.offsetWidth; hp.classList.add('hurt');
    if (navigator.vibrate) navigator.vibrate(25);
    if (hits === 3) hint.classList.remove('show');
    if (hits >= C.hitsToBreak) breakCake();
  }

  function breakCake() {
    broken = true;
    stopT = 0.18; shakeT = 0.7; shakeA = 16;
    sfx.boom();
    const fl = $('#flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    // shatter the cake sprite into chunky tiles that fly apart
    const src = mk(CAKE.img.width, CAKE.img.height), sx = src.getContext('2d');
    sx.drawImage(CAKE.img, 0, 0); CAKE.cracks.forEach((c) => sx.drawImage(c, 0, 0));
    const T = 9;
    for (let ty = 0; ty < src.height; ty += T) for (let tx = 0; tx < src.width; tx += T) {
      const tile = mk(T, T); tile.getContext('2d').drawImage(src, tx, ty, T, T, 0, 0, T, T);
      const lx = (tx + T / 2 - src.width / 2) * Uc, ly = L + (ty + T / 2) * Uc;
      const [wx, wy] = toWorld(lx, ly);
      const [cx, cy] = toWorld(0, L + ch / 2);
      const dx = wx - cx, dy = wy - cy, dl = Math.hypot(dx, dy) || 1;
      parts.push({ kind: 'img', img: tile, scale: Uc, x: wx, y: wy, vx: (dx / dl) * rand(300, 700), vy: (dy / dl) * rand(300, 600) - rand(300, 600), rot: -theta, vr: rand(-7, 7), life: rand(2.5, 4), bounce: true, g: 1700 });
    }
    const [cx, cy] = toWorld(0, L + ch / 2);
    spray(cx, cy, 90, 1.5);
    for (let i = 0; i < 160; i++) { // confetti rain
      parts.push({ kind: 'sq', x: rand(0, W), y: rand(-H * 0.6, -10), vx: rand(-40, 40), vy: rand(40, 160), s: 2, col: pick(['#2f6bff', '#8ec5ff', '#ffffff', '#ff6b98', '#fff3a8', '#6cd06b']), life: 9, g: 120, flutter: rand(0, 6), drag: true });
    }
    popWord(cx, cy - ch * 0.3, 'HAPPY BIRTHDAY!', true);
    hint.classList.remove('show');
    setTimeout(() => { $('#envelopeWrap').classList.add('show'); drawEnvelope(false); sfx.coin(); }, 1700);
  }

  function reset() {
    hits = 0; broken = false; theta = -0.5; omega = 0; ropeK = 1; cakeSq = 1;
    hpCells.forEach((c) => c.classList.remove('gone'));
    $('#envelopeWrap').classList.remove('show');
  }

  /* ================= update ================= */
  function update(dt) {
    swingCD -= dt; hitCD -= dt; flashT -= dt; ouchT -= dt; shakeT -= dt;
    cakeSq = Math.max(0, cakeSq - dt * 4);

    // little her: springy follow (overshoots a bit, so she bounces around)
    const tx = clamp(ptr.x, kidW * 0.3, W - kidW * 0.3), ty = clamp(ptr.y - touchLift(), kidH * 0.3, H - kidH * 0.35);
    const ax = (tx - kid.x) * 210 - kid.vx * 19, ay = (ty - kid.y) * 210 - kid.vy * 19;
    kid.vx += ax * dt; kid.vy += ay * dt; kid.x += kid.vx * dt; kid.y += kid.vy * dt;
    kid.ax = ax; kid.ay = ay;
    const sp = Math.hypot(kid.vx, kid.vy);
    if (sp > 50) kid.hopT += dt * clamp(sp / 60, 8, 22);
    kid.hop = sp > 50 ? -Math.abs(Math.sin(kid.hopT)) * 5 * U : kid.hop * 0.8;

    // face the cake (with a bit of hysteresis), mirroring the baguette when she turns
    const [cx] = toWorld(0, L + ch / 2);
    const want = !broken && Math.abs(cx - kid.x) > 24 ? Math.sign(cx - kid.x) : kid.face;
    if (want !== kid.face) { kid.face = want; bag.a = -bag.a; bag.w = -bag.w; kid.sq = 1; }
    kid.sq = Math.max(0, kid.sq - dt * 5);

    // baguette: spring back to "ready" pose + swings from her running around
    const rest = -kid.face * 0.6;
    const bl = (BAG.height - BAG_GRIP) * U;
    bag.w += (-(bag.a - rest) * 120 - bag.w * 7.5 - (Math.sin(bag.a) * ay + Math.cos(bag.a) * ax) * (1.1 / bl)) * dt;
    bag.a += bag.w * dt;

    // auto-swing when the cake is in reach
    const [hx, hy] = handPos();
    if (started && !broken && swingCD < -0.15) {
      const reach = BAG_GRIP * U * 1.05;
      const pts = [0.3, 0.6, 1].map((k) => [hx + Math.sin(rest + kid.face * 1.6) * reach * k, hy - Math.cos(rest + kid.face * 1.6) * reach * k]);
      if (pts.some(([x, y]) => inCake(x, y))) swing();
    }

    // hit test along the baguette
    if (started && !broken && hitCD <= 0) {
      const len = BAG_GRIP * U;
      for (const k of [0.45, 0.75, 1]) {
        const px = hx + Math.sin(bag.a) * len * k, py = hy - Math.cos(bag.a) * len * k;
        const tipV = Math.abs(bag.w) * len * k + Math.hypot(kid.vx, kid.vy) * 0.6;
        if (inCake(px, py) && (Math.abs(bag.w) > 7 || tipV > 900)) {
          onHit(px, py, clamp((tipV - 500) / 1500, 0, 1));
          break;
        }
      }
    }

    // cake pendulum
    omega += (-(2300 / D) * Math.sin(theta) - 0.55 * omega) * dt;
    theta += omega * dt;
    if (Math.abs(theta) > 1.2) { theta = Math.sign(theta) * 1.2; omega *= -0.4; }
    if (broken) ropeK = Math.max(0, ropeK - dt * 0.8);

    // particles
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      p.vy += p.g * dt;
      if (p.drag) { p.flutter += dt * 4; p.vx = Math.sin(p.flutter) * 60; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.vr) p.rot += p.vr * dt;
      if (p.bounce && p.y > H - 8 && p.vy > 0) { p.y = H - 8; p.vy *= -0.35; p.vx *= 0.6; p.vr *= 0.5; if (Math.abs(p.vy) < 60) { p.vy = 0; p.g = 0; p.vx *= 0.3; } }
      if (p.life <= 0 || p.y > H + 60) parts.splice(i, 1);
    }
  }

  /* ================= render ================= */
  function render() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = false;
    const sh = shakeT > 0 ? shakeA * (shakeT / 0.7 + 0.3) : 0;
    const ox = Math.round(rand(-sh, sh)), oy = Math.round(rand(-sh, sh));
    g.fillStyle = '#13204a'; g.fillRect(0, 0, W, H);
    g.translate(ox, oy);
    if (BGs) g.drawImage(BGs.img, -8, -8, BGs.img.width * BGs.px / dpr + 16, BGs.img.height * BGs.px / dpr + 16);

    // rope + cake
    g.save();
    g.translate(W / 2, 0); g.rotate(-theta);
    const ropeLen = broken ? L * ropeK : L;
    g.fillStyle = '#2f6bff'; g.fillRect(-U, 0, U * 2, ropeLen);
    g.fillStyle = '#9fd0ff'; g.fillRect(-U, 0, U, ropeLen);
    if (!broken) {
      g.translate(0, L);
      const sq = Math.sin(cakeSq * Math.PI * 3) * cakeSq * 0.1;
      g.scale(1 + sq, 1 - sq);
      g.drawImage(CAKE.img, -cw / 2, 0, cw, ch);
      const n = Math.min(CAKE.cracks.length, Math.floor((hits / C.hitsToBreak) * (CAKE.cracks.length + 1)));
      for (let i = 0; i < n; i++) g.drawImage(CAKE.cracks[i], -cw / 2, 0, cw, ch);
      const f = ouchT > 0 ? FACE.ouch : FACE.happy;
      g.drawImage(f, -f.width * Uc, (CAKE.faceY - 2) * Uc, f.width * Uc * 2, f.height * Uc * 2); // big cute face
      if (flashT > 0) g.drawImage(CAKE.white, -cw / 2, 0, cw, ch);
    }
    g.restore();

    // little her + baguette
    if (KID && started) {
      const [hx, hy] = handPos();
      const tilt = clamp(kid.vx / 2400, -0.28, 0.28);
      const st = 1 + Math.min(Math.abs(kid.vy) / 5000, 0.08), sqx = 1 - kid.sq * 0.3;
      // shadow
      g.fillStyle = 'rgba(19,32,74,.25)';
      g.fillRect(Math.round(kid.x - kidW * 0.35), Math.round(kid.y + kidH / 2 - U * 2), Math.round(kidW * 0.7), Math.round(U * 3));
      g.save();
      g.translate(kid.x, kid.y + kid.hop); g.rotate(tilt); g.scale(-kid.face * sqx / st, st);
      g.drawImage(KID, -kidW / 2, -kidH / 2, kidW, kidH);
      g.restore();
      g.save();
      g.translate(hx, hy); g.rotate(bag.a);
      g.drawImage(BAG, -BAG.width * U / 2, -BAG_GRIP * U, BAG.width * U, BAG.height * U);
      g.restore();
      // name tag
      g.font = `${Math.round(clamp(U * 4, 8, 11))}px "Press Start 2P"`;
      g.textAlign = 'center';
      const ny = kid.y + kid.hop - kidH / 2 - U * 6;
      g.fillStyle = '#13204a';
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) g.fillText(C.name.toUpperCase(), kid.x + dx, ny + dy);
      g.fillStyle = '#ffffff'; g.fillText(C.name.toUpperCase(), kid.x, ny);
    }

    // particles
    for (const p of parts) {
      const a = p.life < 0.5 ? p.life / 0.5 : 1;
      g.globalAlpha = a;
      if (p.kind === 'sq') { g.fillStyle = p.col; const s = p.s * U; g.fillRect(Math.round(p.x), Math.round(p.y), s, s); }
      else {
        const s = p.scale || U * 1.4;
        g.save(); g.translate(p.x, p.y); g.rotate(Math.round(p.rot * 4) / 4);
        g.drawImage(p.img, -p.img.width * s / 2, -p.img.height * s / 2, p.img.width * s, p.img.height * s);
        g.restore();
      }
    }
    g.globalAlpha = 1;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    if (stopT > 0) stopT -= dt; // hit-stop: freeze for a beat so hits feel crunchy
    else { update(dt / 2); update(dt / 2); }
    render();
    requestAnimationFrame(frame);
  }

  /* ================= intro / letter flow ================= */
  function drawPreview() {
    const c = $('#preview'), x = c.getContext('2d');
    x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
    const kx = 30, ky = 60;
    x.drawImage(KID, kx - KID.width / 2, ky - KID.height / 2);
    x.save(); x.translate(kx - KID.width / 2 + C.hand[0] + 1.5, ky - KID.height / 2 + C.hand[1]); x.rotate(0.55);
    x.drawImage(BAG, -BAG.width / 2, -BAG_GRIP); x.restore();
  }

  $('#start').addEventListener('click', () => {
    sfx.init(); sfx.coin();
    $('#intro').classList.add('hide');
    document.body.classList.add('playing', 'started');
    kid.x = W / 2; kid.y = H * 0.8; ptr.x = W * 0.28; ptr.y = H * 0.62;
    setTimeout(() => { started = true; hint.classList.add('show'); }, 150);
  });

  const envelope = $('#envelope'), letter = $('#letter'), dialog = $('#dialog');
  let opened = false, typing = null;
  envelope.addEventListener('click', () => {
    if (opened) return openLetter();
    opened = true; drawEnvelope(true); sfx.coin();
    setTimeout(openLetter, 650);
  });

  function openLetter() {
    letter.classList.add('show');
    document.body.classList.add('reading');
    sfx.birthday();
    typeLetter();
  }
  function typeLetter() {
    const body = $('#letterBody');
    body.innerHTML = ''; dialog.classList.remove('done');
    const ps = C.letter.map(() => { const p = document.createElement('p'); body.appendChild(p); return p; });
    let pi = 0, ci = 0;
    clearInterval(typing);
    typing = setInterval(() => {
      if (pi >= C.letter.length) { clearInterval(typing); dialog.classList.add('done'); return; }
      const text = C.letter[pi];
      ci += 1; ps[pi].textContent = text.slice(0, ci);
      if (ci % 2) sfx.blip();
      if (ci >= text.length) { pi++; ci = 0; }
    }, 18);
    dialog.onclick = (e) => { // tap to skip the typing
      if (dialog.classList.contains('done') || e.target.closest('button')) return;
      clearInterval(typing); C.letter.forEach((t, i) => (ps[i].textContent = t)); dialog.classList.add('done');
    };
  }
  function closeLetter() { letter.classList.remove('show'); document.body.classList.remove('reading'); clearInterval(typing); dialog.classList.add('done'); }
  $('#closeLetter').addEventListener('click', closeLetter);
  letter.addEventListener('click', (e) => { if (e.target === letter) closeLetter(); });
  $('#replay').addEventListener('click', () => { closeLetter(); opened = false; reset(); sfx.coin(); });
  $('#mute').addEventListener('click', (e) => e.currentTarget.classList.toggle('off', sfx.toggle()));

  /* ================= boot ================= */
  function load(src) { return new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }
  Promise.all([load(C.sprite), load(C.background), document.fonts ? document.fonts.load('10px "Press Start 2P"').catch(() => {}) : 0]).then(([k, b]) => {
    KID = k || fromRows(['.KK.', 'KKKK', '.KK.'], { K: '#2f6bff' });
    BG = b;
    layout(); drawPreview(); drawEnvelope(false);
    addEventListener('resize', layout);
    requestAnimationFrame(frame);
  });
})();
