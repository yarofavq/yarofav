/* SPACE SETTINGS - pro edition */
(function () {
'use strict';
var KEY = 'spaceProSet_v1';
var DEF = {
  zsens: 50,
  smooth: 50,
  quality: 2, fx: true, mblur: false, vsync: true, fs: false,
  showStars: true, showHud: true, land: false,
  vol: 70, music: 50, sfx: 70, ui: 60
};
var S = {};
for (var k in DEF) S[k] = DEF[k];
try { var d = JSON.parse(localStorage.getItem(KEY)); if (d) for (var k2 in DEF) if (d[k2] !== undefined) S[k2] = d[k2]; } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
var st = document.createElement('style');
var C = [];
C.push('#spGear{position:fixed;top:14px;left:14px;z-index:9500;width:46px;height:46px;border-radius:8px;border:1px solid #2a2e36;background:#14161b;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color .15s}');
C.push('#spGear:hover{border-color:#4a7fb5}');
C.push('#spGear svg{display:block}');
C.push('#spPanel{position:fixed;top:66px;left:14px;z-index:9501;width:340px;max-height:calc(100vh - 90px);overflow-y:auto;background:rgba(16,18,23,.96);border:1px solid #2a2e36;border-radius:6px;color:#c8ccd4;font-family:Segoe UI,system-ui,sans-serif;font-size:13px;display:none;box-shadow:0 12px 40px rgba(0,0,0,.6)}');
C.push('#spPanel.open{display:block;animation:spF .16s ease}');
C.push('@keyframes spF{from{opacity:0;transform:translateY(-6px)}}');
C.push('#spPanel::-webkit-scrollbar{width:8px}');
C.push('#spPanel::-webkit-scrollbar-thumb{background:#2c3038;border-radius:0}');
C.push('.spH{padding:12px 16px 10px;border-bottom:1px solid #23262d;color:#eef1f5;font-size:12px;letter-spacing:2px;font-weight:600}');
C.push('.spSec{padding:10px 16px 2px;color:#5c8ab5;font-size:10px;letter-spacing:2px;text-transform:uppercase}');
C.push('.spRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px}');
C.push('.spRow:hover{background:rgba(255,255,255,.025)}');
C.push('.spRow label{flex:1;color:#b9bec7;font-size:12.5px}');
C.push('.spVal{width:34px;text-align:right;color:#7fb2e5;font-variant-numeric:tabular-nums;font-size:12px}');
C.push('.spR{-webkit-appearance:none;appearance:none;width:140px;height:3px;border-radius:0;background:#2c3038;outline:none;cursor:pointer}');
C.push('.spR::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:#7fb2e5;cursor:pointer;border:none}');
C.push('.spR::-moz-range-thumb{width:12px;height:12px;background:#7fb2e5;border:none;border-radius:0;cursor:pointer}');
C.push('.spSw{position:relative;width:34px;height:18px;background:#2c3038;cursor:pointer;transition:background .15s;flex-shrink:0}');
C.push('.spSw::after{content:"";position:absolute;top:3px;left:3px;width:12px;height:12px;background:#6b707a;transition:all .15s}');
C.push('.spSw.on{background:#2e4a66}');
C.push('.spSw.on::after{left:19px;background:#7fb2e5}');
C.push('.spBtn{flex:1;padding:9px 0;background:#1c1f26;border:1px solid #2a2e36;color:#c8ccd4;font-family:inherit;font-size:12px;cursor:pointer;transition:border-color .15s,color .15s}');
C.push('.spBtn:hover{border-color:#4a7fb5;color:#7fb2e5}');
C.push('#spApply{background:#2e4a66;border-color:#2e4a66;color:#fff}');
C.push('#spApply:hover{background:#3a5c80;border-color:#3a5c80;color:#fff}');
C.push('.spBtns{display:flex;gap:8px;padding:12px 16px 14px;border-top:1px solid #23262d;margin-top:8px}');
C.push('#spRot{position:fixed;inset:0;z-index:9700;background:rgba(6,7,10,.96);display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#c8ccd4;font-family:Segoe UI,sans-serif;font-size:14px;pointer-events:none}');
C.push('#spRot.show{display:flex}');
C.push('#spRotI{width:60px;height:100px;border:2px solid #7fb2e5;animation:spRR 2s ease-in-out infinite}');
C.push('@keyframes spRR{0%,25%{transform:rotate(0)}60%,100%{transform:rotate(90deg)}}');
st.textContent = C.join('');
document.head.appendChild(st);
function E(t, id, c, x) { var e = document.createElement(t); if (id) e.id = id; if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }
var gear = E('button', 'spGear');
gear.setAttribute('aria-label', 'Settings');
gear.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a9099" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
document.body.appendChild(gear);
var panel = E('div', 'spPanel');
panel.innerHTML = '<div class=spH>НАСТРОЙКИ</div><div id=spRows></div>';
document.body.appendChild(panel);
var rows = panel.querySelector('#spRows');
var rotH = E('div', 'spRot');
var ri = E('div'); ri.id = 'spRotI'; rotH.appendChild(ri);
rotH.appendChild(E('div', '', '', 'Поверните устройство горизонтально'));
document.body.appendChild(rotH);
function getC() { return window.__spCam; }
function getR() { return window.__spRend; }
var sliders = {};
var switches = {};
function sec(t) { rows.appendChild(E('div', '', 'spSec', t)); }
function addSlider(key, label, min, max) {
  var row = E('div', '', 'spRow');
  var l = E('label', '', '', label);
  var right = E('div');
  right.style.cssText = 'display:flex;align-items:center;gap:8px;';
  var r = document.createElement('input');
  r.type = 'range'; r.className = 'spR'; r.min = min; r.max = max; r.step = 1; r.value = S[key];
  var v = E('span', '', 'spVal', String(S[key]));
  function upd() {
    v.textContent = r.value;
    r.style.setProperty('--p', (((r.value - min) / (max - min)) * 100) + '%');
    r.style.background = 'linear-gradient(90deg,#3a5c80 ' + (((r.value - min) / (max - min)) * 100) + '%,#2c3038 ' + (((r.value - min) / (max - min)) * 100) + '%)';
  }
  upd();
  r.addEventListener('input', function () { S[key] = parseFloat(r.value); upd(); save(); apply(); });
  right.appendChild(r); right.appendChild(v);
  row.appendChild(l); row.appendChild(right);
  rows.appendChild(row);
  sliders[key] = r;
}
function addSwitch(key, label) {
  var row = E('div', '', 'spRow');
  var l = E('label', '', '', label);
  var t = E('div', '', 'spSw' + (S[key] ? ' on' : ''));
  t.addEventListener('click', function () {
    S[key] = !S[key];
    t.className = 'spSw' + (S[key] ? ' on' : '');
    save(); apply();
  });
  row.appendChild(l); row.appendChild(t);
  rows.appendChild(row);
  switches[key] = t;
}
function refresh() {
  for (var k in sliders) { sliders[k].value = S[k]; sliders[k].dispatchEvent(new Event('input')); }
  for (var k2 in switches) { switches[k2].className = 'spSw' + (S[k2] ? ' on' : ''); }
}
sec('Управление');
addSlider('zsens', 'Чувствительность зума', 1, 100);
addSlider('smooth', 'Сглаживание камеры', 1, 100);
sec('Графика');
var qRow = E('div', '', 'spRow');
var qL = E('label', '', '', 'Качество графики');
var qWrap = E('div');
qWrap.style.cssText = 'display:flex;gap:6px;';
var qBtns = [];
['Низкое', 'Среднее', 'Высокое', 'Ультра'].forEach(function (nm, idx) {
  var b = E('button', '', 'spBtn', nm);
  b.style.cssText = 'margin:0;width:auto;padding:6px 10px;font-size:11px;font-weight:400;';
  function paint() { b.style.borderColor = (S.quality === idx + 1) ? '#7fb2e5' : '#2a2e36'; b.style.color = (S.quality === idx + 1) ? '#7fb2e5' : '#c8ccd4'; }
  paint();
  b.addEventListener('click', function () { S.quality = idx + 1; save(); qBtns.forEach(function (q) { q._p(); }); apply(); });
  b._p = paint;
  qBtns.push(b);
  qWrap.appendChild(b);
});
qRow.appendChild(qL); qRow.appendChild(qWrap);
rows.appendChild(qRow);
addSwitch('showStars', 'Показывать звёзды');
addSwitch('fx', 'Эффекты');
addSwitch('mblur', 'Motion Blur');
addSwitch('vsync', 'VSync');
addSwitch('fs', 'Полноэкранный режим');
sec('Звук');
addSlider('vol', 'Общая громкость', 0, 100);
addSlider('music', 'Музыка', 0, 100);
addSlider('sfx', 'Звуковые эффекты', 0, 100);
addSlider('ui', 'Громкость интерфейса', 0, 100);
if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  sec('Телефон');
  addSwitch('land', 'Горизонтальный режим');
}
function apply() {
  try {
    var c = window.__spCam;
    if (c) {
      c.zoomSpeed = 0.2 + S.zsens / 45;
      c.enableDamping = true;
      c.dampingFactor = 0.02 + (100 - S.smooth) * 0.0009;
    }
    var r = window.__spRend;
    if (r) r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * [0.45, 0.7, 0.9, 1][S.quality - 1]);
    var stv = window.__spStars;
    if (stv) {
      stv.visible = S.showStars !== false;
      var dens = [0.25, 0.5, 0.8, 1][S.quality - 1];
      if (stv.geometry && stv.geometry.setDrawRange) stv.geometry.setDrawRange(0, Math.floor(15000 * dens));
    }
    if (window.__spRain) window.__spRain.visible = S.fx;

  } catch (e) {}
}

var fsT = switches.fs;
fsT.addEventListener('click', function () {
  setTimeout(function () {
    var d = document.documentElement;
    if (S.fs && !document.fullscreenElement) { if (d.requestFullscreen) d.requestFullscreen(); }
    else if (!S.fs && document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
  }, 60);
});
var fsB = E('button', '', 'spBtn', 'На весь экран');
fsB.style.margin = '12px 16px 0';
fsB.style.width = 'auto';
fsB.addEventListener('click', function () {
  var d = document.documentElement;
  if (!document.fullscreenElement) { if (d.requestFullscreen) d.requestFullscreen(); }
  else { if (document.exitFullscreen) document.exitFullscreen(); }
});
panel.appendChild(fsB);
var btns = E('div', '', 'spBtns');
var ap = E('button', 'spApply', 'spBtn', 'Применить');
ap.addEventListener('click', function () { apply(); save(); });
var rs = E('button', '', 'spBtn', 'Сбросить');
rs.addEventListener('click', function () { for (var k in DEF) S[k] = DEF[k]; save(); refresh(); apply(); });
var cl = E('button', '', 'spBtn', 'Закрыть');
cl.addEventListener('click', function () { panel.classList.remove('open'); });
btns.appendChild(ap); btns.appendChild(rs); btns.appendChild(cl);
panel.appendChild(btns);
gear.addEventListener('click', function () { panel.classList.toggle('open'); apply(); });
setInterval(function () {
  var mob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  rotH.className = (mob && S.land && window.innerHeight > window.innerWidth) ? 'show' : '';
}, 600);
var hud = E('div', 'spHud', '', '');
hud.style.display = 'none';
hud.style.cssText = 'position:fixed;top:14px;right:14px;z-index:9300;color:#9fd0ff;font-family:Consolas,monospace;font-size:12px;background:rgba(10,10,14,.55);border:1px solid #2a2e36;padding:5px 9px;pointer-events:none;display:none;white-space:pre;';
document.body.appendChild(hud);
setInterval(function () {
  var t0 = performance.now();
  fetch(location.pathname + '?ping=' + Date.now(), { method: 'HEAD', cache: 'no-store' }).then(function () { window.__ping = Math.round(performance.now() - t0); }).catch(function () { window.__ping = -1; });
}, 4000);
var frames = 0, lastT = performance.now();
(function fpsLoop() {
  requestAnimationFrame(fpsLoop);
  frames++;
  var now = performance.now();
  if (now - lastT >= 1000) {
    var fps = Math.round(frames * 1000 / (now - lastT));
    frames = 0; lastT = now;
    var ping = (typeof window.__ping === 'number' && window.__ping >= 0) ? window.__ping : '-';
    hud.textContent = 'FPS ' + fps + ' | ping ' + ping + ' ms';
  }
})();
apply();
window.__spSetReady = true;
console.log('[settings] ready');
})();
