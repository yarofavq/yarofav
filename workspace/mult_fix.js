var fs = require('fs');
var B = 'C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/';
var NL = String.fromCharCode(10);
var Q = String.fromCharCode(39);
var ef = B + 'clicker_ext.js';
var s = fs.readFileSync(ef, 'utf8');
var log = [];
function rep(s, name, from, to) {
  if (s.indexOf(to) !== -1) { log.push(name + ': ALREADY'); return s; }
  if (s.indexOf(from) === -1) { log.push(name + ': MISS'); return s; }
  log.push(name + ': ok');
  return s.split(from).join(to);
}
var EXDEF = "var EX={rbSpent:0,rbAuto:0,nexus:0,idol:0,forge:0,offVault:0,craft:{s:0,c:0,m:0,g:0,v:0}};";
var EXNEW = "var EX={rbSpent:0,megaCount:0,superCount:0,rbAuto:0,rbAutoMega:0,nexus:0,idol:0,forge:0,offVault:0,craft:{s:0,c:0,m:0,g:0,v:0}};";
s = rep(s, 'ex-fields', EXDEF, EXNEW);
var svOld = "window.ckSave=function(){CK.rbSpent=EX.rbSpent;CK.nexus=EX.nexus;CK.idol=EX.idol;CK.forge=EX.forge;CK.offVault=EX.offVault;CK.craft=EX.craft;sv();if(_s)_s();};";
var svNew = "window.ckRecalcMult=function(){CK.mult=2*(CK.rebirths||0)+50*(EX.megaCount||0)+10000*(EX.superCount||0)+10*(GK_RX||0);};" + NL + svOld;
s = rep(s, 'recalc-fn', svOld, svNew);
s = rep(s, 'gkrx-var', 'var GKKEY=\'spaceClicker_gen_v1\';', 'var GK_RX=0;' + NL + 'var GKKEY=\'spaceClicker_gen_v1\';');
s = rep(s, 'gkrx-load', 'GK.rx=Number(g.rx)||0;GK.pt=Number(g.pt)||Date.now();}}catch(e){}})();', 'GK.rx=Number(g.rx)||0;GK.pt=Number(g.pt)||Date.now();}GK_RX=GK.rx||0;}catch(e){}})();');
var megaOld = 'if(mAvail()<10)return;\nwindow.CK.mult=50;window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-10);EX.rbSpent=0;window.CK.rbSpent=0;ckReset();if(window.ckThemeShock)window.ckThemeShock(' + Q + 'rgba(255,45,149,.5)' + Q + ');if(window.ckSndPlay)window.ckSndPlay(' + Q + 'meg' + Q + ');';
var megaNew = 'if(mAvail()<10)return;\nEX.megaCount=(EX.megaCount||0)+1;window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-10);ckReset();if(window.ckRecalcMult)window.ckRecalcMult();if(window.ckThemeShock)window.ckThemeShock(' + Q + 'rgba(255,45,149,.5)' + Q + ');if(window.ckSndPlay)window.ckSndPlay(' + Q + 'meg' + Q + ');';
s = rep(s, 'mega-fix', megaOld, megaNew);
var supOld = 'if(mAvail()<100)return;\nwindow.CK.mult+=10000;window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-100);EX.rbSpent=0;window.CK.rbSpent=0;ckReset();if(window.ckThemeShock)window.ckThemeShock(' + Q + 'rgba(0,212,255,.55)' + Q + ');if(window.ckSndPlay)window.ckSndPlay(' + Q + 'meg' + Q + ');';
var supNew = 'if(mAvail()<100)return;\nEX.superCount=(EX.superCount||0)+1;window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-100);ckReset();if(window.ckRecalcMult)window.ckRecalcMult();if(window.ckThemeShock)window.ckThemeShock(' + Q + 'rgba(0,212,255,.55)' + Q + ');if(window.ckSndPlay)window.ckSndPlay(' + Q + 'meg' + Q + ');';
s = rep(s, 'super-fix', supOld, supNew);
var amOld = 'if(mAvail()>=1){ckLastAM=Date.now();window.CK.mult=50;window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-1);ckReset();if(window.sfxRebirth)window.sfxRebirth();if(window.ckToast)window.ckToast(' + Q + 'АВТО-МЕГА: x50' + Q + ');window.ckSave();if(window.render)window.render(true);}';
var amNew = 'if(mAvail()>=10){ckLastAM=Date.now();EX.megaCount=(EX.megaCount||0)+1;window.CK.rebirths=Math.max(0,(window.CK.rebirths||0)-10);ckReset();if(window.ckRecalcMult)window.ckRecalcMult();if(window.sfxRebirth)window.sfxRebirth();if(window.ckToast)window.ckToast(' + Q + 'АВТО-МЕГА: x50' + Q + ');window.ckSave();if(window.render)window.render(true);}';
s = rep(s, 'am-fix', amOld, amNew);
fs.writeFileSync(ef, s);
var cf = B + 'clicker.js';
var c = fs.readFileSync(cf, 'utf8');
c = rep(c, 'rb-recalc', 'CK.mult += 2;' + NL + '  CK.rebirths++;', 'CK.rebirths++;' + NL + '  if(window.ckRecalcMult)window.ckRecalcMult();');
fs.writeFileSync(cf, c);
console.log(log.join(' | '));
