/* clicker_premium.js v93 — Premium Store */
(function(){
if(window.__ckPremium) return;
window.__ckPremium=1;
var pmI=setInterval(function(){
if(!window.__CKEX) return;
clearInterval(pmI);
initPremium();
},400);
function initPremium(){
var css=[];
css.push('#ck-premium{position:fixed;inset:0;z-index:9473;background:rgba(5,3,10,.94);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;}');
css.push('#ck-premium-box{width:min(560px,94vw);max-height:90vh;overflow-y:auto;background:radial-gradient(ellipse 400px 200px at 15% 0%,rgba(255,210,63,.12),transparent 60%),radial-gradient(ellipse 400px 200px at 85% 100%,rgba(255,45,149,.1),transparent 60%),linear-gradient(165deg,#120a20,#1a1030 50%,#0a0612);border:2px solid #ffd23f;border-radius:20px;padding:26px 28px;color:#fff;box-sizing:border-box;box-shadow:0 30px 90px rgba(0,0,0,.85),0 0 100px rgba(255,210,63,.12);}');
css.push('#ck-premium-box h2{margin:0 0 14px;display:flex;align-items:center;gap:14px;font-family:Segoe UI,sans-serif;font-size:24px;letter-spacing:3px;background:linear-gradient(100deg,#fff3c4,#ffd23f 25%,#ff9de2 50%,#ff2d95 75%,#ffd23f);background-size:250% 250%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ckPmT2 4s ease infinite;}');
css.push('#ck-premium-box h2::before,#ck-premium-box h2::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,#ffd23f88);min-width:30px;}');
css.push('#ck-premium-box h2::after{background:linear-gradient(90deg,#ffd23f88,transparent);}');
css.push('@keyframes ckPmT2{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}');
css.push('.ck-pm-sub{text-align:center;font-style:italic;font-size:13.5px;color:#e8c9d8;letter-spacing:2px;margin-bottom:18px;}');
css.push('.ck-pm-res{font-family:Consolas,monospace;font-size:16px;font-weight:bold;letter-spacing:1px;color:#ffe9a8;margin-bottom:16px;padding:13px;border-radius:12px;border:1.5px solid #ffd23f88;background:linear-gradient(160deg,rgba(255,210,63,.14),rgba(255,45,149,.09));box-shadow:0 0 20px rgba(255,210,63,.18),inset 0 1px 0 rgba(255,255,255,.15);animation:ckResPulse 2.4s ease-in-out infinite;text-align:center;}');
css.push('@keyframes ckResPulse{0%,100%{box-shadow:0 0 16px rgba(255,210,63,.15)}50%{box-shadow:0 0 32px rgba(255,210,63,.3)}}');
css.push('.ck-pm-card{position:relative;overflow:hidden;background:linear-gradient(165deg,rgba(35,25,60,.96),rgba(18,12,36,.96));border:1.5px solid rgba(255,210,63,.5);border-radius:16px;padding:16px 18px;margin-bottom:14px;transition:transform .2s,box-shadow .2s,border-color .2s;}');
css.push('.ck-pm-card:hover{transform:translateY(-4px);border-color:#ffd23f;box-shadow:0 16px 40px rgba(0,0,0,.6),0 0 34px rgba(255,210,63,.35);}');
css.push('.ck-pm-card::after{content:"";position:absolute;bottom:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,#ffd23f66,transparent);}');
css.push('.ck-pm-card b{font-size:16px;color:#ffd23f;display:block;margin-bottom:3px;letter-spacing:1px;}');
css.push('.ck-pm-card small{display:block;color:#c9bfa0;font-size:12px;line-height:1.5;margin-bottom:10px;}');
css.push('.ck-pm-lv{display:inline-block;background:linear-gradient(135deg,rgba(255,210,63,.2),rgba(255,45,149,.15));border:1px solid rgba(255,210,63,.35);border-radius:8px;padding:3px 11px;font-size:12px;font-weight:bold;color:#ffd23f;margin-bottom:10px;}');
css.push('.ck-pm-buy{width:100%;padding:12px;border:none;border-radius:11px;background:linear-gradient(135deg,#ffd23f,#e0a52e 60%,#c98a1e);color:#241c04;font-family:inherit;font-weight:bold;font-size:14px;letter-spacing:1px;cursor:pointer;transition:transform .15s,filter .15s,box-shadow .2s;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(255,210,63,.35),inset 0 1px 0 rgba(255,255,255,.4);}');
css.push('.ck-pm-buy::before{content:"";position:absolute;top:0;left:-60%;width:35%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:ckPmBtnSh 2.8s linear infinite;}');
css.push('@keyframes ckPmBtnSh{0%{left:-60%}100%{left:120%}}');
css.push('.ck-pm-buy:hover{transform:translateY(-2px);filter:brightness(1.1);box-shadow:0 8px 26px rgba(255,210,63,.55),0 0 30px rgba(255,210,63,.3) !important;}');
css.push('.ck-pm-buy:active{transform:scale(.97);}');
css.push('.ck-pm-buy:disabled{opacity:.4;cursor:default;transform:none;filter:none;box-shadow:none;}');
css.push('#ck-close-pm{width:100%;margin-top:14px;padding:15px;background:linear-gradient(135deg,#3a1245,#1a0b2e 55%,#3a1245);border:2px solid #ffd23f;border-radius:14px;color:#ffd23f;font-family:Segoe UI,sans-serif;font-weight:800;font-size:15px;letter-spacing:4px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,210,63,.25);transition:transform .15s,box-shadow .25s;}');
css.push('#ck-close-pm:hover{background:linear-gradient(135deg,#4d1a58,#2a1040 55%,#4d1a58);transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.55),0 0 26px rgba(255,210,63,.4);}');
css.push('#ck-close-pm:active{transform:scale(.97);}');
css.push('#ck-pmbtn{background:linear-gradient(135deg,#ffd23f,#b8860b) !important;color:#241c04 !important;box-shadow:0 0 18px rgba(255,210,63,.55) !important;}');
css.push('#ck-don-div{display:flex;align-items:center;gap:10px;margin:18px 0 14px;}');
css.push('#ck-don-div .l{flex:1;height:1px;background:linear-gradient(90deg,transparent,#ffd23f88);}');
css.push('#ck-don-div .r{flex:1;height:1px;background:linear-gradient(90deg,#ffd23f88,transparent);}');
css.push('#ck-don-div .d{width:8px;height:8px;background:#ffd23f;transform:rotate(45deg);box-shadow:0 0 8px #ffd23f;}');
var st=document.createElement('style');
st.textContent=css.join('');
document.head.appendChild(st);
var pmBtn=document.createElement('button');
pmBtn.id='ck-pmbtn';
pmBtn.textContent='ПРЕМИУМ';
var pmInserted=false;
var pmI2=setInterval(function(){
var ap=document.getElementById('ck-actions');
if(ap&&!pmInserted){ap.appendChild(pmBtn);pmInserted=true;clearInterval(pmI2);}
},400);
var pm=document.createElement('div');
pm.id='ck-premium';
pm.className='clicker-ui hidden';
var box=document.createElement('div');
box.id='ck-premium-box';
var h2=document.createElement('h2');
h2.textContent='ПРЕМИУМ МАГАЗИН';
box.appendChild(h2);
var sub=document.createElement('div');
sub.className='ck-pm-sub';
sub.textContent='Эксклюзивные усиления за МЕГА-перерождения';
box.appendChild(sub);
var dv=document.createElement('div');
dv.id='ck-don-div';
dv.innerHTML='<span class=l></span><span class=d></span><span class=r></span>';
box.appendChild(dv);
var res=document.createElement('div');
res.className='ck-pm-res';
box.appendChild(res);
var grid=document.createElement('div');
box.appendChild(grid);
var close=document.createElement('button');
close.id='ck-close-pm';
close.textContent='ЗАКРЫТЬ';
box.appendChild(close);
pm.appendChild(box);
document.body.appendChild(pm);
function avail(){try{var _x=window.__CKEX||{};return Math.max(0,(_x.megaCount||0)-(_x.pmSpent||0));}catch(e){return 0;}}
function pmRender(){
if(pm.classList.contains('hidden'))return;
res.textContent='Доступно МЕГА-перерождений: '+avail();
while(grid.firstChild)grid.removeChild(grid.firstChild);
var card=document.createElement('div');
card.className='ck-pm-card';
var b=document.createElement('b');
b.textContent='PERK: Rebirth+';
card.appendChild(b);
var lv=document.createElement('span');
lv.className='ck-pm-lv';
lv.textContent='ур. '+(window.__CKEX.rebirthGain||0)+'/50';
card.appendChild(lv);
var sm=document.createElement('small');
sm.textContent='Каждое обычное перерождение даёт +1 перерождение дополнительно (и иксы x2 за него). Стакается.';
card.appendChild(sm);
var buy=document.createElement('button');
buy.className='ck-pm-buy';
buy.textContent='КУПИТЬ (100 МЕГА)';
buy.disabled=avail()<100||(window.__CKEX.rebirthGain||0)>=50;
if((window.__CKEX.rebirthGain||0)>=50)buy.textContent='МАКСИМУМ';
buy.addEventListener('click',function(){
var av=avail();
if(av<100||(window.__CKEX.rebirthGain||0)>=50)return;
window.__CKEX.pmSpent=(window.__CKEX.pmSpent||0)+100;
window.CK.rbSpent=window.__CKEX.rbSpent;
window.__CKEX.rebirthGain=(window.__CKEX.rebirthGain||0)+1;
if(window.ckSndPlay)window.ckSndPlay('meg');
if(window.ckToast)window.ckToast('КУПЛЕНО: Rebirth+');
if(window.ckSave)window.ckSave();
pmRender();
if(window.render)window.render(true);
});
card.appendChild(buy);
grid.appendChild(card);
}
pmBtn.addEventListener('click',function(){pm.classList.remove('hidden');pmRender();});
close.addEventListener('click',function(){pm.classList.add('hidden');});
setInterval(function(){
if(pm.classList.contains('hidden'))return;
var rEl=box.querySelector('.ck-pm-res');
if(rEl)rEl.textContent='Доступно МЕГА-перерождений: '+avail();
},900);
}
})();