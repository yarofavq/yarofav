var fs = require('fs');
var Q = String.fromCharCode(39);
var NL = String.fromCharCode(10);
var B = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/';
var f = B + 'clicker.js';
var s = fs.readFileSync(f, 'utf8');
var log = [];
function rep(s, name, from, to) {
  if (s.indexOf(to) !== -1) { log.push(name + ': ALREADY'); return s; }
  if (s.indexOf(from) === -1) { log.push(name + ': MISS'); return s; }
  log.push(name + ': ok');
  return s.split(from).join(to);
}
var trkFrom = "  { f: 'clicker-music-11.mp3', n: 'Voskresenskii - Еду по Москве' }" + NL + "];";
var trkTo = "  { f: 'clicker-music-11.mp3', n: 'Voskresenskii - Еду по Москве' }," + NL + "  { f: 'clicker-music-12.mp3', n: 'Кобыла - daybe' }," + NL + "  { f: 'clicker-music-13.mp3', n: 'Кобыла (Remix) - daybe' }," + NL + "  { f: 'clicker-music-14.mp3', n: 'ahhnahh - заряжаю свой мобильный' }" + NL + "];";
s = rep(s, 'trk12', trkFrom, trkTo);
s = rep(s, 'palette', Q + 'ck-trk11' + Q, Q + 'ck-trk11' + Q + ',' + Q + 'ck-trk12' + Q + ',' + Q + 'ck-trk13' + Q + ',' + Q + 'ck-trk14' + Q);
s = rep(s, 'tmedia', '10: ' + Q + 'vid6.mp4' + Q, '10: ' + Q + 'vid6.mp4' + Q + ', 11: ' + Q + 'vid9.mp4' + Q + ', 12: ' + Q + 'vid8.mp4' + Q + ', 13: ' + Q + 'vid7.mp4' + Q);
var css = [];
css.push('cssAdd(' + Q + '#ck-track-name.ck-trk12{background:linear-gradient(90deg,#f43f5e,#fb7185,#f43f5e);background-size:200% 200%;animation:ckT12 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}' + Q + ');');
css.push('cssAdd(' + Q + '@keyframes ckT12{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}' + Q + ');');
css.push('cssAdd(' + Q + '#ck-track-name.ck-trk13{background:linear-gradient(90deg,#8b5cf6,#ec4899,#8b5cf6);background-size:200% 200%;animation:ckT13 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}' + Q + ');');
css.push('cssAdd(' + Q + '@keyframes ckT13{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}' + Q + ');');
css.push('cssAdd(' + Q + '#ck-track-name.ck-trk14{background:linear-gradient(90deg,#10b981,#f59e0b,#10b981);background-size:200% 200%;animation:ckT14 3s ease infinite;-webkit-background-clip:text;background-clip:text;color:transparent;}' + Q + ');');
css.push('cssAdd(' + Q + '@keyframes ckT14{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}' + Q + ');');
var cssBlk = NL + css.join(NL);
var lastT11 = s.lastIndexOf('ckT11');
if (lastT11 !== -1) {
  var lineEnd = s.indexOf(NL, lastT11);
  if (lineEnd === -1) lineEnd = s.length;
  s = s.substring(0, lineEnd) + cssBlk + s.substring(lineEnd);
  log.push('css: ok');
}
fs.writeFileSync(f, s);
console.log(log.join(' | '));
