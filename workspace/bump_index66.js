var fs = require('fs');
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/index.html';
var s = fs.readFileSync(f, 'utf8');
s = s.split('space.js?v=49').join('space.js?v=66');
fs.writeFileSync(f, s);
var lines = s.split(String.fromCharCode(10)).filter(function (l) { return l.indexOf('space.js') !== -1; });
console.log(lines.join(' | '));
