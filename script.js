(() => {
  const C = Object.assign(
    { name: 'you', photo: 'images/her.jpg', hitsToBreak: 8, from: 'me', letter: [] },
    window.BIRTHDAY || {}
  );
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const stage = $('#stage'), swing = $('#swing'), rope = $('#rope'), wrap = $('#pinataWrap');
  const face = $('#face'), faceInner = face.firstElementChild;
  const canvas = $('#fx'), ctx = canvas.getContext('2d');
  const hint = $('#hint'), progress = $('#progress');
  const envWrap = $('#envelopeWrap'), envelope = $('#envelope'), letter = $('#letter');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const PALETTE = ['#ff6f9c', '#ffb3c8', '#ffcf8a', '#b79cff', '#7fd6b8', '#8fc3ff', '#ffe27a'];

  /* ---------- content from config ---------- */
  document.querySelectorAll('[data-name]').forEach((el) => (el.textContent = C.name));
  document.title = `happy birthday, ${C.name} ♡`;
  $('#from').textContent = C.from;
  $('#letterDate').textContent = C.date ||
    new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  $('#letterBody').innerHTML = '';
  C.letter.forEach((text, i) => {
    const p = document.createElement('p');
    p.textContent = text;
    p.style.animationDelay = `${0.35 + i * 0.25}s`;
    $('#letterBody').appendChild(p);
  });
  hint.textContent = coarse ? 'drag her into the piñata' : 'swing her into the piñata';

  // her photo, with a cute stand-in if the file isn't there yet
  const FALLBACK = 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#ffe0d2"/>
     <path d="M33 44q5-6 10 0M57 44q5-6 10 0" fill="none" stroke="#5a2a40" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M40 60q10 10 20 0" fill="none" stroke="#5a2a40" stroke-width="3.5" stroke-linecap="round"/>
     <ellipse cx="28" cy="57" rx="7" ry="4.5" fill="#ff8fb1" opacity=".6"/><ellipse cx="72" cy="57" rx="7" ry="4.5" fill="#ff8fb1" opacity=".6"/></svg>`
  );
  document.querySelectorAll('img.her').forEach((img) => {
    img.onerror = () => { img.onerror = null; img.src = FALLBACK; };
    img.src = C.photo;
  });

  /* ---------- piñata markup ---------- */
  const HEART = 'M100 182C42 138 2 104 2 58 2 26 27 4 57 4c20 0 35 11 43 25 8-14 23-25 43-25 30 0 55 22 55 54 0 46-40 80-98 124z';
  const BANDS = ['#ffb3c8', '#ffd5b0', '#d9c4ff', '#fff0a6', '#bdeedd', '#ffc9e3', '#c9dcff'];
  const CRACKS = [
    'M60 30 L72 52 L63 66 L78 84',
    'M150 38 L137 58 L148 73 L133 96',
    'M100 160 L93 136 L106 118 L97 100',
    'M14 74 L40 82 L33 98 L58 110',
    'M186 76 L160 90 L168 106 L144 120',
    'M100 30 L104 50 L95 64 L104 82',
  ];

  function pinataSVG(id) {
    const h = 24;
    let bands = '';
    for (let i = 0, y = 0; y < 200; i++, y += h) {
      bands += `<rect x="0" y="${y}" width="200" height="${h + 1}" fill="${BANDS[i % BANDS.length]}"/>`;
    }
    // zig-zag paper fringe hanging over the band below
    for (let i = 0, y = h; y < 200; i++, y += h) {
      let d = `M0 ${y - 1}`;
      for (let x = 0; x < 200; x += 8) d += ` L${x + 4} ${y + 6} L${x + 8} ${y - 1}`;
      bands += `<path d="${d}Z" fill="${BANDS[i % BANDS.length]}"/>`;
    }
    return `<svg viewBox="0 0 200 190" aria-hidden="true">
      <defs>
        <clipPath id="hc${id}"><path d="${HEART}"/></clipPath>
        <pattern id="fr${id}" width="6" height="24" patternUnits="userSpaceOnUse">
          <path d="M1.5 0V24M4.5 0V24" stroke="#fff" stroke-opacity=".28" stroke-width="1"/>
        </pattern>
        <radialGradient id="sh${id}" cx="34%" cy="28%" r="80%">
          <stop offset="0" stop-color="#fff" stop-opacity=".45"/>
          <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#6b2a48" stop-opacity=".2"/>
        </radialGradient>
      </defs>
      <g clip-path="url(#hc${id})">
        ${bands}
        <rect width="200" height="200" fill="url(#fr${id})"/>
        <rect width="200" height="200" fill="url(#sh${id})"/>
        <g>${CRACKS.map((d) => `<path class="crack" pathLength="1" d="${d}"/>`).join('')}</g>
      </g>
      <path d="${HEART}" fill="none" stroke="#7a3555" stroke-opacity=".2" stroke-width="2.5"/>
      <g class="pface">
        <ellipse cx="64" cy="100" rx="10" ry="5.5" fill="#ff8fb1" opacity=".5"/>
        <ellipse cx="136" cy="100" rx="10" ry="5.5" fill="#ff8fb1" opacity=".5"/>
        <g class="eyes-happy"><path d="M70 86q8-10 16 0M114 86q8-10 16 0"/></g>
        <g class="eyes-ouch"><path d="M70 77l14 7-14 7M130 77l-14 7 14 7"/></g>
        <path d="M92 100q8 8 16 0"/>
      </g>
      <circle cx="100" cy="20" r="6" fill="none" stroke="#8a6a55" stroke-width="3"/>
    </svg>`;
  }
  wrap.innerHTML = pinataSVG('main');
  const cracks = [...wrap.querySelectorAll('.crack')];

  /* ---------- sound (tiny synth, no files) ---------- */
  const sound = (() => {
    let ac = null, muted = false;
    const init = () => {
      if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      if (ac && ac.state === 'suspended') ac.resume();
    };
    const ok = () => ac && !muted;
    function noise(dur) {
      const b = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const s = ac.createBufferSource(); s.buffer = b; return s;
    }
    function tone(freq, t, dur, vol, type = 'sine', endFreq) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    function thwack(p) {
      if (!ok()) return;
      const t = ac.currentTime;
      tone(170 + p * 80, t, 0.2, 0.5 + p * 0.3, 'sine', 55);
      const n = noise(0.12), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.value = 700 + p * 600; f.Q.value = 0.9; g.gain.value = 0.35 + p * 0.3;
      n.connect(f).connect(g).connect(ac.destination); n.start(t);
    }
    function boop() { if (ok()) tone(520, ac.currentTime, 0.12, 0.08, 'triangle', 380); }
    function boom() {
      if (!ok()) return;
      const t = ac.currentTime;
      thwack(1);
      const n = noise(0.6), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'lowpass'; f.frequency.value = 1800; g.gain.value = 0.6;
      n.connect(f).connect(g).connect(ac.destination); n.start(t);
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((fq, i) => tone(fq, t + 0.15 + i * 0.09, 0.9, 0.12, 'triangle'));
    }
    function chime() {
      if (!ok()) return;
      const t = ac.currentTime;
      [783.99, 987.77, 1174.66].forEach((fq, i) => tone(fq, t + i * 0.07, 0.7, 0.08, 'sine'));
    }
    return { init, thwack, boop, boom, chime, toggle: () => (muted = !muted) };
  })();

  /* ---------- layout ---------- */
  let W, H, S, sc, L, D, R, FR, dpr;
  function layout() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = Math.min(W, H);
    S = clamp(m * 0.4, 150, 300); sc = S / 200;
    L = Math.max(40, H * 0.4 - 74 * sc);   // rope length; body centre sits ~40% down
    D = L + 74 * sc;                       // pivot → body centre
    R = 82 * sc;                           // body hit radius
    FR = clamp(m * 0.085, 34, 62);         // her face radius
    swing.style.left = W / 2 + 'px';
    rope.style.height = L + 'px';
    Object.assign(wrap.style, { width: S + 'px', height: S * 0.95 + 'px', left: -S / 2 + 'px', top: L - 14 * sc + 'px' });
    face.style.width = face.style.height = FR * 2 + 'px';
  }
  layout();
  addEventListener('resize', layout);

  /* ---------- state ---------- */
  let theta = 0.35, omega = 0;
  const ptr = { x: W / 2, y: H * 0.8 };
  let prevPx = ptr.x, prevPy = ptr.y, pvx = 0, pvy = 0;
  let fx = ptr.x, fy = ptr.y;
  let hits = 0, broken = false, started = false, lastHit = 0, hintTimer;
  const parts = [], halves = [];

  for (let i = 0; i < C.hitsToBreak; i++) progress.appendChild(document.createElement('i'));
  const dots = [...progress.children];

  function onPointer(e) { ptr.x = e.clientX; ptr.y = e.clientY; }
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('pointerdown', (e) => { onPointer(e); sound.init(); }, { passive: true });

  /* ---------- hits ---------- */
  const WORDS = ['bonk!', 'pow!', 'whack!', 'boop!', 'smack!', 'wham!', 'yay!', 'oof!', '♡'];
  function popWord(x, y, text) {
    const el = document.createElement('span');
    el.className = 'pop';
    el.textContent = text || pick(WORDS);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.color = pick(['#ff6f9c', '#b07cff', '#ff9a5c', '#3fbf96']);
    el.style.setProperty('--r', rand(-14, 14) + 'deg');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
  function retrigger(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function onHit(x, y, power, bx, by) {
    hits++;
    clearTimeout(hintTimer); hint.classList.remove('show');
    sound.thwack(power);
    popWord(x, y);
    retrigger(wrap, 'bonk');
    retrigger(faceInner, 'squish');
    retrigger(stage, 'shake');
    wrap.classList.add('ouch');
    setTimeout(() => wrap.classList.remove('ouch'), 380);
    if (navigator.vibrate) navigator.vibrate(18);

    const shown = Math.min(cracks.length, Math.floor((hits / C.hitsToBreak) * (cracks.length + 1)));
    cracks.forEach((c, i) => c.classList.toggle('on', i < shown));
    dots.forEach((d, i) => d.classList.toggle('on', i < hits));
    burst(x, y, 6 + power * 8, 0.45);

    if (hits >= C.hitsToBreak) breakIt(bx, by);
  }

  function breakIt(bx, by) {
    broken = true;
    sound.boom();
    retrigger($('#flash'), 'go');
    stage.classList.remove('shake'); retrigger(stage, 'big-shake');
    wrap.classList.add('gone');
    rope.classList.add('retract');
    popWord(bx, by - R, 'happy birthday!');

    // two halves fly apart
    const cx = W / 2 + (L + 81 * sc) * Math.sin(theta), cy = (L + 81 * sc) * Math.cos(theta);
    ['l', 'r'].forEach((side, i) => {
      const el = document.createElement('div');
      el.className = 'half ' + side;
      el.style.width = S + 'px'; el.style.height = S * 0.95 + 'px';
      el.innerHTML = pinataSVG('h' + side);
      el.querySelectorAll('.crack').forEach((c) => c.classList.add('on'));
      document.body.appendChild(el);
      const dir = i ? 1 : -1;
      halves.push({ el, x: cx, y: cy, rot: -theta, vx: dir * rand(220, 340), vy: rand(-620, -480), vr: dir * rand(2.5, 4.5) });
    });

    burst(bx, by, 170, 1);
    setTimeout(() => burst(bx, by, 60, 0.8), 180);
    setTimeout(() => { envWrap.classList.add('show'); sound.chime(); }, 1500);
  }

  /* ---------- particles ---------- */
  function burst(x, y, n, force) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(200, 900) * force;
      const r = Math.random();
      parts.push({
        type: r < 0.62 ? 'conf' : r < 0.86 ? 'candy' : 'heart',
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 250 * force,
        rot: rand(0, 6.28), vr: rand(-10, 10), flip: rand(0, 6.28), vf: rand(6, 14),
        size: rand(6, 11), color: pick(PALETTE), wob: rand(0, 6.28),
      });
    }
  }

  function heartPath(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35);
    ctx.fill();
  }

  function drawParts(dt) {
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const drag = p.type === 'conf' ? 2.2 : 0.8;
      p.vx -= p.vx * drag * dt;
      p.vy += (p.type === 'conf' ? 900 : 1500) * dt;
      p.vy -= p.vy * (p.type === 'conf' ? 1.6 : 0.3) * dt;
      p.wob += dt * 5;
      p.x += (p.vx + (p.type === 'conf' ? Math.sin(p.wob) * 40 : 0)) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt; p.flip += p.vf * dt;
      if (p.y > H + 40) { parts.splice(i, 1); continue; }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.type === 'conf') {
        ctx.fillRect(-p.size / 2, -p.size * 0.3 * Math.abs(Math.cos(p.flip)), p.size, p.size * 0.6 * Math.abs(Math.cos(p.flip)) + 0.5);
      } else if (p.type === 'candy') {
        const s = p.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(-s, 0); ctx.lineTo(-s * 1.9, -s * 0.7); ctx.lineTo(-s * 1.9, s * 0.7); ctx.closePath();
        ctx.moveTo(s, 0); ctx.lineTo(s * 1.9, -s * 0.7); ctx.lineTo(s * 1.9, s * 0.7); ctx.closePath();
        ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.3, s * 0.35, 0, Math.PI * 2); ctx.fill();
      } else {
        heartPath(p.size * 0.9);
      }
      ctx.restore();
    }
  }

  /* ---------- main loop ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    // pointer velocity (what counts as a "swing")
    pvx += ((ptr.x - prevPx) / dt - pvx) * 0.5;
    pvy += ((ptr.y - prevPy) / dt - pvy) * 0.5;
    prevPx = ptr.x; prevPy = ptr.y;

    // her face chases the pointer with a little lag
    const k = 1 - Math.exp(-dt * 26);
    fx += (ptr.x - fx) * k;
    fy += (ptr.y - fy) * k;

    // pendulum
    omega += (-(2300 / D) * Math.sin(theta) - 0.75 * omega) * dt;
    theta += omega * dt;
    if (Math.abs(theta) > 1.3) { theta = Math.sign(theta) * 1.3; omega *= -0.4; }
    const bx = W / 2 + D * Math.sin(theta), by = D * Math.cos(theta);

    if (started && !broken) {
      const dx = fx - bx, dy = fy - by, dist = Math.hypot(dx, dy) || 1, minD = FR + R * 0.92;
      if (dist < minD) {
        const nx = dx / dist, ny = dy / dist;
        fx = bx + nx * minD; fy = by + ny * minD;          // can't pass through it
        const tx = Math.cos(theta), ty = -Math.sin(theta); // swing direction
        const speed = Math.hypot(pvx, pvy);
        const vt = pvx * tx + pvy * ty;
        omega += clamp((vt / D) * 0.04, -0.3, 0.3);         // gentle constant push
        const need = clamp(Math.min(W, H) * 0.9, 340, 780);
        if (now - lastHit > 230 && speed > 140) {
          lastHit = now;
          omega += clamp((vt / D) * 0.5, -5, 5);
          if (speed > need) onHit(fx - nx * FR, fy - ny * FR, clamp((speed - need) / 1600, 0, 1), bx, by);
          else sound.boop();
        }
      }
    }

    swing.style.transform = `rotate(${-theta}rad)`;
    const tilt = clamp(pvx * 0.015, -22, 22);
    face.style.transform = `translate(${fx - FR}px, ${fy - FR}px) rotate(${tilt}deg)`;

    for (let i = halves.length - 1; i >= 0; i--) {
      const h = halves[i];
      h.vy += 1700 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt;
      h.el.style.transform = `translate(${h.x - S / 2}px, ${h.y - S * 0.475}px) rotate(${h.rot}rad)`;
      if (h.y > H + S) { h.el.remove(); halves.splice(i, 1); }
    }

    drawParts(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- flow ---------- */
  $('#start').addEventListener('click', (e) => {
    sound.init();
    ptr.x = fx = e.clientX || W / 2;
    ptr.y = fy = e.clientY || H * 0.8;
    prevPx = ptr.x; prevPy = ptr.y;
    $('#intro').classList.add('hide');
    document.body.classList.add('playing', 'started');
    setTimeout(() => { started = true; }, 250);
    hintTimer = setTimeout(() => hint.classList.add('show'), 1200);
    sound.chime();
  });

  envelope.addEventListener('click', () => {
    if (envelope.classList.contains('open')) return openLetter();
    envelope.classList.add('open');
    sound.chime();
    setTimeout(openLetter, 1350);
  });

  function openLetter() {
    letter.classList.add('show');
    document.body.classList.add('reading');
    burst(W / 2, H * 0.35, 40, 0.6);
  }
  function closeLetter() {
    letter.classList.remove('show');
    document.body.classList.remove('reading');
  }
  $('#closeLetter').addEventListener('click', closeLetter);
  letter.addEventListener('click', (e) => { if (e.target === letter) closeLetter(); });

  $('#replay').addEventListener('click', () => {
    closeLetter();
    envWrap.classList.remove('show');
    envelope.classList.remove('open');
    hits = 0; broken = false; theta = -0.6; omega = 0;
    cracks.forEach((c) => c.classList.remove('on'));
    dots.forEach((d) => d.classList.remove('on'));
    wrap.classList.remove('gone');
    rope.classList.remove('retract');
    retrigger(wrap, 'bonk');
  });

  $('#mute').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('off', sound.toggle());
  });
})();
