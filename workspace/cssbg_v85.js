var fs = require('fs');
var Q = String.fromCharCode(39);
var NL = String.fromCharCode(10);
var B = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/';
var log = [];
function rep(s, name, from, to) {
  if (s.indexOf(to) !== -1) { log.push(name + ': ALREADY'); return s; }
  if (s.indexOf(from) === -1) { log.push(name + ': MISS'); return s; }
  log.push(name + ': ok');
  return s.split(from).join(to);
}
var cf = B + 'clicker.js';
var c = fs.readFileSync(cf, 'utf8');
var SCENES = {
  1: ['#e8f0ff', '#c5d5f5', '#a8bce8'],
  2: ['#d5d8e0', '#b8bec9', '#98a0b0'],
  3: ['#ffe0f0', '#ffb3d9', '#e88ab8'],
  4: ['#fff8d6', '#ffe8a0', '#f0d878'],
  5: ['#d6f0ff', '#a0d8f5', '#78b8e8'],
  6: ['#ffe8c8', '#f5c896', '#e0a860'],
  7: ['#e8d6ff', '#c8a8f5', '#a880e0'],
  8: ['#d0f5ff', '#88e0f5', '#58c0e0'],
  9: ['#ffd6f0', '#ff8ad0', '#e058b0'],
  10: ['#d0f8ff', '#78e0f8', '#40c0e0']
};
var sceneMap = 'var T2SCENE = {';
var first = true;
for (var k in SCENES) {
  if (!first) sceneMap += ',';
  first = false;
  sceneMap += k + ':[' + Q + SCENES[k][0] + Q + ',' + Q + SCENES[k][1] + Q + ',' + Q + SCENES[k][2] + Q + ']';
}
sceneMap += '};';
c = rep(c, 't2files-null', "var T2FILES = ['', 'back1.mp4'", "var T2FILES = ['NULL'");
c = rep(c, 'scene-map', 'function ckT2Apply() {', sceneMap + NL + 'function ckT2Apply() {');
c = rep(c, 'bgvid-off', 'if (CK_UI.t2 && left0) {', 'if (CK_UI.t2 && left0 && false) {');
var sceneApply = NL + 'if (CK_UI.t2 && T2SCENE[CK_UI.t2]) { var sc = T2SCENE[CK_UI.t2]; var lg = left0.querySelector(' + Q + '.ck-cssbg' + Q + '); if (!lg) { lg = document.createElement(' + Q + 'div' + Q + '); lg.className = ' + Q + 'ck-cssbg' + Q + '; left0.insertBefore(lg, left0.firstChild); } lg.style.background = ' + Q + 'linear-gradient(160deg,' + Q + '+sc[0]+' + Q + ',' + Q + '+sc[1]+' + Q + ' 50%,' + Q + '+sc[2]+' + Q + ')' + Q + '; lg.style.animation = ' + Q + 'ckBgDrift 8s ease-in-out infinite alternate' + Q + '; } else { var old = left0.querySelector(' + Q + '.ck-cssbg' + Q + '); if (old) old.parentNode.removeChild(old); }';
c = rep(c, 'scene-apply', 'ckT2Apply();' + NL + '}', sceneApply + NL + 'ckT2Apply();' + NL + '}');
c = rep(c, 'low-media-off', 'var tm = (CK_UI && CK_UI.low)?null:TMEDIA[ckTrack];', 'var tm = (CK_UI && (CK_UI.low || CK_UI.t2 > 0))?null:TMEDIA[ckTrack];');
var cssInj = NL + 'cssAdd(' + Q + '.ck-cssbg{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;opacity:.75;pointer-events:none;animation:ckBgDrift 8s ease-in-out infinite alternate;}' + Q + ');' + NL + 'cssAdd(' + Q + '@keyframes ckBgDrift{0%{filter:hue-rotate(0deg) brightness(1)}50%{filter:hue-rotate(14deg) brightness(1.06)}100%{filter:hue-rotate(-10deg) brightness(.97)}}' + Q + ');';
if (c.indexOf('ck-cssbg') !== -1 && c.indexOf('cssAdd(' + Q + '.ck-cssbg') === -1) {
  c = c.split('var panelEl = document.getElementById(' + Q + 'clicker-panel' + Q + ');').join(cssInj + NL + 'var panelEl = document.getElementById(' + Q + 'clicker-panel' + Q + ');');
  log.push('css-scene: injected');
}
fs.writeFileSync(cf, c);
console.log(log.join(' | '));
