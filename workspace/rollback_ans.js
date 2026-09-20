var fs = require('fs');
var Q = String.fromCharCode(39);
var NL = String.fromCharCode(10);
var B = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/';
var cf = B + 'clicker.js';
var s = fs.readFileSync(cf, 'utf8');
var lines = s.split(NL);
var out = [];
var removed = 0;
for (var i = 0; i < lines.length; i++) {
  var L = lines[i];
  if (L.indexOf('.t2-theme.t2ans') !== -1 || L.indexOf('ckSakura') !== -1 || L.indexOf('ckAnFlow') !== -1 || L.indexOf('ckAnTitle') !== -1 || L.indexOf('ckAnBorder') !== -1 || L.indexOf('ckAnTab') !== -1) { removed++; continue; }
  out.push(L);
}
var c = out.join(NL);
var log = ['ans-css-removed=' + removed];
function rep(s, name, from, to) {
  if (s.indexOf(to) !== -1) { log.push(name + ': ALREADY'); return s; }
  if (s.indexOf(from) === -1) { log.push(name + ': MISS'); return s; }
  log.push(name + ': ok');
  return s.split(from).join(to);
}
c = rep(c, 't2files', "'back8.mp4', 'back9.mp4', 'back10.mp4', '';", "'back8.mp4', '';");
c = rep(c, 't2classes', "'t2c2', 't2pn', 't2cv', 't2ans'];", "'t2c2', 't2pn', 't2cv'];");
c = rep(c, 't2names', "'ГОЛУБАЯ V3', 'ANS Тема'];", "'ГОЛУБАЯ V3'];");
c = rep(c, 't2min', 'Math.min(11, Number(s.t2) || 0)', 'Math.min(10, Number(s.t2) || 0)');
c = rep(c, 'snd-guard-off', 'window.CK_UI.t2 !== 11) return;', 'false) return;');
fs.writeFileSync(cf, c);
var sf = B + 'space.js';
var sp = fs.readFileSync(sf, 'utf8');
sp = sp.split('v=66').join('v=73');
fs.writeFileSync(sf, sp);
console.log(log.join(' | '));
