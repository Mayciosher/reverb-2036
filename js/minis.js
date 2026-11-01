/* =========================================================
   第一关：每年一个音乐小游戏，十年十种玩法，每种只考一种能力
   1 跟着节拍按准      Livehouse 暖场（下落音符，方向键）
   2 把音调到一样高    帮吉他手调弦
   3 听音              录音棚试音（单音、变化音、音程、和弦，参考音是 la）
   4 自己稳住速度      节拍器坏了
   5 分辨真人和 AI     A&R
   6 听出哪件乐器独奏  乐团排练
   7 数小节            主舞台救场（在第 4 小节最后一拍敲镲）
   8 编曲              慢歌录制（把乐器一层层拼回去）
   9 旋律记忆          综艺半决赛（一个八度的八个音，越来越长）
   10 终极对决         综艺总决赛：你 vs AI 歌手（写词、读现场、临场表达，观众投票）
   每个游戏：标题登场 → 游戏规则 → 点「开始」才开始 → 结算（星星、最好成绩、再来一次）
   ========================================================= */
const MINI_KEY = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'], ARROW = ['←', '↓', '↑', '→'];
let MG = null;
const MINI_DEF = {
  rhythm: { eye: '上台演出', title: 'Livehouse 暖场', cal: true, rules: [['怎么按', '音符落到金线时，按对应的方向键 ← ↓ ↑ →，手机上直接点那一列。'], ['连击', '连续按中，分数越滚越高；漏一个，连击就断了。'], ['你按中的音', '会变成这首歌的旋律，按不中就没有声音。']], run: gRhythm,
    eff: [{ f: -8, l: -6 }, { m: 3, f: -3 }, { m: 8, f: 4 }, { m: 14, f: 10, l: 5 }],
    say: [['翻车了', '第二首唱到一半，观众开始刷手机。'], ['磕磕绊绊', '你听见台下有人笑了一声。演出费只拿到一半。'], ['还不错', '有几个地方乱了，但观众没听出来。'], ['全场跟唱', '台下有人举起手机录你。老板当场多给了一倍演出费。']] },
  tune: { eye: '凭耳朵调弦', title: '帮吉他手调弦', rules: [['听拍音', '标准音和琴弦一起响，没对准时会听到“哇—哇—”的起伏。'], ['拖动滑块', '起伏越慢越接近，完全听不到起伏就调准了。'], ['一共三根弦', '每根弦调好了就点「调好了」。']], run: gTune,
    eff: [{ o: -6, l: -4 }, { o: 2 }, { o: 6, l: 4 }, { o: 10, l: 6, f: 4 }],
    say: [['没调准', '最后还是用了调音器。你开始想，耳朵是不是被耳机泡坏了。'], ['还行', '大致准了，但录音师还是偷偷开了修音。'], ['很准', '录音师点点头，没说什么，这就是最高评价。'], ['比调音器还准', '吉他手看了一眼调音器，愣住了：“分毫不差。”']] },
  ear: { eye: '录音棚试音', title: '听音', rules: [['先听 la', '每道题都会先弹一个标准音 la，再弹要你听的声音。'], ['六道题', '单音（有黑键上的音）、两个音之间的距离、三个音一起响的和弦，越往后越难。'], ['连对', '连续答对有连击加分。每题可以再听一遍。']], run: gEar,
    eff: [{ o: -8, l: -6 }, { o: -2 }, { o: 6, l: 4 }, { o: 12, l: 8, f: 4 }],
    say: [['没听出来', '走出录音棚，你在地铁上把那段声音听了二十遍。'], ['有点吃力', '你开始怀疑，自己是不是太依赖 AI 扒谱了。'], ['还行', '错了几题，但听得出你有底子。'], ['耳朵很好', '对方愣了一下：“你学过视唱练耳吧？”']] },
  tempo: { eye: '心里的拍子', title: '节拍器坏了', cal: true, rules: [['先听 4 下', '节拍器会响 4 下，然后它就坏了，背景音乐也会停。'], ['自己接着拍', '用同样的速度拍 8 下：按空格，或者点节拍器。第一下早一点晚一点都没关系。'], ['只看稳不稳', '算的是你每两下之间隔多久：每一下的间隔都和节拍器一样长，就是满分。耳机有延迟也不影响。']], run: gTempo,
    eff: [{ o: -6, f: -4 }, { o: -2 }, { o: 5, f: 3 }, { o: 8, f: 6, l: 4 }],
    say: [['拍子乱了', '鼓手叹了口气，把节拍器拿去修了。'], ['有点飘', '你越拍越急，像在追什么。'], ['很稳', '鼓手冲你点了点头。'], ['稳得像节拍器', '鼓手说：“节拍器不用修了，有你就行。”']] },
  ai: { eye: '人机辨听', title: '哪段是人弹的？', rules: [['两轮', '每轮两段钢琴，同一段旋律，一段是真人，一段是 AI。'], ['听三件事', '速度有没有快慢，每个音有没有轻重，音和音之间是断开还是连着。'], ['都听完才能选', '第二轮的 AI 也学会了“不完美”，要更仔细。']], run: gAi,
    eff: [{ o: -10, l: -4 }, { o: 2 }, { o: 8, f: 4 }, { o: 12, f: 6, l: 4 }],
    say: [['被骗过去了', '两轮都没听出来。A&R 在你的名字后面画了一个问号。'], ['一半一半', '第一轮听出来了，第二轮被骗了。'], ['听出来了', 'A&R 在你的名字后面画了一个勾。'], ['两轮全对', 'A&R 说：“这种耳朵，以后会越来越值钱。”']] },
  solo: { eye: '乐团排练', title: '谁在独奏？', rules: [['四段音乐', '整个乐团一起在演奏，其中一件乐器在吹（拉）主旋律，它只比别人响一点点。'], ['选出是哪件乐器', '每段有四个选项，里面有音色很像的乐器，比如小提琴和中提琴。'], ['每段只放一次', '不能重听，第一遍就要竖起耳朵。连续答对有连击加分。']], run: gSolo,
    eff: [{ o: -6, l: -3 }, { o: 1 }, { o: 6, l: 4 }, { o: 10, l: 6, f: 4 }],
    say: [['没听出来', '指挥摇摇头：“下次排练，你坐在乐团中间听。”'], ['勉强', '你听出了一两件，其他的都混在了一起。'], ['不错', '指挥说：“耳朵挺灵。”'], ['全听出来了', '指挥放下指挥棒：“明天你来当助理指挥。”']] },
  fill: { eye: '主舞台救场', title: '数着小节打鼓', cal: true, rules: [['数小节', '你要在指定小节的最后一拍，敲一下镲（过门）。屏幕上不会提示你数到第几小节了。'], ['三轮', '第一轮四拍子，数到第 4 小节；第二轮鼓手会在第 2 小节故意敲一个假过门骗你；第三轮换成三拍子，数到第 6 小节。'], ['怎么敲', '按空格，或者点那面镲。敲得越准，台下越嗨。']], run: gFill,
    eff: [{ f: -10, l: -5 }, { m: 3, f: -2 }, { m: 10, f: 8 }, { m: 16, f: 14, l: 5 }],
    say: [['乱了', '过门敲早了，乐队全乱了，三万人一起愣住。'], ['勉强', '有一轮敲对了，乐队硬是接住了你。'], ['救场成功', '三万人跟着你的过门一起跳了起来。'], ['封神', '第二天热搜：“替补鼓手的过门，比原鼓手还准。”']] },
  arrange: { eye: '慢歌录制', title: '把编曲拼回去', rules: [['参考小样', '先听参考小样：里面有鼓、贝斯、和弦三层。'], ['每层选一个', '每一层有三个版本，选出和小样一样的那个。'], ['少听几遍', '可以随时听小样和你的版本对比。听得越少就拼对，分数越高。']], run: gArrange,
    eff: [{ o: -6, l: -4 }, { o: 2 }, { o: 7, l: 4 }, { o: 12, l: 6, m: 4 }],
    say: [['拼错了', '制作人听了一遍，默默打开了 AI 编曲。'], ['差一点', '错了一层，听起来总有哪里不对。'], ['拼对了', '制作人说：“就是这个感觉。”'], ['一次就拼对', '制作人把工程文件交给你：“以后编曲你来。”']] },
  simon: { eye: '综艺半决赛', title: '越来越长的旋律', rules: [['只能用耳朵', '八个键是一个完整的八度：简谱 1 2 3 4 5 6 7 和高音 1（do re mi fa sol la si do）。放旋律的时候键不会亮，只能靠听音高记住，再按顺序弹回来（也可以按数字键 1 到 8）。'], ['越来越长', '一开始就有 4 个音，每对一次多一个音，也会越来越快。'], ['错一个就结束', '弹错时会亮出正确的那个键。记住的音越多，分数越高。']], run: gSimon,
    eff: [{ o: -6, f: -6 }, { o: 2, f: -2 }, { o: 8, f: 8 }, { o: 12, f: 14, l: 5 }],
    say: [['第一轮就出局了', '镜头给了你一个特写，你笑得有点僵。'], ['记住了一些', '你差一点就进了决赛。'], ['进了决赛', '导演说：“观众很喜欢你认真的样子。”'], ['第一名进决赛', '最后一个音弹完，全场站了起来。']] },
  finale: { eye: '综艺总决赛', title: '终极对决：你 vs AI 歌手', rules: [['两位选手', '总决赛只剩你，和 AI 歌手「回声」。中间那根条是全场观众的投票，往哪边倒，哪边领先。'], ['三个回合', '写词对决、读现场、主持人提问。这一关不考节奏和音高，考的是 AI 最难学会的东西。'], ['票数过半就赢', '三个回合打完，票数过半的人拿冠军。']], run: gFinale,
    eff: [{ o: -8, f: -6 }, { o: 2, f: 2 }, { o: 10, f: 10, l: 4 }, { o: 16, f: 16, l: 8 }],
    say: [['输给了 AI', '颁奖时，回声向你鞠了一躬。它的声音很好听，但台下有人在喊你的名字。'], ['惜败', '只差一点。散场后，好几个观众在门口等你签名。'], ['险胜', '票数咬得很紧，最后一刻，观众站到了你这边。'], ['冠军', '彩带落下来的时候，你想起十年前那个在 Livehouse 暖场的自己。']] }
};
MINI_DEF.tempo2 = MINI_DEF.tempo; /* 兼容旧名字 */

function miniHead(eye, title) { $('#miniEye').textContent = '音乐关卡 · ' + eye; $('#miniTitle').textContent = title; $('#miniDesc').textContent = ''; TT.introSoon(() => $('#mini .lx-head .tt')) }
function startMini(kind) {
  const d = MINI_DEF[kind]; if (!d) { console.warn('没有这个小游戏：', kind); return }
  MG = { kind, tries: 0, best: null };
  show('mini'); E.hold(1); KEYH = null;
  MINI_RULES = ['音乐关卡 · ' + d.title, d.rules];
  miniHead(d.eye, d.title);
  $('#miniBody').innerHTML = `<div class="mg-rules"><h3 class="rules-h">游戏规则</h3><ol class="rules">${d.rules.map(([t, x]) => `<li><b class="rt">${t}</b><p>${x}</p></li>`).join('')}</ol>
    <div class="row"><button class="btn mg-go" id="mgGo">开始</button>${d.cal ? '<button class="home" id="mgCal">总是对不上拍？校准一下耳机</button>' : ''}</div></div>`;
  MO.rise($('#miniBody .rules'));
  $('#mgGo').onclick = () => runMini();
  if (d.cal) $('#mgCal').onclick = () => calibrate(() => { const t = MG; startMini(kind); MG.best = t.best; MG.tries = t.tries });
}
function runMini() {
  const d = MINI_DEF[MG.kind]; MG.tries++; KEYH = null; E.stopClip(); TOK++; /* 换一局：上一局还在跑的计时器全部作废 */
  $('#miniBody').innerHTML = ''; const t = TOK;
  d.run((ratio, detail) => { if (t === TOK) miniFinish(ratio, detail) });
}
const starsOf = r => r >= .85 ? 3 : r >= .6 ? 2 : r >= .3 ? 1 : 0;
const NEXT = [.3, .6, .85];
/* 结算：星星、最好成绩、差一点就升星的提示、再来一次 */
function miniFinish(ratio, detail) {
  TOK++; KEYH = null; E.stopClip(); E.hold(1);
  const d = MINI_DEF[MG.kind], st = starsOf(ratio);
  PROG.best = PROG.best || {}; const key = MG.kind, prevBest = PROG.best[key];
  const isBest = prevBest == null || ratio > prevBest; if (isBest) { PROG.best[key] = ratio; save() }
  if (!MG.best || ratio > MG.best.ratio) MG.best = { ratio, st };
  skill(key, ratio);
  const use = MG.best, [title, text] = d.say[use.st], eff = scaleEff(d.eff[use.st]);
  const gap = st < 3 ? Math.ceil((NEXT[st] - ratio) * 100) : 0;
  const near = st < 3 && gap <= 12 ? `<p class="near">只差 ${gap} 分就${['一', '两', '三'][st]}星了！</p>` : '';
  const chips = KEYS.filter(k => eff[k]).map(k => `<span class="chip ${eff[k] > 0 ? 'p' : 'n'}">${STAT[k]} ${eff[k] > 0 ? '+' : '−'}${Math.abs(eff[k])}</span>`).join('') || '<span class="chip">数值不变</span>';
  const left = 3 - MG.tries;
  $('#miniBody').innerHTML = `<div class="result mg-res">
    <div class="stars">${[0, 1, 2].map(i => `<i class="${i < st ? 'on' : ''}" style="--i:${i}">★</i>`).join('')}</div>
    <h3>${d.say[st][0]}</h3><p class="mg-detail">${detail}</p>${near}
    <p class="mg-best">${isBest && prevBest != null ? '<b>新纪录！</b>' : ''}本局 ${Math.round(ratio * 100)} 分 · 最好纪录 ${Math.round(PROG.best[key] * 100)} 分</p>
    ${MG.tries > 1 ? `<p class="mnote">这一年按你几次里最好的一次算：${use.st} 星。</p>` : ''}
    <p>${text}</p><div class="chips">${chips}</div>
    <div class="row">${left > 0 ? `<button class="btn ghost" id="mgAgain">再来一次（还剩 ${left} 次）</button>` : ''}<button class="btn" id="miniBack">回到这一年</button></div></div>`;
  if (st === 3) sfxGood(); else if (st === 0) sfxBuzz();
  MO.rise($('#miniBody .mg-res'));
  if (left > 0) $('#mgAgain').onclick = () => runMini();
  $('#miniBack').onclick = () => {
    if (!G) return; const c = resolveCard(G.cur); commitChoice(c, c.R);
    show('play'); applyYearMusic(); apply(eff); G.cur = null; saveL1(); setTimeout(nextCard, 250);
  };
}
/* 越往后的年份，奖惩越大一点 */
function scaleEff(e) { const k = 1 + ((G ? G.year : 1) - 1) * .06, o = {}; for (const x in e) o[x] = Math.round(e[x] * k); return o }
function comboEl() { const d = document.createElement('div'); d.className = 'combo'; d.innerHTML = '<b>0</b><span>连击</span>'; return d }
function setCombo(el, n) { if (!el) return; el.querySelector('b').textContent = n; el.classList.toggle('hot', n >= 3); el.classList.remove('pop'); void el.offsetWidth; if (n) el.classList.add('pop') }

/* ---------- 1. Livehouse 暖场：下落音符 ---------- */
function gRhythm(done) {
  const tok = TOK;
  $('#miniBody').innerHTML = `<div class="rh" id="rh">${ARROW.map((k, i) => `<div class="lane" data-i="${i}"><span class="lk">${k}</span></div>`).join('')}<div class="hitline"></div><div class="judge" id="judge"></div><div class="count" id="count"></div></div><p class="score" id="score">准备</p>`;
  const cb = comboEl(); $('#rh').appendChild(cb);
  const lanes = $$('#rh .lane');
  ['keys', 'bass', 'drums'].forEach(n => E.setLayer(n, true)); E.setLayer('flute', false); E.setLayer('guitar', false);
  const d16 = E.d16(), beat = d16 * 4; let t0 = E.nextBarTime(); if (t0 - now() < 2.2) t0 += 16 * d16;
  const offs = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 21, 22, 24, 26, 27, 28, 30];
  srand(7 + MG.tries); let ln = 0; const curBar = Math.floor(E.step / 16);
  const notes = offs.map(o => { ln = Math.max(0, Math.min(3, ln + (rnd() < .5 ? -1 : 1) * (rnd() < .7 ? 1 : 2))); const t = t0 + o * beat / 2; const bar = curBar + Math.floor((E.step % 16 + (t - E.nextTime) / d16) / 16); const ch = chordAt(STYLES.lofi, bar); return { t, lane: ln, pitch: ch.v[ln] + 12, done: false, el: null } });
  const travel = 1.5; let pts = 0, hits = 0, combo = 0, maxCombo = 0, live = true;
  const judgeEl = $('#judge'); let jt;
  const judge = (txt, cls) => { judgeEl.textContent = txt; judgeEl.className = 'judge show ' + cls; clearTimeout(jt); jt = setTimeout(() => judgeEl.className = 'judge', 260) };
  const hit = i => {
    if (!live) return; const n0 = now() - LAT(); lanes[i].classList.add('press'); setTimeout(() => lanes[i].classList.remove('press'), 90);
    let best = null, bd = 9; for (const n of notes) { if (n.done || n.lane !== i) continue; const d = Math.abs(n.t - n0); if (d < bd) { bd = d; best = n } }
    if (best && bd < .12) { best.done = true; const p = bd < .055 ? 2 : 1; combo++; maxCombo = Math.max(maxCombo, combo); pts += p * (1 + Math.min(combo, 10) * .05); hits++; keys(E.sfx, now(), best.pitch, .5, .13); best.el && best.el.classList.add('ok'); judge(p === 2 ? '完美' : '不错', 'good'); setCombo(cb, combo) }
    else { nhit(E.sfx, n0, { g: .05, type: 'bandpass', f: 400, d: .06 }); combo = 0; setCombo(cb, 0) }
    $('#score').textContent = `命中 ${hits} / ${notes.length}`;
  };
  KEYH = e => { const i = MINI_KEY.indexOf(e.key); if (i >= 0) { hit(i); return true } };
  lanes.forEach((l, i) => l.addEventListener('pointerdown', e => { e.preventDefault(); hit(i) }));
  const maxPts = notes.length * 2 * 1.4;
  const frame = () => {
    if (tok !== TOK) return;
    const n0 = now(), H = lanes[0].clientHeight * .84;
    const left = t0 - n0; $('#count').textContent = left > 0 ? (left > beat * 3 ? '准备' : Math.ceil(left / beat)) : '';
    for (const n of notes) {
      const p = 1 - (n.t + LAT() - n0) / travel; if (p < 0) continue;
      if (!n.el) { n.el = document.createElement('i'); n.el.className = 'nt'; lanes[n.lane].appendChild(n.el) }
      if (!n.done) n.el.style.transform = `translateY(${p * H}px)`;
      if (!n.done && n0 - LAT() > n.t + .16) { n.done = true; n.el.classList.add('miss'); judge('错过', 'bad'); combo = 0; setCombo(cb, 0) }
    }
    if (n0 > notes[notes.length - 1].t + .9) { live = false; return done(Math.min(1, pts / maxPts * 1.15), `命中 ${hits} / ${notes.length}，最高连击 ${maxCombo}。`) }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------- 2. 调弦：听拍音 ---------- */
function gTune(done) {
  const tok = TOK;
  E.hold(.1);
  const notes = [64, 69, 62];
  let round = 0, errs = [], off = 0, TU = null, mode = 'both';
  $('#miniBody').innerHTML = `<div class="rounds" id="rounds"><i></i><i></i><i></i></div>
    <div class="tuner"><p class="status" id="tstat">第 1 根弦</p>
      <div class="row" style="justify-content:center"><button class="btn sm" data-m="both">一起听</button><button class="btn ghost sm" data-m="ref">只听标准音</button><button class="btn ghost sm" data-m="str">只听琴弦</button></div>
      <input type="range" id="tslider" min="-100" max="100" step="1" value="0" aria-label="调整琴弦音高">
      <div class="scale"><span>← 调低</span><span>调高 →</span></div>
      <button class="btn" id="tdone" style="align-self:center">调好了</button></div>`;
  const start = () => {
    if (tok !== TOK) return;
    const m = notes[round]; off = (Math.random() < .5 ? -1 : 1) * (35 + Math.random() * 40);
    $('#tslider').value = 0; $('#tstat').textContent = `第 ${round + 1} 根弦 · 慢慢拖，仔细听拍音`;
    E.playClip(bus => {
      const c = E.ctx, mk = det => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.045, now(), .05); o.connect(f); f.connect(g); g.connect(bus); o.start(); return { o, g } };
      TU = { ref: mk(0), str: mk(off) }; setMode(mode); return 900;
    }, .1);
  };
  const setMode = md => { mode = md; if (!TU) return; TU.ref.g.gain.setTargetAtTime(md === 'str' ? 0 : .045, now(), .03); TU.str.g.gain.setTargetAtTime(md === 'ref' ? 0 : .045, now(), .03); $$('[data-m]').forEach(b => b.classList.toggle('ghost', b.dataset.m !== md)) };
  $$('[data-m]').forEach(b => b.onclick = () => setMode(b.dataset.m));
  $('#tslider').oninput = e => { if (TU) TU.str.o.detune.setTargetAtTime(off + +e.target.value, now(), .03) };
  $('#tdone').onclick = () => {
    if (!TU) return; const err = Math.abs(off + +$('#tslider').value); errs.push(err);
    $$('#rounds i')[round].className = err < 12 ? 'ok' : 'no';
    $('#tstat').textContent = err < 5 ? `几乎完美，只差 ${err.toFixed(0)} 音分` : err < 12 ? `很准，差 ${err.toFixed(0)} 音分` : `还差 ${err.toFixed(0)} 音分（100 音分是一个半音）`;
    err < 12 ? sfxGood() : sfxBuzz(); E.stopClip(); TU = null; round++;
    setTimeout(() => { if (tok !== TOK) return; if (round < 3) start(); else { const avg = errs.reduce((a, b) => a + b, 0) / errs.length; done(Math.max(0, Math.min(1, 1 - (avg - 3) / 30)), `三根弦平均差 ${avg.toFixed(0)} 音分。`) } }, 1400);
  };
  start();
}

/* ---------- 3. 录音棚试音：听音 ---------- */
const LA = 69;
const NOTE_NAME = { '-9': 'Do', '-8': '♯Do / ♭Re', '-7': 'Re', '-6': '♯Re / ♭Mi', '-5': 'Mi', '-4': 'Fa', '-3': '♯Fa / ♭Sol', '-2': 'Sol', '-1': '♯Sol / ♭La', 0: 'La', 1: '♯La / ♭Si', 2: 'Si', 3: '高音 Do' };
const INTERVALS = [[3, '小三度', '有点忧伤'], [4, '大三度', '明亮'], [5, '纯四度', '像号角'], [7, '纯五度', '空旷'], [12, '八度', '同一个音，高了一层']];
const CHORDS = [[[0, 4, 7], '大三和弦', '明亮'], [[0, 3, 7], '小三和弦', '暗淡'], [[0, 3, 6], '减三和弦', '紧张'], [[0, 4, 8], '增三和弦', '悬着']];
function earQuestion(type) {
  if (type === 'note') {
    const black = [-8, -6, -3, -1, 1], white = [-9, -7, -5, -4, -2, 2, 3];
    const ans = pick(Math.random() < .55 ? black : white);
    const opts = shuffle([ans, ...shuffle(Object.keys(NOTE_NAME).map(Number).filter(x => x !== ans && Math.abs(x - ans) <= 4)).slice(0, 3)]);
    return { q: '这个音是什么？', play: (bus, t) => keys(bus, t, LA + ans, 1, .14), opts: opts.map(x => [NOTE_NAME[x], x === ans]) };
  }
  if (type === 'interval') {
    const [n, name] = pick(INTERVALS), root = 57 + Math.floor(Math.random() * 6);
    const opts = shuffle([INTERVALS.find(x => x[0] === n), ...shuffle(INTERVALS.filter(x => x[0] !== n)).slice(0, 3)]);
    return { q: '这两个音之间，是什么距离？', play: (bus, t) => { keys(bus, t, root, .7, .13); keys(bus, t + .75, root + n, .9, .13) }, opts: opts.map(x => [`${x[1]}<small>${x[2]}</small>`, x[0] === n]) };
  }
  const [iv, name] = pick(CHORDS), root = 57 + Math.floor(Math.random() * 5);
  return { q: '这个和弦是哪一种？', play: (bus, t) => { iv.forEach((x, i) => keys(bus, t + i * .18, root + x, .5, .1)); iv.forEach(x => keys(bus, t + .7, root + x, 1.4, .09)) }, opts: shuffle(CHORDS.slice()).map(x => [`${x[1]}<small>${x[2]}</small>`, x[1] === name]) };
}
function gEar(done, list) {
  const tok = TOK, types = list || ['note', 'interval', 'chord', 'note', 'interval', 'chord'];
  E.hold(.06);
  let i = 0, right = 0, combo = 0, maxCombo = 0, pts = 0, Q = null, reps = 1, answered = false;
  $('#miniBody').innerHTML = `<div class="rounds" id="rounds">${types.map(() => '<i></i>').join('')}</div><p class="status" id="estat"></p>
    <div class="ear-q"><div class="row" style="justify-content:center"><button class="btn ghost sm" id="eref">听标准音 la</button><button class="btn ghost sm" id="erep">再听一遍</button></div>
    <div class="ear-opts" id="eopts"></div></div>`;
  const cb = comboEl(); $('#miniBody').appendChild(cb);
  const play = withRef => E.playClip(bus => { let t = now() + .25; if (withRef) { keys(bus, t, LA, .9, .12); t += 1.25 } Q.play(bus, t); return t - now() + 2.4 }, .06);
  const ask = () => {
    if (tok !== TOK) return;
    if (i >= types.length) return done(Math.min(1, pts / (types.length * 1.25)), `${types.length} 题对了 ${right} 题，最高连击 ${maxCombo}。`);
    Q = earQuestion(types[i]); reps = 1; answered = false;
    $('#estat').textContent = `第 ${i + 1} / ${types.length} 题 · ${Q.q}`; $('#erep').disabled = false; $('#erep').textContent = '再听一遍（1）';
    $('#eopts').innerHTML = Q.opts.map(([t], k) => `<button class="btn ghost ear-o" data-k="${k}">${t}</button>`).join('');
    $$('.ear-o').forEach(b => b.onclick = () => answer(+b.dataset.k));
    setTimeout(() => play(true), 350);
  };
  const answer = k => {
    if (answered) return; answered = true; const ok = Q.opts[k][1];
    $$('.ear-o').forEach((b, j) => { b.disabled = true; if (Q.opts[j][1]) b.classList.add('right'); else if (j === k) b.classList.add('wrong') });
    $$('#rounds i')[i].className = ok ? 'ok' : 'no';
    if (ok) { right++; combo++; maxCombo = Math.max(maxCombo, combo); pts += 1 + Math.min(combo - 1, 3) * .1; sfxGood() } else { combo = 0; sfxBuzz() }
    setCombo(cb, combo); i++; setTimeout(ask, 1300);
  };
  $('#eref').onclick = () => { if (!answered) E.playClip(bus => { keys(bus, now() + .05, LA, .9, .12); return 1.2 }, .06) };
  $('#erep').onclick = () => { if (answered || reps <= 0) return; reps--; $('#erep').disabled = true; play(false) };
  KEYH = e => { const k = '1234'.indexOf(e.key); if (k >= 0 && $$('.ear-o')[k]) { answer(k); return true } };
  ask();
}

/* ---------- 4. 节拍器坏了 ---------- */
function gTempo(done) {
  const tok = TOK, bpm = 92, N = 8, beat = 60 / bpm;
  $('#miniBody').innerHTML = `<div class="metro-wrap"><button class="metro" id="metro" aria-label="点这里打拍子">
      <svg viewBox="0 0 200 240"><defs><linearGradient id="mw" x1="0" x2="1"><stop offset="0" stop-color="#7a4a2a"/><stop offset=".5" stop-color="#a86a3e"/><stop offset="1" stop-color="#6a3e22"/></linearGradient></defs>
      <path d="M40 228 L74 22 Q100 8 126 22 L160 228 Z" fill="url(#mw)" stroke="#3b2414" stroke-width="3"/>
      <path d="M70 200 L84 46 Q100 38 116 46 L130 200 Z" fill="#f3e6cc" stroke="#3b2414" stroke-width="2"/>
      ${Array.from({ length: 9 }, (_, i) => `<line x1="${92 - i * .6}" x2="${108 + i * .6}" y1="${60 + i * 15}" y2="${60 + i * 15}" stroke="#8a6a4a" stroke-width="1.2"/>`).join('')}
      <g id="pend" style="transform-origin:100px 196px"><line x1="100" y1="196" x2="100" y2="40" stroke="#2b2230" stroke-width="4" stroke-linecap="round"/><rect x="90" y="86" width="20" height="18" rx="3" fill="#c9a04a" stroke="#2b2230" stroke-width="2"/></g>
      <path d="M118 120 l14 -8 l-6 14 l12 -4" fill="none" stroke="#2b2230" stroke-width="2" opacity=".75"/>
      <rect x="128" y="150" width="34" height="14" rx="2" fill="#e8dcc0" transform="rotate(-18 145 157)" opacity=".9"/>
      <circle cx="100" cy="196" r="7" fill="#2b2230"/></svg>
      <span class="metro-hint" id="mhint">点这里，或按空格</span></button>
    <div class="beats" id="tbeats">${'<i></i>'.repeat(4 + N)}</div><p class="status" id="tst">准备……</p><div class="offsets" id="toff"></div></div>`;
  let taps = [], live = false;
  const dots = $$('#tbeats i'), pend = $('#pend');
  const swing = k => { pend.style.transition = `transform ${beat}s ease-in-out`; pend.style.transform = `rotate(${k % 2 ? 22 : -22}deg)` };
  const t0 = now() + .9;
  /* 从示范到你自己拍完，背景音乐一直完全停着，只听节拍器（结算时再恢复） */
  E.hold(.0001);
  E.playClip(bus => { for (let i = 0; i < 4; i++) { tone(bus, t0 + i * beat, i ? 84 : 96, .05, { type: 'triangle', gain: .28, att: .001, rel: .06 }); E.later(() => { if (tok !== TOK) return; dots[i].classList.add('on'); swing(i) }, (t0 + i * beat - now()) * 1000) } return 4 * beat + 1 }, 1);
  E.later(() => { if (tok !== TOK) return; $('#tst').textContent = `节拍器坏了。用同样的速度，自己拍 ${N} 下`; pend.style.transition = 'transform .6s'; pend.style.transform = 'rotate(4deg)'; $('#metro').classList.add('broken'); live = true }, (t0 + 3.5 * beat - now()) * 1000);
  const tap = () => {
    if (!live) return; const t = now() - LAT(); if (t < t0 + 3.5 * beat) return;
    taps.push(t); const el = $('#metro'); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 90);
    tone(E.sfx, t, 79, .04, { type: 'triangle', gain: .12, att: .001, rel: .05 }); swing(taps.length);
    if (dots[3 + taps.length]) dots[3 + taps.length].classList.add('on'); if (taps.length === 1) $('#tst').textContent = '继续，保持同样的速度……';
    if (taps.length >= N) { live = false; fin() }
  };
  $('#metro').addEventListener('pointerdown', e => { e.preventDefault(); tap() });
  KEYH = e => { if (e.key === ' ' || e.key === 'Enter') { tap(); return true } };
  /* 只看每两下之间的间隔和节拍器一不一样长：第一下早晚、耳机延迟都不影响分数 */
  const fin = () => {
    const iv = taps.slice(1).map((t, k) => (t - taps[k]) * 1000), B = beat * 1000;
    const errs = iv.map(x => x - B), mad = errs.reduce((a, b) => a + Math.abs(b), 0) / errs.length;
    const avg = iv.reduce((a, b) => a + b, 0) / iv.length, drift = avg - B;
    $('#toff').innerHTML = errs.map(e => `<i class="${e > 0 ? 'late' : ''}" style="height:${Math.min(70, 4 + Math.abs(e) / 2)}px" title="${e.toFixed(0)} 毫秒"></i>`).join('');
    const tend = Math.abs(drift) < 25 ? '速度很稳' : drift > 0 ? '越拍越慢' : '越拍越快';
    $('#tst').textContent = `每两下的间隔平均差 ${mad.toFixed(0)} 毫秒，${tend}。绿色是太快，红色是太慢。`;
    setTimeout(() => { if (tok === TOK) done(Math.max(0, Math.min(1, 1 - (mad - 18) / 110)), `每两下的间隔，和节拍器平均差 ${mad.toFixed(0)} 毫秒（节拍器一下是 ${B.toFixed(0)} 毫秒），${tend}。${tend === '越拍越快' ? '紧张的时候人会不自觉地抢拍，这很常见。' : tend === '越拍越慢' ? '拖拍常常是因为在“等”声音，试着提前一点点。' : '你心里的钟很准。'}`) }, 1800);
  };
}

/* ---------- 5. 真人还是 AI ---------- */
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
    const j = () => (Math.random() - .5) * .07, v = () => .06 + Math.random() * .08;
    H_MEL.forEach(([m, s, l]) => keys(bus, t0 + s * b + j(), m, l * b * 1.25, v()));
    H_CH.forEach(([s, ch], ci) => { const span = (H_CH[ci + 1] ? H_CH[ci + 1][0] : 16) - s; for (let k = 0; k < span * 2; k++) keys(bus, t0 + (s + k / 2) * b + j() * .5, ch[k % 3], b * 1.5, .03 + Math.random() * .02) });
    return 16 * b + 1.6;
  }
  const warp = s => { const x = s / 16; return s * b * (1 + .5 * Math.pow(x, 3)) + (s >= 1 ? .05 : 0) };
  const vel = s => .04 + .13 * Math.sin(Math.min(1, s / 12) * Math.PI * .95);
  H_MEL.forEach(([m, s, l], i) => { const t = t0 + warp(s) + .035, last = i === H_MEL.length - 1; if (m === 72) keys(bus, t - .08, 74, .06, .05); keys(bus, t, m, (warp(s + l) - warp(s)) * 1.3 + (last ? 1.8 : 0), vel(s) * (last ? .75 : 1)) });
  H_CH.forEach(([s, ch], ci) => { const span = (H_CH[ci + 1] ? H_CH[ci + 1][0] : 16) - s; for (let k = 0; k < span * 2; k++) keys(bus, t0 + warp(s + k / 2), ch[k % 3], b * 1.5, .03 + (k % 3 === 0 ? .02 : 0)) });
  return warp(16) + 2.4;
}
function aiRound(kindAI, onDone, label) {
  const humanA = Math.random() < .5, heard = { A: false, B: false };
  const box = document.createElement('div'); box.className = 'ai-round';
  box.innerHTML = `<p class="status">${label}</p><div class="clips">${['A', 'B'].map(x => `<div class="clip" data-x="${x}"><b>${x}</b><div class="wave">${'<i></i>'.repeat(9)}</div><button class="btn ghost sm" data-play="${x}">播放 ${x}</button><button class="btn sm" data-pick="${x}" disabled>${x} 是人弹的</button></div>`).join('')}</div><p class="why mnote"></p>`;
  $('#miniBody').appendChild(box);
  box.querySelectorAll('[data-play]').forEach(b => b.onclick = () => {
    const x = b.dataset.play, kind = (x === 'A') === humanA ? 'human' : kindAI;
    box.querySelectorAll('.clip').forEach(c => c.classList.remove('playing')); const c = box.querySelector(`.clip[data-x="${x}"]`); c.classList.add('playing');
    E.playClip(bus => playPiano(kind, bus), .05, () => c.classList.remove('playing'));
    heard[x] = true; if (heard.A && heard.B) box.querySelectorAll('[data-pick]').forEach(p => p.disabled = false);
  });
  box.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
    E.stopClip(); const right = (b.dataset.pick === 'A') === humanA, H = humanA ? 'A' : 'B';
    box.querySelectorAll('[data-pick],[data-play]').forEach(x => x.disabled = true);
    box.querySelector(`.clip[data-x="${H}"]`).classList.add('right'); if (!right) b.closest('.clip').classList.add('wrong');
    box.querySelector('.why').innerHTML = kindAI === 'ai' ? `真人是 ${H}：越到后面越慢，中间那句最响，音连成一片。AI 每拍一样长、每个音一样重。` : `真人是 ${H}：两段都有快慢轻重，但 AI 的变化是随机的，真人的变化有方向，一路推上去，再慢慢收住。`;
    right ? sfxGood() : sfxBuzz(); setTimeout(() => onDone(right), 2600);
  });
}
function gAi(done) {
  const tok = TOK; E.hold(.05); let r = 0;
  aiRound('ai', ok1 => { if (tok !== TOK) return; r += ok1; $('#miniBody').innerHTML = '';
    aiRound('aijit', ok2 => { if (tok !== TOK) return; r += ok2; done(r === 2 ? 1 : r === 1 ? .62 : .1, `两轮对了 ${r} 轮。`) }, '第 2 轮 · 这次的 AI 学会了“不完美”');
  }, '第 1 轮');
}

/* ---------- 6. 乐团：谁在独奏 ---------- */
const SOLOISTS = {
  vln: ['小提琴', (b, t, m, d) => strings(b, t, m + 12, d, .03, { att: .08, cut: 5200 })],
  vla: ['中提琴', (b, t, m, d) => strings(b, t, m, d, .036, { att: .1, cut: 3400 })],
  cello: ['大提琴', (b, t, m, d) => strings(b, t, m - 12, d, .045, { att: .1, cut: 2200 })],
  flute: ['长笛', (b, t, m, d) => flute(b, t, m + 12, d, .06)],
  oboe: ['双簧管', (b, t, m, d) => { tone(b, t, m + 12, d, { type: 'sawtooth', gain: .022, att: .03, rel: .12, cut: 2400, q: 4 }); tone(b, t, m + 12, d, { type: 'square', gain: .008, att: .03, rel: .12, cut: 1400, detune: 4 }) }],
  tpt: ['小号', (b, t, m, d) => trumpet(b, t, m, d, .042)],
  horn: ['圆号', (b, t, m, d) => horn(b, t, m - 12, d, .06)]
};
/* 音色很像、容易混的几组：选项总是从同一组里出 */
const SOLO_FAM = [['vln', 'vla', 'cello'], ['flute', 'oboe'], ['tpt', 'horn']];
const SOLO_MELS = [
  [[60, 0, 1], [64, 1, 1], [67, 2, 1.5], [65, 3.5, .5], [64, 4, 1], [62, 5, 1], [60, 6, 2]],
  [[67, 0, 1.5], [65, 1.5, .5], [64, 2, 1], [62, 3, 1], [64, 4, 2], [60, 6, 2]],
  [[64, 0, .5], [65, .5, .5], [67, 1, 1], [72, 2, 2], [71, 4, 1], [67, 5, 1], [69, 6, 2]],
  [[62, 0, 1], [64, 1, 1], [65, 2, 1], [67, 3, 1], [65, 4, 1.5], [64, 5.5, .5], [62, 6, 2]]
];
function gSolo(done) {
  const tok = TOK; E.hold(.05);
  /* 四段：每组至少一段，第四段随机 */
  const order = shuffle([...SOLO_FAM.map(f => shuffle(f)[0]), shuffle(Object.keys(SOLOISTS))[0]]);
  let i = 0, right = 0, combo = 0, pts = 0, answered = false;
  $('#miniBody').innerHTML = `<div class="rounds" id="rounds">${order.map(() => '<i></i>').join('')}</div><p class="status" id="sstat"></p>
    <div class="orch" aria-hidden="true">${['🎻', '🎺', '🪈', '🎹', '🪕'].map(x => `<span>${x}</span>`).join('')}</div>
    <p class="mnote" style="text-align:center">每段只放一次</p><div class="ear-opts" id="sopts"></div>`;
  const cb = comboEl(); $('#miniBody').appendChild(cb);
  /* 整个乐团一起：弦乐铺底、竖琴分解和弦、低音、另一件乐器吹副旋律，独奏只比它们响一点 */
  const play = () => { const k = order[i], mel = SOLO_MELS[i % SOLO_MELS.length], other = shuffle(Object.keys(SOLOISTS).filter(x => !SOLO_FAM.find(f => f.includes(k)).includes(x)))[0]; E.playClip(bus => {
    const b = 60 / 92, t0 = now() + .2, CH = [[0, [48, 55, 64]], [2, [45, 52, 60]], [4, [43, 50, 59]], [6, [48, 55, 64]]];
    CH.forEach(([s, v]) => { v.forEach(m => strings(bus, t0 + s * b, m, 2 * b, .016, { att: .25, cut: 1600 })); tone(bus, t0 + s * b, v[0] - 12, 1.9 * b, { type: 'triangle', gain: .16, cut: 500 }); for (let q = 0; q < 4; q++) harp(bus, t0 + (s + q / 2) * b, [...v, v[0] + 12][q] + 12, .045) });
    [[67, 0, 2], [65, 2, 2], [62, 4, 2], [64, 6, 2]].forEach(([m, s, d]) => SOLOISTS[other][1](bus, t0 + s * b, m - 5, d * b * .9));
    mel.forEach(([m, s, d]) => SOLOISTS[k][1](bus, t0 + s * b, m, d * b)); return 8 * b + 1.4 }, .05) };
  const ask = () => {
    if (tok !== TOK) return;
    if (i >= order.length) return done(Math.min(1, pts / (order.length * 1.2)), `四段对了 ${right} 段。`);
    answered = false;
    const fam = SOLO_FAM.find(f => f.includes(order[i]));
    const opts = shuffle([...fam, ...shuffle(Object.keys(SOLOISTS).filter(k => !fam.includes(k))).slice(0, 4 - fam.length)]);
    $('#sstat').textContent = `第 ${i + 1} / ${order.length} 段 · 主旋律是哪件乐器？`;
    $('#sopts').innerHTML = opts.map(k => `<button class="btn ghost ear-o" data-s="${k}">${SOLOISTS[k][0]}</button>`).join('');
    $$('#sopts .ear-o').forEach(b => b.onclick = () => answer(b.dataset.s));
    setTimeout(() => { if (tok === TOK && !answered) play() }, 300);
  };
  const answer = k => {
    if (answered) return; answered = true; const ok = k === order[i];
    $$('#sopts .ear-o').forEach(b => { b.disabled = true; if (b.dataset.s === order[i]) b.classList.add('right'); else if (b.dataset.s === k) b.classList.add('wrong') });
    $$('#rounds i')[i].className = ok ? 'ok' : 'no';
    if (ok) { right++; combo++; pts += 1 + Math.min(combo - 1, 2) * .1; sfxGood() } else { combo = 0; sfxBuzz() }
    setCombo(cb, combo); i++; setTimeout(ask, 1400);
  };
  KEYH = e => { const k = '1234'.indexOf(e.key); const b = $$('#sopts .ear-o')[k]; if (k >= 0 && b) { answer(b.dataset.s); return true } };
  ask();
}

/* ---------- 7. 主舞台救场：数着小节敲过门 ---------- */
function gFill(done) {
  const tok = TOK; E.hold(.0001);
  const rounds = [{ bars: 4, n: 4, bpm: 100 }, { bars: 4, n: 4, bpm: 100, fake: 2 }, { bars: 6, n: 3, bpm: 112 }];
  let r = 0, errs = [], live = false, target = 0, tapped = false;
  $('#miniBody').innerHTML = `<div class="rounds" id="rounds"><i></i><i></i><i></i></div><p class="status" id="fstat"></p>
    <div class="barcount" id="bars"></div>
    <button class="cymbal" id="cym" aria-label="敲镲"><span>镲</span></button><p class="mnote" style="text-align:center">按空格，或点这面镲</p>`;
  const groove = (bus, t0, beat, bars, n, fake) => {
    for (let b = 0; b < bars; b++) for (let q = 0; q < n; q++) {
      const t = t0 + (b * n + q) * beat;
      if (fake && b === fake - 1 && q === n - 1) { [0, .25, .5, .75].forEach((o, k) => snare(bus, t + o * beat, .12 + k * .04)); continue }  /* 假过门：骗你提前敲 */
      kick(bus, t, q === 0 ? .8 : .4); if (n === 4 ? q % 2 : q) snare(bus, t, .18); hat(bus, t, .05); hat(bus, t + beat / 2, .035); if (q === 0) tone(bus, t, [36, 33, 41, 43, 38, 43][b % 6], beat * (n - .4), { type: 'triangle', gain: .22, cut: 700 })
    }
    kick(bus, t0 + bars * n * beat, .9); nhit(bus, t0 + bars * n * beat, { g: .2, f: 4500, d: 1.2 });
  };
  const go = () => {
    if (tok !== TOK) return;
    if (r >= rounds.length) { const sc = errs.map(e => e == null ? 0 : Math.max(0, 1 - Math.max(0, e - 30) / 220)); return done(sc.reduce((a, b) => a + b, 0) / rounds.length, `三轮的偏差：${errs.map(e => e == null ? '没敲' : Math.round(e) + ' 毫秒').join('、')}。`) }
    const R = rounds[r], beat = 60 / R.bpm, t0 = now() + .8; target = t0 + (R.bars * R.n - 1) * beat; tapped = false; live = true;
    $('#fstat').textContent = `第 ${r + 1} 轮 · 在第 ${R.bars} 小节的最后一拍敲镲${R.fake ? '（小心鼓手的假过门）' : ''}`;
    $('#bars').innerHTML = `<em>自己数：一小节 ${R.n} 拍${R.n === 3 ? '（三拍子：强、弱、弱）' : ''}</em>`;
    E.playClip(bus => { groove(bus, t0, beat, R.bars, R.n, R.fake); return R.bars * R.n * beat + 2 }, 1, () => {
      if (tok !== TOK) return; live = false; if (!tapped) { errs.push(null); $$('#rounds i')[r].className = 'no' } r++; setTimeout(go, 900) });
  };
  const tap = () => {
    if (!live || tapped) return; const t = now() - LAT(); if (t < target - 30) return;  /* 敲早了也算这一轮的那一下（假过门就是用来骗你的） */
    tapped = true; const e = Math.abs(t - target) * 1000; errs.push(e);
    nhit(E.sfx, now(), { g: .4, f: 5000, d: 1.1 }); snare(E.sfx, now(), .25);
    const el = $('#cym'); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 160);
    $$('#rounds i')[r].className = e < 120 ? 'ok' : 'no'; $('#fstat').textContent = e < 60 ? '正好！' : e < 120 ? `很接近，差 ${Math.round(e)} 毫秒` : t < target ? '敲早了' : '敲晚了';
  };
  $('#cym').addEventListener('pointerdown', e => { e.preventDefault(); tap() });
  KEYH = e => { if (e.key === ' ' || e.key === 'Enter') { tap(); return true } };
  go();
}

/* ---------- 8. 编曲拼图 ---------- */
const ARR_LAYERS = [
  ['鼓', [['四拍都有底鼓', (b, t, B) => { for (let q = 0; q < 8; q++) { kick(b, t + q * B, .7); hat(b, t + q * B + B / 2, .04) } }],
    ['底鼓加军鼓', (b, t, B) => { for (let q = 0; q < 8; q++) { if (q % 2 === 0) kick(b, t + q * B, .8); else snare(b, t + q * B, .18); hat(b, t + q * B, .04) } }],
    ['只有沙锤', (b, t, B) => { for (let q = 0; q < 16; q++) shaker(b, t + q * B / 2, .05) }]]],
  ['贝斯', [['长音', (b, t, B) => [36, 33, 41, 43].forEach((m, i) => tone(b, t + i * 2 * B, m, 1.9 * B, { type: 'triangle', gain: .28, cut: 700 }))],
    ['一跳一跳', (b, t, B) => [36, 33, 41, 43].forEach((m, i) => [0, .5, 1, 1.5].forEach(o => tone(b, t + (i * 2 + o) * B, m + (o === 1 ? 12 : 0), .4 * B, { type: 'triangle', gain: .26, cut: 800 })))],
    ['一步一步走', (b, t, B) => [36, 40, 33, 36, 41, 45, 43, 47].forEach((m, i) => tone(b, t + i * B, m, .9 * B, { type: 'triangle', gain: .26, cut: 800 }))]]],
  ['和弦', [['钢琴每拍按一下', (b, t, B) => [[60, 64, 67], [57, 60, 64], [57, 60, 65], [59, 62, 67]].forEach((v, i) => [0, 1].forEach(o => v.forEach(m => keys(b, t + (i * 2 + o) * B, m, .8 * B, .05))))],
    ['吉他扫弦', (b, t, B) => [[60, 64, 67], [57, 60, 64], [57, 60, 65], [59, 62, 67]].forEach((v, i) => [0, .75, 1.5].forEach(o => v.forEach((m, k) => guitar(b, t + (i * 2 + o) * B + k * .02, m - 12, .07))))],
    ['弦乐铺底', (b, t, B) => [[60, 64, 67], [57, 60, 64], [57, 60, 65], [59, 62, 67]].forEach((v, i) => v.forEach(m => strings(b, t + i * 2 * B, m, 2 * B, .014, { att: .25, cut: 1600 })))]]]
];
function gArrange(done) {
  const tok = TOK; E.hold(.05);
  const ref = ARR_LAYERS.map(() => Math.floor(Math.random() * 3)), mine = ARR_LAYERS.map(() => null);
  let listens = 0;
  $('#miniBody').innerHTML = `<div class="row" style="justify-content:center"><button class="btn" id="aref">▶ 听参考小样</button><button class="btn ghost" id="amine">▶ 听我的版本</button></div>
    <div class="arr">${ARR_LAYERS.map(([n, vs], li) => `<div class="arr-row"><b>${n}</b>${vs.map(([vn], vi) => `<button class="arr-o" data-l="${li}" data-v="${vi}"><span>${vn}</span><i>▶ 试听</i></button>`).join('')}</div>`).join('')}</div>
    <p class="status" id="astat">先听一遍参考小样。</p><div class="row" style="justify-content:center"><button class="btn" id="adone" disabled>就是这样</button></div>`;
  const B = 60 / 96;
  const playSet = set => E.playClip(bus => { const t0 = now() + .15; for (let rep = 0; rep < 2; rep++) set.forEach((v, li) => { if (v != null) ARR_LAYERS[li][1][v][1](bus, t0 + rep * 8 * B, B) }); return 16 * B + .8 }, .05);
  $('#aref').onclick = () => { listens++; $('#astat').textContent = `参考小样听了 ${listens} 遍。`; playSet(ref) };
  $('#amine').onclick = () => playSet(mine);
  $$('.arr-o').forEach(b => b.onclick = () => {
    const li = +b.dataset.l, vi = +b.dataset.v; mine[li] = vi;
    $$(`.arr-o[data-l="${li}"]`).forEach(x => x.classList.toggle('on', x === b));
    E.playClip(bus => { const t0 = now() + .1; ARR_LAYERS[li][1][vi][1](bus, t0, B); return 8 * B + .5 }, .05);
    $('#adone').disabled = mine.some(v => v == null);
  });
  $('#adone').onclick = () => {
    E.stopClip(); const ok = mine.filter((v, i) => v === ref[i]).length;
    $$('.arr-row').forEach((row, i) => row.classList.add(mine[i] === ref[i] ? 'right' : 'wrong'));
    const bonus = ok === 3 ? Math.max(0, .15 - Math.max(0, listens - 2) * .05) : 0;
    setTimeout(() => { if (tok === TOK) done(Math.min(1, ok / 3 * .85 + bonus), `三层拼对了 ${ok} 层，参考小样听了 ${listens} 遍。`) }, 1600);
  };
}

/* ---------- 9. 综艺总决赛：越来越长的旋律 ---------- */
function gSimon(done) {
  const tok = TOK; E.hold(.05);
  /* 一个完整的八度：C4 到 C5（do re mi fa sol la si do），钢琴采样已逐个测过频率，音高是准的 */
  const PADS = [[60, '#f0b45a', '1', 'do'], [62, '#f2d36b', '2', 're'], [64, '#9fd98a', '3', 'mi'], [65, '#7fd0b6', '4', 'fa'], [67, '#7fb6e8', '5', 'sol'], [69, '#9fa6f0', '6', 'la'], [71, '#c6a3ef', '7', 'si'], [72, '#ef8aa0', '1', 'do']];
  let seq = [], pos = 0, canTap = false, speed = .55;
  $('#miniBody').innerHTML = `<p class="status" id="smstat">听，然后跟着弹</p><div class="simon">${PADS.map(([, c, n, sy], i) => `<button class="pad" data-i="${i}" style="--c:${c}"><b class="${i === 7 ? 'hi' : ''}">${n}</b><small>${sy}</small><kbd>${i + 1}</kbd></button>`).join('')}</div><p class="score" id="smlen">长度 0</p>`;
  const pads = $$('.simon .pad');
  const flash = (i, t = .3) => { pads[i].classList.add('lit'); setTimeout(() => pads[i].classList.remove('lit'), t * 1000) };
  /* 只用钢琴本身的音，不叠别的泛音，免得听错音高 */
  const sound = (i, t, out) => keys(out || E.sfx, t, PADS[i][0], .45, .16);
  const grow = () => {
    if (tok !== TOK) return;
    seq.push(Math.floor(Math.random() * PADS.length)); if (seq.length < 4) return grow();
    pos = 0; canTap = false; speed = Math.max(.26, .52 - (seq.length - 4) * .04);
    $('#smstat').textContent = `第 ${seq.length - 3} 轮 · 只听，不看……`;
    E.playClip(bus => { const t0 = now() + .4; seq.forEach((p, k) => sound(p, t0 + k * speed, bus)); return seq.length * speed + .6 }, .05,  /* 放的时候键不亮 */
      () => { if (tok !== TOK) return; canTap = true; $('#smstat').textContent = '轮到你了'; });
  };
  const press = i => {
    if (!canTap) return; sound(i, now()); flash(i, .2);
    if (i !== seq[pos]) { canTap = false; sfxBuzz(); pads[seq[pos]].classList.add('want'); const got = seq.length - 1;
      $('#smstat').textContent = `错了。这里应该是 ${PADS[seq[pos]][2]}（${PADS[seq[pos]][3]}${seq[pos] === 7 ? '，高音' : ''}）。`;
      setTimeout(() => { if (tok === TOK) done(Math.max(0, Math.min(1, (got - 3) / 7)), `你记住了 ${got} 个音的旋律${PROG.best && PROG.best.simonLen ? `，之前的纪录是 ${PROG.best.simonLen} 个` : ''}。`); PROG.best = PROG.best || {}; PROG.best.simonLen = Math.max(PROG.best.simonLen || 0, got) }, 1500); return }
    pos++; if (pos >= seq.length) { canTap = false; $('#smlen').textContent = `长度 ${seq.length}`; sfxGood(); if (seq.length >= 12) return setTimeout(() => done(1, `你记住了全部 ${seq.length} 个音！`), 900); setTimeout(grow, 900) }
  };
  pads.forEach((p, i) => p.addEventListener('pointerdown', e => { e.preventDefault(); press(i) }));
  KEYH = e => { const i = '12345678'.indexOf(e.key); if (i >= 0) { press(i); return true } };
  grow();
}

/* ---------- 10. 综艺总决赛：你 vs AI 歌手 ---------- */
/* 观众的声音：聊天声、欢呼、跟唱、手机提示音 */
function crowdChat(out, t, d) { for (let k = 0; k < d * 9; k++) { const tt = t + Math.random() * d; voice(out, tt, 50 + Math.random() * 14, .08 + Math.random() * .12, .025, 'vr') } const c = E.ctx, s = c.createBufferSource(); s.buffer = E.noise; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = .8; const a = c.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(.05, t + .5); a.gain.setValueAtTime(.05, t + d - .5); a.gain.linearRampToValueAtTime(0, t + d); s.connect(f); f.connect(a); a.connect(out); s.start(t); s.stop(t + d + .1) }
function crowdCheer(out, t, d, g = 1) {
  const c = E.ctx, s = c.createBufferSource(); s.buffer = E.noise; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .6;
  const a = c.createGain(); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(.22 * g, t + .4); a.gain.setValueAtTime(.2 * g, t + d - .8); a.gain.linearRampToValueAtTime(0, t + d); s.connect(f); f.connect(a); a.connect(out); s.start(t); s.stop(t + d + .1);
  for (let k = 0; k < d * 1.5; k++) { const tt = t + .3 + Math.random() * (d - .8), o = c.createOscillator(), w = c.createGain(); o.frequency.setValueAtTime(1800 + Math.random() * 600, tt); o.frequency.exponentialRampToValueAtTime(2600 + Math.random() * 600, tt + .25); w.gain.setValueAtTime(0, tt); w.gain.linearRampToValueAtTime(.025 * g, tt + .05); w.gain.linearRampToValueAtTime(0, tt + .35); o.connect(w); w.connect(out); o.start(tt); o.stop(tt + .4) }
}
function crowdClap(out, t, d, bpm = 120) { const b = 60 / bpm; for (let k = 0; k * b < d; k++) for (let n = 0; n < 6; n++) nhit(out, t + k * b + Math.random() * .03, { g: .09, type: 'bandpass', f: 1200 + n * 200, d: .06, q: 1.2 }) }
function crowdSing(out, t) { const mel = [[64, 0, 1], [67, 1, 1], [69, 2, 2], [67, 4, 1], [64, 5, 1], [62, 6, 2]], b = .5; mel.forEach(([m, s, l]) => { for (let v = 0; v < 6; v++) voice(out, t + s * b + Math.random() * .06, m - 12 + (v % 2 ? 12 : 0) + (Math.random() - .5) * .3, l * b * .95, .02, 'vo') }); return 8 * b }
function phoneDing(out, t) { tone(out, t, 88, .08, { type: 'sine', gain: .05, rel: .2 }); tone(out, t + .1, 93, .1, { type: 'sine', gain: .05, rel: .3 }) }
const DUEL_LYRIC = [
  { cue: '十年以后我还在唱歌，', ai: '“追逐梦想的光，照亮星辰大海。”', opts: [['“像追着光的蝴蝶，飞过星辰大海。”', -10, '押韵很漂亮，可这一句换成谁来唱都一样。'], ['“梦想在心中燃烧，永远不会熄灭。”', -14, '这是 AI 最擅长写的句子：好听，但是空。'], ['“房租涨了三次，吉他还是那一把。”', 18, '有一个具体的东西，大家就信了。']] },
  { cue: '凌晨两点的城市，', ai: '“霓虹闪烁，寂寞如潮水般涌来。”', opts: [['“灯火阑珊，孤独在心底蔓延。”', -12, '和 AI 那句几乎一模一样，观众分不出来谁是谁。'], ['“便利店只剩关东煮还热着。”', 18, '一个画面，就把“寂寞”两个字省掉了。'], ['“星星眨眼，诉说着我的思念。”', -14, '漂亮的套路，观众已经听过一千遍了。']] },
  { cue: '妈妈打来电话，', ai: '“温暖的声音，是我永远的港湾。”', opts: [['“爱是永恒的避风港，守护我成长。”', -14, '大词太多了，听不到妈妈本人。'], ['“只问我吃了没，没问我唱得怎么样。”', 18, '一句家常话，台下好几个人眼眶红了。'], ['“思念化作千言万语，在心中回响。”', -12, '比 AI 那句还像 AI。']] }
];
const DUEL_LIVE = [
  { key: 'chat', play: (bus, t) => { crowdChat(bus, t, 4.5); phoneDing(bus, t + 1.2); phoneDing(bus, t + 3.1); nhit(bus, t + 2.4, { g: .12, type: 'bandpass', f: 500, d: .25 }); return 5 }, hint: '台下在小声聊天，好几个人低头看手机，还有人咳嗽。观众的注意力已经散了。' },
  { key: 'sing', play: (bus, t) => crowdSing(bus, t) + .5, hint: '台下几千个人在跟着你唱，有高有低，但一个字都没错。这时候，观众想当主角。' },
  { key: 'hype', play: (bus, t) => { crowdCheer(bus, t, 4.5); crowdClap(bus, t + .3, 4); return 5 }, hint: '欢呼、口哨、整齐的拍手声，全场已经热到顶了。现在停下来，会把这股劲浇灭。' }
];
const DUEL_LIVE_OPTS = [['放下吉他，跟台下聊两句，再唱一首安静的', 'chat'], ['把麦克风朝向观众，副歌让他们唱', 'sing'], ['一秒都不停，直接接最炸的那一首', 'hype']];
const DUEL_ASK = { q: '“AI 一分钟就能写十首歌，回声刚才也唱得很好。你凭什么站在这里？”', opts: [['“因为这十年，每一首歌都是我自己活出来的。”', 18, '台下安静了一秒，然后掌声响起来。', 'auth'], ['“我会用 AI，但我比它更懂你们。”', 8, '很聪明的回答，有人点头，也有人觉得太圆滑。', 'ai'], ['“说实话，我也不知道。我只是还想唱。”', 14, '你说得很老实，观众反而更信你了。', 'bond'], ['“它只是机器，根本不懂音乐。”', -10, '回声没有反驳。观众觉得你有点急了。', 'fight']] };
function gFinale(done) {
  const tok = TOK; E.hold(.05);
  let vote = 50; const log = [];
  $('#miniBody').innerHTML = `<div class="duel">
    <div class="du-top"><div class="du-side me"><i>选手</i><b>你</b></div><div class="du-vs">VS</div><div class="du-side ai"><i>AI</i><b>回声</b></div></div>
    <div class="du-bar"><span class="du-me" id="duMe" style="width:50%"></span><span class="du-ai"></span><em id="duPct">50 : 50</em></div>
    <div class="du-stage" id="duStage"></div></div>`;
  const stage = $('#duStage');
  const setVote = v => { vote = Math.max(4, Math.min(96, Math.round(v))); $('#duMe').style.width = vote + '%'; $('#duPct').textContent = `${vote} : ${100 - vote}` };
  const host = (title, text) => `<div class="du-host"><span class="eyebrow">${title}</span><p class="du-say">${text}</p></div>`;
  const later = (fn, ms) => setTimeout(() => { if (tok === TOK) fn() }, ms);
  /* 每一回合：先是 AI 的票数，再是你的选择 */
  const swing = (d, ai = 6) => { setVote(vote - ai); later(() => { setVote(vote + d); if (d > 0) E.playClip(bus => { crowdCheer(bus, now() + .05, 2, .6); return 2.2 }, .05) }, 900) };
  const pick = (opts, onPick) => {
    const box = document.createElement('div'); box.className = 'choices-col du-opts';
    box.innerHTML = opts.map((o, j) => `<button class="btn ghost" data-d="${j}">${o[0]}</button>`).join(''); stage.appendChild(box); MO.rise(box, 'button');
    box.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { box.querySelectorAll('[data-d]').forEach(x => x.disabled = true); b.classList.add('picked'); onPick(+b.dataset.d) });
  };
  const fb = (t, next) => { const p = document.createElement('p'); p.className = 'du-fb'; p.textContent = t; stage.appendChild(p); const n = document.createElement('button'); n.className = 'btn'; n.textContent = '下一回合 →'; n.style.alignSelf = 'flex-start'; n.onclick = next; later(() => stage.appendChild(n), 1400) };
  const card = (t, sub, next) => { stage.innerHTML = `<div class="stage-card du-card"><b>${t}</b>${sub}</div>`; E.playClip(bus => { const t0 = now() + .05; [60, 64, 67, 72].forEach((m, i) => trumpet(bus, t0 + i * .12, m, .4, .05)); return 1.2 }, .05); later(next, 1700) };
  /* 第一回合：写词 */
  const r1 = () => card('第一回合', '写词对决', () => {
    const L = pick0(DUEL_LYRIC);
    stage.innerHTML = host('主持人', `大屏幕上是半句歌词：<b>「${L.cue}」</b>两位选手各接一句。`) + `<div class="du-ai-line"><span>回声接的是</span><p>${L.ai}</p></div><p class="mnote">轮到你了。三句里选一句：</p>`;
    later(() => { setVote(vote + 6); pick(L.opts, j => { const o = L.opts[j]; log.push(o[1]); swing(o[1], 0); fb(o[2], r2) }) }, 900);
  });
  /* 第二回合：读现场 */
  const r2 = () => card('第二回合', '读现场', () => {
    const S = pick0(DUEL_LIVE); let heard = false;
    stage.innerHTML = host('导播', '下一首之前，你只能听台下的声音。<b>听完决定接下来怎么唱。</b>回声会照着歌单往下唱。') + `<button class="btn pre-hum" id="duListen"><span>▶</span> 听听台下</button><p class="mnote" id="duHint"></p>`;
    $('#duListen').onclick = () => { $('#duListen').classList.add('heard'); E.playClip(bus => S.play(bus, now() + .1), .05, () => { if (heard || tok !== TOK) return; heard = true; pick(DUEL_LIVE_OPTS, j => { const ok = DUEL_LIVE_OPTS[j][1] === S.key, d = ok ? 18 : -8; log.push(d); swing(d, 8); fb(`${ok ? '读对了。' : '没读准。'}${S.hint}`, r3) }) }) };
  });
  /* 第三回合：主持人提问 */
  const r3 = () => card('第三回合', '主持人提问', () => {
    stage.innerHTML = host('主持人', DUEL_ASK.q) + `<div class="du-ai-line"><span>回声先答</span><p>“我会一直学习，努力写出大家喜欢的歌。”</p></div>`;
    later(() => { setVote(vote + 4); pick(DUEL_ASK.opts, j => { const o = DUEL_ASK.opts[j]; log.push(o[1]); PROG.log.push({ lv: 1, y: G ? G.year : 10, who: '主持人', say: DUEL_ASK.q, pick: o[0].replace(/[“”]/g, ''), k: o[3] }); swing(o[1], 0); later(() => { const p = document.createElement('p'); p.className = 'du-fb'; p.textContent = o[2]; stage.appendChild(p); later(end, 2200) }, 300) }) }, 1100);
  });
  /* 揭晓：赢了有彩带和“冠军”大字 */
  const end = () => {
    const win = vote > 50;
    stage.innerHTML = `<div class="du-result ${win ? 'win' : 'lose'}"><span class="eyebrow">最终票数</span><b>${win ? '冠军' : '亚军'}</b><p>${vote} : ${100 - vote}</p></div>`;
    if (win) { const cf = document.createElement('div'); cf.className = 'confetti'; cf.innerHTML = Array.from({ length: 60 }, (_, i) => `<i style="--x:${Math.random() * 100}%;--d:${(Math.random() * 1.2).toFixed(2)}s;--c:${['#f0b45a', '#ef8aa0', '#7fd0b6', '#9fa6f0', '#fff'][i % 5]};--r:${Math.round(Math.random() * 360)}deg"></i>`).join(''); $('#miniBody').appendChild(cf);
      E.playClip(bus => { const t0 = now() + .05; crowdCheer(bus, t0, 4); [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79]].forEach((c, i) => c.forEach(m => trumpet(bus, t0 + i * .32, m, i === 3 ? 1.4 : .3, .045))); return 4.2 }, .05) }
    else E.playClip(bus => { crowdCheer(bus, now() + .05, 2.5, .4); return 2.6 }, .05);
    const ratio = win ? Math.min(1, .6 + (vote - 50) / 30 * .4) : Math.max(0, vote / 50 * .59);  /* 赢了至少两星 */
    later(() => done(ratio, `最终票数 ${vote} : ${100 - vote}，${win ? '你赢了 AI 歌手回声' : '回声赢了这一场'}。三个回合：${log.map(d => d > 0 ? '+' + d : d).join('、')}。`), 3800);
  };
  r1();
}
const pick0 = a => a[Math.floor(Math.random() * a.length)];
