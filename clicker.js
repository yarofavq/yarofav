﻿﻿// ==================== PLANET CLICKER MODULE ====================
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
  { f: 'clicker-music-9.mp3', n: 'Полка, YASMI - Омут' },
  { f: 'clicker-music-10.mp3', n: 'ТАБЛЕТКА - плохой парень' },
  { f: 'clicker-music-11.mp3', n: 'Voskresenskii - Еду по Москве' },
  { f: 'clicker-music-12.mp3', n: 'Кобыла - daybe' },
  { f: 'clicker-music-13.mp3', n: 'Кобыла (Remix) - daybe' },
  { f: 'clicker-music-14.mp3', n: 'ahhnahh - заряжаю свой мобильный' }
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
var CK_BOOST_EVERY = 5000;
var CK_BOOST_MAX = 3600;
var CK_BOOSTS = [
  { id: 'frenzy', n: 'Click Frenzy', col: '#ff4d6d', dur: 60,   mult: 5, tgt: 'click', price: 2.5e11, desc: 'x5 за клик' },
  { id: 'surge',  n: 'Auto Surge',   col: '#3a86ff', dur: 1800, mult: 3, tgt: 'auto',  price: 7.5e11, desc: 'x3 авто/с' },
  { id: 'gold',   n: 'Gold Rush',    col: '#ffd23f', dur: 3600, mult: 2, tgt: 'all',   price: 5e12, desc: 'x2 ко всему' },
  { id: 'novaflask', n: 'Nova Flask', col: '#7fd4ff', dur: 300, mult: 4, tgt: 'click', price: 2e12, desc: 'x4 за клик' },
  { id: 'quasar', n: 'Quasar Brew', col: '#37e08a', dur: 900, mult: 4, tgt: 'auto', price: 4e12, desc: 'x4 авто/с' },
  { id: 'hyperion', n: 'Hyperion Draft', col: '#b04dff', dur: 1200, mult: 3, tgt: 'all', price: 2e13, desc: 'x3 ко всему' },
  { id: 'voidflask', n: 'Void Elixir', col: '#ff4d6d', dur: 120, mult: 10, tgt: 'click', price: 1e13, desc: 'x10 за клик' },
  { id: 'pstorm', n: 'Photon Storm', col: '#7fffd4', dur: 90, mult: 7, tgt: 'click', price: 1e14, desc: 'x7 за клик' },
  { id: 'chrono', n: 'Chrono Field', col: '#c0c0ff', dur: 1800, mult: 5, tgt: 'all', price: 5e13, desc: 'x5 ко всему' },
  { id: 'abyss', n: 'Эликсир Бездны', col: '#9333ea', dur: 240, mult: 12, tgt: 'click', price: 5e14, desc: 'x12 за клик · Тёмная материя' },
  { id: 'supernova', n: 'Дыхание Сверхновой', col: '#f97316', dur: 600, mult: 6, tgt: 'auto', price: 1e15, desc: 'x6 авто/с · Звёздная плазма' },
  { id: 'singularity', n: 'Катализатор Сингулярности', col: '#ec4899', dur: 1200, mult: 8, tgt: 'all', price: 5e15, desc: 'x8 ко всему доходу' },
  { id: 'aether', n: 'Астральный Нектар', col: '#06b6d4', dur: 3600, mult: 4, tgt: 'all', price: 2e16, desc: 'x4 ко всему на целый час' },
  { id: 'godtear', n: 'Слеза Демиурга', col: '#eab308', dur: 180, mult: 25, tgt: 'click', price: 1e17, desc: 'x25 за клик · Абсолютная мощь' }
];
var CK_BW = { frenzy: 10, surge: 10, gold: 8, novaflask: 10, quasar: 8, hyperion: 6, voidflask: 6, pstorm: 5, chrono: 5, abyss: 3, supernova: 3, singularity: 2, aether: 2, godtear: 1 };
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
    var _bw = 0, _bi;
    for (_bi = 0; _bi < CK_BOOSTS.length; _bi++) _bw += (CK_BW[CK_BOOSTS[_bi].id] || 10);
    var _br = Math.random() * _bw, b = CK_BOOSTS[0];
    for (_bi = 0; _bi < CK_BOOSTS.length; _bi++) { _br -= (CK_BW[CK_BOOSTS[_bi].id] || 10); if (_br <= 0) { b = CK_BOOSTS[_bi]; break; } }
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
['#e9d5ff', '#9333ea', '#3b0764']
];
var CK = { clicks: 0, mult: 1, rebirths: 0, lv: [], laser: false, earth: false, gold: false, critM: false, warp: false, boost: {}, inv: [], mc: 0, bossCoins: 0, bHpLv: 0, bDmgLv: 0, bShieldLv: 0, bVampLv: 0, bCritLv: 0 };
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
  for (k in all) if (Object.prototype.hasOwnProperty.call(all, k) && k !== 'Гость') {
    if (k === 'Гость') continue;
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
      lv: CK.lv, laser: CK.laser, earth: CK.earth, gold: CK.gold, critM: CK.critM, warp: CK.warp, boost: CK.boost, inv: CK.inv, mc: CK.mc, offVault: !!CK.offVault, bossCoins: CK.bossCoins, bHpLv: CK.bHpLv, bDmgLv: CK.bDmgLv, bShieldLv: CK.bShieldLv, bVampLv: CK.bVampLv, bCritLv: CK.bCritLv, ts: Date.now()
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
  CK.bossCoins = Number(raw.bossCoins) || 0;
  CK.bHpLv = Number(raw.bHpLv) || 0;
  CK.bDmgLv = Number(raw.bDmgLv) || 0;
  CK.bShieldLv = Number(raw.bShieldLv) || 0;
  CK.bVampLv = Number(raw.bVampLv) || 0;
  CK.bCritLv = Number(raw.bCritLv) || 0;
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
cssAdd('#clicker-left{flex:1.35;display:flex;flex-direction:column;align-items:center;padding:14px 10px;gap:10px;min-width:0;height:100%;max-height:100%;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;box-sizing:border-box;}');
cssAdd('#clicker-left::-webkit-scrollbar{width:6px;}');
cssAdd('#clicker-left::-webkit-scrollbar-track{background:rgba(8,12,30,0.5);border-radius:10px;}');
cssAdd('#clicker-left::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#38bdf8,#818cf8);border-radius:10px;box-shadow:0 0 8px rgba(56,189,248,0.5);}');
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
cssAdd('.ck-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:100%;flex-shrink:0;}');
cssAdd('.ck-actions button{font-family:inherit;font-weight:bold;border:none;border-radius:9px;padding:9px 14px;cursor:pointer;color:#fff;}');
cssAdd('#ck-shopbtn{background:linear-gradient(135deg,#c7921e,#8a5a00);}');
cssAdd('.ck-float.crit{color:#ffd23f;font-size:21px;text-shadow:0 0 10px #ffb700;}');
cssAdd('.ck-tabs{display:flex;gap:6px;padding:8px 8px 0;flex-wrap:wrap;}');
cssAdd('.ck-tab{flex:1;padding:8px 6px;border:1px solid #2b3672;border-radius:9px;background:#111634;color:#8fa3e8;font-family:inherit;font-weight:bold;font-size:12px;cursor:pointer;min-width:86px;}');
cssAdd('.ck-tab.on{background:linear-gradient(135deg,#3a86ff,#7b2cbf);color:#fff;border-color:#3a86ff;}');
  cssAdd('#ck-autop{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 8px 0;}');
  cssAdd('.ck-apbtn{flex:1;min-width:96px;padding:7px 8px;border:1px solid #2b3672;border-radius:9px;background:#111634;color:#8fa3e8;font-family:inherit;font-weight:bold;font-size:11px;cursor:pointer;transition:all .18s;}');
  cssAdd('.ck-apbtn.on{background:linear-gradient(135deg,#1f9d55,#0e5c2f);color:#fff;border-color:#37e08a;}');
  cssAdd('.ck-apcfg-btn{flex:none;width:34px;height:32px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2b3672,#1a224a);border:1px solid #3a86ff;border-radius:9px;color:#ffd76a;cursor:pointer;font-size:16px;transition:all .2s;box-shadow:0 0 10px rgba(58,134,255,.25);}');
  cssAdd('.ck-apcfg-btn:hover{filter:brightness(1.2);transform:rotate(30deg);box-shadow:0 0 16px rgba(58,134,255,.5);}');
  cssAdd('.t2-theme.t2cv .ck-apcfg-btn{background:linear-gradient(135deg,#04202c,#083344) !important;border-color:#00d4ff !important;color:#67e8f9 !important;box-shadow:0 0 14px rgba(0,212,255,.35) !important;}');
  cssAdd('.t2-theme.t2cv .ck-apcfg-btn:hover{box-shadow:0 0 22px rgba(0,212,255,.7) !important;color:#fff !important;}');
  cssAdd('.t2-theme.t2pn .ck-apcfg-btn{background:linear-gradient(135deg,#4a0e2e,#2a081a) !important;border-color:#ff2d95 !important;color:#ff71c4 !important;box-shadow:0 0 14px rgba(255,45,149,.4) !important;}');
  cssAdd('.t2-theme.t2pn .ck-apcfg-btn:hover{box-shadow:0 0 24px rgba(255,45,149,.75) !important;color:#fff !important;}');
  cssAdd('#ck-auto-modal{position:fixed;inset:0;z-index:9480;background:radial-gradient(ellipse at 50% 15%,rgba(14,20,54,.94) 0%,rgba(2,4,14,.98) 100%);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(22px);animation:ckFadeIn .2s ease-out;}');
  cssAdd('#ck-auto-modal-box{width:min(580px,94vw);max-height:86vh;overflow-y:auto;background:linear-gradient(175deg,rgba(15,20,50,.96) 0%,rgba(6,9,24,.98) 100%);border:1px solid rgba(56,189,248,.35);border-radius:24px;padding:24px 22px;color:#fff;box-sizing:border-box;box-shadow:0 35px 95px rgba(0,0,0,.92),0 0 45px rgba(56,189,248,.18);position:relative;}');
  cssAdd('#ck-auto-modal-box::-webkit-scrollbar{width:5px;}');
  cssAdd('#ck-auto-modal-box::-webkit-scrollbar-thumb{background:rgba(56,189,248,.5);border-radius:10px;}');
  cssAdd('#ck-auto-modal-box h2{margin:0 0 18px;text-align:center;letter-spacing:3px;font-size:19px;font-weight:900;background:linear-gradient(90deg,#93c5fd,#ffd76a,#c084fc);-webkit-background-clip:text;background-clip:text;color:transparent;text-transform:uppercase;text-shadow:0 0 20px rgba(147,197,253,.3);}');
  cssAdd('.ck-ap-card{background:linear-gradient(135deg,rgba(20,27,62,.6),rgba(10,14,36,.75));border:1px solid rgba(99,102,241,.25);border-radius:16px;padding:14px 16px;margin-bottom:12px;box-shadow:0 6px 20px rgba(0,0,0,.35);backdrop-filter:blur(8px);transition:all .2s ease;}');
  cssAdd('.ck-ap-card:hover{border-color:rgba(56,189,248,.55);box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 16px rgba(56,189,248,.18);transform:translateY(-1px);}');
  cssAdd('.ck-ap-card-title{font-weight:900;font-size:13px;color:#ffd76a;margin-bottom:10px;letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;text-shadow:0 0 10px rgba(255,215,106,.3);}');
  cssAdd('.ck-ap-inputs{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:10px;}');
  cssAdd('.ck-ap-inputs label{font-size:11px;color:#94a3b8;font-weight:800;letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:6px;}');
  cssAdd('.ck-ap-inputs input{width:110px;padding:7px 10px;border:1px solid rgba(148,163,184,.28);border-radius:9px;background:rgba(6,9,22,.85);color:#f8fafc;font-family:Consolas,monospace;font-size:12px;font-weight:700;outline:none;transition:border-color .2s,box-shadow .2s;}');
  cssAdd('.ck-ap-inputs input:focus{border-color:#38bdf8;box-shadow:0 0 14px rgba(56,189,248,.4);}');
  cssAdd('.ck-ap-subtypes{display:flex;gap:7px;flex-wrap:wrap;}');
  cssAdd('.ck-ap-subbtn{background:rgba(16,22,50,.85);border:1px solid rgba(99,102,241,.3);color:#94a3b8;border-radius:9px;padding:6px 12px;font-size:11px;font-family:inherit;cursor:pointer;font-weight:800;letter-spacing:.5px;transition:all .18s;display:inline-flex;align-items:center;gap:6px;}');
  cssAdd('.ck-ap-subbtn:hover{filter:brightness(1.15);color:#e2e8f0;border-color:rgba(125,211,252,.5);}');
  cssAdd('.ck-ap-subbtn.on{background:linear-gradient(135deg,rgba(16,185,129,.22),rgba(5,150,105,.4));border-color:#34d399;color:#6ee7b7;box-shadow:0 0 14px rgba(16,185,129,.3);}');
  cssAdd('.ck-ap-subbtn.on::before{content:"";width:6px;height:6px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399;}');
  cssAdd('#ck-close-auto-modal{width:100%;background:linear-gradient(135deg,#e11d48,#9f1239);border:1px solid rgba(251,113,133,.4);border-radius:12px;padding:12px;font-weight:900;font-size:12.5px;letter-spacing:2px;color:#fff;cursor:pointer;font-family:inherit;margin-top:12px;box-shadow:0 6px 20px rgba(225,29,72,.35);transition:all .2s;}');
  cssAdd('#ck-close-auto-modal:hover{filter:brightness(1.15);box-shadow:0 8px 26px rgba(225,29,72,.5);transform:translateY(-1px);}');
  cssAdd('#ck-close-auto-modal:active{transform:scale(.98);}');
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
cssAdd('#ck-boostbar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;max-width:92%;margin:0 auto;}');
cssAdd('.ck-bchip{border:1px solid;border-radius:20px;padding:4px 10px;font-size:11.5px;font-weight:bold;background:rgba(0,0,0,.35);transition:all .2s;}');
cssAdd('.ck-boss-battle-wrap{display:flex;flex-direction:column;align-items:center;width:100%;gap:6px;margin-bottom:8px;}');
cssAdd('.ck-hp-row{display:flex;justify-content:space-between;width:86%;font-size:11px;font-weight:900;letter-spacing:1px;font-family:Consolas,monospace;}');
cssAdd('.ck-hp-bar{width:86%;height:10px;background:rgba(10,15,30,.85);border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 0 6px rgba(0,0,0,.8);}');
cssAdd('#ck-boss-escape-btn{background:linear-gradient(135deg,#991b1b 0%,#ef4444 50%,#7f1d1d 100%);border:2px solid #fca5a5;border-radius:24px;color:#fff;font-family:Consolas,monospace;font-size:12px;font-weight:900;letter-spacing:2px;padding:8px 26px;cursor:pointer;margin:10px auto 4px;box-shadow:0 0 20px rgba(239,68,68,0.7),inset 0 0 8px rgba(255,255,255,0.4);transition:all .18s;outline:none;display:inline-block;text-transform:uppercase;}');
cssAdd('#ck-boss-escape-btn:hover{transform:translateY(-2px) scale(1.05);filter:brightness(1.25);box-shadow:0 0 32px rgba(239,68,68,1),inset 0 0 12px #fff;}');
cssAdd('#ck-boss-escape-btn:active{transform:scale(0.94);}');
cssAdd('.ck-boss-explode-anim{animation:ckBossSuckIn 1.5s cubic-bezier(0.3,0,0.2,1) forwards!important;pointer-events:none!important;}');
cssAdd('@keyframes ckBossSuckIn{0%{transform:scale(1);filter:brightness(1.5);}20%{transform:scale(1.15) rotate(-5deg);filter:brightness(3);}35%{transform:scale(0.9) translate(60px,-10px) rotate(45deg);opacity:0.9;}70%{transform:scale(0.35) translate(160px,-20px) rotate(380deg) skewX(25deg);opacity:0.6;}100%{transform:scale(0) translate(210px,-25px) rotate(720deg);opacity:0;}}');
cssAdd('.ck-blackhole-rift{position:absolute;top:50%;left:calc(50% + 240px);width:150px;height:150px;transform:translate(-50%,-50%);pointer-events:none;z-index:95;animation:ckBhSpawn 1.65s ease-in-out forwards;}');
cssAdd('.ck-bh-core-black{position:absolute;inset:28px;border-radius:50%;background:#020005;box-shadow:0 0 45px var(--r-col,#c084fc),0 0 90px var(--r-glow,#f43f5e),inset 0 0 25px #000;z-index:4;}');
cssAdd('.ck-bh-accretion{position:absolute;inset:0;border-radius:50%;border:4px solid transparent;border-top:6px solid var(--r-t1,#fb7185);border-right:6px solid var(--r-t2,#c084fc);border-bottom:6px solid var(--r-t3,#38bdf8);filter:blur(1.5px) drop-shadow(0 0 22px var(--r-col,#e879f9));animation:ckBhSpin 0.35s linear infinite;}');
cssAdd('.ck-bh-halo{position:absolute;inset:-18px;border-radius:50%;background:radial-gradient(circle,var(--r-halo,rgba(192,132,252,0.3)) 25%,transparent 80%);animation:ckBhPulse 1s infinite alternate;}');
cssAdd('.rift-ice{--r-col:#38bdf8;--r-glow:#0284c7;--r-t1:#bae6fd;--r-t2:#38bdf8;--r-t3:#0369a1;--r-halo:rgba(56,189,248,0.45);}');
cssAdd('.rift-ion{--r-col:#2dd4bf;--r-glow:#0d9488;--r-t1:#99f6e4;--r-t2:#2dd4bf;--r-t3:#115e59;--r-halo:rgba(45,212,191,0.45);}');
cssAdd('.rift-gold{--r-col:#facc15;--r-glow:#ca8a04;--r-t1:#fef08a;--r-t2:#eab308;--r-t3:#854d0e;--r-halo:rgba(250,204,21,0.5);}');
cssAdd('.rift-storm{--r-col:#fb923c;--r-glow:#ea580c;--r-t1:#ffedd5;--r-t2:#f97316;--r-t3:#9a3412;--r-halo:rgba(251,146,60,0.5);}');
cssAdd('.rift-blood{--r-col:#f43f5e;--r-glow:#dc2626;--r-t1:#ffe4e6;--r-t2:#ef4444;--r-t3:#881337;--r-halo:rgba(244,63,94,0.55);}');
cssAdd('.rift-bio{--r-col:#34d399;--r-glow:#059669;--r-t1:#a7f3d0;--r-t2:#10b981;--r-t3:#064e3b;--r-halo:rgba(52,211,153,0.5);}');
cssAdd('.rift-acid{--r-col:#eab308;--r-glow:#84cc16;--r-t1:#fef08a;--r-t2:#a3e635;--r-t3:#4d7c0f;--r-halo:rgba(163,230,53,0.5);}');
cssAdd('.rift-metal{--r-col:#cbd5e1;--r-glow:#64748b;--r-t1:#ffffff;--r-t2:#94a3b8;--r-t3:#334155;--r-halo:rgba(203,213,225,0.45);}');
cssAdd('.rift-sun{--r-col:#f97316;--r-glow:#ef4444;--r-t1:#ffedd5;--r-t2:#fde047;--r-t3:#dc2626;--r-halo:rgba(249,115,22,0.6);}');
cssAdd('.rift-singularity{--r-col:#c084fc;--r-glow:#9333ea;--r-t1:#f3e8ff;--r-t2:#ec4899;--r-t3:#3b0764;--r-halo:rgba(192,132,252,0.6);}');
cssAdd('@keyframes ckBhPulse{0%{transform:scale(0.92);opacity:0.6;}100%{transform:scale(1.15);opacity:1;}}');
cssAdd('@keyframes ckBhSpin{0%{transform:rotate(0deg) scaleY(0.65);}100%{transform:rotate(360deg) scaleY(0.65);}}');
cssAdd('@keyframes ckBhSpawn{0%{transform:translate(-50%,-50%) scale(0);opacity:0;}18%{transform:translate(-50%,-50%) scale(1.2);opacity:1;}82%{transform:translate(-50%,-50%) scale(1);opacity:1;}100%{transform:translate(-50%,-50%) scale(0);opacity:0;}}');
cssAdd('#ck-boss-shop-btn{font-family:Courier New,monospace;font-size:13px;font-weight:bold;letter-spacing:1px;background:linear-gradient(135deg,#e11d48,#7c3aed 50%,#2563eb);box-shadow:0 0 16px rgba(225,29,72,.5);border:1px solid rgba(255,255,255,.3);}');
cssAdd('#ck-boss-shop-modal{position:fixed;inset:0;z-index:99999;background:rgba(2,2,14,.92);display:flex;align-items:center;justify-content:center;font-family:Courier New,monospace;}');
cssAdd('#ck-boss-shop-box{width:min(660px,95vw);max-height:88vh;overflow-y:auto;background:linear-gradient(175deg,#12081f,#090312);border:2px solid #a855f7;border-radius:20px;padding:22px;color:#fff;box-sizing:border-box;box-shadow:0 30px 95px rgba(0,0,0,.9),0 0 45px rgba(168,85,247,.35);}');
cssAdd('#ck-boss-shop-box h2{margin:0 0 12px;text-align:center;letter-spacing:2px;font-size:20px;font-weight:bold;color:#fde047;}');
cssAdd('.ck-bshop-wallet{background:rgba(30,12,50,.6);border:1px solid #7c3aed;border-radius:12px;padding:10px 16px;text-align:center;font-size:13px;font-weight:bold;color:#dfe6ff;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:8px;}');
cssAdd('.ck-bshop-wallet b{color:#ffd76a;font-size:16px;}');
cssAdd('.ck-bshop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:14px;}');
cssAdd('.ck-bshop-card{background:#111634;border:1px solid rgba(168,85,247,.4);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;transition:all .18s;}');
cssAdd('.ck-bshop-card:hover{border-color:#e879f9;box-shadow:0 6px 20px rgba(168,85,247,.3);transform:translateY(-2px);}');
cssAdd('.ck-bshop-title{font-size:13px;font-weight:bold;color:#ffd76a;letter-spacing:.8px;text-transform:uppercase;}');
cssAdd('.ck-bshop-desc{font-size:11.5px;color:#cbd5e1;line-height:1.4;}');
cssAdd('.ck-bshop-stat{font-size:11.5px;color:#93c5fd;font-weight:bold;}');
cssAdd('.ck-bshop-btn{background:linear-gradient(135deg,#ec4899,#8b5cf6);border:none;border-radius:9px;padding:9px 12px;font-weight:bold;font-size:12px;color:#fff;cursor:pointer;font-family:inherit;letter-spacing:.6px;transition:all .16s;}');
cssAdd('.ck-bshop-btn:hover:not(:disabled){filter:brightness(1.15);transform:scale(1.02);box-shadow:0 0 16px rgba(236,72,153,.5);}');
cssAdd('.ck-bshop-btn:disabled{opacity:.4;cursor:default;filter:grayscale(1);}');
cssAdd('#ck-close-bshop{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
cssAdd('.ck-debris-item{position:absolute;pointer-events:none;z-index:96;will-change:transform,opacity;animation:ckDebrisVortex 1.55s cubic-bezier(0.18,0.85,0.22,1) forwards;}');
cssAdd('@keyframes ckDebrisVortex{0%{transform:translate(0,0) scale(1) rotate(0deg);opacity:1;}25%{transform:translate(var(--bx),var(--by)) scale(1.3) rotate(var(--br));opacity:1;}60%{transform:translate(calc(var(--bx)*0.35 + 170px),calc(var(--by)*0.35 - 20px)) scale(0.65) rotate(calc(var(--br)*2));opacity:0.85;}100%{transform:translate(240px,-20px) scale(0) rotate(calc(var(--br)*4));opacity:0;}}');
cssAdd('.debris-fang{width:11px;height:18px;background:linear-gradient(180deg,#fff,#ffd76a 40%,#ef4444);clip-path:polygon(50% 100%,0 0,100% 0);filter:drop-shadow(0 0 6px #ff3344);}');
cssAdd('.debris-crystal{width:14px;height:20px;background:linear-gradient(135deg,#fff,#fde047 35%,#a855f7 85%);clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);box-shadow:0 0 12px #fde047;}');
cssAdd('.debris-magma{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#ffffff,#ff2233 60%,#450a0a);box-shadow:0 0 14px #ff2233;}');
cssAdd('.debris-horn{width:15px;height:28px;background:linear-gradient(180deg,#fff,#ef4444 30%,#180306);clip-path:polygon(30% 0%,90% 40%,60% 100%,0% 70%);filter:drop-shadow(0 0 8px #dc2626);}');
cssAdd('.ck-hp-fill-player{height:100%;background:linear-gradient(90deg,#10b981,#34d399);transition:width .15s;}');
cssAdd('.ck-hp-fill-boss{height:100%;background:linear-gradient(90deg,#ef4444,#dc2626);transition:width .15s;}');
cssAdd('.ck-boss-disc{background:radial-gradient(circle at 35% 30%,#ff7b7b 0%,#ff2a2a 20%,#b91c1c 45%,#450a0a 72%,#050002 100%)!important;border:3.5px solid #ff2233!important;box-shadow:0 0 80px #dc2626,0 0 160px rgba(239,68,68,0.8),inset -20px -26px 65px #000,inset 16px 16px 40px rgba(255,255,255,0.5)!important;animation:ckBossPulse 1.6s infinite alternate!important;overflow:visible!important;}');
cssAdd('.ck-boss-disc::before{display:none!important;}');
cssAdd('@keyframes ckBossPulse{0%{filter:drop-shadow(0 0 25px #dc2626) brightness(1);transform:scale(1);}100%{filter:drop-shadow(0 0 65px #ff2233) brightness(1.28);transform:scale(1.045);}}');
cssAdd('.ck-boss-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;z-index:10;animation:ckBossBreathe 2.4s ease-in-out infinite alternate;}');
cssAdd('@keyframes ckBossBreathe{0%{transform:scale(0.96) translateY(3px);}100%{transform:scale(1.04) translateY(-4px);}}');
cssAdd('.ck-boss-corona{position:absolute;inset:-36px;border-radius:50%;background:radial-gradient(circle,rgba(255,68,68,0.45) 30%,rgba(220,38,38,0.25) 60%,transparent 80%);animation:ckBossCorona 1.4s ease-in-out infinite alternate;pointer-events:none;}');
cssAdd('@keyframes ckBossCorona{0%{transform:scale(0.92);opacity:0.7;}100%{transform:scale(1.16);opacity:1;filter:hue-rotate(-20deg);}}');
cssAdd('.ck-boss-cracks{position:absolute;inset:10px;border-radius:50%;background:radial-gradient(circle at 50% 50%,transparent 40%,rgba(254,240,138,0.15) 70%,rgba(239,68,68,0.3) 100%);pointer-events:none;}');
cssAdd('.ck-boss-horns-outer{position:absolute;top:-68px;width:205px;height:96px;display:flex;justify-content:space-between;pointer-events:none;z-index:2;}');
cssAdd('.ck-boss-horn-lg{position:relative;width:40px;height:105px;background:linear-gradient(180deg,#fff 0%,#ff3344 18%,#b91c1c 50%,#450a0a 82%,#140204 100%);clip-path:polygon(50% 0%,96% 28%,100% 75%,75% 100%,22% 95%,0% 68%,8% 25%);filter:drop-shadow(0 0 20px #ff2233);box-shadow:inset 0 0 12px #fff;}');
cssAdd('.ck-boss-horn-lg::before{content:"";position:absolute;top:15%;left:20%;right:20%;height:45%;background:linear-gradient(180deg,#ffd76a,transparent);clip-path:polygon(50% 0%,100% 100%,0% 100%);opacity:0.9;filter:drop-shadow(0 0 4px #ffd76a);}');
cssAdd('.ck-boss-horn-lg.left{transform:rotate(-42deg) scaleX(-1);}');
cssAdd('.ck-boss-horn-lg.right{transform:rotate(42deg);}');
cssAdd('.ck-boss-horns-inner{position:absolute;top:-46px;width:115px;height:60px;display:flex;justify-content:space-between;pointer-events:none;z-index:3;}');
cssAdd('.ck-boss-horn-sm{width:22px;height:62px;background:linear-gradient(180deg,#fff 0%,#ffd76a 22%,#f97316 52%,#7f1d1d 100%);clip-path:polygon(50% 0%,100% 35%,80% 100%,20% 100%,0% 35%);filter:drop-shadow(0 0 15px #f97316);}');
cssAdd('.ck-boss-horn-sm.left{transform:rotate(-22deg) scaleX(-1);}');
cssAdd('.ck-boss-horn-sm.right{transform:rotate(22deg);}');
cssAdd('.ck-boss-crown{position:absolute;top:-12px;width:82px;height:28px;background:linear-gradient(180deg,#ffffff,#fde047 40%,#dc2626);clip-path:polygon(0% 100%,14% 15%,32% 65%,50% 0%,68% 65%,86% 15%,100% 100%);filter:drop-shadow(0 0 15px #ffd76a);z-index:4;}');
cssAdd('.ck-boss-rune{position:absolute;top:18px;width:24px;height:32px;background:linear-gradient(180deg,#fff,#ffd76a 30%,#ef4444 85%);clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);box-shadow:0 0 25px #ffd76a,0 0 50px #dc2626;animation:ckRunePulse 0.85s infinite alternate;z-index:5;}');
cssAdd('@keyframes ckRunePulse{0%{transform:scale(0.85);filter:brightness(1);}100%{transform:scale(1.28);filter:brightness(1.7);}}');
cssAdd('.ck-boss-brows{display:flex;gap:44px;margin-top:22px;z-index:4;}');
cssAdd('.ck-boss-brow{width:48px;height:12px;background:linear-gradient(180deg,#ff5252,#7f1d1d);border-radius:6px;box-shadow:0 0 18px #dc2626;}');
cssAdd('.ck-boss-brow.left{transform:rotate(26deg);}');
cssAdd('.ck-boss-brow.right{transform:rotate(-26deg);}');
cssAdd('.ck-boss-eyes{display:flex;gap:46px;margin-top:6px;position:relative;z-index:4;}');
cssAdd('.ck-boss-eye{width:44px;height:28px;background:radial-gradient(circle at 50% 50%,#550c0c,#050002);border:2.5px solid #ff2233;box-shadow:0 0 28px #ef4444, inset 0 0 16px #f87171;position:relative;display:flex;align-items:center;justify-content:center;animation:ckBossBlink 4.2s infinite;overflow:hidden;}');
cssAdd('.ck-boss-eye.left{border-radius:65% 35% 65% 35%;transform:rotate(15deg);}');
cssAdd('.ck-boss-eye.right{border-radius:35% 65% 35% 65%;transform:rotate(-15deg);}');
cssAdd('.ck-boss-pupil{width:9px;height:24px;background:linear-gradient(180deg,#ffffff,#fde047 35%,#ef4444 90%);border-radius:50%;box-shadow:0 0 18px #fde047;position:relative;will-change:transform;pointer-events:none;}');
cssAdd('.ck-boss-eye-glow{position:absolute;bottom:-10px;width:38px;height:16px;background:radial-gradient(ellipse at center,#dc2626,transparent 70%);filter:blur(3px);opacity:0.9;}');
cssAdd('.ck-boss-mouth{width:114px;height:48px;border:3px solid #ff1a2a;border-radius:12px 12px 50px 50px;background:radial-gradient(ellipse at 50% 25%,#991b1b 0%,#200407 65%,#000 100%);margin-top:14px;box-shadow:0 0 35px rgba(220,38,38,0.9), inset 0 0 25px #000;position:relative;overflow:hidden;animation:ckBossMouthSnap 3.8s cubic-bezier(0.25, 1, 0.5, 1) infinite;transform-origin:top center;z-index:4;}');
cssAdd('@keyframes ckBossMouthSnap{0%,68%,100%{height:48px;transform:translateY(0) scaleY(1);}70%{height:56px;transform:translateY(-2px) scaleY(1.15);}72%{height:26px;transform:translateY(3px) scaleY(0.65);}74%{height:36px;transform:translateY(0) scaleY(0.85);}75.5%{height:24px;transform:translateY(3px) scaleY(0.6);}77.5%{height:34px;transform:translateY(0) scaleY(0.8);}79%{height:24px;transform:translateY(3px) scaleY(0.6);}82%{height:44px;transform:translateY(1px) scaleY(0.92);}86%{height:48px;transform:translateY(0) scaleY(1);}}');
cssAdd('.ck-boss-teeth-top{position:absolute;top:0;left:6px;right:6px;height:16px;display:flex;justify-content:space-around;align-items:flex-start;z-index:3;}');
cssAdd('.ck-boss-teeth-bot{position:absolute;bottom:0;left:8px;right:8px;height:18px;display:flex;justify-content:space-around;align-items:flex-end;z-index:3;}');
cssAdd('.ck-boss-fang{width:9px;height:15px;background:linear-gradient(180deg,#ffffff 0%,#fde047 30%,#ea580c 75%,#7f1d1d 100%);clip-path:polygon(50% 100%, 0% 0%, 100% 0%);filter:drop-shadow(0 0 5px rgba(239,68,68,0.9));box-shadow:inset 0 0 4px #fff;}');
cssAdd('.ck-boss-fang.lg{height:19px;width:11px;background:linear-gradient(180deg,#ffffff 0%,#fef08a 25%,#ef4444 80%,#450a0a 100%);filter:drop-shadow(0 0 8px #ff2233);}');
cssAdd('.ck-boss-fang.up{clip-path:polygon(50% 0%, 0% 100%, 100% 100%);background:linear-gradient(0deg,#ffffff 0%,#fde047 30%,#ea580c 75%,#7f1d1d 100%);}');
cssAdd('.ck-boss-fang.up.lg{height:20px;width:12px;background:linear-gradient(0deg,#ffffff 0%,#fef08a 25%,#ef4444 80%,#450a0a 100%);filter:drop-shadow(0 0 8px #ff2233);}');
cssAdd('.ck-boss-lava-tongue{position:absolute;bottom:0px;left:26%;right:26%;height:14px;background:radial-gradient(ellipse at center,#ffffff,#ffedd5 30%,#f97316 70%,#991b1b);border-radius:50% 50% 0 0;filter:drop-shadow(0 0 10px #ea580c);animation:ckTonguePulse 1s infinite alternate;z-index:1;}');
cssAdd('@keyframes ckTonguePulse{0%{transform:scale(0.85);opacity:0.8;}100%{transform:scale(1.18);opacity:1;}}');
cssAdd('.ck-boss-hit{animation:ckBossShake .18s ease-out!important;}');
cssAdd('@keyframes ckBossShake{0%,100%{transform:translate(0,0) scale(1);}25%{transform:translate(-6px,4px) scale(0.96);}75%{transform:translate(6px,-4px) scale(0.96);}}');
cssAdd('.ck-float-dmg{position:absolute;pointer-events:none;color:#ef4444;font-weight:900;font-size:22px;text-shadow:0 0 10px #dc2626;animation:ckUpDmg .65s ease-out forwards;z-index:9999;font-family:Consolas,monospace;}');
cssAdd('@keyframes ckUpDmg{0%{transform:translateY(0) scale(0.8);opacity:1;}100%{transform:translateY(-60px) scale(1.2);opacity:0;}}');
cssAdd('.ck-boost-toggle-btn{background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid #38bdf8;border-radius:16px;color:#38bdf8;padding:3px 9px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .18s;box-shadow:0 0 8px rgba(56,189,248,.25);}');
cssAdd('.ck-boost-toggle-btn:hover{filter:brightness(1.2);transform:scale(1.05);background:#0284c7;color:#fff;}');
cssAdd('.ck-toast{position:fixed;left:50%;top:13%;transform:translateX(-50%);z-index:9600;background:linear-gradient(135deg,#141a3a,#0b1026);border:1px solid #3a86ff;border-radius:12px;padding:10px 18px;color:#dfe6ff;font-family:Courier New,monospace;font-weight:bold;font-size:14px;box-shadow:0 0 22px rgba(58,134,255,.6);pointer-events:none;animation:ckToast 3.2s forwards;}');
cssAdd('@keyframes ckToast{0%{opacity:0;transform:translate(-50%,-10px);}10%{opacity:1;transform:translate(-50%,0);}80%{opacity:1;}100%{opacity:0;transform:translate(-50%,-14px);}}');
cssAdd('#ck-invbtn{background:linear-gradient(135deg,#6a1fb5,#3a1a6b);}');
cssAdd('.ck-flask{width:24px;height:34px;margin:0 auto 6px;border:1.5px solid rgba(223,230,255,.8);border-radius:6px 6px 14px 14px;background:linear-gradient(180deg,rgba(255,255,255,.05) 0%,transparent 24%,var(--fc) 25%,rgba(10,12,30,.4) 100%);position:relative;box-shadow:0 0 14px var(--fc),inset 0 0 8px var(--fc);overflow:visible;backdrop-filter:blur(2px);}');
cssAdd('.ck-flask::before{content:"";position:absolute;top:-8px;left:5px;width:11px;height:7px;border:1.5px solid rgba(223,230,255,.85);border-bottom:none;border-radius:3px 3px 0 0;background:linear-gradient(180deg,#c9933e,#7a5012);box-shadow:inset 0 1px 0 rgba(255,255,255,.4);}');
cssAdd('.ck-flask::after{content:"";position:absolute;top:30%;left:3px;width:4px;height:55%;border-radius:2px;background:linear-gradient(180deg,rgba(255,255,255,.8),transparent);opacity:.75;pointer-events:none;}');
cssAdd('.ck-flask-bub{position:absolute;bottom:3px;left:50%;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 4px #fff;animation:ckFlaskBub 1.8s infinite ease-in;}');
cssAdd('@keyframes ckFlaskBub{0%{transform:translate(-50%,0) scale(.6);opacity:0}40%{opacity:.9}100%{transform:translate(-50%,-16px) scale(1.2);opacity:0}}');
cssAdd('.ck-shop-item:hover .ck-flask{transform:scale(1.12) rotate(4deg);transition:transform .2s cubic-bezier(.34,1.56,.64,1);}');
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
cssAdd('#ck-track-name.ck-trk10{background:linear-gradient(90deg,#14b8a6,#e879f9,#14b8a6);background-size:200% 200%;animation:ckT10 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT10{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk11{background:linear-gradient(90deg,#a3e635,#22d3ee,#a3e635);background-size:200% 200%;animation:ckT11 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT11{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk12{background:linear-gradient(90deg,#f43f5e,#fb7185,#f43f5e);background-size:200% 200%;animation:ckT12 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT12{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk13{background:linear-gradient(90deg,#8b5cf6,#ec4899,#8b5cf6);background-size:200% 200%;animation:ckT13 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT13{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('#ck-track-name.ck-trk14{background:linear-gradient(90deg,#10b981,#f59e0b,#10b981);background-size:200% 200%;animation:ckT14 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}');
cssAdd('@keyframes ckT14{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
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
cssAdd('#ck-ver{width:100%;text-align:left;color:#5a6a8f;font-size:10px;padding:0 4px;font-family:monospace;}');
cssAdd('#ck-prof{position:fixed;inset:0;z-index:9472;background:radial-gradient(circle at 50% 30%,rgba(20,24,64,.88) 0%,rgba(5,7,20,.97) 100%);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(16px);animation:ckFadeIn .25s ease-out;}');
cssAdd('@keyframes ckFadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}');
cssAdd('#ck-prof-box{width:min(470px,93vw);background:linear-gradient(180deg,rgba(19,25,58,.94) 0%,rgba(10,13,32,.98) 100%);border:1px solid rgba(110,168,254,.35);position:relative;border-radius:28px;padding:30px 24px 24px;color:#fff;text-align:center;box-sizing:border-box;max-height:92vh;overflow-y:auto;box-shadow:0 35px 90px rgba(0,0,0,.85),0 0 60px rgba(56,189,248,.25),inset 0 1px 0 rgba(255,255,255,.2);}');
cssAdd('#ck-prof-box::before{content:"";position:absolute;top:0;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,#38bdf8,#a855f7,#ffd76a,transparent);pointer-events:none;}');
cssAdd('#ck-prof-box h2{margin:0 0 18px;letter-spacing:3.5px;font-size:22px;font-weight:900;background:linear-gradient(90deg,#93c5fd 0%,#ffd76a 50%,#f472b6 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-transform:uppercase;text-shadow:0 0 30px rgba(147,197,253,.35);}');
cssAdd('#ck-prof-ava{width:96px;height:96px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 0 35px rgba(56,189,248,.5),0 0 70px rgba(168,85,247,.3),inset 0 0 15px rgba(0,0,0,.6);border:3px solid rgba(255,255,255,.75);position:relative;background:#090d24;transition:transform .3s cubic-bezier(.34,1.56,.64,1);}');
cssAdd('#ck-prof-ava:hover{transform:scale(1.06);}');
cssAdd('.ck-prof-media{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;border-radius:50%;}');
cssAdd('.ck-prof-ava-wrap{display:flex;align-items:center;justify-content:center;gap:18px;margin:0 auto 20px;}');
cssAdd('.ck-prof-arr{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,rgba(30,41,88,.85),rgba(18,24,56,.95));border:1px solid rgba(96,165,250,.4);color:#93c5fd;font-size:15px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 4px 14px rgba(0,0,0,.35);}');
cssAdd('.ck-prof-arr:hover{transform:scale(1.12) translateY(-2px);background:linear-gradient(135deg,#38bdf8,#2563eb);color:#fff;border-color:#93c5fd;box-shadow:0 0 20px rgba(56,189,248,.6);}');
cssAdd('.ck-prof-arr:active{transform:scale(.92);}');
cssAdd('.ck-prof-row{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(24,32,74,.65),rgba(14,19,48,.75));border:1px solid rgba(99,102,241,.25);border-radius:16px;padding:12px 16px;margin-bottom:11px;text-align:left;position:relative;transition:all .22s cubic-bezier(.16,1,.3,1);backdrop-filter:blur(6px);}');
cssAdd('.ck-prof-row::before{content:"";position:absolute;left:0;top:20%;bottom:20%;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#38bdf8,#818cf8);opacity:0;transition:opacity .2s;}');
cssAdd('.ck-prof-row:hover{transform:translateX(5px);border-color:rgba(56,189,248,.6);background:linear-gradient(135deg,rgba(32,42,94,.85),rgba(18,24,62,.9));box-shadow:0 8px 24px rgba(0,0,0,.4),0 0 20px rgba(56,189,248,.2);}');
cssAdd('.ck-prof-row:hover::before{opacity:1;}');
cssAdd('.ck-prof-l{width:74px;color:#94a3b8;font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;flex:none;display:flex;align-items:center;gap:6px;}');
cssAdd('.ck-prof-v{flex:1;font-weight:800;font-size:14px;word-break:break-all;color:#f8fafc;letter-spacing:.3px;display:flex;align-items:center;flex-wrap:wrap;gap:6px;}');
cssAdd('.ck-prof-badge-admin{background:linear-gradient(135deg,rgba(245,158,11,.25),rgba(217,119,6,.4));border:1px solid #fbbf24;color:#fde047;font-size:10px;font-weight:900;padding:3px 8px;border-radius:8px;letter-spacing:1px;box-shadow:0 0 12px rgba(251,191,36,.35);text-transform:uppercase;}');
cssAdd('.ck-prof-badge-player{background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.4);color:#38bdf8;font-size:10px;font-weight:800;padding:3px 8px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;}');
cssAdd('.ck-prof-lvl-badge{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:900;font-size:11px;padding:2px 8px;border-radius:6px;border:1px solid #a855f7;box-shadow:0 0 10px rgba(168,85,247,.4);letter-spacing:1px;}');
cssAdd('.ck-prof-xp-bar{width:100%;height:8px;background:rgba(8,12,28,.8);border-radius:4px;overflow:hidden;border:1px solid rgba(168,85,247,.4);margin-top:6px;}');
cssAdd('.ck-prof-xp-fill{height:100%;background:linear-gradient(90deg,#6366f1,#a855f7,#ec4899);transition:width .25s;}');
cssAdd('#ck-prof-copy{background:linear-gradient(135deg,#0284c7,#2563eb);border:1px solid rgba(125,211,252,.5);border-radius:10px;color:#fff;padding:8px 14px;font-weight:800;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:.8px;flex:none;box-shadow:0 4px 14px rgba(2,132,199,.4);transition:all .18s;}');
cssAdd('#ck-prof-copy:hover{transform:translateY(-1px) scale(1.05);filter:brightness(1.15);box-shadow:0 6px 20px rgba(56,189,248,.6);}');
cssAdd('#ck-prof-copy:active{transform:scale(.95);}');
cssAdd('#ck-close-prof{width:100%;background:linear-gradient(135deg,#e11d48,#9f1239);border:1px solid rgba(251,113,133,.4);border-radius:14px;padding:13px;font-weight:900;font-size:13px;letter-spacing:1.5px;color:#fff;cursor:pointer;font-family:inherit;margin-top:14px;box-shadow:0 6px 22px rgba(225,29,72,.45);transition:all .2s;}');
cssAdd('#ck-close-prof:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 8px 28px rgba(225,29,72,.6);}');
cssAdd('#ck-close-prof:active{transform:scale(.98);}');
cssAdd('#ck-admin-btn{position:absolute;top:12px;right:66px;z-index:9490;display:none;background:linear-gradient(135deg,#dc2626,#7f1d1d);border:2px solid #f87171;color:#fff;border-radius:10px;padding:6px 12px;font-family:inherit;font-weight:900;font-size:11px;letter-spacing:1px;cursor:pointer;box-shadow:0 0 16px rgba(239,68,68,.7);animation:ckPulseAdmin 2s infinite;}');
cssAdd('.ck-prof-ava-wrap{display:flex;align-items:center;justify-content:center;gap:16px;margin:0 auto 16px;}');
cssAdd('.ck-prof-arr{width:36px;height:36px;border-radius:50%;background:linear-gradient(145deg,#232c5e,#151b40);border:1px solid #3a86ff;color:#93c5fd;font-size:16px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s,background .15s;}');
cssAdd('.ck-prof-arr:hover{transform:scale(1.15);background:#2e3a78;color:#fff;box-shadow:0 0 12px rgba(58,134,255,.5);}');
cssAdd('.ck-prof-arr:active{transform:scale(.9);}');
cssAdd('@keyframes ckPulseAdmin{0%,100%{box-shadow:0 0 12px rgba(239,68,68,.5)}50%{box-shadow:0 0 28px rgba(239,68,68,1)}}');
cssAdd('#ck-admin-modal{position:fixed;inset:0;z-index:9500;background:rgba(4,2,10,.92);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;}');
cssAdd('#ck-admin-box{width:min(460px,94vw);background:linear-gradient(160deg,#1e1014,#0e0608);border:2px solid #ef4444;border-radius:20px;padding:24px;color:#fff;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.9),0 0 50px rgba(239,68,68,.3);}');
cssAdd('#ck-admin-box h2{margin:0 0 8px;color:#f87171;letter-spacing:2px;font-size:20px;}');
cssAdd('#ck-admin-desc{font-size:12px;color:#fca5a5;margin-bottom:16px;line-height:1.5;}');
cssAdd('#ck-admin-target{width:100%;box-sizing:border-box;padding:12px;border:2px solid #7f1d1d;border-radius:10px;background:#060204;color:#fff;font-family:inherit;font-size:14px;text-align:center;margin-bottom:14px;outline:none;}');
cssAdd('#ck-admin-target:focus{border-color:#ef4444;box-shadow:0 0 12px rgba(239,68,68,.4);}');
cssAdd('.ck-admin-actions{display:flex;gap:8px;flex-direction:column;}');
cssAdd('.ck-admin-act-btn{padding:12px;border:none;border-radius:10px;color:#fff;font-weight:bold;font-size:12.5px;letter-spacing:1px;cursor:pointer;font-family:inherit;}');
cssAdd('#ck-admin-wipe-target{background:linear-gradient(135deg,#dc2626,#991b1b);box-shadow:0 4px 14px rgba(220,38,38,.4);}');
cssAdd('#ck-admin-wipe-self{background:linear-gradient(135deg,#ea580c,#9a3412);box-shadow:0 4px 14px rgba(234,88,12,.4);}');
cssAdd('#ck-admin-close{background:#27272a;margin-top:6px;}');
function ckToast(msg) {
  var t = el('div', '', 'ck-toast', msg);
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
}
var ckBoostCollapsed = true;
function ckBoostRender() {
  if (!boostBar) return;
  var now = Date.now();
  var activeList = [];
  for (var i = 0; i < CK_BOOSTS.length; i++) {
    var b = CK_BOOSTS[i];
    var sec = Math.max(0, Math.round(((CK.boost[b.id] || 0) - now) / 1000));
    if (sec > 0) {
      activeList.push({ b: b, sec: sec });
    }
  }
  if (!activeList.length) {
    boostBar.innerHTML = '';
    boostBar.style.display = 'none';
    return;
  }
  boostBar.style.display = '';
  var hasCollapse = activeList.length > 2;
  var h = '';
  for (var k = 0; k < activeList.length; k++) {
    var it = activeList[k];
    var isHidden = hasCollapse && ckBoostCollapsed && k >= 2;
    h += '<span class="ck-bchip" style="border-color:' + it.b.col + ';color:' + it.b.col + ';' + (isHidden ? 'display:none;' : '') + '">' + it.b.n + ' ' + ckFmtTime(it.sec) + '</span>';
  }
  if (hasCollapse) {
    var hiddenCnt = activeList.length - 2;
    var toggleTxt = ckBoostCollapsed ? ('▶ Ещё ' + hiddenCnt) : '▲ Свернуть';
    h += '<button id="ck-boost-collapse-toggle" class="ck-boost-toggle-btn">' + toggleTxt + '</button>';
  }
  boostBar.innerHTML = h;
  var tBtn = boostBar.querySelector('#ck-boost-collapse-toggle');
  if (tBtn) {
    tBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      ckBoostCollapsed = !ckBoostCollapsed;
      ckBoostRender();
    });
  }
}
function el(tag, id, cls, txt) {
  var e = document.createElement(tag);
  if (id) e.id = id;
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}
function ckEnsureOpenBtn() {
  var b = document.getElementById('clicker-open-btn');
  var isOpen = overlay && !overlay.classList.contains('hidden');
  if (!b && document.body) {
    b = el('button', 'clicker-open-btn', '', 'КЛИКЕР');
    b.style.display = isOpen ? 'none' : 'block';
    b.style.zIndex = '99999';
    document.body.appendChild(b);
  } else if (b) {
    b.style.display = isOpen ? 'none' : 'block';
  }
  var hb = document.getElementById('help-book-btn');
  if (hb) {
    hb.style.display = isOpen ? 'none' : 'block';
  }
  return b;
}
var openBtn = ckEnsureOpenBtn();
setInterval(ckEnsureOpenBtn, 1000);
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
var bossShopBtn = el('button', 'ck-boss-shop-btn', '', 'МАГАЗИН БОССОВ');
actions.appendChild(shopBtn);
actions.appendChild(earthBtn);
actions.appendChild(rebBtn);
actions.appendChild(lbBtn);
actions.appendChild(invBtn);
actions.appendChild(bossShopBtn);

function ckPlaceBossShopBtn() {
  if (!actions || !bossShopBtn) return;
  var btns = actions.querySelectorAll('button');
  for (var i = 0; i < btns.length; i++) {
    var txt = btns[i].textContent ? btns[i].textContent.trim() : '';
    if (txt === 'ПРЕМИУМ') {
      if (btns[i].nextSibling !== bossShopBtn) {
        btns[i].parentNode.insertBefore(bossShopBtn, btns[i].nextSibling);
      }
      if (btns[i].offsetWidth > 0) {
        bossShopBtn.style.width = btns[i].offsetWidth + 'px';
        bossShopBtn.style.minWidth = btns[i].offsetWidth + 'px';
        bossShopBtn.style.maxWidth = btns[i].offsetWidth + 'px';
        bossShopBtn.style.height = btns[i].offsetHeight + 'px';
        bossShopBtn.style.minHeight = btns[i].offsetHeight + 'px';
      }
      return;
    }
  }
}
setInterval(ckPlaceBossShopBtn, 250);

cssAdd('#ck-boss-shop-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:0!important;margin:0!important;vertical-align:top!important;border:2px outset #888!important;background:linear-gradient(180deg,#c084fc 0%,#7c3aed 100%)!important;color:#000!important;font-family:inherit!important;font-size:8.5px!important;font-weight:inherit!important;line-height:1!important;padding:0 1px!important;cursor:pointer!important;box-shadow:none!important;box-sizing:border-box!important;text-shadow:none!important;white-space:nowrap!important;overflow:hidden!important;letter-spacing:-0.2px!important;}');
cssAdd('#ck-boss-shop-btn:active{border-style:inset!important;}');
var player = el('div', 'ck-player');
player.className = ckMusicOn ? 'ck-on' : '';
var pInfo = el('div', 'ck-player-info');
var pName = el('div', 'ck-track-name', '', CK_TRACKS[ckTrack].n);
pName.id = 'ck-track-name';
var TPALETTE = ['ck-trk1','ck-trk2','ck-trk3','ck-trk4','ck-trk5','ck-trk6','ck-trk7','ck-trk8','ck-trk9','ck-trk10','ck-trk11','ck-trk12','ck-trk13','ck-trk14'];
function ckTrackPaint() {
  pName.className = 'ck-track-name ' + (TPALETTE[ckTrack] || 'ck-trk1');
}
ckTrackPaint();
var pNum = el('div', 'ck-track-num', '', (ckTrack + 1) + '/' + CK_TRACKS.length);
pNum.id = 'ck-track-num';
pInfo.appendChild(pName);
pInfo.appendChild(pNum);
var TMEDIA = { 5: 'vid4.mp4', 6: 'vid1.mp4', 7: 'vid2.mp4', 8: 'vid3.mp4', 9: 'vid5.mp4', 10: 'vid6.mp4', 11: 'vid9.mp4', 12: 'vid8.mp4', 13: 'vid7.mp4' };
var ckMedia = null;
function ckBuildMedia() {
  var tgt = pInfo;
  var old = document.getElementById('ck-mediabox');
  if (old && old.parentNode) { old.parentNode.removeChild(old); }
  var tm = (CK_UI && CK_UI.low)?null:TMEDIA[ckTrack];
  if (tm) {
    var box = el('div', 'ck-mediabox', 'ck-medbox');
    try {
      var v = document.createElement('video');
      v.src = tm; v.muted = true; v.defaultMuted = true; v.volume = 0; v.setAttribute('muted', ''); v.loop = true; v.setAttribute('playsinline', '');
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
var ckPT=0, ckPTKEY='spaceClicker_pt', ckUIDKEY='spaceClicker_uid', ckACCXP_KEY='spaceClicker_acc_xp';
try{ckPT=Number(localStorage.getItem(ckPTKEY))||0;}catch(e0){}
function ckGetAccXp() {
  return Number(localStorage.getItem(ckACCXP_KEY)) || 0;
}
function ckGetAccLevelData() {
  var totalXp = ckGetAccXp();
  var lvl = 1;
  while (true) {
    var req = Math.floor(1000 * Math.pow(lvl, 1.45));
    if (totalXp >= req) {
      totalXp -= req;
      lvl++;
    } else {
      return {
        level: lvl,
        curXp: totalXp,
        reqXp: req,
        pct: Math.min(100, Math.floor((totalXp / req) * 100))
      };
    }
  }
}
function ckAddAccXp(amount) {
  if (!amount || amount <= 0) return;
  var prevLvl = ckGetAccLevelData().level;
  var cur = ckGetAccXp() + amount;
  try { localStorage.setItem(ckACCXP_KEY, String(cur)); } catch (e) {}
  var nextLvl = ckGetAccLevelData().level;
  if (nextLvl > prevLvl) {
    ckToast('НОВЫЙ УРОВЕНЬ АККАУНТА: ' + nextLvl + '!');
    sfxRebirth();
  }
}
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
var pavaWrap=el('div','','ck-prof-ava-wrap');
var pavaPrev=el('button','ck-ava-prev','ck-prof-arr','◀');
var pava=el('div','ck-prof-ava');
var pavaNext=el('button','ck-ava-next','ck-prof-arr','▶');
pavaWrap.appendChild(pavaPrev);
pavaWrap.appendChild(pava);
pavaWrap.appendChild(pavaNext);
pbox2.appendChild(pavaWrap);
var pbody2=el('div','ck-prof-body');
pbox2.appendChild(pbody2);
var pclose2=el('button','ck-close-prof','','ЗАКРЫТЬ');
pbox2.appendChild(pclose2);
profM.appendChild(pbox2);
document.body.appendChild(profM);
var CK_AVAS = [
  { type: 'video', src: 'ava2.mp4' },
  { type: 'img', src: 'ava.jpg' }
];
var ckAvaIdx = 0;
try { ckAvaIdx = parseInt(localStorage.getItem('spaceClicker_ava') || '0', 10); if (isNaN(ckAvaIdx) || ckAvaIdx < 0) ckAvaIdx = 0; } catch (e) {}

pavaPrev.addEventListener('click', function () {
  ckAvaIdx = (ckAvaIdx - 1 + CK_AVAS.length) % CK_AVAS.length;
  try { localStorage.setItem('spaceClicker_ava', String(ckAvaIdx)); } catch (e) {}
  ckProfRender();
});
pavaNext.addEventListener('click', function () {
  ckAvaIdx = (ckAvaIdx + 1) % CK_AVAS.length;
  try { localStorage.setItem('spaceClicker_ava', String(ckAvaIdx)); } catch (e) {}
  ckProfRender();
});

function ckProfRender(){
  var nick=ckNick();
  var uid=ckUid();
  var isVIP=(['C26LW5Z5K3','Y245DTMQYB'].indexOf(uid)!==-1);
  pavaPrev.style.display = isVIP ? 'flex' : 'none';
  pavaNext.style.display = isVIP ? 'flex' : 'none';
  pava.innerHTML = '';
  if (!isVIP) {
    var imgBasic = document.createElement('img');
    imgBasic.className = 'ck-prof-media';
    imgBasic.src = 'avabasic.jpg';
    pava.appendChild(imgBasic);
  } else {
    var curAva = CK_AVAS[ckAvaIdx % CK_AVAS.length];
    if (curAva.type === 'video') {
      var v = document.createElement('video');
      v.className = 'ck-prof-media';
      v.src = curAva.src;
      v.autoplay = true;
      v.loop = true;
      v.muted = true;
      v.defaultMuted = true;
      v.volume = 0;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      pava.appendChild(v);
      try { var p = v.play(); if (p && p.catch) p.catch(function(){}); } catch (eMedia) {}
    } else {
      var img = document.createElement('img');
      img.className = 'ck-prof-media';
      img.src = curAva.src;
      pava.appendChild(img);
    }
  }
  var acc = ckGetAccLevelData();
  pbody2.innerHTML = '<div class="ck-prof-row"><span class="ck-prof-l">НИК</span><span class="ck-prof-v">' + ckEsc(nick) + (isVIP ? ' <span class="ck-prof-badge-admin">★ АДМИН</span>' : '') + '</span></div>' +
    '<div class="ck-prof-row"><span class="ck-prof-l">УРОВЕНЬ</span><span class="ck-prof-v" style="flex-direction:column;align-items:flex-start;">' +
      '<div style="display:flex;align-items:center;gap:8px;width:100%;"><span class="ck-prof-lvl-badge">LVL ' + acc.level + '</span><span style="font-size:11px;color:#c084fc;font-family:Consolas,monospace;">' + fmtNum(acc.curXp) + ' / ' + fmtNum(acc.reqXp) + ' XP</span></div>' +
      '<div class="ck-prof-xp-bar"><div class="ck-prof-xp-fill" style="width:' + acc.pct + '%"></div></div>' +
    '</span></div>' +
    '<div class="ck-prof-row"><span class="ck-prof-l">ID</span><span class="ck-prof-v"><span style="color:#93c5fd;font-family:Consolas,monospace;">' + uid + '</span></span><button id="ck-prof-copy">КОПИРОВАТЬ</button></div>' +
    '<div class="ck-prof-row"><span class="ck-prof-l">В ИГРЕ</span><span class="ck-prof-v" id="ck-prof-pt" style="color:#fde047;">' + ckFmtPT(ckPT) + '</span></div>' +
    '<div class="ck-prof-row"><span class="ck-prof-l">СТАТУС</span><span class="ck-prof-v">' + (isVIP ? '<span class="ck-prof-badge-admin">ROOT OVERRIDE</span>' : '<span class="ck-prof-badge-player">PLAYER</span>') + '</span></div>';
  var cb2=document.getElementById('ck-prof-copy');
  if(cb2)cb2.addEventListener('click',function(){
    try{
      navigator.clipboard.writeText(uid).then(function(){ckToast('ID скопирован');},function(){});}catch(e5){}});
}

var ADMIN_WHITELIST=['C26LW5Z5K3','Y245DTMQYB','DWLRET9PGH'];
var adminBtn=el('button','ck-admin-btn','','⚡ ВАЙП-ПАНЕЛЬ');
panel.appendChild(adminBtn);

var adminModal=el('div','ck-admin-modal','clicker-ui hidden');
var adminBox=el('div','ck-admin-box');
adminBox.appendChild(el('h2','','','УПРАВЛЕНИЕ СТАТИСТИКОЙ'));
adminBox.appendChild(el('div','ck-admin-desc','','Сброс полной статистики: клики, улучшения, множители, зелья, перерождения и позиции в топе.'));

var adminInput=el('input','ck-admin-target');
adminInput.placeholder='Введи ID игрока для сноса...';
adminBox.appendChild(adminInput);

var adminActs=el('div','','ck-admin-actions');
var btnWipeTarget=el('button','ck-admin-wipe-target','ck-admin-act-btn','СНЕСТИ СТАТИСТИКУ ПО ID');
var btnWipeSelf=el('button','ck-admin-wipe-self','ck-admin-act-btn','СНЕСТИ СЕБЕ СТАТИСТИКУ');
var btnCloseAdmin=el('button','ck-admin-close','ck-admin-act-btn','ЗАКРЫТЬ');
adminActs.appendChild(btnWipeTarget);
adminActs.appendChild(btnWipeSelf);

// Классическая панель выдачи ресурсов и улучшений по вводу прямо внутри модалки вайпа
(function(){
  var IT=['shard','core','prism','nova','void'];
  var BS=['frenzy','surge','gold','novaflask','quasar','hyperion','voidflask','pstorm','chrono','abyss','supernova','singularity','aether','godtear'];
  function num(v){var s=String(v||'').trim().toUpperCase();if(!s)return 0;var m=1,l=s.charAt(s.length-1);if(l<'0'||l>'9'){m=({K:1e3,M:1e6,B:1e9,T:1e12,Q:1e15,QI:1e18})[l]||1;s=s.slice(0,-1);}var n=parseFloat(s);return isNaN(n)?0:Math.floor(n*m);}
  function gs(){try{ckSave();}catch(e){}try{render(true);}catch(e2){}}
  function row(lbl,f1,f2){
    var r=document.createElement('div');r.style.cssText='display:flex;gap:6px;align-items:center;margin:6px 0;flex-wrap:wrap;';
    var s=document.createElement('span');s.style.cssText='flex:1;min-width:130px;font:bold 11.5px monospace;color:#e5e7eb;text-align:left;';s.textContent=lbl;
    var i1=document.createElement('input');i1.type='text';i1.style.cssText='flex:1;min-width:85px;max-width:140px;padding:5px 7px;border:1px solid #4b5563;border-radius:6px;background:#0b1026;color:#fff;font:11.5px Consolas;';
    var i2=null;if(f2){i2=document.createElement('input');i2.type='text';i2.placeholder=f2;i2.style.cssText=i1.style.cssText;}
    var b=document.createElement('button');b.textContent='ВЫДАТЬ';b.style.cssText='background:linear-gradient(135deg,#3a86ff,#7b2cbf);border:none;border-radius:6px;padding:5px 10px;font-weight:bold;font-size:11px;color:#fff;cursor:pointer;';
    b.addEventListener('click',function(){if(f2){f1(i1.value,i2.value);i2.value='';}else{f1(i1.value);i1.value='';}});
    r.appendChild(s);r.appendChild(i1);if(i2)r.appendChild(i2);r.appendChild(b);return r;
  }
  var box=document.createElement('div');box.id='ck-give-box';box.style.cssText='border-top:1px solid #4b5563;margin-top:12px;padding-top:10px;max-height:48vh;overflow-y:auto;';
  var h=document.createElement('div');h.style.cssText='text-align:center;font:900 13px monospace;color:#fca5a5;margin-bottom:6px;';h.textContent='ВЫДАЧА РЕСУРСОВ';box.appendChild(h);
  box.appendChild(row('Опыт профиля (число/10K/1M)',function(v){var n=num(v);if(n>0){ckAddAccXp(n);gs();ckToast('Выдано опыта: +'+n);}}));
  box.appendChild(row('Клики (число/100K/1B)',function(v){var n=num(v);if(n>0){CK.clicks=(CK.clicks||0)+n;gs();ckToast('Выдано кликов: +'+n);}}));
  box.appendChild(row('Перерождения (+2x к множ)',function(v){var n=num(v);if(n>0){CK.rebirths=(CK.rebirths||0)+n;CK.mult=(CK.mult||1)+2*n;gs();ckToast('Выдано реберфов: +'+n);}}));
  box.appendChild(row('ИКСЫ (множитель)',function(v){var n=num(v);if(n>0){CK.mult=(CK.mult||1)+n;gs();ckToast('Множитель: +'+n);}}));
  box.appendChild(row('МЕГА (+50x за каждое)',function(v){var n=num(v);if(n>0){var X=window.__CKEX=window.__CKEX||{};X.megaCount=(X.megaCount||0)+n;CK.mult=(CK.mult||1)+50*n;gs();ckToast('Выдано МЕГА: +'+n);}}));
  box.appendChild(row('СУПЕР (+10000x за каждое)',function(v){var n=num(v);if(n>0){var X=window.__CKEX=window.__CKEX||{};X.superCount=(X.superCount||0)+n;CK.mult=(CK.mult||1)+10000*n;gs();ckToast('Выдано СУПЕР: +'+n);}}));
  box.appendChild(row('Предмет (shard/core/prism/nova/void)',function(a,b){var id=String(a||'').trim().toLowerCase(),n=num(b)||1;if(IT.indexOf(id)<0)return;for(var q=0;q<Math.min(n,2000);q++)CK.inv.push(id);if(CK.inv.length>2000)CK.inv=CK.inv.slice(-2000);gs();try{ckInvRender();}catch(e3){}},'кол-во шт'));
  box.appendChild(row('Буст ID (godtear/gold/...)',function(a,b){var id=String(a||'').trim().toLowerCase(),n=num(b)||3600;if(BS.indexOf(id)<0||n<=0)return;var now=Date.now();CK.boost=CK.boost||{};CK.boost[id]=Math.min(now+Math.min(n,3600)*1000,now+3600*1000);gs();},'сек (до 3600)'));

  var fastRow=document.createElement('div');fastRow.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;';
  function mkQ(lbl,bg,fn){var b=document.createElement('button');b.textContent=lbl;b.style.cssText='padding:7px 5px;border:none;border-radius:6px;font:bold 10.5px Consolas;color:#fff;background:'+bg+';cursor:pointer;';b.addEventListener('click',fn);fastRow.appendChild(b);}
  mkQ('ВЫЗВАТЬ БОССА','linear-gradient(135deg,#dc2626,#991b1b)',function(){
    adminModal.classList.add('hidden');
    ckStartBossBattle();
  });

  mkQ('ВСЕ ПИТОМЦЫ','linear-gradient(135deg,#10b981,#059669)',function(){
    if(window.__CK_FEAT){
      window.__CK_FEAT.pets=window.__CK_FEAT.pets||{};
      ['pet_drone','pet_wisp','pet_dragon','pet_phoenix','pet_slime','pet_chronos','pet_reaper','pet_pulsar','pet_omega'].forEach(function(p){ window.__CK_FEAT.pets[p]=true; });
      try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
      if(window.refreshPetVisuals) window.refreshPetVisuals();
    }
    gs();ckToast('Все питомцы разблокированы!');
  });
  mkQ('ВСЕ НАВЫКИ','linear-gradient(135deg,#6366f1,#4f46e5)',function(){
    if(window.__CK_FEAT){
      window.__CK_FEAT.skillTree={crit:{crit_chance:5,crit_damage:5,crit_overload:3},income:{inc_mult:5,inc_dps:5,inc_warp:3},drop:{drop_luck:5,drop_void:5,drop_omni:1}};
      try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
    }
    gs();ckToast('Дерево навыков прокачано!');
  });
  mkQ('СЕЗОН 30 УР.','linear-gradient(135deg,#f59e0b,#b45309)',function(){
    if(window.__CK_FEAT){
      window.__CK_FEAT.season=window.__CK_FEAT.season||{};
      window.__CK_FEAT.season.xp=30000;window.__CK_FEAT.season.premium=true;
      try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
    }
    gs();ckToast('Сезон прокачан до максимума!');
  });
  mkQ('ВСЕ АЧИВКИ','linear-gradient(135deg,#ec4899,#be185d)',function(){
    if(window.__CK_FEAT&&Array.isArray(window.__CK_FEAT.achievements)){
      window.__CK_FEAT.achievements.forEach(function(a){ a.done=true; a.claim=true; });
      window.__CK_FEAT.stats.permGoldBonus=100;
      try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
    }
    gs();ckToast('Все ачивки получены!');
  });
  box.appendChild(fastRow);
  adminActs.appendChild(box);
})();

adminActs.appendChild(btnCloseAdmin);
adminBox.appendChild(adminActs);
adminModal.appendChild(adminBox);
document.body.appendChild(adminModal);

function ckCheckAdminPriv(){
  var myId=ckUid();
  if(ADMIN_WHITELIST.indexOf(myId)!==-1){
    adminBtn.style.display='block';
  }else{
    adminBtn.style.display='none';
  }
}
ckCheckAdminPriv();
setInterval(ckCheckAdminPriv,3000);

adminBtn.addEventListener('click',function(){
  if(ADMIN_WHITELIST.indexOf(ckUid())===-1)return;
  adminModal.classList.remove('hidden');
});
btnCloseAdmin.addEventListener('click',function(){
  adminModal.classList.add('hidden');
});

function ckDoHardReset(){
  CK.clicks=0;
  CK.mult=1;
  CK.rebirths=0;
  CK.boost={};
  CK.inv=[];
  CK.mc=0;
  CK.laser=false;
  CK.earth=false;
  CK.gold=false;
  CK.critM=false;
  CK.warp=false;
  CK.pets=[];
  if(window.CK) window.CK.pets=[];
  CK.lv=[];
  for(var z=0;z<360;z++)CK.lv.push(0);
  if(window.__CKEX){
    window.__CKEX.rbSpent=0;
    window.__CKEX.megaCount=0;
    window.__CKEX.superCount=0;
    window.__CKEX.rbAuto=0;
    window.__CKEX.rbAutoMega=0;
    window.__CKEX.nexus=0;
    window.__CKEX.idol=0;
    window.__CKEX.forge=0;
    window.__CKEX.offVault=0;
    window.__CKEX.craft={s:0,c:0,m:0,g:0,v:0};
  }
  if(window.__CK_FEAT){
    window.__CK_FEAT.pets={};
    window.__CK_FEAT.petSkins={};
    window.__CK_FEAT.unlockedSkins={};
  }
  if(window.ckFeaturesWipe) window.ckFeaturesWipe();
  var d = document.getElementById('ck-disc');
  if (d) {
    d.className = 'ck-disc';
    d.style.transform = '';
    d.style.filter = '';
    d.style.removeProperty('--strike-glow');
  }
  document.querySelectorAll('.ck-orbit-pet, .ck-pet-trail, .ck-pet-impact-ring, .ck-pet-hit-text, .ck-pet-hit-spark').forEach(function(el){
    if(el.parentNode) el.parentNode.removeChild(el);
  });
  try{
    localStorage.removeItem('spaceClicker_v1');
    localStorage.removeItem('spaceClicker_ext_v1');
    localStorage.removeItem('spaceClicker_auto');
    localStorage.removeItem('spaceClicker_features_v1');
  }catch(e){}
  ckSave();
  if(window.ckLbPush)window.ckLbPush(true);
  if(window.render)window.render(true);
  var petModalBox = document.getElementById('ck-pet-box');
  if(petModalBox && window.renderPetsModal) window.renderPetsModal(petModalBox);
  if(window.refreshPetVisuals) window.refreshPetVisuals();
  ckToast('ТВОЯ СТАТИСТИКА ПОЛНОСТЬЮ СНЕСЕНА!');
}

btnWipeSelf.addEventListener('click',function(){
  if(!confirm('ТОЧНО снести СЕБЕ всю статистику под ноль (клики, бусты, апгрейды, перерождения)?')) return;
  ckDoHardReset();
  adminModal.classList.add('hidden');
});

btnWipeTarget.addEventListener('click',function(){
  var target=String(adminInput.value||'').trim();
  if(!target){
    ckToast('Введи корректный ID игрока!');
    return;
  }
  if(target===ckUid()){
    ckDoHardReset();
    adminModal.classList.add('hidden');
    return;
  }
  try{
    var localLb=JSON.parse(localStorage.getItem('spaceClicker_lb_v2')||'{}');
    for(var k in localLb){
      if(k===target||(localLb[k]&&localLb[k].uid===target)){
        delete localLb[k];
      }
    }
    localStorage.setItem('spaceClicker_lb_v2',JSON.stringify(localLb));
  }catch(err){}
  var SBURL='https://bvyobeaxkeeatoaaljcz.supabase.co';
  var SBKEY='sb_publishable_erwxcWrojnbTBb6UpYgq2w_n8nnzzmQ';
  fetch(SBURL+'/rest/v1/leaderboard?nick=eq.'+encodeURIComponent(target),{
    method:'DELETE',
    headers:{'apikey':SBKEY,'Authorization':'Bearer '+SBKEY,'Content-Type':'application/json'}
  }).then(function(){
    ckToast('Статистика ID ['+target+'] успешно обнулена!');
  }).catch(function(){
    ckToast('Запрос выполнен для ID: '+target);
  });
  adminInput.value='';
  adminModal.classList.add('hidden');
});
profBtn.addEventListener('click',function(){profM.classList.remove('hidden');ckProfRender();});
pclose2.addEventListener('click',function(){profM.classList.add('hidden');});
setInterval(function(){if(!profM.classList.contains('hidden')){var el5=document.getElementById('ck-prof-pt');if(el5)el5.textContent=ckFmtPT(ckPT);}},1000);
window.__ckProfCore=1;
function ckThemeShock(col){try{var d=document.getElementById('ck-disc');if(d&&d.animate)d.animate([{filter:'brightness(1)',transform:'scale(1)'},{filter:'brightness(1.8) saturate(1.5)',transform:'scale(1.12)'},{filter:'brightness(1)',transform:'scale(1)'}],{duration:420,easing:'ease-out'});var ov=document.getElementById('clicker-overlay');if(ov&&ov.animate)ov.animate([{boxShadow:'inset 0 0 0px '+col},{boxShadow:'inset 0 0 180px '+col},{boxShadow:'inset 0 0 0px '+col}],{duration:600,easing:'ease-out'});}catch(e){}}
window.ckThemeShock=ckThemeShock;
window.__ckNucCore=1;
cssAdd('#ck-nucbtn{display:none !important;}');
cssAdd('#ck-nuc{display:none !important;}');
cssAdd('#ck-nucbtn2{background:linear-gradient(135deg,#0ea5e9,#134e6f);}');
cssAdd('#ck-nuc2{position:fixed;inset:0;z-index:9472;background:rgba(2,2,14,.88);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;}');
cssAdd('#ck-nuc2-box{width:min(620px,94vw);max-height:90vh;overflow-y:auto;background:linear-gradient(160deg,#101a2a,#0a1420);border:2px solid #7fd4ff;border-radius:16px;padding:18px;color:#fff;box-sizing:border-box;}');
cssAdd('#ck-nuc2-box h2{margin:0 0 10px;text-align:center;color:#7fd4ff;letter-spacing:2px;}');
cssAdd('#ck-nuc2-info{text-align:center;color:#9fb8cc;font-size:12px;margin-bottom:10px;}');
cssAdd('.ck-nrow{display:flex;align-items:center;gap:10px;background:#111634;border:1px solid #2b3672;border-radius:12px;padding:10px;margin-bottom:8px;}');
cssAdd('.ck-nrow .n1{flex:1;min-width:0;}');
cssAdd('.ck-nrow .n1 small{display:block;color:#8fa3e8;font-size:11px;}');
cssAdd('.ck-nrow .n2{text-align:right;flex:none;}');
cssAdd('.ck-nrow .n2 small{display:block;color:#8fa3e8;font-size:11px;margin-bottom:4px;}');
cssAdd('.ck-nrow .n2 button{background:linear-gradient(135deg,#7fd4ff,#134e6f);border:none;border-radius:8px;padding:7px 12px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;font-size:11px;}');
cssAdd('.ck-nrow .n2 button:disabled{opacity:.4;cursor:default;}');
cssAdd('#ck-close-nuc2{width:100%;background:#b3283c;border:none;border-radius:9px;padding:10px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
var nucBtn2=el('button','ck-nucbtn2','','ЯДРА');
var nuc2=el('div','ck-nuc2','clicker-ui hidden');
var nbox2=el('div','ck-nuc2-box');
nbox2.appendChild(el('h2','','','ЯДРА'));
var ninfo=el('div','ck-nuc2-info');
nbox2.appendChild(ninfo);
var ngrid2=el('div','','');
nbox2.appendChild(ngrid2);
var nclose2=el('button','ck-close-nuc2','','ЗАКРЫТЬ');
nbox2.appendChild(nclose2);
nuc2.appendChild(nbox2);
document.body.appendChild(nuc2);
var GKKEY2='spaceClicker_gen_v1';
var GK={o:[0,0,0,0,0],p:[0,0,0,0,0],cd:[0,0,0,0,0],b:[0,0,0,0,0],spd:0,rx:0,rbBank:0,pt:Date.now()};
function gkSave(){try{localStorage.setItem(GKKEY2,JSON.stringify(GK));}catch(e20){}}
(function(){try{var g=JSON.parse(localStorage.getItem(GKKEY2)||'null');if(g&&typeof g==='object'){var g1;for(g1=0;g1<5;g1++){GK.o[g1]=Number(g.o&&g.o[g1])||0;GK.p[g1]=Number(g.p&&g.p[g1])||0;GK.cd[g1]=Number(g.cd&&g.cd[g1])||0;GK.b[g1]=Number(g.b&&g.b[g1])||0;}GK.spd=Number(g.spd)||0;GK.rx=Number(g.rx)||0;GK.rbBank=Number(g.rbBank)||0;GK.pt=Number(g.pt)||Date.now();}}catch(e21){}})();
function gkSpd(){return 1+GK.spd*0.25;}
function gkPrice(gi2){if(gi2===0)return Math.ceil(1e30*Math.pow(4,GK.b[0]));return Math.ceil(100*Math.pow(8,GK.b[gi2]));}
var NNAME=['Ядро-1','Ядро-2','Ядро-3','Ядро-4','Ядро-5'];
function nucOk2(){return (CK.rebirths||0)>=50;}
nucBtn2.addEventListener('click',function(){if(!nucOk2()){ckToast('Нужно 50 перерождений');return;}nuc2.classList.remove('hidden');nucRender2();});
nclose2.addEventListener('click',function(){nuc2.classList.add('hidden');});
setInterval(function(){
var now2=Date.now();
for(var gi3=0;gi3<5;gi3++){
if(GK.cd[gi3]>0)GK.cd[gi3]=Math.max(0,GK.cd[gi3]-(now2-GK.pt)/1000);
if(GK.o[gi3]>0){
if(gi3<4)GK.p[gi3]+=GK.o[gi3]*10*gkSpd();
else GK.rbBank=(GK.rbBank||0)+GK.o[gi3];
}
}
GK.pt=now2;
gkSave();
if(!nuc2.classList.contains('hidden'))nucRender2();
},10000);
function nucRender2(){
if(nuc2.classList.contains('hidden'))return;
ninfo.textContent='Ядра вырабатывают ресурсы каждые 10 секунд. Партии по 10 шт, кулдаун 60с.';
var h='';
for(var ni=0;ni<5;ni++){
var unlocked=ni===0||GK.b[ni]>0||GK.o[ni-1]>=10;
var cd=Math.ceil(GK.cd[ni]);
h+='<div class=ck-nrow><div class=n1><b>'+NNAME[ni]+' x'+GK.o[ni]+'</b><small>';
if(ni<4)h+='накоплено: '+fmtNum(GK.p[ni]);else h+='даёт: '+GK.o[ni]+' перерожд./10с';
h+='</small></div><div class=n2>';
if(!unlocked)h+='<small>нужно 10 '+NNAME[ni-1]+'</small>';
else if(cd>0)h+='<small>кулдаун: '+cd+'с</small>';
else{
if(ni===0)h+='<small>цена: '+fmtNum(gkPrice(0))+' кликов</small><button id=ck-nb0>КУПИТЬ x10</button>';
else h+='<small>цена: '+fmtNum(gkPrice(ni))+' '+NNAME[ni-1]+'</small><button id=ck-nb'+ni+'>КУПИТЬ x10</button>';
}
h+='</div></div>';
}
h+='<div class=ck-nrow style=border-color:#ffd23f><div class=n1><b>СКОРОСТЬ</b><small>+'+(GK.spd*25)+'% выработки ('+GK.spd+' ур) - за Ядро-1</small></div><div class=n2><small>цена: '+fmtNum(Math.ceil(50*Math.pow(2,GK.spd)))+' Я-1</small><button id=ck-nss>КУПИТЬ</button></div></div>';
h+='<div class=ck-nrow style=border-color:#d68cff><div class=n1><b>ИКСЫ НАВСЕГДА</b><small>+'+(GK.rx*10)+' к множителю ('+GK.rx+' ур) - за Ядро-2</small></div><div class=n2><small>цена: '+fmtNum(Math.ceil(20*Math.pow(2,GK.rx)))+' Я-2</small><button id=ck-nsr>КУПИТЬ</button></div></div>';
h+='<div class=ck-nrow style=border-color:#ff4d6d><div class=n1><b>БАНК ПЕРЕРОЖДЕНИЙ</b><small>Ядро-5 копит перерождения - забирай вручную</small></div><div class=n2><small>в банке: '+Math.floor(GK.rbBank||0)+'</small><button id=ck-nbc>ЗАБРАТЬ</button></div></div>';
ngrid2.innerHTML=h;
var nb0=document.getElementById('ck-nb0');
if(nb0)nb0.addEventListener('click',function(){if(GK.cd[0]>0||CK.clicks<gkPrice(0))return;CK.clicks-=gkPrice(0);GK.o[0]+=10;GK.b[0]++;GK.cd[0]=60;gkSave();sfxBuy();nucRender2();});
var nq;
for(nq=1;nq<5;nq++)(function(nq2){
var b2=document.getElementById('ck-nb'+nq2);
if(b2)b2.addEventListener('click',function(){
if(GK.cd[nq2]>0||GK.p[nq2-1]<gkPrice(nq2))return;
GK.p[nq2-1]-=gkPrice(nq2);GK.o[nq2]+=10;GK.b[nq2]++;GK.cd[nq2]=60;gkSave();sfxBuy();nucRender2();
});
})(nq);
var bs2=document.getElementById('ck-nss');
if(bs2)bs2.addEventListener('click',function(){var c2=Math.ceil(50*Math.pow(2,GK.spd));if(GK.p[0]<c2)return;GK.p[0]-=c2;GK.spd++;gkSave();sfxBuy();nucRender2();});
var br2=document.getElementById('ck-nsr');
if(br2)br2.addEventListener('click',function(){var c3=Math.ceil(20*Math.pow(2,GK.rx));if(GK.p[1]<c3)return;GK.p[1]-=c3;GK.rx++;CK.mult=(CK.mult||1)+10;gkSave();ckSave();sfxBuy();nucRender2();});
var bc3=document.getElementById('ck-nbc');
if(bc3)bc3.addEventListener('click',function(){var nn=Math.floor(GK.rbBank||0);if(nn<1)return;CK.rebirths=(CK.rebirths||0)+nn;GK.rbBank=0;gkSave();ckSave();sfxBuy();ckToast('ЗАБРАНО: '+nn);nucRender2();});
}
nucBtn2.disabled=true;
setInterval(function(){nucBtn2.disabled=!nucOk2();},900);
/*__CKN3__*/
actions.appendChild(nucBtn2);
actions.appendChild(profBtn);
/* FEAT_SLOT */
(function(){
  if (!document.getElementById('ck-feat-loader')) {
    var s = document.createElement('script');
    s.id = 'ck-feat-loader';
    s.src = 'clicker_features.js?v=' + Date.now();
    document.body.appendChild(s);
  }
})();
actions.appendChild(player);
actions.appendChild(closeBtn);
left.appendChild(stats);
left.appendChild(disc);
left.appendChild(prbar);
var boostBar = el('div', 'ck-boostbar');
boostBar.style.display = 'none';
left.appendChild(boostBar);
left.appendChild(actions);
var ckVer = 'dev';
try { var scs = document.getElementsByTagName('script'); for (var si6 = 0; si6 < scs.length; si6++) { var sr = scs[si6].src || ''; if (sr.indexOf('clicker.js?') !== -1) { var mp = sr.split('v=')[1]; if (mp) ckVer = 'v' + mp; break; } } } catch (e30) {}
var verEl = el('div', 'ck-ver', '', ckVer);
left.appendChild(verEl);
if (ckOfflineGain >= 1) {
  var offNote = el('div', 'ck-offline');
  offNote.innerHTML = 'Пока тебя не было: <b>+' + fmtNum(ckOfflineGain) + '</b><span id="ck-off-x">✕</span>';
  left.insertBefore(offNote, stats);
  offNote.addEventListener('click', function () { offNote.style.display = 'none'; });
}
var right = el('div', 'clicker-right');
right.appendChild(el('h3', '', '', 'АПГРЕЙДЫ'));
var CK_AUTO = {
  t: [
    { on: false, min: 0, max: 0, subs: { auto: true, power: true } },
    { on: false, min: 0, max: 0, subs: { crit: true, gold: true } },
    { on: false, min: 0, max: 0, subs: { critx: true, mega: true } },
    { on: false, min: 0, max: 0, subs: { boost: true, drop: true } }
  ],
  scroll: true
};
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
  function ckParseAmt(v) {
    var st = String(v || '').trim().toUpperCase();
    if (!st) return 0;
    var mult = 1;
    var last = st.charAt(st.length - 1);
    if (!(last >= '0' && last <= '9')) { var mp = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15, QI: 1e18 }; mult = mp[last] || 1; st = st.slice(0, -1); }
    var nn = parseFloat(st);
    if (isNaN(nn)) return 0;
    return Math.floor(nn * mult);
  }
  function ckFmtAmt(n) {
    if (!n) return '';
    var u = [[1e18, 'Qi'], [1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (var xi = 0; xi < u.length; xi++) {
      if (n >= u[xi][0]) { var vv = n / u[xi][0]; return parseFloat(vv >= 100 ? vv.toFixed(0) : vv >= 10 ? vv.toFixed(1) : vv.toFixed(2)) + u[xi][1]; }
    }
    return '' + n;
  }
  try {
    var s = JSON.parse(localStorage.getItem('spaceClicker_auto') || 'null');
    if (s && typeof s === 'object') {
      CK_AUTO.scroll = (s.scroll !== false);
      if (s.t && typeof s.t === 'object') {
        for (var tk = 0; tk < 4; tk++) {
          var tc = s.t[tk];
          if (tc) {
            CK_AUTO.t[tk].on = !!tc.on;
            CK_AUTO.t[tk].min = Math.max(0, Number(tc.min || tc.thr) || 0);
            CK_AUTO.t[tk].max = Math.max(0, Number(tc.max) || 0);
            if (tc.subs && typeof tc.subs === 'object') {
              for (var sk in tc.subs) CK_AUTO.t[tk].subs[sk] = !!tc.subs[sk];
            }
          }
        }
      }
    }
  } catch (e) {}

  var ap = el('div', 'ck-autop');
  var scl = el('button', 'ck-ap-scl', 'ck-apbtn apb-scl' + (CK_AUTO.scroll ? ' on' : ''), 'АВТО-СКРОЛЛ: ' + (CK_AUTO.scroll ? 'ВКЛ' : 'ВЫКЛ'));
  scl.addEventListener('click', function () { CK_AUTO.scroll = !CK_AUTO.scroll; scl.className = 'ck-apbtn apb-scl' + (CK_AUTO.scroll ? ' on' : ''); scl.textContent = 'АВТО-СКРОЛЛ: ' + (CK_AUTO.scroll ? 'ВКЛ' : 'ВЫКЛ'); ckAutoSave(); });
  ap.appendChild(scl);

    var cfgBtn = el('button', 'ck-ap-cfg', 'ck-apcfg-btn', '⚙');
    cfgBtn.title = 'Настройки автопокупки';
  cfgBtn.title = 'Настройки автопокупки';
  ap.appendChild(cfgBtn);

  var ANAMES = ['ДОХОД', 'КРИТ/ГОЛД', 'МНОЖ', 'НОВЫЕ'];
  var ACLS = ['apb-buy', 'apb-lb', 'apb-mg', 'apb-gr'];
  var ASTRAT = ['last', 'cheapest', 'last', 'cheapest'];
  var ASUBS = [
    [{ k: 'auto', n: 'Автоклик' }, { k: 'power', n: 'Клик' }],
    [{ k: 'crit', n: 'Крит шанс' }, { k: 'gold', n: 'Голд' }],
    [{ k: 'critx', n: 'Крит множ' }, { k: 'mega', n: 'Мега ядро' }],
    [{ k: 'boost', n: 'Хронизатор' }, { k: 'drop', n: 'Дроп' }]
  ];

  for (var t3i = 0; t3i < 4; t3i++) {
    (function (tix) {
      var cfg = CK_AUTO.t[tix];
      var b = el('button', 'ck-ap-t' + tix, 'ck-apbtn ' + ACLS[tix] + (cfg.on ? ' on' : ''), ANAMES[tix] + ': ' + (cfg.on ? 'ВКЛ' : 'ВЫКЛ'));
      b.addEventListener('click', function () { cfg.on = !cfg.on; b.className = 'ck-apbtn ' + ACLS[tix] + (cfg.on ? ' on' : ''); b.textContent = ANAMES[tix] + ': ' + (cfg.on ? 'ВКЛ' : 'ВЫКЛ'); ckAutoSave(); });
      ap.appendChild(b);
    })(t3i);
  }
  right.appendChild(ap);

  var autoModal = el('div', 'ck-auto-modal', 'clicker-ui hidden');
  var autoBox = el('div', 'ck-auto-modal-box');
  autoBox.appendChild(el('h2', '', '', 'НАСТРОЙКИ АВТОПОКУПКИ'));
  var cardsWrap = el('div', 'ck-auto-cards');

  function renderAutoModalCards() {
    cardsWrap.innerHTML = '';
    for (var mi = 0; mi < 4; mi++) {
      (function (idx) {
        var c = CK_AUTO.t[idx];
        var card = el('div', '', 'ck-ap-card');
        card.appendChild(el('div', '', 'ck-ap-card-title', ANAMES[idx]));

        var inpRow = el('div', '', 'ck-ap-inputs');
        var lblMin = el('label'); lblMin.textContent = 'От: ';
        var inMin = el('input'); inMin.type = 'text'; inMin.placeholder = '0 / 100K'; inMin.value = ckFmtAmt(c.min);
        lblMin.appendChild(inMin);

        var lblMax = el('label'); lblMax.textContent = 'До: ';
        var inMax = el('input'); inMax.type = 'text'; inMax.placeholder = '∞ / 10M'; inMax.value = ckFmtAmt(c.max);
        lblMax.appendChild(inMax);

        inMin.addEventListener('input', function () { c.min = ckParseAmt(inMin.value); ckAutoSave(); });
        inMax.addEventListener('input', function () { c.max = ckParseAmt(inMax.value); ckAutoSave(); });

        inpRow.appendChild(lblMin);
        inpRow.appendChild(lblMax);
        card.appendChild(inpRow);

        var subRow = el('div', '', 'ck-ap-subtypes');
        var subList = ASUBS[idx];
        for (var si = 0; si < subList.length; si++) {
          (function (sb) {
            var isAct = (c.subs[sb.k] !== false);
            var sbtn = el('button', '', 'ck-ap-subbtn' + (isAct ? ' on' : ''), sb.n + ': ' + (isAct ? 'ВКЛ' : 'ВЫКЛ'));
            sbtn.addEventListener('click', function () {
              var nxt = !c.subs[sb.k];
              c.subs[sb.k] = nxt;
              sbtn.className = 'ck-ap-subbtn' + (nxt ? ' on' : '');
              sbtn.textContent = sb.n + ': ' + (nxt ? 'ВКЛ' : 'ВЫКЛ');
              ckAutoSave();
            });
            subRow.appendChild(sbtn);
          })(subList[si]);
        }
        card.appendChild(subRow);
        cardsWrap.appendChild(card);
      })(mi);
    }
  }

  autoBox.appendChild(cardsWrap);
    var closeAutoBtn = el('button', 'ck-close-auto-modal', '', 'ЗАКРЫТЬ');
  closeAutoBtn.addEventListener('click', function () { autoModal.classList.add('hidden'); });
  autoBox.appendChild(closeAutoBtn);
  autoModal.appendChild(autoBox);
  document.body.appendChild(autoModal);

  cfgBtn.addEventListener('click', function () {
    renderAutoModalCards();
    autoModal.classList.remove('hidden');
  });

  setInterval(function () {
    if (window.__CKEX && window.__CKEX.rbAuto && CK.clicks >= 1e14) { CK.mult += 2; CK.rebirths++; sfxRebirth(); CK.clicks = 0; CK.lv = []; for (var zr = 0; zr < 360; zr++) CK.lv[zr] = 0; ckSave(); render(true); return; }
    for (var t4 = 0; t4 < 4; t4++) {
      var cfg2 = CK_AUTO.t[t4];
      if (!cfg2.on) continue;
      var bought = 0;
      while (bought < (CK_UI.low ? 15 : 50)) {
        var pick = -1, pcost = 0;
        if (ASTRAT[t4] === 'last') {
          for (var xa = 359; xa >= 0; xa--) {
            if (ckUpgGrp(xa) !== t4) continue;
            var utype = CK_UPG[xa].type;
            if (cfg2.subs && cfg2.subs[utype] === false) continue;
            var ca = ckUpgCost(xa);
            if (cfg2.max > 0 && ca > cfg2.max) continue;
            if (ca < cfg2.min) continue;
            if (CK.clicks >= ca) { pick = xa; pcost = ca; break; }
          }
        } else {
          var bc = Infinity;
          for (var xb2 = 0; xb2 < 360; xb2++) {
            if (ckUpgGrp(xb2) !== t4) continue;
            var utype2 = CK_UPG[xb2].type;
            if (cfg2.subs && cfg2.subs[utype2] === false) continue;
            var cb = ckUpgCost(xb2);
            if (cfg2.max > 0 && cb > cfg2.max) continue;
            if (cb < cfg2.min) continue;
            if (CK.clicks >= cb && cb < bc) { bc = cb; pick = xb2; }
          }
          if (pick >= 0) pcost = bc;
        }
        if (pick < 0) break;
        CK.clicks -= pcost;
        CK.lv[pick]++;
        bought++;
      }
      if (bought) { sfxBuy(); ckSave(); if (CK_UI.low) { render(); } else { render(true); } }
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
var CK_UI = { sfx: true, font: 100, ui: 100, bg: 0, t2: 0, low: 0, altDesign: 0 };
var ckBgVid = null;
var T2FILES = ['', 'back1.mp4', 'back2.mp4', 'back3.mp4', 'back4.mp4', 'back5.mp4', 'back6.mp4', 'back7.mp4', 'back8.mp4', 'back9.mp4', 'back10.mp4'];
var T2CLASSES = ['', 't2w', 't2g', 't2p', 't2y', 't2b2', 't2o', 't2v', 't2c2', 't2pn', 't2cv'];
function ckT2Apply() {
  panel.className = 'clicker-panel' + (CK_UI.t2 ? ' t2-theme ' + T2CLASSES[CK_UI.t2] : '') + (CK_UI.altDesign ? ' ck-alt-design' : '');
  var left0 = document.getElementById('clicker-left');
  var old0 = document.getElementById('ck-bgvid');
  if (old0 && old0.parentNode) old0.parentNode.removeChild(old0);
  ckBgVid = null;
  if (CK_UI.t2 && left0 && !CK_UI.low) {
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
if(CK_UI.low){
  cssAdd('*,*::before,*::after{animation:none!important;transition:none!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;backdrop-filter:none!important;will-change:auto!important;}');
  cssAdd('#ck-bgvid,#ck-orb,.ck-medbox,.ck-medv,.ck-hangs,.ck-hang,.ck-pearl,.ck-spark,#ck-disc::before,.ck-pet-trail,.ck-pet-impact-ring,.ck-pet-hit-text,.ck-blue3-vines-overlay{display:none !important;}');
  cssAdd('.clicker-panel,.ck-up,#clicker-overlay,.ck-shop-item,.ck-inv-card,.ck-nrow{background:#0c1020 !important;border-color:#202848 !important;}');
  cssAdd('.ck-float{display:none!important;}');
  cssAdd('.ck-orbit-pet{filter:none!important;}');
}/*low-extra-css*/
setInterval(function () { try { var ov = document.getElementById('clicker-overlay'); var open = !!(ov && !ov.classList.contains('hidden')); var vs = document.querySelectorAll('video'); for (var vi = 0; vi < vs.length; vi++) { var vd = vs[vi]; if (!vd || vd.paused) continue; var inc = vd.closest ? vd.closest('.clicker-ui,#clicker-overlay') : null; if (open && !inc) { vd.pause(); continue; } if (!open && getComputedStyle(vd).display === 'none') vd.pause(); } } catch (e) {} }, 2500);
var _ckBeepOrig = ckBeep;
ckBeep = function (freq, dur, type, gain, slideTo) { if (CK_UI.sfx === false) return; _ckBeepOrig(freq, dur, type, gain, slideTo); };
(function () {
  try { var s = JSON.parse(localStorage.getItem('spaceClicker_ui') || 'null'); if (s && typeof s === 'object') { CK_UI.sfx = (s.sfx !== false); CK_UI.font = Math.max(80, Math.min(160, Number(s.font) || 100)); CK_UI.ui = Math.max(70, Math.min(140, Number(s.ui) || 100)); CK_UI.bg = Math.max(0, Math.min(CK_BGS.length - 1, Number(s.bg) || 0)); CK_UI.t2 = Math.max(0, Math.min(10, Number(s.t2) || 0)); CK_UI.low = !!s.low; } } catch (e) {}
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
  var lowBtn = el('button', '', 'ck-apbtn' + (CK_UI.low ? ' on' : ''), 'СЛАБОЕ УСТРОЙСТВО: ' + (CK_UI.low ? 'ВКЛ' : 'ВЫКЛ'));
lowBtn.addEventListener('click', function(){CK_UI.low=!CK_UI.low;lowBtn.className='ck-apbtn'+(CK_UI.low?' on':'');lowBtn.textContent='СЛАБОЕ УСТРОЙСТВО: '+(CK_UI.low?'ВКЛ':'ВЫКЛ');ckUiSave();location.reload();});
ckSettingsPanel.appendChild(lowBtn);
  var altBtn = el('button', '', 'ck-apbtn' + (CK_UI.altDesign ? ' on' : ''), 'ДРУГОЙ ДИЗАЙН: ' + (CK_UI.altDesign ? 'ВКЛ' : 'ВЫКЛ'));
altBtn.addEventListener('click', function(){
  CK_UI.altDesign = CK_UI.altDesign ? 0 : 1;
  altBtn.className = 'ck-apbtn' + (CK_UI.altDesign ? ' on' : '');
  altBtn.textContent = 'ДРУГОЙ ДИЗАЙН: ' + (CK_UI.altDesign ? 'ВКЛ' : 'ВЫКЛ');
  ckUiApply();
  ckUiSave();
});
ckSettingsPanel.appendChild(altBtn);
ckSettingsPanel.appendChild(swRow);
  ckSettingsPanel.appendChild(el('div', '', 'ck-seth', 'ТЕМА V2'));
  var T2NAMES = ['СТАНДАРТ', 'БЕЛАЯ', 'СЕРАЯ', 'РОЗОВАЯ', 'ЖЕЛТАЯ', 'ГОЛУБАЯ', 'ОСЕНЬ', 'ФИОЛЕТОВАЯ', 'ГОЛУБАЯ V2', 'РОЗОВЫЙ НЕОН', 'ГОЛУБАЯ V3'];
  for (var t2i = 0; t2i < T2NAMES.length; t2i++) {
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
cssAdd('#ck-prof{position:fixed;inset:0;z-index:9472;background:radial-gradient(circle at 50% 30%,rgba(20,24,64,.88) 0%,rgba(5,7,20,.97) 100%);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(16px);animation:ckFadeIn .25s ease-out;}');
cssAdd('@keyframes ckFadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}');
cssAdd('#ck-prof-box{width:min(470px,93vw);background:linear-gradient(180deg,rgba(19,25,58,.94) 0%,rgba(10,13,32,.98) 100%);border:1px solid rgba(110,168,254,.35);position:relative;border-radius:28px;padding:30px 24px 24px;color:#fff;text-align:center;box-sizing:border-box;max-height:92vh;overflow-y:auto;box-shadow:0 35px 90px rgba(0,0,0,.85),0 0 60px rgba(56,189,248,.25),inset 0 1px 0 rgba(255,255,255,.2);}');
cssAdd('#ck-prof-box::before{content:"";position:absolute;top:0;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,#38bdf8,#a855f7,#ffd76a,transparent);pointer-events:none;}');
cssAdd('#ck-prof-box h2{margin:0 0 18px;letter-spacing:3.5px;font-size:22px;font-weight:900;background:linear-gradient(90deg,#93c5fd 0%,#ffd76a 50%,#f472b6 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-transform:uppercase;text-shadow:0 0 30px rgba(147,197,253,.35);}');
cssAdd('#ck-prof-ava{width:96px;height:96px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 0 35px rgba(56,189,248,.5),0 0 70px rgba(168,85,247,.3),inset 0 0 15px rgba(0,0,0,.6);border:3px solid rgba(255,255,255,.75);position:relative;background:#090d24;transition:transform .3s cubic-bezier(.34,1.56,.64,1);}');
cssAdd('#ck-prof-ava:hover{transform:scale(1.06);}');
cssAdd('.ck-prof-media{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;border-radius:50%;}');
cssAdd('.ck-prof-ava-wrap{display:flex;align-items:center;justify-content:center;gap:18px;margin:0 auto 20px;}');
cssAdd('.ck-prof-arr{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,rgba(30,41,88,.85),rgba(18,24,56,.95));border:1px solid rgba(96,165,250,.4);color:#93c5fd;font-size:15px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 4px 14px rgba(0,0,0,.35);}');
cssAdd('.ck-prof-arr:hover{transform:scale(1.12) translateY(-2px);background:linear-gradient(135deg,#38bdf8,#2563eb);color:#fff;border-color:#93c5fd;box-shadow:0 0 20px rgba(56,189,248,.6);}');
cssAdd('.ck-prof-arr:active{transform:scale(.92);}');
cssAdd('.ck-prof-row{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(24,32,74,.65),rgba(14,19,48,.75));border:1px solid rgba(99,102,241,.25);border-radius:16px;padding:12px 16px;margin-bottom:11px;text-align:left;position:relative;transition:all .22s cubic-bezier(.16,1,.3,1);backdrop-filter:blur(6px);}');
cssAdd('.ck-prof-row::before{content:"";position:absolute;left:0;top:20%;bottom:20%;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#38bdf8,#818cf8);opacity:0;transition:opacity .2s;}');
cssAdd('.ck-prof-row:hover{transform:translateX(5px);border-color:rgba(56,189,248,.6);background:linear-gradient(135deg,rgba(32,42,94,.85),rgba(18,24,62,.9));box-shadow:0 8px 24px rgba(0,0,0,.4),0 0 20px rgba(56,189,248,.2);}');
cssAdd('.ck-prof-row:hover::before{opacity:1;}');
cssAdd('.ck-prof-l{width:74px;color:#94a3b8;font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;flex:none;display:flex;align-items:center;gap:6px;}');
cssAdd('.ck-prof-v{flex:1;font-weight:800;font-size:14px;word-break:break-all;color:#f8fafc;letter-spacing:.3px;display:flex;align-items:center;flex-wrap:wrap;gap:6px;}');
cssAdd('.ck-prof-badge-admin{background:linear-gradient(135deg,rgba(245,158,11,.25),rgba(217,119,6,.4));border:1px solid #fbbf24;color:#fde047;font-size:10px;font-weight:900;padding:3px 8px;border-radius:8px;letter-spacing:1px;box-shadow:0 0 12px rgba(251,191,36,.35);text-transform:uppercase;}');
cssAdd('.ck-prof-badge-player{background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.4);color:#38bdf8;font-size:10px;font-weight:800;padding:3px 8px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;}');
cssAdd('#ck-prof-copy{background:linear-gradient(135deg,#0284c7,#2563eb);border:1px solid rgba(125,211,252,.5);border-radius:10px;color:#fff;padding:8px 14px;font-weight:800;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:.8px;flex:none;box-shadow:0 4px 14px rgba(2,132,199,.4);transition:all .18s;}');
cssAdd('#ck-prof-copy:hover{transform:translateY(-1px) scale(1.05);filter:brightness(1.15);box-shadow:0 6px 20px rgba(56,189,248,.6);}');
cssAdd('#ck-prof-copy:active{transform:scale(.95);}');
cssAdd('#ck-close-prof{width:100%;background:linear-gradient(135deg,#e11d48,#9f1239);border:1px solid rgba(251,113,133,.4);border-radius:14px;padding:13px;font-weight:900;font-size:13px;letter-spacing:1.5px;color:#fff;cursor:pointer;font-family:inherit;margin-top:14px;box-shadow:0 6px 22px rgba(225,29,72,.45);transition:all .2s;}');
cssAdd('#ck-close-prof:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 8px 28px rgba(225,29,72,.6);}');
cssAdd('#ck-close-prof:active{transform:scale(.98);}');
cssAdd('#ck-prof-pt{font-family:Consolas,monospace !important;}');


cssAdd('.t2-theme.t2b2{background:linear-gradient(160deg,rgba(10,16,28,.92),rgba(6,10,20,.94)) !important;border-color:#7dd3fc !important;box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 80px #38bdf833 !important;}');
cssAdd('.t2-theme.t2b2 #clicker-right{background:rgba(8,12,24,.85) !important;}');
cssAdd('.t2-theme.t2b2 .ck-up{background:rgba(16,24,40,.9) !important;border-color:#38bdf855 !important;color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2b2 .ck-tab{background:rgba(16,24,40,.9) !important;border-color:#38bdf866 !important;color:#7dd3fc !important;}');
cssAdd('.t2-theme.t2b2 .ck-tab.on{background:linear-gradient(135deg,#7dd3fc,#38bdf8) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2b2 .ck-actions button{background:linear-gradient(135deg,#7dd3fc,#38bdf8 45%,#7dd3fc) !important;background-size:200% 200% !important;animation:ckTFlow0 2.6s ease infinite !important;box-shadow:0 0 16px #38bdf866 !important;}');
cssAdd('@keyframes ckTFlow0{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('.t2-theme.t2b2 .ck-apbtn{background:rgba(16,24,40,.9) !important;border-color:#38bdf866 !important;color:#7dd3fc !important;}');
cssAdd('.t2-theme.t2b2 .ck-apbtn.on{background:linear-gradient(135deg,#7dd3fc,#38bdf8) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2b2 #ck-player{background:linear-gradient(135deg,rgba(14,20,38,.96),rgba(10,14,28,.96)) !important;border-color:#7dd3fc66 !important;}');
cssAdd('.t2-theme.t2b2 .ck-hangs{--hcol:#7dd3fc !important;}');
cssAdd('.t2-theme.t2b2 .ck-eq i,.t2-theme.t2b2 .ck-wave i{background:linear-gradient(180deg,#fff,#7dd3fc) !important;}');
cssAdd('.t2-theme.t2b2 #ck-stats{background:rgba(12,18,32,.9) !important;border-color:#38bdf844 !important;color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2b2 #ck-stats b{color:#fff !important;text-shadow:0 0 10px #7dd3fc !important;}');
cssAdd('.t2-theme.t2b2 .ck-mbtn{background:linear-gradient(145deg,#232c5e,#151b40) !important;color:#cfe0ff !important;border-color:#38bdf866 !important;}');
cssAdd('.t2-theme.t2o{background:linear-gradient(160deg,rgba(10,16,28,.92),rgba(6,10,20,.94)) !important;border-color:#fb923c !important;box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 80px #ea580c33 !important;}');
cssAdd('.t2-theme.t2o #clicker-right{background:rgba(8,12,24,.85) !important;}');
cssAdd('.t2-theme.t2o .ck-up{background:rgba(16,24,40,.9) !important;border-color:#ea580c55 !important;color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2o .ck-tab{background:rgba(16,24,40,.9) !important;border-color:#ea580c66 !important;color:#fb923c !important;}');
cssAdd('.t2-theme.t2o .ck-tab.on{background:linear-gradient(135deg,#fb923c,#ea580c) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2o .ck-actions button{background:linear-gradient(135deg,#fb923c,#ea580c 45%,#fb923c) !important;background-size:200% 200% !important;animation:ckTFlow1 2.6s ease infinite !important;box-shadow:0 0 16px #ea580c66 !important;}');
cssAdd('@keyframes ckTFlow1{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('.t2-theme.t2o .ck-apbtn{background:rgba(16,24,40,.9) !important;border-color:#ea580c66 !important;color:#fb923c !important;}');
cssAdd('.t2-theme.t2o .ck-apbtn.on{background:linear-gradient(135deg,#fb923c,#ea580c) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2o #ck-player{background:linear-gradient(135deg,rgba(14,20,38,.96),rgba(10,14,28,.96)) !important;border-color:#fb923c66 !important;}');
cssAdd('.t2-theme.t2o .ck-hangs{--hcol:#fb923c !important;}');
cssAdd('.t2-theme.t2o .ck-eq i,.t2-theme.t2o .ck-wave i{background:linear-gradient(180deg,#fff,#fb923c) !important;}');
cssAdd('.t2-theme.t2o #ck-stats{background:rgba(12,18,32,.9) !important;border-color:#ea580c44 !important;color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2o #ck-stats b{color:#fff !important;text-shadow:0 0 10px #fb923c !important;}');
cssAdd('.t2-theme.t2o .ck-mbtn{background:linear-gradient(145deg,#232c5e,#151b40) !important;color:#cfe0ff !important;border-color:#ea580c66 !important;}');
cssAdd('.t2-theme.t2v{background:linear-gradient(160deg,rgba(10,16,28,.92),rgba(6,10,20,.94)) !important;border-color:#c084fc !important;box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 80px #8b5cf633 !important;}');
cssAdd('.t2-theme.t2v #clicker-right{background:rgba(8,12,24,.85) !important;}');
cssAdd('.t2-theme.t2v .ck-up{background:rgba(16,24,40,.9) !important;border-color:#8b5cf655 !important;color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2v .ck-tab{background:rgba(16,24,40,.9) !important;border-color:#8b5cf666 !important;color:#c084fc !important;}');
cssAdd('.t2-theme.t2v .ck-tab.on{background:linear-gradient(135deg,#c084fc,#8b5cf6) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2v .ck-actions button{background:linear-gradient(135deg,#c084fc,#8b5cf6 45%,#c084fc) !important;background-size:200% 200% !important;animation:ckTFlow2 2.6s ease infinite !important;box-shadow:0 0 16px #8b5cf666 !important;}');
cssAdd('@keyframes ckTFlow2{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('.t2-theme.t2v .ck-apbtn{background:rgba(16,24,40,.9) !important;border-color:#8b5cf666 !important;color:#c084fc !important;}');
cssAdd('.t2-theme.t2v .ck-apbtn.on{background:linear-gradient(135deg,#c084fc,#8b5cf6) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2v #ck-player{background:linear-gradient(135deg,rgba(14,20,38,.96),rgba(10,14,28,.96)) !important;border-color:#c084fc66 !important;}');
cssAdd('.t2-theme.t2v .ck-hangs{--hcol:#c084fc !important;}');
cssAdd('.t2-theme.t2v .ck-eq i,.t2-theme.t2v .ck-wave i{background:linear-gradient(180deg,#fff,#c084fc) !important;}');
cssAdd('.t2-theme.t2v #ck-stats{background:rgba(12,18,32,.9) !important;border-color:#8b5cf644 !important;color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2v #ck-stats b{color:#fff !important;text-shadow:0 0 10px #c084fc !important;}');
cssAdd('.t2-theme.t2v .ck-mbtn{background:linear-gradient(145deg,#232c5e,#151b40) !important;color:#cfe0ff !important;border-color:#8b5cf666 !important;}');
cssAdd('.t2-theme.t2c2{background:linear-gradient(160deg,rgba(10,16,28,.92),rgba(6,10,20,.94)) !important;border-color:#22d3ee !important;box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 80px #0e749033 !important;}');
cssAdd('.t2-theme.t2c2 #clicker-right{background:rgba(8,12,24,.85) !important;}');
cssAdd('.t2-theme.t2c2 .ck-up{background:rgba(16,24,40,.9) !important;border-color:#0e749055 !important;color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2c2 .ck-tab{background:rgba(16,24,40,.9) !important;border-color:#0e749066 !important;color:#22d3ee !important;}');
cssAdd('.t2-theme.t2c2 .ck-tab.on{background:linear-gradient(135deg,#22d3ee,#0e7490) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2c2 .ck-actions button{background:linear-gradient(135deg,#22d3ee,#0e7490 45%,#22d3ee) !important;background-size:200% 200% !important;animation:ckTFlow3 2.6s ease infinite !important;box-shadow:0 0 16px #0e749066 !important;}');
cssAdd('@keyframes ckTFlow3{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
cssAdd('.t2-theme.t2c2 .ck-apbtn{background:rgba(16,24,40,.9) !important;border-color:#0e749066 !important;color:#22d3ee !important;}');
cssAdd('.t2-theme.t2c2 .ck-apbtn.on{background:linear-gradient(135deg,#22d3ee,#0e7490) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2c2 #ck-player{background:linear-gradient(135deg,rgba(14,20,38,.96),rgba(10,14,28,.96)) !important;border-color:#22d3ee66 !important;}');
cssAdd('.t2-theme.t2c2 .ck-hangs{--hcol:#22d3ee !important;}');
cssAdd('.t2-theme.t2c2 .ck-eq i,.t2-theme.t2c2 .ck-wave i{background:linear-gradient(180deg,#fff,#22d3ee) !important;}');
cssAdd('.t2-theme.t2c2 #ck-stats{background:rgba(12,18,32,.9) !important;border-color:#0e749044 !important;color:#dfe6ff !important;}');
cssAdd('.t2-theme.t2c2 #ck-stats b{color:#fff !important;text-shadow:0 0 10px #22d3ee !important;}');
cssAdd('.t2-theme.t2c2 .ck-mbtn{background:linear-gradient(145deg,#232c5e,#151b40) !important;color:#cfe0ff !important;border-color:#0e749066 !important;}');

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
      var bub = el('div', '', 'ck-flask-bub');
      flask.appendChild(bub);
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
    if (!document.getElementById('ck-meta-script')) {
      var ms = document.createElement('script');
      ms.id = 'ck-meta-script';
      ms.src = 'clicker_features.js';
      document.body.appendChild(ms);
    }
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
var ckBossActive = false;
var ckPlayerHp = 100;
var ckBossHp = 1000;
var ckBossMaxHp = 1000;
var ckClicksUntilBoss = 10000;
var ckBossAttackTimer = null;

var CK_BOSSES = [
  { name: 'Левиафан Нептуна', hp: 300, dmg: 8, col: '#38bdf8', riftName: 'КРИО-ВОРОНКА', riftTheme: 'rift-ice', bg: 'radial-gradient(circle at 35% 30%,#7dd3fc 0%,#0284c7 45%,#082f49 85%,#000 100%)', coins: 15, rew: { xp: 500, clk: 5e5, mult: 2, item: 'shard', bst: 'frenzy' }, rewTxt: '+15 Монет Босса · +500 XP · +500K кликов · Осколок' },
  { name: 'Циклон Урана', hp: 500, dmg: 10, col: '#2dd4bf', riftName: 'ИОННЫЙ РАЗЛОМ', riftTheme: 'rift-ion', bg: 'radial-gradient(circle at 35% 30%,#a7f3d0 0%,#0d9488 45%,#042f2e 85%,#000 100%)', coins: 25, rew: { xp: 800, clk: 2e6, mult: 3, item: 'shard', bst: 'surge' }, rewTxt: '+25 Монет Босса · +800 XP · +2M кликов · Осколок' },
  { name: 'Титан Колец Сатурна', hp: 800, dmg: 12, col: '#facc15', riftName: 'ЗОЛОТОЕ КОЛЬЦО', riftTheme: 'rift-gold', bg: 'radial-gradient(circle at 35% 30%,#fef08a 0%,#ca8a04 45%,#451a03 85%,#000 100%)', coins: 40, rew: { xp: 1200, clk: 1e7, mult: 5, item: 'core', bst: 'gold' }, rewTxt: '+40 Монет Босса · +1200 XP · +10M кликов · Ядро' },
  { name: 'Око Бури Юпитера', hp: 1200, dmg: 14, col: '#fb923c', riftName: 'ГРАВИ-СМЕРЧ', riftTheme: 'rift-storm', bg: 'radial-gradient(circle at 35% 30%,#fed7aa 0%,#ea580c 45%,#431407 85%,#000 100%)', coins: 65, rew: { xp: 1800, clk: 5e7, mult: 8, item: 'core', bst: 'novaflask' }, rewTxt: '+65 Монет Босса · +1800 XP · +50M кликов · Ядро' },
  { name: 'Пожиратель Марса', hp: 1800, dmg: 16, col: '#f43f5e', riftName: 'КРОВАВЫЙ ЗЕВ', riftTheme: 'rift-blood', bg: 'radial-gradient(circle at 35% 30%,#fecdd3 0%,#e11d48 45%,#4c0519 85%,#000 100%)', coins: 100, rew: { xp: 2500, clk: 2e8, mult: 12, item: 'prism', bst: 'quasar' }, rewTxt: '+100 Монет Босса · +2500 XP · +200M кликов · Призма' },
  { name: 'Древний Гея-Страж', hp: 2500, dmg: 18, col: '#34d399', riftName: 'ИЗУМРУДНЫЙ ПОРТАЛ', riftTheme: 'rift-bio', bg: 'radial-gradient(circle at 35% 30%,#bbf7d0 0%,#059669 45%,#022c22 85%,#000 100%)', coins: 160, rew: { xp: 3500, clk: 1e9, mult: 18, item: 'prism', bst: 'hyperion' }, rewTxt: '+160 Монет Босса · +3500 XP · +1B кликов · Призма' },
  { name: 'Серный Владыка Венеры', hp: 3500, dmg: 20, col: '#eab308', riftName: 'КИСЛОТНЫЙ ВИХРЬ', riftTheme: 'rift-acid', bg: 'radial-gradient(circle at 35% 30%,#fef9c3 0%,#d97706 45%,#451a03 85%,#000 100%)', coins: 250, rew: { xp: 5000, clk: 5e9, mult: 25, item: 'nova', bst: 'pstorm' }, rewTxt: '+250 Монет Босса · +5000 XP · +5B кликов · Нова' },
  { name: 'Железный Колосс Меркурия', hp: 5000, dmg: 22, col: '#cbd5e1', riftName: 'СТАЛЬНОЙ РАЗРЫВ', riftTheme: 'rift-metal', bg: 'radial-gradient(circle at 35% 30%,#f1f5f9 0%,#64748b 45%,#0f172a 85%,#000 100%)', coins: 400, rew: { xp: 7500, clk: 2e10, mult: 35, item: 'nova', bst: 'chrono' }, rewTxt: '+400 Монет Босса · +7500 XP · +20B кликов · Нова' },
  { name: 'Гелиос-Архидемон Солнца', hp: 7500, dmg: 25, col: '#f97316', riftName: 'ПРОТУБЕРАНЕЦ СВЕРХНОВОЙ', riftTheme: 'rift-sun', bg: 'radial-gradient(circle at 35% 30%,#ffedd5 0%,#ea580c 45%,#7c2d12 85%,#000 100%)', coins: 650, rew: { xp: 12000, clk: 1e11, mult: 50, item: 'void', bst: 'abyss' }, rewTxt: '+650 Монет Босса · +12000 XP · +100B кликов · Пустота' },
  { name: 'Абсолют Сингулярности', hp: 12000, dmg: 30, col: '#c084fc', riftName: 'БЕЗДНА СИНГУЛЯРНОСТИ', riftTheme: 'rift-singularity', bg: 'radial-gradient(circle at 35% 30%,#f3e8ff 0%,#9333ea 45%,#2e1065 85%,#000 100%)', coins: 1200, rew: { xp: 25000, clk: 1e12, mult: 100, item: 'void', bst: 'godtear' }, rewTxt: '+1200 Монет Босса · +25000 XP · +1T кликов · Пустота' }
];

var bossHud = null;
var bossEscapeWrap = null;
function ckEnsureBossHud() {
  if (bossHud) return bossHud;
  bossHud = el('div', 'ck-boss-hud', 'ck-boss-battle-wrap');
  bossHud.style.display = 'none';
  bossHud.innerHTML = '<div class="ck-hp-row"><span style="color:#34d399;">ТВОЕ HP: <b id="ck-php-txt">100/100</b></span><span style="color:#f87171;">БОСС: <b id="ck-bhp-txt">1000/1000</b></span></div>' +
    '<div class="ck-hp-bar"><div id="ck-php-fill" class="ck-hp-fill-player" style="width:100%;"></div></div>' +
    '<div class="ck-hp-bar"><div id="ck-bhp-fill" class="ck-hp-fill-boss" style="width:100%;"></div></div>';

  bossEscapeWrap = el('div', 'ck-boss-escape-wrap', '');
  bossEscapeWrap.style.display = 'none';
  bossEscapeWrap.style.width = '100%';
  bossEscapeWrap.style.textAlign = 'center';
  bossEscapeWrap.innerHTML = '<button id="ck-boss-escape-btn">СБЕЖАТЬ</button>';

  var escBtn = bossEscapeWrap.querySelector('#ck-boss-escape-btn');
  if (escBtn) {
    escBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!ckBossActive) return;
      ckTriggerBossEscape();
    });
  }

  var d = document.getElementById('ck-disc');
  if (d && d.parentNode) {
    d.parentNode.insertBefore(bossHud, d);
    d.parentNode.insertBefore(bossEscapeWrap, d.nextSibling);
  }
  return bossHud;
}

function ckGetMaxPlayerHp() { return 100 + (CK.bHpLv || 0) * 25; }
function ckGetPlayerBossDamage() {
  var baseDmg = 1 + (CK.bDmgLv || 0) * 2;
  var isCrit = Math.random() * 100 < ((CK.bCritLv || 0) * 8);
  return isCrit ? (baseDmg * 3) : baseDmg;
}
function ckGetBossIncomingDamage(rawDmg) {
  var shieldPct = Math.min(75, (CK.bShieldLv || 0) * 8);
  return Math.max(1, Math.round(rawDmg * (1 - shieldPct / 100)));
}

function ckUpdateBossUI() {
  var pTxt = document.getElementById('ck-php-txt');
  var bTxt = document.getElementById('ck-bhp-txt');
  var pFill = document.getElementById('ck-php-fill');
  var bFill = document.getElementById('ck-bhp-fill');
  var maxP = (typeof ckGetMaxPlayerHp === 'function') ? ckGetMaxPlayerHp() : 100;
  if (pTxt) pTxt.textContent = ckPlayerHp + '/' + maxP;
  if (bTxt) bTxt.textContent = ckBossHp + '/' + ckBossMaxHp;
  if (pFill) pFill.style.width = Math.max(0, Math.min(100, (ckPlayerHp / maxP) * 100)) + '%';
  if (bFill) bFill.style.width = Math.max(0, Math.min(100, (ckBossHp / ckBossMaxHp) * 100)) + '%';
}

function ckBossEyeTrack(clientX, clientY) {
  if (!ckBossActive) return;
  var pupils = document.querySelectorAll('#ck-boss-face .ck-boss-pupil');
  if (!pupils || !pupils.length) return;
  pupils.forEach(function (pupil) {
    var eye = pupil.parentElement;
    if (!eye) return;
    var rect = eye.getBoundingClientRect();
    var eyeCenterX = rect.left + rect.width / 2;
    var eyeCenterY = rect.top + rect.height / 2;
    var dx = clientX - eyeCenterX;
    var dy = clientY - eyeCenterY;
    var isLeft = eye.classList.contains('left');
    var tilt = (isLeft ? 15 : -15) * (Math.PI / 180);
    var rotDx = dx * Math.cos(-tilt) - dy * Math.sin(-tilt);
    var rotDy = dx * Math.sin(-tilt) + dy * Math.cos(-tilt);
    var angle = Math.atan2(rotDy, rotDx);
    var dist = Math.min(11, Math.hypot(rotDx, rotDy) * 0.065);
    var moveX = Math.cos(angle) * dist;
    var moveY = Math.sin(angle) * dist * 0.55;
    pupil.style.transform = 'translate(' + moveX.toFixed(1) + 'px,' + moveY.toFixed(1) + 'px)';
  });
}

window.addEventListener('mousemove', function (e) {
  if (ckBossActive) ckBossEyeTrack(e.clientX, e.clientY);
}, { passive: true });

window.addEventListener('touchmove', function (e) {
  if (ckBossActive && e.touches && e.touches[0]) {
    ckBossEyeTrack(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: true });

window.addEventListener('touchstart', function (e) {
  if (ckBossActive && e.touches && e.touches[0]) {
    ckBossEyeTrack(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: true });

function ckSpawnBossExplosion(isVictory, onComplete) {
  var d = document.getElementById('ck-disc');
  if (!d) {
    if (onComplete) onComplete();
    return;
  }
  var stg = (typeof ckStage === 'function') ? ckStage() : 0;
  var bConf = CK_BOSSES[stg] || CK_BOSSES[0];
  var oldFace = document.getElementById('ck-boss-face');
  if (oldFace) oldFace.style.display = 'none';
  d.style.setProperty('background', 'transparent', 'important');
  d.style.setProperty('box-shadow', 'none', 'important');
  d.style.setProperty('border-color', 'transparent', 'important');
  discName.innerHTML = '';
  var bh = document.createElement('div');
  bh.className = 'ck-blackhole-rift ' + (bConf.riftTheme || 'rift-singularity');
  bh.innerHTML = '<div class="ck-bh-halo"></div><div class="ck-bh-accretion"></div><div class="ck-bh-core-black"></div>';
  d.appendChild(bh);
  var types = ['debris-fang', 'debris-crystal', 'debris-magma', 'debris-horn'];
  var debrisCount = 48;
  for (var i = 0; i < debrisCount; i++) {
    var deb = document.createElement('div');
    var tClass = types[i % types.length];
    deb.className = 'ck-debris-item ' + tClass;
    deb.style.left = (d.offsetWidth / 2) + 'px';
    deb.style.top = (d.offsetHeight / 2) + 'px';
    if (tClass === 'debris-magma' || tClass === 'debris-crystal') {
      deb.style.background = 'radial-gradient(circle,#ffffff,' + bConf.col + ' 70%,#000)';
      deb.style.boxShadow = '0 0 14px ' + bConf.col;
    }
    var burstAngle = (Math.PI * 2 / debrisCount) * i + (Math.random() * 0.4 - 0.2);
    var burstDist = 70 + Math.random() * 110;
    var bx = Math.cos(burstAngle) * burstDist;
    var by = Math.sin(burstAngle) * burstDist;
    var rot = (Math.random() * 720 - 360).toFixed(0) + 'deg';
    deb.style.setProperty('--bx', bx.toFixed(1) + 'px');
    deb.style.setProperty('--by', by.toFixed(1) + 'px');
    deb.style.setProperty('--br', rot);
    d.appendChild(deb);
  }
  setTimeout(function() {
    document.querySelectorAll('.ck-blackhole-rift, .ck-debris-item').forEach(function(el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    d.style.removeProperty('background');
    d.style.removeProperty('box-shadow');
    d.style.removeProperty('border-color');
    if (onComplete) onComplete();
  }, 1550);
}

function ckTriggerBossEscape() {
  if (!ckBossActive) return;
  var stg = (typeof ckStage === 'function') ? ckStage() : 0;
  var bConf = (typeof CK_BOSSES !== 'undefined' && CK_BOSSES[stg]) ? CK_BOSSES[stg] : { name: 'БОСС', riftName: 'РАЗЛОМ' };
  ckBossActive = false;
  if (ckBossAttackTimer) clearInterval(ckBossAttackTimer);
  sfxRebirth();
  ckToast('ТЫ СБЕЖАЛ! ' + bConf.name.toUpperCase() + ' ЗАТЯНУТ В ' + bConf.riftName + '!');
  ckSpawnBossExplosion(false, function() {
    ckEndBossBattleCleanup(false);
  });
}

cssAdd('#ck-boss-shop-btn{position:relative;overflow:hidden;width:100%;max-width:320px;margin:6px auto 0;padding:10px 20px;border-radius:12px;border:1px solid rgba(192,132,252,0.55);background:linear-gradient(135deg,#1f0a2e 0%,#4c1d95 38%,#b91c1c 75%,#200407 100%);color:#f8fafc;font-family:inherit;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;display:block;box-shadow:0 6px 20px rgba(0,0,0,0.6),0 0 22px rgba(147,51,234,0.4),inset 0 1px 0 rgba(255,255,255,0.45);transition:all .22s cubic-bezier(0.16,1,0.3,1);outline:none;text-shadow:0 1px 4px rgba(0,0,0,0.8);}');
cssAdd('#ck-boss-shop-btn::before{content:"";position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);transform:skewX(-25deg);animation:ckBossShopShimmer 3.2s infinite;}');
cssAdd('@keyframes ckBossShopShimmer{0%,65%{left:-100%;}100%{left:220%;}}');
cssAdd('#ck-boss-shop-btn:hover{transform:translateY(-2px);border-color:#f472b6;filter:brightness(1.18);box-shadow:0 10px 28px rgba(0,0,0,0.7),0 0 32px rgba(236,72,153,0.65),inset 0 1px 0 #fff;}');
cssAdd('#ck-boss-shop-btn:active{transform:scale(0.97);}');
cssAdd('#ck-boss-shop-modal{position:fixed;inset:0;z-index:99999;background:rgba(2,2,14,.92);display:flex;align-items:center;justify-content:center;font-family:Courier New,monospace;}');
cssAdd('#ck-boss-shop-box{width:min(660px,95vw);max-height:88vh;overflow-y:auto;background:linear-gradient(175deg,#12081f,#090312);border:2px solid #a855f7;border-radius:20px;padding:22px;color:#fff;box-sizing:border-box;box-shadow:0 30px 95px rgba(0,0,0,.9),0 0 45px rgba(168,85,247,.35);}');
cssAdd('#ck-boss-shop-box h2{margin:0 0 12px;text-align:center;letter-spacing:2px;font-size:20px;font-weight:bold;color:#fde047;}');
cssAdd('.ck-bshop-wallet{background:rgba(30,12,50,.6);border:1px solid #7c3aed;border-radius:12px;padding:10px 16px;text-align:center;font-size:13px;font-weight:bold;color:#dfe6ff;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:8px;}');
cssAdd('.ck-bshop-wallet b{color:#ffd76a;font-size:16px;}');
cssAdd('.ck-bshop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:14px;}');
cssAdd('.ck-bshop-card{background:#111634;border:1px solid rgba(168,85,247,.4);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;transition:all .18s;}');
cssAdd('.ck-bshop-card:hover{border-color:#e879f9;box-shadow:0 6px 20px rgba(168,85,247,.3);transform:translateY(-2px);}');
cssAdd('.ck-bshop-title{font-size:13px;font-weight:bold;color:#ffd76a;letter-spacing:.8px;text-transform:uppercase;}');
cssAdd('.ck-bshop-desc{font-size:11.5px;color:#cbd5e1;line-height:1.4;}');
cssAdd('.ck-bshop-stat{font-size:11.5px;color:#93c5fd;font-weight:bold;}');
cssAdd('.ck-bshop-btn{background:linear-gradient(135deg,#ec4899,#8b5cf6);border:none;border-radius:9px;padding:9px 12px;font-weight:bold;font-size:12px;color:#fff;cursor:pointer;font-family:inherit;letter-spacing:.6px;transition:all .16s;}');
cssAdd('.ck-bshop-btn:hover:not(:disabled){filter:brightness(1.15);transform:scale(1.02);box-shadow:0 0 16px rgba(236,72,153,.5);}');
cssAdd('.ck-bshop-btn:disabled{opacity:.4;cursor:default;filter:grayscale(1);}');
cssAdd('#ck-close-bshop{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');

var bossShopModal = el('div', 'ck-boss-shop-modal', 'clicker-ui hidden');
var bShopBox = el('div', 'ck-boss-shop-box');
bShopBox.appendChild(el('h2', '', '', 'МАГАЗИН БОССОВ'));
var bWallet = el('div', 'ck-bshop-wallet');
bShopBox.appendChild(bWallet);
var bShopGrid = el('div', 'ck-bshop-grid');
bShopBox.appendChild(bShopGrid);
var bShopClose = el('button', 'ck-close-bshop', '', 'ЗАКРЫТЬ');
bShopBox.appendChild(bShopClose);
bossShopModal.appendChild(bShopBox);
document.body.appendChild(bossShopModal);

var BSHOP_ITEMS = [
  { id: 'hp', name: 'Титаническая Стойкость', desc: '+25 к максимальному HP в битве с боссами', baseCost: 30, scale: 1.45, key: 'bHpLv', getStat: function(l){ return 'HP: ' + (100 + l * 25); } },
  { id: 'dmg', name: 'Рассекающий Клинок', desc: '+2 урона за каждый клик по боссу', baseCost: 40, scale: 1.5, key: 'bDmgLv', getStat: function(l){ return 'Урон за клик: ' + (1 + l * 2); } },
  { id: 'shield', name: 'Силовой Щит Бездны', desc: '-8% входящего урона от боссов (макс 75%)', baseCost: 50, scale: 1.55, key: 'bShieldLv', max: 9, getStat: function(l){ return 'Защита: -' + Math.min(75, l * 8) + '% урона'; } },
  { id: 'vamp', name: 'Вампирический Захват', desc: 'Восстанавливает +1 HP за каждый удар по боссу', baseCost: 60, scale: 1.6, key: 'bVampLv', max: 5, getStat: function(l){ return 'Вампиризм: +' + l + ' HP/удар'; } },
  { id: 'crit', name: 'Фатальный Сокрушитель', desc: '+8% шанс нанести тройной урон (x3) по боссу', baseCost: 75, scale: 1.65, key: 'bCritLv', max: 8, getStat: function(l){ return 'Крит шанс: ' + (l * 8) + '% (x3 урон)'; } }
];

function ckBossShopCost(item) {
  var curLv = Number(CK[item.key]) || 0;
  return Math.ceil(item.baseCost * Math.pow(item.scale, curLv));
}

function ckRenderBossShop() {
  bWallet.innerHTML = 'Твои Монеты Боссов: <b>' + (CK.bossCoins || 0) + '</b>';
  bShopGrid.innerHTML = '';
  BSHOP_ITEMS.forEach(function(item) {
    var curLv = Number(CK[item.key]) || 0;
    var cost = ckBossShopCost(item);
    var isMax = item.max && curLv >= item.max;
    var canBuy = !isMax && (CK.bossCoins || 0) >= cost;
    var card = el('div', '', 'ck-bshop-card');
    card.innerHTML = '<div class="ck-bshop-title">' + item.name + '</div>' +
      '<div class="ck-bshop-desc">' + item.desc + '</div>' +
      '<div class="ck-bshop-stat">' + item.getStat(curLv) + ' (ур. ' + curLv + (item.max ? ('/' + item.max) : '') + ')</div>' +
      '<button class="ck-bshop-btn" ' + (canBuy ? '' : 'disabled') + '>' + (isMax ? 'МАКСИМУМ' : ('КУПИТЬ ЗА ' + cost + ' МОНЕТ')) + '</button>';
    var btn = card.querySelector('button');
    if (btn && !isMax) {
      btn.addEventListener('click', function() {
        var curCost = ckBossShopCost(item);
        if ((CK.bossCoins || 0) < curCost) return;
        CK.bossCoins -= curCost;
        CK[item.key] = (Number(CK[item.key]) || 0) + 1;
        sfxBuy();
        ckSave();
        ckToast('УЛУЧШЕНО: ' + item.name + '!');
        ckRenderBossShop();
      });
    }
    bShopGrid.appendChild(card);
  });
}

function ckOpenBossShopModal() {
  var m = document.getElementById('ck-boss-shop-modal');
  if (m) {
    m.classList.remove('hidden');
    ckRenderBossShop();
  }
}

function ckCloseBossShopModal() {
  var m = document.getElementById('ck-boss-shop-modal');
  if (m) m.classList.add('hidden');
}

if (typeof bossShopBtn !== 'undefined' && bossShopBtn) bossShopBtn.addEventListener('click', ckOpenBossShopModal);
bShopClose.addEventListener('click', ckCloseBossShopModal);
bossShopModal.addEventListener('click', function(e) {
  if (e.target === bossShopModal) ckCloseBossShopModal();
});

document.addEventListener('click', function(e) {
  var t = e.target;
  if (t && (t.id === 'ck-boss-shop-btn' || t.closest('#ck-boss-shop-btn'))) {
    e.stopPropagation();
    ckOpenBossShopModal();
  }
});

function ckEndBossBattleCleanup(victory) {
  var hud = ckEnsureBossHud();
  if (hud) hud.style.display = 'none';
  if (bossEscapeWrap) bossEscapeWrap.style.display = 'none';
  disc.classList.remove('ck-boss-disc');
  var oldFace = document.getElementById('ck-boss-face');
  if (oldFace && oldFace.parentNode) oldFace.parentNode.removeChild(oldFace);
  ckClicksUntilBoss = 10000;
  render(true);
}

function ckEndBossBattle(victory) {
  ckBossActive = false;
  if (ckBossAttackTimer) clearInterval(ckBossAttackTimer);
  var stg = (typeof ckStage === 'function') ? ckStage() : 0;
  var bConf = CK_BOSSES[stg] || CK_BOSSES[0];
  if (victory) {
    sfxRebirth();
    ckSpawnBossExplosion(true, function() {
      var rw = bConf.rew;
      ckAddAccXp(rw.xp || 500);
      if (rw.clk) CK.clicks = (CK.clicks || 0) + rw.clk;
      if (rw.mult) CK.mult = (CK.mult || 1) + rw.mult;
      if (rw.item && CK.inv && CK.inv.length < 2000) CK.inv.push(rw.item);
      if (rw.bst) ckBoostGrant(rw.bst, 600);
      ckSave();
      ckToast('ПОБЕДА НАД ' + bConf.name.toUpperCase() + '! НАГРАДА: ' + bConf.rewTxt);
      ckEndBossBattleCleanup(true);
    });
  } else {
    ckToast('ТЫ ПРОИГРАЛ БОССУ! ВОССТАНОВЛЕНИЕ...');
    ckEndBossBattleCleanup(false);
  }
}

function ckStartBossBattle() {
  var stg = (typeof ckStage === 'function') ? ckStage() : 0;
  var bConf = CK_BOSSES[stg] || CK_BOSSES[0];
  var accLvl = (typeof ckGetAccLevelData === 'function') ? ckGetAccLevelData().level : 1;
  var calcHp = bConf.hp;
  if (accLvl >= 25) {
    var bonusMult = 1 + (accLvl - 24) * 0.25;
    calcHp = Math.round(bConf.hp * bonusMult);
  }
  ckBossActive = true;
  ckPlayerHp = 100;
  ckBossHp = calcHp;
  ckBossMaxHp = calcHp;
  var hud = ckEnsureBossHud();
  if (hud) hud.style.display = 'flex';
  if (bossEscapeWrap) bossEscapeWrap.style.display = 'block';
  disc.classList.add('ck-boss-disc');
  disc.style.setProperty('background', bConf.bg, 'important');
  disc.style.setProperty('border-color', bConf.col, 'important');
  disc.style.setProperty('box-shadow', '0 0 75px ' + bConf.col + ', inset -18px -24px 60px #000', 'important');
  ckUpdateBossUI();

  var oldFace = document.getElementById('ck-boss-face');
  if (oldFace && oldFace.parentNode) oldFace.parentNode.removeChild(oldFace);
  var face = document.createElement('div');
  face.id = 'ck-boss-face';
  face.className = 'ck-boss-face';
  face.innerHTML = '<div class="ck-boss-corona" style="background:radial-gradient(circle,' + bConf.col + ' 30%,transparent 75%)"></div>' +
    '<div class="ck-boss-horns-outer"><div class="ck-boss-horn-lg left"></div><div class="ck-boss-horn-lg right"></div></div>' +
    '<div class="ck-boss-horns-inner"><div class="ck-boss-horn-sm left"></div><div class="ck-boss-horn-sm right"></div></div>' +
    '<div class="ck-boss-crown"></div>' +
    '<div class="ck-boss-rune" style="box-shadow:0 0 25px ' + bConf.col + '"></div>' +
    '<div class="ck-boss-brows"><div class="ck-boss-brow left"></div><div class="ck-boss-brow right"></div></div>' +
    '<div class="ck-boss-eyes">' +
      '<div class="ck-boss-eye left"><div class="ck-boss-pupil"></div><div class="ck-boss-eye-glow" style="background:radial-gradient(ellipse at center,' + bConf.col + ',transparent 70%)"></div></div>' +
      '<div class="ck-boss-eye right"><div class="ck-boss-pupil"></div><div class="ck-boss-eye-glow" style="background:radial-gradient(ellipse at center,' + bConf.col + ',transparent 70%)"></div></div>' +
    '</div>' +
    '<div class="ck-boss-cracks"></div>' +
    '<div class="ck-boss-mouth">' +
      '<div class="ck-boss-teeth-top">' +
        '<div class="ck-boss-fang"></div><div class="ck-boss-fang lg"></div><div class="ck-boss-fang"></div><div class="ck-boss-fang"></div><div class="ck-boss-fang lg"></div><div class="ck-boss-fang"></div>' +
      '</div>' +
      '<div class="ck-boss-lava-tongue"></div>' +
      '<div class="ck-boss-teeth-bot">' +
        '<div class="ck-boss-fang up"></div><div class="ck-boss-fang up lg"></div><div class="ck-boss-fang up"></div><div class="ck-boss-fang up"></div><div class="ck-boss-fang up lg"></div><div class="ck-boss-fang up"></div>' +
      '</div>' +
    '</div>';
  disc.appendChild(face);

  discName.innerHTML = '';
  ckToast('ПОЯВИЛСЯ БОСС: ' + bConf.name.toUpperCase() + ' (' + bConf.hp + ' HP)!');
  sfxRebirth();

  if (ckBossAttackTimer) clearInterval(ckBossAttackTimer);
  ckBossAttackTimer = setInterval(function () {
    if (!ckBossActive) { clearInterval(ckBossAttackTimer); return; }
    var dmg = bConf.dmg || 10;
    ckPlayerHp = Math.max(0, ckPlayerHp - dmg);
    ckUpdateBossUI();
    var ov = document.getElementById('clicker-overlay');
    if (ov && ov.animate) ov.animate([{ boxShadow: 'inset 0 0 90px ' + bConf.col }, { boxShadow: 'inset 0 0 0px transparent' }], { duration: 400 });
    if (ckPlayerHp <= 0) {
      ckEndBossBattle(false);
    }
  }, 4500);
}

var floatCount = 0;
disc.addEventListener('click', function (ev) {
  if (ckBossActive) {
    var pDmg = (typeof ckGetPlayerBossDamage === 'function') ? ckGetPlayerBossDamage() : 1;
    ckBossHp = Math.max(0, ckBossHp - pDmg);
    if (CK.bVampLv && CK.bVampLv > 0) {
      var maxHpCap = ckGetMaxPlayerHp();
      ckPlayerHp = Math.min(maxHpCap, ckPlayerHp + CK.bVampLv);
    }
    ckUpdateBossUI();
    sfxClick();
    disc.classList.remove('ck-boss-hit');
    void disc.offsetWidth;
    disc.classList.add('ck-boss-hit');

    var dEl = el('div', '', 'ck-float-dmg', '-' + pDmg + ' HP');
    dEl.style.left = (ev.clientX - 16) + 'px';
    dEl.style.top = (ev.clientY - 30) + 'px';
    overlay.appendChild(dEl);
    setTimeout(function () { if (dEl.parentNode) dEl.parentNode.removeChild(dEl); }, 650);

    if (ckBossHp <= 0) {
      ckEndBossBattle(true);
    }
    return;
  }

  ckClicksUntilBoss--;
  if (ckClicksUntilBoss <= 0) {
    ckClicksUntilBoss = 10000;
    var curAccLvl = (typeof ckGetAccLevelData === 'function') ? ckGetAccLevelData().level : 1;
    if (curAccLvl >= 10 && Math.random() < 0.10) {
      ckStartBossBattle();
      return;
    }
  }

  var gain = ckPower();
  var isCrit = Math.random() * 100 < ckCrit();
  if (isCrit) gain *= ckCritMul();
  CK.clicks += gain;
  ckAddAccXp(isCrit ? 3 : 1);
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
  if (CK_UI && CK_UI.low) return;
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
  ckAddAccXp(5);
  sfxBuy();
  ckSave();
  render(true);
});
function ckRequestMobilePortraitFullscreen() {
  try {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window) || (window.innerWidth <= 820);
    var isPortrait = window.innerHeight > window.innerWidth;
    if (isMobile && isPortrait && !document.fullscreenElement && !document.webkitFullscreenElement) {
      var el = document.documentElement;
      if (el.requestFullscreen) { el.requestFullscreen().catch(function(){}); }
      else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
    }
  } catch (e) {}
}

openBtn.addEventListener('click', function () {
  ckRequestMobilePortraitFullscreen();
  overlay.classList.remove('hidden');
  var ob = document.getElementById('clicker-open-btn'); if (ob) ob.style.display = 'none';
  var hb = document.getElementById('help-book-btn'); if (hb) hb.style.display = 'none';
  var hp = document.getElementById('help-panel'); if (hp) hp.classList.add('hidden');
  window.__uiPaused = true;
  render(true);
  ckSave();
  ckMusicPlay();
  ckBoostRender();
});

window.addEventListener('touchstart', function () {
  if (overlay && !overlay.classList.contains('hidden')) {
    ckRequestMobilePortraitFullscreen();
  }
}, { passive: true, once: false });
closeBtn.addEventListener('click', function () {
  overlay.classList.add('hidden');
  shop.classList.add('hidden');
  var ob = document.getElementById('clicker-open-btn'); if (ob) ob.style.display = 'block';
  var hb = document.getElementById('help-book-btn'); if (hb) hb.style.display = 'block';
  window.__uiPaused = false;
  ckMusicPause();
});
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
  CK.mult += 2;
  CK.rebirths++;
  ckAddAccXp(250);
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
  if (CK_UI && CK_UI.low && window.__uiPaused) {
    setTimeout(loop, 250);
    return;
  }
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

cssAdd('.t2-theme.t2pn{background:linear-gradient(160deg,rgba(8,4,18,.94),rgba(4,2,12,.95)) !important;border-color:#ff2d95 !important;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 90px #ff2d9526 !important;}');
cssAdd('.t2-theme.t2pn #clicker-right{background:rgba(10,4,18,.88) !important;}');
cssAdd('.t2-theme.t2pn .ck-up{background:rgba(20,8,24,.92) !important;border-color:#ff2d9544 !important;color:#f5e6d8 !important;}');
cssAdd('.t2-theme.t2pn .ck-up.can{border-color:#ff2d95 !important;box-shadow:0 0 12px #ff2d9526 !important;}');
cssAdd('.t2-theme.t2pn .ck-tab{background:rgba(16,6,26,.92) !important;border-color:#ff2d9555 !important;color:#ff71c4 !important;}');
cssAdd('.t2-theme.t2pn .ck-tab.on{background:linear-gradient(135deg,#ff2d95,#c9186b) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2pn .ck-actions button{background:linear-gradient(135deg,rgba(14,4,24,.95),rgba(24,8,40,.95)) !important;border:1px solid #ff2d95 !important;box-shadow:0 0 14px rgba(255,45,149,.35),inset 0 0 12px rgba(0,0,0,.4) !important;}');
cssAdd('.t2-theme.t2pn .ck-actions button::after{content:"";position:absolute;top:-20%;left:-35%;width:28%;height:140%;background:linear-gradient(105deg,transparent,#ff71c4,rgba(255,233,214,.95),#ff71c4,transparent);transform:skewX(-20deg);animation:ckNeonP 1.7s linear infinite;pointer-events:none;filter:drop-shadow(0 0 6px #ff2d95);}');
cssAdd('@keyframes ckNeonP{0%{left:-35%}100%{left:115%}}');
cssAdd('.t2-theme.t2pn .ck-actions button:nth-child(2)::after{animation-delay:.25s;}');
cssAdd('.t2-theme.t2pn .ck-actions button:nth-child(3)::after{animation-delay:.5s;}');
cssAdd('.t2-theme.t2pn .ck-actions button:nth-child(4)::after{animation-delay:.75s;}');
cssAdd('.t2-theme.t2pn .ck-actions button:nth-child(5)::after{animation-delay:1s;}');
cssAdd('.t2-theme.t2pn .ck-actions button:nth-child(6)::after{animation-delay:1.25s;}');


cssAdd('.t2-theme.t2cv{background:linear-gradient(160deg,rgba(4,10,18,.94),rgba(2,6,12,.95)) !important;border-color:#00d4ff !important;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 90px #00d4ff26 !important;}');
cssAdd('.t2-theme.t2cv #clicker-right{background:rgba(4,10,20,.88) !important;}');
cssAdd('.t2-theme.t2cv .ck-up{background:rgba(6,16,28,.92) !important;border-color:#00d4ff44 !important;color:#e2f6ff !important;}');
cssAdd('.t2-theme.t2cv .ck-up.can{border-color:#00d4ff !important;box-shadow:0 0 12px #00d4ff26 !important;}');
cssAdd('.t2-theme.t2cv .ck-tab{background:rgba(6,16,28,.92) !important;border-color:#00d4ff55 !important;color:#67e8f9 !important;}');
cssAdd('.t2-theme.t2cv .ck-tab.on{background:linear-gradient(135deg,#00d4ff,#0891b2) !important;color:#fff !important;}');
cssAdd('.t2-theme.t2cv .ck-actions button{background:linear-gradient(135deg,rgba(4,12,24,.95),rgba(8,20,40,.95)) !important;border:1px solid #00d4ff !important;box-shadow:0 0 14px rgba(0,212,255,.35),inset 0 0 12px rgba(0,0,0,.4) !important;}');
cssAdd('.t2-theme.t2cv .ck-actions button::after{content:"";position:absolute;top:-20%;left:-35%;width:28%;height:140%;background:linear-gradient(105deg,transparent,#67e8f9,rgba(255,255,255,.9),#67e8f9,transparent);transform:skewX(-20deg);animation:ckNeonC 1.7s linear infinite;pointer-events:none;filter:drop-shadow(0 0 6px #00d4ff);}');
cssAdd('@keyframes ckNeonC{0%{left:-35%}100%{left:115%}}');
cssAdd('.t2-theme.t2cv .ck-actions button:nth-child(2)::after{animation-delay:.25s;}');
cssAdd('.t2-theme.t2cv .ck-actions button:nth-child(3)::after{animation-delay:.5s;}');
cssAdd('.t2-theme.t2cv .ck-actions button:nth-child(4)::after{animation-delay:.75s;}');
cssAdd('.t2-theme.t2cv .ck-actions button:nth-child(5)::after{animation-delay:1s;}');
cssAdd('.t2-theme.t2cv .ck-actions button:nth-child(6)::after{animation-delay:1.25s;}');
cssAdd('.t2-theme.t2cv .ck-apbtn{background:rgba(6,16,28,.92) !important;border-color:#00d4ff44 !important;color:#67e8f9 !important;}');
cssAdd('.t2-theme.t2cv .ck-apbtn.on{background:linear-gradient(135deg,#00d4ff,#0891b2) !important;color:#fff !important;box-shadow:0 0 14px #00d4ff26 !important;}');
cssAdd('.t2-theme.t2cv #ck-player{background:linear-gradient(135deg,rgba(4,12,24,.96),rgba(2,8,16,.96)) !important;border-color:#00d4ff77 !important;box-shadow:0 0 24px #00d4ff26 !important;}');
cssAdd('.t2-theme.t2cv .ck-hangs{--hcol:#67e8f9 !important;}');
cssAdd('.t2-theme.t2cv .ck-eq i,.t2-theme.t2cv .ck-wave i{background:linear-gradient(180deg,#fff,#00d4ff) !important;box-shadow:0 0 6px #00d4ff !important;}');
cssAdd('.t2-theme.t2cv #ck-stats{background:rgba(4,12,24,.9) !important;border-color:#00d4ff55 !important;color:#e2f6ff !important;}');
cssAdd('.t2-theme.t2cv #ck-stats b{color:#fff !important;text-shadow:0 0 12px #00d4ff !important;}');
cssAdd('.t2-theme.t2cv .ck-mbtn{background:linear-gradient(145deg,#0a1a20,#041018) !important;color:#67e8f9 !important;border-color:#00d4ff66 !important;}');
cssAdd('.t2-theme.t2cv .ck-up button{background:linear-gradient(135deg,#00d4ff,#0891b2) !important;box-shadow:0 0 8px rgba(0,212,255,.4) !important;}');
cssAdd('.t2-theme.t2cv #ck-rebirth{background:linear-gradient(135deg,#00d4ff,#0891b2) !important;animation:ckNeonGlowC 2s ease infinite !important;}');
cssAdd('@keyframes ckNeonGlowC{0%,100%{box-shadow:0 0 10px rgba(0,212,255,.4)}50%{box-shadow:0 0 26px rgba(0,212,255,.7)}}');

cssAdd('.t2-theme.t2pn .ck-actions button,.t2-theme.t2pn .ck-tab,.t2-theme.t2pn .ck-apbtn,.t2-theme.t2pn .ck-up button,.t2-theme.t2pn #ck-rebirth,.t2-theme.t2pn #ck-megareb,.t2-theme.t2pn #ck-superreb,.t2-theme.t2pn #ck-closebtn{background:linear-gradient(135deg,#ff2d95,#ff71c4 35%,#ffd9ec 50%,#ff71c4 65%,#ff2d95) !important;background-size:300% 300% !important;animation:ckPnFlow 2.2s ease infinite !important;}');
cssAdd('@keyframes ckPnFlow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
var panelEl = document.getElementById('clicker-panel');
['o1', 'o2', 'o3'].forEach(function (c) { panelEl.appendChild(el('div', '', 'ck-orb ' + c)); });
// sparks removed for performance
function ckEnsureHelpBtn() {
  var hb = document.getElementById('help-book-btn');
  var hp = document.getElementById('help-panel');
  if (!hb && document.body) {
    hb = el('button', 'help-book-btn', '');
    hb.innerHTML = "<svg viewBox='0 0 24 24' width='28' height='28' fill='none' stroke='#ffe9a8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20'></path><path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'></path><path d='M9 7h7M9 11h5'></path></svg>";
    hb.style.zIndex = '99999';
    document.body.appendChild(hb);
  }
  if (!hp && document.body) {
    hp = el('div', 'help-panel', 'hidden');
    var hpMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    hp.innerHTML = '<h3>УПРАВЛЕНИЕ</h3>'
      + (hpMobile
        ? '<div class=hp-sec><b>ТЕЛЕФОН</b><br>Вращение камеры - палец<br>Полёт - удержание пальцем<br>События - тап по объекту<br>Лазер - красная кнопка слева</div>'
        : '<div class=hp-sec><b>КОМПЬЮТЕР</b><br>Вращение камеры - мышь (ЛКМ)<br>Полёт - зажать ЛКМ или колесо<br>События - клик по объекту<br>Лазер - ПКМ (если куплен)</div>');
    hp.style.zIndex = '99999';
    document.body.appendChild(hp);
  }
  return { hb: hb, hp: hp };
}
var helpInit = ckEnsureHelpBtn();
var helpBtn = helpInit.hb;
var helpPanel = helpInit.hp;
setInterval(ckEnsureHelpBtn, 1000);
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
  + '@keyframes hpIn{from{transform:translateY(14px) scale(.95);opacity:0}}'
  + '.ck-alt-design{background:#090d16!important;border:1px solid #1e293b!important;box-shadow:0 10px 40px rgba(0,0,0,0.8)!important;font-family:Inter,Segoe UI,-apple-system,sans-serif!important;}'
  + '.ck-alt-design *{border-radius:6px!important;text-shadow:none!important;}'
  + '.ck-alt-design #clicker-right{background:#060911!important;border-left:1px solid #1e293b!important;}'
  + '.ck-alt-design #clicker-right h3{color:#94a3b8!important;border-bottom:1px solid #1e293b!important;font-size:12px!important;letter-spacing:1px!important;}'
  + '.ck-alt-design .ck-up{background:#0d1527!important;border:1px solid #1e293b!important;color:#cbd5e1!important;}'
  + '.ck-alt-design .ck-up b{color:#f1f5f9!important;}'
  + '.ck-alt-design .ck-up button{background:#2563eb!important;box-shadow:none!important;color:#fff!important;border:none!important;}'
  + '.ck-alt-design .ck-up.can button{background:#059669!important;}'
  + '.ck-alt-design .ck-tab{background:#0d1527!important;border:1px solid #1e293b!important;color:#94a3b8!important;}'
  + '.ck-alt-design .ck-tab.on{background:#2563eb!important;color:#fff!important;border-color:#3b82f6!important;}'
  + '.ck-alt-design .ck-apbtn{background:#0d1527!important;border:1px solid #1e293b!important;color:#94a3b8!important;animation:none!important;}'
  + '.ck-alt-design .ck-apbtn.on{background:#059669!important;color:#fff!important;border-color:#10b981!important;}'
  + '.ck-alt-design .ck-actions button{background:#1e293b!important;border:1px solid #334155!important;color:#f8fafc!important;box-shadow:none!important;animation:none!important;}'
  + '.ck-alt-design .ck-actions button:hover{background:#334155!important;}'
  + '.ck-alt-design #ck-prbar{background:#060911!important;border:1px solid #1e293b!important;height:10px!important;}'
  + '.ck-alt-design #ck-prfill{background:#3b82f6!important;}'
  + '.ck-alt-design #ck-stats{background:#0d1527!important;border:1px solid #1e293b!important;color:#94a3b8!important;}'
  + '.ck-alt-design #ck-stats b{color:#f8fafc!important;}'
  + '.ck-alt-design #ck-player{background:#0d1527!important;border:1px solid #1e293b!important;box-shadow:none!important;}'
  + '.ck-alt-design .ck-mbtn{background:#1e293b!important;border:1px solid #334155!important;color:#f8fafc!important;}';
document.head.appendChild(hstyle);
})();