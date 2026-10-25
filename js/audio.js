/* =========================================================
   音频引擎：所有声音都在浏览器里实时合成，没有用任何录音素材
   - 背景音乐（BGM）：E.play(曲风, 要打开的音轨)
   - 片段（试听、命运旋律、终章等）：E.playClip(fn)
     每次播放新片段，上一段会立刻停止；切换页面时也会停止
   ========================================================= */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 11;
const srand = s => { seed = s };
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 };

const E = {
  ctx: null, bus: {}, layers: {}, style: null, styleKey: null, step: 0, nextTime: 0, timer: null,
  tempoMul: 1, mood: { danger: 0, love: 1, orig: 1 }, muted: false, stopTok: 0,
  clipBus: null, clipTimers: [], clipDuck: false, onLayers: null
};
function makeIR(c, sec) {
  const len = c.sampleRate * sec, b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) }
  return b;
}
E.init = function () {
  if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return }
  const C = window.AudioContext || window.webkitAudioContext; const c = this.ctx = new C();
  this.out = c.createGain(); this.out.gain.value = .85;
  this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4;
  this.comp.connect(this.out); this.out.connect(c.destination);
  this.verb = c.createConvolver(); this.verb.buffer = makeIR(c, 2.8);
  const vg = c.createGain(); vg.gain.value = .4; this.verb.connect(vg); vg.connect(this.comp);
  /* 背景音乐通路：master → 低通滤波（危险时变闷）→ 闪避（播放片段时压低）→ 压缩 */
  this.master = c.createGain(); this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 18000;
  this.duckG = c.createGain(); this.master.connect(this.lp); this.lp.connect(this.duckG); this.duckG.connect(this.comp);
  /* 界面音效 */
  this.sfx = c.createGain(); this.sfx.gain.value = .7; this.sfx.connect(this.comp);
  const sv = c.createGain(); sv.gain.value = .2; this.sfx.connect(sv); sv.connect(this.verb);
  const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; this.noise = nb;
};
const now = () => E.ctx.currentTime;

/* ---------- 片段：可随时打断 ---------- */
E.stopClip = function () {
  this.clipTimers.forEach(clearTimeout); this.clipTimers = [];
  if (this.clipBus) {
    const g = this.clipBus; g.gain.cancelScheduledValues(now()); g.gain.setTargetAtTime(0, now(), .03);
    setTimeout(() => { try { g.disconnect() } catch (e) { } }, 300);
    this.clipBus = null;
  }
  if (this.clipDuck) { this.clipDuck = false; this.duck(1) }
};
/* fn(bus) 负责排好音符并返回时长（秒）；duckTo 是播放时背景音乐压到多低，0 表示完全停 */
E.playClip = function (fn, duckTo = .08, onEnd) {
  this.init(); this.stopClip();
  const c = this.ctx, g = c.createGain(); g.gain.value = 1; g.connect(this.comp);
  const s = c.createGain(); s.gain.value = .3; g.connect(s); s.connect(this.verb);
  this.clipBus = g;
  if (duckTo < 1) { this.clipDuck = true; this.duck(duckTo) }
  const d = fn(g) || 1;
  this.later(() => { if (this.clipBus === g) { this.clipBus = null; if (this.clipDuck) { this.clipDuck = false; this.duck(1) } } onEnd && onEnd() }, d * 1000);
  return d;
};
/* 和片段绑定的定时器：片段被打断时一起取消 */
E.later = function (f, ms) { const id = setTimeout(f, ms); this.clipTimers.push(id); return id };

/* ---------- 背景音乐 ---------- */
E.layerBus = function (n) {
  if (!this.bus[n]) { const g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.master); const s = this.ctx.createGain(); s.gain.value = .28; g.connect(s); s.connect(this.verb); this.bus[n] = g }
  return this.bus[n];
};
E.setLayer = function (n, on) {
  this.layers[n] = on; if (!this.ctx) return;
  this.layerBus(n).gain.setTargetAtTime(on ? 1 : 0, now(), on ? .6 : .25);
  this.onLayers && this.onLayers();
};
E.d16 = function () { return 60 / (this.style.bpm * this.tempoMul) / 4 };
E.play = function (key, on) {
  this.init(); this.stopTok++;
  if (this.styleKey !== key) { for (const n in this.bus) this.bus[n].gain.setTargetAtTime(0, now(), .1); this.layers = {} }
  this.style = STYLES[key]; this.styleKey = key;
  if (!this.timer) { this.step = 0; this.nextTime = now() + .08; this.timer = setInterval(() => this.tick(), 25) }
  for (const L of this.style.layers) this.setLayer(L.name, on.includes(L.name));
};
E.stop = function (fade = .6) {
  if (!this.ctx) return;
  for (const n in this.bus) this.bus[n].gain.setTargetAtTime(0, now(), fade / 3);
  const tok = ++this.stopTok;
  setTimeout(() => { if (tok === this.stopTok) { clearInterval(this.timer); this.timer = null; this.layers = {}; this.styleKey = null; this.onLayers && this.onLayers() } }, fade * 1000 + 200);
};
E.tick = function () { while (this.nextTime < now() + .12) { this.sched(this.step, this.nextTime); this.nextTime += this.d16(); this.step++ } };
E.sched = function (step, t) {
  const s = this.style, bar = Math.floor(step / 16), st = step % 16;
  const sw = (st % 2 === 1) ? s.swing * this.d16() * (this.mood.orig < .35 ? 0 : 1) : 0;
  for (const L of s.layers) if (this.layers[L.name]) L.play(st, bar, t + sw, this.layerBus(L.name), s, this);
};
E.nextBarTime = function () { const d = this.d16(); return this.nextTime + ((16 - (this.step % 16)) % 16) * d };
E.duck = function (v) { if (this.ctx) this.duckG.gain.setTargetAtTime(v, now(), .12) };
E.setMute = function (m) { this.muted = m; if (this.ctx) this.out.gain.setTargetAtTime(m ? 0 : .85, now(), .05) };
E.resetMood = function () { this.mood = { danger: 0, love: 1, orig: 1 }; this.tempoMul = 1; if (this.lp) this.lp.frequency.setTargetAtTime(18000, now(), .1) };

/* =========================================================
   乐器
   ========================================================= */
function tone(out, t, midi, dur, o = {}) {
  const c = E.ctx, { type = 'sine', gain = .2, att = .01, rel = .25, cut = 0, q = .7, detune = 0 } = o;
  const osc = c.createOscillator(); osc.type = type; osc.frequency.value = mtof(midi); osc.detune.value = detune;
  const g = c.createGain(); const hold = Math.max(dur, att + .005);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + att); g.gain.setTargetAtTime(0, t + hold, rel / 4);
  let n = osc; if (cut) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = q; osc.connect(f); n = f }
  n.connect(g); g.connect(out); osc.start(t); osc.stop(t + hold + rel * 1.5 + .05);
  return osc;
}
/* 钢琴：力度越大越亮 */
function keys(out, t, midi, dur, gain = .06, detune = 0) {
  tone(out, t, midi, dur, { type: 'sine', gain, att: .004, rel: .5, detune });
  tone(out, t, midi + 12, dur * .6, { type: 'triangle', gain: gain * (.12 + gain * 1.6), att: .003, rel: .3, detune });
  tone(out, t, midi, .04, { type: 'triangle', gain: gain * .5, att: .002, rel: .06, cut: 2500 + gain * 20000 });
}
function kick(out, t, g = .9, f0 = 150, f1 = 45, d = .35) { const c = E.ctx, o = c.createOscillator(), a = c.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + .12); a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(a); a.connect(out); o.start(t); o.stop(t + d + .05) }
function nhit(out, t, { g = .3, type = 'highpass', f = 7000, d = .05, q = .7 } = {}) { const c = E.ctx, s = c.createBufferSource(); s.buffer = E.noise; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const a = c.createGain(); a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(fl); fl.connect(a); a.connect(out); s.start(t, Math.random() * .5); s.stop(t + d + .05) }
function snare(out, t, g = .3) { nhit(out, t, { g, type: 'bandpass', f: 1900, d: .18, q: .8 }); tone(out, t, 55, .04, { type: 'triangle', gain: g * .6, rel: .08 }) }
function hat(out, t, g = .06, d = .04) { nhit(out, t, { g, f: 7500, d }) }
function shaker(out, t, g = .04) { nhit(out, t, { g, type: 'bandpass', f: 5500, d: .07, q: 1.5 }) }
/* 吉他拨弦 */
function guitar(out, t, midi, g = .07) { tone(out, t, midi, .02, { type: 'sawtooth', gain: g, att: .002, rel: .7, cut: 2000 }); tone(out, t, midi + 12, .02, { type: 'triangle', gain: g * .35, att: .002, rel: .35 }) }
/* 弦乐组：三把略微走音的琴叠在一起，加揉弦 */
function strings(out, t, midi, dur, g = .03, o = {}) {
  const c = E.ctx, { att = .5, rel = .9, cut = 2200 } = o;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = .5;
  const a = c.createGain(); const hold = Math.max(dur, att + .01);
  a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + att); a.gain.setTargetAtTime(0, t + hold, rel / 4);
  f.connect(a); a.connect(out);
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5 + Math.random() * .6; lg.gain.value = mtof(midi) * .0045; lfo.connect(lg);
  lfo.start(t); lfo.stop(t + hold + rel * 1.5 + .1);
  [-9, 0, 8].forEach(d => { const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = mtof(midi); o2.detune.value = d; lg.connect(o2.frequency); o2.connect(f); o2.start(t); o2.stop(t + hold + rel * 1.5 + .1) });
}
/* 圆号：慢起音，暗一点 */
function horn(out, t, midi, dur, g = .08) {
  const c = E.ctx, f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = .7;
  f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1300, t + .15);
  const a = c.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + .12); a.gain.setTargetAtTime(0, t + dur, .12);
  f.connect(a); a.connect(out);
  [-4, 4].forEach(d => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(midi); o.detune.value = d; o.connect(f); o.start(t); o.stop(t + dur + .8) });
}
/* 小号：起音时滤波快速打开，有“嘟”的感觉 */
function trumpet(out, t, midi, dur, g = .05) {
  const c = E.ctx, f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
  f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(3000, t + .05); f.frequency.exponentialRampToValueAtTime(1400, t + .2);
  const a = c.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + .02); a.gain.setTargetAtTime(0, t + dur, .06);
  f.connect(a); a.connect(out);
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(midi); o.connect(f); o.start(t); o.stop(t + dur + .5);
}
/* 竖琴 */
function harp(out, t, midi, g = .08) { tone(out, t, midi, .02, { type: 'triangle', gain: g, att: .002, rel: 1.6 }); tone(out, t, midi + 12, .02, { type: 'sine', gain: g * .35, att: .002, rel: 1 }) }
/* 定音鼓 */
function timp(out, t, midi = 43, g = .5, d = 1.2) {
  const c = E.ctx, o = c.createOscillator(), a = c.createGain();
  o.frequency.setValueAtTime(mtof(midi) * 1.04, t); o.frequency.exponentialRampToValueAtTime(mtof(midi), t + .08);
  a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(a); a.connect(out); o.start(t); o.stop(t + d + .05);
  nhit(out, t, { g: g * .25, type: 'lowpass', f: 400, d: .15 });
}
/* 长笛：正弦波加揉音和一点气声 */
function flute(out, t, midi, dur, g = .08) {
  const c = E.ctx, o = c.createOscillator(), a = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  o.type = 'sine'; o.frequency.value = mtof(midi); lfo.frequency.value = 5.2; lg.gain.value = mtof(midi) * .006; lfo.connect(lg); lg.connect(o.frequency);
  a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + .06); a.gain.setTargetAtTime(0, t + dur, .08);
  o.connect(a); a.connect(out); o.start(t); lfo.start(t); o.stop(t + dur + .6); lfo.stop(t + dur + .6);
  nhit(out, t, { g: g * .25, type: 'bandpass', f: mtof(midi) * 2, d: .08, q: 3 });
}
/* 颤音琴：带颤动的金属感 */
function vibes(out, t, midi, g = .05) {
  const c = E.ctx, a = c.createGain(), trem = c.createOscillator(), tg = c.createGain();
  trem.frequency.value = 5.5; tg.gain.value = .4; trem.connect(tg); tg.connect(a.gain);
  a.gain.setValueAtTime(g, t); a.gain.setTargetAtTime(0, t + .05, .5); a.connect(out);
  [[0, 1], [24, .15]].forEach(([iv, v]) => { const o = c.createOscillator(), og = c.createGain(); o.frequency.value = mtof(midi + iv); og.gain.value = v; o.connect(og); og.connect(a); o.start(t); o.stop(t + 2.5) });
  trem.start(t); trem.stop(t + 2.5);
}
/* 人声合唱“啊”：锯齿波经过两个共振峰 */
function choir(out, t, midi, dur, g = .03) {
  const c = E.ctx, a = c.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + .6); a.gain.setTargetAtTime(0, t + dur, .3); a.connect(out);
  [[750, 5], [1150, 6]].forEach(([f, q]) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; b.connect(a);
    [-7, 6].forEach(d => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(midi); o.detune.value = d; o.connect(b); o.start(t); o.stop(t + dur + 1.5) }) });
}
function bell(out, t, midi, g = .05) { tone(out, t, midi, .02, { type: 'sine', gain: g, att: .002, rel: 2.4 }); tone(out, t, midi + 19, .02, { type: 'sine', gain: g * .2, att: .002, rel: 1.2 }) }

/* =========================================================
   曲风
   ========================================================= */
const chordAt = (s, bar) => s.chords[bar % s.chords.length];
const LEAD = (() => { srand(42); const pent = [62, 65, 67, 69, 72, 74, 77]; const bars = []; let idx = 3; for (let b = 0; b < 4; b++) { const a = new Array(16).fill(null); for (const st of [0, 3, 6, 8, 10, 12, 14]) { if (rnd() < .62 || st === 0) { idx = Math.max(0, Math.min(pent.length - 1, idx + Math.round((rnd() - .5) * 3))); a[st] = pent[idx] } } bars.push(a) } return bars })();
const STYLES = {
  /* 第一关：Lo-fi 爵士，每年加一种乐器 */
  lofi: {
    bpm: 80, swing: .3,
    chords: [{ r: 38, v: [53, 57, 60, 64] }, { r: 43, v: [53, 57, 59, 64] }, { r: 36, v: [52, 55, 59, 62] }, { r: 45, v: [55, 58, 61, 64] }],
    layers: [
      { name: 'keys', label: '钢琴', play(st, bar, t, out, s, E) { if (st !== 0 && st !== 6) return; const c = chordAt(s, bar); const dt = () => (Math.random() - .5) * 90 * Math.max(0, 1 - E.mood.love * 2.2); const b = E.d16() * 4; c.v.forEach((m, i) => keys(out, t + i * .012, m, st === 0 ? b * 1.4 : b * .9, st === 0 ? .05 : .035, dt())) } },
      { name: 'bass', label: '贝斯', play(st, bar, t, out, s, E) { const c = chordAt(s, bar), n = chordAt(s, bar + 1), b = E.d16() * 4; if (st === 0) tone(out, t, c.r, b * .9, { type: 'triangle', gain: .42, rel: .15, cut: 900 }); if (st === 8) tone(out, t, c.r + 7, b * .8, { type: 'triangle', gain: .36, rel: .15, cut: 900 }); if (st === 14) tone(out, t, n.r - 1, b * .35, { type: 'triangle', gain: .3, rel: .1, cut: 900 }) } },
      { name: 'drums', label: '鼓组', play(st, bar, t, out) { if (st === 0 || st === 10 || (st === 7 && bar % 2)) kick(out, t, .75); if (st === 4 || st === 12) snare(out, t, .22); if (st % 2 === 0) hat(out, t, st % 4 === 2 ? .07 : .04) } },
      { name: 'shaker', label: '沙锤', play(st, bar, t, out) { shaker(out, t, st % 4 === 2 ? .05 : .025) } },
      { name: 'strings', label: '弦乐', play(st, bar, t, out, s, E) { if (st) return; const c = chordAt(s, bar); c.v.slice(0, 3).forEach(m => strings(out, t, m + 12, E.d16() * 15, .012, { att: .9, cut: 1800 })) } },
      { name: 'guitar', label: '吉他', play(st, bar, t, out, s) { if (st % 2) return; const c = chordAt(s, bar); guitar(out, t, c.v[(st / 2) % 4] + (st > 7 ? 12 : 0), .055) } },
      { name: 'flute', label: '长笛', play(st, bar, t, out, s, E) { const m = LEAD[bar % 4][st]; if (m == null) return; if (E.mood.orig < .35) tone(out, t, m + 12, E.d16() * 1.5, { type: 'square', gain: .03, att: .002, rel: .05, cut: 2400 }); else flute(out, t, m + 12, E.d16() * 1.6, .06) } },
      { name: 'vibes', label: '颤音琴', play(st, bar, t, out, s) { if (st !== 4 && st !== 12) return; const c = chordAt(s, bar); vibes(out, t, c.v[st === 4 ? 2 : 3] + 12, .035) } },
      { name: 'trumpet', label: '小号', play(st, bar, t, out, s, E) { if (bar % 2 !== 1 || (st !== 6 && st !== 14)) return; const c = chordAt(s, bar); c.v.slice(1).forEach(m => trumpet(out, t, m + 12, E.d16() * 1.2, .022)) } },
      { name: 'choir', label: '人声合唱', play(st, bar, t, out, s, E) { if (st || bar % 2) return; const c = chordAt(s, bar); [c.r + 24, c.v[1] + 12, c.v[2] + 12].forEach(m => choir(out, t, m, E.d16() * 30, .018)) } },
      { name: 'heart', label: '心跳', hot: true, play(st, bar, t, out, s, E) { if (st === 0 || st === 3 || st === 8 || st === 11) kick(out, t, .25 + .5 * E.mood.danger, 70, 38, .25) } }
    ]
  },
  /* 第二关：神秘的竖琴和大提琴持续音 */
  mystic: {
    bpm: 62, swing: 0, chords: [{ r: 38 }, { r: 38 }, { r: 39 }, { r: 38 }], scale: [62, 63, 66, 67, 69, 70, 72, 74],
    layers: [
      { name: 'drone', label: '大提琴', play(st, bar, t, out, s, E) { if (st) return; const c = chordAt(s, bar), b = E.d16() * 16; strings(out, t, c.r, b, .03, { att: 1.2, cut: 700 }); strings(out, t, c.r + 7, b, .02, { att: 1.4, cut: 800 }) } },
      { name: 'harp', label: '竖琴', play(st, bar, t, out, s) { if (st % 2) return; const sc = s.scale, i = (st / 2 + bar * 3) % 8; harp(out, t, sc[i] + (bar % 2 && st > 7 ? 12 : 0), .06) } },
      { name: 'bell', label: '钟琴', play(st, bar, t, out, s) { if (st === 0 || (st === 8 && bar % 2)) bell(out, t, s.scale[(bar * 5 + st) % 8] + 12, .04) } },
      { name: 'tom', label: '手鼓', play(st, bar, t, out) { if (st === 0) kick(out, t, .5, 120, 70, .4); if (st === 6 || st === 10) kick(out, t, .3, 180, 110, .25) } }
    ]
  },
  /* 第三关：2036 年的制作人，合成器浪潮 */
  synth: {
    bpm: 100, swing: 0, chords: [{ r: 45, v: [57, 60, 64] }, { r: 41, v: [57, 60, 65] }, { r: 36, v: [55, 60, 64] }, { r: 43, v: [55, 59, 62] }],
    layers: [
      { name: 'pad', label: '合成垫', play(st, bar, t, out, s, E) { if (st) return; const c = chordAt(s, bar); c.v.forEach(m => { tone(out, t, m, E.d16() * 16, { type: 'sawtooth', gain: .018, att: .3, rel: .6, cut: 1500, detune: -8 }); tone(out, t, m, E.d16() * 16, { type: 'sawtooth', gain: .018, att: .3, rel: .6, cut: 1500, detune: 8 }) }) } },
      { name: 'sbass', label: '贝斯', play(st, bar, t, out, s, E) { if (st % 2) return; const c = chordAt(s, bar); tone(out, t, c.r + (st % 4 === 2 ? 12 : 0), E.d16() * 1.6, { type: 'sawtooth', gain: .14, rel: .06, cut: 650, q: 4 }) } },
      { name: 'sdrums', label: '鼓组', play(st, bar, t, out) { if (st % 4 === 0) kick(out, t, .85); if (st === 4 || st === 12) snare(out, t, .28); if (st % 4 === 2) hat(out, t, .08, .12) } },
      { name: 'sarp', label: '琶音器', play(st, bar, t, out, s, E) { const c = chordAt(s, bar); tone(out, t, c.v[st % 3] + 12 + (st % 6 > 2 ? 12 : 0), E.d16() * .8, { type: 'square', gain: .02, rel: .08, cut: 2600 }) } }
    ]
  },
  /* 第四关：纯管弦乐。orch 是 C 小调，orchM 是 C 大调 */
  orch: {
    bpm: 66, swing: 0, chords: [{ r: 36, v: [60, 63, 67] }, { r: 44, v: [60, 63, 68] }, { r: 39, v: [58, 63, 67] }, { r: 43, v: [59, 62, 67] }],
    layers: [
      { name: 'vln', label: '弦乐', play(st, bar, t, out, s, E) { if (st) return; const c = chordAt(s, bar), b = E.d16() * 16; c.v.forEach(m => strings(out, t, m, b, .02, { att: .9 })) } },
      { name: 'cello', label: '大提琴', play(st, bar, t, out, s, E) { if (st % 8) return; const c = chordAt(s, bar); strings(out, t, c.r, E.d16() * 8, .045, { att: .4, cut: 900 }) } },
      { name: 'harpo', label: '竖琴', play(st, bar, t, out, s) { if (st % 2) return; const c = chordAt(s, bar); harp(out, t, c.v[(st / 2) % 3] + (st >= 8 ? 12 : 0), .045) } },
      { name: 'hornm', label: '圆号', play(st, bar, t, out, s, E) { if (st !== 0 || bar % 2) return; const c = chordAt(s, bar); horn(out, t, c.v[2] - 12, E.d16() * 24, .05) } },
      { name: 'timp', label: '定音鼓', play(st, bar, t, out, s) { if (st === 0 && bar % 4 === 0) timp(out, t, chordAt(s, bar).r + 7, .4) } }
    ]
  }
};
STYLES.orchM = Object.assign({}, STYLES.orch, { chords: [{ r: 36, v: [60, 64, 67] }, { r: 45, v: [60, 64, 69] }, { r: 41, v: [60, 65, 69] }, { r: 43, v: [59, 62, 67] }] });
const ALL = { lofi: ['keys', 'bass', 'drums', 'shaker', 'strings', 'guitar', 'flute', 'vibes', 'trumpet', 'choir'], mystic: ['drone', 'harp', 'bell', 'tom'], synth: ['pad', 'sbass', 'sdrums', 'sarp'], orch: ['vln', 'cello', 'harpo', 'hornm', 'timp'], orchM: ['vln', 'cello', 'harpo', 'hornm', 'timp'] };

/* 界面音效 */
function sfxSwipe() { if (!E.ctx) return; nhit(E.sfx, now(), { g: .12, type: 'bandpass', f: 1200, d: .18, q: 1.2 }) }
function sfxDelta(sum) { if (!E.ctx || !sum) return; const t = now() + .05; const up = sum > 0; [0, 1].forEach(i => tone(E.sfx, t + i * .08, up ? [74, 81][i] : [69, 62][i], .06, { type: 'triangle', gain: .07, rel: .3 })) }
function sfxBuzz() { if (!E.ctx) return; tone(E.sfx, now(), 40, .25, { type: 'sawtooth', gain: .06, cut: 500 }) }
function sfxGood() { if (!E.ctx) return; const t = now(); [72, 76, 79].forEach((m, i) => tone(E.sfx, t + i * .07, m, .1, { type: 'triangle', gain: .07, rel: .4 })) }

/* 简谱键盘的音：C 大调，1 = Do */
const SCALE = [60, 62, 64, 65, 67, 69, 71, 72];
function playDeg(i, t, g = .15, dur = .5, out) { keys(out || E.sfx, t ?? now(), SCALE[i], dur, g) }
