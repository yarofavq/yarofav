/**
 * PLANET CLICKER - ADVANCED FEATURES MODULE (VCA)
 * Block 1: Daily Quests & Achievements Engine
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'spaceClicker_features_v1';
  var FEAT = {
    dailyDate: '',
    daily: [
      { id: 'd_clicks', desc: 'Сделать 10,000 кликов', target: 10000, prog: 0, done: false, claim: false, rew: { type: 'mult', val: 5, label: '+5 к множителю' } },
      { id: 'd_voids', desc: 'Собрать 5 Пустот', target: 5, prog: 0, done: false, claim: false, rew: { type: 'item', id: 'nova', cnt: 2, label: '+2 Новы' } },
      { id: 'd_rebirth', desc: 'Совершить 3 реберфа', target: 3, prog: 0, done: false, claim: false, rew: { type: 'boost', id: 'gold', dur: 1800, label: 'Gold Rush на 30м' } }
    ],
    achievements: [
      { id: 'a_clk_1k', cat: 'clicks', title: 'Первая искра', desc: '1,000 кликов', target: 1000, done: false, claim: false, rew: '+2x Множитель', rewType: 'mult', rewVal: 2 },
      { id: 'a_clk_10k', cat: 'clicks', title: 'Кликер-машина', desc: '10,000 кликов', target: 10000, done: false, claim: false, rew: '+5x Множитель', rewType: 'mult', rewVal: 5 },
      { id: 'a_clk_100k', cat: 'clicks', title: 'Сверхзвуковой палец', desc: '100,000 кликов', target: 100000, done: false, claim: false, rew: '+20x Множитель', rewType: 'mult', rewVal: 20 },
      { id: 'a_void_1', cat: 'voids', title: 'Прикосновение к бездне', desc: 'Собрать 1 Пустоту', target: 1, done: false, claim: false, rew: '+10% ко всему навсегда', rewType: 'perm_gold', rewVal: 10 },
      { id: 'a_void_5', cat: 'voids', title: 'Повелитель сингулярности', desc: 'Собрать 5 Пустот', target: 5, done: false, claim: false, rew: '+50% ко всему навсегда', rewType: 'perm_gold', rewVal: 50 },
      { id: 'a_rb_1', cat: 'rebirths', title: 'Новый цикл', desc: 'Совершить 1 перерождение', target: 1, done: false, claim: false, rew: '+10x Множитель', rewType: 'mult', rewVal: 10 },
      { id: 'a_rb_10', cat: 'rebirths', title: 'Космический феникс', desc: 'Совершить 10 перерождений', target: 10, done: false, claim: false, rew: '+100x Множитель', rewType: 'mult', rewVal: 100 },
      { id: 'a_rb_50', cat: 'rebirths', title: 'Вечный архитектор', desc: 'Совершить 50 перерождений', target: 50, done: false, claim: false, rew: '+500x Множитель', rewType: 'mult', rewVal: 500 }
    ],
    stats: {
      totalManualClicks: 0,
      totalVoidsCollected: 0,
      totalRebirthsCompleted: 0,
      permGoldBonus: 0
    }
  };

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        if (raw.stats) Object.assign(FEAT.stats, raw.stats);
        if (Array.isArray(raw.achievements)) {
          raw.achievements.forEach(function (saved) {
            var cur = FEAT.achievements.find(function (a) { return a.id === saved.id; });
            if (cur) { cur.done = !!saved.done; cur.claim = !!saved.claim; }
          });
        }
        FEAT.dailyDate = raw.dailyDate || '';
        if (Array.isArray(raw.daily) && FEAT.dailyDate === getTodayStr()) {
          raw.daily.forEach(function (savedD) {
            var cd = FEAT.daily.find(function (d) { return d.id === savedD.id; });
            if (cd) { cd.prog = Number(savedD.prog) || 0; cd.done = !!savedD.done; cd.claim = !!savedD.claim; }
          });
        }
        if (raw.pets) FEAT.pets = raw.pets;
        if (raw.skills) FEAT.skills = raw.skills;
        if (raw.season) FEAT.season = raw.season;
      }
    } catch (e) {}
    checkDailyReset();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(FEAT));
      if (window.saveGame) window.saveGame();
    } catch (e) {}
  }

  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function checkDailyReset() {
    var today = getTodayStr();
    if (FEAT.dailyDate !== today) {
      FEAT.dailyDate = today;
      FEAT.daily.forEach(function (d) {
        d.prog = 0;
        d.done = false;
        d.claim = false;
      });
      saveState();
    }
  }

  function injectStyles() {
    if (!window.cssAdd) return;
    window.cssAdd('#ck-achbtn{background:linear-gradient(135deg,#eab308,#ca8a04 45%,#854d0e);box-shadow:0 0 16px rgba(234,179,8,.45);}');
    window.cssAdd('#ck-ach-modal{position:fixed;inset:0;z-index:9475;background:rgba(2,2,14,.88);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(14px);}');
    window.cssAdd('#ck-ach-box{width:min(640px,94vw);max-height:88vh;overflow-y:auto;background:linear-gradient(170deg,#0e152e,#080b1a);border:2px solid #eab308;border-radius:20px;padding:22px;color:#fff;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.8),0 0 40px rgba(234,179,8,.25);}');
    window.cssAdd('#ck-ach-box h2{margin:0 0 16px;text-align:center;color:#fde047;letter-spacing:2.5px;font-size:20px;}');
    window.cssAdd('.ck-ach-section-title{font-size:13px;font-weight:800;color:#93c5fd;letter-spacing:1.5px;text-transform:uppercase;margin:14px 0 8px;border-bottom:1px solid rgba(147,197,253,.25);padding-bottom:4px;}');
    window.cssAdd('.ck-ach-row{display:flex;align-items:center;gap:12px;background:rgba(18,24,56,.75);border:1px solid #283570;border-radius:12px;padding:10px 14px;margin-bottom:8px;transition:all .2s;}');
    window.cssAdd('.ck-ach-row.done{border-color:#37e08a;background:rgba(16,36,44,.8);}');
    window.cssAdd('.ck-ach-row.claimed{opacity:.65;border-color:#4b5563;}');
    window.cssAdd('.ck-ach-info{flex:1;min-width:0;}');
    window.cssAdd('.ck-ach-name{font-weight:bold;font-size:13px;color:#f8fafc;}');
    window.cssAdd('.ck-ach-sub{font-size:11px;color:#94a3b8;margin-top:2px;}');
    window.cssAdd('.ck-ach-rew{font-size:10.5px;color:#ffd76a;font-weight:700;margin-top:3px;}');
    window.cssAdd('.ck-ach-pbar{width:100%;height:6px;background:#090d22;border-radius:3px;overflow:hidden;margin-top:6px;border:1px solid rgba(255,255,255,.1);}');
    window.cssAdd('.ck-ach-pfill{height:100%;background:linear-gradient(90deg,#38bdf8,#37e08a);transition:width .2s;}');
    window.cssAdd('.ck-ach-claimbtn{background:linear-gradient(135deg,#eab308,#ca8a04);border:none;border-radius:8px;padding:7px 14px;font-weight:800;font-size:11px;color:#000;cursor:pointer;flex:none;transition:transform .15s;}');
    window.cssAdd('.ck-ach-claimbtn:hover{filter:brightness(1.15);transform:scale(1.04);}');
    window.cssAdd('.ck-ach-claimbtn:disabled{opacity:.4;cursor:default;filter:grayscale(1);}');
    window.cssAdd('#ck-close-ach{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:10px;}');
    /* Стили Колеса Фортуны */
    window.cssAdd('#ck-wheelbtn{background:linear-gradient(135deg,#ec4899,#8b5cf6);box-shadow:0 0 16px rgba(236,72,153,.45);}');
    window.cssAdd('#ck-wheel-modal{position:fixed;inset:0;z-index:9476;background:rgba(2,2,14,.9);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(14px);}');
    window.cssAdd('#ck-wheel-box{width:min(520px,94vw);background:linear-gradient(170deg,#140a24,#080412);border:2px solid #ec4899;border-radius:24px;padding:24px;color:#fff;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.9),0 0 40px rgba(236,72,153,.3);position:relative;}');
    window.cssAdd('#ck-wheel-box h2{margin:0 0 14px;letter-spacing:2px;color:#f472b6;font-size:20px;}');
    window.cssAdd('.ck-wheel-container{position:relative;width:240px;height:240px;margin:0 auto 16px;}');
    window.cssAdd('#ck-wheel-canvas{width:100%;height:100%;border-radius:50%;box-shadow:0 0 25px rgba(236,72,153,.4),inset 0 0 15px rgba(0,0,0,.7);border:4px solid #f472b6;transition:transform 4s cubic-bezier(0.15, 0.9, 0.25, 1);}');
    window.cssAdd('.ck-wheel-pointer{position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:22px solid #ffd76a;z-index:2;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6));}');
    window.cssAdd('.ck-wheel-spinners{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}');
    window.cssAdd('.ck-spin-btn{flex:1;min-width:140px;padding:12px 14px;border:none;border-radius:12px;font-family:inherit;font-weight:900;font-size:12px;cursor:pointer;color:#fff;letter-spacing:.6px;transition:all .18s;}');
    window.cssAdd('.ck-spin-clicks{background:linear-gradient(135deg,#3b82f6,#1d4ed8);box-shadow:0 4px 14px rgba(59,130,246,.4);}');
    window.cssAdd('.ck-spin-shards{background:linear-gradient(135deg,#ec4899,#be185d);box-shadow:0 4px 14px rgba(236,72,153,.4);}');
    window.cssAdd('.ck-spin-btn:disabled{opacity:.4;cursor:default;filter:grayscale(1);box-shadow:none;}');
    window.cssAdd('#ck-wheel-res{min-height:24px;font-weight:800;font-size:13px;color:#ffd76a;margin:12px 0 4px;}');
    window.cssAdd('#ck-close-wheel{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:12px;}');
    /* Стили Коллекций и Мерджа */
    window.cssAdd('#ck-colbtn{background:linear-gradient(135deg,#06b6d4,#0284c7);box-shadow:0 0 16px rgba(6,182,212,.45);}');
    window.cssAdd('#ck-col-modal{position:fixed;inset:0;z-index:9477;background:rgba(2,2,14,.9);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(14px);}');
    window.cssAdd('#ck-col-box{width:min(580px,94vw);max-height:88vh;overflow-y:auto;background:linear-gradient(170deg,#0a1424,#040812);border:2px solid #06b6d4;border-radius:24px;padding:22px;color:#fff;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.9),0 0 40px rgba(6,182,212,.3);}');
    window.cssAdd('#ck-col-box h2{margin:0 0 14px;letter-spacing:2px;color:#67e8f9;font-size:20px;text-align:center;}');
    window.cssAdd('.ck-col-status{background:rgba(12,28,48,.8);border:1px solid #0891b2;border-radius:14px;padding:12px 16px;margin-bottom:14px;text-align:center;font-size:13px;line-height:1.5;}');
    window.cssAdd('.ck-col-status b{color:#38bdf8;}');
    window.cssAdd('.ck-col-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px;}');
    window.cssAdd('.ck-col-slot{border:1px solid #1e293b;border-radius:12px;padding:8px 4px;text-align:center;background:rgba(15,23,42,.6);transition:all .2s;}');
    window.cssAdd('.ck-col-slot.has{border-color:#38bdf8;box-shadow:0 0 12px rgba(56,189,248,.3);background:rgba(14,165,233,.15);}');
    window.cssAdd('.ck-col-icon{width:28px;height:28px;border-radius:50%;margin:0 auto 4px;}');
    window.cssAdd('.ck-col-title{font-size:10.5px;font-weight:700;color:#cbd5e1;}');
    window.cssAdd('.ck-merge-row{display:flex;align-items:center;justify-content:space-between;background:rgba(15,23,42,.7);border:1px solid #1e293b;border-radius:12px;padding:10px 14px;margin-bottom:8px;}');
    window.cssAdd('.ck-merge-info{font-size:12.5px;font-weight:700;}');
    window.cssAdd('.ck-merge-btn{background:linear-gradient(135deg,#06b6d4,#0891b2);border:none;border-radius:8px;padding:7px 14px;font-weight:800;font-size:11px;color:#fff;cursor:pointer;transition:transform .15s;}');
    window.cssAdd('.ck-merge-btn:hover{filter:brightness(1.15);transform:scale(1.04);}');
    window.cssAdd('.ck-merge-btn:disabled{opacity:.4;cursor:default;filter:grayscale(1);}');
    window.cssAdd('#ck-close-col{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:10px;}');
    /* Стили Питомцев и Компаньонов */
    window.cssAdd('#ck-petbtn{background:linear-gradient(135deg,#10b981,#047857);box-shadow:0 0 16px rgba(16,185,129,.45);}');
    window.cssAdd('#ck-pet-modal{position:fixed;inset:0;z-index:9478;background:rgba(2,2,14,.9);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(14px);}');
    window.cssAdd('#ck-pet-box{width:min(580px,94vw);max-height:88vh;overflow-y:auto;background:linear-gradient(170deg,#0a2419,#04120c);border:2px solid #10b981;border-radius:24px;padding:22px;color:#fff;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.9),0 0 40px rgba(16,185,129,.3);}');
    window.cssAdd('#ck-pet-box h2{margin:0 0 14px;letter-spacing:2px;color:#6ee7b7;font-size:20px;text-align:center;}');
    window.cssAdd('.ck-pet-card{display:flex;align-items:center;gap:12px;background:rgba(6,44,28,.65);border:1px solid #059669;border-radius:14px;padding:12px 14px;margin-bottom:10px;transition:all .25s cubic-bezier(0.1,0.9,0.2,1);cursor:pointer;position:relative;overflow:hidden;}');
    window.cssAdd('.ck-pet-card::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at center, rgba(52,211,153,0.3), transparent 70%);opacity:0;transition:opacity .25s ease;pointer-events:none;}');
    window.cssAdd('.ck-pet-card:hover{transform:translateY(-3px) scale(1.02);border-color:#34d399!important;box-shadow:0 10px 30px rgba(16,185,129,0.4)!important;}');
    window.cssAdd('.ck-pet-card:hover::after{opacity:1;}');
    window.cssAdd('.ck-pet-card:active{transform:scale(0.98);}');
    window.cssAdd('.ck-pet-card.owned{border-color:#34d399;box-shadow:0 0 16px rgba(52,211,153,.3);background:rgba(16,185,129,.22);}');
    window.cssAdd('.ck-pet-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none;box-shadow:0 0 12px rgba(255,255,255,.2);}');
    window.cssAdd('.ck-pet-info{flex:1;min-width:0;}');
    window.cssAdd('.ck-pet-name{font-weight:800;font-size:13.5px;color:#f0fdf4;}');
    window.cssAdd('.ck-pet-bonus{font-size:11.5px;color:#a7f3d0;margin-top:2px;}');
    window.cssAdd('.ck-pet-buybtn{background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:8px;padding:8px 14px;font-weight:800;font-size:11px;color:#042f1a;cursor:pointer;transition:transform .15s;}');
    window.cssAdd('.ck-pet-buybtn:hover{filter:brightness(1.15);transform:scale(1.04);}');
    window.cssAdd('.ck-pet-buybtn:disabled{opacity:.4;cursor:default;filter:grayscale(1);}');
    window.cssAdd('#ck-close-pet{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:10px;}');
    window.cssAdd('.ck-pet-celeb-overlay{position:fixed;inset:0;background:radial-gradient(circle,rgba(15,23,42,0.88) 20%,rgba(2,6,23,0.96));z-index:99999;display:flex;align-items:center;justify-content:center;pointer-events:none;animation:ckCelebFade 1.3s cubic-bezier(0.16,1,0.3,1) forwards;}');
    window.cssAdd('@keyframes ckCelebFade{0%{opacity:0;}15%{opacity:1;}80%{opacity:1;}100%{opacity:0;}}');
    window.cssAdd('.ck-pet-celeb-card{display:flex;flex-direction:column;align-items:center;position:relative;animation:ckCelebCardPop 1.3s cubic-bezier(0.34,1.56,0.64,1) forwards;}');
    window.cssAdd('@keyframes ckCelebCardPop{0%{transform:scale(0.3) translateY(40px);filter:brightness(2);}25%{transform:scale(1.2) translateY(0);filter:brightness(1.5);}35%{transform:scale(1);}85%{transform:scale(1);opacity:1;}100%{transform:scale(0.8) translateY(-30px);opacity:0;}}');
    window.cssAdd('.ck-pet-celeb-glow{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,#fbbf24,transparent 70%);filter:blur(24px);opacity:0.6;animation:ckCelebSpin 1.3s linear infinite;}');
    window.cssAdd('@keyframes ckCelebSpin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}');
    window.cssAdd('.ck-pet-celeb-model{position:relative;z-index:2;transform:scale(1.8);margin-bottom:20px;}');
    window.cssAdd('.ck-pet-celeb-title{font-size:15px;font-weight:900;letter-spacing:2px;color:#ffd76a;text-shadow:0 0 14px #f59e0b;margin-bottom:6px;z-index:2;}');
    window.cssAdd('.ck-pet-celeb-name{font-size:22px;font-weight:900;text-shadow:0 0 18px currentColor;z-index:2;}');
    window.cssAdd('@keyframes ckImpactRipple{0%{transform:translate(-50%,-50%) scale(0.15);opacity:1;border-width:6px;filter:blur(0px);}50%{opacity:0.9;border-width:3px;}100%{transform:translate(-50%,-50%) scale(3.2);opacity:0;border-width:1px;filter:blur(3px);}}');
    window.cssAdd('.ck-pet-impact-ring{position:absolute;border-radius:50%;border:3px solid #fff;pointer-events:none;z-index:45;animation:ckImpactRipple .5s cubic-bezier(0.1,0.9,0.2,1) forwards;}');
    window.cssAdd('@keyframes ckPetHitFloat{0%{transform:translate(-50%,-50%) scale(0.6);opacity:0;}20%{transform:translate(-50%,-80%) scale(1.3);opacity:1;}100%{transform:translate(-50%,-160%) scale(0.9);opacity:0;}}');
    window.cssAdd('.ck-pet-hit-text{position:absolute;font-weight:900;font-size:16px;pointer-events:none;z-index:60;animation:ckPetHitFloat .65s ease-out forwards;text-shadow:0 0 10px currentColor, 0 2px 4px rgba(0,0,0,0.8);letter-spacing:1px;}');
    window.cssAdd('.ck-orbit-pet{transition:filter .15s ease, opacity .2s ease;}');
    window.cssAdd('.ck-pet-trail{position:absolute;width:10px;height:10px;border-radius:50%;pointer-events:none;z-index:28;opacity:0.6;animation:ckPetTrailFade .35s linear forwards;}');
    window.cssAdd('@keyframes ckPetTrailFade{0%{transform:translate(-50%,-50%) scale(1);opacity:0.7;}100%{transform:translate(-50%,-50%) scale(0.1);opacity:0;}}');
    window.cssAdd('.ck-pet-card{transition:all .25s cubic-bezier(0.1,0.9,0.2,1)!important;cursor:pointer!important;position:relative!important;overflow:hidden!important;}');
    window.cssAdd('@keyframes ckPetHoverFloat{0%{transform:translateY(0px);}100%{transform:translateY(-4px);}}');
    window.cssAdd('.ck-pet-avatar{animation:ckPetHoverFloat 2.2s ease-in-out infinite alternate;}');
    window.cssAdd('.ck-pet-card:hover .ck-pet-avatar{transform:scale(1.15) rotate(4deg);transition:transform .3s cubic-bezier(0.34,1.56,0.64,1);}');
    window.cssAdd('.ck-pet-card:hover .ck-dragon-wing.l, .ck-pet-card:hover .ck-d-wing.l{animation-duration:0.18s!important;}');
    window.cssAdd('.ck-pet-card:hover .ck-dragon-wing.r, .ck-pet-card:hover .ck-d-wing.r{animation-duration:0.18s!important;}');
    window.cssAdd('.ck-pet-avatar{transition:transform .3s ease;}');
    window.cssAdd('.ck-pet-card:hover{transform:translateY(-3px) scale(1.02)!important;border-color:#34d399!important;box-shadow:0 10px 30px rgba(16,185,129,0.4)!important;}');
    window.cssAdd('.ck-pet-card:active{transform:scale(0.98)!important;}');
    /* Орбитальные 3D питомцы на планете */
    window.cssAdd('.ck-orbit-pet{position:absolute;width:40px;height:40px;pointer-events:none;transform-style:preserve-3d;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;transition:filter .2s;}');
    window.cssAdd('.ck-pet-3d-wrap{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;}');
    window.cssAdd('.ck-pet-core{position:absolute;width:18px;height:18px;border-radius:50%;box-shadow:0 0 18px currentColor,inset 0 0 8px #fff;animation:ckPetPulse 1.8s infinite alternate;}');
    window.cssAdd('@keyframes ckPetPulse{0%{transform:scale(0.88) rotate(-2deg);filter:brightness(1) drop-shadow(0 0 8px currentColor);}50%{transform:scale(1.08) rotate(3deg);filter:brightness(1.35) drop-shadow(0 0 18px currentColor);}100%{transform:scale(0.88) rotate(-2deg);filter:brightness(1) drop-shadow(0 0 8px currentColor);}}');
    window.cssAdd('.ck-pet-ring{position:absolute;border-radius:50%;border:2px solid currentColor;opacity:0.85;box-shadow:0 0 14px currentColor;animation:ckPetSpin 3s linear infinite;}');
    window.cssAdd('.ck-pet-ring.r1{width:34px;height:14px;transform:rotateX(65deg) rotateZ(20deg);}');
    window.cssAdd('.ck-pet-ring.r2{width:38px;height:16px;transform:rotateY(65deg) rotateZ(50deg);animation-duration:4s;animation-direction:reverse;}');
    window.cssAdd('@keyframes ckPetSpin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}');
    window.cssAdd('@keyframes ckWispBreathe{0%{transform:translateY(0) scale(0.92);filter:drop-shadow(0 0 8px currentColor);}50%{transform:translateY(-6px) scale(1.12);filter:drop-shadow(0 0 22px currentColor) brightness(1.3);}100%{transform:translateY(0) scale(0.92);filter:drop-shadow(0 0 8px currentColor);}}');
    window.cssAdd('@keyframes ckDroneHover{0%{transform:translateY(0) rotate(-4deg);}50%{transform:translateY(-5px) rotate(4deg);}100%{transform:translateY(0) rotate(-4deg);}}');
    window.cssAdd('@keyframes ckSlimeSquish{0%,100%{transform:scale(1,1) translateY(0);}25%{transform:scale(1.18,0.82) translateY(2px);}50%{transform:scale(0.85,1.2) translateY(-6px);}75%{transform:scale(1.05,0.95) translateY(0);}}');
    window.cssAdd('@keyframes ckOmegaPulse{0%{transform:rotate(0deg) scale(0.95);box-shadow:0 0 15px currentColor;}50%{transform:rotate(180deg) scale(1.12);box-shadow:0 0 35px currentColor, inset 0 0 15px #fff;}100%{transform:rotate(360deg) scale(0.95);box-shadow:0 0 15px currentColor;}}');
    window.cssAdd('.ck-pet-idle{animation:ckWispBreathe 3s ease-in-out infinite;}');
    window.cssAdd('.ck-pet-art-drone{animation:ckDroneHover 2.2s ease-in-out infinite!important;}');
    window.cssAdd('.ck-pet-art-slime{animation:ckSlimeSquish 1.7s ease-in-out infinite!important;}');
    window.cssAdd('.ck-pet-art-omega{animation:ckOmegaPulse 5s linear infinite!important;}');
    /* Улучшенная акробатическая анимация Жнеца с отдачей и подбрасыванием косы */
    window.cssAdd('.ck-reaper-entity{animation:ckReaperTossBody 2.8s cubic-bezier(0.4,0,0.2,1) infinite;}');
    window.cssAdd('@keyframes ckReaperTossBody{' +
      '0%,100%{transform:translateY(0) rotate(0deg) scale(1);}' +
      '15%{transform:translateY(3px) rotate(4deg) scale(0.96);}' +
      '20%{transform:translateY(-6px) rotate(-3deg) scale(1.04);}' +
      '45%{transform:translateY(-8px) rotate(0deg) scale(1.02);filter:drop-shadow(0 0 14px #a855f7);}' +
      '70%{transform:translateY(-2px) rotate(2deg);}' +
      '76%{transform:translateY(4px) rotate(-2deg) scale(0.97);filter:drop-shadow(0 0 22px #c084fc);}' +
      '84%{transform:translateY(-1px) rotate(0deg) scale(1.02);}' +
    '}');
    window.cssAdd('.ck-reaper-scythe-wrap{animation:ckReaperScytheToss 2.8s cubic-bezier(0.35,0,0.25,1) infinite;}');
    window.cssAdd('@keyframes ckReaperScytheToss{' +
      '0%{transform:translate(0,0) rotate(0deg) scale(1);filter:drop-shadow(0 0 6px #c084fc);}' +
      '14%{transform:translate(2px,4px) rotate(15deg) scale(0.98);}' +
      '24%{transform:translate(-6px,-20px) rotate(-220deg) scale(1.2);filter:drop-shadow(0 0 16px #e879f9);}' +
      '44%{transform:translate(-2px,-36px) rotate(-480deg) scale(1.35);filter:drop-shadow(0 0 26px #c084fc) brightness(1.3);}' +
      '62%{transform:translate(4px,-22px) rotate(-640deg) scale(1.2);filter:drop-shadow(0 0 18px #a855f7);}' +
      '74%{transform:translate(0,4px) rotate(-720deg) scale(1.08);filter:drop-shadow(0 0 12px #fff);}' +
      '82%{transform:translate(0,-3px) rotate(-720deg) scale(1);}' +
      '90%{transform:translate(0,1px) rotate(-720deg);}' +
      '100%{transform:translate(0,0) rotate(-720deg);}' +
    '}');
    /* Общая космическая аура парения для всех питомцев */
    window.cssAdd('.ck-orbit-pet{animation:ckGlobalPetHover 3.2s ease-in-out infinite alternate;}');
    window.cssAdd('@keyframes ckGlobalPetHover{0%{filter:drop-shadow(0 0 10px currentColor) brightness(1);}100%{filter:drop-shadow(0 0 20px currentColor) brightness(1.25);}}');
    window.cssAdd('.ck-pet-trail{position:absolute;width:6px;height:6px;border-radius:50%;background:currentColor;opacity:0.6;filter:blur(1px);box-shadow:0 0 10px currentColor;}');
    /* Новая архитектура Дракона с нуля */
    window.cssAdd('.ck-v2-dragon{position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;transform-style:preserve-3d;animation:ckDragonHover 2.6s ease-in-out infinite alternate;}');
    window.cssAdd('@keyframes ckDragonHover{0%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-4px) rotate(2deg);}100%{transform:translateY(0) rotate(-1deg);}}');
    window.cssAdd('.ck-v2-d-wing{position:absolute;top:6px;width:24px;height:30px;transform-origin:100% 40%;background:linear-gradient(135deg, rgba(232,121,249,0.9), rgba(168,85,247,0.8) 50%, rgba(88,28,135,0.9));clip-path:polygon(0% 15%, 45% 0%, 100% 25%, 85% 70%, 55% 100%, 25% 75%, 10% 85%);box-shadow:inset 0 0 10px #f472b6, 0 0 14px rgba(192,132,252,0.8);filter:drop-shadow(0 0 8px #a855f7);}');
    window.cssAdd('.ck-v2-d-wing.l{left:-8px;animation:ckDFlapV2L 0.38s ease-in-out infinite alternate;}');
    window.cssAdd('.ck-v2-d-wing.r{right:-8px;transform-origin:0% 40%;transform:scaleX(-1);animation:ckDFlapV2R 0.38s ease-in-out infinite alternate;}');
    window.cssAdd('@keyframes ckDFlapV2L{0%{transform:rotateY(30deg) rotateZ(15deg) scaleY(0.85);}100%{transform:rotateY(-45deg) rotateZ(-25deg) scaleY(1.1);}}');
    window.cssAdd('@keyframes ckDFlapV2R{0%{transform:scaleX(-1) rotateY(30deg) rotateZ(15deg) scaleY(0.85);}100%{transform:scaleX(-1) rotateY(-45deg) rotateZ(-25deg) scaleY(1.1);}}');
    window.cssAdd('.ck-v2-d-head{position:absolute;top:2px;width:15px;height:17px;background:linear-gradient(180deg,#c084fc 20%,#6b21a8);border-radius:6px 6px 4px 4px;box-shadow:0 0 12px #c084fc, inset 0 0 4px #fff;z-index:4;}');
    window.cssAdd('.ck-v2-d-horn{position:absolute;top:-6px;width:4px;height:9px;background:linear-gradient(180deg,#f472b6,#c084fc);clip-path:polygon(50% 0%, 100% 100%, 0% 100%);filter:drop-shadow(0 0 4px #f472b6);}');
    window.cssAdd('.ck-v2-d-horn.l{left:1px;transform:rotate(-22deg);}');
    window.cssAdd('.ck-v2-d-horn.r{right:1px;transform:rotate(22deg);}');
    window.cssAdd('.ck-v2-d-eye{position:absolute;top:6px;width:3px;height:4px;background:#fde047;border-radius:50%;box-shadow:0 0 6px #fde047;}');
    window.cssAdd('.ck-v2-d-eye.l{left:2.5px;}');
    window.cssAdd('.ck-v2-d-eye.r{right:2.5px;}');
    window.cssAdd('.ck-v2-d-body{position:absolute;top:15px;width:14px;height:20px;background:linear-gradient(180deg,#7e22ce,#3b0764);border-radius:8px 8px 10px 10px;box-shadow:0 0 14px rgba(168,85,247,0.7), inset 0 1px 4px #e879f9;z-index:3;}');
    window.cssAdd('.ck-v2-d-tail{position:absolute;bottom:0px;width:5px;height:16px;background:linear-gradient(180deg,#6b21a8,#a855f7);border-radius:3px;transform-origin:top center;animation:ckDTailV2 1s ease-in-out infinite alternate;z-index:2;}');
    window.cssAdd('.ck-v2-d-tail::after{content:"";position:absolute;bottom:-5px;left:-4px;width:13px;height:8px;background:#f472b6;clip-path:polygon(50% 100%, 0% 0%, 100% 0%);filter:drop-shadow(0 0 6px #f472b6);}');
    window.cssAdd('@keyframes ckDTailV2{0%{transform:rotate(-25deg);}100%{transform:rotate(25deg);}}');

    /* Новая архитектура Феникса с нуля */
    window.cssAdd('.ck-v2-phoenix{position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;transform-style:preserve-3d;animation:ckPhHoverV2 2.2s ease-in-out infinite alternate;}');
    window.cssAdd('@keyframes ckPhHoverV2{0%{transform:translateY(0) scale(0.96);}50%{transform:translateY(-5px) scale(1.04);}100%{transform:translateY(0) scale(0.96);}}');
    window.cssAdd('.ck-v2-ph-aura{position:absolute;inset:-4px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,0.35) 20%,rgba(234,179,8,0.15) 55%,transparent 75%);animation:ckPhAuraPulse 1.4s ease-in-out infinite alternate;pointer-events:none;}');
    window.cssAdd('@keyframes ckPhAuraPulse{0%{transform:scale(0.85);opacity:0.6;}100%{transform:scale(1.18);opacity:1;}}');
    window.cssAdd('.ck-v2-ph-wing{position:absolute;top:4px;width:26px;height:34px;transform-origin:90% 40%;background:linear-gradient(145deg, #ffffff 10%, #fde047 30%, #f97316 65%, #dc2626 95%);clip-path:polygon(10% 25%, 35% 0%, 80% 15%, 100% 35%, 85% 70%, 50% 100%, 25% 85%, 0% 55%);filter:drop-shadow(0 0 10px #f97316);box-shadow:inset 0 0 10px #fff;}');
    window.cssAdd('.ck-v2-ph-wing.l{left:-9px;animation:ckPhFlapV2L 0.32s ease-in-out infinite alternate;}');
    window.cssAdd('.ck-v2-ph-wing.r{right:-9px;transform-origin:10% 40%;transform:scaleX(-1);animation:ckPhFlapV2R 0.32s ease-in-out infinite alternate;}');
    window.cssAdd('@keyframes ckPhFlapV2L{0%{transform:rotateY(25deg) rotateZ(18deg) scaleY(0.8);}100%{transform:rotateY(-40deg) rotateZ(-28deg) scaleY(1.15);}}');
    window.cssAdd('@keyframes ckPhFlapV2R{0%{transform:scaleX(-1) rotateY(25deg) rotateZ(18deg) scaleY(0.8);}100%{transform:scaleX(-1) rotateY(-40deg) rotateZ(-28deg) scaleY(1.15);}}');
    window.cssAdd('.ck-v2-ph-crown{position:absolute;top:-8px;width:12px;height:15px;background:linear-gradient(180deg,#fff,#ffd76a 45%,#ea580c);clip-path:polygon(50% 0%, 80% 60%, 100% 30%, 85% 100%, 15% 100%, 0% 30%, 20% 60%);filter:drop-shadow(0 0 6px #f59e0b);animation:ckPhCrownFlicker 0.4s infinite alternate;z-index:5;}');
    window.cssAdd('@keyframes ckPhCrownFlicker{0%{transform:scale(0.92) rotate(-3deg);}100%{transform:scale(1.1) rotate(3deg);}}');
    window.cssAdd('.ck-v2-ph-head{position:absolute;top:2px;width:14px;height:15px;background:radial-gradient(circle at 40% 35%,#fff,#ffedd5 35%,#f97316 90%);border-radius:50% 50% 45% 45%;box-shadow:0 0 14px #f97316, inset 0 0 4px #fff;z-index:4;}');
    window.cssAdd('.ck-v2-ph-beak{position:absolute;top:7px;left:4.5px;width:5px;height:5px;background:#c2410c;clip-path:polygon(50% 100%, 0% 0%, 100% 0%);}');
    window.cssAdd('.ck-v2-ph-eye{position:absolute;top:4px;width:2.5px;height:3.5px;background:#09090b;border-radius:50%;box-shadow:0 0 3px #fff;}');
    window.cssAdd('.ck-v2-ph-eye.l{left:2.5px;}');
    window.cssAdd('.ck-v2-ph-eye.r{right:2.5px;}');
    window.cssAdd('.ck-v2-ph-body{position:absolute;top:13px;width:16px;height:22px;background:radial-gradient(ellipse at 35% 30%,#ffffff 15%,#fed7aa 35%,#ea580c 80%,#9a3412 100%);border-radius:50% 50% 40% 40%;box-shadow:0 0 20px rgba(249,115,22,0.9), inset 0 0 8px #fff;z-index:3;}');
    window.cssAdd('.ck-v2-ph-tail{position:absolute;bottom:-14px;display:flex;gap:3px;z-index:2;}');
    window.cssAdd('.ck-v2-ph-feather{width:3.5px;height:22px;background:linear-gradient(180deg,#f59e0b,#ef4444,transparent);border-radius:3px;transform-origin:top center;animation:ckPhTailPlume 1.1s ease-in-out infinite alternate;}');
    window.cssAdd('.ck-v2-ph-feather:nth-child(2){height:28px;width:4.5px;background:linear-gradient(180deg,#fff,#fde047 30%,#ea580c 70%,transparent);animation-delay:0.2s;}');
    window.cssAdd('.ck-v2-ph-feather:nth-child(3){animation-delay:0.4s;}');
    window.cssAdd('@keyframes ckPhTailPlume{0%{transform:rotate(-16deg);}100%{transform:rotate(16deg);}}');
    window.cssAdd('.ck-dragon-head{position:absolute;top:6px;width:14px;height:12px;background:linear-gradient(135deg,#c084fc,#7e22ce);border-radius:4px 4px 6px 6px;box-shadow:0 0 10px #c084fc;z-index:3;}');
    window.cssAdd('.ck-dragon-horns{position:absolute;top:-5px;left:1px;width:12px;height:6px;border-top:3px solid #f472b6;border-left:2px solid transparent;border-right:2px solid transparent;border-radius:50%;}');
    window.cssAdd('.ck-dragon-eyes{position:absolute;top:4px;left:2px;right:2px;display:flex;justify-content:space-between;}');
    window.cssAdd('.ck-dragon-eyes::before,.ck-dragon-eyes::after{content:"";width:3px;height:3px;background:#fde047;border-radius:50%;box-shadow:0 0 6px #fde047;}');
    window.cssAdd('.ck-dragon-body{position:absolute;top:16px;width:12px;height:14px;background:#9333ea;border-radius:6px;box-shadow:inset 0 0 6px #c084fc;z-index:2;}');
    window.cssAdd('.ck-dragon-wing{position:absolute;top:12px;width:18px;height:22px;border:2px solid #e879f9;background:rgba(192,132,252,.35);filter:drop-shadow(0 0 8px #c084fc);transform-origin:center top;}');
    window.cssAdd('.ck-dragon-wing.l{left:-10px;border-radius:14px 2px 8px 2px;animation:ckDFlapL .35s ease-in-out infinite alternate;}');
    window.cssAdd('.ck-dragon-wing.r{right:-10px;border-radius:2px 14px 2px 8px;animation:ckDFlapR .35s ease-in-out infinite alternate;}');
    window.cssAdd('@keyframes ckDFlapL{0%{transform:rotate(20deg) scaleX(0.7) rotateY(35deg);}100%{transform:rotate(-35deg) scaleX(1.1) rotateY(0deg);}}');
    window.cssAdd('@keyframes ckDFlapR{0%{transform:rotate(-20deg) scaleX(0.7) rotateY(-35deg);}100%{transform:rotate(35deg) scaleX(1.1) rotateY(0deg);}}');
    window.cssAdd('.ck-dragon-tail{position:absolute;bottom:2px;width:4px;height:12px;background:linear-gradient(180deg,#9333ea,#7e22ce);border-radius:2px;animation:ckDTail .8s ease-in-out infinite alternate;}');
    window.cssAdd('.ck-dragon-tail::after{content:"";position:absolute;bottom:-4px;left:-3px;width:10px;height:6px;background:#e879f9;clip-path:polygon(50% 100%, 0 0, 100% 0);}');
    window.cssAdd('@keyframes ckDTail{0%{transform:rotate(-15deg);}100%{transform:rotate(15deg);}}');
    /* Анатомия Феникса */
    window.cssAdd('.ck-phoenix-model{position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;}');
    window.cssAdd('.ck-ph-head{position:absolute;top:4px;width:10px;height:10px;background:#ffd76a;border-radius:50%;box-shadow:0 0 12px #f97316;z-index:3;}');
    window.cssAdd('.ck-ph-crest{position:absolute;top:-7px;left:2px;width:6px;height:8px;background:linear-gradient(180deg,#ef4444,#ffd76a);clip-path:polygon(50% 0%, 0% 100%, 100% 100%);animation:ckPhFire .5s infinite alternate;}');
    window.cssAdd('.ck-ph-beak{position:absolute;top:4px;left:9px;width:5px;height:3px;background:#f97316;clip-path:polygon(0 0, 0 100%, 100% 50%);}');
    window.cssAdd('.ck-ph-body{position:absolute;top:13px;width:10px;height:15px;background:linear-gradient(180deg,#f97316,#ea580c);border-radius:50% 50% 40% 40%;box-shadow:0 0 16px rgba(249,115,22,.8);z-index:2;}');
    window.cssAdd('.ck-ph-wing{position:absolute;top:10px;width:20px;height:24px;background:radial-gradient(ellipse at center,rgba(255,215,0,.85),rgba(249,115,22,.75) 60%,transparent 85%);border-top:3px solid #ffedd5;filter:drop-shadow(0 0 10px #f97316);transform-origin:10% 20%;}');
    window.cssAdd('.ck-ph-wing.l{left:-12px;border-radius:18px 4px 12px 0;animation:ckPFlapL .28s ease-in-out infinite alternate;}');
    window.cssAdd('.ck-ph-wing.r{right:-12px;border-radius:4px 18px 0 12px;animation:ckPFlapR .28s ease-in-out infinite alternate;}');
    window.cssAdd('@keyframes ckPFlapL{0%{transform:rotate(25deg) scaleY(0.7);}100%{transform:rotate(-40deg) scaleY(1.15);}}');
    window.cssAdd('@keyframes ckPFlapR{0%{transform:rotate(-25deg) scaleY(0.7);}100%{transform:rotate(40deg) scaleY(1.15);}}');
    window.cssAdd('.ck-ph-tail{position:absolute;bottom:-6px;display:flex;gap:2px;}');
    window.cssAdd('.ck-ph-feather{width:3px;height:18px;background:linear-gradient(180deg,#f97316,#ffd76a,transparent);border-radius:2px;animation:ckPHTail 1s ease-in-out infinite alternate;}');
    window.cssAdd('.ck-ph-feather:nth-child(2){height:22px;animation-delay:.2s;background:linear-gradient(180deg,#ef4444,#fde047,transparent);}');
    window.cssAdd('@keyframes ckPhFire{0%{transform:scale(0.8) rotate(-5deg);}100%{transform:scale(1.2) rotate(5deg);}}');
    window.cssAdd('@keyframes ckPHTail{0%{transform:rotate(-12deg);}100%{transform:rotate(12deg);}}');
    /* Стили Золотой кометы */
    window.cssAdd('.ck-golden-comet{position:fixed;z-index:9465;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#ffffff,#fef08a 40%,#eab308 80%);box-shadow:0 0 25px #facc15,0 0 50px #ca8a04;cursor:pointer;pointer-events:auto;transition:transform 0.08s;}');
    window.cssAdd('.ck-golden-comet::before{content:"";position:absolute;top:50%;right:100%;transform:translateY(-50%);width:90px;height:12px;background:linear-gradient(90deg,transparent,rgba(250,204,21,.75));border-radius:6px;filter:blur(2px);pointer-events:none;}');
    window.cssAdd('.ck-golden-comet:hover{transform:scale(1.2);}');
    window.cssAdd('.ck-comet-flash{position:fixed;inset:0;background:rgba(250,204,21,.18);pointer-events:none;z-index:9590;animation:ckCometFlash .6s ease-out forwards;}');
    window.cssAdd('@keyframes ckCometFlash{0%{opacity:1;}100%{opacity:0;}}');
    /* Стили Престиж-тиров и Эволюций диска */
    window.cssAdd('.ck-prestige-tag{font-size:11px;font-weight:900;letter-spacing:1px;padding:2px 8px;border-radius:6px;display:inline-block;margin-top:4px;}');
    window.cssAdd('.ck-tier-1{box-shadow:0 0 50px rgba(56,189,248,.85),0 0 100px rgba(168,85,247,.5)!important;border:2px solid #38bdf8!important;}');
    window.cssAdd('.ck-tier-1::before{background:conic-gradient(from 0deg,#38bdf8,#a855f7,#ec4899,#38bdf8)!important;animation-duration:6s!important;}');
    window.cssAdd('.ck-tier-2{box-shadow:0 0 70px rgba(244,63,94,.9),0 0 130px rgba(234,179,8,.7)!important;border:3px solid #f43f5e!important;}');
    window.cssAdd('.ck-tier-2::before{background:conic-gradient(from 0deg,#f43f5e,#eab308,#f97316,#f43f5e)!important;animation-duration:3.5s!important;}');
    window.cssAdd('.ck-tier-3{box-shadow:0 0 90px rgba(234,179,8,1),0 0 160px rgba(255,255,255,.9)!important;border:4px solid #fde047!important;animation:ckTier3Pulse 2s infinite alternate!important;}');
    window.cssAdd('@keyframes ckTier3Pulse{0%{filter:brightness(1) contrast(1.1);}100%{filter:brightness(1.3) contrast(1.3);}}');
    window.cssAdd('.ck-tier-4{box-shadow:0 0 120px rgba(168,85,247,1),0 0 220px rgba(56,189,248,1),inset 0 0 40px #fff!important;border:4px solid #fff!important;animation:ckTier4Pulse 1.5s infinite alternate!important;}');
    window.cssAdd('@keyframes ckTier4Pulse{0%{filter:brightness(1.2) drop-shadow(0 0 20px #a855f7);}100%{filter:brightness(1.5) drop-shadow(0 0 45px #38bdf8);}}');
    /* Стили Дерева Навыков за МЕГА */
    window.cssAdd('#ck-treebtn{background:linear-gradient(135deg,#6366f1,#4338ca);box-shadow:0 0 16px rgba(99,102,241,.45);}');
    window.cssAdd('#ck-tree-modal{position:fixed;inset:0;z-index:9480;background:rgba(2,2,14,.92);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(16px);}');
    window.cssAdd('#ck-tree-box{width:min(680px,95vw);max-height:88vh;overflow-y:auto;background:linear-gradient(175deg,#0c102b,#060818);border:2px solid #6366f1;border-radius:24px;padding:22px;color:#fff;box-sizing:border-box;box-shadow:0 24px 90px rgba(0,0,0,.9),0 0 45px rgba(99,102,241,.3);}');
    window.cssAdd('#ck-tree-box h2{margin:0 0 8px;text-align:center;letter-spacing:2.5px;color:#818cf8;font-size:21px;}');
    window.cssAdd('#ck-tree-sp{text-align:center;font-size:13px;color:#c7d2fe;margin-bottom:16px;font-weight:700;}');
    window.cssAdd('#ck-tree-sp b{color:#38bdf8;font-size:15px;}');
    window.cssAdd('.ck-tree-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px;}');
    window.cssAdd('.ck-tree-col{background:rgba(15,23,42,.65);border:1px solid #1e293b;border-radius:16px;padding:12px 10px;display:flex;flex-direction:column;gap:10px;}');
    window.cssAdd('.ck-tree-col-title{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;text-align:center;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.1);}');
    window.cssAdd('.ck-tree-node{background:rgba(30,41,59,.8);border:1px solid #334155;border-radius:12px;padding:10px 8px;text-align:center;transition:all .2s;}');
    window.cssAdd('.ck-tree-node.maxed{border-color:#10b981;background:rgba(16,185,129,.15);box-shadow:0 0 12px rgba(16,185,129,.25);}');
    window.cssAdd('.ck-tree-node-name{font-size:11.5px;font-weight:800;color:#f8fafc;}');
    window.cssAdd('.ck-tree-node-desc{font-size:10px;color:#94a3b8;margin:3px 0;}');
    window.cssAdd('.ck-tree-node-lvl{font-size:10.5px;font-weight:800;color:#38bdf8;margin-bottom:6px;}');
    window.cssAdd('.ck-tree-upbtn{width:100%;background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;border-radius:8px;padding:6px;font-size:10.5px;font-weight:800;color:#fff;cursor:pointer;transition:transform .15s;}');
    window.cssAdd('.ck-tree-upbtn:hover{filter:brightness(1.15);transform:scale(1.02);}');
    window.cssAdd('.ck-tree-upbtn:disabled{opacity:.4;cursor:default;filter:grayscale(1);}');
    window.cssAdd('#ck-close-tree{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
    /* Стили Сезонного Пропуска */
    window.cssAdd('#ck-passbtn{background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 0 16px rgba(245,158,11,.45);}');
    window.cssAdd('#ck-pass-modal{position:fixed;inset:0;z-index:9482;background:rgba(2,2,14,.92);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(16px);}');
    window.cssAdd('#ck-pass-box{width:min(680px,95vw);max-height:88vh;overflow-y:auto!important;overflow-x:hidden!important;background:radial-gradient(ellipse at 50% 10%, #2e1704 0%, #0c0802 85%);border:2px solid #f59e0b;border-radius:24px;padding:22px;color:#fff;box-sizing:border-box;box-shadow:0 24px 90px rgba(0,0,0,.9),0 0 55px rgba(245,158,11,.45);position:relative;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}');
    window.cssAdd('#ck-pass-box::-webkit-scrollbar{width:6px;}');
    window.cssAdd('#ck-pass-box::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#f59e0b,#78350f);border-radius:6px;}');
    window.cssAdd('#ck-pass-box::-webkit-scrollbar-track{background:rgba(12,8,2,0.6);border-radius:6px;}');
    window.cssAdd('#ck-pass-box h2{animation:ckSeasonTitleGlow 2.5s ease-in-out infinite alternate;text-shadow:0 0 20px #f59e0b;}');
    window.cssAdd('@keyframes ckSeasonTitleGlow{0%{filter:brightness(1) drop-shadow(0 0 6px #f59e0b);}100%{filter:brightness(1.3) drop-shadow(0 0 18px #fbbf24);}}');
    window.cssAdd('.ck-pass-header{position:relative;overflow:hidden;background:linear-gradient(135deg, rgba(45,26,6,0.85), rgba(20,12,3,0.95))!important;border:1.5px solid #d97706!important;box-shadow:0 0 25px rgba(245,158,11,0.25)!important;}');
    window.cssAdd('.ck-pass-xp-fill{position:relative;background:linear-gradient(90deg,#d97706,#fbbf24,#fef08a)!important;box-shadow:0 0 12px #fbbf24;}');
    window.cssAdd('.ck-pass-xp-fill::after{content:"";position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent);animation:ckPassScan 2s infinite;}');
    window.cssAdd('@keyframes ckPassScan{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}');
    window.cssAdd('.ck-pass-row{transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease;}');
    window.cssAdd('.ck-pass-row:hover{transform:translateX(4px);border-color:#f59e0b!important;box-shadow:0 4px 18px rgba(245,158,11,0.3)!important;}');
    window.cssAdd('.ck-pass-row.current-lvl{border:2px solid #ffd76a!important;background:linear-gradient(90deg,rgba(75,35,4,0.9),rgba(25,14,2,0.9))!important;box-shadow:0 0 24px rgba(251,191,36,0.4)!important;}');
    window.cssAdd('.ck-pass-claim{transition:all .18s!important;cursor:pointer!important;}');
    window.cssAdd('.ck-pass-claim:not(:disabled){background:linear-gradient(135deg,#f59e0b,#d97706)!important;box-shadow:0 0 10px rgba(245,158,11,0.5)!important;animation:ckBtnPulse 1.8s infinite;}');
    window.cssAdd('.ck-pass-claim:not(:disabled):hover{transform:scale(1.08)!important;filter:brightness(1.2)!important;}');
    window.cssAdd('.ck-pass-buy-prem{animation:ckPremGlow 2.5s infinite alternate!important;}');
    window.cssAdd('@keyframes ckPremGlow{0%{box-shadow:0 0 12px rgba(245,158,11,.4);}100%{box-shadow:0 0 28px rgba(251,191,36,.8),inset 0 0 10px #fff;}}');
    window.cssAdd('#ck-pass-box h2{margin:0 0 6px;text-align:center;letter-spacing:2px;color:#fbbf24;font-size:21px;}');
    window.cssAdd('.ck-pass-header{display:flex;align-items:center;justify-content:space-between;background:rgba(30,20,5,.7);border:1px solid #78350f;border-radius:14px;padding:12px 16px;margin-bottom:14px;flex-wrap:wrap;gap:10px;}');
    window.cssAdd('.ck-pass-xp-bar{width:100%;height:8px;background:#1e1405;border-radius:4px;overflow:hidden;border:1px solid rgba(251,191,36,.3);margin-top:8px;}');
    window.cssAdd('.ck-pass-xp-fill{height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);transition:width .2s;}');
    window.cssAdd('.ck-pass-buy-prem{background:linear-gradient(135deg,#f59e0b,#b45309);border:none;border-radius:8px;padding:8px 14px;font-weight:900;font-size:11px;color:#000;cursor:pointer;transition:transform .15s;}');
    window.cssAdd('.ck-pass-buy-prem:hover{filter:brightness(1.15);transform:scale(1.03);}');
    window.cssAdd('.ck-pass-buy-prem:disabled{opacity:.5;cursor:default;filter:grayscale(1);}');
    window.cssAdd('.ck-pass-levels{display:flex;flex-direction:column;gap:8px;margin-bottom:12px;}');
    window.cssAdd('.ck-pass-row{display:grid;grid-template-columns:55px 1fr 1fr;gap:8px;align-items:center;background:rgba(20,14,4,.75);border:1px solid #451a03;border-radius:12px;padding:8px 12px;}');
    window.cssAdd('.ck-pass-lvl-badge{font-weight:900;font-size:13px;color:#fbbf24;text-align:center;}');
    window.cssAdd('.ck-pass-reward-card{display:flex;align-items:center;justify-content:space-between;background:rgba(12,8,2,.8);border:1px solid #291203;border-radius:8px;padding:6px 10px;font-size:11.5px;}');
    window.cssAdd('.ck-pass-reward-card.prem{border-color:#b45309;background:rgba(69,26,3,.3);}');
    window.cssAdd('.ck-pass-claim{background:#d97706;border:none;border-radius:6px;padding:4px 8px;font-weight:800;font-size:10px;color:#000;cursor:pointer;}');
    window.cssAdd('.ck-pass-claim:disabled{opacity:.35;cursor:default;}');
    window.cssAdd('#ck-close-pass{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
    /* Стили Мутаций Планет */
    window.cssAdd('#ck-mutation-hud{display:none!important;}');
    /* Анимированные эффекты для темы ГОЛУБАЯ v3 (Тема V2) */
    window.cssAdd('.ck-theme-blue3 #clicker-panel, [data-theme="blue3"] #clicker-panel, body.theme-blue3 #clicker-panel{' +
      'position:relative!important;overflow:hidden!important;' +
      'box-shadow:0 0 35px rgba(56,189,248,.35), inset 0 0 25px rgba(14,165,233,.2)!important;' +
      'border:1.5px solid rgba(56,189,248,.6)!important;}'
    );
    window.cssAdd('.ck-theme-blue3 #clicker-panel::before, [data-theme="blue3"] #clicker-panel::before, body.theme-blue3 #clicker-panel::before{' +
      'content:"";position:absolute;inset:-50%;background:conic-gradient(from 0deg at 50% 50%, rgba(56,189,248,0) 0deg, rgba(56,189,248,.18) 180deg, rgba(99,102,241,.25) 270deg, rgba(56,189,248,0) 360deg);' +
      'animation:ckBlue3Spin 12s linear infinite;pointer-events:none;z-index:0;}'
    );
    window.cssAdd('@keyframes ckBlue3Spin{100%{transform:rotate(360deg);}}');
    window.cssAdd('.ck-theme-blue3 #clicker-panel::after, [data-theme="blue3"] #clicker-panel::after, body.theme-blue3 #clicker-panel::after{' +
      'content:"";position:absolute;inset:0;background:linear-gradient(rgba(56,189,248,0) 50%, rgba(56,189,248,0.06) 51%, rgba(56,189,248,0) 52%);' +
      'background-size:100% 8px;pointer-events:none;z-index:1;animation:ckBlue3Scan 8s linear infinite;}'
    );
    window.cssAdd('@keyframes ckBlue3Scan{0%{background-position:0 0;}100%{background-position:0 100%;}}');
    window.cssAdd('.ck-theme-blue3 #clicker-left, .ck-theme-blue3 #clicker-right, [data-theme="blue3"] #clicker-left, [data-theme="blue3"] #clicker-right, body.theme-blue3 #clicker-left, body.theme-blue3 #clicker-right{position:relative;z-index:2;}');
    window.cssAdd('.ck-theme-blue3 #ck-disc, [data-theme="blue3"] #ck-disc, body.theme-blue3 #ck-disc{' +
      'box-shadow:0 0 30px rgba(56,189,248,.6), 0 0 60px rgba(14,165,233,.3)!important;' +
      'animation:ckBlue3Pulse 3s ease-in-out infinite alternate!important;}'
    );
    window.cssAdd('@keyframes ckBlue3Pulse{0%{filter:drop-shadow(0 0 10px rgba(56,189,248,.6));}100%{filter:drop-shadow(0 0 26px rgba(99,102,241,.9));}}');
    /* Кибер-лианы и биолюминесцентный декор магазина для темы ГОЛУБАЯ v3 */
    window.cssAdd('.ck-theme-blue3 #clicker-right, [data-theme="blue3"] #clicker-right, body.theme-blue3 #clicker-right{' +
      'position:relative;background:radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 70%), rgba(10,18,32,0.95)!important;' +
      'border-left:1.5px solid rgba(56,189,248,0.4)!important;box-shadow:inset 0 0 25px rgba(56,189,248,0.08)!important;}'
    );
    window.cssAdd('.ck-theme-blue3 #clicker-right::before, [data-theme="blue3"] #clicker-right::before, body.theme-blue3 #clicker-right::before{' +
      'content:"";position:absolute;top:0;left:0;bottom:0;width:34px;pointer-events:none;z-index:5;' +
      'background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 400\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M8 0 Q22 50 10 100 T18 200 T8 300 T16 400\' fill=\'none\' stroke=\'%2338bdf8\' stroke-width=\'2.5\' stroke-linecap=\'round\' opacity=\'0.65\'/%3E%3Cpath d=\'M14 60 Q26 50 28 65\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2\' opacity=\'0.8\'/%3E%3Ccircle cx=\'28\' cy=\'65\' r=\'2.5\' fill=\'%2367e8f9\'/%3E%3Cpath d=\'M11 160 Q0 150 2 165\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2\' opacity=\'0.8\'/%3E%3Ccircle cx=\'2\' cy=\'165\' r=\'2.5\' fill=\'%2367e8f9\'/%3E%3Cpath d=\'M16 260 Q30 250 32 265\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2\' opacity=\'0.8\'/%3E%3Ccircle cx=\'32\' cy=\'265\' r=\'2.5\' fill=\'%2367e8f9\'/%3E%3Cpath d=\'M10 350 Q-2 340 0 355\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2\' opacity=\'0.8\'/%3E%3Ccircle cx=\'0\' cy=\'355\' r=\'2.5\' fill=\'%2367e8f9\'/%3E%3C/svg%3E");' +
      'background-repeat:repeat-y;background-size:24px 280px;filter:drop-shadow(0 0 8px rgba(56,189,248,0.7));animation:ckVineBreathe 4s ease-in-out infinite alternate;}'
    );
    window.cssAdd('@keyframes ckVineBreathe{0%{opacity:0.6;filter:drop-shadow(0 0 4px rgba(56,189,248,0.5));}100%{opacity:1;filter:drop-shadow(0 0 12px rgba(52,211,153,0.9));}}');
    window.cssAdd('.ck-theme-blue3 .upg-btn, [data-theme="blue3"] .upg-btn, body.theme-blue3 .upg-btn{' +
      'border:1px solid rgba(56,189,248,0.35)!important;background:linear-gradient(135deg, rgba(15,23,42,0.85), rgba(14,116,144,0.25))!important;' +
      'position:relative;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.3)!important;}'
    );
    window.cssAdd('.ck-theme-blue3 .upg-btn:hover, [data-theme="blue3"] .upg-btn:hover, body.theme-blue3 .upg-btn:hover{' +
      'border-color:#38bdf8!important;box-shadow:0 0 16px rgba(56,189,248,0.45)!important;transform:translateY(-1px);}'
    );
    window.cssAdd('.ck-mut-icon{font-size:13px;}');
    window.cssAdd('.ck-mut-name{font-weight:900;letter-spacing:.5px;}');
    window.cssAdd('.ck-mut-desc{color:#94a3b8;font-size:10.5px;}');
    window.cssAdd('#ck-mut-btn{background:linear-gradient(135deg,#0284c7,#0369a1);box-shadow:0 0 16px rgba(2,132,199,.45);}');
    window.cssAdd('#ck-mut-modal{position:fixed;inset:0;z-index:9484;background:rgba(2,2,14,.92);display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;backdrop-filter:blur(16px);}');
    window.cssAdd('#ck-mut-box{width:min(660px,95vw);max-height:88vh;overflow-y:auto;background:linear-gradient(175deg,#061324,#030a14);border:2px solid #38bdf8;border-radius:24px;padding:22px;color:#fff;box-sizing:border-box;box-shadow:0 24px 90px rgba(0,0,0,.9),0 0 45px rgba(56,189,248,.3);}');
    window.cssAdd('#ck-mut-box h2{margin:0 0 12px;text-align:center;letter-spacing:2px;color:#38bdf8;font-size:21px;}');
    window.cssAdd('.ck-mut-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:12px;}');
    window.cssAdd('.ck-mut-card{display:flex;align-items:center;gap:10px;background:rgba(10,22,40,.75);border:1px solid #1e3a5f;border-radius:14px;padding:10px 12px;transition:all .2s;}');
    window.cssAdd('.ck-mut-card.active{border-color:#38bdf8;background:rgba(14,165,233,.2);box-shadow:0 0 16px rgba(56,189,248,.35);}');
    window.cssAdd('.ck-mut-card-info{flex:1;min-width:0;}');
    window.cssAdd('.ck-mut-card-title{font-weight:900;font-size:12.5px;color:#f8fafc;}');
    window.cssAdd('.ck-mut-card-eff{font-size:11px;color:#7dd3fc;margin-top:2px;}');
    window.cssAdd('#ck-close-mut{width:100%;background:#b3283c;border:none;border-radius:10px;padding:11px;font-weight:bold;color:#fff;cursor:pointer;font-family:inherit;margin-top:6px;}');
    /* Стили Свайпа инвентаря */
    window.cssAdd('.ck-inv-card{touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:grab;transition:transform .18s ease-out,opacity .18s ease-out;}');
    window.cssAdd('.ck-inv-card:active{cursor:grabbing;}');
    window.cssAdd('.ck-inv-card.ck-swipe-fly-r{transform:translateX(350px) rotate(35deg) scale(0.6)!important;opacity:0!important;}');
    window.cssAdd('.ck-inv-card.ck-swipe-fly-l{transform:translateX(-350px) rotate(-35deg) scale(0.6)!important;opacity:0!important;}');
    /* Скрытие плашки пакетной покупки зелий */
    window.cssAdd('.ck-bulk-selector, #ck-shop-bulk{display:none!important;}');
    window.cssAdd('.ck-bulk-btn{flex:1;background:rgba(20,28,58,.7);border:1px solid #33407f;color:#8fa3e8;border-radius:10px;padding:6px 12px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;transition:all .18s;}');
    window.cssAdd('.ck-bulk-btn:hover{color:#ffd76a;border-color:#e0b23e;}');
    window.cssAdd('.ck-bulk-btn.active{background:linear-gradient(135deg,#ffd23f,#e0b23e);color:#0a0c1a;border-color:#ffd23f;box-shadow:0 0 14px rgba(255,210,63,.45);}');
    /* Стили Атаки и Удара питомцев */
    /* Стили Скинов Питомцев */
    window.cssAdd('.ck-pet-skin-bar{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;padding-top:6px;border-top:1px dashed rgba(255,255,255,.15);}');
    window.cssAdd('.ck-skin-chip{border:1px solid #334155;background:rgba(15,23,42,.8);border-radius:6px;padding:3px 6px;font-size:9.5px;color:#94a3b8;cursor:pointer;transition:all .15s;}');
    window.cssAdd('.ck-skin-chip:hover{border-color:#38bdf8;color:#fff;}');
    window.cssAdd('.ck-skin-chip.active{border-color:#fbbf24;color:#fbbf24;background:rgba(251,191,36,.15);font-weight:bold;}');
    window.cssAdd('.ck-skin-chip.buy{border-color:#10b981;color:#34d399;}');
    window.cssAdd('.ck-pet-hit-spark{position:absolute;pointer-events:none;border-radius:50%;background:radial-gradient(circle,#ffffff,#ffd76a 45%,transparent);z-index:35;animation:ckPetHitPulse .35s ease-out forwards;}');
    window.cssAdd('@keyframes ckPetHitPulse{0%{transform:translate(-50%,-50%) scale(0.4);opacity:1;}100%{transform:translate(-50%,-50%) scale(2.4);opacity:0;}}');
    window.cssAdd('.ck-disc-strike{animation:ckDiscStrike .25s ease-out!important;}');
    window.cssAdd('@keyframes ckDiscStrike{0%{transform:scale(1);filter:none;}40%{transform:scale(0.96);filter:brightness(0.9) drop-shadow(0 0 8px var(--strike-glow, rgba(56,189,248,0.25)));}100%{transform:scale(1);filter:none;}}');
    /* Стили 3D-мутаций планет */
    window.cssAdd('.ck-mut-orb{position:relative;width:40px;height:40px;border-radius:50%;flex:none;box-shadow:0 0 16px currentColor,inset -5px -6px 12px rgba(0,0,0,.8);overflow:hidden;}');
    window.cssAdd('.ck-mut-orb::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.7),transparent 55%);pointer-events:none;}');
    window.cssAdd('.ck-mut-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotateX(68deg);border-radius:50%;border:2px solid currentColor;pointer-events:none;width:56px;height:24px;box-shadow:0 0 10px currentColor;}');
    window.cssAdd('.ck-mut-bh-core{width:100%;height:100%;border-radius:50%;background:#000;box-shadow:0 0 20px #c084fc,inset 0 0 10px #7e22ce;}');
    /* Полный мобильный адаптив верстки (Портретный режим: 100% UI Fit для кликера, админки и модалок) */
    window.cssAdd('@media(max-width:768px){\n' +
      '#clicker-panel{flex-direction:column!important;width:98vw!important;height:96dvh!important;height:96vh!important;border-radius:16px!important;}\n' +
      '#clicker-left{flex:0 0 auto!important;max-height:48%!important;overflow-y:auto!important;padding:6px 8px!important;gap:4px!important;}\n' +
      '#clicker-right{width:100%!important;flex:1 1 auto!important;min-height:0!important;border-left:none!important;border-top:1px solid #26306a!important;}\n' +
      '#ck-disc{width:min(160px,36vw)!important;height:min(160px,36vw)!important;}\n' +
      '#ck-disc-name{font-size:14px!important;}\n' +
      '#ck-stats{font-size:11px!important;line-height:1.25!important;padding:4px!important;}\n' +
      '#ck-prbar{width:94%!important;height:9px!important;}\n' +
      '.ck-actions{gap:4px!important;}\n' +
      '.ck-actions button{padding:5px 8px!important;font-size:10px!important;border-radius:8px!important;}\n' +
      '#ck-player{padding:4px 6px!important;margin-top:2px!important;gap:4px!important;}\n' +
      '#ck-track-name{font-size:10px!important;}\n' +
      '#ck-mvol{width:45px!important;}\n' +
      '#ck-autop{padding:2px!important;gap:2px!important;}\n' +
      '.ck-apbtn{min-width:58px!important;font-size:8.5px!important;padding:3px 4px!important;}\n' +
      '#ck-uplist{padding:4px!important;gap:4px!important;}\n' +
      '.ck-up{min-height:32px!important;padding:3px 6px!important;font-size:10px!important;}\n' +
      '#ck-admin-modal{align-items:flex-start!important;padding-top:10px!important;overflow-y:auto!important;}\n' +
      '#ck-admin-box{width:96vw!important;max-height:94dvh!important;padding:12px!important;border-radius:14px!important;overflow-y:auto!important;}\n' +
      '#ck-give-box{max-height:55vh!important;overflow-y:auto!important;padding-right:4px!important;}\n' +
      '#ck-tree-box,#ck-pass-box,#ck-mut-box,#ck-wheel-box,#ck-col-box,#ck-ach-box,#ck-pet-box,#ck-shop-box,#ck-inv-box,#ck-lb-box{width:96vw!important;max-height:94dvh!important;max-height:94vh!important;padding:12px 10px!important;border-radius:16px!important;}\n' +
      '.ck-tree-columns{grid-template-columns:1fr!important;gap:8px!important;}\n' +
      '.ck-pass-row{grid-template-columns:42px 1fr 1fr!important;gap:4px!important;padding:6px 4px!important;font-size:9.5px!important;}\n' +
      '.ck-pass-reward-card{padding:3px 5px!important;font-size:9.5px!important;}\n' +
      '.ck-mut-grid{grid-template-columns:1fr!important;gap:6px!important;}\n' +
      '.ck-col-grid{grid-template-columns:repeat(5,1fr)!important;gap:3px!important;}\n' +
      '.ck-col-slot{padding:3px 1px!important;}\n' +
      '.ck-col-title{font-size:8px!important;}\n' +
      '.ck-wheel-container{width:180px!important;height:180px!important;}\n' +
      '#ck-wheel-canvas{width:180px!important;height:180px!important;}\n' +
      '.ck-spin-btn{min-width:100%!important;padding:7px!important;font-size:10px!important;}\n' +
    '}');
  }

  function grantReward(type, meta) {
    var CK = window.CK;
    if (type === 'mult') {
      CK.mult = (CK.mult || 1) + meta.val;
      if (window.ckToast) window.ckToast('НАГРАДА: +' + meta.val + ' к множителю!');
    } else if (type === 'item') {
      for (var i = 0; i < (meta.cnt || 1); i++) CK.inv.push(meta.id);
      if (window.ckInvRender) window.ckInvRender();
      if (window.ckToast) window.ckToast('НАГРАДА: +' + meta.cnt + ' ' + meta.id + '!');
    } else if (type === 'boost') {
      if (window.__CKAPI && window.__CKAPI.CK) {
        var now = Date.now();
        CK.boost = CK.boost || {};
        var cur = CK.boost[meta.id] > now ? CK.boost[meta.id] : now;
        CK.boost[meta.id] = cur + (meta.dur || 60) * 1000;
        if (window.ckToast) window.ckToast('НАГРАДА: Активирован буст ' + meta.id + '!');
      }
    } else if (type === 'perm_gold') {
      FEAT.stats.permGoldBonus = (FEAT.stats.permGoldBonus || 0) + meta.val;
      if (window.ckToast) window.ckToast('НАГРАДА: +' + meta.val + '% дохода навсегда!');
    }
    if (window.sfxBuy) window.sfxBuy();
    if (window.ckSave) window.ckSave();
    saveState();
    if (window.render) window.render(true);
  }

  function buildUI() {
    injectStyles();
    var acts = document.getElementById('ck-actions') || document.querySelector('.ck-actions');
    if (!acts) return;
    if (document.getElementById('ck-achbtn')) return;

    var btn = document.createElement('button');
    btn.id = 'ck-achbtn';
    btn.textContent = 'АЧИВКИ';
    acts.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = 'ck-ach-modal';
    modal.className = 'clicker-ui hidden';

    var box = document.createElement('div');
    box.id = 'ck-ach-box';
    box.innerHTML = '<h2>ДОСТИЖЕНИЯ И ДЕЙЛИКИ</h2><div id="ck-ach-content"></div>';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'ck-close-ach';
    closeBtn.textContent = 'ЗАКРЫТЬ';
    closeBtn.addEventListener('click', function () { modal.classList.add('hidden'); });

    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    btn.addEventListener('click', function () {
      modal.classList.remove('hidden');
      renderAchievementsModal();
    });

    buildWheelUI(acts);
    buildCollectionUI(acts);
    buildPetsUI(acts);
    buildSkillTreeUI(acts);
    buildSeasonPassUI(acts);
    buildMutationsUI(acts);
  }

  function renderAchievementsModal() {
    var wrap = document.getElementById('ck-ach-content');
    if (!wrap) return;
    checkDailyReset();
    var h = '<div class="ck-ach-section-title">ЕЖЕДНЕВНЫЕ ЗАДАНИЯ (СБРОС В 00:00)</div>';

    FEAT.daily.forEach(function (d, idx) {
      var pct = Math.min(100, Math.floor((d.prog / d.target) * 100));
      var isDone = d.prog >= d.target;
      var statusCls = d.claim ? 'claimed' : (isDone ? 'done' : '');
      var btnText = d.claim ? 'ЗАБРАНО' : (isDone ? 'ЗАБРАТЬ' : d.prog + '/' + d.target);
      h += '<div class="ck-ach-row ' + statusCls + '">' +
        '<div class="ck-ach-info">' +
          '<div class="ck-ach-name">' + d.desc + '</div>' +
          '<div class="ck-ach-rew">Награда: ' + d.rew.label + '</div>' +
          '<div class="ck-ach-pbar"><div class="ck-ach-pfill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<button class="ck-ach-claimbtn" data-daily="' + idx + '" ' + ((!isDone || d.claim) ? 'disabled' : '') + '>' + btnText + '</button>' +
      '</div>';
    });

    h += '<div class="ck-ach-section-title">ОСНОВНЫЕ ДОСТИЖЕНИЯ</div>';

    FEAT.achievements.forEach(function (a, idx) {
      var curVal = 0;
      if (a.cat === 'clicks') curVal = FEAT.stats.totalManualClicks;
      else if (a.cat === 'voids') curVal = FEAT.stats.totalVoidsCollected;
      else if (a.cat === 'rebirths') curVal = FEAT.stats.totalRebirthsCompleted;
      var pct = Math.min(100, Math.floor((curVal / a.target) * 100));
      var isDone = curVal >= a.target;
      var statusCls = a.claim ? 'claimed' : (isDone ? 'done' : '');
      var btnText = a.claim ? 'ЗАБРАНО' : (isDone ? 'ЗАБРАТЬ' : (window.fmtNum ? window.fmtNum(curVal) : curVal) + '/' + (window.fmtNum ? window.fmtNum(a.target) : a.target));
      h += '<div class="ck-ach-row ' + statusCls + '">' +
        '<div class="ck-ach-info">' +
          '<div class="ck-ach-name">' + a.title + '</div>' +
          '<div class="ck-ach-sub">' + a.desc + '</div>' +
          '<div class="ck-ach-rew">Награда: ' + a.rew + '</div>' +
          '<div class="ck-ach-pbar"><div class="ck-ach-pfill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<button class="ck-ach-claimbtn" data-ach="' + idx + '" ' + ((!isDone || a.claim) ? 'disabled' : '') + '>' + btnText + '</button>' +
      '</div>';
    });

    wrap.innerHTML = h;

    wrap.querySelectorAll('button[data-daily]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.getAttribute('data-daily'), 10);
        var item = FEAT.daily[i];
        if (!item || item.claim || item.prog < item.target) return;
        item.claim = true;
        grantReward(item.rew.type, item.rew);
        renderAchievementsModal();
      });
    });

    wrap.querySelectorAll('button[data-ach]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.getAttribute('data-ach'), 10);
        var item = FEAT.achievements[i];
        var curVal = item.cat === 'clicks' ? FEAT.stats.totalManualClicks : (item.cat === 'voids' ? FEAT.stats.totalVoidsCollected : FEAT.stats.totalRebirthsCompleted);
        if (!item || item.claim || curVal < item.target) return;
        item.claim = true;
        grantReward(item.rewType, { val: item.rewVal });
        renderAchievementsModal();
      });
    });
  }

  function hookEngine() {
    loadState();
    buildUI();

    // Инъекция бонусов (Коллекция + Постоянный голд + Питомцы)
    if (window.ckGoldMul) {
      var origGoldMul = window.ckGoldMul;
      window.ckGoldMul = function () {
        var base = origGoldMul();
        var colBonus = isFullSetCollected() ? 0.25 : 0;
        var permBonus = (FEAT.stats.permGoldBonus || 0) / 100;
        var petMult = 0;
        PETS_CONFIG.forEach(function (p) {
          if (hasPet(p.id) && p.type === 'passive_mult') petMult += (p.val / 100);
        });
        var cometMult = isCometBuffActive() ? 2 : 1;
        var treeIncomeBonus = 0;
        var incLvl1 = getSkillLevel('income', 'inc_mult');
        var incLvl3 = getSkillLevel('income', 'inc_warp');
        treeIncomeBonus += (incLvl1 * 0.50) + (incLvl3 * 3.00);

        var activeMut = getActivePlanetMutation();
        var mutIncome = 0;
        if (activeMut.type === 'income_pct' || activeMut.type === 'singularity') {
          mutIncome = activeMut.val;
        }

        return base * (1 + colBonus + permBonus + petMult + treeIncomeBonus + mutIncome) * cometMult;
      };
    }

    // Инъекция бонусов CPS от мутаций
    if (window.ckCps) {
      var origCkCps = window.ckCps;
      window.ckCps = function () {
        var base = origCkCps();
        var m = getActivePlanetMutation();
        if (m.type === 'auto_cps') base *= (1 + m.val);
        return base;
      };
    }

    // Инъекция бонусов силы клика от мутаций
    if (window.ckPower) {
      var origCkPower = window.ckPower;
      window.ckPower = function () {
        var base = origCkPower();
        var m = getActivePlanetMutation();
        if (m.type === 'click_power') base *= (1 + m.val);
        return base;
      };
    }

    // Инъекция бонусов крита из Дерева Навыков и Мутаций
    if (window.ckCrit) {
      var origCkCrit = window.ckCrit;
      window.ckCrit = function () {
        var base = origCkCrit();
        var addChance = getSkillLevel('crit', 'crit_chance') * 3 + getSkillLevel('crit', 'crit_overload') * 10;
        var m = getActivePlanetMutation();
        if (m.type === 'crit_chance') addChance += m.val;
        if (m.type === 'singularity') addChance += m.critVal;
        return Math.min(100, base + addChance);
      };
    }
    if (window.ckCritMul) {
      var origCkCritMul = window.ckCritMul;
      window.ckCritMul = function () {
        var base = origCkCritMul();
        var addMult = getSkillLevel('crit', 'crit_damage') * 2 + getSkillLevel('crit', 'crit_overload') * 5;
        var m = getActivePlanetMutation();
        if (m.type === 'crit_mult') addMult += m.val;
        return base + addMult;
      };
    }

    updatePlanetMutationHUD();

    scheduleNextComet();
    applyPrestigeVisuals();
    setInterval(applyPrestigeVisuals, 2000);

    refreshPetVisuals();
    startPetOrbitEngine();

    // Перехват кликов по диску
    var disc = document.getElementById('ck-disc');
    if (disc) {
      disc.addEventListener('click', function () {
        FEAT.stats.totalManualClicks++;
        addSeasonXP(1);
        var dClicks = FEAT.daily.find(function (d) { return d.id === 'd_clicks'; });
        if (dClicks && !dClicks.done) {
          dClicks.prog++;
          if (dClicks.prog >= dClicks.target) {
            dClicks.done = true;
            if (window.ckToast) window.ckToast('Дейлик выполнен: 10K кликов!');
          }
        }
        saveState();
      });
    }

    // Трекинг дропа пустоты
    var prevInvLen = window.CK && window.CK.inv ? window.CK.inv.length : 0;
    setInterval(function () {
      if (!window.CK || !window.CK.inv) return;
      if (window.CK.inv.length > prevInvLen) {
        var added = window.CK.inv.slice(prevInvLen);
        added.forEach(function (itemId) {
          if (itemId === 'void') {
            FEAT.stats.totalVoidsCollected++;
            var dVoid = FEAT.daily.find(function (d) { return d.id === 'd_voids'; });
            if (dVoid && !dVoid.done) {
              dVoid.prog++;
              if (dVoid.prog >= dVoid.target) {
                dVoid.done = true;
                if (window.ckToast) window.ckToast('Дейлик выполнен: 5 Пустот собрано!');
              }
            }
            saveState();
          }
        });
      }
      prevInvLen = window.CK.inv.length;
    }, 500);

    // Трекинг реберфов
    var curReb = window.CK ? (window.CK.rebirths || 0) : 0;
    setInterval(function () {
      if (!window.CK) return;
      var nxtReb = window.CK.rebirths || 0;
      if (nxtReb > curReb) {
        var diff = nxtReb - curReb;
        FEAT.stats.totalRebirthsCompleted += diff;
        var dRb = FEAT.daily.find(function (d) { return d.id === 'd_rebirth'; });
        if (dRb && !dRb.done) {
          dRb.prog += diff;
          if (dRb.prog >= dRb.target) {
            dRb.done = true;
            if (window.ckToast) window.ckToast('Дейлик выполнен: 3 реберфа!');
          }
        }
        saveState();
      }
      curReb = nxtReb;
    }, 600);
  }

  /* Колесо Фортуны / Кейсы */
  var WHEEL_SECTORS = [
    { label: '+10 Реберфов', type: 'rebirth', val: 10, col: '#ef4444' },
    { label: 'Void Elixir', type: 'boost', id: 'voidflask', dur: 120, col: '#8b5cf6' },
    { label: '+50x Множитель', type: 'mult', val: 50, col: '#3b82f6' },
    { label: '1 Пустота', type: 'item', id: 'void', cnt: 1, col: '#ec4899' },
    { label: 'Gold Rush (1ч)', type: 'boost', id: 'gold', dur: 3600, col: '#eab308' },
    { label: 'Дыхание Сверхновой', type: 'boost', id: 'supernova', dur: 600, col: '#f97316' },
    { label: '+5x Множитель', type: 'mult', val: 5, col: '#10b981' },
    { label: '3 Ядра', type: 'item', id: 'core', cnt: 3, col: '#06b6d4' }
  ];

  var isSpinning = false;
  var wheelAngle = 0;

  function drawWheel(canvas) {
    var ctx = canvas.getContext('2d');
    var num = WHEEL_SECTORS.length;
    var arc = (2 * Math.PI) / num;
    var r = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    WHEEL_SECTORS.forEach(function (sec, i) {
      var a = i * arc;
      ctx.beginPath();
      ctx.fillStyle = sec.col;
      ctx.moveTo(r, r);
      ctx.arc(r, r, r, a, a + arc);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(r, r);
      ctx.rotate(a + arc / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(sec.label, r - 12, 4);
      ctx.restore();
    });
  }

  function buildWheelUI(acts) {
    if (document.getElementById('ck-wheelbtn')) return;
    var btn = document.createElement('button');
    btn.id = 'ck-wheelbtn';
    btn.textContent = 'РУЛЕТКА';
    acts.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = 'ck-wheel-modal';
    modal.className = 'clicker-ui hidden';

    var box = document.createElement('div');
    box.id = 'ck-wheel-box';
    box.innerHTML = '<h2>КОЛЕСО ФОРТУНЫ</h2>' +
      '<div class="ck-wheel-container">' +
        '<div class="ck-wheel-pointer"></div>' +
        '<canvas id="ck-wheel-canvas" width="280" height="280"></canvas>' +
      '</div>' +
      '<div id="ck-wheel-res">Испытай удачу!</div>' +
      '<div class="ck-wheel-spinners">' +
        '<button id="ck-spin-clk" class="ck-spin-btn ck-spin-clicks">КРУТИТЬ ЗА 100Q КЛИКОВ</button>' +
        '<button id="ck-spin-shd" class="ck-spin-btn ck-spin-shards">КРУТИТЬ ЗА 1 МИСТИК (ПУСТОТА)</button>' +
      '</div>';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'ck-close-wheel';
    closeBtn.textContent = 'ЗАКРЫТЬ';
    closeBtn.addEventListener('click', function () {
      if (!isSpinning) modal.classList.add('hidden');
    });

    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    var canvas = box.querySelector('#ck-wheel-canvas');
    drawWheel(canvas);

    var btnClk = box.querySelector('#ck-spin-clk');
    var btnShd = box.querySelector('#ck-spin-shd');
    var resEl = box.querySelector('#ck-wheel-res');

    btn.addEventListener('click', function () {
      modal.classList.remove('hidden');
      updateWheelButtons(btnClk, btnShd);
    });

    btnClk.addEventListener('click', function () {
      if (isSpinning || !window.CK || window.CK.clicks < 1e17) return;
      window.CK.clicks -= 1e17;
      if (window.render) window.render();
      startSpin(canvas, resEl, btnClk, btnShd);
    });

    btnShd.addEventListener('click', function () {
      if (isSpinning || !window.CK || !window.CK.inv) return;
      var voidIdx = window.CK.inv.lastIndexOf('void');
      if (voidIdx === -1) return;
      window.CK.inv.splice(voidIdx, 1);
      if (window.ckInvRender) window.ckInvRender();
      startSpin(canvas, resEl, btnClk, btnShd);
    });
  }

  /* Блок 3: Коллекции и Мердж */
  var MERGE_RECIPES = [
    { from: 'shard', to: 'core', fromName: 'Осколок', toName: 'Ядро', col: '#37e08a' },
    { from: 'core', to: 'prism', fromName: 'Ядро', toName: 'Призма', col: '#b04dff' },
    { from: 'prism', to: 'nova', fromName: 'Призма', toName: 'Нова', col: '#ffd23f' },
    { from: 'nova', to: 'void', fromName: 'Нова', toName: 'Пустота', col: '#ff4d6d' }
  ];

  /* 3D-модели кристаллов и космических артефактов */
  function generateItem3DHtml(itemType, size) {
    var s = size || 32;
    var map = {
      shard: { col: '#38bdf8', glow: 'rgba(56,189,248,0.5)', clip: 'polygon(50% 0%, 90% 40%, 75% 100%, 25% 100%, 10% 40%)', facet: 'linear-gradient(135deg, #fff 15%, #38bdf8 65%, #0369a1)' },
      core: { col: '#fbbf24', glow: 'rgba(251,191,36,0.6)', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', facet: 'linear-gradient(135deg, #fff 20%, #fbbf24 60%, #b45309)' },
      prism: { col: '#a855f7', glow: 'rgba(168,85,247,0.6)', clip: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)', facet: 'linear-gradient(145deg, #fff 25%, #c084fc 60%, #6b21a8)' },
      nova: { col: '#f97316', glow: 'rgba(249,115,22,0.7)', clip: 'polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)', facet: 'radial-gradient(circle at 35% 35%, #fff 20%, #f97316 65%, #9a3412)' },
      void: { col: '#6366f1', glow: 'rgba(99,102,241,0.8)', clip: 'circle(48% at 50% 50%)', facet: 'radial-gradient(circle at 35% 35%, #000 30%, #312e81 70%, #6366f1)' }
    };
    var conf = map[itemType] || map.shard;
    return '<div class="ck-item-3d" style="width:' + s + 'px;height:' + s + 'px;position:relative;display:inline-flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 6px ' + conf.glow + ');">' +
      '<div style="width:' + (s * 0.82) + 'px;height:' + (s * 0.82) + 'px;clip-path:' + conf.clip + ';background:' + conf.facet + ';box-shadow:inset 0 0 4px rgba(255,255,255,0.7);transition:transform 0.2s;"></div>' +
    '</div>';
  }

  function getInvCount(id) {
    var c = 0;
    if (window.CK && window.CK.inv) {
      window.CK.inv.forEach(function (it) { if (it === id) c++; });
    }
    return c;
  }

  function isFullSetCollected() {
    var items = ['shard', 'core', 'prism', 'nova', 'void'];
    return items.every(function (it) { return getInvCount(it) >= 1; });
  }

  function executeMerge(fromId, toId) {
    if (getInvCount(fromId) < 3) return false;
    var rem = 0;
    for (var i = window.CK.inv.length - 1; i >= 0 && rem < 3; i--) {
      if (window.CK.inv[i] === fromId) {
        window.CK.inv.splice(i, 1);
        rem++;
      }
    }
    window.CK.inv.push(toId);
    if (toId === 'void') {
      FEAT.stats.totalVoidsCollected++;
      saveState();
    }
    if (window.ckInvRender) window.ckInvRender();
    if (window.sfxBuy) window.sfxBuy();
    if (window.ckSave) window.ckSave();
    return true;
  }

  function buildCollectionUI(acts) {
    if (document.getElementById('ck-colbtn')) return;
    var btn = document.createElement('button');
    btn.id = 'ck-colbtn';
    btn.textContent = 'КОЛЛЕКЦИЯ';
    acts.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = 'ck-col-modal';
    modal.className = 'clicker-ui hidden';

    var box = document.createElement('div');
    box.id = 'ck-col-box';
    box.innerHTML = '<h2>КОЛЛЕКЦИЯ И МЕРДЖ</h2>' +
      '<div id="ck-col-info" class="ck-col-status"></div>' +
      '<div class="ck-ach-section-title">СЕТ АРТЕФАКТОВ (+25% К ДОХОДУ ЗА ФУЛЛ-СЕТ)</div>' +
      '<div id="ck-col-slots" class="ck-col-grid"></div>' +
      '<div class="ck-ach-section-title">СИНТЕЗ (3 В 1 ВЫШЕГО ТИРА)</div>' +
      '<div id="ck-merge-list"></div>';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'ck-close-col';
    closeBtn.textContent = 'ЗАКРЫТЬ';
    closeBtn.addEventListener('click', function () { modal.classList.add('hidden'); });

    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    btn.addEventListener('click', function () {
      modal.classList.remove('hidden');
      renderCollectionModal(box);
    });
  }

  function renderCollectionModal(box) {
    var infoEl = box.querySelector('#ck-col-info');
    var slotsEl = box.querySelector('#ck-col-slots');
    var mergeEl = box.querySelector('#ck-merge-list');

    var fullSet = isFullSetCollected();
    infoEl.innerHTML = fullSet
      ? '<span style="color:#37e08a;font-weight:900;">✓ ПОЛНЫЙ СЕТ АКТИВЕН!</span> Бонус: <b>+25% ко всем доходам</b>'
      : 'Собери по 1 предмету каждого типа (Осколок → Пустота) для бонуса <b>+25% дохода</b>!';

    var itemsMeta = [
      { id: 'shard', n: 'Осколок', col: '#9fb8ff' },
      { id: 'core', n: 'Ядро', col: '#37e08a' },
      { id: 'prism', n: 'Призма', col: '#b04dff' },
      { id: 'nova', n: 'Нова', col: '#ffd23f' },
      { id: 'void', n: 'Пустота', col: '#ff4d6d' }
    ];

    var slotsH = '';
    itemsMeta.forEach(function (m) {
      var cnt = getInvCount(m.id);
      slotsH += '<div class="ck-col-slot ' + (cnt > 0 ? 'has' : '') + '">' +
        generateItem3DHtml(m.id, 32) +
        '<div class="ck-col-title">' + m.n + '</div>' +
        '<div style="font-size:11px;font-weight:800;color:' + (cnt > 0 ? '#38bdf8' : '#64748b') + '">x' + cnt + '</div>' +
      '</div>';
    });
    slotsEl.innerHTML = slotsH;

    var mergeH = '';
    MERGE_RECIPES.forEach(function (r, idx) {
      var cnt = getInvCount(r.from);
      var can = cnt >= 3;
      mergeH += '<div class="ck-merge-row" style="display:flex;align-items:center;gap:10px;">' +
        generateItem3DHtml(r.from, 24) +
        '<span style="color:#64748b;font-weight:bold;">→</span>' +
        generateItem3DHtml(r.to, 24) +
        '<div class="ck-merge-info" style="flex:1;">' +
          '<span style="color:#cbd5e1">3 ' + r.fromName + '</span> → <b style="color:' + r.col + '">1 ' + r.toName + '</b>' +
          '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">В наличии: ' + cnt + '/3</div>' +
        '</div>' +
        '<button class="ck-merge-btn" data-merge="' + idx + '" ' + (can ? '' : 'disabled') + '>СИНТЕЗ</button>' +
      '</div>';
    });
    mergeEl.innerHTML = mergeH;

    mergeEl.querySelectorAll('button[data-merge]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-merge'), 10);
        var r = MERGE_RECIPES[idx];
        if (executeMerge(r.from, r.to)) {
          if (window.ckToast) window.ckToast('Синтезировано: 1 ' + r.toName);
          renderCollectionModal(box);
          if (window.render) window.render();
        }
      });
    });
  }

  /* Блок 4: Питомцы и Компаньоны (Псевдо-3D Модели) */
  var PETS_CONFIG = [
    { id: 'pet_drone', name: 'Квантовый Дрон V-1', styleType: 'drone', cost: 1, type: 'autoclick', rate: 2, col: '#38bdf8', desc: 'Автоклик: 2 раза/сек' },
    { id: 'pet_wisp', name: 'Астральная Сфера', styleType: 'wisp', cost: 3, type: 'passive_mult', val: 15, col: '#fde047', desc: 'Пассивка: +15% к доходу' },
    { id: 'pet_dragon', name: 'Плазменный Дракон', styleType: 'dragon', cost: 10, type: 'autoclick', rate: 6, col: '#c084fc', desc: 'Автоклик: 6 раз/сек' },
    { id: 'pet_phoenix', name: 'Сверхновый Феникс', styleType: 'phoenix', cost: 25, type: 'passive_mult', val: 50, col: '#f97316', desc: 'Пассивка: +50% к доходу' },
    { id: 'pet_slime', name: 'Небула-Слизень', styleType: 'slime', cost: 50, type: 'autoclick', rate: 20, col: '#10b981', desc: 'Автоклик: 20 раз/сек' },
    { id: 'pet_chronos', name: 'Хроно-Страж', styleType: 'chronos', cost: 100, type: 'passive_mult', val: 150, col: '#06b6d4', desc: 'Пассивка: +150% к доходу' },
    { id: 'pet_reaper', name: 'Жнец Пустоты', styleType: 'reaper', cost: 250, type: 'autoclick', rate: 60, col: '#8b5cf6', desc: 'Автоклик: 60 раз/сек' },
    { id: 'pet_pulsar', name: 'Квазарный Пульсар', styleType: 'pulsar', cost: 500, type: 'passive_mult', val: 400, col: '#ec4899', desc: 'Пассивка: +400% к доходу' },
    { id: 'pet_omega', name: 'Омега-Демиург Бездны', styleType: 'omega', cost: 0, isSuper: true, type: 'super', rate: 200, col: '#f43f5e', desc: 'Цена: 1 СУПЕР! Автоклик 200/сек + «Апокалипсис Бездны» (взрыв x2500 кликов)!' }
  ];

  /* Конфигурация Скинов Питомцев */
  var PET_SKINS_CONFIG = {
    pet_drone: [
      { id: 'default', name: 'Стандарт', col: '#38bdf8', costShards: 0 },
      { id: 'cyber_neon', name: 'Киберпанк 2077', col: '#00ffcc', costShards: 15 },
      { id: 'gold', name: 'Золотой Дрон', col: '#fbbf24', costShards: 25 },
      { id: 'void', name: 'Дрон Бездны', col: '#c084fc', costShards: 45 },
      { id: 'stealth_ops', name: 'Стелс-Разведчик', col: '#475569', costShards: 30 },
      { id: 'plasma_surge', name: 'Плазменный Заряд', col: '#ec4899', costShards: 40 },
      { id: 'solar_flare', name: 'Солнечная Вспышка', col: '#f97316', costShards: 50 },
      { id: 'toxic_hazard', name: 'Токсичный Дрон', col: '#a3e635', costShards: 60 },
      { id: 'nano_swarm', name: 'Нано-Рой', col: '#22d3ee', costShards: 75 }
    ],
    pet_wisp: [
      { id: 'default', name: 'Стандарт', col: '#fde047', costShards: 0 },
      { id: 'crimson', name: 'Кровавая Луна', col: '#f43f5e', costShards: 25 },
      { id: 'emerald', name: 'Изумрудная Душа', col: '#10b981', costShards: 35 },
      { id: 'amethyst', name: 'Аметистовый Ореол', col: '#a855f7', costShards: 50 },
      { id: 'frost_spirit', name: 'Ледяной Дух', col: '#67e8f9', costShards: 40 },
      { id: 'shadow_shade', name: 'Теневой Сгусток', col: '#64748b', costShards: 55 },
      { id: 'arcane_flame', name: 'Тайное Пламя', col: '#818cf8', costShards: 70 },
      { id: 'golden_spark', name: 'Золотая Искра', col: '#eab308', costShards: 85 },
      { id: 'nebula_core', name: 'Ядро Туманности', col: '#f43f5e', costShards: 100 }
    ],
    pet_dragon: [
      { id: 'default', name: 'Стандарт', col: '#c084fc', costShards: 0 },
      { id: 'ice', name: 'Ледяной Вайверн', col: '#06b6d4', costShards: 60 },
      { id: 'inferno', name: 'Адское Пламя', col: '#ef4444', costShards: 90 },
      { id: 'toxic', name: 'Токсичный Неон', col: '#84cc16', costShards: 120 },
      { id: 'storm_drake', name: 'Громовой Дракон', col: '#38bdf8', costShards: 80 },
      { id: 'obsidian_wyrm', name: 'Обсидиановый Змей', col: '#334155', costShards: 110 },
      { id: 'golden_emperor', name: 'Золотой Император', col: '#facc15', costShards: 140 },
      { id: 'void_tyrant', name: 'Тиран Пустоты', col: '#7e22ce', costShards: 170 },
      { id: 'celestial_drake', name: 'Небесный Дракон', col: '#f8fafc', costShards: 200 }
    ],
    pet_phoenix: [
      { id: 'default', name: 'Стандарт', col: '#f97316', costShards: 0 },
      { id: 'solar', name: 'Солнечная Буря', col: '#facc15', costShards: 80 },
      { id: 'dark', name: 'Пепельный Призрак', col: '#7e22ce', costShards: 120 },
      { id: 'supernova', name: 'Квазарный Всплеск', col: '#ec4899', costShards: 160 },
      { id: 'blue_flame', name: 'Лазурное Пламя', col: '#0284c7', costShards: 100 },
      { id: 'emerald_phoenix', name: 'Изумрудный Феникс', col: '#059669', costShards: 130 },
      { id: 'crystal_fire', name: 'Хрустальный Огонь', col: '#e0e7ff', costShards: 170 },
      { id: 'crimson_wrath', name: 'Багровая Ярость', col: '#b91c1c', costShards: 210 },
      { id: 'cosmic_dawn', name: 'Космический Рассвет', col: '#fb7185', costShards: 250 }
    ],
    pet_slime: [
      { id: 'default', name: 'Стандарт', col: '#10b981', costShards: 0 },
      { id: 'radioactive', name: 'Радиоактивный Желе', col: '#22c55e', costShards: 40 },
      { id: 'bubblegum', name: 'Розовый Бабл-Гам', col: '#f472b6', costShards: 65 },
      { id: 'cosmic_goo', name: 'Космическая Слизь', col: '#6366f1', costShards: 95 },
      { id: 'lava_puddle', name: 'Лавовый Сгусток', col: '#f97316', costShards: 50 },
      { id: 'gold_jelly', name: 'Золотой Мармелад', col: '#fbbf24', costShards: 75 },
      { id: 'ice_cube', name: 'Ледяной Слайм', col: '#38bdf8', costShards: 100 },
      { id: 'shadow_tar', name: 'Смоляная Тьма', col: '#1e293b', costShards: 125 },
      { id: 'rainbow_ooze', name: 'Радужная Жижа', col: '#a855f7', costShards: 150 }
    ],
    pet_chronos: [
      { id: 'default', name: 'Стандарт', col: '#06b6d4', costShards: 0 },
      { id: 'antique_brass', name: 'Винтажный Стимпанк', col: '#d97706', costShards: 75 },
      { id: 'time_rift', name: 'Разрыв Времени', col: '#8b5cf6', costShards: 110 },
      { id: 'white_hole', name: 'Абсолютный Ноль', col: '#e0f2fe', costShards: 150 },
      { id: 'quantum_clock', name: 'Квантовый Хронометр', col: '#10b981', costShards: 90 },
      { id: 'blood_hour', name: 'Кровавые Часы', col: '#ef4444', costShards: 125 },
      { id: 'golden_era', name: 'Золотая Эпоха', col: '#eab308', costShards: 160 },
      { id: 'singularity_dial', name: 'Циферблат Бездны', col: '#4f46e5', costShards: 195 },
      { id: 'infinity_pendulum', name: 'Маятник Вечности', col: '#f43f5e', costShards: 240 }
    ],
    pet_reaper: [
      { id: 'default', name: 'Стандарт', col: '#8b5cf6', costShards: 0 },
      { id: 'soul_eater', name: 'Пожиратель Душ', col: '#14b8a6', costShards: 90 },
      { id: 'blood_harvest', name: 'Кровавая Жатва', col: '#dc2626', costShards: 130 },
      { id: 'celestial', name: 'Ангел Забвения', col: '#fef08a', costShards: 180 },
      { id: 'frost_death', name: 'Ледяной Мрак', col: '#0284c7', costShards: 110 },
      { id: 'phantom_neon', name: 'Призрачный Неон', col: '#22c55e', costShards: 145 },
      { id: 'golden_grim', name: 'Золотой Жнец', col: '#f59e0b', costShards: 185 },
      { id: 'abyssal_dread', name: 'Ужас Глубин', col: '#312e81', costShards: 220 },
      { id: 'void_emperor_reaper', name: 'Император Смерти', col: '#9333ea', costShards: 270 }
    ],
    pet_pulsar: [
      { id: 'default', name: 'Стандарт', col: '#ec4899', costShards: 0 },
      { id: 'gamma_burst', name: 'Гамма-Вспышка', col: '#38bdf8', costShards: 110 },
      { id: 'antimatter', name: 'Антиматерия', col: '#e11d48', costShards: 160 },
      { id: 'hyperdrive', name: 'Гипер-Свет', col: '#a855f7', costShards: 220 },
      { id: 'solar_radiation', name: 'Солнечное Излучение', col: '#f97316', costShards: 130 },
      { id: 'radio_quasar', name: 'Радио-Квазар', col: '#14b8a6', costShards: 175 },
      { id: 'electric_pulsar', name: 'Электро-Импульс', col: '#fde047', costShards: 215 },
      { id: 'dark_matter_pulsar', name: 'Темная Материя', col: '#4338ca', costShards: 260 },
      { id: 'cosmic_nexus', name: 'Космический Нексус', col: '#fb7185', costShards: 310 }
    ],
    pet_omega: [
      { id: 'default', name: 'Стандарт', col: '#f43f5e', costShards: 0 },
      { id: 'singularity_core', name: 'Абсолютная Сингулярность', col: '#3b82f6', costShards: 200 },
      { id: 'golden_god', name: 'Золотой Творец', col: '#fbbf24', costShards: 300 },
      { id: 'void_monarch', name: 'Монарх Бездны', col: '#c084fc', costShards: 450 },
      { id: 'cyber_demiurge', name: 'Кибер-Демиург', col: '#06b6d4', costShards: 250 },
      { id: 'blood_titan', name: 'Кровавый Титан', col: '#dc2626', costShards: 350 },
      { id: 'stellar_deity', name: 'Звездное Божество', col: '#fef08a', costShards: 420 },
      { id: 'emerald_overlord', name: 'Изумрудный Владыка', col: '#10b981', costShards: 500 },
      { id: 'infinity_alpha', name: 'Альфа Бесконечности', col: '#ec4899', costShards: 600 }
    ]
  };

  function getPetSkinId(petId) {
    FEAT.petSkins = FEAT.petSkins || {};
    return FEAT.petSkins[petId] || 'default';
  }

  function getPetSkinColor(petId) {
    var curSkinId = getPetSkinId(petId);
    var skins = PET_SKINS_CONFIG[petId] || [];
    var found = skins.find(function(s) { return s.id === curSkinId; });
    return found ? found.col : null;
  }

  function generatePet3DHtml(pet) {
    var skinId = getPetSkinId(pet.id);
    var col = getPetSkinColor(pet.id) || pet.col;
    var st = pet.styleType || 'drone';
    var wrap = function (inner) {
      return '<div class="ck-pet-idle ck-pet-art-' + st + ' ck-skin-' + skinId + '" style="width:46px;height:46px;color:' + col + ';display:flex;align-items:center;justify-content:center;position:relative;">' + inner + '</div>';
    };

    if (st === 'drone') {
      if (skinId === 'cyber_neon') {
        return wrap('<div style="position:relative;width:44px;height:38px;display:flex;align-items:center;justify-content:center;">' +
          '<div style="position:absolute;top:0;left:-2px;width:16px;height:3px;background:#00ffcc;border-radius:2px;box-shadow:0 0 8px #00ffcc;"></div>' +
          '<div style="position:absolute;top:0;right:-2px;width:16px;height:3px;background:#ff0055;border-radius:2px;box-shadow:0 0 8px #ff0055;"></div>' +
          '<div style="width:30px;height:22px;background:linear-gradient(135deg,#050b14,#111e38);border:2px solid #00ffcc;border-radius:4px;box-shadow:0 0 16px #00ffcc,inset 0 0 8px #ff0055;display:flex;align-items:center;justify-content:center;">' +
            '<div style="width:18px;height:4px;background:#ff0055;box-shadow:0 0 10px #ff0055;"></div>' +
          '</div>' +
          '<div style="position:absolute;bottom:0;width:24px;height:2px;background:repeating-linear-gradient(90deg,#00ffcc,#00ffcc 3px,transparent 3px,transparent 6px);"></div>' +
        '</div>');
      } else if (skinId === 'gold') {
        return wrap('<div style="position:relative;width:42px;height:38px;display:flex;align-items:center;justify-content:center;">' +
          '<div style="position:absolute;top:1px;width:36px;height:3px;background:linear-gradient(90deg,#fff,#fbbf24,#fff);box-shadow:0 0 10px #fbbf24;"></div>' +
          '<div style="width:28px;height:24px;background:radial-gradient(circle at 35% 30%,#fff,#fbbf24 60%,#78350f);border-radius:10px;border:2px solid #fef08a;box-shadow:0 0 20px #fbbf24;">' +
            '<div style="position:absolute;top:4px;left:50%;transform:translateX(-50%);width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 12px #fff;"></div>' +
          '</div>' +
        '</div>');
      } else if (skinId === 'void') {
        return wrap('<div style="position:relative;width:42px;height:38px;display:flex;align-items:center;justify-content:center;">' +
          '<div style="position:absolute;inset:2px;border:1.5px dashed #c084fc;border-radius:50%;animation:ckRotorSpin 2s linear infinite;"></div>' +
          '<div style="width:24px;height:24px;background:#020617;border-radius:6px;border:2px solid #c084fc;box-shadow:0 0 16px #c084fc;display:flex;align-items:center;justify-content:center;">' +
            '<div style="width:8px;height:8px;background:#e879f9;border-radius:50%;box-shadow:0 0 10px #e879f9;"></div>' +
          '</div>' +
        '</div>');
      }
    }

    if (st === 'wisp') {
      if (skinId === 'crimson') {
        return wrap('<div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">' +
          '<div style="position:absolute;width:34px;height:34px;border:2px solid #f43f5e;border-radius:50%;box-shadow:0 0 14px #f43f5e;animation:ckRotorSpin 3s linear infinite reverse;"></div>' +
          '<div style="width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#f43f5e 60%,#4c0519);box-shadow:0 0 22px #ef4444;">' +
            '<div style="position:absolute;top:6px;left:6px;width:3px;height:5px;background:#000;border-radius:50%;box-shadow:0 0 4px #fff;"></div>' +
            '<div style="position:absolute;top:6px;right:6px;width:3px;height:5px;background:#000;border-radius:50%;box-shadow:0 0 4px #fff;"></div>' +
          '</div>' +
        '</div>');
      } else if (skinId === 'emerald') {
        return wrap('<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">' +
          '<div style="position:absolute;width:32px;height:32px;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);background:rgba(16,185,129,0.35);box-shadow:0 0 12px #10b981;animation:ckRotorSpin 4s linear infinite;"></div>' +
          '<div style="width:22px;height:22px;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);background:radial-gradient(circle at 30% 30%,#fff,#10b981 70%,#022c22);box-shadow:0 0 18px #34d399;"></div>' +
        '</div>');
      } else if (skinId === 'amethyst') {
        return wrap('<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">' +
          '<div style="position:absolute;inset:0;border:2px solid #c084fc;border-radius:50%;transform:rotateX(60deg);box-shadow:0 0 14px #a855f7;"></div>' +
          '<div style="width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#a855f7 65%,#3b0764);box-shadow:0 0 20px #c084fc;"></div>' +
        '</div>');
      }
    }

    if (st === 'dragon') {
      var dTheme = {
        cMain: col,
        cSec: '#e879f9',
        cEye: '#fde047',
        cBodyGrad: 'radial-gradient(circle at 35% 30%,#fff,#c084fc 65%,#3b0764)',
        cWingGrad: 'linear-gradient(135deg,#f0abfc,#c084fc 60%,#581c87)',
        cTailGrad: 'linear-gradient(180deg,#c084fc,#7e22ce)'
      };
      if (skinId === 'ice') {
        dTheme.cMain = '#38bdf8';
        dTheme.cSec = '#a5f3fc';
        dTheme.cEye = '#ffffff';
        dTheme.cBodyGrad = 'radial-gradient(circle at 35% 30%,#fff,#38bdf8 65%,#082f49)';
        dTheme.cWingGrad = 'linear-gradient(135deg,#bae6fd,#0284c7 60%,#0c4a6e)';
        dTheme.cTailGrad = 'linear-gradient(180deg,#38bdf8,#0369a1)';
      } else if (skinId === 'inferno') {
        dTheme.cMain = '#ef4444';
        dTheme.cSec = '#fde047';
        dTheme.cEye = '#facc15';
        dTheme.cBodyGrad = 'radial-gradient(circle at 35% 30%,#fff,#ef4444 65%,#450a0a)';
        dTheme.cWingGrad = 'linear-gradient(135deg,#fef08a,#ea580c 55%,#7c2d12)';
        dTheme.cTailGrad = 'linear-gradient(180deg,#f97316,#b91c1c)';
      } else if (skinId === 'toxic') {
        dTheme.cMain = '#84cc16';
        dTheme.cSec = '#d9f99d';
        dTheme.cEye = '#ecfccb';
        dTheme.cBodyGrad = 'radial-gradient(circle at 35% 30%,#fff,#84cc16 65%,#14532d)';
        dTheme.cWingGrad = 'linear-gradient(135deg,#bef264,#65a30d 60%,#1a2e05)';
        dTheme.cTailGrad = 'linear-gradient(180deg,#84cc16,#3f6212)';
      }
      return wrap('<div class="ck-dragon-pro" style="position:relative;width:58px;height:52px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="position:absolute;inset:2px;border-radius:50%;background:' + dTheme.cMain + ';opacity:0.25;filter:blur(10px);pointer-events:none;"></div>' +
        '<div class="ck-d-wing l" style="position:absolute;left:-14px;top:-4px;width:30px;height:36px;background:' + dTheme.cWingGrad + ';clip-path:polygon(100% 15%, 80% 0%, 55% 8%, 20% 0%, 0% 25%, 15% 55%, 5% 75%, 25% 95%, 45% 80%, 70% 95%, 100% 85%);filter:drop-shadow(0 0 8px ' + dTheme.cMain + ');animation:ckDFlapL .24s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;transform-origin:95% 45%;border-top:2px solid ' + dTheme.cSec + ';"></div>' +
        '<div style="position:relative;width:24px;height:38px;display:flex;flex-direction:column;align-items:center;z-index:4;">' +
          '<div style="position:relative;width:18px;height:16px;background:' + dTheme.cBodyGrad + ';border-radius:4px 4px 8px 8px;border:1.5px solid ' + dTheme.cSec + ';box-shadow:0 0 14px ' + dTheme.cMain + ';">' +
            '<div style="position:absolute;top:-8px;left:-1px;width:5px;height:12px;background:' + dTheme.cSec + ';clip-path:polygon(30% 0, 100% 90%, 0% 100%);transform:rotate(-28deg);box-shadow:0 0 6px ' + dTheme.cMain + ';"></div>' +
            '<div style="position:absolute;top:-8px;right:-1px;width:5px;height:12px;background:' + dTheme.cSec + ';clip-path:polygon(70% 0, 100% 100%, 0% 90%);transform:rotate(28deg);box-shadow:0 0 6px ' + dTheme.cMain + ';"></div>' +
            '<div style="position:absolute;top:5px;left:2px;width:4px;height:4px;background:' + dTheme.cEye + ';border-radius:50%;box-shadow:0 0 4px #fff;"><div style="width:1.5px;height:3px;background:#000;margin:0 auto;"></div></div>' +
            '<div style="position:absolute;top:5px;right:2px;width:4px;height:4px;background:' + dTheme.cEye + ';border-radius:50%;box-shadow:0 0 4px #fff;"><div style="width:1.5px;height:3px;background:#000;margin:0 auto;"></div></div>' +
            '<div style="position:absolute;bottom:0;left:4px;right:4px;height:3px;background:#000;opacity:0.6;border-radius:2px;"></div>' +
          '</div>' +
          '<div style="position:relative;width:15px;height:18px;background:' + dTheme.cBodyGrad + ';border-radius:4px 4px 8px 8px;border:1.5px solid ' + dTheme.cSec + ';margin-top:-2px;box-shadow:0 0 10px ' + dTheme.cMain + ';">' +
            '<div style="position:absolute;inset:2px;background:repeating-linear-gradient(180deg,' + dTheme.cSec + ' 0px,' + dTheme.cSec + ' 2px,transparent 2px,transparent 5px);border-radius:2px;opacity:0.85;"></div>' +
          '</div>' +
        '</div>' +
        '<div class="ck-d-wing r" style="position:absolute;right:-14px;top:-4px;width:30px;height:36px;background:' + dTheme.cWingGrad + ';clip-path:polygon(0% 15%, 20% 0%, 45% 8%, 80% 0%, 100% 25%, 85% 55%, 95% 75%, 75% 95%, 55% 80%, 30% 95%, 0% 85%);filter:drop-shadow(0 0 8px ' + dTheme.cMain + ');animation:ckDFlapR .24s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;transform-origin:5% 45%;border-top:2px solid ' + dTheme.cSec + ';"></div>' +
        '<div style="position:absolute;bottom:-10px;width:5px;height:18px;background:' + dTheme.cTailGrad + ';border-radius:3px;animation:ckDTail .65s ease-in-out infinite alternate;transform-origin:top center;">' +
          '<div style="position:absolute;bottom:-3px;left:-4px;width:13px;height:9px;background:' + dTheme.cSec + ';clip-path:polygon(50% 100%, 0 0, 50% 25%, 100% 0);box-shadow:0 0 8px ' + dTheme.cMain + ';"></div>' +
        '</div>' +
      '</div>');
    }

    if (st === 'reaper') {
      if (skinId === 'soul_eater') {
        return wrap('<div class="ck-reaper-entity" style="position:relative;width:44px;height:48px;display:flex;align-items:center;justify-content:center;">' +
          '<div class="ck-reaper-body" style="position:absolute;bottom:0;width:26px;height:32px;background:linear-gradient(to bottom,#042f2e 30%,#021515);clip-path:polygon(50% 0%,100% 35%,88% 100%,68% 90%,50% 100%,32% 90%,12% 100%,0% 35%);box-shadow:0 0 18px #14b8a6;"></div>' +
          '<div class="ck-reaper-head" style="position:absolute;top:6px;width:16px;height:18px;background:#042f2e;border-radius:50% 50% 35% 35%;border:1.5px solid #2dd4bf;display:flex;align-items:center;justify-content:center;z-index:2;">' +
            '<div style="width:3px;height:3px;background:#2dd4bf;border-radius:50%;box-shadow:0 0 6px #2dd4bf;margin-right:4px;"></div>' +
            '<div style="width:3px;height:3px;background:#2dd4bf;border-radius:50%;box-shadow:0 0 6px #2dd4bf;"></div>' +
          '</div>' +
          '<div class="ck-reaper-scythe-wrap" style="position:absolute;right:-3px;top:-4px;width:24px;height:42px;pointer-events:none;transform-origin:bottom center;">' +
            '<div style="position:absolute;left:5px;top:0;bottom:0;width:2.5px;background:#0d9488;border-radius:1px;"></div>' +
            '<div style="position:absolute;left:5px;top:0;width:20px;height:18px;border-top:3.5px solid #5eead4;border-right:3.5px solid #5eead4;border-radius:0 18px 0 0;filter:drop-shadow(0 0 8px #14b8a6);transform:rotate(-12deg);"></div>' +
          '</div>' +
        '</div>');
      } else if (skinId === 'blood_harvest') {
        return wrap('<div class="ck-reaper-entity" style="position:relative;width:44px;height:48px;display:flex;align-items:center;justify-content:center;">' +
          '<div class="ck-reaper-body" style="position:absolute;bottom:0;width:26px;height:32px;background:linear-gradient(to bottom,#450a0a 30%,#1a0202);clip-path:polygon(50% 0%,100% 35%,88% 100%,68% 90%,50% 100%,32% 90%,12% 100%,0% 35%);box-shadow:0 0 20px #dc2626;"></div>' +
          '<div class="ck-reaper-head" style="position:absolute;top:6px;width:16px;height:18px;background:#450a0a;border-radius:50% 50% 35% 35%;border:1.5px solid #f87171;display:flex;align-items:center;justify-content:center;z-index:2;">' +
            '<div style="width:3px;height:3px;background:#ef4444;border-radius:50%;box-shadow:0 0 6px #ef4444;margin-right:4px;"></div>' +
            '<div style="width:3px;height:3px;background:#ef4444;border-radius:50%;box-shadow:0 0 6px #ef4444;"></div>' +
          '</div>' +
          '<div class="ck-reaper-scythe-wrap" style="position:absolute;right:-3px;top:-4px;width:24px;height:42px;pointer-events:none;transform-origin:bottom center;">' +
            '<div style="position:absolute;left:5px;top:0;bottom:0;width:2.5px;background:#7f1d1d;border-radius:1px;"></div>' +
            '<div style="position:absolute;left:5px;top:0;width:20px;height:18px;border-top:3.5px solid #f87171;border-right:3.5px solid #f87171;border-radius:0 18px 0 0;filter:drop-shadow(0 0 10px #dc2626);transform:rotate(-12deg);"></div>' +
          '</div>' +
        '</div>');
      }
      return wrap('<div class="ck-reaper-entity" style="position:relative;width:44px;height:48px;display:flex;align-items:center;justify-content:center;">' +
        '<div class="ck-reaper-body" style="position:absolute;bottom:0;width:26px;height:32px;background:linear-gradient(to bottom,#0f172a 30%,#020617);clip-path:polygon(50% 0%,100% 35%,88% 100%,68% 90%,50% 100%,32% 90%,12% 100%,0% 35%);box-shadow:0 0 16px ' + col + ';"></div>' +
        '<div class="ck-reaper-head" style="position:absolute;top:6px;width:16px;height:18px;background:#090d16;border-radius:50% 50% 35% 35%;border:1px solid ' + col + ';display:flex;align-items:center;justify-content:center;z-index:2;">' +
          '<div style="width:3px;height:3px;background:#f87171;border-radius:50%;box-shadow:0 0 5px #ef4444;margin-right:4px;"></div>' +
          '<div style="width:3px;height:3px;background:#f87171;border-radius:50%;box-shadow:0 0 5px #ef4444;"></div>' +
        '</div>' +
        '<div class="ck-reaper-scythe-wrap" style="position:absolute;right:-3px;top:-4px;width:24px;height:42px;pointer-events:none;transform-origin:bottom center;">' +
          '<div style="position:absolute;left:5px;top:0;bottom:0;width:2.5px;background:linear-gradient(to bottom,#cbd5e1,#64748b);border-radius:1px;"></div>' +
          '<div style="position:absolute;left:5px;top:0;width:20px;height:18px;border-top:3.5px solid #f1f5f9;border-right:3.5px solid #f1f5f9;border-radius:0 18px 0 0;filter:drop-shadow(0 0 8px ' + col + ');transform:rotate(-12deg);"></div>' +
        '</div>' +
      '</div>');
    }
    if (st === 'drone') {
      return wrap('<div style="position:relative;width:40px;height:36px;display:flex;align-items:center;justify-content:center;animation:ckPetHoverFloat 2s ease-in-out infinite alternate;">' +
        '<div style="position:absolute;top:2px;left:2px;width:14px;height:3px;background:#94a3b8;border-radius:2px;animation:ckRotorSpin 0.12s linear infinite;"></div>' +
        '<div style="position:absolute;top:2px;right:2px;width:14px;height:3px;background:#94a3b8;border-radius:2px;animation:ckRotorSpin 0.12s linear infinite;"></div>' +
        '<div style="width:26px;height:20px;background:linear-gradient(135deg,#f8fafc 20%,#64748b 80%);border-radius:8px;border:2px solid ' + col + ';box-shadow:0 0 12px ' + col + ';position:relative;display:flex;align-items:center;justify-content:center;">' +
          '<div style="width:14px;height:8px;background:#0f172a;border-radius:4px;display:flex;align-items:center;justify-content:center;">' +
            '<div style="width:6px;height:4px;background:#38bdf8;border-radius:2px;box-shadow:0 0 6px #38bdf8;"></div>' +
          '</div>' +
        '</div>' +
        '<div style="position:absolute;bottom:0;width:12px;height:4px;background:#38bdf8;border-radius:0 0 4px 4px;opacity:0.8;box-shadow:0 2px 6px #38bdf8;"></div>' +
      '</div>');
    }
    if (st === 'wisp') {
      return wrap('<div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,' + col + ' 60%,transparent);box-shadow:0 0 16px ' + col + ';position:relative;">' +
          '<div style="position:absolute;top:7px;left:6px;width:3px;height:4px;background:#0f172a;border-radius:50%;box-shadow:0 0 2px #fff;"></div>' +
          '<div style="position:absolute;top:7px;right:6px;width:3px;height:4px;background:#0f172a;border-radius:50%;box-shadow:0 0 2px #fff;"></div>' +
        '</div>' +
        '<div style="position:absolute;bottom:0;width:10px;height:12px;background:linear-gradient(to bottom,' + col + ',transparent);border-radius:50%;filter:blur(1px);"></div>' +
      '</div>');
    }
    if (st === 'slime') {
      return wrap('<div style="position:relative;width:38px;height:30px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="width:32px;height:24px;background:radial-gradient(circle at 40% 30%,#bbf7d0,' + col + ');border-radius:50% 50% 40% 40%;box-shadow:0 0 14px ' + col + ';animation:ckSlimeSquish 1.4s ease-in-out infinite;position:relative;">' +
          '<div style="position:absolute;top:6px;left:7px;width:5px;height:5px;background:#022c22;border-radius:50%;"><div style="width:2px;height:2px;background:#fff;border-radius:50%;"></div></div>' +
          '<div style="position:absolute;top:6px;right:7px;width:5px;height:5px;background:#022c22;border-radius:50%;"><div style="width:2px;height:2px;background:#fff;border-radius:50%;"></div></div>' +
          '<div style="position:absolute;bottom:4px;left:13px;width:6px;height:3px;border-bottom:1.5px solid #064e3b;border-radius:0 0 3px 3px;"></div>' +
        '</div>' +
      '</div>');
    }
    if (st === 'chronos') {
      return wrap('<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="position:absolute;inset:2px;border:2px solid ' + col + ';border-radius:50%;box-shadow:0 0 14px ' + col + ';background:radial-gradient(circle,#0f172a 40%,#020617);"></div>' +
        '<div style="position:absolute;top:1px;width:8px;height:4px;background:' + col + ';border-radius:2px;"></div>' +
        '<div style="position:absolute;width:2px;height:12px;background:#fff;top:8px;transform-origin:bottom center;animation:ckChronosTick 4s linear infinite;"></div>' +
        '<div style="position:absolute;width:2px;height:9px;background:' + col + ';top:11px;transform-origin:bottom center;animation:ckChronosTick 12s linear infinite;"></div>' +
        '<div style="width:5px;height:5px;background:#fff;border-radius:50%;z-index:4;box-shadow:0 0 4px #fff;"></div>' +
      '</div>');
    }
    if (st === 'pulsar') {
      return '<div class="ck-v2-pulsar ck-skin-' + skinId + '" style="position:relative;width:50px;height:50px;display:flex;align-items:center;justify-content:center;color:' + col + ';">' +
        '<div class="ck-pulsar-beam v" style="position:absolute;width:3.5px;height:56px;background:linear-gradient(180deg,transparent,#fff 30%,' + col + ' 70%,transparent);box-shadow:0 0 16px ' + col + ',0 0 28px #fff;animation:ckPulsarRay 0.9s ease-in-out infinite alternate;"></div>' +
        '<div class="ck-pulsar-disk" style="position:absolute;width:42px;height:14px;border-radius:50%;border:2px solid ' + col + ';box-shadow:0 0 14px ' + col + ',inset 0 0 10px ' + col + ';transform:rotateX(68deg) rotateZ(35deg);animation:ckPulsarSpin 2.4s linear infinite;"></div>' +
        '<div class="ck-pulsar-core" style="width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffffff 25%,' + col + ' 60%,#000 95%);box-shadow:0 0 24px ' + col + ',inset 0 0 6px #fff;z-index:3;animation:ckPulsarPulse 1.2s ease-in-out infinite alternate;"></div>' +
      '</div>';
    }
    if (st === 'omega') {
      return '<div class="ck-v2-omega ck-skin-' + skinId + '" style="position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center;color:' + col + ';">' +
        '<div class="ck-omega-aura" style="position:absolute;inset:-2px;border-radius:50%;background:radial-gradient(circle,' + col + ' 25%,transparent 75%);opacity:0.4;animation:ckOmegaAuraPulse 1.8s ease-in-out infinite alternate;"></div>' +
        '<div class="ck-omega-ring r1" style="position:absolute;width:46px;height:16px;border-radius:50%;border:2px dashed ' + col + ';box-shadow:0 0 16px ' + col + ';transform:rotateX(65deg) rotateZ(20deg);animation:ckOmegaSpin 4s linear infinite;"></div>' +
        '<div class="ck-omega-ring r2" style="position:absolute;width:42px;height:16px;border-radius:50%;border:2px dotted #fff;box-shadow:0 0 14px #fff;transform:rotateY(65deg) rotateZ(50deg);animation:ckOmegaSpin 3s linear infinite reverse;"></div>' +
        '<div class="ck-omega-crown" style="position:absolute;top:-4px;width:24px;height:10px;background:linear-gradient(180deg,#fff,' + col + ');clip-path:polygon(0% 100%,15% 15%,50% 65%,85% 15%,100% 100%);filter:drop-shadow(0 0 8px ' + col + ');z-index:4;"></div>' +
        '<div class="ck-omega-blackhole" style="width:22px;height:22px;border-radius:50%;background:#020617;border:2.5px solid ' + col + ';box-shadow:0 0 24px ' + col + ',inset 0 0 12px ' + col + ';z-index:3;display:flex;align-items:center;justify-content:center;">' +
          '<div style="width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#fff,' + col + ');box-shadow:0 0 10px #fff;animation:ckOmegaPulse 1.1s ease-in-out infinite alternate;"></div>' +
        '</div>' +
      '</div>';
    }
    if (st === 'dragon') {
      var dTheme = {
        cMain: col,
        cSec: '#e879f9',
        cEye: '#fde047',
        cBodyGrad: 'radial-gradient(circle at 35% 30%,#fff,#c084fc 65%,#3b0764)',
        cWingGrad: 'linear-gradient(135deg,#f0abfc,#c084fc 60%,#581c87)',
        cTailGrad: 'linear-gradient(180deg,#c084fc,#7e22ce)'
      };
      if (skinId === 'ice') {
        dTheme.cMain = '#38bdf8';
        dTheme.cSec = '#a5f3fc';
        dTheme.cEye = '#ffffff';
        dTheme.cBodyGrad = 'radial-gradient(circle at 35% 30%,#fff,#38bdf8 65%,#082f49)';
        dTheme.cWingGrad = 'linear-gradient(135deg,#bae6fd,#0284c7 60%,#0c4a6e)';
        dTheme.cTailGrad = 'linear-gradient(180deg,#38bdf8,#0369a1)';
      } else if (skinId === 'inferno') {
        dTheme.cMain = '#ef4444';
        dTheme.cSec = '#fde047';
        dTheme.cEye = '#facc15';
        dTheme.cBodyGrad = 'radial-gradient(circle at 35% 30%,#fff,#ef4444 65%,#450a0a)';
        dTheme.cWingGrad = 'linear-gradient(135deg,#fef08a,#ea580c 55%,#7c2d12)';
        dTheme.cTailGrad = 'linear-gradient(180deg,#f97316,#b91c1c)';
      } else if (skinId === 'toxic') {
        dTheme.cMain = '#84cc16';
        dTheme.cSec = '#d9f99d';
        dTheme.cEye = '#ecfccb';
        dTheme.cBodyGrad = 'radial-gradient(circle at 35% 30%,#fff,#84cc16 65%,#14532d)';
        dTheme.cWingGrad = 'linear-gradient(135deg,#bef264,#65a30d 60%,#1a2e05)';
        dTheme.cTailGrad = 'linear-gradient(180deg,#84cc16,#3f6212)';
      }
      return wrap('<div class="ck-dragon-adv" style="position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="position:absolute;inset:4px;border-radius:50%;background:' + dTheme.cMain + ';opacity:0.25;filter:blur(8px);pointer-events:none;"></div>' +
        '<div class="ck-d-wing l" style="position:absolute;left:-9px;top:2px;width:24px;height:30px;background:' + dTheme.cWingGrad + ';clip-path:polygon(0 0,100% 20%,85% 65%,100% 75%,60% 100%,15% 75%);filter:drop-shadow(0 0 8px ' + dTheme.cMain + ');animation:ckDFlapL .26s ease-in-out infinite alternate;transform-origin:right top;border-top:2px solid ' + dTheme.cSec + ';"></div>' +
        '<div class="ck-d-body-adv" style="position:relative;width:22px;height:28px;border-radius:12px 12px 10px 10px;background:' + dTheme.cBodyGrad + ';border:1.5px solid ' + dTheme.cSec + ';box-shadow:0 0 16px ' + dTheme.cMain + ',inset 0 0 6px rgba(255,255,255,0.8);z-index:3;">' +
          '<div style="position:absolute;top:-8px;left:0;width:5px;height:12px;background:' + dTheme.cSec + ';clip-path:polygon(50% 0,100% 100%,0 85%);transform:rotate(-22deg);box-shadow:0 0 6px ' + dTheme.cMain + ';"></div>' +
          '<div style="position:absolute;top:-8px;right:0;width:5px;height:12px;background:' + dTheme.cSec + ';clip-path:polygon(50% 0,100% 85%,0 100%);transform:rotate(22deg);box-shadow:0 0 6px ' + dTheme.cMain + ';"></div>' +
          '<div style="position:absolute;top:7px;left:3px;width:4.5px;height:5px;background:' + dTheme.cEye + ';border-radius:50%;box-shadow:0 0 6px ' + dTheme.cEye + ';"><div style="width:1.5px;height:3px;background:#000;margin:1px auto 0;"></div></div>' +
          '<div style="position:absolute;top:7px;right:3px;width:4.5px;height:5px;background:' + dTheme.cEye + ';border-radius:50%;box-shadow:0 0 6px ' + dTheme.cEye + ';"><div style="width:1.5px;height:3px;background:#000;margin:1px auto 0;"></div></div>' +
          '<div style="position:absolute;bottom:3px;left:4px;right:4px;height:8px;background:repeating-linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.5) 2px,transparent 2px,transparent 4px);border-radius:4px;"></div>' +
        '</div>' +
        '<div class="ck-d-wing r" style="position:absolute;right:-9px;top:2px;width:24px;height:30px;background:' + dTheme.cWingGrad + ';clip-path:polygon(100% 0,0 20%,15% 65%,0 75%,40% 100%,85% 75%);filter:drop-shadow(0 0 8px ' + dTheme.cMain + ');animation:ckDFlapR .26s ease-in-out infinite alternate;transform-origin:left top;border-top:2px solid ' + dTheme.cSec + ';"></div>' +
        '<div style="position:absolute;bottom:-8px;width:6px;height:16px;background:' + dTheme.cTailGrad + ';border-radius:3px;animation:ckDTail .7s ease-in-out infinite alternate;transform-origin:top center;"><div style="position:absolute;bottom:-2px;left:-3px;width:12px;height:8px;background:' + dTheme.cSec + ';clip-path:polygon(50% 100%,0 0,100% 0);box-shadow:0 0 8px ' + dTheme.cMain + ';"></div></div>' +
      '</div>');
    }
    if (st === 'phoenix') {
      var phTheme = {
        cFlame: col,
        cCore: '#fef08a',
        cDark: '#7c2d12',
        cHalo: 'rgba(249,115,22,0.4)'
      };
      if (skinId === 'solar') {
        phTheme.cFlame = '#facc15';
        phTheme.cCore = '#ffffff';
        phTheme.cDark = '#854d0e';
        phTheme.cHalo = 'rgba(250,204,21,0.5)';
      } else if (skinId === 'dark') {
        phTheme.cFlame = '#7e22ce';
        phTheme.cCore = '#d8b4fe';
        phTheme.cDark = '#2e1065';
        phTheme.cHalo = 'rgba(126,34,206,0.45)';
      } else if (skinId === 'supernova') {
        phTheme.cFlame = '#ec4899';
        phTheme.cCore = '#fbcfe8';
        phTheme.cDark = '#831843';
        phTheme.cHalo = 'rgba(236,72,153,0.5)';
      }
      return wrap('<div class="ck-phoenix-pro" style="position:relative;width:58px;height:54px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="position:absolute;inset:2px;border-radius:50%;background:' + phTheme.cFlame + ';opacity:0.35;filter:blur(12px);animation:ckPetPulse 1.2s infinite alternate;"></div>' +
        '<div class="ck-ph-wing l" style="position:absolute;left:-14px;top:-2px;width:28px;height:36px;background:linear-gradient(135deg,#fff 0%,' + phTheme.cCore + ' 30%,' + phTheme.cFlame + ' 75%,' + phTheme.cDark + ' 100%);clip-path:polygon(100% 25%, 70% 0%, 40% 12%, 15% 2%, 0% 30%, 15% 50%, 0% 70%, 25% 85%, 55% 75%, 80% 95%, 100% 70%);filter:drop-shadow(0 0 10px ' + phTheme.cFlame + ');animation:ckPFlapL .22s ease-in-out infinite alternate;transform-origin:90% 35%;border-top:1.5px solid #fff;"></div>' +
        '<div style="position:relative;width:22px;height:42px;display:flex;flex-direction:column;align-items:center;z-index:4;">' +
          '<div style="position:absolute;top:-10px;width:14px;height:15px;background:linear-gradient(180deg,#fff,' + phTheme.cFlame + ');clip-path:polygon(50% 0, 75% 35%, 100% 10%, 85% 70%, 100% 100%, 50% 75%, 0% 100%, 15% 70%, 0 10%, 25% 35%);animation:ckPhFire .28s infinite alternate;filter:drop-shadow(0 0 8px ' + phTheme.cFlame + ');"></div>' +
          '<div style="position:relative;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 45% 30%,#fff,' + phTheme.cCore + ' 45%,' + phTheme.cFlame + ');box-shadow:0 0 14px ' + phTheme.cFlame + ';border:1px solid #fff;margin-top:1px;">' +
            '<div style="position:absolute;top:4px;left:2px;width:3px;height:3px;background:#000;border-radius:50%;box-shadow:0 0 3px #fff;"></div>' +
            '<div style="position:absolute;top:4px;right:2px;width:3px;height:3px;background:#000;border-radius:50%;box-shadow:0 0 3px #fff;"></div>' +
            '<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;border-top:8px solid #fde047;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));"></div>' +
          '</div>' +
          '<div style="width:12px;height:22px;background:radial-gradient(ellipse at 50% 25%,#fff,' + phTheme.cCore + ' 30%,' + phTheme.cFlame + ' 75%,' + phTheme.cDark + ');border-radius:6px 6px 12px 12px;border:1.5px solid ' + phTheme.cCore + ';margin-top:2px;box-shadow:0 0 16px ' + phTheme.cFlame + ',inset 0 0 6px #fff;"></div>' +
        '</div>' +
        '<div class="ck-ph-wing r" style="position:absolute;right:-14px;top:-2px;width:28px;height:36px;background:linear-gradient(225deg,#fff 0%,' + phTheme.cCore + ' 30%,' + phTheme.cFlame + ' 75%,' + phTheme.cDark + ' 100%);clip-path:polygon(0% 25%, 30% 0%, 60% 12%, 85% 2%, 100% 30%, 85% 50%, 100% 70%, 75% 85%, 45% 75%, 20% 95%, 0% 70%);filter:drop-shadow(0 0 10px ' + phTheme.cFlame + ');animation:ckPFlapR .22s ease-in-out infinite alternate;transform-origin:10% 35%;border-top:1.5px solid #fff;"></div>' +
        '<div style="position:absolute;bottom:-12px;display:flex;gap:2px;z-index:2;align-items:flex-start;">' +
          '<div style="width:4px;height:20px;background:linear-gradient(180deg,' + phTheme.cFlame + ',' + phTheme.cCore + ',transparent);clip-path:polygon(50% 0, 100% 70%, 50% 100%, 0 70%);animation:ckPHTail .7s ease-in-out infinite alternate;"></div>' +
          '<div style="width:5px;height:28px;background:linear-gradient(180deg,#fff,' + phTheme.cFlame + ',transparent);clip-path:polygon(50% 0, 100% 80%, 50% 100%, 0 80%);box-shadow:0 0 10px ' + phTheme.cFlame + ';animation:ckPHTail .9s ease-in-out infinite alternate;animation-delay:.12s;"></div>' +
          '<div style="width:4px;height:20px;background:linear-gradient(180deg,' + phTheme.cFlame + ',' + phTheme.cCore + ',transparent);clip-path:polygon(50% 0, 100% 70%, 50% 100%, 0 70%);animation:ckPHTail .7s ease-in-out infinite alternate;animation-delay:.24s;"></div>' +
        '</div>' +
      '</div>');
    }
    return '<div class="ck-pet-3d-wrap ck-pet-' + st + '" style="color:' + col + '">' +
      '<div class="ck-pet-core" style="background:radial-gradient(circle at 30% 30%, #fff, ' + col + ');box-shadow:0 0 12px ' + col + '"></div>' +
      '<div class="ck-pet-ring r1"></div>' +
      '<div class="ck-pet-ring r2"></div>' +
    '</div>';
    var h = '';
    if (false) {
      h = '<div class="ck-pet-3d-wrap" style="color:' + col + '">' +
            '<div class="ck-pet-core" style="background:radial-gradient(circle at 30% 30%, #fff, ' + col + ')"></div>' +
            '<div class="ck-pet-ring r1"></div>' +
            '<div class="ck-pet-ring r2"></div>' +
          '</div>';
    } else if (pet.styleType === 'wisp') {
      h = '<div class="ck-pet-3d-wrap" style="color:' + col + '">' +
            '<div class="ck-pet-core" style="width:22px;height:22px;background:radial-gradient(circle, #fff, ' + col + ' 60%, transparent)"></div>' +
            '<div class="ck-pet-trail" style="top:2px;left:2px;"></div>' +
            '<div class="ck-pet-trail" style="bottom:2px;right:2px;"></div>' +
          '</div>';
    } else if (pet.styleType === 'dragon') {
      h = '<div class="ck-dragon-model">' +
            '<div class="ck-dragon-head">' +
              '<div class="ck-dragon-horns"></div>' +
              '<div class="ck-dragon-eyes"></div>' +
            '</div>' +
            '<div class="ck-dragon-wing l"></div>' +
            '<div class="ck-dragon-body"></div>' +
            '<div class="ck-dragon-wing r"></div>' +
            '<div class="ck-dragon-tail"></div>' +
          '</div>';
    } else if (pet.styleType === 'phoenix') {
      h = '<div class="ck-phoenix-model">' +
            '<div class="ck-ph-head">' +
              '<div class="ck-ph-crest"></div>' +
              '<div class="ck-ph-beak"></div>' +
            '</div>' +
            '<div class="ck-ph-wing l"></div>' +
            '<div class="ck-ph-body"></div>' +
            '<div class="ck-ph-wing r"></div>' +
            '<div class="ck-ph-tail">' +
              '<div class="ck-ph-feather"></div>' +
              '<div class="ck-ph-feather"></div>' +
              '<div class="ck-ph-feather"></div>' +
            '</div>' +
          '</div>';
    }
    return h;
  }

  function getOwnedPets() {
    FEAT.pets = FEAT.pets || {};
    return FEAT.pets;
  }

  function hasPet(id) {
    if (window.CK && Array.isArray(window.CK.pets)) {
      if (window.CK.pets.length === 0 && Object.keys(FEAT.pets || {}).length > 0 && !window.__ckFeatSynced) {
        FEAT.pets = {};
      }
    }
    return !!(FEAT.pets && FEAT.pets[id]);
  }

  function buyPet(pet) {
    if (!window.CK || (window.CK.rebirths || 0) < pet.cost || hasPet(pet.id)) return false;
    window.CK.rebirths -= pet.cost;
    if (!FEAT.pets) FEAT.pets = {};
    FEAT.pets[pet.id] = true;
    saveState();
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      raw.pets = FEAT.pets;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch(e){}
    if (window.sfxBuy) window.sfxBuy();
    if (window.sfxRebirth) window.sfxRebirth();
    if (window.ckToast) window.ckToast('✨ НОВЫЙ ПИТОМЕЦ: ' + pet.name + ' ПРИСОЕДИНИЛСЯ!');
    
    try {
      var celeb = document.createElement('div');
      celeb.className = 'ck-pet-celeb-overlay';
      celeb.innerHTML = '<div class="ck-pet-celeb-card">' +
        '<div class="ck-pet-celeb-glow"></div>' +
        '<div class="ck-pet-celeb-model">' + generatePet3DHtml(pet) + '</div>' +
        '<div class="ck-pet-celeb-title">ПИТОМЕЦ РАЗБЛОКИРОВАН!</div>' +
        '<div class="ck-pet-celeb-name" style="color:' + pet.col + '">' + pet.name + '</div>' +
      '</div>';
      document.body.appendChild(celeb);
      setTimeout(function() { if (celeb.parentNode) celeb.parentNode.removeChild(celeb); }, 1300);
    } catch(e) {}
    
    if (window.render) window.render(true);
    refreshPetVisuals();
    return true;
  }

  function buildPetsUI(acts) {
    if (document.getElementById('ck-petbtn')) return;
    var btn = document.createElement('button');
    btn.id = 'ck-petbtn';
    btn.textContent = 'ПИТОМЦЫ';
    acts.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = 'ck-pet-modal';
    modal.className = 'clicker-ui hidden';

    var box = document.createElement('div');
    box.id = 'ck-pet-box';
    box.innerHTML = '<h2>ПИТОМЦЫ И СПУТНИКИ</h2>' +
      '<div style="text-align:center;font-size:12.5px;color:#a7f3d0;margin-bottom:14px;">Покупаются за перерождения. Летают по орбите вокруг диска и усиливают тебя!</div>' +
      '<div id="ck-pets-list"></div>';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'ck-close-pet';
    closeBtn.textContent = 'ЗАКРЫТЬ';
    closeBtn.addEventListener('click', function () { modal.classList.add('hidden'); });

    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    btn.addEventListener('click', function () {
      modal.classList.remove('hidden');
      renderPetsModal(box);
    });
  }

  function renderPetSkinsHtml(petId) {
    var skins = PET_SKINS_CONFIG[petId];
    if (!skins || !skins.length) return '';
    FEAT.petSkins = FEAT.petSkins || {};
    FEAT.unlockedSkins = FEAT.unlockedSkins || {};
    var curSkin = FEAT.petSkins[petId] || 'default';
    var h = '<div class="ck-pet-skin-bar" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;"><span style="font-size:10px;color:#94a3b8;align-self:center;">Скины:</span>';
    skins.forEach(function(s) {
      var isOwned = s.id === 'default' || !!FEAT.unlockedSkins[petId + '_' + s.id];
      var isCur = curSkin === s.id;
      if (isOwned) {
        h += '<button class="ck-skin-chip ' + (isCur ? 'active' : '') + '" data-equip-skin="' + s.id + '" data-petid="' + petId + '" style="padding:2px 5px;font-size:9.5px;border-radius:4px;cursor:pointer;background:' + (isCur ? '#fbbf24' : '#1e293b') + ';color:' + (isCur ? '#000' : '#fff') + ';border:1px solid #fbbf24;">' +
          s.name + (isCur ? ' ✓' : '') + '</button>';
      } else {
        h += '<button class="ck-skin-chip buy" data-buy-skin="' + s.id + '" data-petid="' + petId + '" style="padding:2px 5px;font-size:9.5px;border-radius:4px;cursor:pointer;background:#064e3b;color:#34d399;border:1px solid #10b981;">' +
          s.name + ' (' + s.costShards + ' оск.)</button>';
      }
    });
    h += '</div>';
    return h;
  }

  function renderPetsModal(box) {
    var listEl = box.querySelector('#ck-pets-list');
    var rebs = window.CK ? (window.CK.rebirths || 0) : 0;
    var superCount = (window.__CKEX && window.__CKEX.superCount) ? window.__CKEX.superCount : 0;
    var h = '';

    PETS_CONFIG.forEach(function (pet, idx) {
      var owned = hasPet(pet.id);
      var can = !owned && (pet.isSuper ? (superCount >= 1) : (rebs >= pet.cost));
      var petCol = getPetSkinColor(pet.id) || pet.col;
      var costLabel = pet.isSuper ? 'Цена: 1 СУПЕР-перерождение' : ('Цена: ' + pet.cost + ' перерождений');
      h += '<div class="ck-pet-card ' + (owned ? 'owned' : '') + '">' +
        '<div class="ck-pet-avatar" style="background:rgba(0,0,0,0.6);border:1px solid ' + petCol + '">' + generatePet3DHtml(pet) + '</div>' +
        '<div class="ck-pet-info">' +
          '<div class="ck-pet-name" style="color:' + petCol + '">' + pet.name + '</div>' +
          '<div class="ck-pet-bonus">' + pet.desc + '</div>' +
          '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">' + costLabel + '</div>' +
          (owned ? renderPetSkinsHtml(pet.id) : '') +
        '</div>' +
        '<button class="ck-pet-buybtn" data-pet="' + idx + '" ' + ((owned || !can) ? 'disabled' : '') + '>' +
          (owned ? 'В СТРОЮ' : (pet.isSuper ? 'КУПИТЬ (1 СУПЕР)' : 'КУПИТЬ')) +
        '</button>' +
      '</div>';
    });
    listEl.innerHTML = h;

    listEl.querySelectorAll('button[data-equip-skin]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var pId = btn.getAttribute('data-petid');
        var sId = btn.getAttribute('data-equip-skin');
        FEAT.petSkins = FEAT.petSkins || {};
        FEAT.petSkins[pId] = sId;
        saveState();
        renderPetsModal(box);
        startPetOrbitEngine();
      });
    });

    listEl.querySelectorAll('button[data-buy-skin]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var pId = btn.getAttribute('data-petid');
        var sId = btn.getAttribute('data-buy-skin');
        var skins = PET_SKINS_CONFIG[pId] || [];
        var targetSkin = skins.find(function(s) { return s.id === sId; });
        if (!targetSkin || !window.CK || !window.CK.inv) return;
        var shardCnt = 0;
        window.CK.inv.forEach(function(it) { if (it === 'shard') shardCnt++; });
        if (shardCnt < targetSkin.costShards) {
          if (window.ckToast) window.ckToast('Не хватает осколков! Нужно: ' + targetSkin.costShards);
          return;
        }
        for (var i = 0; i < targetSkin.costShards; i++) {
          var sIdx = window.CK.inv.lastIndexOf('shard');
          if (sIdx !== -1) window.CK.inv.splice(sIdx, 1);
        }
        FEAT.unlockedSkins = FEAT.unlockedSkins || {};
        FEAT.unlockedSkins[pId + '_' + sId] = true;
        FEAT.petSkins = FEAT.petSkins || {};
        FEAT.petSkins[pId] = sId;
        saveState();
        if (window.ckInvRender) window.ckInvRender();
        if (window.ckToast) window.ckToast('Куплен и надет скин: ' + targetSkin.name + '!');
        renderPetsModal(box);
        startPetOrbitEngine();
      });
    });

    listEl.querySelectorAll('button[data-pet]').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(b.getAttribute('data-pet'), 10);
        var pet = PETS_CONFIG[idx];
        if (buyPet(pet)) {
          renderPetsModal(box);
        }
      });
    });
  }

  var orbitElements = [];
  function refreshPetVisuals() {
    var disc = document.getElementById('ck-disc') || document.getElementById('planet-btn');
    if (!disc) return;
    disc.style.position = 'relative';
    orbitElements.forEach(function (item) { if (item) item.strikeActive = false; });
    orbitElements = [];
    var cleanupNodes = document.querySelectorAll('.ck-orbit-pet, .ck-pet-trail, .ck-pet-impact-ring, .ck-pet-hit-text, .ck-pet-hit-spark');
    cleanupNodes.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
    disc.classList.remove('ck-disc-strike');
    disc.style.removeProperty('--strike-glow');

    var ownedPets = PETS_CONFIG.filter(function (pet) { return hasPet(pet.id); });
    var totalOwned = ownedPets.length;
    if (totalOwned === 0) return;

    ownedPets.forEach(function (pet, idx) {
      var pEl = document.createElement('div');
      pEl.className = 'ck-orbit-pet';
      pEl.style.position = 'absolute';
      pEl.style.pointerEvents = 'none';
      pEl.style.zIndex = '35';
      pEl.innerHTML = generatePet3DHtml(pet);
      disc.appendChild(pEl);

      orbitElements.push({
        el: pEl,
        conf: pet,
        idx: idx,
        baseAngle: (idx / totalOwned) * Math.PI * 2,
        radiusX: 140 + (idx * 18),
        radiusY: 65 + (idx * 12),
        speed: 0.0012 + (idx * 0.0003),
        attacking: false,
        attackStart: 0,
        attackDur: 900,
        lastOrbitX: 0,
        lastOrbitY: 0
      });
    });
    startPetOrbitEngine();
  }

  var _petOrbitStarted = false;
  function startPetOrbitEngine() {
    if (_petOrbitStarted) return;
    _petOrbitStarted = true;

    try {
      var discEl = document.getElementById('ck-disc') || document.getElementById('planet-btn');
      if (discEl) discEl.style.position = 'relative';
    } catch (e) {}

    setInterval(function () {
      if (!orbitElements || !orbitElements.length) return;
      var idlePets = orbitElements.filter(function (it) { return !it.attacking; });
      if (!idlePets.length) return;
      var target = idlePets[Math.floor(Math.random() * idlePets.length)];
      target.attacking = true;
      target.attackStart = Date.now();
      target.attackDur = 750;
      target.didHit = false;
    }, 1400);

    function anim() {
      requestAnimationFrame(anim);
      if (!orbitElements || orbitElements.length === 0) return;

      var disc = document.getElementById('ck-disc') || document.getElementById('planet-btn');
      if (!disc) return;
      var w = disc.offsetWidth || 300;
      var h = disc.offsetHeight || 300;
      var cx = w / 2;
      var cy = h / 2;
      var now = Date.now();

      orbitElements.forEach(function (pet, idx) {
        if (!pet.el) return;

        var baseSpeed = 0.0012 + (idx * 0.0003);
        var total = orbitElements.length;
        var phase = pet.baseAngle !== undefined ? pet.baseAngle : (idx * (Math.PI * 2 / total));
        var angle = (now * baseSpeed) + phase;

        var rX = pet.radiusX || (w * 0.44 + (idx * 16));
        var rY = pet.radiusY || (h * 0.22 + (idx * 10));
        var orbitX = cx + Math.cos(angle) * rX;
        var orbitY = cy + Math.sin(angle) * rY;

        if (pet.attacking) {
          var t = (now - pet.attackStart) / pet.attackDur;
          if (t >= 1) {
            pet.attacking = false;
            pet.didHit = false;
            pet.el.style.filter = '';
          } else {
            var curX, curY, s = 1, rot = 0;
            var petColor = (pet.conf && pet.conf.col) ? pet.conf.col : '#38bdf8';
            var scaleX = 1, scaleY = 1;

            if (t < 0.22) {
              var p1 = t / 0.22;
              var pull = Math.sin(p1 * Math.PI) * 22;
              curX = orbitX + Math.cos(angle) * pull;
              curY = orbitY + Math.sin(angle) * pull;
              scaleX = 1 + (p1 * 0.35);
              scaleY = 1 - (p1 * 0.15);
              rot = Math.sin(now * 0.05) * 25;
              pet.el.style.filter = 'brightness(' + (1.3 + p1 * 0.9) + ') drop-shadow(0 0 ' + (14 + p1 * 18) + 'px ' + petColor + ')';
            } else if (t < 0.48) {
              var p2 = (t - 0.22) / 0.26;
              var easeDash = Math.pow(p2, 2.5);
              curX = orbitX + (cx - orbitX) * easeDash;
              curY = orbitY + (cy - orbitY) * easeDash;
              scaleX = 0.75 + Math.sin(p2 * Math.PI) * 0.2;
              scaleY = 1.45 + Math.sin(p2 * Math.PI) * 0.3;
              rot = Math.atan2(cy - orbitY, cx - orbitX) * (180 / Math.PI) + 90;
              pet.el.style.filter = 'brightness(2.5) drop-shadow(0 0 28px #fff) drop-shadow(0 0 16px ' + petColor + ')';

              var hasAnyPets = orbitElements && orbitElements.length > 0 && Object.keys(FEAT.pets || {}).length > 0;
              if (!hasAnyPets) {
                pet.strikeActive = false;
                pet.didHit = true;
                if (pet.el && pet.el.parentNode) pet.el.parentNode.removeChild(pet.el);
                return;
              }
              var hasPets = orbitElements && orbitElements.length > 0 && Object.keys(FEAT.pets || {}).length > 0;
              if (!hasPets) {
                pet.strikeActive = false;
                pet.didHit = true;
                if (pet.el && pet.el.parentNode) pet.el.parentNode.removeChild(pet.el);
                return;
              }
              if (Math.random() < 0.65 && !(window.CK_UI && window.CK_UI.low)) {
                var tr = document.createElement('div');
                tr.className = 'ck-pet-trail';
                tr.style.left = curX + 'px';
                tr.style.top = curY + 'px';
                tr.style.background = petColor;
                tr.style.boxShadow = '0 0 6px ' + petColor;
                disc.appendChild(tr);
                setTimeout(function () { if (tr.parentNode) tr.parentNode.removeChild(tr); }, 260);
              }

              if (p2 > 0.82 && !pet.didHit) {
                pet.didHit = true;
                disc.style.setProperty('--strike-glow', petColor);
                disc.classList.remove('ck-disc-strike');
                void disc.offsetWidth;
                disc.classList.add('ck-disc-strike');

                var isLow = window.CK_UI && window.CK_UI.low;
                if (!isLow) {
                  var ring = document.createElement('div');
                  ring.className = 'ck-pet-impact-ring';
                  ring.style.width = '75px';
                  ring.style.height = '75px';
                  ring.style.left = cx + 'px';
                  ring.style.top = cy + 'px';
                  ring.style.borderColor = petColor;
                  ring.style.boxShadow = '0 0 14px ' + petColor;
                  disc.appendChild(ring);
                  setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 380);
                }

                var dmg = document.createElement('div');
                dmg.className = 'ck-pet-hit-text';
                dmg.style.left = (cx + (Math.random() * 36 - 18)) + 'px';
                dmg.style.top = (cy - 10 + (Math.random() * 20 - 10)) + 'px';
                dmg.style.color = petColor;
                dmg.textContent = '+' + (pet.conf ? pet.conf.name.toUpperCase() : 'HIT!');
                disc.appendChild(dmg);
                setTimeout(function () { if (dmg.parentNode) dmg.parentNode.removeChild(dmg); }, 650);
              }
            } else {
              var p3 = (t - 0.48) / 0.52;
              var easeReturn = 1 - Math.pow(1 - p3, 2.2);
              var arc = Math.sin(p3 * Math.PI) * 38;
              curX = cx + (orbitX - cx) * easeReturn + (Math.cos(angle + Math.PI / 2) * arc);
              curY = cy + (orbitY - cy) * easeReturn + (Math.sin(angle + Math.PI / 2) * arc);
              scaleX = 1.2 - (easeReturn * 0.2);
              scaleY = 1.2 - (easeReturn * 0.2);
              var targetOrbTilt = Math.cos(angle) * 12;
              // Плавная интерполяция угла к углу орбиты без резкого разворота
              rot = (360 * (1 - easeReturn)) + (targetOrbTilt * easeReturn);
              pet.el.style.filter = 'brightness(' + (1.6 - p3 * 0.6) + ') drop-shadow(0 0 ' + (14 * (1 - p3)) + 'px ' + petColor + ')';
            }

            pet.el.style.left = curX + 'px';
            pet.el.style.top = curY + 'px';
            pet.el.style.transform = 'translate(-50%, -50%) scale(' + scaleX.toFixed(2) + ',' + scaleY.toFixed(2) + ') rotate(' + rot.toFixed(1) + 'deg)';
            pet.el.style.zIndex = '55';
            return;
          }
        }

        var depth = 0.85 + (Math.sin(angle) + 1) * 0.18;
        pet.el.style.left = orbitX + 'px';
        pet.el.style.top = orbitY + 'px';
        pet.el.style.transform = 'translate(-50%, -50%) scale(' + depth.toFixed(2) + ')';
        pet.el.style.zIndex = Math.sin(angle) > 0 ? '40' : '15';
        pet.el.style.filter = '';
      });
      return;
    }
    requestAnimationFrame(anim);
    function _oldAnimDummy() {
      if (orbitElements.length > 0) {
        var now = Date.now();
        var disc = document.getElementById('ck-disc') || document.getElementById('planet-btn');
        var cx = disc && disc.offsetWidth ? disc.offsetWidth / 2 : 150;
        var cy = disc && disc.offsetHeight ? disc.offsetHeight / 2 : 150;

        orbitElements.forEach(function (item, ordIdx) {
          if (item.attacking) {
            var p = (now - item.attackStart) / item.attackDur;
            if (p >= 1) {
              item.attacking = false;
              item._didHitDisk = false;
              item.el.style.filter = '';
            } else {
              var curX, curY, s = 1, rot = 0;
              if (p < 0.20) {
                // Фаза 1: Зарядка на орбите с оттяжкой и пульсацией
                var chargeP = p / 0.20;
                var windup = Math.sin(chargeP * Math.PI) * 12;
                curX = cx + item.lastOrbitX + (Math.cos(item.lastAngle || 0) * windup);
                curY = cy + item.lastOrbitY + (Math.sin(item.lastAngle || 0) * windup);
                s = 1 + (chargeP * 0.25);
                rot = (chargeP * 15) * (Math.sin(now * 0.05) > 0 ? 1 : -1);
                item.el.style.filter = 'brightness(' + (1 + chargeP * 0.8) + ') drop-shadow(0 0 16px ' + (item.conf ? item.conf.col : '#fff') + ')';
              } else if (p < 0.45) {
                // Фаза 2: Гипер-рывок (Hyper-Warp Dash) в центр планеты
                var dashP = (p - 0.20) / 0.25;
                var easeDash = Math.pow(dashP, 3);
                curX = (cx + item.lastOrbitX) + (cx - (cx + item.lastOrbitX)) * easeDash;
                curY = (cy + item.lastOrbitY) + (cy - (cy + item.lastOrbitY)) * easeDash;
                s = 1.25 + Math.sin(dashP * Math.PI) * 0.3;
                rot = dashP * 360;
                item.el.style.filter = 'brightness(2) drop-shadow(0 0 26px #fff)';

                if (dashP > 0.85 && !item._didHitDisk) {
                  item._didHitDisk = true;
                  var diskEl = document.getElementById('ck-disc') || document.getElementById('planet-btn');
                  if (diskEl) {
                    diskEl.classList.remove('ck-disc-strike');
                    void diskEl.offsetWidth;
                    diskEl.classList.add('ck-disc-strike');

                    var ring = document.createElement('div');
                    ring.className = 'ck-pet-impact-ring';
                    ring.style.width = '84px';
                    ring.style.height = '84px';
                    ring.style.left = (diskEl.offsetWidth / 2) + 'px';
                    ring.style.top = (diskEl.offsetHeight / 2) + 'px';
                    ring.style.borderColor = item.conf ? item.conf.col : '#38bdf8';
                    ring.style.boxShadow = '0 0 20px ' + (item.conf ? item.conf.col : '#38bdf8');
                    diskEl.appendChild(ring);
                    setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 450);
                  }
                }
              } else if (p < 0.65) {
                // Фаза 3: Вспышка и отдача в эпицентре
                var holdP = (p - 0.45) / 0.20;
                curX = cx + (Math.sin(holdP * Math.PI * 4) * 3);
                curY = cy + (Math.cos(holdP * Math.PI * 4) * 3);
                s = 1.3 - (holdP * 0.1);
                rot = 360 + (holdP * 45);
              } else {
                // Фаза 4: Кинематографичный отскок по дуге обратно на орбиту
                var retP = (p - 0.65) / 0.35;
                var easeRet = 1 - Math.pow(1 - retP, 2);
                var arcOffset = Math.sin(retP * Math.PI) * 32;
                curX = cx + (item.lastOrbitX * easeRet) + (Math.sin(retP * Math.PI) * arcOffset);
                curY = cy + (item.lastOrbitY * easeRet) - Math.abs(arcOffset * 0.4);
                s = 1.2 - (easeRet * 0.2);
                rot = 405 + (easeRet * 315);
                item.el.style.filter = '';
              }

              item.el.style.left = curX + 'px';
              item.el.style.top = curY + 'px';
              item.el.style.transform = 'translate(-50%, -50%) scale(' + s.toFixed(3) + ') rotate(' + (rot % 360).toFixed(1) + 'deg)';
              item.el.style.zIndex = p < 0.65 ? 55 : 30;
              return;
            }
          }

          var total = orbitElements.length;
          var angle = (now * 0.0009) + (ordIdx * ((2 * Math.PI) / total));
          var rX = Math.max(dRect.width, 160) * 0.72;
          var rY = rX * 0.38;
          var rawX = Math.cos(angle) * rX;
          var rawY = Math.sin(angle) * rY;
          var rawZ = Math.sin(angle);

          item.lastOrbitX = rawX;
          item.lastOrbitY = rawY;

          var depth = 0.8 + ((rawZ + 1) / 2) * 0.35;
          item.el.style.left = (cx + rawX) + 'px';
          item.el.style.top = (cy + rawY) + 'px';
          item.el.style.transform = 'translate(-50%, -50%) scale(' + depth.toFixed(3) + ')';
          item.el.style.zIndex = rawZ > 0 ? 30 : 2;
          item.el.style.opacity = (0.7 + ((rawZ + 1) / 2) * 0.3).toFixed(2);
        });
      }
      requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);

    // Логика автокликов, спец-способностей и удара питомцев по диску
    setInterval(function () {
      if (!window.CK) return;
      var totalClicks = 0;
      var disc = document.getElementById('ck-disc');

      PETS_CONFIG.forEach(function (pet) {
        if (hasPet(pet.id) && (pet.type === 'autoclick' || pet.type === 'super')) {
          totalClicks += pet.rate;
          // Запуск рывка-удара питомца
          var orbItem = orbitElements.find(function (o) { return PETS_CONFIG[o.idx] && PETS_CONFIG[o.idx].id === pet.id; });
          if (orbItem && !orbItem.attacking) {
            orbItem.attacking = true;
            orbItem.attackStart = Date.now();
            orbItem.attackDur = 1400;

            // Эффект соударения на диске
            if (disc && !document.getElementById('clicker-overlay').classList.contains('hidden')) {
              disc.classList.remove('ck-disc-strike');
              void disc.offsetWidth;
              disc.classList.add('ck-disc-strike');

              var spark = document.createElement('div');
              spark.className = 'ck-pet-hit-spark';
              spark.style.width = pet.id === 'pet_omega' ? '70px' : '36px';
              spark.style.height = pet.id === 'pet_omega' ? '70px' : '36px';
              spark.style.left = (disc.offsetWidth / 2 + (Math.random() * 40 - 20)) + 'px';
              spark.style.top = (disc.offsetHeight / 2 + (Math.random() * 40 - 20)) + 'px';
              spark.style.background = 'radial-gradient(circle, #fff, ' + pet.col + ' 60%, transparent)';
              disc.appendChild(spark);
              setTimeout(function () { if (spark.parentNode) spark.parentNode.removeChild(spark); }, 350);

              // СУПЕР-УЛЬТА Омега-Демиурга: Апокалипсис Бездны
              if (pet.id === 'pet_omega' && Math.random() < 0.25) {
                var burst = (window.ckPower ? window.ckPower() : 1) * 2500;
                window.CK.clicks = (window.CK.clicks || 0) + burst;
                if (window.ckToast) window.ckToast('💥 АПОКАЛИПСИС БЕЗДНЫ! +' + (window.fmtNum ? window.fmtNum(burst) : burst));
                if (window.sfxRebirth) window.sfxRebirth();
              }
            }
          }
        }
      });
      if (totalClicks > 0 && window.ckPower) {
        var gain = window.ckPower() * totalClicks;
        window.CK.clicks += gain;
        if (window.render && !document.getElementById('clicker-overlay').classList.contains('hidden')) {
          window.render();
        }
      }
    }, 1000);
  }

  /* Блок 5: Рандомные ивенты (Золотая комета) */
  var cometTimer = null;
  var cometBuffActive = false;
  var cometBuffEnd = 0;

  function scheduleNextComet() {
    if (cometTimer) clearTimeout(cometTimer);
    // Спавн раз в 2-3.5 минуты (120-210 секунд)
    var delay = (120 + Math.random() * 90) * 1000;
    cometTimer = setTimeout(function () {
      spawnGoldenComet();
      scheduleNextComet();
    }, delay);
  }

  function spawnGoldenComet() {
    var ov = document.getElementById('clicker-overlay');
    if (!ov || ov.classList.contains('hidden')) return;

    var comet = document.createElement('div');
    comet.className = 'ck-golden-comet';

    var startY = Math.random() * (window.innerHeight * 0.6) + 40;
    var startX = -60;
    var endX = window.innerWidth + 80;
    var endY = startY + (Math.random() * 140 - 70);

    comet.style.left = startX + 'px';
    comet.style.top = startY + 'px';
    document.body.appendChild(comet);

    var dur = 6000 + Math.random() * 2000; // 6-8 сек на полет
    var startTime = Date.now();

    function flight() {
      if (!comet.parentNode) return;
      var p = (Date.now() - startTime) / dur;
      if (p >= 1) {
        if (comet.parentNode) comet.parentNode.removeChild(comet);
        return;
      }
      var curX = startX + (endX - startX) * p;
      var curY = startY + (endY - startY) * p;
      comet.style.left = curX + 'px';
      comet.style.top = curY + 'px';
      requestAnimationFrame(flight);
    }
    requestAnimationFrame(flight);

    comet.addEventListener('click', function (e) {
      e.stopPropagation();
      if (comet.parentNode) comet.parentNode.removeChild(comet);

      // Активация x2 баффа на 30 секунд
      cometBuffActive = true;
      cometBuffEnd = Date.now() + 30000;

      // Вспышка и звуковой эффект
      var flash = document.createElement('div');
      flash.className = 'ck-comet-flash';
      document.body.appendChild(flash);
      setTimeout(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 600);

      if (window.sfxRebirth) window.sfxRebirth();
      if (window.ckToast) window.ckToast('ЗОЛОТАЯ КОМЕТА ПОЙМАНА! x2 ДОХОД НА 30 СЕК!');
      if (window.render) window.render(true);
    });
  }

  function isCometBuffActive() {
    if (cometBuffActive && Date.now() > cometBuffEnd) {
      cometBuffActive = false;
      if (window.ckToast) window.ckToast('Действие Золотой кометы закончилось.');
    }
    return cometBuffActive;
  }

  /* Блок 7: Дерево навыков за МЕГА (Ветки Крита, Дохода, Дропа) */
  var SKILL_TREE_CONFIG = {
    crit: [
      { id: 'crit_chance', name: 'Лазерный Фокус', desc: '+3% шанс крита', max: 5, cost: 1, type: 'crit_chance', val: 3 },
      { id: 'crit_damage', name: 'Квантовый Разрыв', desc: '+2x множитель крита', max: 5, cost: 2, type: 'crit_mult', val: 2 },
      { id: 'crit_overload', name: 'Перегрузка Бездны', desc: '+10% крит и +5x крит-множ', max: 3, cost: 5, type: 'crit_hyper', val: 10, multVal: 5 }
    ],
    income: [
      { id: 'inc_mult', name: 'Гипердвигатель', desc: '+50% ко всему доходу', max: 5, cost: 1, type: 'income_pct', val: 50 },
      { id: 'inc_dps', name: 'Темный Реактор', desc: '+150% к авто-доходу', max: 5, cost: 2, type: 'auto_pct', val: 150 },
      { id: 'inc_warp', name: 'Варп-Сингулярность', desc: '+300% ко всему доходу', max: 3, cost: 5, type: 'income_pct', val: 300 }
    ],
    drop: [
      { id: 'drop_luck', name: 'Гравитационный Захват', desc: '+0.05% шанс дропа артефактов', max: 5, cost: 1, type: 'drop_chance', val: 0.0005 },
      { id: 'drop_void', name: 'Маяк Пустоты', desc: '+15% шанс более редких дропов', max: 5, cost: 2, type: 'drop_rarity', val: 15 },
      { id: 'drop_omni', name: 'Дар Создателя', desc: 'Двойной дроп артефактов', max: 1, cost: 8, type: 'drop_double', val: 1 }
    ]
  };

  function getSkillLevel(branch, skillId) {
    FEAT.skillTree = FEAT.skillTree || {};
    FEAT.skillTree[branch] = FEAT.skillTree[branch] || {};
    return Number(FEAT.skillTree[branch][skillId]) || 0;
  }

  function getAvailableMegaSP() {
    var ex = window.__CKEX || {};
    var totalMega = Number(ex.megaCount) || 0;
    var spent = Number(FEAT.megaSpentOnSkills) || 0;
    return Math.max(0, totalMega - spent);
  }

  function upgradeSkill(branch, skill) {
    var curLvl = getSkillLevel(branch, skill.id);
    if (curLvl >= skill.max) return false;
    var sp = getAvailableMegaSP();
    if (sp < skill.cost) return false;

    FEAT.megaSpentOnSkills = (Number(FEAT.megaSpentOnSkills) || 0) + skill.cost;
    FEAT.skillTree[branch][skill.id] = curLvl + 1;
    saveState();

    if (window.sfxBuy) window.sfxBuy();
    if (window.ckToast) window.ckToast('НАВЫК УЛУЧШЕН: ' + skill.name + ' (ур.' + (curLvl + 1) + ')');
    if (window.render) window.render(true);
    return true;
  }

  function buildSkillTreeUI(acts) {
    if (document.getElementById('ck-treebtn')) return;
    var btn = document.createElement('button');
    btn.id = 'ck-treebtn';
    btn.textContent = 'ДЕРЕВО НАВЫКОВ';
    acts.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = 'ck-tree-modal';
    modal.className = 'clicker-ui hidden';

    var box = document.createElement('div');
    box.id = 'ck-tree-box';
    box.innerHTML = '<h2>ДЕРЕВО НАВЫКОВ (МЕГА)</h2>' +
      '<div id="ck-tree-sp">Доступно очков МЕГА: <b>0</b></div>' +
      '<div class="ck-tree-columns">' +
        '<div class="ck-tree-col" id="ck-tree-crit"><div class="ck-tree-col-title" style="color:#f43f5e;">Ветка Крита</div></div>' +
        '<div class="ck-tree-col" id="ck-tree-income"><div class="ck-tree-col-title" style="color:#38bdf8;">Ветка Дохода</div></div>' +
        '<div class="ck-tree-col" id="ck-tree-drop"><div class="ck-tree-col-title" style="color:#eab308;">Ветка Дропа</div></div>' +
      '</div>';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'ck-close-tree';
    closeBtn.textContent = 'ЗАКРЫТЬ';
    closeBtn.addEventListener('click', function () { modal.classList.add('hidden'); });

    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    btn.addEventListener('click', function () {
      modal.classList.remove('hidden');
      renderSkillTreeModal(box);
    });
  }

  function renderSkillTreeModal(box) {
    var spEl = box.querySelector('#ck-tree-sp b');
    var sp = getAvailableMegaSP();
    if (spEl) spEl.textContent = sp;

    var branches = [
      { id: 'crit', colEl: box.querySelector('#ck-tree-crit') },
      { id: 'income', colEl: box.querySelector('#ck-tree-income') },
      { id: 'drop', colEl: box.querySelector('#ck-tree-drop') }
    ];

    branches.forEach(function (b) {
      if (!b.colEl) return;
      var titleEl = b.colEl.querySelector('.ck-tree-col-title');
      b.colEl.innerHTML = '';
      if (titleEl) b.colEl.appendChild(titleEl);

      SKILL_TREE_CONFIG[b.id].forEach(function (skill, idx) {
        var lvl = getSkillLevel(b.id, skill.id);
        var isMax = lvl >= skill.max;
        var can = !isMax && sp >= skill.cost;

        var node = document.createElement('div');
        node.className = 'ck-tree-node ' + (isMax ? 'maxed' : '');
        node.innerHTML = '<div class="ck-tree-node-name">' + skill.name + '</div>' +
          '<div class="ck-tree-node-desc">' + skill.desc + '</div>' +
          '<div class="ck-tree-node-lvl">Уровень: ' + lvl + ' / ' + skill.max + '</div>' +
          '<button class="ck-tree-upbtn" ' + (can ? '' : 'disabled') + '>' +
            (isMax ? 'МАКС.' : 'КУПИТЬ: ' + skill.cost + ' МЕГА') +
          '</button>';

        var upBtn = node.querySelector('.ck-tree-upbtn');
        upBtn.addEventListener('click', function () {
          if (upgradeSkill(b.id, skill)) {
            renderSkillTreeModal(box);
          }
        });

        b.colEl.appendChild(node);
      });
    });
  }

  /* Блок 8: Сезонный Пропуск (30 Дней, Free и Premium) */
  var SEASON_LEVELS_COUNT = 30;
  var XP_PER_LEVEL = 1000;

  function initSeasonData() {
    FEAT.season = FEAT.season || {};
    if (!FEAT.season.start) {
      FEAT.season.start = Date.now();
      FEAT.season.xp = 0;
      FEAT.season.premium = false;
      FEAT.season.claimedFree = {};
      FEAT.season.claimedPrem = {};
    }
    // Сброс сезона через 30 дней
    var elapsed = Date.now() - FEAT.season.start;
    if (elapsed > 30 * 86400 * 1000) {
      FEAT.season.start = Date.now();
      FEAT.season.xp = 0;
      FEAT.season.premium = false;
      FEAT.season.claimedFree = {};
      FEAT.season.claimedPrem = {};
      saveState();
    }
  }

  function getSeasonLevel() {
    initSeasonData();
    return Math.min(SEASON_LEVELS_COUNT, Math.floor(FEAT.season.xp / XP_PER_LEVEL) + 1);
  }

  function getSeasonRewards(lvl) {
    var freeRew = { label: '+10K кликов', type: 'clicks', val: 10000 };
    var premRew = { label: '+2x Множитель', type: 'mult', val: 2 };

    if (lvl % 5 === 0) {
      freeRew = { label: '1 Ядро', type: 'item', id: 'core', cnt: 1 };
      premRew = { label: '1 Пустота', type: 'item', id: 'void', cnt: 1 };
    } else if (lvl % 3 === 0) {
      freeRew = { label: 'Gold Rush (15м)', type: 'boost', id: 'gold', dur: 900 };
      premRew = { label: '+10x Множитель', type: 'mult', val: 10 };
    } else if (lvl === 30) {
      freeRew = { label: '3 Новы', type: 'item', id: 'nova', cnt: 3 };
      premRew = { label: 'Слеза Демиурга', type: 'boost', id: 'godtear', dur: 180 };
    }
    return { free: freeRew, prem: premRew };
  }

  function buildSeasonPassUI(acts) {
    if (document.getElementById('ck-passbtn')) return;
    var btn = document.createElement('button');
    btn.id = 'ck-passbtn';
    btn.textContent = 'СЕЗОН';
    acts.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = 'ck-pass-modal';
    modal.className = 'clicker-ui hidden';

    var box = document.createElement('div');
    box.id = 'ck-pass-box';
    box.innerHTML = '<h2>СЕЗОННЫЙ ПРОПУСК (30 ДНЕЙ)</h2>' +
      '<div id="ck-pass-head" class="ck-pass-header"></div>' +
      '<div id="ck-pass-list" class="ck-pass-levels"></div>';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'ck-close-pass';
    closeBtn.textContent = 'ЗАКРЫТЬ';
    closeBtn.addEventListener('click', function () { modal.classList.add('hidden'); });

    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    btn.addEventListener('click', function () {
      modal.classList.remove('hidden');
      renderSeasonPassModal(box);
    });
  }

  function renderSeasonPassModal(box) {
    initSeasonData();
    var headEl = box.querySelector('#ck-pass-head');
    var listEl = box.querySelector('#ck-pass-list');

    var curLvl = getSeasonLevel();
    var curXp = FEAT.season.xp % XP_PER_LEVEL;
    var daysLeft = Math.max(0, 30 - Math.floor((Date.now() - FEAT.season.start) / (86400 * 1000)));
    var hasPrem = !!FEAT.season.premium;
    var availableMega = getAvailableMegaSP();

    headEl.innerHTML = '<div style="flex:1;min-width:200px;">' +
        '<div style="font-size:13px;font-weight:800;color:#fde047;">Уровень ' + curLvl + ' / 30 · Осталось ' + daysLeft + ' дн.</div>' +
        '<div style="font-size:11px;color:#cbd5e1;margin-top:2px;">XP: ' + curXp + ' / ' + XP_PER_LEVEL + ' (даётся за клики и реберфы)</div>' +
        '<div class="ck-pass-xp-bar"><div class="ck-pass-xp-fill" style="width:' + Math.min(100, (curXp / XP_PER_LEVEL) * 100) + '%"></div></div>' +
      '</div>' +
      '<button id="ck-pass-prem-btn" class="ck-pass-buy-prem" ' + (hasPrem ? 'disabled' : '') + '>' +
        (hasPrem ? '✓ ПРЕМИУМ АКТИВЕН' : 'КУПИТЬ ПРЕМИУМ (3 МЕГА)') +
      '</button>';

    var premBtn = headEl.querySelector('#ck-pass-prem-btn');
    premBtn.addEventListener('click', function () {
      if (hasPrem || availableMega < 3) return;
      FEAT.megaSpentOnSkills = (Number(FEAT.megaSpentOnSkills) || 0) + 3;
      FEAT.season.premium = true;
      saveState();
      if (window.sfxBuy) window.sfxBuy();
      if (window.ckToast) window.ckToast('ПРЕМИУМ ПРОПУСК АКТИВИРОВАН!');
      renderSeasonPassModal(box);
    });

    var rowsH = '';
    for (var l = 1; l <= SEASON_LEVELS_COUNT; l++) {
      var rews = getSeasonRewards(l);
      var isUnlocked = curLvl >= l;
      var isFreeClaimed = !!FEAT.season.claimedFree[l];
      var isPremClaimed = !!FEAT.season.claimedPrem[l];

      var isCur = curLvl === l;
      rowsH += '<div class="ck-pass-row ' + (isCur ? 'current-lvl' : '') + '">' +
        '<div class="ck-pass-lvl-badge" style="' + (isCur ? 'color:#ffd76a;text-shadow:0 0 10px #fbbf24;transform:scale(1.1);' : '') + '">УР.' + l + (isCur ? ' ★' : '') + '</div>' +
        '<div class="ck-pass-reward-card">' +
          '<span>' + rews.free.label + '</span>' +
          '<button class="ck-pass-claim" data-claim-free="' + l + '" ' + ((!isUnlocked || isFreeClaimed) ? 'disabled' : '') + '>' +
            (isFreeClaimed ? '✓' : 'ВЗЯТЬ') +
          '</button>' +
        '</div>' +
        '<div class="ck-pass-reward-card prem">' +
          '<span style="color:#fde047;">' + rews.prem.label + '</span>' +
          '<button class="ck-pass-claim" data-claim-prem="' + l + '" ' + ((!isUnlocked || !hasPrem || isPremClaimed) ? 'disabled' : '') + '>' +
            (isPremClaimed ? '✓' : 'ВЗЯТЬ') +
          '</button>' +
        '</div>' +
      '</div>';
    }
    listEl.innerHTML = rowsH;

    listEl.querySelectorAll('button[data-claim-free]').forEach(function (b) {
      b.addEventListener('click', function () {
        var lvl = parseInt(b.getAttribute('data-claim-free'), 10);
        var rw = getSeasonRewards(lvl).free;
        FEAT.season.claimedFree[lvl] = true;
        saveState();
        grantReward(rw.type, rw);
        renderSeasonPassModal(box);
      });
    });

    listEl.querySelectorAll('button[data-claim-prem]').forEach(function (b) {
      b.addEventListener('click', function () {
        var lvl = parseInt(b.getAttribute('data-claim-prem'), 10);
        var rw = getSeasonRewards(lvl).prem;
        FEAT.season.claimedPrem[lvl] = true;
        saveState();
        grantReward(rw.type, rw);
        renderSeasonPassModal(box);
      });
    });
  }

  function addSeasonXP(amount) {
    initSeasonData();
    var prevLvl = getSeasonLevel();
    FEAT.season.xp = (Number(FEAT.season.xp) || 0) + amount;
    saveState();
    var newLvl = getSeasonLevel();
    if (newLvl > prevLvl && window.ckToast) {
      window.ckToast('НОВЫЙ УРОВЕНЬ СЕЗОНА: ' + newLvl + '!');
    }
  }

  /* Блок 9: Мутации планет (10 уникальных пассивок от Нептуна до Черной дыры) */
  var PLANET_MUTATIONS = [
    { stage: 0, planet: 'Нептун', name: 'Крио-Стазис', orbType: 'ice', col: '#38bdf8', grad: 'radial-gradient(circle at 35% 30%,#bfe8ff,#3f7fd6 55%,#12356b)', desc: '+25% к длительности всех бустеров', type: 'boost_dur', val: 0.25 },
    { stage: 1, planet: 'Уран', name: 'Ионный Шквал', orbType: 'cyan', col: '#2dd4bf', grad: 'radial-gradient(circle at 35% 30%,#d6fff9,#3aa79b 55%,#0f4a44)', desc: '+15% шанс крита', type: 'crit_chance', val: 15 },
    { stage: 2, planet: 'Сатурн', name: 'Кольца Притяжения', orbType: 'ringed', col: '#fde047', grad: 'radial-gradient(circle at 35% 30%,#fff3c4,#e0b23e 55%,#7a5a10)', desc: '+40% авто-дохода (CPS)', type: 'auto_cps', val: 0.40 },
    { stage: 3, planet: 'Юпитер', name: 'Гравитационный Молот', orbType: 'striped', col: '#fb923c', grad: 'radial-gradient(circle at 35% 30%,#ffe0b3,#d1912f 55%,#6e4308)', desc: '+50% к силе клика', type: 'click_power', val: 0.50 },
    { stage: 4, planet: 'Марс', name: 'Красная Плазма', orbType: 'red', col: '#f43f5e', grad: 'radial-gradient(circle at 35% 30%,#ffc0a0,#d14924 55%,#5e1508)', desc: '+3x к множителю крита', type: 'crit_mult', val: 3 },
    { stage: 5, planet: 'Земля', name: 'Живая Биосфера', orbType: 'earth', col: '#4ade80', grad: 'radial-gradient(circle at 35% 30%,#bfe0ff,#34d399 45%,#15803d 70%,#1e3a8a)', desc: '+60% ко всему доходу навсегда на этой стадии', type: 'income_pct', val: 0.60 },
    { stage: 6, planet: 'Венера', name: 'Кислотный Синтез', orbType: 'acid', col: '#facc15', grad: 'radial-gradient(circle at 35% 30%,#ffedc2,#e8c37e 55%,#7a5a20)', desc: 'Удвоение частоты выпадения артефактов', type: 'drop_rate', val: 2 },
    { stage: 7, planet: 'Меркурий', name: 'Солнечный Шторм', orbType: 'iron', col: '#e2e8f0', grad: 'radial-gradient(circle at 35% 30%,#ffffff,#a8a8a8 55%,#4d4d4d)', desc: '+100% авто-дохода (CPS)', type: 'auto_cps', val: 1.00 },
    { stage: 8, planet: 'Солнце', name: 'Термоядерный Взрыв', orbType: 'sun', col: '#f97316', grad: 'radial-gradient(circle at 35% 30%,#ffffff,#ffc233 45%,#ea580c 75%,#7c2d12)', desc: '+150% ко всему доходу', type: 'income_pct', val: 1.50 },
    { stage: 9, planet: 'Чёрная дыра', name: 'Сингулярность Бездны', orbType: 'blackhole', col: '#c084fc', grad: 'radial-gradient(circle at 35% 30%, #f3e8ff 0%, #a855f7 50%, #4c1d95 85%)', desc: '+500% ко всему доходу и +20% крит', type: 'singularity', val: 5.00, critVal: 20 }
  ];

  function generateMutationOrbHtml(m) {
    var h = '<div class="ck-mut-orb" style="color:' + m.col + ';background:' + m.grad + '">';
    if (m.orbType === 'ringed') {
      h += '<div class="ck-mut-ring"></div>';
    } else if (m.orbType === 'blackhole') {
      h += '<div class="ck-mut-bh-core"></div>';
    }
    h += '</div>';
    return h;
  }

  function getActivePlanetMutation() {
    var stg = window.ckStage ? window.ckStage() : 0;
    return PLANET_MUTATIONS[stg] || PLANET_MUTATIONS[0];
  }

  function updatePlanetMutationHUD() {
    // Полностью убираем 3D-планету и HUD из экрана кликера
    var oldHud = document.getElementById('ck-mutation-hud');
    if (oldHud && oldHud.parentNode) {
      oldHud.parentNode.removeChild(oldHud);
    }
  }

  /* Блок 10: Свайп и выброс предметов инвентаря */
  function setupInventorySwipe() {
    var invGrid = document.querySelector('.ck-inv-grid');
    if (!invGrid) return;

    var cards = invGrid.querySelectorAll('.ck-inv-card');
    cards.forEach(function (card) {
      if (card.__swipeAttached) return;
      card.__swipeAttached = true;

      var startX = 0;
      var currentX = 0;
      var isDragging = false;
      var titleEl = card.querySelector('b');
      var itemName = titleEl ? titleEl.textContent.trim() : '';

      function onStart(x) {
        isDragging = true;
        startX = x;
        currentX = x;
        card.style.transition = 'none';
      }

      function onMove(x) {
        if (!isDragging) return;
        currentX = x;
        var diffX = currentX - startX;
        var rot = diffX * 0.1;
        card.style.transform = 'translateX(' + diffX + 'px) rotate(' + rot + 'deg)';
        card.style.opacity = Math.max(0.2, 1 - Math.abs(diffX) / 250);
      }

      function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        var diffX = currentX - startX;
        card.style.transition = 'transform .22s cubic-bezier(0.18, 0.9, 0.3, 1), opacity .22s';

        if (Math.abs(diffX) > 85) {
          var flyClass = diffX > 0 ? 'ck-swipe-fly-r' : 'ck-swipe-fly-l';
          card.className += ' ' + flyClass;

          var itemId = '';
          var itemsMeta = [
            { id: 'shard', n: 'Осколок' },
            { id: 'core', n: 'Ядро' },
            { id: 'prism', n: 'Призма' },
            { id: 'nova', n: 'Нова' },
            { id: 'void', n: 'Пустота' }
          ];
          itemsMeta.forEach(function (m) {
            if (m.n === itemName) itemId = m.id;
          });

          setTimeout(function () {
            if (itemId && window.CK && window.CK.inv) {
              var idx = window.CK.inv.lastIndexOf(itemId);
              if (idx !== -1) {
                window.CK.inv.splice(idx, 1);
                if (window.ckSave) window.ckSave();
                if (window.ckToast) window.ckToast('Выброшен 1 ' + itemName);
                if (window.sfxBuy) window.sfxBuy();
              }
            }
            if (window.ckInvRender) window.ckInvRender();
            setupInventorySwipe();
          }, 200);
        } else {
          card.style.transform = '';
          card.style.opacity = '1';
        }
      }

      // Touch events
      card.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) onStart(e.touches[0].clientX);
      }, { passive: true });
      card.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1) onMove(e.touches[0].clientX);
      }, { passive: true });
      card.addEventListener('touchend', onEnd);

      // Mouse drag events
      card.addEventListener('mousedown', function (e) {
        onStart(e.clientX);
        function onMouseMove(ev) { onMove(ev.clientX); }
        function onMouseUp() {
          onEnd();
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  // Перехват открытия инвентаря для навешивания свайпов
  setInterval(function () {
    var invModal = document.getElementById('ck-inv');
    if (invModal && !invModal.classList.contains('hidden')) {
      setupInventorySwipe();
    }
  }, 400);

  /* Блок 11: Пакетная покупка и выбор длительности зелий (Пропорциональный расчет цена/время) */
  var currentBulkMult = 1;

  function setupShopBulkBuy() {
    var existing = document.getElementById('ck-shop-bulk');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function updateShopBulkPrices() {
    var shopBox = document.getElementById('ck-shop-box');
    if (!shopBox) return;

    var bList = [
      { id: 'frenzy', n: 'Click Frenzy', dur: 60, price: 2.5e11 },
      { id: 'surge', n: 'Auto Surge', dur: 1800, price: 7.5e11 },
      { id: 'gold', n: 'Gold Rush', dur: 3600, price: 5e12 },
      { id: 'novaflask', n: 'Nova Flask', dur: 300, price: 2e12 },
      { id: 'quasar', n: 'Quasar Brew', dur: 900, price: 4e12 },
      { id: 'hyperion', n: 'Hyperion Draft', dur: 1200, price: 2e13 },
      { id: 'voidflask', n: 'Void Elixir', dur: 120, price: 1e13 },
      { id: 'pstorm', n: 'Photon Storm', dur: 90, price: 1e14 },
      { id: 'chrono', n: 'Chrono Field', dur: 1800, price: 5e13 },
      { id: 'abyss', n: 'Эликсир Бездны', dur: 240, price: 5e14 },
      { id: 'supernova', n: 'Дыхание Сверхновой', dur: 600, price: 1e15 },
      { id: 'singularity', n: 'Катализатор Сингулярности', dur: 1200, price: 5e15 },
      { id: 'aether', n: 'Астральный Нектар', dur: 3600, price: 2e16 },
      { id: 'godtear', n: 'Слеза Демиурга', dur: 180, price: 1e17 }
    ];

    bList.forEach(function (boostData) {
      var item = shopBox.querySelector('.ck-item-boost-' + boostData.id);
      if (!item) return;
      var btn = item.querySelector('button');
      if (!btn) return;

      var totalPrice = boostData.price * currentBulkMult;
      var totalDur = boostData.dur * currentBulkMult;

      // Точное обновление текста цены перед кнопкой
      var costDiv = btn.previousElementSibling;
      if (costDiv) {
        costDiv.textContent = 'Price: ' + (window.fmtNum ? window.fmtNum(totalPrice) : totalPrice);
      }

      // Обновление описания длительности в карточке
      var subEl = item.querySelector('small');
      if (subEl) {
        var durFmt = totalDur >= 3600 ? (Math.floor(totalDur / 3600) + 'ч ' + Math.floor((totalDur % 3600) / 60) + 'м') : (Math.floor(totalDur / 60) + 'м ' + (totalDur % 60) + 'с');
        subEl.textContent = 'Длительность: ' + durFmt + ' (x' + currentBulkMult + ')';
      }

      var can = window.CK && window.CK.clicks >= totalPrice;
      btn.disabled = !can;
      btn.textContent = can ? ('КУПИТЬ (' + currentBulkMult + 'x)') : 'МАЛО';

      if (!btn.__bulkAttached) {
        btn.__bulkAttached = true;
        btn.addEventListener('click', function (e) {
          e.stopImmediatePropagation();
          var realTotalPrice = boostData.price * currentBulkMult;
          var realTotalDur = boostData.dur * currentBulkMult;
          if (!window.CK || window.CK.clicks < realTotalPrice) return;

          window.CK.clicks -= realTotalPrice;
          var now = Date.now();
          window.CK.boost = window.CK.boost || {};
          var cur = (window.CK.boost[boostData.id] > now) ? window.CK.boost[boostData.id] : now;
          window.CK.boost[boostData.id] = cur + (realTotalDur * 1000);

          if (window.sfxBuy) window.sfxBuy();
          if (window.ckSave) window.ckSave();
          if (window.ckToast) window.ckToast('КУПЛЕНО: ' + boostData.n + ' на ' + Math.round(realTotalDur / 60) + ' мин!');
          if (window.render) window.render();
          updateShopBulkPrices();
        }, true);
      }
    });
  }

  setInterval(function () {
    var shop = document.getElementById('ck-shop');
    if (shop && !shop.classList.contains('hidden')) {
      setupShopBulkBuy();
      updateShopBulkPrices();
    }
  }, 500);

  function buildMutationsUI(acts) {
    if (document.getElementById('ck-mut-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'ck-mut-btn';
    btn.textContent = 'МУТАЦИИ';
    acts.appendChild(btn);

    var modal = document.createElement('div');
    modal.id = 'ck-mut-modal';
    modal.className = 'clicker-ui hidden';

    var box = document.createElement('div');
    box.id = 'ck-mut-box';
    box.innerHTML = '<h2>МУТАЦИИ ПЛАНЕТ</h2>' +
      '<div style="text-align:center;font-size:12px;color:#94a3b8;margin-bottom:14px;">Каждая планета даёт уникальный пассивный бонус, пока ты находишься на её стадии!</div>' +
      '<div id="ck-mut-list" class="ck-mut-grid"></div>';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'ck-close-mut';
    closeBtn.textContent = 'ЗАКРЫТЬ';
    closeBtn.addEventListener('click', function () { modal.classList.add('hidden'); });

    box.appendChild(closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    btn.addEventListener('click', function () {
      modal.classList.remove('hidden');
      renderMutationsModal(box);
    });
  }

  function renderMutationsModal(box) {
    var listEl = box.querySelector('#ck-mut-list');
    var curStg = window.ckStage ? window.ckStage() : 0;
    var h = '';

    PLANET_MUTATIONS.forEach(function (m) {
      var isActive = curStg === m.stage;
      h += '<div class="ck-mut-card ' + (isActive ? 'active' : '') + '">' +
        generateMutationOrbHtml(m) +
        '<div class="ck-mut-card-info">' +
          '<div class="ck-mut-card-title" style="color:' + m.col + '">' + m.planet + ': ' + m.name + (isActive ? ' (АКТИВНА)' : '') + '</div>' +
          '<div class="ck-mut-card-eff">' + m.desc + '</div>' +
        '</div>' +
      '</div>';
    });
    listEl.innerHTML = h;
  }

  /* Блок 6: Престиж-тиры и эволюции диска */
  var PRESTIGE_TIERS = [
    { tier: 0, name: 'Странник Орбиты', minMega: 0, minSuper: 0, tagCol: '#94a3b8', bgCol: 'rgba(148,163,184,.15)', cls: '' },
    { tier: 1, name: 'Квантовый Пульсар', minMega: 5, minSuper: 0, tagCol: '#38bdf8', bgCol: 'rgba(56,189,248,.2)', cls: 'ck-tier-1' },
    { tier: 2, name: 'Сверхновая Бездны', minMega: 20, minSuper: 0, tagCol: '#f43f5e', bgCol: 'rgba(244,63,94,.25)', cls: 'ck-tier-2' },
    { tier: 3, name: 'Космический Демиург', minMega: 0, minSuper: 1, tagCol: '#fde047', bgCol: 'rgba(253,224,71,.25)', cls: 'ck-tier-3' },
    { tier: 4, name: 'Бог Бесконечности', minMega: 0, minSuper: 5, tagCol: '#c084fc', bgCol: 'rgba(192,132,252,.3)', cls: 'ck-tier-4' }
  ];

  function getCurrentPrestigeTier() {
    var ex = window.__CKEX || {};
    var mega = Number(ex.megaCount) || 0;
    var sup = Number(ex.superCount) || 0;
    var current = PRESTIGE_TIERS[0];

    for (var i = PRESTIGE_TIERS.length - 1; i >= 0; i--) {
      var t = PRESTIGE_TIERS[i];
      if (t.minSuper > 0 && sup >= t.minSuper) { current = t; break; }
      if (t.minSuper === 0 && mega >= t.minMega) { current = t; break; }
    }
    return current;
  }

  function applyPrestigeVisuals() {
    var disc = document.getElementById('ck-disc');
    if (!disc) return;
    var tier = getCurrentPrestigeTier();

    PRESTIGE_TIERS.forEach(function (t) {
      if (t.cls) disc.classList.remove(t.cls);
    });
    if (tier.cls) disc.classList.add(tier.cls);

    var discName = document.getElementById('ck-disc-name');
    if (discName) {
      var tag = discName.querySelector('.ck-prestige-tag');
      if (!tag) {
        tag = document.createElement('div');
        tag.className = 'ck-prestige-tag';
        discName.appendChild(tag);
      }
      tag.textContent = tier.name;
      tag.style.color = tier.tagCol;
      tag.style.background = tier.bgCol;
      tag.style.border = '1px solid ' + tier.tagCol;
    }
  }

  function updateWheelButtons(btnClk, btnShd) {
    if (isSpinning) {
      btnClk.disabled = true;
      btnShd.disabled = true;
      return;
    }
    var voids = 0;
    if (window.CK && window.CK.inv) {
      window.CK.inv.forEach(function (id) { if (id === 'void') voids++; });
    }
    btnClk.disabled = !window.CK || window.CK.clicks < 1e17;
    btnShd.disabled = voids < 1;
    btnShd.textContent = 'КРУТИТЬ ЗА 1 МИСТИК (ПУСТОТ: ' + voids + ')';
  }

  function startSpin(canvas, resEl, btnClk, btnShd) {
    isSpinning = true;
    updateWheelButtons(btnClk, btnShd);
    resEl.textContent = 'Колесо вращается...';

    var targetSector = Math.floor(Math.random() * WHEEL_SECTORS.length);
    var sectorArc = 360 / WHEEL_SECTORS.length;
    var extraRounds = 5 + Math.floor(Math.random() * 3);
    var targetDeg = (360 - (targetSector * sectorArc) - (sectorArc / 2)) + (360 * extraRounds) - 90;
    wheelAngle += targetDeg;
    canvas.style.transform = 'rotate(' + wheelAngle + 'deg)';

    setTimeout(function () {
      isSpinning = false;
      var won = WHEEL_SECTORS[targetSector];
      resEl.textContent = 'ВЫИГРЫШ: ' + won.label + '!';
      grantReward(won.type, won);
      updateWheelButtons(btnClk, btnShd);
    }, 4100);
  }

  var bootInterval = setInterval(function () {
    if (window.__CKAPI && document.getElementById('ck-actions')) {
      clearInterval(bootInterval);
      hookEngine();
    }
  }, 200);

  setInterval(function () {
    var h = document.getElementById('ck-mutation-hud');
    if (h && h.parentNode) h.parentNode.removeChild(h);
  }, 300);

  /* Стили для красивой админ-панели */
  if (!document.getElementById('ck-admin-pro-styles')) {
    var admSt = document.createElement('style');
    admSt.id = 'ck-admin-pro-styles';
    admSt.textContent = '#ck-admin-panel {' +
      'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 99999;' +
      'width: 480px; max-width: 95vw; max-height: 88vh; overflow-y: auto;' +
      'background: rgba(10, 15, 29, 0.95); backdrop-filter: blur(16px);' +
      'border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 16px;' +
      'box-shadow: 0 0 35px rgba(56, 189, 248, 0.2), 0 20px 50px rgba(0, 0, 0, 0.8);' +
      'padding: 20px; font-family: system-ui, -apple-system, sans-serif; color: #f8fafc;' +
    '}' +
    '.ck-adm-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 16px; }' +
    '.ck-adm-title { font-size: 18px; font-weight: 800; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }' +
    '.ck-adm-sec { margin-bottom: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; }' +
    '.ck-adm-sec-title { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }' +
    '.ck-adm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }' +
    '.ck-adm-btn {' +
      'background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid rgba(56,189,248,0.25);' +
      'color: #38bdf8; font-weight: 600; font-size: 12px; padding: 8px 12px; border-radius: 8px; cursor: pointer;' +
      'transition: all 0.2s;' +
    '}' +
    '.ck-adm-btn:hover { background: #0284c7; color: #fff; border-color: #38bdf8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(56,189,248,0.3); }' +
    '.ck-adm-close { background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }' +
    '.ck-adm-close:hover { color: #fff; }';
    document.head.appendChild(admSt);
  }

  /* Функция открытия расширенной админки */
  window.openAdminPanel = function () {
    var old = document.getElementById('ck-admin-panel');
    if (old) { old.remove(); return; }
    var p = document.createElement('div');
    p.id = 'ck-admin-panel';
    p.innerHTML = '<div class="ck-adm-head">' +
      '<div class="ck-adm-title">⚙ ПАНЕЛЬ УПРАВЛЕНИЯ [ВСЕМОГУЩЕСТВО]</div>' +
      '<button class="ck-adm-close" onclick="document.getElementById(\'ck-admin-panel\').remove()">✕</button>' +
    '</div>' +
    '<div class="ck-adm-sec">' +
      '<div class="ck-adm-sec-title">Валюта и Прогресс</div>' +
      '<div class="ck-adm-grid">' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.clicks=(window.CK.clicks||0)+1000000;if(window.render)window.render();if(window.ckToast)window.ckToast(\'+1,000,000 Кликов\');}">+1M Кликов</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.clicks=(window.CK.clicks||0)+1000000000;if(window.render)window.render();if(window.ckToast)window.ckToast(\'+1,000,000,000 Кликов\');}">+1B Кликов</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.rebirths=(window.CK.rebirths||0)+1;if(window.render)window.render();if(window.ckToast)window.ckToast(\'+1 Перерождение\');}">+1 Перерождение</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.rebirths=(window.CK.rebirths||0)+10;if(window.render)window.render();if(window.ckToast)window.ckToast(\'+10 Перерождений\');}">+10 Перерождений</button>' +
      '</div>' +
    '</div>' +
    '<div class="ck-adm-sec">' +
      '<div class="ck-adm-sec-title">Инвентарь и Кристаллы (Крафт)</div>' +
      '<div class="ck-adm-grid">' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.inv=window.CK.inv||[];for(var i=0;i<10;i++)window.CK.inv.push(\'shard\');if(window.ckInvRender)window.ckInvRender();if(window.ckToast)window.ckToast(\'Выдано: +10 Осколков\');}">+10 Осколков</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.inv=window.CK.inv||[];for(var i=0;i<10;i++)window.CK.inv.push(\'core\');if(window.ckInvRender)window.ckInvRender();if(window.ckToast)window.ckToast(\'Выдано: +10 Ядер\');}">+10 Ядер</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.inv=window.CK.inv||[];for(var i=0;i<10;i++)window.CK.inv.push(\'prism\');if(window.ckInvRender)window.ckInvRender();if(window.ckToast)window.ckToast(\'Выдано: +10 Призм\');}">+10 Призм</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.inv=window.CK.inv||[];for(var i=0;i<5;i++)window.CK.inv.push(\'nova\');if(window.ckInvRender)window.ckInvRender();if(window.ckToast)window.ckToast(\'Выдано: +5 Нова\');}">+5 Нова</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.inv=window.CK.inv||[];for(var i=0;i<5;i++)window.CK.inv.push(\'void\');if(window.ckInvRender)window.ckInvRender();if(window.ckToast)window.ckToast(\'Выдано: +5 Пустот\');}">+5 Пустот</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.inv=[];if(window.ckInvRender)window.ckInvRender();if(window.ckToast)window.ckToast(\'Инвентарь очищен\');}">Очистить инвентарь</button>' +
      '</div>' +
    '</div>' +
    '<div class="ck-adm-sec">' +
      '<div class="ck-adm-sec-title">Выдача Питомцев</div>' +
      '<div class="ck-adm-grid">' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.pets=window.CK.pets||[];PETS_CONFIG.forEach(function(p){if(window.CK.pets.indexOf(p.id)===-1)window.CK.pets.push(p.id);});if(window.rebuildOrbitElements)window.rebuildOrbitElements();if(window.ckToast)window.ckToast(\'Открыты ВСЕ 9 питомцев!\');}">🌟 Выдать ВСЕХ питомцев</button>' +
        '<button class="ck-adm-btn" onclick="if(window.CK){window.CK.pets=[];if(window.rebuildOrbitElements)window.rebuildOrbitElements();if(window.ckToast)window.ckToast(\'Питомцы сброшены\');}">Сбросить питомцев</button>' +
      '</div>' +
    '</div>' +
    '<div class="ck-adm-sec">' +
      '<div class="ck-adm-sec-title">Бустеры и Эффекты</div>' +
      '<div class="ck-adm-grid">' +
        '<button class="ck-adm-btn" onclick="if(window.applyPurchasedBoost)window.applyPurchasedBoost(\'gold\',300,5);">Буст x5 на 5 мин</button>' +
        '<button class="ck-adm-btn" onclick="if(window.applyPurchasedBoost)window.applyPurchasedBoost(\'hyper\',600,20);">Буст x20 на 10 мин</button>' +
      '</div>' +
    '</div>';
    document.body.appendChild(p);
  };

  // Горячая клавиша Shift + A или клик по версии для открытия админки
  document.addEventListener('keydown', function(e) {
    if (e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
      window.openAdminPanel();
    }
  });

  /* Стили и визуальные эффекты для обновленной Золотой Кометы */
  if (!document.getElementById('ck-gold-comet-fx')) {
    var cSt = document.createElement('style');
    cSt.id = 'ck-gold-comet-fx';
    cSt.textContent = '.ck-golden-comet {' +
      'width: 52px; height: 52px; position: fixed; z-index: 9999; cursor: pointer; pointer-events: auto;' +
      'display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 16px #facc15);' +
      'animation: ckCometSpin 2s linear infinite;' +
    '}' +
    '.ck-comet-core {' +
      'width: 22px; height: 22px; border-radius: 50%;' +
      'background: radial-gradient(circle at 35% 35%, #fff 25%, #fef08a 50%, #eab308 85%, #ca8a04);' +
      'box-shadow: 0 0 20px #fde047, 0 0 35px #eab308, inset 0 0 8px #fff;' +
    '}' +
    '.ck-comet-tail {' +
      'position: absolute; right: 18px; width: 140px; height: 18px;' +
      'background: linear-gradient(to left, transparent, rgba(234,179,8,0.4) 40%, rgba(254,240,138,0.9) 85%, #fff);' +
      'clip-path: polygon(0 45%, 100% 0, 100% 100%, 0 55%);' +
      'filter: blur(1px); transform-origin: right center;' +
    '}' +
    '@keyframes ckCometSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' +
    '.ck-comet-burst {' +
      'position: fixed; width: 12px; height: 12px; border-radius: 50%; pointer-events: none; z-index: 10000;' +
      'background: radial-gradient(circle, #fff, #facc15); box-shadow: 0 0 14px #eab308;' +
      'transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);' +
    '}';
    document.head.appendChild(cSt);
  }

  /* Эффект взрыва кометы искрами при клике */
  window.spawnCometExplosion = function (x, y) {
    for (var i = 0; i < 16; i++) {
      var spark = document.createElement('div');
      spark.className = 'ck-comet-burst';
      spark.style.left = x + 'px';
      spark.style.top = y + 'px';
      document.body.appendChild(spark);
      var angle = (Math.PI * 2 / 16) * i;
      var dist = 60 + Math.random() * 80;
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist;
      (function (s, dx, dy) {
        requestAnimationFrame(function () {
          s.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(0)';
          s.style.opacity = '0';
        });
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 750);
      })(spark, tx, ty);
    }
  };

  /* Гарантированное монтирование кибер-лиан в магазине для темы ГОЛУБАЯ v3 */
  function injectBlue3ShopVines() {
    var isBlue3 = document.body.classList.contains('theme-blue3') ||
                  document.body.classList.contains('theme-blue-v3') ||
                  document.body.getAttribute('data-theme') === 'blue3' ||
                  document.body.getAttribute('data-theme') === 'blue_v3';
    var shopPanels = document.querySelectorAll('#clicker-right, #shop, .tg-shop, .ck-shop-container, #shop-modal, .shop-modal');
    shopPanels.forEach(function (p) {
      var existing = p.querySelector('.ck-blue3-vines-overlay');
      if (!isBlue3) {
        if (existing) existing.remove();
        return;
      }
      if (!existing) {
        var v = document.createElement('div');
        v.className = 'ck-blue3-vines-overlay';
        v.style.cssText = 'position:absolute;top:0;left:0;bottom:0;width:38px;pointer-events:none;z-index:99;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 400\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M8 0 Q22 50 10 100 T18 200 T8 300 T16 400\' fill=\'none\' stroke=\'%2338bdf8\' stroke-width=\'3\' stroke-linecap=\'round\' opacity=\'0.85\'/%3E%3Cpath d=\'M14 60 Q26 50 28 65\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2.5\' opacity=\'0.9\'/%3E%3Ccircle cx=\'28\' cy=\'65\' r=\'3\' fill=\'%2367e8f9\'/%3E%3Cpath d=\'M11 160 Q0 150 2 165\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2.5\' opacity=\'0.9\'/%3E%3Ccircle cx=\'2\' cy=\'165\' r=\'3\' fill=\'%2367e8f9\'/%3E%3Cpath d=\'M16 260 Q30 250 32 265\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2.5\' opacity=\'0.9\'/%3E%3Ccircle cx=\'32\' cy=\'265\' r=\'3\' fill=\'%2367e8f9\'/%3E%3Cpath d=\'M10 350 Q-2 340 0 355\' fill=\'none\' stroke=\'%2334d399\' stroke-width=\'2.5\' opacity=\'0.9\'/%3E%3Ccircle cx=\'0\' cy=\'355\' r=\'3\' fill=\'%2367e8f9\'/%3E%3C/svg%3E");background-repeat:repeat-y;background-size:28px 300px;filter:drop-shadow(0 0 10px %2338bdf8);animation:ckVineBreathe 3s ease-in-out infinite alternate;';
        p.style.position = 'relative';
        p.appendChild(v);
      }
    });
  }
  setInterval(injectBlue3ShopVines, 600);

  /* Единое состояние модификаторов для бустеров */
  window.CK_BOOST_STATE = window.CK_BOOST_STATE || { mult: 1, timeMult: 1, qty: 1 };

  function getActiveBoostFactors() {
    var s = window.CK_BOOST_STATE;
    var mBtn = document.querySelector('.ck-pot-mult.active, .boost-mult-btn.active, [data-bmult].active');
    var tBtn = document.querySelector('.ck-pot-time.active, .boost-time-btn.active, [data-btime].active');
    var qInp = document.querySelector('#ck-pot-qty, .boost-qty-input');
    if (mBtn) s.mult = parseFloat(mBtn.getAttribute('data-bmult') || mBtn.getAttribute('data-mult') || mBtn.textContent.replace(/[^0-9.]/g, '')) || 1;
    if (tBtn) s.timeMult = parseFloat(tBtn.getAttribute('data-btime') || tBtn.getAttribute('data-time') || tBtn.textContent.replace(/[^0-9.]/g, '')) || 1;
    if (qInp) s.qty = Math.max(1, parseInt(qInp.value, 10) || 1);
    return s;
  }

  function refreshPotionPrices() {
    var factors = getActiveBoostFactors();
    var costMult = factors.mult * factors.timeMult * factors.qty;
    var cards = document.querySelectorAll('.ck-pot-card, .boost-card, [data-boost-id]');
    cards.forEach(function (card) {
      var costEl = card.querySelector('.ck-pot-cost, .boost-cost, .price');
      var durEl = card.querySelector('.ck-pot-dur, .boost-dur, .duration');
      if (costEl) {
        if (!costEl.hasAttribute('data-base-cost')) {
          var initCost = parseFloat(costEl.getAttribute('data-cost') || costEl.textContent.replace(/[^0-9.]/g, '')) || 100;
          costEl.setAttribute('data-base-cost', initCost);
        }
        var bCost = parseFloat(costEl.getAttribute('data-base-cost')) || 100;
        var fCost = Math.round(bCost * costMult);
        costEl.textContent = (window.formatNumber ? window.formatNumber(fCost) : fCost) + ' кликов';
      }
      if (durEl) {
        if (!durEl.hasAttribute('data-base-dur')) {
          var initDur = parseFloat(durEl.getAttribute('data-dur') || durEl.textContent.replace(/[^0-9.]/g, '')) || 60;
          durEl.setAttribute('data-base-dur', initDur);
        }
        var bDur = parseFloat(durEl.getAttribute('data-base-dur')) || 60;
        var fDur = Math.round(bDur * factors.timeMult);
        durEl.textContent = fDur >= 60 ? (Math.round(fDur / 60) + ' мин') : (fDur + ' сек');
      }
    });
  }

  /* Перехват покупки бустера с применением фактического множителя и времени */
  window.applyPurchasedBoost = function (boostId, baseDurationSec, baseMultiplier) {
    var factors = getActiveBoostFactors();
    var finalDur = (baseDurationSec || 60) * factors.timeMult;
    var finalPower = (baseMultiplier || 2) * factors.mult;
    if (window.CK) {
      window.CK.activeBoosts = window.CK.activeBoosts || [];
      window.CK.activeBoosts.push({
        id: boostId,
        multiplier: finalPower,
        expiresAt: Date.now() + (finalDur * 1000)
      });
      if (window.ckToast) window.ckToast('Бустер активирован: x' + finalPower + ' на ' + Math.round(finalDur) + ' сек!');
      if (window.render) window.render();
    }
  };

  /* Прямая и стабильная покупка зелий и бустеров по фиксированным ценам */
  document.querySelectorAll('.ck-pot-mult, .boost-mult-btn, .ck-pot-time, .boost-time-btn, #ck-pot-qty').forEach(function (el) {
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  window.addEventListener('click', function (e) {
    var btn = e.target.closest('.ck-pot-buy, .boost-buy-btn, [data-buy-boost], .buy-potion-btn');
    if (!btn) return;
    var card = btn.closest('.ck-pot-card, .boost-card, .potion-card, [data-boost-id], .shop-item, .upg-btn');
    if (!card) return;

    var costEl = card.querySelector('.price, .cost, .ck-pot-cost, .boost-cost, [data-cost]');
    var cost = 500;
    if (costEl) {
      var cMatch = costEl.textContent.match(/([0-9]+[0-9\s,.]*)/);
      if (cMatch) cost = parseFloat(cMatch[1].replace(/[^0-9]/g, '')) || 500;
    }

    if (!window.CK || (window.CK.clicks || 0) < cost) {
      if (window.ckToast) window.ckToast('Недостаточно кликов!');
      return;
    }

    window.CK.clicks -= cost;
    var baseDur = parseFloat(card.getAttribute('data-base-dur')) || 60;
    var baseMult = parseFloat(card.getAttribute('data-base-mult')) || 2;
    window.CK.activeBoosts = window.CK.activeBoosts || [];
    window.CK.activeBoosts.push({
      id: card.getAttribute('data-boost-id') || ('boost_' + Date.now()),
      multiplier: baseMult,
      expiresAt: Date.now() + (baseDur * 1000)
    });

    if (window.ckToast) window.ckToast('Бустер куплен: x' + baseMult + ' на ' + baseDur + ' сек!');
    if (window.render) window.render();
  });

  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest('#ck-potions-modal, .ck-potions-box, #potions-modal, .ck-pot-mult, .ck-pot-time, .pot-mult, .pot-time')) {
      setTimeout(refreshPotionPrices, 30);
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.closest('#ck-potions-modal, .ck-potions-box, #potions-modal')) {
      refreshPotionPrices();
    }
  });

  // Модуль полной интеграции со стандартной ВАЙП-ПАНЕЛЬЮ
  window.ckFeaturesWipe = function() {
    FEAT.pets = {};
    FEAT.petSkins = {};
    FEAT.unlockedSkins = {};
    FEAT.skills = {};
    FEAT.skillTree = { crit: {}, income: {}, drop: {} };
    FEAT.megaSpentOnSkills = 0;
    FEAT.season = { start: Date.now(), xp: 0, premium: false, claimedFree: {}, claimedPrem: {} };
    FEAT.stats = { totalManualClicks: 0, totalVoidsCollected: 0, totalRebirthsCompleted: 0, permGoldBonus: 0 };
    if (Array.isArray(FEAT.achievements)) {
      FEAT.achievements.forEach(function (a) { a.done = false; a.claim = false; a.prog = 0; });
    }
    if (Array.isArray(FEAT.daily)) {
      FEAT.daily.forEach(function (d) { d.done = false; d.claim = false; d.prog = 0; });
    }
    if (window.CK) window.CK.pets = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('spaceClicker_features_v1');
    } catch (err) {}
    saveState();
    var disc = document.getElementById('ck-disc');
    if (disc) {
      disc.classList.remove('ck-disc-strike');
      disc.style.removeProperty('--strike-glow');
    }
    document.querySelectorAll('.ck-orbit-pet, .ck-pet-trail, .ck-pet-impact-ring, .ck-pet-hit-text, .ck-pet-hit-spark').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    orbitElements = [];
    var petModalBox = document.getElementById('ck-pet-box');
    if (petModalBox) renderPetsModal(petModalBox);
    refreshPetVisuals();
  };

  window.__CK_FEAT = FEAT;
})();
