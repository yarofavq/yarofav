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
s = rep(s, 'mega-1to10', 'if(mAvail()<1)return;', 'if(mAvail()<10)return;');
s = rep(s, 'mega-spend10', 'window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-1);EX.rbSpent=0;', 'window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-10);EX.rbSpent=0;');
s = rep(s, 'mega-mult50', 'window.CK.mult+=50;', 'window.CK.mult=50;');
s = rep(s, 'am-1to10', 'if(mAvail()>=1){ckLastAM=Date.now();window.CK.mult+=50;window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-1);ckReset();', 'if(mAvail()>=10){ckLastAM=Date.now();window.CK.mult=50;window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-10);ckReset();');
fs.writeFileSync(ef, s);
var cf = B + 'clicker.js';
var c = fs.readFileSync(cf, 'utf8');
c = rep(c, 'sfx-files', 'function sfxClick() { ckBeep(620, 0.07, ' + Q + 'triangle' + Q + ', 0.13, 880); }', 'var ckSnd = { cl: null, up: null, rb: null, meg: null, vc: null }; var ckSndPool = [null, null]; function ckSndPlay(n) { try { if (!ckSnd[n]) { ckSnd[n] = new Audio(n + ' + Q + '.mp3' + Q + '); ckSnd[n].volume = 0.6; } var a = ckSnd[n]; a.currentTime = 0; a.volume = ((window.CK_UI && CK_UI.sfxVol !== undefined) ? CK_UI.sfxVol / 100 : 0.6); a.play().catch(function(){}); } catch (e) {} } function sfxClick() { try { var pv = ckSndPool.shift(); pv.currentTime = 0; pv.volume = 0.45; pv.play().catch(function(){}); ckSndPool.push(pv); } catch (e) {} }');
c = rep(c, 'sfx-buy', 'function sfxBuy() {', 'function sfxBuy() { ckSndPlay(' + Q + 'up' + Q + '); return; function _o(){');
c = rep(c, 'sfx-rb', 'function sfxRebirth() { ckBeep(300, 0.4, ' + Q + 'sawtooth' + Q + ', 0.09, 1400); }', 'function sfxRebirth() { ckSndPlay(' + Q + 'rb' + Q + '); }');
c = rep(c, 'mega-snd', 'if(window.sfxRebirth)window.sfxRebirth();' + NL + 'if(window.ckToast)window.ckToast(' + Q + 'МЕГА-ПЕРЕРОЖДЕНИЕ: x50' + Q + ');', 'if(window.ckSndPlay)window.ckSndPlay(' + Q + 'meg' + Q + ');else if(window.sfxRebirth)window.sfxRebirth();' + NL + 'if(window.ckToast)window.ckToast(' + Q + 'МЕГА-ПЕРЕРОЖДЕНИЕ: x50' + Q + ');');
c = rep(c, 't2files', "'back10.mp4'];", "'back10.mp4', ''];");
c = rep(c, 't2classes', "'t2cv'];", "'t2cv', 't2ans'];");
c = rep(c, 't2names', "'ГОЛУБАЯ V3'];", "'ГОЛУБАЯ V3', 'ANS Тема'];");
c = rep(c, 't2min', 'CK_UI.t2 = Math.max(0, Math.min(10, Number(s.t2) || 0));', 'CK_UI.t2 = Math.max(0, Math.min(11, Number(s.t2) || 0));');
fs.writeFileSync(cf, c);
var sf = B + 'space.js';
var sp = fs.readFileSync(sf, 'utf8');
sp = sp.split('v=75').join('v=76');
fs.writeFileSync(sf, sp);
console.log(log.join(' | '));
