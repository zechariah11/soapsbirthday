/* Background music, synthesised with Web Audio (no audio files).
   Every track renders one bar at a time, so the game's scheduler can loop it forever without a seam:
   the last bar of each track is written to lead straight back into the first.

   room     – calm, Animal Crossing-ish (kalimba, electric piano, plucky bass, shaker)   F major, 92 bpm
   catch    – bouncy marimba tune for the strawberry catch                              C major, 116 bpm
   oven     – cosy music-box tune while the sponges bake                               Bb major, 100 bpm
   whip     – bright, sporty race theme for the whipping battle                         G major, 132 bpm
   icing    – dreamy, sparkly vibraphone tune for icing the cake                        D major, 96 bpm
   boss     – villain riff → verse → build → heroic chorus → cheeky breakdown            D minor, 168 bpm
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
      case 'tom': {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(95, t + 0.16);
        g.gain.setValueAtTime(0.32 * vol, t); g.gain.setTargetAtTime(0, t + 0.01, 0.08);
        o.connect(g).connect(dest); o.start(t); o.stop(t + 0.5);
        break;
      }
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
  const whip = loopTrack({ // bright and sporty, in G major
    bpm: 132, vol: 0.45, lead: 'pulse', leadVol: 0.07, comp: 'ep', compVol: 0.7, bass: 'sports', drums: 'sports',
    second: { inst: 'glock', shift: 12, vol: 0.9 },
    V: { G: [55, 59, 62], C: [55, 60, 64], Am7: [55, 60, 64], D7: [54, 57, 60], A7: [55, 61, 64], D: [54, 57, 62] },
    R: { G: 43, C: 48, Am7: 45, D7: 38, A7: 45, D: 38 },
    bars: [['G'], ['C'], ['Am7', 'D7'], ['G'], ['C'], ['A7'], ['D'], ['D7']],
    mel: [
      [0, 0, 74, 0.5], [0, 0.5, 79, 0.5], [0, 1, 83, 0.5], [0, 1.5, 79, 0.5], [0, 2, 86, 1], [0, 3, 83, 0.5], [0, 3.5, 81, 0.5],
      [1, 0, 79, 0.5], [1, 0.5, 76, 0.5], [1, 1, 79, 0.5], [1, 1.5, 84, 0.5], [1, 2, 88, 1], [1, 3, 84, 1],
      [2, 0, 81, 0.5], [2, 0.5, 83, 0.5], [2, 1, 84, 1], [2, 2, 81, 0.5], [2, 2.5, 78, 0.5], [2, 3, 74, 0.5], [2, 3.5, 78, 0.5],
      [3, 0, 79, 1.5], [3, 1.5, 74, 0.5], [3, 2, 79, 0.5], [3, 2.5, 81, 0.5], [3, 3, 83, 1],
      [4, 0, 84, 0.5], [4, 0.5, 83, 0.5], [4, 1, 84, 0.5], [4, 1.5, 88, 0.5], [4, 2, 79, 1], [4, 3, 76, 1],
      [5, 0, 76, 0.5], [5, 0.5, 81, 0.5], [5, 1, 85, 1], [5, 2, 81, 0.5], [5, 2.5, 79, 0.5], [5, 3, 76, 1],
      [6, 0, 78, 0.5], [6, 0.5, 81, 0.5], [6, 1, 86, 1], [6, 2, 81, 0.5], [6, 2.5, 78, 0.5], [6, 3, 74, 1],
      [7, 0, 84, 0.5], [7, 0.5, 83, 0.5], [7, 1, 81, 0.5], [7, 1.5, 78, 0.5], [7, 2, 74, 0.5], [7, 2.5, 76, 0.5], [7, 3, 78, 0.5], [7, 3.5, 81, 0.5],
    ],
  });
  const oven = loopTrack({ // cosy music-box tune while the sponges bake, in Bb major
    bpm: 100, swing: 0.6, vol: 0.5, lead: 'glock', leadVol: 0.15, comp: 'ep', compVol: 0.8, bass: 'bounce', drums: 'shaker',
    second: { inst: 'kalimba', shift: -12, vol: 0.7 },
    V: { Bbmaj7: [57, 62, 65], Gm7: [58, 62, 65], Cm7: [58, 63, 67], F7: [57, 63, 67], Dm7: [57, 60, 65] },
    R: { Bbmaj7: 46, Gm7: 43, Cm7: 48, F7: 41, Dm7: 38 },
    bars: [['Bbmaj7'], ['Gm7'], ['Cm7'], ['F7'], ['Dm7'], ['Gm7'], ['Cm7'], ['F7']],
    mel: [
      [0, 0, 74, 1], [0, 1, 77, 0.5], [0, 1.5, 81, 0.5], [0, 2, 82, 1.5], [0, 3.5, 81, 0.5],
      [1, 0, 79, 1], [1, 1, 74, 1], [1, 2, 70, 1], [1, 3, 74, 1],
      [2, 0, 75, 0.5], [2, 0.5, 79, 0.5], [2, 1, 84, 1], [2, 2, 82, 1], [2, 3, 79, 1],
      [3, 0, 81, 1.5], [3, 1.5, 79, 0.5], [3, 2, 77, 1], [3, 3, 75, 1],
      [4, 0, 74, 0.5], [4, 0.5, 77, 0.5], [4, 1, 81, 1], [4, 2, 84, 1.5], [4, 3.5, 81, 0.5],
      [5, 0, 82, 1], [5, 1, 81, 0.5], [5, 1.5, 79, 0.5], [5, 2, 74, 2],
      [6, 0, 72, 0.5], [6, 0.5, 75, 0.5], [6, 1, 79, 0.5], [6, 1.5, 82, 0.5], [6, 2, 81, 1], [6, 3, 79, 1],
      [7, 0, 77, 1], [7, 1, 81, 0.5], [7, 1.5, 84, 0.5], [7, 2, 75, 1], [7, 3, 72, 1],
    ],
  });
  const icing = loopTrack({ // dreamy and sparkly for icing the cake, in D major
    bpm: 96, swing: 0.55, vol: 0.5, lead: 'vibes', leadVol: 0.15, comp: 'ep', compVol: 0.8, bass: 'bounce', drums: 'shaker',
    second: { inst: 'glock', shift: 12, vol: 0.4 },
    V: { Dmaj7: [57, 61, 66], Bm7: [57, 62, 66], Gmaj7: [54, 59, 62], A7: [55, 61, 64], 'F#m7': [57, 61, 64], Em7: [55, 59, 62] },
    R: { Dmaj7: 38, Bm7: 47, Gmaj7: 43, A7: 45, 'F#m7': 42, Em7: 40 },
    bars: [['Dmaj7'], ['Bm7'], ['Gmaj7'], ['A7'], ['F#m7'], ['Bm7'], ['Em7'], ['A7']],
    mel: [
      [0, 0, 78, 1], [0, 1, 81, 1], [0, 2, 85, 1.5], [0, 3.5, 81, 0.5],
      [1, 0, 83, 1], [1, 1, 78, 0.5], [1, 1.5, 74, 0.5], [1, 2, 78, 2],
      [2, 0, 79, 0.5], [2, 0.5, 83, 0.5], [2, 1, 86, 1], [2, 2, 83, 1], [2, 3, 78, 1],
      [3, 0, 76, 1], [3, 1, 79, 1], [3, 2, 85, 1], [3, 3, 81, 1],
      [4, 0, 85, 1], [4, 1, 81, 0.5], [4, 1.5, 78, 0.5], [4, 2, 76, 2],
      [5, 0, 86, 1], [5, 1, 85, 0.5], [5, 1.5, 83, 0.5], [5, 2, 78, 1], [5, 3, 81, 1],
      [6, 0, 79, 0.5], [6, 0.5, 83, 0.5], [6, 1, 88, 1], [6, 2, 86, 1], [6, 3, 83, 1],
      [7, 0, 81, 1], [7, 1, 79, 0.5], [7, 1.5, 76, 0.5], [7, 2, 73, 1], [7, 3, 76, 1],
    ],
  });
  // ---------------- the cake monster battle: a 28-bar piece in D minor, 168 bpm ----------------
  // riff (4) → verse (8) → build (4) → heroic chorus (8) → cheeky breakdown (4), which fills back into the riff
  const BV2 = { Dm: [62, 65, 69], Bb: [62, 65, 70], Gm: [62, 67, 70], A7: [61, 64, 67], C: [60, 64, 67], F: [60, 65, 69], Cdim: [61, 64, 67, 70] };
  const BR2 = { Dm: 38, Bb: 46, Gm: 43, A7: 45, C: 48, F: 41, Cdim: 49 };
  const BOSS_BARS = [
    ['riff', ['Dm']], ['riff', ['Bb']], ['riff', ['Gm']], ['riff', ['A7']],
    ['verse', ['Dm']], ['verse', ['Bb']], ['verse', ['Gm']], ['verse', ['A7']], ['verse', ['Dm']], ['verse', ['Bb']], ['verse', ['Gm', 'A7']], ['verse', ['Dm']],
    ['build', ['Bb']], ['build', ['C']], ['build', ['Cdim']], ['build', ['A7']],
    ['chorus', ['F']], ['chorus', ['C']], ['chorus', ['Dm']], ['chorus', ['Bb']], ['chorus', ['F']], ['chorus', ['C']], ['chorus', ['Bb']], ['chorus', ['A7']],
    ['down', ['Dm']], ['down', ['Bb']], ['down', ['Gm']], ['down', ['A7']],
  ];
  const G3 = (b) => [[b, 0.5], [b + 0.5, 0.25], [b + 0.75, 0.25]]; // the gallop: da-da-dum
  const RIFF = [ // [bar, beat, midi, beats] (bass plays it as written, the lead two octaves up)
    ...G3(0).map(([b, d]) => [0, b, 50, d]), [0, 1, 53, 0.5], [0, 1.5, 50, 0.5], [0, 2, 52, 0.5], [0, 2.5, 50, 0.5], [0, 3, 49, 0.5], [0, 3.5, 50, 0.5],
    ...G3(0).map(([b, d]) => [1, b, 46, d]), [1, 1, 50, 0.5], [1, 1.5, 46, 0.5], [1, 2, 48, 0.5], [1, 2.5, 46, 0.5], [1, 3, 45, 1],
    ...G3(0).map(([b, d]) => [2, b, 43, d]), [2, 1, 46, 0.5], [2, 1.5, 43, 0.5], [2, 2, 45, 0.5], [2, 2.5, 43, 0.5], [2, 3, 41, 0.5], [2, 3.5, 40, 0.5],
    ...G3(0).map(([b, d]) => [3, b, 45, d]), [3, 1, 49, 0.5], [3, 1.5, 52, 0.5], [3, 2, 55, 0.5], [3, 2.5, 52, 0.5], [3, 3, 49, 0.5], [3, 3.5, 52, 0.5],
  ];
  const VERSE = [
    [0, 0, 69, 1], [0, 1, 74, 0.5], [0, 1.5, 76, 0.5], [0, 2, 77, 1], [0, 3, 76, 0.5], [0, 3.5, 74, 0.5],
    [1, 0, 74, 1.5], [1, 1.5, 70, 0.5], [1, 2, 77, 1.5], [1, 3.5, 74, 0.5],
    [2, 0, 79, 1], [2, 1, 77, 0.5], [2, 1.5, 76, 0.5], [2, 2, 74, 1], [2, 3, 70, 1],
    [3, 0, 69, 0.5], [3, 0.5, 73, 0.5], [3, 1, 76, 0.5], [3, 1.5, 79, 0.5], [3, 2, 81, 1.5], [3, 3.5, 79, 0.5],
    [4, 0, 77, 1], [4, 1, 76, 0.5], [4, 1.5, 74, 0.5], [4, 2, 81, 1], [4, 3, 77, 1],
    [5, 0, 77, 0.5], [5, 0.5, 79, 0.5], [5, 1, 77, 0.5], [5, 1.5, 74, 0.5], [5, 2, 82, 1.5], [5, 3.5, 81, 0.5],
    [6, 0, 79, 1], [6, 1, 82, 1], [6, 2, 81, 0.5], [6, 2.5, 79, 0.5], [6, 3, 76, 0.5], [6, 3.5, 73, 0.5],
    [7, 0, 74, 1.5], [7, 1.5, 69, 0.5], [7, 2, 74, 0.5], [7, 2.5, 76, 0.5], [7, 3, 77, 1],
  ];
  const CHORUS = [
    [0, 0, 72, 0.5], [0, 0.5, 77, 0.5], [0, 1, 81, 1], [0, 2, 84, 1.5], [0, 3.5, 81, 0.5],
    [1, 0, 79, 1.5], [1, 1.5, 76, 0.5], [1, 2, 79, 0.5], [1, 2.5, 81, 0.5], [1, 3, 79, 1],
    [2, 0, 77, 1], [2, 1, 81, 1], [2, 2, 86, 1.5], [2, 3.5, 84, 0.5],
    [3, 0, 82, 1.5], [3, 1.5, 81, 0.5], [3, 2, 77, 1], [3, 3, 74, 1],
    [4, 0, 72, 0.5], [4, 0.5, 77, 0.5], [4, 1, 81, 1], [4, 2, 84, 1.5], [4, 3.5, 86, 0.5],
    [5, 0, 88, 1.5], [5, 1.5, 86, 0.5], [5, 2, 84, 1], [5, 3, 79, 1],
    [6, 0, 86, 1], [6, 1, 82, 1], [6, 2, 77, 0.5], [6, 2.5, 79, 0.5], [6, 3, 81, 0.5], [6, 3.5, 82, 0.5],
    [7, 0, 81, 2], [7, 2, 76, 0.5], [7, 2.5, 79, 0.5], [7, 3, 85, 0.5], [7, 3.5, 88, 0.5],
  ];
  const TAUNT = [ // the cake, gloating, on a glockenspiel
    [0, 0, 86, 0.5], [0, 0.5, 81, 0.5], [0, 1, 77, 0.5], [0, 1.5, 81, 0.5], [0, 2, 86, 1],
    [1, 0, 86, 0.5], [1, 0.5, 82, 0.5], [1, 1, 77, 0.5], [1, 1.5, 82, 0.5], [1, 2, 86, 1],
    [2, 0, 86, 0.5], [2, 0.5, 82, 0.5], [2, 1, 79, 0.5], [2, 1.5, 82, 0.5], [2, 2, 86, 1],
    [3, 0, 85, 0.5], [3, 0.5, 81, 0.5], [3, 1, 76, 0.5], [3, 1.5, 79, 0.5], [3, 2, 81, 0.5], [3, 2.5, 85, 0.5],
  ];
  const DMIN = [2, 4, 5, 7, 9, 10, 0, 1]; // D minor (with the C# of A7) for the brass harmony a third below
  const third = (m) => (DMIN.includes(pc(m - 4)) ? m - 4 : m - 3);
  INST.brass = { parts: [[1, 1, 'sawtooth'], [1.006, 0.7, 'sawtooth']], attack: 0.01, decay: 0.35, sus: 0.55, lp: 2400 };
  INST.stab = { parts: [[1, 1, 'sawtooth'], [1.008, 0.8, 'sawtooth']], attack: 0.003, decay: 0.09, sus: 0, lp: 3000 };
  INST.saw = { parts: [[1, 1, 'sawtooth'], [0.5, 0.6, 'square']], attack: 0.003, decay: 0.11, sus: 0.35, lp: 950 };
  const boss = {
    bpm: 168, meter: 4, vol: 0.5, startBar: 0,
    render(ctx, dest, g, t, B) {
      const bar = g % BOSS_BARS.length, [sec, chords] = BOSS_BARS[bar], at = (b) => t + b * B;
      const ch = (beat) => chords[Math.min(chords.length - 1, Math.floor((beat * chords.length) / 4))];
      const D = (k, b, v) => drum(ctx, dest, k, at(b), v);
      const pick = (list, first) => list.filter((e) => e[0] === bar - first);
      if (sec === 'riff') { // the villain riff, bass and lead in octaves, with brass stabs
        for (const [, b, m, d] of pick(RIFF, 0)) {
          voice(ctx, dest, m, at(b), d * B * 0.9, 0.11, INST.saw);
          voice(ctx, dest, m + 24, at(b), d * B * 0.9, 0.045, INST.lead);
        }
        for (const b of [0, 2.5]) for (const m of BV2[ch(b)]) voice(ctx, dest, m, at(b), B * 0.3, 0.035, INST.stab);
        D('kick', 0); D('kick', 0.75, 0.7); D('kick', 2); D('kick', 2.75, 0.7); D('snare', 1); D('snare', 3);
        for (let i = 0; i < 8; i++) D('hat', i / 2, i % 2 ? 0.5 : 0.9);
        if (bar === 0) D('crash', 0);
      } else if (sec === 'verse') {
        for (const [, b, m, d] of pick(VERSE, 4)) voice(ctx, dest, m, at(b), d * B * 0.95, 0.06, INST.lead);
        for (let i = 0; i < 16; i++) { const vs = BV2[ch(i / 4)]; voice(ctx, dest, vs[[0, 1, 2, 1][i % 4]] + 12, at(i / 4), B * 0.22, i % 4 === 0 ? 0.026 : 0.017, INST.arp); }
        for (let b = 0; b < 4; b++) for (const [o, d] of [[0, 0.5], [0.5, 0.25], [0.75, 0.25]]) voice(ctx, dest, BR2[ch(b)] + (o ? 12 : 0), at(b + o), d * B, o ? 0.06 : 0.09, INST.saw);
        D('kick', 0); D('kick', 1.5, 0.7); D('kick', 2); D('snare', 1); D('snare', 3);
        for (let i = 0; i < 8; i++) D('hat', i / 2, i % 2 ? 0.5 : 0.9);
        if (bar === 4) D('crash', 0);
      } else if (sec === 'build') { // tension: tremolo notes climbing, snare roll
        const k = bar - 12, notes = [[74], [76], [76, 79], [81, 85, 88]][k];
        for (let i = 0; i < 16; i++) voice(ctx, dest, notes[k === 3 ? Math.min(2, i >> 2) : i % notes.length], at(i / 4), B * 0.22, 0.03 + k * 0.006, INST.lead);
        for (const m of BV2[ch(0)]) voice(ctx, dest, m, at(0), B * 3.8, 0.02, INST.brass);
        voice(ctx, dest, BR2[ch(0)], at(0), B * 1.9, 0.1, INST.saw); voice(ctx, dest, BR2[ch(0)], at(2), B * 1.9, 0.1, INST.saw);
        for (let b = 0; b < 4; b++) D('kick', b);
        if (k < 2) { D('snare', 1); D('snare', 3); }
        else if (k === 2) for (let i = 0; i < 8; i++) D('snare', i / 2, 0.45 + i * 0.05);
        else { for (let i = 0; i < 12; i++) D('snare', i / 4, 0.4 + i * 0.05); D('tom', 3, 0.9); D('tom', 3.25, 0.8); D('tom', 3.5, 0.7); D('tom', 3.75, 0.6); }
      } else if (sec === 'chorus') { // she's coming to the rescue: big tune, brass a third below, four on the floor
        for (const [, b, m, d] of pick(CHORUS, 16)) {
          voice(ctx, dest, m, at(b), d * B * 0.95, 0.065, INST.lead);
          voice(ctx, dest, third(m), at(b), d * B * 0.95, 0.03, INST.brass);
        }
        for (let i = 0; i < 16; i++) { const vs = BV2[ch(i / 4)]; voice(ctx, dest, vs[[0, 2, 1, 2][i % 4]] + 12, at(i / 4), B * 0.22, i % 4 === 0 ? 0.024 : 0.015, INST.arp); }
        for (let i = 0; i < 8; i++) voice(ctx, dest, BR2[ch(i / 2)] + (i % 2 ? 12 : 0), at(i / 2), B * 0.45, 0.085, INST.saw);
        for (let b = 0; b < 4; b++) D('kick', b);
        D('snare', 1); D('snare', 3); D('clap', 1, 0.8); D('clap', 3, 0.8);
        for (let i = 0; i < 4; i++) { D('ohat', i + 0.5, 0.8); D('hat', i, 0.6); }
        if (bar === 16 || bar === 20) D('crash', 0);
      } else { // breakdown: half-time, the cake gloats on a glockenspiel, then a fill back into the riff
        for (const [, b, m, d] of pick(TAUNT, 24)) voice(ctx, dest, m, at(b), d * B, 0.14, INST.glock);
        voice(ctx, dest, BR2[ch(0)], at(0), B * 3.6, 0.1, INST.saw);
        for (let i = 0; i < 8; i++) voice(ctx, dest, BR2[ch(0)] + 12, at(i / 2), B * 0.3, 0.025, INST.saw);
        D('kick', 0); D('snare', 2); D('hat', 1, 0.6); D('hat', 3, 0.6);
        if (bar === 27) { for (let i = 0; i < 4; i++) D('snare', 3 + i / 4, 0.5 + i * 0.12); D('tom', 3.5, 0.8); D('tom', 3.75, 0.9); }
      }
    },
  };

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

  const tracks = { room, catch: catchT, oven, whip, icing, boss, birthday };
  // render a track straight into a context (for offline previews / tests)
  function offline(ctx, dest, name, start, seconds) {
    const tr = tracks[name], B = 60 / tr.bpm, st = {};
    let t = start, g = tr.startBar || 0;
    while (t < start + seconds) { tr.render(ctx, dest, g, t, B, st); t += B * tr.meter; g++; }
    return t - start;
  }
  return { tracks, offline, drum, voice, INST };
})();
