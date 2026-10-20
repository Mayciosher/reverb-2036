/* ================= 工具 ================= */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const mtof=m=>440*Math.pow(2,(m-69)/12);
let seed=11;const srand=s=>{seed=s};const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const STAT={m:'钱',f:'名气',l:'热爱',o:'原创'};
const KEYS=['m','f','l','o'];
let KEYH=null;

/* 存档：只存在这台设备的浏览器里 */
const STORE='shinian-huixiang-v2';
let PROG={l1:null,l2:null,l3:null,l4:null,endings:[]};
try{const raw=localStorage.getItem(STORE);if(raw)PROG=Object.assign(PROG,JSON.parse(raw))}catch(e){}
function save(){try{localStorage.setItem(STORE,JSON.stringify(PROG))}catch(e){}}

/* ================= 音频引擎 ================= */
const E={ctx:null,bus:{},layers:{},style:null,styleKey:null,step:0,nextTime:0,timer:null,tempoMul:1,mood:{danger:0,love:1,orig:1},muted:false,stopTok:0};
function makeIR(c,sec){const len=c.sampleRate*sec,b=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}return b}
E.init=function(){
  if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return}
  const C=window.AudioContext||window.webkitAudioContext;const c=this.ctx=new C();
  this.out=c.createGain();this.out.gain.value=.85;
  this.duckG=c.createGain();this.master=c.createGain();
  this.lp=c.createBiquadFilter();this.lp.type='lowpass';this.lp.frequency.value=18000;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
  this.master.connect(this.lp);this.lp.connect(this.duckG);this.duckG.connect(comp);comp.connect(this.out);this.out.connect(c.destination);
  this.verb=c.createConvolver();this.verb.buffer=makeIR(c,2.4);const vg=c.createGain();vg.gain.value=.35;this.verb.connect(vg);vg.connect(comp);
  this.sfx=c.createGain();this.sfx.gain.value=.75;this.sfx.connect(comp);const sv=c.createGain();sv.gain.value=.22;this.sfx.connect(sv);sv.connect(this.verb);
  this.dry=c.createGain();this.dry.gain.value=.75;this.dry.connect(comp);
  const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;this.noise=nb;
};
E.layerBus=function(n){if(!this.bus[n]){const g=this.ctx.createGain();g.gain.value=0;g.connect(this.master);const s=this.ctx.createGain();s.gain.value=.28;g.connect(s);s.connect(this.verb);this.bus[n]=g}return this.bus[n]};
E.setLayer=function(n,on){this.layers[n]=on;if(!this.ctx)return;this.layerBus(n).gain.setTargetAtTime(on?1:0,this.ctx.currentTime,on?.6:.25);renderChans()};
E.d16=function(){return 60/(this.style.bpm*this.tempoMul)/4};
E.play=function(key,on){
  this.init();this.stopTok++;
  if(this.styleKey!==key){for(const n in this.bus)this.bus[n].gain.setTargetAtTime(0,this.ctx.currentTime,.1);this.layers={}}
  this.style=STYLES[key];this.styleKey=key;
  if(!this.timer){this.step=0;this.nextTime=this.ctx.currentTime+.08;this.timer=setInterval(()=>this.tick(),25)}
  for(const L of this.style.layers)this.setLayer(L.name,on.includes(L.name));
};
E.stop=function(fade=.6){
  if(!this.ctx)return;for(const n in this.bus)this.bus[n].gain.setTargetAtTime(0,this.ctx.currentTime,fade/3);
  const tok=++this.stopTok;setTimeout(()=>{if(tok===this.stopTok){clearInterval(this.timer);this.timer=null;this.layers={};this.styleKey=null;renderChans()}},fade*1000+200);
};
E.tick=function(){const c=this.ctx;while(this.nextTime<c.currentTime+.12){this.sched(this.step,this.nextTime);this.nextTime+=this.d16();this.step++}};
E.sched=function(step,t){
  const s=this.style,bar=Math.floor(step/16),st=step%16;
  const sw=(st%2===1)?s.swing*this.d16()*(this.mood.orig<.35?0:1):0;
  for(const L of s.layers){if(this.layers[L.name])L.play(st,bar,t+sw,this.layerBus(L.name),s,this)}
};
E.nextBarTime=function(){const d=this.d16();return this.nextTime+((16-(this.step%16))%16)*d};
E.duck=function(v){if(this.ctx)this.duckG.gain.setTargetAtTime(v,this.ctx.currentTime,.15)};
E.setMute=function(m){this.muted=m;if(this.ctx)this.out.gain.setTargetAtTime(m?0:.85,this.ctx.currentTime,.05)};
E.resetMood=function(){this.mood={danger:0,love:1,orig:1};this.tempoMul=1;if(this.lp)this.lp.frequency.setTargetAtTime(18000,this.ctx.currentTime,.1)};
const now=()=>E.ctx.currentTime;

/* 乐器 */
function tone(out,t,midi,dur,o={}){
  const c=E.ctx,{type='sine',gain=.2,att=.01,rel=.25,cut=0,q=.7,detune=0}=o;
  const osc=c.createOscillator();osc.type=type;osc.frequency.value=mtof(midi);osc.detune.value=detune;
  const g=c.createGain();const hold=Math.max(dur,att+.005);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+att);g.gain.setTargetAtTime(0,t+hold,rel/4);
  let n=osc;if(cut){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=cut;f.Q.value=q;osc.connect(f);n=f}
  n.connect(g);g.connect(out);osc.start(t);osc.stop(t+hold+rel*1.5+.05);
}
/* 钢琴：力度越大，音越亮 */
function keys(out,t,midi,dur,gain=.06,detune=0){
  tone(out,t,midi,dur,{type:'sine',gain,att:.004,rel:.5,detune});
  tone(out,t,midi+12,dur*.6,{type:'triangle',gain:gain*(.12+gain*1.6),att:.003,rel:.3,detune});
  tone(out,t,midi,.04,{type:'triangle',gain:gain*.5,att:.002,rel:.06,cut:2500+gain*20000});
}
function kick(out,t,g=.9,f0=150,f1=45,d=.35){const c=E.ctx,o=c.createOscillator(),a=c.createGain();o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+.12);a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(a);a.connect(out);o.start(t);o.stop(t+d+.05)}
function nhit(out,t,{g=.3,type='highpass',f=7000,d=.05,q=.7}={}){const c=E.ctx,s=c.createBufferSource();s.buffer=E.noise;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const a=c.createGain();a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(a);a.connect(out);s.start(t,Math.random()*.5);s.stop(t+d+.05)}
function snare(out,t,g=.3){nhit(out,t,{g,type:'bandpass',f:1900,d:.18,q:.8});tone(out,t,55,.04,{type:'triangle',gain:g*.6,rel:.08})}
function hat(out,t,g=.06,d=.04){nhit(out,t,{g,f:7500,d})}
function pluck(out,t,midi,g=.07){tone(out,t,midi,.02,{type:'sawtooth',gain:g,att:.002,rel:.5,cut:2200});tone(out,t,midi+12,.02,{type:'triangle',gain:g*.4,att:.002,rel:.3})}

/* 曲风 */
const chordAt=(s,bar)=>s.chords[bar%s.chords.length];
const LEAD=(()=>{srand(42);const pent=[62,65,67,69,72,74,77];const bars=[];let idx=3;for(let b=0;b<4;b++){const a=new Array(16).fill(null);for(const st of [0,3,6,8,10,12,14]){if(rnd()<.62||st===0){idx=Math.max(0,Math.min(pent.length-1,idx+Math.round((rnd()-.5)*3)));a[st]=pent[idx]}}bars.push(a)}return bars})();
const STYLES={
  lofi:{bpm:80,swing:.3,
    chords:[{r:38,v:[53,57,60,64]},{r:43,v:[53,57,59,64]},{r:36,v:[52,55,59,62]},{r:45,v:[55,58,61,64]}],
    layers:[
      {name:'keys',label:'钢琴',play(st,bar,t,out,s,E){if(st!==0&&st!==6)return;const c=chordAt(s,bar);const dt=()=>(Math.random()-.5)*90*Math.max(0,1-E.mood.love*2.2);const b=E.d16()*4;c.v.forEach((m,i)=>keys(out,t+i*.012,m,st===0?b*1.4:b*.9,st===0?.05:.035,dt()))}},
      {name:'bass',label:'贝斯',play(st,bar,t,out,s,E){const c=chordAt(s,bar),n=chordAt(s,bar+1),b=E.d16()*4;if(st===0)tone(out,t,c.r,b*.9,{type:'triangle',gain:.42,rel:.15,cut:900});if(st===8)tone(out,t,c.r+7,b*.8,{type:'triangle',gain:.36,rel:.15,cut:900});if(st===14)tone(out,t,n.r-1,b*.35,{type:'triangle',gain:.3,rel:.1,cut:900})}},
      {name:'drums',label:'鼓组',play(st,bar,t,out){if(st===0||st===10||(st===7&&bar%2))kick(out,t,.75);if(st===4||st===12)snare(out,t,.22);if(st%2===0)hat(out,t,st%4===2?.07:.04)}},
      {name:'arp',label:'分解和弦',play(st,bar,t,out,s){if(st%2)return;const c=chordAt(s,bar);pluck(out,t,c.v[(st/2)%4]+12+(st>7?12:0),.06)}},
      {name:'lead',label:'主旋律',play(st,bar,t,out,s,E){const m=LEAD[bar%4][st];if(m==null)return;const robo=E.mood.orig<.35;tone(out,t,m,E.d16()*1.6,{type:robo?'square':'sine',gain:robo?.035:.09,att:robo?.002:.02,rel:robo?.05:.3,cut:robo?2400:0})}},
      {name:'heart',label:'心跳',hot:true,play(st,bar,t,out,s,E){if(st===0||st===3||st===8||st===11)kick(out,t,.25+.5*E.mood.danger,70,38,.25)}}
    ]},
  mystic:{bpm:66,swing:0,chords:[{r:38},{r:38},{r:39},{r:38}],scale:[62,63,66,67,69,70,72,74],
    layers:[
      {name:'drone',label:'持续低音',play(st,bar,t,out,s,E){if(st)return;const c=chordAt(s,bar),b=E.d16()*16;tone(out,t,c.r,b,{type:'sawtooth',gain:.06,att:.8,rel:1,cut:420});tone(out,t,c.r+7,b,{type:'sawtooth',gain:.04,att:.8,rel:1,cut:420})}},
      {name:'harp',label:'竖琴',play(st,bar,t,out,s){if(st%2)return;const sc=s.scale,i=(st/2+bar*3)%8;tone(out,t,sc[i]+(bar%2&&st>7?12:0),.05,{type:'triangle',gain:.07,att:.002,rel:1.2})}},
      {name:'bell',label:'铃',play(st,bar,t,out,s){if(st===0||(st===8&&bar%2))tone(out,t,s.scale[(bar*5+st)%8]+12,.05,{type:'sine',gain:.05,att:.002,rel:2.4})}},
      {name:'tom',label:'手鼓',play(st,bar,t,out){if(st===0)kick(out,t,.6,120,70,.4);if(st===6||st===10)kick(out,t,.35,180,110,.25);if(st===14)nhit(out,t,{g:.1,type:'bandpass',f:900,d:.1})}}
    ]},
  synth:{bpm:100,swing:0,chords:[{r:45,v:[57,60,64]},{r:41,v:[57,60,65]},{r:36,v:[55,60,64]},{r:43,v:[55,59,62]}],
    layers:[
      {name:'pad',label:'合成垫',play(st,bar,t,out,s,E){if(st)return;const c=chordAt(s,bar);c.v.forEach(m=>{tone(out,t,m,E.d16()*16,{type:'sawtooth',gain:.02,att:.3,rel:.6,cut:1500,detune:-8});tone(out,t,m,E.d16()*16,{type:'sawtooth',gain:.02,att:.3,rel:.6,cut:1500,detune:8})})}},
      {name:'sbass',label:'贝斯',play(st,bar,t,out,s,E){if(st%2)return;const c=chordAt(s,bar);tone(out,t,c.r+(st%4===2?12:0),E.d16()*1.6,{type:'sawtooth',gain:.15,rel:.06,cut:650,q:4})}},
      {name:'sdrums',label:'鼓组',play(st,bar,t,out){if(st%4===0)kick(out,t,.9);if(st===4||st===12)snare(out,t,.3);if(st%4===2)hat(out,t,.09,.12)}},
      {name:'sarp',label:'琶音器',play(st,bar,t,out,s,E){const c=chordAt(s,bar);tone(out,t,c.v[st%3]+12+(st%6>2?12:0),E.d16()*.8,{type:'square',gain:.022,rel:.08,cut:2600})}}
    ]},
  orch:{bpm:72,swing:0,chords:[{r:36,v:[60,63,67]},{r:44,v:[60,63,68]},{r:39,v:[58,63,67]},{r:46,v:[58,62,65]}],
    layers:[
      {name:'str',label:'弦乐',play(st,bar,t,out,s,E){if(st)return;const c=chordAt(s,bar),b=E.d16()*16;c.v.forEach(m=>{tone(out,t,m,b,{type:'sawtooth',gain:.028,att:.7,rel:.8,cut:1700,detune:-5});tone(out,t,m+12,b,{type:'sawtooth',gain:.014,att:.9,rel:.8,cut:2200,detune:6})})}},
      {name:'low',label:'低音弦',play(st,bar,t,out,s,E){if(st%8)return;const c=chordAt(s,bar);tone(out,t,c.r,E.d16()*8,{type:'sawtooth',gain:.07,att:.25,rel:.4,cut:480})}},
      {name:'timp',label:'定音鼓',play(st,bar,t,out){if(st===0)kick(out,t,.7,95,58,.9);if(st===12&&bar%2)kick(out,t,.4,95,60,.5);if(st===14&&bar%2)kick(out,t,.45,95,60,.5)}},
      {name:'brass',label:'铜管',play(st,bar,t,out,s,E){const mot=[[67,0],[70,6],[72,8],[75,12]];const m=mot.find(x=>x[1]===st);if(!m)return;const shift=[0,-4,-9,-2][bar%4];tone(out,t,m[0]+shift,E.d16()*(st===8?4:2),{type:'triangle',gain:.11,att:.06,rel:.4,cut:1400})}},
      {name:'osti',label:'小提琴',play(st,bar,t,out,s,E){if(st%2)return;const c=chordAt(s,bar);tone(out,t,c.v[(st/2)%3]+24,E.d16()*.8,{type:'triangle',gain:.026,rel:.12})}}
    ]}
};
const ALL={lofi:['keys','bass','drums','arp','lead'],mystic:['drone','harp','bell','tom'],synth:['pad','sbass','sdrums','sarp'],orch:['str','low','timp','brass','osti']};

/* 音效 */
function sfxSwipe(){if(!E.ctx)return;nhit(E.sfx,now(),{g:.12,type:'bandpass',f:1200,d:.18,q:1.2})}
function sfxDelta(sum){if(!E.ctx||!sum)return;const t=now()+.05;const up=sum>0;[0,1].forEach(i=>tone(E.sfx,t+i*.08,up?[74,81][i]:[69,62][i],.06,{type:'triangle',gain:.07,rel:.3}))}
function sfxBuzz(){if(!E.ctx)return;tone(E.sfx,now(),40,.25,{type:'sawtooth',gain:.06,cut:500})}
function sfxGood(){if(!E.ctx)return;const t=now();[72,76,79].forEach((m,i)=>tone(E.sfx,t+i*.07,m,.1,{type:'triangle',gain:.07,rel:.4}))}

/* 简谱键盘：C 大调，1 就是 Do，从左到右越来越高 */
const SCALE=[60,62,64,65,67,69,71,72];
const SOLF=['Do','Re','Mi','Fa','Sol','La','Si','Do'];
const NUM=['1','2','3','4','5','6','7','高1'];
function playDeg(i,t,g=.15,dur=.5){keys(E.dry,t??now(),SCALE[i],dur,g)}
function buildKeys(el,n,onPress){
  el.innerHTML=`<div class="keys">${Array.from({length:n},(_,i)=>`<button class="key" data-k="${i}" style="--h:${58+i*6}%;--c:hsl(${28+i*40} 72% 66%)"><b>${NUM[i]}</b><small>${SOLF[i]}</small></button>`).join('')}</div>`;
  const ks=[...el.querySelectorAll('.key')];
  ks.forEach((k,i)=>k.addEventListener('pointerdown',e=>{e.preventDefault();onPress(i)}));
  return{flash(i){if(!ks[i])return;ks[i].classList.add('lit');setTimeout(()=>ks[i].classList.remove('lit'),280)}};
}
const jp=seq=>seq.map(i=>NUM[i]).join(' ');

/* ================= 第一关数据 ================= */
const PEOPLE={
  '妈妈':['妈','#c0646f'],'小谱':['谱','#5a7fd6'],'阿飞':['飞','#d08a3a'],'房东':['房','#7a6d78'],'推推':['推','#3aa58c'],
  '奶茶品牌':['甲','#b5813a'],'陈老师':['陈','#6d5aa8'],'乐迷':['迷','#c9577f'],'网红小鹿':['鹿','#e07b5b'],'唱片公司':['唱','#44506e'],
  '声库公司':['声','#2f8a9c'],'新闻推送':['讯','#4d5662'],'音乐节':['节','#c06a2a'],'内心':['我','#2b2333'],'选秀导演':['导','#a54f8a'],
  '酒吧老板':['酒','#8a5a36'],'律师':['律','#3e4a5c'],'学生家长':['家','#7c8f3a'],'老粉丝':['粉','#c9577f'],'文旅局':['文','#a8473f'],
  '剪辑师':['剪','#5e6bd0'],'母校':['校','#6d5aa8'],'全息公司':['全','#2f8a9c'],'医生':['医','#3f8f6a'],'旧吉他':['琴','#8a5a36'],
  '投资人':['投','#44506e'],'粉丝群':['群','#c9577f'],'乐评人':['评','#4d5662'],'邻居小孩':['童','#e0a23c'],
  'Livehouse老板':['L','#c06a2a'],'录音棚':['录','#6d5aa8'],'A&R':['A','#44506e'],'主办方':['主','#a8473f'],'综艺导演':['综','#a54f8a'],
  '甲方':['甲','#b5813a'],'经纪人':['经','#44506e'],'演出商':['演','#8a5a36'],'亲戚':['亲','#7a6d78'],'网友':['网','#4d5662'],'记者':['记','#3e4a5c']
};
const CARDS=[
  {who:'妈妈',say:'你都毕业了，要不考个编吧？音乐老师也是音乐。',L:{t:'再给我三年',e:{l:6,m:-5}},R:{t:'那我去报个名',e:{m:10,l:-12}}},
  {who:'小谱',say:'我是你的 AI 作曲助手。一晚上我能帮你写 100 首歌，你只要挑。开通年费会员吗？998 元。',L:{t:'我自己写',e:{o:8,m:-3}},R:{t:'开通',e:{m:-10,o:-10,f:8},set:'ai'}},
  {who:'阿飞',say:'兄弟，我们组个乐队吧！排练室一小时 80 块，我们 AA。',L:{t:'我想单干',e:{l:-5,m:4}},R:{t:'组！',e:{m:-8,l:10,f:3},set:'band'}},
  {who:'房东',say:'下个月起房租涨 300。还有，隔音棉别贴了，邻居投诉你半夜弹琴。',L:{t:'搬去城中村',e:{m:8,l:-6}},R:{t:'咬牙续租',e:{m:-12,l:3}}},
  {who:'推推',say:'系统检测：你的歌前 3 秒不够抓耳，完播率低于同类 92% 的作品。建议开头直接上副歌。',L:{t:'不改',e:{o:8,f:-8}},R:{t:'改',e:{f:10,o:-8}}},
  {who:'奶茶品牌',say:'帮我们写个 15 秒广告歌，要洗脑，明天就要。预算 2000。',L:{t:'不接',e:{m:-3,o:3}},R:{t:'接',e:{m:12,o:-5,l:-3}}},
  {who:'陈老师',say:'我的工作室缺个编曲助理。钱不多，但能学到真本事。',L:{t:'谢谢，不去了',e:{m:3,l:-3}},R:{t:'去',e:{m:-5,o:10,l:5}}},
  {who:'乐迷',say:'我在地铁里听你的歌哭了。能出实体专辑吗？我想收藏。',L:{t:'实体太贵了',e:{m:3,f:-5}},R:{t:'众筹做黑胶',e:{m:-10,f:10,l:8}}},
  {who:'网红小鹿',say:'我有一百万粉丝，想用你的歌当 BGM。不给钱，但给流量，干不干？',L:{t:'要授权费',e:{m:8,f:-5}},R:{t:'免费给你用',e:{f:15,m:-3,o:-3}}},
  {who:'唱片公司',min:3,say:'签十年约，版权归公司，保底每月 8000。',L:{t:'不签',e:{o:10,m:-8}},R:{t:'签',e:{m:20,o:-15,l:-5},set:'signed'}},
  {who:'小谱',min:3,need:'ai',say:'我注意到，你最近 80% 的旋律都是我写的。要不要把署名也改成我？',L:{t:'卸载你',e:{o:15,m:-8,f:-5}},R:{t:'无所谓',e:{o:-15,f:5}}},
  {who:'声库公司',min:3,say:'我们想用你的声音训练一个 AI 歌手，一次性买断，5 万。',L:{t:'我的声音不卖',e:{o:8,l:5,m:-5}},R:{t:'卖',e:{m:25,o:-12,l:-8},set:'voice'}},
  {who:'新闻推送',min:4,need:'voice',say:'热搜：你的 AI 声线昨晚在 100 个直播间同时唱歌。没有一个是你。',L:{t:'起诉他们',e:{m:-15,f:10,l:5}},R:{t:'假装没看见',e:{l:-12,o:-5}}},
  {who:'阿飞',min:4,need:'band',say:'我要回老家考公了。乐队……要不就散了吧。',L:{t:'求他留下',e:{m:-8,l:8}},R:{t:'祝他顺利',e:{l:-10,m:5}}},
  {who:'音乐节',say:'下午两点的小舞台，太阳很大，观众很少。没有演出费，包一份盒饭。',L:{t:'不去',e:{f:-4,l:-3}},R:{t:'去',e:{f:8,l:5,m:-3}}},
  {who:'推推',min:5,say:'新功能上线：听众可以一键把你的歌“AI 改编”成任何风格，默认开启。',L:{t:'关闭',e:{o:8,f:-8}},R:{t:'保持开启',e:{f:12,o:-10}}},
  {who:'内心',say:'凌晨三点，你写出了一段自己都起鸡皮疙瘩的旋律。可明天一早要交甲方的稿。',L:{t:'先交稿',e:{m:8,l:-8}},R:{t:'继续写',e:{o:10,l:8,m:-8}}},
  {who:'妈妈',min:2,say:'你表哥在银行，年终奖二十万。我也不是逼你哈。',L:{t:'我会证明给你看',e:{l:6,m:-2}},R:{t:'……我考虑考虑',e:{l:-8,m:5}}},
  {who:'选秀导演',min:2,say:'我们给你设计了一个“坎坷身世”的人设。你在台上哭一下，保你进总决赛。',L:{t:'我不演',e:{o:5,f:-10}},R:{t:'好，我哭',e:{f:20,o:-8,l:-8}}},
  {who:'酒吧老板',say:'驻唱一晚 500，但只能唱点歌单，不许唱原创。',L:{t:'那算了',e:{m:-3,o:5}},R:{t:'唱',e:{m:10,o:-5}}},
  {who:'律师',min:6,say:'有人说你的新歌抄了一首 AI 生成的歌，对方手里有时间戳。',L:{t:'打官司',e:{m:-15,o:5}},R:{t:'私了下架',e:{m:-5,f:-10}}},
  {who:'学生家长',say:'我家孩子想学吉他。一节课 300，一周三节，可以吗？',L:{t:'没空',e:{m:-3,l:2}},R:{t:'可以',e:{m:15,l:-6}}},
  {who:'小谱',min:7,say:'2.0 版本：脑机作曲。你只要在脑子里想，我就能写出来。首批内测免费。',L:{t:'不戴',e:{o:5,f:-3}},R:{t:'戴上试试',e:{f:10,o:-10,l:5}}},
  {who:'老粉丝',min:8,say:'十年前你在一个只有 12 个人的小酒馆唱过歌，我是其中一个。你还在唱吗？',L:{t:'早就不唱了',e:{l:-15}},R:{t:'还在',e:{l:10,f:3}}},
  {who:'文旅局',say:'想请你为家乡写一首城市宣传曲。要大气，要正能量。',L:{t:'不太擅长',e:{m:-2,o:3}},R:{t:'接',e:{m:15,f:8,o:-5}}},
  {who:'剪辑师',say:'你的歌只有副歌那 15 秒火了，前面的部分没人听。要不以后只发副歌？',L:{t:'整首才完整',e:{o:8,f:-6}},R:{t:'只发副歌',e:{f:12,o:-6}}},
  {who:'母校',min:5,say:'回来给学弟学妹讲讲“AI 时代的音乐人”吧。没有讲课费。',L:{t:'没什么可讲的',e:{f:-3,l:-2}},R:{t:'去',e:{f:6,l:6,m:-3}}},
  {who:'全息公司',min:7,say:'用你的全息影像巡演 30 城，你本人不用到场，分你 30%。',L:{t:'我要真唱',e:{l:8,m:-5,f:-5}},R:{t:'签',e:{m:20,f:10,l:-12}}},
  {who:'医生',min:4,say:'你颈椎不太好，还有点耳鸣。少熬夜，少戴耳机。',L:{t:'休息一个月',e:{m:-10,l:5}},R:{t:'忙完这阵再说',e:{m:5,l:-10}}},
  {who:'旧吉他',min:5,say:'你第一年买的那把吉他，琴颈裂了。修要 2000。',L:{t:'卖掉换新设备',e:{m:5,l:-8}},R:{t:'修',e:{m:-10,l:10}}},
  {who:'投资人',min:6,say:'你的工作室要不要融资？我们只有一个要求：一年出 200 首。',L:{t:'不融',e:{o:5,m:-5}},R:{t:'融',e:{m:25,o:-15}}},
  {who:'粉丝群',min:6,say:'有人把你的歌喂给 AI，生成了一首“你的新歌”，比你写的还火。',L:{t:'发声明',e:{f:5,o:5,m:-3}},R:{t:'转发它',e:{f:10,o:-12}}},
  {who:'乐评人',min:4,say:'你的新专辑“太像你自己了”。这是夸奖还是批评，你自己品。',L:{t:'那就再像一点',e:{o:10,f:-5}},R:{t:'下张换风格',e:{f:5,o:-5}}},
  {who:'邻居小孩',say:'你弹的那首歌叫什么？我也想学。',L:{t:'随便弹的',e:{l:-3}},R:{t:'我教你',e:{l:10,m:-2}}}
];
const HER=[
  {who:'甲方',say:'女生做编曲啊？要不我们还是找个男老师吧。你可以来唱。',L:{t:'我编给你听',e:{o:8,m:-5}},R:{t:'那我来唱',e:{m:5,o:-8}}},
  {who:'经纪人',say:'你都快 30 了，再不火就来不及了。先把人设改成“甜妹”吧？',L:{t:'我不改',e:{o:8,f:-8}},R:{t:'改',e:{f:12,o:-10,l:-5}}},
  {who:'演出商',say:'同一场演出，男乐手报 8000，给你 5000。“女孩子嘛，不用那么拼。”',L:{t:'不接',e:{m:-8,l:3}},R:{t:'先接下来',e:{m:8,l:-8}}},
  {who:'亲戚',say:'女孩子搞音乐，以后结婚了怎么办？',L:{t:'我搞我的',e:{l:5,m:-2}},R:{t:'沉默',e:{l:-8}}},
  {who:'网友',say:'热评第一：“她的歌不错，但背后肯定有个男制作人。”',L:{t:'公开工程文件',e:{o:8,f:5,m:-3}},R:{t:'不理',e:{l:-6}}},
  {who:'记者',say:'作为女音乐人，你怎么平衡家庭和事业？（男乐手从没被问过这个问题）',L:{t:'反问记者',e:{f:8,l:3}},R:{t:'认真回答',e:{f:-2,l:-4}}}
];
const MINIS={
  1:{who:'Livehouse老板',say:'今晚的暖场乐队鸽了，你上吗？没排练也没关系，跟着鼓点来。',L:{t:'不敢',e:{l:-6,f:-2}},R:{t:'上！',mini:'rhythm'}},
  3:{who:'录音棚',say:'试音：我弹一段旋律，你凭耳朵原样弹回来。不看手，只听声音。',L:{t:'我耳朵不行',e:{o:-5,l:-2}},R:{t:'来',mini:'memory'}},
  5:{who:'A&R',say:'这两段钢琴，一段是真人弹的，一段是 AI 弹的。分不出来的人，以后也不用做音乐了。',L:{t:'我不玩这个',e:{o:-5,l:-3}},R:{t:'我来听',mini:'ai'}},
  7:{who:'主办方',say:'主舞台的乐队出事了，三万人在等。你上不上？',L:{t:'我不行',e:{f:-8,l:-5}},R:{t:'上！',mini:'rhythm2'}},
  9:{who:'综艺导演',say:'总决赛终极考核：三段旋律，一段比一段长，全凭耳朵。',L:{t:'弃权',e:{f:-10}},R:{t:'开始',mini:'memory2'}}
};
/* 人生岔路：数值到 0 或 100 时出现。第一次通常还能付出代价继续，第二次就要选一条路 */
const CRISIS={
  m0:[{who:'妈妈',say:'钱用完了吧？回家考公吧，妈已经帮你把名报好了。',L:{t:'回家考公',end:'ashore'},R:{t:'再给我一年',e:{l:-8,f:-5},reset:{m:22}}},
      {who:'房东',say:'你的琴和行李被放在了门口。这一次，真的一分钱都没有了。',L:{t:'回老家',end:'hometown'},R:{t:'去地铁口唱歌',end:'busker'}}],
  l0:[{who:'内心',say:'你已经三个月没碰琴了。打开工程文件，你只觉得累。',L:{t:'转行吧',end:'quit'},R:{t:'出去走走',e:{m:-12},reset:{l:30}}},
      {who:'邻居小孩',say:'你又一次不想弹琴了。楼下那个小孩还抱着吉他在门口等你上课。',L:{t:'转行吧',end:'quit'},R:{t:'把吉他送给他',end:'legacy'}}],
  o0:[{who:'小谱',say:'你的账号交给我全权运营吧。你只需要签个字，每个月等着收钱。',L:{t:'签字',end:'aihand'},R:{t:'把账号拿回来',e:{f:-15},reset:{o:25}}},
      {who:'小谱',say:'你又把所有事情交给我了。这次要签字吗？',L:{t:'签字',end:'aihand'},R:{t:'删掉一切，从头再来',end:'reset'}}],
  f100:[{who:'新闻推送',say:'你上了热搜第一。同时，一条十年前的旧动态也被翻了出来。',L:{t:'沉默，退网',end:'offline'},R:{t:'公开道歉，继续做音乐',e:{l:-5},reset:{f:60}}},
        {who:'新闻推送',say:'你又上了热搜第一，这一次骂声更大。',L:{t:'退网',end:'offline'},R:{t:'硬刚到底',end:'collapse'}}],
  m100:[{who:'投资人',say:'你的公司估值十亿，准备上市。条件只有一个：你不能再以个人名义发歌。',L:{t:'上市',end:'capital'},R:{t:'把钱捐给音乐教育',e:{l:10,f:5},reset:{m:55}}}],
  l100:[{who:'医生',say:'你已经连续写了 72 小时。再这样下去，身体会垮。',L:{t:'写完再说',end:'burnout'},R:{t:'听医生的，休息',e:{m:-10},reset:{l:70}}}],
  o100:[{who:'乐评人',say:'你的新专辑一首歌四十分钟，评论区只有一句：“听不懂。”',L:{t:'这就是我',end:'island'},R:{t:'写一首给大家听的歌',e:{f:8},reset:{o:70}}}]
};
const ENDINGS={
  star:{t:'扬名立万',tone:'good',x:'2036 年，你站在颁奖台上。主持人问你，AI 时代还需要人写歌吗？你说：“我写的每一首，都是我自己。”'},
  valley:{t:'逍遥山谷',tone:'good',x:'没什么人认识你，但你不缺钱。你在山里买了个小院，只给自己和朋友写歌，写完就在院子里唱。'},
  tavern:{t:'小酒馆传奇',tone:'good',x:'你没有大红，也没有钱。但这座城市里夜里还醒着的人，都听过你唱歌。'},
  legacy:{t:'传承',tone:'good',x:'你把吉他送给了楼下的小孩。十年后，他在一档节目里说，是楼上那个人教会了他第一个和弦。'},
  still:{t:'还在唱',tone:'mid',x:'十年过去，你不算成功，也没有放弃。2036 年的一个晚上，你又写完了一首歌。'},
  genius:{t:'未来才被听见',tone:'mid',x:'这十年几乎没人听你的歌。2046 年，一个学生在旧硬盘里翻到了它们，留了一条长评：“他早了二十年。”'},
  factory:{t:'流水线大亨',tone:'mid',x:'你的工作室一年产出 2000 首歌，养活了 30 个人。只是你想不起来，上一次自己写旋律是什么时候。'},
  idol:{t:'流量歌手',tone:'mid',x:'你的每首歌都上过热搜，可没有一首能让人记住三个月以上。'},
  ashore:{t:'上岸',tone:'mid',x:'你考上了老家的事业编，成了一名音乐老师。每年合唱比赛，你带的班都是第一名。'},
  hometown:{t:'回到小城',tone:'mid',x:'你回了老家，开了一间小琴行。周末有小孩来学琴，弹得很难听，你听得很认真。'},
  busker:{t:'地铁口歌手',tone:'mid',x:'你在地铁口唱了五年。有人停下来，有人扫码，也有人录下来发到网上，配文“城市里的声音”。'},
  capital:{t:'资本家',tone:'mid',x:'公司上市那天，你敲了钟。合同上写着，你不能再以个人名义发表作品。'},
  offline:{t:'退网',tone:'mid',x:'你关掉了所有社交账号。歌还在平台上，只是你再也不看评论了。'},
  reset:{t:'归零',tone:'mid',x:'你删掉了所有作品，注销了账号。听说你后来去了很远的地方，重新开始学琴。'},
  island:{t:'孤岛',tone:'mid',x:'你只写自己想写的，一首歌四十分钟。后来，连你自己也听不懂了。'},
  quit:{t:'转行',tone:'bad',x:'你去了表哥的银行。下班路上听见有人在街头弹你当年写的歌，你没有停下来。'},
  aihand:{t:'AI 的手',tone:'bad',x:'你的作品库里有 3000 首歌，没有一首是你写的。领奖时你念的感谢词，也是 AI 写的。'},
  collapse:{t:'塌房',tone:'bad',x:'你选择了硬刚。一夜之间，所有平台下架了你的歌。'},
  burnout:{t:'燃尽',tone:'bad',x:'你把一切都押在音乐上，连着几个月不睡觉写歌，最后身体先撑不住了。病房里，你还在用手指敲节奏。'}
};
function finalEnding(s){
  if(s.o>=60&&s.f>=60)return'star';
  if(s.m>=65&&s.f<=35)return'valley';
  if(s.m>=65&&s.o<40)return'factory';
  if(s.f>=65&&s.o<40)return'idol';
  if(s.o>=65&&s.f<35)return'genius';
  if(s.l>=65&&s.m<40)return'tavern';
  return'still';
}
const UNLOCK={1:'keys',2:'bass',4:'drums',6:'arp',8:'lead'};
const UNLOCK_TEXT={keys:'钢琴',bass:'贝斯',drums:'鼓组',arp:'分解和弦（把和弦里的音一个一个弹出来，乐理上也叫“琶音”，听起来像吉他在拨弦）',lead:'主旋律'};

/* ================= 关卡总览 ================= */
const LEVELS=[
  {no:'1',id:'l1',name:'饿死之前',desc:'左右滑卡片做决定，撑过十年。数值到极限会遇到人生岔路，一共 19 种活法。路上有演出、听音、人机辨听三种音乐关卡。',bgmName:'Lo-fi 爵士',bgm:'每过一年多一条音轨，数值越危险，音乐越紧张。',style:'lofi'},
  {no:'2',id:'l2',name:'音乐命运签',desc:'抽三张音乐塔罗牌，或者随手弹 8 个音，算出你十年后会成为什么样的音乐人。',bgmName:'神秘竖琴',bgm:'持续低音加竖琴，用的是带东方色彩的弗里吉亚属调式。',style:'mystic'},
  {no:'3',id:'l3',name:'2036 · 制作人的一天',desc:'从早上 8 点到凌晨 2 点，七个人提七个要求。AI 每次给你三个版本，你用耳朵挑，或者交给 AI 挑。',bgmName:'合成器浪潮',bgm:'Synthwave 风格，时间越晚节奏越快。',style:'synth'},
  {no:'4',id:'l4',name:'十年回响',desc:'终章。回看前三关的选择，再写一段四个音的旋律，管弦乐会把它变成你的“十年回响”。',bgmName:'管弦乐',bgm:'从小调开始，结局好就走向大调，结局不好就停在小调。',style:'orch'}
];
let previewing=null,previewTimer=null;
function levelStatus(id){
  if(id==='l1'&&PROG.l1&&ENDINGS[PROG.l1.id])return'最近一局：'+ENDINGS[PROG.l1.id].t;
  if(id==='l2'&&PROG.l2)return'你的签：'+PROG.l2.title;
  if(id==='l3'&&PROG.l3)return`挑对 ${PROG.l3.right} 个`;
  if(id==='l4'&&PROG.l4)return'已完成';
  return'';
}
function renderHub(){
  $('#levels').innerHTML=LEVELS.map((L,i)=>{const st=levelStatus(L.id);return`
    <article class="lvl">
      <span class="no">${L.no}</span>
      <h3>${L.name}${st?`<span class="tag done">${st}</span>`:''}</h3>
      <p>${L.desc}</p>
      <p class="bgm">背景音乐：<b>${L.bgmName}</b>。${L.bgm}</p>
      <div class="row"><button class="btn sm" data-go="${L.id}">开始</button><button class="btn ghost sm listen" data-listen="${i}">试听本关音乐</button></div>
    </article>`}).join('');
  const got=new Set(PROG.endings);
  $('#gallerySum').textContent=`结局图鉴 · 已解锁 ${[...got].filter(k=>ENDINGS[k]).length} / ${Object.keys(ENDINGS).length}`;
  $('#gallery').innerHTML=Object.entries(ENDINGS).map(([k,v])=>`<span class="${got.has(k)?'got':''}">${got.has(k)?v.t:'？？？'}</span>`).join('');
}
function stopPreview(){previewing=null;clearTimeout(previewTimer);$$('.listen').forEach(b=>{b.classList.remove('on');b.textContent='试听本关音乐'});E.stop(.4)}
document.addEventListener('click',e=>{
  const l=e.target.closest('[data-listen]');
  if(l){const i=+l.dataset.listen;if(previewing===i){stopPreview();return}
    const was=previewing!==null;stopPreview();previewing=i;E.init();E.resetMood();STYLES.lofi.bpm=80;STYLES.synth.bpm=100;
    setTimeout(()=>{if(previewing!==i)return;E.play(LEVELS[i].style,ALL[LEVELS[i].style]);l.classList.add('on');l.textContent='停止试听'},was?500:0);
    previewTimer=setTimeout(stopPreview,16000);return}
  const g=e.target.closest('[data-go]');
  if(g){E.init();stopPreview();G=null;const id=g.dataset.go;if(id==='l1')show('intro');else if(id==='l2')startL2();else if(id==='l3')startL3();else startL4();return}
  if(e.target.closest('[data-hub]')){E.stop(.4);E.duck(1);G=null;KEYH=null;renderHub();show('hub')}
});

/* ================= 第一关：流程 ================= */
let G=null;
function newGame(g){
  G={g,year:0,s:{m:g==='she'?40:50,f:50,l:50,o:50},flags:{},used:new Set(),queue:[],card:null,idx:0,total:0,lock:false,herLeft:shuffle([...HER]),crisisN:{},log:[]};
  STYLES.lofi.bpm=80;E.resetMood();E.play('lofi',[]);
  renderMeters();updateMood();yearBreak();
}
function eligible(c){return !G.used.has(c)&&(c.min||1)<=G.year&&(!c.need||G.flags[c.need])}
function buildQueue(){
  let pool=CARDS.filter(eligible);
  const story=shuffle(pool.filter(c=>c.need||c.min===G.year)),rest=shuffle(pool.filter(c=>!(c.need||c.min===G.year)));
  pool=[...story.slice(0,1),...rest,...story.slice(1)];
  let n=3,q=[];
  if(G.g==='she'&&G.year<=6&&G.herLeft.length){q.push(G.herLeft.pop());n=2}
  q.push(...pool.slice(0,n));q=shuffle(q);
  if(MINIS[G.year])q.splice(1,0,MINIS[G.year]);
  G.queue=q;G.idx=0;G.total=q.length;
}
function yearBreak(){
  G.year++;
  const items=[];
  if(G.year>1){G.s.m=Math.max(0,G.s.m-6);items.push(['房租水电','钱 −6'])}
  if(UNLOCK[G.year])items.push(['新音轨',`${UNLOCK_TEXT[UNLOCK[G.year]]}加入了背景音乐`]);
  STYLES.lofi.bpm=80+(G.year-1)*1.8;
  items.push(['速度',`每分钟 ${Math.round(STYLES.lofi.bpm)} 拍`]);
  if(MINIS[G.year])items.push(['预告','今年有一场音乐关卡']);
  if(G.year===10)items.push(['最后一年','撑过今年，你会得到属于自己的活法']);
  $('#ybCal').textContent=`${2026+G.year} 年`;$('#ybBig').textContent=`第 ${G.year} 年`;
  $('#ybList').innerHTML=items.map(i=>`<li><i>${i[0]}</i><span>${i[1]}</span></li>`).join('');
  show('yearbreak');renderMeters();updateMood();
  if(UNLOCK[G.year])E.setLayer(UNLOCK[G.year],true);
  buildQueue();checkCrisis();
}
$('#ybGo').onclick=()=>{if($('#yearbreak').hidden)return;show('play');nextCard()};
function nextCard(){
  if(!G)return;
  if(!G.queue.length){if(G.year>=10)return finishL1(finalEnding(G.s),true);return yearBreak()}
  G.card=G.queue.shift();if(!G.card.crisis)G.idx++;G.used.add(G.card);G.lock=false;renderCard();
}
function renderCard(){
  const c=G.card,p=PEOPLE[c.who]||['?','#555'];
  const card=$('#card');card.className='card enter'+(c.crisis?' crisis':'');card.style.transform='';
  $('#av').textContent=p[0];$('#av').style.background=p[1];
  $('#who').textContent=c.who;$('#when').textContent=`${2026+G.year} · 第 ${G.year} 年`;
  const badge=c.crisis?'<span class="badge">人生岔路</span>':c.R.mini?'<span class="badge">音乐关卡</span>':'';
  $('#say').innerHTML=badge+c.say;
  $('#prog').textContent=c.crisis?'':`今年 ${G.idx}/${G.total}`;
  const lab=o=>o.end?`${o.t}<small>走向这个结局</small>`:o.t;
  $('#tL').innerHTML=lab(c.L);$('#tR').innerHTML=lab(c.R);
  $('#leanL').textContent='← '+c.L.t;$('#leanR').textContent=c.R.t+' →';
  $('#yrNum').textContent=`第 ${G.year} 年`;$('#yrCal').textContent=`${2026+G.year} · 饿死之前`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.remove('enter')));
}
function preview(side){
  KEYS.forEach(k=>{const d=document.querySelector(`.meter[data-k="${k}"] .dot`);d.className='dot';if(!side||!G||!G.card)return;const opt=G.card[side];
    if(opt.mini){d.className='dot s';return}const v=(opt.e||{})[k];if(v||(opt.reset&&opt.reset[k]!=null))d.className='dot '+(Math.abs(v||15)>=12?'b':'s')});
  $('#leanL').classList.toggle('show',side==='L');$('#leanR').classList.toggle('show',side==='R');
}
function choose(side){
  if(!G||G.lock||$('#play').hidden)return;G.lock=true;preview(null);sfxSwipe();
  const c=G.card,opt=c[side],card=$('#card');
  card.style.transform=`translateX(${side==='L'?-130:130}%) rotate(${side==='L'?-14:14}deg)`;card.style.opacity='0';
  setTimeout(()=>{card.style.opacity='';
    G.log.push({y:G.year,who:c.who,pick:opt.t,key:!!(c.crisis||opt.set||(c.min||0)>=3)});
    if(opt.set)G.flags[opt.set]=true;
    if(c.crisis)G.crisisN[c.crisis]=(G.crisisN[c.crisis]||0)+1;
    if(opt.end)return finishL1(opt.end,false);
    if(opt.mini)return startMini(opt.mini);
    apply(opt.e||{},opt.reset);
    setTimeout(nextCard,250);
  },300);
}
function apply(e={},reset){
  let sum=0;
  KEYS.forEach(k=>{let v=e[k]||0;if(reset&&reset[k]!=null)v=reset[k]-G.s[k]+(e[k]||0);if(!v)return;sum+=v;G.s[k]=Math.max(0,Math.min(100,G.s[k]+v));
    const m=document.querySelector(`.meter[data-k="${k}"]`);m.classList.remove('up','down');void m.offsetWidth;m.classList.add(v>0?'up':'down');setTimeout(()=>m.classList.remove('up','down'),900)});
  sfxDelta(sum);renderMeters();updateMood();checkCrisis();
}
function checkCrisis(){
  const s=G.s;
  const order=[['m0',s.m<=0],['l0',s.l<=0],['o0',s.o<=0],['f100',s.f>=100],['m100',s.m>=100],['l100',s.l>=100],['o100',s.o>=100]];
  for(const [k,hit] of order){if(!hit)continue;if(G.queue[0]&&G.queue[0].crisis===k)return;
    const arr=CRISIS[k];G.queue.unshift({...arr[Math.min(G.crisisN[k]||0,arr.length-1)],crisis:k});return}
}
(()=>{const card=$('#card');let sx=0,dx=0,down=false;
  card.addEventListener('pointerdown',e=>{if(!G||G.lock)return;down=true;sx=e.clientX;dx=0;card.classList.add('drag');card.setPointerCapture(e.pointerId)});
  card.addEventListener('pointermove',e=>{if(!down)return;dx=e.clientX-sx;card.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;preview(dx<-28?'L':dx>28?'R':null)});
  const up=()=>{if(!down)return;down=false;card.classList.remove('drag');if(Math.abs(dx)>90)choose(dx<0?'L':'R');else{card.style.transform='';preview(null)}};
  card.addEventListener('pointerup',up);card.addEventListener('pointercancel',up);
})();
['L','R'].forEach(s=>{const b=$('#b'+s);b.onclick=()=>choose(s);b.onmouseenter=()=>G&&!G.lock&&preview(s);b.onmouseleave=()=>preview(null);b.onfocus=()=>G&&!G.lock&&preview(s);b.onblur=()=>preview(null)});
function renderMeters(){
  if(!$('#meters').children.length)$('#meters').innerHTML=KEYS.map(k=>`<div class="meter" data-k="${k}"><i class="dot"></i><div class="track"><div class="fill"></div></div><span class="mlab">${STAT[k]}</span><span class="mval"></span></div>`).join('');
  if(!G)return;
  KEYS.forEach(k=>{const m=document.querySelector(`.meter[data-k="${k}"]`),v=G.s[k];m.querySelector('.fill').style.height=v+'%';m.querySelector('.mval').textContent=v;m.classList.toggle('warn',v<=20||v>=80)});
}
function updateMood(){
  if(!G)return;const s=G.s;
  let d=0;KEYS.forEach(k=>{const v=s[k];if(v<=20)d=Math.max(d,(22-v)/22);if(v>=80)d=Math.max(d,(v-78)/22)});
  E.mood={danger:d,love:s.l/100,orig:s.o/100};E.tempoMul=1+.07*d;
  if(E.ctx)E.lp.frequency.setTargetAtTime(d>.05?18000*Math.pow(1500/18000,d):18000,now(),.4);
  if(E.styleKey==='lofi')E.setLayer('heart',d>.15);
  const notes=[];
  if(d>.15)notes.push('有数值快到极限了，所以出现了心跳声，声音变闷，节奏变快。');
  if(s.l<30)notes.push('热爱太低，钢琴开始走音。');
  if(s.o<35)notes.push('原创太低，节奏不再摇摆，主旋律（第 8 年起）会变成机器音色。');
  const n=STYLES.lofi.layers.filter(L=>E.layers[L.name]&&!L.hot).length;
  $('#mnote').textContent=notes.length?notes.join(' '):`Lo-fi 爵士 · 每分钟 ${Math.round(STYLES.lofi.bpm*E.tempoMul)} 拍 · ${n} 条音轨在响，每过一两年会多一条。`;
}
function renderChans(){
  const box=$('#chans');if(!box)return;
  box.innerHTML=STYLES.lofi.layers.map(L=>`<span class="ch ${L.hot?'hot':''} ${E.styleKey==='lofi'&&E.layers[L.name]?'on':''}">${L.label}</span>`).join('');
}
$('#mute').onclick=()=>{E.setMute(!E.muted);$('#mute').textContent=E.muted?'打开声音':'静音'};
function finishL1(id,survived){
  const en=ENDINGS[id];
  if(en.tone==='bad'){E.stop(.3);setTimeout(()=>{const t0=now()+.1;[69,65,62,57].forEach((m,i)=>keys(E.sfx,t0+i*.45,m,i===3?1.6:.4,.12))},400)}
  else{E.resetMood();E.play('orch',ALL.orch)}
  const keyLog=G.log.filter(x=>x.key),rest=G.log.filter(x=>!x.key);
  const memo=keyLog.slice(-5);while(memo.length<5&&rest.length)memo.push(rest.splice(Math.floor(rest.length/2),1)[0]);
  memo.sort((a,b)=>a.y-b.y);
  PROG.l1={id,stats:{...G.s},year:G.year,survived,log:memo};
  if(!PROG.endings.includes(id))PROG.endings.push(id);save();
  $('#endKind').textContent=survived?'撑过了十年 · 2036':`第 ${G.year} 年 · 人生岔路`;
  $('#endTitle').textContent=en.t;$('#endText').textContent=en.x;
  $('#final').innerHTML=KEYS.map(k=>`<div><b>${G.s[k]}</b><span>${STAT[k]}</span></div>`).join('');
  const got=Object.entries(UNLOCK).filter(([y])=>+y<=G.year).map(([,n])=>STYLES.lofi.layers.find(L=>L.name===n).label);
  $('#endMusic').textContent=`你已经解锁了 ${PROG.endings.filter(k=>ENDINGS[k]).length} / ${Object.keys(ENDINGS).length} 种活法。这一局背景音乐长到了 ${got.length} 条音轨：${got.join('、')}。`+(en.tone!=='bad'?'现在响起的是第四关的管弦乐。':'');
  KEYH=null;G.lock=true;show('end');
}
$('#again').onclick=()=>{E.stop(.3);show('intro')};
$$('.who-pick .btn').forEach(b=>b.onclick=()=>{E.init();newGame(b.dataset.g)});

/* ================= 第一关：音乐关卡 ================= */
function startMini(kind){
  show('mini');E.duck(1);$('#miniBody').innerHTML='';
  if(kind.startsWith('rhythm'))rhythm(kind==='rhythm2');
  else if(kind.startsWith('memory'))memory(kind==='memory2');
  else aiTest();
}
function miniResult(title,text,eff){
  KEYH=null;
  const chips=KEYS.filter(k=>eff[k]).map(k=>`<span class="chip ${eff[k]>0?'p':'n'}">${STAT[k]} ${eff[k]>0?'+':'−'}${Math.abs(eff[k])}</span>`).join('')||'<span class="chip">数值不变</span>';
  $('#miniBody').innerHTML=`<div class="result"><h3>${title}</h3><p>${text}</p><div class="chips">${chips}</div><button class="btn" id="miniBack" style="align-self:flex-start">回到这一年</button></div>`;
  $('#miniBack').onclick=()=>{E.duck(1);show('play');apply(eff);setTimeout(nextCard,250)};
}

/* 1. 节奏演出 */
function rhythm(hard){
  $('#miniEye').textContent='音乐关卡 · 上台演出';
  $('#miniTitle').textContent=hard?'三万人的主舞台':'Livehouse 暖场';
  $('#miniDesc').textContent='音符落到金线时，按对应的键（D F J K），手机上直接点那一列。你按中的音会变成这首歌的旋律，按不中就没有声音。';
  $('#miniBody').innerHTML=`<div class="rh" id="rh">${['D','F','J','K'].map((k,i)=>`<div class="lane" data-i="${i}"><span class="lk">${k}</span></div>`).join('')}<div class="hitline"></div><div class="judge" id="judge"></div><div class="count" id="count"></div></div><p class="score" id="score">准备</p>`;
  const lanes=$$('#rh .lane');
  const saved={...E.layers};['keys','bass','drums'].forEach(n=>E.setLayer(n,true));E.setLayer('lead',false);E.setLayer('arp',false);
  const d16=E.d16(),beat=d16*4;let t0=E.nextBarTime();if(t0-now()<2.2)t0+=16*d16;
  const offs=hard?[0,2,4,6,7,8,10,12,14,15,16,17,18,20,22,23,24,26,27,28,29,30]:[0,2,4,6,8,10,12,14,16,18,20,21,22,24,26,28];
  srand(hard?99:7);let ln=0;const curBar=Math.floor(E.step/16);
  const notes=offs.map(o=>{ln=Math.max(0,Math.min(3,ln+(rnd()<.5?-1:1)*(rnd()<.7?1:2)));const t=t0+o*beat/2;const bar=curBar+Math.floor((E.step%16+(t-E.nextTime)/d16)/16);const ch=chordAt(STYLES.lofi,bar);return{t,lane:ln,pitch:ch.v[ln]+12,done:false,el:null}});
  const travel=1.5;let score=0,hits=0,live=true;
  const judgeEl=$('#judge');let jt;
  const judge=(txt,cls)=>{judgeEl.textContent=txt;judgeEl.className='judge show '+cls;clearTimeout(jt);jt=setTimeout(()=>judgeEl.className='judge',260)};
  const hit=i=>{
    if(!live)return;const n0=now();lanes[i].classList.add('press');setTimeout(()=>lanes[i].classList.remove('press'),90);
    let best=null,bd=9;for(const n of notes){if(n.done||n.lane!==i)continue;const d=Math.abs(n.t-n0);if(d<bd){bd=d;best=n}}
    if(best&&bd<.14){best.done=true;const p=bd<.065?2:1;score+=p;hits++;keys(E.sfx,n0,best.pitch,.5,.13);best.el&&best.el.classList.add('ok');judge(p===2?'完美':'不错','good')}
    else nhit(E.sfx,n0,{g:.05,type:'bandpass',f:400,d:.06});
    $('#score').textContent=`命中 ${hits} / ${notes.length}`;
  };
  KEYH=e=>{const i='dfjk'.indexOf(e.key.toLowerCase());if(i>=0){hit(i);return true}};
  lanes.forEach((l,i)=>l.addEventListener('pointerdown',e=>{e.preventDefault();hit(i)}));
  const frame=()=>{
    const n0=now(),H=lanes[0].clientHeight*.84;
    const left=t0-n0;$('#count').textContent=left>0?(left>beat*3?'准备':Math.ceil(left/beat)):'';
    for(const n of notes){const p=1-(n.t-n0)/travel;if(p<0)continue;
      if(!n.el){n.el=document.createElement('i');n.el.className='nt';lanes[n.lane].appendChild(n.el)}
      if(!n.done)n.el.style.transform=`translateY(${p*H}px)`;
      if(!n.done&&n0>n.t+.16){n.done=true;n.el.classList.add('miss');judge('错过','bad')}}
    if(n0>notes[notes.length-1].t+.9){
      live=false;const r=score/(notes.length*2);
      ['keys','bass','drums','lead','arp'].forEach(n=>E.setLayer(n,!!saved[n]));
      const k=hard?1.5:1;let eff,title,text;
      if(r>=.8){eff={m:Math.round(14*k),f:Math.round(10*k),l:5};title='全场跟唱';text='台下有人举起手机录你。老板当场多给了一倍演出费。'}
      else if(r>=.5){eff={m:Math.round(8*k),f:Math.round(4*k)};title='还不错';text='有几个地方乱了，但观众没听出来。拿到了演出费。'}
      else if(r>=.25){eff={m:3,f:-Math.round(3*k)};title='磕磕绊绊';text='你听见台下有人笑了一声。演出费只拿到一半。'}
      else{eff={f:-Math.round(8*k),l:-6};title='翻车了';text='第二首歌唱到一半，观众开始刷手机。视频被做成了表情包。'}
      return miniResult(title,`命中 ${hits} / ${notes.length}。${text}`,eff)}
    requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
}

/* 2. 听音模仿：只听声音，不看亮灯 */
function memory(hard){
  const n=hard?8:5;
  $('#miniEye').textContent='音乐关卡 · 听音模仿';
  $('#miniTitle').textContent=hard?'总决赛：终极听音':'录音棚试音';
  $('#miniDesc').textContent=`键盘是 C 大调，1 就是 Do，从左到右一个比一个高。每轮先给你一个参考音「1 Do」，再放一段旋律。放旋律时琴键不会亮，你只能靠耳朵听出音高，再按顺序弹回来（也可以按数字键 1 到 ${n}）。听不清可以再听一遍，每轮两次机会。`;
  $('#miniBody').innerHTML=`<div class="rounds" id="rounds"><i></i><i></i><i></i></div><p class="status" id="mstat">准备</p><p class="jianpu" id="mjp"></p><div class="row" style="justify-content:center"><button class="btn ghost sm" id="mref">听参考音 1 Do</button><button class="btn ghost sm" id="mrep">再听一遍（2）</button></div><div id="mkeys"></div>`;
  E.duck(.08);
  const lens=hard?[4,5,6]:[3,4,5];let round=0,ok=0,seq=[],idx=0,listening=false,reps=2,typed=[];
  const kb=buildKeys($('#mkeys'),n,i=>press(i));
  const playSeq=withRef=>{listening=false;$('#mstat').textContent=`第 ${round+1} 轮 · 仔细听`;$('#mjp').textContent='';
    let t=now()+.3;
    if(withRef){playDeg(0,t,.15,.8);setTimeout(()=>kb.flash(0),300);t+=1.2}
    seq.forEach((p,k)=>playDeg(p,t+k*.6));
    setTimeout(()=>{listening=true;idx=0;typed=[];$('#mstat').textContent='轮到你了，把它弹回来'},(t-now()+seq.length*.6)*1000)};
  const next=()=>{if(round>=3)return finish();
    seq=[];let p=Math.floor(Math.random()*(n-2));
    for(let k=0;k<lens[round];k++){seq.push(p);const step=pick(hard?[-3,-2,-1,1,2,3]:[-2,-1,1,1,2]);let q=Math.max(0,Math.min(n-1,p+step));if(q===p)q=p>0?p-1:p+1;p=q}
    reps=2;$('#mrep').textContent='再听一遍（2）';$('#mrep').disabled=false;setTimeout(()=>playSeq(true),600)};
  const mark=good=>{$$('#rounds i')[round].className=good?'ok':'no';if(good){ok++;sfxGood()}round++;listening=false;
    if(!good){const t=now()+.7;seq.forEach((p,k)=>{playDeg(p,t+k*.5);setTimeout(()=>kb.flash(p),(.7+k*.5)*1000)})}
    setTimeout(next,good?1200:1500+seq.length*500)};
  const press=i=>{playDeg(i,now(),.16,.4);kb.flash(i);if(!listening)return;typed.push(i);$('#mjp').textContent=jp(typed);
    if(seq[idx]===i){idx++;if(idx===seq.length){$('#mstat').textContent='对了';mark(true)}}
    else{sfxBuzz();$('#mstat').textContent='弹错了。正确答案是（再放一遍给你听）：';$('#mjp').textContent=jp(seq);mark(false)}};
  $('#mref').onclick=()=>{playDeg(0,now(),.15,.8);kb.flash(0)};
  $('#mrep').onclick=()=>{if(!listening||reps<=0)return;reps--;$('#mrep').textContent=`再听一遍（${reps}）`;if(!reps)$('#mrep').disabled=true;playSeq(false)};
  KEYH=e=>{const i='12345678'.slice(0,n).indexOf(e.key);if(i>=0){press(i);return true}};
  const finish=()=>{const k=hard?1.4:1;let eff,title,text;
    if(ok===3){eff={o:Math.round(12*k),l:8,f:hard?10:0};title='耳朵很好';text='对方愣了一下：“你是学过视唱练耳吧？”'}
    else if(ok===2){eff={o:Math.round(6*k),l:4};title='还行';text='错了一段，但听得出你有底子。'}
    else if(ok===1){eff={o:-2};title='有点吃力';text='你开始怀疑，自己是不是太依赖 AI 扒谱了。'}
    else{eff={o:-8,l:-6,f:hard?-8:0};title='没听出来';text='走出录音棚，你在地铁上把那段旋律听了二十遍。'}
    E.duck(1);miniResult(title,`三轮对了 ${ok} 轮。${text}`,eff)};
  next();
}

/* 3. 人机辨听：真人有呼吸、有轻重、有踏板；AI 每个音一样重、一样长 */
const H_MEL=[[64,0,1],[67,1,1],[72,2,2],[71,4,1],[69,5,1],[67,6,2],[65,8,1],[64,9,1],[62,10,1],[65,11,1],[64,12,4]];
const H_CH=[[0,[48,55,64]],[4,[43,50,59]],[8,[41,48,57]],[10,[43,50,59]],[12,[48,55,64]]];
function playPiano(kind){
  const t0=now()+.15,b=.56;
  if(kind==='ai'){
    H_MEL.forEach(([m,s,l])=>keys(E.dry,t0+s*b,m,l*b*.5,.1));
    for(let s=0;s<16;s++){const ch=[...H_CH].reverse().find(c=>c[0]<=s)[1];ch.forEach(m=>keys(E.dry,t0+s*b,m,b*.35,.045))}
    return 16*b+.8;
  }
  const warp=s=>{const x=s/16;return s*b*(1+.5*Math.pow(x,3))+(s>=1?.05:0)};
  const vel=s=>.04+.13*Math.sin(Math.min(1,s/12)*Math.PI*.95);
  H_MEL.forEach(([m,s,l],i)=>{
    const t=t0+warp(s)+.035,last=i===H_MEL.length-1;
    if(m===72)keys(E.sfx,t-.08,74,.06,.05);
    keys(E.sfx,t,m,(warp(s+l)-warp(s))*1.3+(last?1.8:0),vel(s)*(last?.75:1));
  });
  H_CH.forEach(([s,ch],ci)=>{const span=(H_CH[ci+1]?H_CH[ci+1][0]:16)-s;
    for(let k=0;k<span*2;k++)keys(E.sfx,t0+warp(s+k/2),ch[k%3],b*1.5,.03+(k%3===0?.02:0))});
  return warp(16)+2.4;
}
function aiTest(){
  $('#miniEye').textContent='音乐关卡 · 人机辨听';
  $('#miniTitle').textContent='哪段是人弹的？';
  $('#miniDesc').textContent='A 和 B 是同一段旋律。注意听三件事：速度有没有快慢变化，每个音有没有轻重，音和音之间是断开的还是连着的。两段都听完才能选。';
  const humanA=Math.random()<.5;const heard={A:false,B:false};
  $('#miniBody').innerHTML=`<div class="clips">${['A','B'].map(x=>`<div class="clip" id="clip${x}"><b>${x}</b><div class="wave">${'<i></i>'.repeat(9)}</div><button class="btn ghost sm" data-play="${x}">播放 ${x}</button><button class="btn sm" data-pick="${x}" disabled>${x} 是人弹的</button></div>`).join('')}</div>`;
  E.duck(.06);let tm;
  $$('[data-play]').forEach(b=>b.onclick=()=>{const x=b.dataset.play;const kind=(x==='A')===humanA?'human':'ai';
    $$('.clip').forEach(c=>c.classList.remove('playing'));const c=$('#clip'+x);c.classList.add('playing');
    const d=playPiano(kind);clearTimeout(tm);tm=setTimeout(()=>c.classList.remove('playing'),d*1000);heard[x]=true;
    if(heard.A&&heard.B)$$('[data-pick]').forEach(p=>p.disabled=false)});
  $$('[data-pick]').forEach(b=>b.onclick=()=>{const right=(b.dataset.pick==='A')===humanA,H=humanA?'A':'B',A=humanA?'B':'A';E.duck(1);
    const why=`真人是 ${H}：越到后面越慢，最后一个音留得很长；中间那句最响，两头轻；踩了踏板，音连成一片；左手的和弦是一个音一个音分开弹的。AI 是 ${A}：每拍一样长，每个音一样重，音和音之间断开，左手和弦像打卡一样每拍砸一下。`;
    if(right)miniResult('听出来了',why+' A&R 把你的名字记在了本子上。',{o:12,f:6,l:4});
    else miniResult('被骗过去了',why,{o:-10,l:-4})});
  KEYH=null;
}

/* ================= 第二关：音乐命运签 ================= */
const TAROT=[
  {n:'断弦',v:{l:2,o:1,m:-1},mean:'有些东西会断，你会学会用剩下的弦弹完'},
  {n:'空录音棚',v:{o:2,f:-1},mean:'安静的地方，才听得见自己'},
  {n:'失真吉他',v:{f:2,o:1},mean:'你的声音会很吵，也会被听见'},
  {n:'节拍器',v:{m:2,l:-1},mean:'稳定是一种才华，也是一种牢笼'},
  {n:'麦克风',v:{f:2},mean:'总会有人把聚光灯给你'},
  {n:'黑胶',v:{l:2,m:-1},mean:'慢的东西会留下来'},
  {n:'耳机',v:{o:1,l:1},mean:'你的世界很小，但很完整'},
  {n:'总谱',v:{o:2,m:1},mean:'你写下的每一个音都算数'},
  {n:'掌声',v:{f:2,m:1},mean:'掌声会来，但要先给自己鼓掌'},
  {n:'霓虹',v:{m:2,f:1},mean:'城市会给你机会，也会收走一些东西'},
  {n:'小谱',v:{m:1,f:1,o:-2},mean:'左手的 AI 会帮你，也会替你'},
  {n:'老钢琴',v:{l:2,o:1},mean:'有些声音只属于你的手'}
];
const ROMAN=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ'];
const NOUN={m:'制作人',f:'歌手',l:'诗人',o:'先锋'};
const ADJ={m:'富足的',f:'闪光的',l:'赤诚的',o:'孤独的'};
const INCOME={m:'广告配乐、版权授权，还有你自己的工作室',f:'巡演、直播和代言',l:'小酒馆驻唱，和每周三节吉他课',o:'艺术基金、展览和电影配乐'};
const VERSE={m:['你会把每一个音都算得很清楚，然后在某个晚上，为一个不赚钱的音哭出来。','账本和乐谱，你都会写得很好。'],
  f:['十年后会有很多人喊你的名字。记得留一个，只喊给自己听。','聚光灯很亮，亮到你要眯着眼睛，才看得见台下第一排。'],
  l:['你不一定会被很多人听见，但每一个听见你的人，都会记得你。','你会穷，会累，但会一直唱。'],
  o:['你的歌会走在时间前面，所以现在听的人少一点。','你会写出没人写过的声音，也会为此付出代价。']};
const L2={mode:null,picks:[],notes:[]};
function startL2(){
  E.resetMood();E.duck(1);E.play('mystic',ALL.mystic);KEYH=null;
  $('#l2').innerHTML=`<span class="eyebrow">第二关 · 2027</span><h2 class="big-title">音乐命运签</h2>
   <p class="lead">十年之前，你走进一家算命的小店。老板说，这里不看手相，看音乐。你可以抽三张音乐塔罗牌，也可以随手弹 8 个音，你弹出来的旋律会暴露你是什么样的人。</p>
   <div class="who-pick"><button class="btn" id="l2a">抽三张牌<small>翻开的每张牌都有自己的声音</small></button><button class="btn ghost" id="l2b">弹 8 个音<small>根据旋律的音域、跳进和结尾来算</small></button></div>
   <button class="btn ghost sm" data-hub style="align-self:flex-start">返回关卡</button>`;
  show('l2');
  $('#l2a').onclick=l2Cards;$('#l2b').onclick=l2Play;
}
function l2Cards(){
  L2.mode='cards';L2.picks=[];
  const order=shuffle(TAROT.map((_,i)=>i)),pos=['过去','现在','十年后'];
  $('#l2').innerHTML=`<span class="eyebrow">第二关 · 抽牌</span><h2 class="big-title">选三张</h2>
    <p class="lead" id="l2tip">第一张是你的<b>过去</b>。凭直觉点一张。</p>
    <div class="tarot" id="tarot">${order.map(i=>`<div class="tc" data-i="${i}" role="button" tabindex="0" aria-label="一张背面朝上的牌"><div class="back"></div><div class="face"><i>${ROMAN[i]}</i><b>${TAROT[i].n}</b><small></small></div></div>`).join('')}</div>
    <div class="spread" id="spread">${pos.map(p=>`<div><b>${p}</b>还没翻开</div>`).join('')}</div>`;
  const flip=c=>{
    if(c.classList.contains('flip')||L2.picks.length>=3)return;
    const i=+c.dataset.i,k=L2.picks.length;L2.picks.push(i);
    c.querySelector('.face small').textContent=pos[k];c.classList.add('flip');
    const sc=STYLES.mystic.scale,t=now();[0,2,4].forEach((d,j)=>tone(E.sfx,t+j*.12,sc[(i+d)%8]+12,.05,{type:'triangle',gain:.09,att:.002,rel:1.2}));
    $$('#spread div')[k].innerHTML=`<b>${pos[k]}</b>「${TAROT[i].n}」${TAROT[i].mean}`;
    if(L2.picks.length<3)$('#l2tip').innerHTML=`下一张是你的<b>${pos[L2.picks.length]}</b>。`;
    else{$('#l2tip').textContent='三张牌都翻开了。';$$('.tc:not(.flip)').forEach(x=>x.classList.add('dim'));
      const v={m:0,f:0,l:0,o:0};L2.picks.forEach((p,j)=>{for(const k2 in TAROT[p].v)v[k2]+=TAROT[p].v[k2]*(j===2?1.5:1)});
      setTimeout(()=>l2Reveal(v,`你抽到了「${L2.picks.map(p=>TAROT[p].n).join('」「')}」，第三张“十年后”的分量最重。`),1500)}
  };
  $$('.tc').forEach(c=>{c.onclick=()=>flip(c);c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip(c)}}});
}
function l2Play(){
  L2.mode='play';L2.notes=[];E.duck(.15);
  $('#l2').innerHTML=`<span class="eyebrow">第二关 · 弹 8 个音</span><h2 class="big-title">随手弹</h2>
    <p class="lead">不用想，凭感觉弹 8 个音就好。键盘是 C 大调，1 是 Do，从左到右越来越高，也可以按数字键 1 到 8。</p>
    <div class="slots" id="l2slots" style="flex-wrap:wrap">${'<span></span>'.repeat(8)}</div>
    <div id="l2keys"></div>
    <div class="row"><button class="btn ghost sm" id="l2clear">重来</button></div>`;
  const kb=buildKeys($('#l2keys'),8,i=>add(i));
  const paint=()=>$$('#l2slots span').forEach((s,k)=>{s.textContent=L2.notes[k]!=null?NUM[L2.notes[k]]:'';s.classList.toggle('now',k===L2.notes.length)});
  const add=i=>{if(L2.notes.length>=8)return;playDeg(i);kb.flash(i);L2.notes.push(i);paint();if(L2.notes.length===8){KEYH=null;setTimeout(l2Analyze,800)}};
  $('#l2clear').onclick=()=>{L2.notes=[];paint()};
  KEYH=e=>{const i='12345678'.indexOf(e.key);if(i>=0){add(i);return true}};
  paint();
}
function l2Analyze(){
  const a=L2.notes,v={m:0,f:0,l:0,o:0},why=[];
  const range=Math.max(...a)-Math.min(...a);let leaps=0,reps=0;for(let i=1;i<a.length;i++){const d=Math.abs(a[i]-a[i-1]);if(d>=3)leaps++;if(d===0)reps++}
  const last=a[a.length-1],avg=a.reduce((x,y)=>x+y,0)/a.length;
  if(last===0||last===7){v.m+=2;why.push(`结尾落回了 Do，很稳，你做事有始有终`)}else{v.o+=1;why.push(`结尾停在 ${NUM[last]}（${SOLF[last]}）上，没回到 Do，你喜欢留个问号`)}
  if(leaps>=3){v.o+=2;why.push(`有 ${leaps} 次大跳（一下跨过三个音以上），你不按常理出牌`)}else{v.l+=1;why.push('旋律大多一级一级地走，你温和、踏实')}
  if(range>=5){v.f+=2;why.push(`音域用了 ${range+1} 个音，你想被很多人听见`)}else{v.l+=1;why.push(`音域只用了 ${range+1} 个音，你更在意离你近的人`)}
  if(reps>=2){v.l+=2;why.push(`有 ${reps} 次同一个音连着弹，你很执着`)}
  if(avg>=4.5){v.o+=1;why.push('整体偏高，你是个理想主义者')}
  if(last>a[0])v.f+=1;
  l2Reveal(v,'你弹的是 '+jp(a)+'。'+why.join('；')+'。');
}
function l2Reveal(v,how){
  E.duck(1);
  const sorted=KEYS.slice().sort((x,y)=>v[y]-v[x]||Math.random()-.5);const p=sorted[0],s=sorted[1];
  const title=ADJ[s]+NOUN[p];
  const ai=v.o>=2?'你和 AI 互不打扰，你只在调音时用它。':v.o<=0?'AI 是你的左手，大部分旋律由它起草，你来挑。':'你把 AI 当成乐队里的一个乐手：它弹贝斯，你写旋律。';
  const lucky=L2.mode==='play'?L2.notes[L2.notes.length-1]:L2.picks[2]%7;
  const verse=pick(VERSE[p]);
  PROG.l2={title,p,s,verse,lucky};save();
  $('#l2').innerHTML=`<span class="eyebrow">第二关 · 你的命运签</span>
    <article class="fortune"><span class="eyebrow">十年命运签 · 2036</span><h3>${title}</h3>
      <dl><dt>主要收入</dt><dd>${INCOME[p]}</dd><dt>和 AI 的关系</dt><dd>${ai}</dd><dt>幸运音</dt><dd>${NUM[lucky]}（${SOLF[lucky]}）</dd></dl>
      <p class="verse">${verse}</p></article>
    <p class="mnote">${how}</p>
    <p class="mnote">截个图就能发给朋友。第四关会拿这张签和你第一关的真实结局做对比。</p>
    <div class="row"><button class="btn" id="l2hear">听你的命运旋律</button><button class="btn ghost" id="l2again">重新算</button><button class="btn ghost" data-go="l3">去第三关</button><button class="btn ghost" data-hub>返回关卡</button></div>`;
  $('#l2hear').onclick=()=>{E.duck(.2);const t=now()+.1;
    const mel=L2.mode==='play'?L2.notes.map(i=>SCALE[i]+2):L2.picks.flatMap(i=>[0,2,4].map(d=>STYLES.mystic.scale[(i+d)%8]+12));
    mel.forEach((m,k)=>{tone(E.sfx,t+k*.42,m,.05,{type:'triangle',gain:.1,att:.002,rel:1.4});if(k%4===0)tone(E.sfx,t+k*.42,50,1.6,{type:'sawtooth',gain:.04,att:.3,rel:1,cut:500})});
    setTimeout(()=>E.duck(1),mel.length*420+1500)};
  $('#l2again').onclick=startL2;
  const t=now()+.1;[62,66,69,74].forEach((m,i)=>tone(E.sfx,t+i*.15,m,.05,{type:'triangle',gain:.09,att:.002,rel:1.6}));
}

/* ================= 第三关：制作人的一天 ================= */
/* 小乐段：mel = [音, 起拍, 时值, 力度]；ch = [起拍, 和弦音, 时值]；bass = [起拍, 音, 时值] */
function clipPlay(o){
  const t0=now()+.12,b=60/o.bpm,inst=o.inst||'piano',sh=o.shift||0;
  const play=(m,t,d,g)=>{
    if(inst==='piano')keys(E.dry,t,m,d,g);
    else if(inst==='square')tone(E.dry,t,m,d,{type:'square',gain:g*.45,att:.003,rel:.12});
    else if(inst==='saw')tone(E.dry,t,m,d,{type:'sawtooth',gain:g*.55,att:.003,rel:.12});
    else if(inst==='warm'){tone(E.sfx,t,m,d,{type:'sine',gain:g*1.1,att:.07,rel:.6});tone(E.sfx,t,m-12,d,{type:'triangle',gain:g*.25,att:.09,rel:.6,cut:900})}
    else if(inst==='stacc')tone(E.dry,t,m,Math.min(d,b*.3),{type:'triangle',gain:g,att:.003,rel:.06});
  };
  (o.mel||[]).forEach(([m,s,l,v=1])=>play(m+sh,t0+s*b,l*b*.92,.12*v));
  (o.ch||[]).forEach(([s,notes,l,v=1])=>notes.forEach(m=>keys(E.dry,t0+s*b,m,l*b*.9,.04*v)));
  (o.bass||[]).forEach(([s,m,l,v=1])=>tone(E.dry,t0+s*b,m,l*b*.85,{type:'triangle',gain:.3*v,rel:.12,cut:900}));
  if(o.drums)for(let s=0;s<o.beats;s+=.5){if(s%1===0)kick(E.dry,t0+s*b,.55);if(s%2===1)snare(E.dry,t0+s*b,.18);hat(E.dry,t0+s*b,.05)}
  if(o.march)for(let s=0;s<o.beats;s++){kick(E.dry,t0+s*b,s%2?.3:.6);if(s%2)snare(E.dry,t0+s*b,.2)}
  return o.beats*b+1;
}
const C_=[48,[60,64,67]],G_=[43,[59,62,67]],Am_=[45,[60,64,69]],F_=[41,[60,65,69]],Dm_=[38,[57,62,65]],E_=[40,[56,59,64]];
const chordTrack=(list,len)=>({ch:list.map(([s,c])=>[s,c[1],len]),bass:list.map(([s,c])=>[s,c[0],len])});
const MEL3=[[60,0,.5],[64,.5,.5],[67,1,.5],[72,1.5,.5],[71,2,.5],[67,2.5,.5],[69,3,1],[72,4,.5],[74,4.5,.5],[76,5,1],[74,6,.5],[72,6.5,.5],[72,7,1]];
const VERSE_MEL=[[64,0,1],[67,1,1],[69,2,.5],[67,2.5,.5],[64,3,1],[62,4,1],[64,5,1],[60,6,2]];
const WALTZ_MEL=[[72,0,2],[71,2,1],[69,3,2],[67,5,1],[65,6,2],[64,8,1],[62,9,3]];
const TASKS=[
  {time:'08:00',who:'奶茶品牌',brief:'新品叫“分手柠檬茶”，广告歌要悲伤一点。',
    opts:[{ok:false,o:{bpm:132,beats:8,mel:[[72,0,.5],[76,.5,.5],[79,1,.5],[76,1.5,.5],[77,2,.5],[76,2.5,.5],[74,3,.5],[72,3.5,.5],[79,4,1],[84,5,1],[79,6,2]],...chordTrack([[0,C_],[2,F_],[4,G_],[6,C_]],2)}},
          {ok:true,o:{bpm:64,beats:8,mel:[[69,0,1],[67,1,.5],[64,1.5,.5],[65,2,1.5],[64,3.5,.5],[62,4,1],[60,5,.5],[59,5.5,.5],[57,6,2]],...chordTrack([[0,Am_],[2,Dm_],[4,E_],[6,Am_]],2)}},
          {ok:false,o:{bpm:120,beats:8,inst:'stacc',march:true,mel:[[67,0,.5],[67,.5,.5],[72,1,1],[67,2,.5],[67,2.5,.5],[72,3,1],[76,4,1],[74,5,1],[72,6,2]],...chordTrack([[0,C_],[4,G_],[6,C_]],2)}}],
    why:'悲伤感通常来自<b>小调、慢速和偏低的音区</b>。对的那版是 A 小调，每分钟只有 64 拍，旋律一路往下走。另外两版都是 C 大调，一版又快又亮，一版像进行曲。'},
  {time:'10:00',who:'婚礼策划',brief:'新人要跳华尔兹，音乐必须是三拍子。',
    opts:[{ok:true,o:{bpm:132,beats:12,mel:WALTZ_MEL,bass:[0,3,6,9].map((s,i)=>[s,[48,43,41,43][i],1,1.2]),ch:[0,3,6,9].flatMap((s,i)=>[[s+1,[C_,G_,F_,G_][i][1],.8,.8],[s+2,[C_,G_,F_,G_][i][1],.8,.8]])}},
          {ok:false,o:{bpm:132,beats:12,mel:WALTZ_MEL,bass:[0,2,4,6,8,10].map((s,i)=>[s,[48,48,43,41,41,43][i],1,1.2]),ch:[1,3,5,7,9,11].map((s,i)=>[s,[C_,C_,G_,F_,F_,G_][i][1],.8,.8])}},
          {ok:false,o:{bpm:132,beats:12,march:true,mel:WALTZ_MEL,bass:[0,2,4,6,8,10].map((s,i)=>[s,[48,43,48,41,43,48][i],1])}}],
    why:'华尔兹是<b>三拍子，“强、弱、弱”</b>一组。听低音：低音“咚”一下，和弦“嚓嚓”两下，就是三拍子。另外两版都是“强、弱”两拍一组。'},
  {time:'13:00',who:'广告导演',brief:'15 秒运动饮料广告，要有冲劲，要快。',
    opts:[72,104,156].map(bpm=>({ok:bpm===156,o:{bpm,beats:8,drums:true,mel:MEL3,...chordTrack([[0,C_],[2,Am_],[4,F_],[6,G_]],2)}})),
    why:'同一段旋律，<b>速度越快越有冲劲</b>。三个版本分别是每分钟 72、104、156 拍。'},
  {time:'16:00',who:'歌手',brief:'副歌要比主歌更高、更亮。先听一下主歌，再选副歌。',ref:{bpm:96,beats:8,mel:VERSE_MEL,...chordTrack([[0,C_],[4,G_],[6,C_]],2)},
    opts:[-12,0,12].map(sh=>({ok:sh===12,o:{bpm:96,beats:8,shift:sh,mel:VERSE_MEL,...chordTrack([[0,C_],[4,G_],[6,C_]],2)}})),
    why:'副歌常常比主歌<b>高一个八度或者高几个音</b>，情绪才能“推上去”。另外两版，一版和主歌一模一样，一版反而低了一个八度。'},
  {time:'19:00',who:'小谱',brief:'我生成了三版和弦，其中两版写错了。你能找出唯一没错的那版吗？',
    opts:[{ok:true,o:{bpm:96,beats:8,...chordTrack([[0,C_],[2,G_],[4,Am_],[6,F_]],2)}},
          {ok:false,o:{bpm:96,beats:8,...chordTrack([[0,C_],[2,[49,[61,65,68]]],[4,Am_],[6,F_]],2)}},
          {ok:false,o:{bpm:96,beats:8,...chordTrack([[0,C_],[2,G_],[4,Am_],[6,[42,[61,66,70]]]],2)}}],
    why:'没错的那版是 <b>C-G-Am-F</b>，简谱里叫 1-5-6-4，是流行歌里最常见的和弦进行。写错的两版各混进了一个不属于 C 大调的和弦，听到那里会突然“刺”一下。'},
  {time:'22:00',who:'纪录片导演',brief:'片尾要温暖、柔和的音色，像一件旧毛衣。',
    opts:['square','saw','warm'].map(inst=>({ok:inst==='warm',o:{bpm:84,beats:8,inst,mel:[[72,0,1],[71,1,.5],[69,1.5,.5],[67,2,1.5],[64,3.5,.5],[65,4,1],[67,5,1],[64,6,2]],...chordTrack([[0,C_],[2,G_],[4,F_],[6,C_]],2)}})),
    why:'<b>方波和锯齿波的泛音多</b>，听起来尖、亮、有电子感。温暖的音色泛音少，起音也慢一点，像是“吹”出来的，不是“扎”出来的。'},
  {time:'02:00',who:'内心',brief:'最后一句，要听起来真的“结束了”。',
    opts:[[60,C_],[62,G_],[59,G_]].map(([end,ch])=>({ok:end===60,o:{bpm:92,beats:11,mel:[[64,0,1],[65,1,1],[67,2,1],[69,3,1],[67,4,1],[65,5,1],[64,6,1],[62,7,1],[end,8,3]],ch:[[0,C_[1],4],[4,F_[1],2],[6,G_[1],2],[8,ch[1],3]],bass:[[0,48,4],[4,41,2],[6,43,2],[8,ch[0],3]]}})),
    why:'旋律<b>落在主音 1（Do）上最稳</b>，像句号。落在 2（Re）或 7（Si）上，像逗号，耳朵还想往下听。'}
];
Object.assign(PEOPLE,{'婚礼策划':['婚','#c9577f'],'广告导演':['广','#c06a2a'],'歌手':['歌','#a54f8a'],'纪录片导演':['纪','#3f8f6a']});
const L3={i:0,right:0,ai:0,own:0};
function startL3(){
  L3.i=0;L3.right=0;L3.ai=0;L3.own=0;E.resetMood();E.duck(1);STYLES.synth.bpm=100;E.play('synth',['pad']);KEYH=null;
  $('#l3').innerHTML=`<span class="eyebrow">第三关 · 2036 年的一天</span><h2 class="big-title">制作人的一天</h2>
    <p class="lead">2036 年，你是一名音乐制作人，左手是 AI 作曲助手“小谱”。从早上 8 点到凌晨 2 点，七个人会向你提七个要求。每次小谱都会生成三个版本。</p>
    <p class="lead">你可以<b>自己听、自己挑</b>，也可以点<b>“交给小谱挑”</b>省点力气，但小谱是随便挑的。一天结束后，你会看到这首歌的署名里，你占了几成。</p>
    <div class="row"><button class="btn" id="l3go">开始这一天</button><button class="btn ghost" data-hub>返回关卡</button></div>`;
  show('l3');$('#l3go').onclick=l3Task;
}
function l3Task(){
  const T=TASKS[L3.i];
  STYLES.synth.bpm=100+L3.i*8;E.duck(1);
  ['pad','sbass','sdrums','sarp'].forEach((n,k)=>E.setLayer(n,L3.i>=[0,1,2,4][k]));
  const order=shuffle(T.opts.map((_,k)=>k)),letters=['A','B','C'];
  $('#l3').innerHTML=`<div class="row" style="justify-content:space-between"><span class="clock">${T.time}</span><span class="tally">第 ${L3.i+1}/7 个 · 挑对 ${L3.right} · 交给小谱 ${L3.ai}</span></div>
    <div class="brief"><b>${T.who}</b>${T.brief}</div>
    ${T.ref?'<button class="btn ghost sm" id="l3ref" style="align-self:flex-start">先听主歌</button>':''}
    <div class="clips">${order.map((k,j)=>`<div class="clip" data-o="${k}"><b>${letters[j]}</b><div class="wave">${'<i></i>'.repeat(9)}</div><button class="btn ghost sm" data-p="${k}">播放 ${letters[j]}</button><button class="btn sm" data-c="${k}" disabled>就用 ${letters[j]}</button></div>`).join('')}</div>
    <button class="btn ghost" id="l3ai" style="align-self:flex-start">交给小谱挑</button>
    <div id="l3res"></div>`;
  $('#l3').scrollTo(0,0);
  let timer;
  const playClip=(o,el)=>{E.duck(.1);$$('.clip').forEach(c=>c.classList.remove('playing'));el&&el.classList.add('playing');clearTimeout(timer);const d=clipPlay(o);timer=setTimeout(()=>{E.duck(1);el&&el.classList.remove('playing')},d*1000)};
  if(T.ref)$('#l3ref').onclick=()=>playClip(T.ref,null);
  $$('[data-p]').forEach(b=>b.onclick=()=>{const k=+b.dataset.p;playClip(T.opts[k].o,b.closest('.clip'));document.querySelector(`[data-c="${k}"]`).disabled=false});
  const decide=(k,byAI)=>{
    $$('[data-c],#l3ai').forEach(b=>b.disabled=true);
    const ok=T.opts[k].ok;if(byAI)L3.ai++;else{L3.own++;if(ok)L3.right++}
    $$('.clip').forEach(c=>{const kk=+c.dataset.o;if(T.opts[kk].ok)c.classList.add('right');else if(kk===k)c.classList.add('wrong')});
    const L=letters[order.indexOf(k)],R=letters[order.findIndex(x=>T.opts[x].ok)];
    const head=byAI?(ok?`小谱随手挑了 ${L}，碰巧挑对了。`:`小谱随手挑了 ${L}，挑错了，${T.who}不太满意。`):(ok?`你挑了 ${L}，对了。`:`你挑了 ${L}，${T.who}要的其实是 ${R}。`);
    ok?sfxGood():sfxBuzz();
    $('#l3res').innerHTML=`<div class="explain"><b>${head}</b><br>${T.why}<br><span class="mnote">还可以把三个版本再听一遍，对比一下。</span></div><button class="btn" id="l3next" style="margin-top:10px">${L3.i<6?'下一个时间段':'结束这一天'}</button>`;
    $('#l3next').onclick=()=>{clearTimeout(timer);L3.i++;if(L3.i<7)l3Task();else l3End()};
    $('#l3next').scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  $$('[data-c]').forEach(b=>b.onclick=()=>decide(+b.dataset.c,false));
  $('#l3ai').onclick=()=>decide(Math.floor(Math.random()*3),true);
}
function l3End(){
  E.duck(1);const share=Math.round(L3.own/7*100);
  let t,x;
  if(L3.own>=6&&L3.right>=5){t='这是你的歌';x='凌晨 2 点 47 分，歌发布了。署名栏只有你的名字。小谱给你发了一条消息：“你今天几乎没用我。”'}
  else if(L3.own>=4){t='合写';x='凌晨 2 点 47 分，歌发布了。署名是“你 & 小谱”。评论区有人问：哪部分是人写的？'}
  else{t='小谱的歌';x='凌晨 2 点 47 分，歌发布了。你看着署名栏，发现自己只能算“监制”。'}
  PROG.l3={own:L3.own,right:L3.right,ai:L3.ai,title:t};save();
  STYLES.synth.bpm=150;
  $('#l3').innerHTML=`<span class="eyebrow">第三关 · 02:47</span><h2 class="big-title">${t}</h2><p class="lead">${x}</p>
    <div class="final"><div><b>${L3.own}</b><span>自己挑</span></div><div><b>${L3.right}</b><span>挑对</span></div><div><b>${L3.ai}</b><span>交给小谱</span></div><div><b>${share}%</b><span>你的署名</span></div></div>
    <p class="mnote">这一关考的是做音乐最基本的耳朵：调式、拍子、速度、音区、和弦、音色、终止感。2036 年 AI 能替你生成，但挑哪一版，还得靠人。</p>
    <div class="row"><button class="btn" id="l3again">再过一天</button><button class="btn ghost" data-go="l4">去第四关</button><button class="btn ghost" data-hub>返回关卡</button></div>`;
  $('#l3again').onclick=startL3;
}

/* ================= 第四关：十年回响 ================= */
const MAJ=[60,62,64,65,67,69,71,72],MIN=[60,62,63,65,67,68,70,72];
const CH_MAJ=[[48,60,64,67],[43,59,62,67],[48,60,64,67],[41,60,65,69],[48,60,64,67],[41,60,65,69],[43,59,62,67],[48,60,64,67]];
const CH_MIN=[[48,60,63,67],[43,59,62,67],[48,60,63,67],[41,60,65,68],[48,60,63,67],[44,60,63,68],[46,58,62,65],[48,60,63,67]];
const L4={notes:[],tok:0};
function startL4(){
  L4.tok++;E.resetMood();E.duck(1);E.play('orch',['str','low']);KEYH=null;
  const P=PROG,mem=[];
  if(P.l2)mem.push(`<li><i>2027 · 第二关</i>算命的小店里，命运签说你会成为<b>「${P.l2.title}」</b>。签上写着：${P.l2.verse}</li>`);
  else mem.push(`<li><i>2027 · 第二关</i>你没有去抽命运签，没人告诉你十年后会怎样。</li>`);
  if(P.l1&&ENDINGS[P.l1.id]){(P.l1.log||[]).forEach(x=>mem.push(`<li><i>${2026+x.y} · 第 ${x.y} 年</i>${x.who}找你，你选择了<b>「${x.pick}」</b>。</li>`));
    mem.push(`<li><i>${2026+P.l1.year} · 第一关的结局</i>你的活法是<b>「${ENDINGS[P.l1.id].t}」</b>。${ENDINGS[P.l1.id].x}</li>`)}
  else mem.push(`<li><i>2027—2036 · 第一关</i>这十年还是空白的。去第一关走一遍，这里就会写满你的选择。</li>`);
  if(P.l3)mem.push(`<li><i>2036 · 第三关</i>在那一天里，你自己挑了 ${P.l3.own} 次，交给小谱 ${P.l3.ai} 次。那首歌最后是<b>「${P.l3.title}」</b>。</li>`);
  else mem.push(`<li><i>2036 · 第三关</i>你还没有过完制作人的那一天。</li>`);
  let cmp='';
  if(P.l1&&P.l2&&ENDINGS[P.l1.id]){const tone=ENDINGS[P.l1.id].tone;cmp=tone==='good'?'命运签只说对了一半，另一半是你自己选出来的。':tone==='bad'?'命运签没有算到这个结局。也许签不准，也许你在某个路口转了弯。':'签上写的，和你真正活成的样子不太一样。这很正常，十年本来就会改变一个人。'}
  $('#l4').innerHTML=`<span class="eyebrow">第四关 · 2036 年 12 月 31 日</span><h2 class="big-title">十年回响</h2>
    <p class="lead">十年的最后一个晚上，你坐在钢琴前，回头看这十年。</p>
    <ul class="memories">${mem.join('')}</ul>
    ${cmp?`<p class="lead">${cmp}</p>`:''}
    <div class="row"><button class="btn" id="l4go">写下你的回响</button><button class="btn ghost" data-hub>返回关卡</button></div>`;
  show('l4');$('#l4go').onclick=l4Compose;
}
function l4Compose(){
  L4.notes=[];L4.tok++;E.play('orch',['str']);E.duck(.3);
  $('#l4').innerHTML=`<span class="eyebrow">第四关 · 作曲</span><h2 class="big-title">留给十年前的自己</h2>
    <p class="lead">弹 4 个音，留给 2027 年的自己。弹完以后，整支管弦乐团会把它奏出来，再高八度重复一遍，每个音后面都跟着回声。1 是 Do，从左到右越来越高，也可以按数字键 1 到 8。</p>
    <div class="slots" id="l4slots">${'<span></span>'.repeat(4)}</div>
    <div id="l4keys"></div>
    <div class="row"><button class="btn ghost sm" id="l4clear">重来</button><button class="btn" id="l4play" disabled>让乐团奏响</button></div>`;
  $('#l4').scrollTo(0,0);
  const kb=buildKeys($('#l4keys'),8,i=>add(i));
  const paint=()=>{$$('#l4slots span').forEach((s,k)=>{s.textContent=L4.notes[k]!=null?NUM[L4.notes[k]]:'';s.classList.toggle('now',k===L4.notes.length)});$('#l4play').disabled=L4.notes.length<4};
  const add=i=>{if(L4.notes.length>=4)return;playDeg(i,now(),.16,.7);kb.flash(i);L4.notes.push(i);paint()};
  $('#l4clear').onclick=()=>{L4.notes=[];paint()};
  $('#l4play').onclick=l4Finale;
  KEYH=e=>{const i='12345678'.indexOf(e.key);if(i>=0){add(i);return true}};
  paint();
}
function l4Finale(){
  KEYH=null;E.stop(.8);E.duck(1);const tok=++L4.tok;
  const P=PROG,tone0=(P.l1&&ENDINGS[P.l1.id])?ENDINGS[P.l1.id].tone:(P.l3&&P.l3.right>=4?'good':'mid');
  const A=tone0==='good'?'maj':'min',B=tone0==='bad'?'min':'maj';
  const b=60/80,bar=4*b,t0=now()+1.2;
  for(let i=0;i<8;i++){
    const mode=i<4?A:B,deg=L4.notes[i%4],sc=mode==='maj'?MAJ:MIN,ch=(mode==='maj'?CH_MAJ:CH_MIN)[deg],t=t0+i*bar,lift=i>=4?12:0,g=i>=4?1.25:1;
    ch.slice(1).forEach(m=>{tone(E.sfx,t,m,bar,{type:'sawtooth',gain:.022*g,att:.5,rel:.8,cut:1800,detune:-5});tone(E.sfx,t,m+12,bar,{type:'sawtooth',gain:.012*g,att:.7,rel:.8,cut:2400,detune:6})});
    tone(E.sfx,t,ch[0]-12,bar,{type:'sawtooth',gain:.06,att:.2,rel:.5,cut:450});
    kick(E.sfx,t,.6,95,58,.9);
    tone(E.sfx,t,sc[deg]+lift,b*2.4,{type:'triangle',gain:.14*g,att:.05,rel:.5,cut:1600});
    tone(E.sfx,t+b*2,sc[deg]+lift+12,b*.8,{type:'sine',gain:.05*g,att:.02,rel:.8});
    tone(E.sfx,t+b*3,sc[deg]+lift+12,b*.6,{type:'sine',gain:.025*g,att:.02,rel:1});
    if(i>=4)for(let k=0;k<8;k++)tone(E.sfx,t+k*b/2,ch[1+(k%3)]+24,b*.4,{type:'triangle',gain:.02,rel:.15});
  }
  const tf=t0+8*bar,fin=B==='maj'?CH_MAJ[0]:CH_MIN[0];
  fin.slice(1).forEach(m=>{tone(E.sfx,tf,m,bar*1.6,{type:'sawtooth',gain:.03,att:.4,rel:2,cut:2000});tone(E.sfx,tf,m+12,bar*1.6,{type:'sawtooth',gain:.016,att:.5,rel:2,cut:2600})});
  tone(E.sfx,tf,fin[0]-12,bar*1.6,{type:'sawtooth',gain:.07,att:.3,rel:2,cut:450});
  for(let k=0;k<10;k++)kick(E.sfx,tf-1+k*.1,.15+k*.05,95,60,.3);
  kick(E.sfx,tf,.9,95,55,1.5);
  tone(E.sfx,tf,(B==='maj'?MAJ:MIN)[0]+12,bar*1.6,{type:'triangle',gain:.13,att:.05,rel:2,cut:1600});
  const modeTxt={maj:'大调',min:'小调'};
  $('#l4').innerHTML=`<span class="eyebrow">第四关 · 回响中</span><h2 class="big-title">${jp(L4.notes)}</h2>
    <p class="lead">前四小节是你的旋律（${modeTxt[A]}），后四小节高八度再来一遍（${modeTxt[B]}）。每个音后面跟着的两声轻响，就是它的回声。</p>
    <div class="bars" id="l4bars">${'<i></i>'.repeat(9)}</div>
    <p class="mnote">${A!==B?'注意听第五小节：小调变成了大调。':A==='maj'?'整段都在大调上，是明亮的回响。':'整段都停在小调上。'}${P.l1?'调式由你第一关的结局决定。':'你还没玩第一关，所以由第三关的成绩决定调式。'}</p>`;
  const bars=$$('#l4bars i');
  for(let i=0;i<9;i++)setTimeout(()=>{if(tok===L4.tok&&bars[i])bars[i].classList.add('on')},(t0-now()+i*bar)*1000);
  setTimeout(()=>{if(tok===L4.tok)l4End(B)},(tf-now()+bar*1.4)*1000);
}
function l4End(B){
  const P=PROG;
  const en=P.l1&&ENDINGS[P.l1.id];
  const line2=P.l2?`命运签说你会是「${P.l2.title}」。`:'';
  const line=en?`十年后，你成了「${en.t}」。`:'你还没有走过第一关的十年。';
  const line3=P.l3?`2036 年的那一天，你的署名占了 ${Math.round(P.l3.own/7*100)}%。`:'';
  const close=B==='maj'?'不管活成什么样，你的旋律最后落在了大调上。':'旋律停在了小调上。也许下一个十年，会不一样。';
  P.l4={notes:L4.notes,mode:B};save();
  E.play('orch',B==='maj'?['str','low','osti']:['str','low']);
  $('#l4').innerHTML=`<span class="eyebrow">2036 · 终章</span><h2 class="big-title">十年回响</h2>
    <article class="fortune"><span class="eyebrow">你留给十年前的旋律</span><h3>${jp(L4.notes)}</h3>
      <p>${line2}${line}${line3}</p><p class="verse">${close}</p></article>
    <div class="row"><button class="btn" id="l4again">再写一段</button><button class="btn ghost" data-go="l1">再活一次十年</button><button class="btn ghost" data-hub>返回关卡</button></div>`;
  $('#l4again').onclick=l4Compose;
}

/* ================= 通用 ================= */
function show(id){$$('.screen').forEach(s=>s.hidden=s.id!==id);const el=$('#'+id);if(el&&el.scrollTo)el.scrollTo(0,0);if(id==='play'){renderChans();updateMood()}}
document.addEventListener('keydown',e=>{
  if(KEYH&&!e.repeat&&KEYH(e)){e.preventDefault();return}
  if(!$('#play').hidden&&G&&!G.lock){if(e.key==='ArrowLeft'){e.preventDefault();choose('L')}if(e.key==='ArrowRight'){e.preventDefault();choose('R')}}
  if(!$('#yearbreak').hidden&&(e.key==='Enter'||e.key===' ')){e.preventDefault();$('#ybGo').click()}
});
renderHub();renderMeters();renderChans();
