/* Background music, synthesised with Web Audio (no audio files).
   Every track renders one bar at a time, so the game's scheduler can loop it forever without a seam:
   the last bar of each track is written to lead straight back into the first.

   room     – calm, Animal Crossing-ish (kalimba, electric piano, plucky bass, shaker)   F major, 92 bpm
   catch    – bouncy marimba tune for the strawberry catch                              C major, 116 bpm
   whip     – sporty little race theme for the whipping battle                          E minor, 132 bpm
   boss     – driving chiptune battle theme for the cake monster                        A minor, 156 bpm
   birthday – "Happy Birthday" as a jazz waltz with reharmonised choruses, an embellished head,
              vibraphone and flute solos (freshly improvised every time round), ~100 s per cycle      */
window.Music = (() => {
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const pc = (m) => ((m % 12) + 12) % 12;

  // ---------------- instruments ----------------
  const INST = {
    kalimba: { parts: [[1, 1, 'sine'], [3, 0.06, 'sine'], [5.9, 0.035, 'sine']], attack: 0.004, decay: 0.45 },
    marimba: { parts: [[1, 1, 'sine'], [4, 0.16, 'sine'], [10, 0.03, 'sine']], attack: 0.003, decay: 0.22 },
    glock: { parts: [[1, 1, 'sine'], [4, 0.22, 'sine']], attack: 0.002, decay: 0.5 },
    vibes: { parts: [[1, 1, 'sine'], [4, 0.1, 'sine'], [10, 0.025, 'sine']], attack: 0.006, decay: 1.1, trem: true },
    ep: { parts: [[1, 1, 'sine'], [2, 0.22, 'sine'], [7, 0.012, 'sine']], attack: 0.006, decay: 0.7 },
    flute: { parts: [[1, 1, 'sine'], [2, 0.12, 'sine'], [3, 0.04, 'sine']], attack: 0.07, decay: 2.5, sus: 0.75, vib: 9 },
    pulse: { parts: [[1, 1, 'square']], attack: 0.004, decay: 0.16, sus: 0.3, lp: 2200 },
    lead: { parts: [[1, 1, 'square']], attack: 0.005, decay: 0.3, sus: 0.6, lp: 2600, vib: 7 },
    arp: { parts: [[1, 1, 'square']], attack: 0.002, decay: 0.07, lp: 1800 },
    pbass: { parts: [[1, 1, 'triangle'], [2, 0.3, 'sine']], attack: 0.004, decay: 0.35 },
    sbass: { parts: [[1, 1, 'square']], attack: 0.003, decay: 0.12, sus: 0.3, lp: 700 },
  };
  function voice(ctx, dest, m, t, dur, vol, I) {
    const f = mtof(m), env = ctx.createGain(), end = t + Math.max(0.03, dur);
    const a = I.attack || 0.005;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(vol, t + a);
    env.gain.setTargetAtTime(vol * (I.sus || 0), t + a, I.decay);
    env.gain.setTargetAtTime(0, end, 0.05);
    let tail = env;
    if (I.lp) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = I.lp; env.connect(lp); tail = lp; }
    if (I.trem) { // vibraphone motor
      const tg = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
      tg.gain.value = 0.82; lfo.frequency.value = 5.2; depth.gain.value = 0.18;
      lfo.connect(depth).connect(tg.gain); lfo.start(t); lfo.stop(end + 0.6);
      tail.connect(tg); tail = tg;
    }
    tail.connect(dest);
    let vib = null;
    if (I.vib) { vib = ctx.createOscillator(); const d = ctx.createGain(); vib.frequency.value = 5; d.gain.value = I.vib; vib.connect(d); vib.start(t + 0.15); vib.stop(end + 0.6); vib = d; }
    for (const [mult, rel, type] of I.parts) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f * mult; g.gain.value = rel;
      if (vib) vib.connect(o.detune);
      o.connect(g).connect(env); o.start(t); o.stop(end + 0.6);
    }
  }

  // ---------------- drums ----------------
  const noiseCache = new WeakMap();
  function noise(ctx) {
    if (!noiseCache.has(ctx)) {
      const b = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.8), ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noiseCache.set(ctx, b);
    }
    return noiseCache.get(ctx);
  }
  function nz(ctx, dest, t, vol, decay, type, freq, q) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise(ctx); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.setTargetAtTime(0, t + 0.004, decay);
    s.connect(f).connect(g).connect(dest); s.start(t, Math.random() * 0.2); s.stop(t + Math.min(0.75, decay * 6 + 0.02));
  }
  function drum(ctx, dest, kind, t, vol = 1) {
    switch (kind) {
      case 'kick': {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        g.gain.setValueAtTime(0.5 * vol, t); g.gain.setTargetAtTime(0, t + 0.01, 0.07);
        o.connect(g).connect(dest); o.start(t); o.stop(t + 0.45);
        break;
      }
      case 'snare': {
        nz(ctx, dest, t, 0.22 * vol, 0.06, 'bandpass', 1900, 0.8);
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = 190; g.gain.setValueAtTime(0.12 * vol, t); g.gain.setTargetAtTime(0, t, 0.03);
        o.connect(g).connect(dest); o.start(t); o.stop(t + 0.2);
        break;
      }
      case 'clap': nz(ctx, dest, t, 0.12 * vol, 0.05, 'bandpass', 1300, 1.2); break;
      case 'hat': nz(ctx, dest, t, 0.07 * vol, 0.025, 'highpass', 7500); break;
      case 'ohat': nz(ctx, dest, t, 0.06 * vol, 0.16, 'highpass', 7000); break;
      case 'shaker': nz(ctx, dest, t, 0.05 * vol, 0.035, 'bandpass', 6500, 1); break;
      case 'rim': {
        nz(ctx, dest, t, 0.05 * vol, 0.012, 'highpass', 3000);
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 1750; g.gain.setValueAtTime(0.05 * vol, t); g.gain.setTargetAtTime(0, t, 0.012);
        o.connect(g).connect(dest); o.start(t); o.stop(t + 0.08);
        break;
      }
      case 'ride': nz(ctx, dest, t, 0.07 * vol, 0.12, 'highpass', 6500); break;
      case 'chick': nz(ctx, dest, t, 0.03 * vol, 0.025, 'highpass', 3500); break;
      case 'brush': nz(ctx, dest, t, 0.035 * vol, 0.16, 'bandpass', 3000, 0.7); break;
      case 'crash': nz(ctx, dest, t, 0.08 * vol, 0.7, 'highpass', 4500); break;
    }
  }

  // ---------------- a generic little loop: chords + bass + comping + melody + drums ----------------
  const swing = (b, s) => { const n = Math.floor(b), f = b - n; return n + (f < 0.5 ? f * 2 * s : s + (f - 0.5) * 2 * (1 - s)); };
  function loopTrack(spec) {
    const N = spec.bars.length, M = spec.meter || 4;
    const mel = Array.from({ length: N }, () => []);
    for (const ev of spec.mel) mel[ev[0]].push(ev);
    const chordAt = (bar, beat) => { const c = spec.bars[bar]; return c.length === 1 ? c[0] : c[Math.min(c.length - 1, Math.floor((beat * c.length) / M))]; };
    return {
      bpm: spec.bpm, meter: M, vol: spec.vol, startBar: 0,
      render(ctx, dest, g, t, B) {
        const bar = g % N, pass = Math.floor(g / N), at = (b) => t + swing(b, spec.swing || 0.5) * B;
        const nextRoot = spec.R[chordAt((bar + 1) % N, 0)];
        // comping
        if (spec.comp === 'ep') {
          for (const [b, len, v] of [[0, 1.2, 1], [1.5, 0.4, 0.6], [2, 1.2, 0.85], [3.5, 0.4, 0.5]]) {
            for (const m of spec.V[chordAt(bar, b)]) voice(ctx, dest, m, at(b), len * B, 0.032 * v * (spec.compVol || 1), INST.ep);
          }
        } else if (spec.comp === 'arp16') {
          for (let i = 0; i < M * 4; i++) {
            const vs = spec.V[chordAt(bar, i / 4)], m = vs[[0, 1, 2, 1][i % 4] % vs.length] + 12;
            voice(ctx, dest, m, at(i / 4), B * 0.22, i % 4 === 0 ? 0.03 : 0.02, INST.arp);
          }
        }
        // bass
        const R = (b) => spec.R[chordAt(bar, b)], fifth = (r) => (r + 7 <= 52 ? r + 7 : r - 5);
        const approach = (r) => (r + 1 === R(M - 1) ? r - 1 : r + 1);
        if (spec.bass === 'bounce') {
          voice(ctx, dest, R(0), at(0), B * 0.9, 0.15, INST.pbass);
          voice(ctx, dest, M === 4 && chordAt(bar, 2) !== chordAt(bar, 0) ? R(2) : fifth(R(0)), at(2), B * 0.9, 0.13, INST.pbass);
          voice(ctx, dest, approach(nextRoot), at(3.5), B * 0.4, 0.1, INST.pbass);
        } else if (spec.bass === 'sports') {
          for (let i = 0; i < M * 2; i++) voice(ctx, dest, R(i / 2) + (i % 2 ? 12 : 0), at(i / 2), B * 0.4, i % 2 ? 0.09 : 0.14, INST.pbass);
        } else if (spec.bass === 'pump') {
          for (let i = 0; i < M * 2; i++) voice(ctx, dest, R(i / 2) + (i % 4 === 3 ? 12 : 0), at(i / 2), B * 0.45, 0.075, INST.sbass);
        }
        // melody (the second time round gets a little extra)
        const I = INST[spec.lead];
        for (const [, b, m, d, v = 1] of mel[bar]) {
          voice(ctx, dest, m + (spec.leadShift || 0), at(b), d * B, spec.leadVol * v, I);
          if (pass % 2 === 1 && spec.second) voice(ctx, dest, m + spec.second.shift, at(b), d * B, spec.leadVol * spec.second.vol * v, INST[spec.second.inst]);
        }
        // drums
        const D = (k, b, v) => drum(ctx, dest, k, at(b), v);
        if (spec.drums === 'shaker') {
          for (let i = 0; i < M * 2; i++) D('shaker', i / 2, i % 2 ? 0.6 : 1);
          D('rim', 1, 0.6); D('rim', 3, 0.6);
        } else if (spec.drums === 'sports') {
          D('kick', 0); D('kick', 2, 0.8); D('clap', 1); D('clap', 3);
          for (let i = 0; i < M * 2; i++) D('hat', i / 2, i % 2 ? 0.6 : 1);
        } else if (spec.drums === 'boss') {
          D('kick', 0); D('kick', 1.5, 0.7); D('kick', 2); D('snare', 1); D('snare', 3);
          for (let i = 0; i < M * 2; i++) D('hat', i / 2, i % 2 ? 0.55 : 0.9);
          if (bar === 0) D('crash', 0);
          if (bar === N - 1) { D('snare', 3.25, 0.6); D('snare', 3.5, 0.8); D('snare', 3.75, 1); } // fill back to the top
        }
      },
    };
  }

  // ---------------- the tracks ----------------
  const room = loopTrack({
    bpm: 92, swing: 0.6, vol: 0.55, lead: 'kalimba', leadVol: 0.16, comp: 'ep', bass: 'bounce', drums: 'shaker',
    V: { Fmaj7: [57, 60, 64], Am7: [55, 60, 64], Bbmaj7: [57, 62, 65], C7sus: [53, 58, 62], C7: [52, 58, 62], Dm7: [53, 57, 60], Gm7: [53, 58, 62], A7: [55, 61, 64], G7: [53, 59, 64] },
    R: { Fmaj7: 41, Am7: 45, Bbmaj7: 46, C7sus: 48, C7: 48, Dm7: 38, Gm7: 43, A7: 45, G7: 43 },
    bars: [['Fmaj7'], ['Am7'], ['Bbmaj7'], ['C7sus', 'C7'], ['Fmaj7'], ['Dm7'], ['Gm7'], ['C7'],
      ['Bbmaj7'], ['Am7'], ['Gm7'], ['Fmaj7'], ['Bbmaj7'], ['A7'], ['Dm7', 'G7'], ['Gm7', 'C7']],
    mel: [
      [0, 0, 72, 0.5], [0, 0.5, 69, 0.5], [0, 1, 72, 1], [0, 2, 77, 1.5], [0, 3.5, 76, 0.5],
      [1, 0, 76, 1], [1, 1, 72, 0.5], [1, 1.5, 76, 0.5], [1, 2, 79, 1.5],
      [2, 0, 77, 0.5], [2, 0.5, 74, 0.5], [2, 1, 77, 1], [2, 2, 81, 1], [2, 3, 79, 0.5], [2, 3.5, 77, 0.5],
      [3, 0, 79, 1.5], [3, 1.5, 77, 0.5], [3, 2, 76, 2],
      [4, 0, 72, 0.5], [4, 0.5, 69, 0.5], [4, 1, 72, 1], [4, 2, 81, 1.5], [4, 3.5, 79, 0.5],
      [5, 0, 77, 1], [5, 1, 76, 0.5], [5, 1.5, 74, 0.5], [5, 2, 69, 1], [5, 3, 72, 1],
      [6, 0, 70, 1], [6, 1, 74, 0.5], [6, 1.5, 77, 0.5], [6, 2, 81, 1], [6, 3, 79, 0.5], [6, 3.5, 77, 0.5],
      [7, 0, 76, 1.5], [7, 1.5, 74, 0.5], [7, 2, 72, 1], [7, 3, 70, 0.5], [7, 3.5, 67, 0.5],
      [8, 0, 74, 1], [8, 1, 77, 1], [8, 2, 81, 2],
      [9, 0, 79, 1], [9, 1, 76, 1], [9, 2, 72, 2],
      [10, 0, 77, 0.5], [10, 0.5, 79, 0.5], [10, 1, 77, 0.5], [10, 1.5, 74, 0.5], [10, 2, 70, 2],
      [11, 0, 69, 1], [11, 1, 72, 1], [11, 2, 76, 1], [11, 3, 77, 1],
      [12, 0, 74, 1], [12, 1, 77, 1], [12, 2, 81, 1.5], [12, 3.5, 82, 0.5],
      [13, 0, 81, 1], [13, 1, 79, 0.5], [13, 1.5, 76, 0.5], [13, 2, 73, 2],
      [14, 0, 74, 1], [14, 1, 77, 1], [14, 2, 71, 1], [14, 3, 74, 1],
      [15, 0, 70, 1], [15, 1, 69, 1], [15, 2, 67, 0.5], [15, 2.5, 69, 0.5], [15, 3, 70, 0.5], [15, 3.5, 71, 0.5],
    ],
  });
  const catchT = loopTrack({
    bpm: 116, swing: 0.55, vol: 0.5, lead: 'marimba', leadVol: 0.17, comp: 'ep', compVol: 0.8, bass: 'bounce', drums: 'shaker',
    second: { inst: 'glock', shift: 12, vol: 0.35 },
    V: { C: [52, 55, 60], Am7: [55, 60, 64], Dm7: [53, 57, 60], G7: [53, 59, 62], A7: [55, 61, 64] },
    R: { C: 48, Am7: 45, Dm7: 50, G7: 43, A7: 45 },
    bars: [['C'], ['Am7'], ['Dm7'], ['G7'], ['C'], ['A7'], ['Dm7'], ['G7']],
    mel: [
      [0, 0, 76, 0.5], [0, 0.5, 79, 0.5], [0, 1, 84, 0.5], [0, 1.5, 79, 0.5], [0, 2, 76, 1], [0, 3, 72, 0.5], [0, 3.5, 74, 0.5],
      [1, 0, 76, 0.5], [1, 0.5, 81, 0.5], [1, 1, 84, 0.5], [1, 1.5, 81, 0.5], [1, 2, 79, 1], [1, 3, 76, 1],
      [2, 0, 77, 0.5], [2, 0.5, 81, 0.5], [2, 1, 86, 0.5], [2, 1.5, 81, 0.5], [2, 2, 77, 1], [2, 3, 74, 0.5], [2, 3.5, 76, 0.5],
      [3, 0, 77, 1], [3, 1, 74, 0.5], [3, 1.5, 71, 0.5], [3, 2, 67, 1],
      [4, 0, 76, 0.5], [4, 0.5, 79, 0.5], [4, 1, 84, 0.5], [4, 1.5, 79, 0.5], [4, 2, 76, 1], [4, 3, 79, 1],
      [5, 0, 76, 0.5], [5, 0.5, 81, 0.5], [5, 1, 85, 0.5], [5, 1.5, 81, 0.5], [5, 2, 79, 1], [5, 3, 76, 1],
      [6, 0, 74, 0.5], [6, 0.5, 76, 0.5], [6, 1, 77, 0.5], [6, 1.5, 81, 0.5], [6, 2, 84, 1], [6, 3, 81, 1],
      [7, 0, 83, 0.5], [7, 0.5, 81, 0.5], [7, 1, 79, 0.5], [7, 1.5, 77, 0.5], [7, 2, 74, 0.5], [7, 2.5, 71, 0.5], [7, 3, 67, 1],
    ],
  });
  const whip = loopTrack({
    bpm: 132, vol: 0.45, lead: 'pulse', leadVol: 0.07, comp: 'ep', compVol: 0.7, bass: 'sports', drums: 'sports',
    second: { inst: 'glock', shift: 12, vol: 0.9 },
    V: { Em7: [55, 59, 62], Am7: [55, 60, 64], D7: [54, 60, 64], Gmaj7: [54, 59, 62], Cmaj7: [52, 55, 59], 'F#m7b5': [52, 57, 60], B7: [51, 57, 61] },
    R: { Em7: 40, Am7: 45, D7: 38, Gmaj7: 43, Cmaj7: 48, 'F#m7b5': 42, B7: 47 },
    bars: [['Em7'], ['Am7'], ['D7'], ['Gmaj7'], ['Cmaj7'], ['F#m7b5', 'B7'], ['Em7'], ['B7']],
    mel: [
      [0, 0, 71, 0.5], [0, 0.5, 76, 0.5], [0, 1, 79, 0.5], [0, 1.5, 83, 0.5], [0, 2, 81, 0.5], [0, 2.5, 79, 0.5], [0, 3, 76, 1],
      [1, 0, 72, 0.5], [1, 0.5, 76, 0.5], [1, 1, 81, 0.5], [1, 1.5, 84, 0.5], [1, 2, 83, 0.5], [1, 2.5, 81, 0.5], [1, 3, 76, 1],
      [2, 0, 78, 0.5], [2, 0.5, 81, 0.5], [2, 1, 84, 1], [2, 2, 81, 0.5], [2, 2.5, 78, 0.5], [2, 3, 74, 1],
      [3, 0, 79, 1.5], [3, 1.5, 78, 0.5], [3, 2, 74, 2],
      [4, 0, 76, 0.5], [4, 0.5, 79, 0.5], [4, 1, 83, 1], [4, 2, 79, 0.5], [4, 2.5, 76, 0.5], [4, 3, 72, 1],
      [5, 0, 81, 0.5], [5, 0.5, 78, 0.5], [5, 1, 84, 1], [5, 2, 87, 0.5], [5, 2.5, 83, 0.5], [5, 3, 78, 0.5], [5, 3.5, 81, 0.5],
      [6, 0, 79, 1], [6, 1, 83, 1], [6, 2, 88, 1], [6, 3, 86, 0.5], [6, 3.5, 83, 0.5],
      [7, 0, 81, 0.5], [7, 0.5, 78, 0.5], [7, 1, 75, 0.5], [7, 1.5, 71, 0.5], [7, 2, 78, 1], [7, 3, 75, 0.5], [7, 3.5, 78, 0.5],
    ],
  });
  const boss = loopTrack({
    bpm: 156, vol: 0.5, lead: 'lead', leadVol: 0.06, leadShift: -12, comp: 'arp16', bass: 'pump', drums: 'boss',
    second: { inst: 'lead', shift: 0, vol: 0.45 }, // second time round the tune is doubled an octave up
    V: { Am: [57, 60, 64], F: [57, 60, 65], G: [55, 59, 62], E7: [56, 59, 62, 64], Dm: [57, 62, 65] },
    R: { Am: 45, F: 41, G: 43, E7: 40, Dm: 38 },
    bars: [['Am'], ['F'], ['G'], ['E7'], ['Am'], ['F'], ['Dm'], ['E7']],
    mel: [
      [0, 0, 81, 1.5], [0, 1.5, 76, 0.5], [0, 2, 81, 0.5], [0, 2.5, 83, 0.5], [0, 3, 84, 1],
      [1, 0, 84, 0.5], [1, 0.5, 83, 0.5], [1, 1, 81, 1], [1, 2, 77, 1], [1, 3, 81, 1],
      [2, 0, 83, 1.5], [2, 1.5, 79, 0.5], [2, 2, 86, 1], [2, 3, 83, 1],
      [3, 0, 80, 1], [3, 1, 83, 1], [3, 2, 88, 1.5], [3, 3.5, 86, 0.5],
      [4, 0, 84, 1], [4, 1, 83, 0.5], [4, 1.5, 81, 0.5], [4, 2, 88, 1.5], [4, 3.5, 84, 0.5],
      [5, 0, 81, 1], [5, 1, 84, 1], [5, 2, 89, 1], [5, 3, 88, 0.5], [5, 3.5, 84, 0.5],
      [6, 0, 86, 1], [6, 1, 84, 0.5], [6, 1.5, 81, 0.5], [6, 2, 77, 1], [6, 3, 81, 1],
      [7, 0, 83, 0.5], [7, 0.5, 80, 0.5], [7, 1, 76, 0.5], [7, 1.5, 80, 0.5], [7, 2, 83, 0.5], [7, 2.5, 86, 0.5], [7, 3, 88, 1],
    ],
  });

  // ---------------- "Happy Birthday", jazz waltz ----------------
  const BV = { // rootless voicings
    Cmaj9: [52, 55, 59, 62], A7b9: [49, 53, 55, 58], Dm9: [53, 57, 60, 64], G13: [53, 57, 59, 64], G7alt: [53, 56, 59, 63],
    G7b9: [53, 56, 59, 62], G9sus: [53, 57, 60, 62], Gm9: [53, 57, 58, 62], C13b9: [52, 57, 58, 61], Fmaj9: [52, 55, 57, 60],
    Bm7b5: [57, 62, 65], E7b9: [50, 53, 56, 59], Am9: [55, 59, 60, 64], D9: [54, 57, 60, 64], Abmaj9: [55, 58, 60, 63], Dbmaj7s11: [56, 60, 65, 67],
  };
  const BR = { Cmaj9: 36, A7b9: 45, Dm9: 38, G13: 43, G7alt: 43, G7b9: 43, G9sus: 43, Gm9: 43, C13b9: 36, Fmaj9: 41,
    Bm7b5: 47, E7b9: 40, Am9: 45, D9: 38, Abmaj9: 44, Dbmaj7s11: 37 };
  const TONES = { Dm9: [2, 5, 9, 0, 4], G13: [7, 11, 2, 5, 4], G7b9: [7, 11, 2, 5, 8], G7alt: [7, 11, 5, 8, 3], G9sus: [7, 0, 2, 5, 9], Cmaj9: [0, 4, 7, 11, 2],
    Gm9: [7, 10, 2, 5, 9], C13b9: [0, 4, 7, 10, 1, 9], Fmaj9: [5, 9, 0, 4, 7], Bm7b5: [11, 2, 5, 9], E7b9: [4, 8, 11, 2, 5], Am9: [9, 0, 4, 7, 11],
    D9: [2, 6, 9, 0, 4], Abmaj9: [8, 0, 3, 7, 10], Dbmaj7s11: [1, 5, 8, 0, 7], A7b9: [9, 1, 4, 7, 10] };
  const SCALES = { Dm9: [2, 4, 5, 7, 9, 11, 0], G13: [7, 9, 11, 0, 2, 4, 5], G7b9: [7, 8, 10, 11, 1, 2, 4, 5], G7alt: [7, 8, 10, 11, 1, 3, 5],
    G9sus: [7, 9, 0, 2, 4, 5], Cmaj9: [0, 2, 4, 7, 9, 11], Gm9: [7, 9, 10, 0, 2, 4, 5], C13b9: [0, 1, 3, 4, 6, 7, 9, 10], Fmaj9: [5, 7, 9, 11, 0, 2, 4],
    Bm7b5: [11, 0, 2, 4, 5, 7, 9], E7b9: [4, 5, 8, 9, 11, 0, 2], Am9: [9, 11, 0, 2, 4, 6, 7], D9: [2, 4, 6, 7, 9, 11, 0], Abmaj9: [8, 10, 0, 2, 3, 5, 7],
    Dbmaj7s11: [1, 3, 5, 7, 8, 10, 0], A7b9: [9, 10, 1, 2, 4, 5, 7] };
  const FORM = [ // one 12-bar chorus in 3/4: the tune (8 bars) and a 4-bar turnaround back to the top
    ['Dm9'], ['G13', 'G13', 'G7b9'], ['G9sus'], ['Cmaj9', 'Gm9', 'C13b9'], ['Fmaj9'], ['Bm7b5', 'Bm7b5', 'E7b9'], ['Am9', 'D9', 'G13'], ['Abmaj9'],
    ['Dbmaj7s11'], ['Cmaj9'], ['A7b9'], ['Dm9', 'G13', 'G7alt'],
  ];
  const HEAD = [ // [beat in chorus, midi, beats, velocity]
    [0, 69, 1, 0.9], [1, 67, 1, 0.8], [2, 72, 1, 0.9], [3, 71, 2, 0.9], [5, 67, 0.62, 0.8], [5.667, 67, 0.3, 0.65],
    [6, 69, 1, 0.9], [7, 67, 1, 0.8], [8, 74, 1, 0.9], [9, 72, 2, 0.9], [11, 67, 0.62, 0.8], [11.667, 67, 0.3, 0.65], [11.9, 78, 0.1, 0.35],
    [12, 79, 1, 1], [13, 76, 1, 0.85], [14, 72, 1, 0.85], [15, 71, 1, 0.9], [16, 69, 1, 0.85], [17, 77, 0.62, 0.85], [17.667, 77, 0.3, 0.7],
    [18, 76, 1, 0.9], [19, 72, 1, 0.85], [20, 74, 1, 0.9], [21, 72, 3, 1],
  ];
  const TAIL = [ // the turnaround fills after "…to you"
    [24.667, 75, 0.33, 0.5], [25, 74, 0.67, 0.55], [25.667, 72, 1.3, 0.6],
    [27.667, 71, 0.3, 0.45], [28, 74, 0.6, 0.5], [28.667, 76, 0.3, 0.5], [29, 79, 1, 0.55],
    [30, 77, 1.5, 0.55], [31.667, 76, 0.33, 0.5], [32, 73, 1, 0.55],
    [33, 74, 1, 0.5], [34, 71, 0.9, 0.5],
  ];
  const PICKUP = [[35, 67, 0.62, 0.8], [35.667, 67, 0.3, 0.65]];
  const EMB = []; // the second head: little blue grace notes from below
  for (const ev of HEAD) { EMB.push(ev); if (ev[2] >= 1) EMB.push([ev[0] - 0.12, ev[1] - 1, 0.12, 0.35]); }
  // the order of choruses (it starts in the turnaround of the last one, which works as an intro)
  const CYCLE = ['soft', 'head', 'emb', 'vibesSolo', 'fluteSolo', 'octaves'];
  const isHead = (k) => k === 'soft' || k === 'head' || k === 'emb' || k === 'octaves';
  const RHY = [
    [[0, 1], [1, 0.667], [1.667, 0.333], [2, 1]],
    [[0, 0.667], [0.667, 0.333], [1, 0.667], [1.667, 0.333], [2, 1]],
    [[0.667, 0.333], [1, 1], [2, 0.667], [2.667, 0.333]],
    [[0, 1.5], [1.667, 0.333], [2, 1]],
    [[0, 0.667], [0.667, 0.333], [1, 0.667], [1.667, 0.333], [2, 0.667], [2.667, 0.333]],
    [[0, 0.667], [0.667, 0.333], [1, 2]],
  ];
  const BREATH = [[[0, 2]], [[0, 1], [1, 1.4]], [[0, 0.667], [0.667, 0.333], [1, 1.4]]];
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const birthday = {
    bpm: 132, meter: 3, vol: 0.95, startBar: 9,
    render(ctx, dest, g, t, B, st) {
      const c = Math.floor(g / 12), bar = g % 12, kind = CYCLE[c % CYCLE.length], next = CYCLE[(c + 1) % CYCLE.length];
      const at = (b) => t + b * B, b0 = bar * 3;
      const chordAt = (b, beat) => { const x = FORM[b]; return x.length === 1 ? x[0] : x[beat]; };
      const walking = kind !== 'soft' && kind !== 'head';
      // comping: a hit on each chord change, plus the swung "and of two" when the chord holds all bar
      for (let beat = 0; beat < 3; beat++) {
        const ch = chordAt(bar, beat);
        if (beat > 0 && ch === chordAt(bar, beat - 1)) continue;
        let len = 1; while (beat + len < 3 && chordAt(bar, beat + len) === ch) len++;
        for (const m of BV[ch]) voice(ctx, dest, m, at(beat), (len === 3 ? 1.4 : len * 0.9) * B, 0.04, INST.ep);
        if (len === 3) for (const m of BV[ch]) voice(ctx, dest, m, at(1.667), B * 0.8, 0.028, INST.ep);
      }
      // bass: roots on the changes, a fifth or chord tone in between, a half-step lead-in to the next bar
      const nextRoot = BR[chordAt((bar + 1) % 12, 0)];
      for (let beat = 0; beat < 3; beat++) {
        if (!walking && beat === 1) continue;
        const ch = chordAt(bar, beat), r = BR[ch], changed = beat === 0 || ch !== chordAt(bar, beat - 1);
        let m;
        if (beat === 2 && !(changed && r !== BR[chordAt(bar, 1)])) m = nextRoot + (nextRoot + 1 === r ? -1 : 1);
        else if (changed) m = r;
        else m = r + 7 <= 50 ? r + 7 : r - 5;
        voice(ctx, dest, m, at(beat), B * (!walking && beat === 0 ? 1.9 : 0.9), 0.17, INST.pbass);
      }
      // drums: brushes for the quiet heads, ride cymbal once it gets going
      if (kind === 'soft') { drum(ctx, dest, 'brush', at(0), 0.8); drum(ctx, dest, 'chick', at(1)); drum(ctx, dest, 'chick', at(2)); }
      else {
        const rv = kind === 'head' ? 0.7 : 1;
        for (const [b, v] of [[0, 1], [1, 0.65], [1.667, 0.5], [2, 0.65]]) drum(ctx, dest, 'ride', at(b), v * rv);
        drum(ctx, dest, 'chick', at(1)); drum(ctx, dest, 'chick', at(2));
        if (kind !== 'head' && bar % 2 === 1) drum(ctx, dest, 'rim', at(2.667), 0.5);
      }
      // melody
      const play = (list, inst, vel, shift = 0) => {
        for (const [b, m, d, v] of list) if (b >= b0 && b < b0 + 3) voice(ctx, dest, m + shift, at(b - b0), d * B, vel * v, INST[inst]);
      };
      if (isHead(kind)) {
        const vel = kind === 'soft' ? 0.15 : 0.2;
        play(kind === 'emb' ? EMB : HEAD, 'vibes', vel);
        if (kind === 'emb') play(HEAD, 'ep', 0.07, -12);
        if (kind === 'octaves') { play(HEAD, 'flute', 0.07, 12); }
        play(TAIL, 'vibes', vel);
      } else if (bar <= 10 || bar === 11) { // improvised solo (vibes or flute), fresh every time round
        if (!st.solo || st.solo.c !== c) st.solo = { c, rnd: mulberry(c * 7919 + 17), p: kind === 'fluteSolo' ? 79 : 76, dir: 1 };
        const S = st.solo, lo = kind === 'fluteSolo' ? 72 : 67, hi = kind === 'fluteSolo' ? 89 : 86;
        let pat = (bar === 3 || bar === 7) ? BREATH[Math.floor(S.rnd() * BREATH.length)] : RHY[Math.floor(S.rnd() * RHY.length)];
        if (bar === 10) pat = [[0, 0.667], [0.667, 0.333], [1, 1.9]];
        if (bar === 11) pat = isHead(next) ? [[0, 1.5]] : [[0, 1], [1, 0.667], [1.667, 0.333]];
        for (const [b, d] of pat) {
          const ch = chordAt(bar, Math.floor(b)), strong = Math.abs(b - Math.round(b)) < 0.01, pool = strong ? TONES[ch] : SCALES[ch];
          let best = S.p, score = -1e9;
          for (let m = lo; m <= hi; m++) {
            if (!pool.includes(pc(m))) continue;
            const iv = m - S.p;
            if (iv === 0 && S.rnd() < 0.85) continue;
            const s = -Math.abs(Math.abs(iv) - (strong ? 3 : 1.5)) + (Math.sign(iv) === S.dir ? 1.5 : 0) + S.rnd() * 1.6 - (Math.abs(iv) > 7 ? 6 : 0);
            if (s > score) { score = s; best = m; }
          }
          S.p = best;
          if (best >= hi - 2) S.dir = -1; else if (best <= lo + 2) S.dir = 1; else if (S.rnd() < 0.22) S.dir = -S.dir;
          const v = (strong ? 0.75 : 0.85) * (d < 0.4 ? 0.8 : 1);
          voice(ctx, dest, best, at(b), d * B, (kind === 'fluteSolo' ? 0.11 : 0.18) * v, INST[kind === 'fluteSolo' ? 'flute' : 'vibes']);
        }
      }
      // "hap-py…" into the next chorus when it's the tune again
      if (bar === 11 && isHead(next)) play(PICKUP, 'vibes', next === 'soft' ? 0.15 : 0.2);
    },
  };

  const tracks = { room, catch: catchT, whip, boss, birthday };
  // render a track straight into a context (for offline previews / tests)
  function offline(ctx, dest, name, start, seconds) {
    const tr = tracks[name], B = 60 / tr.bpm, st = {};
    let t = start, g = tr.startBar || 0;
    while (t < start + seconds) { tr.render(ctx, dest, g, t, B, st); t += B * tr.meter; g++; }
    return t - start;
  }
  return { tracks, offline, drum, voice, INST };
})();
