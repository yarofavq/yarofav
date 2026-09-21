var fs = require('fs');
var Q = String.fromCharCode(39);
var NL = String.fromCharCode(10);
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/clicker_premium.js';
var s = fs.readFileSync(f, 'utf8');
if (s.indexOf('ckPmTitle2') !== -1) { console.log('ALREADY'); process.exit(0); }
var css = [];
css.push('#ck-premium-box h2{font-family:Georgia,Times New Roman,serif;font-size:30px;font-weight:900;letter-spacing:6px;margin:0 0 12px;background:linear-gradient(100deg,#fff3c4,#ffd23f 25%,#ff9de2 50%,#ff2d95 75%,#ffd23f);background-size:250% 250%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ckPmTitle2 4s ease infinite;text-shadow:none;filter:drop-shadow(0 3px 10px rgba(255,157,226,.4));}');
css.push('@keyframes ckPmTitle2{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
css.push('.ck-pm-sub{font-family:Segoe UI,sans-serif;font-style:italic;font-size:13.5px;color:#e8c9d8;letter-spacing:2px;margin-bottom:18px;text-shadow:0 0 8px rgba(255,157,226,.3);}');
css.push('.ck-pm-res{font-family:Consolas,monospace;font-size:15px;letter-spacing:1px;background:linear-gradient(160deg,rgba(255,210,63,.12),rgba(255,45,149,.08)) !important;border:1px solid #ffd23f66 !important;box-shadow:inset 0 0 14px rgba(255,210,63,.1) !important;color:#ffe9a8 !important;}');
css.push('#ck-close-pm{background:linear-gradient(135deg,#8b1a3f,#5e0d24) !important;border:1.5px solid #ffd23f66 !important;color:#ffe9a8 !important;font-family:Segoe UI,sans-serif;font-weight:800;font-size:13px;letter-spacing:3px;transition:transform .15s,filter .15s,box-shadow .2s;}');
css.push('#ck-close-pm:hover{background:linear-gradient(135deg,#a82250,#7a1030) !important;transform:translateY(-2px);box-shadow:0 8px 22px rgba(255,45,149,.4) !important;}');
css.push('#ck-close-pm:active{transform:scale(.97);}');
var add = NL;
for (var k = 0; k < css.length; k++) add += 'cssAdd(' + Q + css[k] + Q + ');' + NL;
var anchor = 'css.push(' + Q + '#ck-pmbtn{background:linear-gradient(135deg,#ffd23f,#b8860b) !important;color:#241c04 !important;box-shadow:0 0 18px rgba(255,210,63,.55) !important;}' + Q + ');';
if (s.indexOf(anchor) === -1) { console.log('ANCHOR MISS'); process.exit(1); }
s = s.split(anchor).join(anchor + add);
fs.writeFileSync(f, s);
console.log('typo rules=' + css.length);
