// ==================== PLANET CLICKER MODULE ====================
(function () {
'use strict';
var CK_KEY = 'spaceClicker_v1';
var CK_TH = [0, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e11, 1e12];
var CK_NAMES = ['Нептун', 'Уран', 'Сатурн', 'Юпитер', 'Марс', 'Земля', 'Венера', 'Меркурий', 'Солнце', 'Чёрная дыра'];
var CK_COLS = [
['#bfe8ff', '#3f7fd6', '#12356b'],
['#d6fff9', '#3aa79b', '#0f4a44'],
['#fff3c4', '#e0b23e', '#7a5a10'],
['#ffe0b3', '#d1912f', '#6e4308'],
['#ffc0a0', '#d14924', '#5e1508'],
['#bfe0ff', '#3f7fd6', '#123a6b'],
['#ffedc2', '#e8c37e', '#7a5a20'],
['#f0f0f0', '#a8a8a8', '#4d4d4d'],
['#fff6b8', '#ffc233', '#8a5a00'],
['#c9a6ff', '#6a1fb5', '#17002e']
];
var CK = { clicks: 0, mult: 1, rebirths: 0, lv: [], laser: false, earth: false };
var CK_UPG = [];
var i;
for (i = 0; i < 100; i++) CK.lv.push(0);
for (i = 0; i < 100; i++) {
  if (i % 2 === 0) CK_UPG.push({ name: 'Авто-дрон ' + (i / 2 + 1), type: 'auto', val: Math.max(1, Math.round(Math.pow(2.2, i / 2))), base: Math.ceil(100 * Math.pow(1.75, i)) });
  else CK_UPG.push({ name: 'Усилитель ' + Math.ceil(i / 2), type: 'power', val: Math.max(1, Math.round(Math.pow(2.2, (i - 1) / 2))), base: Math.ceil(100 * Math.pow(1.75, i)) });
}
function ckUpgCost(x) { return Math.ceil(CK_UPG[x].base * Math.pow(1.25, CK.lv[x])); }
function ckCps() { var s = 0; for (var x = 0; x < 100; x += 2) s += CK_UPG[x].val * CK.lv[x]; return s * CK.mult; }
function ckPower() { var s = 1; for (var x = 1; x < 100; x += 2) s += CK_UPG[x].val * CK.lv[x]; return s * CK.mult; }
function ckStage() { var s = 0; for (var x = 0; x < CK_TH.length; x++) if (CK.clicks >= CK_TH[x]) s = x; return s; }
function fmtNum(n) {
  n = Math.floor(n);
  if (n < 1000) return '' + n;
  var u = [[1e12, 'кккк'], [1e9, 'ккк'], [1e6, 'кк'], [1e3, 'к']];
  for (var x = 0; x < u.length; x++) {
    if (n >= u[x][0]) {
      var v = n / u[x][0];
      var t = v >= 100 ? v.toFixed(0) : (v >= 10 ? v.toFixed(1) : v.toFixed(2));
      return parseFloat(t) + u[x][1];
    }
  }
  return '' + n;
}
function ckSave() {}
function ckLoad() {
  CK.clicks = 0;
  CK.mult = 1;
  CK.rebirths = 0;
  CK.laser = false;
  CK.earth = false;
  try { localStorage.removeItem('spaceClicker_v1'); } catch (e) {}
}
ckLoad();
var styleEl = document.createElement('style');
styleEl.textContent = '';
document.head.appendChild(styleEl);
function cssAdd(s) { styleEl.textContent += s; }
cssAdd('#clicker-open-btn{position:fixed;left:18px;bottom:18px;z-index:9400;padding:14px 24px;border:none;border-radius:40px;cursor:pointer;font-family:Courier New,monospace;font-weight:bold;font-size:17px;color:#fff;background:linear-gradient(135deg,#7b2cbf,#3a86ff);box-shadow:0 0 18px #3a86ff;animation:ckPulse 1.6s infinite;letter-spacing:1px;}');
cssAdd('@keyframes ckPulse{0%,100%{box-shadow:0 0 14px #3a86ff;}50%{box-shadow:0 0 30px #b04dff;}}');
cssAdd('.clicker-ui.hidden{display:none!important;}');
cssAdd('#clicker-overlay{position:fixed;inset:0;z-index:9450;background:rgba(2,2,14,.9);display:flex;align-items:center;justify-content:center;font-family:Courier New,monospace;}');
cssAdd('#clicker-panel{width:min(1060px,96vw);height:min(640px,92vh);background:linear-gradient(160deg,#0b1026,#141a3a);border:2px solid #3a86ff;border-radius:18px;display:flex;overflow:hidden;}');
cssAdd('#clicker-left{flex:1.35;display:flex;flex-direction:column;align-items:center;padding:14px;gap:10px;min-width:0;}');
cssAdd('#clicker-right{width:300px;border-left:2px solid #26306a;background:rgba(0,0,20,.5);display:flex;flex-direction:column;}');
cssAdd('#clicker-right h3{margin:0;padding:10px;color:#9fb8ff;text-align:center;font-size:15px;border-bottom:1px solid #26306a;}');
cssAdd('#ck-uplist{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:6px;}');
cssAdd('.ck-up{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:7px 9px;border-radius:9px;background:#111634;border:1px solid #2b3672;color:#dfe6ff;font-size:12px;}');
cssAdd('.ck-up.can{border-color:#37e08a;}');
cssAdd('.ck-up.no{opacity:.55;}');
cssAdd('.ck-up button{background:#3a86ff;border:none;color:#fff;border-radius:6px;padding:4px 9px;cursor:pointer;font-family:inherit;font-weight:bold;}');
cssAdd('#ck-disc{position:relative;width:min(300px,44vw);height:min(300px,44vw);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .05s;}');
cssAdd('#ck-disc:active{transform:scale(.94);}');
cssAdd('#ck-disc-name{pointer-events:none;color:#fff;font-weight:bold;font-size:20px;text-align:center;text-shadow:0 0 12px #000;}');
cssAdd('#ck-prbar{width:86%;height:16px;border-radius:9px;background:#0a0f2a;border:1px solid #33407f;overflow:hidden;}');
cssAdd('#ck-prfill{height:100%;width:0%;background:linear-gradient(90deg,#37e08a,#3a86ff,#b04dff);transition:width .2s;}');
cssAdd('#ck-stats{color:#cfe0ff;font-size:14px;text-align:center;line-height:1.55;}');
cssAdd('.ck-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}');
cssAdd('.ck-actions button{font-family:inherit;font-weight:bold;border:none;border-radius:9px;padding:9px 14px;cursor:pointer;color:#fff;}');
cssAdd('#ck-shopbtn{background:linear-gradient(135deg,#c7921e,#8a5a00);}');
cssAdd('#ck-earthbtn{background:linear-gradient(135deg,#2e9e4f,#145a2a);}');
cssAdd('#ck-closebtn{background:#b3283c;}');
cssAdd('#ck-rebirth{background:linear-gradient(135deg,#b04dff,#5e12a8);}');
cssAdd('#ck-rebirth:disabled{opacity:.45;}');
cssAdd('.ck-float{position:absolute;pointer-events:none;color:#fff;font-weight:bold;font-size:20px;text-shadow:0 0 8px #3a86ff;animation:ckUp .8s forwards;}');
cssAdd('@keyframes ckUp{to{transform:translateY(-70px);opacity:0;}}');
cssAdd('#ck-shop{position:fixed;inset:0;z-index:9470;background:rgba(2,2,14,.85);display:flex;align-items:center;justify-content:center;font-family:Courier New,monospace;}');
cssAdd('#ck-shop-box{width:min(560px,94vw);background:linear-gradient(160deg,#141a3a,#0b1026);border:2px solid #c7921e;border-radius:16px;padding:18px;color:#fff;max-height:90vh;overflow-y:auto;}');
cssAdd('#ck-shop-box h2{margin:0 0 12px;text-align:center;color:#ffd76a;}');
cssAdd('.ck-shop-item{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#111634;border:1px solid #6e5a12;border-radius:11px;padding:12px;margin-bottom:10px;}');
cssAdd('.ck-shop-item.owned{border-color:#37e08a;}');
cssAdd('.ck-shop-item button{background:linear-gradient(135deg,#e0b23e,#8a5a00);border:none;border-radius:8px;padding:8px 12px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;}');
cssAdd('#ck-close-shop{width:100%;background:#b3283c;border:none;border-radius:9px;padding:10px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
cssAdd('#laser-fire-btn{position:fixed;left:18px;bottom:96px;z-index:9400;width:60px;height:60px;border-radius:50%;border:2px solid #ff5555;background:radial-gradient(circle,#ff2020,#7a0000);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 0 16px #ff2020;display:none;font-family:inherit;font-weight:bold;}');
cssAdd('#earth-exit-btn{position:fixed;top:16px;left:16px;z-index:9400;display:none;background:rgba(179,40,60,.9);border:1px solid #ff9aa8;color:#fff;border-radius:10px;padding:10px 16px;font-family:Courier New,monospace;font-weight:bold;cursor:pointer;}');
function el(tag, id, cls, txt) {
  var e = document.createElement(tag);
  if (id) e.id = id;
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}
var openBtn = el('button', 'clicker-open-btn', '', 'КЛИКЕР');
document.body.appendChild(openBtn);
var overlay = el('div', 'clicker-overlay', 'clicker-ui hidden');
var panel = el('div', 'clicker-panel');
var left = el('div', 'clicker-left');
var stats = el('div', 'ck-stats');
var disc = el('div', 'ck-disc');
var discName = el('div', 'ck-disc-name');
disc.appendChild(discName);
var prbar = el('div', 'ck-prbar');
var prfill = el('div', 'ck-prfill');
prbar.appendChild(prfill);
var actions = el('div', 'ck-actions');
var shopBtn = el('button', 'ck-shopbtn', '', 'МАГАЗИН');
var earthBtn = el('button', 'ck-earthbtn', '', 'НА ЗЕМЛЮ');
earthBtn.style.display = 'none';
var rebBtn = el('button', 'ck-rebirth', '', 'x2');
rebBtn.disabled = true;
var closeBtn = el('button', 'ck-closebtn', '', 'X');
actions.appendChild(shopBtn);
actions.appendChild(earthBtn);
actions.appendChild(rebBtn);
actions.appendChild(closeBtn);
left.appendChild(stats);
left.appendChild(disc);
left.appendChild(prbar);
left.appendChild(actions);
var right = el('div', 'clicker-right');
right.appendChild(el('h3', '', '', 'АПГРЕЙДЫ (100)'));
var uplist = el('div', 'ck-uplist');
right.appendChild(uplist);
panel.appendChild(left);
panel.appendChild(right);
overlay.appendChild(panel);
document.body.appendChild(overlay);
var shop = el('div', 'ck-shop', 'clicker-ui hidden');
var shopBox = el('div', 'ck-shop-box');
shopBox.appendChild(el('h2', '', '', 'МАГАЗИН ТЕМ'));
var itemLaser = el('div', 'ck-item-laser', 'ck-shop-item');
var laserInfo = el('div');
laserInfo.innerHTML = '<b>ЛАЗЕР</b><br><small>ПКМ на ПК или красная кнопка слева на телефоне</small>';
var laserRight = el('div');
laserRight.style.textAlign = 'right';
var laserCost = el('div', '', '', 'Цена: 100к');
var laserBuy = el('button', 'ck-buy-laser', '', 'КУПИТЬ');
laserRight.appendChild(laserCost);
laserRight.appendChild(laserBuy);
itemLaser.appendChild(laserInfo);
itemLaser.appendChild(laserRight);
shopBox.appendChild(itemLaser);
var itemEarth = el('div', 'ck-item-earth', 'ck-shop-item');
var earthInfo = el('div');
earthInfo.innerHTML = '<b>ЗЕМЛЯ: до нашей эры</b><br><small>Полетать по живой Земле: джунгли, динозавры, вулкан</small>';
var earthRight = el('div');
earthRight.style.textAlign = 'right';
var earthCost = el('div', '', '', 'Цена: 1кк');
var earthBuy = el('button', 'ck-buy-earth', '', 'КУПИТЬ');
earthRight.appendChild(earthCost);
earthRight.appendChild(earthBuy);
itemEarth.appendChild(earthInfo);
itemEarth.appendChild(earthRight);
shopBox.appendChild(itemEarth);
var closeShopBtn = el('button', 'ck-close-shop', '', 'ЗАКРЫТЬ');
shopBox.appendChild(closeShopBtn);
shop.appendChild(shopBox);
document.body.appendChild(shop);
var laserBtn = el('button', 'laser-fire-btn', '', 'ЛАЗЕР');
document.body.appendChild(laserBtn);
var earthExit = el('button', 'earth-exit-btn', '', 'Покинуть Землю');
document.body.appendChild(earthExit);
if (CK.laser) laserBtn.style.display = 'block';
var upRows = [];
var pendUp = false;
function scheduleUpg() {
  if (pendUp) return;
  pendUp = true;
  setTimeout(function () {
    pendUp = false;
    if (!overlay.classList.contains('hidden')) renderUpgrades();
  }, 350);
}
function render(forceUp) {
  var stg = ckStage();
  var cols = CK_COLS[stg];
  disc.style.background = 'radial-gradient(circle at 34% 30%, ' + cols[0] + ' 0%, ' + cols[1] + ' 52%, ' + cols[2] + ' 100%)';
  disc.style.boxShadow = '0 0 44px ' + cols[1] + ', inset -16px -20px 46px rgba(0,0,0,.65)';
  var nxt = CK_TH[stg + 1];
  var line = 'Цель: <b>' + CK_NAMES[stg] + '</b>';
  if (stg < 9) line += ' -> <b>' + CK_NAMES[stg + 1] + '</b> через ' + fmtNum(Math.max(0, nxt - CK.clicks));
  else line += ' - ФИНАЛ ВСЕЛЕННОЙ';
  line += '<br>Клик: <b>+' + fmtNum(ckPower()) + '</b> · Авто: <b>+' + fmtNum(ckCps()) + '/с</b> · x' + CK.mult;
  if (CK.rebirths) line += ' · Перерождений: ' + CK.rebirths;
  stats.innerHTML = line;
  discName.innerHTML = CK_NAMES[stg] + '<br><small>' + fmtNum(CK.clicks) + '</small>';
  if (stg < 9) {
    var prev = CK_TH[stg];
    prfill.style.width = Math.max(0, Math.min(100, (CK.clicks - prev) / (nxt - prev) * 100)).toFixed(1) + '%';
  } else {
    prfill.style.width = '100%';
  }
  rebBtn.disabled = CK.clicks < 1e14;
  rebBtn.textContent = CK.clicks >= 1e14 ? 'ПЕРЕРОДИТЬСЯ x2' : 'x2 (100кккк)';
  earthBtn.style.display = CK.earth ? '' : 'none';
  if (forceUp) renderUpgrades();
  else scheduleUpg();
}
(function initUpgrades() {
  for (var x = 0; x < 100; x++) {
    var u = CK_UPG[x];
    var row = el('div', '', 'ck-up no');
    var info = el('div');
    info.appendChild(el('b', '', '', u.name));
    var lvl = el('span', '', '', ' ур.0');
    lvl.style.color = '#8fa3e8';
    info.appendChild(lvl);
    info.appendChild(document.createElement('br'));
    var eff = el('small', '', '', '');
    info.appendChild(eff);
    var btn = el('button', '', '', '0');
    btn.setAttribute('data-buy', x);
    row.appendChild(info);
    row.appendChild(btn);
    uplist.appendChild(row);
    upRows.push({ row: row, lvl: lvl, eff: eff, btn: btn });
  }
})();
function renderUpgrades() {
  for (var x = 0; x < 100; x++) {
    var r = upRows[x];
    var u = CK_UPG[x];
    var cost = ckUpgCost(x);
    var can = CK.clicks >= cost;
    r.row.className = 'ck-up' + (can ? ' can' : ' no');
    r.lvl.textContent = ' ур.' + CK.lv[x];
    r.eff.textContent = '+' + fmtNum(u.val * CK.mult) + (u.type === 'auto' ? ' авто/с' : ' за клик');
    r.btn.textContent = fmtNum(cost);
    r.btn.disabled = !can;
  }
}
var floatCount = 0;
disc.addEventListener('click', function (ev) {
  var gain = ckPower();
  CK.clicks += gain;
  ckSave();
  render();
  try { disc.animate([{ transform: 'scale(1)' }, { transform: 'scale(.93)' }, { transform: 'scale(1)' }], { duration: 140 }); } catch (e) {}
  if (floatCount > 8) return;
  floatCount++;
  var f = el('div', '', 'ck-float', '+' + fmtNum(gain));
  f.style.left = (ev.clientX - 14) + 'px';
  f.style.top = (ev.clientY - 34) + 'px';
  overlay.appendChild(f);
  setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); floatCount--; }, 800);
});
uplist.addEventListener('click', function (ev) {
  var b = ev.target;
  while (b && b !== uplist && b.tagName !== 'BUTTON') b = b.parentNode;
  if (!b || b === uplist || !b.getAttribute) return;
  var idx = b.getAttribute('data-buy');
  if (idx === null) return;
  var x = parseInt(idx, 10);
  var cost = ckUpgCost(x);
  if (CK.clicks < cost) return;
  CK.clicks -= cost;
  CK.lv[x]++;
  ckSave();
  render(true);
});
openBtn.addEventListener('click', function () { overlay.classList.remove('hidden'); window.__uiPaused = true; render(true); });
closeBtn.addEventListener('click', function () { overlay.classList.add('hidden'); shop.classList.add('hidden'); window.__uiPaused = false; });
shopBtn.addEventListener('click', function () { shop.classList.remove('hidden'); renderShop(); });
closeShopBtn.addEventListener('click', function () { shop.classList.add('hidden'); });
rebBtn.addEventListener('click', function () {
  if (CK.clicks < 1e14) return;
  CK.mult *= 2;
  CK.rebirths++;
  CK.clicks = 0;
  CK.lv = [];
  for (var x = 0; x < 100; x++) CK.lv.push(0);
  ckSave();
  render(true);
});
function renderShop() {
  laserBuy.disabled = CK.laser || CK.clicks < 1e5;
  laserBuy.textContent = CK.laser ? 'КУПЛЕНО' : 'КУПИТЬ';
  itemLaser.className = 'ck-shop-item' + (CK.laser ? ' owned' : '');
  earthBuy.disabled = CK.earth || CK.clicks < 1e6;
  earthBuy.textContent = CK.earth ? 'КУПЛЕНО' : 'КУПИТЬ';
  itemEarth.className = 'ck-shop-item' + (CK.earth ? ' owned' : '');
}
laserBuy.addEventListener('click', function () {
  if (CK.laser || CK.clicks < 1e5) return;
  CK.clicks -= 1e5;
  CK.laser = true;
  ckSave();
  laserBtn.style.display = 'block';
  renderShop();
  render();
});
earthBuy.addEventListener('click', function () {
  if (CK.earth || CK.clicks < 1e6) return;
  CK.clicks -= 1e6;
  CK.earth = true;
  ckSave();
  renderShop();
  render();
});
earthBtn.addEventListener('click', function () {
  overlay.classList.add('hidden');
  shop.classList.add('hidden');
  window.__uiPaused = false;
  enterEarth();
});
setInterval(function () {
  var c = ckCps();
  if (c > 0) {
    CK.clicks += c;
    ckSave();
    if (!overlay.classList.contains('hidden')) render();
  }
}, 1000);
var beams = [];
function shootLaser(cx, cy) {
  mouse.x = (cx / window.innerWidth) * 2 - 1;
  mouse.y = -(cy / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var targets = planetHitMeshes.concat(statueHitboxes, [dragonHitbox, mwHitbox, bhCore, errorMesh, manHitbox, shipHitbox]);
  var hits = raycaster.intersectObjects(targets, false);
  var end = hits.length > 0 ? hits[0].point.clone() : raycaster.ray.at(900, new THREE.Vector3());
  var start = camera.position.clone();
  var dir = end.clone().sub(start);
  var len = Math.max(dir.length(), 0.001);
  var geo = new THREE.CylinderGeometry(0.35, 0.35, len, 6, 1, true);
  geo.translate(0, len / 2, 0);
  var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  mesh.position.copy(start);
  mesh.lookAt(end);
  mesh.rotateX(Math.PI / 2);
  scene.add(mesh);
  beams.push({ mesh: mesh, life: 1 });
}
laserBtn.addEventListener('click', function () { shootLaser(window.innerWidth / 2, window.innerHeight / 2); });
window.addEventListener('contextmenu', function (e) {
  if (!CK.laser) return;
  var t = e.target;
  if (t && t.closest && (t.closest('.clicker-ui') || t.closest('button') || t.closest('a') || t.closest('.card'))) return;
  e.preventDefault();
  shootLaser(e.clientX, e.clientY);
});
var earthMode = false;
var savedSpeed = null;
var earthRef = null;
var tmpV = new THREE.Vector3();
planets.forEach(function (p) { if (p.planet.userData && p.planet.userData.name === 'Земля') earthRef = p; });
var preGroup = new THREE.Group();
preGroup.visible = false;
var dinos = [];
var flyers = [];
if (earthRef) {
  earthRef.planet.add(preGroup);
  var gc = document.createElement('canvas');
  gc.width = 256;
  gc.height = 256;
  var gx = gc.getContext('2d');
  gx.fillStyle = '#3e7d32';
  gx.fillRect(0, 0, 256, 256);
  var gcols = ['#4c9440', '#35692c', '#5aa34a', '#2e5a26', '#6db35a'];
  for (var gi = 0; gi < 900; gi++) {
    gx.fillStyle = gcols[gi % 5];
    gx.fillRect(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 6, 2 + Math.random() * 5);
  }
  var gtex = new THREE.CanvasTexture(gc);
  gtex.magFilter = THREE.NearestFilter;
  preGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1.03, 48, 48), new THREE.MeshBasicMaterial({ map: gtex })));
  var trunkMat = new THREE.MeshBasicMaterial({ color: 0x6b4423 });
  var leafMat = new THREE.MeshBasicMaterial({ color: 0x2f9e44 });
  var palmMat = new THREE.MeshBasicMaterial({ color: 0x57b34a });
  function addOnSurface(obj) {
    var dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    obj.position.copy(dir).multiplyScalar(1.03);
    obj.lookAt(dir.clone().multiplyScalar(4));
    obj.rotateX(Math.PI / 2);
    preGroup.add(obj);
  }
  for (var ti = 0; ti < 26; ti++) {
    var tr = new THREE.Group();
    var h = 0.12 + Math.random() * 0.08;
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, h, 5), trunkMat);
    trunk.position.y = h / 2;
    tr.add(trunk);
    var crown = new THREE.Mesh(new THREE.ConeGeometry(0.05 + Math.random() * 0.03, 0.07 + Math.random() * 0.04, 6), Math.random() > 0.5 ? leafMat : palmMat);
    crown.position.y = h + 0.03;
    tr.add(crown);
    addOnSurface(tr);
  }
  var dcols = [0x4e7c3a, 0x6d5a3a, 0x3a6d5a, 0x7c5a4e, 0x55703a, 0x5a4e7c];
  for (var di = 0; di < 6; di++) {
    var d = new THREE.Group();
    var m = new THREE.MeshBasicMaterial({ color: dcols[di] });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.22), m);
    d.add(body);
    var neck = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.035), m);
    neck.position.set(0, 0.08, -0.1);
    d.add(neck);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.075), m);
    head.position.set(0, 0.15, -0.11);
    d.add(head);
    var tail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.16), m);
    tail.position.set(0, 0.005, 0.18);
    d.add(tail);
    for (var lx = -1; lx <= 1; lx += 2) {
      for (var lz = -1; lz <= 1; lz += 2) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.07, 0.03), m);
        leg.position.set(lx * 0.04, -0.065, lz * 0.065);
        d.add(leg);
      }
    }
    addOnSurface(d);
    dinos.push({ g: d, baseY: d.position.y, phase: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.004 });
  }
  var volcano = new THREE.Group();
  volcano.add(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 7), new THREE.MeshBasicMaterial({ color: 0x4a3a35 })));
  var vTop = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff4400 }));
  vTop.position.y = 0.07;
  volcano.add(vTop);
  addOnSurface(volcano);
  var flyMat = new THREE.MeshBasicMaterial({ color: 0x8a6d4a });
  for (var fi = 0; fi < 2; fi++) {
    var F = new THREE.Group();
    F.add(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.09), flyMat));
    var wl = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.008, 0.04), flyMat);
    wl.position.x = -0.07;
    F.add(wl);
    var wr = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.008, 0.04), flyMat);
    wr.position.x = 0.07;
    F.add(wr);
    preGroup.add(F);
    flyers.push({ g: F, wl: wl, wr: wr, a: Math.random() * 6.28, r: 1.25 + fi * 0.15, hh: 0.3 + fi * 0.12, spd: 0.004 + fi * 0.002, phase: fi * 3 });
  }
}
function enterEarth() {
  if (!CK.earth || !earthRef) return;
  earthMode = true;
  preGroup.visible = true;
  card.classList.add('hidden-ui');
  controls.autoRotate = false;
  controls.minDistance = 0.12;
  savedSpeed = earthRef.speed;
  earthRef.speed = 0;
  earthRef.planet.getWorldPosition(tmpV);
  camera.position.copy(tmpV).add(new THREE.Vector3(0.5, 0.7, 1.1));
  controls.target.copy(tmpV);
  controls.update();
  earthExit.style.display = 'block';
}
earthExit.addEventListener('click', function () {
  earthMode = false;
  preGroup.visible = false;
  if (earthRef && savedSpeed !== null) earthRef.speed = savedSpeed;
  controls.minDistance = 0;
  earthExit.style.display = 'none';
  resetCamera();
});
(function loop() {
  requestAnimationFrame(loop);
  for (var x = beams.length - 1; x >= 0; x--) {
    var b = beams[x];
    b.life -= 0.08;
    b.mesh.material.opacity = Math.max(b.life, 0) * 0.9;
    if (b.life <= 0) {
      scene.remove(b.mesh);
      b.mesh.geometry.dispose();
      b.mesh.material.dispose();
      beams.splice(x, 1);
    }
  }
  if (earthMode && earthRef) {
    earthRef.planet.getWorldPosition(tmpV);
    controls.target.lerp(tmpV, 0.25);
    dinos.forEach(function (D) {
      D.g.rotation.y += D.spin;
      D.g.position.y = D.baseY + Math.sin(Date.now() * 0.002 + D.phase) * 0.006;
    });
    flyers.forEach(function (F) {
      F.a += F.spd;
      F.g.position.set(Math.cos(F.a) * F.r, F.hh + Math.sin(Date.now() * 0.003 + F.phase) * 0.02, Math.sin(F.a) * F.r);
      F.g.rotation.y = -F.a;
      F.wl.rotation.z = Math.sin(Date.now() * 0.01 + F.phase) * 0.5;
      F.wr.rotation.z = -Math.sin(Date.now() * 0.01 + F.phase) * 0.5;
    });
  }
})();
var pstyle = document.createElement('style');
document.head.appendChild(pstyle);
function pcss(s) { pstyle.textContent += s; }
pcss('#clicker-overlay{background:radial-gradient(1200px 800px at 18% 8%,rgba(70,70,200,.22),transparent 60%),radial-gradient(1000px 700px at 85% 92%,rgba(190,60,230,.16),transparent 55%),rgba(3,4,18,.94);}');
pcss('#clicker-panel{border-radius:26px;border:1px solid rgba(140,170,255,.28);background:linear-gradient(160deg,#0d1230,#161d48);box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 90px rgba(80,110,255,.18);animation:ckPanelIn .5s cubic-bezier(.2,.9,.25,1.25);}');
pcss('@keyframes ckGrad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}');
pcss('@keyframes ckPanelIn{from{transform:scale(.9) translateY(26px);opacity:0}}');
pcss('#clicker-left,#clicker-right{position:relative;z-index:1;}');
pcss('#clicker-right h3{letter-spacing:3px;font-size:13px;color:#bfd2ff;text-shadow:0 0 12px rgba(120,170,255,.5);}');
pcss('.ck-actions button{border-radius:14px;padding:11px 18px;font-size:13px;letter-spacing:.6px;transition:transform .18s,box-shadow .18s,filter .18s;}');
pcss('.ck-actions button:hover{transform:translateY(-2px);filter:brightness(1.12);box-shadow:0 8px 24px rgba(80,120,255,.35);}');
pcss('.ck-actions button:active{transform:translateY(0) scale(.95);}');
pcss('#ck-closebtn{width:46px;height:46px;border-radius:50%;padding:0;font-size:14px;background:linear-gradient(135deg,#ff5f6d,#b3283c);}');
pcss('#ck-disc{width:min(320px,46vw);height:min(320px,46vw);}');
pcss('@keyframes ckFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}');
pcss('#ck-disc::before{content:\'\';position:absolute;inset:-14px;border-radius:50%;background:conic-gradient(from 0deg,rgba(90,140,255,0),rgba(120,160,255,.4),rgba(210,120,255,.4),rgba(90,140,255,0));animation:ckSpin 12s linear infinite;will-change:transform;}');
pcss('@keyframes ckSpin{to{transform:rotate(360deg)}}');
pcss('#ck-disc-name{position:relative;z-index:2;font-family:Segoe UI,system-ui,sans-serif;font-size:24px;letter-spacing:1px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.7));}');
pcss('#ck-prbar{height:20px;border-radius:12px;box-shadow:inset 0 2px 10px rgba(0,0,0,.75);}');
pcss('#ck-prfill{background:linear-gradient(90deg,#37e08a,#3a86ff,#b04dff);position:relative;overflow:hidden;}');
pcss('#ck-prfill::after{display:none;}');
pcss('#ck-stats{font-family:Segoe UI,system-ui,sans-serif;font-size:15px;letter-spacing:.3px;}');
pcss('#ck-stats b{text-shadow:0 0 12px rgba(130,180,255,.9);}');
pcss('.ck-float{font-family:Segoe UI,sans-serif;font-size:22px;animation:ckUp2 .9s cubic-bezier(.2,.8,.3,1) forwards;}');
pcss('@keyframes ckUp2{0%{transform:translateY(0) scale(.7);opacity:0}20%{opacity:1;transform:scale(1.15)}100%{transform:translateY(-95px) scale(1);opacity:0}}');
pcss('#clicker-open-btn{font-family:Segoe UI,system-ui,sans-serif;font-size:15px;font-weight:700;letter-spacing:2.5px;padding:16px 34px;border-radius:100px;color:#fff;background:linear-gradient(135deg,#5e17a5 0%,#7b2cbf 40%,#3a86ff 100%);border:1px solid rgba(160,190,255,.5);box-shadow:0 0 22px rgba(58,134,255,.5),0 12px 30px rgba(0,0,0,.5);overflow:hidden;transition:transform .2s;}');
pcss('#clicker-open-btn::after{content:\'\';position:absolute;inset:0;border-radius:100px;background:linear-gradient(180deg,rgba(255,255,255,.3),transparent 48%);pointer-events:none;}');
pcss('@keyframes ckBtnPulse{0%,100%{box-shadow:0 0 16px rgba(58,134,255,.45),0 10px 30px rgba(0,0,0,.5);}50%{box-shadow:0 0 34px rgba(160,90,255,.8),0 10px 30px rgba(0,0,0,.5);}}');
pcss('#clicker-open-btn:hover{transform:translateY(-3px) scale(1.03);}');
pcss('.ck-up{border-radius:14px;background:linear-gradient(135deg,rgba(22,28,64,.92),rgba(14,18,44,.92));transition:transform .18s,border-color .18s,box-shadow .18s;}');
pcss('.ck-up:hover{transform:translateX(5px);border-color:#6ea0ff;box-shadow:0 6px 18px rgba(60,100,255,.28);}');
pcss('.ck-up.can{border-color:rgba(55,224,138,.75);}');
pcss('.ck-up.can button{background:linear-gradient(135deg,#37e08a,#1d9d5f);box-shadow:0 0 12px rgba(55,224,138,.45);}');
pcss('.ck-up button{border-radius:9px;transition:filter .15s,transform .15s;}');
pcss('.ck-up button:hover{filter:brightness(1.15);}');
pcss('.ck-up button:active{transform:scale(.92);}');
pcss('#ck-uplist::-webkit-scrollbar{width:8px;}');
pcss('#ck-uplist::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#3a86ff,#b04dff);border-radius:8px;}');
pcss('#ck-uplist::-webkit-scrollbar-track{background:transparent;}');
pcss('#ck-shop-box{border-radius:22px;border:1px solid rgba(210,170,70,.45);box-shadow:0 30px 80px rgba(0,0,0,.7);animation:ckPanelIn .35s cubic-bezier(.2,.9,.25,1.15);}');
pcss('#ck-shop-box h2{letter-spacing:2.5px;background:linear-gradient(90deg,#ffd76a,#fff3bd,#ffd76a);-webkit-background-clip:text;background-clip:text;color:transparent;}');
pcss('.ck-shop-item{border-radius:14px;transition:transform .18s,border-color .18s;}');
pcss('.ck-shop-item:hover{transform:translateY(-2px);border-color:#e0b23e;}');
pcss('#ck-close-shop:hover{filter:brightness(1.15);}');
pcss('.ck-spark{position:fixed;pointer-events:none;width:9px;height:9px;border-radius:50%;background:radial-gradient(circle,#fff,#7db2ff 55%,transparent);z-index:9600;animation:ckSpark .7s ease-out forwards;}');
pcss('@keyframes ckSpark{to{transform:translate(var(--dx),var(--dy)) scale(.15);opacity:0}}');
pcss('.ck-orb{position:absolute;border-radius:50%;pointer-events:none;z-index:0;background:radial-gradient(circle,rgba(58,134,255,.16),transparent 70%);}');
pcss('.ck-orb.o1{width:260px;height:260px;top:-80px;left:-80px;}');
pcss('.ck-orb.o2{width:280px;height:280px;bottom:-100px;right:-90px;background:radial-gradient(circle,rgba(176,77,255,.14),transparent 70%);}');
pcss('.ck-orb.o3{width:220px;height:220px;top:38%;left:56%;background:radial-gradient(circle,rgba(0,212,255,.12),transparent 70%);}');
pcss('@keyframes ckOrb{0%,100%{transform:translate(0,0)}50%{transform:translate(46px,32px)}}');
pcss('@media(max-width:760px){#clicker-panel{flex-direction:column;height:94vh}#clicker-right{width:100%;border-left:none;border-top:2px solid #26306a;flex:1;min-height:0}#ck-disc{width:min(230px,52vw);height:min(230px,52vw)}}');
pcss('#laser-fire-btn{width:68px;height:68px;font-size:11px;font-weight:800;letter-spacing:1px;color:#fff;background:linear-gradient(145deg,#ff5252,#8f0000);border:2px solid rgba(255,150,150,.7);box-shadow:0 0 18px rgba(255,40,40,.6),0 8px 20px rgba(0,0,0,.45);transition:transform .18s;}');
pcss('#laser-fire-btn::after{content:\'\';position:absolute;inset:0;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,.3),transparent 50%);pointer-events:none;}');
pcss('#laser-fire-btn:hover{transform:translateY(-2px) scale(1.06);}');
pcss('#laser-fire-btn:active{transform:scale(.88);}');
pcss('@keyframes ckLaserPulse{0%,100%{box-shadow:0 0 14px rgba(255,40,40,.5),0 8px 20px rgba(0,0,0,.45);}50%{box-shadow:0 0 30px rgba(255,60,60,.95),0 8px 20px rgba(0,0,0,.45);}}');
pcss('#clicker-open-btn,#laser-fire-btn{will-change:transform;}');
var panelEl = document.getElementById('clicker-panel');
['o1', 'o2', 'o3'].forEach(function (c) { panelEl.appendChild(el('div', '', 'ck-orb ' + c)); });
// sparks removed for performance
var helpBtn = el('button', 'help-book-btn', '');
helpBtn.innerHTML = "<svg viewBox='0 0 24 24' width='28' height='28' fill='none' stroke='#ffe9a8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20'></path><path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'></path><path d='M9 7h7M9 11h5'></path></svg>";
var helpPanel = el('div', 'help-panel', 'hidden');
var hpMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
helpPanel.innerHTML = '<h3>УПРАВЛЕНИЕ</h3>'
  + (hpMobile
    ? '<div class=hp-sec><b>ТЕЛЕФОН</b><br>Вращение камеры - палец<br>Полёт - удержание пальцем<br>События - тап по объекту<br>Лазер - красная кнопка слева</div>'
    : '<div class=hp-sec><b>КОМПЬЮТЕР</b><br>Вращение камеры - мышь (ЛКМ)<br>Полёт - зажать ЛКМ или колесо<br>События - клик по объекту<br>Лазер - ПКМ (если куплен)</div>');
document.body.appendChild(helpBtn);
document.body.appendChild(helpPanel);
var helpOpen = false;
helpBtn.addEventListener('click', function () {
  helpOpen = !helpOpen;
  if (helpOpen) helpPanel.classList.remove('hidden');
  else helpPanel.classList.add('hidden');
});
function showHelpOnce() {
  if (helpOpen) return;
  helpOpen = true;
  helpPanel.classList.remove('hidden');
  clearTimeout(showHelpOnce._t);
  showHelpOnce._t = setTimeout(function () {
    helpOpen = false;
    helpPanel.classList.add('hidden');
  }, 5000);
}
var flyB = document.getElementById('fly-btn');
if (flyB) flyB.addEventListener('click', showHelpOnce);
var telB = document.getElementById('telescope-btn');
if (telB) telB.addEventListener('click', showHelpOnce);
var hstyle = document.createElement('style');
hstyle.textContent = '#help-book-btn{position:fixed;right:18px;bottom:18px;z-index:9400;width:58px;height:58px;border-radius:16px;border:1px solid rgba(160,190,255,.5);background:linear-gradient(145deg,#1b2452,#101532);color:#ffe9a8;font-size:26px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 16px rgba(90,130,255,.35);transition:transform .18s;}'
  + '#help-book-btn:hover{transform:translateY(-3px) scale(1.05);}'
  + '#help-book-btn:active{transform:scale(.9);}'
  + '#help-panel{position:fixed;right:18px;bottom:86px;z-index:9410;width:min(330px,88vw);max-height:70vh;overflow-y:auto;background:linear-gradient(160deg,#0d1230,#161d48);border:1px solid rgba(140,170,255,.35);border-radius:18px;padding:16px 18px;color:#dfe6ff;font-family:Segoe UI,sans-serif;font-size:13.5px;line-height:1.65;box-shadow:0 24px 60px rgba(0,0,0,.6);animation:hpIn .28s ease;}'
  + '#help-panel.hidden{display:none;}'
  + '#help-panel h3{margin:0 0 10px;text-align:center;letter-spacing:2px;color:#bfd2ff;font-size:14px;}'
  + '.hp-sec{background:rgba(10,14,38,.7);border:1px solid #26306a;border-radius:12px;padding:10px 12px;margin-bottom:10px;}'
  + '.hp-sec b{color:#8fc0ff;letter-spacing:1px;}'
  + '@keyframes hpIn{from{transform:translateY(14px) scale(.95);opacity:0}}';
document.head.appendChild(hstyle);
})();
