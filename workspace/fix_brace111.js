var fs = require('fs');
var NL = String.fromCharCode(10);
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/clicker.js';
var s = fs.readFileSync(f, 'utf8');
var lines = s.split(NL);
var out = [];
var rm = 0;
for (var i = 0; i < lines.length; i++) {
  var L = lines[i].replace(/\r$/, '');
  if (L.trim() === '}' && out.length > 0 && out[out.length - 1].trim() === '}' && lines[i + 1] !== undefined && lines[i + 1].indexOf('visibilitychange') !== -1) { rm++; continue; }
  out.push(L);
}
fs.writeFileSync(f, out.join(NL));
console.log('removed=' + rm);
