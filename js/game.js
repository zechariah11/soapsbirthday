(() => {
  /* ================= config.json ================= */
  const DEFAULTS = {
    name: 'Sophia',
    age: 27,
    opponentName: 'Zech',
    whipTaps: 40,
    strawberriesToCatch: 15,
    hitsToBreak: 5,
    bossName: 'Giant Strawberry Cake',
    startScreen: "I couldn't be there today, so little you is baking a giant 성심당딸기시루케이크: catch the strawberries, bake the sponges, beat me at whipping the cream, then stack it up and ice it (and deal with whatever happens next).",
    greeting: 'Dear {name},',
    letter: ['Happy birthday! (Write your letter in config.json.)'],
    signOff: 'love,',
    from: 'me',
    // a song for the real letter: a Spotify link, or an audio file next to index.html. Empty = the built-in jazz-waltz Happy Birthday.
    song: '',
    // the joke: he hands her the wrong letter (twice) before the real one. Set to [] to skip.
    wrongLetters: [
      {
        style: 'note',
        title: 'OFFICIAL REMATCH REQUEST',
        lines: [
          'I, {opponent}, hereby demand a rematch in the Whipped Cream Showdown.',
          'Reasons I lost:',
          '- My whisk was defective.',
          '- My arm was tired from army training.',
          '- The bowl was slippery.',
          '~~- She is simply better than me.~~',
        ],
        signature: 'Signed, {opponent} (definitely NOT a sore loser)',
        stamp: 'URGENT!!',
        reaction: ['{OPPONENT}: W-WAIT!! Wrong one!!', '{OPPONENT}: …that was my rematch request. Forget you saw that.', '{OPPONENT} handed {NAME} another letter…'],
      },
      {
        style: 'form',
        title: '휴가 신청서 · LEAVE REQUEST',
        fields: [
          ['Name', '{opponent}'],
          ['Request', 'Move my leave ONE WEEK EARLIER'],
          ['Reason', "It's {name}'s birthday!!! I need to be there."],
          ['Urgency', '★★★★★ EXTREMELY URGENT'],
          ['If denied', 'Make her a birthday video game instead'],
        ],
        stamp: 'DENIED · 반려',
        note: "Commander: Denied. You'll see her next week, as planned. (This is request #7. Stop asking.)",
        reaction: ['{OPPONENT}: AAAH! Not that one either!!', "{OPPONENT}: …so yeah. They said no. But I'll see you next week, I promise!", '{OPPONENT}: Okay. THIS is the real one. Happy birthday, {NAME}.'],
      },
    ],
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
    const fill = (s) => String(s ?? '')
      .replace(/\{NAME\}/g, c.name.toUpperCase()).replace(/\{OPPONENT\}/g, c.opponentName.toUpperCase())
      .replace(/\{name\}/g, c.name).replace(/\{age\}/g, c.age ?? '').replace(/\{opponent\}/g, c.opponentName);
    c.letter = (Array.isArray(c.letter) ? c.letter : [c.letter]).map(fill).filter((p) => p.trim());
    for (const k of ['bossName', 'startScreen', 'greeting', 'signOff', 'from']) c[k] = fill(c[k]);
    c.bossName = c.bossName.trim() || DEFAULTS.bossName;
    c.song = typeof c.song === 'string' ? c.song.trim() : '';
    const list = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
    c.wrongLetters = (Array.isArray(c.wrongLetters) ? c.wrongLetters : []).filter((w) => w && typeof w === 'object').map((w) => ({
      style: w.style === 'form' ? 'form' : 'note',
      title: fill(w.title),
      lines: list(w.lines).map(fill),
      fields: list(w.fields).filter((f) => Array.isArray(f)).map(([k, v]) => [fill(k), fill(v)]),
      signature: fill(w.signature), stamp: fill(w.stamp), note: fill(w.note),
      reaction: list(w.reaction).map(fill).filter((t) => t.trim()),
    }));
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
  const wrongEl = $('#wrong'), wrongPaper = $('#wrongPaper'), wrongContent = $('#wrongContent'), stampEl = $('#stamp');

  /* ================= sound: tiny 8-bit synth (no audio files) ================= */
  const sfx = (() => {
    let ac = null, out = null, nbuf = null, muted = false, musicOut = null, bgm = null, bgmWant = null;
    function init() {
      try {
        if (!ac) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ac = new AC();
          out = ac.createGain(); out.gain.value = 0.3; out.connect(ac.destination);
          musicOut = ac.createGain(); musicOut.gain.value = muted ? 0 : 1; musicOut.connect(out);
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
    // background music: one looping track at a time (js/music.js), crossfaded, scheduled ~1 s ahead
    function bgmTick() {
      if (!ac || ac.state !== 'running' || !musicOut || !window.Music) return;
      if ((bgm ? bgm.name : null) !== bgmWant) {
        const now = ac.currentTime, fade = bgmWant === 'boss' ? 0.3 : 0.9;
        if (bgm) {
          const g = bgm.bus.gain, old = bgm.bus;
          g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0.0001, now + fade);
          setTimeout(() => { try { old.disconnect(); } catch (e) { /* ignore */ } }, fade * 1000 + 1600);
        }
        bgm = null;
        const tr = bgmWant && Music.tracks[bgmWant];
        if (tr) {
          const bus = ac.createGain();
          bus.gain.setValueAtTime(0.0001, now); bus.gain.linearRampToValueAtTime(tr.vol, now + (bgmWant === 'boss' ? 0.15 : 0.7));
          bus.connect(musicOut);
          bgm = { name: bgmWant, tr, bus, g: tr.startBar || 0, t: now + 0.1, st: {} };
        }
      }
      if (!bgm) return;
      const B = 60 / bgm.tr.bpm, bar = B * bgm.tr.meter;
      if (bgm.t < ac.currentTime - 0.05) { const skip = Math.ceil((ac.currentTime - bgm.t) / bar); bgm.t += skip * bar; bgm.g += skip; } // (the tab was asleep)
      while (bgm.t < ac.currentTime + 1.2) {
        if (!muted) { try { bgm.tr.render(ac, bgm.bus, bgm.g, bgm.t, B, bgm.st); } catch (e) { console.warn('music', e); } }
        bgm.t += bar; bgm.g++;
      }
    }
    setInterval(bgmTick, 100);
    // no music in a hidden tab (and no catching up when she comes back)
    document.addEventListener('visibilitychange', () => {
      if (!ac) return;
      try { if (document.hidden) ac.suspend(); else ac.resume(); } catch (e) { /* ignore */ }
    });
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
      toggle: () => {
        muted = !muted;
        if (musicOut) { const g = musicOut.gain, now = ac.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(muted ? 0 : 1, now + 0.15); }
        return muted;
      },
      isMuted: () => muted,
      songOn: () => !!bgm && bgm.name === 'birthday',
      bgm: (name) => { bgmWant = name || null; },
      bgmName: () => (bgm ? bgm.name : null),
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
      rise: (r) => play((t) => tone(320 + r * 520, t, 0.05, 0.03, 'triangle')),
      squish: () => play((t) => noise(t, 0.05, 0.05, 900, 'lowpass')),
      ding: () => play((t) => { tone(1568, t, 0.5, 0.07, 'sine'); tone(2093, t + 0.01, 0.6, 0.04, 'sine'); tone(3136, t, 0.15, 0.02, 'sine'); }),
      sift: () => play((t) => noise(t, 0.04, 0.03, 5000, 'highpass')),
      pip: (k) => play((t) => { tone(660 + k * 520, t, 0.05, 0.05, 'triangle'); tone(990 + k * 780, t + 0.04, 0.06, 0.04, 'sine'); }),
      tick: () => play((t) => tone(1500, t, 0.012, 0.012, 'sine')), // the letter's typewriter: barely there, so the music carries
    };
  })();

  /* ================= layout: a low-res canvas scaled up with crisp pixels ================= */
  let S = 4, iw = 0, ih = 0, room = null, floorY = 0, balloons = [], tinsel = null, ropeTarget = 30;
  const ptr = { x: 0, y: 0 };
  const kid = { x: 0, y: 0, vx: 0, vy: 0, face: 1, walkT: 0, happyT: 0, dustT: 0, hopT: 0, hug: false, jy: 0, jv: 0 }; // jy/jv: jump height/speed
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
    const r = A.buildRoom(iw, ih, { age: C.age, top: Math.ceil(80 / S) }); // the HUD boxes cover roughly the top 80px
    room = r.canvas; floorY = r.floorY; balloons = r.balloons; tinsel = r.tinsel;
    ropeTarget = Math.max(4, groundY() - 38 - CAKE.h); // the piñata hangs just above her crown: jump to whack it
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
    if (e.target && e.target.closest && e.target.closest('#mute, #intro, #letter, #wrong')) return;
    toGame(e);
    act();
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && phase === 'letter') { closeLetter(); return; }
    if (phase === 'wrong' && (e.key === 'Escape' || e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); if (!e.repeat) snatch(); return; }
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
    if (e.code === 'Space' || e.code === 'Enter') release();
  });
  addEventListener('blur', () => { keys.left = keys.right = false; release(); });
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  function release() { if (phase === 'stage' && STAGE().release) STAGE().release(); }
  function act() {
    if (lockT > 0) return;
    if (phase === 'card') { if (cardMin <= 0) endCard(); return; }
    if (TB.active) { advanceText(); return; }
    if (phase === 'stage') STAGE().tap();
    else if (phase === 'bake') bakeTap();
    else if (phase === 'ready') openEnvelope();
  }

  /* ================= little Sophia ================= */
  const bag = { a: 0.35, w: 0, ghosts: [] };   // baguette angle (0 = straight up) and spin speed
  const restAngle = () => kid.face * 0.35;
  const ending = () => phase === 'ready' || phase === 'opening' || phase === 'letter' || phase === 'wrong' || phase === 'snatch';
  const hasBaguette = () => (inStage('boss') && B.sub !== 'rescue') || (phase === 'bake' && K.grabbed);
  function girlPose() {
    const side = kid.face > 0 ? 'R' : 'L';
    const speed = Math.hypot(kid.vx, kid.vy), moving = speed > 12;
    const legs = kid.jy < -1 ? 'walkA' : moving ? ['walkA', 'idle', 'walkB', 'idle'][Math.floor(kid.walkT) % 4] : 'idle';
    const happy = kid.happyT > 0 || ending() || kid.hug || (phase === 'bake' && !K.alive) ? 1 : 0;
    let bob = moving ? (Math.floor(kid.walkT) % 2 ? -1 : 0) : (Math.floor(time * 2) % 2 ? -1 : 0);
    if (kid.hug && !moving) bob = Math.floor(time * 2.5) % 2 ? -1 : 0; // swaying together in the hug
    if (kid.hopT > 0) bob -= 1;
    let sx = Math.round(kid.x - A.GIRL_W / 2);
    if (CT.dizzyT > 0 && inStage('catch')) sx += Math.floor(time * 30) % 2 ? 1 : -1;
    const sy = Math.round(kid.y - A.GIRL_H / 2) + (kid.jy < -1 ? 0 : bob) + Math.round(kid.jy);
    const gp = A.GRIP[side];
    return { img: A.girl[legs + happy + side], sx, sy, gx: sx + gp.x, gy: sy + gp.y };
  }
  function kidTarget() {
    if (ending() || (inStage('boss') && B.sub === 'rescue')) return { x: hugX() - 7, y: groundY() - A.GIRL_H / 2 + 1 };
    if (inStage('whip')) return { x: whipGeo().her, y: groundY() - A.GIRL_H / 2 + 1 };
    if (inStage('sponge')) return { x: spongeGeo().her, y: groundY() - A.GIRL_H / 2 + 1 };
    if (inStage('icing')) return { x: bakeSpot().her, y: groundY() - A.GIRL_H / 2 + 1 };
    if (phase === 'bake') return { x: bakeSpot().her, y: groundY() - A.GIRL_H / 2 + 1 };
    // otherwise she runs left/right after the pointer (or the arrow keys), feet always on the floor
    if (keys.left || keys.right) ptr.x = clamp(ptr.x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 2.2, 0, iw);
    return { x: inStage('catch') && CT.dizzyT > 0 ? kid.x : ptr.x, y: groundY() - A.GIRL_H / 2 + 1 };
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
    if (kid.jv || kid.jy) { // jumping (boss fight): up, then back down onto the floor
      kid.jv += 700 * dt; kid.jy += kid.jv * dt;
      if (kid.jy >= 0) {
        kid.jy = 0; kid.jv = 0;
        for (let i = 0; i < 4; i++) parts.push({ x: kid.x + rand(-6, 6), y: kid.y + A.GIRL_H / 2 - 1, vx: rand(-14, 14), vy: rand(-10, -3), g: 0, life: 0.3, col: '#ffffff', size: 1, ground: 1e9 });
      }
    }

    let want = kid.face;
    if (inStage('boss') && cake.alive) { const cx = cakeX() + CAKE.w / 2; if (Math.abs(cx - kid.x) > 6) want = Math.sign(cx - kid.x); }
    else if (ending() || (inStage('boss') && B.sub === 'rescue') || ((inStage('whip') || inStage('sponge') || inStage('icing') || phase === 'bake') && speed < 20)) want = 1;
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
  const W = { sub: 'idle', p: 0, z: 0, cd: 0, cdShown: 0, sPh: 0, sPhT: 0, zPh: 0, zJig: 0, stallT: 0, quipT: 0, taps: 0, said: {}, hud: null, zFace: 'normal', doneT: 0 };
  // the two chefs are drawn at 2x (a close-up, like a versus screen) when the screen has room for it
  function whipGeo() {
    const k = ih >= 145 && iw >= 120 ? 2 : 1, base = groundY();
    const her = Math.round(iw * (k > 1 && iw < 200 ? 0.27 : 0.3)), him = Math.round(iw * (k > 1 && iw < 200 ? 0.73 : 0.7));
    const narrow = iw < 200, off = narrow ? 5 : 11, cw = narrow ? 20 : 26; // narrow screens: smaller counters, bowls closer in
    return { k, base, her, him, off, cw, rim: base + 1 - 14 * k, herBowl: her + off * k, himBowl: him - off * k };
  }
  // Zech can lead a little early on (it's a real race!), but he is always capped just behind her near the end
  const zechCap = (p) => (p < 0.6 ? p + 0.1 * (1 - p / 0.6) : p - 0.06 * ((p - 0.6) / 0.4));

  function whipReset() {
    Object.assign(W, { sub: 'idle', p: 0, z: 0, cd: 0, cdShown: 0, sPh: 0, sPhT: 0, zPh: 0, zJig: 0, stallT: 0, quipT: 0, taps: 0, said: {}, zFace: 'normal', doneT: 0 });
    Object.assign(WV, { shown: false, ang: 0, om: 0, iv: 0.5, lastTap: -9, ing: 0, ingT: -1, idleT: 0, pv: 0, lift: 0, vol: 0, fx: [], specks: [] });
    kid.x = whipGeo().her; kid.y = groundY() - A.GIRL_H / 2 + 1; kid.vx = kid.vy = 0;
  }
  function whipBegin() {
    W.hud = stageHud(`STAGE ${stageIdx + 1} · WHIPPED CREAM`, [{ key: 'her', tag: NAME().slice(0, 6), cls: 'her' }, { key: 'him', tag: OPP().slice(0, 6), cls: 'him' }]);
    document.body.classList.add('hud-stage', 'closeup');
    measureHud(); showWhip(true); sfx.whoosh();
    W.sub = 'intro';
    say([
      `A challenger appeared! It's ${OPP()}!`,
      `${OPP()}: The cake needs whipped cream. First one to stiff peaks wins!`,
      'First, the ingredients: cold cream, sugar and a drop of vanilla.',
      coarse ? 'Then tap as fast as you can: the faster you tap, the faster you whisk!' : 'Then click (or press space) as fast as you can: the faster you click, the faster you whisk!',
    ], () => { W.sub = 'prep'; lockT = 0.2; showCallout(coarse ? `TAP TO ADD ${INGS[0].label}!` : `CLICK TO ADD ${INGS[0].label}!`); });
  }
  function whipTap() {
    if (W.sub === 'prep') { addIngredient(); return; }
    if (W.sub !== 'race') return;
    W.taps++;
    const iv = clamp(time - WV.lastTap, 0.05, 1.2); WV.lastTap = time; WV.iv = WV.iv * 0.55 + iv * 0.45; // (how fast she's tapping)
    whipSplash();
    W.p = Math.min(1, W.p + 1 / C.whipTaps);
    W.sPhT += 2.4; kid.hopT = 0.06; // each tap = one more turn of the whisk
    sfx.whisk();
    const G = whipGeo(), cx = G.herBowl, rim = G.rim;
    parts.push({ x: cx + rand(-5, 5) * G.k, y: rim - (2 + Math.round(W.p * 6)) * G.k, vx: rand(-25, 25) * G.k, vy: rand(-60, -30) * G.k, g: 200 * G.k, life: 0.6, col: '#ffffff', size: G.k, ground: rim + 1 });
    for (const [at, word] of [[0.33, 'SOFT PEAKS!'], [0.66, 'STIFF PEAKS!']]) {
      if (W.p >= at && !W.said[word]) { W.said[word] = true; const V = wvLayout(), q = ovToRoom(V, V.cx, V.rimY - V.ry - 8); popWord(q.x, q.y, word); }
    }
    if (W.p >= 1) whipWin();
  }
  function whipUpdate(dt) {
    if (WV.shown || cuCv.classList.contains('on')) wvUpdate(dt);
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
      W.zPh += dt * (moving ? 6 + 60 * (W.z - before) / Math.max(dt, 1e-3) : 0.6); // whisks at his speed, barely moves when tired
      // when he's stuck behind her he gets tired (that's his excuse, anyway)
      W.stallT = moving ? Math.max(0, W.stallT - dt) : W.stallT + dt;
      W.zFace = W.stallT > 0.6 ? 'tired' : ['strain', 'puff', 'tongue', 'strain', 'normal'][Math.floor(time / 0.7) % 5]; // pulling faces as he goes
      if (W.stallT > 1.2 && (W.quipT -= dt) <= 0) {
        W.quipT = 2.6;
        const G = whipGeo();
        const V = wvLayout(), q = ovToRoom(V, V.zx, V.zTop - 4);
        popWord(q.x, q.y, pick(['huff… huff…', 'my arm…', 'phew!', 'so tired…']), false, '#e8f0d0');
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
    const V = wvLayout(), q = ovToRoom(V, V.cx, V.rimY - V.ry - 14);
    popWord(q.x, q.y, 'PERFECT!', true, '#ffd84a');
    for (let i = 0; i < 30; i++) WV.fx.push({ x: V.cx + rand(-V.rx, V.rx) * 0.6, y: V.rimY - V.ry * 0.5, vx: rand(-60, 60), vy: rand(-120, -40), g: 220, life: rand(0.8, 1.4), col: pick(['#ffffff', '#fff3c4', '#ffd84a']), size: pick([1, 2]) });
    later(1300, () => say([
      `${NAME()} whipped the perfect cream!`,
      { text: `${OPP()}: How are you so fast?! …Okay, you win.`, on: () => { W.zFace = 'happy'; } },
    ], () => { showWhip(false); stageClear(); }));
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
  // a chunky pixel line in the current (scaled) coordinate space
  function thick(x0, y0, x1, y1, w, col) {
    g.fillStyle = col;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      g.fillRect(Math.round(x0 + (x1 - x0) * t - w / 2), Math.round(y0 + (y1 - y0) * t - w / 2), w, w);
    }
  }
  // balloon whisk from the hand (hx, hy) down to its tip in the cream (tx, ty)
  function drawWhisk(hx, hy, tx, ty, who) {
    const dx = tx - hx, dy = ty - hy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux;
    thick(hx - ux * 2, hy - uy * 2, hx + ux * 2, hy + uy * 2, 3, A.OUT);
    thick(hx - ux * 2, hy - uy * 2, hx + ux * 2, hy + uy * 2, 1, who === 'sophia' ? '#ff9ec4' : '#8a6a3a');
    const sx = hx + ux * 2, sy = hy + uy * 2;
    for (const [bulge, col] of [[-3.4, '#4e5674'], [3.4, '#4e5674'], [-2.6, '#c3cad9'], [2.6, '#c3cad9'], [-1.2, '#e6ebf5'], [1.2, '#e6ebf5'], [0, '#ffffff']]) {
      g.fillStyle = col;
      for (let t = 0; t <= 1.001; t += 0.07) {
        const b = bulge * Math.sin(Math.PI * Math.min(1, t * 1.15));
        g.fillRect(Math.round(sx + (tx - sx) * t + px * b), Math.round(sy + (ty - sy) * t + py * b), 1, 1);
      }
    }
  }
  function drawChef(img, cx, who, prog, ph, toward, k, lift, off, shoulder, sleeve, hand, cw) {
    // drawn in local coordinates (feet at y = 0) and scaled up by k for the close-up;
    // the body bobs (lift) while the counter, bowl and whisk stay put
    const L = (lift || 0) / k;
    g.save();
    g.translate(Math.round(cx), groundY() + 1 + (lift || 0)); g.scale(k, k);
    // shorter chefs stand a little taller behind the counter so every face clears the bowl
    const top = -img.height - Math.max(0, A.GIRL_H - img.height), left = -Math.round(img.width / 2);
    const ct = A.counter(cw, 4, who), shift = toward * Math.round(off / 2), LEG = 3, cx0 = shift - Math.round(ct.width / 2);
    const s0 = Math.min(left, cx0) - 1, s1 = Math.max(left + img.width, cx0 + ct.width) + 1;
    g.fillStyle = 'rgba(43,39,69,.2)'; g.fillRect(s0, -L, s1 - s0, 1); // one shadow on the floor under the chef and the counter
    g.drawImage(img, left, top);
    g.fillStyle = A.OUT; // the counter stands on little wooden legs
    for (const lx of [cx0 + 2, cx0 + ct.width - 4]) g.fillRect(lx, -LEG - L, 2, LEG + 1);
    g.fillStyle = '#b98a55'; for (const lx of [cx0 + 2, cx0 + ct.width - 4]) g.fillRect(lx, -LEG - L, 1, LEG);
    g.drawImage(ct, cx0, -ct.height + 1 - L - LEG);
    const bowl = A.BOWLS[who], bcx = toward * off, bx = Math.round(bcx - bowl.width / 2), by = -ct.height + 1 - bowl.height + 1 - L - LEG, rim = by + 1;
    // the hand circles above the bowl and the whisk follows it into the cream
    const hx = bcx + Math.cos(ph) * 3, hy = rim - 6 + Math.sin(ph) * 1.2;
    const wx = bcx + Math.cos(ph + 0.9) * 2.6, wy = rim + 2;
    drawWhisk(hx, hy, wx, wy, who);
    g.drawImage(bowl, bx, by);
    drawCream(Math.round(bcx), rim, prog);
    // the arm reaches from the shoulder to the whisk handle
    const sx = left + shoulder.x, sy = top + shoulder.y;
    thick(sx, sy, hx, hy, 4, A.OUT);
    thick(sx, sy, hx, hy, 2, sleeve);
    g.fillStyle = A.OUT; g.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
    g.fillStyle = hand; g.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2);
    g.restore();
  }
  function whipRender() {
    const G = whipGeo();
    const herImg = A.girl[`whisk${kid.happyT > 0 ? 1 : 0}R`];
    drawChef(herImg, G.her, 'sophia', W.p, W.sPh, 1, G.k, kid.hopT > 0 ? -G.k : 0, G.off, { x: 18, y: 20 }, '#ffffff', '#ffffff', G.cw);
    const zBob = W.sub === 'race' && W.stallT < 0.3 && Math.floor(W.zJig) % 2 ? -G.k : 0;
    drawChef(A.zechWhisk[W.zFace], G.him, 'zech', W.z, Math.PI - W.zPh, -1, G.k, zBob, G.off, { x: 4, y: 18 }, '#7b8758', '#f6cfa8', G.cw);
  }

  /* the whipping close-up: first person at the table, her bowl right in front of you and her hand on the whisk,
     Zech across the table whisking his own (badly, with faces). First the ingredients go in, then the race:
     the whisk turns exactly as fast as she taps, and the cream goes from a glossy liquid to foam, to soft
     folds, to stiff peaks, smoothly as it thickens */
  const WV = { shown: false, back: null, front: null, baseKey: '', ang: 0, om: 0, iv: 0.5, lastTap: -9, ing: 0, ingT: -1, idleT: 0, pv: 0, lift: 0, fx: [], specks: [], img: null, zFaceT: 0, zFaceI: 0 };
  const INGS = [{ key: 'cream', label: 'THE CREAM' }, { key: 'sugar', label: 'THE SUGAR' }, { key: 'vanilla', label: 'THE VANILLA' }];
  function wvLayout() {
    const { P, w, h } = cuSize();
    const port = h > w * 1.2, hb = Math.ceil(IC.hudB / P) + 2;
    const rx = Math.round(Math.min(w * 0.43, h * 0.36)), ry = Math.round(rx * 0.42), cx = Math.round(w / 2), rimY = Math.round(h - rx * 0.5);
    const yFar = Math.round(Math.max(hb + 8, rimY - ry - rx * (port ? 1.0 : 0.62)));          // the far edge of the table
    const kz = clamp(Math.round(Math.min(w, h * 1.3) / (port ? 52 : 100)), 1, 4);              // Zech's size across the table
    const zx = cx + (port ? 0 : Math.round(rx * 0.1)), zTop = yFar - 24 * kz;
    const iH = clamp(Math.round(rx * 0.42), 16, 44), side = cx - rx > iH * 1.5;
    const items = side
      ? [{ x: cx - rx - Math.round(iH * 0.75), y: rimY - 2 }, { x: cx + rx + Math.round(iH * 0.75), y: rimY - 2 }, { x: cx + rx + Math.round(iH * 0.4), y: rimY - ry - Math.round(iH * 0.35) }]
      : [{ x: Math.round(w * 0.15), y: rimY - ry + 3 }, { x: Math.round(w * 0.85), y: rimY - ry + 3 }, { x: Math.round(w * 0.68), y: rimY - ry - Math.round(iH * 0.25) }];
    return { P, w, h, port, rx, ry, cx, rimY, yFar, kz, zx, zTop, iH, items, botY: rimY + Math.round(ry * 1.3) };
  }
  function showWhip(on) { const G = whipGeo(); zoomCloseup('whip', on, G.herBowl, G.rim - 6); WV.shown = on; }
  // where the cream's surface is in her bowl: it rises as cream goes in, and again as air is whipped into it
  function creamSurf(V) {
    const vol = W.sub === 'done' || W.sub === 'race' || W.sub === 'countdown' ? 0.35 + 0.5 * smooth01((WV.pv - 0.1) / 0.8) : WV.vol || 0;
    const k = clamp(vol, 0, 1), rs = V.rx * (0.62 + 0.3 * k);
    return { vol: k, cx: V.cx, cy: V.botY + (V.rimY + V.ry * 0.18 - V.botY) * k, rx: rs, ry: rs * 0.42 };
  }
  const smooth01 = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

  function wvLayers(V) { // the wall behind Zech, and the table (cached per layout)
    const key = `${V.w}x${V.h}:${V.yFar},${V.rx}`;
    if (WV.baseKey === key) return;
    const back = A.mk(V.w, V.h), x = back.getContext('2d');
    const R = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
    R('#dfe9ff', 0, 0, V.w, V.h);
    for (let y = 4; y < V.yFar; y += 10) for (let X = ((y / 10) % 2) * 6 + 3; X < V.w; X += 12) { R('#c9d8f5', X, y - 1, 1, 3); R('#c9d8f5', X - 1, y, 3, 1); }
    const by = Math.max(4, Math.round(IC.hudB / V.P) - 6), cols = ['#ff9db2', '#ffd84a', '#8fd18a', '#7fb2ff', '#c7a6ff'];  // bunting
    for (let X = 0; X < V.w; X++) R('#8a7a9a', X, by + Math.round(Math.sin((X / V.w) * Math.PI * 3) * 3 + 3));
    for (let k = 0, X = 4; X < V.w - 6; X += 13, k++) { const y0 = by + Math.round(Math.sin((X / V.w) * Math.PI * 3) * 3 + 3); for (let j = 0; j < 7; j++) R(cols[k % 5], X + Math.floor(j / 2), y0 + j, 7 - Math.floor(j / 2) * 2, 1); }
    const ban = A.foil('HAPPY BIRTHDAY', 2), bx = Math.round(V.w / 2 - ban.width / 2), byy = by + 16;
    if (ban.width < V.w - 8 && byy + ban.height + 4 < V.zTop) x.drawImage(ban, bx, byy);
    for (const [X, col] of [[V.w * 0.07, '#ff9db2'], [V.w * 0.93, '#7fb2ff']]) if (V.yFar - by > 40) { // a balloon in each corner
      const Y = by + 26; R('#8a7a9a', X, Y + 8, 1, 14); for (let j = -7; j <= 7; j++) { const hw = Math.round(5.5 * Math.sqrt(1 - (j / 7.5) ** 2)); R(col, X - hw, Y + j, hw * 2 + 1, 1); } R('#ffffff', X - 3, Y - 4, 2, 2);
    }
    const front = A.mk(V.w, V.h), y = front.getContext('2d'), rows = V.h - V.yFar, c0 = Math.max(2, Math.round(V.w / 55)), K = rows / (3 * c0); // gingham table, in perspective
    for (let j = 0; j < rows; j++) {
      const v = j / rows, sc = 1 + 3 * v, q = Math.floor(Math.log(1 + 3 * v) * K) % 2;
      for (let X = 0; X < V.w; X++) {
        const p = ((Math.floor((X - V.w / 2) / sc / c0) % 2) + 2) % 2;
        y.fillStyle = p && q ? '#a9c8f5' : p || q ? '#cfe2ff' : '#ffffff'; y.fillRect(X, V.yFar + j, 1, 1);
      }
    }
    y.fillStyle = '#ffffff'; y.fillRect(0, V.yFar, V.w, 1); y.fillStyle = '#7fb2f0'; y.fillRect(0, V.yFar + 1, V.w, 1);
    WV.back = back; WV.front = front; WV.baseKey = key; WV.img = null;
  }
  // the cream's surface, shaded pixel by pixel: ripples on liquid cream, bubbles as it foams, folds and ridges as it stiffens
  const CREAM_PALS = [
    ['#e2cda4', '#efdcb8', '#f9ecd2', '#fff6e4', '#ffffff'], ['#e4d6bc', '#f1e5ce', '#faf1e1', '#fff9ef', '#ffffff'],
    ['#dcd8d0', '#ece8e0', '#f7f4ee', '#fefcf8', '#ffffff'], ['#d9dce5', '#eaecf1', '#f6f7f9', '#fdfdfe', '#ffffff'],
  ].map((p) => p.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]));
  function drawCreamTop(x, Sf, p, t) {
    const w2 = Math.ceil(Sf.rx) * 2 + 2, h2 = Math.ceil(Sf.ry) * 2 + 2;
    if (!WV.img || WV.img.width !== w2 || WV.img.height !== h2) { WV.img = A.mk(w2, h2); WV.imgD = WV.img.getContext('2d').createImageData(w2, h2); }
    const d = WV.imgD.data, ox = w2 / 2, oy = h2 / 2, ang = WV.ang;
    const wL = 1 - smooth01((p - 0.08) / 0.25), wF = Math.max(0, 1 - Math.abs(p - 0.3) / 0.2), wS = smooth01((p - 0.3) / 0.5);
    const palF = clamp(p * 3.4, 0, 2.999), pi = Math.floor(palF), pf = palF - pi, BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const H = (nx, ny) => {
      const r2 = nx * nx + ny * ny, r = Math.sqrt(r2), th = Math.atan2(ny, nx);
      let v = (1 - r2) * (0.15 + 0.7 * wS);
      if (wL > 0) v += wL * (0.16 * Math.sin(r * 15 - t * 6) * (1 - r) + 0.22 * Math.sin(2 * (th - ang) + r * 6));
      if (wS > 0) { const s = 0.5 + 0.5 * Math.sin(3 * (th - ang * 0.35) + r * 10 + Math.sin(th * 5 + r * 3) * 1.2); v += wS * (0.35 + 0.4 * p) * s * s; }
      return v;
    };
    for (let j = 0; j < h2; j++) for (let i = 0; i < w2; i++) {
      const o = (j * w2 + i) * 4, nx = (i - ox + 0.5) / Sf.rx, ny = (j - oy + 0.5) / Sf.ry, r2 = nx * nx + ny * ny;
      if (r2 > 1) { d[o + 3] = 0; continue; }
      let lv = 2.4 + (H(nx - 0.06, ny - 0.12) - H(nx, ny)) * (wS > 0.3 ? 9 : 7) - r2 * r2 * 1.4;
      if (wF > 0) { // foam: little bubbles with a bright top and a dark underside
        const ci = Math.floor((i + 1) / 3), cj = Math.floor(j / 2), hv = ((ci * 73856093) ^ (cj * 19349663)) >>> 0;
        if (hv % 5 < 2 * wF + 0.5) { const bi = ci * 3 - 1 + (hv % 2), bj = cj * 2; lv += j === bj && i === bi ? 1.4 : j === bj + 1 && i === bi ? -0.9 : 0; }
      }
      if (r2 > 0.86) lv -= 0.8; // where it meets the bowl
      const dth = BAY[(j % 4) * 4 + (i % 4)] / 16;
      const pal = CREAM_PALS[pi + (pf > dth ? 1 : 0) > 3 ? 3 : pi + (pf > dth ? 1 : 0)], c = pal[clamp(Math.floor(lv + dth - 0.5), 0, 4)];
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    WV.img.getContext('2d').putImageData(WV.imgD, 0, 0);
    x.drawImage(WV.img, Math.round(Sf.cx - ox), Math.round(Sf.cy - oy));
  }
  // a pixel line of a given thickness, on the close-up canvas
  function cuLine(x, x0, y0, x1, y1, wd, col) {
    x.fillStyle = col; const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
    for (let i = 0; i <= n; i++) { const t = i / n; x.fillRect(Math.round(x0 + (x1 - x0) * t - wd / 2), Math.round(y0 + (y1 - y0) * t - wd / 2), wd, wd); }
  }
  function drawWhiskHead(x, hx, hy, L, Wd, spin, sunk, wet) { // a balloon whisk, its tip at (hx, hy), seen from above and behind
    const top = hy - L, wires = [], du = 0.7 / Math.max(L, Wd);
    for (let k = 0; k < 4; k++) {
      const a = spin + (k * Math.PI) / 4, cs = Math.cos(a), sn = Math.sin(a);
      for (let u = 0; u <= Math.PI + 0.001; u += du) {
        const rr = Math.sin(u) * Wd, z = ((1 - Math.cos(u)) / 2) * L;
        if (z > L * (1 - sunk)) continue; // (under the cream)
        wires.push({ x: Math.round(hx + rr * cs), y: Math.round(top + z + rr * sn * 0.35), back: sn < 0, z });
      }
    }
    for (const pass of [true, false]) {
      x.fillStyle = '#4a5068'; for (const q of wires) if (q.back === pass) { x.fillRect(q.x - 1, q.y, 3, 1); x.fillRect(q.x, q.y - 1, 1, 3); }
      for (const q of wires) if (q.back === pass) { x.fillStyle = pass ? '#9aa2b5' : q.z > L * (1 - sunk) - 2 && wet ? '#fff6e4' : q.x < hx ? '#ffffff' : '#d5dbe7'; x.fillRect(q.x, q.y, 1, 1); }
    }
    x.fillStyle = '#4a5068'; x.fillRect(Math.round(hx) - 3, Math.round(top) - 3, 7, 5); x.fillStyle = '#d5dbe7'; x.fillRect(Math.round(hx) - 2, Math.round(top) - 2, 5, 3); x.fillStyle = '#ffffff'; x.fillRect(Math.round(hx) - 2, Math.round(top) - 2, 2, 1);
    return { x: hx, y: top - 2 };
  }
  function renderWhip() {
    if (cuOwner !== 'whip' || (!WV.shown && !cuCv.classList.contains('on'))) return;
    const V = wvLayout(), x = cuG, t = time;
    x.imageSmoothingEnabled = false;
    wvLayers(V);
    x.drawImage(WV.back, 0, 0);
    const R = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
    // ---- Zech, across the table
    const zimg = A.zechWhisk[W.zFace] || A.zechWhisk.normal, kz = V.kz, zw = zimg.width * kz, zh = zimg.height * kz;
    const zbob = W.sub === 'race' && W.stallT < 0.3 && Math.floor(W.zJig) % 2 ? -kz : 0, zl = Math.round(V.zx - zw / 2);
    x.drawImage(zimg, zl, V.zTop + zbob, zw, zh);
    x.drawImage(WV.front, 0, 0);
    const zb = A.BOWLS.zech, bw = zb.width * kz, bh = zb.height * kz, bx = Math.round(V.zx - bw / 2), byy = V.yFar + 3 * kz - bh, zrim = byy + kz;
    R('rgba(43,39,69,.15)', bx + kz, V.yFar + 3 * kz - 1, bw - 2 * kz, kz);
    const zph = Math.PI - W.zPh, hx = V.zx + Math.cos(zph) * 3 * kz, hy = zrim - 3 * kz + Math.sin(zph) * 1.2 * kz;
    const wx = V.zx + Math.cos(zph + 0.9) * 2.6 * kz, wy = zrim + kz;
    x.drawImage(zb, bx, byy, bw, bh);
    const zc = W.sub === 'race' || W.sub === 'done' || W.sub === 'countdown' ? W.z : 0, zfill = WV.ing > 0 || W.sub !== 'prep' && W.sub !== 'intro';
    if (zfill) { const hh = Math.round((1 + zc * 5) * kz); for (let j = 0; j < hh; j += kz) { const hw = Math.round(6 * kz * (1 - Math.pow(j / (hh + kz), 1.4))); R(j + kz >= hh ? '#ffffff' : zc > 0.3 ? '#fffaf0' : '#fff1d6', V.zx - hw, zrim - j - kz, hw * 2, kz); } }
    cuLine(x, hx, hy, wx, wy - kz, Math.max(1, kz - 1), '#59607c'); // his whisk, in his bowl
    for (let a = 0; a < 6.28; a += 0.3) R(Math.sin(a) < 0 ? '#9aa6c0' : '#e3e8f2', wx + Math.cos(a + W.zPh) * 2 * kz, wy - kz + Math.sin(a) * kz, Math.max(1, kz - 1), Math.max(1, kz - 1));
    const sx = zl + 3 * kz, sy = V.zTop + zbob + 18 * kz; // his arm, from the elbow to the whisk
    cuLine(x, sx, sy, hx, hy, 4 * kz, A.OUT); cuLine(x, sx, sy, hx, hy, 2 * kz, '#7b8758');
    R(A.OUT, hx - 2 * kz, hy - 2 * kz, 4 * kz, 4 * kz); R('#f6cfa8', hx - kz, hy - kz, 2 * kz, 2 * kz);
    // ---- the ingredients waiting on the table (the one being poured is drawn later, over the bowl)
    const ingImg = (k) => (k === 0 ? A.CU.carton(V.iH) : k === 1 ? A.CU.sugarJar(Math.round(V.iH * 0.8)) : A.CU.vanilla(Math.round(V.iH * 0.7)));
    INGS.forEach((g0, k) => {
      if (W.sub === 'prep' && WV.ing === k && WV.ingT >= 0) return;
      const it = V.items[k], im = ingImg(k);
      R('rgba(43,39,69,.18)', it.x - im.width / 2 + 1, it.y - 1, im.width, 2);
      x.globalAlpha = W.sub === 'prep' && k < WV.ing ? 0.55 : 1;
      x.drawImage(im, Math.round(it.x - im.width / 2), Math.round(it.y - im.height));
      x.globalAlpha = 1;
    });
    // ---- her bowl: inside, the cream, the whisk in it, then the front of the bowl
    const { cx, rx, ry, rimY, botY } = V, Sf = creamSurf(V), p = WV.pv;
    const ell = (ex, ey, erx, ery, col) => { x.fillStyle = col; for (let j = -Math.ceil(ery); j <= Math.ceil(ery); j++) { const k = 1 - (j / ery) ** 2; if (k < 0) continue; const hw = Math.round(erx * Math.sqrt(k)); x.fillRect(Math.round(ex) - hw, Math.round(ey) + j, hw * 2 + 1, 1); } };
    ell(cx, rimY, rx + 1, ry + 1, '#59607c'); ell(cx, rimY, rx - 1, ry - 1, '#f3d3de'); ell(cx, rimY + ry * 0.35, rx * 0.86, ry * 0.86, '#f8e1e9');
    ell(cx, botY, rx * 0.62, ry * 0.62, '#fbeaf0');
    if (Sf.vol > 0.01) drawCreamTop(x, Sf, p, t);
    for (const s of WV.specks) { // vanilla seeds and sugar, swirling round with the cream, fading in
      if (s.life <= 0) continue;
      const a = s.a + WV.ang * 0.35, X = Sf.cx + Math.cos(a) * s.r * Sf.rx, Y = Sf.cy + Math.sin(a) * s.r * Sf.ry;
      x.globalAlpha = Math.min(1, s.life); R(s.col, X, Y); x.globalAlpha = 1;
    }
    const lifted = W.sub === 'done' ? WV.lift : 0, whR = Math.max(4, Math.round(rx * 0.19)), whL = Math.round(rx * 0.55);
    const wa = WV.ang, tipX = Sf.cx + Math.cos(wa) * Sf.rx * 0.42, tipY = Sf.cy + Math.sin(wa) * Sf.ry * 0.42 - lifted * rx * 0.9;
    const sunk = lifted > 0.5 ? 0 : Sf.vol > 0.05 ? 0.28 - 0.08 * p : 0, wet = Sf.vol > 0.05;
    if (Math.abs(WV.om) > 14 && lifted < 0.3) for (let k = 1; k <= 7; k++) { // a blur of speed behind the whisk
      const a = wa - k * 0.16 * Math.sign(WV.om); R(k < 4 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.3)', Sf.cx + Math.cos(a) * Sf.rx * 0.42, Sf.cy + Math.sin(a) * Sf.ry * 0.42 - whL * 0.7, 2, Math.round(whL * 0.5));
    }
    const hub = drawWhiskHead(x, tipX, tipY, whL, whR, wa * 1.6, sunk, wet);
    if (wet && lifted < 0.5) { ell(tipX, tipY - whL * sunk + 1, whR * 0.9, Math.max(1, whR * 0.32), p > 0.3 ? '#ffffff' : '#fff6e4'); R('#f1e5ce', tipX - whR * 0.6, tipY - whL * sunk + 2, whR * 1.2, 1); } // a collar of cream round it
    if (lifted > 0.3) { ell(tipX, tipY - whL * 0.25, whR * 0.9, whR * 0.7, '#ffffff'); R('#e4e6ee', tipX - 1, tipY - whL * 0.25 + whR * 0.5, whR, 1); R('#ffffff', tipX, tipY - whL * 0.25 - whR - 3, 2, 4); R('#ffffff', tipX + 1, tipY - whL * 0.25 - whR - 5, 1, 2); } // a stiff peak on the whisk
    for (let X = -rx - 1; X <= rx + 1; X++) { // the front of the bowl
      const dx = X / (rx + 1), arc = ry * Math.sqrt(Math.max(0, 1 - dx * dx)), lit = 0.65 - 0.5 * dx - 0.3 * dx * dx;
      const top = Math.round(rimY + arc), hw = rx + 1;
      for (let Y = top; Y < V.h; Y++) {
        const yy = (Y - rimY) / (rx * 1.15); if (yy >= 1 || Math.abs(X) > hw * Math.sqrt(1 - yy * yy)) break;
        x.fillStyle = Math.abs(Math.abs(X) - hw * Math.sqrt(1 - yy * yy)) < 1.2 ? '#59607c' : Y - top < 2 ? '#ffffff' : Y - top < 5 && Y - top >= 3 ? '#ff9db2' : lit > 0.75 ? '#ffe6ee' : lit > 0.45 ? '#f7c9d7' : '#e7a6bb';
        x.fillRect(cx + X, Y, 1, 1);
      }
    }
    for (let a = 0; a < Math.PI * 2; a += 0.02) { const X = cx + Math.cos(a) * rx, Y = rimY + Math.sin(a) * ry; R(Math.sin(a) > 0 ? '#ffffff' : '#f3e4ea', X, Y); } // the rim
    // ---- the ingredient being poured in
    if (W.sub === 'prep' && WV.ingT >= 0) {
      const k = WV.ing, it = V.items[k], im = ingImg(k), u = WV.ingT, left = it.x < cx;
      const px = cx + (left ? -rx * 0.3 : rx * 0.3), py = rimY - ry - im.height * 0.55;
      const mv = u < 0.25 ? easeIO(u / 0.25) : u > 0.78 ? 1 - easeIO((u - 0.78) / 0.22) : 1, tilt = (u < 0.25 ? 0 : u > 0.78 ? mv : Math.min(1, (u - 0.25) / 0.1)) * (left ? 1.9 : -1.9);
      const X = it.x + (px - it.x) * mv, Y = (it.y - im.height / 2) + (py - (it.y - im.height / 2)) * mv - Math.sin(mv * Math.PI) * 6;
      x.save(); x.translate(Math.round(X), Math.round(Y)); x.rotate(tilt); x.drawImage(im, -Math.round(im.width / 2), -Math.round(im.height / 2)); x.restore();
      if (u > 0.33 && u < 0.76) { // pouring
        const spx = X + (left ? 1 : -1) * im.height * 0.45, spy = Y + 2;
        if (k === 0) { for (let Y2 = spy; Y2 < Sf.cy; Y2++) R(Y2 % 3 ? '#fff6e4' : '#ffffff', spx + Math.sin(Y2 * 0.4 + t * 20) * 0.6, Y2, 2, 1); ell(spx, Sf.cy, 4, 1.5, '#ffffff'); }
      }
    }
    // ---- her hand on the whisk handle, coming in from the bottom right
    const hdx = cx + rx * 0.95 + Math.cos(wa) * 3 * (1 - lifted), hdy = V.h - 4 + Math.sin(wa) * 2 - lifted * rx * 0.5;
    cuLine(x, hub.x, hub.y, hdx, hdy, 5, A.OUT); cuLine(x, hub.x, hub.y, hdx, hdy, 3, '#ff9ec4'); cuLine(x, hub.x + 1, hub.y - 1, hdx + 1, hdy - 1, 1, '#ffd0e2');
    R(A.OUT, hdx - 6, hdy - 5, 13, 11); R('#ffe2c4', hdx - 5, hdy - 4, 11, 9); R('#f5c9a6', hdx - 5, hdy + 2, 11, 3); R('#ffffff', hdx - 3, hdy - 3, 3, 1);
    for (let k = 0; k < 3; k++) R('#e8b48f', hdx - 4 + k * 3, hdy - 4, 1, 4);
    R(A.OUT, hdx + 3, hdy + 1, 14, 12); R('#cfe2ff', hdx + 4, hdy + 2, 12, 10); R('#ffffff', hdx + 4, hdy + 2, 12, 2); // her sleeve
    // ---- splashes, sugar, drips
    for (const f of WV.fx) { if (f.life < 0.1 && Math.floor(f.life * 50) % 2) continue; R(f.col, f.x, f.y, f.size || 1, f.size || 1); }
    // ---- which one next: a bouncing arrow over it
    if (W.sub === 'prep' && WV.ingT < 0 && WV.ing < INGS.length) {
      const it = V.items[WV.ing], im = ingImg(WV.ing), ax = it.x, ay = it.y - im.height - 4 - Math.round(Math.abs(Math.sin(t * 5)) * 4), n = 4;
      for (let j = 0; j < n; j++) R('#13204a', ax - (n - j) - 1, ay - n + j - 1, (n - j) * 2 + 3, 1);
      for (let j = 0; j < n; j++) R(j < 2 ? '#ffe9a0' : '#ffd84a', ax - (n - j), ay - n + j, (n - j) * 2 + 1, 1);
      R('#13204a', ax, ay, 1, 1);
    }
  }
  function addIngredient() { // tap: the next ingredient goes in
    if (W.sub !== 'prep' || WV.ingT >= 0 || WV.ing >= INGS.length) return;
    WV.ingT = 0; WV.idleT = 0; hideCallout(); sfx.whoosh();
  }
  function wvUpdate(dt) {
    const V = wvLayout(), Sf = creamSurf(V);
    WV.pv += (W.p - WV.pv) * Math.min(1, dt * 5);
    // the whisk turns as fast as she taps: about a turn per tap, easing to a stop when she stops
    const since = time - WV.lastTap, want = W.sub === 'race' && since < Math.max(0.35, WV.iv * 1.8) ? (Math.PI * 2 * 0.6) / WV.iv : 0;
    WV.om += (want - WV.om) * Math.min(1, dt * 9);
    WV.ang += WV.om * dt;
    W.sPh = WV.ang;
    if (W.sub === 'done') WV.lift = Math.min(1, WV.lift + dt * 2.2);
    if (W.sub === 'prep') {
      if (WV.ingT >= 0) {
        const k = WV.ing, it = V.items[k], left = it.x < V.cx, u0 = WV.ingT; WV.ingT += dt / 1.25;
        const pouring = WV.ingT > 0.33 && WV.ingT < 0.76, spx = V.cx + (left ? -V.rx * 0.3 : V.rx * 0.3) + (left ? 1 : -1) * V.iH * 0.4;
        if (k === 0) { if (pouring) WV.vol = Math.min(0.35, (WV.vol || 0) + dt * 0.85); if (pouring && Math.random() < dt * 8) sfx.squish(); }
        if (k === 1 && pouring) {
          if (Math.random() < dt * 30) sfx.sift();
          for (let i = 0; i < 3; i++) WV.fx.push({ x: spx + rand(-2, 2), y: V.rimY - V.ry - V.iH * 0.4, vx: rand(-6, 6), vy: rand(20, 40), g: 260, life: 0.4, col: pick(['#ffffff', '#f4f6fb', '#e3e8f2']), land: Sf.cy });
        }
        if (k === 2 && pouring && Math.floor(u0 * 12) !== Math.floor(WV.ingT * 12)) { sfx.blip(); WV.fx.push({ x: spx, y: V.rimY - V.ry - V.iH * 0.3, vx: 0, vy: 30, g: 300, life: 0.5, col: '#5a3412', size: 2, land: Sf.cy, seed: true }); }
        if (WV.ingT >= 1) {
          WV.ingT = -1; WV.ing++; sfx.pip(WV.ing / INGS.length);
          const G = ovToRoom(V, V.zx, V.zTop - 4);
          if (WV.ing === 2) { W.zFace = 'puff'; popWord(G.x, G.y, pick(['achoo!', 'oops!']), false, '#ffffff'); for (let i = 0; i < 10; i++) WV.fx.push({ x: V.zx + rand(-8, 8) * V.kz / 2, y: V.zTop + 10 * V.kz + rand(-4, 4), vx: rand(-20, 20), vy: rand(-20, 5), g: 30, life: 0.8, col: '#ffffff', size: 2 }); }
          else if (WV.ing === 1) W.zFace = 'tongue';
          else W.zFace = 'normal';
          if (WV.ing >= INGS.length) { // all in: on your marks…
            later(500, () => { if (W.sub === 'prep') { W.sub = 'countdown'; W.cd = 3; W.cdShown = 4; W.zFace = 'normal'; } });
          } else showCallout(coarse ? `TAP TO ADD ${INGS[WV.ing].label}!` : `CLICK TO ADD ${INGS[WV.ing].label}!`);
        }
      } else if (WV.ing < INGS.length && (WV.idleT += dt) > 6) addIngredient(); // (never stuck: it goes in by itself after a while)
    }
    for (const s of WV.specks) s.life -= dt * (W.sub === 'race' ? 0.5 + WV.om * 0.05 : 0.08);
    for (let i = WV.specks.length - 1; i >= 0; i--) if (WV.specks[i].life <= 0) WV.specks.splice(i, 1);
    for (let i = WV.fx.length - 1; i >= 0; i--) {
      const f = WV.fx[i]; f.vy += f.g * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt;
      if (f.land && f.y >= f.land) { // landed in the bowl: becomes a speck in the cream
        WV.fx.splice(i, 1);
        const dx = (f.x - Sf.cx) / Sf.rx; WV.specks.push({ a: Math.atan2(0.3, dx) + rand(-0.5, 0.5), r: Math.min(0.85, Math.abs(dx) + rand(0, 0.3)), col: f.seed ? '#5a3412' : '#ffffff', life: f.seed ? 6 : 1.2 });
        continue;
      }
      if (f.life <= 0) WV.fx.splice(i, 1);
    }
  }
  function whipSplash() { // a tap: cream flicks up off the whisk (less as it stiffens)
    const V = wvLayout(), Sf = creamSurf(V), n = Math.round(4 - WV.pv * 3);
    const tx = Sf.cx + Math.cos(WV.ang) * Sf.rx * 0.42, ty = Sf.cy + Math.sin(WV.ang) * Sf.ry * 0.42;
    for (let i = 0; i < n; i++) WV.fx.push({ x: tx + rand(-3, 3), y: ty - 2, vx: rand(-40, 40), vy: rand(-60, -25), g: 220, life: 0.5, col: WV.pv > 0.3 ? '#ffffff' : '#fff6e4', size: pick([1, 1, 2]) });
  }

  /* =====================================================================
     STAGE 2: strawberry catch (no timer, no way to lose)
     ===================================================================== */
  Object.assign(CT, { sub: 'idle', caught: 0, spawnT: 0, missStreak: 0, dizzyT: 0, spawned: 0, hud: null, moved: false, pile: [], landT: 0 });
  function catchReset() {
    Object.assign(CT, { sub: 'idle', caught: 0, spawnT: 0.6, missStreak: 0, dizzyT: 0, spawned: 0, moved: false, pile: [], landT: 0 });
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
  const bowlRim = () => Math.round(kid.y - A.GIRL_H / 2) + 23; // (she holds the bowl at her waist, so the pile doesn't hide her face)
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
    if (CT.landT > 0) CT.landT = Math.max(0, CT.landT - dt);
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
          CT.pile.push(...(n > 1 ? ['straw', 'gold', 'straw'] : ['straw'])); CT.landT = 0.13;
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
  // where each strawberry sits in the pile in her bowl: a heap, bottom row first (x from the bowl's middle, y up from its rim)
  const PILE = (() => {
    const out = [];
    [[4, -1], [4, 1], [4, 2.6], [3, 4], [4, 4.8], [3, 6], [2, 7.2], [2, 8.2], [1, 9.5]].forEach(([n, hy], r) => {
      for (let i = 0; i < n; i++) out.push({ x: (i - (n - 1) / 2) * (n > 3 ? 3.4 : 3.1) + (r % 2 ? 0.7 : -0.5), y: -hy + ((i * 7 + r * 3) % 3 === 0 ? 0.5 : 0), v: (i * 3 + r) % 4 });
    });
    return out;
  })();
  function catchRenderBowl(pose) {
    const bowl = A.BOWLS.sophia, bx = Math.round(kid.x - bowl.width / 2) + (pose.sx - Math.round(kid.x - A.GIRL_W / 2)), by = pose.sy + 22, mx = bx + bowl.width / 2;
    g.fillStyle = '#5b7fc0'; g.fillRect(bx + 2, by - 1, bowl.width - 4, 1); g.fillStyle = '#9fc0f0'; g.fillRect(bx + 3, by, bowl.width - 6, 1); // the inside of the bowl
    // the strawberries she's caught, heaped up (the newest one drops in with a bounce, and the pile jiggles)
    const n = Math.min(CT.pile.length, PILE.length), jig = CT.landT > 0 ? Math.round(Math.sin(CT.landT * 40)) : 0;
    for (let i = 0; i < n; i++) {
      const s = PILE[i], gold = CT.pile[i] === 'gold', img = (gold ? A.MINI_GOLDS : A.MINI_STRAWS)[s.v];
      const drop = i === n - 1 && CT.landT > 0 ? -Math.round(CT.landT * CT.landT * 60) : 0;
      const X = Math.round(mx + s.x - 2) + (i % 2 ? jig : 0), Y = Math.round(by + s.y - 2) + drop;
      g.drawImage(img, X, Y);
      if (gold && Math.floor(time * 6 + i) % 4 === 0) { g.fillStyle = '#ffffff'; g.fillRect(X + 3, Y - 1, 1, 1); }
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
  const ZE = { mode: 'off', x: 0, y: 0, vx: 0, vy: 0, tx: 0, face: 'happy', t: 0, fromX: 0, fromY: 0, quipT: 0, cheerT: 0, dizzyT: 0, panicT: 0, hug: false, reunite: false, heartT: 0, run: false, wriggle: false };
  const hugX = () => Math.round(iw / 2);
  function zechReset() { Object.assign(ZE, { mode: 'off', vx: 0, vy: 0, face: 'happy', t: 0, quipT: 2, cheerT: 0, dizzyT: 0, panicT: 0, hug: false, reunite: false, heartT: 0, run: false, wriggle: false }); KN.t = -1; }
  function zechOnTop() { // stuck in the strawberry mountain on top of the cake, left of the bow
    const c = cakePosNow();
    return { x: c.x + 14, y: c.y + 18 };
  }
  function updateZech(dt) {
    if (ZE.mode === 'off') return;
    ZE.t += dt; ZE.dizzyT -= dt; ZE.cheerT -= dt; ZE.panicT -= dt;
    if (KN.t >= 0) kidnapUpdate(dt);
    if (ZE.mode === 'walk') {
      ZE.y = groundY();
      const sp = (ZE.reunite ? 70 : 60) * dt;
      ZE.x += clamp(ZE.tx - ZE.x, -sp, sp);
    } else if (ZE.mode === 'yank') { // being kidnapped: kidnapUpdate() moves him
      if (KN.t < 0) ZE.mode = 'ontop';
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
  const zechFlipped = {};
  function drawZech() {
    if (ZE.mode === 'off') return;
    const face = ZE.panicT > 0 ? 'tired' : ZE.cheerT > 0 || ZE.hug ? 'happy' : ZE.face;
    let img = A.zech[face];
    if (ZE.wriggle && Math.floor(time * 6) % 2) img = zechFlipped[face] || (zechFlipped[face] = A.flip(img)); // kicking and wriggling
    let x = Math.round(ZE.x - img.width / 2), y = Math.round(ZE.y) - img.height + 1;
    if (ZE.run) y -= Math.floor(time * 16) % 2;
    if (ZE.mode === 'walk' && Math.abs(ZE.tx - ZE.x) > 1) y += Math.floor(ZE.t * 10) % 2 ? -1 : 0;
    if (ZE.hug) y += Math.floor(time * 2.5) % 2 ? -1 : 0;
    if (ZE.dizzyT > 0) x += Math.floor(time * 30) % 2 ? 1 : -1;
    if (ZE.panicT > 0) y -= Math.floor(time * 12) % 2 ? 1 : 0; // flustered little hops
    if (ZE.mode !== 'ontop') { g.fillStyle = 'rgba(43,39,69,.22)'; if (ZE.mode === 'walk') g.fillRect(Math.round(ZE.x) - 6, Math.round(ZE.y), 12, 2); }
    g.drawImage(img, x, y);
    if (ZE.dizzyT > 0) {
      g.fillStyle = '#ffd84a';
      for (let k = 0; k < 3; k++) { const a = time * 7 + k * 2.1; g.fillRect(Math.round(ZE.x + Math.cos(a) * 8), Math.round(y - 2 + Math.sin(a) * 2), 2, 2); }
    }
  }

  /* the kidnapping: he spots the cake coming alive and tries to run; the cake's side swells, and a jelly-soft
     whipped-cream arm uncoils out of it, swoops down on him, wraps round his middle, swings him up and over
     and drops him into the strawberries, then slurps back in. Everything moves on smooth curves: the hand
     follows one continuous path (no sudden turns or stops), the arm is a chain of springy segments that
     trail behind it, and he swings a little under the hand as he's carried. */
  const KN = { t: -1, x0: 0, base: 0, holding: false, dripT: 0, tip: { x: 0, y: 0 }, nodes: [], zx: 0, zy: 0, zvx: 0, zvy: 0, wrap: 0, falling: false, fvy: 0, rel: null };
  const KT = { bulge: 0.12, flee: 0.45, reach: 0.5, grab: 1.05, wrapped: 1.2, lift: 1.3, apex: 1.8, hover: 2.25, release: 2.65, retract: 2.9, end: 3.5 };
  const WAIST = 11, ARM_N = 12; // his middle, measured up from his feet; segments in the arm
  const easeIO = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const easeOut = (u) => 1 - (1 - u) * (1 - u);
  const easeBack = (u) => 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2);
  const hermite = (p0, v0, p1, v1, u, d) => { // a smooth step from p0 to p1, leaving and arriving at the given speeds
    const u2 = u * u, u3 = u2 * u, a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, e = u3 - u2;
    return { x: a * p0.x + b * d * v0.x + c * p1.x + e * d * v1.x, y: a * p0.y + b * d * v0.y + c * p1.y + e * d * v1.y };
  };
  const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return { x: v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x, y: v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y }; };
  const armCtl = (B, T, curl = 1) => { // the arm's resting shape: out of the cake and up, then down onto the hand from above
    const L = Math.hypot(T.x - B.x, T.y - B.y);
    return [{ x: B.x + 8 + L * 0.12, y: B.y - (L * 0.45 + 5) * curl }, { x: T.x + (B.x - T.x) * 0.1, y: T.y - (L * 0.35 + 7) * curl }];
  };
  function armBase() { const c = cakePosNow(); return { x: c.x + CAKE.w - 6, y: c.y + Math.round(CAKE.h * 0.55) }; }
  function hoverPt() { const o = zechOnTop(); return { x: o.x, y: o.y - WAIST - 14 }; } // (his middle, while he dangles over the cake)
  const grabPt = () => ({ x: KN.x0 + Math.max(0, Math.min(16, iw - 12 - KN.x0)), y: KN.base - WAIST }); // where he'll have run to
  function startKidnap() {
    Object.assign(ZE, { mode: 'yank', t: 0, face: 'tired', run: false, wriggle: false, panicT: 0 });
    const B = armBase();
    Object.assign(KN, { t: 0, x0: ZE.x, base: groundY(), holding: false, dripT: 0, wrap: 0, falling: false, fvy: 0, rel: null, zvx: 0, zvy: 0,
      tip: { ...B }, nodes: Array.from({ length: ARM_N + 1 }, () => ({ x: B.x, y: B.y, vx: 0, vy: 0 })) });
    K.shakeT = 0.6; sfx.thud();
  }
  function kidnapTip(t, B) { // where the hand is at time t: one smooth path from the cake, onto him, up and over, and back
    const G = grabPt(), H = hoverPt(), Tg = { x: G.x, y: G.y - 1 }, Th = { x: H.x, y: H.y - 1 };
    const seg = (a, b, pa, va, pb, vb) => hermite(pa, va, pb, vb, clamp((t - a) / (b - a), 0, 1), b - a);
    if (t < KT.reach) return { ...B };
    if (t < KT.grab) return seg(KT.reach, KT.grab, B, { x: 60, y: -150 }, Tg, { x: 0, y: 70 });       // up out of the cake, swooping down on him
    if (t < KT.lift) return seg(KT.grab, KT.lift, Tg, { x: 0, y: 70 }, { x: Tg.x, y: Tg.y + 1 }, { x: 0, y: -10 }); // squeeze (it gives a little)
    const apex = { x: Tg.x + (Th.x - Tg.x) * 0.4, y: Math.min(Tg.y, Th.y) - 7 }, av = { x: ((Th.x - Tg.x) / (KT.hover - KT.lift)) * 1.3, y: -12 };
    if (t < KT.apex) return seg(KT.lift, KT.apex, { x: Tg.x, y: Tg.y + 1 }, { x: 0, y: -10 }, apex, av); // up…
    if (t < KT.hover) return seg(KT.apex, KT.hover, apex, av, Th, { x: 0, y: 0 });                      // …and over the cake
    if (t < KT.release) { // dangling him there, a gentle sway
      const u = (t - KT.hover) / (KT.release - KT.hover), s = Math.sin(Math.PI * u);
      return { x: Th.x + 2.5 * Math.sin(2 * Math.PI * u) * s, y: Th.y + 0.8 * Math.sin(4 * Math.PI * u) * s };
    }
    const R = { x: Th.x + 5, y: Th.y - 8 };
    if (t < KT.retract) return seg(KT.release, KT.retract, Th, { x: 0, y: 0 }, R, { x: 0, y: 0 });       // lets go and lifts away
    return seg(KT.retract, KT.end - 0.08, R, { x: 0, y: 0 }, B, { x: -25, y: 70 });                     // and slurps back into the cake
  }
  function kidnapUpdate(dt) {
    const prev = KN.t, t = (KN.t += dt), B = armBase();
    const at = (k) => prev < KT[k] && t >= KT[k]; // true on the frame a beat starts
    // the hand, and the arm's springy segments trailing after it (stiff near the cake, softer towards the hand)
    const T = kidnapTip(t, B); KN.tip = T;
    const [c1, c2] = armCtl(B, T, 1 - 0.8 * easeIO(clamp((t - KT.release) / 0.45, 0, 1))), N = KN.nodes; // (it relaxes as it reels back in)
    N[0].x = B.x; N[0].y = B.y; N[ARM_N].x = T.x; N[ARM_N].y = T.y;
    for (let i = 1; i < ARM_N; i++) {
      const n = N[i], r = bez(B, c1, c2, T, i / ARM_N), k = 300 - 140 * (i / ARM_N), c = 2 * Math.sqrt(k) * 0.62;
      n.vx += (k * (r.x - n.x) - c * n.vx) * dt; n.vy += (k * (r.y - n.y) - c * n.vy) * dt;
      n.x += n.vx * dt; n.y += n.vy * dt;
    }
    if (ZE.mode === 'yank') {
      if (t < KT.flee) { // a startled hop…
        ZE.x = KN.x0; ZE.y = KN.base - Math.sin((t / KT.flee) * Math.PI) * 5;
      } else if (t < KT.grab) { // …and he tries to run for it
        ZE.run = true; ZE.y = KN.base;
        ZE.x = KN.x0 + (grabPt().x - KN.x0) * easeOut((t - KT.flee) / (KT.grab - KT.flee));
        if (Math.floor(t * 12) !== Math.floor(prev * 12)) parts.push({ x: ZE.x - 5, y: KN.base - 1, vx: rand(-14, -6), vy: rand(-8, -2), g: 0, life: 0.35, col: '#ffffff', size: 1, ground: 1e9 });
      }
      if (at('reach')) sfx.whoosh();
      if (at('grab')) {
        Object.assign(ZE, { run: false, wriggle: true, face: 'lose' });
        KN.holding = true; KN.zx = ZE.x; KN.zy = ZE.y - WAIST; KN.zvx = KN.zvy = 0;
        shakeT = 0.12; shakeA = 1; sfx.hit();
        popWord(ZE.x, ZE.y - 36, 'GOTCHA!', false, '#ffffff');
        for (let i = 0; i < 8; i++) parts.push({ x: ZE.x + rand(-7, 7), y: ZE.y - WAIST + rand(-2, 2), vx: rand(-40, 40), vy: rand(-50, -10), g: 200, life: 0.5, col: pick(['#fffaf1', '#ffffff', '#ffb3cf']), size: 1, ground: groundY() });
      }
      if (KN.holding) {
        KN.wrap = clamp((t - KT.grab) / (KT.wrapped - KT.grab), 0, 1);
        // he hangs from the hand on a soft spring: lags a touch behind when it moves, swings, settles
        const k = 340, c = 2 * Math.sqrt(k) * 0.68;
        KN.zvx += (k * (T.x - KN.zx) - c * KN.zvx) * dt; KN.zvy += (k * (T.y + 1 - KN.zy) - c * KN.zvy) * dt;
        KN.zx += KN.zvx * dt; KN.zy += KN.zvy * dt;
        ZE.x = KN.zx; ZE.y = KN.zy + WAIST;
        if ((KN.dripT -= dt) <= 0) { // whipped cream dripping off him
          KN.dripT = 0.14;
          parts.push({ x: ZE.x + rand(-6, 6), y: ZE.y - WAIST + 3, vx: 0, vy: 6, g: 220, life: 0.9, col: pick(['#fffaf1', '#fffaf1', '#ffb3cf']), size: 1, ground: groundY() });
        }
        if (Math.random() < dt * 3) parts.push({ x: ZE.x + (Math.random() < 0.5 ? -7 : 6), y: ZE.y - 28, vx: rand(-20, 20), vy: rand(-26, -14), g: 90, life: 0.5, col: '#8ec5ff', size: 1, ground: 1e9 }); // panic sweat
      }
      if (at('lift')) sfx.whoosh();
      if (at('release')) { KN.holding = false; KN.falling = true; KN.fvy = KN.zvy * 0.3; Object.assign(ZE, { wriggle: false, face: 'tired' }); sfx.squish(); }
      if (KN.falling) { // the cream unwinds and he drops into the strawberries
        KN.wrap = clamp(1 - (t - KT.release) / 0.12, 0, 1);
        const o = zechOnTop();
        KN.fvy += 420 * dt; ZE.y += KN.fvy * dt; ZE.x += (o.x - ZE.x) * Math.min(1, dt * 12);
        if (ZE.y >= o.y) {
          KN.falling = false; KN.wrap = 0;
          ZE.mode = 'ontop'; ZE.x = o.x; ZE.y = o.y;
          K.shakeT = 0.3; sfx.splat(); sfx.thud();
          popWord(o.x, o.y - 30, 'PLOP!', false, '#ffc2d6');
          for (let i = 0; i < 14; i++) parts.push({ x: o.x + rand(-6, 6), y: o.y - 4, vx: rand(-55, 55), vy: rand(-90, -40), g: 300, life: rand(0.5, 0.9), col: pick(['#e8405a', '#ff6b98', '#fffaf1', '#fffaf1']), size: pick([1, 1, 2]), ground: groundY() });
        }
      }
    }
    if (at('retract')) sfx.squish();
    if (t >= KT.end && ZE.mode !== 'yank') KN.t = -1;
  }
  function disc(cx, cy, r, col) {
    g.fillStyle = col; cx = Math.round(cx); cy = Math.round(cy);
    for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1); }
  }
  function drawCreamArm() { // a tapering tube of whipped cream through the arm's segments, with a strawberry-sauce swirl running down it
    const N = KN.nodes, pts = [];
    if (Math.hypot(KN.tip.x - N[0].x, KN.tip.y - N[0].y) < 2) return;
    const P = (i) => N[clamp(i, 0, ARM_N)];
    for (let i = 0; i < ARM_N; i++) { // a Catmull-Rom curve through the segments, sampled finely so it's smooth
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), m = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 0.7));
      for (let j = 0; j < m; j++) {
        const u = j / m, u2 = u * u, u3 = u2 * u;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
        pts.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
      }
    }
    pts.push({ x: N[ARM_N].x, y: N[ARM_N].y });
    let s = 0;
    pts.forEach((p, i) => { if (i) s += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y); p.s = s; p.r = i / pts.length < 0.5 ? 3 : 2; });
    for (const p of pts) disc(p.x, p.y, p.r + 1, A.OUT);
    for (const p of pts) disc(p.x, p.y, p.r, '#fffaf1');
    g.fillStyle = '#ffffff'; for (const p of pts) g.fillRect(Math.round(p.x), Math.round(p.y) - p.r + 1, 1, 1);
    g.fillStyle = '#ffb3cf'; const flow = KN.t * 14;
    for (const p of pts) g.fillRect(Math.round(p.x), Math.round(p.y + Math.sin((p.s - flow) * 0.5) * (p.r - 1)), 1, 1);
  }
  function drawArmBase() { // the cream bulging out of the side of the cake where the arm comes from
    const t = KN.t, B = armBase();
    const r = t < KT.bulge ? 0 : t < KT.reach ? 4 * easeBack(clamp((t - KT.bulge) / (KT.reach - KT.bulge), 0, 1)) : t > KT.end - 0.15 ? 4 * clamp((KT.end - t) / 0.15, 0, 1) : 4;
    const R = Math.round(r + (t > KT.bulge && t < KT.reach ? Math.sin(t * 40) * 0.6 : 0));
    if (R < 1) return;
    disc(B.x, B.y, R + 1, A.OUT); disc(B.x, B.y, R, '#fffaf1');
    g.fillStyle = '#ffffff'; g.fillRect(Math.round(B.x) - 1, Math.round(B.y) - R + 1, 2, 1);
    g.fillStyle = '#ffb3cf'; g.fillRect(Math.round(B.x) - 1, Math.round(B.y) + 1, 2, 1);
  }
  function drawWrap(front) { // the end of the arm coiled round his middle: the back of the loop behind him, the front over him
    if (KN.wrap <= 0) return;
    const cx = ZE.x, cy = ZE.y - WAIST, rx = 7, ry = 2.5, a0 = -Math.PI / 2, sweep = 3 * Math.PI * KN.wrap, pts = [];
    for (let a = a0; a <= a0 + sweep; a += 0.12) if ((Math.sin(a) > 0) === front) pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, a });
    for (const p of pts) disc(p.x, p.y, 2, A.OUT);
    for (const p of pts) disc(p.x, p.y, 1, '#fffaf1');
    g.fillStyle = '#ffb3cf'; for (const p of pts) if (Math.round(p.a * 3) % 4 === 0) g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    const e = a0 + sweep;
    if (front && Math.sin(e) > 0) { disc(cx + Math.cos(e) * rx, cy + Math.sin(e) * ry, 3, A.OUT); disc(cx + Math.cos(e) * rx, cy + Math.sin(e) * ry, 2, '#fffaf1'); g.fillStyle = '#ffffff'; g.fillRect(Math.round(cx + Math.cos(e) * rx) - 1, Math.round(cy + Math.sin(e) * ry) - 1, 1, 1); } // fingertips on his tummy
  }
  function drawAlert(x, y) { // a little "!" speech bubble
    x = Math.round(x); y = Math.round(y) - (Math.floor(time * 8) % 2);
    g.fillStyle = A.OUT; g.fillRect(x - 3, y - 11, 7, 9); g.fillRect(x - 4, y - 10, 9, 7); g.fillRect(x - 1, y - 2, 2, 2);
    g.fillStyle = '#ffffff'; g.fillRect(x - 3, y - 10, 7, 7); g.fillRect(x, y - 3, 1, 1);
    g.fillStyle = '#e8405a'; g.fillRect(x, y - 9, 1, 3); g.fillRect(x, y - 5, 1, 1);
  }
  const zechInCake = () => KN.falling; // (once he's let go, he drops in behind the strawberries on top)
  function kidnapRender() { // drawn in front of the cake
    const t = KN.t, armOn = t >= KT.reach && t < KT.end;
    drawArmBase();
    if (armOn) drawCreamArm();
    if (ZE.mode === 'yank') {
      drawWrap(false);
      if (!zechInCake()) drawZech();
      drawWrap(true);
    }
    if (armOn && t < KT.grab) g.drawImage(A.CREAM_HAND, Math.round(KN.tip.x) - 6, Math.round(KN.tip.y) - 6); // the open hand, reaching
    if (ZE.mode === 'yank' && t < KT.grab) drawAlert(ZE.x, ZE.y - A.ZECH_H + 1);
  }

  /* =====================================================================
     STAGE 3: the giant strawberry cake boss
     ===================================================================== */
  const cake = { show: false, alive: false, hp: 5, rope: -80, ropeV: 0, theta: 0, omega: 0, landed: false, flashT: 0, blinkT: 0, shakeT: 0, hurtT: 0, faintT: 0 };
  const B = { sub: 'idle', hits: 0, hitCD: 0, swingCD: 0, swingT: 0, swingIn: 0 };
  const cakeX = () => Math.round(iw / 2 + cake.rope * Math.sin(cake.theta) - CAKE.ropeX);
  const cakeY = () => Math.round(cake.rope * Math.cos(cake.theta));
  const ropeK = () => clamp(45 / Math.max(1, ropeTarget), 0.3, 1); // same sideways swing whatever the rope length
  const inCake = (px, py) => { const x0 = cakeX(), y0 = cakeY(); return px >= x0 + 1 && px <= x0 + CAKE.w - 2 && py >= y0 + 3 && py <= y0 + CAKE.h - 2; };

  function bossReset(keepCake) {
    Object.assign(B, { sub: 'idle', hits: 0, hitCD: 0, swingCD: 0, swingT: 0, swingIn: 0 });
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
      hint(coarse ? 'DRAG TO MOVE · TAP TO JUMP + SWING' : 'MOVE TO WALK · CLICK TO JUMP + SWING');
    }));
  }
  function bossTap() {
    if (B.sub !== 'battle' || B.swingCD > 0) return;
    B.swingCD = 0.3;
    if (kid.jy === 0 && kid.jv === 0) { kid.jv = -167; B.swingIn = 0.1; sfx.blip(); } // jump (about 20px up)…
    else B.swingIn = 0.001;                                                           // (already in the air: just swing)
  }
  function bossSwing() {                    // …and swing near the top of the jump
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
    cake.omega += (-7 * Math.sin(cake.theta) - 0.5 * cake.omega + (low ? rand(-6, 6) * ropeK() : 0)) * dt;
    cake.theta = clamp(cake.theta + cake.omega * dt, -1, 1);
    for (const k of ['flashT', 'blinkT', 'shakeT', 'hurtT']) cake[k] -= dt;
    if (cake.faintT > 0 && (cake.faintT -= dt) <= 0) burst();
  }
  function bossUpdate(dt) {
    B.swingCD -= dt; B.swingT -= dt; B.hitCD -= dt;
    if (B.swingIn > 0 && (B.swingIn -= dt) <= 0) { B.swingIn = 0; if (B.sub === 'battle') bossSwing(); }
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
    cake.omega += kid.face * 1.6 * ropeK(); // (a long rope would fling it out of reach)
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
     STAGE 2: fluffy sponge (hold to bake, let go when it reaches the line)
     ===================================================================== */
  const SPONGES = 3, SP_TARGET = 0.78;
  const SP = { sub: 'idle', n: 0, r: 0, tol: 0.11, t: 0, flyT: -1, hud: null, beepT: 0, cheerT: 0 };
  function spongeGeo() {
    const k = ih >= 145 && iw >= 120 ? 2 : 1, narrow = iw < 200;
    return { k, base: groundY(), oven: Math.round(iw * (narrow ? 0.66 : 0.6)), her: Math.round(iw * (narrow ? 0.24 : 0.32)) };
  }
  function spongeReset() {
    Object.assign(SP, { sub: 'idle', n: 0, r: 0, tol: 0.11, t: 0, flyT: -1, beepT: 0, cheerT: 0 });
    Object.assign(OV, { shown: false, heat: 0, knob: 0, timer: 0, spill: 0, door: 0, fx: [], steamT: 0, lift: 0 });
    kid.x = spongeGeo().her; kid.y = groundY() - A.GIRL_H / 2 + 1; kid.vx = kid.vy = 0;
  }
  function spongeBegin() {
    SP.hud = stageHud(`STAGE ${stageIdx + 1} · FLUFFY SPONGE`, [{ key: 's', tag: 'SPONGE', cls: 'her', num: true }]);
    setBar(SP.hud.s, 0, `0/${SPONGES}`);
    document.body.classList.add('hud-stage', 'closeup');
    measureHud(); showOven(true); sfx.whoosh();
    SP.sub = 'intro';
    say([
      `Next: the sponge! A strawberry cake needs ${SPONGES} fluffy chiffon layers.`,
      coarse ? 'Press and hold to switch the oven on. Watch the chiffon rise through the window, and let go when its top reaches the gold line!'
        : 'Hold the mouse button (or space) to switch the oven on. Watch the chiffon rise through the window, and let go when its top reaches the gold line!',
    ], () => { SP.sub = 'ready'; lockT = 0.2; showCallout('HOLD TO BAKE!'); });
  }
  function spongeTap() { // finger / button / space goes down: the oven heats up and the batter starts to rise
    if (SP.sub !== 'ready') return;
    SP.sub = 'rise'; SP.r = 0; SP.beepT = 0; hideCallout();
  }
  function spongeRelease() { // …and comes up: how did it turn out?
    if (SP.sub !== 'rise') return;
    const V = ovLayout(), d = SP.r - SP_TARGET, q = ovToRoom(V, V.pcx, V.wy0 - 6);
    if (Math.abs(d) <= SP.tol) {
      SP.sub = 'pop'; SP.flyT = 0; OV.lift = SP.r; kid.happyT = 0.8; kid.hopT = 0.1;
      popWord(q.x, q.y, Math.abs(d) <= SP.tol / 2 ? 'PERFECT!' : 'FLUFFY!', false, '#ffd84a');
      sfx.ding(); sfx.gold();
      for (let i = 0; i < 10; i++) OV.fx.push({ x: rand(V.pcx - V.pr, V.pcx + V.pr), y: batter(V, SP.r).top + rand(-2, 4), vx: rand(-30, 30), vy: rand(-40, -10), g: 40, life: 0.6, col: pick(['#ffffff', '#ffe9a0', '#ffd84a']) });
    } else {
      SP.sub = 'sink'; SP.tol = Math.min(0.22, SP.tol + 0.04); // a little more forgiving every time
      popWord(q.x, q.y, d < 0 ? 'TOO FLAT!' : 'TOO PUFFY!', false, '#ffffff');
      sfx.splat();
    }
  }
  function spongeUpdate(dt) {
    SP.t += dt;
    if (OV.shown || cuCv.classList.contains('on')) ovUpdate(dt);
    const G = spongeGeo();
    if (SP.sub === 'rise') {
      SP.r += (0.25 + 0.55 * SP.r) * dt;
      if ((SP.beepT -= dt) <= 0) { SP.beepT = 0.16; sfx.rise(SP.r); }
      if (Math.random() < dt * 14) parts.push({ x: G.oven + rand(-12, 12) * G.k, y: G.base - 41 * G.k, vx: rand(-4, 4), vy: rand(-26, -14), g: 0, life: 0.6, col: pick(['#ffffff', '#ffe2b8']), size: 1, ground: 1e9 });
      if (SP.r >= 1) { // held too long: it puffs right over the top of the tin
        SP.sub = 'poof'; SP.tol = Math.min(0.22, SP.tol + 0.04);
        const V = ovLayout(), q = ovToRoom(V, V.pcx, V.wy0 - 6);
        popWord(q.x, q.y, 'POOF!', false, '#ffffff');
        sfx.toast();
        for (let i = 0; i < 14; i++) parts.push({ x: G.oven + rand(-8, 8) * G.k, y: G.base - 24 * G.k, vx: rand(-40, 40), vy: rand(-60, -20), g: 120, life: 0.7, col: pick(['#fffaf1', '#f7cf7d']), size: 2, ground: G.base });
      }
    } else if (SP.sub === 'sink' || SP.sub === 'poof') { // back to a flat tin, then try again
      SP.r = Math.max(0, SP.r - dt * (SP.sub === 'poof' ? 1.4 : 1.8));
      if (SP.r <= 0) { SP.sub = 'ready'; showCallout('HOLD TO BAKE!'); }
    } else if (SP.sub === 'pop') { // the door opens, the chiffon hops out onto the cooling rack, a fresh pan goes in
      const f0 = SP.flyT; SP.flyT += dt / 1.15;
      if (f0 < 0.12 && SP.flyT >= 0.12) sfx.whoosh();
      if (f0 < 0.7 && SP.flyT >= 0.7) { sfx.catch(); buzz(12); }
      if (SP.flyT >= 1) {
        SP.flyT = -1; SP.n++; SP.r = 0;
        setBar(SP.hud.s, SP.n / SPONGES, `${SP.n}/${SPONGES}`);
        if (SP.n >= SPONGES) { SP.sub = 'done'; kid.happyT = 2; hideCallout(); later(800, () => showOven(false)); later(1000, stageClear); }
        else { SP.sub = 'ready'; showCallout(SP.n === SPONGES - 1 ? 'LAST ONE!' : 'NEXT ONE!'); }
      }
    }
  }
  function spongeRender() {
    const G = spongeGeo(), k = G.k;
    // her, close up, watching the oven
    const img = A.girl[`idle${kid.happyT > 0 ? 1 : 0}R`];
    const bob = SP.sub === 'rise' ? -(Math.floor(SP.t * 8) % 2) : kid.hopT > 0 ? -1 : 0;
    g.save(); g.translate(G.her, G.base + 1); g.scale(k, k);
    g.fillStyle = 'rgba(43,39,69,.2)'; g.fillRect(-8, 0, 16, 1);
    g.drawImage(img, -Math.round(img.width / 2), -img.height + bob);
    g.restore();
    // the oven (drawn small and zoomed like the whipping close-up)
    g.save(); g.translate(G.oven, G.base + 1); g.scale(k, k);
    const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const O = A.OUT, heat = SP.sub === 'rise' ? 0.6 + 0.4 * Math.sin(SP.t * 20) : 0;
    R('rgba(43,39,69,.2)', -18, 0, 36, 1);
    R(O, -16, -2, 4, 2); R(O, 12, -2, 4, 2);                                     // little feet
    R(O, -18, -39, 36, 38); R('#f4f6fb', -17, -38, 34, 36);                      // body
    R('#ffffff', -17, -38, 34, 1); R('#dfe4ee', -17, -3, 34, 1);
    R('#7fb2ff', -17, -32, 34, 2);                                              // blue trim
    for (const kx of [-12, -6]) { R(O, kx - 2, -37, 5, 4); R('#c9d1e3', kx - 1, -36, 3, 2); R('#ffffff', kx - 1, -36, 1, 1); } // knobs
    R(O, 2, -37, 12, 4); R('#2b2745', 3, -36, 10, 2);                           // heat display
    R(heat ? '#ff9a4a' : '#5b6380', 3, -36, Math.max(1, Math.round(10 * Math.min(1, SP.r))), 2);
    R('#9aa6c0', -15, -30, 30, 26); R('#e9edf5', -14, -29, 28, 24);             // door
    R(O, -10, -29, 20, 2); R('#c9d1e3', -9, -29, 18, 1);                        // handle
    // the window: warm inside, a tin on the rack, batter rising towards the dotted line
    R(O, -12, -26, 24, 19);
    const inside = heat ? (heat > 0.8 ? '#a8502a' : '#94452a') : '#3b2b33';
    R(inside, -11, -25, 22, 17);
    if (heat) { R('rgba(255,170,90,.35)', -11, -10, 22, 2); }
    R('#6b6f80', -11, -10, 22, 1);                                               // rack
    const tinTop = -14;
    // batter (or the poof spilling over)
    const h = Math.round(2 + SP.r * 9), bt = tinTop - h;
    if (SP.sub !== 'pop' && SP.sub !== 'done') {
      R(SP.r > 0.85 ? '#e7b35d' : '#f7cf7d', -7, bt + 1, 14, h);
      R('#fde5a6', -6, bt, 12, 1);
      if (SP.sub === 'poof') { R('#fde5a6', -10, -26, 20, 3); R('#f7cf7d', -9, -24, 18, 3); }
    }
    R('#9aa6c0', -8, tinTop, 16, 4); R('#c9d1e3', -8, tinTop, 16, 1);           // tin
    // the "perfect" zone: a dotted line, with a soft band that widens after misses
    if (SP.sub === 'ready' || SP.sub === 'rise' || SP.sub === 'sink' || SP.sub === 'poof') {
      const y0 = tinTop - Math.round(2 + (SP_TARGET + SP.tol) * 9), y1 = tinTop - Math.round(2 + (SP_TARGET - SP.tol) * 9);
      R('rgba(255,255,255,.18)', -11, y0, 22, Math.max(1, y1 - y0 + 1));
      g.fillStyle = '#ffffff';
      const ly = tinTop - Math.round(2 + SP_TARGET * 9);
      for (let x = -11; x < 11; x += 2) g.fillRect(x, ly, 1, 1);
      R('#ffd84a', -12, ly, 1, 1); R('#ffd84a', 11, ly, 1, 1);
    }
    R('rgba(255,255,255,.35)', -10, -24, 1, 4); R('rgba(255,255,255,.35)', -9, -24, 1, 2); // glass glint
    // baked sponges piled on top of the oven
    const S = A.SPONGE;
    for (let i = 0; i < SP.n; i++) g.drawImage(S, -Math.round(S.width / 2) + (i % 2 ? 1 : -1), -39 - (i + 1) * (S.height - 2));
    if (SP.flyT >= 0) { // one in mid-air, hopping out of the door up onto the pile
      const t = SP.flyT, fy = -16 + (-39 - (SP.n + 1) * (S.height - 2) + 16) * t - Math.sin(t * Math.PI) * 18;
      g.drawImage(S, -Math.round(S.width / 2) + Math.round(Math.sin(t * Math.PI) * 10), Math.round(fy));
    }
    g.restore();
  }

  /* the oven close-up: a wall oven at eye level on the close-up canvas, and through its glass door a chiffon
     cake rising in its tube pan: it domes up over the rim, browns, and cracks on top like the real thing */
  const OV = { shown: false, heat: 0, knob: 0, timer: 0, spill: 0, door: 0, fx: [], steamT: 0, base: null, door0: null, baseKey: '', bg: new Map(), lift: 0 };
  function ovLayout() {
    const { H, P, w, h } = cuSize();
    const Bm = Math.ceil((H * 0.05 + 64) / P), hb = Math.ceil(IC.hudB / P) + 6, hr = Math.ceil(IC.hudR / P) + 6;
    const fit = (L, T) => { // the oven with its counter below it, or (on wide screens) the cooling rack beside it
      const aw = w - 6 - L, ah = Math.max(40, h - T - Bm), side = aw / ah > 1.25;
      return { L, T, aw, ah, side, Wo: Math.floor(side ? Math.min(aw / 1.62, ah / 1.12) : Math.min(aw * 0.94, ah / 1.42)) };
    };
    const A1 = fit(6, hb), A2 = fit(hr, 6), F = A2.Wo > A1.Wo * 1.06 ? A2 : A1;
    const { side, T, ah, L, aw } = F, Wo = Math.max(70, F.Wo), Ho = Math.round(Wo * 0.95);
    const x0 = Math.round(L + aw / 2 - (side ? Wo * 1.62 : Wo) / 2), y0 = Math.round(T + (ah - Wo * (side ? 1.12 : 1.42)) / 2);
    const x1 = x0 + Wo, y1 = y0 + Ho, Dc = Math.max(6, Math.round(Wo * 0.12));
    const yc = side ? y1 + 3 : y1 + Math.round(Wo * 0.27);                         // the counter top's back edge
    const rw = Math.round(Wo * (side ? 0.56 : 0.8)), rx = side ? x1 + Math.round(Wo * 0.04) : Math.round(x0 + Wo / 2 - rw / 2), ry = yc + Math.round(Dc * 0.5);
    const Hp = Math.round(Wo * 0.17), dT = y0 + Hp + 3, dB = y1 - 3;                 // control panel, door
    const wx0 = x0 + Math.round(Wo * 0.11), wx1 = x1 - Math.round(Wo * 0.11), wy0 = dT + Math.round(Wo * 0.14), wy1 = dB - Math.round(Wo * 0.07); // window
    const ww = wx1 - wx0, wh = wy1 - wy0, cv = { x0: x0 + Math.round(Wo * 0.05), x1: x1 - Math.round(Wo * 0.05), y0: dT + 2, y1: dB - 1 }; // (the cavity behind the door)
    const rackY = wy0 + Math.round(wh * 0.8), pr = Math.round(ww * 0.27), ph = Math.round(wh * 0.25), pcx = Math.round((wx0 + wx1) / 2);
    const Rk = Math.max(4, Math.round(Wo * 0.055)), kY = y0 + Math.round(Hp / 2) + 1;
    const dw = Math.round(Wo * 0.3), dh = Math.max(9, Math.round(Hp * 0.5)), disp = { x: Math.round((x0 + x1) / 2 - dw / 2), y: kY - Math.round(dh / 2), w: dw, h: dh };
    return { P, w, h, side, Wo, Ho, x0, y0, x1, y1, yc, Dc, rw, rx, ry, Hp, dT, dB, wx0, wx1, wy0, wy1, ww, wh, cv, rackY, pr, pe: 0.3, ph, pcx,
      pb: rackY - 2, rimY: rackY - 2 - ph, tr: Math.max(2, Math.round(pr * 0.2)), Rk, kY, k1: x0 + Math.round(Wo * 0.16), k2: x1 - Math.round(Wo * 0.16),
      disp, topCoil: wy0 + Math.round(wh * 0.08), botCoil: wy1 - Math.round(wh * 0.06), cw: Math.round(rw / 3.5) };
  }
  // the batter: how high it stands in the pan, how domed and how brown it is, at rise r (0…1)
  const batter = (V, r) => {
    const ys = V.pb - V.ph * (0.42 + 1.25 * r), above = Math.max(0, V.rimY - ys);
    const bulge = Math.min(above, V.ph * 0.24) * 0.9, brown = clamp((r - 0.25) / 0.75, 0, 1);
    return { ys, above, bulge, brown, top: above > 0 ? ys - bulge - V.pr * V.pe : ys - (V.pr - 1) * V.pe };
  };
  function showOven(on) { const G = spongeGeo(); zoomCloseup('sponge', on, G.oven, G.base - 20 * G.k); OV.shown = on; }

  function ovBase(V) { // the kitchen, the oven's body and panel, the counter: drawn once per layout
    const key = `${V.w}x${V.h}:${V.x0},${V.y0},${V.Wo}`;
    if (OV.baseKey === key) return OV.base;
    const c = A.mk(V.w, V.h), x = c.getContext('2d');
    const R = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
    // pastel kitchen tiles
    const tw = Math.max(8, Math.round(V.Wo / 9)), th = Math.round(tw / 2);
    R('#e9f4ef', 0, 0, V.w, V.h);
    for (let y = 0; y < V.h; y += th) {
      const off = (y / th) % 2 ? tw / 2 : 0;
      R('#cfe3dc', 0, y, V.w, 1);
      for (let X = -tw + off; X < V.w; X += tw) { R('#cfe3dc', X, y, 1, th); R('#f6fbf9', X + 1, y + 1, tw - 2, 1); }
    }
    for (let y = 0; y < V.h; y += 2) for (let X = (y / 2) % 2; X < V.w; X += 2) { // soft vignette
      const d = Math.hypot((X - V.w / 2) / V.w, (y - V.h / 2) / V.h);
      if (d > 0.45) { x.fillStyle = `rgba(40,70,60,${Math.min(0.2, (d - 0.45) * 0.8).toFixed(3)})`; x.fillRect(X, y, 2, 2); }
    }
    // the wooden cabinet the oven is built into
    const fm = Math.max(4, Math.round(V.Wo * 0.05));
    R('#6e4322', V.x0 - fm - 1, V.y0 - fm - 1, V.Wo + fm * 2 + 2, V.Ho + fm * 2 + 2);
    R('#c98a55', V.x0 - fm, V.y0 - fm, V.Wo + fm * 2, V.Ho + fm * 2);
    R('#e2a66c', V.x0 - fm, V.y0 - fm, V.Wo + fm * 2, 1); R('#a86c3c', V.x0 - fm, V.y1 + fm - 1, V.Wo + fm * 2, 1);
    for (let y = V.y0 - fm + 3; y < V.y1 + fm - 2; y += 5) { R('#bb7d4a', V.x0 - fm + 1, y, fm - 2, 1); R('#bb7d4a', V.x1 + 1, y + 2, fm - 2, 1); }
    // the oven: white enamel with a blue trim, a control panel along the top
    R('#59607c', V.x0 - 1, V.y0 - 1, V.Wo + 2, V.Ho + 2);
    R('#e9edf5', V.x0, V.y0, V.Wo, V.Ho);
    R('#f4f6fb', V.x0, V.y0, V.Wo, V.Hp); R('#ffffff', V.x0, V.y0, V.Wo, 1);
    R('#7fb2ff', V.x0, V.y0 + V.Hp - 2, V.Wo, 2); R('#5b8fe0', V.x0, V.y0 + V.Hp, V.Wo, 1);
    R('#59607c', V.x0, V.dT - 2, V.Wo, 1); R('#c9d1e3', V.x0 + 3, V.dT - 1, V.Wo - 6, 1); // the vent slot above the door
    for (const kx of [V.k1, V.k2]) { // dials, with little tick marks round them
      const kn = A.CU.knob(V.Rk);
      x.drawImage(kn, kx - Math.floor(kn.width / 2), V.kY - Math.floor(kn.height / 2));
      for (let i = 0; i <= 6; i++) { const a = -2.3 + i * 0.77; R(i === 0 ? '#e8405a' : '#9aa6c0', kx + Math.sin(a) * (V.Rk + 2.5), V.kY - Math.cos(a) * (V.Rk + 2.5)); }
    }
    const D = V.disp;
    R('#59607c', D.x - 1, D.y - 1, D.w + 2, D.h + 2); R('#1f1a2e', D.x, D.y, D.w, D.h); R('#2b2745', D.x, D.y, D.w, 1); // the temperature display
    // the counter, with the cooling rack waiting on it
    R('#b98053', 0, V.yc - 1, V.w, 1); R('#e7b680', 0, V.yc, V.w, V.Dc); R('#f2c995', 0, V.yc, V.w, 1);
    for (let X = 7; X < V.w; X += 23) R('#dcaa73', X, V.yc + 2, 9, 1);
    R('#a86c3c', 0, V.yc + V.Dc, V.w, 2); R('#cf9a62', 0, V.yc + V.Dc + 2, V.w, V.h);
    const pw = Math.max(30, Math.round(V.Wo * 0.42)), py = V.yc + V.Dc + 5; // cupboard doors under the counter
    for (let X = Math.round(V.w / 2 - pw * 3 - 3); X < V.w; X += pw + 3) {
      R('#a86c3c', X, py, pw, V.h - py); R('#d6a36c', X + 1, py + 1, pw - 2, V.h - py); R('#c08a55', X + 4, py + 4, pw - 8, V.h - py); R('#e2b27b', X + 4, py + 4, pw - 8, 1);
      R('#59607c', X + Math.round(pw / 2) - 3, py + 7, 7, 3); R('#e3e8f2', X + Math.round(pw / 2) - 2, py + 8, 5, 1);
    }
    const rk = A.CU.coolRack(V.rw); x.drawImage(rk, V.rx, V.ry - 4);
    const floor = V.yc + Math.round(V.Dc * 0.6), lft = V.side ? V.x1 + V.rw + Math.round(V.Wo * 0.08) : 0; // a few baking things on the counter
    const flour = (X) => { R('#8a7a5a', X - 1, floor - 19, 16, 19); R('#f3ecd8', X, floor - 18, 14, 18); R('#ddd2b4', X, floor - 18, 14, 3); R('#e9e0c6', X + 10, floor - 15, 4, 15);
      R('#7fb2ff', X, floor - 11, 14, 5); R('#ffd84a', X + 3, floor - 10, 1, 3); R('#ffd84a', X + 5, floor - 10, 1, 3); R('#ffd84a', X + 7, floor - 10, 1, 3); R('#ffffff', X + 1, floor - 17, 2, 1); };
    const egg = (X) => { R('#a08a6a', X, floor - 7, 6, 7); R('#a08a6a', X - 1, floor - 5, 8, 4); R('#fff6e8', X, floor - 6, 6, 6); R('#fff6e8', X - 1 + 1, floor - 5, 6, 4); R('#e9d9c0', X + 3, floor - 3, 3, 3); R('#ffffff', X + 1, floor - 5, 1, 2); };
    const milk = (X) => { R('#59607c', X - 1, floor - 17, 10, 17); R('#ffffff', X, floor - 16, 8, 16); R('#e3e8f2', X + 6, floor - 14, 2, 14); R('#3d7bff', X, floor - 17, 8, 3); R('#ffb3cf', X + 1, floor - 10, 6, 4); R('#ffffff', X + 2, floor - 9, 1, 2); };
    if (!V.side) {
      const L = V.rx, Rr = V.rx + V.rw;
      if (L > 26) { flour(Math.round(L / 2 - 8)); }
      if (V.w - Rr > 26) { egg(Rr + Math.round((V.w - Rr) / 2) - 8); egg(Rr + Math.round((V.w - Rr) / 2)); }
    } else if (V.w - lft > 40) { flour(lft); egg(lft + 20); egg(lft + 28); milk(lft + 38); }
    OV.base = c; OV.baseKey = key; OV.door0 = null; OV.bg.clear();
    return c;
  }
  function ovDoor(V) { // the door: enamel, a chrome-framed window (left see-through), the handle
    if (OV.door0 && OV.door0.key === OV.baseKey) return OV.door0.img;
    const dw = V.Wo - 4, dh = V.dB - V.dT, c = A.mk(dw, dh), x = c.getContext('2d');
    const R = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
    const ox = V.x0 + 2, oy = V.dT, wx = V.wx0 - ox, wy = V.wy0 - oy;
    R('#59607c', 0, 0, dw, dh); R('#f4f6fb', 1, 1, dw - 2, dh - 2); R('#ffffff', 1, 1, dw - 2, 1); R('#dfe4ee', 1, dh - 3, dw - 2, 2);
    R('#7fb2ff', 1, dh - 5, dw - 2, 1);
    R('#59607c', wx - 3, wy - 3, V.ww + 6, V.wh + 6); R('#c9d1e3', wx - 2, wy - 2, V.ww + 4, V.wh + 4); R('#ffffff', wx - 2, wy - 2, V.ww + 4, 1); R('#9aa6c0', wx - 2, wy + V.wh + 1, V.ww + 4, 1);
    x.clearRect(wx, wy, V.ww, V.wh);
    const hy = Math.round((V.wy0 - V.dT) * 0.42); // the handle: a chrome bar on two little posts
    for (const px of [Math.round(dw * 0.16), Math.round(dw * 0.84) - 2]) { R('#59607c', px - 1, hy - 1, 4, 5); R('#aeb7cb', px, hy, 2, 4); }
    R('#59607c', Math.round(dw * 0.12) - 1, hy - 3, Math.round(dw * 0.76) + 2, 5); R('#e3e8f2', Math.round(dw * 0.12), hy - 2, Math.round(dw * 0.76), 3);
    R('#ffffff', Math.round(dw * 0.12) + 2, hy - 2, Math.round(dw * 0.5), 1); R('#aeb7cb', Math.round(dw * 0.12), hy, Math.round(dw * 0.76), 1);
    const hx = Math.round(dw / 2), hh = dh - 9; // a tiny heart badge
    R('#e8405a', hx - 2, hh, 2, 1); R('#e8405a', hx + 1, hh, 2, 1); R('#e8405a', hx - 2, hh + 1, 5, 1); R('#e8405a', hx - 1, hh + 2, 3, 1); R('#e8405a', hx, hh + 3, 1, 1);
    OV.door0 = { key: OV.baseKey, img: c };
    return c;
  }
  function ovInside(V, lvl) { // the empty oven cavity at one of 8 heat levels: lamp-lit, glowing orange as it heats (cached)
    if (OV.bg.has(lvl)) return OV.bg.get(lvl);
    const { x0, x1, y0, y1 } = V.cv, cw = x1 - x0, ch = y1 - y0, c = A.mk(cw, ch), x = c.getContext('2d'), heat = lvl / 7;
    const PAL = ['#1f161c', '#2e2128', '#432c2c', '#5e372c', '#82432b', '#aa552b', '#d06d31', '#ee8f45'];
    const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const lx = V.wx0 + V.ww * 0.12 - x0, ly = V.topCoil - 3 - y0;
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const Y = j + y0, edge = Math.min(i, cw - 1 - i) / cw;
      let v = 0.2 + 0.25 * Math.exp(-((i - lx) ** 2 + (j - ly) ** 2) / (V.ww * 0.4) ** 2) - (edge < 0.12 ? (0.12 - edge) * 1.2 : 0)
        + heat * (0.42 * Math.exp(-(((Y - V.topCoil) / (V.wh * 0.28)) ** 2)) + 0.55 * Math.exp(-(((Y - V.botCoil) / (V.wh * 0.25)) ** 2)) + 0.12);
      v += (BAY[(j % 4) * 4 + (i % 4)] / 16 - 0.5) * 0.12;
      x.fillStyle = PAL[clamp(Math.floor(v * 7), 0, 7)]; x.fillRect(i, j, 1, 1);
    }
    // the box: back wall edges and the corners running back to it, shelf runners on the side walls
    x.fillStyle = 'rgba(0,0,0,.18)';
    const bi = Math.round(cw * 0.12), bj = Math.round(ch * 0.1);
    x.fillRect(bi, bj, cw - bi * 2, 1); x.fillRect(bi, ch - bj, cw - bi * 2, 1); x.fillRect(bi, bj, 1, ch - bj * 2); x.fillRect(cw - bi - 1, bj, 1, ch - bj * 2);
    for (let k = 0; k <= bi; k++) { const f = k / bi; x.fillRect(Math.round(f * bi), Math.round(f * bj), 1, 1); x.fillRect(cw - 1 - Math.round(f * bi), Math.round(f * bj), 1, 1); x.fillRect(Math.round(f * bi), ch - 1 - Math.round(f * bj), 1, 1); x.fillRect(cw - 1 - Math.round(f * bi), ch - 1 - Math.round(f * bj), 1, 1); }
    for (const f of [0.3, 0.55, 0.8]) { const Y = Math.round(V.wy0 - y0 + V.wh * f); for (const X of [1, cw - 7]) { x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(X, Y, 6, 1); x.fillStyle = 'rgba(255,220,180,.18)'; x.fillRect(X, Y - 1, 6, 1); } }
    OV.bg.set(lvl, c);
    return c;
  }
  function renderOven() {
    if (cuOwner !== 'sponge' || (!OV.shown && !cuCv.classList.contains('on'))) return;
    const V = ovLayout(), x = cuG, t = SP.t, heat = OV.heat;
    x.imageSmoothingEnabled = false;
    x.drawImage(ovBase(V), 0, 0);
    const R = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
    const hsh = (a, b) => (((a * 73856093) ^ (b * 19349663)) >>> 0) % 101;
    // ---- inside the oven
    x.drawImage(ovInside(V, clamp(Math.round(heat * 7), 0, 7)), V.cv.x0, V.cv.y0);
    const lampX = Math.round(V.wx0 + V.ww * 0.12), lampY = V.topCoil - 3;
    R('rgba(255,236,170,.25)', lampX - 3, lampY - 2, 8, 5); R('#fff3c4', lampX - 1, lampY - 1, 4, 2); R('#ffffff', lampX, lampY - 1, 1, 1); // the oven light
    const coilCol = heat > 0.8 ? ['#ff9a4a', '#ffd27a'] : heat > 0.5 ? ['#e0592c', '#ff9a4a'] : heat > 0.2 ? ['#8a3b2a', '#c2552e'] : ['#4b434d', '#6b6370'];
    for (const cy of [V.topCoil, V.botCoil]) { // heating elements, glowing up as it heats
      if (heat > 0.15) R(`rgba(255,140,60,${(heat * 0.22).toFixed(2)})`, V.wx0 + V.ww * 0.06, cy - 2, V.ww * 0.88, 5);
      for (let X = Math.round(V.wx0 + V.ww * 0.08); X < V.wx0 + V.ww * 0.92; X++) {
        const yy = cy + Math.round(Math.sin(X * 0.55) * 1.2);
        R(coilCol[0], X, yy, 1, 2); if ((X + Math.floor(t * 6)) % 5 === 0 && heat > 0.5) R(coilCol[1], X, yy, 1, 1);
      }
    }
    if (heat > 0.2) for (let k = 0; k < 6; k++) { // heat shimmer
      const sx = V.wx0 + V.ww * (0.14 + k * 0.145);
      for (let j = 0; j < V.wh * 0.22; j += 2) R(`rgba(255,220,180,${(0.1 * heat).toFixed(3)})`, sx + Math.sin(j * 0.45 + t * 9 + k * 2) * 1.5, V.botCoil - 4 - j);
    }
    // the rack (back bar, slats, front bar)
    const rb = V.rackY - Math.round(V.wh * 0.09);
    R('#6b6f80', V.cv.x0 + 2, rb, V.cv.x1 - V.cv.x0 - 4, 1);
    for (let X = V.cv.x0 + 4; X < V.cv.x1 - 3; X += 5) R('#7d8295', X, rb + 1, 1, V.rackY - rb);
    R('#aeb7cb', V.cv.x0 + 1, V.rackY, V.cv.x1 - V.cv.x0 - 2, 2); R('#e3e8f2', V.cv.x0 + 1, V.rackY, V.cv.x1 - V.cv.x0 - 2, 1);
    // ---- the tube pan and the chiffon in it
    const sub = SP.sub, empty = sub === 'pop' && SP.flyT >= 0.15 && SP.flyT < 0.82;
    const r = sub === 'pop' && SP.flyT >= 0.82 ? 0 : SP.r, B = batter(V, r), { pcx, pr, pe, rimY, pb, tr } = V;
    const ell = (cx, cy, rx, ry, col) => { x.fillStyle = col; for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const k = 1 - (j / ry) ** 2; if (k < 0) continue; const hw = Math.round(rx * Math.sqrt(k)); x.fillRect(Math.round(cx) - hw, Math.round(cy) + j, hw * 2 + 1, 1); } };
    const crust = (b, lit) => (lit > 0.75 ? ['#fbe7b0', '#f4cf86', '#e9b065', '#d8964a'] : lit > 0.45 ? ['#f6dc9e', '#ebbd6e', '#dc9d52', '#c4843e'] : ['#ead08c', '#dcaa5c', '#c98a43', '#ab6f33'])[clamp(Math.floor(b * 3.99), 0, 3)];
    if (B.above <= 0 || empty) { // inside the pan: the back wall, the batter's surface, the tube up the middle
      ell(pcx, rimY, pr, pr * pe, '#7d8599'); ell(pcx, rimY - 1, pr - 1, (pr - 1) * pe, '#8f97aa');
      if (!empty) {
        ell(pcx, B.ys, pr - 1, (pr - 1) * pe, '#e9c57e');
        ell(pcx, B.ys, pr - 2, (pr - 2) * pe - 0.5, crust(B.brown, 0.8));
        for (let i = 0; i < 9; i++) { // little bubbles rising and popping in the batter
          const a = hsh(i, 3) / 101 * 6.28, rr = 0.35 + (hsh(i, 7) / 101) * 0.55, on = Math.floor(t * 3 + i * 0.7) % 3 !== 0 && (sub === 'rise' || i < 4);
          if (on) R('#fff6dc', pcx + Math.cos(a) * rr * (pr - 3), B.ys + Math.sin(a) * rr * (pr - 3) * pe);
        }
      }
      const tubeTop = rimY - 2, tb = empty ? pb - 2 : B.ys;
      R('#59607c', pcx - tr - 1, tubeTop, tr * 2 + 3, tb - tubeTop + 1); R('#aeb7cb', pcx - tr, tubeTop, tr * 2 + 1, tb - tubeTop); R('#e3e8f2', pcx - tr, tubeTop, 1, tb - tubeTop);
      ell(pcx, tubeTop, tr, Math.max(1, tr * pe), '#c9d1e3'); ell(pcx, tubeTop, Math.max(1, tr - 1), Math.max(0.6, (tr - 1) * pe), '#2a1d24');
    } else { // risen over the rim: golden sides, a domed top that cracks, the hole of the tube in the middle
      const Rc = pr - 1, cy = B.ys - B.bulge * 0.4, ry = Rc * pe + B.bulge * 0.6;
      for (let X = -Rc; X <= Rc; X++) {
        const dx = X / Rc, lit = 0.62 - 0.45 * dx - 0.25 * dx * dx;
        x.fillStyle = crust(Math.min(1, B.brown + 0.25), lit); x.fillRect(pcx + X, Math.round(B.ys), 1, Math.ceil(rimY + pr * pe - B.ys) + 1);
        if (hsh(X + 50, 1) % 6 === 0) { x.fillStyle = crust(Math.max(0, B.brown - 0.25), lit + 0.2); x.fillRect(pcx + X, Math.round(B.ys) + 1, 1, Math.ceil(rimY - B.ys)); }
      }
      for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) for (let X = -Rc; X <= Rc; X++) {
        const dx = X / Rc, dy = j / ry, rho = dx * dx + dy * dy;
        if (rho > 1) continue;
        let col = crust(B.brown, 0.85 - 0.3 * dx - 0.3 * dy);
        const rr = Math.sqrt(rho);
        if (B.brown > 0.35 && Math.abs(rr - 0.62) < 0.05 + 0.03 * B.brown && hsh(X + 31, j + 17) % 4) col = '#a86a32';           // the crack ring
        else if (B.brown > 0.35 && Math.abs(rr - 0.62) < 0.1 && dy < 0 && hsh(X, j) % 3 === 0) col = '#fde9b8';
        else if (hsh(X + 9, j + 40) % 13 === 0) col = crust(Math.min(1, B.brown + 0.3), 0.3);
        x.fillStyle = col; x.fillRect(pcx + X, Math.round(cy + j), 1, 1);
      }
      ell(pcx, cy, tr + 1, (tr + 1) * pe + 0.5, crust(B.brown, 0.4)); ell(pcx, cy, tr, Math.max(1, tr * pe), '#c9d1e3'); ell(pcx, cy, Math.max(1, tr - 1), Math.max(0.6, (tr - 1) * pe), '#2a1d24');
    }
    // the pan's front wall and rim (brushed aluminium)
    const MET = ['#4a5068', '#6b7389', '#8a92a5', '#aeb7cb', '#d5dbe7', '#f4f6fb'];
    for (let X = -pr; X <= pr; X++) {
      const dx = X / pr, arc = pe * pr * Math.sqrt(Math.max(0, 1 - dx * dx)), lit = 0.6 - 0.55 * dx - 0.35 * dx * dx;
      const top = Math.round(rimY + arc), bot = Math.round(pb + arc);
      x.fillStyle = Math.abs(X) === pr ? MET[0] : MET[clamp(Math.floor(lit * 5.5), 1, 5)]; x.fillRect(pcx + X, top, 1, bot - top + 1);
      x.fillStyle = MET[0]; x.fillRect(pcx + X, bot + 1, 1, 1);
      if (Math.abs(X) < pr) { x.fillStyle = '#ffffff'; x.fillRect(pcx + X, top, 1, 1); }
    }
    for (let j = 3; j < V.ph; j += 4) for (let X = -pr + 2; X < pr - 1; X += 1) if (hsh(X, j) % 3 === 0) { // brushed lines
      const dx = X / pr; R('rgba(255,255,255,.12)', pcx + X, rimY + pe * pr * Math.sqrt(1 - dx * dx) + j);
    }
    if (B.above <= 0 || empty) for (let a = Math.PI; a < 2 * Math.PI; a += 0.04) R('#d5dbe7', pcx + Math.cos(a) * pr, rimY + Math.sin(a) * pr * pe); // the back of the rim
    // held too long: batter spilling over the rim and down the pan
    if (OV.spill > 0.01) {
      const S2 = OV.spill;
      for (let X = -pr; X <= pr; X++) if (hsh(X + 70, 5) % 3) R('#f2cf86', pcx + X, rimY + pe * pr * Math.sqrt(Math.max(0, 1 - (X / pr) ** 2)) - 1, 1, 2);
      [-0.72, -0.38, 0.06, 0.41, 0.78].forEach((f, i) => {
        const X = pcx + f * pr, top = rimY + pe * pr * Math.sqrt(1 - f * f), len = S2 * V.ph * (0.35 + (hsh(i, 2) / 101) * 0.6);
        R('#f2cf86', X - 1, top, 3, len); R('#fde9b8', X - 1, top, 1, len); R('#d8a356', X + 1, top + 1, 1, len - 1); R('#f2cf86', X - 1, top + len, 2, 1);
      });
    }
    // ---- the door (with the oven glass), or the door swinging open
    const dimg = ovDoor(V);
    if (OV.door <= 0.001) {
      x.fillStyle = 'rgba(30,15,25,.16)'; x.fillRect(V.wx0, V.wy0, V.ww, V.wh);
      R('rgba(0,0,0,.25)', V.wx0, V.wy0, V.ww, 1); R('rgba(0,0,0,.18)', V.wx0, V.wy0, 1, V.wh);
      for (const [o, wdt, al] of [[0.18, 3, 0.1], [0.3, 1, 0.14], [0.72, 2, 0.08]]) for (let j = 0; j < V.wh; j++) { // reflections on the glass
        const X = V.wx0 + V.ww * o + j * 0.45 - V.wh * 0.2; if (X >= V.wx0 && X + wdt <= V.wx1) R(`rgba(255,255,255,${al})`, X, V.wy0 + j, wdt, 1);
      }
      if (['ready', 'rise', 'sink', 'poof'].includes(sub)) { // the gold line: let go when the top of the cake reaches it
        const yT = Math.round(batter(V, SP_TARGET).top), ya = Math.round(batter(V, SP_TARGET + SP.tol).top), yb = Math.round(batter(V, SP_TARGET - SP.tol).top);
        R('rgba(255,216,74,.14)', V.wx0 + 1, ya, V.ww - 2, Math.max(1, yb - ya + 1));
        for (let X = V.wx0 + 2; X < V.wx1 - 1; X += 3) R(Math.floor(t * 4) % 2 && sub === 'rise' && Math.abs(B.top - yT) < 3 ? '#ffffff' : '#ffd84a', X, yT, 2, 1);
        R('#59607c', V.wx0 - 6, yT - 2, 5, 5); R('#ffd84a', V.wx0 - 5, yT - 1, 3, 3); R('#fff4b8', V.wx0 - 5, yT - 1, 1, 1); // a gold marker on the frame
      }
      x.drawImage(dimg, V.x0 + 2, V.dT);
    } else {
      const hD = Math.max(1, Math.round((V.dB - V.dT) * Math.cos(OV.door * 1.35)));
      R('rgba(43,39,69,.3)', V.x0 + 2, V.dB - 1, V.Wo - 4, 2);
      x.drawImage(dimg, V.x0 + 2, V.dB - hD, V.Wo - 4, hD);
      const k = hD / (V.dB - V.dT); R('rgba(40,26,34,.9)', V.wx0, V.dB - hD + (V.wy0 - V.dT) * k, V.ww, V.wh * k);
    }
    // ---- the control panel: dials turn, the display warms up, the light comes on
    const dp = V.disp, temp = Math.round(25 + heat * 145), s = Math.max(1, Math.floor((dp.h - 2) / 5));
    const str = String(temp), tx = dp.x + Math.round((dp.w - A.textWidth(str, s) - 3 * s) / 2), ty = dp.y + Math.round((dp.h - 5 * s) / 2);
    A.pixText(x, str, tx, ty, heat > 0.05 ? '#ff9a4a' : '#5b6380', s);
    R(heat > 0.05 ? '#ff9a4a' : '#5b6380', tx + A.textWidth(str, s) + s, ty, s + 1, s + 1); // °
    for (const [kx, a] of [[V.k1, -2.3 + OV.knob * 2.2], [V.k2, -2.3 + OV.timer]]) for (let d = 1; d < V.Rk - 0.5; d += 0.5) R('#59607c', kx + Math.sin(a) * d, V.kY - Math.cos(a) * d);
    const lx = Math.round(V.x0 + V.Wo * 0.3), lyy = V.kY;
    R('#59607c', lx - 2, lyy - 2, 5, 5); R(heat > 0.05 ? '#ff8a3c' : '#6b2b2b', lx - 1, lyy - 1, 3, 3); if (heat > 0.05) { R('#ffe0a0', lx - 1, lyy - 1, 1, 1); R('rgba(255,140,60,.3)', lx - 3, lyy - 3, 7, 7); }
    // ---- the cooling rack: finished chiffons, and dotted places for the ones still to bake
    const slot = (i) => ({ x: V.rx + V.rw * (i + 0.5) / SPONGES, y: V.ry });
    const ch = A.CU.chiffon(V.cw);
    for (let i = 0; i < SPONGES; i++) {
      const p = slot(i);
      if (i < SP.n) { R('rgba(90,50,20,.22)', p.x - ch.width / 2 + 2, p.y - 1, ch.width - 2, 2); x.drawImage(ch, Math.round(p.x - ch.width / 2), Math.round(p.y - ch.height + 2)); }
      else if (!(sub === 'pop' && i === SP.n && SP.flyT >= 0.7)) for (let a = 0; a < 6.28; a += 0.5) R('rgba(110,67,34,.35)', p.x + Math.cos(a) * V.cw * 0.45, p.y - 3 + Math.sin(a) * V.cw * 0.13);
    }
    if (sub === 'pop' && SP.flyT >= 0.15) { // one hopping out of the oven, onto the rack
      const u = clamp((SP.flyT - 0.15) / 0.55, 0, 1), e = easeIO(u), p = slot(SP.n), done = batter(V, OV.lift || SP_TARGET);
      const sx0 = pcx, sy0 = done.ys + ch.height * 0.3, k0 = (pr * 2) / V.cw, k = k0 + (1 - k0) * e;
      const X = sx0 + (p.x - sx0) * e, Y = sy0 + (p.y - ch.height / 2 - sy0) * e - Math.sin(u * Math.PI) * V.Wo * 0.25;
      const sq = u >= 1 ? 1 + 0.18 * Math.sin(clamp((SP.flyT - 0.7) / 0.2, 0, 1) * Math.PI) : 1, w = Math.round(ch.width * k * sq), h2 = Math.round(ch.height * k / sq);
      x.drawImage(ch, Math.round(X - w / 2), Math.round(Y + ch.height * k / 2 - h2 + (u >= 1 ? 2 : 0)), w, h2);
    }
    // ---- steam, smoke, sparkles
    for (const f of OV.fx) { if (f.life < 0.12 && Math.floor(f.life * 50) % 2) continue; x.fillStyle = f.col; x.fillRect(Math.round(f.x), Math.round(f.y), f.size || 1, f.size || 1); }
  }
  function ovUpdate(dt) {
    const V = ovLayout(), on = SP.sub === 'rise';
    OV.heat = clamp(OV.heat + (on ? dt * 3.5 : -dt * 1.2), 0, 1);
    OV.knob += ((on ? 1 : 0) - OV.knob) * Math.min(1, dt * 8);
    if (on) OV.timer += dt * 1.6;
    OV.spill = SP.sub === 'poof' ? Math.min(1, OV.spill + dt * 3) : Math.max(0, OV.spill - dt * 0.8);
    const dOpen = SP.sub === 'pop' ? (SP.flyT < 0.75 ? Math.min(1, SP.flyT / 0.15) : Math.max(0, 1 - (SP.flyT - 0.78) / 0.18)) : 0;
    OV.door += (dOpen - OV.door) * Math.min(1, dt * 18);
    if (on && (OV.steamT -= dt) <= 0) { // a wisp of steam from the vent
      OV.steamT = 0.09;
      OV.fx.push({ x: rand(V.x0 + V.Wo * 0.2, V.x1 - V.Wo * 0.2), y: V.dT - 2, vx: rand(-4, 4), vy: rand(-18, -10), g: -4, life: rand(0.6, 1), col: pick(['rgba(255,255,255,.7)', 'rgba(255,255,255,.45)']), size: pick([1, 2]) });
    }
    if (SP.sub === 'poof' && Math.random() < dt * 20) OV.fx.push({ x: rand(V.pcx - V.pr, V.pcx + V.pr), y: V.rimY - 2, vx: rand(-10, 10), vy: rand(-26, -12), g: -6, life: rand(0.5, 0.9), col: pick(['rgba(90,80,90,.6)', 'rgba(130,120,130,.5)']), size: 2 });
    for (let i = OV.fx.length - 1; i >= 0; i--) { const f = OV.fx[i]; f.vy += f.g * dt; f.x += f.vx * dt; f.y += f.vy * dt; if ((f.life -= dt) <= 0) OV.fx.splice(i, 1); }
  }
  // (where a spot on the close-up is, in room pixels: for the pop-up words)
  const ovToRoom = (V, X, Y) => ({ x: (X * V.P) / S, y: (Y * V.P) / S });

  /* =====================================================================
     STAGE 4: icing on top. A close-up at the kitchen counter, drawn on its own canvas with finer
     pixels than the room: pipe cream swirls around the edge, place the strawberries (drag them out
     of the bowl, or tap a spot), then shake the sifter to dust it all with powdered sugar.
     ===================================================================== */
  const BERRIES = 12, SUGAR_GOAL = 260;
  const cuCv = $('#closeup'), cuG = cuCv.getContext('2d');
  const IC = { sub: 'idle', spots: [], piped: 0, placed: [], hops: [], held: null, specks: [], flakes: [], fx: [], hud: null, t: 0, sq: 0, u: 0,
    squeeze: false, lx: 0, ly: 0, used: 0, puff: 0, acc: 0, hudB: 110, hudR: 340, ghost: false, shown: false, base: null, baseKey: '', seq: 0, nudge: 0 };
  let cuOwner = ''; // whose close-up is on that canvas: the oven's or the icing's
  function cuSize() { // the close-up's own pixel grid (finer than the room's)
    const W = Math.max(1, innerWidth), H = Math.max(1, innerHeight), P = clamp(Math.round(S * 0.6), 2, 4);
    const w = Math.ceil(W / P), h = Math.ceil(H / P);
    if (cuCv.width !== w || cuCv.height !== h) { cuCv.width = w; cuCv.height = h; cuCv.style.width = w * P + 'px'; cuCv.style.height = h * P + 'px'; }
    return { W, H, P, w, h };
  }
  function measureHud() { // where the stage HUD ends, so the close-ups keep clear of it
    const hr = $('#stageBox').getBoundingClientRect(); // (it slides in from 30px to the left)
    IC.hudB = Math.max(80, hr.bottom || 0); IC.hudR = Math.max(120, (hr.right || 0) + 30);
  }
  function zoomCloseup(owner, on, ox, oy) { // zoom the close-up in from (ox, oy) on the room canvas, or back out to it
    cuOwner = owner;
    cuCv.style.transformOrigin = `${ox * S}px ${oy * S}px`;
    cuCv.classList.toggle('on', on);
  }
  function cuLayout() { // where everything on the icing close-up sits
    const { H, P, w, h } = cuSize();
    // the table goes either below the HUD (full width) or beside it (full height), whichever fits a bigger cake;
    // f leaves room above the cake for the piping bag when it's at the top edge
    const Bm = Math.ceil((H * 0.05 + 64) / P), hb = Math.ceil(IC.hudB / P) + 6, hr = Math.ceil(IC.hudR / P) + 6;
    const fit = (L, T, f) => {
      const aw = w - 6 - L, ah = Math.max(40, h - T - Bm), side = aw / ah > 1.2; // wide: the bowl sits beside the cake, otherwise below it
      const Wt = Math.floor(side ? Math.min(aw / 1.62, ah / (1.02 + f)) : Math.min(aw * 0.9, (ah - 10) / (1.36 + f)));
      return { L, T: T + Math.round(Wt * f), aw, ah: ah - Math.round(Wt * f), side, Wt };
    };
    const A1 = fit(6, hb, 0.06), A2 = fit(hr, 4, 0.28), F = A2.Wt > A1.Wt * 1.06 ? A2 : A1;
    const { side, T, ah } = F, Wt = Math.max(60, F.Wt), mid = F.L + F.aw / 2;
    const Ht = Math.round(Wt * 0.62), Hf = Math.round(Wt * 0.3), R = Math.round(Wt * (side ? 0.26 : 0.2));
    let x0, y0, bx, by;
    if (side) { const tot = Wt + 14 + R * 2; x0 = Math.round(mid - tot / 2); y0 = Math.round(T + (ah - Ht - Hf) / 2); bx = x0 + Wt + 14 + R; by = y0 + Math.round((Ht + Hf) * 0.55); }
    else { const tot = Ht + Hf + 12 + R * 2; x0 = Math.round(mid - Wt / 2); y0 = Math.round(T + (ah - tot) / 2); bx = Math.round(mid + Wt * 0.2); by = y0 + Ht + Hf + 12 + R; }
    const r = clamp(Math.round(Wt * 0.052), 4, 12), sr = clamp(Math.round(Wt * 0.048), 4, 11);
    const ins = r + 4, tcx = x0 + Wt / 2, tcy = y0 + Ht / 2; // (the round cake's oval top)
    const ring = { cx: tcx, cy: tcy, rx: Wt / 2 - ins, ry: Ht / 2 - ins * 0.85 };
    const irx = ring.rx - r - sr * 0.6, iry = ring.ry - r * 0.8 - sr * 0.4; // where strawberries can go: inside the ring of swirls
    const inner = { cx: tcx, cy: tcy, rx: irx, ry: iry, x0: tcx - irx * 0.7, x1: tcx + irx * 0.7, y0: tcy - iry * 0.7, y1: tcy + iry * 0.7 };
    const fR = Math.round(sr * 1.6), bagH = clamp(Math.round(Wt * 0.34), 22, 64);
    const props = side // where the sifter and the piping bag rest on the counter when they're not in her hand
      ? { sx: bx - Math.round(R * 0.35), sy: Math.max(T + fR, by - R - fR - 6), bx: bx + Math.round(R * 0.15), by: Math.min(h - Bm + 4, by + R + Math.round(bagH * 0.32) + 4) }
      : { sx: Math.max(fR + 4, x0 + Math.round(Wt * 0.08) + fR), sy: by - Math.round(R * 0.35), bx: Math.max(Math.round(bagH * 0.5) + 2, x0 + Math.round(Wt * 0.22)), by: by + Math.round(R * 0.55) };
    return { P, w, h, x0, y0, Wt, Ht, Hf, x1: x0 + Wt, y1: y0 + Ht, tcx, tcy, bx, by, R, r, sr, ring, inner, fR, bagH, props, lift: coarse ? Math.round(44 / P) : 0 };
  }
  const buzz = (ms) => { try { if (coarse && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* not allowed here */ } };
  const cuPtr = (V) => ({ x: (ptr.x * S) / V.P, y: (ptr.y * S) / V.P });
  const setCuPtr = (V, x, y) => { ptr.x = (x * V.P) / S; ptr.y = (y * V.P) / S; };
  function ringPos(V, u) { // a point on the piping ring (an oval round the edge of the top), u = 0…1 clockwise from the back
    const a = -Math.PI / 2 + 2 * Math.PI * u;
    return { x: V.ring.cx + Math.cos(a) * V.ring.rx, y: V.ring.cy + Math.sin(a) * V.ring.ry };
  }
  const inOval = (o, p, k = 1) => ((p.x - o.cx) / o.rx) ** 2 + ((p.y - o.cy) / o.ry) ** 2 <= k * k;
  const inInner = (V, p) => inOval(V.inner, p);
  const inBowl = (V, p) => Math.hypot(p.x - V.bx, p.y - V.by) <= V.R + 4;
  const nextBerry = () => { const k = IC.seq++; const rnd = ((k * 2654435761) >>> 0) / 4294967296; return { kind: rnd < 0.62 ? 'whole' : 'half', ang: Math.round(((k * 7 + 3) % 16) * 100 * Math.PI / 8) / 100 }; };
  function showCloseup(on) {
    const sp = bakeSpot();
    zoomCloseup('icing', on, sp.cx + CAKE.w / 2, sp.cy + CAKE.h / 2); // zooms in from (and back out to) the cake in the room
    IC.shown = on;
  }

  function icingReset() {
    IC.hudB = 110; IC.hudR = 340;
    const V = cuLayout(), a = V.ring.rx, b = V.ring.ry, per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))), n = clamp(Math.round(per / (V.r * 2 + 4)), 12, 24);
    Object.assign(IC, { sub: 'idle', spots: Array.from({ length: n }, (_, i) => ({ u: i / n, g: 0, done: false, ready: false })), cur: null, kl: false, kr: false, piped: 0, placed: [], hops: [], held: null, specks: [], flakes: [], fx: [], t: 0, sq: 0, u: 0, squeeze: false, used: 0, puff: 0, acc: 0, seq: 0 });
    showCloseup(false);
    if (ZE.mode !== 'walk') { zechReset(); Object.assign(ZE, { mode: 'walk', x: bakeSpot().him, y: groundY(), tx: bakeSpot().him, face: 'happy' }); }
    kid.x = bakeSpot().her; kid.y = groundY() - A.GIRL_H / 2 + 1; kid.vx = kid.vy = 0;
  }
  function icingBegin() {
    IC.hud = stageHud(`STAGE ${stageIdx + 1} · ICING ON TOP`, [
      { key: 'c', tag: 'CREAM', cls: 'her', num: true }, { key: 'b', tag: '🍓', cls: 'berry', num: true }, { key: 's', tag: 'SUGAR', cls: 'sugar' },
    ]);
    setBar(IC.hud.c, 0, `0/${IC.spots.length}`); setBar(IC.hud.b, 0, `0/${BERRIES}`); setBar(IC.hud.s, 0);
    document.body.classList.add('hud-stage', 'closeup');
    measureHud();
    const V = cuLayout(), p0 = ringPos(V, 0); setCuPtr(V, p0.x - V.r * 3, p0.y + V.lift);
    showCloseup(true);
    sfx.whoosh();
    IC.sub = 'intro';
    say([
      'Time to decorate the top!',
      coarse ? 'Put the nozzle on a dot, then press and hold to squeeze out a cream swirl. Let go when it sparkles!'
        : 'Put the nozzle on a dot, then hold the mouse button (or space) to squeeze out a cream swirl. Let go when it sparkles!',
      'One swirl at a time, all the way around the edge.',
    ], () => { IC.sub = 'pipe'; lockT = 0.2; document.body.classList.add('follow'); showCallout(coarse ? 'HOLD ON A DOT TO SQUEEZE!' : 'HOLD ON EACH DOT TO SQUEEZE A SWIRL!'); });
  }
  function icingTap() {
    const V = cuLayout(), p = cuPtr(V);
    if (IC.sub === 'pipe') { IC.squeeze = true; IC.cur = pipeSpot(V, { x: p.x, y: p.y - V.lift }); }
    else if (IC.sub === 'berries') {
      if (IC.used >= BERRIES || IC.held) return;
      if (inBowl(V, p)) { IC.held = nextBerry(); IC.used++; sfx.blip(); }            // pick one up…
      else if (inInner(V, p) || !coarse) { // …or tap the cake and one hops over from the bowl
        const ra = rand(0, 6.283), rr = Math.sqrt(Math.random()) * 0.9, target = inInner(V, p) ? p : { x: V.inner.cx + Math.cos(ra) * rr * V.inner.rx, y: V.inner.cy + Math.sin(ra) * rr * V.inner.ry };
        IC.hops.push({ ...nextBerry(), fx: (target.x - V.x0) / V.Wt, fy: (target.y - V.y0) / V.Ht, t: 0 }); IC.used++; sfx.whoosh();
      }
    } else if (IC.sub === 'sugar') IC.puff += 16;
  }
  function icingRelease() {
    if (IC.sub === 'pipe') { IC.squeeze = false; if (IC.cur) finishSwirl(cuLayout(), IC.cur); }
    if (IC.held) {
      const V = cuLayout(), p = cuPtr(V), q = { x: p.x, y: p.y - V.lift * 0.5 };
      if (inInner(V, q)) placeBerry(V, { ...IC.held, fx: (q.x - V.x0) / V.Wt, fy: (q.y - V.y0) / V.Ht });
      else { IC.used--; sfx.splat(); } // dropped off the cake: back into the bowl it goes
      IC.held = null;
    }
  }
  function pipeSpot(V, tip) { // the empty (or half-piped) dot under the nozzle, if any
    let best = null, bd = V.r + 6;
    for (const s of IC.spots) { if (s.done) continue; const q = ringPos(V, s.u), d = Math.hypot(q.x - tip.x, q.y - tip.y); if (d < bd) { bd = d; best = s; } }
    if (best) IC.u = best.u;
    return best;
  }
  function finishSwirl(V, s) { // she lets go: the nozzle lifts off with a little peak (too small and it waits for a top-up)
    IC.cur = null;
    if (s.g < 0.6) return;
    s.done = true; IC.piped++;
    setBar(IC.hud.c, IC.piped / IC.spots.length, `${IC.piped}/${IC.spots.length}`);
    const q = ringPos(V, s.u), perfect = s.g >= 0.85 && s.g <= 1.15;
    s.perfect = perfect;
    sfx.pip(perfect ? 1 : 0.4); buzz(perfect ? 14 : 8);
    for (let i = 0; i < (perfect ? 8 : 3); i++) IC.fx.push({ x: q.x, y: q.y - V.r * 0.6, vx: rand(-35, 35), vy: rand(-45, -10), g: 50, life: 0.45, col: pick(perfect ? ['#ffffff', '#ffe9a0', '#ffd84a'] : ['#ffffff', '#fff3e0']) });
  }
  function placeBerry(V, b) {
    for (const o of IC.placed) { // don't land exactly on top of another one
      const dx = (b.fx - o.fx) * V.Wt, dy = (b.fy - o.fy) * V.Ht, d = Math.hypot(dx, dy);
      if (d < V.sr * 1.2) { const k = (V.sr * 1.2 - d) / Math.max(1, d); b.fx += (dx || 1) * k / V.Wt * 0.6; b.fy += (dy || 1) * k / V.Ht * 0.6; }
    }
    { // (pulled back inside the ring if it slid out)
      const px = V.x0 + b.fx * V.Wt - V.inner.cx, py = V.y0 + b.fy * V.Ht - V.inner.cy, d = Math.hypot(px / V.inner.rx, py / V.inner.ry);
      if (d > 1) { b.fx = (V.inner.cx + px / d - V.x0) / V.Wt; b.fy = (V.inner.cy + py / d - V.y0) / V.Ht; }
    }
    IC.placed.push({ ...b, t: 0 });
    setBar(IC.hud.b, IC.placed.length / BERRIES, `${IC.placed.length}/${BERRIES}`);
    sfx.catch(); buzz(12);
    const x = V.x0 + b.fx * V.Wt, y = V.y0 + b.fy * V.Ht;
    for (let i = 0; i < 6; i++) IC.fx.push({ x, y, vx: rand(-30, 30), vy: rand(-30, 10), g: 60, life: 0.35, col: pick(['#ffffff', '#fff3e0']) });
    if (IC.placed.length >= BERRIES) {
      IC.sub = 'placed'; hideCallout(); kid.happyT = 1;
      popWord(iw / 2, ih * 0.22, 'SO PRETTY!', false, '#ffd84a'); sfx.gold();
      later(900, () => { if (IC.sub === 'placed') { IC.sub = 'sugar'; document.body.classList.add('follow'); showCallout(coarse ? 'SHAKE TO DUST WITH SUGAR!' : 'SHAKE THE SIFTER OVER THE CAKE!'); } });
    }
  }
  function icingUpdate(dt) {
    IC.t += dt;
    if (ZE.mode === 'walk') ZE.tx = bakeSpot().him;
    if (!IC.shown) return;
    const V = cuLayout(), p = cuPtr(V);
    if (IC.sub === 'pipe') {
      // (keyboard: the arrows hop the nozzle to the next empty dot, space squeezes)
      for (const [k, dir] of [['kl', -1], ['kr', 1]]) {
        const down = dir < 0 ? keys.left : keys.right;
        if (down && !IC[k] && !IC.cur) {
          const n = IC.spots.length, here = Math.round((((IC.u % 1) + 1) % 1) * n) % n, h0 = ringPos(V, IC.spots[here].u);
          const onIt = Math.hypot(h0.x - p.x, h0.y + V.lift - p.y) < 2;
          for (let j = onIt || IC.spots[here].done ? 1 : 0; j <= n; j++) { const s = IC.spots[(((here + dir * j) % n) + n) % n]; if (!s.done) { IC.u = s.u; const q = ringPos(V, s.u); setCuPtr(V, q.x, q.y + V.lift); sfx.blip(); break; } }
        }
        IC[k] = down;
      }
      const tip = { x: p.x, y: p.y - V.lift }, c = IC.cur;
      if (c) {
        const q = ringPos(V, c.u);
        if (Math.hypot(q.x - tip.x, q.y - tip.y) > V.r * 2.4) finishSwirl(V, c); // slid off the dot: the nozzle lifts
        else {
          c.g = Math.min(1.4, c.g + dt / 0.55); // the swirl builds up while she squeezes
          if (!c.ready && c.g >= 0.85) { // just right: it sparkles
            c.ready = true; sfx.blip();
            for (let i = 0; i < 4; i++) IC.fx.push({ x: q.x + rand(-V.r, V.r), y: q.y - V.r * 0.4 + rand(-3, 1), vx: rand(-12, 12), vy: rand(-22, -8), g: 20, life: 0.4, col: pick(['#ffe9a0', '#ffd84a', '#ffffff']) });
          }
          if ((IC.sq -= dt) <= 0) { IC.sq = 0.08; sfx.squish(); }
          if (Math.random() < dt * 24) IC.fx.push({ x: q.x + rand(-2, 2), y: q.y - 1, vx: rand(-10, 10), vy: rand(-8, 4), g: 40, life: 0.2, col: '#ffffff' });
        }
      }
      if (IC.piped >= IC.spots.length) {
        IC.sub = 'piped'; IC.squeeze = false; hideCallout(); document.body.classList.remove('follow');
        sfx.gold(); kid.happyT = 1; ZE.cheerT = 1;
        popWord(iw / 2, ih * 0.22, 'BEAUTIFUL!', false, '#ffffff');
        later(1000, () => { if (IC.sub === 'piped') { IC.sub = 'berries'; showCallout(coarse ? 'DRAG BERRIES TO THE CAKE!' : 'DRAG STRAWBERRIES ONTO THE CAKE!'); } });
      }
    }
    for (let i = IC.hops.length - 1; i >= 0; i--) { // strawberries hopping over from the bowl
      const h = IC.hops[i]; h.t += dt / 0.42;
      if (h.t >= 1) { IC.hops.splice(i, 1); placeBerry(V, h); }
    }
    for (const b of IC.placed) if (b.t < 1) b.t = Math.min(1, b.t + dt / 0.3);
    if (IC.sub === 'berries' && keys.left !== keys.right && Math.random() < dt * 3 && IC.used < BERRIES) icingTap(); // (keyboard: arrows keep them coming)
    if (IC.sub === 'sugar') {
      if (keys.left || keys.right) { const q = cuPtr(V); setCuPtr(V, clamp(q.x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 140 * dt, V.x0, V.x1), V.y0 + V.Ht * 0.5 + V.lift); IC.puff += dt * 40; }
      const sx = p.x, sy = p.y - V.lift;
      const sp = Math.hypot(p.x - IC.lx, p.y - IC.ly) / Math.max(dt, 1e-3);
      IC.acc += (sp > 25 ? Math.min(1, sp / 240) * 110 * dt : 0) + IC.puff; IC.puff = 0;
      if (IC.acc > 0.5 && Math.random() < dt * 25) sfx.sift();
      while (IC.acc >= 1) {
        IC.acc -= 1;
        const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * V.fR, y = sy + Math.sin(a) * rr * 0.8;
        IC.flakes.push({ x: sx + Math.cos(a) * rr, y, vy: rand(18, 34), land: y + rand(6, 14), vx: rand(-4, 4) });
      }
      let inside = 0; for (const s of IC.specks) if (s.on) inside++;
      setBar(IC.hud.s, inside / SUGAR_GOAL);
      if (inside >= SUGAR_GOAL) {
        IC.sub = 'done'; hideCallout(); document.body.classList.remove('follow');
        kid.happyT = 2; ZE.cheerT = 1.5; sfx.gold();
        popWord(iw / 2, ih * 0.22, 'PERFECT CAKE!', true, '#ffd84a');
        for (let i = 0; i < 40; i++) IC.fx.push({ x: rand(V.x0, V.x1), y: rand(V.y0, V.y1 + V.Hf), vx: rand(-20, 20), vy: rand(-50, -10), g: 30, life: rand(0.5, 1.1), col: pick(['#ffffff', '#ffe9a0', '#ffd84a', '#ffc2d6']) });
        later(1600, () => showCloseup(false));
        later(1900, stageClear);
      }
    }
    IC.lx = p.x; IC.ly = p.y;
    for (let i = IC.flakes.length - 1; i >= 0; i--) { // sugar snowing down; it stays where it lands on the cake
      const f = IC.flakes[i]; f.y += f.vy * dt; f.x += f.vx * dt;
      if (f.y >= f.land) {
        IC.flakes.splice(i, 1);
        const on = inOval({ cx: V.tcx, cy: V.tcy, rx: V.Wt / 2, ry: V.Ht / 2 }, f, 0.97);
        if (on || IC.specks.length < 900) IC.specks.push({ fx: (f.x - V.x0) / V.Wt, fy: (f.y - V.y0) / V.Ht, on });
        for (const b of IC.placed) if (Math.hypot(V.x0 + b.fx * V.Wt - f.x, V.y0 + b.fy * V.Ht - f.y) < V.sr * 1.1) b.dust = (b.dust || 0) + 1;
      }
    }
    for (let i = IC.fx.length - 1; i >= 0; i--) { const f = IC.fx[i]; f.vy += f.g * dt; f.x += f.vx * dt; f.y += f.vy * dt; if ((f.life -= dt) <= 0) IC.fx.splice(i, 1); }
  }

  function cuBase(V) { // the counter, the board and the cake: drawn once per layout
    const key = `${V.w}x${V.h}:${V.x0},${V.y0},${V.Wt},${V.bx},${V.by}`;
    if (IC.baseKey === key) return IC.base;
    const c = A.mk(V.w, V.h), x = c.getContext('2d'), rnd = A.seeded(27);
    const R = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
    const hsh = (a, b) => { let n = Math.imul(a, 374761393) + Math.imul(b, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return (n ^ (n >>> 16)) >>> 0; };
    // a warm wooden counter, with a soft vignette
    const ph = Math.max(9, Math.round(V.h / 26)), PL = ['#e7b680', '#dfac75', '#eabf8d', '#e2b07a'];
    for (let y = 0; y < V.h; y++) {
      const row = Math.floor(y / ph), base = PL[row % PL.length], off = (row * 53) % 97;
      for (let X = 0; X < V.w; X++) {
        let col = base;
        const hv = hsh(X >> 3, y);
        if (y % ph === 0) col = '#b98053';
        else if ((X + off) % 113 === 0) col = '#c48a59';
        else if (hv % 23 === 0) col = '#d29c64';
        else if ((hsh(X >> 5, row) % 5 === 0) && (y % ph) === (hsh(row, X >> 5) % (ph - 2)) + 1) col = '#cf9860';
        x.fillStyle = col; x.fillRect(X, y, 1, 1);
      }
    }
    for (let y = 0; y < V.h; y += 2) for (let X = 0; X < V.w; X += 2) {
      const d = Math.hypot((X - V.w / 2) / V.w, (y - V.h / 2) / V.h);
      if (d > 0.42) { x.fillStyle = `rgba(70,35,10,${Math.min(0.28, (d - 0.42) * 0.9).toFixed(3)})`; x.fillRect(X, y, 2, 2); }
    }
    // a round cake on a round board: the board and its shadow first
    const bm = Math.max(4, Math.round(V.Wt * 0.05)), trx = V.Wt / 2, tr_y = V.Ht / 2, bcy = V.tcy + V.Hf, brx = trx + bm, bry = tr_y + bm * 0.6;
    const oval = (cx, cy, rx, ry, col) => { x.fillStyle = col; for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const k = 1 - (j / ry) ** 2; if (k < 0) continue; const hw = Math.round(rx * Math.sqrt(k)); x.fillRect(Math.round(cx) - hw, Math.round(cy) + j, hw * 2 + 1, 1); } };
    oval(V.tcx + 4, bcy + 7, brx + 2, bry + 1, 'rgba(90,45,15,.18)'); oval(V.tcx + 3, bcy + 5, brx, bry, 'rgba(90,45,15,.14)');
    for (let X = -brx; X <= brx; X++) { const dx = X / brx, a2 = bry * Math.sqrt(Math.max(0, 1 - dx * dx)); R(Math.abs(dx) > 0.97 ? '#24356e' : dx > 0.55 ? '#2c62d6' : '#3d7bff', V.tcx + X, bcy + a2, 1, 3); R('#24356e', V.tcx + X, bcy + a2 + 3, 1, 1); }
    oval(V.tcx, bcy, brx + 1, bry + 1, '#24356e'); oval(V.tcx, bcy, brx, bry, '#cfe2ff'); oval(V.tcx - 2, bcy - 1, brx - 4, bry - 3, '#dfeaff');
    oval(V.tcx + 2, bcy + 2, trx + 1, tr_y + 1, 'rgba(43,39,69,.14)');
    // the side of the cake: cream, sponge, strawberries cut in half, sponge, cream, curving round with it, in a clear acetate wrap
    const bands = [['cream', 0.12], ['sponge', 0.25], ['fill', 0.25], ['sponge', 0.24], ['cream', 0.14]], O = '#a8907a';
    const top = (X) => { const dx = (X + 0.5 - V.tcx) / trx; return Math.abs(dx) >= 1 ? null : V.tcy + tr_y * Math.sqrt(1 - dx * dx); };
    for (let X = Math.floor(V.tcx - trx); X < V.tcx + trx; X++) {
      const t0 = top(X); if (t0 === null) continue;
      const dx = (X + 0.5 - V.tcx) / trx, lit = 0.78 - 0.62 * dx * dx - 0.3 * dx, L = lit > 0.6 ? 0 : lit > 0.28 ? 1 : 2;
      let yy = Math.round(t0);
      bands.forEach(([t, f], bi) => {
        const hh = bi === bands.length - 1 ? Math.round(t0) + V.Hf - yy : Math.round(V.Hf * f);
        for (let j = 0; j < hh; j++) {
          let col;
          if (t === 'sponge') col = j === 0 ? ['#fde5a6', '#f6d993', '#e3bf78'][L] : hsh(X, yy + j) % 9 === 0 ? ['#e7b35d', '#dba552', '#c4914a'][L] : ['#f7cf7d', '#efc06a', '#d9a552'][L];
          else col = j === hh - 1 ? ['#efe3d2', '#e6d9c6', '#d9cbb6'][L] : ['#fffaf1', '#f7efe2', '#e8ddcc'][L];
          x.fillStyle = col; x.fillRect(X, yy + j, 1, 1);
        }
        if (t === 'fill') { // strawberry halves pressed into the cream (squeezed thinner round the sides)
          const sw = Math.max(4, Math.round(V.sr * 1.7)), dth = (sw * 1.45) / trx, th = Math.asin(clamp(dx, -1, 1)), thc = Math.round(th / dth) * dth; // (spaced evenly round the cake, so they bunch up and turn edge-on at the sides)
          const cxh = V.tcx + Math.sin(thc) * trx, half = Math.max(0.6, (sw / 2) * Math.cos(thc)), k0 = X + 0.5 - cxh;
          if (Math.abs(thc) < 1.5 && Math.abs(k0) <= half) for (let j = 0; j < hh - 1; j++) {
            const ex = k0 / Math.max(1, half), ey = (j - (hh - 1)) / (hh - 1), e2 = ex * ex + ey * ey;
            if (e2 > 1) continue;
            x.fillStyle = e2 > 0.72 ? '#d63a52' : Math.abs(ex) < 0.18 ? '#fff1f3' : e2 > 0.4 ? '#ff8fa3' : '#ffc4cf'; x.fillRect(X, yy + j, 1, 1);
          }
        }
        yy += hh;
      });
      if ([-0.62, -0.57, 0.5].some((g2) => Math.abs(dx - g2) < 0.5 / trx)) R('rgba(255,255,255,.45)', X, Math.round(t0) + 1, 1, V.Hf - 2); // acetate glints
      R(O, X, Math.round(t0) + V.Hf, 1, 1);
    }
    // the smooth cream top, with a few palette-knife swirls
    const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; // (ordered dither, so the shading has no hard steps)
    for (let j = -Math.ceil(tr_y); j <= Math.ceil(tr_y); j++) {
      const k = 1 - (j / tr_y) ** 2; if (k < 0) continue;
      const hw = trx * Math.sqrt(k);
      for (let X = Math.round(V.tcx - hw); X <= Math.round(V.tcx + hw); X++) {
        const t = (j / tr_y + 1) / 2 + (BAY[((j + 64) % 4) * 4 + (X % 4)] / 16 - 0.5) * 0.1;
        x.fillStyle = t < 0.15 ? '#fffcf6' : t < 0.6 ? '#fff8ee' : t < 0.9 ? '#fbf2e4' : '#f6ebd9'; x.fillRect(X, Math.round(V.tcy + j), 1, 1);
      }
    }
    for (let k = 0; k < 7; k++) {
      const cx = V.tcx + trx * (rnd() - 0.5) * 1.1, cy = V.tcy + tr_y * (rnd() - 0.5) * 1.1, rad = V.Wt * (0.12 + rnd() * 0.22), a0 = rnd() * 6.28, span = 1.2 + rnd() * 1.4;
      for (let a = a0; a < a0 + span; a += 0.6 / rad) {
        const px = Math.round(cx + Math.cos(a) * rad), py = Math.round(cy + Math.sin(a) * rad * 0.62);
        if (!inOval({ cx: V.tcx, cy: V.tcy, rx: trx, ry: tr_y }, { x: px, y: py }, 0.92)) continue;
        R('#f1e3cd', px, py); R('#ffffff', px, py - 1);
      }
    }
    // a soft outline round it all, and a highlight along the front edge of the top
    for (let a = 0; a < Math.PI * 2; a += 0.6 / trx) {
      const X = V.tcx + Math.cos(a) * (trx + 0.6), Y = V.tcy + Math.sin(a) * (tr_y + 0.6);
      if (Math.sin(a) < 0) R(O, X, Y); else R('#ffffff', V.tcx + Math.cos(a) * (trx - 1), V.tcy + Math.sin(a) * (tr_y - 1));
    }
    R(O, V.tcx - trx - 1, V.tcy, 1, V.Hf + 1); R(O, V.tcx + trx, V.tcy, 1, V.Hf + 1);
    IC.base = c; IC.baseKey = key;
    return c;
  }
  function renderCloseup() {
    if (cuOwner !== 'icing' || (!IC.shown && !cuCv.classList.contains('on'))) return;
    const V = cuLayout(), x = cuG, p = cuPtr(V), CU = A.CU;
    x.imageSmoothingEnabled = false;
    x.drawImage(cuBase(V), 0, 0);
    const R = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
    const shade = (X, Y, rx, ry, col) => { const sh = CU.shadow(rx, ry, col); x.drawImage(sh, Math.round(X - sh.width / 2), Math.round(Y - sh.height / 2)); };
    const tip = { x: p.x, y: p.y - V.lift };
    // the piping ring: faint guides where a swirl still needs to go, then the swirls
    const spots = IC.spots.map((s) => ({ s, q: ringPos(V, s.u) })).sort((a, b) => a.q.y - b.q.y);
    for (const { s, q } of spots) {
      const X = Math.round(q.x), Y = Math.round(q.y);
      if (s.g <= 0) {
        const near = IC.sub === 'pipe' && !IC.cur && Math.hypot(q.x - tip.x, q.y - tip.y) < V.r + 6, rx = V.r * 0.8, ry = V.r * 0.66;
        x.fillStyle = near ? '#ffcf4a' : Math.floor(IC.t * 2 + s.u * 8) % 2 ? '#e3cfb3' : '#eddcc5';
        for (let a = 0; a < 6.28; a += 0.62) x.fillRect(Math.round(X + Math.cos(a) * rx), Math.round(Y + Math.sin(a) * ry), 1, 1);
        continue;
      }
      const big = s.g > 1.15 ? 1 : s.g < 0.85 && s.done ? -1 : 0; // (overfilled ones are a bit bigger, early ones a bit smaller)
      const img = CU.rosette(V.r + big, s.done ? 5 : s.g >= 0.85 ? 4 : clamp(Math.ceil((s.g / 0.85) * 4), 1, 4));
      shade(X + 1, Y + img.height * 0.32, img.width * 0.42, 2, '150,110,60');
      x.drawImage(img, X - Math.floor(img.width / 2), Y - Math.floor(img.height / 2));
      if (!s.done && s.g < 0.6 && IC.cur !== s) { x.fillStyle = Math.floor(IC.t * 3) % 2 ? '#ffcf4a' : '#eddcc5'; x.fillRect(X, Y - Math.floor(img.height / 2) - 2, 1, 1); } // (needs a top-up)
      if ((s.ready && !s.done && s.g <= 1.15) || (s.perfect && Math.floor(IC.t * 2 + s.u * 13) % 7 === 0)) { // a twinkle on the just-right ones
        const gx = X + Math.round(V.r * 0.45), gy = Y - Math.round(V.r * 0.5);
        x.fillStyle = '#ffffff'; x.fillRect(gx, gy - 1, 1, 3); x.fillRect(gx - 1, gy, 3, 1); x.fillStyle = '#ffe9a0'; x.fillRect(gx, gy, 1, 1);
      }
    }
    // strawberries on the cake (with a little squash as they land), frosting over as the sugar falls on them
    for (const b of IC.placed.slice().sort((a, c) => a.fy - c.fy)) {
      const img = CU.berry(V.sr, b.kind, b.ang), X = V.x0 + b.fx * V.Wt, Y = V.y0 + b.fy * V.Ht;
      const k = 1 + 0.22 * Math.sin(Math.min(1, b.t) * Math.PI) * (1 - b.t), w = Math.round(img.width * k), h = Math.round(img.height * (2 - k));
      shade(X + 2, Y + V.sr * 0.55, V.sr * 0.95, Math.max(2, V.sr * 0.3), '130,50,50');
      const ix = Math.round(X - w / 2), iy = Math.round(Y - h / 2);
      x.drawImage(img, ix, iy, w, h);
      if (b.dust) { x.globalAlpha = Math.min(0.5, b.dust / 50); x.drawImage(CU.frost(V.sr, b.kind, b.ang), ix, iy, w, h); x.globalAlpha = 1; }
    }
    // powdered sugar where it landed: tiny grains, white on the berries, a soft sparkle on the cream
    for (const s of IC.specks) {
      const X = Math.round(V.x0 + s.fx * V.Wt), Y = Math.round(V.y0 + s.fy * V.Ht);
      if (s.on) { R('rgba(190,160,120,.28)', X, Y + 1); R('#ffffff', X, Y); } else R('rgba(255,255,255,.6)', X, Y);
    }
    // the tools waiting on the counter
    const P2 = V.props;
    if (!['pipe', 'intro', 'idle'].includes(IC.sub)) {
      const bag = CU.bagDown(V.bagH);
      shade(P2.bx + 2, P2.by + bag.height * 0.3, bag.width * 0.45, Math.max(2, bag.height * 0.25));
      x.drawImage(bag, Math.round(P2.bx - bag.width / 2), Math.round(P2.by - bag.height / 2));
    }
    if (!['sugar', 'done'].includes(IC.sub)) {
      const sf = CU.sifter(V.fR);
      shade(P2.sx + 3, P2.sy + 3, V.fR + 2, V.fR * 0.8);
      x.drawImage(sf, Math.round(P2.sx - sf.height / 2), Math.round(P2.sy - sf.height / 2));
    }
    // the bowl of strawberries she caught
    const bowl = CU.bowl(V.R);
    shade(V.bx + 4, V.by + 5, V.R + 3, V.R * 0.92);
    x.drawImage(bowl, V.bx - Math.floor(bowl.width / 2), V.by - Math.floor(bowl.height / 2));
    const left = BERRIES - IC.used, slots = [[0, 0], ...[0, 1, 2, 3, 4].map((i) => [0.32, i * 1.257 + 0.3]), ...[0, 1, 2, 3, 4, 5].map((i) => [0.62, i * 1.047])];
    for (let i = Math.min(left, slots.length) - 1; i >= 0; i--) {
      const [rr, a] = slots[i], img = CU.berry(Math.max(3, V.sr - 1), 'whole', Math.round(((i * 5) % 16) * 100 * Math.PI / 8) / 100);
      x.drawImage(img, Math.round(V.bx + Math.cos(a) * rr * V.R - img.width / 2), Math.round(V.by + Math.sin(a) * rr * V.R - img.height / 2));
    }
    if (IC.sub === 'berries' && !IC.held && IC.placed.length + IC.hops.length === 0) { // a bouncing arrow: start here!
      const ax = V.bx, ay = V.by - V.R - 4 - Math.round(Math.abs(Math.sin(IC.t * 5)) * 4), n = Math.max(4, Math.round(V.R * 0.16));
      for (let j = 0; j < n; j++) { R('#13204a', ax - (n - j) - 1, ay - n + j - 1, (n - j) * 2 + 3, 1); }
      for (let j = 0; j < n; j++) { R(j < 2 ? '#ffe9a0' : '#ffd84a', ax - (n - j), ay - n + j, (n - j) * 2 + 1, 1); }
      R('#13204a', ax, ay, 1, 1);
    }
    // strawberries in mid-hop
    for (const h of IC.hops) {
      const img = CU.berry(V.sr, h.kind, h.ang), tx = V.x0 + h.fx * V.Wt, ty = V.y0 + h.fy * V.Ht, e = h.t;
      const X = V.bx + (tx - V.bx) * e, Y = V.by + (ty - V.by) * e - Math.sin(e * Math.PI) * V.Wt * 0.28;
      shade(V.bx + (tx - V.bx) * e, V.by + (ty - V.by) * e + 2, V.sr * 0.7, 2);
      x.drawImage(img, Math.round(X - img.width / 2), Math.round(Y - img.height / 2));
    }
    // sugar in the air, and little sparkles / cream drips
    for (const f of IC.flakes) { R('rgba(120,100,80,.3)', f.x + 1, f.y + 1); R('#ffffff', f.x, f.y); }
    for (const f of IC.fx) { if (f.life < 0.12 && Math.floor(f.life * 50) % 2) continue; x.fillStyle = f.col; x.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); }
    // whatever's in her hand (the HUD fades while it's behind it)
    const ghost = IC.shown && (tip.y - (IC.sub === 'pipe' ? V.bagH : V.fR * 2)) * V.P < IC.hudB && (tip.x - V.bagH * 0.4) * V.P < IC.hudR;
    if (ghost !== IC.ghost) { IC.ghost = ghost; $('#stageBox').classList.toggle('ghost', ghost); }
    if (IC.sub === 'pipe' || IC.sub === 'intro') {
      const squeezing = IC.sub === 'pipe' && IC.squeeze, bag = CU.pipingBag(V.bagH, squeezing);
      let bx = tip.x, by = tip.y;
      if (IC.cur) { const q = ringPos(V, IC.cur.u); bx = q.x; by = q.y - V.r * (0.35 + 0.45 * Math.min(1, IC.cur.g)); } // on the dot, rising as the swirl builds
      x.drawImage(bag, Math.round(bx - bag.width / 2 + 2), Math.round(by - bag.height + 1));
    } else if (IC.held) {
      const img = CU.berry(V.sr, IC.held.kind, IC.held.ang), Y = p.y - V.lift * 0.5;
      shade(p.x + 4, Y + V.sr * 0.9, V.sr * 0.8, Math.max(2, V.sr * 0.28));
      x.drawImage(img, Math.round(p.x - img.width * 0.55), Math.round(Y - img.height * 0.65), Math.round(img.width * 1.1), Math.round(img.height * 1.1));
    } else if (IC.sub === 'sugar') {
      const sf = CU.sifter(V.fR), wob = Math.round(Math.sin(IC.t * 30) * (IC.acc > 0.2 ? 1 : 0));
      shade(tip.x + 6, tip.y + V.fR + 4, V.fR * 0.9, Math.max(2, V.fR * 0.3));
      x.drawImage(sf, Math.round(tip.x - sf.height / 2) + wob, Math.round(tip.y - sf.height / 2));
    }
  }
  function icingRender() { // (on the room canvas) the cake on its counter, with Zech and Sophia, behind the close-up
    const sp = bakeSpot();
    g.fillStyle = 'rgba(43,39,69,.2)'; g.fillRect(Math.round(iw / 2 - sp.table.width / 2) - 1, sp.base + 1, sp.table.width + 2, 2);
    g.drawImage(sp.table, Math.round(iw / 2 - sp.table.width / 2), sp.base - sp.table.height + 2);
    if (IC.sub === 'done') g.drawImage(CAKE.img, sp.cx, sp.cy);
    else g.drawImage(CAKE.stack[STACK], sp.cx, sp.cy);
    drawZech(); drawGirl();
  }

  /* =====================================================================
     CUTSCENE: she builds the cake… and it comes alive as the piñata monster
     ===================================================================== */
  const LAYER_WORDS = ['CAKE BOARD!', 'SPONGE!', 'CREAM + BERRIES!', 'SPONGE!', 'CREAM + BERRIES!', 'SPONGE + CREAM!', 'STRAWBERRY TOP!'];
  const K = { sub: 'idle', layers: 0, dropT: 0, t: 0, liftT: 0, ropeT: 0, alive: false, grabbed: false, shakeT: 0 };
  const bakeShakeDx = () => (K.shakeT > 0 ? (Math.floor(K.t * 30) % 2 ? 1 : -1) : 0);
  const bakeSpot = () => {
    const base = groundY(), table = A.counter(CAKE.w + 6, 8, 'sophia');
    return { base, table, cx: Math.round(iw / 2 - CAKE.w / 2), cy: base - table.height + 2 - CAKE.h, her: Math.round(iw / 2 - CAKE.w / 2 - 14), him: Math.round(iw / 2 + CAKE.w / 2 + 14) };
  };
  function startBake() {
    clearStageUi();
    parts.length = 0;
    phase = 'bake';
    Object.assign(K, { sub: 'intro', layers: 0, dropT: 0, t: 0, liftT: 0, ropeT: 0, alive: false, grabbed: false, shakeT: 0 });
    zechReset();
    Object.assign(ZE, { mode: 'walk', x: Math.round(iw * 0.7), y: groundY(), tx: bakeSpot().him, face: 'happy' });
    kid.happyT = 0;
    say([
      'Strawberries, sponges, whipped cream: check!',
      coarse ? 'Time to build the cake! Tap to stack each layer.' : 'Time to build the cake! Click to stack each layer.',
    ], () => { K.sub = 'build'; lockT = 0.2; showCallout(coarse ? 'TAP TO STACK!' : 'CLICK TO STACK!'); });
  }
  const STACK = CAKE.layerCuts.length - 1; // every layer but the strawberry top (that's for the icing stage)
  function addLayer() {
    if (K.sub !== 'build' || K.layers >= STACK) return;
    K.layers++; K.dropT = 1; kid.hopT = 0.08; kid.happyT = 0.4;
    sfx.catch();
    const sp = bakeSpot(), cut = CAKE.layerCuts[K.layers - 1];
    popWord(iw / 2, sp.cy + cut - 6, LAYER_WORDS[K.layers - 1], false, '#ffffff');
    for (let i = 0; i < 6; i++) parts.push({ x: iw / 2 + rand(-CAKE.w / 2, CAKE.w / 2), y: sp.cy + cut, vx: rand(-30, 30), vy: rand(-50, -20), g: 200, life: 0.6, col: pick(['#fffaf1', '#f7cf7d', '#e8405a']), size: 1, ground: sp.base });
    if (K.layers >= STACK) {
      K.sub = 'stacked'; hideCallout(); sfx.clear();
      later(700, () => say(['Looking good! Now for the icing on top…'], () => showCard(stageIndex('icing'))));
    }
  }
  function aliveScene() { // the iced cake is finished… and then it starts to move
    clearStageUi();
    phase = 'bake';
    Object.assign(K, { sub: 'done', layers: CAKE.layerCuts.length, dropT: 0, t: 0, liftT: 0, ropeT: 0, alive: false, grabbed: false, shakeT: 0 });
    if (ZE.mode !== 'walk') { zechReset(); Object.assign(ZE, { mode: 'walk', x: bakeSpot().him, y: groundY(), tx: bakeSpot().him, face: 'happy' }); }
    later(300, () => say([
      `Ta-da! A giant 성심당딸기시루케이크!`,
      { text: '…wait. Why is the cake moving?!', on: () => { K.shakeT = 1.2; sfx.thud(); } },
      { text: `The cake came alive!!`, on: () => { K.alive = true; ZE.face = 'tired'; flashEl.classList.remove('twice'); retrigger(flashEl, 'go'); sfx.battle(); } },
      { text: `Uh-oh… it's reaching for ${OPP()}!!`, on: startKidnap },
      `${OPP()}: AAAH!! HELP ME, ${NAME()}!!`,
      { text: `${NAME()} grabbed her trusty baguette!`, on: () => { K.grabbed = true; bag.a = restAngle(); sfx.coin(); } },
    ], () => { K.sub = 'rope'; K.ropeT = 0; }));
  }
  function bakeTap() { if (K.sub === 'build') addLayer(); } // one tap = one layer (it never stacks by itself)
  function bakeUpdate(dt) {
    K.t += dt; K.dropT = Math.max(0, K.dropT - dt * 5); K.shakeT -= dt;
    if (ZE.mode === 'walk') ZE.tx = bakeSpot().him; // he waits next to the cake while she builds it
    if (K.sub === 'rope' && KN.t < 0) { K.ropeT += dt; if (K.ropeT >= 0.6) { K.sub = 'lift'; K.liftT = 0; sfx.whoosh(); } } // (waits for the kidnapping to play out)
    if (K.sub === 'lift') {
      K.liftT += dt;
      if (K.liftT >= 1.3) { K.sub = 'handoff'; showCard(stageIndex('boss'), true); } // the boss stage starts with this very cake
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
    g.fillStyle = 'rgba(43,39,69,.2)'; g.fillRect(Math.round(iw / 2 - sp.table.width / 2) - 1, sp.base + 1, sp.table.width + 2, 2);
    g.drawImage(sp.table, Math.round(iw / 2 - sp.table.width / 2), sp.base - sp.table.height + 2);
    const pos = bakeCakePos();
    const dx = bakeShakeDx();
    if (K.sub === 'rope' || K.sub === 'lift' || K.sub === 'handoff') { // the rope comes down from the ceiling and hooks the bow
      const reach = K.sub === 'rope' ? clamp(K.ropeT / 0.6, 0, 1) : 1;
      const endX = pos.x + CAKE.ropeX, endY = Math.round((pos.y + 1) * reach);
      g.fillStyle = '#3d7bff'; pixLine(iw / 2, 0, iw / 2 + (endX - iw / 2) * reach, endY);
      g.fillStyle = '#a9d0ff'; pixLine(iw / 2 + 1, 0, iw / 2 + 1 + (endX - iw / 2) * reach, endY);
    }
    if (ZE.mode === 'ontop' || (ZE.mode === 'yank' && zechInCake())) drawZech(); // the cake covers his legs
    const n = K.layers;
    if (n > 0) {
      // everything already stacked, and the newest layer dropping into place (once it lands, it's all one cake)
      const drop = Math.round(K.dropT * K.dropT * -10);
      if (drop === 0) g.drawImage(CAKE.stack[Math.min(n, CAKE.stack.length - 1)], pos.x + dx, pos.y);
      else { g.drawImage(CAKE.stack[n - 1], pos.x + dx, pos.y); g.drawImage(CAKE.layerImg[n - 1], pos.x + dx, pos.y + drop); }
      if (K.alive) g.drawImage(CAKE.faces[K.sub === 'lift' || K.sub === 'handoff' || KN.t >= 0 ? 'angry' : (Math.floor(K.t * 4) % 2 ? 'angry' : 'hurt')], pos.x + dx + CAKE.faceX, pos.y + CAKE.faceY);
    }
    if (KN.t >= 0) kidnapRender();
    else if (ZE.mode !== 'ontop') drawZech();
  }

  /* ================= stages + flow ================= */
  // the story: catch strawberries → bake the sponges → whip the cream → (cutscene: stack the layers) → ice the top
  // → (cutscene: the cake comes alive and kidnaps Zech) → whack the piñata cake
  const STAGES = [
    { key: 'catch', title: 'Strawberry Catch', how: () => (coarse ? 'Drag left & right to catch!' : 'Move left & right to catch!'), reset: catchReset, begin: catchBegin, update: catchUpdate, tap: catchTap },
    { key: 'sponge', title: 'Fluffy Sponge', how: () => (coarse ? 'Press and hold to bake, let go at the line!' : 'Hold to bake, let go at the line!'), reset: spongeReset, begin: spongeBegin, update: spongeUpdate, tap: spongeTap, release: spongeRelease },
    { key: 'whip', title: 'Whipped Cream Showdown', how: () => (coarse ? 'Tap as fast as you can!' : 'Click as fast as you can!'), reset: whipReset, begin: whipBegin, update: whipUpdate, tap: whipTap },
    { key: 'icing', title: 'Icing on Top', how: () => 'Squeeze cream swirls one by one, add strawberries, then dust with sugar!', reset: icingReset, begin: icingBegin, update: icingUpdate, tap: icingTap, release: icingRelease },
    { key: 'boss', title: 'Piñata Cake Monster', how: () => `${coarse ? 'Tap' : 'Click'} to jump & swing your baguette and rescue ${C.opponentName}!`, reset: bossReset, begin: bossBegin, update: bossUpdate, tap: bossTap },
  ];
  const stageIndex = (key) => STAGES.findIndex((st) => st.key === key);
  function clearStageUi() {
    resetText(); hideCallout();
    document.body.classList.remove('hud-stage', 'boss', 'follow', 'closeup');
    cuCv.classList.remove('on'); IC.shown = false; OV.shown = false; WV.shown = false; IC.held = null; IC.squeeze = false; IC.cur = null;
    if (IC.ghost) { IC.ghost = false; $('#stageBox').classList.remove('ghost'); }
  }
  function showCard(i, keepCake) {
    clearStageUi();
    stageIdx = i;
    parts.length = 0;
    kid.happyT = 0; kid.hopT = 0; kid.jy = kid.jv = 0;
    STAGES[i].reset(keepCake);
    const last = i === STAGES.length - 1;
    $('#cardNum').textContent = last ? 'FINAL STAGE' : `STAGE ${i + 1} / ${STAGES.length}`;
    $('#cardTitle').textContent = STAGES[i].title;
    const stars = $('#cardStars'); // one star per stage: gold up to this one, grey for the ones still ahead
    stars.textContent = '';
    STAGES.forEach((_, k) => { const st = document.createElement('span'); st.textContent = '★'; if (k > i) st.className = 'off'; stars.appendChild(st); });
    stars.setAttribute('aria-label', `stage ${i + 1} of ${STAGES.length}`);
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
    later(1500, () => (STAGE().key === 'whip' ? startBake() : STAGE().key === 'icing' ? aliveScene() : showCard(stageIdx + 1)));
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
    // no baguette yet: she only grabs it when the cake comes alive
    x.drawImage(A.girl.idle1R, Math.round((c.width - A.GIRL_W) / 2), Math.round((c.height - A.GIRL_H) / 2));
  }

  // ?stage=2 (or ?stage=sponge, whip, bake, icing, boss…) jumps straight there (handy for testing)
  const stageParam = (new URLSearchParams(location.search).get('stage') || '').toLowerCase();
  const startAt = stageParam === 'bake' ? 'bake' : stageIndex(stageParam) >= 0 ? stageIndex(stageParam) : clamp((parseInt(stageParam, 10) || 1) - 1, 0, STAGES.length - 1);
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
    letterStep = 0; letterSeen = false; wrongEl.classList.remove('show');
    if (at === 'bake') { stageIdx = stageIndex('whip'); startBake(); } else showCard(at);
  }
  function showEnvelope() {
    preloadSong();
    clearStageUi();
    document.body.classList.add('boss'); // keep the Lv box up so she can see her new level
    phase = 'ready';
    drawEnv(false);
    envWrap.classList.add('show');
    sfx.coin();
  }
  let letterStep = 0; // how many wrong letters she has already been handed
  let letterSeen = false; // the real letter has been opened this run (its song keeps playing after she closes it)
  function wantedTrack() { // which background music fits the moment
    if (phase === 'loading' || phase === 'title') return null;
    if (phase === 'letter' || (ending() && letterSeen)) return music.kind ? null : 'birthday';
    if (ending()) return 'room';
    if (phase === 'bake') return K.alive ? 'boss' : 'room';
    const k = STAGE().key;
    if (k === 'boss') return B.sub === 'rescue' ? 'room' : 'boss';
    return { sponge: 'oven' }[k] || k; // catch / oven / whip / icing
  }
  function openEnvelope() {
    if (phase !== 'ready') return;
    phase = 'opening';
    drawEnv(true); sfx.coin();
    later(550, () => (letterStep < C.wrongLetters.length ? openWrong(letterStep) : openLetter()));
  }
  function openWrong(i) {
    const L = C.wrongLetters[i];
    phase = 'wrong';
    envWrap.classList.remove('show');
    wrongPaper.className = 'paper ' + L.style;
    wrongContent.innerHTML = '';
    const add = (tag, text, parent = wrongContent) => { const el = document.createElement(tag); el.textContent = text; parent.appendChild(el); return el; };
    if (L.title) add('h3', L.title);
    let ul = null;
    for (const line of L.lines) {
      const struck = /^~~.*~~$/.test(line.trim()), text = struck ? line.trim().slice(2, -2) : line;
      if (/^\s*-\s/.test(text)) {
        if (!ul) ul = add('ul', '');
        const li = add('li', '', ul);
        if (struck) add('s', text.replace(/^\s*-\s/, ''), li); else li.textContent = text.replace(/^\s*-\s/, '');
      } else {
        ul = null;
        const p = add('p', '');
        if (struck) add('s', text, p); else p.textContent = text;
      }
    }
    if (L.fields.length) {
      const table = add('table', ''); table.className = 'form-table';
      for (const [k, v] of L.fields) { const tr = add('tr', '', table); add('th', k, tr); add('td', v, tr); }
    }
    if (L.note) add('p', L.note).className = 'note-box';
    if (L.signature) add('p', L.signature).className = 'sig';
    stampEl.textContent = L.stamp; stampEl.hidden = !L.stamp;
    wrongEl.classList.add('show');
    sfx.coin();
    if (L.stamp) later(1100, () => { if (phase === 'wrong') { wrongPaper.classList.add('show-stamp'); sfx.thud(); } });
  }
  function snatch() { // "W-WAIT!! Wrong one!!" (he grabs it back)
    if (phase !== 'wrong') return;
    phase = 'snatch';
    wrongPaper.classList.add('snatched'); sfx.whoosh();
    ZE.panicT = 2.5;
    const reaction = C.wrongLetters[letterStep].reaction;
    letterStep++;
    later(500, () => {
      wrongEl.classList.remove('show');
      if (reaction.length) say(reaction, showEnvelope); else showEnvelope();
    });
  }
  $('#wrongNext').addEventListener('click', snatch);
  wrongEl.addEventListener('click', (e) => { if (e.target === wrongEl) snatch(); });
  envelope.addEventListener('click', openEnvelope);

  let typer = null;
  /* ================= her song: a Spotify link or an audio file, played when the real letter opens ================= */
  const songBox = $('#song'), songEmbed = $('#songEmbed'), songBtn = $('#songBtn');
  const music = { kind: '', uri: '', ctl: null, ready: false, playing: false, audio: null, loading: false, want: false };
  function setupSong() {
    const v = C.song, m = v.match(/(?:open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?|spotify:)(track|album|playlist|episode|artist)[/:]([A-Za-z0-9]{8,})/i);
    if (m) Object.assign(music, { kind: 'spotify', uri: `spotify:${m[1].toLowerCase()}:${m[2]}` });
    else if (/\.(mp3|m4a|aac|ogg|oga|opus|wav|webm)(\?.*)?$/i.test(v)) Object.assign(music, { kind: 'file', uri: v });
    else if (v) console.warn('config.json "song" is not a Spotify link or an audio file, so the 8-bit tune plays instead:', v);
  }
  function songFailed() { music.kind = ''; songBox.hidden = true; }
  function preloadSong() { // starts when the envelopes show up, so the player is ready by the time she gets the real letter
    if (music.loading || !music.kind) return;
    music.loading = true;
    if (music.kind === 'file') {
      const a = (music.audio = new Audio(music.uri));
      a.preload = 'auto';
      a.addEventListener('play', () => { music.playing = true; songBtn.textContent = '❚❚ PAUSE OUR SONG'; });
      a.addEventListener('pause', () => { music.playing = false; songBtn.textContent = '▶ PLAY OUR SONG'; });
      a.addEventListener('error', songFailed);
      return;
    }
    window.onSpotifyIframeApiReady = (api) => {
      try {
        api.createController(songEmbed, { uri: music.uri, width: '100%', height: 80 }, (ctl) => {
          music.ctl = ctl;
          ctl.addListener('ready', () => { music.ready = true; if (music.want && !music.playing) ctl.play(); });
          ctl.addListener('playback_update', (e) => {
            const d = (e && e.data) || {};
            music.playing = !d.isPaused;
          });
        });
      } catch (err) { console.warn('Spotify player failed', err); songFailed(); }
    };
    const sc = document.createElement('script');
    sc.src = 'https://open.spotify.com/embed/iframe-api/v1'; sc.async = true;
    sc.onerror = songFailed;
    document.head.appendChild(sc);
  }
  function playSong() { // false = no song set up (or it failed to load): play the 8-bit tune instead
    if (!music.kind) return false;
    preloadSong();
    if (!music.kind) return false;
    songBox.hidden = false;
    songBtn.hidden = music.kind !== 'file';
    music.want = !sfx.isMuted();
    if (!music.want || music.playing) return true;
    if (music.kind === 'file') {
      const pr = music.audio.play();
      if (pr && pr.catch) pr.catch(() => { songBtn.textContent = '▶ PLAY OUR SONG'; }); // blocked: she can press play
    } else if (music.ready) music.ctl.play(); // (otherwise it starts as soon as the player is ready)
    return true;
  }
  function pauseSong() {
    music.want = false;
    try { if (music.audio) music.audio.pause(); if (music.ctl && music.playing) music.ctl.pause(); } catch (e) { /* ignore */ }
  }
  songBtn.addEventListener('click', () => {
    if (!music.audio) return;
    if (music.audio.paused) { music.want = true; music.audio.play().catch(() => {}); } else pauseSong();
  });

  function openLetter() {
    phase = 'letter';
    letter.classList.add('show');
    letterSeen = true;
    playSong(); // (a Spotify link / audio file, if one is set; otherwise the jazz Happy Birthday plays)
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
      if (tick++ % 3 === 0) sfx.tick();
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
  $('#replay').addEventListener('click', () => { closeLetter(); pauseSong(); songBox.hidden = true; newRun(0); });
  startBtn.addEventListener('click', startGame);
  $('#mute').addEventListener('click', (e) => {
    const off = sfx.toggle();
    e.currentTarget.classList.toggle('off', off); e.currentTarget.blur();
    if (off) pauseSong(); else if (phase === 'letter') playSong();
  });

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
    const shrink = Math.min(4, Math.round(-kid.jy / 5)); // her shadow stays on the floor when she jumps
    g.fillStyle = 'rgba(43,39,69,.22)';
    g.fillRect(Math.round(kid.x) - 7 + shrink, Math.round(kid.y + A.GIRL_H / 2) - 1, 14 - shrink * 2, 2);
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
      for (let j = 0; j < b.str; j++) g.fillRect(b.x + b.sx + ((j >> 1) % 2), b.y + b.sy + bob + j, 1, 1);
      g.drawImage(b.img, b.x, b.y + bob);
    }

    if (inStage('boss') || ending()) drawCake();
    if (phase === 'bake') bakeRender();
    for (const p of parts) if (!p.confetti && !p.over) drawParticle(p);

    if (phase !== 'loading' && phase !== 'title') {
      if (inStage('whip')) whipRender();
      else if (inStage('sponge')) spongeRender();
      else if (inStage('icing')) icingRender();
      else {
        if (phase !== 'bake' && ZE.mode !== 'ontop') drawZech();
        const pose = drawGirl();
        if (inStage('catch')) { catchRenderBowl(pose); catchRenderItems(); }
      }
    }
    for (const p of parts) if (p.confetti) drawParticle(p);
    renderCloseup(); renderOven(); renderWhip();
  }

  /* ================= main loop ================= */
  let last = performance.now();
  function frame(now) {
    try {
      const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 30);
      last = now; time += dt;
      tickText(dt);
      sfx.bgm(wantedTrack());
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
      get sub() { return phase === 'bake' ? K.sub : { catch: CT.sub, sponge: SP.sub, whip: W.sub, icing: IC.sub, boss: B.sub }[STAGE().key]; },
      get sponge() {
        const V = ovLayout();
        return { sub: SP.sub, r: SP.r, n: SP.n, tol: SP.tol, target: SP_TARGET, shown: OV.shown, heat: OV.heat, door: OV.door, lineY: batter(V, SP_TARGET).top * V.P, topY: batter(V, SP.r).top * V.P };
      },
      get icing() {
        const V = cuLayout(), k = V.P, sp = (x, y) => ({ x: x * k, y: y * k });
        let on = 0; for (const s of IC.specks) if (s.on) on++;
        return {
          sub: IC.sub, piped: IC.piped, n: IC.spots.length, placed: IC.placed.length, used: IC.used, held: !!IC.held, sugar: on / SUGAR_GOAL, shown: IC.shown, lift: V.lift * k,
          ring: IC.spots.map((s) => { const q = ringPos(V, s.u); return { ...sp(q.x, q.y + V.lift), done: s.done, g: s.g, perfect: !!s.perfect }; }),
          bowl: sp(V.bx, V.by), cake: { x0: V.x0 * k, y0: V.y0 * k, x1: V.x1 * k, y1: V.y1 * k },
          inner: { x0: V.inner.x0 * k, y0: V.inner.y0 * k, x1: V.inner.x1 * k, y1: V.inner.y1 * k },
        };
      },
      get bake() { return { layers: K.layers, alive: K.alive, grabbed: K.grabbed }; },
      get letterStep() { return letterStep; },
      get zech() { return { mode: ZE.mode, x: ZE.x * S, y: ZE.y * S, hug: ZE.hug, face: ZE.face, kidnapT: KN.t, holding: KN.holding }; },
      get whip() { return { p: W.p, z: W.z, face: W.zFace, taps: W.taps, ing: WV.ing, om: WV.om, shown: WV.shown, sub: W.sub }; },
      get catch() { return { caught: CT.caught, dizzy: CT.dizzyT > 0, items: CT.items.map((i) => ({ kind: i.kind, x: i.x * S, y: i.y * S })) }; },
      get kid() { return { x: kid.x * S, y: kid.y * S }; }, get cakeHp() { return cake.hp; },
      get music() { return { kind: music.kind, uri: music.uri, playing: music.playing, want: music.want, shown: !songBox.hidden }; }, get tune() { return sfx.songOn(); }, get track() { return sfx.bgmName(); },
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
      setupSong();
      iw = ih = 0; layout(); // rebuild the room now that we know her age
      phase = 'title';
      startBtn.disabled = false;
      startBtn.textContent = '▶ PRESS START';
    });
})();
