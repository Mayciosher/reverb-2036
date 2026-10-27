/* =========================================================
   可跳关的完整版：内容和完整版一模一样，只是多了一个“跳关”按钮
   - 第一关：可以跳年份，但第 1～5 年每年都有一个第一次出现的音乐小游戏，
     必须先玩过，才能跳过那一年（第 6～10 年是这些游戏的加难版，可以跳）
   - 第三关：直接跳到今天的任意一个身份
   - 第二关和第四关比较短，不提供跳转
   - 存档独立，不影响真正的完整版
   ========================================================= */
(() => {
  const st = document.createElement('style');
  st.textContent = `#skipBtn{position:fixed;left:14px;bottom:14px;z-index:60;font:700 13px var(--f-body);padding:8px 14px;border-radius:999px;background:#e3a93c;color:#24180a;border:0;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.4)}
  #skipPanel{position:fixed;left:14px;bottom:58px;z-index:60;padding:12px;border-radius:12px;background:#f8f1e0;color:#2b2230;box-shadow:0 18px 40px rgba(0,0,0,.5);width:250px}
  #skipPanel b{display:block;font-size:13px;letter-spacing:.1em;color:#9a5b2a;margin-bottom:8px}
  #skipPanel .g{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
  #skipPanel .g.l3{grid-template-columns:1fr}
  #skipPanel button{font:600 14px var(--f-body);padding:8px 6px;border-radius:8px;border:0;background:rgba(43,34,48,.08);color:#2b2230;cursor:pointer}
  #skipPanel button:hover,#skipPanel button.cur{background:#2b2230;color:#f8f1e0}
  #skipPanel button:disabled{opacity:.35;cursor:not-allowed;background:rgba(43,34,48,.08);color:#2b2230}
  #skipPanel p{margin:8px 0 0;font-size:12px;color:#7a6d78;line-height:1.5}`;
  document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'skipBtn'; btn.textContent = '跳关'; btn.hidden = true;
  const panel = document.createElement('div'); panel.id = 'skipPanel'; panel.hidden = true;
  document.body.append(btn, panel);
  /* 记下玩过哪几种音乐小游戏（加难版和普通版算同一种） */
  const PK = 'reverb2036-skip-played';
  const played = () => { try { return JSON.parse(localStorage.getItem(PK)) || [] } catch (_) { return [] } };
  const base = k => String(k).replace(/2$/, '');
  const _sm = startMini;
  startMini = function (kind) { try { const a = played(); if (!a.includes(base(kind))) { a.push(base(kind)); localStorage.setItem(PK, JSON.stringify(a)) } } catch (_) { } return _sm.apply(this, arguments) };
  /* 能不能跳到第 y 年：它之前每一个“第一次出现新游戏”的年份都已经玩过 */
  const firstNew = () => { const seen = new Set(), out = []; for (let k = 1; k <= 10; k++) { const M = MINIS[k] || {}, b = base((M.R && M.R.mini) || (M.L && M.L.mini) || M.mini || ''); if (b && !seen.has(b)) { seen.add(b); out.push([k, b]) } } return out };
  const blocker = y => { const a = played(); const f = firstNew().find(([k, b]) => k < y && !a.includes(b)); return f ? f[0] : 0 };
  /* 只在第一关和第三关显示“跳关”按钮 */
  const L1S = ['yearbreak', 'play', 'mini'];
  const where = () => { const s = document.body.dataset.screen; return L1S.includes(s) && G ? 'l1' : s === 'l3' && L3.roles && L3.roles.length && L3.i < L3.roles.length ? 'l3' : '' };
  setInterval(() => { const w = where(); btn.hidden = !w; if (!w) panel.hidden = true }, 400);
  btn.onclick = () => {
    const w = where(); if (!w) return;
    if (w === 'l1') panel.innerHTML = `<b>跳到第几年</b><div class="g">${Array.from({ length: 10 }, (_, k) => { const y = k + 1, bl = blocker(y); return `<button data-sy="${y}" class="${G.year === y ? 'cur' : ''}"${bl ? ` disabled title="先玩一次第 ${bl} 年的新游戏"` : ''}>${y}</button>` }).join('')}</div><p>第 1～5 年每年都有一个新的音乐小游戏，玩过才能跳过去；后面几年是加难版，可以直接跳。跳过的年份不扣生活开销。</p>`;
    else panel.innerHTML = `<b>跳到第几个身份</b><div class="g l3">${L3.roles.map((k, i) => `<button data-sr="${i}" class="${L3.i === i ? 'cur' : ''}">${L3_TIMES[i] || ''} · ${L3_ROLES[k].name}</button>`).join('')}</div><p>跳过的身份不算“挑对”。</p>`;
    panel.hidden = !panel.hidden;
  };
  panel.addEventListener('click', e => {
    const d = e.target.dataset || {};
    if (d.sy && G && !e.target.disabled && !blocker(+d.sy)) { TOK++; KEYH = null; try { E.stopClip() } catch (_) { } G.cur = null; G.queue = []; G.year = +d.sy - 1; panel.hidden = true; yearBreak(); return }
    if (d.sr != null) { TOK++; KEYH = null; try { E.stopClip() } catch (_) { } L3.i = +d.sr; saveL3(); panel.hidden = true; l3Task(); return }
  });
})();
