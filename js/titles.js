/* =========================================================
   每一关的标题组合（左上角），和“电影片头式登场”
   - 第一关：站酷庆科黄油体的“第6年” + 十个小节的五线谱（走过的年份是音符，今年发亮，没到的是休止符）
   - 第二关：志莽行书 + 一支越烧越短的蜡烛 + “回声铺”印章
   - 第三关：Orbitron 翻牌钟 + 站酷快乐体的身份 + 一日行程车票（到过的站打孔）
   - 第四关：站酷庆科黄油体的乐章名 + 速度术语 + 四段进度
   TT.intro(el)：标题先在画面正中间放大出现，停一秒多，再缩回左上角
   ========================================================= */
const TT = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  /* 十个小节的五线谱：year 是第几年 */
  function staff(year) {
    let v = '<svg class="tt-staff" viewBox="-4 -14 328 54" aria-label="十年走到第 ' + year + ' 年">';
    for (let i = 0; i < 5; i++) v += `<line x1="0" x2="320" y1="${6 + i * 6}" y2="${6 + i * 6}"/>`;
    for (let m = 0; m <= 10; m++) v += `<line class="bar${m === 0 || m === 10 ? ' end' : ''}" x1="${m * 32}" x2="${m * 32}" y1="6" y2="30"/>`;
    const ys = [24, 18, 21, 15, 12, 18, 9, 15, 21, 12];
    for (let m = 0; m < 10; m++) {
      const y = ys[m], cx = m * 32 + 15;
      if (m + 1 < year) v += `<ellipse cx="${cx}" cy="${y}" rx="5.2" ry="3.8" transform="rotate(-20 ${cx} ${y})"/><line class="stem" x1="${cx + 5}" x2="${cx + 5}" y1="${y - 1}" y2="${y - 17}"/>`;
      else if (m + 1 === year) v += `<rect class="now" x="${m * 32}" y="0" width="32" height="36" rx="3"/><ellipse class="nowh" cx="${cx}" cy="${y}" rx="5.6" ry="4.1" transform="rotate(-20 ${cx} ${y})"/><line class="stem nows" x1="${cx + 5.3}" x2="${cx + 5.3}" y1="${y - 1}" y2="${y - 18}"/>`;
      else v += `<rect class="rest" x="${cx - 4}" y="15" width="8" height="3.2" rx=".6"/>`;
    }
    return v + '</svg>';
  }
  function l1(year, name = '饿死之前') {
    return `<div class="tt tt1"><div class="tt-big">第<em class="beat">${year}</em>年</div><div class="tt-sub">${2026 + year} · ${esc(name)}</div>${staff(year)}</div>`;
  }
  /* 一支蜡烛：p 是这一关走了多远（0 到 1），走得越远烧得越短 */
  function candle(p) {
    const h = Math.max(8, 60 * (1 - p * .85));
    return `<svg class="tt-candle" viewBox="0 0 30 90" aria-hidden="true"><ellipse cx="15" cy="86" rx="13" ry="3" class="dish"/><rect x="9" y="${84 - h}" width="12" height="${h}" rx="2" class="wax"/><path class="drip" d="M9 ${84 - h + 4} q-2 6 0 9"/><path class="flame" d="M15 ${84 - h - 20} C21 ${84 - h - 11} 20 ${84 - h - 4} 15 ${84 - h - 4} C10 ${84 - h - 4} 9 ${84 - h - 11} 15 ${84 - h - 20}Z"/></svg>`;
  }
  function l2(title, sub, p) {
    return `<div class="tt tt2">${candle(p)}<div><div class="tt-brush">${esc(title)}</div><div class="tt-sub"><span class="tt-seal">回声铺</span>${esc(sub)}</div></div></div>`;
  }
  /* 第三关：翻牌钟 + 身份 + 一日行程车票 */
  function flaps(t) { return [...t].map((c, i) => `<span class="flap${c === ':' ? ' sep' : ''}" style="--d:${i * 90}ms">${c}</span>`).join('') }
  function ticket(stops, i) {
    return `<div class="tt-ticket"><div class="tk-h"><b>2036 · 一日行程</b><span>No.${esc(L3_TIMES[i] ? L3_TIMES[i].replace(':', '') : '0000')}</span></div><div class="tk-row">${stops.map((n, k) => `<div class="tk-st${k < i ? ' done' : k === i ? ' now' : k === i + 1 ? ' next' : ''}"><i></i><b>${esc(n)}</b></div>`).join('')}</div><div class="tk-f"><span>第 ${i + 1} 站 / 共 ${stops.length} 站</span>${stops[i + 1] ? `<span>下一站：${esc(stops[i + 1])}</span>` : '<span>最后一站</span>'}</div></div>`;
  }
  function l3(time, role, stops, i) {
    return `<div class="tt tt3"><div class="tt-board">${flaps(time)}</div><div class="tt-role">${esc(role)}</div>${ticket(stops, i)}</div>`;
  }
  /* 第四关：四个问题就是交响曲的四个乐章 */
  const MVT = [['要不要换', 'Allegro', '快板，像心跳加快的速度'], ['学不走的东西', 'Andante', '行板，像走路一样的速度'], ['你是谁', 'Moderato', '中板，不快不慢'], ['给明天', 'Adagio', '柔板，慢慢地']];
  const ZH = ['一', '二', '三', '四'];
  function l4(i) {
    const [t, it, zh] = MVT[i];
    return `<div class="tt tt4"><div class="tt-eye">问自己 · 第${ZH[i]}乐章<em>共四乐章</em></div><div class="tt-mvt">${t}</div><div class="tt-tempo"><i>${it}</i>${zh}</div><div class="tt-mv">${[0, 1, 2, 3].map(k => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div></div>`;
  }
  /* 电影片头式登场：先在画面正中间大大地出现，停一下，再缩回原来的位置 */
  function intro(el, hold = 1300) {
    if (!el || MO.reduce) return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    const s = Math.min(1.7, (innerWidth * .62) / r.width, (innerHeight * .5) / r.height);
    const dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight * .44 - (r.top + r.height / 2);
    document.body.classList.add('titling');
    el.style.transition = 'none'; el.style.transform = `translate(${dx}px,${dy}px) scale(${s})`; el.style.opacity = '0';
    void el.offsetWidth;
    el.style.transition = 'opacity .5s ease'; el.style.opacity = '1';
    clearTimeout(el._tt); clearTimeout(el._tt2);
    /* 先让标题完全退回左上角，中间空出来以后，其他内容再按顺序出现（卡片先，两边选项后） */
    el._tt = setTimeout(() => {
      el.style.transition = 'transform .95s cubic-bezier(.7,0,.2,1)'; el.style.transform = '';
      el._tt2 = setTimeout(() => { el.style.transition = ''; document.body.classList.remove('titling') }, 980);
    }, hold);
  }
  /* 通用标题（非关卡核心画面用），theme 决定用哪一关的字体气质 */
  function gen(eye, title, sub, theme = 'l1') {
    return `<div class="tt ttg ttg-${theme}">${eye ? `<div class="tt-eye2">${eye}</div>` : ''}<div class="tt-gt">${title}</div>${sub ? `<div class="tt-sub2">${sub}</div>` : ''}</div>`;
  }
  /* 把一个页面变成横屏左右两栏：左边是标题，右边是写在实物上的内容
     mat：右边是什么材质（note 笔记本、bill 账单、desk 调音台、letter 旧信笺、order 工作单、programme 节目单） */
  function duo(id, head, { drop = '', mat = 'note', intro: doIntro = false } = {}) {
    const el = document.getElementById(id); if (!el) return;
    const main = document.createElement('div'); main.className = 'lx-main';
    [...el.childNodes].forEach(n => main.appendChild(n));
    /* 只去掉页面最外层的旧标题，不碰卡片里面的小标题 */
    if (drop) main.querySelectorAll(drop.split(',').map(x => ':scope > ' + x.trim().replace(/^#\w+ > /, '')).join(',')).forEach(n => n.remove());
    el.innerHTML = `<div class="lx-head">${head}</div>`; el.appendChild(main);
    el.dataset.mat = mat; setView(id, 'duo'); el.scrollTop = 0;
    if (doIntro) requestAnimationFrame(() => intro(el.querySelector('.lx-head .tt')));
  }
  return { l1, l2, l3, l4, gen, duo, intro, MVT };
})();
window.TT = TT;
