/* =========================================================
   课堂演示版（只用于课堂演示，不上线）
   - 第一关只走第 1、5、10 年，但五个音乐小游戏全都有
   - 第二关只问 1 个问题；第三关 3 个身份；第四关 2 个乐章
   - 左下角“演示”按钮：随时跳到任何一关，演示时不怕时间不够
   - 存档和结局图鉴独立，不影响完整版
   ========================================================= */
(() => {
  /* ---------- 第一关：3 年，每年的卡片和音乐小游戏都是挑好的 ---------- */
  const YEARS = [1, 5, 10];
  const QUEUE = {
    1: [{ c: 'r-aidetect' }, { m: 1 }, { c: 'k01' }, { m: 2 }, { c: 'k67' }],
    5: [{ c: 'k66' }, { m: 3 }, { c: 'u-drama' }, { m: 4 }, { c: 'k70' }],
    10: [{ c: 'k71' }, { m: 5 }, { c: 'k72' }, { c: 'k61' }]
  };
  const _yb = yearBreak;
  yearBreak = function () { const k = YEARS.indexOf(G.year); G.year = (k < 0 ? YEARS[0] : YEARS[k + 1]) - 1; _yb() };
  buildQueue = function () { G.queue = QUEUE[G.year].filter(r => !r.c || BYID[r.c]).map(r => ({ ...r })); G.idx = 0; G.total = G.queue.length };
  /* ---------- 第二关：只问 1 个问题 ---------- */
  SOUL_Q.splice(1);
  /* ---------- 第三关：一个音乐的身份、一个别的行业、最后做回自己 ---------- */
  L3_TIMES.splice(0, L3_TIMES.length, '10:00', '19:00', '02:00');
  pickRoles = function () { return [l3Ms() >= 5 ? 'bar' : 'teacher', 'photo', 'self'] };
  /* ---------- 第四关：第二、第三乐章 ---------- */
  const _q = l4Questions;
  l4Questions = function () { return _q().filter(q => q.mv === 1 || q.mv === 2) };

  /* ---------- 主页标一下这是演示版 ---------- */
  const eb = document.querySelector('.hero .eyebrow'); if (eb) eb.textContent = '课堂演示版 · 第一关 3 年 · 五个音乐小游戏全都有';
  document.title = '十年回响 · 课堂演示版';

  /* ---------- 演示面板 ---------- */
  const st = document.createElement('style');
  st.textContent = `#demoBtn{position:fixed;left:14px;bottom:14px;z-index:60;font:700 13px var(--f-body);padding:8px 14px;border-radius:999px;background:#e3a93c;color:#24180a;border:0;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.4)}
  #demoPanel{position:fixed;left:14px;bottom:58px;z-index:60;display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:12px;background:#f8f1e0;color:#2b2230;box-shadow:0 18px 40px rgba(0,0,0,.5);width:220px}
  #demoPanel b{font-size:13px;letter-spacing:.1em;color:#9a5b2a;margin-bottom:2px}
  #demoPanel button{font:600 14px var(--f-body);text-align:left;padding:8px 10px;border-radius:8px;border:0;background:rgba(43,34,48,.07);color:#2b2230;cursor:pointer}
  #demoPanel button:hover{background:#2b2230;color:#f8f1e0}
  #demoPanel .sm{font-size:12px;color:#7a6d78;background:none;padding:4px 10px}`;
  document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'demoBtn'; btn.textContent = '演示 · 跳关';
  const panel = document.createElement('div'); panel.id = 'demoPanel'; panel.hidden = true;
  panel.innerHTML = `<b>直接跳到</b>${[['hub', '主页'], ['l1', '第一关 · 第 1 年'], ['l1y5', '第一关 · 第 5 年'], ['l1y10', '第一关 · 第 10 年'], ['l2', '第二关 · 音乐命运签'], ['l3', '第三关 · 身兼数职'], ['l4', '第四关 · 十年回响'], ['pt', '音乐人格画像']].map(([k, t]) => `<button data-dj="${k}">${t}</button>`).join('')}<button class="sm" data-dj="reset">清空演示进度</button>`;
  document.body.append(btn, panel);
  btn.onclick = () => { panel.hidden = !panel.hidden };
  /* 跳关时用一份示例存档，让后面的关卡有内容可说 */
  const sample = stage => {
    PROG = blank(); Object.assign(PROG, { ideal: 'indie', share: 8, latency: PROG.latency || 0, g: 'she', stage });
    PROG.tags = { auth: 4, bond: 3, money: 2, ai: 2, secure: 1, risk: 1 }; PROG.dom = { music: 4, edu: 2, life: 1 };
    PROG.log = [{ lv: 1, y: 1, who: '比赛主办方', say: '你投的 demo 被 AI 检测系统判定疑似 AI 生成', pick: '交创作录像申诉', k: 'fight auth', key: true }, { lv: 1, y: 5, who: '人事（HR）', say: 'AI 绩效系统判定你情绪波动过大', pick: '申诉，要真人复核', k: 'fight', key: true }];
    if (stage >= 1) PROG.l1 = { id: 'tavern', stats: { m: 38, f: 61, l: 72, o: 66 }, year: 10, survived: true };
    if (stage >= 2) { PROG.l2 = { title: '温柔的先锋', top: 'auth' }; PROG.l2notes = [0, 2, 4, 7, 5, 4, 2, 0] }
    if (stage >= 3) PROG.l3 = { own: 3, right: 2, ai: 0, title: '靠自己的耳朵', fav: '酒吧驻唱', n: 3 };
  };
  panel.addEventListener('click', e => {
    const k = e.target.dataset && e.target.dataset.dj; if (!k) return;
    E.init(); TOK++; KEYH = null; E.stopClip(); G = null; panel.hidden = true; previewing = null;
    if (k === 'reset') { PROG = blank(); save(); goHub(); return }
    if (k === 'hub') { goHub(); return }
    if (k.startsWith('l1')) {
      sample(0); save(); newGame('she');
      const y = k === 'l1y5' ? 5 : k === 'l1y10' ? 10 : 0;
      if (y) { G.year = y === 5 ? 1 : 5; G.s = y === 5 ? { m: 41, f: 55, l: 63, o: 58 } : { m: 34, f: 62, l: 70, o: 61 }; yearBreak() }
      return;
    }
    if (k === 'l2') { sample(1); save(); startL2(); return }
    if (k === 'l3') { sample(2); PROG.l3save = null; save(); startL3(); return }
    if (k === 'l4') { sample(3); save(); startL4(); return }
    if (k === 'pt') { sample(3); save(); startL4(); L4.notes = [0, 4, 2, 7]; L4.ans = { core: '我和听众之间的关系', intro: '一个会写歌的老师' }; l4End('maj'); return }
  });
})();
