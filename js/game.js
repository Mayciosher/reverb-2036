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
const blank = () => ({ stage: 0, ideal: null, g: null, l1save: null, l1: null, l2: null, l3save: null, l3: null, l4: null, portrait: null, share: null, dom: {}, tags: {}, log: [], skills: {} });
/* 存档版本号：游戏结构有大改动时加 1，旧存档会被提示重新开始 */
const SAVE_VERSION = 6;
let PROG = blank(), GALLERY = [], OUTDATED = false;
try {
  const r = localStorage.getItem(STORE);
  if (r) { const old = JSON.parse(r); if (old.v === SAVE_VERSION) PROG = Object.assign(blank(), old); else OUTDATED = true }
  const g = localStorage.getItem(GSTORE); if (g) GALLERY = JSON.parse(g) || [];
} catch (e) { }
function save() { PROG.v = SAVE_VERSION; try { localStorage.setItem(STORE, JSON.stringify(PROG)); localStorage.setItem(GSTORE, JSON.stringify(GALLERY)) } catch (e) { } }
function addTags(k, target = PROG.tags) { (k || '').split(/\s+/).filter(Boolean).forEach(t => target[t] = (target[t] || 0) + 1) }
function mergeTags(src) { for (const k in src) PROG.tags[k] = (PROG.tags[k] || 0) + src[k] }
function addDom(k, n = 1) { if (k) PROG.dom[k] = (PROG.dom[k] || 0) + n }
function skill(name, v) { (PROG.skills[name] = PROG.skills[name] || []).push(v) }

/* 卡牌编号 */
/* 每张卡在 data.js 里都有固定的 id，增删、调整顺序都不会打乱存档 */
const BYID = {};
[...CARDS, ...GCARDS.she, ...GCARDS.he, ...SURPRISES].forEach((c, i) => {
  if (!c.id) { c.id = 'auto' + i; console.warn('这张卡没有 id，请在 data.js 里补上：', c.say) }
  if (BYID[c.id]) console.warn('卡片 id 重复了：', c.id);
  BYID[c.id] = c;
});
const AVATAR = { '推推': '推', '小谱': '谱', '你的 AI 分身': '影', 'AI 评委': '评', 'AI 选角系统': '选', 'AI 推荐系统': '推', 'A&R': 'A', 'Livehouse老板': 'L' };
const PALETTE = ['#c0646f', '#5a7fd6', '#d08a3a', '#7a6d78', '#3aa58c', '#b5813a', '#6d5aa8', '#c9577f', '#e07b5b', '#44506e', '#2f8a9c', '#a54f8a', '#8a5a36', '#3f8f6a', '#a8473f'];
function avatar(who) { let h = 0; for (const ch of who) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return [AVATAR[who] || who.replace(/\s/g, '')[0], PALETTE[h % PALETTE.length]] }

/* =========================================================
   页面切换
   ========================================================= */
const TITLES = { transit: '回到房间', ideal: '开始之前', intro: '第一关 · 饿死之前', yearbreak: '第一关 · 饿死之前', play: '第一关 · 饿死之前', mini: '第一关 · 音乐关卡', end: '第一关 · 结局', l2: '第二关 · 音乐命运签', l3: '第三关 · 身兼数职的一天', l4: '第四关 · 十年回响', portrait: '音乐人格画像' };
/* 横屏布局：电脑或横着的平板用横屏排版，手机竖屏保持原来的竖向排版 */
function updLX() { document.body.classList.toggle('lx', innerWidth >= 960 && innerWidth / innerHeight > 1.15) }
updLX(); addEventListener('resize', updLX);
/* 同一个页面里换到另一种排版（比如第二关的抽牌），3D 镜头也会跟着移过去 */
function setView(id, v) { const el = $('#' + id); if (el) el.dataset.view = v || ''; document.body.dataset.view = v || ''; if (window.SCENE) SCENE.view(v || (id === 'hub' ? 'hub' : '')) }
function show(id) {
  TOK++; if (E.ctx) E.stopClip();
  $$('.screen').forEach(s => s.hidden = s.id !== id);
  $('#topbar').hidden = id === 'hub'; $('#topTitle').textContent = TITLES[id] || '';
  document.body.dataset.screen = id; setView(id, ($('#' + id) && $('#' + id).dataset.fixed) || '');
  if (window.SCENE) { if (id === 'hub') SCENE.year(PROG.l1save ? PROG.l1save.year : PROG.l1 ? 10 : 0); SCENE.go(id) }
  const el = $('#' + id); if (el && el.scrollTo) el.scrollTo(0, 0);
  if (id === 'play') { renderChans(); updateMood() }
  const rb = $('[data-rules]'); if (rb) rb.hidden = !rulesFor(id) || id === 'intro';
  closeRules();
}
/* 右上角「？ 游戏规则」：任何时候都能再看一眼这一关的规则 */
let MINI_RULES = null;
function rulesFor(id) {
  if (['intro', 'yearbreak', 'play', 'end'].includes(id)) return ['第一关 · 饿死之前', RULES.l1];
  if (id === 'mini') return MINI_RULES ? [MINI_RULES[0], MINI_RULES[1]] : ['第一关 · 饿死之前', RULES.l1];
  if (RULES[id]) return [TITLES[id], RULES[id]];
  return null;
}
/* 回看已经走完的关卡 */
function openReview(i) {
  closeRules(); let h = '';
  if (i === 0 && PROG.l1) { const en = ENDINGS[PROG.l1.id]; h = `<p><b>${en.t}</b></p><p>${en.x}</p><p>十年后，别人介绍你时会说：<b>${en.who}</b>。</p><div class="final">${KEYS.map(k => `<div><b>${PROG.l1.stats[k]}</b><span>${STAT[k]}</span></div>`).join('')}</div>` }
  if (i === 1 && PROG.l2) { const f = PROG.l2; h = `${f.chart ? `<p>命盘：<b>${f.chart}</b></p>` : ''}<p>签文：<b>${f.title}</b></p><p>${f.verse}</p>${f.fx ? `<ul class="fxl">${f.fx.map(x => `<li class="${TAROT_FX[x][2] ? 'up' : 'down'}"><b>${TAROT_FX[x][0]}</b>${TAROT_FX[x][1]}</li>`).join('')}</ul>` : ''}` }
  if (i === 2 && PROG.l3) { const l = PROG.l3; h = `<p><b>${l.title}</b></p><p>这一天挣了 <b>${yuan(l.money || 0)}</b>，拿到 ${l.good ?? l.right} 个好评。</p>${l.fav ? `<p>凌晨两点的朋友圈：「${l.fav}」</p>` : ''}` }
  if (i === 3) { closeRules(); showPortrait(); return }
  const m = document.createElement('div'); m.id = 'rulesModal'; m.className = 'rules-modal';
  m.innerHTML = `<div class="rm-card" role="dialog"><div class="rm-h"><b>回看</b><span>第${['一', '二', '三', '四'][i]}关 · ${LEVELS[i].name}</span></div><div class="rv">${h}</div><button class="btn" data-rules-close>知道了</button></div>`;
  document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-rules-close]')) closeRules() });
}
function closeRules() { const m = $('#rulesModal'); if (m) m.remove() }
function openRules() {
  const r = rulesFor(document.body.dataset.screen); if (!r) return; closeRules();
  const m = document.createElement('div'); m.id = 'rulesModal'; m.className = 'rules-modal';
  m.innerHTML = `<div class="rm-card" role="dialog" aria-label="游戏规则"><div class="rm-h"><b>游戏规则</b><span>${r[0]}</span></div><ol class="rules">${r[1].map(([t, x]) => `<li><b class="rt">${t}</b><p>${x}</p></li>`).join('')}</ol><button class="btn" data-rules-close>知道了</button></div>`;
  document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-rules-close]')) closeRules() });
}
document.addEventListener('click', e => { if (e.target.closest('[data-rules]')) openRules() });
function goHub() {
  if (E.ctx) { E.stopClip(); E.duck(1) }
  if (G) { saveL1(); G = null }
  KEYH = null; stopPreview(false); renderHub(); show('hub'); homeMusic(); MO.drop($('#heroTitle')); MO.rise($('#levels'), '.lvl.sel');
}
/* 开场音乐：主页、选理想、选音乐占比、关卡说明、校准时播放。
   浏览器不允许网页自己出声，所以要等玩家第一次点击或按键后才开始 */
function homeMusic() {
  if (!E.ctx || previewing !== null || E.styleKey === 'chill') return;
  E.resetMood(); E.duck(1); E.play('chill', ALL.chill);
}
const HOME_SCREENS = ['hub', 'ideal', 'intro'];
let skipSndToggle = false;
function firstSound(e) {
  ['pointerdown', 'keydown'].forEach(ev => document.removeEventListener(ev, firstSound, true));
  /* 第一次点的就是“声音”按钮：说明玩家想听，直接开始放，不要反过来把声音关掉 */
  if (e.target && e.target.closest && e.target.closest('[data-snd]')) skipSndToggle = true;
  const ts = $('#tapSound'); if (ts) ts.style.visibility = 'hidden';
  E.init(); if (!E.styleKey && HOME_SCREENS.some(id => !$('#' + id).hidden)) homeMusic();
}
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, firstSound, true));
/* 真乐器音色在后台准备，准备好之前先用合成音色 */
SMP.onState = st => { const ts = $('#tapSound'); if (!ts) return; if (st === 'loading') { ts.textContent = '♪ 正在准备真乐器音色……'; ts.style.visibility = 'visible' } else ts.style.visibility = 'hidden' };

/* =========================================================
   主页
   ========================================================= */
const LEVELS = [
  { no: '1', id: 'l1', name: '饿死之前', desc: '2027 到 2036，每年 4 个选择、1 个音乐关卡。数值到极限会遇到人生转折，一共 19 种活法。', bgmName: 'Lo-fi 爵士', bgm: '每过一年多一种乐器，数值越危险，音乐越紧张。', style: 'lofi' },
  { no: '2', id: 'l2', name: '音乐命运签', desc: '十年后的冬天，你走进一家叫「回声铺」的小店。看不见的调音婆婆听你弹 8 个音，说出你的过去，再给你算下一个十年。', bgmName: '神秘竖琴', bgm: '大提琴持续音加竖琴，用的是带东方色彩的弗里吉亚属调式。', style: 'mystic' },
  { no: '3', id: 'l3', name: '2036 · 身兼数职的一天', desc: '2036 年，没有人只做一件事。从早上 8 点到凌晨 2 点，你要换七个身份，有的和音乐有关，有的在别的行业，比例取决于第一关结局里音乐占你生活几成。每个身份都要用耳朵做一个判断，背后还藏着一个选择。', bgmName: '每个身份一段音乐', bgm: '酒吧是爵士三重奏，咖啡馆是 bossa nova，健身房是 house，音乐节是电子舞曲……最后一段，用的是你在第二关弹的旋律。', style: 'jazz' },
  { no: '4', id: 'l4', name: '十年回响', desc: '回看这十年，回答最后四个问题，写一段旋律交给管弦乐团。最后生成你的音乐人格画像和身份光谱，和你开局时的理想对比。', bgmName: '管弦乐', bgm: '弦乐、大提琴、竖琴、圆号、定音鼓。结局好就走向大调，不好就停在小调。', style: 'orch' }
];
let previewing = null, previewTimer = null, confirmReset = false, hubSel = null;
function levelSummary(i) {
  if (i === 0 && PROG.l1) return '你的活法：' + ENDINGS[PROG.l1.id].t;
  if (i === 1 && PROG.l2) return '你的签：' + PROG.l2.title;
  if (i === 2 && PROG.l3) return `挑对 ${PROG.l3.right} 个 · ${PROG.l3.title}`;
  if (i === 3 && PROG.portrait) return '你的画像：' + PROG.portrait.archT;
  return '已完成';
}
/* 海报上写的结果 */
function levelResult(i) {
  if (i === 0 && PROG.l1) return '活法：' + ENDINGS[PROG.l1.id].t;
  if (i === 1 && PROG.l2) return PROG.l2.chart || PROG.l2.title;
  if (i === 2 && PROG.l3) return '挣了 ' + yuan(PROG.l3.money || 0);
  if (i === 3 && PROG.portrait) return PROG.portrait.archT;
  return '';
}
/* 关卡之间：回到房间，刚走完的那张海报盖上章，下一张亮起来，镜头推过去，进入下一关 */
function transit(i, next) {
  const t0 = TOK + 1; PROG.stage = Math.max(PROG.stage, i + 1); save();
  show('transit'); KEYH = null;
  $('#trDone').textContent = `第${['一', '二', '三', '四'][i]}关 · ${LEVELS[i].name} · 走完了`;
  $('#trResult').textContent = levelResult(i);
  $('#trNext').textContent = LEVELS[i + 1] ? `下一站：第${['一', '二', '三', '四'][i + 1]}关 · ${LEVELS[i + 1].name}` : '';
  const list = st => LEVELS.map((L, k) => ({ no: L.no, name: L.name, result: k <= i && st ? levelResult(k) : k < i ? levelResult(k) : '', state: k < i ? 'done' : k === i ? (st ? 'done' : 'now') : k === i + 1 && st > 1 ? 'now' : 'locked' }));
  let gone = false; const go = () => { if (gone || TOK !== t0) return; gone = true; next() };
  if (window.SCENE) {
    SCENE.posters(list(0)); SCENE.gallery(GALLERY.filter(k => ENDINGS[k]).length); SCENE.view('p' + i);
    setTimeout(() => { if (TOK !== t0) return; SCENE.posters(list(1)); kick(E.sfx, now(), .9, 90, 40, .25); nhit(E.sfx, now(), { g: .3, type: 'bandpass', f: 700, d: .12 }) }, 1100);
    setTimeout(() => { if (TOK !== t0) return; SCENE.posters(list(2)); SCENE.view('p' + Math.min(3, i + 1)); harp(E.sfx, now(), 74, .06) }, 2300);
  }
  $('#trGo').onclick = go; setTimeout(go, window.SCENE ? 5200 : 2600);
}
function renderHub() {
  const st = PROG.stage; if (hubSel == null || hubSel > Math.min(st, 3)) hubSel = Math.min(st, 3);
  /* 3D 房间右墙上的四张海报就是四个关卡，点海报看这一关的介绍 */
  if (window.SCENE) {
    SCENE.posters(LEVELS.map((L, i) => ({ no: L.no, name: L.name, result: i < st ? levelResult(i) : '', state: i < st ? 'done' : i === st ? 'now' : 'locked' })));
    SCENE.gallery(GALLERY.filter(k => ENDINGS[k]).length);
    SCENE.onPick(i => { if (document.body.dataset.screen !== 'hub') return; hubSel = i; sfxSwipe(); renderHub(); MO.rise($('#levels'), '.lvl.sel') });
  }
  $('#levels').innerHTML = LEVELS.map((L, i) => {
    const state = i < st ? 'done' : i === st ? 'now' : 'locked';
    const cont = (i === 0 && PROG.l1save) || (i === 2 && PROG.l3save);
    const tag = state === 'done' ? `<span class="tag done">${levelSummary(i)}</span>` : state === 'now' ? `<span class="tag now">${cont ? '进行中' : '下一关'}</span>` : `<span class="tag">完成第 ${i} 关后解锁</span>`;
    return `<article class="lvl ${state}${i === hubSel ? ' sel' : ''}">
      <span class="no">${L.no}</span>
      <h3>${L.name}${tag}</h3>
      <p>${L.desc}</p>
      <div class="row">${state === 'now' ? `<button class="btn sm" data-go="${L.id}">${cont ? '继续' : '检票入场'}</button>` : ''}${state === 'done' ? `<button class="btn ghost sm" data-review="${i}">回看这一关</button>` : ''}<button class="btn ghost sm listen" data-listen="${i}">试听本关音乐</button></div>
    </article>`}).join('');
  let j = '';
  if (st >= 4) j = `<div class="journey"><span class="eyebrow">十年已经走完</span><h3>你的音乐人格：${PROG.portrait ? PROG.portrait.archT : ''}</h3><div class="row"><button class="btn" data-portrait>查看我的音乐人格画像</button><button class="btn ghost" data-reset>重新开始十年</button></div></div>`;
  else if (st > 0 || PROG.l1save) j = `<p class="mnote">进度会自动保存。关卡只能按顺序玩，没有回头路。<button class="home" data-reset style="margin-left:6px">清空进度，重新开始</button></p>`;
  if (confirmReset) j += `<div class="confirm"><b>确定要清空这十年的全部进度吗？</b><span>理想、选择、命运签和人格画像都会被清空，结局图鉴会保留。</span><div class="row"><button class="btn danger sm" data-reset-yes>清空并重新开始</button><button class="btn ghost sm" data-reset-no>取消</button></div></div>`;
  if (OUTDATED) j = `<div class="confirm"><b>游戏已更新</b><span>你之前的进度和新版本不兼容，需要从头开始。结局图鉴会保留。</span><div class="row"><button class="btn sm" data-outdated-ok>知道了</button></div></div>` + j;
  $('#journey').innerHTML = j;
  const got = new Set(GALLERY);
  $('#gallerySum').textContent = `结局图鉴 · 已解锁 ${[...got].filter(k => ENDINGS[k]).length} / ${Object.keys(ENDINGS).length}`;
  $('#gallery').innerHTML = Object.entries(ENDINGS).map(([k, v]) => `<span class="${got.has(k) ? 'got' : ''}">${got.has(k) ? v.t : '？？？'}</span>`).join('');
}
/* back = true：试听结束后回到开场音乐；false：马上要换别的音乐 */
function stopPreview(back = true) { const was = previewing !== null; previewing = null; clearTimeout(previewTimer); $$('.listen').forEach(b => { b.classList.remove('on'); b.textContent = '试听本关音乐' }); if (E.ctx && !G && back && (was || !E.styleKey)) homeMusic() }
document.addEventListener('click', e => {
  const l = e.target.closest('[data-listen]');
  if (l) {
    const i = +l.dataset.listen; if (previewing === i) { stopPreview(); return }
    const was = previewing !== null; stopPreview(false); previewing = i; E.init(); E.resetMood(); STYLES.lofi.bpm = 84; STYLES.synth.bpm = 100;
    setTimeout(() => { if (previewing !== i) return; E.play(LEVELS[i].style, ALL[LEVELS[i].style]); l.classList.add('on'); l.textContent = '停止试听' }, was ? 500 : 0);
    previewTimer = setTimeout(stopPreview, 16000); return;
  }
  const g = e.target.closest('[data-go]');
  if (g) { const idx = LEVELS.findIndex(L => L.id === g.dataset.go); if (idx !== PROG.stage) return; E.init(); stopPreview(false); if (document.body.dataset.screen === 'end') transit(0, () => startLevel(g.dataset.go)); else startLevel(g.dataset.go); return }
  const rv = e.target.closest('[data-review]'); if (rv) { openReview(+rv.dataset.review); return }
  if (e.target.closest('[data-hub]')) { goHub(); return }
  if (e.target.closest('[data-portrait]')) { E.init(); stopPreview(false); showPortrait(); return }
  if (e.target.closest('[data-reset]')) { confirmReset = true; renderHub(); return }
  if (e.target.closest('[data-reset-no]')) { confirmReset = false; renderHub(); return }
  if (e.target.closest('[data-outdated-ok]')) { OUTDATED = false; PROG = blank(); save(); renderHub(); return }
  if (e.target.closest('[data-recal]')) { E.init(); stopPreview(); calibrate(() => { renderHub(); show('hub') }); return }
  if (e.target.closest('[data-install]')) { if (window.__installEvt) { window.__installEvt.prompt(); window.__installEvt = null } else { const t = $('#installTip'); if (t) t.hidden = !t.hidden } return }
  if (e.target.closest('[data-reset-yes]')) { confirmReset = false; PROG = blank(); save(); renderHub(); return }
});
function startLevel(id) {
  if (id === 'l1') { if (PROG.l1save) resumeL1(); else { homeMusic(); showStart() } }
  else if (id === 'l2') startL2();
  else if (id === 'l3') startL3();
  else startL4();
}

/* =========================================================
   开局：三个问题放在同一页（理想的音乐人、音乐占几成、以他还是她开始）
   ========================================================= */
function showStart() {
  const sel = { ideal: PROG.ideal, share: PROG.share, g: PROG.g };
  const shareIdx = MUSIC_SHARE.findIndex(m => m.v === sel.share);
  $('#ideal').innerHTML = `<p class="lead">三个问题，按你<b>现在真实的想法</b>选。走完四关以后，会拿你十年里的选择和这一刻的答案对比。</p>
    <div class="qgroup"><h4><i>1</i>你心里理想的音乐人</h4><div class="ideals">${Object.entries(IDEALS).map(([k, v]) => `<button class="ideal-btn${sel.ideal === k ? ' on' : ''}" data-ideal="${k}"><b>${v.t}</b><span>${v.d}</span></button>`).join('')}</div></div>
    <div class="qgroup"><h4><i>2</i>十年后，音乐在你生活里占几成？</h4><div class="ideals four">${MUSIC_SHARE.map((m, i) => `<button class="ideal-btn${shareIdx === i ? ' on' : ''}" data-share="${i}"><b>${m.t}（${m.v} 成）</b><span>${m.d}</span></button>`).join('')}</div></div>
    <div class="qgroup"><h4><i>3</i>以谁开始</h4><div class="ideals two"><button class="ideal-btn${sel.g === 'he' ? ' on' : ''}" data-gg="he"><b>他</b></button><button class="ideal-btn${sel.g === 'she' ? ' on' : ''}" data-gg="she"><b>她</b></button></div></div>
    <div class="row"><button class="btn" id="startNext" disabled>下一步：看规则</button></div>`;
  show('ideal'); TT.duo('ideal', TT.gen('开始之前', '先认识一下你', '三个问题'), { intro: true });
  const upd = () => { $('#startNext').disabled = !(sel.ideal && sel.share != null && sel.g) };
  const one = (attr, fn) => $$(`[${attr}]`).forEach(b => b.onclick = () => { $$(`[${attr}]`).forEach(x => x.classList.remove('on')); b.classList.add('on'); fn(b.getAttribute(attr)); sfxSwipe(); upd() });
  one('data-ideal', v => sel.ideal = v); one('data-share', v => sel.share = MUSIC_SHARE[+v].v); one('data-gg', v => sel.g = v);
  $('#startNext').onclick = () => { Object.assign(PROG, { ideal: sel.ideal, share: sel.share, g: sel.g }); save(); showIntro() };
  upd();
}
function showIntro() {
  $('#l1rules').innerHTML = RULES.l1.map(([t, x]) => `<li><b class="rt">${t}</b><p>${x}</p></li>`).join('');
  show('intro');
}
$('#introBack').onclick = () => showStart();
$('#introGo').onclick = () => { E.init(); newGame(PROG.g || 'she') };

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
  E.resetMood(); if (window.ALARM) ALARM.reset(); renderMeters(); yearBreak();
}
function yearLayers() { return Object.entries(UNLOCK).filter(([y]) => +y <= G.year).map(([, n]) => n) }
function applyYearMusic() { STYLES.lofi.bpm = 80 + (G.year - 1); E.play('lofi', yearLayers()); updateMood() }
function yearBreak() {
  G.year++;
  const items = [];
  if (G.year > 1) {
    /* 生活开销：1 点约 1000 元，是扣掉日常零碎收入后一年净花掉的钱，多少取决于住在哪、怎么住 */
    const [rent, where] = livingCost();
    G.s.m = Math.max(0, G.s.m - rent); G.s.f = Math.max(0, G.s.f - 3);
    items.push(['生活开销', `钱 −${rent}（约 ${rent} 千元，${where}）`]);
    items.push(['时间', '名气 −3（没人会一直记得你）']);
    const gig = fameIncome();
    if (gig) { G.s.m = Math.min(100, G.s.m + gig); items.push(['商演收入', `钱 +${gig}（名气越高，找你演出的越多${G.flags.scandal ? '；你有过争议，品牌和演出商都会压价' : ''}）`]) }
  }
  if (UNLOCK[G.year]) items.push(['新乐器', `${STYLES.lofi.layers.find(L => L.name === UNLOCK[G.year]).label}加入了背景音乐`]);
  items.push(['速度', `每分钟 ${80 + G.year - 1} 拍`]);
  items.push(['今年', '4 个选择，1 个音乐关卡']);
  if (G.year === 10) items.push(['最后一年', '撑过今年，你会得到属于自己的活法']);
  G.revised = 0; G.yb = items; if (window.SCENE) SCENE.year(G.year); buildQueue(); checkCrisis(); G.cur = null; saveL1();
  renderYB(); show('yearbreak'); applyYearMusic();
}
/* 名气变现：名气 40 以上才有人找你商演，每多 10 点多 2 点钱；靠争议红起来的，打对折 */
function fameIncome() { const f = G.s.f; if (f < 40) return 0; const v = Math.round((f - 40) / 10) * 2; return G.flags.scandal ? Math.floor(v / 2) : v }
function livingCost() {
  const f = G.flags;
  if (f.smallcity) return [4, '你搬回了小城'];
  if (f.shared) return [6, '你在大城市和人合租'];
  return [8, '你一个人住在大城市'];
}
function renderYB() {
  $('#ybCal').textContent = `${2026 + G.year} 年`; $('#ybBig').textContent = `第 ${G.year} 年`; $('#ybLock').innerHTML = TT.l1(G.year); TT.introSoon(() => $('#ybLock .tt'));
  $('#ybList').innerHTML = G.yb.map(i => `<li><i>${i[0]}</i><span>${i[1]}</span></li>`).join(''); MO.rise($('#ybList'));
}
/* 每年 4 张卡 + 1 个音乐关卡。四个位置：
   ① 真实故事改编（每年必有）② 他/她的专属卡，或一张深一点的卡 ③ 一张短卡（轻松一点）
   ④ 浮动：几年前的选择回来找你（回响），或者一个意外；都没有就换成普通卡
   每局都从题库里随机抽，所以每次遇到的题都不一样 */
function buildQueue() {
  const y = G.year;
  const ok = c => !G.used.includes(c.id) && c.w[0] <= y && y <= c.w[1] && (!c.need || G.flags[c.need]);
  const pool = shuffle(CARDS.filter(ok));
  const take = f => { const i = pool.findIndex(f); return i >= 0 ? { c: pool.splice(i, 1)[0].id } : null };
  const normal = c => !c.fun && !c.need && !c.real;
  const real = take(c => c.real) || take(normal);
  const deep = y <= 8 && G.gLeft.length ? { c: G.gLeft.shift() } : take(normal);
  const fun = take(c => c.fun) || take(normal);
  let flt = Math.random() < .7 ? take(c => c.need) : null;
  if (!flt) { const sLeft = SURPRISES.filter(c => !G.used.includes(c.id) && (!c.need || G.flags[c.need])); if (y >= 2 && sLeft.length && Math.random() < .5) { const hot = sLeft.filter(c => c.need); flt = { c: pick(hot.length ? hot : sLeft).id } } }
  if (!flt) flt = take(normal) || take(() => true);
  /* 长卡和短卡交替：长、短、音乐关卡、长、长 */
  const longs = shuffle([real, deep, flt].filter(Boolean));
  const q = [longs[0], fun, { m: y }, ...longs.slice(1)].filter(Boolean);
  G.queue = q; G.idx = 0; G.total = q.length;
}
$('#ybGo').onclick = () => { if ($('#yearbreak').hidden || !G) return; show('play'); nextCard() };
function resumeL1() {
  G = JSON.parse(JSON.stringify(PROG.l1save)); G.lock = false;
  const refs = [G.cur, ...G.queue].filter(Boolean);
  if (refs.some(r => !resolveCard(r))) { PROG.l1save = null; G = null; save(); OUTDATED = true; renderHub(); show('hub'); return }
  renderMeters(); applyYearMusic(); if (window.SCENE) SCENE.year(G.year);
  if (G.cur) { show('play'); renderCard() } else { renderYB(); show('yearbreak') }
}
function nextCard() {
  if (!G) return;
  if (!G.queue.length) { if (G.year >= 10) return finishL1(G.turn ? G.turn.end : finalEnding(G.s), true); return yearBreak() }
  G.cur = G.queue.shift(); if (!G.cur.x) G.idx++; G.lock = false; G.snapPrev = G.snapCur || null; G.snapCur = snapshot(); saveL1(); renderCard();
}
/* 撤回上一步：保存“做上一个选择之前”的完整状态。每局 3 次 */
function snapshot() {
  const g = JSON.parse(JSON.stringify(Object.assign({}, G, { snapCur: null, snapPrev: null })));
  return { g, tags: JSON.parse(JSON.stringify(PROG.tags)), logLen: PROG.log.length, skills: JSON.parse(JSON.stringify(PROG.skills)) };
}
function undo() {
  if (!G || G.lock || !G.snapPrev || (G.regrets ?? 3) <= 0) return;
  const r = G.snapPrev, left = (G.regrets ?? 3) - 1, used = (G.regretUsed || 0) + 1;
  const cost = regretCost(r); /* 要在恢复存档之前算，那时还记得你刚才选了什么 */
  G = JSON.parse(JSON.stringify(r.g)); G.regrets = left; G.snapCur = r; G.snapPrev = null; G.lock = false;
  PROG.tags = JSON.parse(JSON.stringify(r.tags)); PROG.log.length = r.logLen; PROG.skills = JSON.parse(JSON.stringify(r.skills));
  if (cost.k) G.s[cost.k] = Math.max(0, G.s[cost.k] - 3); else G.revised = (G.revised || 0) + 1;
  G.regretUsed = used;
  saveL1(); applyYearMusic(); show('play'); renderCard(); sfxSwipe(); toast('吃了一颗后悔药。' + cost.say, 2600);
}
/* 后悔药的代价，看你反悔的是哪一件事：
   涉及钱（签约、接活、借钱）→ 违约金，钱 −3；涉及别人（答应了乐队、学生、朋友）→ 说话不算数，名气 −3；
   只关乎你自己 → 不扣数值，这一年的进度上留下一道“改过”的痕迹 */
function regretCost(r) {
  if (!r) return { k: null, tag: '', say: '' };
  const c = resolveCard(r.g.cur), last = PROG.log[r.logLen], opt = c && last ? [c.L, c.R].find(o => o.t === last.pick) || c.R : null;
  const self = !c || /内心|你自己|旧备忘录|意外|体检|你的猫/.test(c.who) || (opt && opt.mini);
  if (opt && opt.e && opt.e.m) return { k: 'm', tag: '违约金 钱 −3', say: '反悔要付违约金，钱 −3。' };
  if (!self) return { k: 'f', tag: '失信 名气 −3', say: `你答应过${c.who}又反悔了，别人会觉得你说话不算数，名气 −3。` };
  return { k: null, tag: '只关乎自己，不扣数值', say: '这件事只关乎你自己，不扣数值，但这一年留下了一道“改过”的痕迹。' };
}
$('#undo').onclick = undo;
function renderUndo() {
  const left = G.regrets ?? 3, b = $('#undo');
  b.disabled = !G.snapPrev || left <= 0;
  const cost = G.snapPrev ? regretCost(G.snapPrev) : null;
  b.textContent = left <= 0 ? '后悔药用完了' : `↶ 撤回上一步${cost && G.snapPrev ? ' · ' + cost.tag : ''} · 还剩 ${left} 颗`;
}
function renderCard() {
  const c = resolveCard(G.cur), [ch, col] = avatar(c.who);
  const card = $('#card'); card.className = 'card enter' + (c.crisis ? ' crisis' : ''); card.style.transform = ''; card.style.opacity = '';
  $('#av').textContent = ch; $('#av').style.background = col;
  $('#who').textContent = c.who; $('#when').textContent = `${2026 + G.year} · 第 ${G.year} 年`; card.dataset.wt = whoType(c);
  const badge = c.crisis ? '<span class="badge">人生岔路</span>' : c.R.mini ? '<span class="badge">音乐关卡</span>' : '';
  const badge2 = c.real ? '<span class="badge real">真实故事改编</span>' : c.who === '意外' ? '<span class="badge">意外</span>' : '';
  MO.type($('#say'), badge + badge2 + c.say);
  $('#src').innerHTML = c.real ? `<button class="src-t" type="button">原型 ▸</button><span class="src-x">${c.real}</span>` : ''; $('#src').hidden = !c.real; $('#src').classList.remove('open');
  $('#prog').textContent = c.crisis ? '' : `今年 ${G.idx}/${G.total}${G.revised ? ` · 改过 ${G.revised} 次` : ''}`;
  const lab = o => `${o.t}${optFx(o, c)}`;
  $('#tL').innerHTML = lab(c.L); $('#tR').innerHTML = lab(c.R);
  $('#leanL').textContent = '← ' + c.L.t; $('#leanR').textContent = c.R.t + ' →';
  if ($('#yrLock').dataset.y !== String(G.year)) { $('#yrLock').dataset.y = G.year; $('#yrLock').innerHTML = TT.l1(G.year); TT.introSoon(() => $('#yrLock .tt')) }
  renderMeters(); renderUndo();
  /* 先发牌：卡片落到中间，停一下，左右两个选项再出现 */
  const t = TOK; document.body.classList.add('dealing'); clearTimeout(renderCard._t);
  void card.offsetWidth; setTimeout(() => card.classList.remove('enter'), 30);
  renderCard._t = setTimeout(() => { if (t === TOK) document.body.classList.remove('dealing') }, 650);
}
/* 卡片是谁发来的：家人、行业里的人、AI、意外，用不同颜色区分 */
function whoType(c) {
  if (c.crisis) return 'crisis'; if (c.who === '意外') return 'luck';
  if (/AI|小谱|推推|系统|算法|分身/.test(c.who)) return 'ai';
  if (/妈|爸|家里|奶奶|爷爷|表哥|表姐|姐姐|哥哥|弟弟|妹妹|对象|伴侣|朋友|室友|邻居|同学|阿飞|内心|你自己/.test(c.who)) return 'near';
  return 'work';
}
/* 选项下面的小标签：这个选择会影响哪几项（只说影响哪几项，不说加减多少） */
function optFx(o, c) {
  if (o.mini) return '<span class="fx"><i class="mini">音乐关卡</i></span>';
  const ks = KEYS.filter(k => (o.e && o.e[k]) || (o.reset && o.reset[k] != null));
  const turn = c && c.crisis && (o.turn || o.end) ? '<i class="turn">人生转折</i>' : '';
  if (!ks.length && !turn) return '';
  return `<span class="fx">${turn}${ks.map(k => `<i data-k="${k}">${STAT[k]}</i>`).join('')}</span>`;
}
document.addEventListener('pointerdown', e => { if (e.target.closest('.src-t')) e.stopPropagation() }, true);
document.addEventListener('click', e => { const b = e.target.closest('.src-t'); if (b) { e.stopPropagation(); const p = b.parentNode; p.classList.toggle('open'); b.textContent = p.classList.contains('open') ? '原型 ▾' : '原型 ▸' } }, true);
/* 选完以后，桌上出现一张小纸条：“后来……”。点一下或等几秒，继续下一张 */
function showAfter(text, done) {
  if (!text) { setTimeout(done, 250); return }
  const n = document.createElement('div'); n.className = 'after-note'; n.innerHTML = `<i>后来</i><p>${text.replace(/^后来/, '')}</p><small>点一下继续</small>`;
  ($('#play .table') || document.body).appendChild(n); G.lock = true;
  let gone = false; const go = () => { if (gone) return; gone = true; n.classList.add('out'); setTimeout(() => { n.remove(); done() }, 220) };
  n.addEventListener('pointerdown', go); setTimeout(go, 1200 + text.length * 70);
}
function preview(side) {
  KEYS.forEach(k => {
    const m = document.querySelector(`.meter[data-k="${k}"]`), d = m.querySelector('.dot'); d.className = 'dot'; m.classList.remove('hint'); if (!side || !G || !G.cur) return; const opt = resolveCard(G.cur)[side];
    if (opt.mini) return; const v = (opt.e || {})[k]; if (v || (opt.reset && opt.reset[k] != null)) { d.className = 'dot ' + (Math.abs(v || 15) >= 12 ? 'b' : 's'); m.classList.add('hint') }
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
    let after = opt.a;
    if (opt.end) {
      /* 人生转折：不提前结束，记下这一次转向，把数值拉回安全的位置，继续把十年走完 */
      const k = c.crisis.replace(/\d+/, ''), low = /0$/.test(c.crisis) && !/100$/.test(c.crisis);
      G.turn = { end: opt.end, y: G.year }; G.turns = (G.turns || []).concat(opt.end);
      if (opt.end === 'ashore' || opt.end === 'hometown') G.flags.smallcity = 1;
      apply(opt.e || {}, { [k]: low ? 30 : 70 }); after = TURN_AFTER[opt.end] || ''; toast('人生转折：' + ENDINGS[opt.end].t + '。日子还要继续。', 2600);
    } else apply(opt.e || {}, opt.reset);
    G.cur = null; saveL1();
    const t = TOK; showAfter(after, () => { if (t === TOK) nextCard() });
  }, 300);
}
function apply(e = {}, reset) {
  let sum = 0;
  KEYS.forEach(k => {
    let v = e[k] || 0; if (reset && reset[k] != null) v = reset[k] - G.s[k] + (e[k] || 0); if (!v) return; sum += v; G.s[k] = Math.max(0, Math.min(100, G.s[k] + v));
    const m = document.querySelector(`.meter[data-k="${k}"]`); m.classList.remove('up', 'down'); void m.offsetWidth; m.classList.add(v > 0 ? 'up' : 'down'); setTimeout(() => m.classList.remove('up', 'down'), 1600);
    m.querySelector('.dl').textContent = (v > 0 ? '+' : '−') + Math.abs(v)
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
  if (!$('#meters').children.length) $('#meters').innerHTML = KEYS.map(k => `<div class="meter" data-k="${k}"><i class="dot"></i><div class="track"><div class="fill"></div></div><span class="mlab">${STAT[k]}</span><span class="mval"></span><b class="dl"></b></div>`).join('');
  if (!G) return;
  KEYS.forEach(k => { const m = document.querySelector(`.meter[data-k="${k}"]`), v = G.s[k]; m.querySelector('.fill').style.height = v + '%'; MO.roll(m.querySelector('.mval'), v); m.setAttribute('aria-label', `${STAT[k]} ${v}`); m.classList.toggle('warn', v <= 20 || v >= 80) });
}
function updateMood() {
  if (!G) return; const s = G.s;
  let d = 0; KEYS.forEach(k => { const v = s[k]; if (v <= 20) d = Math.max(d, (22 - v) / 22); if (v >= 80) d = Math.max(d, (v - 78) / 22) });
  E.mood = { danger: d, love: s.l / 100, orig: s.o / 100 }; E.tempoMul = 1 + .05 * d; if (window.SCENE) SCENE.danger(d); document.body.classList.toggle('danger', d > .3);
  if (E.ctx) E.lp.frequency.setTargetAtTime(d > .05 ? 18000 * Math.pow(1500 / 18000, d) : 18000, now(), .4);
  if (E.styleKey === 'lofi') E.setLayer('heart', d > .15);
  if (window.ALARM) ALARM.check(s);
  const notes = [];
  if (d > .15) notes.push('有数值快到极限了，所以出现了心跳声，声音变闷，节奏变快。');
  if (s.l < 30) notes.push('热爱太低，钢琴开始走音。');
  if (s.o < 35) notes.push('原创太低，节奏不再摇摆，长笛（第 7 年起）变成机器音色。');
  const n = STYLES.lofi.layers.filter(L => E.layers[L.name] && !L.hot).length;
  $('#mnote').textContent = '';
}
function renderChans() {
  const box = $('#chans'); if (!box) return;
  box.innerHTML = STYLES.lofi.layers.map(L => `<span class="ch ${L.hot ? 'hot' : ''} ${E.styleKey === 'lofi' && E.layers[L.name] ? 'on' : ''}">${L.label}</span>`).join('');
}
E.onLayers = renderChans;
function toast(msg, ms = 3200) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), ms) }
E.onLite = on => { if (on) toast('检测到设备有点卡，已自动切换到流畅模式') };
/* 声音开关：每个页面右上角都有，状态全局同步 */
E.onMute = m => $$('[data-snd]').forEach(b => b.textContent = m ? '声音：关' : '声音：开');
document.addEventListener('click', e => { if (e.target.closest('[data-snd]')) { E.init(); if (skipSndToggle) { skipSndToggle = false; return } E.setMute(!E.muted) } });

/* =========================================================
   耳机延迟校准：听到“嗒”就点一下，自动算出延迟
   蓝牙耳机通常有 100～300 毫秒延迟，节奏和稳拍关卡会扣掉它
   ========================================================= */
function calibrate(done) {
  const tok = TOK + 1;
  $('#ideal').innerHTML = `<span class="eyebrow">开始之前 · 10 秒校准</span><h2 class="big-title">听到声音，就点一下</h2>
    <p class="lead">如果你戴的是<b>蓝牙耳机</b>，声音会比画面晚一点，节奏关卡会判不准。接下来会响 8 下“嗒”，每听到一下，就点一下下面的圆圈（或按空格键）。游戏会自动算出你的设备延迟。</p>
    <p class="mnote">用手机外放或有线耳机的话，也可以直接跳过。iPhone 用户请先关闭侧边的静音键，否则网页可能没有声音。</p>
    <div class="tapzone"><div class="beats" id="cbeats">${'<i></i>'.repeat(8)}</div><p class="status" id="cst">准备好了就点「开始校准」</p><button class="tap" id="ctap" disabled>点</button></div>
    <div class="row"><button class="btn" id="cgo">开始校准</button><button class="btn ghost" id="cskip">跳过</button></div>`;
  show('ideal'); TT.duo('ideal', TT.gen('开始之前 · 10 秒校准', '听到就点一下'), { drop: '.eyebrow,.big-title' });
  const beat = .6; let t0 = 0, taps = [], live = false;
  const dots = $$('#cbeats i');
  const finish = ms => { if (ms != null) PROG.latency = ms; save(); KEYH = null; done() };
  $('#cskip').onclick = () => finish(null);
  $('#cgo').onclick = () => {
    $('#cgo').disabled = true; taps = []; t0 = now() + .8; live = true; $('#ctap').disabled = false; $('#cst').textContent = '听……';
    E.playClip(bus => { for (let i = 0; i < 8; i++) { tone(bus, t0 + i * beat, 84, .05, { type: 'triangle', gain: .3, att: .001, rel: .06 }); E.later(() => dots[i] && dots[i].classList.add('on'), (t0 + i * beat - now()) * 1000) } return 8 * beat + 1.2 }, .05, () => {
      if (TOK !== tok) return; live = false;
      const offs = taps.map(t => { const k = Math.round((t - t0) / beat); return (t - (t0 + k * beat)) * 1000 }).filter(o => o > -150 && o < 450).sort((a, b) => a - b);
      if (offs.length < 4) { $('#cst').textContent = '点的次数太少，再试一次吧'; $('#cgo').disabled = false; $$('#cbeats i').forEach(d => d.classList.remove('on')); return }
      const med = Math.max(0, Math.round(offs[Math.floor(offs.length / 2)]));
      $('#cst').textContent = `你的设备延迟约 ${med} 毫秒，节奏关卡会自动扣掉它。`;
      $('#cgo').hidden = true; $('#cskip').textContent = '继续'; $('#cskip').classList.remove('ghost'); $('#cskip').onclick = () => finish(med);
    });
  };
  const tap = () => { if (!live) return; taps.push(now()); const el = $('#ctap'); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 80) };
  $('#ctap').addEventListener('pointerdown', e => { e.preventDefault(); tap() });
  KEYH = e => { if (e.key === ' ') { tap(); return true } };
}
const LAT = () => PROG.latency != null ? PROG.latency / 1000 : (E.ctx ? Math.min(.3, (E.ctx.outputLatency || 0) + (E.ctx.baseLatency || 0)) : 0);

function finishL1(id, survived) {
  const en = ENDINGS[id];
  if (en.tone === 'bad') { E.stop(.3); setTimeout(() => { const t0 = now() + .1;[69, 65, 62, 57].forEach((m, i) => keys(E.sfx, t0 + i * .45, m, i === 3 ? 1.6 : .4, .12)) }, 400) }
  else { E.resetMood(); E.play(en.tone === 'good' ? 'orchM' : 'orch', ['vln', 'cello', 'harpo', 'hornm']) }
  PROG.l1 = { id, stats: { ...G.s }, year: G.year, survived, regrets: G.regretUsed || 0, turns: G.turns || [] }; PROG.l1save = null; PROG.stage = Math.max(PROG.stage, 1);
  if (!GALLERY.includes(id)) GALLERY.push(id); save();
  const n = PROG.log.filter(x => x.lv === 1).length;
  $('#endKind').textContent = G.turn ? `撑过了十年 · 第 ${G.turn.y} 年的人生转折` : '撑过了十年 · 2036';
  $('#endTitle').textContent = en.t; $('#endText').innerHTML = `${en.x}<br><br>十年后，别人介绍你时会说：<b>${en.who}</b>。音乐大约占你生活的 <b>${en.ms} 成</b>${PROG.share != null ? `（你开局时希望是 ${PROG.share} 成）` : ''}。`;
  $('#final').innerHTML = KEYS.map(k => `<div><b>${G.s[k]}</b><span>${STAT[k]}</span></div>`).join('');
  $('#endMusic').textContent = `这一路你做了 ${n} 个选择，它们会在第四关变成你的音乐人格画像。结局图鉴已解锁 ${GALLERY.filter(k => ENDINGS[k]).length} / ${Object.keys(ENDINGS).length}。`;
  G = null; KEYH = null; show('end'); TT.introSoon(() => $('#end .lx-head .tt'));
}

/* 简谱键盘 */
function buildKeys(el, n, onPress) {
  el.innerHTML = `<div class="keys">${Array.from({ length: n }, (_, i) => `<button class="key" data-k="${i}" style="--h:${58 + i * 6}%;--c:hsl(${28 + i * 40} 72% 66%)"><b>${NUM[i]}</b><small>${SOLF[i]}</small></button>`).join('')}</div>`;
  const ks = [...el.querySelectorAll('.key')];
  ks.forEach((k, i) => k.addEventListener('pointerdown', e => { e.preventDefault(); onPress(i) }));
  return { flash(i) { if (!ks[i]) return; ks[i].classList.add('lit'); setTimeout(() => ks[i].classList.remove('lit'), 280) } };
}
