// ==================== PLANET CLICKER MODULE ====================
(function () {
'use strict';
var CK_TRACKS = [
  { f: 'clicker-music-1.mp3', n: 'Longing for AIR' },
  { f: 'clicker-music-2.mp3', n: '8-Twelve' },
  { f: 'clicker-music-3.mp3', n: 'Finesse - Nico\u2019s Nextbots' },
  { f: 'clicker-music-4.mp3', n: 'Safe Room' },
  { f: 'clicker-music-5.mp3', n: 'Outta Luck' },
  { f: 'clicker-music-6.mp3', n: 'Menu (In-Game)' },
  { f: 'clicker-music-7.mp3', n: 'Tonka 2' },
  { f: 'clicker-music-8.mp3', n: 'Антикобыла - daybe' },
  { f: 'clicker-music-9.mp3', n: 'Полка, YASMI - Омут' }
];
var CK_MUSIC_KEY = 'spaceClicker_music';
var CK_MVOL_KEY = 'spaceClicker_mvol';
var CK_TRACK_KEY = 'spaceClicker_track';
var ckAudio = null;
var ckMusicOn = true;
var ckMusicVol = 0.5;
var ckTrack = 0;
var ckFx = null;
try { var _mv = localStorage.getItem(CK_MUSIC_KEY); if (_mv !== null) ckMusicOn = (_mv === '1'); } catch (e) {}
try { var _vv = parseFloat(localStorage.getItem(CK_MVOL_KEY)); if (!isNaN(_vv)) ckMusicVol = Math.max(0, Math.min(1, _vv / 100)); } catch (e) {}
try { var _tv = parseInt(localStorage.getItem(CK_TRACK_KEY), 10); if (!isNaN(_tv) && _tv >= 0 && _tv < CK_TRACKS.length) ckTrack = _tv; } catch (e) {}
// подтянуть громкость музыки из настроек сайта (settings.js), если они есть
(function () {
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf('spaceClicker') === 0) continue;
      var v = JSON.parse(localStorage.getItem(k) || 'null');
      if (v && typeof v === 'object' && typeof v.music === 'number' && typeof v.vol === 'number') {
        var lv = (v.music / 100) * (v.vol / 100);
        if (lv > 0) { ckMusicVol = Math.max(0, Math.min(1, lv)); break; }
      }
    }
  } catch (e) {}
})();
function ckAudioInit() {
  if (ckAudio) return ckAudio;
  ckAudio = new Audio();
  ckAudio.loop = true;
  ckAudio.preload = 'auto';
  ckAudio.volume = ckMusicVol;
  ckAudio.src = CK_TRACKS[ckTrack].f;
  return ckAudio;
}
function ckMediaSync() {
  if (ckMedia && ckMedia.tagName === 'VIDEO') { if (ckMusicOn) { try { ckMedia.play(); } catch (e7) {} } else { try { ckMedia.pause(); } catch (e7) {} } }
  var wl0 = document.getElementById('ck-mediabox');
  if (wl0 && wl0.className.indexOf('ck-wave') !== -1) wl0.className = 'ck-wave' + (ckMusicOn ? ' on' : '');
}
function ckMusicPlay() {
  if (!ckMusicOn) return;
  var a = ckAudioInit();
  var pr = a.play();
  if (pr && pr.catch) pr.catch(function () {});
  ckMediaSync();
}
function ckMusicPause() { if (ckAudio) ckAudio.pause(); ckMediaSync(); }
function ckMusicSync() {
  var nm = document.getElementById('ck-track-name');
  if (nm) { nm.textContent = CK_TRACKS[ckTrack].n; if (ckTrackPaint) ckTrackPaint(); }
  var nu = document.getElementById('ck-track-num');
  if (nu) nu.textContent = (ckTrack + 1) + '/' + CK_TRACKS.length;
  var pb = document.getElementById('ck-play');
  if (pb) { pb.textContent = ckMusicOn ? 'II' : '\u25B6'; pb.className = 'ck-mbtn ck-play' + (ckMusicOn ? ' on' : ''); }
}
function ckTrackSet(i, keepPaused) {
  if (i < 0) i = CK_TRACKS.length - 1;
  if (i >= CK_TRACKS.length) i = 0;
  ckTrack = i;
  try { localStorage.setItem(CK_TRACK_KEY, String(i)); } catch (e) {}
  if (ckMediaSync && ckBuildMedia) { try { ckBuildMedia(); } catch (e9) {} }
  var a = ckAudioInit();
  a.src = CK_TRACKS[i].f;
  a.volume = ckMusicVol;
  try { a.load(); } catch (e) {}
  ckMusicSync();
  if (ckMusicOn && !keepPaused) ckMusicPlay();
}
function ckTrackNext() { ckTrackSet(ckTrack + 1); }
function ckTrackPrev() { ckTrackSet(ckTrack - 1); }
/* --- ЗВУКИ (WebAudio, без файлов) --- */
function ckFxCtx() {
  if (ckFx) return ckFx;
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ckFx = new AC();
  } catch (e) {}
  return ckFx;
}
function ckBeep(freq, dur, type, gain, slideTo) {
  var ctx = ckFxCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
  var o = ctx.createOscillator();
  var g = ctx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime((gain || 0.12), ctx.currentTime + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + dur + 0.02);
}
function sfxClick() { ckBeep(620, 0.07, 'triangle', 0.13, 880); }
function sfxBuy() {
  ckBeep(520, 0.09, 'square', 0.09, 780);
  setTimeout(function () { ckBeep(880, 0.12, 'triangle', 0.11, 1180); }, 70);
}
function sfxRebirth() { ckBeep(300, 0.4, 'sawtooth', 0.09, 1400); }
// пауза в фоне, возобновление при возврате
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { ckMusicPause(); }
  else if (ckMusicOn && ckAudio && ckAudio.paused && !overlay.classList.contains('hidden')) { ckMusicPlay(); }
});
var CK_KEY = 'spaceClicker_v1';
var CK_TH = [0, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e11, 1e12];
var CK_ITEMS = [
  { id: 'shard', n: 'Осколок', col: '#9fb8ff', rar: 'Common',    w: 60 },
  { id: 'core',  n: 'Ядро',    col: '#37e08a', rar: 'Rare',      w: 25 },
  { id: 'prism', n: 'Призма',  col: '#b04dff', rar: 'Epic',      w: 10 },
  { id: 'nova',  n: 'Нова',    col: '#ffd23f', rar: 'Legendary', w: 4 },
  { id: 'void',  n: 'Пустота', col: '#ff4d6d', rar: 'Mythic',    w: 1 }
];
var CK_DROP_CHANCE = 0.0005;
var CK_BOOST_EVERY = 500;
var CK_BOOST_MAX = 3600;
var CK_BOOSTS = [
  { id: 'frenzy', n: 'Click Frenzy', col: '#ff4d6d', dur: 60,   mult: 5, tgt: 'click', price: 2.5e11, desc: 'x5 за клик' },
  { id: 'surge',  n: 'Auto Surge',   col: '#3a86ff', dur: 1800, mult: 3, tgt: 'auto',  price: 7.5e11, desc: 'x3 авто/с' },
  { id: 'gold',   n: 'Gold Rush',    col: '#ffd23f', dur: 3600, mult: 2, tgt: 'all',   price: 5e12, desc: 'x2 ко всему' }
  ,
  { id: 'novaflask', n: 'Nova Flask', col: '#7fd4ff', dur: 300, mult: 4, tgt: 'click', price: 2e12, desc: 'x4 за клик' },
  { id: 'quasar', n: 'Quasar Brew', col: '#37e08a', dur: 900, mult: 4, tgt: 'auto', price: 4e12, desc: 'x4 авто/с' },
  { id: 'hyperion', n: 'Hyperion Draft', col: '#b04dff', dur: 1200, mult: 3, tgt: 'all', price: 2e13, desc: 'x3 ко всему' },
  { id: 'voidflask', n: 'Void Elixir', col: '#ff4d6d', dur: 120, mult: 10, tgt: 'click', price: 1e13, desc: 'x10 за клик' }
];
function ckItemById(id) { for (var i = 0; i < CK_ITEMS.length; i++) if (CK_ITEMS[i].id === id) return CK_ITEMS[i]; return null; }
function ckBoostById(id) { for (var i = 0; i < CK_BOOSTS.length; i++) if (CK_BOOSTS[i].id === id) return CK_BOOSTS[i]; return null; }
function ckRollItem() {
  var tot = 0, i;
  for (i = 0; i < CK_ITEMS.length; i++) tot += CK_ITEMS[i].w;
  var r = Math.random() * tot;
  for (i = 0; i < CK_ITEMS.length; i++) { r -= CK_ITEMS[i].w; if (r <= 0) return CK_ITEMS[i]; }
  return CK_ITEMS[0];
}
function ckBoostGrant(id, sec) {
  var b = ckBoostById(id);
  if (!b) return false;
  var xb, bon = 0;
  for (xb = 300; xb < 360; xb += 2) bon += CK_UPG[xb].val * CK.lv[xb];
  sec = Math.max(1, Math.min((sec || b.dur) + bon, CK_BOOST_MAX));
  var now = Date.now();
  var cur = (CK.boost[id] > now) ? CK.boost[id] : now;
  CK.boost[id] = Math.min(cur + sec * 1000, now + CK_BOOST_MAX * 1000);
  return true;
}
function ckBoostMul(tgt) {
  var m = 1, now = Date.now();
  for (var i = 0; i < CK_BOOSTS.length; i++) {
    var b = CK_BOOSTS[i];
    if ((b.tgt === tgt || b.tgt === 'all') && CK.boost[b.id] > now) m *= b.mult;
  }
  return m;
}
function ckBoostPrune() {
  var now = Date.now(), ch = 0;
  for (var i = 0; i < CK_BOOSTS.length; i++) {
    var id = CK_BOOSTS[i].id;
    if (CK.boost[id] && CK.boost[id] <= now) { delete CK.boost[id]; ch++; }
  }
  return ch;
}
function ckFmtTime(s) {
  s = Math.max(0, Math.round(s));
  if (s >= 3600) return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
  if (s >= 60) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
  return s + 's';
}
function ckManualClick() {
  var ev = [];
  CK.mc = (CK.mc || 0) + 1;
  if (CK.mc % CK_BOOST_EVERY === 0) {
    var b = CK_BOOSTS[Math.floor(Math.random() * CK_BOOSTS.length)];
    ckBoostGrant(b.id, b.dur);
    ev.push('BOOST:' + b.id);
  }
  var dch = CK_DROP_CHANCE, xd;
  for (xd = 301; xd < 360; xd += 2) dch += CK_UPG[xd].val * CK.lv[xd];
  if (Math.random() < Math.min(dch, 0.05)) {
    var it = ckRollItem();
    if (CK.inv.length < 2000) CK.inv.push(it.id);
    ev.push('DROP:' + it.id);
  }
  return ev;
}
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
var CK = { clicks: 0, mult: 1, rebirths: 0, lv: [], laser: false, earth: false, gold: false, critM: false, warp: false, boost: {}, inv: [], mc: 0 };
var CK_UPG = [];
var i;
for (i = 0; i < 360; i++) CK.lv.push(0);
for (i = 0; i < 100; i++) {
  if (i % 2 === 0) CK_UPG.push({ name: 'Авто-дрон ' + (i / 2 + 1), type: 'auto', val: Math.max(1, Math.round(Math.pow(2.2, i / 2))), base: Math.ceil(100 * Math.pow(1.75, i)) });
  else CK_UPG.push({ name: 'Усилитель ' + Math.ceil(i / 2), type: 'power', val: Math.max(1, Math.round(Math.pow(2.2, (i - 1) / 2))), base: Math.ceil(100 * Math.pow(1.75, i)) });
}
for (i = 100; i < 200; i++) {
  if (i % 2 === 0) CK_UPG.push({ name: 'Crit Chip ' + ((i - 100) / 2 + 1), type: 'crit', val: 1 + Math.round((i - 100) / 2 * 0.7), base: Math.ceil(1e6 * Math.pow(2.6, i - 100)) });
  else CK_UPG.push({ name: 'Gold Reactor ' + Math.ceil((i - 100) / 2), type: 'gold', val: 1 + Math.round((i - 101) / 2 * 0.5), base: Math.ceil(2e6 * Math.pow(2.6, i - 101)) });
}
for (i = 200; i < 300; i++) {
  if (i % 2 === 0) CK_UPG.push({ name: 'Crit Amp ' + ((i - 200) / 2 + 1), type: 'critx', val: 1, base: Math.ceil(1e12 * Math.pow(3.2, i - 200)) });
  else CK_UPG.push({ name: 'Mega Core ' + Math.ceil((i - 200) / 2), type: 'mega', val: 2 + Math.round((i - 201) / 2), base: Math.ceil(2e12 * Math.pow(3.2, i - 201)) });
}
for (i = 300; i < 360; i++) {
  if (i % 2 === 0) CK_UPG.push({ name: 'Хронизатор ' + ((i - 300) / 2 + 1), type: 'boost', val: 30, base: Math.ceil(1e13 * Math.pow(3.0, i - 300)) });
  else CK_UPG.push({ name: 'Гравиконденсатор ' + Math.ceil((i - 300) / 2), type: 'drop', val: 0.0002, base: Math.ceil(2e13 * Math.pow(3.0, i - 301)) });
}
function ckUpgCost(x) { return Math.ceil(CK_UPG[x].base * Math.pow(1.45, CK.lv[x])); }
function ckGold() { var s = 0; for (var x = 101; x < 200; x += 2) s += CK_UPG[x].val * CK.lv[x]; var ex = window.__CKEX; return s + (CK.gold ? 50 : 0) + (ex && ex.idol ? 50 : 0) + (ex && ex.forge ? 25 : 0); }
function ckMega() { var s = 0; for (var x = 201; x < 300; x += 2) s += CK_UPG[x].val * CK.lv[x]; return s; }
function ckGoldMul() { var ex = window.__CKEX; var cs = (ex && ex.craft) ? ((ex.craft.s || 0) + (ex.craft.g || 0) * 5 + (ex.craft.v || 0) * 10) : 0; return 1 + (ckGold() + ckMega() + cs) / 100; }
function ckCps() { var s = 0, x; for (x = 0; x < 100; x += 2) s += CK_UPG[x].val * CK.lv[x]; return s * CK.mult * ckGoldMul() * ckBoostMul('auto'); }
function ckPower() { var s = 1, x; for (x = 1; x < 100; x += 2) s += CK_UPG[x].val * CK.lv[x]; return s * CK.mult * ckGoldMul() * ckBoostMul('click'); }
function ckCrit() { var s = 5; for (var x = 100; x < 200; x += 2) s += CK_UPG[x].val * CK.lv[x]; var ex = window.__CKEX; return Math.min(85, s + (CK.critM ? 15 : 0) + (ex && ex.nexus ? 10 : 0) + (ex && ex.craft ? (ex.craft.c || 0) * 2 : 0)); }
function ckCritMul() { var s = 5, l; for (var x = 200; x < 300; x += 2) { l = CK.lv[x]; if (l > 0) s += 1 + Math.round((l - 1) * 10) / 10; } var ex = window.__CKEX; return s + (ex && ex.craft ? (ex.craft.m || 0) : 0); }
function ckStage() { var s = 0; for (var x = 0; x < CK_TH.length; x++) if (CK.clicks >= CK_TH[x]) s = x; return s; }
function fmtNum(n) {
  n = Math.floor(n);
  if (n < 1000) return '' + n;
  var u = [[1e18, 'Qi'], [1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (var x = 0; x < u.length; x++) {
    if (n >= u[x][0]) {
      var v = n / u[x][0];
      var t = v >= 100 ? v.toFixed(0) : (v >= 10 ? v.toFixed(1) : v.toFixed(2));
      return parseFloat(t) + u[x][1];
    }
  }
  return '' + n;
}
var CK_LB = 'spaceClicker_lb_v2';
var CK_OFFLINE_RATE = 0.5;
var CK_OFFLINE_CAP = 8 * 3600;
var ckOfflineGain = 0;
var ckLbStamp = 0;
function ckNick() {
  var rn = '';
  try { rn = localStorage.getItem('spaceClicker_nick') || ''; } catch (e) {}
  if (rn) return rn;
  var n = '';
  try { n = sessionStorage.getItem('spaceChatNick') || ''; } catch (e) {}
  if (!n) { try { n = localStorage.getItem('spaceChatNick') || ''; } catch (e) {} }
  n = String(n || '').slice(0, 16);
  return n || 'Гость';
}
function ckEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function ckLbPush(force) {
  var t = Date.now();
  if (!force && t - ckLbStamp < 8000) return;
  ckLbStamp = t;
  try {
    var all = JSON.parse(localStorage.getItem(CK_LB) || '{}');
    var k = ckNick();
    var me = all[k] || { best: 0, stage: 0, rebirths: 0 };
    var st = ckStage();
    if (CK.clicks > (me.best || 0)) me.best = CK.clicks;
    if (st > (me.stage || 0)) me.stage = st;
    if ((CK.rebirths || 0) > (me.rebirths || 0)) me.rebirths = CK.rebirths;
    me.ts = t;
    all[k] = me;
    localStorage.setItem(CK_LB, JSON.stringify(all));
  } catch (e) {}
}
function ckLbList() {
  var all = {}, arr = [], k;
  try { all = JSON.parse(localStorage.getItem(CK_LB) || '{}'); } catch (e) {}
  for (k in all) if (Object.prototype.hasOwnProperty.call(all, k)) {
    arr.push({ nick: k, best: all[k].best || 0, stage: all[k].stage || 0, rebirths: all[k].rebirths || 0 });
  }
  arr.sort(function (a, b) { return b.best - a.best; });
  return arr.slice(0, 10);
}
function ckSave() {
  try { if (window.__CKSYNC) window.__CKSYNC(); } catch (e0) {}
  try {
    localStorage.setItem(CK_KEY, JSON.stringify({
      v: 1, clicks: CK.clicks, mult: CK.mult, rebirths: CK.rebirths,
      lv: CK.lv, laser: CK.laser, earth: CK.earth, gold: CK.gold, critM: CK.critM, warp: CK.warp, boost: CK.boost, inv: CK.inv, mc: CK.mc, offVault: !!CK.offVault, ts: Date.now()
    }));
  } catch (e) {}
  ckLbPush(false);
}
function ckLoad() {
  var raw = null;
  try { raw = JSON.parse(localStorage.getItem(CK_KEY) || 'null'); } catch (e) {}
  if (!raw || typeof raw !== 'object') return;
  CK.clicks = Number(raw.clicks) || 0;
  CK.mult = Number(raw.mult) || 1;
  CK.rebirths = Number(raw.rebirths) || 0;
  CK.laser = !!raw.laser;
  CK.earth = !!raw.earth;
  CK.gold = !!raw.gold;
  CK.critM = !!raw.critM;
  CK.warp = !!raw.warp;
  CK.boost = (raw.boost && typeof raw.boost === 'object') ? raw.boost : {};
  CK.inv = (raw.inv && raw.inv.length) ? raw.inv.slice(0, 2000) : [];
  CK.mc = Number(raw.mc) || 0;
  CK.offVault = !!raw.offVault;
  if (raw.lv && raw.lv.length) {
    for (var x = 0; x < 360 && x < raw.lv.length; x++) CK.lv[x] = Number(raw.lv[x]) || 0;
  }
  var dt = Math.max(0, (Date.now() - (Number(raw.ts) || Date.now())) / 1000);
  if (dt > 60) {
    var gain = ckCps() * Math.min(dt, CK.offVault ? 86400 : CK_OFFLINE_CAP) * (CK.warp ? 1 : CK_OFFLINE_RATE);
    if (gain >= 1) { CK.clicks += gain; ckOfflineGain = gain; }
  }
}
ckLoad();
window.__CKAPI = { CK: CK, CK_UPG: CK_UPG, ckSave: ckSave, ckNick: ckNick, ckStage: ckStage, render: render, renderShop: renderShop, cssAdd: cssAdd, fmtNum: fmtNum, sfxBuy: sfxBuy, sfxRebirth: sfxRebirth, ckToast: ckToast, ckInvRender: ckInvRender, ckUpgCost: ckUpgCost, ckLbPush: ckLbPush, ckLbList: ckLbList };
window.addEventListener('beforeunload', function () { ckSave(); ckLbPush(true); });
document.addEventListener('visibilitychange', function () { if (document.hidden) { ckSave(); ckLbPush(true); } });
setInterval(function () { ckSave(); ckLbPush(true); }, 10000);
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
cssAdd('.ck-up.aut{border-left:3px solid #ff9f43;background:linear-gradient(90deg,rgba(255,159,67,.10),#111634 55%);}');
cssAdd('.ck-up{min-height:44px;box-sizing:border-box;}');
cssAdd('.ck-up b{display:inline-block;max-width:168px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom;}');
cssAdd('.ck-up button{flex:none;width:78px;text-align:center;padding:4px 0;}');
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
cssAdd('.ck-float.crit{color:#ffd23f;font-size:21px;text-shadow:0 0 10px #ffb700;}');
cssAdd('.ck-tabs{display:flex;gap:6px;padding:8px 8px 0;flex-wrap:wrap;}');
cssAdd('.ck-tab{flex:1;padding:8px 6px;border:1px solid #2b3672;border-radius:9px;background:#111634;color:#8fa3e8;font-family:inherit;font-weight:bold;font-size:12px;cursor:pointer;min-width:86px;}');
cssAdd('.ck-tab.on{background:linear-gradient(135deg,#3a86ff,#7b2cbf);color:#fff;border-color:#3a86ff;}');
cssAdd('#ck-autop{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 8px 0;}');
cssAdd('.ck-apbtn{flex:1;min-width:110px;padding:7px 8px;border:1px solid #2b3672;border-radius:9px;background:#111634;color:#8fa3e8;font-family:inherit;font-weight:bold;font-size:11px;cursor:pointer;}');
cssAdd('.ck-apbtn.on{background:linear-gradient(135deg,#1f9d55,#0e5c2f);color:#fff;border-color:#37e08a;}');
cssAdd('.ck-apin{width:120px;padding:7px 8px;border:1px solid #2b3672;border-radius:9px;background:#0b1026;color:#fff;font-family:inherit;font-size:12px;}');
cssAdd('.ck-setp{padding:10px 8px;overflow-y:auto;}');
cssAdd('.ck-seth{color:#ffd76a;font-weight:bold;font-size:13px;letter-spacing:1px;margin:4px 0 10px;}');
cssAdd('.ck-setrow{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;}');
cssAdd('.ck-setl{color:#8fa3e8;font-size:12px;min-width:130px;}');
cssAdd('.ck-setr{flex:1;min-width:120px;}');
cssAdd('.ck-swot{width:26px;height:26px;border:2px solid #2b3672;border-radius:7px;cursor:pointer;padding:0;}');
cssAdd('.ck-swot.on{border-color:#ffd76a;}');
cssAdd('.apb-buy.on{background:linear-gradient(135deg,#ffb057,#c76b00);border-color:#ffb057;box-shadow:0 0 12px rgba(255,150,60,.45);}');
cssAdd('.apb-scl.on{background:linear-gradient(135deg,#35d0ee,#0b6e93);border-color:#35d0ee;box-shadow:0 0 12px rgba(60,190,230,.45);}');
cssAdd('.apb-lb.on{background:linear-gradient(135deg,#5eead4,#2563eb);border-color:#5eead4;box-shadow:0 0 12px rgba(90,200,255,.45);}');
cssAdd('.apb-mg.on{background:linear-gradient(135deg,#d68cff,#8b2fd6);border-color:#d68cff;box-shadow:0 0 12px rgba(200,120,255,.5);}');
cssAdd('.apb-gr.on{background:linear-gradient(135deg,#7bed9f,#1d9d5f);border-color:#7bed9f;box-shadow:0 0 12px rgba(90,230,140,.45);}');
cssAdd('.apb-rb.on{background:linear-gradient(135deg,#ff5e7e,#a3123a);border-color:#ff5e7e;box-shadow:0 0 12px rgba(255,95,125,.5);}');
cssAdd('.apb-am.on{background:linear-gradient(135deg,#ff8a3d,#b31212);border-color:#ff8a3d;box-shadow:0 0 12px rgba(255,120,60,.55);}');
cssAdd('#ck-superreb{background:linear-gradient(135deg,#ff4d6d,#ffd23f 50%,#ff4d6d);background-size:200% 200%;animation:ckSupF 2s ease infinite;box-shadow:0 0 20px rgba(255,90,110,.6),inset 0 1px 0 rgba(255,255,255,.35);}');
cssAdd('#ck-superreb:disabled{opacity:.45;}');
cssAdd('@keyframes ckSupF{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#clicker-overlay{overflow:hidden;}');
cssAdd('#clicker-panel{will-change:transform;}');
cssAdd('.ck-actions button{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.25);letter-spacing:1px;transition:transform .18s,box-shadow .18s,filter .18s;}');
cssAdd('.ck-actions button:hover{transform:translateY(-3px) scale(1.02);filter:brightness(1.12);}');
cssAdd('.ck-actions button:active{transform:scale(.94);}');
cssAdd('#ck-shopbtn{background:linear-gradient(135deg,#ffd166,#ff9f1c 45%,#e07b00);background-size:200% 200%;animation:ckShopF 3s ease infinite;box-shadow:0 0 16px rgba(255,170,60,.5),inset 0 1px 0 rgba(255,255,255,.35);}');
cssAdd('@keyframes ckShopF{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-rebirth{background:linear-gradient(135deg,#d68cff,#8b2fd6 50%,#5b1487);background-size:200% 200%;animation:ckRebF 2.6s ease infinite;box-shadow:0 0 18px rgba(190,100,255,.55),inset 0 1px 0 rgba(255,255,255,.3);}');
cssAdd('@keyframes ckRebF{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-lbbtn{background:linear-gradient(135deg,#5eead4,#38bdf8 50%,#2563eb);background-size:200% 200%;animation:ckLbF 3.2s ease infinite;box-shadow:0 0 16px rgba(80,190,255,.5),inset 0 1px 0 rgba(255,255,255,.3);}');
cssAdd('@keyframes ckLbF{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-invbtn{background:linear-gradient(135deg,#f0abfc,#c026d3 50%,#7e22ce);background-size:200% 200%;animation:ckInvF 2.9s ease infinite;box-shadow:0 0 16px rgba(210,110,255,.5),inset 0 1px 0 rgba(255,255,255,.3);}');
cssAdd('@keyframes ckInvF{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-boostbar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}');
cssAdd('.ck-bchip{border:1px solid;border-radius:20px;padding:4px 10px;font-size:11.5px;font-weight:bold;background:rgba(0,0,0,.35);}');
cssAdd('.ck-toast{position:fixed;left:50%;top:13%;transform:translateX(-50%);z-index:9600;background:linear-gradient(135deg,#141a3a,#0b1026);border:1px solid #3a86ff;border-radius:12px;padding:10px 18px;color:#dfe6ff;font-family:Courier New,monospace;font-weight:bold;font-size:14px;box-shadow:0 0 22px rgba(58,134,255,.6);pointer-events:none;animation:ckToast 3.2s forwards;}');
cssAdd('@keyframes ckToast{0%{opacity:0;transform:translate(-50%,-10px);}10%{opacity:1;transform:translate(-50%,0);}80%{opacity:1;}100%{opacity:0;transform:translate(-50%,-14px);}}');
cssAdd('#ck-invbtn{background:linear-gradient(135deg,#6a1fb5,#3a1a6b);}');
cssAdd('.ck-flask{width:22px;height:30px;margin:0 auto 5px;border:2px solid #dfe6ff;border-radius:4px 4px 12px 12px;background:linear-gradient(180deg,transparent 20%,var(--fc) 20%,var(--fc) 100%);position:relative;box-shadow:0 0 10px var(--fc);}');
cssAdd('.ck-flask:before{content:"";position:absolute;top:-7px;left:4px;width:10px;height:6px;border:2px solid #dfe6ff;border-bottom:none;border-radius:3px 3px 0 0;}');
cssAdd('#ck-inv{position:fixed;inset:0;z-index:9460;background:rgba(2,2,14,.92);display:flex;align-items:center;justify-content:center;font-family:Courier New,monospace;}');
cssAdd('#ck-inv-box{width:min(560px,94vw);max-height:86vh;overflow-y:auto;background:linear-gradient(160deg,#0b1026,#141a3a);border:2px solid #6a1fb5;border-radius:18px;padding:18px;}');
cssAdd('#ck-inv-box h2{margin:0 0 14px;color:#c9a6ff;text-align:center;font-size:19px;}');
cssAdd('.ck-inv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}');
cssAdd('.ck-inv-card{position:relative;border:2px solid;border-radius:12px;padding:12px 8px;text-align:center;background:rgba(0,0,20,.55);color:#dfe6ff;font-size:12.5px;}');
cssAdd('.ck-inv-card small{display:block;color:#8fa3e8;font-size:10.5px;margin-top:2px;}');
cssAdd('.ck-inv-orb{width:34px;height:34px;border-radius:50%;margin:0 auto 8px;box-shadow:0 0 14px rgba(255,255,255,.25);}');
cssAdd('.ck-inv-n{position:absolute;top:6px;right:8px;color:#ffd23f;font-weight:bold;font-size:12px;}');
cssAdd('.ck-inv-empty{color:#8fa3e8;text-align:center;padding:26px 10px;font-size:13px;}');
cssAdd('#ck-close-inv{display:block;margin:16px auto 0;background:linear-gradient(135deg,#3a86ff,#7b2cbf);border:none;color:#fff;border-radius:10px;padding:10px 26px;font-family:inherit;font-weight:bold;cursor:pointer;}');
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
cssAdd('#ck-lbbtn{background:linear-gradient(135deg,#3a86ff,#5e17a5);}');
cssAdd('#ck-player{display:flex;align-items:center;gap:8px;width:100%;margin-top:10px;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,rgba(22,28,64,.94),rgba(14,18,44,.94));border:1px solid #2b3672;box-shadow:inset 0 1px 0 rgba(255,255,255,.06);}');
cssAdd('#ck-player-info{flex:1;min-width:0;}');
cssAdd('#ck-track-name{font-size:12.5px;font-weight:700;color:#dfe6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 0 12px rgba(120,170,255,.4);}');
cssAdd('#ck-track-num{font-size:10px;color:#7f8fc4;letter-spacing:1.2px;margin-top:2px;}');
cssAdd('.ck-mbtn{width:34px;height:34px;flex:none;border:1px solid #33407f;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;color:#cfe0ff;background:#1a2148;transition:transform .15s,background .2s,box-shadow .2s;}');
cssAdd('.ck-mbtn:hover{background:#26306a;transform:translateY(-2px);box-shadow:0 4px 14px rgba(80,120,255,.3);}');
cssAdd('.ck-mbtn:active{transform:scale(.9);}');
cssAdd('.ck-mbtn.on{background:linear-gradient(135deg,#37e08a,#1d9d5f);color:#04121c;border-color:rgba(55,224,138,.7);box-shadow:0 0 14px rgba(55,224,138,.5);}');
cssAdd('#ck-mvol{width:88px;flex:none;accent-color:#7fd4ff;cursor:pointer;}');
cssAdd('#ck-player{border-radius:16px;background:linear-gradient(135deg,rgba(34,42,96,.96),rgba(15,19,50,.96));border:1px solid rgba(120,160,255,.4);box-shadow:0 10px 28px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08);padding:12px 14px;transition:border-color .3s,box-shadow .3s;}');
cssAdd('#ck-player:hover{border-color:rgba(150,190,255,.7);box-shadow:0 12px 34px rgba(20,40,120,.6),0 0 22px rgba(80,130,255,.25);}');
cssAdd('.ck-eq{display:flex;gap:3px;align-items:flex-end;height:14px;margin-top:5px;}');
cssAdd('.ck-eq i{width:3px;height:4px;border-radius:2px;background:linear-gradient(180deg,#9fe0ff,#3a86ff);opacity:.35;}');
cssAdd('.ck-eq.on i{animation:ckEqB .8s ease-in-out infinite alternate;}');
cssAdd('.ck-eq.on i:nth-child(2){animation-delay:.12s;}');
cssAdd('.ck-eq.on i:nth-child(3){animation-delay:.24s;}');
cssAdd('.ck-eq.on i:nth-child(4){animation-delay:.36s;}');
cssAdd('@keyframes ckEqB{from{height:3px;opacity:.45}to{height:14px;opacity:1}}');
cssAdd('#ck-play.on{animation:ckPlayP 1.8s ease-in-out infinite;}');
cssAdd('@keyframes ckPlayP{0%,100%{box-shadow:0 0 8px rgba(55,224,138,.45)}50%{box-shadow:0 0 20px rgba(55,224,138,.95)}}');
cssAdd('.ck-medbox{width:44px;height:44px;flex:none;border-radius:10px;overflow:hidden;border:1px solid rgba(127,212,255,.5);box-shadow:0 0 12px rgba(70,150,255,.4);}');
cssAdd('.ck-medv{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}');
cssAdd('.ck-wave{display:flex;gap:3px;align-items:flex-end;height:34px;flex:none;padding:0 4px;}');
cssAdd('.ck-wave i{width:4px;height:8px;border-radius:3px;background:linear-gradient(180deg,#9fd0ff,#3a86ff);opacity:.4;}');
cssAdd('.ck-wave.on i{animation:ckWaveB .9s ease-in-out infinite alternate;}');
cssAdd('.ck-wave.on i:nth-child(2){animation-delay:.1s;}');
cssAdd('.ck-wave.on i:nth-child(3){animation-delay:.2s;}');
cssAdd('.ck-wave.on i:nth-child(4){animation-delay:.3s;}');
cssAdd('.ck-wave.on i:nth-child(5){animation-delay:.4s;}');
cssAdd('@keyframes ckWaveB{from{height:6px;opacity:.4}to{height:32px;opacity:1}}');
cssAdd('#ck-track-name.ck-trk1{background:linear-gradient(90deg,#ff6b6b,#ffd93d,#ff6b6b);background-size:200% 200%;animation:ckT1 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT1{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk2{background:linear-gradient(90deg,#4ecdc4,#a8e6cf,#4ecdc4);background-size:200% 200%;animation:ckT2 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT2{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk3{background:linear-gradient(90deg,#a78bfa,#f0abfc,#a78bfa);background-size:200% 200%;animation:ckT3 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT3{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk4{background:linear-gradient(90deg,#fb923c,#fde047,#fb923c);background-size:200% 200%;animation:ckT4 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT4{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk5{background:linear-gradient(90deg,#38bdf8,#818cf8,#38bdf8);background-size:200% 200%;animation:ckT5 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT5{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk6{background:linear-gradient(90deg,#f472b6,#c084fc,#f472b6);background-size:200% 200%;animation:ckT6 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT6{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk7{background:linear-gradient(90deg,#34d399,#a3e635,#34d399);background-size:200% 200%;animation:ckT7 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT7{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk8{background:linear-gradient(90deg,#f87171,#fb923c,#f87171);background-size:200% 200%;animation:ckT8 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT8{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk9{background:linear-gradient(90deg,#60a5fa,#22d3ee,#60a5fa);background-size:200% 200%;animation:ckT9 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT9{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-bgvid{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.85;pointer-events:none;}');
cssAdd('.t2-theme{background:#f4f6fb !important;border-color:#c9d2e8 !important;}');
cssAdd('.t2-theme #clicker-left{position:relative;}');
cssAdd('.t2-theme .ck-orb{display:none !important;}');
cssAdd('.t2-theme #clicker-right{background:rgba(255,255,255,.75) !important;border-color:rgba(0,0,0,.08) !important;}');
cssAdd('.t2-theme #clicker-right h3{color:#3a4560 !important;}');
cssAdd('.t2-theme #ck-uplist{background:transparent !important;}');
cssAdd('.t2-theme .ck-up{background:#ffffff !important;border-color:#d4dbe8 !important;color:#1a2030 !important;}');
cssAdd('.t2-theme .ck-up b{color:#1a2030 !important;}');
cssAdd('.t2-theme .ck-up button{background:linear-gradient(145deg,#5b8def,#3a6fd8) !important;color:#fff !important;border:none !important;}');
cssAdd('.t2-theme .ck-up.no button{background:linear-gradient(145deg,#c9cfdd,#aeb6c8) !important;color:#5a6070 !important;opacity:.75 !important;}');
cssAdd('.t2-theme .ck-up.can button{background:linear-gradient(145deg,#3fda8f,#1d9d5f) !important;color:#fff !important;box-shadow:0 0 10px rgba(55,224,138,.45) !important;}');
cssAdd('.t2-theme .ck-up button:hover{filter:brightness(1.1) !important;}');
cssAdd('.t2-theme .ck-up small{color:#55607a !important;}');
cssAdd('.t2-theme .ck-up span{color:#55607a !important;}');
cssAdd('.t2-theme .ck-lb-empty{color:#5a6478 !important;}');
cssAdd('.t2-theme .ck-inv-empty{color:#5a6478 !important;}');
cssAdd('.t2-theme #ck-stats{color:#2a3245 !important;}');
cssAdd('.t2-theme #ck-stats b{color:#0d1230 !important;}');
cssAdd('.t2-theme #ck-stats b{text-shadow:none !important;}');
cssAdd('.t2-theme .ck-tab{background:#ffffff !important;border-color:#d4dbe8 !important;color:#3a4560 !important;}');
cssAdd('.t2-theme .ck-tab.on{color:#fff !important;}');
cssAdd('.t2-theme .ck-apbtn{background:#ffffff !important;border-color:#c4cddf !important;color:#3a4560 !important;}');
cssAdd('.t2-theme .ck-apbtn.on{color:#fff !important;}');
cssAdd('.t2-theme .ck-apin{background:#ffffff !important;border-color:#c4cddf !important;color:#1a2030 !important;}');
cssAdd('.t2-theme .ck-swot{border-color:#b6c0d4 !important;}');
cssAdd('.t2-theme #ck-player{background:rgba(255,255,255,.9) !important;border-color:rgba(0,0,0,.08) !important;}');
cssAdd('.t2-theme .ck-mbtn{background:linear-gradient(145deg,#f0f3fa,#dfe5f0) !important;color:#2a3245 !important;border-color:#c4cddf !important;}');
cssAdd('.t2-theme #ck-track-name{filter:none !important;}');
cssAdd('.t2-theme .ck-setl{color:#3a4560 !important;}');
cssAdd('.t2-theme .ck-seth{color:#7a6a1f !important;}');
cssAdd('.ck-apbtn{position:relative;overflow:hidden;background:linear-gradient(145deg,#1b2452,#121736);border:1px solid #33407f;transition:transform .16s,box-shadow .16s,filter .16s,background-position .3s;background-size:200% 200%;}');
cssAdd('.ck-apbtn:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(70,110,255,.3);filter:brightness(1.15);}');
cssAdd('.ck-apbtn:active{transform:scale(.95);}');
cssAdd('.ck-apbtn.on{animation:ckApGlow 2.8s ease infinite;}');
cssAdd('@keyframes ckApGlow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('.ck-t2b{letter-spacing:.5px;}');
cssAdd('.ck-t2b.on{background:linear-gradient(135deg,#ffd76a,#e0a52e) !important;color:#241c04 !important;border-color:#ffd76a !important;box-shadow:0 0 14px rgba(255,200,80,.5) !important;}');
cssAdd('.t2-theme .ck-t2b.on{background:linear-gradient(135deg,#ffd76a,#e0a52e) !important;color:#241c04 !important;}');
cssAdd('.t2-theme #clicker-left > *:not(#ck-bgvid){position:relative;z-index:1;}');
cssAdd('.t2-theme #ck-stats{background:rgba(255,255,255,.85);border-radius:12px;padding:8px 12px;border:1px solid rgba(0,0,0,.06);}');
cssAdd('.t2-theme #ck-player{background:#ffffff !important;}');
cssAdd('.t2-theme .ck-bchip{background:rgba(255,255,255,.9) !important;color:#1a2030 !important;}');
cssAdd('.t2-theme.t2w{background:#ffffff !important;border-color:#dfe6ff !important;box-shadow:0 20px 60px rgba(80,110,255,.25);}');
cssAdd('.t2-theme.t2w #clicker-right{background:rgba(245,248,255,.92) !important;}');
cssAdd('.t2-theme.t2w .ck-up{background:#ffffff !important;}');
cssAdd('.t2-theme.t2w .ck-tab.on{border-color:#8fb5ff !important;}');
cssAdd('.t2-theme.t2w .ck-up.can{border-color:#8fb5ff !important;}');
cssAdd('.t2-theme.t2w .ck-actions button{border-color:#c7d7ff !important;}');
cssAdd('.t2-theme.t2g{background:#e9ecf1 !important;border-color:#aab3c2 !important;box-shadow:0 20px 60px rgba(60,70,90,.3);}');
cssAdd('.t2-theme.t2g #clicker-right{background:rgba(238,241,245,.94) !important;}');
cssAdd('.t2-theme.t2g .ck-up{background:#f4f6f9 !important;}');
cssAdd('.t2-theme.t2g .ck-tab.on{border-color:#7f8ea8 !important;}');
cssAdd('.t2-theme.t2g .ck-up.can{border-color:#7f8ea8 !important;}');
cssAdd('.t2-theme.t2g .ck-actions button{border-color:#98a3b5 !important;}');
cssAdd('.t2-theme.t2p{background:#fdeef5 !important;border-color:#f2b8d3 !important;box-shadow:0 20px 60px rgba(255,120,180,.3);}');
cssAdd('.t2-theme.t2p #clicker-right{background:rgba(255,240,247,.94) !important;}');
cssAdd('.t2-theme.t2p .ck-up{background:#fff3f9 !important;}');
cssAdd('.t2-theme.t2p .ck-tab.on{border-color:#f27fb4 !important;}');
cssAdd('.t2-theme.t2p .ck-up.can{border-color:#e884b5 !important;}');
cssAdd('.t2-theme.t2p .ck-actions button{border-color:#f0a0c5 !important;}');
cssAdd('.t2-theme.t2y{background:#fdf8e6 !important;border-color:#e6d98f !important;box-shadow:0 20px 60px rgba(220,190,80,.35);}');
cssAdd('.t2-theme.t2y #clicker-right{background:rgba(255,252,235,.94) !important;}');
cssAdd('.t2-theme.t2y .ck-up{background:#fffdf2 !important;}');
cssAdd('.t2-theme.t2y .ck-tab.on{border-color:#d4bd45 !important;}');
cssAdd('.t2-theme.t2y .ck-up.can{border-color:#d4bd45 !important;}');
cssAdd('.t2-theme.t2w .ck-actions button{background:linear-gradient(145deg,#5b8def,#3a6fd8) !important;border-color:#c7d7ff !important;}');
cssAdd('.t2-theme.t2w .ck-tab{border-color:#c7d7ff !important;}');
cssAdd('.t2-theme.t2w .ck-tab.on{background:linear-gradient(135deg,#5b8def,#3a6fd8) !important;}');
cssAdd('.t2-theme.t2w .ck-apbtn.on{background:linear-gradient(135deg,#5b8def,#3a6fd8) !important;border-color:#c7d7ff !important;}');
cssAdd('.t2-theme.t2w .ck-t2b.on{background:linear-gradient(135deg,#5b8def,#3a6fd8) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2g .ck-actions button{background:linear-gradient(145deg,#7f8ea8,#5a6478) !important;border-color:#98a3b5 !important;}');
cssAdd('.t2-theme.t2g .ck-tab{border-color:#98a3b5 !important;}');
cssAdd('.t2-theme.t2g .ck-tab.on{background:linear-gradient(145deg,#7f8ea8,#5a6478) !important;}');
cssAdd('.t2-theme.t2g .ck-apbtn.on{background:linear-gradient(145deg,#7f8ea8,#5a6478) !important;border-color:#98a3b5 !important;}');
cssAdd('.t2-theme.t2g .ck-t2b.on{background:linear-gradient(145deg,#7f8ea8,#5a6478) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2p .ck-actions button{background:linear-gradient(145deg,#f27fb4,#d1568c) !important;border-color:#f0a0c5 !important;}');
cssAdd('.t2-theme.t2p .ck-tab{border-color:#f0a0c5 !important;}');
cssAdd('.t2-theme.t2p .ck-tab.on{background:linear-gradient(145deg,#f27fb4,#d1568c) !important;}');
cssAdd('.t2-theme.t2p .ck-apbtn.on{background:linear-gradient(145deg,#f27fb4,#d1568c) !important;border-color:#f0a0c5 !important;}');
cssAdd('.t2-theme.t2p .ck-t2b.on{background:linear-gradient(145deg,#f27fb4,#d1568c) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2y .ck-actions button{background:linear-gradient(145deg,#e8c84f,#c9a52e) !important;border-color:#eede85 !important;}');
cssAdd('.t2-theme.t2y .ck-tab{border-color:#eede85 !important;}');
cssAdd('.t2-theme.t2y .ck-tab.on{background:linear-gradient(145deg,#e8c84f,#c9a52e) !important;}');
cssAdd('.t2-theme.t2y .ck-apbtn.on{background:linear-gradient(145deg,#e8c84f,#c9a52e) !important;border-color:#eede85 !important;}');
cssAdd('.t2-theme.t2y .ck-t2b.on{background:linear-gradient(145deg,#e8c84f,#c9a52e) !important;color:#241c04 !important;}');
cssAdd('.t2-theme.t2y #ck-megareb{background:linear-gradient(145deg,#e8c84f,#c9a52e) !important;}');
cssAdd('.t2-theme.t2p #ck-megareb{background:linear-gradient(145deg,#f27fb4,#d1568c) !important;}');
cssAdd('.t2-theme.t2g #ck-megareb{background:linear-gradient(145deg,#7f8ea8,#5a6478) !important;}');
cssAdd('.t2-theme.t2w #ck-megareb{background:linear-gradient(145deg,#5b8def,#3a6fd8) !important;}');
cssAdd('.t2-theme.t2y #ck-superreb{background:linear-gradient(145deg,#e8c84f,#b8912a) !important;animation:none !important;}');
cssAdd('.t2-theme.t2p #ck-superreb{background:linear-gradient(145deg,#f27fb4,#c74f8a) !important;animation:none !important;}');
cssAdd('.t2-theme.t2g #ck-superreb{background:linear-gradient(145deg,#7f8ea8,#5a6478) !important;animation:none !important;}');
cssAdd('.t2-theme.t2w #ck-superreb{background:linear-gradient(145deg,#5b8def,#3a6fd8) !important;animation:none !important;}');
cssAdd('.t2-theme .ck-eq i{background:#8fa8cc !important;}');
cssAdd('.t2-theme .ck-wave i{background:#8fa8cc !important;}');
cssAdd('.t2-theme.t2y .ck-tab{background:#fbf3d0 !important;border-color:#e6d98f !important;color:#6b5d1a !important;}');
cssAdd('.t2-theme.t2y .ck-tab:hover{background:#f7ecc0 !important;}');
cssAdd('.t2-theme.t2y .ck-apbtn{background:#fbf3d0 !important;border-color:#e6d98f !important;color:#6b5d1a !important;}');
cssAdd('.t2-theme.t2y .ck-apbtn:hover{background:#f7ecc0 !important;}');
cssAdd('.t2-theme.t2y .ck-t2b{background:#fbf3d0 !important;border-color:#e6d98f !important;color:#6b5d1a !important;}');
cssAdd('.t2-theme.t2y .ck-setr{accent-color:#c9a52e;}');
cssAdd('.t2-theme.t2y #ck-closebtn{background:linear-gradient(135deg,#d98a4a,#b3541e) !important;}');
cssAdd('.t2-theme.t2y .ck-swot{background:#fbf3d0 !important;}');
cssAdd('.t2-theme.t2w .ck-mbtn{background:linear-gradient(145deg,#5b8def,#3a6fd8) !important;color:#fff !important;border-color:#c7d7ff !important;}');
cssAdd('.t2-theme.t2w .ck-mbtn.on{background:linear-gradient(135deg,#8fb5ff,#5b8def) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2w #ck-stats{background:rgba(255,255,255,.92) !important;border-color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2w #ck-mvol{accent-color:#5b8def !important;}');
cssAdd('.t2-theme.t2w .ck-eq i{background:#5b8def !important;}');
cssAdd('.t2-theme.t2w .ck-wave i{background:#5b8def !important;}');
cssAdd('.t2-theme.t2w #ck-offline{background:#ffffff !important;border-color:#dfe6ff !important;color:#2a3245 !important;}');
cssAdd('.t2-theme.t2g .ck-mbtn{background:linear-gradient(145deg,#7f8ea8,#5a6478) !important;color:#fff !important;border-color:#98a3b5 !important;}');
cssAdd('.t2-theme.t2g .ck-mbtn.on{background:linear-gradient(135deg,#9aa8c0,#5a6478) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2g #ck-stats{background:rgba(238,241,245,.95) !important;border-color:#aab3c2 !important;}');
cssAdd('.t2-theme.t2g #ck-mvol{accent-color:#7f8ea8 !important;}');
cssAdd('.t2-theme.t2g .ck-eq i{background:#7f8ea8 !important;}');
cssAdd('.t2-theme.t2g .ck-wave i{background:#7f8ea8 !important;}');
cssAdd('.t2-theme.t2g #ck-offline{background:#f4f6f9 !important;border-color:#aab3c2 !important;color:#2a3245 !important;}');
cssAdd('.t2-theme.t2p .ck-mbtn{background:linear-gradient(145deg,#f27fb4,#d1568c) !important;color:#fff !important;border-color:#f0a0c5 !important;}');
cssAdd('.t2-theme.t2p .ck-mbtn.on{background:linear-gradient(135deg,#f8a8ce,#d1568c) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2p #ck-stats{background:rgba(255,240,247,.95) !important;border-color:#f2b8d3 !important;}');
cssAdd('.t2-theme.t2p #ck-mvol{accent-color:#f27fb4 !important;}');
cssAdd('.t2-theme.t2p .ck-eq i{background:#f27fb4 !important;}');
cssAdd('.t2-theme.t2p .ck-wave i{background:#f27fb4 !important;}');
cssAdd('.t2-theme.t2p #ck-offline{background:#fff3f9 !important;border-color:#f2b8d3 !important;color:#2a3245 !important;}');
cssAdd('.t2-theme.t2y .ck-mbtn{background:linear-gradient(145deg,#e8c84f,#c9a52e) !important;color:#241c04 !important;border-color:#eede85 !important;}');
cssAdd('.t2-theme.t2y .ck-mbtn.on{background:linear-gradient(135deg,#f0d878,#c9a52e) !important;color:#241c04 !important;}');
cssAdd('.t2-theme.t2y #ck-stats{background:rgba(253,248,230,.95) !important;border-color:#e6d98f !important;}');
cssAdd('.t2-theme.t2y #ck-mvol{accent-color:#c9a52e !important;}');
cssAdd('.t2-theme.t2y .ck-eq i{background:#c9a52e !important;}');
cssAdd('.t2-theme.t2y .ck-wave i{background:#c9a52e !important;}');
cssAdd('.t2-theme.t2y #ck-offline{background:#fdf8e6 !important;border-color:#e6d98f !important;color:#2a3245 !important;}');
cssAdd('.ck-hangs{display:none;position:absolute;top:0;left:0;right:0;height:0;pointer-events:none;z-index:3;--hcol:#8fb5ff;}');
cssAdd('.t2-theme .ck-hangs{display:block;}');
cssAdd('.ck-hang{position:absolute;top:0;width:1px;transform-origin:top center;animation:ckSway 3s ease-in-out infinite alternate;}');
cssAdd('.ck-hang.hpt{background:linear-gradient(180deg,transparent,var(--hcol));}');
cssAdd('.ck-hang.hpt::after{content:\'\';position:absolute;bottom:-9px;left:-4.5px;width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,#efe8f8 45%,#c4b4de 80%,#a893c8);box-shadow:0 0 6px rgba(255,255,255,.6);}');
cssAdd('.ck-hang.hbg{background:linear-gradient(180deg,transparent,var(--hcol));}');
cssAdd('.ck-hang.hbg::after{content:\'\';position:absolute;bottom:-11px;left:-6.5px;width:14px;height:14px;border-radius:50%;border:1.5px solid var(--hcol);background:rgba(255,255,255,.18);}');
cssAdd('.ck-hang.hbg::before{content:\'\';position:absolute;bottom:-2px;left:-1px;width:4px;height:5px;border-radius:50%;background:rgba(255,255,255,.85);z-index:1;}');
cssAdd('@keyframes ckSway{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}');
cssAdd('.ck-pearl{position:absolute;top:0;left:0;right:0;height:9px;pointer-events:none;z-index:3;background:radial-gradient(circle 4px at 8px 4.5px,#ffffff 1.8px,#d8d0e8 2.6px,transparent 3.4px) repeat-x;background-size:16px 9px;opacity:.9;}');
cssAdd('.t2-theme #ck-player{overflow:visible;}');
cssAdd('.t2-theme .ck-hangs{--hcol:#8fb5ff;}');
cssAdd('.t2-theme.t2w .ck-hangs{--hcol:#6f9dff;}');
cssAdd('.t2-theme.t2g .ck-hangs{--hcol:#9aa8c0;}');
cssAdd('.t2-theme.t2p .ck-hangs{--hcol:#f2a8cd;}');
cssAdd('.t2-theme.t2y .ck-hangs{--hcol:#d9b95a;}');
cssAdd('.t2-theme.t2w #ck-player{background:linear-gradient(135deg,rgba(240,246,255,.97),rgba(224,236,255,.97)) !important;border-color:#a9c4ff !important;box-shadow:0 10px 28px rgba(80,110,255,.3),inset 0 0 0 1px rgba(255,255,255,.6);}');
cssAdd('.t2-theme.t2g #ck-player{background:linear-gradient(135deg,rgba(238,241,245,.97),rgba(216,222,232,.97)) !important;border-color:#9aa8c0 !important;box-shadow:0 10px 28px rgba(60,70,90,.3),inset 0 0 0 1px rgba(255,255,255,.6);}');
cssAdd('.t2-theme.t2p #ck-player{background:linear-gradient(135deg,rgba(255,240,247,.97),rgba(255,224,238,.97)) !important;border-color:#f2a8cd !important;box-shadow:0 10px 28px rgba(255,120,180,.3),inset 0 0 0 1px rgba(255,255,255,.6);}');
cssAdd('.t2-theme.t2y #ck-player{background:linear-gradient(135deg,rgba(253,248,230,.97),rgba(248,238,205,.97)) !important;border-color:#d9b95a !important;box-shadow:0 10px 28px rgba(220,190,80,.35),inset 0 0 0 1px rgba(255,255,255,.65);}');
cssAdd('.t2-theme .ck-mbtn{background:linear-gradient(145deg,#232c5e,#151b40) !important;color:#cfe0ff !important;border-color:#33407f !important;}');
cssAdd('.t2-theme .ck-mbtn.on{background:linear-gradient(135deg,#37e08a,#1d9d5f) !important;color:#04121c !important;border-color:rgba(55,224,138,.7) !important;}');
cssAdd('#ck-player.ck-on{border-color:rgba(127,212,255,.7);box-shadow:0 12px 34px rgba(20,60,140,.6),0 0 26px rgba(70,150,255,.35);}');
cssAdd('#ck-player #ck-track-name{background-clip:text;-webkit-background-clip:text;}');
cssAdd('.ck-mbtn{background:linear-gradient(145deg,#232c5e,#151b40);}');
cssAdd('.ck-mbtn:hover{background:linear-gradient(145deg,#2e3a78,#1c2452);}');
cssAdd('#ck-mvol{width:92px;filter:drop-shadow(0 0 4px rgba(127,212,255,.4));}');
cssAdd('@keyframes ckRowIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}');
cssAdd('.ck-tab.on{animation:ckTabPop .22s ease;}');
cssAdd('@keyframes ckTabPop{from{transform:scale(.9)}to{transform:scale(1)}}');
cssAdd('@media(max-height:540px) and (orientation:landscape){');
cssAdd('#clicker-panel{flex-direction:row;height:97vh;width:97vw;}');
cssAdd('#clicker-left{padding:8px;gap:6px;}');
cssAdd('#clicker-right{width:42%;min-width:220px;border-left:2px solid #26306a;border-top:none;flex:0 0 auto;}');
cssAdd('#ck-disc{width:min(190px,34vh);height:min(190px,34vh);}');
cssAdd('#ck-disc-name{font-size:15px;}');
cssAdd('#ck-stats{font-size:11.5px;line-height:1.35;}');
cssAdd('#ck-prbar{width:92%;height:12px;}');
cssAdd('.ck-actions{gap:5px;}');
cssAdd('.ck-actions button{padding:6px 10px;font-size:11px;border-radius:10px;}');
cssAdd('.ck-mbtn{width:26px;height:26px;font-size:11px;border-radius:8px;}');
cssAdd('#ck-player{padding:5px 8px;margin-top:2px;gap:5px;}');
cssAdd('#ck-track-name{font-size:10.5px;}');
cssAdd('#ck-track-num{font-size:8.5px;}');
cssAdd('#ck-mvol{width:64px;}');
cssAdd('.ck-eq{height:10px;margin-top:3px;}');
cssAdd('#ck-uplist{padding:5px;gap:4px;}');
cssAdd('.ck-up{min-height:34px;padding:4px 7px;font-size:11px;}');
cssAdd('.ck-tab{padding:5px 4px;font-size:10px;min-width:60px;}');
cssAdd('#ck-autop{padding:5px 5px 0;gap:4px;}');
cssAdd('.ck-apbtn{padding:4px 6px;font-size:9.5px;min-width:80px;}');
cssAdd('.ck-apin{width:88px;font-size:11px;padding:4px 6px;}');
cssAdd('}');
cssAdd('#ck-setp{flex:1 1 auto;min-height:0;}');
cssAdd('.ck-t2b{min-width:70px;flex:1 1 30%;padding:6px 4px;font-size:10px;}');
cssAdd('@media(max-width:760px){');
cssAdd('#clicker-left{overflow-y:auto;}');
cssAdd('#ck-autop{padding:4px 4px 0;gap:4px;}');
cssAdd('.ck-apbtn{min-width:74px;font-size:9.5px;padding:5px 6px;}');
cssAdd('.ck-apin{width:80px;padding:5px 6px;font-size:11px;}');
cssAdd('.ck-actions button{padding:8px 10px;font-size:11.5px;}');
cssAdd('#ck-player{padding:8px 10px;gap:6px;}');
cssAdd('.ck-mbtn{width:28px;height:28px;font-size:11px;}');
cssAdd('#ck-mvol{width:64px;}');
cssAdd('.ck-eq{height:10px;}');
cssAdd('.ck-eq i{width:2.5px;}');
cssAdd('#ck-stats{font-size:12.5px;padding:6px 8px;}');
cssAdd('#ck-prbar{height:14px;}');
cssAdd('}');
cssAdd('#ck-reg{position:fixed;inset:0;z-index:9650;background:rgba(2,2,14,.94);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;}');
cssAdd('#ck-reg-box{width:min(420px,92vw);background:linear-gradient(160deg,#141a3a,#0b1026);border:2px solid #3a86ff;border-radius:20px;padding:26px 24px;color:#fff;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.7),0 0 60px rgba(80,110,255,.2);}');
cssAdd('#ck-reg-box h2{margin:0 0 8px;letter-spacing:2px;background:linear-gradient(90deg,#8fc0ff,#b04dff,#8fc0ff);-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('.ck-reg-lbl{font-size:13px;color:#9fb8d8;margin-bottom:16px;line-height:1.5;}');
cssAdd('#ck-reg-inp{width:100%;box-sizing:border-box;padding:12px 14px;border:2px solid #2b3672;border-radius:11px;background:#0b1026;color:#fff;font-family:inherit;font-size:15px;text-align:center;outline:none;transition:border-color .2s;}');
cssAdd('#ck-reg-inp:focus{border-color:#3a86ff;box-shadow:0 0 12px rgba(58,134,255,.35);}');
cssAdd('#ck-reg-btn{width:100%;margin-top:14px;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#5e17a5,#7b2cbf 45%,#3a86ff);color:#fff;font-family:inherit;font-weight:bold;font-size:15px;letter-spacing:2px;cursor:pointer;transition:transform .15s,filter .15s;}');
cssAdd('#ck-reg-btn:hover{transform:translateY(-2px);filter:brightness(1.12);}');
cssAdd('#ck-reg-btn:active{transform:scale(.96);}');
cssAdd('.ck-reg-err{margin-top:10px;font-size:12px;color:#ff8a9a;min-height:16px;}');
cssAdd('#ck-lb{position:fixed;inset:0;z-index:9470;background:rgba(2,2,14,.85);display:flex;align-items:center;justify-content:center;font-family:inherit;}');
cssAdd('#ck-lb-box{width:min(520px,94vw);max-height:88vh;overflow-y:auto;background:linear-gradient(160deg,#141a3a,#0b1026);border:2px solid #3a86ff;border-radius:20px;padding:18px;color:#fff;}');
cssAdd('#ck-lb-box h2{margin:0 0 6px;text-align:center;letter-spacing:2px;background:linear-gradient(90deg,#8fc0ff,#b04dff,#8fc0ff);-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('#ck-lb-me{text-align:center;font-size:12px;color:#8fa3e8;margin-bottom:12px;}');
cssAdd('.ck-lb-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:#111634;border:1px solid #2b3672;margin-bottom:7px;}');
cssAdd('.ck-lb-row.me{border-color:#37e08a;box-shadow:0 0 16px rgba(55,224,138,.3);}');
cssAdd('.ck-lb-row .p{width:26px;text-align:center;font-weight:bold;color:#ffd76a;}');
cssAdd('.ck-lb-row .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}');
cssAdd('.ck-lb-row .s{font-weight:bold;color:#9fe6ff;}');
cssAdd('.ck-lb-empty{text-align:center;color:#6b7bb0;padding:18px 0;}');
cssAdd('#ck-close-lb{width:100%;margin-top:10px;background:#b3283c;border:none;border-radius:12px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;}');
cssAdd('#ck-offline{width:100%;background:linear-gradient(135deg,rgba(55,224,138,.18),rgba(58,134,255,.14));border:1px solid rgba(55,224,138,.5);border-radius:12px;padding:9px 12px;color:#d8ffe8;font-size:12.5px;text-align:center;cursor:pointer;}');
cssAdd('#ck-offline b{color:#37e08a;}');
cssAdd('#ck-off-x{float:right;color:#8fa3e8;padding:0 4px;}');
cssAdd('#laser-fire-btn{position:fixed;left:18px;bottom:96px;z-index:9400;width:60px;height:60px;border-radius:50%;border:2px solid #ff5555;background:radial-gradient(circle,#ff2020,#7a0000);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 0 16px #ff2020;display:none;font-family:inherit;font-weight:bold;}');
cssAdd('#earth-exit-btn{position:fixed;top:16px;left:16px;z-index:9400;display:none;background:rgba(179,40,60,.9);border:1px solid #ff9aa8;color:#fff;border-radius:10px;padding:10px 16px;font-family:Courier New,monospace;font-weight:bold;cursor:pointer;}');
cssAdd('#ck-profbtn{background:linear-gradient(135deg,#2a9d8f,#14532d);}');
cssAdd('#ck-prof{position:fixed;inset:0;z-index:9472;background:rgba(2,2,14,.88);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;}');
cssAdd('#ck-prof h2{margin:0 0 12px;color:#7fd4ff;letter-spacing:2px;}');
cssAdd('#ck-prof-ava{width:64px;height:64px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#7b2cbf,#3a86ff);box-shadow:0 0 18px rgba(80,130,255,.5);}');
cssAdd('.ck-prof-row{display:flex;align-items:center;gap:8px;background:#111634;border:1px solid #2b3672;border-radius:11px;padding:10px 12px;margin-bottom:8px;text-align:left;}');
cssAdd('.ck-prof-l{width:64px;color:#8fa3e8;font-size:11px;letter-spacing:1px;flex:none;}');
cssAdd('.ck-prof-v{flex:1;font-weight:bold;font-size:14px;word-break:break-all;}');
cssAdd('#ck-prof-copy{background:linear-gradient(135deg,#3a86ff,#2563eb);border:none;border-radius:8px;color:#fff;padding:6px 10px;font-weight:bold;cursor:pointer;font-family:inherit;font-size:11px;flex:none;}');
cssAdd('#ck-close-prof{width:100%;background:#b3283c;border:none;border-radius:9px;padding:10px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
function ckToast(msg) {
  var t = el('div', '', 'ck-toast', msg);
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
}
function ckBoostRender() {
  if (!boostBar) return;
  var h = '', now = Date.now();
  for (var i = 0; i < CK_BOOSTS.length; i++) {
    var b = CK_BOOSTS[i];
    var sec = Math.max(0, Math.round(((CK.boost[b.id] || 0) - now) / 1000));
    if (sec > 0) h += '<span class="ck-bchip" style="border-color:' + b.col + ';color:' + b.col + '">' + b.n + ' ' + ckFmtTime(sec) + '</span>';
  }
  boostBar.innerHTML = h;
  boostBar.style.display = h ? '' : 'none';
}
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
var lbBtn = el('button', 'ck-lbbtn', '', 'ЛИДЕРБОРД');
var invBtn = el('button', 'ck-invbtn', '', 'ИНВЕНТАРЬ');
rebBtn.disabled = true;
var closeBtn = el('button', 'ck-closebtn', '', 'X');
actions.appendChild(shopBtn);
actions.appendChild(earthBtn);
actions.appendChild(rebBtn);
actions.appendChild(lbBtn);
actions.appendChild(invBtn);
var player = el('div', 'ck-player');
player.className = ckMusicOn ? 'ck-on' : '';
var pInfo = el('div', 'ck-player-info');
var pName = el('div', 'ck-track-name', '', CK_TRACKS[ckTrack].n);
pName.id = 'ck-track-name';
var TPALETTE = ['ck-trk1','ck-trk2','ck-trk3','ck-trk4','ck-trk5','ck-trk6','ck-trk7','ck-trk8','ck-trk9'];
function ckTrackPaint() {
  pName.className = 'ck-track-name ' + (TPALETTE[ckTrack] || 'ck-trk1');
}
ckTrackPaint();
var pNum = el('div', 'ck-track-num', '', (ckTrack + 1) + '/' + CK_TRACKS.length);
pNum.id = 'ck-track-num';
pInfo.appendChild(pName);
pInfo.appendChild(pNum);
var TMEDIA = { 5: 'vid4.mp4', 6: 'vid1.mp4', 7: 'vid2.mp4', 8: 'vid3.mp4' };
var ckMedia = null;
function ckBuildMedia() {
  var tgt = pInfo;
  var old = document.getElementById('ck-mediabox');
  if (old && old.parentNode) { old.parentNode.removeChild(old); }
  var tm = TMEDIA[ckTrack];
  if (tm) {
    var box = el('div', 'ck-mediabox', 'ck-medbox');
    try {
      var v = document.createElement('video');
      v.src = tm; v.muted = true; v.loop = true; v.setAttribute('playsinline', '');
      v.className = 'ck-medv';
      box.appendChild(v);
      ckMedia = v;
      if (ckMusicOn) { try { v.play(); } catch (e2) {} }
    } catch (e1) { ckMedia = null; }
    if (tgt.parentNode) tgt.parentNode.insertBefore(box, tgt); else tgt.appendChild(box);
  } else {
    var wl = el('div', 'ck-mediabox', 'ck-wave' + (ckMusicOn ? ' on' : ''));
    for (var wi = 0; wi < 5; wi++) wl.appendChild(el('i', '', ''));
    if (tgt.parentNode) tgt.parentNode.insertBefore(wl, tgt); else tgt.appendChild(wl);
    ckMedia = null;
  }
}
ckBuildMedia();
var eqEl = el('div', 'ck-eq', 'ck-eq' + (ckMusicOn ? ' on' : ''));
for (var qei = 0; qei < 4; qei++) eqEl.appendChild(el('i', '', ''));
pInfo.appendChild(eqEl);
var pPrev = el('button', '', 'ck-mbtn ck-prev', '\u25C0');
var pPlay = el('button', 'ck-play', 'ck-mbtn ck-play' + (ckMusicOn ? ' on' : ''), ckMusicOn ? 'II' : '\u25B6');
var pNext = el('button', '', 'ck-mbtn ck-next', '\u25B6');
var pVol = el('input', 'ck-mvol', 'ck-mvol');
pVol.type = 'range'; pVol.min = '0'; pVol.max = '100';
pVol.value = String(Math.round(ckMusicVol * 100));
pVol.title = 'Громкость';
player.appendChild(pInfo);
player.appendChild(pPrev);
pInfo.style.flex = '1 1 auto';
player.appendChild(pPlay);
player.appendChild(pNext);
player.appendChild(pVol);
var hangs = el('div', '', 'ck-hangs');
var HCONF = [[6, 22, 'p'], [18, 38, 'b'], [31, 18, 'p'], [46, 30, 'b'], [60, 44, 'p'], [74, 26, 'b'], [88, 34, 'p']];
for (var hi = 0; hi < HCONF.length; hi++) {
  (function (hc, idx) {
    var h = el('div', '', 'ck-hang ' + (hc[2] === 'b' ? 'hbg' : 'hpt'));
    h.style.left = hc[0] + '%';
    h.style.height = hc[1] + 'px';
    h.style.animationDuration = (2.6 + (idx % 3) * 0.5) + 's';
    h.style.animationDelay = (idx * 0.35) + 's';
    hangs.appendChild(h);
  })(HCONF[hi], hi);
}
player.appendChild(hangs);
var ckPT=0, ckPTKEY='spaceClicker_pt', ckUIDKEY='spaceClicker_uid';
try{ckPT=Number(localStorage.getItem(ckPTKEY))||0;}catch(e0){}
function ckUid(){var u='';try{u=localStorage.getItem(ckUIDKEY)||'';}catch(e1){}if(!u){var cs='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',i2;for(i2=0;i2<10;i2++)u+=cs.charAt(Math.floor(Math.random()*cs.length));try{localStorage.setItem(ckUIDKEY,u);}catch(e2){}}return u;}
function ckFmtPT(s3){var d=Math.floor(s3/86400),h=Math.floor((s3%86400)/3600),m=Math.floor((s3%3600)/60);s3=s3%60;if(d>0)return d+'д '+h+'ч '+m+'м';if(h>0)return h+'ч '+m+'м '+s3+'с';if(m>0)return m+'м '+s3+'с';return s3+'с';}
setInterval(function(){if(!document.hidden)ckPT++;},1000);
setInterval(function(){try{localStorage.setItem(ckPTKEY,String(ckPT));}catch(e3){}},10000);
window.addEventListener('beforeunload',function(){try{localStorage.setItem(ckPTKEY,String(ckPT));}catch(e4){}});
var profBtn=el('button','ck-profbtn','','ПРОФИЛЬ');
var profM=el('div','ck-prof','clicker-ui hidden');
var pbox2=el('div','','');
pbox2.style.cssText='width:min(440px,92vw);background:linear-gradient(160deg,#101a2a,#0a1420);border:2px solid #7fd4ff;border-radius:16px;padding:20px;color:#fff;text-align:center;box-sizing:border-box;max-height:90vh;overflow-y:auto;';
pbox2.appendChild(el('h2','','','ПРОФИЛЬ'));
var pava=el('div','ck-prof-ava');
pbox2.appendChild(pava);
var pbody2=el('div','ck-prof-body');
pbox2.appendChild(pbody2);
var pclose2=el('button','ck-close-prof','','ЗАКРЫТЬ');
pbox2.appendChild(pclose2);
profM.appendChild(pbox2);
document.body.appendChild(profM);
function ckProfRender(){
  var nick=ckNick();
  pava.textContent=(nick.charAt(0)||'?').toUpperCase();
  pbody2.innerHTML='<div class=ck-prof-row><span class=ck-prof-l>НИК</span><span class=ck-prof-v>'+ckEsc(nick)+' 🔒</span></div><div class=ck-prof-row><span class=ck-prof-l>ID</span><span class=ck-prof-v>'+ckUid()+'</span><button id=ck-prof-copy>КОПИРОВАТЬ</button></div><div class=ck-prof-row><span class=ck-prof-l>В ИГРЕ</span><span class=ck-prof-v id=ck-prof-pt>'+ckFmtPT(ckPT)+'</span></div>';
  var cb2=document.getElementById('ck-prof-copy');
  if(cb2)cb2.addEventListener('click',function(){try{navigator.clipboard.writeText(ckUid()).then(function(){ckToast('ID скопирован');},function(){});}catch(e5){}});
}
profBtn.addEventListener('click',function(){profM.classList.remove('hidden');ckProfRender();});
pclose2.addEventListener('click',function(){profM.classList.add('hidden');});
setInterval(function(){if(!profM.classList.contains('hidden')){var el5=document.getElementById('ck-prof-pt');if(el5)el5.textContent=ckFmtPT(ckPT);}},1000);
window.__ckProfCore=1;
actions.appendChild(profBtn);
actions.appendChild(player);
actions.appendChild(closeBtn);
left.appendChild(stats);
left.appendChild(disc);
left.appendChild(prbar);
var boostBar = el('div', 'ck-boostbar');
boostBar.style.display = 'none';
left.appendChild(boostBar);
left.appendChild(actions);
if (ckOfflineGain >= 1) {
  var offNote = el('div', 'ck-offline');
  offNote.innerHTML = 'Пока тебя не было: <b>+' + fmtNum(ckOfflineGain) + '</b><span id="ck-off-x">✕</span>';
  left.insertBefore(offNote, stats);
  offNote.addEventListener('click', function () { offNote.style.display = 'none'; });
}
var right = el('div', 'clicker-right');
right.appendChild(el('h3', '', '', 'АПГРЕЙДЫ'));
var CK_AUTO = { t: [ { on: false, thr: 0 }, { on: false, thr: 0 }, { on: false, thr: 0 }, { on: false, thr: 0 } ], scroll: true };
var ckAutoUserScroll = 0;
function ckAutoSave() { try { localStorage.setItem('spaceClicker_auto', JSON.stringify({ t: CK_AUTO.t, scroll: CK_AUTO.scroll })); } catch (e) {} }
function ckAutoScroll() {
  if (!CK_AUTO.scroll || upTab === 4) return;
  if (overlay.classList.contains('hidden')) return;
  if (Date.now() - ckAutoUserScroll < 4000) return;
  for (var x = 359; x >= 0; x--) {
    var rr = upRows[x];
    if (rr && rr.row.className.indexOf('can') !== -1) { try { rr.row.scrollIntoView({ block: 'nearest' }); } catch (e) {} return; }
  }
}
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('spaceClicker_auto') || 'null');
    if (s && typeof s === 'object') {
      CK_AUTO.scroll = (s.scroll !== false);
      if (s.t && typeof s.t === 'object') {
        for (var tk = 0; tk < 4; tk++) {
          var tc = s.t[tk];
          if (tc) { CK_AUTO.t[tk].on = !!tc.on; CK_AUTO.t[tk].thr = Math.max(0, Number(tc.thr) || 0); }
        }
      }
    }
  } catch (e) {}
  var ap = el('div', 'ck-autop');
  var scl = el('button', 'ck-ap-scl', 'ck-apbtn apb-scl' + (CK_AUTO.scroll ? ' on' : ''), 'АВТО-СКРОЛЛ: ' + (CK_AUTO.scroll ? 'ВКЛ' : 'ВЫКЛ'));
  function ckParseAmt(v) {
    var st = String(v || '').trim().toUpperCase();
    if (!st) return 0;
    var mult = 1;
    var last = st.charAt(st.length - 1);
    if (!(last >= '0' && last <= '9')) { var mp = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15 }; mult = mp[last] || 1; st = st.slice(0, -1); }
    var nn = parseFloat(st);
    if (isNaN(nn)) return 0;
    return Math.floor(nn * mult);
  }
  function ckFmtAmt(n) {
    var u = [[1e18, 'Qi'], [1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (var xi = 0; xi < u.length; xi++) {
      if (n >= u[xi][0]) { var vv = n / u[xi][0]; return parseFloat(vv >= 100 ? vv.toFixed(0) : vv >= 10 ? vv.toFixed(1) : vv.toFixed(2)) + u[xi][1]; }
    }
    return '' + n;
  }
  scl.addEventListener('click', function () { CK_AUTO.scroll = !CK_AUTO.scroll; scl.className = 'ck-apbtn apb-scl' + (CK_AUTO.scroll ? ' on' : ''); scl.textContent = 'АВТО-СКРОЛЛ: ' + (CK_AUTO.scroll ? 'ВКЛ' : 'ВЫКЛ'); ckAutoSave(); });
  ap.appendChild(scl);
  var ANAMES = ['ДОХОД', 'КРИТ/ГОЛД', 'МНОЖ', 'НОВЫЕ'];
  var ACLS = ['apb-buy', 'apb-lb', 'apb-mg', 'apb-gr'];
  var ASTRAT = ['last', 'cheapest', 'last', 'cheapest'];
  for (var t3i = 0; t3i < 4; t3i++) {
    (function (tix) {
      var cfg = CK_AUTO.t[tix];
      var b = el('button', 'ck-ap-t' + tix, 'ck-apbtn ' + ACLS[tix] + (cfg.on ? ' on' : ''), ANAMES[tix] + ': ' + (cfg.on ? 'ВКЛ' : 'ВЫКЛ'));
      var inp = el('input', 'ck-ap-i' + tix, 'ck-apin');
      inp.type = 'text'; inp.placeholder = '100K / 2M / 1B'; inp.value = cfg.thr ? ckFmtAmt(cfg.thr) : '';
      b.addEventListener('click', function () { cfg.on = !cfg.on; b.className = 'ck-apbtn ' + ACLS[tix] + (cfg.on ? ' on' : ''); b.textContent = ANAMES[tix] + ': ' + (cfg.on ? 'ВКЛ' : 'ВЫКЛ'); ckAutoSave(); });
      inp.addEventListener('input', function () { cfg.thr = ckParseAmt(inp.value); ckAutoSave(); });
      ap.appendChild(b); ap.appendChild(inp);
    })(t3i);
  }
  right.appendChild(ap);
  setInterval(function () {
    if (window.__CKEX && window.__CKEX.rbAuto && CK.clicks >= 1e14) return;
    for (var t4 = 0; t4 < 4; t4++) {
      var cfg2 = CK_AUTO.t[t4];
      if (!cfg2.on) continue;
      var bought = 0;
      while (bought < 50) {
        var pick = -1, pcost = 0;
        if (ASTRAT[t4] === 'last') {
          for (var xa = 359; xa >= 0; xa--) {
            if (ckUpgGrp(xa) !== t4) continue;
            var ca = ckUpgCost(xa);
            if (CK.clicks - ca >= cfg2.thr) { pick = xa; pcost = ca; break; }
          }
        } else {
          var bc = Infinity;
          for (var xb2 = 0; xb2 < 360; xb2++) {
            if (ckUpgGrp(xb2) !== t4) continue;
            var cb = ckUpgCost(xb2);
            if (CK.clicks - cb >= cfg2.thr && cb < bc) { bc = cb; pick = xb2; }
          }
          if (pick >= 0) pcost = bc;
        }
        if (pick < 0) break;
        CK.clicks -= pcost;
        CK.lv[pick]++;
        bought++;
      }
      if (bought) { sfxBuy(); ckSave(); render(true); }
    }
  }, 100);
})();
var tabs = el('div', 'ck-tabs');
var tab1 = el('button', 'ck-tab0', 'ck-tab on', 'ДОХОД');
var tab2 = el('button', 'ck-tab1', 'ck-tab', 'КРИТ / ГОЛД');
tabs.appendChild(tab1);
tabs.appendChild(tab2);
right.appendChild(tabs);
var uplist = el('div', 'ck-uplist');
right.appendChild(uplist);
uplist.addEventListener('wheel', function () { ckAutoUserScroll = Date.now(); }, { passive: true });
uplist.addEventListener('touchmove', function () { ckAutoUserScroll = Date.now(); }, { passive: true });
uplist.addEventListener('animationend', function (ev) {
  var t = ev.target;
  if (t && t.style && t.style.animation && t.style.animation.indexOf('ckRowIn') !== -1) { t.style.animation = ''; t.style.animationDelay = ''; }
});
var tab3 = el('button', 'ck-tab2', 'ck-tab', 'МНОЖ / MEGA');
var tab4 = el('button', 'ck-tab3', 'ck-tab', 'НОВЫЕ');
var tab5 = el('button', 'ck-tab4', 'ck-tab', 'НАСТРОЙКИ');
tabs.appendChild(tab3);
tabs.appendChild(tab4);
tabs.appendChild(tab5);
var tabBtns = [tab1, tab2, tab3, tab4, tab5];
var upTab = 0;
var ckSettingsPanel = null;
function ckUpgGrp(x) {
  if (x >= 300) return 3;
  var t = CK_UPG[x].type;
  if (t === 'auto' || t === 'power') return 0;
  if (t === 'crit' || t === 'gold') return 1;
  return 2;
}
var ckLastTab = -1;
function ckTabApply() {
  var ch = (upTab !== ckLastTab);
  var vis = 0;
  for (var x = 0; x < 360; x++) {
    var rr = upRows[x];
    if (!rr) continue;
    var show = (ckUpgGrp(x) === upTab);
    rr.row.style.display = show ? '' : 'none';
    if (show && ch) {
      try { rr.row.style.animation = 'none'; void rr.row.offsetWidth; rr.row.style.animation = 'ckRowIn .26s ease both'; rr.row.style.animationDelay = (Math.min(vis, 12) * 20) + 'ms'; } catch (e5) {}
      vis++;
    } else if (show) {
      rr.row.style.animation = '';
      rr.row.style.animationDelay = '';
    }
  }
  for (var tb = 0; tb < tabBtns.length; tb++) tabBtns[tb].className = 'ck-tab' + (upTab === tb ? ' on' : '');
  var so = (upTab === 4);
  uplist.style.display = so ? 'none' : '';
  if (ckSettingsPanel) ckSettingsPanel.style.display = so ? '' : 'none';
  ckLastTab = upTab;
}
tab1.addEventListener('click', function () { upTab = 0; ckTabApply(); });
tab2.addEventListener('click', function () { upTab = 1; ckTabApply(); });
tab3.addEventListener('click', function () { upTab = 2; ckTabApply(); });
tab4.addEventListener('click', function () { upTab = 3; ckTabApply(); });
tab5.addEventListener('click', function () { upTab = 4; ckTabApply(); });
var CK_UI = { sfx: true, font: 100, ui: 100, bg: 0, t2: 0 };
var ckBgVid = null;
var T2FILES = ['', 'back1.mp4', 'back2.mp4', 'back3.mp4', 'back4.mp4'];
var T2CLASSES = ['', 't2w', 't2g', 't2p', 't2y'];
function ckT2Apply() {
  panel.className = 'clicker-panel' + (CK_UI.t2 ? ' t2-theme ' + T2CLASSES[CK_UI.t2] : '');
  var left0 = document.getElementById('clicker-left');
  var old0 = document.getElementById('ck-bgvid');
  if (old0 && old0.parentNode) old0.parentNode.removeChild(old0);
  ckBgVid = null;
  if (CK_UI.t2 && left0) {
    try {
      var v0 = document.createElement('video');
      v0.id = 'ck-bgvid';
      v0.src = T2FILES[CK_UI.t2];
      v0.muted = true; v0.loop = true; v0.setAttribute('playsinline', '');
      left0.insertBefore(v0, left0.firstChild);
      if (ckMusicOn || true) { try { v0.play(); } catch (e12) {} }
      ckBgVid = v0;
    } catch (e11) { ckBgVid = null; }
  }
}
var CK_BGS = [null, 'linear-gradient(160deg,#101638,#0b1026)', 'linear-gradient(160deg,#2a1030,#12051a)', 'linear-gradient(160deg,#0a2a1e,#04140d)', 'linear-gradient(160deg,#301a10,#140a04)', 'linear-gradient(160deg,#101c30,#050a12)'];
var uiSwatches = [];
function ckUiSave() { try { localStorage.setItem('spaceClicker_ui', JSON.stringify(CK_UI)); } catch (e) {} }
function ckUiApply() {
  var z = CK_UI.ui / 100;
  var iw = window.innerWidth || 1200;
  var ih = window.innerHeight || 800;
  var land = (ih <= 540) && (iw > ih);
  panel.style.transform = '';
  panel.style.transformOrigin = '';
  panel.style.zoom = '';
  panel.style.width = '';
  panel.style.height = '';
  if (z !== 1) {
    panel.style.zoom = String(z);
    panel.style.width = Math.round(Math.min(1060, iw * (land ? 0.97 : 0.96)) / z) + 'px';
    panel.style.height = Math.round(Math.min(land ? 4000 : 640, ih * (land ? 0.97 : 0.92)) / z) + 'px';
  }
  var fz = CK_UI.font / 100;
  stats.style.zoom = (fz !== 1) ? String(fz) : '';
  uplist.style.zoom = (fz !== 1) ? String(fz) : '';
  panel.style.background = CK_BGS[CK_UI.bg] || '';
  for (var s = 0; s < uiSwatches.length; s++) uiSwatches[s].className = 'ck-swot' + (CK_UI.bg === s ? ' on' : '');
  ckT2Apply();
}
var _ckBeepOrig = ckBeep;
ckBeep = function (freq, dur, type, gain, slideTo) { if (CK_UI.sfx === false) return; _ckBeepOrig(freq, dur, type, gain, slideTo); };
(function () {
  try { var s = JSON.parse(localStorage.getItem('spaceClicker_ui') || 'null'); if (s && typeof s === 'object') { CK_UI.sfx = (s.sfx !== false); CK_UI.font = Math.max(80, Math.min(160, Number(s.font) || 100)); CK_UI.ui = Math.max(70, Math.min(140, Number(s.ui) || 100)); CK_UI.bg = Math.max(0, Math.min(CK_BGS.length - 1, Number(s.bg) || 0)); CK_UI.t2 = Math.max(0, Math.min(4, Number(s.t2) || 0)); } } catch (e) {}
  ckSettingsPanel = el('div', 'ck-setp');
  ckSettingsPanel.style.display = 'none';
  ckSettingsPanel.appendChild(el('div', '', 'ck-seth', 'НАСТРОЙКИ КЛИКЕРА'));
  var sfxBtn = el('button', '', 'ck-apbtn' + (CK_UI.sfx ? ' on' : ''), 'ЗВУКИ (SFX): ' + (CK_UI.sfx ? 'ВКЛ' : 'ВЫКЛ'));
  sfxBtn.addEventListener('click', function () { CK_UI.sfx = !CK_UI.sfx; sfxBtn.className = 'ck-apbtn' + (CK_UI.sfx ? ' on' : ''); sfxBtn.textContent = 'ЗВУКИ (SFX): ' + (CK_UI.sfx ? 'ВКЛ' : 'ВЫКЛ'); ckUiSave(); });
  ckSettingsPanel.appendChild(sfxBtn);
  var musBtn = el('button', '', 'ck-apbtn' + (ckMusicOn ? ' on' : ''), 'МУЗЫКА: ' + (ckMusicOn ? 'ВКЛ' : 'ВЫКЛ'));
  musBtn.addEventListener('click', function () {
    ckMusicOn = !ckMusicOn;
    try { localStorage.setItem(CK_MUSIC_KEY, ckMusicOn ? '1' : '0'); } catch (e) {}
    ckMusicSync();
    if (ckMusicOn) ckMusicPlay(); else ckMusicPause();
    musBtn.className = 'ck-apbtn' + (ckMusicOn ? ' on' : '');
    musBtn.textContent = 'МУЗЫКА: ' + (ckMusicOn ? 'ВКЛ' : 'ВЫКЛ');
    var qe1 = document.getElementById('ck-eq');
    if (qe1) qe1.className = 'ck-eq' + (ckMusicOn ? ' on' : '');
    var pl1 = document.getElementById('ck-player');
    if (pl1) pl1.className = ckMusicOn ? 'ck-on' : '';
  });
  ckSettingsPanel.appendChild(musBtn);
  function mkRange(label, key, min, max) {
    var row = el('div', '', 'ck-setrow');
    var l = el('span', '', 'ck-setl', label + ': ' + CK_UI[key] + '%');
    var r = el('input', '', 'ck-setr');
    r.type = 'range'; r.min = String(min); r.max = String(max); r.value = String(CK_UI[key]);
    r.addEventListener('input', function () { CK_UI[key] = parseInt(r.value, 10) || 100; l.textContent = label + ': ' + CK_UI[key] + '%'; ckUiApply(); ckUiSave(); });
    row.appendChild(l); row.appendChild(r);
    ckSettingsPanel.appendChild(row);
  }
  mkRange('Размер шрифта', 'font', 80, 160);
  mkRange('Масштаб UI', 'ui', 70, 140);
  var swRow = el('div', '', 'ck-setrow');
  swRow.appendChild(el('span', '', 'ck-setl', 'Фон панели:'));
  for (var bi = 0; bi < CK_BGS.length; bi++) {
    (function (idx) {
      var sw = el('button', '', 'ck-swot');
      sw.style.background = CK_BGS[idx] || 'linear-gradient(160deg,#141a3a,#0b1026)';
      sw.addEventListener('click', function () { CK_UI.bg = idx; ckUiApply(); ckUiSave(); });
      swRow.appendChild(sw);
      uiSwatches.push(sw);
    })(bi);
  }
  ckSettingsPanel.appendChild(swRow);
  ckSettingsPanel.appendChild(el('div', '', 'ck-seth', 'ТЕМА V2'));
  var T2NAMES = ['СТАНДАРТ', 'БЕЛАЯ', 'СЕРАЯ', 'РОЗОВАЯ', 'ЖЕЛТАЯ'];
  for (var t2i = 0; t2i < 5; t2i++) {
    (function (t2x) {
      var tb2 = el('button', '', 'ck-apbtn ck-t2b' + (CK_UI.t2 === t2x ? ' on' : ''), T2NAMES[t2x]);
      tb2.addEventListener('click', function () {
        CK_UI.t2 = t2x;
        var all2 = ckSettingsPanel.querySelectorAll('.ck-t2b');
        for (var ai = 0; ai < all2.length; ai++) all2[ai].className = 'ck-apbtn ck-t2b' + (parseInt(all2[ai].getAttribute('data-t2'), 10) === t2x ? ' on' : '');
        ckUiApply(); ckUiSave();
      });
      tb2.setAttribute('data-t2', t2x);
      ckSettingsPanel.appendChild(tb2);
    })(t2i);
  }
  ckSettingsPanel.appendChild(swRow);
  right.appendChild(ckSettingsPanel);
  ckUiApply();
  window.addEventListener('resize', function () { ckUiApply(); });
})();
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
var laserCost = el('div', '', '', 'Price: 100K');
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
var earthCost = el('div', '', '', 'Price: 1M');
var earthBuy = el('button', 'ck-buy-earth', '', 'КУПИТЬ');
earthRight.appendChild(earthCost);
earthRight.appendChild(earthBuy);
itemEarth.appendChild(earthInfo);
itemEarth.appendChild(earthRight);
shopBox.appendChild(itemEarth);
var itemGold = el('div', 'ck-item-gold', 'ck-shop-item');
var goldInfo = el('div');
goldInfo.innerHTML = '<b>GOLDEN TOUCH</b><br><small>+50% ко всем доходам навсегда</small>';
var goldRight = el('div');
goldRight.style.textAlign = 'right';
var goldCost = el('div', '', '', 'Price: 100M');
var goldBuy = el('button', 'ck-buy-gold', '', 'КУПИТЬ');
goldRight.appendChild(goldCost);
goldRight.appendChild(goldBuy);
itemGold.appendChild(goldInfo);
itemGold.appendChild(goldRight);
shopBox.appendChild(itemGold);
var itemCrit = el('div', 'ck-item-crit', 'ck-shop-item');
var critInfo = el('div');
critInfo.innerHTML = '<b>CRIT MASTER</b><br><small>+15% шанс крита (x5 за клик)</small>';
var critRight = el('div');
critRight.style.textAlign = 'right';
var critCost = el('div', '', '', 'Price: 1B');
var critBuy = el('button', 'ck-buy-crit', '', 'КУПИТЬ');
critRight.appendChild(critCost);
critRight.appendChild(critBuy);
itemCrit.appendChild(critInfo);
itemCrit.appendChild(critRight);
shopBox.appendChild(itemCrit);
var itemWarp = el('div', 'ck-item-warp', 'ck-shop-item');
var warpInfo = el('div');
warpInfo.innerHTML = '<b>TIME WARP</b><br><small>Оффлайн-доход 100% вместо 50%</small>';
var warpRight = el('div');
warpRight.style.textAlign = 'right';
var warpCost = el('div', '', '', 'Price: 10B');
var warpBuy = el('button', 'ck-buy-warp', '', 'КУПИТЬ');
warpRight.appendChild(warpCost);
warpRight.appendChild(warpBuy);
itemWarp.appendChild(warpInfo);
itemWarp.appendChild(warpRight);
shopBox.appendChild(itemWarp);
shopBox.appendChild(el('h3', '', '', 'БУСТЕРЫ (1 ЧАС)'));
var boostBtns = [];
(function () {
  for (var bi = 0; bi < CK_BOOSTS.length; bi++) {
    (function (b) {
      var row = el('div', 'ck-item-boost-' + b.id, 'ck-shop-item');
      var info = el('div');
      info.innerHTML = '<b>' + b.n + '</b><br><small>' + b.desc + ' · ' + ckFmtTime(b.dur) + '</small>';
      var side = el('div');
      side.style.textAlign = 'right';
      var flask = el('div', '', 'ck-flask');
      flask.style.setProperty('--fc', b.col);
      var costEl = el('div', '', '', 'Price: ' + fmtNum(b.price));
      var buy = el('button', 'ck-buy-boost-' + b.id, '', 'КУПИТЬ');
      side.appendChild(flask);
      side.appendChild(costEl);
      side.appendChild(buy);
      row.appendChild(info);
      row.appendChild(side);
      shopBox.appendChild(row);
      boostBtns.push({ b: b, buy: buy });
      buy.addEventListener('click', function () {
        if (CK.clicks < b.price) return;
        CK.clicks -= b.price;
        ckBoostGrant(b.id, b.dur);
        sfxBuy();
        ckSave();
        ckBoostRender();
        ckToast('КУПЛЕНО: ' + b.n + ' на ' + ckFmtTime(b.dur));
        renderShop();
        render();
      });
    })(CK_BOOSTS[bi]);
  }
})();
var closeShopBtn = el('button', 'ck-close-shop', '', 'ЗАКРЫТЬ');
shopBox.appendChild(closeShopBtn);
shop.appendChild(shopBox);
document.body.appendChild(shop);
var inv = el('div', 'ck-inv', 'clicker-ui hidden');
var invBox = el('div', 'ck-inv-box');
invBox.appendChild(el('h2', '', '', 'ИНВЕНТАРЬ'));
var invGrid = el('div', 'ck-inv-grid');
invBox.appendChild(invGrid);
var invEmpty = el('div', 'ck-inv-empty', '', 'Пока пусто. Дроп редкий — кликай по планете.');
invBox.appendChild(invEmpty);
var invClose = el('button', 'ck-close-inv', '', 'ЗАКРЫТЬ');
invBox.appendChild(invClose);
inv.appendChild(invBox);
document.body.appendChild(inv);
function ckInvRender() {
  var cnt = {}, i;
  for (i = 0; i < CK.inv.length; i++) cnt[CK.inv[i]] = (cnt[CK.inv[i]] || 0) + 1;
  var h = '';
  for (var k = 0; k < CK_ITEMS.length; k++) {
    var it = CK_ITEMS[k];
    var c = cnt[it.id] || 0;
    if (!c) continue;
    h += '<div class="ck-inv-card" style="border-color:' + it.col + '"><div class="ck-inv-orb" style="background:radial-gradient(circle at 34% 30%,' + it.col + ',rgba(0,0,0,.65))"></div><b>' + it.n + '</b><small>' + it.rar + '</small><span class="ck-inv-n">x' + c + '</span></div>';
  }
  invGrid.innerHTML = h;
  invEmpty.style.display = h ? 'none' : '';
}
invBtn.addEventListener('click', function () { inv.classList.remove('hidden'); ckInvRender(); });
invClose.addEventListener('click', function () { inv.classList.add('hidden'); });
var lb = el('div', 'ck-lb', 'clicker-ui hidden');
var lbBox = el('div', 'ck-lb-box');
lbBox.appendChild(el('h2', '', '', 'ЛИДЕРБОРД'));
var lbMe = el('div', 'ck-lb-me', '', '');
lbBox.appendChild(lbMe);
var lbList = el('div', 'ck-lb-list');
lbBox.appendChild(lbList);
var lbClose = el('button', 'ck-close-lb', '', 'ЗАКРЫТЬ');
lbBox.appendChild(lbClose);
lb.appendChild(lbBox);
document.body.appendChild(lb);
function renderLb() {
  var arr = ckLbList(), h = '', i;
  if (!arr.length) h = '<div class="ck-lb-empty">Пока никто не играл</div>';
  for (i = 0; i < arr.length; i++) {
    var md = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
    var mine = arr[i].nick === ckNick();
    h += '<div class="ck-lb-row' + (mine ? ' me' : '') + '"><span class="p">' + md + '</span>' +
      '<span class="n">' + ckEsc(arr[i].nick) + '</span>' +
      '<span class="s">' + fmtNum(arr[i].best) + '</span></div>';
  }
  lbList.innerHTML = h;
  lbMe.textContent = 'Твой ник: ' + ckNick() + ' · сейчас: ' + fmtNum(CK.clicks);
}
var laserBtn = el('button', 'laser-fire-btn', '', 'ЛАЗЕР');
document.body.appendChild(laserBtn);
var earthExit = el('button', 'earth-exit-btn', '', 'Покинуть Землю');
document.body.appendChild(earthExit);
if (CK.laser) laserBtn.style.display = 'block';
ckMusicSync();
var ckRegBox = el('div', 'ck-reg', 'clicker-ui hidden');
var rbox = el('div', '', 'ck-reg-box');
rbox.appendChild(el('h2', '', '', 'РЕГИСТРАЦИЯ'));
rbox.appendChild(el('div', '', 'ck-reg-lbl', 'Введи ник (2-16 символов).\u00A0\u00A0Поменять его будет НЕЛЬЗЯ!'));
var rInp = el('input', 'ck-reg-inp');
rInp.maxLength = 16;
rInp.placeholder = 'Твой ник';
var rBtn = el('button', 'ck-reg-btn', '', 'ИГРАТЬ');
var rErr = el('div', 'ck-reg-err', '', '');
rbox.appendChild(rInp);
rbox.appendChild(rBtn);
rbox.appendChild(rErr);
ckRegBox.appendChild(rbox);
document.body.appendChild(ckRegBox);
openBtn.addEventListener('click', function () {
  try {
    if (!localStorage.getItem('spaceClicker_nick_reg')) {
      ckRegBox.classList.remove('hidden');
      setTimeout(function () { try { rInp.focus(); } catch (e13) {} }, 80);
    }
  } catch (e14) {}
});
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
  rebBtn.textContent = CK.clicks >= 1e14 ? 'ПЕРЕРОДИТЬСЯ x2' : 'x2 (100T)';
  earthBtn.style.display = CK.earth ? '' : 'none';
  if (forceUp) renderUpgrades();
  else scheduleUpg();
}
(function initUpgrades() {
  for (var x = 0; x < 360; x++) {
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
  ckTabApply();
})();
function renderUpgrades() {
  for (var x = 0; x < 360; x++) {
    var r = upRows[x];
    var u = CK_UPG[x];
    var cost = ckUpgCost(x);
    var can = CK.clicks >= cost;
    r.row.className = 'ck-up' + (can ? ' can' : ' no') + (u.type === 'auto' ? ' aut' : '');
    r.lvl.textContent = ' ур.' + CK.lv[x];
    r.eff.textContent = u.type === 'auto' ? ('+' + fmtNum(u.val * CK.mult) + ' авто/с') : u.type === 'power' ? ('+' + fmtNum(u.val * CK.mult) + ' за клик') : u.type === 'crit' ? ('+' + u.val + '% крит') : u.type === 'critx' ? ('+' + (CK.lv[x] > 0 ? (1 + Math.round((CK.lv[x] - 1) * 10) / 10) : 1) + 'x крит-множ') : u.type === 'boost' ? ('+' + u.val + 'с к бустерам') : u.type === 'drop' ? ('+' + (u.val * 100).toFixed(2) + '% дропа') : ('+' + u.val + '% ко всему');
    r.btn.textContent = fmtNum(cost);
    r.btn.disabled = !can;
  }
  ckTabApply();
  ckAutoScroll();
}
var floatCount = 0;
disc.addEventListener('click', function (ev) {
  var gain = ckPower();
  var isCrit = Math.random() * 100 < ckCrit();
  if (isCrit) gain *= ckCritMul();
  CK.clicks += gain;
  sfxClick();
  var evs = ckManualClick();
  for (var ei = 0; ei < evs.length; ei++) {
    var ep = evs[ei].split(':');
    if (ep[0] === 'BOOST') { var bo = ckBoostById(ep[1]); ckToast('БУСТЕР: ' + bo.n + ' на ' + ckFmtTime(bo.dur)); }
    else { var io = ckItemById(ep[1]); ckToast('ДРОП: ' + io.n + ' [' + io.rar + ']'); }
  }
  if (evs.length) { ckInvRender(); ckBoostRender(); }
  ckSave();
  render();
  try { disc.animate([{ transform: 'scale(1)' }, { transform: 'scale(.93)' }, { transform: 'scale(1)' }], { duration: 140 }); } catch (e) {}
  if (floatCount > 8) return;
  floatCount++;
  var f = el('div', '', 'ck-float' + (isCrit ? ' crit' : ''), (isCrit ? 'CRIT +' : '+') + fmtNum(gain));
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
  sfxBuy();
  ckSave();
  render(true);
});
openBtn.addEventListener('click', function () { overlay.classList.remove('hidden'); window.__uiPaused = true; render(true); ckSave(); ckMusicPlay(); ckBoostRender(); });
closeBtn.addEventListener('click', function () { overlay.classList.add('hidden'); shop.classList.add('hidden'); window.__uiPaused = false; ckMusicPause(); });
pPlay.addEventListener('click', function () {
  ckMusicOn = !ckMusicOn;
  try { localStorage.setItem(CK_MUSIC_KEY, ckMusicOn ? '1' : '0'); } catch (e) {}
  ckMusicSync();
  if (ckMusicOn) ckMusicPlay(); else ckMusicPause();
  var qe0 = document.getElementById('ck-eq');
  if (qe0) qe0.className = 'ck-eq' + (ckMusicOn ? ' on' : '');
  var pl0 = document.getElementById('ck-player');
  if (pl0) pl0.className = ckMusicOn ? 'ck-on' : '';
});
pPrev.addEventListener('click', function () { ckTrackPrev(); });
pNext.addEventListener('click', function () { ckTrackNext(); });
pVol.addEventListener('input', function () {
  ckMusicVol = Math.max(0, Math.min(1, parseInt(pVol.value, 10) / 100));
  if (ckAudio) ckAudio.volume = ckMusicVol;
  try { localStorage.setItem(CK_MVOL_KEY, String(pVol.value)); } catch (e) {}
});
rBtn.addEventListener('click', function () {
  var v = (rInp.value || '').trim();
  if (!/^[A-Za-zА-Яа-я0-9_\-]{2,16}$/.test(v)) { rErr.textContent = 'Ник: 2-16 символов, буквы/цифры/_/-'; return; }
  try { localStorage.setItem('spaceClicker_nick', v); localStorage.setItem('spaceClicker_nick_reg', '1'); } catch (e15) {}
  ckRegBox.classList.add('hidden');
  sfxBuy();
  ckToast('Ник сохранен: ' + v);
});
rInp.addEventListener('keydown', function (e16) { if (e16.key === 'Enter') rBtn.click(); });
shopBtn.addEventListener('click', function () { shop.classList.remove('hidden'); renderShop(); });
closeShopBtn.addEventListener('click', function () { shop.classList.add('hidden'); });
lbBtn.addEventListener('click', function () { shop.classList.add('hidden'); lb.classList.remove('hidden'); renderLb(); });
lbClose.addEventListener('click', function () { lb.classList.add('hidden'); });
rebBtn.addEventListener('click', function () {
  if (CK.clicks < 1e14) return;
  CK.mult *= 2;
  CK.rebirths++;
  sfxRebirth();
  CK.clicks = 0;
  CK.lv = [];
  for (var x = 0; x < 360; x++) CK.lv.push(0);
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
  goldBuy.disabled = CK.gold || CK.clicks < 1e8;
  goldBuy.textContent = CK.gold ? 'КУПЛЕНО' : 'КУПИТЬ';
  itemGold.className = 'ck-shop-item' + (CK.gold ? ' owned' : '');
  critBuy.disabled = CK.critM || CK.clicks < 1e9;
  critBuy.textContent = CK.critM ? 'КУПЛЕНО' : 'КУПИТЬ';
  itemCrit.className = 'ck-shop-item' + (CK.critM ? ' owned' : '');
  warpBuy.disabled = CK.warp || CK.clicks < 1e10;
  warpBuy.textContent = CK.warp ? 'КУПЛЕНО' : 'КУПИТЬ';
  itemWarp.className = 'ck-shop-item' + (CK.warp ? ' owned' : '');
  for (var q = 0; q < boostBtns.length; q++) {
    var bb = boostBtns[q];
    var ok = CK.clicks >= bb.b.price;
    bb.buy.disabled = !ok;
    bb.buy.textContent = ok ? 'КУПИТЬ' : 'МАЛО';
  }
}
laserBuy.addEventListener('click', function () {
  if (CK.laser || CK.clicks < 1e5) return;
  CK.clicks -= 1e5;
  CK.laser = true;
  sfxBuy();
  ckSave();
  laserBtn.style.display = 'block';
  renderShop();
  render();
});
earthBuy.addEventListener('click', function () {
  if (CK.earth || CK.clicks < 1e6) return;
  CK.clicks -= 1e6;
  CK.earth = true;
  sfxBuy();
  ckSave();
  renderShop();
  render();
});
goldBuy.addEventListener('click', function () {
  if (CK.gold || CK.clicks < 1e8) return;
  CK.clicks -= 1e8;
  CK.gold = true;
  sfxBuy();
  ckSave();
  renderShop();
  render();
});
critBuy.addEventListener('click', function () {
  if (CK.critM || CK.clicks < 1e9) return;
  CK.clicks -= 1e9;
  CK.critM = true;
  sfxBuy();
  ckSave();
  renderShop();
  render();
});
warpBuy.addEventListener('click', function () {
  if (CK.warp || CK.clicks < 1e10) return;
  CK.clicks -= 1e10;
  CK.warp = true;
  sfxBuy();
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
  if (ckBoostPrune()) ckSave();
  ckBoostRender();
}, 1000);
var beams = [];
var booms = [];
function destroyAsteroid(group, point) {
  var hi = asteroidHitboxes.indexOf(group.children[group.children.length - 1]);
  if (hi !== -1) asteroidHitboxes.splice(hi, 1);
  var ai = asteroids.indexOf(group);
  if (ai !== -1) asteroids.splice(ai, 1);
  scene.remove(group);
  if (typeof artifactOverlay !== 'undefined') {
    artifactOverlay.textContent = 'Астероид уничтожен лазером!';
    artifactOverlay.style.display = 'block';
    setTimeout(function () { artifactOverlay.style.display = 'none'; }, 1600);
  }
  var flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: beams.length >= 0 ? flashTex() : null, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flash.position.copy(point);
  flash.scale.set(60, 60, 1);
  scene.add(flash);
  booms.push({ s: flash, life: 1 });
}
var _flashTexCache = null;
function flashTex() {
  if (_flashTexCache) return _flashTexCache;
  var c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  var x = c.getContext('2d');
  var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,240,200,1)');
  g.addColorStop(0.35, 'rgba(255,140,40,.85)');
  g.addColorStop(1, 'rgba(255,60,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  _flashTexCache = new THREE.CanvasTexture(c);
  return _flashTexCache;
}
function shootLaser(cx, cy) {
  mouse.x = (cx / window.innerWidth) * 2 - 1;
  mouse.y = -(cy / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var targets = planetHitMeshes.concat(statueHitboxes, [dragonHitbox, mwHitbox, bhCore, errorMesh, manHitbox, shipHitbox], asteroidHitboxes);
  var hits = raycaster.intersectObjects(targets, false);
  var end = hits.length > 0 ? hits[0].point.clone() : raycaster.ray.at(900, new THREE.Vector3());
  if (hits.length > 0 && asteroidHitboxes.indexOf(hits[0].object) !== -1) {
    destroyAsteroid(hits[0].object.parent, end);
  }
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
  for (var m = booms.length - 1; m >= 0; m--) {
    var bo = booms[m];
    bo.life -= 0.04;
    bo.s.scale.multiplyScalar(1.06);
    bo.s.material.opacity = Math.max(bo.life, 0);
    if (bo.life <= 0) {
      scene.remove(bo.s);
      booms.splice(m, 1);
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
pcss('#ck-disc{width:min(320px,46vw,48vh);height:min(320px,46vw,48vh);flex:none;flex-shrink:0;aspect-ratio:1/1;}');
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
