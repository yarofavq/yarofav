(function(){
var KEY='spaceClicker_ext_v1',LB2='spaceClicker_lb_v2';
var EX={rbSpent:0,rbAuto:0,nexus:0,idol:0,forge:0,offVault:0,craft:{s:0,c:0,m:0,g:0,v:0}};
function sv(){try{localStorage.setItem(KEY,JSON.stringify(EX));}catch(e){}}
function boot(){
if(!window.__CKAPI||!window.__CKAPI.CK_UPG||window.__CKAPI.CK_UPG.length<360){setTimeout(boot,60);return;}
var A=window.__CKAPI;window.CK=A.CK;window.CK_UPG=A.CK_UPG;window.ckSave=A.ckSave;window.ckNick=A.ckNick;window.ckStage=A.ckStage;window.render=A.render;window.renderShop=A.renderShop;window.cssAdd=A.cssAdd;window.fmtNum=A.fmtNum;window.sfxBuy=A.sfxBuy;window.sfxRebirth=A.sfxRebirth;window.ckToast=A.ckToast;window.ckInvRender=A.ckInvRender;window.ckUpgCost=A.ckUpgCost;window.ckLbPush=A.ckLbPush;
var CK=window.CK;
try{
if(localStorage.getItem('spaceClicker_wiped')!=='4'){
localStorage.removeItem(LB2);
localStorage.removeItem(KEY);
CK.rbSpent=0;CK.laser=false;CK.earth=false;CK.gold=false;CK.critM=false;CK.warp=false;
localStorage.removeItem('spaceClicker_v1');
localStorage.removeItem('spaceClicker_lb_v1');
CK.clicks=0;CK.mult=1;CK.rebirths=0;CK.boost={};CK.inv=[];CK.mc=0;CK.lv=[];
for(var z=0;z<360;z++)CK.lv.push(0);
localStorage.setItem('spaceClicker_wiped','4');
}
}catch(e){}
var svd=null;
try{svd=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
if(svd&&typeof svd==='object'){
EX.rbSpent=Number(svd.rbSpent)||0;EX.rbAuto=!!svd.rbAuto;EX.nexus=!!svd.nexus;EX.idol=!!svd.idol;EX.forge=!!svd.forge;EX.offVault=!!svd.offVault;
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
window.ckLbList=function(){var all={},arr=[],k;try{all=JSON.parse(localStorage.getItem(LB2)||'{}');}catch(e){}for(k in all)if(Object.prototype.hasOwnProperty.call(all,k))arr.push({nick:k,best:all[k].best||0,stage:all[k].stage||0,rebirths:all[k].rebirths||0});arr.sort(function(a,b){return b.best-a.best;});return arr.slice(0,10);};
var _s=window.ckSave;
window.ckSave=function(){CK.rbSpent=EX.rbSpent;CK.nexus=EX.nexus;CK.idol=EX.idol;CK.forge=EX.forge;CK.offVault=EX.offVault;CK.craft=EX.craft;sv();if(_s)_s();};
if(window.render)window.render(true);
}
boot();
})();
function extPhase2(){
var EX=window.__CKEX;
function sv(){try{localStorage.setItem('spaceClicker_ext_v1',JSON.stringify(EX));}catch(e){}}
function mAvail(){return (window.CK.rebirths||0)-(EX.rbSpent||0)*10;}
function ckReset(){var CK=window.CK;CK.clicks=0;CK.lv=[];for(var z=0;z<360;z++)CK.lv.push(0);}
var megaBtn=document.createElement('button');megaBtn.id='ck-megareb';megaBtn.textContent='МЕГА x50 (0/10)';
var acts=document.getElementById('ck-actions');
if(acts)acts.appendChild(megaBtn);
function updMega(){var a=mAvail();megaBtn.disabled=a<10;megaBtn.textContent='МЕГА x50 ('+a+'/10)';}
megaBtn.addEventListener('click',function(){
if(mAvail()<10)return;
window.CK.mult*=50;EX.rbSpent++;window.CK.rbSpent=EX.rbSpent;ckReset();
if(window.sfxRebirth)window.sfxRebirth();
if(window.ckToast)window.ckToast('МЕГА-ПЕРЕРОЖДЕНИЕ: x50');
window.ckSave();if(window.render)window.render(true);updMega();
});
setInterval(updMega,900);updMega();
var arbBtn=document.createElement('button');arbBtn.id='ck-ap-rb';arbBtn.className='ck-apbtn apb-rb'+(EX.rbAuto?' on':'');arbBtn.textContent='АВТО-РЕБЕРФ: '+(EX.rbAuto?'ВКЛ':'ВЫКЛ');
var ap=document.getElementById('ck-autop');
if(ap)ap.appendChild(arbBtn);
arbBtn.addEventListener('click',function(){EX.rbAuto=!EX.rbAuto;arbBtn.className='ck-apbtn apb-rb'+(EX.rbAuto?' on':'');arbBtn.textContent='АВТО-РЕБЕРФ: '+(EX.rbAuto?'ВКЛ':'ВЫКЛ');sv();});
setInterval(function(){
if(!EX.rbAuto)return;
if(window.CK.clicks>=1e14){window.CK.mult*=2;window.CK.rebirths++;ckReset();if(window.sfxRebirth)window.sfxRebirth();if(window.ckToast)window.ckToast('АВТО-РЕБЕРФ: x2');window.ckSave();if(window.render)window.render(true);}
},1000);
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
}
}
if(window.__CKEX){extPhase2();}
else{var wt2=setInterval(function(){if(window.__CKEX){clearInterval(wt2);extPhase2();}},60);}
/*__CKEXT__*/
