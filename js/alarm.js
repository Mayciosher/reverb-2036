/* =========================================================
   数值告急警报（≤15）和高光时刻（≥85）
   数值太低：红色果冻晕染 + 警报声 + 通知，数值条变红挂“告急”
   数值很高不一定是坏事：金色晕染 + 一声好听的提示 + 好消息通知，数值条挂“高光”
   1. 整个画面像警报一样红光闪三下，配一段警报声
   2. 屏幕上方弹出一条大号“手机通知”，内容真实又有点好笑
   3. 右上角那一项数值放大、变红、持续脉动，直到脱离危险
   同一项数值进入危险区只报一次，回到安全区以后才会再报
   ========================================================= */
const ALARM = (() => {
  const LOW = 15, HIGH = 85;
  /* 通知内容：不写具体金额和数字 */
  const MSG = {
    m: { low: () => ['🏦', '银行', '【余额提醒】您的账户余额已不足。', '下个月的房租，还不知道从哪来。'],
         high: () => ['🏦', '银行', '您的账户收到一笔大额入账。', '有钱了，想做的事终于可以去做了。'] },
    f: { low: () => ['💬', '粉丝群', '群里好几天没人说话了。', '最后一条消息是：“还有人吗？”'],
         high: () => ['🔥', '热搜', '你的名字冲上了热搜。', '这一次，是因为你的歌。'] },
    l: { low: () => ['📝', '备忘录', '你很久没碰琴了。', '琴上的灰，比谱架上的谱还厚。'],
         high: () => ['🎹', '备忘录', '你已经连着写了三天，停不下来。', '这种感觉，好久没有了。'] },
    o: { low: () => ['🤖', '版权检测', '系统提示：你的新歌和本周 AI 热门曲“高度相似”。', '你分不清是你像它，还是它像你。'],
         high: () => ['📰', '乐评人', '“这是今年最特别的一张专辑。”', '有人终于听懂了你。'] }
  };
  const NAME = { m: '钱', f: '名气', l: '热爱', o: '原创' };
  const armed = { m: true, f: true, l: true, o: true };
  let css = false, hideT = null;
  function setup() {
    if (css) return; css = true;
    const st = document.createElement('style');
    st.textContent = `
/* 果冻质感的红色晕染：边缘一圈半透明的胶状红光，带高光和暗部，像一层果冻贴在屏幕边上 */
#alarmFx{position:fixed;inset:0;z-index:80;pointer-events:none;opacity:0;transition:opacity .6s ease}
#alarmFx.stay{opacity:.62}
#alarmFx.on{animation:jellyPulse 1.05s cubic-bezier(.3,1.6,.5,1) 2}
#alarmFx .gel{position:absolute;inset:0;
  background:radial-gradient(ellipse 78% 72% at 50% 48%,rgba(255,90,115,0) 58%,rgba(255,84,112,.30) 76%,rgba(232,48,84,.55) 90%,rgba(190,24,64,.72) 100%);
  -webkit-backdrop-filter:saturate(1.45) contrast(1.08);backdrop-filter:saturate(1.45) contrast(1.08);
  -webkit-mask-image:radial-gradient(ellipse 80% 74% at 50% 48%,transparent 56%,#000 80%);mask-image:radial-gradient(ellipse 80% 74% at 50% 48%,transparent 56%,#000 80%)}
#alarmFx .gloss{position:absolute;inset:0;
  background:radial-gradient(ellipse 70% 20% at 50% 0%,rgba(255,236,240,.45),rgba(255,236,240,0) 70%),
             radial-gradient(ellipse 22% 60% at 0% 40%,rgba(255,226,232,.28),rgba(255,226,232,0) 70%),
             radial-gradient(ellipse 60% 16% at 50% 100%,rgba(120,8,40,.38),rgba(120,8,40,0) 75%);
  mix-blend-mode:screen}
#alarmFx .rim{position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(255,214,222,.55),inset 0 0 26px 2px rgba(255,120,145,.45)}
@keyframes jellyPulse{0%{opacity:.62;transform:scale(1)}35%{opacity:1;transform:scale(1.012,.992)}60%{transform:scale(.996,1.006)}100%{opacity:.62;transform:scale(1)}}
#alarmNote{position:fixed;left:50%;top:26px;z-index:81;width:min(520px,90vw);font-family:var(--f-body);color:#2b2230;
  transform:translate(-50%,-170%) perspective(900px) rotateX(18deg);transform-origin:50% 0;transition:transform .55s cubic-bezier(.2,1.25,.4,1),opacity .3s;opacity:0}
#alarmNote.show{transform:translate(-50%,0) perspective(900px) rotateX(6deg) rotateZ(-.6deg);opacity:1}
#alarmNote .pc{position:relative;border-radius:18px;padding:14px 18px 13px;
  background:linear-gradient(170deg,#fffaf3 0%,#f3e9dc 100%);
  box-shadow:0 2px 0 #e4d6c6,0 5px 0 #cdbca8,0 7px 0 rgba(0,0,0,.18),0 26px 40px -10px rgba(10,4,18,.6),inset 0 1px 0 rgba(255,255,255,.9)}
#alarmNote .nh{display:flex;align-items:center;gap:10px;font-size:13px;color:#8a7c86}
#alarmNote .ic{width:32px;height:32px;border-radius:9px;background:linear-gradient(160deg,#fff,#eadfd2);box-shadow:0 2px 0 #d6c7b6;display:grid;place-items:center;font-size:18px}
#alarmNote .nh b{color:#2b2230;font-size:14px}
#alarmNote .tag{margin-left:auto;color:#fff6f0;font-weight:700;font-size:12px;padding:4px 11px 3px;border-radius:7px;letter-spacing:.12em;transform:rotate(2deg);background:linear-gradient(180deg,#d77682 0%,#b04656 55%,#963848 100%);box-shadow:inset 0 1px 0 rgba(255,220,224,.75),inset 0 -1px 0 rgba(80,10,25,.4),0 2px 0 #7a2a38,0 4px 6px rgba(60,10,20,.35);text-shadow:0 -1px 0 rgba(80,10,25,.5)}
#alarmNote .t{font-size:19px;font-weight:700;line-height:1.45;margin:9px 0 2px}
#alarmNote .s{font-size:15px;color:#6a5d68;line-height:1.5}
#alarmNote .nf{display:flex;align-items:center;gap:14px;margin-top:11px;font-size:13px;color:#9a6a4a}#alarmNote .nf span{flex:1;line-height:1.5}
#alarmNote button{flex-shrink:0;white-space:nowrap;font:700 14px var(--f-body);background:linear-gradient(180deg,#3a2f40,#2b2230);color:#fbf7f2;border:0;border-radius:999px;padding:7px 18px;cursor:pointer;box-shadow:0 3px 0 #150f18}
#alarmNote button:active{transform:translateY(2px);box-shadow:0 1px 0 #150f18}
.meter.alarm{z-index:2;animation:meterGrow 1.2s ease-in-out infinite}
.meter.alarm .track{box-shadow:0 0 0 1.5px rgba(255,226,230,.9),0 0 0 3.5px #b04656,0 0 0 4.5px rgba(70,10,25,.6),0 3px 6px rgba(0,0,0,.45);animation:meterAlarm 1.2s ease-in-out infinite}
.meter.alarm .fill{background:linear-gradient(90deg,#9c3a4a 0%,#e48a96 45%,#c25262 70%,#8e3241 100%)!important}
.meter.alarm .mlab,.meter.alarm .mval{color:#f2a7b0!important;font-weight:700}
.meter.alarm::after{content:"● 告急";position:absolute;top:calc(100% + 12px);left:50%;transform-origin:50% -10px;color:#fff6f0;font:800 14px var(--f-body);padding:4px 10px 3px;border-radius:7px;white-space:nowrap;letter-spacing:.12em;
  background:linear-gradient(180deg,#e0808c 0%,#b8495a 52%,#97364a 100%);box-shadow:inset 0 1px 0 rgba(255,225,229,.8),inset 0 -1px 0 rgba(70,8,22,.45),0 3px 0 #74283a,0 6px 10px rgba(0,0,0,.45);
  text-shadow:0 -1px 0 rgba(80,10,25,.55);animation:tagSwing 1.6s ease-in-out infinite}
.meter.alarm::before{content:"";position:absolute;top:calc(100% + 2px);left:50%;width:1.5px;height:11px;background:rgba(240,220,210,.7);transform:translateX(-50%)}
@keyframes tagSwing{0%,100%{transform:translateX(-50%) rotate(-5deg)}50%{transform:translateX(-50%) rotate(5deg)}}
@keyframes meterGrow{0%,100%{transform:scale(1.12)}50%{transform:scale(1.22)}}
@keyframes meterAlarm{0%,100%{filter:brightness(1)}50%{filter:brightness(1.25)}}
#alarmFx.gold .gel{background:radial-gradient(ellipse 78% 72% at 50% 48%,rgba(255,210,110,0) 58%,rgba(255,206,100,.26) 76%,rgba(240,176,60,.48) 90%,rgba(214,140,30,.6) 100%)}
#alarmFx.gold .rim{box-shadow:inset 0 0 0 1px rgba(255,240,200,.6),inset 0 0 26px 2px rgba(255,205,110,.45)}
#alarmNote.gold .pc::after{content:"";position:absolute;inset:0;border-radius:18px;box-shadow:0 0 0 2px rgba(230,170,60,.7);pointer-events:none}
#alarmNote.gold .tag{background:linear-gradient(180deg,#f3c76a 0%,#d79a2e 55%,#b97d1c 100%);box-shadow:inset 0 1px 0 rgba(255,245,215,.8),0 2px 0 #8a5c12,0 4px 6px rgba(60,40,10,.35);color:#3a2608;text-shadow:none}
.meter.glow{z-index:2}
.meter.glow .track{box-shadow:0 0 0 1.5px rgba(255,245,215,.9),0 0 0 3.5px #d79a2e,0 3px 6px rgba(0,0,0,.4)}
.meter.glow .mlab,.meter.glow .mval{color:#ffd88a!important;font-weight:700}
.meter.glow::after{content:"★ 高光";position:absolute;top:calc(100% + 12px);left:50%;transform:translateX(-50%) rotate(3deg);color:#3a2608;font:800 13px var(--f-body);padding:3px 9px 2px;border-radius:7px;white-space:nowrap;letter-spacing:.1em;
  background:linear-gradient(180deg,#f8d888 0%,#dca23a 55%,#bb7f1e 100%);box-shadow:inset 0 1px 0 rgba(255,248,220,.9),0 3px 0 #8a5c12,0 6px 10px rgba(0,0,0,.4)}
.meter.glow::before{content:"";position:absolute;top:calc(100% + 2px);left:50%;width:1.5px;height:11px;background:rgba(240,220,180,.7);transform:translateX(-50%)}
@media (prefers-reduced-motion:reduce){#alarmFx.on{animation:none;opacity:.8}.meter.alarm,.meter.alarm .track{animation:none;transform:scale(1.2)}#alarmNote{transition:none}}`;
    document.head.appendChild(st);
    const fx = document.createElement('div'); fx.id = 'alarmFx'; fx.innerHTML = '<i class="gel"></i><i class="gloss"></i><i class="rim"></i>';
    const n = document.createElement('div'); n.id = 'alarmNote'; n.setAttribute('role', 'alert');
    document.body.append(fx, n);
  }
  /* 警报声：两声“呜——呜——”高低交替 */
  function siren() {
    if (!window.E || !E.ctx || E.muted) return;
    const c = E.ctx, t0 = c.currentTime + .02, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'triangle'; lp.type = 'lowpass'; lp.frequency.value = 1800;
    for (let i = 0; i < 3; i++) { o.frequency.setValueAtTime(620, t0 + i * .55); o.frequency.linearRampToValueAtTime(980, t0 + i * .55 + .27); o.frequency.linearRampToValueAtTime(620, t0 + i * .55 + .55) }
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.07, t0 + .05); g.gain.setValueAtTime(.07, t0 + 1.55); g.gain.linearRampToValueAtTime(0, t0 + 1.65);
    o.connect(lp); lp.connect(g); g.connect(E.sfx || c.destination); o.start(t0); o.stop(t0 + 1.7);
  }
  function fire(k, side) {
    setup();
    const [ic, app, t, s] = MSG[k][side]();
    const fx = document.getElementById('alarmFx'); fx.classList.remove('on'); void fx.offsetWidth; fx.classList.add('on'); fx.classList.add('stay'); fx.classList.toggle('gold', side === 'high');
    const n = document.getElementById('alarmNote');
    n.innerHTML = `<div class="pc"><div class="nh"><span class="ic">${ic}</span><b>${app}</b><span>现在</span><span class="tag">${NAME[k]}${side === 'low' ? '快没了' : '高光时刻'}</span></div><div class="t">${t}</div><div class="s">${s}</div><div class="nf"><span>右上角「${NAME[k]}」正在闪：再往${side === 'low' ? '下掉到 0' : '上冲到 100'}，人生就要拐弯了。</span><button>知道了</button></div></div>`;
    n.classList.remove('show'); void n.offsetWidth; n.classList.add('show'); n.classList.toggle('gold', side === 'high');
    n.querySelector('button').onclick = () => n.classList.remove('show');
    clearTimeout(hideT); hideT = setTimeout(() => n.classList.remove('show'), 9000);
    if (side === 'high') chime(); else siren();
  }
  /* 高光的提示音：三个往上走的音 */
  function chime() { if (!window.E || !E.ctx || E.muted) return; const t = E.ctx.currentTime + .03; [76, 81, 88].forEach((m, i) => bell(E.sfx, t + i * .12, m, .05)) }
  /* 每次数值变化后调用：更新脉动，并在第一次进入危险区时报警 */
  function check(s) {
    if (!s) return; setup();
    Object.keys(NAME).forEach(k => {
      const v = s[k], side = v <= LOW ? 'low' : v >= HIGH ? 'high' : null, m = document.querySelector(`.meter[data-k="${k}"]`);
      if (m) { m.classList.toggle('alarm', side === 'low'); m.classList.toggle('glow', side === 'high') }
      if (side && armed[k]) { armed[k] = false; fire(k, side) }
      if (!side) armed[k] = true;
    });
    edge();
  }
  function edge() { const fx = document.getElementById('alarmFx'); if (!fx) return; const on = typeof G !== 'undefined' && G && Object.keys(NAME).some(k => G.s[k] <= LOW || G.s[k] >= HIGH); fx.classList.toggle('stay', !!on); if (!on) fx.classList.remove('on') }
  function reset() { Object.keys(armed).forEach(k => armed[k] = true) }
  return { check, fire, reset, LOW, HIGH };
})();
window.ALARM = ALARM;
