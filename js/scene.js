/* =========================================================
   3D 背景：第一人称的场景，跟着关卡切换，跟着音乐的节拍律动
   - 主页和第一关：你的出租屋（每过一年多一件东西）
   - 第二关：回声铺
   - 第三关：2036 年的一条街，每换一个身份，镜头转向那家店，天色跟着时间变
   - 第四关和画像：音乐厅
   移动鼠标可以环顾四周。用到的 3D 库是 js/vendor/three.min.js（MIT 许可）
   ========================================================= */
const SCENE = (() => {
  if (!window.THREE || !document.getElementById('scene3d')) return null;
  const host = document.getElementById('scene3d');
  let R;
  try { R = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }) } catch (e) { return null }
  R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); R.setSize(innerWidth, innerHeight);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputEncoding = THREE.sRGBEncoding;
  host.appendChild(R.domElement);
  const cam = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, .05, 200);
  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: .85, metalness: 0 }, o));
  const box = (w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? M(c, o) : c); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m };
  const cyl = (rt, rb, h, seg, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof c === 'string' ? M(c, o) : c); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m };
  const grad = (stops, w = 4, h = 256) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, w, h); return new THREE.CanvasTexture(c) };
  const textTex = (txt, bg, fg, w = 512, h = 128) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `700 ${h * .5}px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 4); return new THREE.CanvasTexture(c) };
  function facade(lit, seed, base = '#211c3c') {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'), r = rnd(seed);
    g.fillStyle = base; g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 124; y += 12) for (let x = 6; x < 60; x += 12) { g.fillStyle = r() < lit ? (r() < .5 ? '#ffd27a' : '#ffb86b') : '#2c2650'; g.fillRect(x, y, 6, 7) }
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t;
  }
  /* 音符精灵：从音箱、乐器上飘起来 */
  const noteTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#ffe2a8'; g.font = '48px serif'; g.textAlign = 'center'; g.fillText('♪', 32, 48); return new THREE.CanvasTexture(c) })();
  function notePool(S, n = 10) {
    const arr = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex, transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(.3); S.add(s); arr.push({ s, t: -1 }) }
    let k = 0;
    return {
      emit(t, x, y, z) { const n = arr[k++ % arr.length]; Object.assign(n, { t, x, y, z }) },
      tick(t) { arr.forEach(n => { if (n.t < 0) return; const a = (t - n.t) / 2600; if (a > 1) { n.t = -1; n.s.material.opacity = 0; return } n.s.position.set(n.x + Math.sin(a * 6) * .2, n.y + a * 1.6, n.z); n.s.material.opacity = Math.sin(a * Math.PI) * .85 }) }
    };
  }

  /* ================= 出租屋 ================= */
  function buildRoom() {
    const S = new THREE.Scene(); S.background = new THREE.Color('#171329');
    const room = new THREE.Group(); S.add(room);
    const HH = 3.4, wc = '#463d6e';
    room.add(box(8.6, .3, 8.6, '#6d4c3f', 0, -.15, 0));
    for (let i = 0; i < 8; i++) room.add(box(8.4, .02, .03, '#5a3d33', 0, .01, -3.5 + i));
    room.add(box(.3, HH, 8.6, '#3d3560', -4.15, HH / 2, 0)); room.add(box(.3, HH, 8.6, '#3d3560', 4.15, HH / 2, 0));
    room.add(box(8.6, .2, 8.6, '#2f2850', 0, HH + .1, 0)); room.add(box(8.6, HH, .3, wc, 0, HH / 2, 4.3));
    room.add(box(2.6, HH, .3, wc, -2.7, HH / 2, -4.15)); room.add(box(2.4, HH, .3, wc, 2.8, HH / 2, -4.15));
    room.add(box(3, 1.2, .3, wc, .1, .6, -4.15)); room.add(box(3, HH - 2.8, .3, wc, .1, (HH + 2.8) / 2, -4.15));
    const fr = '#e9dcc4';
    [[3.1, .12, .2, .1, 1.2], [3.1, .12, .2, .1, 2.8], [.12, 1.7, .2, -1.45, 2], [.12, 1.7, .2, 1.65, 2], [.08, 1.6, .12, .1, 2]].forEach(a => room.add(box(a[0], a[1], a[2], fr, a[3], a[4], -4.05)));
    room.add(box(3.4, .1, .5, fr, .1, 1.2, -3.85));
    const ceil = cyl(.5, .6, .12, 10, M('#f6e7c8', { emissive: '#ffd9a0', emissiveIntensity: .5 }), 0, HH - .06, 0); room.add(ceil);
    const ceilL = new THREE.PointLight('#ffd4a0', .55, 12, 1.5); ceilL.position.set(0, HH - .4, 0); room.add(ceilL);
    /* 窗外 */
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(60, 26), new THREE.MeshBasicMaterial({ map: grad([[0, '#1a1440'], [.7, '#5b3a7a'], [1, '#c0646f']]) })); sky.position.set(0, 6, -22); S.add(sky);
    const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), new THREE.MeshBasicMaterial({ color: '#ffe9b8' })); moon.position.set(-1.5, 4.6, -20); S.add(moon);
    const city = new THREE.Group(); S.add(city);
    let cityYear = -1;
    function buildCity(y) {
      if (cityYear === y) return; cityYear = y; city.clear(); const r = rnd(99);
      for (let i = 0; i < 26; i++) { const w = 1 + r() * 1.6, h = 3 + r() * 7, z = -12 - r() * 8, x = -11 + i * .5 + r() * .8;
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshBasicMaterial({ map: facade(.18 + y * .05, 7 + i * 13) })); m.position.set(x, h / 2 - 2, z); city.add(m) }
    }
    /* 家具 */
    const bed = new THREE.Group(); room.add(bed); bed.position.set(-2.75, 0, -1.6);
    bed.add(box(2.4, .5, 3.6, '#4a3f6b', 0, .25, 0)); bed.add(box(2.3, .3, 3.5, '#efe5d2', 0, .65, 0));
    bed.add(box(1.4, .25, .6, '#f3d7a8', 0, .92, -1.35)); bed.add(box(2.36, .12, 2, '#c0646f', 0, .86, .7));
    const desk = new THREE.Group(); room.add(desk); desk.position.set(2.4, -.35, -3.35);
    desk.add(box(2.8, .12, 1.1, '#a87650', 0, 1.3, 0));
    [[-1.3, -.45], [1.3, -.45], [-1.3, .45], [1.3, .45]].forEach(p => desk.add(box(.1, 1.3, .1, '#7b5236', p[0], .65, p[1])));
    desk.add(box(1.7, .08, .5, '#1f1b29', -.25, 1.4, .15)); desk.add(box(1.6, .05, .3, '#f5efe4', -.25, 1.46, .22));
    [0, 1, 3, 4, 5, 7, 8, 10, 11, 12].forEach(k => desk.add(box(.06, .05, .16, '#15121c', -1 + k * .115, 1.5, .14)));
    const screen = box(.9, .6, .04, M('#141026', { emissive: '#5fb7ff', emissiveIntensity: .55 }), .85, 1.75, -.3); screen.rotation.x = -.15; desk.add(screen);
    desk.add(box(.9, .04, .6, '#2a2440', .85, 1.38, -.05));
    const lamp = new THREE.Group(); desk.add(lamp); lamp.position.set(-1.1, 1.36, -.25);
    lamp.add(box(.3, .05, .3, '#2a2440', 0, 0, 0)); lamp.add(box(.05, .9, .05, '#2a2440', 0, .45, 0));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(.28, .32, 7, 1, true), M('#f2c46d', { emissive: '#f2a64a', emissiveIntensity: .6, side: THREE.DoubleSide })); shade.position.set(0, .95, 0); lamp.add(shade);
    const bulb = new THREE.PointLight('#ffb871', 1.6, 10, 1.6); bulb.position.set(0, .85, 0); bulb.castShadow = true; bulb.shadow.mapSize.set(512, 512); lamp.add(bulb);
    const chair = new THREE.Group(); room.add(chair); chair.position.set(2.3, -.15, -2.3); chair.rotation.y = .2;
    chair.add(box(.8, .1, .8, '#3a3355', 0, .8, 0)); chair.add(box(.8, .9, .1, '#3a3355', 0, 1.3, .38));
    [[-.35, -.35], [.35, -.35], [-.35, .35], [.35, .35]].forEach(p => chair.add(box(.07, .8, .07, '#2a2440', p[0], .4, p[1])));
    const gt = new THREE.Group(); room.add(gt); gt.position.set(-3.95, 1.6, -.2); gt.rotation.set(0, Math.PI / 2, .25);
    const gb = M('#c9773a'); const s1 = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 1), gb); s1.scale.set(1, 1.05, .25); s1.position.y = -.35; gt.add(s1);
    const s2 = new THREE.Mesh(new THREE.IcosahedronGeometry(.32, 1), gb); s2.scale.set(1, 1, .25); s2.position.y = .15; gt.add(s2);
    gt.add(box(.1, 1.2, .06, '#5a3a24', 0, .85, 0)); gt.add(box(.18, .26, .06, '#3a2416', 0, 1.55, 0));
    [['#e6b34f', 2.2, -1.2, 1, 1.3], ['#5a7fd6', 2.4, -2.6, .8, .8]].forEach(p => room.add(box(.03, p[3], p[4], p[0], -3.98, p[1], p[2])));
    [['#c0646f', 2.9, 2.2, .9, 1.2], ['#3aa58c', 3.3, 2.3, .6, .6]].forEach(p => room.add(box(p[3], p[4], .03, p[0], p[1], p[2], -3.98)));
    const rug = cyl(1.5, 1.5, .03, 12, '#7a5a8e', .4, .02, -.6); room.add(rug);
    const plant = new THREE.Group(); room.add(plant); plant.position.set(3.5, 0, -.4);
    plant.add(box(.5, .5, .5, '#b5813a', 0, .25, 0));
    const lv = M('#3f8f6a'); [[0, .9, 0, .45], [.2, 1.25, .1, .32], [-.18, 1.2, -.1, .3]].forEach(p => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(p[3], 0), lv); m.position.set(p[0], p[1], p[2]); m.castShadow = true; plant.add(m) });
    const spk = [];
    [[-.9, -3.55], [3.65, -2.3]].forEach(p => { const g = new THREE.Group(); g.position.set(p[0], 0, p[1]); g.add(box(.55, .9, .5, '#221d33', 0, .45, 0));
      const c1 = cyl(.18, .18, .04, 12, '#57507a', 0, .55, .26); c1.rotation.x = Math.PI / 2; g.add(c1); const c2 = c1.clone(); c2.scale.setScalar(.5); c2.position.y = .22; g.add(c2); room.add(g); spk.push(g) });
    /* 随年份出现的东西 */
    const extra = [];
    const add = (y, obj) => { obj.userData.y = y; room.add(obj); extra.push(obj) };
    { const g = new THREE.Group(); g.position.set(1.3, 0, -3.6); g.add(box(.8, .7, .5, '#2b2b2b', 0, .35, 0)); g.add(box(.7, .45, .03, '#4c4c4c', 0, .4, .26)); add(2, g) }
    { const g = new THREE.Group(); g.position.set(-1.2, 0, 1.6); g.rotation.y = -.5; g.add(box(1.5, .1, .5, '#202020', 0, 1, 0)); g.add(box(1.4, .04, .25, '#e8e2d6', 0, 1.07, .08)); g.add(box(.06, 1, .06, '#3a3a3a', -.5, .5, 0)); g.add(box(.06, 1, .06, '#3a3a3a', .5, .5, 0)); add(4, g) }
    { const g = new THREE.Group(); g.position.set(3.4, 1.01, -3.5); g.add(cyl(.14, .06, .3, 8, M('#e6b34f', { metalness: .6, roughness: .3 }), 0, .3, 0)); g.add(box(.18, .12, .18, '#3a2416', 0, .06, 0)); add(6, g) }
    { const g = new THREE.Group(); g.position.set(.9, 0, 1.2); const r = rnd(5); for (let i = 0; i < 6; i++) { const p = box(.42, .01, .3, i % 2 ? '#f3efe6' : '#e6dccb', (r() - .5) * .8, .02 + i * .012, (r() - .5) * .6); p.rotation.y = r() * 3; g.add(p) } add(8, g) }
    { const g = new THREE.Group(); g.position.set(-1.5, 0, -.6); g.add(box(.04, 1.6, .04, '#2a2a2a', 0, .8, 0)); g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 1), M('#9a9a9a', { metalness: .7, roughness: .3 }))); g.children[1].position.y = 1.65; g.add(box(.5, .03, .5, '#2a2a2a', 0, .015, 0)); add(10, g) }
    S.add(new THREE.HemisphereLight('#a79fe0', '#3a2630', .62));
    const moonL = new THREE.DirectionalLight('#9fb2ff', .55); moonL.position.set(3, 8, -14); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024);
    Object.assign(moonL.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); S.add(moonL);
    const notes = notePool(S);
    let year = 0, danger = 0;
    function setYear(y) { year = y; extra.forEach(o => o.visible = y >= o.userData.y); buildCity(y) }
    setYear(0);
    return {
      S, setYear, setDanger(d) { danger = d },
      cam: { pos: [.7, 1.5, 3.3], look: [.5, .15, -4], fov: 56, k: [2.4, .7] },
      frame(t, beat, ph, newBeat) {
        const pulse = beat == null ? 0 : Math.pow(1 - ph, 3);
        spk.forEach(g => g.scale.set(1 + pulse * .07, 1 + pulse * .1, 1 + pulse * .07));
        const flick = danger > .3 ? (Math.sin(t / 37) * Math.sin(t / 91) > .6 ? .35 : 1) : 1;
        bulb.intensity = (1.45 + pulse * .45) * flick * (1 - danger * .35); shade.material.emissiveIntensity = (.5 + pulse * .4) * flick;
        bulb.color.setRGB(1, .72 - danger * .2, .44 - danger * .2);
        if (newBeat && beat % 2 === 0) { const sp = spk[(beat / 2) % 2]; notes.emit(t, sp.position.x, 1.1, sp.position.z + .2) }
        notes.tick(t);
      }
    };
  }

  /* ================= 回声铺（第二关） ================= */
  function buildShop() {
    const S = new THREE.Scene(); S.background = new THREE.Color('#120a1c'); S.fog = new THREE.Fog('#1a0e26', 6, 18);
    const HH = 3.6, wood = '#3b2418', dark = '#24150f';
    S.add(box(10, .3, 10, '#2c1a12', 0, -.15, 0)); S.add(box(10, .2, 10, '#1b100b', 0, HH + .1, 0));
    S.add(box(10, HH, .3, '#2a1a26', 0, HH / 2, -4.2)); S.add(box(.3, HH, 10, '#26182a', -4.2, HH / 2, 0)); S.add(box(.3, HH, 10, '#26182a', 4.2, HH / 2, 0));
    /* 后墙的架子和瓶瓶罐罐 */
    const r = rnd(21), jars = [];
    for (let row = 0; row < 4; row++) { S.add(box(6.4, .08, .5, wood, 0, .7 + row * .75, -3.85));
      for (let i = 0; i < 9; i++) { if (r() < .25) continue; const h = .2 + r() * .3, col = ['#7a3fa0', '#2f8a9c', '#c0646f', '#d9a441', '#3f8f6a'][Math.floor(r() * 5)];
        const j = cyl(.09 + r() * .06, .11, h, 7, M(col, { emissive: col, emissiveIntensity: .25, transparent: true, opacity: .85 }), -2.9 + i * .72, .74 + row * .75 + h / 2, -3.8); S.add(j); jars.push(j) } }
    [-3.25, 3.25].forEach(x => S.add(box(.12, 3.1, .5, wood, x, 1.55, -3.85)));
    /* 帘子 */
    const cur = M('#4a1f4f', { side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) { const p = box(.5, HH - .2, .04, cur, -3.9 + i * .08, HH / 2, 1 - i * .5); p.rotation.y = Math.PI / 2 + (i % 2 ? .15 : -.15); S.add(p) }
    /* 圆桌、塔罗牌、水晶球 */
    S.add(cyl(1.3, 1.3, .1, 14, '#5a2e2a', 0, .95, -.8)); S.add(cyl(.12, .2, .95, 8, dark, 0, .47, -.8));
    S.add(cyl(1.32, 1.32, .02, 14, '#6d2f5f', 0, 1.01, -.8));
    const cards = [];
    [-.6, 0, .6].forEach((x, i) => { const c = box(.36, .02, .56, M('#2a1f4d', { emissive: '#6d5aa8', emissiveIntensity: .2 }), x, 1.04, -.4); c.rotation.y = (i - 1) * .12; S.add(c); cards.push(c);
      const g = box(.3, .021, .5, M('#d9a441', { emissive: '#d9a441', emissiveIntensity: .15, wireframe: true }), x, 1.045, -.4); g.rotation.y = c.rotation.y; S.add(g) });
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.32, 2), M('#7fe0e8', { emissive: '#3aa5b8', emissiveIntensity: .7, transparent: true, opacity: .75, roughness: .1 }));
    ball.position.set(0, 1.4, -1.3); S.add(ball); S.add(cyl(.18, .24, .12, 8, '#d9a441', 0, 1.06, -1.3));
    const ballL = new THREE.PointLight('#66d6e6', .9, 5, 2); ballL.position.set(0, 1.5, -1.3); S.add(ballL);
    /* 旧钢琴（右边） */
    const pn = new THREE.Group(); pn.position.set(3.2, 0, -1.6); pn.rotation.y = -Math.PI / 2; S.add(pn);
    pn.add(box(2, 1.5, .7, '#2a1710', 0, .75, 0)); pn.add(box(1.9, .06, .35, '#f1e6d0', 0, 1, .45)); pn.add(box(2, .1, .4, '#2a1710', 0, .92, .45));
    for (let k = 0; k < 13; k++) if ([1, 3, 6, 8, 10].includes(k % 12)) pn.add(box(.07, .05, .2, '#120a07', -.9 + k * .15, 1.05, .4));
    /* 蜡烛 */
    const flames = [];
    [[-1, 1.06, -1.2], [1, 1.06, -1.1], [-2.6, 3, -3.7], [2.6, 3, -3.7], [3.2, 1.55, -1]].forEach(([x, y, z], i) => {
      S.add(cyl(.05, .05, .22, 6, '#efe5cf', x, y + .11, z));
      const f = new THREE.Mesh(new THREE.ConeGeometry(.04, .12, 6), new THREE.MeshBasicMaterial({ color: '#ffcf70' })); f.position.set(x, y + .29, z); S.add(f);
      const L = new THREE.PointLight('#ffb35a', .7, 4, 2); L.position.set(x, y + .4, z); if (i < 2) L.castShadow = true; S.add(L); flames.push([f, L, Math.random() * 10]) });
    /* 灯笼 */
    const lans = [];
    [-2, -.6, .8, 2.2].forEach((x, i) => { S.add(box(.02, .6, .02, '#111', x, HH - .3, -2 + i * .3));
      const l = box(.36, .46, .36, M(['#c0464f', '#d9a441'][i % 2], { emissive: ['#c0464f', '#d9a441'][i % 2], emissiveIntensity: .7 }), x, HH - .85, -2 + i * .3); S.add(l); lans.push(l) });
    /* 漂浮的灰尘 */
    const dp = [], dr = rnd(4); for (let i = 0; i < 260; i++) dp.push((dr() - .5) * 8, dr() * HH, -4 + dr() * 7);
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
    const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#ffd9a0', size: .025, transparent: true, opacity: .55 })); S.add(dust);
    S.add(new THREE.HemisphereLight('#7b5aa8', '#2a1410', .35));
    const notes = notePool(S, 8);
    return {
      S, cam: { pos: [0, 1.75, 2.8], look: [0, 1.1, -4], fov: 58, k: [2.6, .8] },
      frame(t, beat, ph, newBeat) {
        const pulse = beat == null ? 0 : Math.pow(1 - ph, 2.5);
        flames.forEach(([f, L, o]) => { const fl = .85 + Math.sin(t / 90 + o) * .08 + Math.sin(t / 37 + o * 3) * .06; f.scale.set(1, fl, 1); L.intensity = .6 * fl + pulse * .15 });
        ball.material.emissiveIntensity = .55 + pulse * .5 + Math.sin(t / 700) * .1; ballL.intensity = .7 + pulse * .6; ball.rotation.y = t / 4000;
        lans.forEach((l, i) => l.rotation.y = Math.sin(t / 1500 + i) * .2);
        dust.rotation.y = t / 60000; dust.position.y = Math.sin(t / 5000) * .1;
        if (newBeat && beat % 4 === 0) notes.emit(t, 3.2 - (Math.random() * .6), 1.2, -1.2);
        notes.tick(t);
      }
    };
  }

  /* ================= 2036 年的一条街（第三关） ================= */
  const SHOP = {
    ad: ['广告公司', '#e07b5b'], wedding: ['婚礼礼堂', '#d98aa0'], vocal: ['录音棚', '#c0646f'], aitrain: ['AI 实验室', '#2bd4ff'], doc: ['纪录片工作室', '#8fb3a0'],
    bar: ['小酒馆', '#e6b34f'], teacher: ['音乐教室', '#6cc4a6'], rehab: ['康复中心', '#7fb3e6'], coach: ['健身房', '#ff6f6f'], cafe: ['咖啡馆', '#c9955a'],
    luthier: ['琴行修复', '#b5813a'], photo: ['音乐节', '#ff4fd8'], self: ['家', '#ffe1a8']
  };
  /* 七个时刻的天色：早上、上午、中午、下午、傍晚、晚上、凌晨 */
  const SKY = [['#9ec9ff', '#ffd6a5'], ['#7fb7ff', '#d8ecff'], ['#6aa8ff', '#cfe6ff'], ['#7d9fe0', '#ffd2a6'], ['#4b3b8f', '#ff8f6b'], ['#141a3d', '#3b2a63'], ['#07091a', '#1a1438']];
  function buildStreet() {
    const S = new THREE.Scene();
    const skyM = new THREE.MeshBasicMaterial({ map: grad([[0, SKY[0][0]], [1, SKY[0][1]]]) });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 12), skyM); skyM.side = THREE.BackSide; S.add(sky);
    S.fog = new THREE.Fog('#ffd6a5', 30, 85);
    S.add(box(14, .1, 120, '#3b3a44', 0, -.05, -50));
    for (let z = 0; z > -110; z -= 6) S.add(box(.15, .02, 2.4, '#e9e4d8', 0, .02, z));
    [-5.2, 5.2].forEach(x => S.add(box(3.2, .25, 120, '#7d7a86', x, .12, -50)));
    const hemi = new THREE.HemisphereLight('#cfe3ff', '#5a4a3a', .9); S.add(hemi);
    const sun = new THREE.DirectionalLight('#fff1d6', 1); sun.position.set(-10, 20, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -40, far: 80 }); S.add(sun);
    /* 两边普通的楼 */
    const fill = new THREE.Group(); S.add(fill); const r = rnd(31);
    for (let side of [-1, 1]) for (let z = 4; z > -105; z -= 5 + r() * 2) { const w = 4 + r() * 2, h = 6 + r() * 14;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4.5), M(['#b9a8c9', '#a8b9c9', '#c9b9a8', '#9aa3b5'][Math.floor(r() * 4)]));
      m.position.set(side * (9 + w / 2), h / 2, z); m.castShadow = m.receiveShadow = true; fill.add(m) }
    /* 七家店（每局按今天的身份摆） */
    const shops = new THREE.Group(); S.add(shops); let slots = [];
    const lamps = [];
    for (let z = -2; z > -100; z -= 12) [-6.6, 6.6].forEach(x => { S.add(box(.1, 3.6, .1, '#2a2a33', x, 1.8, z)); const b = box(.5, .12, .25, M('#fff4d8', { emissive: '#ffd58a', emissiveIntensity: 0 }), x * .93, 3.6, z); S.add(b);
      const L = new THREE.PointLight('#ffd58a', 0, 9, 2); L.position.set(x * .9, 3.4, z); S.add(L); lamps.push([b, L]) });
    function setShops(roles) {
      shops.clear(); slots = [];
      roles.forEach((k, i) => { const [name, col] = SHOP[k] || ['店铺', '#ccc']; const side = i % 2 ? 1 : -1, z = -6 - i * 9;
        const g = new THREE.Group(); g.position.set(side * 8.2, 0, z); shops.add(g);
        g.add(box(4.6, 4.2, 4.4, '#3a3448', 0, 2.1, 0));
        const glass = box(.08, 2, 3.4, M('#1b1d2a', { emissive: col, emissiveIntensity: .15 }), -side * 2.32, 1.3, 0); g.add(glass);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, .9), new THREE.MeshStandardMaterial({ map: textTex(name, '#14111f', col), emissive: '#ffffff', emissiveMap: textTex(name, '#14111f', col), emissiveIntensity: .25 }));
        sign.position.set(-side * 2.36, 3.15, 0); sign.rotation.y = -side * Math.PI / 2; g.add(sign);
        const aw = box(.9, .08, 3.6, M(col), -side * 2.7, 2.5, 0); aw.rotation.z = side * .25; g.add(aw);
        const L = new THREE.PointLight(col, 0, 10, 2); L.position.set(-side * 3.4, 2, 0); g.add(L);
        slots.push({ g, glass, sign, L, side, z, col }) });
    }
    let target = 0, camZ = 3, night = 0, cur = -1;
    const notes = notePool(S, 8);
    function setIndex(i) {
      cur = i; const k = Math.max(0, Math.min(6, i < 0 ? 0 : i));
      skyM.map = grad([[0, SKY[k][0]], [1, SKY[k][1]]]); skyM.needsUpdate = true;
      S.fog.color.set(SKY[k][1]); night = k >= 5 ? 1 : k === 4 ? .5 : 0;
      hemi.intensity = .9 - night * .6; sun.intensity = 1 - night * .9; sun.color.set(k === 4 ? '#ffb38a' : '#fff1d6');
      lamps.forEach(([b, L]) => { b.material.emissiveIntensity = night; L.intensity = night * .9 });
      slots.forEach((s, j) => { const on = j === i; s.glass.material.emissiveIntensity = on ? 1.1 : (.15 + night * .35); s.sign.material.emissiveIntensity = on ? 1 : .25 + night * .3; s.L.intensity = on ? 1.6 : night * .3 });
      target = i < 0 ? 0 : i;
    }
    return {
      S, setShops, setIndex,
      cam: { pos: [0, 1.65, 3], look: [0, 1.4, -40], fov: 60, k: [8, 3] },
      custom(c, px, py) {
        const s = slots[target]; const goalZ = s ? s.z + 7 : 3; camZ += (goalZ - camZ) * .03;
        c.position.set(px * .6, 1.65 + py * -.2, camZ);
        const lx = s && cur >= 0 ? s.side * 6 : 0, lz = s && cur >= 0 ? s.z - 1 : camZ - 30;
        c.lookAt(lx + px * 6, 1.8 - py * 2, lz);
      },
      frame(t, beat, ph, newBeat) {
        const s = slots[target]; if (!s || cur < 0) { notes.tick(t); return }
        const pulse = beat == null ? 0 : Math.pow(1 - ph, 2.6);
        s.glass.material.emissiveIntensity = 1 + pulse * .6; s.L.intensity = 1.4 + pulse * 1.2;
        if (newBeat && beat % 2 === 0) notes.emit(t, s.side * 5.8, 1.6, s.z + (Math.random() - .5) * 2);
        notes.tick(t);
      }
    };
  }

  /* ================= 音乐厅（第四关和画像） ================= */
  function buildHall() {
    const S = new THREE.Scene(); S.background = new THREE.Color('#0d0a14'); S.fog = new THREE.Fog('#0d0a14', 14, 34);
    S.add(box(30, .2, 30, '#1c1218', 0, -.1, 0));
    S.add(box(16, 1.1, 7, '#4a2c1c', 0, .55, -8)); S.add(box(16, .06, .2, '#c99a4e', 0, 1.12, -4.5));
    S.add(box(18, 10, .4, '#2a1a22', 0, 5, -11.6));
    /* 管风琴管 */
    for (let i = 0; i < 21; i++) { const h = 3 + Math.sin(i / 20 * Math.PI) * 4; S.add(cyl(.16, .16, h, 8, M('#c9a25a', { metalness: .6, roughness: .35 }), -5 + i * .5, 3 + h / 2, -11.2)) }
    /* 幕布 */
    const curt = M('#7a1a2a');
    [-1, 1].forEach(sd => { for (let i = 0; i < 5; i++) S.add(box(.5, 9, .3, curt, sd * (7.4 - i * .45), 4.5, -4.4 + (i % 2) * .15)) });
    S.add(box(16, 1.2, .4, curt, 0, 8.6, -4.4));
    /* 乐团：椅子和谱架，按半圆排 */
    const players = [];
    for (let row = 0; row < 3; row++) { const n = 7 + row * 2, rad = 2.2 + row * 1.3;
      for (let i = 0; i < n; i++) { const a = Math.PI * (.15 + .7 * i / (n - 1)), x = Math.cos(a) * rad, z = -6.2 - Math.sin(a) * rad * .55 + row * .1;
        const g = new THREE.Group(); g.position.set(x, 1.1, z); g.lookAt(0, 1.1, -4); S.add(g);
        g.add(box(.4, .05, .4, '#1a1a1a', 0, .45, 0)); g.add(box(.05, .45, .05, '#111', 0, .22, 0));
        const body = box(.34, .55, .26, M('#141018'), 0, .78, -.05); g.add(body); const head = new THREE.Mesh(new THREE.IcosahedronGeometry(.13, 1), M('#2a2026')); head.position.set(0, 1.18, -.05); g.add(head);
        const stand = box(.36, .26, .02, M('#e8e0cc', { emissive: '#ffe9b8', emissiveIntensity: 0 }), 0, .95, .35); stand.rotation.x = -.5; g.add(stand);
        players.push(stand) } }
    S.add(box(.6, .3, .6, '#3a2418', 0, 1.25, -4.9));
    /* 观众席 */
    for (let row = 0; row < 5; row++) for (let i = -7; i <= 7; i++) { if (Math.abs(i) < 1) continue; S.add(box(.6, .5 + row * .02, .55, '#4a1622', i * .75, .25 + row * .12, 1.5 + row * 1.1)); S.add(box(.6, .5, .1, '#5a1a28', i * .75, .65 + row * .12, 1.75 + row * 1.1)) }
    /* 舞台灯 */
    const spots = [];
    for (let i = 0; i < 7; i++) { const x = -6 + i * 2; const L = new THREE.SpotLight(['#ffe2b0', '#ffd08a', '#ffe9c8'][i % 3], 0, 22, .32, .6, 1.4); L.position.set(x, 9, -1); L.target.position.set(x * .6, 1, -7); if (i % 3 === 0) L.castShadow = true; S.add(L, L.target);
      const can = cyl(.18, .26, .4, 8, M('#222', { emissive: '#ffd08a', emissiveIntensity: 0 }), x, 9.1, -1); can.rotation.x = .6; S.add(can); spots.push([L, can]) }
    S.add(new THREE.HemisphereLight('#6a5a8a', '#1a0a10', .35));
    const warm = new THREE.PointLight('#ffcf8a', .8, 20, 1.5); warm.position.set(0, 4, -4); S.add(warm);
    let level = 3;
    return {
      S, setLevel(n) { level = n },
      cam: { pos: [0, 2.6, 7.5], look: [0, 2.2, -8], fov: 52, k: [5, 1.4] },
      frame(t, beat, ph) {
        const pulse = beat == null ? .3 : Math.pow(1 - ph, 2.2);
        spots.forEach(([L, can], i) => { const on = i < level * 2 + 1 ? 1 : .15; L.intensity = on * (1.4 + pulse * 1.2); can.material.emissiveIntensity = on * (.4 + pulse * .6) });
        players.forEach((p, i) => p.material.emissiveIntensity = (i % 5 === (beat || 0) % 5 ? .6 : .25) * (.6 + pulse * .4));
        warm.intensity = .6 + pulse * .4;
      }
    };
  }

  /* ================= 调度 ================= */
  const built = {}, MAKERS = { room: buildRoom, shop: buildShop, street: buildStreet, hall: buildHall };
  let cur = null, curKey = '', px = 0, py = 0, tx = 0, ty = 0, lastBeat = -1;
  const get = k => built[k] || (built[k] = MAKERS[k]());
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1 });
  addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* 节拍：直接从音频引擎读当前播放到第几个十六分音符，画面和声音对齐 */
  function beatNow() {
    if (!window.E || !E.ctx || !E.timer || !E.style) return [null, 0];
    const d = E.d16(), pos = E.step - (E.nextTime - E.ctx.currentTime) / d; if (pos < 0) return [null, 0];
    return [Math.floor(pos / 4), (pos / 4) % 1];
  }
  function loop(t) {
    requestAnimationFrame(loop);
    if (!cur || document.hidden) return;
    px += (tx - px) * .04; py += (ty - py) * .04;
    const [beat, ph] = reduce ? [null, 0] : beatNow(); const nb = beat != null && beat !== lastBeat; if (nb) lastBeat = beat;
    const c = cur.cam;
    if (cur.custom) cur.custom(cam, px, py);
    else { cam.position.set(c.pos[0], c.pos[1], c.pos[2]); cam.lookAt(c.look[0] + px * c.k[0], c.look[1] - py * c.k[1], c.look[2]) }
    const fov = innerWidth / innerHeight < .9 ? c.fov + 18 : c.fov; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix() }
    cur.frame(t, beat, ph, nb);
    R.render(cur.S, cam);
  }
  requestAnimationFrame(loop);
  const SCREEN = { hub: 'room', ideal: 'room', intro: 'room', yearbreak: 'room', play: 'room', mini: 'room', end: 'room', l2: 'shop', l3: 'street', l4: 'hall', portrait: 'hall' };
  return {
    go(screenId) { const k = SCREEN[screenId] || 'room'; if (k === curKey) return; curKey = k; cur = get(k); host.dataset.scene = k },
    year(y) { get('room').setYear(y) },
    danger(d) { if (built.room) built.room.setDanger(d) },
    l3Role(i, roles) { const s = get('street'); if (roles) s.setShops(roles); s.setIndex(i) },
    hall(n) { get('hall').setLevel(n) }
  };
})();
window.SCENE = SCENE;
if (SCENE) { const v = [...document.querySelectorAll('.screen')].find(s => !s.hidden); SCENE.year(PROG.l1save ? PROG.l1save.year : PROG.l1 ? 10 : 0); SCENE.go(v ? v.id : 'hub') }
else document.body.classList.add('no3d');
