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
c = rep(c, 'flow-inject', 'cssAdd(' + Q + '.ck-actions button:active{transform:scale(.94);}' + Q + ');', 'cssAdd(' + Q + '.ck-actions button:active{transform:scale(.94);}' + Q + ');' + NL + 'cssAdd(' + Q + '.ck-actions button{background-size:200% 200% !important;}' + Q + ');' + NL + 'cssAdd(' + Q + '.ck-actions button{animation:ckAllFlow 2.8s ease infinite !important;}' + Q + ');' + NL + 'cssAdd(' + Q + '@keyframes ckAllFlow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}' + Q + ');' + NL + 'cssAdd(' + Q + '#ck-shopbtn{animation-duration:2.4s !important;}' + Q + ');' + NL + 'cssAdd(' + Q + '#ck-rebirth{animation-duration:2.6s !important;}' + Q + ');' + NL + 'cssAdd(' + Q + '#ck-lbbtn{animation-duration:3s !important;}' + Q + ');' + NL + 'cssAdd(' + Q + '#ck-invbtn{animation-duration:2.9s !important;}' + Q + ');');
fs.writeFileSync(cf, c);
var sf = B + 'space.js';
var sp = fs.readFileSync(sf, 'utf8');
sp = sp.split('v=66').join('v=73');
fs.writeFileSync(sf, sp);
console.log(log.join(' | '));
