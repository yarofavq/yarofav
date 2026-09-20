var fs = require('fs');
var NL = String.fromCharCode(10);
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/clicker.js';
var s = fs.readFileSync(f, 'utf8');
var lines = s.split(NL);
var out = [];
var rm = 0;
for (var i = 0; i < lines.length; i++) {
  var L = lines[i];
  var next = lines[i + 1] || '';
  var next2 = lines[i + 2] || '';
  if (L.trim() === '}' && out.length > 0 && out[out.length - 1].trim() === '}' && (next.indexOf('visibilitychange') !== -1 || next2.indexOf('visibilitychange') !== -1 || (next.indexOf('//') === 0 && next2.indexOf('visibilitychange') !== -1))) {
    rm++;
    continue;
  }
  out.push(L);
}
fs.writeFileSync(f, out.join(NL));
console.log('removed=' + rm);
