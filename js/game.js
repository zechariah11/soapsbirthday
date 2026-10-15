(() => {
  /* ================= config.json ================= */
  const DEFAULTS = {
    name: 'Soap',
    age: 27,
    opponentName: 'Zech',
    whipTaps: 40,
    strawberriesToCatch: 15,
    hitsToBreak: 5,
    bossName: 'Giant Strawberry Cake',
    startScreen: "I couldn't be there today, so little you is baking a giant Sungsimdang strawberry cake: catch the strawberries, beat me at whipping the cream, then build the cake (and deal with whatever happens next).",
    greeting: 'Dear {name},',
    letter: ['Happy birthday! (Write your letter in config.json.)'],
    signOff: 'love,',
    from: 'me',
  };

  function normalise(raw) {
    const c = { ...DEFAULTS, ...(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) };
    const int = (v, lo, hi, dflt) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };
    c.name = String(c.name ?? '').trim() || DEFAULTS.name;
    c.opponentName = String(c.opponentName ?? '').trim() || DEFAULTS.opponentName;
    const age = parseInt(c.age, 10);
    c.age = Number.isFinite(age) && age > 0 ? age : null;
    c.hitsToBreak = int(c.hitsToBreak, 1, 50, 5);
    c.whipTaps = int(c.whipTaps, 10, 200, 40);
    c.strawberriesToCatch = int(c.strawberriesToCatch, 3, 60, 15);
    const fill = (s) => String(s ?? '').replace(/\{name\}/g, c.name).replace(/\{age\}/g, c.age ?? '').replace(/\{opponent\}/g, c.opponentName);
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
      return { cfg: normalise(null), note: `Couldn't load config.json (${e.message}), so the built-in text is showing.` };
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
  const NAME = () => C.name.toUpperCase();
  const OPP = () => C.opponentName.toUpperCase();
  const BOSS = () => C.bossName.toUpperCase();

  const textBox = $('#textBox'), textLine = $('#textLine');
  const bossBox = $('#bossBox'), bossHp = $('#bossHp'), playerExp = $('#playerExp'), playerLv = $('#playerLv');
  const stageLabel = $('#stageLabel'), stageRows = $('#stageRows'), callout = $('#callout');
  const stageCard = $('#stageCard');
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
      whisk: () => play((t) => noise(t, 0.05, 0.3, rand(3200, 4400), 'highpass')),
      beep: (go) => play((t) => tone(go ? 988 : 660, t, go ? 0.35 : 0.12, 0.13)),
      catch: () => play((t) => { tone(784, t, 0.05, 0.12); tone(1175, t + 0.05, 0.12, 0.12); }),
      gold: () => play((t) => seq([784, 988, 1175, 1568], t, 0.06, 0.12)),
      toast: () => play((t) => { tone(150, t, 0.3, 0.25, 'square', 55); noise(t, 0.2, 0.4, 300, 'lowpass'); }),
      splat: () => play((t) => noise(t, 0.08, 0.2, 700, 'lowpass')),
      clear: () => play((t) => seq([523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5], t, 0.09, 0.13)),
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
  const kid = { x: 0, y: 0, vx: 0, vy: 0, face: 1, walkT: 0, happyT: 0, dustT: 0, hopT: 0, hug: false };
  const parts = [];
  const CT = { items: [] }; // strawberry-catch falling items (declared early so layout() can rescale them)
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
      const fx = iw / oldW, fy = ih / oldH;
      for (const o of [kid, ptr, ...parts, ...CT.items, ZE]) { o.x *= fx; o.y *= fy; if (o.ground) o.ground *= fy; }
      ZE.tx *= fx; ZE.fromX *= fx; ZE.fromY *= fy;
    } else {
      kid.x = ptr.x = iw * 0.25; kid.y = ptr.y = ih * 0.75;
    }
  }
  // where people stand in the mini-games: feet on the floor, above the bottom UI
  const groundY = () => Math.min(ih - 6, floorY + Math.round((ih - floorY) * 0.42));

  /* ================= game state ================= */
  // phase: loading → title → card → stage → (card → stage)… → ready → opening → letter
  let phase = 'loading', stageIdx = 0, flowId = 0;
  let stopT = 0, shakeT = 0, shakeA = 0, time = 0, lockT = 0, cardT = 0, cardMin = 0;
  const later = (ms, fn) => { const id = flowId; setTimeout(() => { if (id === flowId) fn(); }, ms); };
  const STAGE = () => STAGES[stageIdx];
  const inStage = (key) => (phase === 'stage' || phase === 'card') && STAGE().key === key;

  /* ================= handheld-RPG text box ================= */
  const TB = { active: false, queue: [], line: '', shown: 0, acc: 0, typing: false, waitT: 0, done: null, flow: 0 };
  function say(lines, done) {
    TB.active = true; TB.queue = lines.slice(); TB.done = done || null; TB.flow = flowId;
    textBox.classList.remove('hint'); textBox.classList.add('show');
    nextLine();
  }
  function nextLine() {
    const item = TB.queue.shift();
    if (item === undefined) {
      TB.active = false; textBox.classList.remove('show', 'wait');
      const d = TB.done; TB.done = null;
      if (d && TB.flow === flowId) d();
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
  function resetText() { TB.active = false; TB.queue = []; TB.done = null; textBox.classList.remove('show', 'wait', 'hint'); }
  function hint(text) { TB.active = false; textLine.textContent = text; textBox.classList.remove('wait'); textBox.classList.add('show', 'hint'); }
  function hideHint() { if (!TB.active) textBox.classList.remove('show', 'hint', 'wait'); }
  function showCallout(text) { callout.textContent = text; callout.classList.add('show'); }
  function hideCallout() { callout.classList.remove('show'); }

  function popWord(x, y, text, big, color) {
    const el = document.createElement('span');
    el.className = 'pop' + (big ? ' big' : '');
    el.textContent = text;
    el.style.left = clamp(x * S, 90, innerWidth - 90) + 'px'; el.style.top = clamp(y * S, 40, innerHeight - 20) + 'px';
    if (color || !big) el.style.color = color || pick(['#ffffff', '#ffd84a', '#bfe0ff', '#ffc2d6']);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), big ? 1700 : 900);
  }

  /* ================= input ================= */
  const keys = { left: false, right: false };
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
    if (e.key === 'Escape' && phase === 'letter') { closeLetter(); return; }
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    if (phase === 'loading' || phase === 'title' || phase === 'letter') return;
    e.preventDefault();
    if (e.repeat) return; // holding a key down must not count as rapid taps
    sfx.init(); act();
  });
  addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });
  addEventListener('blur', () => { keys.left = keys.right = false; });
  function act() {
    if (lockT > 0) return;
    if (phase === 'card') { if (cardMin <= 0) endCard(); return; }
    if (TB.active) { advanceText(); return; }
    if (phase === 'stage') STAGE().tap();
    else if (phase === 'bake') bakeTap();
    else if (phase === 'ready') openEnvelope();
  }

  /* ================= little Soap ================= */
  const bag = { a: 0.35, w: 0, ghosts: [] };   // baguette angle (0 = straight up) and spin speed
  const restAngle = () => kid.face * 0.35;
  const ending = () => phase === 'ready' || phase === 'opening' || phase === 'letter';
  const hasBaguette = () => (inStage('boss') && B.sub !== 'rescue') || (phase === 'bake' && K.grabbed);
  function girlPose() {
    const side = kid.face > 0 ? 'R' : 'L';
    const speed = Math.hypot(kid.vx, kid.vy), moving = speed > 12;
    const legs = moving ? ['walkA', 'idle', 'walkB', 'idle'][Math.floor(kid.walkT) % 4] : 'idle';
    const happy = kid.happyT > 0 || ending() || kid.hug || (phase === 'bake' && !K.alive) ? 1 : 0;
    let bob = moving ? (Math.floor(kid.walkT) % 2 ? -1 : 0) : (Math.floor(time * 2) % 2 ? -1 : 0);
    if (kid.hug && !moving) bob = Math.floor(time * 2.5) % 2 ? -1 : 0; // swaying together in the hug
    if (kid.hopT > 0) bob -= 1;
    let sx = Math.round(kid.x - A.GIRL_W / 2);
    if (CT.dizzyT > 0 && inStage('catch')) sx += Math.floor(time * 30) % 2 ? 1 : -1;
    const sy = Math.round(kid.y - A.GIRL_H / 2) + bob;
    const gp = A.GRIP[side];
    return { img: A.girl[legs + happy + side], sx, sy, gx: sx + gp.x, gy: sy + gp.y };
  }
  function kidTarget() {
    if (ending() || (inStage('boss') && B.sub === 'rescue')) return { x: hugX() - 7, y: groundY() - A.GIRL_H / 2 + 1 };
    if (inStage('whip')) return { x: whipGeo().her, y: groundY() - A.GIRL_H / 2 + 1 };
    if (phase === 'bake') return { x: bakeSpot().her, y: groundY() - A.GIRL_H / 2 + 1 };
    if (inStage('catch')) {
      if (keys.left || keys.right) ptr.x = clamp(ptr.x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 2.2, 0, iw);
      return { x: CT.dizzyT > 0 ? kid.x : ptr.x, y: groundY() - A.GIRL_H / 2 + 1 };
    }
    return { x: ptr.x, y: ptr.y - (coarse ? 20 : 0) };
  }
  function updateKid(dt) {
    const t = kidTarget();
    const tx = clamp(t.x, 10, iw - 10), ty = clamp(t.y, 14, ih - 14);
    const ax = (tx - kid.x) * 200 - kid.vx * 19, ay = (ty - kid.y) * 200 - kid.vy * 19;
    kid.vx += ax * dt; kid.vy += ay * dt; kid.x += kid.vx * dt; kid.y += kid.vy * dt;
    if (!Number.isFinite(kid.x) || !Number.isFinite(kid.y)) { kid.x = tx; kid.y = ty; kid.vx = kid.vy = 0; }
    const speed = Math.hypot(kid.vx, kid.vy);
    kid.walkT += dt * clamp(speed / 7, 0, 14);
    kid.happyT -= dt; kid.hopT -= dt;

    let want = kid.face;
    if (inStage('boss') && cake.alive) { const cx = cakeX() + CAKE.w / 2; if (Math.abs(cx - kid.x) > 6) want = Math.sign(cx - kid.x); }
    else if (ending() || (inStage('boss') && B.sub === 'rescue') || ((inStage('whip') || phase === 'bake') && speed < 20)) want = 1;
    else if (Math.abs(kid.vx) > 25) want = Math.sign(kid.vx);
    if (want !== kid.face) { kid.face = want; bag.a = -bag.a; bag.w = -bag.w; }

    kid.dustT -= dt;
    if (speed > 70 && kid.dustT <= 0) {
      kid.dustT = 0.08;
      parts.push({ x: kid.x - Math.sign(kid.vx) * 5, y: kid.y + 16, vx: rand(-8, 8), vy: rand(-10, -3), g: 0, life: 0.3, col: '#ffffff', size: 1, ground: 1e9 });
    }
    if (hasBaguette()) { // the baguette springs back to "ready" and swings around when she runs
      bag.w += (-(bag.a - restAngle()) * 120 - bag.w * 7 - (Math.sin(bag.a) * ay + Math.cos(bag.a) * ax) * (0.7 / 18)) * dt;
      bag.a += bag.w * dt;
      if (!Number.isFinite(bag.a) || !Number.isFinite(bag.w)) { bag.a = restAngle(); bag.w = 0; }
    } else { bag.a = restAngle(); bag.w = 0; }
  }

  /* ================= stage HUD ================= */
  function stageHud(label, rows) {
    stageLabel.textContent = label;
    stageRows.innerHTML = '';
    const out = {};
    for (const r of rows) {
      const row = document.createElement('div'); row.className = 'bar-row';
      const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = r.tag;
      const bar = document.createElement('div'); bar.className = 'bar';
      const fill = document.createElement('i'); fill.className = r.cls; fill.style.width = '0%'; bar.appendChild(fill);
      row.append(tag, bar);
      let num = null;
      if (r.num) { num = document.createElement('span'); num.className = 'num'; row.appendChild(num); }
      stageRows.appendChild(row);
      out[r.key] = { fill, num, last: -1 };
    }
    return out;
  }
  function setBar(b, frac, text) {
    const pct = Math.round(clamp(frac, 0, 1) * 100);
    if (pct !== b.last) { b.fill.style.width = pct + '%'; b.last = pct; }
    if (b.num && text != null && b.num.textContent !== text) b.num.textContent = text;
  }

  /* =====================================================================
     STAGE 1: whipped cream showdown (tap as fast as you can, vs Zech)
     ===================================================================== */
  const W = { sub: 'idle', p: 0, z: 0, cd: 0, cdShown: 0, sJig: 0, zJig: 0, stallT: 0, quipT: 0, taps: 0, said: {}, hud: null, zFace: 'normal', doneT: 0 };
  // the two chefs are drawn at 2x (a close-up, like a versus screen) when the screen has room for it
  function whipGeo() {
    const k = ih >= 145 && iw >= 120 ? 2 : 1, base = groundY();
    const her = Math.round(iw * (k > 1 && iw < 200 ? 0.27 : 0.3)), him = Math.round(iw * (k > 1 && iw < 200 ? 0.73 : 0.7));
    const off = iw < 200 ? 0 : 7; // on narrow screens each bowl sits right in front of its chef
    return { k, base, her, him, off, rim: base + 1 - 13 * k, herBowl: her + off * k, himBowl: him - off * k };
  }
  // Zech can lead a little early on (it's a real race!), but he is always capped just behind her near the end
  const zechCap = (p) => (p < 0.6 ? p + 0.1 * (1 - p / 0.6) : p - 0.06 * ((p - 0.6) / 0.4));

  function whipReset() {
    Object.assign(W, { sub: 'idle', p: 0, z: 0, cd: 0, cdShown: 0, sJig: 0, zJig: 0, stallT: 0, quipT: 0, taps: 0, said: {}, zFace: 'normal', doneT: 0 });
    kid.x = whipGeo().her; kid.y = groundY() - A.GIRL_H / 2 + 1; kid.vx = kid.vy = 0;
  }
  function whipBegin() {
    W.hud = stageHud(`STAGE 2 · WHIPPED CREAM`, [{ key: 'her', tag: NAME().slice(0, 6), cls: 'her' }, { key: 'him', tag: OPP().slice(0, 6), cls: 'him' }]);
    document.body.classList.add('hud-stage');
    W.sub = 'intro';
    say([
      `A challenger appeared! It's ${OPP()}!`,
      `${OPP()}: The cake needs whipped cream. First one to stiff peaks wins!`,
      coarse ? 'Tap the screen as fast as you can to whisk!' : 'Click (or press space) as fast as you can to whisk!',
    ], () => { W.sub = 'countdown'; W.cd = 3; W.cdShown = 4; lockT = 0.2; });
  }
  function whipTap() {
    if (W.sub !== 'race') return;
    W.taps++;
    W.p = Math.min(1, W.p + 1 / C.whipTaps);
    W.sJig = 1; kid.hopT = 0.06;
    sfx.whisk();
    const G = whipGeo(), cx = G.herBowl, rim = G.rim;
    parts.push({ x: cx + rand(-5, 5) * G.k, y: rim - (2 + Math.round(W.p * 6)) * G.k, vx: rand(-25, 25) * G.k, vy: rand(-60, -30) * G.k, g: 200 * G.k, life: 0.6, col: '#ffffff', size: G.k, ground: rim + 1 });
    for (const [at, word] of [[0.33, 'SOFT PEAKS!'], [0.66, 'STIFF PEAKS!']]) {
      if (W.p >= at && !W.said[word]) { W.said[word] = true; popWord(cx, rim - 12 * G.k, word); }
    }
    if (W.p >= 1) whipWin();
  }
  function whipUpdate(dt) {
    W.sJig = Math.max(0, W.sJig - dt * 6);
    if (W.sub === 'countdown') {
      W.cd -= dt;
      const n = Math.ceil(W.cd);
      if (n < W.cdShown && n >= 1) { W.cdShown = n; popWord(iw / 2, ih * 0.35, String(n), true, '#ffffff'); sfx.beep(false); }
      if (W.cd <= 0) {
        W.sub = 'race'; popWord(iw / 2, ih * 0.35, 'WHISK!', true, '#ffd84a'); sfx.beep(true);
        showCallout(coarse ? 'TAP! TAP! TAP!' : 'CLICK! CLICK! CLICK!');
      }
    }
    if (W.sub === 'race') {
      const cap = zechCap(W.p);
      const rate = 0.07 + 0.035 * Math.sin(time * 1.7) + 0.9 * Math.max(0, cap - W.z - 0.03);
      const before = W.z;
      W.z = Math.min(cap, W.z + Math.max(0, rate) * dt);
      const moving = W.z - before > dt * 0.02;
      W.zJig = moving ? (W.zJig + dt * 14) : W.zJig;
      // when he's stuck behind her he gets tired (that's his excuse, anyway)
      W.stallT = moving ? Math.max(0, W.stallT - dt) : W.stallT + dt;
      W.zFace = W.stallT > 0.6 ? 'tired' : 'normal';
      if (W.stallT > 1.2 && (W.quipT -= dt) <= 0) {
        W.quipT = 2.6;
        const G = whipGeo();
        popWord(G.him, G.base - 42 * G.k, pick(['huff… huff…', 'my arm…', 'phew!', 'so tired…']), false, '#e8f0d0');
      }
      if (W.p >= 0.3) hideCallout();
    }
    if (W.sub === 'done') {
      W.doneT += dt;
      if (W.doneT > 0.6 && W.zFace !== 'happy') W.zFace = 'lose';
    }
    if (W.hud) { setBar(W.hud.her, W.p); setBar(W.hud.him, W.z); }
  }
  function whipWin() {
    W.sub = 'done'; W.p = 1; hideCallout();
    kid.happyT = 99;
    sfx.clear(); shakeT = 0.2; shakeA = 1;
    const G = whipGeo(), rim = G.rim;
    popWord(G.herBowl, rim - 18 * G.k, 'PERFECT!', true, '#ffd84a');
    for (let i = 0; i < 24; i++) parts.push({ x: G.herBowl + rand(-6, 6) * G.k, y: rim - 8 * G.k, vx: rand(-50, 50) * G.k, vy: rand(-110, -40) * G.k, g: 220 * G.k, life: rand(0.8, 1.4), col: pick(['#ffffff', '#fff3c4', '#ffd84a']), size: G.k, ground: rim + 2 });
    later(1300, () => say([
      `${NAME()} whipped the perfect cream!`,
      { text: `${OPP()}: How are you so fast?! …Okay, you win.`, on: () => { W.zFace = 'happy'; } },
    ], () => stageClear()));
  }
  function drawCream(cx, rim, prog) {
    const h = Math.round(prog * 6);
    g.fillStyle = prog > 0.02 ? '#fff6e6' : '#fff1d6';
    g.fillRect(cx - 6, rim, 12, 1);
    for (let j = 1; j <= h; j++) {
      const t = j / (h + 0.6), hw = Math.max(1, Math.round(6 * (1 - Math.pow(t, 1.4))));
      g.fillStyle = j === h ? '#ffffff' : '#fffaf0';
      g.fillRect(cx - hw, rim - j, hw * 2, 1);
      g.fillStyle = '#eadcc6'; g.fillRect(cx + hw - 1, rim - j, 1, 1);
    }
    if (prog >= 0.85) { g.fillStyle = '#ffffff'; g.fillRect(cx, rim - h - 1, 1, 1); g.fillRect(cx + 1, rim - h - 2, 1, 1); }
  }
  function drawChef(img, cx, who, prog, jig, toward, k, lift, off) {
    // drawn in local coordinates (feet at y = 0) and scaled up by k for the close-up
    g.save();
    g.translate(Math.round(cx), groundY() + 1 + (lift || 0)); g.scale(k, k);
    // shorter chefs stand a little taller behind the counter so every face clears the bowl
    g.drawImage(img, -Math.round(img.width / 2), -img.height - Math.max(0, A.GIRL_H - img.height));
    const ct = A.counter(26, 6, who);
    g.drawImage(ct, -Math.round(ct.width / 2), -ct.height + 1 - (lift || 0) / k);
    const bowl = A.BOWLS[who], bx = Math.round(toward * off - bowl.width / 2), by = -ct.height + 1 - bowl.height + 1 - (lift || 0) / k;
    const wh = A.WHISKS[who], wx = bx + Math.round(bowl.width / 2 - wh.width / 2 + Math.sin(jig * Math.PI) * 3);
    g.drawImage(wh, wx, by + 8 - wh.height);
    g.drawImage(bowl, bx, by);
    drawCream(bx + Math.round(bowl.width / 2), by + 1, prog);
    g.restore();
  }
  function whipRender() {
    const G = whipGeo();
    const herImg = A.girl[`idle${kid.happyT > 0 ? 1 : 0}R`];
    const racing = W.sub === 'race' || W.sub === 'done';
    drawChef(herImg, G.her, 'soap', W.p, racing ? W.taps * 0.5 + W.sJig * 0.5 : 0, 1, G.k, kid.hopT > 0 ? -G.k : 0, G.off);
    const zBob = W.sub === 'race' && W.stallT < 0.3 && Math.floor(W.zJig) % 2 ? -G.k : 0;
    drawChef(A.zech[W.zFace], G.him, 'zech', W.z, W.zJig, -1, G.k, zBob, G.off);
  }

  /* =====================================================================
     STAGE 2: strawberry catch (no timer, no way to lose)
     ===================================================================== */
  Object.assign(CT, { sub: 'idle', caught: 0, spawnT: 0, missStreak: 0, dizzyT: 0, spawned: 0, hud: null, moved: false });
  function catchReset() {
    Object.assign(CT, { sub: 'idle', caught: 0, spawnT: 0.6, missStreak: 0, dizzyT: 0, spawned: 0, moved: false });
    CT.items.length = 0;
  }
  function catchBegin() {
    CT.hud = stageHud('STAGE 1 · STRAWBERRY CATCH', [{ key: 'b', tag: '🍓', cls: 'berry', num: true }]);
    setBar(CT.hud.b, 0, `0/${C.strawberriesToCatch}`);
    document.body.classList.add('hud-stage');
    CT.sub = 'intro';
    say([
      `Let's bake ${NAME()} a giant strawberry cake!`,
      'First, strawberries… oh! They\'re raining from the ceiling!',
      `Catch ${C.strawberriesToCatch} for the cake! (Watch out for burnt toast.)`,
    ], () => {
      CT.sub = 'play'; lockT = 0.2;
      showCallout(coarse ? 'DRAG LEFT & RIGHT!' : 'MOVE LEFT & RIGHT!');
    });
  }
  function catchTap() { /* moving is all it takes: the tap already moved her (pointer position) */ }
  const bowlRim = () => Math.round(kid.y - A.GIRL_H / 2) + 20;
  function spawnItem() {
    CT.spawned++;
    const r = Math.random();
    const kind = CT.caught >= 2 && r < 0.14 ? 'toast' : r > 0.92 ? 'gold' : 'straw';
    let x;
    if (CT.spawned <= 2) x = kid.x + rand(-30, 30);                         // gentle start
    else if (kind !== 'toast' && CT.missStreak >= 2) x = kid.x + rand(-22, 22); // she's struggling: help her out
    else if (kind === 'toast') x = Math.abs(rand(-1, 1)) < 0.5 ? kid.x + pick([-1, 1]) * rand(25, 60) : rand(12, iw - 12);
    else x = rand(12, iw - 12);
    CT.items.push({ kind, x: clamp(x, 10, iw - 10), y: -8, py: -8, vy: ih * 0.08, wob: rand(0, 6) });
  }
  function catchUpdate(dt) {
    if (CT.dizzyT > 0) CT.dizzyT -= dt;
    if (CT.sub !== 'play' && CT.sub !== 'done') return;
    if (CT.sub === 'play') {
      if (Math.abs(kid.vx) > 30) { CT.moved = true; }
      if (CT.moved && CT.caught > 0) hideCallout();
      const maxItems = Math.min(4, 2 + Math.floor(CT.caught / 5));
      if ((CT.spawnT -= dt) <= 0 && CT.items.length < maxItems) { spawnItem(); CT.spawnT = rand(0.55, 0.95); }
    }
    const grav = ih * 0.32, vmax = ih * 0.45, rim = bowlRim();
    for (let i = CT.items.length - 1; i >= 0; i--) {
      const it = CT.items[i];
      it.py = it.y;
      it.vy = Math.min(vmax, it.vy + grav * dt);
      it.y += it.vy * dt;
      it.wob += dt * 4;
      if (it.kind !== 'toast') it.x += Math.sin(it.wob) * 4 * dt;
      // caught: it crossed the bowl's rim inside the bowl
      if (CT.sub === 'play' && it.py < rim && it.y >= rim - 1 && Math.abs(it.x - kid.x) <= 9) {
        CT.items.splice(i, 1);
        if (it.kind === 'toast') {
          CT.dizzyT = 0.9; sfx.toast(); popWord(kid.x, rim - 20, 'BURNT TOAST!', false, '#c9a27a');
          for (let k = 0; k < 6; k++) parts.push({ x: it.x, y: rim - 2, vx: rand(-20, 20), vy: rand(-30, -10), g: 0, life: 0.8, col: '#8a8a96', size: 2, ground: 1e9 });
        } else {
          const n = it.kind === 'gold' ? 3 : 1;
          CT.caught = Math.min(C.strawberriesToCatch, CT.caught + n); CT.missStreak = 0;
          kid.happyT = 0.35;
          if (n > 1) { sfx.gold(); popWord(kid.x, rim - 20, 'GOLDEN! +3', false, '#ffd84a'); } else { sfx.catch(); popWord(kid.x, rim - 18, '+1', false, '#ffc2d6'); }
          for (let k = 0; k < 5; k++) parts.push({ x: it.x, y: rim - 2, vx: rand(-30, 30), vy: rand(-50, -20), g: 160, life: 0.5, col: n > 1 ? '#ffd84a' : '#ffffff', size: 1, ground: rim + 6 });
          setBar(CT.hud.b, CT.caught / C.strawberriesToCatch, `${CT.caught}/${C.strawberriesToCatch}`);
          if (CT.caught >= C.strawberriesToCatch) catchWin();
        }
        continue;
      }
      // missed: it splats on the floor
      if (it.y > groundY() - 2) {
        CT.items.splice(i, 1);
        if (it.kind !== 'toast') {
          if (CT.sub === 'play') CT.missStreak++;
          sfx.splat();
          for (let k = 0; k < 6; k++) parts.push({ x: it.x, y: it.y, vx: rand(-30, 30), vy: rand(-40, -10), g: 200, life: rand(0.8, 1.6), col: pick(['#e8405a', '#ff8fa3']), size: 1, ground: it.y + rand(0, 3) });
        } else {
          for (let k = 0; k < 4; k++) parts.push({ x: it.x, y: it.y, vx: rand(-20, 20), vy: rand(-30, -10), g: 200, life: 1, col: '#4a2a14', size: 1, ground: it.y + 2 });
        }
      }
    }
  }
  function catchWin() {
    CT.sub = 'done'; hideCallout();
    kid.happyT = 99; sfx.clear();
    popWord(kid.x, bowlRim() - 24, 'BOWL FULL!', true, '#ffc2d6');
    later(1300, () => say([
      `${NAME()} caught ${C.strawberriesToCatch} strawberries!`,
      'Next up: the whipped cream!',
    ], () => stageClear()));
  }
  function catchRenderBowl(pose) {
    const bowl = A.BOWLS.soap, bx = Math.round(kid.x - bowl.width / 2) + (pose.sx - Math.round(kid.x - A.GIRL_W / 2)), by = pose.sy + 19;
    // strawberries piling up in the bowl
    const n = Math.min(CT.caught, 12);
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 4), col = i % 4;
      const px = bx + 3 + col * 3 + (row % 2) + 0, py = by - 1 - row * 2;
      g.fillStyle = '#e8405a'; g.fillRect(px, py, 3, 2);
      g.fillStyle = '#3d9a52'; g.fillRect(px + 1, py - 1, 1, 1);
    }
    g.drawImage(bowl, bx, by);
  }
  function catchRenderItems() {
    for (const it of CT.items) {
      const img = it.kind === 'toast' ? A.TOAST : it.kind === 'gold' ? A.GOLD_STRAW : A.STRAW_O;
      g.drawImage(img, Math.round(it.x - img.width / 2), Math.round(it.y - img.height / 2));
      if (it.kind === 'toast' && Math.floor(time * 6 + it.wob) % 2) { g.fillStyle = '#9aa0ad'; g.fillRect(Math.round(it.x) + 1, Math.round(it.y) - 6, 1, 1); g.fillRect(Math.round(it.x) - 1, Math.round(it.y) - 8, 1, 1); }
      if (it.kind === 'gold' && Math.floor(time * 8) % 2) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(it.x) + 4, Math.round(it.y) - 4, 1, 1); }
    }
    if (CT.dizzyT > 0) { // little stars circling her head
      const hx = kid.x, hy = Math.round(kid.y - A.GIRL_H / 2) - 2;
      g.fillStyle = '#ffd84a';
      for (let k = 0; k < 3; k++) { const a = time * 7 + k * 2.1; g.fillRect(Math.round(hx + Math.cos(a) * 9), Math.round(hy + Math.sin(a) * 2), 2, 2); }
    }
  }

  /* =====================================================================
     ZECH: watches her bake… gets kidnapped by the cake… gets rescued… hugs her
     ===================================================================== */
  // x = centre, y = feet, in game pixels
  const ZE = { mode: 'off', x: 0, y: 0, vx: 0, vy: 0, tx: 0, face: 'happy', t: 0, fromX: 0, fromY: 0, quipT: 0, cheerT: 0, dizzyT: 0, hug: false, reunite: false, heartT: 0 };
  const hugX = () => Math.round(iw / 2);
  function zechReset() { Object.assign(ZE, { mode: 'off', vx: 0, vy: 0, face: 'happy', t: 0, quipT: 2, cheerT: 0, dizzyT: 0, hug: false, reunite: false, heartT: 0 }); }
  function zechOnTop() { // stuck in the strawberry mountain on top of the cake, left of the bow
    const c = cakePosNow();
    return { x: c.x + 14, y: c.y + 18 };
  }
  function updateZech(dt) {
    if (ZE.mode === 'off') return;
    ZE.t += dt; ZE.dizzyT -= dt; ZE.cheerT -= dt;
    if (ZE.mode === 'walk') {
      ZE.y = groundY();
      const sp = (ZE.reunite ? 70 : 60) * dt;
      ZE.x += clamp(ZE.tx - ZE.x, -sp, sp);
    } else if (ZE.mode === 'yank') { // snatched up by the cake in an arc
      const t = clamp(ZE.t / 0.7, 0, 1), to = zechOnTop();
      ZE.x = ZE.fromX + (to.x - ZE.fromX) * t;
      ZE.y = ZE.fromY + (to.y - ZE.fromY) * t - Math.sin(t * Math.PI) * 28;
      if (t >= 1) ZE.mode = 'ontop';
    } else if (ZE.mode === 'ontop') {
      const p = zechOnTop(); ZE.x = p.x; ZE.y = p.y;
      if (inStage('boss') && B.sub === 'battle' && (ZE.quipT -= dt) <= 0) {
        ZE.quipT = rand(3, 4.5);
        popWord(ZE.x, ZE.y - 24, pick(['HELP!', `GO ${NAME()}!`, 'SAVE ME!', 'you got this!']), false, '#d6f5c4');
      }
    } else if (ZE.mode === 'fall') { // dropped when the cake bursts
      ZE.vy += 380 * dt; ZE.x += ZE.vx * dt; ZE.y += ZE.vy * dt;
      if (ZE.y >= groundY() && ZE.vy > 0) {
        ZE.y = groundY(); ZE.mode = 'walk'; ZE.dizzyT = 0.9; ZE.face = 'happy'; sfx.thud();
        if (!ZE.reunite) ZE.tx = ZE.x;
        for (let i = 0; i < 6; i++) parts.push({ x: ZE.x + rand(-6, 6), y: ZE.y, vx: rand(-20, 20), vy: rand(-20, -6), g: 0, life: 0.4, col: '#ffffff', size: 1, ground: 1e9 });
      }
    }
    if (ZE.hug && (ZE.heartT -= dt) <= 0) { // hearts float up from the hug
      ZE.heartT = 0.45;
      parts.push({ img: A.HEART, x: hugX() + rand(-5, 5), y: groundY() - 36, vx: rand(-6, 6), vy: -16, g: 0, life: 1.8, ground: 1e9 });
    }
  }
  function drawZech() {
    if (ZE.mode === 'off') return;
    const img = A.zech[ZE.cheerT > 0 || ZE.hug ? 'happy' : ZE.face];
    let x = Math.round(ZE.x - img.width / 2), y = Math.round(ZE.y) - img.height + 1;
    if (ZE.mode === 'walk' && Math.abs(ZE.tx - ZE.x) > 1) y += Math.floor(ZE.t * 10) % 2 ? -1 : 0;
    if (ZE.hug) y += Math.floor(time * 2.5) % 2 ? -1 : 0;
    if (ZE.dizzyT > 0) x += Math.floor(time * 30) % 2 ? 1 : -1;
    if (ZE.mode !== 'ontop') { g.fillStyle = 'rgba(43,39,69,.22)'; if (ZE.mode === 'walk') g.fillRect(Math.round(ZE.x) - 6, Math.round(ZE.y), 12, 2); }
    g.drawImage(img, x, y);
    if (ZE.dizzyT > 0) {
      g.fillStyle = '#ffd84a';
      for (let k = 0; k < 3; k++) { const a = time * 7 + k * 2.1; g.fillRect(Math.round(ZE.x + Math.cos(a) * 8), Math.round(y - 2 + Math.sin(a) * 2), 2, 2); }
    }
  }

  /* =====================================================================
     STAGE 3: the giant strawberry cake boss
     ===================================================================== */
  const cake = { show: false, alive: false, hp: 5, rope: -80, ropeV: 0, theta: 0, omega: 0, landed: false, flashT: 0, blinkT: 0, shakeT: 0, hurtT: 0, faintT: 0 };
  const B = { sub: 'idle', hits: 0, hitCD: 0, swingCD: 0, swingT: 0 };
  const cakeX = () => Math.round(iw / 2 + cake.rope * Math.sin(cake.theta) - CAKE.ropeX);
  const cakeY = () => Math.round(cake.rope * Math.cos(cake.theta));
  const inCake = (px, py) => { const x0 = cakeX(), y0 = cakeY(); return px >= x0 + 1 && px <= x0 + CAKE.w - 2 && py >= y0 + 3 && py <= y0 + CAKE.h - 2; };

  function bossReset(keepCake) {
    Object.assign(B, { sub: 'idle', hits: 0, hitCD: 0, swingCD: 0, swingT: 0 });
    Object.assign(cake, { hp: C.hitsToBreak, flashT: 0, blinkT: 0, shakeT: 0, hurtT: 0, faintT: 0 });
    if (keepCake) Object.assign(cake, { show: true, alive: true, rope: ropeTarget, ropeV: 0, theta: 0, omega: 0, landed: true });
    else Object.assign(cake, { show: false, alive: false, rope: -CAKE.h - 12, ropeV: 0, theta: rand(-0.2, 0.2), omega: 0, landed: false });
    if (ZE.mode !== 'ontop') { zechReset(); ZE.mode = 'ontop'; } // the cake has him (also when starting right at this stage)
    ZE.face = 'tired'; ZE.quipT = 2.5; ZE.hug = false; ZE.reunite = false; kid.hug = false;
  }
  function bossBegin() {
    Object.assign(cake, { show: true, alive: true });
    playerLv.textContent = C.age ? `Lv${C.age - 1}` : ''; playerLv.classList.remove('up');
    updateBossBars();
    B.sub = 'intro';
    document.body.classList.add('follow', 'boss');
    flashEl.classList.remove('go'); retrigger(flashEl, 'twice');
    sfx.battle();
    const intro = cake.landed ? `The ${BOSS()} is holding ${OPP()} hostage!` : `A wild ${BOSS()} appeared… and it kidnapped ${OPP()}!`;
    later(800, () => say([intro, `Go, ${NAME()}! Whack it with your baguette and rescue ${OPP()}!`], () => {
      B.sub = 'battle';
      hint(coarse ? 'DRAG TO MOVE · TAP TO SWING' : 'MOVE TO WALK · CLICK TO SWING');
    }));
  }
  function bossTap() {
    if (B.sub !== 'battle' || B.swingCD > 0) return;
    B.swingCD = 0.3;
    B.swingT = 0.4;                         // only this click's swing can hurt the cake
    bag.a = restAngle() - kid.face * 0.5;   // quick wind-up...
    bag.w = kid.face * 30;                  // ...then the big bonk
    sfx.whoosh();
  }
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
  function bossUpdate(dt) {
    B.swingCD -= dt; B.swingT -= dt; B.hitCD -= dt;
    updateCake(dt);
    if (B.sub === 'battle' && cake.alive && B.swingT > 0 && B.hitCD <= 0) {
      // damage only comes from a swing she was told to do (click / tap / space), once per swing
      const pose = girlPose(), b = A.baguette(bag.a);
      for (const k of [0.45, 0.75, 1]) {
        const px = pose.gx + Math.sin(bag.a) * b.len * k, py = pose.gy - Math.cos(bag.a) * b.len * k;
        if (inCake(px, py)) { B.swingT = 0; onHit(px, py); break; }
      }
    }
  }
  const WORDS = ['BONK!', 'WHACK!', 'CRUNCH!', 'BREAD ATTACK!', 'THWAP!', 'CRUMBS!', 'POW!'];
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
  function updateBossBars() {
    const pct = (cake.hp / C.hitsToBreak) * 100;
    bossHp.style.width = pct + '%';
    bossHp.className = pct > 50 ? '' : pct > 20 ? 'mid' : 'lo';
    playerExp.style.width = (Math.min(B.hits, C.hitsToBreak) / C.hitsToBreak) * 100 + '%';
  }
  function onHit(x, y) {
    B.hits++;
    cake.hp = Math.max(0, C.hitsToBreak - B.hits);
    B.hitCD = 0.25; stopT = 0.07; shakeT = 0.2; shakeA = 1;
    cake.flashT = 0.07; cake.blinkT = 0.45; cake.hurtT = 0.55; cake.shakeT = 0.3;
    cake.omega += kid.face * 1.6;
    bag.w *= -0.3; kid.happyT = 0.45; ZE.cheerT = 0.6;
    sfx.hit();
    const last = cake.hp === 0;
    popWord(x, y, last ? 'CRITICAL HIT!' : B.hits === 1 ? "IT'S SUPER EFFECTIVE!" : pick(WORDS));
    spray(x, y, 18, kid.face);
    updateBossBars(); retrigger(bossBox, 'hurt');
    if (B.hits === 1) hideHint();
    if (navigator.vibrate) navigator.vibrate(30);
    if (last) { B.sub = 'win'; cake.faintT = 1.1; stopT = 0.25; sfx.faint(); }
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
    // he tumbles out of the strawberries and lands on the floor
    if (ZE.mode === 'ontop' || ZE.mode === 'yank') { ZE.mode = 'fall'; ZE.vx = (hugX() + 8 - ZE.x) * 0.9; ZE.vy = -110; ZE.face = 'tired'; }
    later(900, () => {
      const lines = [`${BOSS()} fainted!`, { text: `${NAME()} rescued ${OPP()}!`, on: reunite }];
      if (C.age) lines.push({ text: `${NAME()} grew to Lv. ${C.age}!`, on: levelUp });
      lines.push({ text: `${OPP()}: My hero! Happy birthday, ${NAME()}!`, on: hug });
      lines.push(`${OPP()} handed ${NAME()} a letter…`);
      say(lines, showEnvelope);
    });
  }
  function reunite() { // they run to each other in the middle of the room
    B.sub = 'rescue';
    if (innerWidth < 700) document.body.classList.remove('boss'); // on phones the HUD boxes would cover the hug (the Lv box comes back with the letter)
    ZE.reunite = true; ZE.tx = hugX() + 8;
    if (ZE.mode !== 'fall') ZE.mode = 'walk';
    const pose = girlPose(); // she lets go of the baguette
    const b = A.baguette(bag.a);
    parts.push({ img: b.c, x: pose.gx, y: pose.gy, vx: kid.face * -20, vy: -60, g: 300, ground: groundY() - 2, life: 6 });
  }
  function hug() {
    ZE.hug = true; kid.hug = true; ZE.heartT = 0;
    sfx.levelUp();
    popWord(hugX(), groundY() - 44, '♥', true, '#ff6b98');
  }
  function levelUp() {
    playerLv.textContent = `Lv${C.age}`; retrigger(playerLv, 'up');
    sfx.levelUp();
  }

  /* =====================================================================
     CUTSCENE: she builds the cake… and it comes alive as the piñata monster
     ===================================================================== */
  const LAYER_WORDS = ['CAKE BOARD!', 'SPONGE!', 'CREAM + BERRIES!', 'SPONGE!', 'CREAM + BERRIES!', 'SPONGE + CREAM!', 'STRAWBERRY TOP!'];
  const K = { sub: 'idle', layers: 0, dropT: 0, autoT: 0, t: 0, liftT: 0, ropeT: 0, alive: false, grabbed: false, shakeT: 0 };
  const bakeShakeDx = () => (K.shakeT > 0 ? (Math.floor(K.t * 30) % 2 ? 1 : -1) : 0);
  const bakeSpot = () => {
    const base = groundY(), table = A.counter(CAKE.w + 6, 8, 'soap');
    return { base, table, cx: Math.round(iw / 2 - CAKE.w / 2), cy: base - table.height + 2 - CAKE.h, her: Math.round(iw / 2 - CAKE.w / 2 - 14), him: Math.round(iw / 2 + CAKE.w / 2 + 14) };
  };
  function startBake() {
    clearStageUi();
    parts.length = 0;
    phase = 'bake';
    Object.assign(K, { sub: 'intro', layers: 0, dropT: 0, autoT: 0, t: 0, liftT: 0, ropeT: 0, alive: false, grabbed: false, shakeT: 0 });
    zechReset();
    Object.assign(ZE, { mode: 'walk', x: Math.round(iw * 0.7), y: groundY(), tx: bakeSpot().him, face: 'happy' });
    kid.happyT = 0;
    say([
      'Strawberries: check. Whipped cream: check!',
      coarse ? 'Time to build the cake! Tap to stack each layer.' : 'Time to build the cake! Click to stack each layer.',
    ], () => { K.sub = 'build'; K.autoT = 2.2; lockT = 0.2; showCallout(coarse ? 'TAP TO STACK!' : 'CLICK TO STACK!'); });
  }
  function addLayer() {
    if (K.sub !== 'build' || K.layers >= CAKE.layerCuts.length) return;
    K.layers++; K.dropT = 1; K.autoT = 1.6; kid.hopT = 0.08; kid.happyT = 0.4;
    sfx.catch();
    const sp = bakeSpot(), cut = CAKE.layerCuts[K.layers - 1];
    popWord(iw / 2, sp.cy + cut - 6, LAYER_WORDS[K.layers - 1], false, '#ffffff');
    for (let i = 0; i < 6; i++) parts.push({ x: iw / 2 + rand(-CAKE.w / 2, CAKE.w / 2), y: sp.cy + cut, vx: rand(-30, 30), vy: rand(-50, -20), g: 200, life: 0.6, col: pick(['#fffaf1', '#f7cf7d', '#e8405a']), size: 1, ground: sp.base });
    if (K.layers >= CAKE.layerCuts.length) {
      K.sub = 'done'; hideCallout(); sfx.clear();
      later(700, () => say([
        `Ta-da! A giant Sungsimdang-style strawberry cake!`,
        { text: '…wait. Why is the cake moving?!', on: () => { K.shakeT = 1.2; sfx.thud(); } },
        { text: `The cake came alive!!`, on: () => { K.alive = true; ZE.face = 'tired'; flashEl.classList.remove('twice'); retrigger(flashEl, 'go'); sfx.battle(); } },
        { text: `It grabbed ${OPP()}!!`, on: () => { Object.assign(ZE, { mode: 'yank', t: 0, fromX: ZE.x, fromY: ZE.y }); sfx.whoosh(); } },
        `${OPP()}: HELP!! ${NAME()}!!`,
        { text: `${NAME()} grabbed her trusty baguette!`, on: () => { K.grabbed = true; bag.a = restAngle(); sfx.coin(); } },
      ], () => { K.sub = 'rope'; K.ropeT = 0; }));
    }
  }
  function bakeTap() { if (K.sub === 'build') addLayer(); }
  function bakeUpdate(dt) {
    K.t += dt; K.dropT = Math.max(0, K.dropT - dt * 5); K.shakeT -= dt;
    if (K.sub === 'build' && (K.autoT -= dt) <= 0) addLayer(); // keeps going even if she doesn't tap
    if (ZE.mode === 'walk') ZE.tx = bakeSpot().him; // he waits next to the cake while she builds it
    if (K.sub === 'rope') { K.ropeT += dt; if (K.ropeT >= 0.6) { K.sub = 'lift'; K.liftT = 0; sfx.whoosh(); } }
    if (K.sub === 'lift') {
      K.liftT += dt;
      if (K.liftT >= 1.3) { K.sub = 'handoff'; showCard(2, true); } // the boss stage starts with this very cake
    }
  }
  function bakeCakePos() {
    const sp = bakeSpot();
    if (K.sub !== 'lift' && K.sub !== 'handoff') return { x: sp.cx, y: sp.cy };
    const t = clamp(K.liftT / 1.3, 0, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return { x: Math.round(sp.cx + (iw / 2 - CAKE.ropeX - sp.cx) * e), y: Math.round(sp.cy + (ropeTarget - sp.cy) * e) };
  }
  function bakeRender() {
    const sp = bakeSpot();
    // the table stays on the floor; the cake sits on it until it gets hoisted up
    g.drawImage(sp.table, Math.round(iw / 2 - sp.table.width / 2), sp.base - sp.table.height + 2);
    const pos = bakeCakePos();
    const dx = bakeShakeDx();
    if (K.sub === 'rope' || K.sub === 'lift' || K.sub === 'handoff') { // the rope comes down from the ceiling and hooks the bow
      const reach = K.sub === 'rope' ? clamp(K.ropeT / 0.6, 0, 1) : 1;
      const endX = pos.x + CAKE.ropeX, endY = Math.round((pos.y + 1) * reach);
      g.fillStyle = '#3d7bff'; pixLine(iw / 2, 0, iw / 2 + (endX - iw / 2) * reach, endY);
      g.fillStyle = '#a9d0ff'; pixLine(iw / 2 + 1, 0, iw / 2 + 1 + (endX - iw / 2) * reach, endY);
    }
    if (ZE.mode === 'ontop') drawZech(); // the cake covers his legs
    const n = K.layers;
    if (n > 0) {
      const cut = CAKE.layerCuts[n - 1], prevCut = n > 1 ? CAKE.layerCuts[n - 2] : CAKE.h;
      // everything already stacked…
      if (prevCut < CAKE.h) g.drawImage(CAKE.img, 0, prevCut, CAKE.w, CAKE.h - prevCut, pos.x + dx, pos.y + prevCut, CAKE.w, CAKE.h - prevCut);
      // …and the newest layer dropping into place
      const drop = Math.round(K.dropT * K.dropT * -10);
      g.drawImage(CAKE.img, 0, cut, CAKE.w, prevCut - cut, pos.x + dx, pos.y + cut + drop, CAKE.w, prevCut - cut);
      if (K.alive) g.drawImage(CAKE.faces[K.sub === 'lift' || K.sub === 'handoff' ? 'angry' : (Math.floor(K.t * 4) % 2 ? 'angry' : 'hurt')], pos.x + dx + CAKE.faceX, pos.y + CAKE.faceY);
    }
    if (ZE.mode !== 'ontop') drawZech();
  }

  /* ================= stages + flow ================= */
  // the story: catch strawberries → whip the cream → (cutscene: build the cake, it comes alive) → whack the piñata cake
  const STAGES = [
    { key: 'catch', title: 'Strawberry Catch', how: () => (coarse ? 'Drag left & right to catch!' : 'Move left & right to catch!'), reset: catchReset, begin: catchBegin, update: catchUpdate, tap: catchTap },
    { key: 'whip', title: 'Whipped Cream Showdown', how: () => (coarse ? 'Tap as fast as you can!' : 'Click as fast as you can!'), reset: whipReset, begin: whipBegin, update: whipUpdate, tap: whipTap },
    { key: 'boss', title: 'Piñata Cake Monster', how: () => `${coarse ? 'Tap' : 'Click'} to swing your baguette and rescue ${C.opponentName}!`, reset: bossReset, begin: bossBegin, update: bossUpdate, tap: bossTap },
  ];
  function clearStageUi() {
    resetText(); hideCallout();
    document.body.classList.remove('hud-stage', 'boss', 'follow');
  }
  function showCard(i, keepCake) {
    clearStageUi();
    stageIdx = i;
    parts.length = 0;
    kid.happyT = 0; kid.hopT = 0;
    STAGES[i].reset(keepCake);
    const last = i === STAGES.length - 1;
    $('#cardNum').textContent = last ? '★ FINAL STAGE ★' : `★ STAGE ${i + 1} / ${STAGES.length} ★`;
    $('#cardTitle').textContent = STAGES[i].title;
    $('#cardStars').textContent = STAGES.map((_, k) => (k < i ? '★' : k === i ? '✦' : '☆')).join(' ');
    $('#cardHow').textContent = STAGES[i].how();
    stageCard.classList.add('show');
    phase = 'card'; cardT = 2.6; cardMin = 0.45;
    sfx.coin();
  }
  function endCard() {
    if (phase !== 'card') return;
    stageCard.classList.remove('show');
    phase = 'stage'; lockT = 0.25;   // the tap that closed the card must not count in the game
    STAGE().begin();
  }
  function stageClear() {
    popWord(iw / 2, ih * 0.3, 'STAGE CLEAR!', true, '#ffd84a');
    sfx.clear();
    later(1500, () => (STAGE().key === 'whip' ? startBake() : showCard(stageIdx + 1)));
  }

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

  // ?stage=2, ?stage=3 or ?stage=bake jumps straight there (handy for testing)
  const stageParam = new URLSearchParams(location.search).get('stage');
  const startAt = stageParam === 'bake' ? 'bake' : clamp((parseInt(stageParam, 10) || 1) - 1, 0, STAGES.length - 1);
  function startGame() {
    if (phase !== 'title') return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    $('#intro').classList.add('hide');
    sfx.init();
    newRun(startAt);
  }
  function newRun(at) {
    flowId++;
    envWrap.classList.remove('show'); drawEnv(false);
    // wipe every stage's leftovers from the previous run up front
    Object.assign(W, { sub: 'idle', p: 0, z: 0, taps: 0, zFace: 'normal', said: {} });
    catchReset(); bossReset(false); zechReset(); kid.hug = false;
    if (at === 'bake') { stageIdx = 1; startBake(); } else showCard(at);
  }
  function showEnvelope() {
    clearStageUi();
    document.body.classList.add('boss'); // keep the Lv box up so she can see her new level
    phase = 'ready';
    drawEnv(false);
    envWrap.classList.add('show');
    sfx.coin();
  }
  function openEnvelope() {
    if (phase !== 'ready') return;
    phase = 'opening';
    drawEnv(true); sfx.coin();
    later(550, openLetter);
  }
  envelope.addEventListener('click', openEnvelope);

  let typer = null;
  function openLetter() {
    phase = 'letter';
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
    if (phase === 'letter') phase = 'ready';   // tap the envelope (or anywhere) to read it again
  }
  dialog.addEventListener('click', (e) => { if (!e.target.closest('button') && !dialog.classList.contains('done') && dialog.finishTyping) dialog.finishTyping(); });
  letter.addEventListener('click', (e) => { if (e.target === letter) closeLetter(); });
  $('#closeLetter').addEventListener('click', closeLetter);
  $('#skip').addEventListener('click', () => dialog.finishTyping && dialog.finishTyping());
  $('#replay').addEventListener('click', () => { closeLetter(); sfx.stopSong(); newRun(0); });
  startBtn.addEventListener('click', startGame);
  $('#mute').addEventListener('click', (e) => { e.currentTarget.classList.toggle('off', sfx.toggle()); e.currentTarget.blur(); });

  /* ================= update ================= */
  function update(dt) {
    shakeT -= dt; lockT -= dt;
    if (phase === 'card') { cardMin -= dt; if ((cardT -= dt) <= 0) endCard(); }
    if (phase !== 'loading' && phase !== 'title') { updateKid(dt); updateZech(dt); }
    if (phase === 'stage' || phase === 'card') STAGE().update(dt);
    else if (phase === 'bake') bakeUpdate(dt);
    else if (ending()) updateCake(dt);

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
  function bossCakePos() {
    const x0 = cakeX(), y0 = cakeY();
    const bob = cake.alive && Math.floor(time * 2) % 2 ? 1 : 0;
    let dx = 0;
    if (cake.faintT > 0) dx = Math.floor(time * 40) % 2 ? 2 : -2;
    else if (cake.shakeT > 0) dx = Math.floor(time * 30) % 2 ? 1 : -1;
    return { x: x0 + dx, y: y0 + bob, x0, y0, dx, bob };
  }
  function cakePosNow() {
    if (phase === 'bake') { const p = bakeCakePos(); return { x: p.x + bakeShakeDx(), y: p.y }; }
    return bossCakePos();
  }
  function drawCake() {
    if (!cake.show || cake.rope <= -CAKE.h - 8) return;
    const { x0, y0, dx, bob } = bossCakePos();
    if (cake.rope > 0) {
      g.fillStyle = '#3d7bff'; pixLine(iw / 2, 0, x0 + CAKE.ropeX + dx, y0 + bob + 1);
      g.fillStyle = '#a9d0ff'; pixLine(iw / 2 + 1, 0, x0 + CAKE.ropeX + 1 + dx, y0 + bob + 1);
    }
    if (ZE.mode === 'ontop') drawZech(); // he's stuck in the strawberries, so the cake covers his legs
    const hidden = cake.blinkT > 0 && Math.floor(cake.blinkT * 16) % 2 === 0;
    if ((cake.alive || cake.faintT > 0) && !hidden) {
      const X = x0 + dx, Y = y0 + bob;
      g.drawImage(CAKE.img, X, Y);
      const face = cake.faintT > 0 ? 'ko' : cake.hurtT > 0 ? 'hurt' : cake.hp / C.hitsToBreak <= 0.4 ? 'worried' : 'angry';
      g.drawImage(CAKE.faces[face], X + CAKE.faceX, Y + CAKE.faceY);
      if (cake.flashT > 0 || (cake.faintT > 0 && Math.floor(time * 10) % 2)) g.drawImage(CAKE.white, X, Y);
    }
  }
  function drawGirl() {
    const pose = girlPose();
    g.fillStyle = 'rgba(43,39,69,.22)';
    g.fillRect(Math.round(kid.x) - 7, pose.sy + A.GIRL_H - 1, 14, 2);
    if (!hasBaguette()) { g.drawImage(pose.img, pose.sx, pose.sy); return pose; }
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
    return pose;
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

    if (inStage('boss') || ending()) drawCake();
    if (phase === 'bake') bakeRender();
    for (const p of parts) if (!p.confetti) drawParticle(p);

    if (phase !== 'loading' && phase !== 'title') {
      if (inStage('whip')) whipRender();
      else {
        if (phase !== 'bake' && ZE.mode !== 'ontop') drawZech();
        const pose = drawGirl();
        if (inStage('catch')) { catchRenderBowl(pose); catchRenderItems(); }
      }
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

  // read-only peek at the game state for automated tests (only with ?debug in the URL)
  if (/[?&]debug\b/.test(location.search)) {
    window.__game = {
      get phase() { return phase; }, get stage() { return phase === 'bake' ? 'bake' : STAGE().key; },
      get sub() { return phase === 'bake' ? K.sub : { catch: CT.sub, whip: W.sub, boss: B.sub }[STAGE().key]; },
      get bake() { return { layers: K.layers, alive: K.alive, grabbed: K.grabbed }; },
      get zech() { return { mode: ZE.mode, x: ZE.x * S, y: ZE.y * S, hug: ZE.hug, face: ZE.face }; },
      get whip() { return { p: W.p, z: W.z, face: W.zFace, taps: W.taps }; },
      get catch() { return { caught: CT.caught, dizzy: CT.dizzyT > 0, items: CT.items.map((i) => ({ kind: i.kind, x: i.x * S, y: i.y * S })) }; },
      get kid() { return { x: kid.x * S, y: kid.y * S }; }, get cakeHp() { return cake.hp; },
    };
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
      phase = 'title';
      startBtn.disabled = false;
      startBtn.textContent = '▶ PRESS START';
    });
})();
