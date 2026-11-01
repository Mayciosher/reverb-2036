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
   9 旋律记忆          综艺总决赛（越来越长，挑战纪录）
   10 总决赛           评审团（把前面的能力串起来）
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
  ear: { eye: '录音棚试音', title: '听音', rules: [['先听 la', '每题先放标准音 la，再放要你听的声音。'], ['六道题', '单音（有黑键上的音）、两个音之间的距离、三个音一起响的和弦，越往后越难。'], ['连对', '连续答对有连击加分。每题可以再听一遍。']], run: gEar,
    eff: [{ o: -8, l: -6 }, { o: -2 }, { o: 6, l: 4 }, { o: 12, l: 8, f: 4 }],
    say: [['没听出来', '走出录音棚，你在地铁上把那段声音听了二十遍。'], ['有点吃力', '你开始怀疑，自己是不是太依赖 AI 扒谱了。'], ['还行', '错了几题，但听得出你有底子。'], ['耳朵很好', '对方愣了一下：“你学过视唱练耳吧？”']] },
  tempo: { eye: '心里的拍子', title: '节拍器坏了', cal: true, rules: [['先听 4 下', '节拍器会响 4 下，然后它就坏了，背景音乐也会停。'], ['自己接着拍', '从第 5 拍开始，按同样的速度拍 8 下：按空格，或者点节拍器。'], ['越稳越好', '每一下和该响的时刻差得越少，分数越高。']], run: gTempo,
    eff: [{ o: -6, f: -4 }, { o: -2 }, { o: 5, f: 3 }, { o: 8, f: 6, l: 4 }],
    say: [['拍子乱了', '鼓手叹了口气，把节拍器拿去修了。'], ['有点飘', '你越拍越急，像在追什么。'], ['很稳', '鼓手冲你点了点头。'], ['稳得像节拍器', '鼓手说：“节拍器不用修了，有你就行。”']] },
  ai: { eye: '人机辨听', title: '哪段是人弹的？', rules: [['两轮', '每轮两段钢琴，同一段旋律，一段是真人，一段是 AI。'], ['听三件事', '速度有没有快慢，每个音有没有轻重，音和音之间是断开还是连着。'], ['都听完才能选', '第二轮的 AI 也学会了“不完美”，要更仔细。']], run: gAi,
    eff: [{ o: -10, l: -4 }, { o: 2 }, { o: 8, f: 4 }, { o: 12, f: 6, l: 4 }],
    say: [['被骗过去了', '两轮都没听出来。A&R 在你的名字后面画了一个问号。'], ['一半一半', '第一轮听出来了，第二轮被骗了。'], ['听出来了', 'A&R 在你的名字后面画了一个勾。'], ['两轮全对', 'A&R 说：“这种耳朵，以后会越来越值钱。”']] },
  solo: { eye: '乐团排练', title: '谁在独奏？', rules: [['四段音乐', '每段里，有一件乐器在吹（拉、弹）主旋律。'], ['选出是哪件乐器', '每段有四个选项，可以再听一遍。'], ['连对', '连续答对有连击加分。']], run: gSolo,
    eff: [{ o: -6, l: -3 }, { o: 1 }, { o: 6, l: 4 }, { o: 10, l: 6, f: 4 }],
    say: [['没听出来', '指挥摇摇头：“下次排练，你坐在乐团中间听。”'], ['勉强', '你听出了一两件，其他的都混在了一起。'], ['不错', '指挥说：“耳朵挺灵。”'], ['全听出来了', '指挥放下指挥棒：“明天你来当助理指挥。”']] },
  fill: { eye: '主舞台救场', title: '数着小节打鼓', cal: true, rules: [['数小节', '乐队一小节四拍。你要在第 4 小节的最后一拍，敲一下镲（过门）。'], ['三轮', '第一轮有小节提示；第二轮没有提示；第三轮要数到第 8 小节。'], ['怎么敲', '按空格，或者点那面镲。敲得越准，台下越嗨。']], run: gFill,
    eff: [{ f: -10, l: -5 }, { m: 3, f: -2 }, { m: 10, f: 8 }, { m: 16, f: 14, l: 5 }],
    say: [['乱了', '过门敲早了，乐队全乱了，三万人一起愣住。'], ['勉强', '有一轮敲对了，乐队硬是接住了你。'], ['救场成功', '三万人跟着你的过门一起跳了起来。'], ['封神', '第二天热搜：“替补鼓手的过门，比原鼓手还准。”']] },
  arrange: { eye: '慢歌录制', title: '把编曲拼回去', rules: [['参考小样', '先听参考小样：里面有鼓、贝斯、和弦三层。'], ['每层选一个', '每一层有三个版本，选出和小样一样的那个。'], ['少听几遍', '可以随时听小样和你的版本对比。听得越少就拼对，分数越高。']], run: gArrange,
    eff: [{ o: -6, l: -4 }, { o: 2 }, { o: 7, l: 4 }, { o: 12, l: 6, m: 4 }],
    say: [['拼错了', '制作人听了一遍，默默打开了 AI 编曲。'], ['差一点', '错了一层，听起来总有哪里不对。'], ['拼对了', '制作人说：“就是这个感觉。”'], ['一次就拼对', '制作人把工程文件交给你：“以后编曲你来。”']] },
  simon: { eye: '综艺总决赛', title: '越来越长的旋律', rules: [['跟着弹', '五个彩色的键，会亮着放一段旋律，你按顺序弹回来（也可以按数字键 1 到 5）。'], ['越来越长', '每对一次，旋律就多一个音，也会越来越快。'], ['错一个就结束', '记住的音越多，分数越高，会记下你的最好纪录。']], run: gSimon,
    eff: [{ o: -6, f: -6 }, { o: 2, f: -2 }, { o: 8, f: 8 }, { o: 12, f: 14, l: 5 }],
    say: [['第一轮就出局了', '镜头给了你一个特写，你笑得有点僵。'], ['记住了一些', '你在半决赛水平停下了。'], ['进了前三', '导演说：“观众很喜欢你认真的样子。”'], ['冠军', '最后一个音弹完，全场站了起来。']] },
  finale: { eye: '评审团', title: '十年的耳朵', rules: [['三道关', '听音、记旋律、分辨真人和 AI，这十年练过的耳朵全都用上。'], ['一关接一关', '每关结束直接进入下一关。'], ['总分', '三关加起来算总分。']], run: gFinale,
    eff: [{ o: -8, f: -6 }, { o: 2 }, { o: 10, f: 8, l: 4 }, { o: 16, f: 12, l: 8 }],
    say: [['没过', '评审团说：“2036 年的耳朵，确实不好练。”'], ['勉强过关', '你过了，但过得很险。'], ['通过', '评审团在你的名字后面写下：耳朵可信。'], ['满分', '评审团集体起立：“十年了，你的耳朵还在。”']] }
};
MINI_DEF.tempo2 = MINI_DEF.tempo; /* 兼容旧名字 */

function miniHead(eye, title) { $('#miniEye').textContent = '音乐关卡 · ' + eye; $('#miniTitle').textContent = title; $('#miniDesc').textContent = ''; TT.introSoon(() => $('#mini .lx-head .tt')) }
function startMini(kind) {
  const d = MINI_DEF[kind]; if (!d) { console.warn('没有这个小游戏：', kind); return }
  MG = { kind, tries: 0, best: null };
  show('mini'); E.duck(1); KEYH = null;
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
  TOK++; KEYH = null; E.stopClip(); E.duck(1);
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
  E.duck(.1);
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
  E.duck(.06);
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
  E.duck(.0001);
  E.playClip(bus => { for (let i = 0; i < 4; i++) { tone(bus, t0 + i * beat, i ? 84 : 96, .05, { type: 'triangle', gain: .28, att: .001, rel: .06 }); E.later(() => { if (tok !== TOK) return; dots[i].classList.add('on'); swing(i) }, (t0 + i * beat - now()) * 1000) } return 4 * beat + 1 }, 1);
  E.later(() => { if (tok !== TOK) return; $('#tst').textContent = `节拍器坏了。从第 5 拍开始，自己拍 ${N} 下`; pend.style.transition = 'transform .6s'; pend.style.transform = 'rotate(4deg)'; $('#metro').classList.add('broken'); live = true }, (t0 + 3.5 * beat - now()) * 1000);
  const tap = () => {
    if (!live) return; const t = now() - LAT(); if (t < t0 + 3.5 * beat) return;
    taps.push(t); const el = $('#metro'); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 90);
    tone(E.sfx, t, 79, .04, { type: 'triangle', gain: .12, att: .001, rel: .05 }); swing(taps.length);
    if (dots[3 + taps.length]) dots[3 + taps.length].classList.add('on');
    if (taps.length >= N) { live = false; fin() }
  };
  $('#metro').addEventListener('pointerdown', e => { e.preventDefault(); tap() });
  KEYH = e => { if (e.key === ' ' || e.key === 'Enter') { tap(); return true } };
  const fin = () => {
    const errs = taps.map((t, k) => (t - (t0 + (4 + k) * beat)) * 1000);
    const mean = errs.reduce((a, b) => a + Math.abs(b), 0) / errs.length;
    $('#toff').innerHTML = errs.map(e => `<i class="${e > 0 ? 'late' : ''}" style="height:${Math.min(70, 4 + Math.abs(e) / 3)}px" title="${e.toFixed(0)} 毫秒"></i>`).join('');
    const drift = errs[errs.length - 1] - errs[0], tend = Math.abs(drift) < 60 ? '速度很稳' : drift > 0 ? '越拍越慢' : '越拍越快';
    $('#tst').textContent = `平均差 ${mean.toFixed(0)} 毫秒，${tend}。绿色是抢拍，红色是拖拍。`;
    setTimeout(() => { if (tok === TOK) done(Math.max(0, Math.min(1, 1 - (mean - 20) / 140)), `平均差 ${mean.toFixed(0)} 毫秒，${tend}。${tend === '越拍越快' ? '紧张的时候人会不自觉地抢拍，这很常见。' : tend === '越拍越慢' ? '拖拍常常是因为在“等”声音，试着提前一点点。' : '你心里的钟很准。'}`) }, 1800);
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
  const tok = TOK; E.duck(.05); let r = 0;
  aiRound('ai', ok1 => { if (tok !== TOK) return; r += ok1; $('#miniBody').innerHTML = '';
    aiRound('aijit', ok2 => { if (tok !== TOK) return; r += ok2; done(r === 2 ? 1 : r === 1 ? .62 : .1, `两轮对了 ${r} 轮。`) }, '第 2 轮 · 这次的 AI 学会了“不完美”');
  }, '第 1 轮');
}

/* ---------- 6. 乐团：谁在独奏 ---------- */
const SOLOISTS = {
  vln: ['小提琴', (b, t, m, d) => strings(b, t, m + 12, d, .05, { att: .08, cut: 5200 })],
  cello: ['大提琴', (b, t, m, d) => strings(b, t, m - 12, d, .07, { att: .1, cut: 2200 })],
  flute: ['长笛', (b, t, m, d) => flute(b, t, m + 12, d, .1)],
  tpt: ['小号', (b, t, m, d) => trumpet(b, t, m, d, .07)],
  horn: ['圆号', (b, t, m, d) => horn(b, t, m - 12, d, .1)],
  harp: ['竖琴', (b, t, m) => harp(b, t, m + 12, .12)],
  piano: ['钢琴', (b, t, m, d) => keys(b, t, m + 12, d, .12)],
  vibes: ['钟琴', (b, t, m) => vibes(b, t, m + 24, .08)]
};
const SOLO_MEL = [[60, 0, 1], [64, 1, 1], [67, 2, 1.5], [65, 3.5, .5], [64, 4, 1], [62, 5, 1], [60, 6, 2]];
function gSolo(done) {
  const tok = TOK; E.duck(.05);
  const order = shuffle(Object.keys(SOLOISTS)).slice(0, 4);
  let i = 0, right = 0, combo = 0, pts = 0, answered = false, reps = 1;
  $('#miniBody').innerHTML = `<div class="rounds" id="rounds">${order.map(() => '<i></i>').join('')}</div><p class="status" id="sstat"></p>
    <div class="orch" aria-hidden="true">${['🎻', '🎺', '🪈', '🎹', '🪕'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="row" style="justify-content:center"><button class="btn ghost sm" id="srep">再听一遍（1）</button></div><div class="ear-opts" id="sopts"></div>`;
  const cb = comboEl(); $('#miniBody').appendChild(cb);
  const play = () => { const k = order[i]; E.playClip(bus => { const b = 60 / 92, t0 = now() + .2; [[0, [48, 55, 64]], [4, [43, 50, 59]], [6, [48, 55, 64]]].forEach(([s, v]) => v.forEach(m => strings(bus, t0 + s * b, m, (s === 4 ? 2 : 4) * b, .012, { att: .3, cut: 1400 }))); SOLO_MEL.forEach(([m, s, d]) => SOLOISTS[k][1](bus, t0 + s * b, m, d * b)); return 8 * b + 1.4 }, .05) };
  const ask = () => {
    if (tok !== TOK) return;
    if (i >= order.length) return done(Math.min(1, pts / (order.length * 1.2)), `四段对了 ${right} 段。`);
    answered = false; reps = 1; $('#srep').disabled = false; $('#srep').textContent = '再听一遍（1）';
    const opts = shuffle([order[i], ...shuffle(Object.keys(SOLOISTS).filter(k => k !== order[i])).slice(0, 3)]);
    $('#sstat').textContent = `第 ${i + 1} / ${order.length} 段 · 主旋律是哪件乐器？`;
    $('#sopts').innerHTML = opts.map(k => `<button class="btn ghost ear-o" data-s="${k}">${SOLOISTS[k][0]}</button>`).join('');
    $$('#sopts .ear-o').forEach((b, j) => b.onclick = () => answer(b.dataset.s));
    setTimeout(play, 300);
  };
  const answer = k => {
    if (answered) return; answered = true; const ok = k === order[i];
    $$('#sopts .ear-o').forEach(b => { b.disabled = true; if (b.dataset.s === order[i]) b.classList.add('right'); else if (b.dataset.s === k) b.classList.add('wrong') });
    $$('#rounds i')[i].className = ok ? 'ok' : 'no';
    if (ok) { right++; combo++; pts += 1 + Math.min(combo - 1, 2) * .1; sfxGood() } else { combo = 0; sfxBuzz() }
    setCombo(cb, combo); i++; setTimeout(ask, 1400);
  };
  $('#srep').onclick = () => { if (answered || reps <= 0) return; reps--; $('#srep').disabled = true; play() };
  KEYH = e => { const k = '1234'.indexOf(e.key); const b = $$('#sopts .ear-o')[k]; if (k >= 0 && b) { answer(b.dataset.s); return true } };
  ask();
}

/* ---------- 7. 主舞台救场：数着小节敲过门 ---------- */
function gFill(done) {
  const tok = TOK; E.duck(.0001);
  const rounds = [{ bars: 4, show: true, bpm: 100 }, { bars: 4, show: false, bpm: 100 }, { bars: 8, show: false, bpm: 108 }];
  let r = 0, errs = [], live = false, target = 0, tapped = false;
  $('#miniBody').innerHTML = `<div class="rounds" id="rounds"><i></i><i></i><i></i></div><p class="status" id="fstat"></p>
    <div class="barcount" id="bars"></div>
    <button class="cymbal" id="cym" aria-label="敲镲"><span>镲</span></button><p class="mnote" style="text-align:center">按空格，或点这面镲</p>`;
  const groove = (bus, t0, beat, bars) => {
    for (let b = 0; b < bars; b++) for (let q = 0; q < 4; q++) { const t = t0 + (b * 4 + q) * beat; kick(bus, t, q % 2 ? .4 : .8); if (q % 2) snare(bus, t, .18); hat(bus, t, .05); hat(bus, t + beat / 2, .035); if (q === 0) tone(bus, t, [36, 33, 41, 43][b % 4], beat * 3.6, { type: 'triangle', gain: .22, cut: 700 }) }
    kick(bus, t0 + bars * 4 * beat, .9); nhit(bus, t0 + bars * 4 * beat, { g: .2, f: 4500, d: 1.2 });
  };
  const go = () => {
    if (tok !== TOK) return;
    if (r >= rounds.length) { const sc = errs.map(e => e == null ? 0 : Math.max(0, 1 - Math.max(0, e - 30) / 220)); return done(sc.reduce((a, b) => a + b, 0) / rounds.length, `三轮的偏差：${errs.map(e => e == null ? '没敲' : Math.round(e) + ' 毫秒').join('、')}。`) }
    const R = rounds[r], beat = 60 / R.bpm, t0 = now() + .8; target = t0 + (R.bars * 4 - 1) * beat; tapped = false; live = true;
    $('#fstat').textContent = `第 ${r + 1} 轮 · 在第 ${R.bars} 小节的最后一拍敲镲${R.show ? '（这轮有小节提示）' : '（没有提示，自己数）'}`;
    $('#bars').innerHTML = R.show ? Array.from({ length: R.bars }, (_, b) => `<i>${b + 1}</i>`).join('') : '<em>自己数：一小节四拍</em>';
    E.playClip(bus => { groove(bus, t0, beat, R.bars); if (R.show) for (let b = 0; b < R.bars; b++) E.later(() => { const el = $$('#bars i')[b]; el && el.classList.add('on') }, (t0 + b * 4 * beat - now()) * 1000); return R.bars * 4 * beat + 2 }, 1, () => {
      if (tok !== TOK) return; live = false; if (!tapped) { errs.push(null); $$('#rounds i')[r].className = 'no' } r++; setTimeout(go, 900) });
  };
  const tap = () => {
    if (!live || tapped) return; const t = now() - LAT(); if (t < target - 2) return;
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
  const tok = TOK; E.duck(.05);
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
  const tok = TOK; E.duck(.05);
  const PADS = [[60, '#f0b45a'], [62, '#7fd0b6'], [64, '#9fa6f0'], [67, '#ef8aa0'], [69, '#c6a3ef']];
  let seq = [], pos = 0, canTap = false, speed = .55;
  $('#miniBody').innerHTML = `<p class="status" id="smstat">听，然后跟着弹</p><div class="simon">${PADS.map(([, c], i) => `<button class="pad" data-i="${i}" style="--c:${c}"><b>${i + 1}</b></button>`).join('')}</div><p class="score" id="smlen">长度 0</p>`;
  const pads = $$('.simon .pad');
  const flash = (i, t = .3) => { pads[i].classList.add('lit'); setTimeout(() => pads[i].classList.remove('lit'), t * 1000) };
  const sound = (i, t, out) => { keys(out || E.sfx, t, PADS[i][0] + 12, .4, .14); bell(out || E.sfx, t, PADS[i][0] + 24, .02) };
  const grow = () => {
    if (tok !== TOK) return;
    seq.push(Math.floor(Math.random() * PADS.length)); if (seq.length < 3) return grow();
    pos = 0; canTap = false; speed = Math.max(.3, .58 - (seq.length - 3) * .035);
    $('#smstat').textContent = `第 ${seq.length - 2} 轮 · 听……`;
    E.playClip(bus => { const t0 = now() + .4; seq.forEach((p, k) => { sound(p, t0 + k * speed, bus); E.later(() => flash(p, speed * .7), (.4 + k * speed) * 1000) }); return seq.length * speed + .6 }, .05,
      () => { if (tok !== TOK) return; canTap = true; $('#smstat').textContent = '轮到你了'; });
  };
  const press = i => {
    if (!canTap) return; sound(i, now()); flash(i, .2);
    if (i !== seq[pos]) { canTap = false; sfxBuzz(); pads[seq[pos]].classList.add('want'); const got = seq.length - 1;
      $('#smstat').textContent = `错了。正确的是第 ${seq[pos] + 1} 个键。`;
      setTimeout(() => { if (tok === TOK) done(Math.max(0, Math.min(1, (got - 2) / 7)), `你记住了 ${got} 个音的旋律${PROG.best && PROG.best.simonLen ? `，之前的纪录是 ${PROG.best.simonLen} 个` : ''}。`); PROG.best = PROG.best || {}; PROG.best.simonLen = Math.max(PROG.best.simonLen || 0, got) }, 1500); return }
    pos++; if (pos >= seq.length) { canTap = false; $('#smlen').textContent = `长度 ${seq.length}`; sfxGood(); if (seq.length >= 12) return setTimeout(() => done(1, `你记住了全部 ${seq.length} 个音！`), 900); setTimeout(grow, 900) }
  };
  pads.forEach((p, i) => p.addEventListener('pointerdown', e => { e.preventDefault(); press(i) }));
  KEYH = e => { const i = '12345'.indexOf(e.key); if (i >= 0) { press(i); return true } };
  grow();
}

/* ---------- 10. 评审团：三道关 ---------- */
function gFinale(done) {
  const tok = TOK; let total = 0; const parts = [];
  const stage = (name, fn, next) => { if (tok !== TOK) return; $('#miniBody').innerHTML = `<div class="stage-card">${name}</div>`; setTimeout(() => { if (tok !== TOK) return; $('#miniBody').innerHTML = ''; fn((r, d) => { total += r; parts.push(`${name.replace(/<[^>]+>/g, '')}：${Math.round(r * 100)} 分`); next() }) }, 1300) };
  stage('<b>第一关</b>听音', cb => gEar(cb, ['interval', 'chord', 'note']), () =>
    stage('<b>第二关</b>记旋律', cb => gSimon(cb), () =>
      stage('<b>第三关</b>真人还是 AI', cb => { E.duck(.05); aiRound('aijit', ok => cb(ok ? 1 : 0, ''), '2036 年的 AI，也会“不完美”') }, () => { if (tok === TOK) done(total / 3, parts.join('，') + '。') })));
}
