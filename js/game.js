/* =========================================================
   游戏流程：主页、第一关到第四关、音乐人格画像
   文案在 js/data.js，声音在 js/audio.js
   ========================================================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
const pick = a => a[Math.floor(Math.random() * a.length)];
const SOLF = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'];
const NUM = ['1', '2', '3', '4', '5', '6', '7', '高1'];
const jp = seq => seq.map(i => NUM[i]).join(' ');
let KEYH = null;
let TOK = 0; /* 每次换页面加一，旧页面里的定时器看到号码变了就不再执行 */

/* ---------- 存档：只存在这台设备的浏览器里 ---------- */
const STORE = 'reverb2036-progress-v3', GSTORE = 'reverb2036-gallery';
const blank = () => ({ stage: 0, ideal: null, g: null, l1save: null, l1: null, l2: null, l3save: null, l3: null, l4: null, portrait: null, tags: {}, log: [], skills: {} });
let PROG = blank(), GALLERY = [];
try { const r = localStorage.getItem(STORE); if (r) PROG = Object.assign(blank(), JSON.parse(r)); const g = localStorage.getItem(GSTORE); if (g) GALLERY = JSON.parse(g) || [] } catch (e) { }
function save() { try { localStorage.setItem(STORE, JSON.stringify(PROG)); localStorage.setItem(GSTORE, JSON.stringify(GALLERY)) } catch (e) { } }
function addTags(k, target = PROG.tags) { (k || '').split(/\s+/).filter(Boolean).forEach(t => target[t] = (target[t] || 0) + 1) }
function mergeTags(src) { for (const k in src) PROG.tags[k] = (PROG.tags[k] || 0) + src[k] }
function skill(name, v) { (PROG.skills[name] = PROG.skills[name] || []).push(v) }

/* 卡牌编号 */
CARDS.forEach((c, i) => c.id = 'c' + i);
GCARDS.she.forEach((c, i) => c.id = 's' + i);
GCARDS.he.forEach((c, i) => c.id = 'h' + i);
const BYID = {}; [...CARDS, ...GCARDS.she, ...GCARDS.he].forEach(c => BYID[c.id] = c);
const AVATAR = { '推推': '推', '小谱': '谱', '你的 AI 分身': '影', 'AI 评委': '评', 'AI 选角系统': '选', 'AI 推荐系统': '推', 'A&R': 'A', 'Livehouse老板': 'L' };
const PALETTE = ['#c0646f', '#5a7fd6', '#d08a3a', '#7a6d78', '#3aa58c', '#b5813a', '#6d5aa8', '#c9577f', '#e07b5b', '#44506e', '#2f8a9c', '#a54f8a', '#8a5a36', '#3f8f6a', '#a8473f'];
function avatar(who) { let h = 0; for (const ch of who) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return [AVATAR[who] || who.replace(/\s/g, '')[0], PALETTE[h % PALETTE.length]] }

/* =========================================================
   页面切换
   ========================================================= */
const TITLES = { ideal: '开始之前', intro: '第一关 · 饿死之前', yearbreak: '第一关 · 饿死之前', play: '第一关 · 饿死之前', mini: '第一关 · 音乐关卡', end: '第一关 · 结局', l2: '第二关 · 音乐命运签', l3: '第三关 · 制作人的一天', l4: '第四关 · 十年回响', portrait: '音乐人格画像' };
function show(id) {
  TOK++; if (E.ctx) E.stopClip();
  $$('.screen').forEach(s => s.hidden = s.id !== id);
  $('#topbar').hidden = id === 'hub'; $('#topTitle').textContent = TITLES[id] || '';
  const el = $('#' + id); if (el && el.scrollTo) el.scrollTo(0, 0);
  if (id === 'play') { renderChans(); updateMood() }
}
function goHub() {
  if (E.ctx) { E.stopClip(); E.stop(.4); E.duck(1) }
  if (G) { saveL1(); G = null }
  KEYH = null; stopPreview(); renderHub(); show('hub');
}

/* =========================================================
   主页
   ========================================================= */
const LEVELS = [
  { no: '1', id: 'l1', name: '饿死之前', desc: '2027 到 2036，每年 5 个选择、1 个音乐关卡。数值到极限会遇到人生岔路，一共 19 种活法。', bgmName: 'Lo-fi 爵士', bgm: '每过一年多一种乐器，数值越危险，音乐越紧张。', style: 'lofi' },
  { no: '2', id: 'l2', name: '音乐命运签', desc: '十年后的冬天，你走进一家叫「回声铺」的小店。看不见的调音婆婆听你弹 8 个音，说出你的过去，再给你算下一个十年。', bgmName: '神秘竖琴', bgm: '大提琴持续音加竖琴，用的是带东方色彩的弗里吉亚属调式。', style: 'mystic' },
  { no: '3', id: 'l3', name: '2036 · 制作人的一天', desc: '从早上 8 点到凌晨 2 点，七个人提七个要求。AI 每次给你三个版本，你得用耳朵挑对。每个要求背后，还藏着一个选择。', bgmName: '合成器浪潮', bgm: 'Synthwave 风格，时间越晚节奏越快。', style: 'synth' },
  { no: '4', id: 'l4', name: '十年回响', desc: '回看这十年，回答最后三个问题，写一段旋律交给管弦乐团。最后生成你的音乐人格画像，和你开局时的理想对比。', bgmName: '管弦乐', bgm: '弦乐、大提琴、竖琴、圆号、定音鼓。结局好就走向大调，不好就停在小调。', style: 'orch' }
];
let previewing = null, previewTimer = null, confirmReset = false;
function levelSummary(i) {
  if (i === 0 && PROG.l1) return '你的活法：' + ENDINGS[PROG.l1.id].t;
  if (i === 1 && PROG.l2) return '你的签：' + PROG.l2.title;
  if (i === 2 && PROG.l3) return `挑对 ${PROG.l3.right} 个 · ${PROG.l3.title}`;
  if (i === 3 && PROG.portrait) return '你的画像：' + PROG.portrait.archT;
  return '已完成';
}
function renderHub() {
  const st = PROG.stage;
  $('#levels').innerHTML = LEVELS.map((L, i) => {
    const state = i < st ? 'done' : i === st ? 'now' : 'locked';
    const cont = (i === 0 && PROG.l1save) || (i === 2 && PROG.l3save);
    const tag = state === 'done' ? `<span class="tag done">${levelSummary(i)}</span>` : state === 'now' ? `<span class="tag now">${cont ? '进行中' : '下一关'}</span>` : `<span class="tag">完成第 ${i} 关后解锁</span>`;
    return `<article class="lvl ${state}">
      <span class="no">${L.no}</span>
      <h3>${L.name}${tag}</h3>
      <p>${L.desc}</p>
      <p class="bgm">背景音乐：<b>${L.bgmName}</b>。${L.bgm}</p>
      <div class="row">${state === 'now' ? `<button class="btn sm" data-go="${L.id}">${cont ? '继续' : '开始'}</button>` : ''}<button class="btn ghost sm listen" data-listen="${i}">试听本关音乐</button></div>
    </article>`}).join('');
  let j = '';
  if (st >= 4) j = `<div class="journey"><span class="eyebrow">十年已经走完</span><h3>你的音乐人格：${PROG.portrait ? PROG.portrait.archT : ''}</h3><div class="row"><button class="btn" data-portrait>查看我的音乐人格画像</button><button class="btn ghost" data-reset>重新开始十年</button></div></div>`;
  else if (st > 0 || PROG.l1save) j = `<p class="mnote">进度会自动保存。关卡只能按顺序玩，没有回头路。<button class="home" data-reset style="margin-left:6px">清空进度，重新开始</button></p>`;
  if (confirmReset) j += `<div class="confirm"><b>确定要清空这十年的全部进度吗？</b><span>理想、选择、命运签和人格画像都会被清空，结局图鉴会保留。</span><div class="row"><button class="btn danger sm" data-reset-yes>清空并重新开始</button><button class="btn ghost sm" data-reset-no>取消</button></div></div>`;
  $('#journey').innerHTML = j;
  const got = new Set(GALLERY);
  $('#gallerySum').textContent = `结局图鉴 · 已解锁 ${[...got].filter(k => ENDINGS[k]).length} / ${Object.keys(ENDINGS).length}`;
  $('#gallery').innerHTML = Object.entries(ENDINGS).map(([k, v]) => `<span class="${got.has(k) ? 'got' : ''}">${got.has(k) ? v.t : '？？？'}</span>`).join('');
}
function stopPreview() { previewing = null; clearTimeout(previewTimer); $$('.listen').forEach(b => { b.classList.remove('on'); b.textContent = '试听本关音乐' }); if (E.ctx && !G) E.stop(.4) }
document.addEventListener('click', e => {
  const l = e.target.closest('[data-listen]');
  if (l) {
    const i = +l.dataset.listen; if (previewing === i) { stopPreview(); return }
    const was = previewing !== null; stopPreview(); previewing = i; E.init(); E.resetMood(); STYLES.lofi.bpm = 84; STYLES.synth.bpm = 100;
    setTimeout(() => { if (previewing !== i) return; E.play(LEVELS[i].style, ALL[LEVELS[i].style]); l.classList.add('on'); l.textContent = '停止试听' }, was ? 500 : 0);
    previewTimer = setTimeout(stopPreview, 16000); return;
  }
  const g = e.target.closest('[data-go]');
  if (g) { const idx = LEVELS.findIndex(L => L.id === g.dataset.go); if (idx !== PROG.stage) return; E.init(); stopPreview(); startLevel(g.dataset.go); return }
  if (e.target.closest('[data-hub]')) { goHub(); return }
  if (e.target.closest('[data-portrait]')) { E.init(); stopPreview(); showPortrait(); return }
  if (e.target.closest('[data-reset]')) { confirmReset = true; renderHub(); return }
  if (e.target.closest('[data-reset-no]')) { confirmReset = false; renderHub(); return }
  if (e.target.closest('[data-reset-yes]')) { confirmReset = false; PROG = blank(); save(); renderHub(); return }
});
function startLevel(id) {
  if (id === 'l1') { if (PROG.l1save) resumeL1(); else if (!PROG.ideal) showIdeal(); else show('intro') }
  else if (id === 'l2') startL2();
  else if (id === 'l3') startL3();
  else startL4();
}

/* =========================================================
   开局：理想的音乐人
   ========================================================= */
function showIdeal() {
  $('#ideal').innerHTML = `<span class="eyebrow">开始之前</span><h2 class="big-title">你心里理想的音乐人</h2>
    <p class="lead">先别管现实。如果可以随便选，你最想成为哪一种音乐人？走完四关以后，我们会把你十年里真实的选择，和你这一刻的答案放在一起对比，看看你有没有忘记初心。</p>
    <div class="ideals">${Object.entries(IDEALS).map(([k, v]) => `<button class="ideal-btn" data-ideal="${k}"><b>${v.t}</b><span>${v.d}</span></button>`).join('')}</div>`;
  show('ideal');
  $$('[data-ideal]').forEach(b => b.onclick = () => { PROG.ideal = b.dataset.ideal; save(); show('intro') });
}

/* =========================================================
   第一关：饿死之前
   ========================================================= */
let G = null;
const resolveCard = r => r.x ? { ...CRISIS[r.x][r.n], crisis: r.x } : r.m ? { ...MINIS[r.m], id: 'm' + r.m } : BYID[r.c];
function saveL1() { if (G) { PROG.l1save = JSON.parse(JSON.stringify(G)); save() } }
function newGame(g) {
  PROG.g = g;
  const ids = GCARDS[g].map(c => c.id);
  G = { year: 0, s: { m: 50, f: 50, l: 50, o: 50 }, flags: {}, used: [], queue: [], cur: null, idx: 0, total: 0, crisisN: {}, gLeft: [...shuffle(ids.slice(0, ids.length - 1)), ids[ids.length - 1]], yb: [], lock: false };
  E.resetMood(); renderMeters(); yearBreak();
}
function yearLayers() { return Object.entries(UNLOCK).filter(([y]) => +y <= G.year).map(([, n]) => n) }
function applyYearMusic() { STYLES.lofi.bpm = 80 + (G.year - 1); E.play('lofi', yearLayers()); updateMood() }
function yearBreak() {
  G.year++;
  const items = [];
  if (G.year > 1) { G.s.m = Math.max(0, G.s.m - 6); items.push(['房租水电', '钱 −6']) }
  if (UNLOCK[G.year]) items.push(['新乐器', `${STYLES.lofi.layers.find(L => L.name === UNLOCK[G.year]).label}加入了背景音乐`]);
  items.push(['速度', `每分钟 ${80 + G.year - 1} 拍`]);
  items.push(['今年', '5 个选择，1 个音乐关卡']);
  if (G.year === 6) items.push(['提醒', '从这一年起，你会遇到一些现在还没发生的事']);
  if (G.year === 10) items.push(['最后一年', '撑过今年，你会得到属于自己的活法']);
  G.yb = items; buildQueue(); checkCrisis(); G.cur = null; saveL1();
  renderYB(); show('yearbreak'); applyYearMusic();
}
function renderYB() {
  $('#ybCal').textContent = `${2026 + G.year} 年`; $('#ybBig').textContent = `第 ${G.year} 年`;
  $('#ybList').innerHTML = G.yb.map(i => `<li><i>${i[0]}</i><span>${i[1]}</span></li>`).join('');
}
function buildQueue() {
  const y = G.year;
  const pool = shuffle(CARDS.filter(c => !G.used.includes(c.id) && c.w[0] <= y && y <= c.w[1] && (!c.need || G.flags[c.need]))).sort((a, b) => a.w[1] - b.w[1]);
  const gender = y <= 8 && G.gLeft.length;
  let q = pool.slice(0, gender ? 4 : 5).map(c => ({ c: c.id }));
  if (gender) q.push({ c: G.gLeft.shift() });
  q = shuffle(q); q.splice(2, 0, { m: y });
  G.queue = q; G.idx = 0; G.total = q.length;
}
$('#ybGo').onclick = () => { if ($('#yearbreak').hidden || !G) return; show('play'); nextCard() };
function resumeL1() {
  G = JSON.parse(JSON.stringify(PROG.l1save)); G.lock = false;
  renderMeters(); applyYearMusic();
  if (G.cur) { show('play'); renderCard() } else { renderYB(); show('yearbreak') }
}
function nextCard() {
  if (!G) return;
  if (!G.queue.length) { if (G.year >= 10) return finishL1(finalEnding(G.s), true); return yearBreak() }
  G.cur = G.queue.shift(); if (!G.cur.x) G.idx++; G.lock = false; saveL1(); renderCard();
}
function renderCard() {
  const c = resolveCard(G.cur), [ch, col] = avatar(c.who);
  const card = $('#card'); card.className = 'card enter' + (c.crisis ? ' crisis' : ''); card.style.transform = ''; card.style.opacity = '';
  $('#av').textContent = ch; $('#av').style.background = col;
  $('#who').textContent = c.who; $('#when').textContent = `${2026 + G.year} · 第 ${G.year} 年`;
  const badge = c.crisis ? '<span class="badge">人生岔路</span>' : c.R.mini ? '<span class="badge">音乐关卡</span>' : '';
  $('#say').innerHTML = badge + c.say;
  $('#prog').textContent = c.crisis ? '' : `今年 ${G.idx}/${G.total}`;
  const lab = o => o.end ? `${o.t}<small>走向这个结局</small>` : o.t;
  $('#tL').innerHTML = lab(c.L); $('#tR').innerHTML = lab(c.R);
  $('#leanL').textContent = '← ' + c.L.t; $('#leanR').textContent = c.R.t + ' →';
  $('#yrNum').textContent = `第 ${G.year} 年`; $('#yrCal').textContent = `${2026 + G.year} · 饿死之前`;
  renderMeters();
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('enter')));
}
function preview(side) {
  KEYS.forEach(k => {
    const d = document.querySelector(`.meter[data-k="${k}"] .dot`); d.className = 'dot'; if (!side || !G || !G.cur) return; const opt = resolveCard(G.cur)[side];
    if (opt.mini) { d.className = 'dot s'; return } const v = (opt.e || {})[k]; if (v || (opt.reset && opt.reset[k] != null)) d.className = 'dot ' + (Math.abs(v || 15) >= 12 ? 'b' : 's')
  });
  $('#leanL').classList.toggle('show', side === 'L'); $('#leanR').classList.toggle('show', side === 'R');
}
function commitChoice(c, opt) {
  addTags(opt.k);
  PROG.log.push({ lv: 1, y: G.year, who: c.who, say: c.say, pick: opt.t, k: opt.k || '', key: !!(c.crisis || opt.set || (c.w && c.w[0] >= 3) || c.id && /^[sh]/.test(c.id)) });
  if (opt.set) G.flags[opt.set] = 1;
  if (c.crisis) G.crisisN[c.crisis] = (G.crisisN[c.crisis] || 0) + 1;
  if (c.id) G.used.push(c.id);
}
function choose(side) {
  if (!G || G.lock || $('#play').hidden || !G.cur) return; G.lock = true; preview(null); sfxSwipe();
  const c = resolveCard(G.cur), opt = c[side], card = $('#card');
  card.style.transform = `translateX(${side === 'L' ? -130 : 130}%) rotate(${side === 'L' ? -14 : 14}deg)`; card.style.opacity = '0';
  setTimeout(() => {
    if (opt.mini) return startMini(opt.mini);
    commitChoice(c, opt);
    if (opt.end) return finishL1(opt.end, false);
    apply(opt.e || {}, opt.reset); G.cur = null; saveL1();
    setTimeout(nextCard, 250);
  }, 300);
}
function apply(e = {}, reset) {
  let sum = 0;
  KEYS.forEach(k => {
    let v = e[k] || 0; if (reset && reset[k] != null) v = reset[k] - G.s[k] + (e[k] || 0); if (!v) return; sum += v; G.s[k] = Math.max(0, Math.min(100, G.s[k] + v));
    const m = document.querySelector(`.meter[data-k="${k}"]`); m.classList.remove('up', 'down'); void m.offsetWidth; m.classList.add(v > 0 ? 'up' : 'down'); setTimeout(() => m.classList.remove('up', 'down'), 900)
  });
  sfxDelta(sum); renderMeters(); updateMood(); checkCrisis();
}
function checkCrisis() {
  const s = G.s;
  const order = [['m0', s.m <= 0], ['l0', s.l <= 0], ['o0', s.o <= 0], ['f100', s.f >= 100], ['m100', s.m >= 100], ['l100', s.l >= 100], ['o100', s.o >= 100]];
  for (const [k, hit] of order) { if (!hit) continue; if (G.queue[0] && G.queue[0].x === k) return; G.queue.unshift({ x: k, n: Math.min(G.crisisN[k] || 0, CRISIS[k].length - 1) }); return }
}
(() => {
  const card = $('#card'); let sx = 0, dx = 0, down = false;
  card.addEventListener('pointerdown', e => { if (!G || G.lock) return; down = true; sx = e.clientX; dx = 0; card.classList.add('drag'); card.setPointerCapture(e.pointerId) });
  card.addEventListener('pointermove', e => { if (!down) return; dx = e.clientX - sx; card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; preview(dx < -28 ? 'L' : dx > 28 ? 'R' : null) });
  const up = () => { if (!down) return; down = false; card.classList.remove('drag'); if (Math.abs(dx) > 90) choose(dx < 0 ? 'L' : 'R'); else { card.style.transform = ''; preview(null) } };
  card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
})();
['L', 'R'].forEach(s => { const b = $('#b' + s); b.onclick = () => choose(s); b.onmouseenter = () => G && !G.lock && preview(s); b.onmouseleave = () => preview(null); b.onfocus = () => G && !G.lock && preview(s); b.onblur = () => preview(null) });
function renderMeters() {
  if (!$('#meters').children.length) $('#meters').innerHTML = KEYS.map(k => `<div class="meter" data-k="${k}"><i class="dot"></i><div class="track"><div class="fill"></div></div><span class="mlab">${STAT[k]}</span><span class="mval"></span></div>`).join('');
  if (!G) return;
  KEYS.forEach(k => { const m = document.querySelector(`.meter[data-k="${k}"]`), v = G.s[k]; m.querySelector('.fill').style.height = v + '%'; m.querySelector('.mval').textContent = v; m.classList.toggle('warn', v <= 20 || v >= 80) });
}
function updateMood() {
  if (!G) return; const s = G.s;
  let d = 0; KEYS.forEach(k => { const v = s[k]; if (v <= 20) d = Math.max(d, (22 - v) / 22); if (v >= 80) d = Math.max(d, (v - 78) / 22) });
  E.mood = { danger: d, love: s.l / 100, orig: s.o / 100 }; E.tempoMul = 1 + .05 * d;
  if (E.ctx) E.lp.frequency.setTargetAtTime(d > .05 ? 18000 * Math.pow(1500 / 18000, d) : 18000, now(), .4);
  if (E.styleKey === 'lofi') E.setLayer('heart', d > .15);
  const notes = [];
  if (d > .15) notes.push('有数值快到极限了，所以出现了心跳声，声音变闷，节奏变快。');
  if (s.l < 30) notes.push('热爱太低，钢琴开始走音。');
  if (s.o < 35) notes.push('原创太低，节奏不再摇摆，长笛（第 7 年起）变成机器音色。');
  const n = STYLES.lofi.layers.filter(L => E.layers[L.name] && !L.hot).length;
  $('#mnote').textContent = notes.length ? notes.join(' ') : `Lo-fi 爵士 · 每分钟 ${Math.round(STYLES.lofi.bpm * E.tempoMul)} 拍 · ${n} 种乐器在响，每过一年多一种。`;
}
function renderChans() {
  const box = $('#chans'); if (!box) return;
  box.innerHTML = STYLES.lofi.layers.map(L => `<span class="ch ${L.hot ? 'hot' : ''} ${E.styleKey === 'lofi' && E.layers[L.name] ? 'on' : ''}">${L.label}</span>`).join('');
}
E.onLayers = renderChans;
$('#mute').onclick = () => { E.setMute(!E.muted); $('#mute').textContent = E.muted ? '打开声音' : '静音' };
$$('.who-pick .btn').forEach(b => b.onclick = () => { E.init(); newGame(b.dataset.g) });

function finishL1(id, survived) {
  const en = ENDINGS[id];
  if (en.tone === 'bad') { E.stop(.3); setTimeout(() => { const t0 = now() + .1;[69, 65, 62, 57].forEach((m, i) => keys(E.sfx, t0 + i * .45, m, i === 3 ? 1.6 : .4, .12)) }, 400) }
  else { E.resetMood(); E.play(en.tone === 'good' ? 'orchM' : 'orch', ['vln', 'cello', 'harpo', 'hornm']) }
  PROG.l1 = { id, stats: { ...G.s }, year: G.year, survived }; PROG.l1save = null; PROG.stage = Math.max(PROG.stage, 1);
  if (!GALLERY.includes(id)) GALLERY.push(id); save();
  const n = PROG.log.filter(x => x.lv === 1).length;
  $('#endKind').textContent = survived ? '撑过了十年 · 2036' : `第 ${G.year} 年 · 人生岔路`;
  $('#endTitle').textContent = en.t; $('#endText').textContent = en.x;
  $('#final').innerHTML = KEYS.map(k => `<div><b>${G.s[k]}</b><span>${STAT[k]}</span></div>`).join('');
  $('#endMusic').textContent = `这一路你做了 ${n} 个选择，它们会在第四关变成你的音乐人格画像。结局图鉴已解锁 ${GALLERY.filter(k => ENDINGS[k]).length} / ${Object.keys(ENDINGS).length}。`;
  G = null; KEYH = null; show('end');
}

/* =========================================================
   第一关：音乐关卡
   ========================================================= */
function startMini(kind) {
  show('mini'); E.duck(1); $('#miniBody').innerHTML = '';
  const f = { rhythm: () => rhythm(false), rhythm2: () => rhythm(true), tune: () => tune(false), tune2: () => tune(true), memory: () => memory(false), memory2: () => memory(true), tempo: () => tempoGame(false), tempo2: () => tempoGame(true), ai: () => aiTest(false), ai2: () => aiTest(true) }[kind];
  f();
}
function miniResult(title, text, eff) {
  KEYH = null; E.stopClip(); E.duck(1);
  const chips = KEYS.filter(k => eff[k]).map(k => `<span class="chip ${eff[k] > 0 ? 'p' : 'n'}">${STAT[k]} ${eff[k] > 0 ? '+' : '−'}${Math.abs(eff[k])}</span>`).join('') || '<span class="chip">数值不变</span>';
  $('#miniBody').innerHTML = `<div class="result"><h3>${title}</h3><p>${text}</p><div class="chips">${chips}</div><button class="btn" id="miniBack" style="align-self:flex-start">回到这一年</button></div>`;
  $('#miniBack').onclick = () => {
    if (!G) return; const c = resolveCard(G.cur); commitChoice(c, c.R);
    show('play'); applyYearMusic(); apply(eff); G.cur = null; saveL1(); setTimeout(nextCard, 250);
  };
}
function miniHead(eye, title, desc) { $('#miniEye').textContent = '音乐关卡 · ' + eye; $('#miniTitle').textContent = title; $('#miniDesc').textContent = desc }

/* 1. 上台演出：跟着节拍按键 */
function rhythm(hard) {
  const tok = TOK;
  miniHead('上台演出', hard ? '三万人的主舞台' : 'Livehouse 暖场', '音符落到金线时，按对应的键（D F J K），手机上直接点那一列。你按中的音会变成这首歌的旋律，按不中就没有声音。');
  $('#miniBody').innerHTML = `<div class="rh" id="rh">${['D', 'F', 'J', 'K'].map((k, i) => `<div class="lane" data-i="${i}"><span class="lk">${k}</span></div>`).join('')}<div class="hitline"></div><div class="judge" id="judge"></div><div class="count" id="count"></div></div><p class="score" id="score">准备</p>`;
  const lanes = $$('#rh .lane');
  ['keys', 'bass', 'drums'].forEach(n => E.setLayer(n, true)); E.setLayer('flute', false); E.setLayer('guitar', false);
  const d16 = E.d16(), beat = d16 * 4; let t0 = E.nextBarTime(); if (t0 - now() < 2.2) t0 += 16 * d16;
  const offs = hard ? [0, 2, 4, 6, 7, 8, 10, 12, 14, 15, 16, 17, 18, 20, 22, 23, 24, 26, 27, 28, 29, 30] : [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 21, 22, 24, 26, 28];
  srand(hard ? 99 : 7); let ln = 0; const curBar = Math.floor(E.step / 16);
  const notes = offs.map(o => { ln = Math.max(0, Math.min(3, ln + (rnd() < .5 ? -1 : 1) * (rnd() < .7 ? 1 : 2))); const t = t0 + o * beat / 2; const bar = curBar + Math.floor((E.step % 16 + (t - E.nextTime) / d16) / 16); const ch = chordAt(STYLES.lofi, bar); return { t, lane: ln, pitch: ch.v[ln] + 12, done: false, el: null } });
  const travel = 1.5; let score = 0, hits = 0, live = true;
  const judgeEl = $('#judge'); let jt;
  const judge = (txt, cls) => { judgeEl.textContent = txt; judgeEl.className = 'judge show ' + cls; clearTimeout(jt); jt = setTimeout(() => judgeEl.className = 'judge', 260) };
  const hit = i => {
    if (!live) return; const n0 = now(); lanes[i].classList.add('press'); setTimeout(() => lanes[i].classList.remove('press'), 90);
    let best = null, bd = 9; for (const n of notes) { if (n.done || n.lane !== i) continue; const d = Math.abs(n.t - n0); if (d < bd) { bd = d; best = n } }
    if (best && bd < .14) { best.done = true; const p = bd < .065 ? 2 : 1; score += p; hits++; keys(E.sfx, n0, best.pitch, .5, .13); best.el && best.el.classList.add('ok'); judge(p === 2 ? '完美' : '不错', 'good') }
    else nhit(E.sfx, n0, { g: .05, type: 'bandpass', f: 400, d: .06 });
    $('#score').textContent = `命中 ${hits} / ${notes.length}`;
  };
  KEYH = e => { const i = 'dfjk'.indexOf(e.key.toLowerCase()); if (i >= 0) { hit(i); return true } };
  lanes.forEach((l, i) => l.addEventListener('pointerdown', e => { e.preventDefault(); hit(i) }));
  const frame = () => {
    if (tok !== TOK) return;
    const n0 = now(), H = lanes[0].clientHeight * .84;
    const left = t0 - n0; $('#count').textContent = left > 0 ? (left > beat * 3 ? '准备' : Math.ceil(left / beat)) : '';
    for (const n of notes) {
      const p = 1 - (n.t - n0) / travel; if (p < 0) continue;
      if (!n.el) { n.el = document.createElement('i'); n.el.className = 'nt'; lanes[n.lane].appendChild(n.el) }
      if (!n.done) n.el.style.transform = `translateY(${p * H}px)`;
      if (!n.done && n0 > n.t + .16) { n.done = true; n.el.classList.add('miss'); judge('错过', 'bad') }
    }
    if (n0 > notes[notes.length - 1].t + .9) {
      live = false; const r = score / (notes.length * 2); skill('rhythm', r);
      const k = hard ? 1.5 : 1; let eff, title, text;
      if (r >= .8) { eff = { m: Math.round(14 * k), f: Math.round(10 * k), l: 5 }; title = '全场跟唱'; text = '台下有人举起手机录你。老板当场多给了一倍演出费。' }
      else if (r >= .5) { eff = { m: Math.round(8 * k), f: Math.round(4 * k) }; title = '还不错'; text = '有几个地方乱了，但观众没听出来。拿到了演出费。' }
      else if (r >= .25) { eff = { m: 3, f: -Math.round(3 * k) }; title = '磕磕绊绊'; text = '你听见台下有人笑了一声。演出费只拿到一半。' }
      else { eff = { f: -Math.round(8 * k), l: -6 }; title = '翻车了'; text = '第二首歌唱到一半，观众开始刷手机。视频被做成了表情包。' }
      return miniResult(title, `命中 ${hits} / ${notes.length}。${text}`, eff);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* 2. 调音：凭耳朵把弦调准 */
function tune(hard) {
  const tok = TOK;
  miniHead('凭耳朵调弦', hard ? '为交响乐团定 A 音' : '帮吉他手调弦', '标准音和琴弦一起响的时候，如果没对准，你会听到“哇—哇—哇”的起伏，这叫拍音。拖动滑块调这根弦：拍音越慢，说明越接近；完全听不到起伏，就调准了。一共三根弦。');
  E.duck(hard ? .05 : .1);
  const notes = hard ? [57, 64, 50] : [64, 69, 62];
  let round = 0, errs = [], off = 0, TU = null, mode = 'both';
  $('#miniBody').innerHTML = `<div class="rounds" id="rounds"><i></i><i></i><i></i></div>
    <div class="tuner"><p class="status" id="tstat">第 1 根弦</p>
      <div class="row" style="justify-content:center"><button class="btn sm" data-m="both">一起听</button><button class="btn ghost sm" data-m="ref">只听标准音</button><button class="btn ghost sm" data-m="str">只听琴弦</button></div>
      <input type="range" id="tslider" min="-100" max="100" step="1" value="0" aria-label="调整琴弦音高">
      <div class="scale"><span>← 调低</span><span>调高 →</span></div>
      <button class="btn" id="tdone" style="align-self:center">调好了</button></div>`;
  const start = () => {
    if (tok !== TOK) return;
    const m = notes[round]; off = (Math.random() < .5 ? -1 : 1) * (hard ? 18 + Math.random() * 22 : 35 + Math.random() * 40);
    $('#tslider').value = 0; $('#tstat').textContent = `第 ${round + 1} 根弦 · 慢慢拖，仔细听拍音`;
    E.playClip(bus => {
      const c = E.ctx, mk = (det) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.045, now(), .05); o.connect(f); f.connect(g); g.connect(bus); o.start(); return { o, g } };
      TU = { ref: mk(0), str: mk(off) }; setMode(mode); return 900;
    }, hard ? .05 : .1);
  };
  const setMode = md => { mode = md; if (!TU) return; TU.ref.g.gain.setTargetAtTime(md === 'str' ? 0 : .045, now(), .03); TU.str.g.gain.setTargetAtTime(md === 'ref' ? 0 : .045, now(), .03); $$('[data-m]').forEach(b => b.classList.toggle('ghost', b.dataset.m !== md)) };
  $$('[data-m]').forEach(b => b.onclick = () => setMode(b.dataset.m));
  $('#tslider').oninput = e => { if (TU) TU.str.o.detune.setTargetAtTime(off + +e.target.value, now(), .03) };
  $('#tdone').onclick = () => {
    if (!TU) return; const err = Math.abs(off + +$('#tslider').value); errs.push(err);
    $$('#rounds i')[round].className = err < 12 ? 'ok' : 'no';
    $('#tstat').textContent = err < 5 ? `几乎完美，只差 ${err.toFixed(0)} 音分` : err < 12 ? `很准，差 ${err.toFixed(0)} 音分` : `还差 ${err.toFixed(0)} 音分（100 音分是一个半音）`;
    err < 12 ? sfxGood() : sfxBuzz(); E.stopClip(); TU = null; round++;
    setTimeout(() => { if (tok !== TOK) return; if (round < 3) start(); else finish() }, 1400);
  };
  const finish = () => {
    const avg = errs.reduce((a, b) => a + b, 0) / errs.length; skill('tune', avg);
    const k = hard ? 1.3 : 1; let eff, title, text;
    if (avg < 6) { eff = { o: Math.round(10 * k), l: 6, f: 4 }; title = '耳朵比调音器还准'; text = '吉他手看了一眼调音器，愣住了：“分毫不差。”' }
    else if (avg < 12) { eff = { o: Math.round(6 * k), l: 4 }; title = '很准'; text = '录音师点点头，没说什么，这就是最高评价。' }
    else if (avg < 25) { eff = { o: 2 }; title = '还行'; text = '大致准了，但录音师还是偷偷开了修音。' }
    else { eff = { o: -6, l: -4 }; title = '没调准'; text = '最后还是用了调音器。你开始想，自己的耳朵是不是被耳机泡坏了。' }
    miniResult(title, `三根弦平均差 ${avg.toFixed(0)} 音分。${text}`, eff);
  };
  start();
}

/* 3. 听音模仿：只靠耳朵，填完再提交 */
function memory(hard) {
  const tok = TOK, n = hard ? 8 : 5;
  miniHead('听音模仿', hard ? '总决赛：终极听音' : '录音棚试音', `键盘是 C 大调，1 就是 Do，从左到右一个比一个高。每轮先放参考音「1 Do」，再放一段旋律，琴键不会亮。听完以后按顺序弹出你听到的音，填满格子再点「提交」，填错了可以删掉重来。每轮可以再听两遍。`);
  const lens = hard ? [4, 5, 6] : [3, 4, 5];
  let round = 0, ok = 0, seq = [], typed = [], canType = false, reps = 2, judged = false;
  $('#miniBody').innerHTML = `<div class="rounds" id="rounds"><i></i><i></i><i></i></div><p class="status" id="mstat">准备</p>
    <div class="slots" id="mslots"></div>
    <div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost sm" id="mref">听参考音 1 Do</button><button class="btn ghost sm" id="mrep">再听一遍（2）</button><button class="btn ghost sm" id="mdel">删除</button><button class="btn sm" id="mok" disabled>提交</button></div>
    <div id="mkeys"></div>`;
  E.duck(.08);
  const kb = buildKeys($('#mkeys'), n, i => press(i));
  const paint = (marks) => {
    $('#mslots').innerHTML = seq.map((_, k) => { const v = typed[k]; const cls = marks ? (marks[k] ? 'ok' : 'no') : (k === typed.length && canType ? 'now' : ''); return `<span class="${cls}">${v != null ? NUM[v] : ''}${marks && !marks[k] ? `<i>${NUM[seq[k]]}</i>` : ''}</span>` }).join('');
    $('#mok').disabled = !(canType && typed.length === seq.length);
    $('#mdel').disabled = !canType || !typed.length;
    $('#mkeys .keys').classList.toggle('off', !canType);
  };
  const playSeq = withRef => {
    canType = false; paint(); $('#mstat').textContent = `第 ${round + 1} 轮 · 仔细听`;
    E.playClip(bus => { let t = now() + .3; if (withRef) { playDeg(0, t, .15, .8, bus); E.later(() => kb.flash(0), 300); t += 1.2 } seq.forEach((p, k) => playDeg(p, t + k * .62, .15, .5, bus)); return t - now() + seq.length * .62 + .2 }, .08,
      () => { if (tok !== TOK || judged) return; canType = true; $('#mstat').textContent = '轮到你了：按顺序弹出你听到的音'; paint() });
  };
  const next = () => {
    if (tok !== TOK) return; if (round >= 3) return finish();
    seq = []; let p = Math.floor(Math.random() * (n - 2));
    for (let k = 0; k < lens[round]; k++) { seq.push(p); const step = pick(hard ? [-3, -2, -1, 1, 2, 3, 4] : [-2, -1, 1, 1, 2]); let q = Math.max(0, Math.min(n - 1, p + step)); if (q === p) q = p > 0 ? p - 1 : p + 1; p = q }
    typed = []; reps = 2; judged = false; $('#mrep').textContent = '再听一遍（2）'; $('#mrep').disabled = false; $('#mok').textContent = '提交';
    setTimeout(() => playSeq(true), 500);
  };
  const press = i => { if (!canType) return; playDeg(i, now(), .16, .4); kb.flash(i); if (typed.length < seq.length) { typed.push(i); paint() } };
  $('#mdel').onclick = () => { if (!canType) return; typed.pop(); paint() };
  $('#mref').onclick = () => { if (judged) return; E.playClip(bus => { playDeg(0, now(), .15, .8, bus); return 1 }, .08); kb.flash(0) };
  $('#mrep').onclick = () => { if (judged || reps <= 0 || !canType && typed.length) return; reps--; $('#mrep').textContent = `再听一遍（${reps}）`; if (!reps) $('#mrep').disabled = true; const keep = typed.slice(); playSeq(false); typed = keep };
  $('#mok').onclick = () => {
    if (judged) { round++; next(); return }
    if (typed.length !== seq.length) return;
    judged = true; canType = false; const marks = seq.map((v, k) => typed[k] === v); const good = marks.every(Boolean);
    $$('#rounds i')[round].className = good ? 'ok' : 'no'; if (good) { ok++; sfxGood() } else sfxBuzz();
    $('#mstat').textContent = good ? '全对！' : `对了 ${marks.filter(Boolean).length} / ${seq.length} 个，正确答案：${jp(seq)}`;
    paint(marks); $('#mok').disabled = false; $('#mok').textContent = round < 2 ? '下一轮' : '看结果'; $('#mdel').disabled = true; $('#mrep').disabled = true;
    if (!good) E.playClip(bus => { const t = now() + .4; seq.forEach((p, k) => { playDeg(p, t + k * .55, .15, .45, bus); E.later(() => kb.flash(p), (.4 + k * .55) * 1000) }); return seq.length * .55 + 1 }, .08);
  };
  KEYH = e => { const i = '12345678'.slice(0, n).indexOf(e.key); if (i >= 0) { press(i); return true } if (e.key === 'Backspace') { $('#mdel').click(); return true } if (e.key === 'Enter' && !$('#mok').disabled) { $('#mok').click(); return true } };
  const finish = () => {
    skill('memory', ok); const k = hard ? 1.4 : 1; let eff, title, text;
    if (ok === 3) { eff = { o: Math.round(12 * k), l: 8, f: hard ? 10 : 0 }; title = '耳朵很好'; text = '对方愣了一下：“你学过视唱练耳吧？”' }
    else if (ok === 2) { eff = { o: Math.round(6 * k), l: 4 }; title = '还行'; text = '错了一段，但听得出你有底子。' }
    else if (ok === 1) { eff = { o: -2 }; title = '有点吃力'; text = '你开始怀疑，自己是不是太依赖 AI 扒谱了。' }
    else { eff = { o: -8, l: -6, f: hard ? -8 : 0 }; title = '没听出来'; text = '走出录音棚，你在地铁上把那段旋律听了二十遍。' }
    miniResult(title, `三轮对了 ${ok} 轮。${text}`, eff);
  };
  paint(); next();
}

/* 4. 稳拍：节拍器停了以后，自己稳住速度 */
function tempoGame(hard) {
  const tok = TOK, bpm = hard ? 72 : 92, N = hard ? 12 : 8, beat = 60 / bpm;
  miniHead('心里的拍子', hard ? '慢歌，不用节拍器' : '节拍器坏了', `先听 4 下节拍器，然后它会停。接着在第 5 拍的位置开始，按照同样的速度连续拍 ${N} 下（点圆圈，或者按空格键）。速度是每分钟 ${bpm} 拍。`);
  E.duck(.05);
  $('#miniBody').innerHTML = `<div class="tapzone"><div class="beats" id="tbeats">${'<i></i>'.repeat(4 + N)}</div><p class="status" id="tst">准备好了就点「开始」</p><button class="tap" id="tap" disabled>拍</button><button class="btn" id="tgo">开始</button><div class="offsets" id="toff"></div></div>`;
  let t0 = 0, taps = [], live = false;
  const dots = $$('#tbeats i');
  $('#tgo').onclick = () => {
    $('#tgo').hidden = true; taps = []; t0 = now() + .6;
    E.playClip(bus => { for (let i = 0; i < 4; i++) { tone(bus, t0 + i * beat, i ? 84 : 96, .05, { type: 'triangle', gain: .25, att: .001, rel: .06 }); E.later(() => dots[i].classList.add('on'), (t0 + i * beat - now()) * 1000) } return 4 * beat + 1 }, .05);
    $('#tst').textContent = '听……'; $('#tap').disabled = false; live = true;
    E.later(() => { if (tok === TOK && live) $('#tst').textContent = `节拍器停了。从第 5 拍开始，自己拍 ${N} 下` }, (t0 + 3.5 * beat - now()) * 1000);
  };
  const tap = () => {
    if (!live) return; const t = now(); if (t < t0 + 3.5 * beat) return;
    taps.push(t); const el = $('#tap'); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 80);
    tone(E.sfx, t, 79, .04, { type: 'triangle', gain: .12, att: .001, rel: .05 });
    if (dots[3 + taps.length]) dots[3 + taps.length].classList.add('on');
    if (taps.length >= N) { live = false; done() }
  };
  $('#tap').addEventListener('pointerdown', e => { e.preventDefault(); tap() });
  KEYH = e => { if (e.key === ' ' || e.key === 'Enter') { tap(); return true } };
  const done = () => {
    const errs = taps.map((t, k) => (t - (t0 + (4 + k) * beat)) * 1000);
    const mean = errs.reduce((a, b) => a + Math.abs(b), 0) / errs.length; skill('tempo', mean);
    $('#toff').innerHTML = errs.map(e => `<i class="${e > 0 ? 'late' : ''}" style="height:${Math.min(70, 4 + Math.abs(e) / 3)}px" title="${e.toFixed(0)} 毫秒"></i>`).join('');
    const drift = errs[errs.length - 1] - errs[0];
    const tend = Math.abs(drift) < 60 ? '速度很稳' : drift > 0 ? '越拍越慢' : '越拍越快';
    $('#tst').textContent = `平均偏差 ${mean.toFixed(0)} 毫秒，${tend}。绿色是抢拍，红色是拖拍。`;
    setTimeout(() => {
      if (tok !== TOK) return; const k = hard ? 1.3 : 1; let eff, title;
      if (mean < 35) { eff = { o: Math.round(8 * k), f: 6, l: 4 }; title = '稳得像节拍器' }
      else if (mean < 70) { eff = { o: Math.round(5 * k), f: 3 }; title = '很稳' }
      else if (mean < 130) { eff = { o: -2 }; title = '有点飘' }
      else { eff = { o: -6, f: -4 }; title = '拍子乱了' }
      miniResult(title, `平均偏差 ${mean.toFixed(0)} 毫秒，${tend}。${tend === '越拍越快' ? '紧张的时候人会不自觉地抢拍，这很常见。' : tend === '越拍越慢' ? '拖拍常常是因为在“等”声音，试着提前一点点。' : '你心里的钟很准。'}`, eff);
    }, 1800);
  };
}

/* 5. 人机辨听 */
const H_MEL = [[64, 0, 1], [67, 1, 1], [72, 2, 2], [71, 4, 1], [69, 5, 1], [67, 6, 2], [65, 8, 1], [64, 9, 1], [62, 10, 1], [65, 11, 1], [64, 12, 4]];
const H_CH = [[0, [48, 55, 64]], [4, [43, 50, 59]], [8, [41, 48, 57]], [10, [43, 50, 59]], [12, [48, 55, 64]]];
function playPiano(kind, bus) {
  const t0 = now() + .15, b = .56;
  if (kind === 'ai') {
    H_MEL.forEach(([m, s, l]) => keys(bus, t0 + s * b, m, l * b * .5, .1));
    for (let s = 0; s < 16; s++) { const ch = [...H_CH].reverse().find(c => c[0] <= s)[1]; ch.forEach(m => keys(bus, t0 + s * b, m, b * .35, .045)) }
    return 16 * b + .8;
  }
  if (kind === 'aijit') {
    /* 2036 年的 AI：会“随机”抖动时间和力度，也会踩踏板，但抖动没有方向 */
    const j = () => (Math.random() - .5) * .07, v = () => .06 + Math.random() * .08;
    H_MEL.forEach(([m, s, l]) => keys(bus, t0 + s * b + j(), m, l * b * 1.25, v()));
    H_CH.forEach(([s, ch], ci) => { const span = (H_CH[ci + 1] ? H_CH[ci + 1][0] : 16) - s; for (let k = 0; k < span * 2; k++) keys(bus, t0 + (s + k / 2) * b + j() * .5, ch[k % 3], b * 1.5, .03 + Math.random() * .02) });
    return 16 * b + 1.6;
  }
  /* 真人：开头稍慢，中间往前推，结尾明显渐慢；力度先渐强后渐弱；旋律比伴奏晚一点点 */
  const warp = s => { const x = s / 16; return s * b * (1 + .5 * Math.pow(x, 3)) + (s >= 1 ? .05 : 0) };
  const vel = s => .04 + .13 * Math.sin(Math.min(1, s / 12) * Math.PI * .95);
  H_MEL.forEach(([m, s, l], i) => { const t = t0 + warp(s) + .035, last = i === H_MEL.length - 1; if (m === 72) keys(bus, t - .08, 74, .06, .05); keys(bus, t, m, (warp(s + l) - warp(s)) * 1.3 + (last ? 1.8 : 0), vel(s) * (last ? .75 : 1)) });
  H_CH.forEach(([s, ch], ci) => { const span = (H_CH[ci + 1] ? H_CH[ci + 1][0] : 16) - s; for (let k = 0; k < span * 2; k++) keys(bus, t0 + warp(s + k / 2), ch[k % 3], b * 1.5, .03 + (k % 3 === 0 ? .02 : 0)) });
  return warp(16) + 2.4;
}
function aiTest(hard) {
  miniHead('人机辨听', hard ? '2036：AI 也会“不完美”了' : '哪段是人弹的？', hard ? '这一次，AI 也学会了快慢和轻重。但它的变化是随机的，真人的变化是有方向的：往哪里推、在哪里收、哪里呼吸。两段都听完才能选。' : 'A 和 B 是同一段旋律。注意听三件事：速度有没有快慢变化，每个音有没有轻重，音和音之间是断开的还是连着的。两段都听完才能选。');
  const humanA = Math.random() < .5, heard = { A: false, B: false }, aiKind = hard ? 'aijit' : 'ai';
  $('#miniBody').innerHTML = `<div class="clips">${['A', 'B'].map(x => `<div class="clip" id="clip${x}"><b>${x}</b><div class="wave">${'<i></i>'.repeat(9)}</div><button class="btn ghost sm" data-play="${x}">播放 ${x}</button><button class="btn sm" data-pick="${x}" disabled>${x} 是人弹的</button></div>`).join('')}</div>`;
  $$('[data-play]').forEach(b => b.onclick = () => {
    const x = b.dataset.play, kind = (x === 'A') === humanA ? 'human' : aiKind;
    $$('.clip').forEach(c => c.classList.remove('playing')); const c = $('#clip' + x); c.classList.add('playing');
    E.playClip(bus => playPiano(kind, bus), .05, () => c.classList.remove('playing'));
    heard[x] = true; if (heard.A && heard.B) $$('[data-pick]').forEach(p => p.disabled = false);
  });
  $$('[data-pick]').forEach(b => b.onclick = () => {
    const right = (b.dataset.pick === 'A') === humanA, H = humanA ? 'A' : 'B', A = humanA ? 'B' : 'A'; skill('ai', right ? 1 : 0);
    const why = hard ? `真人是 ${H}。两段都有快慢和轻重，但 ${A} 的变化是随机的：这个音早一点、下个音晚一点，像在抖。${H} 的变化有方向：一路往中间那句推上去，最后慢慢收住，最后一个音留得很长。随机不等于呼吸。`
      : `真人是 ${H}：越到后面越慢，最后一个音留得很长；中间那句最响，两头轻；踩了踏板，音连成一片。AI 是 ${A}：每拍一样长，每个音一样重，音和音之间断开，左手和弦像打卡一样每拍砸一下。`;
    if (right) miniResult('听出来了', why + ' 评审在你的名字后面画了一个勾。', hard ? { o: 14, f: 8, l: 4 } : { o: 12, f: 6, l: 4 });
    else miniResult('被骗过去了', why, { o: -10, l: -4 });
  });
}

/* 简谱键盘 */
function buildKeys(el, n, onPress) {
  el.innerHTML = `<div class="keys">${Array.from({ length: n }, (_, i) => `<button class="key" data-k="${i}" style="--h:${58 + i * 6}%;--c:hsl(${28 + i * 40} 72% 66%)"><b>${NUM[i]}</b><small>${SOLF[i]}</small></button>`).join('')}</div>`;
  const ks = [...el.querySelectorAll('.key')];
  ks.forEach((k, i) => k.addEventListener('pointerdown', e => { e.preventDefault(); onPress(i) }));
  return { flash(i) { if (!ks[i]) return; ks[i].classList.add('lit'); setTimeout(() => ks[i].classList.remove('lit'), 280) } };
}
