/* =========================================================
   第二关、第三关、第四关和音乐人格画像
   ========================================================= */

/* 把所有心理标签合起来，按次数排序 */
function rankTraits(extra = {}) {
  const T = Object.assign({}, PROG.tags); for (const k in extra) T[k] = (T[k] || 0) + extra[k];
  const keys = Object.keys(TRAITS).sort((a, b) => (T[b] || 0) - (T[a] || 0) || Math.random() - .5);
  return { T, keys };
}
const FLAWY = ['avoid', 'burn', 'approval', 'money', 'ai', 'secure', 'fight', 'auth', 'ideal', 'risk', 'bond'];
const LUCKY_INST = ['钢琴', '大提琴', '长笛', '吉他', '小号', '竖琴', '合成器', '人声'];
const VERSE = {
  ideal: '你会穷，会累，但会一直唱。真正的坎，是有一天你发现自己在等别人允许你理想。',
  money: '账本和乐谱，你都会写得很好。别让账本替乐谱做决定。',
  auth: '你的歌会走在别人前面，所以现在听的人少一点。别把门关得太早。',
  approval: '会有很多人喊你的名字。记得留一个声音，只喊给自己听。',
  risk: '你会押上自己很多次。赢的时候记得收手，输的时候记得回家。',
  secure: '你会一直有退路。总有一天，你得故意把它关上一次。',
  ai: '你会是最早学会和机器合奏的人。别忘了谁是指挥。',
  bond: '你会被很多人需要。下一个十年，学着也需要一下自己。',
  avoid: '你躲开了很多雨，也错过了一些彩虹。',
  fight: '你会赢很多次。赢完以后，回去写歌。',
  burn: '你是一根两头烧的蜡烛，很亮。下一个十年，先学会剪灯芯。'
};

/* =========================================================
   第二关：音乐命运签
   ========================================================= */
const L2 = { notes: [], picks: [], tags: {}, answers: [] };
function startL2() {
  Object.assign(L2, { notes: [], picks: [], tags: {}, answers: [] });
  E.resetMood(); E.duck(1); E.play('mystic', ALL.mystic); KEYH = null;
  $('#l2').innerHTML = `<span class="eyebrow">第二关 · 2036 年 12 月</span><h2 class="big-title">音乐命运签</h2>
    <p class="lead">十年过去了。一个下雪的晚上，你路过一家没有招牌的小店，门口挂着一块木牌：<b>「回声铺」</b>。</p>
    <p class="lead">店里坐着一位眼睛看不见的调音婆婆。她不看手相，也不看八字，只听音乐。</p>
    <div class="speech"><p>“坐吧。随手弹 8 个音给我听。我能听出你这十年是怎么过的，也能告诉你，下一个十年会遇到什么。”</p></div>
    <button class="btn" id="l2go" style="align-self:flex-start">坐下来</button>`;
  show('l2'); TT.duo('l2', TT.l2('音乐命运签', '2036 年冬 · 一家没有招牌的小店', 0), { drop: '.eyebrow,.big-title', mat: 'letter', intro: true }); $('#l2go').onclick = l2Play;
}
function l2Play() {
  setView('l2', '');
  E.duck(.12);
  $('#l2').innerHTML = `<span class="eyebrow">第二关 · 一</span><h2 class="big-title">随手弹 8 个音</h2>
    <p class="lead">不用想，凭感觉弹。键盘是 C 大调，1 是 Do，从左到右越来越高，也可以按数字键 1 到 8。</p>
    <div class="slots" id="l2slots">${'<span></span>'.repeat(8)}</div>
    <div id="l2keys"></div>
    <div class="row"><button class="btn ghost sm" id="l2clear">重来</button></div>`;
  TT.duo('l2', TT.l2('随手弹 8 个音', '凭感觉，不用想', .2), { drop: '.eyebrow,.big-title', mat: 'letter' });
  const kb = buildKeys($('#l2keys'), 8, i => add(i));
  const paint = () => $$('#l2slots span').forEach((s, k) => { s.textContent = L2.notes[k] != null ? NUM[L2.notes[k]] : ''; s.classList.toggle('now', k === L2.notes.length) });
  const add = i => { if (L2.notes.length >= 8) return; playDeg(i); kb.flash(i); L2.notes.push(i); paint(); if (L2.notes.length === 8) { KEYH = null; const t = TOK; setTimeout(() => { if (t === TOK) l2Read() }, 900) } };
  $('#l2clear').onclick = () => { L2.notes = []; paint() };
  KEYH = e => { const i = '12345678'.indexOf(e.key); if (i >= 0) { add(i); return true } };
  paint();
}
function analyzeMelody(a) {
  const v = {}, why = [];
  const range = Math.max(...a) - Math.min(...a); let leaps = 0, reps = 0; for (let i = 1; i < a.length; i++) { const d = Math.abs(a[i] - a[i - 1]); if (d >= 3) leaps++; if (d === 0) reps++ }
  const last = a[a.length - 1], avg = a.reduce((x, y) => x + y, 0) / a.length;
  const add = (k, n = 1) => v[k] = (v[k] || 0) + n;
  if (last === 0 || last === 7) { add('secure'); why.push('你的旋律最后落回了 Do。你是个需要“收尾”的人，事情不落地，你睡不着') } else { add('risk'); why.push(`你的旋律停在 ${NUM[last]}（${SOLF[last]}），没有回到 Do。你习惯给自己留一个问号`) }
  if (leaps >= 3) { add('risk'); add('auth'); why.push(`你一共跳了 ${leaps} 次大跳。你不太按常理出牌`) } else { add('secure'); why.push('你的旋律大多一级一级地走。你谨慎，不轻易冒险') }
  if (range >= 5) { add('approval'); why.push(`你用了 ${range + 1} 个音的音域。你想被很多人听见`) } else { add('bond'); why.push(`你只用了 ${range + 1} 个音的音域。你更在意离你近的人`) }
  if (reps >= 2) { add('ideal'); why.push(`同一个音你连着弹了 ${reps} 次。你很执着，认定的事不轻易换`) }
  if (avg >= 4.5) add('ideal');
  return { v, why };
}
function l2Read() {
  setView('l2', '');
  const tok = TOK; E.duck(1);
  const { v, why } = analyzeMelody(L2.notes); for (const k in v) L2.tags[k] = (L2.tags[k] || 0) + v[k];
  const l1 = PROG.log.filter(x => x.lv === 1 && x.k);
  const keyLog = shuffle(l1.filter(x => x.key)).slice(0, 2).sort((a, b) => a.y - b.y);
  const lines = [`“${why[0]}。”`, `“${why[1]}。”`];
  keyLog.forEach(x => { const t = x.k.split(' ')[0]; lines.push(`“第 ${x.y} 年，${x.who}找过你。你选了<b>「${x.pick}」</b>。那一下，你心里的「${TRAITS[t].n}」占了上风。”`) });
  if (PROG.l1) lines.push(`“十年以后，你成了<b>「${ENDINGS[PROG.l1.id].t}」</b>。”她停了一下，“你自己满意吗？不用回答我。”`);
  lines.push('“好了，过去的事说完了。来，抽三张牌，我们看看下一个十年。”');
  $('#l2').innerHTML = `<span class="eyebrow">第二关 · 二</span><h2 class="big-title">她听见了你的十年</h2><div class="speech" id="l2sp"></div><button class="btn" id="l2next" style="align-self:flex-start" hidden>抽牌</button>`;
  TT.duo('l2', TT.l2('她听见了你的十年', '回声铺 · 婆婆在说', .4), { drop: '.eyebrow,.big-title', mat: 'letter' });
  lines.forEach((ln, i) => setTimeout(() => {
    if (tok !== TOK) return; const p = document.createElement('p'); p.innerHTML = ln; $('#l2sp').appendChild(p);
    harp(E.sfx, now(), [62, 66, 69, 74, 70, 67, 74][i % 7], .05);
    if (i === lines.length - 1) $('#l2next').hidden = false;
  }, 900 + i * 1700));
  $('#l2next').onclick = l2Cards;
}
function l2Cards() {
  L2.picks = [];
  const order = shuffle(TAROT.map((_, i) => i)), pos = ['过去', '现在', '下一个十年'], ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ'];
  $('#l2').innerHTML = `<div class="lx-head" id="l2lock">${TT.l2('抽三张牌', '2036 年冬 · 看看下一个十年', 3 / 5)}</div>
    <div class="letter"><span class="spk">调音婆婆</span><p id="l2tip"></p></div>
    <div class="tarot">${order.map(i => `<div class="tc" data-i="${i}" role="button" tabindex="0" aria-label="一张背面朝上的牌"><div class="back"></div><div class="face"><i>${ROMAN[i]}</i><b>${TAROT[i].n}</b><small></small></div></div>`).join('')}</div>
    <div class="spread slips" id="spread">${pos.map(p => `<div><b>${p}</b>还没翻开</div>`).join('')}<button class="btn" id="l2next" hidden>回答婆婆的三个问题</button></div>`;
  setView('l2', 'tarot'); TT.introSoon(() => $('#l2lock .tt'));
  const tip = h => MO.type($('#l2tip'), h);
  tip(`“第一张是你的<b>过去</b>。别想，凭直觉，${window.SCENE ? '点桌上的一张牌' : '点一张'}。”`);
  if (window.SCENE) { SCENE.tarot(order); SCENE.onPick(k => flip($$('.tc')[k])) }
  const flip = c => {
    if (!c || c.classList.contains('flip') || L2.picks.length >= 3) return;
    const i = +c.dataset.i, k = L2.picks.length; L2.picks.push(i);
    if (window.SCENE) SCENE.flip($$('.tc').indexOf ? [...$$('.tc')].indexOf(c) : 0, ROMAN[i], TAROT[i].n, pos[k]);
    c.querySelector('.face small').textContent = pos[k]; c.classList.add('flip');
    const sc = STYLES.mystic.scale, t = now();[0, 2, 4].forEach((d, j) => harp(E.sfx, t + j * .12, sc[(i + d) % 8] + 12, .07));
    for (const kk in TAROT[i].v) L2.tags[kk] = (L2.tags[kk] || 0) + TAROT[i].v[kk] * (k === 2 ? 1.5 : 1);
    const slot = $$('#spread div')[k]; slot.innerHTML = `<b>${pos[k]}</b>「${TAROT[i].n}」${TAROT[i].mean}`; slot.classList.add('got'); MO.rise($('#spread'), 'div.got:last-of-type');
    if (L2.picks.length < 3) tip(`“「${TAROT[i].n}」……嗯。下一张是你的<b>${pos[L2.picks.length]}</b>。”`);
    else { tip(`“「${TAROT[i].n}」。三张牌都翻开了。来，我问你三个问题。”`); $$('.tc:not(.flip)').forEach(x => x.classList.add('dim')); if (window.SCENE) SCENE.dimRest(); $('#l2next').hidden = false; MO.rise($('#spread'), '#l2next') }
  };
  $$('.tc').forEach(c => { c.onclick = () => flip(c); c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(c) } } });
  $('#l2next').onclick = () => l2Soul(0);
}
function l2Soul(i) {
  if (i >= SOUL_Q.length) return l2Fortune();
  setView('l2', '');
  const Q = SOUL_Q[i];
  $('#l2').innerHTML = `<span class="eyebrow">第二关 · 四 · 第 ${i + 1} / ${SOUL_Q.length} 问</span><h2 class="big-title">婆婆问你</h2>
    <div class="speech"><p>“${Q.q}”</p></div><p class="mnote">说真话。她听得出来。</p>
    <div class="choices-col">${Q.a.map((a, k) => `<button class="btn ghost" data-a="${k}">${a[0]}</button>`).join('')}</div>`;
  TT.duo('l2', TT.l2('婆婆问你', `第 ${i + 1} 问 / 共 ${SOUL_Q.length} 问`, .8), { drop: '.eyebrow,.big-title', mat: 'letter' });
  $$('[data-a]').forEach(b => b.onclick = () => { const a = Q.a[+b.dataset.a]; addTags(a[1], L2.tags); L2.answers.push({ q: Q.q, a: a[0], k: a[1] }); harp(E.sfx, now(), 74, .05); l2Soul(i + 1) });
}
function l2Fortune() {
  setView('l2', '');
  const { T, keys } = rankTraits(L2.tags);
  const top = keys[0], second = keys[1];
  const flaw = FLAWY.filter(k => k !== top).sort((a, b) => (T[b] || 0) - (T[a] || 0))[0];
  const least = keys[keys.length - 1];
  const title = ADJ[second] + NOUN[top];
  const hk = [...new Set([top, second, flaw, ...keys])].slice(0, 3); const hurdles = hk.map(k => HURDLES[k]);
  const lucky = L2.notes[L2.notes.length - 1];
  const fortune = { title, top, second, flaw, least, verse: VERSE[top], hurdles, lucky, notes: L2.notes.slice(), picks: L2.picks.slice() };
  L2.fortune = fortune;
  $('#l2').innerHTML = `<span class="eyebrow">第二关 · 五</span>
    <article class="fortune"><span class="eyebrow">回声铺 · 下一个十年 · 2036—2046</span><h3>${title}</h3>
      <dl>
        <dt>判词</dt><dd>${fortune.verse}</dd>
        <dt>三道坎</dt><dd><ol>${hurdles.map(h => `<li>${h}</li>`).join('')}</ol></dd>
        <dt>贵人</dt><dd>一个身上有你最缺的「${TRAITS[least].n}」的人。你一开始会不太喜欢他，后来会感谢他。</dd>
        <dt>要提防</dt><dd>那个「${TRAITS[flaw].n}」的自己。${TRAITS[flaw].w}</dd>
        <dt>幸运乐器</dt><dd>${LUCKY_INST[lucky]}</dd>
        <dt>幸运音</dt><dd>${NUM[lucky]}（${SOLF[lucky]}），你刚才弹的最后一个音</dd>
      </dl>
      <p class="verse">“这支签你收好。十年后，你会知道它准不准。”</p></article>
    <div class="row"><button class="btn" id="l2hear">听你的命运旋律</button><button class="btn ghost" id="l2done">收下这支签，进入第三关</button></div>
    <p class="mnote">命运旋律是用你刚才弹的 8 个音，配上竖琴和弦乐写成的。播放时背景音乐会暂停，播完自动恢复。</p>`;
  TT.duo('l2', TT.l2('你的签', '2036 → 2046 · 下一个十年', 1), { drop: '.eyebrow', mat: 'letter', intro: true });
  $('#l2hear').onclick = () => {
    if (E.clipBus) { E.stopClip(); $('#l2hear').textContent = '听你的命运旋律'; return }
    $('#l2hear').textContent = '停止';
    E.playClip(bus => fateMelody(bus, L2.notes), 0, () => { const b = $('#l2hear'); if (b) b.textContent = '再听一遍' });
  };
  $('#l2done').onclick = () => {
    mergeTags(L2.tags);
    L2.answers.forEach(a => PROG.log.push({ lv: 2, who: '调音婆婆', say: a.q, pick: a.a, k: a.k }));
    PROG.l2 = fortune; PROG.l2notes = L2.notes.slice(); PROG.stage = Math.max(PROG.stage, 2); save(); startL3();
  };
  bell(E.sfx, now(), 74, .05);
}
/* 命运旋律：你的 8 个音 + 竖琴分解和弦 + 弦乐铺底，最后回到主和弦 */
function fateMelody(bus, notes) {
  const b = 60 / 70, durs = [1.5, .5, 1, 1, 1.5, .5, 1, 1];
  const CH = { 0: [48, [60, 64, 67]], 1: [43, [59, 62, 67]], 2: [48, [60, 64, 67]], 3: [41, [60, 65, 69]], 4: [48, [60, 64, 67]], 5: [41, [60, 65, 69]], 6: [43, [59, 62, 67]], 7: [48, [60, 64, 67]] };
  const ALT = { 0: [45, [60, 64, 69]], 2: [45, [60, 64, 69]], 4: [43, [59, 62, 67]], 5: [45, [60, 64, 69]], 7: [45, [60, 64, 69]] };
  let t = now() + .2, prev = null;
  [48, 55, 60, 64, 67, 72].forEach((m, i) => harp(bus, t + i * .11, m, .05)); t += 1.3;
  notes.forEach((d, i) => {
    let ch = CH[d]; if (prev && prev[0] === ch[0] && ALT[d]) ch = ALT[d]; prev = ch;
    const len = durs[i] * b;
    if (i % 2 === 0 || durs[i] >= 1) { strings(bus, t, ch[0], len * 1.1, .025, { att: .35, cut: 800 }); ch[1].forEach(m => strings(bus, t, m, len * 1.05, .007, { att: .3, cut: 1600 })) }
    harp(bus, t, SCALE[d] + 12, .1); bell(bus, t, SCALE[d] + 24, .015);
    [0, 1, 2].forEach(k => harp(bus, t + k * len / 3, ch[1][k] - 12, .03));
    t += len;
  });
  const last = notes[notes.length - 1];
  if (last !== 0 && last !== 7) { strings(bus, t, 43, b * 1.5, .025, { att: .3, cut: 800 });[59, 62, 67].forEach(m => strings(bus, t, m, b * 1.5, .007, { att: .3 })); harp(bus, t, 74, .09); t += b * 1.5 }
  strings(bus, t, 36, b * 4, .03, { att: .25, cut: 700 });[60, 64, 67].forEach(m => strings(bus, t, m, b * 4, .012, { att: .35 }));
  harp(bus, t, 72, .1);[48, 55, 60, 64, 67, 72, 76, 79, 84].forEach((m, i) => harp(bus, t + .06 * i, m, .04));
  return t - now() + b * 4 + 1.5;
}

/* =========================================================
   第三关：2036 · 制作人的一天
   ========================================================= */
/* 片段播放器。事件格式：[第几拍, 乐器, 音高, 时值(拍), 力度, 音分偏差] */
function sched(bus, o) {
  const b = 60 / o.bpm, t0 = now() + .1; let end = 0;
  o.ev.forEach(([s, k, m, d = 1, g = 1, ct = 0]) => {
    const t = t0 + s * b, dd = d * b, mm = m + ct / 100; end = Math.max(end, s + d);
    switch (k) {
      case 'p': keys(bus, t, mm, dd * .95, .1 * g); break;
      case 'pc': keys(bus, t, mm, dd * .9, .035 * g); break;
      case 'b': tone(bus, t, mm, dd * .85, { type: 'triangle', gain: .3 * g, rel: .12, cut: 900 }); break;
      case 'k': kick(bus, t, .5 * g); break;
      case 's': snare(bus, t, .16 * g); break;
      case 'h': hat(bus, t, .05 * g); break;
      case 'fl': flute(bus, t, mm, dd * .95, .08 * g); break;
      case 'tri': tone(bus, t, mm, dd * .95, { type: 'triangle', gain: .12 * g, att: .002, rel: .08 }); break;
      case 'saw': tone(bus, t, mm, dd * .95, { type: 'sawtooth', gain: .05 * g, att: .01, rel: .12, cut: 1600, q: 8 }); break;
      case 'warm': flute(bus, t, mm, dd * .95, .07 * g); strings(bus, t, mm - 12, dd, .005 * g, { att: .2, cut: 1100 }); break;
      case 'gt': guitar(bus, t, mm, .07 * g); break;
      case 'br': breath(bus, t, dd, g, m); break;
      case 'rise': riser(bus, t, dd, g); break;
      case 'cr': nhit(bus, t, { g: .22 * g, f: 4500, d: 1.4 }); break;
      case 'sh': shutter(bus, t); break;
      case 'xy': bell(bus, t, mm, .06 * g); break;
    }
  });
  return end * b + 1.3;
}
/* 呼吸声：m = 1 吸气（偏亮），m = 0 呼气（偏暗） */
function breath(out, t, d, g, m) {
  const c = E.ctx, s = c.createBufferSource(); s.buffer = E.noise; s.loop = true;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(m ? 1300 : 900, t); f.frequency.linearRampToValueAtTime(m ? 2100 : 650, t + d);
  const a = c.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(.32 * g, t + d * (m ? .7 : .25)); a.gain.linearRampToValueAtTime(0, t + d);
  s.connect(f); f.connect(a); a.connect(out); s.start(t, Math.random() * .5); s.stop(t + d + .05);
}
/* 渐强的噪音“上扬”，音乐节高潮前用 */
function riser(out, t, d, g) {
  const c = E.ctx, s = c.createBufferSource(); s.buffer = E.noise; s.loop = true;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(6000, t + d);
  const a = c.createGain(); a.gain.setValueAtTime(.001, t); a.gain.exponentialRampToValueAtTime(.18 * g, t + d); a.gain.setValueAtTime(0, t + d + .01);
  s.connect(f); f.connect(a); a.connect(out); s.start(t); s.stop(t + d + .05);
}
/* 相机快门：“咔—嚓”两下 */
function shutter(out, t) { nhit(out, t, { g: 1.1, type: 'highpass', f: 4200, d: .018 }); nhit(out, t + .004, { g: .7, type: 'bandpass', f: 2600, d: .03, q: 3 }); nhit(out, t + .055, { g: .9, type: 'bandpass', f: 1900, d: .045, q: 2.5 }); nhit(out, t + .06, { g: .6, type: 'highpass', f: 5200, d: .02 }) }
const chordEv = (list, len, g = 1) => list.flatMap(([s, [r, v]]) => [[s, 'b', r, len, g], ...v.map(m => [s, 'pc', m, len, g])]);
const melEv = (mel, inst = 'p', g = 1, cents) => mel.map(([m, s, d], i) => [s, inst, m, d, g, cents ? cents[i] || 0 : 0]);
const C_ = [48, [55, 60, 64]], F_ = [41, [57, 60, 65]], G_ = [43, [55, 59, 62]], Am_ = [45, [57, 60, 64]], Dm_ = [38, [57, 62, 65]], E_ = [40, [56, 59, 64]], Em_ = [40, [55, 59, 64]];
function drums(beats, pat) { const ev = []; for (let s = 0; s < beats; s++) { ev.push([s, 'k', 0, .5, s % 2 ? .4 : 1]); if (s % 2) ev.push([s, 's', 0, .5]); ev.push([s, 'h', 0, .25], [s + .5, 'h', 0, .25, .7]) } return ev }
const TASKS = {
  mood: {
    who: '奶茶品牌', brief: '新品叫“分手柠檬茶”，广告歌要<b>悲伤</b>一点。三版速度差不多，你仔细听。',
    opts: [
      { ok: true, o: { bpm: 70, ev: [...melEv([[69, 0, 1], [72, 1, .5], [71, 1.5, .5], [69, 2, 1], [64, 3, 1], [65, 4, 1.5], [64, 5.5, .5], [62, 6, 1], [64, 7, 1]]), ...chordEv([[0, Am_], [2, Dm_], [4, E_], [6, Am_]], 2)] } },
      { ok: false, o: { bpm: 70, ev: [...melEv([[72, 0, 1], [76, 1, .5], [74, 1.5, .5], [72, 2, 1], [67, 3, 1], [69, 4, 1.5], [67, 5.5, .5], [65, 6, 1], [67, 7, 1]]), ...chordEv([[0, C_], [2, F_], [4, G_], [6, C_]], 2)] } },
      { ok: false, o: { bpm: 136, ev: [...melEv([[69, 0, 1], [72, 1, .5], [71, 1.5, .5], [69, 2, 1], [64, 3, 1], [65, 4, 1.5], [64, 5.5, .5], [62, 6, 1], [64, 7, 1]]), ...chordEv([[0, Am_], [2, Dm_], [4, E_], [6, Am_]], 2), ...drums(8)] } }
    ],
    why: '对的那版是 <b>A 小调、慢速</b>。另一版速度一样慢，但用的是 C 大调，听起来是温柔，不是悲伤。还有一版也是小调，但速度快了将近一倍，还加了鼓，更像紧张。悲伤通常＝小调＋慢。'
  },
  waltz: {
    who: '婚礼策划', brief: '新人要跳<b>华尔兹</b>，音乐必须是三拍子。注意：有一版很像，但不是。',
    opts: (() => {
      const mel = [72, 71, 69, 72], chs = [C_, G_, Am_, F_];
      const w34 = { bpm: 108, ev: chs.flatMap((c, i) => [[i * 3, 'p', mel[i], 3, .8], [i * 3, 'b', c[0], 1, 1.2], ...c[1].flatMap(m => [[i * 3 + 1, 'pc', m, .9], [i * 3 + 2, 'pc', m, .9]])]) };
      const w68 = { bpm: 108, ev: chs.flatMap((c, i) => [[i * 3, 'p', mel[i], 3, .8], [i * 3, 'b', c[0], 1.5, 1.2], [i * 3 + 1.5, 'b', c[0] + 7, 1.5, .9], ...c[1].flatMap(m => [[i * 3 + .5, 'pc', m, .45, .7], [i * 3 + 1, 'pc', m, .45, .7], [i * 3 + 2, 'pc', m, .45, .7], [i * 3 + 2.5, 'pc', m, .45, .7]])]) };
      const w44 = { bpm: 108, ev: chs.flatMap((c, i) => [[i * 4, 'p', mel[i], 4, .8], [i * 4, 'b', c[0], 1, 1.2], [i * 4 + 2, 'b', c[0] + 7, 1], ...c[1].flatMap(m => [[i * 4 + 1, 'pc', m, .9], [i * 4 + 3, 'pc', m, .9]])]) };
      return [{ ok: true, o: w34 }, { ok: false, o: w68 }, { ok: false, o: w44 }];
    })(),
    why: '华尔兹是 <b>3/4 拍</b>：每小节三拍，“咚、嚓、嚓”。像的那一版是 6/8 拍，虽然也是六个八分音符，但分成两组“咚嚓嚓、咚嚓嚓”，摇起来像船，其实是两拍的感觉。还有一版是 4/4 拍，“咚、嚓、咚、嚓”。'
  },
  pitch: {
    who: '歌手', brief: '我录了三条，挑一条<b>音准最好</b>的。三条差别很小，跟着钢琴仔细听。',
    opts: (() => {
      const mel = [[64, 0, 1], [67, 1, 1], [69, 2, 1.5], [67, 3.5, .5], [64, 4, 1], [62, 5, 1], [64, 6, 2]];
      const acc = chordEv([[0, C_], [2, F_], [4, G_], [6, C_]], 2, .8);
      return [
        { ok: true, o: { bpm: 80, ev: [...melEv(mel, 'fl'), ...acc] } },
        { ok: false, o: { bpm: 80, ev: [...melEv(mel, 'fl', 1, [0, 0, -42, 0, -35, 0, -40]), ...acc] } },
        { ok: false, o: { bpm: 80, ev: [...melEv(mel, 'fl', 1, [0, 8, 15, 22, 28, 34, 40]), ...acc] } }
      ];
    })(),
    why: '对的那条每个音都和钢琴贴在一起。另外两条：一条有三个长音<b>唱低了 35 到 45 音分</b>；一条<b>越唱越高</b>，到最后高了 40 音分。100 音分才是一个半音，所以这种差别要很仔细才听得出来，这正是制作人的基本功。'
  },
  chords: {
    who: '小谱', brief: '“甲方要求全曲<b>只用 C 大调自己的和弦</b>，不许借用调外和弦。我生成了三版，只有一版合格。”',
    opts: (() => {
      const base = [C_, Am_, F_, G_, Em_, Am_, Dm_, G_];
      const mk = arr => ({ bpm: 112, ev: chordEv(arr.map((c, i) => [i * 2, c]), 2) });
      const a = base.slice(); const b = base.slice(); b[2] = [44, [56, 60, 63]]; const c = base.slice(); c[6] = [38, [54, 57, 62]];
      return [{ ok: true, o: mk(a) }, { ok: false, o: mk(b) }, { ok: false, o: mk(c) }];
    })(),
    why: '合格的那版全部是 C 大调自己的和弦：C、Am、F、G、Em、Am、Dm、G。另外两版各借了一个<b>调外和弦</b>：一版把 F 换成了 A♭，一版把 Dm 换成了 D 大三和弦（里面有 F♯）。这两个和弦在流行歌里其实也常用，听起来会“亮一下”或“暗一下”，但这次甲方明确不要。'
  },
  timbre: {
    who: '纪录片导演', brief: '片尾要<b>温暖、柔和</b>的音色，像一件旧毛衣。',
    opts: ['warm', 'tri', 'saw'].map(inst => ({ ok: inst === 'warm', o: { bpm: 80, ev: [...melEv([[72, 0, 1], [71, 1, .5], [69, 1.5, .5], [67, 2, 1.5], [64, 3.5, .5], [65, 4, 1], [67, 5, 1], [64, 6, 2]], inst), ...chordEv([[0, C_], [2, G_], [4, F_], [6, C_]], 2, .7)] } })),
    why: '温暖的音色<b>泛音少、起音慢</b>，像吹出来的气。三角波起音太硬，像电子琴的提示音；带共振的锯齿波有鼻音和电流感。'
  },
  cadence: {
    who: '内心', brief: '最后一句，要听起来<b>真的结束了</b>。小心，有一版很会骗人。',
    opts: [[60, C_], [67, G_], [60, Am_]].map(([end, ch], i) => ({ ok: i === 0, o: { bpm: 88, ev: [...melEv([[64, 0, 1], [65, 1, 1], [67, 2, 1], [69, 3, 1], [67, 4, 1], [65, 5, 1], [64, 6, 1], [62, 7, 1], [end, 8, 3]]), ...chordEv([[0, C_], [4, F_], [6, G_], [8, ch]], 2), [8, 'b', ch[0], 3], ...ch[1].map(m => [8, 'pc', m, 3])] } })),
    why: '只有一版是<b>完全终止</b>：G 和弦走到 C 和弦，旋律落在 1（Do）。有一版停在 G 上，叫<b>半终止</b>，像逗号。最会骗人的那版，旋律也落在 Do，但和弦换成了 Am，叫<b>假终止</b>，耳朵会觉得“还没完”。'
  },
  transpose: {
    who: '客人', brief: '“这首太高了，降两个调唱吧。”乐手给了三个版本。每段先弹<b>原调</b>，停一下，再弹换调后的版本。选出正好<b>降了两个调</b>的那一版。',
    opts: (() => {
      const mel = [[67, 0, .5], [69, .5, .5], [71, 1, 1], [74, 2, 1], [72, 3, .5], [71, 3.5, .5], [69, 4, 2]];
      const chs = [[0, [43, [59, 62, 67]]], [2, [40, [59, 64, 67]]], [4, [38, [57, 62, 66]]]];
      const phrase = (sh, at) => [...mel.map(([m, st, d]) => [st + at, 'p', m + sh, d, 1]), ...chs.flatMap(([st, [r, v]]) => [[st + at, 'b', r + sh, 2, .9], ...v.map(m => [st + at, 'pc', m + sh, 2, .9])])];
      return [-2, -1, -4].map((sh, i) => ({ ok: i === 0, o: { bpm: 96, ev: [...phrase(0, 0), ...phrase(sh, 8)] } }));
    })(),
    why: 'KTV 里说的“降两个调”，是降两个<b>半音</b>，比如从 G 调降到 F 调。只降一个半音的那版几乎听不出差别，客人还是唱不上去；降四个半音的那版低得太多，听起来发闷，像换了一首歌。驻唱每晚都要按客人的嗓子临时换调，靠的是耳朵和手上的功夫。'
  },
  aiwork: {
    who: '学生作业', brief: '你在{place}教编曲课。收上来三份作业，学生都说是自己写的，但其中<b>有一份是 AI 生成的</b>。听出是哪一份。',
    opts: (() => {
      const ai = [[64, 0, 1], [67, 1, 1], [62, 2, 1], [67, 3, 1], [64, 4, 1], [69, 5, 1], [65, 6, 1], [69, 7, 1]];
      const aiEv = { bpm: 108, ev: [...melEv([...ai, ...ai.map(([m, st, d]) => [m, st + 8, d]), [72, 16, 2]]), ...chordEv([[0, C_], [2, G_], [4, Am_], [6, F_], [8, C_], [10, G_], [12, Am_], [14, F_], [16, C_]], 2)] };
      const s1 = { bpm: 108, ev: [...melEv([[67, 0, 1.5], [64, 1.5, .5], [65, 2, .5], [69, 2.5, 1.5], [74, 4, 1], [72, 5, .5], [69, 5.5, .5], [71, 6, 2], [72, 8, .75], [71, 8.75, .25], [69, 9, 1], [67, 10, 1.5], [65, 11.5, .5], [64, 12, 1], [62, 13, 1], [60, 14, 3]]), ...chordEv([[0, C_], [2, Am_], [4, Dm_], [6, G_], [8, C_], [10, Am_], [12, Dm_], [13, G_], [14, C_]], 2)] };
      const s2 = { bpm: 108, ev: [...melEv([[69, 0, 1], [71, 1, .5], [72, 1.5, 1.5], [74, 3, 1], [72, 4, .5], [71, 4.5, .5], [69, 5, 2], [68, 7, 1], [71, 8, 1.5], [69, 9.5, .5], [65, 10, 1], [64, 11, 1], [66, 12, .5], [68, 12.5, 1.5], [69, 14, 3]]), ...chordEv([[0, Am_], [3, F_], [5, Am_], [7, E_], [9, F_], [11, C_], [12, E_], [14, Am_]], 2)] };
      return [{ ok: true, o: aiEv }, { ok: false, o: s1 }, { ok: false, o: s2 }];
    })(),
    why: 'AI 那份太“标准”了：用的是最常见的四个和弦 C、G、Am、F，每个强拍都落在和弦音上，节奏全是整齐的四分音符，后半段和前半段<b>一模一样</b>。两份学生作业都有“不完美”的地方：有切分、有大跳、有不在和弦里的经过音，句子有长有短。这些地方不一定都写得对，但那是一个人在做选择。'
  },
  steady: {
    who: '病人', brief: '你在帮一位中风后的病人练走路。他要跟着节拍迈步，所以节拍必须<b>从头到尾一样稳</b>。三版是同一段音乐，哪一版最稳？',
    opts: (() => {
      const r = (() => { let z = 5; return () => ((z = z * 16807 % 2147483647) / 2147483647) - .5 })();
      const times = [Array.from({ length: 14 }, (_, i) => i), Array.from({ length: 14 }, (_, i) => i - i * i * .012), Array.from({ length: 14 }, (_, i) => i + (i ? r() * .22 : 0))];
      const chs = [C_, C_, F_, F_, G_, G_, C_, C_, Am_, Am_, F_, F_, G_, C_];
      return times.map((ts, k) => ({ ok: k === 0, o: { bpm: 92, ev: ts.flatMap((t, i) => [[t, 'k', 0, .5, .7], [t, 'b', chs[i][0], .8, .8], ...chs[i][1].map(m => [t, 'pc', m, .7, 1])]) } }));
    })(),
    why: '最稳的那版，每一拍的间隔完全一样。另一版<b>越来越快</b>，病人会被拖着走，容易摔；还有一版拍子<b>忽早忽晚</b>，病人没法预判下一步。<span class="sci"><b>科学依据</b>这种方法叫“节奏听觉刺激”。2017 年一篇 Cochrane 系统综述汇总了多项研究，发现它能让中风病人的步速平均每分钟提高约 11 米；综述也提醒，这些研究的整体证据质量偏低。</span>'
  },
  breath: {
    who: '动感单车课', brief: '最后一分钟冲刺。耳机里传来三位学员的呼吸声，听出<b>哪一位已经喘不上来</b>，需要让他先停下。',
    opts: (() => {
      const bed = Array.from({ length: 12 }, (_, i) => [[i, 'k', 0, .5, .45], [i + .5, 'h', 0, .25, .5]]).flat();
      const gasp = [[0, 1, .3], [.45, 0, .2], [.8, 1, .25], [1.6, 0, .2], [1.9, 1, .3], [2.3, 0, .15], [2.55, 1, .2], [3.6, 0, .3], [4, 1, .2], [4.3, 1, .25], [4.7, 0, .2], [5.6, 1, .3], [6, 0, .15], [6.3, 1, .2], [6.6, 0, .2], [7.7, 1, .25], [8.1, 0, .2], [8.4, 1, .2], [9.5, 0, .3], [9.9, 1, .25], [10.3, 0, .2]];
      const fast = Array.from({ length: 22 }, (_, i) => [i * .5, i % 2 ? 0 : 1, .42]);
      const deep = Array.from({ length: 6 }, (_, i) => [[i * 2, 1, .9], [i * 2 + 1, 0, .9]]).flat();
      const mk = p => ({ bpm: 120, ev: [...bed, ...p.map(([t, m, d]) => [t, 'br', m, d, 1.1])] });
      return [{ ok: true, o: mk(gasp) }, { ok: false, o: mk(fast) }, { ok: false, o: mk(deep) }];
    })(),
    why: '快到极限的人，呼吸<b>又浅又乱</b>：吸气很短，节奏忽快忽慢，中间还会突然憋住。另一位呼吸很快，但一吸一呼很有规律，说明他还在控制；还有一位又深又慢，状态最好。AI 手环能测心率，但站在学员身边听出“不对劲”、马上让他停下，是教练的工作。'
  },
  cafe: {
    who: '你的咖啡馆', brief: '下午店里坐满了聊天的客人。选一版<b>不会盖住客人说话</b>的背景音乐。',
    opts: (() => {
      const chs = [[0, C_], [2, Am_], [4, F_], [6, G_]];
      const strum = g => chs.flatMap(([s, [r, v]]) => [[s, 'b', r, 1.6, .6 * g], ...[0, 1, 1.5].flatMap(o => v.map((m, i) => [s + o + i * .02, 'gt', m - 12, .5, .8 * g]))]);
      const loudMel = melEv([[72, 0, .5], [74, .5, .5], [76, 1, 1], [79, 2, .5], [77, 2.5, .5], [76, 3, 1], [74, 4, .5], [72, 4.5, .5], [74, 5, 1], [76, 6, 2]], 'fl', 1.8);
      return [{ ok: true, o: { bpm: 84, ev: strum(.8) } }, { ok: false, o: { bpm: 84, ev: [...strum(1), ...loudMel] } }, { ok: false, o: { bpm: 84, ev: [...strum(1.2), ...drums(8).map(e => [e[0], e[1], e[2], e[3], (e[4] || 1) * 1.6])] } }];
    })(),
    why: '人说话的声音集中在<b>中频</b>。一版有很响的长笛旋律，正好落在说话的频段，客人会不自觉地提高嗓门；一版鼓又密又响，整个店都会变吵。对的那版没有突出的旋律，音量轻、音区偏低，给说话留出了空间。'
  },
  tune: {
    who: '修好的三把吉他', brief: '三把吉他都修好了，各扫一遍同一个和弦。哪一把<b>每根弦都准</b>？',
    opts: (() => {
      const E6 = [40, 47, 52, 56, 59, 64];
      const mk = cents => ({ bpm: 80, ev: [0, 2, 4].flatMap(s => E6.map((m, i) => [s + i * .035, 'gt', m, 2, 1, cents[i]])).concat(E6.map((m, i) => [6 + i * .3, 'gt', m, 1, 1, cents[i]])) });
      return [{ ok: true, o: mk([0, 0, 0, 0, 0, 0]) }, { ok: false, o: mk([0, 0, 0, -35, 0, 0]) }, { ok: false, o: mk([0, 18, 0, 0, 0, 32]) }];
    })(),
    why: '准的那把，和弦听起来是“一整块”的，很干净。另一把的<b>三弦（G♯）低了 35 音分</b>，和弦里会出现一种发苦的颤动；还有一把的<b>一弦和五弦偏高</b>，听起来尖、发亮。修琴的最后一步，永远是用耳朵确认。'
  },
  drop: {
    who: '音乐节主舞台', brief: '乐队正在“蓄力”，马上进入高潮。三版里，快门（“咔嚓”声）按在不同的时刻。哪一次正好按在<b>高潮第一拍</b>上？',
    opts: (() => {
      const roll = [0, 1, 2, 3, 4, 4.5, 5, 5.5, 6, 6.25, 6.5, 6.75, 7, 7.125, 7.25, 7.375, 7.5, 7.625, 7.75, 7.875].map(t => [t, 's', 0, .2, .4 + t / 10]);
      const drop = [[8, 'k', 0, .5, 1.6], [8, 'cr', 0, 2, 1], [8, 'b', 33, 2, 1.4], ...[57, 60, 64].map(m => [8, 'saw', m, 1.5, 2]), ...[9, 10, 11].flatMap(t => [[t, 'k', 0, .5, 1.3], [t + .5, 'h', 0, .25, 1]]), [10, 's', 0, .5, 1.2]];
      const base = [[0, 'rise', 0, 8, 1], ...roll, ...drop];
      return [8, 7.5, 8.75].map((at, i) => ({ ok: i === 0, o: { bpm: 128, ev: [...base, [at, 'sh', 0, .2]] } }));
    })(),
    why: '高潮第一拍，是所有声音同时砸下来的那一瞬间：底鼓、贝斯、镲片一起响，舞台灯也在那一刻全亮。早了半拍，拍到的是乐手在等；晚了，彩带和人群跳起来的最高点已经过去。好的现场摄影师靠的是<b>听歌预判</b>，不是看到了再按。'
  }
};
const L3 = { i: 0, right: 0, own: 0, ai: 0, tags: {}, picks: [], fav: null, roles: null, place: '' };
const L3_PLACES = ['学校', '自己的工作室', '一家培训机构'];
function saveL3() { PROG.l3save = JSON.parse(JSON.stringify({ i: L3.i, right: L3.right, own: L3.own, ai: L3.ai, tags: L3.tags, picks: L3.picks, fav: L3.fav, roles: L3.roles, place: L3.place })); save() }
/* 按第一关结局“音乐大约占你生活几成”分配今天的身份 */
function l3Ms() { const e = PROG.l1 && ENDINGS[PROG.l1.id]; return e ? e.ms : (PROG.share ?? 5) }
function pickRoles() {
  const n = l3MusicCount(l3Ms());
  const musicPool = Object.keys(L3_ROLES).filter(k => L3_ROLES[k].music && k !== 'self'), otherPool = Object.keys(L3_ROLES).filter(k => !L3_ROLES[k].music);
  const music = n <= 2 ? shuffle(['bar', 'teacher']) : shuffle(musicPool).slice(0, n);
  return [...shuffle([...music, ...shuffle(otherPool).slice(0, 6 - n)]), 'self'];
}
function roleMusic(role) {
  if (role.style === 'self') STYLES.self.mel = (PROG.l2notes && PROG.l2notes.length ? PROG.l2notes : [0, 2, 4, 5, 4, 2, 1, 0]);
  E.duck(1); E.play(role.style, ALL[role.style]);
}
function startL3() {
  setView('l3', '');
  E.resetMood(); E.duck(1); KEYH = null;
  if (PROG.l3save) { Object.assign(L3, PROG.l3save); if (!L3.roles) L3.roles = pickRoles(); return L3.i < L3.roles.length ? l3Task() : l3End() }
  Object.assign(L3, { i: 0, right: 0, own: 0, ai: 0, tags: {}, picks: [], fav: null, roles: pickRoles(), place: pick(L3_PLACES) });
  E.play('synth', ['pad', 'sbass']);
  const ms = l3Ms(), n = L3.roles.slice(0, 6).filter(k => L3_ROLES[k].music).length;
  $('#l3').innerHTML = `<span class="eyebrow">第三关 · 2036 年的一天</span><h2 class="big-title">身兼数职的一天</h2>
    <p class="lead">2036 年，几乎没有人只做一件事。你在第一关的结局里，音乐大约占你生活的 <b>${ms} 成</b>，所以今天的六份工作里，有 <b>${n} 份</b>和音乐有关，<b>${6 - n} 份</b>在别的行业。</p>
    <p class="lead">从早上 8 点忙到凌晨 2 点，你要换七个身份：${L3.roles.slice(0, 6).map(k => L3_ROLES[k].name).join('、')}，最后才轮到做回你自己。每换一个身份，背景音乐也会换成那个地方的声音。</p>
    <p class="lead">每个身份都会遇到一个要求，三个版本<b>很接近</b>，要仔细听。不管做哪一行，你靠的都是同一样东西：耳朵。你可以自己挑，也可以点<b>“交给小谱挑”</b>，但小谱是随便挑的。每个要求之后，还有一个小插曲需要你表态。</p>
    <button class="btn" id="l3go" style="align-self:flex-start">开始这一天</button>`;
  show('l3'); if (window.SCENE) SCENE.l3Role(-1, L3.roles); TT.duo('l3', TT.gen('第三关 · 2036 年的一天', '身兼数职的一天', '', 'l3'), { drop: '.eyebrow,.big-title', mat: 'order', intro: true }); $('#l3go').onclick = l3Task;
}
function l3Task() {
  const role = L3_ROLES[L3.roles[L3.i]]; if (!role) return l3End();
  const T = TASKS[role.task], time = L3_TIMES[L3.i];
  show('l3'); KEYH = null; roleMusic(role); if (window.SCENE) SCENE.l3Role(L3.i, L3.roles);
  const order = shuffle(T.opts.map((_, k) => k)), letters = ['A', 'B', 'C'];
  setTimeout(() => { setView('l3', 'task'); TT.intro($('#l3lock .tt')); MO.type($('#l3brief'), T.brief.replace('{place}', L3.place || '学校')); MO.rise($('#l3 .clips'), '.clip') }, 0);
  $('#l3').innerHTML = `<div class="lx-head" id="l3lock">${TT.l3(time, role.name, L3.roles.map(k => L3_PLACE[k]), L3.i)}</div>
    <div class="brief order"><div class="od-h"><b>工作单</b><span>${time} · ${T.who}${role.music ? '' : ' · 音乐以外的工作'}</span></div><p id="l3brief"></p><div class="od-f"><span>今天挑对 ${L3.right} 个 · 交给小谱 ${L3.ai} 次</span><button class="od-ai" id="l3ai">听不出来？交给小谱挑</button></div></div>
    <div class="clips">${order.map((k, j) => `<div class="clip cassette" data-o="${k}"><div class="cs-top"><b>${letters[j]}</b></div><div class="cs-win"><i class="reel"></i><i class="tape"></i><i class="reel"></i></div><div class="cs-btns"><button class="btn ghost sm" data-p="${k}">▶ 播放</button><button class="btn sm" data-c="${k}" disabled>就用 ${letters[j]}</button></div></div>`).join('')}</div>
    <div id="l3res"></div>`;
  const playClip = (o, el) => { $$('.clip').forEach(c => c.classList.remove('playing')); el && el.classList.add('playing'); E.playClip(bus => sched(bus, o), .06, () => el && el.classList.remove('playing')) };
  /* 再点一次正在播的那盘磁带，就停下 */
  $$('[data-p]').forEach(b => b.onclick = () => { const k = +b.dataset.p, el = b.closest('.clip'); if (el.classList.contains('playing')) { E.stopClip(); el.classList.remove('playing'); b.textContent = '▶ 播放'; return } $$('[data-p]').forEach(x => x.textContent = '▶ 播放'); b.textContent = '■ 停止'; playClip(T.opts[k].o, el); const c = document.querySelector(`[data-c="${k}"]`); if (!c.dataset.done) c.disabled = false });
  const decide = (k, byAI) => {
    E.stopClip(); $$('.clip').forEach(c => c.classList.remove('playing')); $$('[data-p]').forEach(x => x.textContent = '▶ 播放');
    $$('[data-c],#l3ai').forEach(b => { b.disabled = true; b.dataset.done = 1 });
    const ok = T.opts[k].ok; if (byAI) { L3.ai++; addTags('ai avoid', L3.tags) } else { L3.own++; if (ok) L3.right++ }
    L3.picks.push({ time, role: L3.roles[L3.i], ok, byAI });
    $$('.clip').forEach(c => { const kk = +c.dataset.o; if (T.opts[kk].ok) c.classList.add('right'); else if (kk === k) c.classList.add('wrong') });
    const L = letters[order.indexOf(k)], R = letters[order.findIndex(x => T.opts[x].ok)];
    const head = byAI ? (ok ? `小谱随手挑了 ${L}，碰巧对了。` : `小谱随手挑了 ${L}，挑错了。对的是 ${R}。`) : (ok ? `你挑了 ${L}，对了。` : `你挑了 ${L}，对的其实是 ${R}。`);
    ok ? sfxGood() : sfxBuzz();
    const ev = role.ev;
    $('#l3res').innerHTML = `<div class="explain"><b>${head}</b><br>${T.why}<br><span class="mnote">现在可以把三个版本再听一遍，对比一下。</span></div>
      <div class="event"><span class="eyebrow">小插曲 · ${ev.who}</span><p>${ev.say}</p><div class="choices-col">${ev.a.map((a, j) => `<button class="btn ghost" data-ev="${j}">${a[0]}</button>`).join('')}</div></div>`;
    $$('[data-ev]').forEach(b => b.onclick = () => {
      const a = ev.a[+b.dataset.ev]; addTags(a[1], L3.tags); PROG.log.push({ lv: 3, who: ev.who, say: ev.say, pick: a[0], k: a[1], time });
      L3.i++; saveL3(); E.stopClip(); L3.i < L3.roles.length ? l3Task() : l3End();
    });
    $('#l3res').scrollIntoView({ behavior: 'smooth', block: 'start' }); MO.rise($('#l3res'));
  };
  $$('[data-c]').forEach(b => b.onclick = () => decide(+b.dataset.c, false));
  $('#l3ai').onclick = () => decide(Math.floor(Math.random() * 3), true);
  saveL3();
}
function l3End() {
  show('l3'); setView('l3', ''); E.duck(1); if (window.SCENE) SCENE.l3Role(6, L3.roles);
  if (E.styleKey !== 'self') roleMusic(L3_ROLES.self);
  const R = L3.roles.map(k => L3_ROLES[k]);
  if (L3.fav == null) {
    $('#l3').innerHTML = `<span class="eyebrow">第三关 · 凌晨 2 点 47 分</span><h2 class="big-title">今天你换了七个身份</h2>
      <p class="lead">${R.map((r, i) => `${L3_TIMES[i]} ${r.name}`).join('，')}。</p>
      <div class="speech"><p>躺下之前，你问自己：今天这七个身份里，<b>哪一个让你最像自己？</b></p></div>
      <div class="choices-col">${R.map((r, i) => `<button class="btn ghost" data-fav="${i}">${r.name}</button>`).join('')}</div>`;
    TT.duo('l3', TT.gen('第三关 · 凌晨 2 点 47 分', `今天你换了${['零', '一', '两', '三', '四', '五', '六', '七'][R.length] || R.length}个身份`, '', 'l3'), { drop: '.eyebrow,.big-title', mat: 'order', intro: true });
    $$('[data-fav]').forEach(b => b.onclick = () => { L3.fav = +b.dataset.fav; PROG.log.push({ lv: 3, who: '你自己', say: '七个身份里，哪一个最像自己？', pick: R[L3.fav].name, k: '' }); saveL3(); l3End() });
    return;
  }
  const fav = R[L3.fav], share = Math.round(L3.own / L3.roles.length * 100);
  let t, x;
  if (L3.own >= L3.roles.length - 1 && L3.right >= L3.roles.length - 2) { t = '靠自己的耳朵'; x = '凌晨 2 点 47 分，你合上电脑。今天七件事，几乎都是你自己听、自己判断的。小谱给你发了一条消息：“你今天几乎没用我。”' }
  else if (L3.own >= Math.ceil(L3.roles.length / 2)) { t = '和小谱搭档'; x = '凌晨 2 点 47 分，你合上电脑。今天有些判断是你做的，有些交给了小谱。你也说不清，哪些功劳算你的。' }
  else { t = '小谱替你听'; x = '凌晨 2 点 47 分，你合上电脑。今天大部分的判断都交给了小谱。你发现自己有点记不清，今天到底听过些什么。' }
  if (L3.right >= L3.roles.length - 1) addTags('auth', L3.tags);
  skill('l3', L3.right);
  $('#l3').innerHTML = `<span class="eyebrow">第三关 · 02:47</span><h2 class="big-title">${t}</h2><p class="lead">${x}</p>
    <p class="lead">你说今天最像你自己的身份，是<b>「${fav.name}」</b>。${fav.name === '你自己' ? '一整天都在给别人做事，最后最像自己的，还是只属于自己的那一刻。' : fav.music ? '还是做音乐的时候。' : '有意思，不是做音乐的那一个。也许你的才华，本来就不止一种用法。'}</p>
    <div class="final"><div><b>${L3.own}</b><span>自己挑</span></div><div><b>${L3.right}</b><span>挑对</span></div><div><b>${L3.ai}</b><span>交给小谱</span></div><div><b>${share}%</b><span>自己判断</span></div></div>
    <p class="mnote">现在的背景音乐，是用你在第二关弹给调音婆婆的那 8 个音写成的。2036 年 AI 能替你生成很多东西，但听出哪里不对、哪个刚刚好，还得靠人的耳朵。</p>
    <button class="btn" id="l3done" style="align-self:flex-start">进入第四关</button>`;
  TT.duo('l3', TT.gen('第三关 · 02:47', t, '', 'l3'), { drop: '.eyebrow,.big-title', mat: 'order' });
  $('#l3done').onclick = () => {
    mergeTags(L3.tags); addDom(fav.dom, 3); PROG.l3 = { own: L3.own, right: L3.right, ai: L3.ai, title: t, fav: fav.name, n: L3.roles.length }; PROG.l3save = null; PROG.stage = Math.max(PROG.stage, 3); save(); startL4();
  };
}

/* =========================================================
   第四关：十年回响
   ========================================================= */
const MAJ = [60, 62, 64, 65, 67, 69, 71, 72], MIN = [60, 62, 63, 65, 67, 68, 70, 72];
const CH_MAJ = [[48, 60, 64, 67], [43, 59, 62, 67], [48, 60, 64, 67], [41, 60, 65, 69], [48, 60, 64, 67], [41, 60, 65, 69], [43, 59, 62, 67], [48, 60, 64, 67]];
const CH_MIN = [[48, 60, 63, 67], [43, 59, 62, 67], [48, 60, 63, 67], [41, 60, 65, 68], [48, 60, 63, 67], [44, 60, 63, 68], [46, 58, 62, 65], [48, 60, 63, 67]];
const L4 = { notes: [], tags: {}, ans: {}, dom: {} };
function countTags(...ks) { return PROG.log.filter(x => x.lv === 1 && ks.some(k => (x.k || '').split(' ').includes(k))).length }
function startL4() {
  setView('l4', '');
  Object.assign(L4, { notes: [], tags: {}, ans: {}, dom: {} });
  E.resetMood(); E.duck(1); E.play('orch', ['vln', 'cello', 'harpo']); KEYH = null; if (window.SCENE) SCENE.hall(1);
  const P = PROG, mem = [];
  const l1 = P.log.filter(x => x.lv === 1 && x.key);
  shuffle(l1).slice(0, 6).sort((a, b) => a.y - b.y).forEach(x => mem.push(`<li><i>${2026 + x.y} · 第 ${x.y} 年</i>${x.who}：“${x.say.replace(/<[^>]+>/g, '').slice(0, 40)}${x.say.length > 40 ? '……' : ''}”<br>你选了<b>「${x.pick}」</b>。</li>`));
  if (P.l1) mem.push(`<li><i>${2026 + P.l1.year} · 第一关的结局</i>你的活法是<b>「${ENDINGS[P.l1.id].t}」</b>。${ENDINGS[P.l1.id].x}</li>`);
  if (P.l2) mem.push(`<li><i>2036 年 12 月 · 回声铺</i>调音婆婆给你的签是<b>「${P.l2.title}」</b>。</li>`);
  if (P.l3) mem.push(`<li><i>2036 · 身兼数职的一天</i>${P.l3.fav ? `七个身份里，你最像自己的是「${P.l3.fav}」。` : ''}你自己挑了 ${P.l3.own} 次，挑对 ${P.l3.right} 次，交给小谱 ${P.l3.ai} 次。这一天你是<b>「${P.l3.title}」</b>。</li>`);
  $('#l4').innerHTML = `<span class="eyebrow">第四关 · 2036 年 12 月 31 日</span><h2 class="big-title">十年回响</h2>
    <p class="lead">十年的最后一个晚上，你坐在钢琴前，回头看这十年。</p>
    <ul class="memories">${mem.join('')}</ul>
    <button class="btn" id="l4go" style="align-self:flex-start">回答最后四个问题</button>`;
  show('l4'); TT.duo('l4', TT.gen('第四关 · 2036 年 12 月 31 日', '十年回响', '十年的最后一个晚上', 'l4'), { drop: '.eyebrow,.big-title', mat: 'programme', intro: true }); $('#l4go').onclick = () => l4Ask(0);
}
function l4Questions() { if (window.SCENE) SCENE.hall(2);
  const id = IDEALS[PROG.ideal] || IDEALS.indie;
  const nSafe = countTags('money', 'secure'), nSelf = countTags('auth', 'ideal'), nSeen = countTags('approval');
  return [
    { q: `开始之前，你说你最想成为<b>「${id.t}」</b>。这十年里，你有 <b>${nSafe}</b> 次选了钱或者稳定，<b>${nSelf}</b> 次选了坚持自己，<b>${nSeen}</b> 次选了被更多人看见。<br>现在有人给你一个机会：用一整年零收入，换一张完全属于你的专辑。你换吗？`, a: [['换', 'ideal auth risk'], ['不换', 'secure money'], ['我不知道', 'avoid']], key: 'trade', mv: 0 },
    { q: '2036 年，AI 已经可以完美模仿你的声音和风格。你觉得你身上，哪一样东西是它<b>永远学不走</b>的？', a: [['我的经历和故事', 'auth'], ['我和听众之间的关系', 'bond'], ['我在现场的那一刻', 'risk'], ['说实话，我不确定', 'ai avoid']], key: 'core', mv: 1 },
    { q: '2036 年的一个饭局上，有人问你：<b>“你是做什么的？”</b>你会怎么回答？', a: SELF_INTRO.map(x => [x[0], x[2], x[1]]), key: 'intro', mv: 2 },
    { q: '如果 2046 年的你回头看今天，最希望你从明天开始做的一件事是什么？', a: SELF_ADVICE.map((t, i) => [t, ['auth', 'secure', 'ai', 'bond'][i]]), key: 'self', mv: 3 }
  ];
}
function l4Ask(i) {
  const Q = l4Questions();
  if (i >= Q.length) return l4Compose();
  const q = Q[i];
  $('#l4').innerHTML = `<div class="lx-head" id="l4lock">${TT.l4(q.mv ?? i)}</div>
    <div class="booklet"><div class="pg pgL"><div class="bk-h">第${['一', '二', '三', '四'][q.mv ?? i]}乐章 · 乐曲解说</div><p id="l4q"></p><span class="bk-note">没有标准答案，只有真话和假话。</span><span class="bk-no">${i * 2 + 2}</span></div>
      <div class="pg pgR"><div class="bk-h">你的回答 · 圈出一个</div><div class="choices-col programme">${q.a.map((a, k) => `<button class="btn ghost" data-a="${k}"><i>${'①②③④'[k]}</i><span>${a[0]}</span><svg class="ink" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M30 8 C110 -4 196 10 190 32 C184 54 60 60 14 46 C-6 38 12 14 52 10"/></svg></button>`).join('')}</div><span class="bk-no">${i * 2 + 3}</span></div></div>`;
  setView('l4', 'ask'); TT.introSoon(() => $('#l4lock .tt')); MO.type($('#l4q'), q.q); MO.rise($('#l4 .choices-col'), 'button');
  /* 在节目单上用笔圈出答案，圈完翻到下一页 */
  $$('[data-a]').forEach(b => b.onclick = () => { if (b.dataset.busy) return; $$('[data-a]').forEach(x => x.dataset.busy = 1); b.classList.add('circled'); tone(E.sfx, now(), 79, .08, { type: 'triangle', gain: .03, rel: .2 }); setTimeout(() => { const a = q.a[+b.dataset.a]; addTags(a[1], L4.tags); if (a[2]) L4.dom[a[2]] = (L4.dom[a[2]] || 0) + 3; L4.ans[q.key] = a[0]; PROG.log.push({ lv: 4, who: '你自己', say: q.q.replace(/<[^>]+>/g, ''), pick: a[0], k: a[1] }); harp(E.sfx, now(), 67, .05); l4Ask(i + 1) }, 750) });
}
function l4Compose() {
  setView('l4', '');
  L4.notes = []; E.play('orch', ['vln']); E.duck(.3);
  $('#l4').innerHTML = `<span class="eyebrow">第四关 · 作曲</span><h2 class="big-title">留给十年前的自己</h2>
    <p class="lead">弹 4 个音，留给 2027 年的自己。弹完以后，管弦乐团会把它奏出来，再高八度演奏一遍，每个音后面都跟着竖琴的回声。1 是 Do，从左到右越来越高，也可以按数字键 1 到 8。</p>
    <div class="slots" id="l4slots">${'<span></span>'.repeat(4)}</div>
    <div id="l4keys"></div>
    <div class="row"><button class="btn ghost sm" id="l4clear">重来</button><button class="btn" id="l4play" disabled>让乐团奏响</button></div>`;
  TT.duo('l4', TT.gen('第四关 · 尾声', '留给十年前的自己', '弹 4 个音', 'l4'), { drop: '.eyebrow,.big-title', mat: 'programme' });
  const kb = buildKeys($('#l4keys'), 8, i => add(i));
  const paint = () => { $$('#l4slots span').forEach((s, k) => { s.textContent = L4.notes[k] != null ? NUM[L4.notes[k]] : ''; s.classList.toggle('now', k === L4.notes.length) }); $('#l4play').disabled = L4.notes.length < 4 };
  const add = i => { if (L4.notes.length >= 4) return; harp(E.sfx, now(), SCALE[i], .1); kb.flash(i); L4.notes.push(i); paint() };
  $('#l4clear').onclick = () => { L4.notes = []; paint() };
  $('#l4play').onclick = l4Finale;
  KEYH = e => { const i = '12345678'.indexOf(e.key); if (i >= 0) { add(i); return true } };
  paint();
}
/* 终章：纯管弦乐（弦乐、大提琴、圆号、竖琴、定音鼓） */
function orchFinale(bus, notes, A, B) { if (window.SCENE) SCENE.hall(3);
  const b = 60 / 72, bar = 4 * b, t0 = now() + .8;
  for (let i = 0; i < 8; i++) {
    const mode = i < 4 ? A : B, deg = notes[i % 4], sc = mode === 'maj' ? MAJ : MIN, ch = (mode === 'maj' ? CH_MAJ : CH_MIN)[deg], t = t0 + i * bar, up = i >= 4, g = up ? 1.25 : 1;
    ch.slice(1).forEach(m => strings(bus, t, m, bar, .016 * g, { att: .6 }));
    strings(bus, t, ch[0] - 12, bar, .04, { att: .3, cut: 700 });
    if (i === 0 || i === 4) timp(bus, t, 43, up ? .55 : .4);
    const mel = sc[deg] + (up ? 12 : 0);
    if (up) { strings(bus, t, mel, b * 2.6, .03, { att: .15, cut: 3000 }); horn(bus, t, mel - 12, b * 2.6, .05) }
    else horn(bus, t, mel, b * 2.6, .08);
    harp(bus, t + b * 2, mel + 12, .06 * g); harp(bus, t + b * 3, mel + 12, .03 * g);
    if (up) for (let k = 0; k < 8; k++) harp(bus, t + k * b / 2, ch[1 + (k % 3)] + 12, .025);
  }
  const tf = t0 + 8 * bar, fin = B === 'maj' ? CH_MAJ[0] : CH_MIN[0];
  fin.slice(1).forEach(m => { strings(bus, tf, m, bar * 1.8, .02, { att: .3, rel: 2 }); strings(bus, tf, m + 12, bar * 1.8, .012, { att: .4, rel: 2 }) });
  strings(bus, tf, fin[0] - 12, bar * 1.8, .05, { att: .25, cut: 600, rel: 2 });
  horn(bus, tf, (B === 'maj' ? MAJ : MIN)[0], bar * 1.8, .08);
  for (let k = 0; k < 12; k++) timp(bus, tf - 1.2 + k * .1, 43, .12 + k * .03, .3);
  timp(bus, tf, 36, .7, 2.5);
  [48, 55, 60, 64, 67, 72, 76, 79, 84].forEach((m, i) => harp(bus, tf + .05 * i, B === 'maj' ? m : m - (m % 12 === 4 ? 1 : 0), .04));
  return { t0, bar, tf, dur: tf - now() + bar * 1.8 + 1.5 };
}
function l4Finale() {
  KEYH = null; E.stop(.8);
  const tone0 = PROG.l1 ? ENDINGS[PROG.l1.id].tone : 'mid';
  const A = tone0 === 'good' ? 'maj' : 'min', B = tone0 === 'bad' ? 'min' : 'maj';
  const modeTxt = { maj: '大调', min: '小调' };
  $('#l4').innerHTML = `<span class="eyebrow">第四关 · 回响中</span><h2 class="big-title">${jp(L4.notes)}</h2>
    <p class="lead">前四小节是你的旋律，由圆号演奏（${modeTxt[A]}）；后四小节高八度，交给弦乐（${modeTxt[B]}）。每个音后面那两声轻响，是竖琴的回声。</p>
    <div class="bars" id="l4bars">${'<i></i>'.repeat(9)}</div>
    <p class="mnote">${A !== B ? '注意听第五小节：小调变成了大调。' : A === 'maj' ? '整段都在大调上，是明亮的回响。' : '整段都停在小调上。'}调式由你第一关的结局决定。</p>
    <button class="btn ghost sm" id="l4skip" style="align-self:flex-start">直接看画像</button>`;
  TT.duo('l4', TT.gen('第四关 · 回响中', jp(L4.notes), '管弦乐团正在演奏你的旋律', 'l4'), { drop: '.eyebrow,.big-title', mat: 'programme' });
  let info;
  E.playClip(bus => { info = orchFinale(bus, L4.notes, A, B); return info.dur }, 0, () => l4End(B));
  const bars = $$('#l4bars i');
  for (let i = 0; i < 9; i++) E.later(() => bars[i] && bars[i].classList.add('on'), (info.t0 - now() + i * info.bar) * 1000);
  $('#l4skip').onclick = () => { E.stopClip(); l4End(B) };
}
function l4End(B) {
  if (PROG.stage >= 4 && PROG.portrait) return showPortrait();
  mergeTags(L4.tags); for (const k in L4.dom) addDom(k, L4.dom[k]);
  PROG.l4 = { notes: L4.notes, mode: B, ans: L4.ans };
  PROG.portrait = buildPortrait(); PROG.stage = 4; save();
  showPortrait(true);
}

/* =========================================================
   音乐人格画像
   ========================================================= */
function buildPortrait() {
  const { T, keys } = rankTraits();
  const total = keys.reduce((a, k) => a + (T[k] || 0), 0) || 1;
  const share = k => (T[k] || 0) / total;
  let best = 'indie', bs = -1;
  for (const a in IDEALS) { let s = 0; for (const t in IDEALS[a].w) s += IDEALS[a].w[t] * share(t); if (s > bs) { bs = s; best = a } }
  const top = keys.filter(k => T[k]).slice(0, 3);
  const asks = top.map(k => { const pool = PROG.log.filter(x => x.lv === 1 && (x.k || '').split(' ').includes(k)); const x = pool.length ? pick(pool) : null; return { k, y: x ? x.y : null, who: x ? x.who : '', pick: x ? x.pick : '' } });
  const dom = {}; for (const k in DOMAINS) dom[k] = PROG.dom[k] || 0;
  for (const t in TRAIT_DOMAIN) for (const d in TRAIT_DOMAIN[t]) dom[d] += (T[t] || 0) * TRAIT_DOMAIN[t][d];
  const dsum = Object.values(dom).reduce((a, b) => a + b, 0) || 1;
  const spec = Object.keys(DOMAINS).map(k => [k, Math.round(dom[k] / dsum * 100)]).sort((a, b) => b[1] - a[1]);
  const endMs = PROG.l1 && ENDINGS[PROG.l1.id].ms != null ? ENDINGS[PROG.l1.id].ms : 5;
  const musicNow = Math.max(1, Math.min(10, Math.round((dom.music / dsum * 10 * 1.6 + endMs) / 2)));
  const ident = spec[0][0] === spec[1][0] ? DOMAIN_NOUN[spec[0][0]] : DOMAIN_ADJ[spec[1][0]] + DOMAIN_NOUN[spec[0][0]];
  const sk = PROG.skills, avg = a => a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  return {
    arch: best, archT: IDEALS[best].t, ideal: PROG.ideal, top, bars: keys.filter(k => T[k]).slice(0, 7).map(k => [k, T[k] || 0]),
    asks, ending: PROG.l1 ? PROG.l1.id : null, fortune: PROG.l2 ? PROG.l2.title : null,
    skills: { rhythm: avg(sk.rhythm), tune: avg(sk.tune), memory: sk.memory ? sk.memory.reduce((a, b) => a + b, 0) : null, memN: sk.memory ? sk.memory.length * 3 : 0, tempo: avg(sk.tempo), ai: sk.ai ? sk.ai.reduce((a, b) => a + b, 0) : null, aiN: sk.ai ? sk.ai.length : 0, l3: PROG.l3 ? PROG.l3.right : null },
    ans: PROG.l4 ? PROG.l4.ans : {}, notes: PROG.l4 ? PROG.l4.notes : [],
    spec, ident, musicNow, share0: PROG.share, endWho: PROG.l1 ? ENDINGS[PROG.l1.id].who : null, fav: PROG.l3 ? PROG.l3.fav : null
  };
}
function showPortrait(fresh) { if (window.SCENE) SCENE.hall(3);
  const p = PROG.portrait || (PROG.portrait = buildPortrait());
  if (!E.styleKey || E.styleKey === 'chill') E.play(p.ans && PROG.l4 && PROG.l4.mode === 'min' ? 'orch' : 'orchM', ['vln', 'cello', 'harpo']);
  const id = IDEALS[p.ideal] || null, same = p.ideal === p.arch;
  const maxv = Math.max(...p.bars.map(b => b[1]), 1);
  const s = p.skills, cells = [];
  if (s.rhythm != null) cells.push([Math.round(s.rhythm * 100) + '%', '演出节奏命中']);
  if (s.tune != null) cells.push([s.tune.toFixed(0) + ' 音分', '调弦平均误差']);
  if (s.memory != null) cells.push([`${s.memory}/${s.memN}`, '听音模仿']);
  if (s.tempo != null) cells.push([s.tempo.toFixed(0) + ' 毫秒', '稳拍平均偏差']);
  if (s.ai != null) cells.push([`${s.ai}/${s.aiN}`, '人机辨听']);
  if (s.l3 != null) cells.push([`${s.l3}/${(PROG.l3 && PROG.l3.n) || 7}`, '身兼数职听辨']);
  const verdict = !id ? '' : same ? '你的选择和你开局时的理想是一致的。十年的风浪没有把你吹离初心，这很难得。' : `你开局时想成为「${id.t}」，但十年里一次次的选择，让你更像「${p.archT}」。这不一定是坏事，但值得想一想：是什么让你走到了这里？是你变了，还是你一开始就没那么想？`;
  const adv = [...(ADVICE[p.arch] || [])];
  if (p.ans.core) adv.unshift(`你说 AI 学不走的，是<b>「${p.ans.core}」</b>。把它放到你作品的最前面，这是你在 AI 时代最硬的底牌。`);
  if (p.ans.self) adv.push(`你给 2046 年的自己留的建议是<b>「${p.ans.self}」</b>。别让它停在一句话上：今天就给它定一个具体的时间，比如每周哪一天、几点。`);
  if (p.top.includes('burn')) adv.push('你的选择里反复出现“透支自己”。请认真对待你的耳朵和睡眠，它们是你唯一不能外包给 AI 的东西。');
  if (p.top.includes('avoid')) adv.push('你常常选择“算了”。试着从小事开始，为自己的作品和报酬说一次“不”。');
  const trade = p.ans.trade ? `<p class="mnote">最后，当被问到“用一年零收入换一张完全属于你的专辑”时，你选了「${p.ans.trade}」。</p>` : '';
  $('#portrait').innerHTML = `<span class="eyebrow">${fresh ? '第四关完成 · ' : ''}音乐人格画像</span>
    <article class="pt-head"><span class="eyebrow">十年的选择，指向的是</span><h3>${p.archT}</h3>
      ${p.ident ? `<p>如果一定要用一句话介绍你：你是一个<b>「${p.ident}」</b>。</p>` : ''}
      <p>${TRAITS[p.top[0]] ? `你身上最强的三种倾向是「${p.top.map(k => TRAITS[k].n).join('」「')}」。` : ''}${p.ending ? `你在第一关活成了「${ENDINGS[p.ending].t}」，` : ''}${p.fortune ? `调音婆婆说你是「${p.fortune}」。` : ''}</p>
      ${id ? `<div class="vs"><div><span>开局时的理想</span><b>${id.t}</b></div><span>→</span><div><span>十年后的你</span><b>${p.archT}</b></div></div><p>${verdict}</p>` : ''}
    </article>
    ${p.spec ? identSection(p) : ''}
    <section class="pt-sec"><h4>你的选择倾向</h4>${p.bars.map(([k, v]) => `<div class="tbar">${TRAITS[k].n}<div><i style="width:${Math.round(v / maxv * 100)}%"></i></div><span>${Math.round(v)}</span></div>`).join('')}<p class="mnote">数字是这种倾向在你所有选择里出现的次数（抽到的牌和弹的旋律也算在内）。</p></section>
    <section class="pt-sec"><h4>你底层的优点</h4><ul>${p.top.map(k => `<li><b>${TRAITS[k].n}。</b>${TRAITS[k].s}</li>`).join('')}</ul></section>
    <section class="pt-sec"><h4>可能的盲点</h4><ul>${p.top.map(k => `<li><b>${TRAITS[k].n}的另一面。</b>${TRAITS[k].w}</li>`).join('')}</ul></section>
    <section class="pt-sec"><h4>几个反问</h4>${p.asks.map(a => `<div class="ask"><i>${a.y ? `第 ${a.y} 年 · ${a.who} · 你选了「${a.pick}」` : TRAITS[a.k].n}</i>${TRAITS[a.k].q}</div>`).join('')}</section>
    ${cells.length ? `<section class="pt-sec"><h4>你的耳朵和手</h4><div class="skill">${cells.map(c => `<div><b>${c[0]}</b><span>${c[1]}</span></div>`).join('')}</div></section>` : ''}
    <section class="pt-sec"><h4>给你在 AI 时代的建议</h4><ul>${adv.map(a => `<li>${a}</li>`).join('')}</ul>${trade}</section>
    ${p.notes && p.notes.length ? `<p class="mnote">你留给十年前自己的旋律：<b style="color:var(--brass);font-family:var(--f-mono)">${jp(p.notes)}</b></p>` : ''}
    <p class="mnote">这份画像来自你在游戏里做的选择，它照出的是你今天的价值观，是一面镜子，不是心理诊断，也不是预言。选择的时候越诚实，它照出来的你就越真实。</p>
    <div class="row"><button class="btn" id="poster">生成分享海报</button><button class="btn ghost" data-hub>回到主页</button><button class="btn ghost" data-reset>重新开始十年</button></div>`;
  show('portrait'); TT.duo('portrait', TT.gen('十年的选择，指向的是', p.archT, p.ident ? `一句话介绍你：「${p.ident}」` : '', 'l4'), { drop: '#portrait > .eyebrow', mat: 'programme', intro: !!fresh });
  $('#poster').onclick = () => makePoster(p);
}

function identSection(p) {
  const diff = p.share0 == null ? null : p.musicNow - p.share0;
  const cmp = diff == null ? '' : Math.abs(diff) <= 1 ? `你开局时希望音乐占 ${p.share0} 成，十年后它大约占 ${p.musicNow} 成，几乎一致。你很清楚音乐在你生活里的位置。`
    : diff < 0 ? `你开局时希望音乐占 ${p.share0} 成，按你十年的选择算，它大约只占 ${p.musicNow} 成。是生活把它挤走了，还是你在别的地方找到了同样的热爱？这两种答案，意味着完全不同的下一步。`
      : `你开局时以为音乐只占 ${p.share0} 成，按你十年的选择算，它大约占了 ${p.musicNow} 成。也许你低估了自己有多需要它。`;
  const lines = [];
  if (p.endWho) lines.push(`第一关结束时，别人这样介绍你：「${p.endWho}」。`);
  if (p.fav) lines.push(`2036 年身兼数职的那一天，你觉得最像自己的身份是「${p.fav}」。`);
  if (p.ans && p.ans.intro) lines.push(`饭局上被问到“你是做什么的”，你回答：${p.ans.intro}`);
  return `<section class="pt-sec"><h4>身份光谱：十年后，你不只是一种人</h4>
    ${p.spec.map(([k, v]) => `<div class="tbar">${DOMAINS[k].slice(0, 2)}<div><i style="width:${v}%"></i></div><span>${v}%</span></div>`).join('')}
    <p class="mnote">由你所有选择背后的倾向，加上你在第三、第四关的回答推算。五块分别是：${Object.values(DOMAINS).join('、')}。</p>
    <ul>${lines.map(l => `<li>${l}</li>`).join('')}<li>${cmp}</li><li>${/音乐人$/.test(p.ident) ? `音乐仍然是你的主线，但你不只是“音乐人”：你是一个<b>${p.ident}</b>。另一种能力，正是你在 AI 时代和别人拉开差距的地方。` : `“音乐人”这三个字不必框住你。会开车不等于你是司机，会写歌也不等于你只能是“音乐人”。你是一个<b>${p.ident}</b>，音乐是你的能力之一，而不是你唯一的名字。`}</li></ul></section>`;
}

/* =========================================================
   键盘和启动
   ========================================================= */
document.addEventListener('keydown', e => {
  if (KEYH && !e.repeat && KEYH(e)) { e.preventDefault(); return }
  if (!$('#play').hidden && G && !G.lock) { if (e.key === 'ArrowLeft') { e.preventDefault(); choose('L') } if (e.key === 'ArrowRight') { e.preventDefault(); choose('R') } }
  if (!$('#yearbreak').hidden && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('#ybGo').click() }
});
document.addEventListener('click', e => { if (e.target.closest('[data-reset]') && !$('#portrait').hidden) { goHub(); confirmReset = true; renderHub() } }, true);
renderHub(); renderMeters();

/* 安装成 App（手机、电脑都可以）：只在正式网址（https）上生效 */
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__installEvt = e });

/* =========================================================
   分享海报：把画像画成一张 1080×1920 的竖版图片
   ========================================================= */
async function makePoster(p) {
  const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const disp = '"ZCOOL QingKe HuangYou","Noto Sans SC",sans-serif', body = '"Noto Sans SC","PingFang SC",sans-serif', mono = '"IBM Plex Mono",monospace';
  try { await Promise.all([document.fonts.load(`120px ${disp}`, p.ident + p.archT + '我的音乐人格画像十年回响'), document.fonts.load(`700 40px ${body}`, '音乐教育技术商业生活'), document.fonts.load(`40px ${mono}`, 'REVERB 2036')]) } catch (e) { }
  const C = { ink: '#16131d', stage: '#221d2e', line: '#3b3450', brass: '#e3a93c', fg: '#f2ecf7', soft: '#d6cee2', mute: '#9d94b0', paper: '#efe5cf', pink: '#c0464f' };
  const g = x.createRadialGradient(W / 2, -200, 100, W / 2, 200, 1400); g.addColorStop(0, '#2c2440'); g.addColorStop(1, C.ink);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const wrap = (t, x0, y0, maxW, lh, font, color) => { x.font = font; x.fillStyle = color; let line = '', y = y0; for (const ch of t) { if (x.measureText(line + ch).width > maxW && line) { x.fillText(line, x0, y); line = ch; y += lh } else line += ch } if (line) x.fillText(line, x0, y); return y + lh };
  const M = 90;
  x.font = `30px ${mono}`; x.fillStyle = C.mute; x.fillText('十年回响 · REVERB 2036', M, 130);
  x.strokeStyle = C.line; x.lineWidth = 2; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(M, 170 + i * 9); x.lineTo(W - M, 170 + i * 9); x.stroke() }
  x.font = `52px ${disp}`; x.fillStyle = C.soft; x.fillText('我的音乐人格画像', M, 310);
  let y = wrap(p.ident || p.archT, M, 450, W - M * 2, 140, `128px ${disp}`, C.brass);
  y = wrap(`十年的选择，指向的是「${p.archT}」`, M, y + 10, W - M * 2, 56, `500 40px ${body}`, C.fg);
  /* 理想 vs 现实 */
  const id = IDEALS[p.ideal];
  if (id) {
    y += 30; x.fillStyle = C.stage; x.fillRect(M, y, W - M * 2, 170);
    x.font = `28px ${body}`; x.fillStyle = C.mute; x.fillText('开局时的理想', M + 40, y + 55); x.fillText('十年后的我', W / 2 + 40, y + 55);
    x.font = `700 44px ${body}`; x.fillStyle = C.fg; x.fillText(id.t, M + 40, y + 120); x.fillText(p.archT, W / 2 + 40, y + 120);
    x.fillStyle = C.brass; x.font = `44px ${body}`; x.fillText('→', W / 2 - 30, y + 105); y += 230;
  }
  if (p.musicNow != null) y = wrap(`音乐占我生活的 ${p.musicNow} 成${p.share0 != null ? `（开局时希望是 ${p.share0} 成）` : ''}`, M, y + 20, W - M * 2, 56, `700 40px ${body}`, C.fg);
  /* 身份光谱 */
  if (p.spec) {
    y += 30; x.font = `700 34px ${body}`; x.fillStyle = C.brass; x.fillText('身份光谱', M, y); y += 40;
    p.spec.forEach(([k, v]) => {
      x.font = `32px ${body}`; x.fillStyle = C.soft; x.fillText(DOMAINS[k].slice(0, 2), M, y + 30);
      x.fillStyle = '#0f0d14'; x.fillRect(M + 120, y + 8, W - M * 2 - 240, 26); x.fillStyle = C.brass; x.fillRect(M + 120, y + 8, (W - M * 2 - 240) * v / 100, 26);
      x.font = `30px ${mono}`; x.fillStyle = C.mute; x.fillText(v + '%', W - M - 90, y + 32); y += 62;
    });
  }
  /* 三种倾向 */
  y += 30; x.font = `700 34px ${body}`; x.fillStyle = C.brass; x.fillText('最强的三种倾向', M, y); y += 30;
  let cx = M; p.top.forEach(k => { const t = TRAITS[k].n; x.font = `36px ${body}`; const w = x.measureText(t).width + 60; x.strokeStyle = C.brass; x.lineWidth = 3; x.beginPath(); x.roundRect ? x.roundRect(cx, y, w, 70, 35) : x.rect(cx, y, w, 70); x.stroke(); x.fillStyle = C.fg; x.fillText(t, cx + 30, y + 48); cx += w + 20 });
  y += 130;
  if (p.top[0]) y = wrap('“' + TRAITS[p.top[0]].q + '”', M, y, W - M * 2, 54, `36px ${body}`, C.soft);
  /* 底部 */
  x.fillStyle = C.paper; x.fillRect(0, H - 220, W, 220);
  x.font = `52px ${disp}`; x.fillStyle = C.ink; x.fillText('你是哪一种音乐人？', M, H - 130);
  x.font = `30px ${mono}`; x.fillStyle = '#7a6d78'; x.fillText('mayciosher.github.io/reverb-2036', M, H - 70);
  const url = cv.toDataURL('image/png');
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<img alt="我的音乐人格画像分享海报" src="${url}"><p>手机：长按图片保存或直接分享。电脑：点下面的按钮保存。</p><div class="row" style="justify-content:center"><a class="btn" download="十年回响-我的音乐人格画像.png" href="${url}">保存图片</a><button class="btn ghost" id="pclose">关闭</button></div>`;
  document.body.appendChild(m); m.querySelector('#pclose').onclick = () => m.remove(); m.onclick = e => { if (e.target === m) m.remove() };
}
