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
var ef = B + 'clicker_ext.js';
var s = fs.readFileSync(ef, 'utf8');
s = rep(s, 'mega-snd', "if(window.ckThemeShock)window.ckThemeShock('rgba(255,45,149,.5)');", "if(window.ckThemeShock)window.ckThemeShock('rgba(255,45,149,.5)');if(window.ckSndPlay)window.ckSndPlay('meg');");
s = rep(s, 'sup-snd', "if(window.ckThemeShock)window.ckThemeShock('rgba(0,212,255,.55)');", "if(window.ckThemeShock)window.ckThemeShock('rgba(0,212,255,.55)');if(window.ckSndPlay)window.ckSndPlay('meg');");
fs.writeFileSync(ef, s);
var cf = B + 'clicker.js';
var c = fs.readFileSync(cf, 'utf8');
c = rep(c, 't2init11', 'CK_UI.t2 = Math.max(0, Math.min(11, Number(s.t2) || 0));', 'CK_UI.t2 = Math.max(0, Math.min(11, Number(s.t2) || 0)); CK_UI.sfxVol = (s.sfxVol !== undefined) ? Math.max(0, Math.min(100, Number(s.sfxVol) || 60)) : 60;');
c = rep(c, 'vc-tab1', 'tab1.addEventListener(' + Q + 'click' + Q + ', function () { upTab = 0; ckTabApply(); });', 'tab1.addEventListener(' + Q + 'click' + Q + ', function () { ckSndPlay(' + Q + 'vc' + Q + '); upTab = 0; ckTabApply(); });');
c = rep(c, 'vc-tab2', 'tab2.addEventListener(' + Q + 'click' + Q + ', function () { upTab = 1; ckTabApply(); });', 'tab2.addEventListener(' + Q + 'click' + Q + ', function () { ckSndPlay(' + Q + 'vc' + Q + '); upTab = 1; ckTabApply(); });');
c = rep(c, 'vc-tab3', 'tab3.addEventListener(' + Q + 'click' + Q + ', function () { upTab = 2; ckTabApply(); });', 'tab3.addEventListener(' + Q + 'click' + Q + ', function () { ckSndPlay(' + Q + 'vc' + Q + '); upTab = 2; ckTabApply(); });');
c = rep(c, 'vc-tab4', 'tab4.addEventListener(' + Q + 'click' + Q + ', function () { upTab = 3; ckTabApply(); });', 'tab4.addEventListener(' + Q + 'click' + Q + ', function () { ckSndPlay(' + Q + 'vc' + Q + '); upTab = 3; ckTabApply(); });');
c = rep(c, 'vc-tab5', 'tab5.addEventListener(' + Q + 'click' + Q + ', function () { upTab = 4; ckTabApply(); });', 'tab5.addEventListener(' + Q + 'click' + Q + ', function () { ckSndPlay(' + Q + 'vc' + Q + '); upTab = 4; ckTabApply(); });');
fs.writeFileSync(cf, c);
var sf = B + 'space.js';
var sp = fs.readFileSync(sf, 'utf8');
sp = sp.split('v=79').join('v=80');
fs.writeFileSync(sf, sp);
console.log(log.join(' | '));
