var fs=require('fs');
var B='C:/Users/YAROFAV/Downloads/tg_landing_v6/yarofav/';
var f=B+'clicker_premium.js';
var s=fs.readFileSync(f,'utf8');
if(s.indexOf('ckDonDiv')!==-1){console.log('ALREADY');process.exit(0);}
var c=[];
c.push('#ck-premium-box{background:radial-gradient(ellipse 400px 200px at 15% 0%,rgba(255,210,63,.12),transparent 60%),radial-gradient(ellipse 400px 200px at 85% 100%,rgba(255,45,149,.1),transparent 60%),linear-gradient(165deg,#120a20,#1a1030 50%,#0a0612) !important;box-shadow:0 30px 90px rgba(0,0,0,.85),0 0 100px rgba(255,210,63,.12) !important;padding:26px 28px !important;}');
c.push('#ck-premium-box h2{display:flex;align-items:center;gap:14px !important;font-size:24px !important;}');
c.push('#ck-premium-box h2::before,#ck-premium-box h2::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,#ffd23f88);min-width:30px;}');
c.push('#ck-premium-box h2::after{background:linear-gradient(90deg,#ffd23f88,transparent);}');
c.push('.ck-pm-res{font-size:16px !important;padding:13px !important;border-radius:12px !important;border:1.5px solid #ffd23f88 !important;animation:ckResPulse 2.4s ease-in-out infinite !important;}');
c.push('@keyframes ckResPulse{0%,100%{box-shadow:0 0 16px rgba(255,210,63,.15)}50%{box-shadow:0 0 32px rgba(255,210,63,.3)}}');
c.push('.ck-pm-card{padding:16px 18px !important;border-radius:16px !important;border:1.5px solid rgba(255,210,63,.5) !important;}');
c.push('.ck-pm-card::after{content:"";position:absolute;bottom:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,#ffd23f66,transparent);}');
c.push('.ck-pm-card:hover{transform:translateY(-4px) !important;box-shadow:0 16px 40px rgba(0,0,0,.6),0 0 34px rgba(255,210,63,.35) !important;border-color:#ffd23f !important;}');
c.push('.ck-pm-card b{font-size:16px !important;letter-spacing:1px !important;}');
c.push('.ck-pm-buy{padding:12px !important;font-size:14px !important;border-radius:11px !important;position:relative !important;overflow:hidden !important;}');
c.push('.ck-pm-buy::before{content:"";position:absolute;top:0;left:-60%;width:35%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:ckPmBtnSh 2.8s linear infinite;}');
c.push('@keyframes ckPmBtnSh{0%{left:-60%}100%{left:120%}}');
c.push('.ck-pm-buy:hover{box-shadow:0 8px 26px rgba(255,210,63,.55) !important;}');
c.push('#ck-don-div{display:flex;align-items:center;gap:10px;margin:18px 0 14px;}');
c.push('#ck-don-div .l{flex:1;height:1px;background:linear-gradient(90deg,transparent,#ffd23f88);}');
c.push('#ck-don-div .r{flex:1;height:1px;background:linear-gradient(90deg,#ffd23f88,transparent);}');
c.push('#ck-don-div .d{width:8px;height:8px;background:#ffd23f;transform:rotate(45deg);box-shadow:0 0 8px #ffd23f;}');
var add=String.fromCharCode(10);
for(var k=0;k<c.length;k++)add+='cssAdd('+String.fromCharCode(39)+c[k]+String.fromCharCode(39)+');'+String.fromCharCode(10);
var anchor='var st=document.createElement('+String.fromCharCode(39)+'style'+String.fromCharCode(39)+');';
if(s.indexOf(anchor)===-1){console.log('ANCHOR MISS');process.exit(1);}
s=s.split(anchor).join(add+String.fromCharCode(10)+anchor);
var sub2="sub.textContent='Эксклюзивные усиления за МЕГА-перерождения';";
var divAdd=sub2+"\nvar dv=document.createElement('div');dv.id='ck-don-div';dv.innerHTML='<span class=l></span><span class=d></span><span class=r></span>';pbox.appendChild(dv);";
if(s.indexOf('ckDonDiv')!==-1){console.log('DON ALREADY');}else{s=s.split(sub2).join(divAdd);}
fs.writeFileSync(f,s);
console.log('don-style applied');
