/* =========================================================
   文字动效：让字跟着音乐动，而不是死贴在屏幕上
   - MO.drop(el)   大标题一个字一个字落下来，每个字配一个很轻的音
   - MO.type(el)   对白像打字机一样一个字一个字出现，速度跟着音乐节拍；点一下直接显示全部
   - MO.rise(el)   一组卡片、选项从下往上依次浮现
   - MO.roll(el)   数字滚动到新值
   - MO.swap(el)   旧文字划走，新文字飞进来
   每一帧把节拍（--beat）和鼠标位置（--px、--py）写进 CSS 变量：
   带 .beat 的标题跟着鼓点放大发光，带 .float 的面板跟着鼠标轻微反向移动，有景深感。
   系统打开“减少动态效果”时，全部动画自动关掉。
   ========================================================= */
const MO = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  let tx = 0, ty = 0, px = 0, py = 0, beatV = 0, lastBeat = -1;
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1 });
  /* 当前播放到第几拍：直接读音频引擎，和听到的鼓点对齐 */
  function beatNow() {
    if (!window.E || !E.ctx || !E.timer || !E.style) return null;
    const d = E.d16(), pos = E.step - (E.nextTime - E.ctx.currentTime) / d; if (pos < 0) return null;
    return pos / 4;
  }
  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    px += (tx - px) * .05; py += (ty - py) * .05;
    const b = reduce ? null : beatNow();
    if (b != null) { const k = Math.floor(b); if (k !== lastBeat) { lastBeat = k; beatV = 1 } }
    beatV *= .9;
    root.style.setProperty('--beat', beatV.toFixed(3));
    root.style.setProperty('--px', reduce ? 0 : px.toFixed(3));
    root.style.setProperty('--py', reduce ? 0 : py.toFixed(3));
  }
  requestAnimationFrame(loop);

  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const PENT = [74, 76, 79, 81, 84, 86, 88, 91];
  /* 大标题：拆成一个个字，依次落下 */
  function drop(el, { sound = true, gap = 55 } = {}) {
    if (!el) return;
    if (reduce) return;
    /* 记住哪些字原来在 <span> 里（比如“回响”是金色），拆开以后保留颜色 */
    const chars = []; (function walk(n, acc) { n.childNodes.forEach(c => { if (c.nodeType === 3) [...c.textContent].forEach(ch => chars.push([ch, acc])); else if (c.nodeType === 1) walk(c, acc || (c.classList.contains("moch") ? c.classList.contains("acc") : true)) }) })(el, false);
    const text = chars.map(c => c[0]).join('');
    el.innerHTML = chars.map(([c, acc], i) => c === ' ' ? ' ' : `<span class="moch${acc ? ' acc' : ''}" style="--i:${i}">${esc(c)}</span>`).join('');
    el.style.setProperty('--gap', gap + 'ms');
    el.classList.remove('dropping'); void el.offsetWidth; el.classList.add('dropping');
    if (sound && window.E && E.ctx && !E.muted) [...text].forEach((c, i) => { if (c.trim()) setTimeout(() => tone(E.sfx, now(), PENT[i % PENT.length], .05, { type: 'sine', gain: .025, att: .002, rel: .25 }), i * gap + 120) });
  }
  /* 打字机：保留原来的 HTML 标签（比如加粗、标签），只把文字一个个显示出来 */
  let typing = null;
  function type(el, html, { perChar } = {}) {
    if (!el) return Promise.resolve();
    if (typing) typing.finish();
    el.innerHTML = html;
    if (reduce) return Promise.resolve();
    const spans = [];
    (function walk(n) {
      [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...c.textContent].forEach(ch => { const s = document.createElement('span'); s.className = 'tw'; s.textContent = ch; frag.appendChild(s); spans.push(s) });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && !c.classList.contains('badge')) walk(c);
      });
    })(el);
    const bpm = window.E && E.style ? E.style.bpm * (E.tempoMul || 1) : 90;
    const ms = perChar || Math.max(22, Math.min(55, 60000 / bpm / 12));
    let i = 0, timer = null, done;
    const p = new Promise(r => done = r);
    const finish = () => { clearInterval(timer); spans.forEach(s => s.classList.add('on')); el.classList.remove('typing'); el.removeEventListener('click', finish); if (typing && typing.el === el) typing = null; done() };
    el.classList.add('typing'); el.addEventListener('click', finish);
    timer = setInterval(() => { const n = Math.max(1, Math.round(16 / ms)); for (let k = 0; k < n && i < spans.length; k++) spans[i++].classList.add('on'); if (i >= spans.length) finish() }, ms);
    typing = { el, finish };
    return p;
  }
  /* 一组元素依次浮现 */
  function rise(container, sel) {
    if (!container || reduce) return;
    const items = sel ? container.querySelectorAll(sel) : container.children;
    [...items].forEach((it, i) => { it.style.setProperty('--ri', i); it.classList.remove('rising'); void it.offsetWidth; it.classList.add('rising') });
  }
  /* 数字滚动 */
  function roll(el, to) {
    if (!el) return; const from = parseInt(el.textContent, 10);
    if (reduce || isNaN(from) || from === to) { el.textContent = to; return }
    const t0 = performance.now(), d = 600;
    const step = t => { const a = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - a, 3); el.textContent = Math.round(from + (to - from) * e); if (a < 1) requestAnimationFrame(step) };
    requestAnimationFrame(step);
  }
  /* 旧文字划走，新文字飞进来 */
  function swap(el, html) {
    if (!el) return; if (reduce) { el.innerHTML = html; return }
    el.classList.add('swap-out');
    setTimeout(() => { el.innerHTML = html; el.classList.remove('swap-out'); el.classList.add('swap-in'); setTimeout(() => el.classList.remove('swap-in'), 500) }, 220);
  }
  return { drop, type, rise, roll, swap, reduce };
})();
window.MO = MO;
