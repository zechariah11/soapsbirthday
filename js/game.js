(() => {
  /* ================= config.json ================= */
  const DEFAULTS = {
    name: 'Soap',
    age: 27,
    hitsToBreak: 5,
    bossName: 'Giant Strawberry Cake',
    startScreen: "I couldn't be there today, so little you is on a mission: grab the baguette and defeat the giant Sungsimdang strawberry cake.",
    greeting: 'Dear {name},',
    letter: ['Happy birthday! (Write your letter in config.json.)'],
    signOff: 'love,',
    from: 'me',
  };

  function normalise(raw) {
    const c = { ...DEFAULTS, ...(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) };
    c.name = String(c.name ?? '').trim() || DEFAULTS.name;
    const age = parseInt(c.age, 10);
    c.age = Number.isFinite(age) && age > 0 ? age : null;
    const hits = parseInt(c.hitsToBreak, 10);
    c.hitsToBreak = Number.isFinite(hits) ? Math.min(50, Math.max(1, hits)) : 5;
    const fill = (s) => String(s ?? '').replace(/\{name\}/g, c.name).replace(/\{age\}/g, c.age ?? '');
    c.letter = (Array.isArray(c.letter) ? c.letter : [c.letter]).map(fill).filter((p) => p.trim());
    for (const k of ['bossName', 'startScreen', 'greeting', 'signOff', 'from']) c[k] = fill(c[k]);
    c.bossName = c.bossName.trim() || DEFAULTS.bossName;
    return c;
  }

  async function loadConfig() {
    const localNote = "You opened the file directly, so config.json can't be read and the built-in text is showing. Use the GitHub Pages link (or a local web server) to see your edits.";
    if (location.protocol === 'file:') return { cfg: normalise(null), note: localNote };
    try {
      const ctrl = window.AbortController ? new AbortController() : null;
      const timer = setTimeout(() => ctrl && ctrl.abort(), 5000);
      const res = await fetch('config.json', { cache: 'no-cache', signal: ctrl ? ctrl.signal : undefined });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      try { return { cfg: normalise(JSON.parse(text)) }; }
      catch (e) { return { cfg: normalise(null), note: `config.json has a typo, so the built-in text is showing. (${e.message})` }; }
    } catch (e) {
      return { cfg: normalise(null), note: location.protocol === 'file:' ? localNote : `Couldn't load config.json (${e.message}), so the built-in text is showing.` };
    }
  }

  /* ================= helpers ================= */
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const A = window.Art;
  const coarse = window.matchMedia ? matchMedia('(pointer: coarse)').matches : false;
  const cv = $('#game'), g = cv.getContext('2d');
  const CAKE = A.buildCake();
  let C = normalise(null);

  const textBox = $('#textBox'), textLine = $('#textLine');
  const bossBox = $('#bossBox'), bossHp = $('#bossHp'), playerExp = $('#playerExp'), playerLv = $('#playerLv');
  const envWrap = $('#envelopeWrap'), envelope = $('#envelope'), envCanvas = $('#envCanvas');
  const letter = $('#letter'), dialog = $('#dialog'), startBtn = $('#start'), flashEl = $('#flash');

  /* ================= sound: tiny 8-bit synth (no audio files) ================= */
  const sfx = (() => {
    let ac = null, out = null, nbuf = null, muted = false, songBus = null;
    function init() {
      try {
        if (!ac) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ac = new AC();
          out = ac.createGain(); out.gain.value = 0.3; out.connect(ac.destination);
          nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
          const d = nbuf.getChannelData(0); let v = 0;
          for (let i = 0; i < d.length; i++) { if (i % 6 === 0) v = Math.random() * 2 - 1; d[i] = v; }
        }
        if (ac.state === 'suspended') ac.resume();
      } catch (e) { ac = null; }
    }
    const ok = () => ac && !muted;
    function tone(f, t, dur, vol, type = 'square', to, dest = out) {
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      gn.gain.setValueAtTime(vol, t); gn.gain.setValueAtTime(vol, t + dur * 0.7); gn.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(gn).connect(dest); o.start(t); o.stop(t + dur + 0.02);
    }
    // the birthday song plays through its own channel so it can be cut off mid-song
    function stopSong() {
      if (!songBus) return;
      const bus = songBus; songBus = null;
      try {
        bus.gain.setTargetAtTime(0, ac.currentTime, 0.02);
        setTimeout(() => bus.disconnect(), 200);
      } catch (e) { /* ignore */ }
    }
    function noise(t, dur, vol, freq, type = 'bandpass') {
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
      s.buffer = nbuf; f.type = type; f.frequency.value = freq;
      gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f).connect(gn).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur);
    }
    const play = (fn) => { if (!ok()) return; try { fn(ac.currentTime); } catch (e) { /* never let sound break the game */ } };
    const seq = (notes, t0, len, vol, type) => notes.forEach((f, i) => tone(f, t0 + i * len, len * 0.9, vol, type));
    return {
      init,
      toggle: () => (muted = !muted),
      hit: () => play((t) => { noise(t, 0.12, 0.7, 1300); tone(260, t, 0.12, 0.3, 'square', 70); }),
      whoosh: () => play((t) => {
        const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
        s.buffer = nbuf; f.type = 'bandpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.14);
        gn.gain.setValueAtTime(0.2, t); gn.gain.linearRampToValueAtTime(0, t + 0.16);
        s.connect(f).connect(gn).connect(out); s.start(t); s.stop(t + 0.17);
      }),
      thud: () => play((t) => { tone(110, t, 0.2, 0.35, 'square', 40); noise(t, 0.2, 0.5, 400, 'lowpass'); }),
      battle: () => play((t) => seq([659, 622, 659, 622, 659, 784, 988, 1319], t, 0.07, 0.11)),
      faint: () => play((t) => tone(700, t, 0.8, 0.14, 'square', 50)),
      boom: () => play((t) => { noise(t, 0.7, 0.9, 1400, 'lowpass'); tone(120, t, 0.4, 0.35, 'square', 30); seq([523.25, 659.25, 783.99, 1046.5], t + 0.3, 0.09, 0.14); }),
      levelUp: () => play((t) => { seq([523.25, 659.25, 783.99, 1046.5], t, 0.08, 0.13); tone(987.77, t + 0.36, 0.1, 0.13); tone(1046.5, t + 0.48, 0.4, 0.13); }),
      coin: () => play((t) => { tone(987.77, t, 0.07, 0.14); tone(1318.5, t + 0.07, 0.3, 0.14); }),
      blip: () => play((t) => tone(rand(860, 980), t, 0.025, 0.045)),
      stopSong,
      birthday: () => play((t0) => {
        stopSong();
        songBus = ac.createGain(); songBus.connect(out);
        const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
        const song = 'G4 .75,G4 .25,A4 1,G4 1,C5 1,B4 2,G4 .75,G4 .25,A4 1,G4 1,D5 1,C5 2,G4 .75,G4 .25,G5 1,E5 1,C5 1,B4 1,A4 2,F5 .75,F5 .25,E5 1,C5 1,D5 1,C5 2';
        let t = t0 + 0.1; const beat = 0.3;
        song.split(',').forEach((n) => {
          const [k, d] = n.split(' ');
          tone(N[k], t, d * beat * 0.9, 0.08, 'square', null, songBus); tone(N[k] / 2, t, d * beat * 0.9, 0.05, 'triangle', null, songBus);
          t += d * beat;
        });
      }),
    };
  })();

  /* ================= layout: a low-res canvas scaled up with crisp pixels ================= */
  let S = 4, iw = 0, ih = 0, room = null, floorY = 0, balloons = [], tinsel = null, ropeTarget = 30;
  const ptr = { x: 0, y: 0 };
  const kid = { x: 0, y: 0, vx: 0, vy: 0, face: 1, walkT: 0, happyT: 0, dustT: 0 };
  function layout() {
    const W = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    const H = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const oldW = iw, oldH = ih;
    S = clamp(Math.round(Math.sqrt((W * H) / 40000)), 2, 10);
    iw = Math.ceil(W / S); ih = Math.ceil(H / S);
    cv.width = iw; cv.height = ih;
    cv.style.width = iw * S + 'px'; cv.style.height = ih * S + 'px';
    const r = A.buildRoom(iw, ih, { age: C.age });
    room = r.canvas; floorY = r.floorY; balloons = r.balloons; tinsel = r.tinsel;
    ropeTarget = Math.max(4, Math.round(ih * 0.36 - CAKE.h / 2));
    document.documentElement.style.setProperty('--env-w', 34 * Math.max(4, S) + 'px');
    if (oldW > 0 && oldH > 0) {
      for (const o of [kid, ptr]) { o.x *= iw / oldW; o.y *= ih / oldH; }
    } else {
      kid.x = ptr.x = iw * 0.25; kid.y = ptr.y = ih * 0.75;
    }
  }

  /* ================= game state ================= */
  const bag = { a: 0.35, w: 0, ghosts: [] };   // baguette angle (0 = straight up) and spin speed
  const cake = { show: false, alive: false, hp: 5, rope: -80, ropeV: 0, theta: 0, omega: 0, landed: false, flashT: 0, blinkT: 0, shakeT: 0, hurtT: 0, faintT: 0 };
  const parts = [];
  let state = 'loading';  // loading → title → intro → battle → win → ready → opening → letter
  let hits = 0, hitCD = 0, swingCD = 0, stopT = 0, shakeT = 0, shakeA = 0, time = 0, runId = 0;
  const NAME = () => C.name.toUpperCase();
  const BOSS = () => C.bossName.toUpperCase();

  /* ================= handheld-RPG text box ================= */
  const TB = { active: false, queue: [], line: '', shown: 0, acc: 0, typing: false, waitT: 0, done: null };
  function say(lines, done) {
    TB.active = true; TB.queue = lines.slice(); TB.done = done || null;
    textBox.classList.remove('hint'); textBox.classList.add('show');
    nextLine();
  }
  function nextLine() {
    const item = TB.queue.shift();
    if (item === undefined) {
      TB.active = false; textBox.classList.remove('show', 'wait');
      const d = TB.done; TB.done = null;
      if (d) d();
      return;
    }
    const it = typeof item === 'string' ? { text: item } : item;
    TB.line = it.text; TB.shown = 0; TB.acc = 0; TB.typing = true;
    textLine.textContent = ''; textBox.classList.remove('wait');
    if (it.on) it.on();
  }
  function finishLine() {
    TB.shown = TB.line.length; textLine.textContent = TB.line;
    TB.typing = false; TB.waitT = 2.4; textBox.classList.add('wait');
  }
  function advanceText() { if (TB.typing) finishLine(); else nextLine(); }
  function tickText(dt) {
    if (!TB.active) return;
    if (TB.typing) {
      TB.acc += dt;
      while (TB.acc >= 0.028 && TB.shown < TB.line.length) { TB.acc -= 0.028; TB.shown++; if (TB.shown % 3 === 0) sfx.blip(); }
      textLine.textContent = TB.line.slice(0, TB.shown);
      if (TB.shown >= TB.line.length) finishLine();
    } else if ((TB.waitT -= dt) <= 0) nextLine(); // never gets stuck: lines move on by themselves too
  }
  function hint(text) { TB.active = false; textLine.textContent = text; textBox.classList.remove('wait'); textBox.classList.add('show', 'hint'); }
  function hideHint() { if (!TB.active) textBox.classList.remove('show', 'hint', 'wait'); }

  /* ================= input ================= */
  function toGame(e) {
    if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;
    ptr.x = e.clientX / S; ptr.y = e.clientY / S;
  }
  addEventListener('pointermove', toGame, { passive: true });
  addEventListener('pointerdown', (e) => {
    sfx.init();
    if (e.target && e.target.closest && e.target.closest('#mute, #intro, #letter')) return;
    toGame(e);
    act();
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state === 'letter') { closeLetter(); return; }
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    if (state === 'loading' || state === 'title' || state === 'letter') return;
    e.preventDefault(); sfx.init(); act();
  });
  function act() {
    if (TB.active) { advanceText(); return; }
    if (state === 'battle') swing();
    else if (state === 'ready') openEnvelope();
  }

  /* ================= little Soap + her baguette ================= */
  const restAngle = () => kid.face * 0.35;
  function swing() {
    if (swingCD > 0) return;
    swingCD = 0.3;
    bag.a = restAngle() - kid.face * 0.5;   // quick wind-up...
    bag.w = kid.face * 30;                  // ...then the big bonk
    sfx.whoosh();
  }
  function girlPose() {
    const side = kid.face > 0 ? 'R' : 'L';
    const speed = Math.hypot(kid.vx, kid.vy), moving = speed > 12;
    const legs = moving ? ['walkA', 'idle', 'walkB', 'idle'][Math.floor(kid.walkT) % 4] : 'idle';
    const cheering = state === 'ready' || state === 'opening' || state === 'letter';
    const happy = kid.happyT > 0 || cheering ? 1 : 0;
    let bob = moving ? (Math.floor(kid.walkT) % 2 ? -1 : 0) : (Math.floor(time * 2) % 2 ? -1 : 0);
    if (cheering && !moving) bob = Math.floor(time * 3) % 3 === 0 ? -3 : 0;
    const sx = Math.round(kid.x - A.GIRL_W / 2), sy = Math.round(kid.y - A.GIRL_H / 2) + bob;
    const gp = A.GRIP[side];
    return { img: A.girl[legs + happy + side], sx, sy, gx: sx + gp.x, gy: sy + gp.y };
  }
  function updateKid(dt) {
    let tx = ptr.x, ty = ptr.y - (coarse ? 20 : 0);
    if (state === 'ready' || state === 'opening' || state === 'letter') {
      const envHalf = (34 * Math.max(4, S)) / S / 2;
      tx = iw / 2 - envHalf - 14; ty = ih / 2 + 4;
    }
    tx = clamp(tx, 10, iw - 10); ty = clamp(ty, 14, ih - 14);
    const ax = (tx - kid.x) * 200 - kid.vx * 19, ay = (ty - kid.y) * 200 - kid.vy * 19;
    kid.vx += ax * dt; kid.vy += ay * dt; kid.x += kid.vx * dt; kid.y += kid.vy * dt;
    if (!Number.isFinite(kid.x) || !Number.isFinite(kid.y)) { kid.x = tx; kid.y = ty; kid.vx = kid.vy = 0; }
    const speed = Math.hypot(kid.vx, kid.vy);
    kid.walkT += dt * clamp(speed / 7, 0, 14);
    kid.happyT -= dt;

    let want = kid.face;
    if (cake.alive) { const cx = cakeX() + CAKE.w / 2; if (Math.abs(cx - kid.x) > 6) want = Math.sign(cx - kid.x); }
    else if (state === 'ready' || state === 'letter') want = 1;
    else if (Math.abs(kid.vx) > 25) want = Math.sign(kid.vx);
    if (want !== kid.face) { kid.face = want; bag.a = -bag.a; bag.w = -bag.w; }

    kid.dustT -= dt;
    if (speed > 70 && kid.dustT <= 0) {
      kid.dustT = 0.08;
      parts.push({ x: kid.x - Math.sign(kid.vx) * 5, y: kid.y + 15, vx: rand(-8, 8), vy: rand(-10, -3), g: 0, life: 0.3, col: '#ffffff', size: 1, ground: 1e9 });
    }

    // the baguette springs back to "ready" and swings around when she runs
    bag.w += (-(bag.a - restAngle()) * 120 - bag.w * 7 - (Math.sin(bag.a) * ay + Math.cos(bag.a) * ax) * (0.7 / 18)) * dt;
    bag.a += bag.w * dt;
    if (!Number.isFinite(bag.a) || !Number.isFinite(bag.w)) { bag.a = restAngle(); bag.w = 0; }
  }

  /* ================= the boss ================= */
  const cakeX = () => Math.round(iw / 2 + cake.rope * Math.sin(cake.theta) - CAKE.ropeX);
  const cakeY = () => Math.round(cake.rope * Math.cos(cake.theta));
  const inCake = (px, py) => { const x0 = cakeX(), y0 = cakeY(); return px >= x0 + 1 && px <= x0 + CAKE.w - 2 && py >= y0 + 3 && py <= y0 + CAKE.h - 2; };

  function updateCake(dt) {
    if (!cake.show) return;
    const target = cake.alive ? ropeTarget : -CAKE.h - 12;
    cake.ropeV += ((target - cake.rope) * (cake.alive ? 70 : 12) - cake.ropeV * (cake.alive ? 7 : 5)) * dt;
    cake.rope += cake.ropeV * dt;
    if (cake.alive && !cake.landed && cake.rope >= ropeTarget) { cake.landed = true; shakeT = 0.25; shakeA = 1; sfx.thud(); }
    const low = cake.alive && cake.hp / C.hitsToBreak <= 0.4;
    cake.omega += (-7 * Math.sin(cake.theta) - 0.5 * cake.omega + (low ? rand(-6, 6) : 0)) * dt;
    cake.theta = clamp(cake.theta + cake.omega * dt, -1, 1);
    for (const k of ['flashT', 'blinkT', 'shakeT', 'hurtT']) cake[k] -= dt;
    if (cake.faintT > 0 && (cake.faintT -= dt) <= 0) burst();
  }

  const WORDS = ['BONK!', 'WHACK!', 'CRUNCH!', 'BREAD ATTACK!', 'THWAP!', 'CRUMBS!', 'POW!'];
  function popWord(x, y, text, big) {
    const el = document.createElement('span');
    el.className = 'pop' + (big ? ' big' : '');
    el.textContent = text;
    el.style.left = clamp(x * S, 90, innerWidth - 90) + 'px'; el.style.top = y * S + 'px';
    if (!big) el.style.color = pick(['#ffffff', '#ffd84a', '#bfe0ff', '#ffc2d6']);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), big ? 1700 : 900);
  }

  function spray(x, y, n, dir) {
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI * 0.95, -0.05), sp = rand(30, 120), r = Math.random();
      parts.push({
        x, y, vx: Math.cos(a) * sp + dir * 40, vy: Math.sin(a) * sp - 20, g: 320, life: rand(1.6, 3),
        ground: rand(floorY + 3, ih - 3), size: Math.random() < 0.3 ? 2 : 1,
        col: r < 0.45 ? pick(['#f7cf7d', '#e7b35d']) : r < 0.78 ? '#fffaf1' : '#e8405a',
        img: r > 0.93 ? A.STRAW : null,
      });
    }
  }

  function updateBars() {
    const pct = (cake.hp / C.hitsToBreak) * 100;
    bossHp.style.width = pct + '%';
    bossHp.className = pct > 50 ? '' : pct > 20 ? 'mid' : 'lo';
    playerExp.style.width = (Math.min(hits, C.hitsToBreak) / C.hitsToBreak) * 100 + '%';
  }

  function onHit(x, y) {
    hits++;
    cake.hp = Math.max(0, C.hitsToBreak - hits);
    hitCD = 0.25; stopT = 0.07; shakeT = 0.2; shakeA = 1;
    cake.flashT = 0.07; cake.blinkT = 0.45; cake.hurtT = 0.55; cake.shakeT = 0.3;
    cake.omega += kid.face * 1.6;
    bag.w *= -0.3; kid.happyT = 0.45;
    sfx.hit();
    const last = cake.hp === 0;
    popWord(x, y, last ? 'CRITICAL HIT!' : hits === 1 ? "IT'S SUPER EFFECTIVE!" : pick(WORDS));
    spray(x, y, 18, kid.face);
    updateBars(); retrigger(bossBox, 'hurt');
    if (hits === 1) hideHint();
    if (navigator.vibrate) navigator.vibrate(30);
    if (last) { state = 'win'; cake.faintT = 1.1; stopT = 0.25; sfx.faint(); }
  }

  function burst() {
    cake.alive = false;
    sfx.boom(); flashEl.classList.remove('twice'); retrigger(flashEl, 'go');
    shakeT = 0.6; shakeA = 2;
    const x0 = cakeX(), y0 = cakeY();
    // the cake shatters into chunky pixel tiles
    const comp = A.mk(CAKE.w, CAKE.h), cx = comp.getContext('2d');
    cx.drawImage(CAKE.img, 0, 0); cx.drawImage(CAKE.faces.ko, CAKE.faceX, CAKE.faceY);
    const T = 6, mx = x0 + CAKE.w / 2, my = y0 + CAKE.h / 2;
    for (let ty = 0; ty < CAKE.h; ty += T) for (let tx = 0; tx < CAKE.w; tx += T) {
      const tile = A.mk(T, T); tile.getContext('2d').drawImage(comp, tx, ty, T, T, 0, 0, T, T);
      const px = x0 + tx + T / 2, py = y0 + ty + T / 2, dx = px - mx, dy = py - my, dl = Math.hypot(dx, dy) || 1;
      parts.push({ img: tile, x: px, y: py, vx: (dx / dl) * rand(40, 110), vy: (dy / dl) * rand(40, 90) - rand(60, 120), g: 320, ground: rand(floorY + 3, ih - 4), life: rand(3, 5) });
    }
    spray(mx, my, 50, 0);
    for (let i = 0; i < 12; i++) parts.push({ img: A.STRAW, x: mx + rand(-20, 20), y: my, vx: rand(-90, 90), vy: rand(-160, -60), g: 320, ground: rand(floorY + 3, ih - 4), life: rand(3, 5) });
    for (let i = 0; i < 140; i++) {
      parts.push({ x: rand(0, iw), y: rand(-ih * 0.9, -2), vx: 0, vy: rand(14, 30), g: 0, flutter: rand(0, 6), confetti: true, life: 9, size: 1,
        col: pick(['#3d7bff', '#8ec5ff', '#ffffff', '#ff6b98', '#ffe27a', '#7ad37a']), ground: rand(floorY + 2, ih - 2) });
    }
    popWord(mx, my, 'HAPPY BIRTHDAY!', true);
    const id = runId;
    setTimeout(() => {
      if (id !== runId) return;
      const lines = [`${BOSS()} fainted!`];
      if (C.age) lines.push({ text: `${NAME()} grew to Lv. ${C.age}!`, on: levelUp });
      lines.push(`${NAME()} found a letter!`);
      say(lines, showEnvelope);
    }, 900);
  }
  function levelUp() {
    playerLv.textContent = `Lv${C.age}`; retrigger(playerLv, 'up');
    sfx.levelUp();
  }

  /* ================= flow ================= */
  function applyText() {
    document.title = `happy birthday, ${C.name} ♡`;
    document.querySelectorAll('.name-slot').forEach((el) => (el.textContent = C.name));
    $('#startText').textContent = C.startScreen;
    $('#bossName').textContent = C.bossName;
    $('#playerName').textContent = C.name;
    $('#greeting').textContent = C.greeting;
    $('#signOff').textContent = C.signOff;
    $('#from').textContent = C.from;
  }
  function drawEnv(open) {
    const x = envCanvas.getContext('2d');
    x.clearRect(0, 0, envCanvas.width, envCanvas.height);
    x.drawImage(A.envelope(open), 0, 0);
  }
  function drawPreview() {
    const c = $('#preview'), x = c.getContext('2d');
    x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
    const sx = 6, sy = 8, gp = A.GRIP.R, b = A.baguette(0.35);
    x.drawImage(A.girl.idle1R, sx, sy);
    x.drawImage(b.c, sx + gp.x - b.ox, sy + gp.y - b.oy);
  }

  function startGame() {
    if (state !== 'title') return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    $('#intro').classList.add('hide');
    sfx.init();
    startBattle();
  }
  function startBattle() {
    runId++;
    hits = 0; parts.length = 0; hitCD = 0; swingCD = 0;
    Object.assign(cake, { show: true, alive: true, hp: C.hitsToBreak, rope: -CAKE.h - 12, ropeV: 0, theta: rand(-0.2, 0.2), omega: 0, landed: false, flashT: 0, blinkT: 0, shakeT: 0, hurtT: 0, faintT: 0 });
    envWrap.classList.remove('show'); drawEnv(false);
    playerLv.textContent = C.age ? `Lv${C.age - 1}` : ''; playerLv.classList.remove('up');
    updateBars();
    state = 'intro';
    document.body.classList.add('follow', 'boss');
    flashEl.classList.remove('go'); retrigger(flashEl, 'twice');
    sfx.battle();
    const id = runId;
    setTimeout(() => {
      if (id !== runId) return;
      say([`A wild ${BOSS()} appeared!`, `Go, ${NAME()}! Whack it with your baguette!`], () => {
        if (id !== runId) return;
        state = 'battle';
        hint(coarse ? 'DRAG TO MOVE · TAP TO SWING' : 'MOVE TO WALK · CLICK TO SWING');
      });
    }, 800);
  }
  function showEnvelope() {
    state = 'ready';
    document.body.classList.remove('follow');
    drawEnv(false);
    envWrap.classList.add('show');
    sfx.coin();
  }
  function openEnvelope() {
    if (state !== 'ready') return;
    state = 'opening';
    drawEnv(true); sfx.coin();
    const id = runId;
    setTimeout(() => { if (id === runId) openLetter(); }, 550);
  }
  envelope.addEventListener('click', openEnvelope);

  let typer = null;
  function openLetter() {
    state = 'letter';
    letter.classList.add('show');
    sfx.birthday();
    typeLetter();
  }
  function typeLetter() {
    clearInterval(typer);
    const body = $('#letterBody');
    body.innerHTML = '';
    dialog.classList.remove('done');
    const ps = C.letter.map(() => { const p = document.createElement('p'); body.appendChild(p); return p; });
    let pi = 0, ci = 0, tick = 0;
    const finish = () => {
      clearInterval(typer); typer = null;
      ps.forEach((p, i) => { p.textContent = C.letter[i]; p.classList.remove('typing'); });
      dialog.classList.add('done');
    };
    dialog.finishTyping = finish;
    if (!ps.length) return finish();
    typer = setInterval(() => {
      const p = ps[pi], full = C.letter[pi];
      p.classList.add('typing');
      ci = Math.min(full.length, ci + 2);
      p.textContent = full.slice(0, ci);
      if (tick++ % 2 === 0) sfx.blip();
      if (ci >= full.length) { p.classList.remove('typing'); pi++; ci = 0; if (pi >= ps.length) finish(); }
    }, 35);
  }
  function closeLetter() {
    if (dialog.finishTyping) dialog.finishTyping();
    letter.classList.remove('show');
    if (state === 'letter') state = 'ready';   // tap the envelope (or anywhere) to read it again
  }
  dialog.addEventListener('click', (e) => { if (!e.target.closest('button') && !dialog.classList.contains('done') && dialog.finishTyping) dialog.finishTyping(); });
  letter.addEventListener('click', (e) => { if (e.target === letter) closeLetter(); });
  $('#closeLetter').addEventListener('click', closeLetter);
  $('#skip').addEventListener('click', () => dialog.finishTyping && dialog.finishTyping());
  $('#replay').addEventListener('click', () => { closeLetter(); sfx.stopSong(); sfx.coin(); startBattle(); });
  startBtn.addEventListener('click', startGame);
  $('#mute').addEventListener('click', (e) => { e.currentTarget.classList.toggle('off', sfx.toggle()); e.currentTarget.blur(); });

  /* ================= update ================= */
  function update(dt) {
    swingCD -= dt; hitCD -= dt; shakeT -= dt;
    if (state !== 'loading' && state !== 'title') updateKid(dt);
    updateCake(dt);

    if (state === 'battle' && cake.alive) {
      const pose = girlPose(), b = A.baguette(bag.a);
      // she swings by herself when the cake is in reach
      if (swingCD < -0.2 && Math.abs(bag.w) < 4) {
        const fwd = restAngle() + kid.face * 1.4;
        const near = [0.5, 0.8, 1].some((k) => inCake(pose.gx + Math.sin(fwd) * b.len * k, pose.gy - Math.cos(fwd) * b.len * k));
        if (near || inCake(kid.x, kid.y)) swing();
      }
      if (hitCD <= 0 && Math.abs(bag.w) > 5) {
        for (const k of [0.45, 0.75, 1]) {
          const px = pose.gx + Math.sin(bag.a) * b.len * k, py = pose.gy - Math.cos(bag.a) * b.len * k;
          if (inCake(px, py)) { onHit(px, py); break; }
        }
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      p.vy += p.g * dt;
      if (p.confetti) { p.flutter += dt * 5; p.vx = Math.sin(p.flutter) * 14; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y >= p.ground && p.vy > 0) {
        p.y = p.ground;
        if (p.confetti || Math.abs(p.vy) < 25) { p.vx = p.vy = p.g = 0; p.confetti = false; }
        else { p.vy *= -0.35; p.vx *= 0.5; }
      }
      if (p.life <= 0) parts.splice(i, 1);
    }
  }

  /* ================= render ================= */
  const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; };
  function pixLine(x0, y0, x1, y1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy, n = 0;
    for (;;) {
      g.fillRect(x0, y0, 1, 1);
      if ((x0 === x1 && y0 === y1) || n++ > 2000) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  function drawParticle(p) {
    if (p.life < 0.6 && Math.floor(p.life * 12) % 2) return;
    if (p.img) g.drawImage(p.img, Math.round(p.x - p.img.width / 2), Math.round(p.y - p.img.height / 2));
    else { g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
  }
  function render() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#cfe3ff'; g.fillRect(0, 0, iw, ih);
    const sh = shakeT > 0 ? shakeA : 0;
    g.translate(sh ? Math.round(rand(-sh, sh)) : 0, sh ? Math.round(rand(-sh, sh)) : 0);
    if (room) g.drawImage(room, 0, 0);

    if (tinsel) { // twinkles on the tinsel curtain
      const k = Math.floor(time * 6), w = Math.max(1, tinsel.x1 - tinsel.x0), h = Math.max(1, tinsel.y1 - tinsel.y0);
      g.fillStyle = '#ffffff';
      for (let i = 0; i < 12; i++) { const v = hash(k * 131 + i); g.fillRect(tinsel.x0 + (v % w), tinsel.y0 + ((v >>> 8) % h), 1, 1); }
    }
    for (const b of balloons) {
      const bob = Math.sin(time * 1.7 + b.phase) > 0 ? 0 : 1;
      g.fillStyle = '#f4f6fb';
      for (let j = 0; j < b.str; j++) g.fillRect(b.x + 4 + ((j >> 1) % 2), b.y + 9 + bob + j, 1, 1);
      g.drawImage(b.img, b.x, b.y + bob);
    }

    if (cake.show && cake.rope > -CAKE.h - 8) {
      const x0 = cakeX(), y0 = cakeY();
      const bob = cake.alive && Math.floor(time * 2) % 2 ? 1 : 0;
      let dx = 0;
      if (cake.faintT > 0) dx = Math.floor(time * 40) % 2 ? 2 : -2;
      else if (cake.shakeT > 0) dx = Math.floor(time * 30) % 2 ? 1 : -1;
      if (cake.rope > 0) {
        g.fillStyle = '#3d7bff'; pixLine(iw / 2, 0, x0 + CAKE.ropeX + dx, y0 + bob + 1);
        g.fillStyle = '#a9d0ff'; pixLine(iw / 2 + 1, 0, x0 + CAKE.ropeX + 1 + dx, y0 + bob + 1);
      }
      const hidden = cake.blinkT > 0 && Math.floor(cake.blinkT * 16) % 2 === 0;
      if ((cake.alive || cake.faintT > 0) && !hidden) {
        const X = x0 + dx, Y = y0 + bob;
        g.drawImage(CAKE.img, X, Y);
        const face = cake.faintT > 0 ? 'ko' : cake.hurtT > 0 ? 'hurt' : cake.hp / C.hitsToBreak <= 0.4 ? 'worried' : 'angry';
        g.drawImage(CAKE.faces[face], X + CAKE.faceX, Y + CAKE.faceY);
        if (cake.flashT > 0 || (cake.faintT > 0 && Math.floor(time * 10) % 2)) g.drawImage(CAKE.white, X, Y);
      }
    }

    for (const p of parts) if (!p.confetti) drawParticle(p);

    if (state !== 'loading' && state !== 'title') {
      const pose = girlPose();
      g.fillStyle = 'rgba(43,39,69,.22)';
      g.fillRect(Math.round(kid.x) - 7, pose.sy + A.GIRL_H - 1, 14, 2);
      const front = Math.sin(bag.a) * kid.face >= -0.05;
      const drawBag = () => {
        if (Math.abs(bag.w) > 12) {
          g.globalAlpha = 0.3;
          for (const a of bag.ghosts) { const gb = A.baguette(a); g.drawImage(gb.c, pose.gx - gb.ox, pose.gy - gb.oy); }
          g.globalAlpha = 1;
        }
        const b = A.baguette(bag.a);
        g.drawImage(b.c, pose.gx - b.ox, pose.gy - b.oy);
      };
      if (!front) drawBag();
      g.drawImage(pose.img, pose.sx, pose.sy);
      if (front) drawBag();
      bag.ghosts = [bag.a - bag.w * 0.03, bag.a - bag.w * 0.015];
    }
    for (const p of parts) if (p.confetti) drawParticle(p);
  }

  /* ================= main loop ================= */
  let last = performance.now();
  function frame(now) {
    try {
      const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 30);
      last = now; time += dt;
      tickText(dt);
      if (stopT > 0) stopT -= dt; // hit-stop: freeze a beat so hits feel crunchy
      else { update(dt / 2); update(dt / 2); }
      render();
    } catch (err) {
      console.error(err); // keep the loop alive no matter what
    }
    requestAnimationFrame(frame);
  }

  /* ================= boot ================= */
  layout();
  applyText(); drawPreview(); drawEnv(false);
  addEventListener('resize', layout);
  requestAnimationFrame(frame);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load('10px "Press Start 2P"'), wait(1500)]).catch(() => {})
    : Promise.resolve();
  Promise.all([loadConfig(), fontsReady])
    .then(([res]) => {
      C = res.cfg;
      if (res.note) { const n = $('#notice'); n.textContent = res.note; n.hidden = false; }
    })
    .catch((e) => console.error(e))
    .then(() => {
      applyText();
      iw = ih = 0; layout(); // rebuild the room now that we know her age
      state = 'title';
      startBtn.disabled = false;
      startBtn.textContent = '▶ PRESS START';
    });
})();
