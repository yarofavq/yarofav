var fs = require('fs');
var Q = String.fromCharCode(39);
var NL = String.fromCharCode(10);
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/clicker.js';
var s = fs.readFileSync(f, 'utf8');
var lines = s.split(NL);
var out = [];
var removed = 0;
for (var i = 0; i < lines.length; i++) {
  var L = lines[i];
  if (L.indexOf('ckSnd[') !== -1 || L.indexOf('ckSndPool') !== -1 || L.indexOf('ckSndPlay') !== -1) { removed++; continue; }
  out.push(L);
}
s = out.join(NL);
var inject = 'var ckSndCache = {}; var ckSndSlots = [null, null]; function ckSndPlay(n) { try { if (!ckSndCache[n]) ckSndCache[n] = new Audio(n + ' + Q + '.mp3' + Q + '); var a = ckSndCache[n]; a.currentTime = 0; a.volume = (window.CK_UI && CK_UI.sfxVol !== undefined) ? CK_UI.sfxVol / 100 : 0.6; a.play().catch(function(){}); } catch (e) {} } function sfxClick() { try { var pv = ckSndSlots.shift(); if (!pv) pv = new Audio(' + Q + 'cl.mp3' + Q + '); pv.currentTime = 0; pv.volume = 0.45; pv.play().catch(function(){}); ckSndSlots.push(pv); } catch (e) {} }';
s = s.split('function sfxClick() { ckBeep(620, 0.07, ' + Q + 'triangle' + Q + ', 0.13, 880); }').join(inject);
fs.writeFileSync(f, s);
console.log('removed=' + removed);
