(function(){
var KEY='spaceClicker_ext_v1',LB2='spaceClicker_lb_v2';
var EX={rbSpent:0,megaCount:0,superCount:0,rbAuto:0,rbAutoMega:0,nexus:0,idol:0,forge:0,offVault:0,craft:{s:0,c:0,m:0,g:0,v:0}};
function sv(){try{localStorage.setItem(KEY,JSON.stringify(EX));}catch(e){}}
function boot(){
if(!window.__CKAPI||!window.__CKAPI.CK_UPG||window.__CKAPI.CK_UPG.length<360){setTimeout(boot,60);return;}
var A=window.__CKAPI;window.CK=A.CK;window.CK_UPG=A.CK_UPG;window.ckSave=A.ckSave;window.ckNick=A.ckNick;window.ckStage=A.ckStage;window.render=A.render;window.renderShop=A.renderShop;window.cssAdd=A.cssAdd;window.fmtNum=A.fmtNum;window.sfxBuy=A.sfxBuy;window.sfxRebirth=A.sfxRebirth;window.ckToast=A.ckToast;window.ckInvRender=A.ckInvRender;window.ckUpgCost=A.ckUpgCost;window.ckLbPush=A.ckLbPush;
var CK=window.CK;
try{
if(localStorage.getItem('spaceClicker_wiped')!=='16'){
EX.rbSpent=0;EX.rbAuto=0;EX.rbAutoMega=0;EX.megaCount=0;EX.superCount=0;
try{localStorage.removeItem('spaceClicker_gen_v1');localStorage.removeItem('spaceClicker_nick');localStorage.removeItem('spaceClicker_nick_reg');}catch(e7){}
localStorage.removeItem(LB2);
localStorage.removeItem(KEY);
CK.rbSpent=0;CK.laser=false;CK.earth=false;CK.gold=false;CK.critM=false;CK.warp=false;
localStorage.removeItem('spaceClicker_v1');
localStorage.removeItem('spaceClicker_lb_v1');
localStorage.removeItem('spaceClicker_auto');
CK.clicks=0;CK.mult=1;CK.rebirths=0;CK.boost={};CK.inv=[];CK.mc=0;CK.lv=[];
for(var z=0;z<360;z++)CK.lv.push(0);
localStorage.setItem('spaceClicker_wiped','16');
}
}catch(e){}
var svd=null;
try{svd=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
if(svd&&typeof svd==='object'){
EX.rbSpent=Number(svd.rbSpent)||0;EX.rbAuto=0;/*na1*/EX.rbAutoMega=0;/*na2*/EX.nexus=!!svd.nexus;EX.idol=!!svd.idol;EX.forge=!!svd.forge;EX.offVault=!!svd.offVault;
EX.megaCount=Number(svd.megaCount)||0;EX.superCount=Number(svd.superCount)||0;EX.pmSpent=Number(svd.pmSpent)||0;
if(svd.craft&&typeof svd.craft==='object')EX.craft={s:Number(svd.craft.s)||0,c:Number(svd.craft.c)||0,m:Number(svd.craft.m)||0,g:Number(svd.craft.g)||0,v:Number(svd.craft.v)||0};
}
CK.rbSpent=EX.rbSpent;CK.nexus=EX.nexus;CK.idol=EX.idol;CK.forge=EX.forge;CK.offVault=EX.offVault;CK.craft=EX.craft;
window.__CKEX=EX;
window.__CKSYNC=function(){sv();};
window.ckGold=function(){var s=0,x;for(x=101;x<200;x+=2)s+=window.CK_UPG[x].val*window.CK.lv[x];return s+(window.CK.gold?50:0)+(EX.idol?50:0)+(EX.forge?25:0);};
window.ckGoldMul=function(){var cs=(EX.craft.s||0)+(EX.craft.g||0)*5+(EX.craft.v||0)*10;return 1+(window.ckGold()+window.ckMega()+cs)/100;};
window.ckCrit=function(){var s=5,x;for(x=100;x<200;x+=2)s+=window.CK_UPG[x].val*window.CK.lv[x];return Math.min(85,s+(window.CK.critM?15:0)+(EX.nexus?10:0)+(EX.craft.c||0)*2);};
window.ckCritMul=function(){var s=5,x;for(x=200;x<300;x+=2)s+=window.CK_UPG[x].val*window.CK.lv[x];return s+(EX.craft.m||0);};
window.ckLbPush=function(){try{var all=JSON.parse(localStorage.getItem(LB2)||'{}');var k=window.ckNick();var me=all[k]||{best:0,stage:0,rebirths:0};if(window.CK.clicks>(me.best||0))me.best=window.CK.clicks;var st=window.ckStage();if(st>(me.stage||0))me.stage=st;if((window.CK.rebirths||0)>(me.rebirths||0))me.rebirths=window.CK.rebirths||0;me.ts=Date.now();all[k]=me;localStorage.setItem(LB2,JSON.stringify(all));}catch(e){}};
window.ckLbList=function(){var all={},arr=[],k;try{all=JSON.parse(localStorage.getItem(LB2)||'{}');}catch(e){}for(k in all)if(Object.prototype.hasOwnProperty.call(all,k)&&k!=='Гость')arr.push({nick:k,best:all[k].best||0,stage:all[k].stage||0,rebirths:all[k].rebirths||0});arr.sort(function(a,b){return b.best-a.best;});return arr.slice(0,10);};
var _s=window.ckSave;
window.ckRecalcMult=function(){CK.mult=2*(CK.rebirths||0)+50*(EX.megaCount||0)+10000*(EX.superCount||0)+10*(GK_RX||0);};
window.ckSave=function(){CK.rbSpent=EX.rbSpent;CK.nexus=EX.nexus;CK.idol=EX.idol;CK.forge=EX.forge;CK.offVault=EX.offVault;CK.craft=EX.craft;sv();if(_s)_s();};
if(window.render)window.render(true);
}
boot();
})();
function extPhase2(){
var EX=window.__CKEX;
function sv(){try{localStorage.setItem('spaceClicker_ext_v1',JSON.stringify(EX));}catch(e){}}
function mAvail(){return Math.floor(window.CK ? (window.CK.rebirths||0) : 0);}
function ckReset(){var CK=window.CK;CK.clicks=0;CK.lv=[];for(var z=0;z<360;z++)CK.lv.push(0);}
var megaBtn=document.createElement('button');megaBtn.id='ck-megareb';megaBtn.textContent='МЕГА x50 (0/10)';
var acts=document.getElementById('ck-actions');
if(acts)acts.appendChild(megaBtn);
function updMega(){var a=mAvail();megaBtn.disabled=a<10;megaBtn.textContent='МЕГА x50 ('+a+'/10)';}
megaBtn.addEventListener('click',function(){
if((window.CK.rebirths||0)<10)return;
window.CK.rebirths-=10;
window.CK.mult=(window.CK.mult||1)+50;
EX.megaCount=(EX.megaCount||0)+1;
ckReset();if(window.ckThemeShock)window.ckThemeShock('rgba(255,45,149,.5)');if(window.ckSndPlay)window.ckSndPlay('meg');
if(window.sfxRebirth)window.sfxRebirth();
if(window.ckToast)window.ckToast('МЕГА-ПЕРЕРОЖДЕНИЕ: +50x');
window.ckSave();if(window.render)window.render(true);updMega();
});
setInterval(updMega,900);updMega();
var supBtn=document.createElement('button');supBtn.id='ck-superreb';supBtn.textContent='СУПЕР x10000 (0/100)';
if(acts)acts.appendChild(supBtn);
function updSup(){var a=(window.CK ? (window.CK.rebirths||0) : 0);supBtn.disabled=a<100;supBtn.textContent='СУПЕР x10000 ('+a+'/100)';}
supBtn.addEventListener('click',function(){
if((window.CK.rebirths||0)<100)return;
window.CK.rebirths-=100;
window.CK.mult=(window.CK.mult||1)+10000;
EX.superCount=(EX.superCount||0)+1;
ckReset();if(window.ckThemeShock)window.ckThemeShock('rgba(0,212,255,.55)');if(window.ckSndPlay)window.ckSndPlay('meg');
if(window.sfxRebirth)window.sfxRebirth();
if(window.ckToast)window.ckToast('СУПЕР-ПЕРЕРОЖДЕНИЕ: +10000x');
window.ckSave();if(window.render)window.render(true);updMega();updSup();
});
setInterval(updSup,900);updSup();
var amBtn=document.createElement('button');amBtn.id='ck-ap-am';amBtn.className='ck-apbtn apb-am'+(EX.rbAutoMega?' on':'');amBtn.textContent='АВТО-МЕГА: '+(EX.rbAutoMega?'ВКЛ':'ВЫКЛ');
var ap2=document.getElementById('ck-autop');
if(ap2)ap2.appendChild(amBtn);
amBtn.addEventListener('click',function(){EX.rbAutoMega=!EX.rbAutoMega;amBtn.className='ck-apbtn apb-am'+(EX.rbAutoMega?' on':'');amBtn.textContent='АВТО-МЕГА: '+(EX.rbAutoMega?'ВКЛ':'ВЫКЛ');sv();});
EX.rbAutoMega=!!EX.rbAutoMega;
var ckLastAM=0;
setInterval(function(){
if(!EX.rbAutoMega)return;
if(Date.now()-(window.ckLastAM||0)<60000)return;
if(Date.now()-ckLastAM<60000)return;
if((window.CK.rebirths||0)>=10){ckLastAM=Date.now();window.CK.rebirths-=10;window.CK.mult=(window.CK.mult||1)+50;EX.megaCount=(EX.megaCount||0)+1;ckReset();if(window.sfxRebirth)window.sfxRebirth();if(window.ckToast)window.ckToast('АВТО-МЕГА: +50x');window.ckSave();if(window.render)window.render(true);updMega();}
},1000);
var arbBtn=document.createElement('button');arbBtn.id='ck-ap-rb';arbBtn.className='ck-apbtn apb-rb'+(EX.rbAuto?' on':'');arbBtn.textContent='АВТО-РЕБЕРФ: '+(EX.rbAuto?'ВКЛ':'ВЫКЛ');
var ap=document.getElementById('ck-autop');
if(ap)ap.appendChild(arbBtn);
arbBtn.addEventListener('click',function(){EX.rbAuto=!EX.rbAuto;arbBtn.className='ck-apbtn apb-rb'+(EX.rbAuto?' on':'');arbBtn.textContent='АВТО-РЕБЕРФ: '+(EX.rbAuto?'ВКЛ':'ВЫКЛ');sv();});
var ckLastRbT=0;
setInterval(function(){
if(!EX.rbAuto||EX.rbAutoMega)return;
if(Date.now()-ckLastRbT<10000)return;
if(false){ckLastRbT=Date.now();window.CK.mult+=2;window.CK.rebirths++;ckReset();if(window.sfxRebirth)window.sfxRebirth();if(window.ckToast)window.ckToast('АВТО-РЕБЕРФ: x2');window.ckSave();if(window.render)window.render(true);}
},200);
if(window.render){var _r=window.render;window.render=function(f){var out=_r(f);updMega();return out;};}
var crafBtn=document.createElement('button');crafBtn.id='ck-craftbtn';crafBtn.textContent='КРАФТ';
var acts2=document.getElementById('ck-actions');
if(acts2)acts2.appendChild(crafBtn);
var crafModal=document.createElement('div');crafModal.id='ck-craft';crafModal.className='clicker-ui hidden';
var cbox=document.createElement('div');cbox.id='ck-craft-box';
var h2c=document.createElement('h2');h2c.textContent='КРАФТ';cbox.appendChild(h2c);
var cgrid=document.createElement('div');cbox.appendChild(cgrid);
var cclose=document.createElement('button');cclose.id='ck-close-craft';cclose.textContent='ЗАКРЫТЬ';cbox.appendChild(cclose);
crafModal.appendChild(cbox);document.body.appendChild(crafModal);
var REC=[{id:'shard',need:25,key:'s',cap:50,col:'#9fb8ff',n:'Осколки',eff:'+1% ко всему'},{id:'core',need:15,key:'c',cap:15,col:'#37e08a',n:'Ядра',eff:'+2% шанс крита'},{id:'prism',need:10,key:'m',cap:25,col:'#b04dff',n:'Призмы',eff:'+1x крит-множ'},{id:'nova',need:5,key:'g',cap:20,col:'#ffd23f',n:'Новы',eff:'+5% ко всему'},{id:'void',need:2,key:'v',cap:10,col:'#ff4d6d',n:'Пустота',eff:'+10% ко всему'}];
function invCnt(id){var c=0,i;for(i=0;i<window.CK.inv.length;i++)if(window.CK.inv[i]===id)c++;return c;}
function craftRender(){while(cgrid.firstChild)cgrid.removeChild(cgrid.firstChild);for(var k=0;k<REC.length;k++){(function(r){
var have=invCnt(r.id);var stk=EX.craft[r.key]||0;var ok=have>=r.need&&stk<r.cap;
var row=document.createElement('div');row.className='ck-craft-row';row.style.borderColor=r.col;
var orb=document.createElement('div');orb.className='ck-craft-orb';orb.style.background=r.col;
var info=document.createElement('div');info.className='ck-craft-info';
var bb=document.createElement('b');bb.textContent=r.n+' x'+r.need;info.appendChild(bb);
var sm=document.createElement('small');sm.textContent=r.eff+' - стак '+stk+'/'+r.cap;info.appendChild(sm);
var right=document.createElement('div');right.className='ck-craft-right';
var sm2=document.createElement('small');sm2.textContent='в наличии: '+have;right.appendChild(sm2);
var cbtn=document.createElement('button');cbtn.textContent='КРАФТ';cbtn.disabled=!ok;right.appendChild(cbtn);
row.appendChild(orb);row.appendChild(info);row.appendChild(right);cgrid.appendChild(row);
cbtn.addEventListener('click',function(){
if(invCnt(r.id)<r.need||(EX.craft[r.key]||0)>=r.cap)return;
var removed=0,i;
for(i=window.CK.inv.length-1;i>=0&&removed<r.need;i--){if(window.CK.inv[i]===r.id){window.CK.inv.splice(i,1);removed++;}}
EX.craft[r.key]=(EX.craft[r.key]||0)+1;
if(window.sfxBuy)window.sfxBuy();
if(window.ckToast)window.ckToast('СКРАФЧЕНО: '+r.n);
window.ckSave();if(window.ckInvRender)window.ckInvRender();craftRender();if(window.render)window.render();
});
})(REC[k]);}}
crafBtn.addEventListener('click',function(){crafModal.classList.remove('hidden');craftRender();});
cclose.addEventListener('click',function(){crafModal.classList.add('hidden');});
var SH2=[{id:'nexus',n:'Крит-Нексус',desc:'+10% шанс крита навсегда',price:1e11,flag:'nexus'},{id:'idol',n:'Золотой Идол',desc:'+50% ко всему доходу навсегда',price:1e12,flag:'idol'},{id:'offvault',n:'Оффлайн-Сейф',desc:'Оффлайн-доход 24 ч вместо 8 ч',price:5e11,flag:'offVault'},{id:'forge',n:'Звездная Кузня',desc:'+25% ко всему доходу навсегда',price:5e13,flag:'forge'}];
var sh2Refs=[];
var shopBox2=document.getElementById('ck-shop-box');
if(shopBox2){
for(var si=0;si<SH2.length;si++){(function(it){
var row=document.createElement('div');row.className='ck-shop-item';row.id='ck-item-'+it.id;
var info=document.createElement('div');
var ib=document.createElement('b');ib.textContent=it.n;info.appendChild(ib);
info.appendChild(document.createElement('br'));
var ism=document.createElement('small');ism.textContent=it.desc;info.appendChild(ism);
var side=document.createElement('div');side.style.textAlign='right';
var cd=document.createElement('div');cd.textContent='Price: '+window.fmtNum(it.price);side.appendChild(cd);
var buy=document.createElement('button');buy.id='ck-buy-'+it.id;buy.textContent='КУПИТЬ';
side.appendChild(buy);row.appendChild(info);row.appendChild(side);shopBox2.appendChild(row);
sh2Refs.push({it:it,row:row,buy:buy});
buy.addEventListener('click',function(){
if(EX[it.flag]||window.CK.clicks<it.price)return;
window.CK.clicks-=it.price;EX[it.flag]=1;window.CK[it.flag]=true;
if(window.sfxBuy)window.sfxBuy();
if(window.ckToast)window.ckToast('КУПЛЕНО: '+it.n);
window.ckSave();if(window.renderShop)window.renderShop();if(window.render)window.render();
});
})(SH2[si]);}
setInterval(function(){if(!shopBox2)return;for(var i5=0;i5<sh2Refs.length;i5++){var r5=sh2Refs[i5];var own5=!!EX[r5.it.flag];r5.buy.disabled=own5||window.CK.clicks<r5.it.price;r5.buy.textContent=own5?'КУПЛЕНО':(window.CK.clicks<r5.it.price?'МАЛО':'КУПИТЬ');r5.row.className='ck-shop-item'+(own5?' owned':'');}},400);
if(window.renderShop){var _rs=window.renderShop;window.renderShop=function(){_rs();for(var i2=0;i2<sh2Refs.length;i2++){var r2=sh2Refs[i2];var own=!!EX[r2.it.flag];r2.buy.disabled=own||window.CK.clicks<r2.it.price;r2.buy.textContent=own?'КУПЛЕНО':(window.CK.clicks<r2.it.price?'МАЛО':'КУПИТЬ');r2.row.className='ck-shop-item'+(own?' owned':'');}};}
}
if(window.cssAdd){
window.cssAdd('#ck-megareb{background:linear-gradient(135deg,#ffd23f,#b04dff);}');
window.cssAdd('#ck-megareb:disabled{opacity:.45;}');
window.cssAdd('#ck-craftbtn{background:linear-gradient(135deg,#7b2cbf,#3a86ff);}');
window.cssAdd('#ck-craft{position:fixed;inset:0;z-index:9471;background:rgba(2,2,14,.85);display:flex;align-items:center;justify-content:center;font-family:monospace;}');
window.cssAdd('#ck-craft-box{width:min(560px,94vw);background:linear-gradient(160deg,#141a3a,#0b1026);border:2px solid #b04dff;border-radius:16px;padding:18px;color:#fff;max-height:90vh;overflow-y:auto;box-sizing:border-box;}');
window.cssAdd('#ck-craft-box h2{margin:0 0 12px;text-align:center;color:#d9b3ff;}');
window.cssAdd('.ck-craft-row{display:flex;align-items:center;gap:10px;background:#111634;border:1px solid #6a1fb5;border-radius:11px;padding:10px;margin-bottom:8px;}');
window.cssAdd('.ck-craft-orb{width:34px;height:34px;border-radius:50%;flex:none;}');
window.cssAdd('.ck-craft-info{flex:1;font-size:13px;}');
window.cssAdd('.ck-craft-info small{display:block;color:#8fa3e8;}');
window.cssAdd('.ck-craft-right{text-align:right;font-size:12px;}');
window.cssAdd('.ck-craft-right button{background:linear-gradient(135deg,#b04dff,#5e12a8);border:none;border-radius:8px;padding:8px 12px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:4px;}');
window.cssAdd('.ck-craft-right button:disabled{opacity:.4;cursor:default;}');
window.cssAdd('#ck-close-craft{width:100%;background:#b3283c;border:none;border-radius:9px;padding:10px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
window.cssAdd('#ck-nuc{position:fixed;inset:0;z-index:9472;background:rgba(2,2,14,.88);display:flex;align-items:center;justify-content:center;font-family:monospace;}');
window.cssAdd('#ck-nuc-box{width:min(620px,94vw);max-height:90vh;overflow-y:auto;background:linear-gradient(160deg,#101a2a,#0a1420);border:2px solid #7fd4ff;border-radius:16px;padding:18px;color:#fff;box-sizing:border-box;}');
window.cssAdd('#ck-nuc-box h2{margin:0 0 10px;text-align:center;color:#7fd4ff;letter-spacing:2px;}');
window.cssAdd('#ck-nuc-info{text-align:center;color:#9fb8cc;font-size:12px;margin-bottom:10px;}');
window.cssAdd('#ck-nucbtn{background:linear-gradient(135deg,#0ea5e9,#134e6f);}');
window.cssAdd('#ck-close-nuc{width:100%;background:#b3283c;border:none;border-radius:9px;padding:10px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
}
}
if(window.__CKEX){extPhase2();}
else{var wt2=setInterval(function(){if(window.__CKEX){clearInterval(wt2);extPhase2();}},60);}
var GK_RX=0;
var GKKEY='spaceClicker_gen_v1';
var GK={o:[0,0,0,0,0],p:[0,0,0,0,0],cd:[0,0,0,0,0],b:[0,0,0,0,0],spd:0,rx:0,pt:Date.now()};
function gkSave(){try{localStorage.setItem(GKKEY,JSON.stringify(GK));}catch(e){}}
(function(){try{var g=JSON.parse(localStorage.getItem(GKKEY)||'null');if(g&&typeof g==='object'){var i;for(i=0;i<5;i++){GK.o[i]=Number(g.o&&g.o[i])||0;GK.p[i]=Number(g.p&&g.p[i])||0;GK.cd[i]=Number(g.cd&&g.cd[i])||0;GK.b[i]=Number(g.b&&g.b[i])||0;}GK.spd=Number(g.spd)||0;GK.rx=Number(g.rx)||0;GK.pt=Number(g.pt)||Date.now();}GK_RX=GK.rx||0;}catch(e){}})();
function gkSpd(){return 1+GK.spd*0.25;}
var nucBtn=document.createElement('button');nucBtn.id='ck-nucbtn';nucBtn.textContent='ЯДРА';
var acts3=document.getElementById('ck-actions');
if(acts3)acts3.appendChild(nucBtn);
function nucOk(){return (window.CK.rebirths||0)>=50;}
setInterval(function(){nucBtn.disabled=!nucOk();},900);nucBtn.disabled=!nucOk();
var nuc=document.createElement('div');nuc.id='ck-nuc';nuc.className='clicker-ui hidden';
var nbox=document.createElement('div');nbox.id='ck-nuc-box';
nbox.appendChild(document.createElement('h2')).textContent='ЯДРА';
var nucInfo=document.createElement('div');nucInfo.id='ck-nuc-info';nbox.appendChild(nucInfo);
var ngrid=document.createElement('div');nbox.appendChild(ngrid);
var nshop=document.createElement('div');nbox.appendChild(nshop);
var nclose=document.createElement('button');nclose.id='ck-close-nuc';nclose.textContent='ЗАКРЫТЬ';nbox.appendChild(nclose);
nuc.appendChild(nbox);document.body.appendChild(nuc);
nucBtn.addEventListener('click',function(){if(!nucOk()){if(window.ckToast)window.ckToast('Нужно 50 перерождений');return;}nuc.classList.remove('hidden');nucRender();});
nclose.addEventListener('click',function(){nuc.classList.add('hidden');});
function gkPrice(i){if(i===0)return Math.ceil(1e30*Math.pow(4,GK.b[0]));return 100;}
setInterval(function(){
if(window.__ckNucCore)return;
var now=Date.now();
for(var gi=0;gi<5;gi++){
if(GK.cd[gi]>0)GK.cd[gi]=Math.max(0,GK.cd[gi]-(now-GK.pt)/1000);
if(GK.o[gi]>0){
if(gi<4)GK.p[gi]+=GK.o[gi]*10*gkSpd();
else{window.CK.rebirths=(window.CK.rebirths||0)+GK.o[gi];}
}
}
GK.pt=now;
gkSave();
if(!nuc.classList.contains('hidden'))nucRender();
},10000);
var NNAME=['Ядро-1','Ядро-2','Ядро-3','Ядро-4','Ядро-5'];
function nucRender(){
if(nuc.classList.contains('hidden'))return;
var h='';
for(var i=0;i<5;i++){
var prev=i===0?(window.CK.clicks||0):GK.p[i-1];
var unlocked=i===0||GK.b[i]>0||GK.o[i-1]>=10;
var cd=Math.ceil(GK.cd[i]);
h+='<div class=ck-craft-row style=border-color:#7fd4ff><div class=ck-craft-info><b>'+NNAME[i]+' x'+GK.o[i]+'</b><small>';
if(i<4)h+='накоплено: '+window.fmtNum(GK.p[i]);else h+='дает: '+GK.o[i]+' перерожд./10с';
h+='</small></div><div class=ck-craft-right>';
if(!unlocked)h+='<small>нужно 10 '+NNAME[i-1]+'</small>';
else if(cd>0)h+='<small>кулдаун: '+cd+'с</small>';
else{
if(i===0)h+='<small>цена: '+window.fmtNum(gkPrice(0))+' кликов</small><button id=ck-nb-0>КУПИТЬ x10</button>';
else h+='<small>цена: '+window.fmtNum(gkPrice(i))+' '+NNAME[i-1]+'</small><button id=ck-nb-'+i+'>КУПИТЬ x10</button>';
}
h+='</div></div>';
}
h+='<div class=ck-craft-row style=border-color:#ffd23f><div class=ck-craft-info><b>МАГАЗИН ЯДЕР</b><small>скорость: +25%/ур ('+GK.spd+' ур) - за Ядро-1</small></div><div class=ck-craft-right><small>цена: '+window.fmtNum(Math.ceil(50*Math.pow(2,GK.spd)))+' Я-1</small><button id=ck-ns-spd>КУПИТЬ</button></div></div>';
h+='<div class=ck-craft-row style=border-color:#d68cff><div class=ck-craft-info><b>ИКСЫ НАВСЕГДА</b><small>+'+(GK.rx*10)+' к множителю ('+GK.rx+' ур) - за Ядро-2</small></div><div class=ck-craft-right><small>цена: '+window.fmtNum(Math.ceil(20*Math.pow(2,GK.rx)))+' Я-2</small><button id=ck-ns-rx>КУПИТЬ</button></div></div>';
ngrid.innerHTML=h;
var b0=document.getElementById('ck-nb-0');
if(b0)b0.addEventListener('click',function(){if(GK.cd[0]>0||window.CK.clicks<gkPrice(0))return;window.CK.clicks-=gkPrice(0);GK.o[0]+=10;GK.b[0]++;GK.cd[0]=60;gkSave();nucRender();});
for(var k2=1;k2<5;k2++)(function(kk){
var bk=document.getElementById('ck-nb-'+kk);
if(bk)bk.addEventListener('click',function(){
if(GK.cd[kk]>0||GK.p[kk-1]<gkPrice(kk))return;
GK.p[kk-1]-=gkPrice(kk);GK.o[kk]+=10;GK.b[kk]++;GK.cd[kk]=60;gkSave();nucRender();
});
})(k2);
var bs=document.getElementById('ck-ns-spd');
if(bs)bs.addEventListener('click',function(){var c=Math.ceil(50*Math.pow(2,GK.spd));if(GK.p[0]<c)return;GK.p[0]-=c;GK.spd++;gkSave();nucRender();});
var br=document.getElementById('ck-ns-rx');
if(br)br.addEventListener('click',function(){var c=Math.ceil(20*Math.pow(2,GK.rx));if(GK.p[1]<c)return;GK.p[1]-=c;GK.rx++;window.CK.mult=(window.CK.mult||1)+10;gkSave();window.ckSave();nucRender();});
}
nucRender();
var SBURL='https://bvyobeaxkeeatoaaljcz.supabase.co';
var SBKEY='sb_publishable_erwxcWrojnbTBb6UpYgq2w_n8nnzzmQ';
function sbHeaders(){return {'apikey':SBKEY,'Authorization':'Bearer '+SBKEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'};}
function sbPush(){
try{
if(!window.CK)return;
var nick=window.ckNick();
if(!nick||nick==='Гость')return;
var best=Math.min(window.CK.clicks||0,1e18);
var body={nick:nick,best:best,stage:window.ckStage?window.ckStage():0,rebirths:window.CK.rebirths||0,updated_at:new Date().toISOString()};
fetch(SBURL+'/rest/v1/leaderboard?on_conflict=nick',{method:'POST',headers:sbHeaders(),body:JSON.stringify([body])}).catch(function(){});
}catch(e){}
}
function sbPull(cb){
try{
fetch(SBURL+'/rest/v1/leaderboard?select=nick,best,stage,rebirths&order=best.desc&limit=10',{headers:{'apikey':SBKEY,'Authorization':'Bearer '+SBKEY}}).then(function(r){return r.ok?r.json():null;}).then(function(arr){
if(!arr||!arr.length){cb(null);return;}
var out=[],i;
for(i=0;i<arr.length;i++)out.push({nick:String(arr[i].nick||''),best:Number(arr[i].best)||0,stage:Number(arr[i].stage)||0,rebirths:Number(arr[i].rebirths)||0});
cb(out);
}).catch(function(){cb(null);});
}catch(e){cb(null);}
}
if(window.ckLbPush){var _oldPush=window.ckLbPush;window.ckLbPush=function(){_oldPush();sbPush();};}
var _renderLb=null;
function ckLbRenderCloud(){
var lbList=document.getElementById('ck-lb-list');
if(!lbList)return;
var me=window.ckNick();
sbPull(function(cloud){
var arr=[];
try{arr=window.ckLbList()||[];}catch(e){arr=[];}
if(cloud){
var map={};
var i;
for(i=0;i<arr.length;i++)map[arr[i].nick]=arr[i];
for(i=0;i<cloud.length;i++){
var c=cloud[i];
if(!map[c.nick]||map[c.nick].best<c.best)map[c.nick]=c;
}
arr=[];
for(var k2 in map)if(Object.prototype.hasOwnProperty.call(map,k2))arr.push(map[k2]);
arr.sort(function(a,b){return b.best-a.best;});
arr=arr.slice(0,10);
lbList.setAttribute('data-cloud','1');
}else{
lbList.removeAttribute('data-cloud');
}
var h='';
if(!arr.length)h='<div class=ck-lb-empty>Пока никто не играл</div>';
for(var j=0;j<arr.length;j++){
var md=j===0?'🥇':j===1?'🥈':j===2?'🥉':String(j+1);
var mine=arr[j].nick===me;
h+='<div class=ck-lb-row'+(mine?' me':'')+'><span class=p>'+md+'</span><span class=n>'+arr[j].nick+'</span><span class=s>'+window.fmtNum(arr[j].best)+'</span></div>';
}
lbList.innerHTML=h;
var me2=document.getElementById('ck-lb-me');
if(me2)me2.textContent='Твой ник: '+me+' · сейчас: '+window.fmtNum(window.CK.clicks)+(lbList.getAttribute('data-cloud')?' · ☁ онлайн':' · оффлайн');
});
}
var _ckLbBtnInt=setInterval(function(){
var lbBtn=document.getElementById('ck-lbbtn');
if(lbBtn&&!lbBtn.__ckCloud){
lbBtn.__ckCloud=1;
lbBtn.addEventListener('click',function(){setTimeout(ckLbRenderCloud,50);setTimeout(ckLbRenderCloud,1500);});
}
},800);
setInterval(function(){if(window.CK&&window.CK.clicks>0)sbPush();},30000);
if(!window.__ckProfCore){(function(){
var UIDKEY='spaceClicker_uid',PROFKEY='spaceClicker_pt';
function ckUid(){var u='';try{u=localStorage.getItem(UIDKEY)||'';}catch(e){}if(!u){var cs='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',i;u='';for(i=0;i<10;i++)u+=cs.charAt(Math.floor(Math.random()*cs.length));try{localStorage.setItem(UIDKEY,u);}catch(e){}}return u;}
var PT=0;
try{PT=Number(localStorage.getItem(PROFKEY))||0;}catch(e){}
setInterval(function(){if(!document.hidden)PT++;},1000);
setInterval(function(){try{localStorage.setItem(PROFKEY,String(PT));}catch(e){}},10000);
window.addEventListener('beforeunload',function(){try{localStorage.setItem(PROFKEY,String(PT));}catch(e){}});
function ckFmtPT(s){var d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60),sc=s%60;if(d>0)return d+'д '+h+'ч '+m+'м';if(h>0)return h+'ч '+m+'м '+sc+'с';if(m>0)return m+'м '+sc+'с';return sc+'с';}
window.__ckExtVer='v67';
var profBtn=document.getElementById('ck-profbtn');
if(!profBtn){profBtn=document.createElement('button');profBtn.id='ck-profbtn';profBtn.textContent='ПРОФИЛЬ';var _pI=setInterval(function(){var apP=document.getElementById('ck-actions');if(apP&&!document.getElementById('ck-profbtn')){apP.appendChild(profBtn);clearInterval(_pI);}},500);}
var prof=document.createElement('div');prof.id='ck-prof';prof.className='clicker-ui hidden';
var pbox=document.createElement('div');pbox.id='ck-prof-box';
pbox.appendChild(document.createElement('h2')).textContent='ПРОФИЛЬ';
var pava=document.createElement('div');pava.id='ck-prof-ava';pbox.appendChild(pava);
var pbody=document.createElement('div');pbody.id='ck-prof-body';pbox.appendChild(pbody);
var pclose=document.createElement('button');pclose.id='ck-close-prof';pclose.textContent='ЗАКРЫТЬ';pbox.appendChild(pclose);
prof.appendChild(pbox);document.body.appendChild(prof);
profBtn.addEventListener('click',function(){prof.classList.remove('hidden');profRender();});
pclose.addEventListener('click',function(){prof.classList.add('hidden');});
if(window.cssAdd){
window.cssAdd('#ck-profbtn{background:linear-gradient(135deg,#2a9d8f,#14532d);}');
window.cssAdd('#ck-prof{position:fixed;inset:0;z-index:9472;background:rgba(2,2,14,.88);display:flex;align-items:center;justify-content:center;font-family:monospace;}');
window.cssAdd('#ck-prof-box{width:min(440px,92vw);background:linear-gradient(160deg,#101a2a,#0a1420);border:2px solid #7fd4ff;border-radius:16px;padding:20px;color:#fff;text-align:center;box-sizing:border-box;max-height:90vh;overflow-y:auto;box-shadow:0 0 40px rgba(127,212,255,.15);}');
window.cssAdd('#ck-prof-box h2{margin:0 0 12px;color:#7fd4ff;letter-spacing:2px;}');
window.cssAdd('#ck-prof-ava{width:72px;height:72px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#7b2cbf,#3a86ff);box-shadow:0 0 24px rgba(80,130,255,.5);animation:ckProfPulse 3s ease-in-out infinite;position:relative;}');window.cssAdd('#ck-prof-ava::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(127,212,255,.3);animation:ckProfRing 3s ease-in-out infinite;}');window.cssAdd('@keyframes ckProfPulse{0%,100%{box-shadow:0 0 18px rgba(80,130,255,.4);}50%{box-shadow:0 0 30px rgba(123,44,191,.6);}}');window.cssAdd('@keyframes ckProfRing{0%,100%{transform:scale(1);opacity:.4;}50%{transform:scale(1.15);opacity:0;}}');
window.cssAdd('.ck-prof-row{display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#111634,#0d1230);border:1px solid #2b3672;border-radius:11px;padding:10px 12px;margin-bottom:8px;text-align:left;transition:border-color .2s,transform .15s;}');window.cssAdd('.ck-prof-row:hover{border-color:#3a86ff;transform:translateX(3px);}');
window.cssAdd('.ck-prof-l{width:64px;color:#8fa3e8;font-size:11px;letter-spacing:1px;flex:none;}');
window.cssAdd('.ck-prof-v{flex:1;font-weight:bold;font-size:14px;word-break:break-all;}');
window.cssAdd('#ck-prof-copy{background:linear-gradient(135deg,#3a86ff,#2563eb);border:none;border-radius:8px;color:#fff;padding:6px 10px;font-weight:bold;cursor:pointer;font-family:inherit;font-size:11px;flex:none;}');
window.cssAdd('#ck-close-prof{width:100%;background:#b3283c;border:none;border-radius:9px;padding:10px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
}
function profRender(){
var nick=window.ckNick?window.ckNick():'Гость';
pava.textContent=(nick.charAt(0)||'?').toUpperCase();
var rows='';
rows+='<div class=ck-prof-row><span class=ck-prof-l>НИК</span><span class=ck-prof-v>'+nick+' 🔒</span></div>';
rows+='<div class=ck-prof-row><span class=ck-prof-l>ID</span><span class=ck-prof-v id=ck-prof-id>'+ckUid()+'</span><button id=ck-prof-copy>КОПИРОВАТЬ</button></div>';
rows+='<div class=ck-prof-row><span class=ck-prof-l>В ИГРЕ</span><span class=ck-prof-v id=ck-prof-pt>'+ckFmtPT(PT)+'</span></div>';
pbody.innerHTML=rows;
var cb=document.getElementById('ck-prof-copy');
if(cb)cb.addEventListener('click',function(){
var idv=document.getElementById('ck-prof-id').textContent;
try{navigator.clipboard.writeText(idv).then(function(){if(window.ckToast)window.ckToast('ID скопирован');},function(){});}catch(e){}
});
}
setInterval(function(){
if(prof.classList.contains('hidden'))return;
var el0=document.getElementById('ck-prof-pt');
if(el0)el0.textContent=ckFmtPT(PT);
},1000);
})();
}
window.__ckExtVer='v75';
setInterval(function(){var ve0=document.getElementById('ck-ver');if(ve0&&window.__ckExtVer&&ve0.textContent.indexOf('ext')===-1)ve0.textContent+=' · ext '+window.__ckExtVer;},2000);
console.log('[LB-DBG] === START ===');
console.log('[LB-DBG] 1.EXT-VER='+(window.__ckExtVer||'NONE'));
console.log('[LB-DBG] 2.NICK='+window.ckNick());
fetch('https://bvyobeaxkeeatoaaljcz.supabase.co/rest/v1/leaderboard?select=*&order=best.desc&limit=5',{headers:{'apikey':'sb_publishable_erwxcWrojnbTBb6UpYgq2w_n8nnzzmQ','Authorization':'Bearer sb_publishable_erwxcWrojnbTBb6UpYgq2w_n8nnzzmQ'}}).then(function(r){console.log('[LB-DBG] 4.SB-READ status='+r.status);return r.json();}).then(function(a){console.log('[LB-DBG] 4.SB-DATA='+JSON.stringify(a));}).catch(function(e){console.log('[LB-DBG] 4.SB-READ ERR='+e.message);});
console.log('[LB-DBG] 5.LOCAL-LB='+localStorage.getItem('spaceClicker_lb_v2'));
console.log('[LB-DBG] 6.NICK-REG='+localStorage.getItem('spaceClicker_nick_reg'));
console.log('[LB-DBG] === END ===');
/*__CKEXT__*/
(function(){function admGrant(){
if(!window.CK||!document.getElementById('ck-admin-modal')){setTimeout(admGrant,300);return;}
if(document.getElementById('ck-give-box'))return;
var CK=window.CK;
var IT=['shard','core','prism','nova','void'];
var BS=['frenzy','surge','gold','novaflask','quasar','hyperion','voidflask','pstorm','chrono','abyss','supernova','singularity','aether','godtear'];
function num(v){var s=String(v||'').trim().toUpperCase();if(!s)return 0;var m=1,l=s.charAt(s.length-1);if(l<'0'||l>'9'){m=({K:1e3,M:1e6,B:1e9,T:1e12,Q:1e15})[l]||1;s=s.slice(0,-1);}var n=parseFloat(s);return isNaN(n)?0:Math.floor(n*m);}
function gs(){try{window.ckSave();}catch(e){}try{window.render(true);}catch(e2){}}
function row(lbl,f1,f2){var r=document.createElement('div');r.style.cssText='display:flex;gap:6px;align-items:center;margin:7px 0;flex-wrap:wrap;';var s=document.createElement('span');s.style.cssText='flex:1;min-width:130px;font:bold 12px monospace;color:#e5e7eb;';s.textContent=lbl;var i1=document.createElement('input');i1.type='text';i1.style.cssText='flex:1;min-width:90px;max-width:150px;padding:6px 8px;border:1px solid #4b5563;border-radius:8px;background:#0b1026;color:#fff;font:12px Consolas;';var i2=null;if(f2){i2=document.createElement('input');i2.type='text';i2.placeholder=f2;i2.style.cssText=i1.style.cssText;}var b=document.createElement('button');b.textContent='ВЫДАТЬ';b.style.cssText='background:linear-gradient(135deg,#3a86ff,#7b2cbf);border:none;border-radius:8px;padding:7px 12px;font-weight:bold;color:#fff;cursor:pointer;';b.addEventListener('click',function(){if(f2){f1(i1.value,i2.value);i2.value='';}else{f1(i1.value);i1.value='';}});r.appendChild(s);r.appendChild(i1);if(i2)r.appendChild(i2);r.appendChild(b);return r;}
var box=document.createElement('div');box.id='ck-give-box';box.style.cssText='border-top:1px solid #4b5563;margin-top:14px;padding-top:10px;';
var h=document.createElement('div');h.style.cssText='text-align:center;font:900 14px monospace;color:#fca5a5;margin-bottom:6px;';h.textContent='ВЫДАЧА РЕСУРСОВ';box.appendChild(h);
var nt=document.createElement('div');nt.style.cssText='text-align:center;font:10px monospace;color:#9ca3af;margin-bottom:6px;';nt.textContent='число или 100K/5M/2B/1T; апгрейд ID 0-359; предметы shard/core/prism/nova/void; буст id+сек (макс 3600)';box.appendChild(nt);
box.appendChild(row('Клики (число/100K/1B/100Qi)',function(v){var n=num(v);if(n>0){CK.clicks=(CK.clicks||0)+n;gs();if(window.ckToast)window.ckToast('Выдано кликов: +'+n);}}));
box.appendChild(row('Перерождения (+2x к множ)',function(v){var n=num(v);if(n>0){CK.rebirths=(CK.rebirths||0)+n;CK.mult=(CK.mult||1)+2*n;gs();if(window.ckToast)window.ckToast('Выдано реберфов: +'+n);}}));
box.appendChild(row('ИКСЫ (чистый множитель)',function(v){var n=num(v);if(n>0){CK.mult=(CK.mult||1)+n;gs();if(window.ckToast)window.ckToast('Множитель увеличен на: +'+n);}}));
box.appendChild(row('МЕГА (+50x за каждое)',function(v){var n=num(v);if(n>0){var X=window.__CKEX=window.__CKEX||{};X.megaCount=(X.megaCount||0)+n;CK.mult=(CK.mult||1)+50*n;gs();if(window.ckToast)window.ckToast('Выдано МЕГА: +'+n);}}));
box.appendChild(row('СУПЕР (+10000x за каждое)',function(v){var n=num(v);if(n>0){var X=window.__CKEX=window.__CKEX||{};X.superCount=(X.superCount||0)+n;CK.mult=(CK.mult||1)+10000*n;gs();if(window.ckToast)window.ckToast('Выдано СУПЕР: +'+n);}}));
box.appendChild(row('Апгрейд ID + уровни',function(a,b){var id=parseInt(a,10),n=num(b);if(!(id>=0&&id<360)||n<=0)return;CK.lv[id]=(CK.lv[id]||0)+n;gs();},'уровней'));
box.appendChild(row('Предмет (shard/core/prism/nova/void)',function(a,b){var id=String(a||'').trim().toLowerCase(),n=num(b)||1;if(IT.indexOf(id)<0)return;var q;for(q=0;q<Math.min(n,2000);q++)CK.inv.push(id);if(CK.inv.length>2000)CK.inv=CK.inv.slice(-2000);gs();try{window.ckInvRender();}catch(e3){}},'кол-во шт'));
box.appendChild(row('Буст ID (godtear/gold/abyss/...)',function(a,b){var id=String(a||'').trim().toLowerCase(),n=num(b)||3600;if(BS.indexOf(id)<0||n<=0)return;var now=Date.now();CK.boost=CK.boost||{};CK.boost[id]=Math.min(now+Math.min(n,3600)*1000,now+3600*1000);gs();},'сек (до 3600)'));

/* БЫСТРЫЕ ЧИТЫ И РЕСУРСЫ НОВЫХ СИСТЕМ */
var fastRow=document.createElement('div');
fastRow.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;';
function mkQuickBtn(lbl,bg,fn){
  var b=document.createElement('button');
  b.textContent=lbl;
  b.style.cssText='padding:8px 6px;border:none;border-radius:8px;font:bold 11px Consolas;color:#fff;background:'+bg+';cursor:pointer;transition:transform .12s;';
  b.addEventListener('click',fn);
  fastRow.appendChild(b);
}
mkQuickBtn('ВСЕ ПРЕДМЕТЫ ПО x50','linear-gradient(135deg,#06b6d4,#0284c7)',function(){
  ['shard','core','prism','nova','void'].forEach(function(it){
    for(var i=0;i<50;i++)CK.inv.push(it);
  });
  gs();try{window.ckInvRender();}catch(e){}
  if(window.ckToast)window.ckToast('Выдано по 50 шт каждого предмета!');
});
mkQuickBtn('ВСЕ БУСТЕРЫ НА 1 ЧАС','linear-gradient(135deg,#eab308,#ca8a04)',function(){
  var now=Date.now();CK.boost=CK.boost||{};
  BS.forEach(function(bId){ CK.boost[bId]=now+3600*1000; });
  gs();if(window.ckToast)window.ckToast('Активированы ВСЕ 14 бустеров!');
});
mkQuickBtn('ОТКРЫТЬ ВСЕХ ПИТОМЦЕВ','linear-gradient(135deg,#10b981,#059669)',function(){
  if(window.__CK_FEAT){
    window.__CK_FEAT.pets=window.__CK_FEAT.pets||{};
    ['pet_drone','pet_wisp','pet_dragon','pet_phoenix'].forEach(function(p){ window.__CK_FEAT.pets[p]=true; });
    try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
  }
  gs();if(window.ckToast)window.ckToast('Все 3D-питомцы разблокированы!');
});
mkQuickBtn('МАКС. ДЕРЕВО НАВЫКОВ','linear-gradient(135deg,#6366f1,#4f46e5)',function(){
  if(window.__CK_FEAT){
    window.__CK_FEAT.skillTree={
      crit:{crit_chance:5,crit_damage:5,crit_overload:3},
      income:{inc_mult:5,inc_dps:5,inc_warp:3},
      drop:{drop_luck:5,drop_void:5,drop_omni:1}
    };
    try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
  }
  gs();if(window.ckToast)window.ckToast('Дерево навыков прокачано на максимум!');
});
<<<<<<< Updated upstream
=======
<<<<<<< HEAD
mkQuickBtn('СЕЗОН: 100 УР + ПРЕМИУМ','linear-gradient(135deg,#f59e0b,#b45309)',function(){
  if(window.__CK_FEAT){
    window.__CK_FEAT.season=window.__CK_FEAT.season||{};
    window.__CK_FEAT.season.xp=10000000;
    window.__CK_FEAT.season.premium=true;
    try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
  }
  gs();if(window.ckToast)window.ckToast('Сезонный пропуск: 100 ур. и Премиум открыт!');
=======
>>>>>>> Stashed changes
mkQuickBtn('СЕЗОН: 30 УР + ПРЕМИУМ','linear-gradient(135deg,#f59e0b,#b45309)',function(){
  if(window.__CK_FEAT){
    window.__CK_FEAT.season=window.__CK_FEAT.season||{};
    window.__CK_FEAT.season.xp=30000;
    window.__CK_FEAT.season.premium=true;
    try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
  }
  gs();if(window.ckToast)window.ckToast('Сезонный пропуск: 30 ур. и Премиум открыт!');
<<<<<<< Updated upstream
=======
>>>>>>> 136d541ab1ffce30fa1d0ce5b50512e530cb8740
>>>>>>> Stashed changes
});
mkQuickBtn('ЗАКРЫТЬ ВСЕ АЧИВКИ','linear-gradient(135deg,#ec4899,#be185d)',function(){
  if(window.__CK_FEAT&&Array.isArray(window.__CK_FEAT.achievements)){
    window.__CK_FEAT.achievements.forEach(function(a){ a.done=true; a.claim=true; });
    window.__CK_FEAT.stats.permGoldBonus=100;
    try{localStorage.setItem('spaceClicker_features_v1',JSON.stringify(window.__CK_FEAT));}catch(e){}
  }
  gs();if(window.ckToast)window.ckToast('Все достижения выполнены и получены!');
});
box.appendChild(fastRow);
var ab=document.getElementById('ck-admin-box');(ab||document.getElementById('ck-admin-modal')).appendChild(box);}
admGrant();
setInterval(function(){
  var m=document.getElementById('ck-admin-modal');
  if(m && !m.classList.contains('hidden') && !document.getElementById('ck-give-box')){
    admGrant();
  }
},800);
})();