var fs = require('fs');
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/space.js';
var s = fs.readFileSync(f, 'utf8');
s = s.split('v=90').join('v=91');
fs.writeFileSync(f, s);
var lines = s.split(String.fromCharCode(10)).filter(function (l) { return l.indexOf('clicker_premium') !== -1; });
console.log(lines.join(' | '));
