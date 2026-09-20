var fs = require('fs');
var NL = String.fromCharCode(10);
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/clicker.js';
var s = fs.readFileSync(f, 'utf8');
var lines = s.split(NL);
var out = [];
var rm = 0;
for (var i = 0; i < lines.length; i++) {
  var L = lines[i];
  if (L.indexOf("ckBeep(520, 0.09, 'square'") !== -1) { rm++; continue; }
  if (L.indexOf('ckBeep(880, 0.12') !== -1) { rm++; continue; }
  if (L.trim() === '}' && i > 100 && i < 116 && out.length > 0 && out[out.length - 1].indexOf('setTimeout') !== -1) { rm++; continue; }
  out.push(L);
}
fs.writeFileSync(f, out.join(NL));
console.log('removed=' + rm);
