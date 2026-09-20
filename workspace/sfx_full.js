var fs = require('fs');
var Q = String.fromCharCode(39);
var Q2 = String.fromCharCode(34);
var NL = String.fromCharCode(10);
var f = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/clicker.js';
var s = fs.readFileSync(f, 'utf8');
var block = 'var ckSndCache = {}; var ckSndSlots = [null, null]; function ckSndPlay(n) { try { if (!ckSndCache[n]) ckSndCache[n] = new Audio(n + ' + Q2 + '.mp3' + Q2 + '); var a = ckSndCache[n]; a.currentTime = 0; a.volume = (window.CK_UI && CK_UI.sfxVol !== undefined) ? CK_UI.sfxVol / 100 : 0.6; a.play().catch(function(){}); } catch (e) {} } function sfxClick() { try { var pv = ckSndSlots.shift(); if (!pv) pv = new Audio(' + Q2 + 'cl.mp3' + Q2 + '); pv.currentTime = 0; pv.volume = 0.45; pv.play().catch(function(){}); ckSndSlots.push(pv); } catch (e) {} } function sfxBuy() { ckSndPlay(' + Q2 + 'up.mp3' + Q2 + '); } function sfxRebirth() { ckSndPlay(' + Q2 + 'rb.mp3' + Q2 + '); } function sfxMega() { ckSndPlay(' + Q2 + 'meg.mp3' + Q2 + '); }';
var anchor = 'var CK_KEY = ' + Q + 'spaceClicker_v1' + Q + ';';
if (s.indexOf(anchor) === -1) { console.log('ANCHOR MISS'); } else { s = s.split(anchor).join(block + NL + anchor); fs.writeFileSync(f, s); console.log('injected'); }
