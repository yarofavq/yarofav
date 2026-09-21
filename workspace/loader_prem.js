var fs = require('fs');
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/space.js';
var s = fs.readFileSync(f, 'utf8');
var NL = String.fromCharCode(10);
if (s.indexOf('clicker_premium.js') !== -1) { console.log('ALREADY'); }
else {
  var anchor = "e.src = 'clicker_ext.js?v=";
  var idx = s.indexOf(anchor);
  if (idx === -1) { console.log('ANCHOR MISS'); }
  else {
    var lineEnd = s.indexOf(String.fromCharCode(10), idx);
    var line = s.substring(idx, lineEnd);
    var vMatch = line.match(/v=\d+/);
    var ver = vMatch ? vMatch[0].split('=')[1] : '66';
    var pLine = line.replace('clicker_ext.js', 'clicker_premium.js');
    var pName = pLine.split('=')[0].trim();
    var varName = s.indexOf('var p =') === -1 ? 'var p' : 'var p2';
    var insert = NL + '  ' + pLine.replace('e.src', 'p.src').replace(/^e\./, 'p.').replace(/e\./, 'p.');
    insert = NL + "  var ps = document.createElement('script');" + NL + "  ps.src = 'clicker_premium.js?v=" + ver + "';" + NL + "  document.body.appendChild(ps);";
    s = s.substring(0, lineEnd) + insert + s.substring(lineEnd);
    fs.writeFileSync(f, s);
  }
  var lines = s.split(String.fromCharCode(10)).filter(function (l) { return l.indexOf('clicker') !== -1; });
  console.log(lines.join(' | '));
}
