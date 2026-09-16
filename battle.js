/* ============================================================================
   battle.js — «Кликер-арена» v3. ДВА транспорта, авто-выбор.
   ----------------------------------------------------------------------------
   ПОЧЕМУ v3: App ID 90811467-... — приложение типа CHAT. Оно НЕ поддерживает
   Realtime-операции (JoinGame = op 226) -> "Unknown operation code 226".
   Поэтому батл умеет работать двумя способами:

     REALTIME — Photon.LoadBalancing (как было). Нужен App ID приложения типа
                Realtime. Впиши его в APP_ID_REALTIME — включится автоматически.
     CHAT     — Photon.Chat, канал battle_arena_v1. Работает на ТЕКУЩЕМ Chat
                App ID прямо сейчас. Master = игрок с минимальным ником.

   Интерфейс транспорта одинаковый, логика раунда и UI — общие.

   API: window.BattleRoom.open(nick) / .close()
   ========================================================================== */
(function () {
  'use strict';

  // ============================== КОНФИГ ====================================
  var APP_ID_CHAT     = '90811467-76f1-400a-b211-eb58e6d08c08'; // твой Chat App ID (работает)
  var APP_ID_REALTIME = '76effc60-4559-4235-972f-c4926fd3e883'; // Realtime-приложение
  var GIRL_IMG = ''; // пусто = встроенная SVG-девушка. Или 'girl.png' — своя картинка
  var REGION          = 'EU';
  var APP_VERSION     = '1.0';
  var CHANNEL         = 'battle_arena_v1'; // канал в Chat-режиме
  var ROOM_NAME       = 'battle_arena_v1'; // комната в Realtime-режиме

  var MAX_PLAYERS = 5;
  var ROUND_SEC   = 60;
  var RESULTS_SEC = 5;
  var BREAK_SEC   = 10;
  var VOTE_NEEDED = 1;   // кнопка «НАЧАТЬ СЕЙЧАС»: хватает одного голоса
  var WAIT_SEC    = 30;  // ожидание до АВТО-раунда (без голосования)
  var CLICK_LIMIT = 15;
  var COUNTDOWN   = 3;
  var STALE_MS    = 7000;  // Chat: сколько ждать без heartbeat, прежде чем считать ушедшим
  var HB_MS       = 2500;  // Chat: период heartbeat

  var NICK_KEY = 'spaceChatNick'; // общий ключ с chat.js
  var API_BASE = '';              // '' => лидерборд локальный

  var MODE = APP_ID_REALTIME ? 'realtime' : 'chat';

  var PH = { WAITING: 'WAITING', PLAYING: 'PLAYING', RESULTS: 'RESULTS', BREAK: 'BREAK' };

  // ============================== СОСТОЯНИЕ =================================
  var net = null;
  var joined = false, isMaster = false, nick = '', myId = '', myUid = '';
  var players = {};          // id(nick) -> { nick, score, seen }
  var st = { phase: PH.WAITING, endsAt: 0, round: 0, votes: 0, voters: {} };
  var clickStamps = [], masterClicks = {};
  var uiTimer = null, phaseTimer = null, countdownTimer = null, hbTimer = null, reapTimer = null;
  var root = null, el = {};
  var _h = { slots: '', scores: '', phase: '', clock: '', info: '' };
  var started = false, startedAt = 0, syncTick = 0;

  // ============================== УТИЛИТЫ ===================================
  function now() { return Date.now(); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function lsGet(k, d) { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } }
  function lsPut(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function aliveIds() {
    var out = [], k;
    if (MODE === 'realtime') {
      for (k in players) out.push(k); // в Realtime состав ведёт сам Photon
    } else {
      for (k in players) if (now() - (players[k].seen || 0) < STALE_MS) out.push(k);
    }
    out.sort();
    return out;
  }
  function myIsMaster() {
    if (MODE === 'realtime') {
      // Photon сам назначает мастера; сравниваем свой actorNr с мастерским
      return !!(net && net.actorNr > 0 && net.actorNr === net.roomMasterNr);
    }
    var ids = aliveIds();
    return ids.length > 0 && ids[0] === myId; // минимальный ник = master (детерминированно)
  }
  function resolveNick() {
    try { if (window.__chatApi && typeof window.__chatApi.nick === 'function') { var n = window.__chatApi.nick(); if (n) return String(n).slice(0, 16); } } catch (e) {}
    try { var s = sessionStorage.getItem(NICK_KEY); if (s) return String(s).slice(0, 16); } catch (e) {}
    return '';
  }
  function getProfile() { var all = lsGet('battleProfiles', '{}'); if (!all[nick]) all[nick] = { rounds: 0, best: 0, total: 0 }; return all[nick]; }
  function saveProfile(p) {
    var all = lsGet('battleProfiles', '{}'); all[nick] = p; lsPut('battleProfiles', all);
    if (API_BASE) { try { fetch(API_BASE + '/api/battle/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nick: nick, rounds: p.rounds, best: p.best, total: p.total }) }).catch(function () {}); } catch (e) {} }
  }
  function localLeaderboard() {
    var all = lsGet('battleProfiles', '{}'), arr = [], n;
    for (n in all) arr.push({ nick: n, total: all[n].total || 0, best: all[n].best || 0, rounds: all[n].rounds || 0 });
    arr.sort(function (a, b) { return b.total - a.total; });
    return arr.slice(0, 10);
  }
  function getLeaderboard(cb) {
    if (API_BASE) { fetch(API_BASE + '/api/battle/leaderboard').then(function (r) { return r.json(); }).then(function (j) { cb(j.top || []); }).catch(function () { cb(localLeaderboard()); }); }
    else cb(localLeaderboard());
  }
  function medal(i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1); }

  // ============================== CSS =======================================
  function injectCss() {
    if (document.getElementById('battle-css')) return;
    var s = document.createElement('style');
    s.id = 'battle-css';
    s.textContent = [
      /* -------- каркас -------- */
      '#battle-root{position:fixed;inset:0;z-index:9900;display:none;flex-direction:column;overflow:hidden;',
        'color:#e8f4ff;font-family:"Segoe UI",system-ui,-apple-system,"Noto Sans",sans-serif;',
        'background:#04060f}',
      '#battle-root.open{display:flex;animation:btIn .55s cubic-bezier(.16,.84,.34,1)}',
      '#battle-root,#battle-root *{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}',
      '.bt-empty{color:#4a6a7d;font-style:italic;letter-spacing:1px}',
      '.bt-av{text-shadow:0 1px 2px rgba(0,0,0,.25)}',
      '@keyframes btIn{from{opacity:0;transform:scale(1.03)}}',

      /* -------- слои фона -------- */
      '#bt-bg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}',
      '#bt-girl-layer{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;',
        'display:flex;align-items:flex-end;justify-content:flex-start;padding-left:2vw}',
      '#bt-girl{position:relative;height:93%;width:auto;display:flex;align-items:flex-end;justify-content:center;',
        'transform-origin:50% 97%;will-change:transform;',
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;',
        'transform:translateZ(0);-webkit-transform:translateZ(0);',
        'animation:btDance 12s ease-in-out infinite}',
      '#bt-girl-svg{height:100%;width:auto;display:block;overflow:visible;',
        'shape-rendering:geometricPrecision;image-rendering:auto;',
        'will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;',
        'filter:drop-shadow(0 2px 10px rgba(255,255,255,.20)) drop-shadow(0 0 20px rgba(190,160,255,.78)) drop-shadow(0 0 50px rgba(120,90,255,.46)) drop-shadow(0 0 120px rgba(0,210,255,.34))}',
      '#bt-girl.has-img{width:min(56vw,520px);background-repeat:no-repeat;',
        'background-position:center bottom;background-size:contain}',
      '#bt-girl.has-img #bt-girl-svg{display:none}',
      '.gg-rim{fill:none;stroke:url(#gRim);stroke-linecap:round}',
      '#g-tail-l,#g-tail-r,#g-arm-l,#g-arm-r,#g-ahoge,#g-skirt{',
        'transform-box:fill-box;will-change:transform;backface-visibility:hidden}',
      '#g-halo{transform-box:fill-box;transform-origin:50% 50%;animation:btSpin 28s linear infinite}',
      '#g-tail-l{transform-origin:86% 4%;animation:btSwayL 5.2s ease-in-out infinite}',
      '#g-tail-r{transform-origin:14% 4%;animation:btSwayR 5.7s ease-in-out infinite}',
      '#g-arm-l{transform-origin:74% 3%;animation:btArmL 6.2s ease-in-out infinite}',
      '#g-arm-r{transform-origin:26% 3%;animation:btArmR 5.6s ease-in-out infinite}',
      '#g-ahoge{transform-origin:50% 100%;animation:btAhoge 3.4s ease-in-out infinite}',
      '#g-skirt{transform-origin:50% 0%;animation:btSkirt 4.6s ease-in-out infinite}',
      '#g-spark1{animation:btSparkle 5.0s ease-in-out infinite}',
      '#g-spark2{animation:btSparkle 5.0s ease-in-out 1.7s infinite}',
      '#g-spark3{animation:btSparkle 5.0s ease-in-out 3.2s infinite}',
      '@keyframes btSparkle{0%,100%{opacity:.15}50%{opacity:.95}}',
      '@keyframes btDance{',
        '0%{transform:translateZ(0) translateY(0) rotate(-1.3deg) scale(1)}',
        '22%{transform:translateZ(0) translateY(-9px) rotate(.9deg) scale(1.013)}',
        '46%{transform:translateZ(0) translateY(-3px) rotate(-.5deg) scale(1.004)}',
        '68%{transform:translateZ(0) translateY(-12px) rotate(1.5deg) scale(1.016)}',
        '86%{transform:translateZ(0) translateY(-4px) rotate(.3deg) scale(1.006)}',
        '100%{transform:translateZ(0) translateY(0) rotate(-1.3deg) scale(1)}}',
      '@keyframes btSwayL{0%,100%{transform:rotate(-2.2deg)}50%{transform:rotate(2.8deg)}}',
      '@keyframes btSwayR{0%,100%{transform:rotate(2deg)}50%{transform:rotate(-2.6deg)}}',
      '@keyframes btArmL{0%,100%{transform:rotate(2deg)}50%{transform:rotate(-4.6deg)}}',
      '@keyframes btArmR{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(4.6deg)}}',
      '@keyframes btAhoge{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}}',
      '@keyframes btSkirt{0%,100%{transform:rotate(-.7deg) scaleY(1)}50%{transform:rotate(.9deg) scaleY(1.012)}}',
        '0%{transform:translateY(0) rotate(-1.4deg) scale(1)}',
        '22%{transform:translateY(-8px) rotate(1deg) scale(1.012)}',
        '46%{transform:translateY(-3px) rotate(-.5deg) scale(1.004)}',
        '68%{transform:translateY(-11px) rotate(1.6deg) scale(1.015)}',
        '86%{transform:translateY(-4px) rotate(.3deg) scale(1.006)}',
        '100%{transform:translateY(0) rotate(-1.4deg) scale(1)}}',
      '@keyframes btDance{',
        '0%{transform:translateY(0) rotate(-1.6deg) scale(1)}',
        '22%{transform:translateY(-9px) rotate(1.1deg) scale(1.012)}',
        '46%{transform:translateY(-3px) rotate(-.6deg) scale(1.004)}',
        '68%{transform:translateY(-12px) rotate(1.8deg) scale(1.016)}',
        '86%{transform:translateY(-4px) rotate(.3deg) scale(1.006)}',
        '100%{transform:translateY(0) rotate(-1.6deg) scale(1)}}',
      /* затемнение + виньетка: гарантируют читаемость интерфейса поверх фона */
      '#bt-vignette{position:absolute;inset:0;z-index:4;pointer-events:none;',
        'background:radial-gradient(ellipse 128% 96% at 50% 46%,transparent 46%,rgba(2,4,12,.34) 80%,rgba(2,4,12,.7) 100%),',
          'linear-gradient(180deg,rgba(2,4,12,.5) 0%,transparent 22%,transparent 72%,rgba(2,4,12,.66) 100%)}',
      '#bt-scan{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:.14;',
        'background:repeating-linear-gradient(180deg,rgba(255,255,255,.05) 0 1px,transparent 1px 3px);',
        'animation:btScan 9s linear infinite}',
      '@keyframes btScan{to{background-position:0 60px}}',
      /* аврора поверх фона, под интерфейсом */
      '#battle-root::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:2;',
        'background:radial-gradient(58% 38% at 18% 6%,rgba(0,229,255,.13),transparent 62%),',
          'radial-gradient(48% 36% at 86% 12%,rgba(139,92,255,.16),transparent 62%),',
          'radial-gradient(66% 46% at 50% 114%,rgba(255,92,176,.11),transparent 64%);',
        'animation:btAurora 17s ease-in-out infinite alternate}',
      '@keyframes btAurora{from{opacity:.62;transform:scale(1)}to{opacity:1;transform:scale(1.08)}}',
      /* интерфейс — выше всех слоёв фона */
      '#battle-root>.bt-top,#battle-root>.bt-slots,#battle-root>.bt-body,#battle-root>.bt-bottom{position:relative;z-index:6}',

      /* -------- общие приёмы -------- */
      '@keyframes btUp{from{opacity:0;transform:translateY(14px)}}',
      '@keyframes btFadeIn{from{opacity:0}}',
      '@keyframes btGlow{50%{box-shadow:0 0 26px rgba(0,229,255,.55)}}',
      '@keyframes btSpin{to{transform:rotate(360deg)}}',

      /* -------- шапка -------- */
      '.bt-top{display:flex;align-items:center;gap:12px;padding:14px 22px;',
        'background:linear-gradient(180deg,rgba(10,18,38,.72),rgba(6,10,24,.42));',
        'backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);',
        'border-bottom:1px solid rgba(0,229,255,.22);box-shadow:0 8px 34px rgba(0,0,0,.5);',
        'animation:btUp .5s cubic-bezier(.16,.84,.34,1) both}',
      '.bt-title{flex:1;font-size:17px;letter-spacing:6px;font-weight:800;',
        'background:linear-gradient(92deg,#d8e6ff,#c8d6f4 52%,#c0cee8);',
        '-webkit-background-clip:text;background-clip:text;color:transparent;',
        'filter:drop-shadow(0 0 14px rgba(0,229,255,.42))}',
      '.bt-phase{font-size:10.5px;letter-spacing:3.5px;padding:7px 16px;border-radius:999px;',
        'color:#b6f2ff;border:1px solid rgba(0,229,255,.45);background:rgba(0,229,255,.09);',
        'box-shadow:0 0 20px rgba(0,229,255,.22) inset,0 0 14px rgba(0,229,255,.16);',
        'transition:color .3s,border-color .3s,box-shadow .3s}',
      '.bt-exit{background:rgba(0,229,255,.07);border:1px solid rgba(0,229,255,.34);color:#c7f0ff;',
        'padding:9px 18px;border-radius:11px;cursor:pointer;letter-spacing:1.6px;font-size:12px;',
        'transition:transform .18s cubic-bezier(.2,.9,.3,1.3),border-color .2s,box-shadow .25s,background .2s}',
      '.bt-exit:hover{border-color:#d8e6ff;background:rgba(0,229,255,.14);color:#fff;',
        'box-shadow:0 0 22px rgba(0,229,255,.5);transform:translateY(-2px)}',
      '.bt-exit:active{transform:translateY(0) scale(.95)}',

      /* -------- слоты игроков -------- */
      '.bt-slots{display:flex;gap:12px;padding:16px 22px}',
      '.bt-slot{flex:1;min-width:0;height:60px;border-radius:16px;display:flex;align-items:center;',
        'justify-content:center;gap:9px;font-size:13px;color:#5f7f94;padding:0 12px;overflow:hidden;',
        'border:1px dashed rgba(0,229,255,.2);background:rgba(8,16,34,.36);',
        'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
        'transition:transform .25s cubic-bezier(.2,.9,.3,1.3),border-color .25s,box-shadow .3s,background .3s;',
        'animation:btUp .5s cubic-bezier(.16,.84,.34,1) both}',
      '.bt-slot:nth-child(1){animation-delay:.03s}.bt-slot:nth-child(2){animation-delay:.08s}',
      '.bt-slot:nth-child(3){animation-delay:.13s}.bt-slot:nth-child(4){animation-delay:.18s}',
      '.bt-slot:nth-child(5){animation-delay:.23s}',
      '.bt-slot:hover{transform:translateY(-2px)}',
      '.bt-slot.on{color:#eafcff;border-style:solid;border-color:rgba(139,92,255,.55);',
        'background:linear-gradient(158deg,rgba(139,92,255,.2),rgba(0,229,255,.07));',
        'box-shadow:0 0 24px rgba(139,92,255,.28),0 0 20px rgba(0,229,255,.12) inset}',
      '.bt-slot.me{border-color:#d8e6ff;box-shadow:0 0 26px rgba(0,229,255,.5),0 0 22px rgba(0,229,255,.2) inset}',
      '.bt-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
        'font-size:12px;font-weight:800;color:#04121c;flex:0 0 auto;letter-spacing:.5px;',
        'background:linear-gradient(135deg,#d8e6ff,#c8d6f4);box-shadow:0 0 14px rgba(0,229,255,.5)}',
      '.bt-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',

      /* -------- тело -------- */
      '.bt-body{flex:1;display:flex;min-height:0}',
      '.bt-stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}',
      '.bt-clockwrap{position:relative;width:216px;height:216px;display:flex;align-items:center;justify-content:center;',
        'animation:btUp .6s cubic-bezier(.16,.84,.34,1) both}',
      '.bt-ring{position:absolute;inset:0;width:216px;height:216px;transform:rotate(-90deg);',
        'filter:drop-shadow(0 0 14px rgba(0,229,255,.35))}',
      '.bt-ring-bg{fill:none;stroke:rgba(0,229,255,.1);stroke-width:3}',
      '.bt-ring-fg{fill:none;stroke:url(#btgrad);stroke:#d8e6ff;stroke-width:4;stroke-linecap:round;',
        'transition:stroke-dashoffset .35s linear,stroke .3s;filter:drop-shadow(0 0 9px rgba(0,229,255,.95))}',
      '.bt-ring-fg.low{stroke:#ff5b7a;filter:drop-shadow(0 0 11px rgba(255,91,122,.95))}',
      '.bt-clock{font-size:54px;font-weight:200;letter-spacing:3px;color:#f2fdff;font-variant-numeric:tabular-nums;',
        'text-shadow:0 0 30px rgba(0,229,255,.6),0 0 60px rgba(139,92,255,.35)}',
      '.bt-clock.low{color:#ff90a6;text-shadow:0 0 30px rgba(255,91,122,.75)}',
      '.bt-info{font-size:13px;color:#93b7c9;margin-top:16px;letter-spacing:1.8px;min-height:18px;',
        'text-shadow:0 2px 12px rgba(0,0,0,.8);transition:color .3s}',

      /* -------- цель -------- */
      '#bt-target{margin-top:26px;width:196px;height:196px;border-radius:50%;cursor:pointer;user-select:none;',
        'position:relative;display:flex;align-items:center;justify-content:center;',
        'font-size:24px;font-weight:900;color:#04121c;letter-spacing:3px;',
        'background:radial-gradient(circle at 34% 27%,#e4eeff 0%,#00c2f5 40%,#041c2c 100%);',
        'box-shadow:0 0 52px rgba(0,229,255,.65),0 0 110px rgba(139,92,255,.4),inset 0 0 44px rgba(255,255,255,.3);',
        'transition:transform .07s ease,box-shadow .3s,filter .3s}',
      '#bt-target::before{content:"";position:absolute;inset:-14px;border-radius:50%;',
        'background:conic-gradient(from 0deg,transparent,rgba(0,229,255,.5),transparent 40%,rgba(255,92,176,.45),transparent 78%);',
        'filter:blur(8px);opacity:.65;animation:btSpin 7s linear infinite;pointer-events:none}',
      '#bt-target::after{content:"";position:absolute;inset:-11px;border-radius:50%;',
        'border:1px solid rgba(0,229,255,.4);animation:btPulse 2.3s ease-out infinite;pointer-events:none}',
      '@keyframes btPulse{0%{transform:scale(.93);opacity:.85}70%{transform:scale(1.14);opacity:0}100%{opacity:0}}',
      '#bt-target:active,#bt-target.press{transform:scale(.89);box-shadow:0 0 78px rgba(0,229,255,.95)}',
      '#bt-target.off{filter:grayscale(1) brightness(.4);cursor:not-allowed;box-shadow:none}',
      '#bt-target.off::after,#bt-target.off::before{display:none}',
      '.bt-fly{position:absolute;font-size:21px;font-weight:900;color:#8dffb8;pointer-events:none;',
        'text-shadow:0 0 14px rgba(125,255,176,.95);animation:btFly 1s cubic-bezier(.2,.7,.3,1) forwards}',
      '@keyframes btFly{to{transform:translateY(-104px) scale(1.4);opacity:0}}',
      '.bt-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#8dffb8;',
        'box-shadow:0 0 12px #8dffb8;pointer-events:none;animation:btSpark .6s ease-out forwards}',
      '@keyframes btSpark{to{transform:translate(var(--dx),var(--dy)) scale(.15);opacity:0}}',

      /* -------- правая колонка -------- */
      '.bt-side{width:290px;display:flex;flex-direction:column;min-height:0;padding:16px;',
        'border-left:1px solid rgba(0,229,255,.2);',
        'background:linear-gradient(180deg,rgba(10,18,38,.6),rgba(5,9,22,.5));',
        'backdrop-filter:blur(16px) saturate(1.25);-webkit-backdrop-filter:blur(16px) saturate(1.25);',
        'box-shadow:-10px 0 40px rgba(0,0,0,.45);',
        'animation:btFadeIn .7s ease both}',
      '#bt-scores{max-height:136px;overflow-y:auto;margin-bottom:4px}',
      '#bt-board{max-height:112px;overflow-y:auto;margin-bottom:4px}',
      '.bt-side h3{font-size:10px;letter-spacing:3.5px;color:#5f7f94;margin:0 0 11px;font-weight:700;',
        'text-transform:uppercase}',
      '.bt-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:11px;margin-bottom:6px;',
        'font-size:13.5px;background:rgba(0,229,255,.05);border:1px solid transparent;',
        'transition:transform .22s cubic-bezier(.2,.9,.3,1.3),background .25s,border-color .25s,box-shadow .25s}',
      '.bt-row:hover{transform:translateX(3px);background:rgba(0,229,255,.1)}',
      '.bt-row.me{background:rgba(0,229,255,.16);border-color:rgba(0,229,255,.42);',
        'box-shadow:0 0 18px rgba(0,229,255,.18)}',
      '.bt-row .r{width:22px;text-align:center;color:#9fe6ff;font-weight:800}',
      '.bt-row .n{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.bt-row .c{font-weight:900;color:#fff}',
      '.bt-row.top{background:linear-gradient(90deg,rgba(255,215,0,.2),rgba(0,229,255,.06));',
        'border-color:rgba(255,215,0,.5);box-shadow:0 0 20px rgba(255,200,60,.22)}',
      '.bt-row.top .c{color:#ffe45b;text-shadow:0 0 12px rgba(255,220,80,.6)}',
      '.bt-lb-head{display:flex;justify-content:space-between;font-size:9.5px;letter-spacing:1.2px;',
        'color:#4d6b7d;padding:0 4px 6px;text-transform:uppercase}',
      '.bt-dim{color:#5f7f94;font-style:normal;font-size:11px}',


      /* -------- чат -------- */
      '.bt-chat{flex:1;min-height:110px;overflow-y:auto;background:rgba(2,6,16,.5);',
        'border:1px solid rgba(0,229,255,.22);border-radius:13px;padding:10px;font-size:12.5px;line-height:1.5;',
        'scrollbar-width:thin;scrollbar-color:rgba(0,229,255,.4) transparent}',
      '.bt-chat::-webkit-scrollbar{width:6px}',
      '.bt-chat::-webkit-scrollbar-thumb{background:rgba(0,229,255,.35);border-radius:3px}',
      '#bt-scores::-webkit-scrollbar,#bt-board::-webkit-scrollbar{width:6px}',
      '#bt-scores::-webkit-scrollbar-thumb,#bt-board::-webkit-scrollbar-thumb{background:rgba(0,229,255,.3);border-radius:3px}',
      '.bt-chat-msg{margin-bottom:6px;word-wrap:break-word;color:#b9d6e2;animation:btUp .3s ease both}',
      '.bt-chat-msg .t{font-size:10px;color:#4d6b7d;margin-right:5px}',
      '.bt-chat-msg b{color:#ffffff}',
      '.bt-chat-msg.me b{color:#8dffb8}',
      '.bt-chat-sys{color:#7fa6b8;font-style:italic;font-size:11.5px;text-align:center;margin:7px 0;opacity:.85}',
      '.bt-online{display:inline-block;min-width:16px;padding:1px 7px;margin-left:6px;border-radius:999px;',
        'font-size:10px;background:rgba(0,229,255,.16);color:#ffffff;border:1px solid rgba(0,229,255,.32)}',
      '.bt-chat-in{display:flex;gap:6px;margin-top:9px}',
      '#bt-chat-input{flex:1;min-width:0;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.3);',
        'border-radius:9px;padding:9px 11px;color:#eafcff;font-size:12.5px;outline:none;transition:.2s}',
      '#bt-chat-input:focus{border-color:#d8e6ff;box-shadow:0 0 16px rgba(0,229,255,.35);background:rgba(0,229,255,.1)}',
      '#bt-chat-send{background:linear-gradient(135deg,#d8e6ff,#c8d6f4);border:0;border-radius:9px;',
        'color:#04121c;font-weight:900;padding:0 13px;cursor:pointer;transition:transform .18s,filter .2s}',
      '#bt-chat-send:hover{filter:brightness(1.14)}',
      '#bt-chat-send:active{transform:scale(.92)}',
      '#bt-chat-send.badge{animation:btPulseBtn 1s ease infinite}',
      '@keyframes btPulseBtn{50%{box-shadow:0 0 16px rgba(0,229,255,.95)}}',

      /* -------- нижняя панель -------- */
      '.bt-bottom{display:flex;gap:12px;padding:14px 22px;',
        'background:linear-gradient(0deg,rgba(10,18,38,.72),rgba(6,10,24,.42));',
        'backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);',
        'border-top:1px solid rgba(0,229,255,.2);box-shadow:0 -8px 34px rgba(0,0,0,.5);',
        'animation:btUp .5s cubic-bezier(.16,.84,.34,1) both}',
      '.bt-btn{flex:1;padding:14px;border-radius:13px;cursor:pointer;letter-spacing:1.8px;font-size:13px;',
        'color:#dff3ff;border:1px solid rgba(0,229,255,.4);',
        'background:linear-gradient(158deg,rgba(0,229,255,.14),rgba(139,92,255,.1));',
        'transition:transform .18s cubic-bezier(.2,.9,.3,1.3),border-color .2s,box-shadow .25s,filter .2s}',
      '.bt-btn:hover{border-color:#d8e6ff;box-shadow:0 0 24px rgba(0,229,255,.5);transform:translateY(-2px)}',
      '.bt-btn:active{transform:translateY(0) scale(.975)}',
      '.bt-btn:disabled{opacity:.38;cursor:not-allowed;box-shadow:none;transform:none;filter:grayscale(.5)}',
      '.bt-btn-acc{background:linear-gradient(135deg,#d8e6ff,#c8d6f4 60%,#c0cee8)!important;',
        'color:#04121c!important;font-weight:900!important;border:0!important;letter-spacing:2.2px;',
        'box-shadow:0 0 30px rgba(0,229,255,.45),0 0 60px rgba(169,124,255,.25)!important}',
      '.bt-btn-acc:hover{filter:brightness(1.1);box-shadow:0 0 42px rgba(0,229,255,.7)!important}',

      /* -------- модалки -------- */
      '.bt-modal{position:absolute;inset:0;z-index:40;pointer-events:auto;display:flex;align-items:center;justify-content:center;',
        'background:rgba(2,5,12,.78);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);',
        'animation:btFadeIn .3s ease both}',
      '.bt-modal-in{position:relative;background:linear-gradient(158deg,rgba(16,24,54,.96),rgba(5,8,20,.98));',
        'border:1px solid rgba(0,229,255,.38);border-radius:20px;padding:30px 36px;',
        'min-width:320px;max-width:min(580px,92vw);',
        'box-shadow:0 30px 90px rgba(0,0,0,.8),0 0 70px rgba(0,229,255,.14);',
        'animation:btUp .42s cubic-bezier(.16,.84,.34,1) both}',
      '.bt-modal-in h2{margin:0 0 16px;font-size:18px;letter-spacing:3.5px;color:#9fe6ff;',
        'text-shadow:0 0 20px rgba(0,229,255,.45)}',
      '.bt-modal-in p{margin:8px 0;font-size:14px;color:#b9d6e2}',
      '.bt-modal-in b{color:#fff}',
      '.bt-fade{animation:btFadeIn .3s ease both}',
      '#bt-modal-host{position:absolute;inset:0;z-index:40;pointer-events:none}',
      /* -------- профиль -------- */
      '.bt-prof-head{display:flex;align-items:center;gap:16px;margin-bottom:18px;padding-right:34px}',
      '.bt-prof-av{width:62px;height:62px;border-radius:20px;flex:none;display:flex;align-items:center;justify-content:center;',
        'font-size:23px;font-weight:900;color:#04121c;letter-spacing:1px;',
        'background:linear-gradient(135deg,#d8e6ff,#c8d6f4 60%,#c0cee8);box-shadow:0 0 26px rgba(0,229,255,.45)}',
      '.bt-prof-name{font-size:19px;font-weight:800;color:#fff;letter-spacing:1px;word-break:break-word}',
      '.bt-prof-sub{font-size:10px;color:#5f7f94;letter-spacing:2px;margin-top:4px}',
      '.bt-prof{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}',
      '.bt-prof-cell{background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.22);border-radius:14px;padding:13px 8px;text-align:center;transition:transform .18s,border-color .18s}',
      '.bt-prof-cell:hover{transform:translateY(-3px);border-color:rgba(0,229,255,.5)}',
      '.bt-prof-cell b{display:block;font-size:20px;color:#fff;text-shadow:0 0 16px rgba(0,229,255,.45)}',
      '.bt-prof-cell span{display:block;margin-top:5px;font-size:9px;letter-spacing:1.2px;color:#6f92a6;text-transform:uppercase}',
      '.bt-prof-hint{margin:16px 0 0;text-align:center;font-size:11px;color:#5f7f94;letter-spacing:.6px}',
      '.bt-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,229,255,.35);',
        'background:rgba(4,10,22,.8);color:#9fe6ff;font-size:16px;line-height:1;cursor:pointer;transition:transform .2s,background .2s;font-family:inherit}',
      '.bt-x:hover{transform:rotate(90deg);background:rgba(0,229,255,.18)}',
      '.bt-count{font-size:150px;font-weight:900;color:#fff;',
        'text-shadow:0 0 54px rgba(0,229,255,.95),0 0 110px rgba(169,124,255,.7);animation:btCount .9s ease}',
      '@keyframes btCount{from{transform:scale(2.2);opacity:0}}',

      /* -------- регистрация -------- */
      '#bt-register{position:absolute;inset:0;z-index:9;display:none;align-items:center;justify-content:center;',
        'background:rgba(2,5,12,.9);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
      '#bt-register.on{display:flex;animation:btFadeIn .3s ease both}',
      '.bt-reg-box{background:linear-gradient(158deg,rgba(16,24,54,.97),rgba(5,8,20,.98));',
        'border:1px solid rgba(0,229,255,.42);border-radius:22px;padding:36px 40px;',
        'width:min(430px,92vw);text-align:center;',
        'box-shadow:0 34px 100px rgba(0,0,0,.85),0 0 80px rgba(0,229,255,.15);',
        'animation:btUp .45s cubic-bezier(.16,.84,.34,1) both}',
      '.bt-reg-box h2{margin:0 0 8px;font-size:20px;letter-spacing:4px;color:#9fe6ff;',
        'text-shadow:0 0 20px rgba(0,229,255,.45)}',
      '.bt-reg-box p{margin:0 0 20px;font-size:13px;color:#7fa6b8;line-height:1.55}',
      '#bt-reg-input{width:100%;box-sizing:border-box;background:rgba(0,229,255,.06);',
        'border:1px solid rgba(0,229,255,.35);border-radius:13px;padding:15px 17px;color:#eafcff;',
        'font-size:15px;outline:none;transition:.2s}',
      '#bt-reg-input:focus{border-color:#d8e6ff;box-shadow:0 0 22px rgba(0,229,255,.4);background:rgba(0,229,255,.1)}',
      '#bt-reg-btn{margin-top:16px;width:100%;padding:15px;border-radius:13px;cursor:pointer;border:0;',
        'color:#04121c;font-weight:900;letter-spacing:2.4px;font-size:14px;',
        'background:linear-gradient(135deg,#d8e6ff,#c8d6f4 60%,#c0cee8);',
        'box-shadow:0 0 30px rgba(0,229,255,.45);transition:transform .18s,filter .2s}',
      '#bt-reg-btn:hover{filter:brightness(1.12);transform:translateY(-2px)}',
      '#bt-reg-btn:active{transform:translateY(0) scale(.975)}',
      '.bt-reg-err{margin-top:12px;font-size:12px;color:#ff8098;min-height:16px}',

      /* -------- мобилка -------- */
      /* -------- мобилка: корень скроллится, всё видно -------- */
      '@media (max-width:860px){',
        '#battle-root{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}',
        '.bt-top{position:sticky;top:0;z-index:9;padding:8px 10px;gap:6px;',
          'background:linear-gradient(180deg,rgba(4,6,15,.96),rgba(4,6,15,.72) 70%,transparent)}',
        '.bt-title{flex:1;font-size:10px;letter-spacing:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.bt-phase{font-size:9px;letter-spacing:1.4px;padding:3px 7px}',
        '.bt-exit{padding:7px 10px;font-size:10px;letter-spacing:1px}',
        '.bt-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:8px 10px}',
        '.bt-slot{flex:none;height:auto;min-height:44px;padding:6px 8px;border-radius:11px;font-size:11px;gap:6px}',
        '.bt-slot .bt-av{font-size:16px}',
        '.bt-body{flex:none;flex-direction:column;overflow:visible;min-height:0}',
        '.bt-stage{flex:none;padding:12px 8px 8px;gap:2px}',
        '.bt-clockwrap{width:124px;height:124px}',
        '.bt-ring{width:124px;height:124px}',
        '.bt-clock{font-size:31px}',
        '#bt-target{margin-top:12px;width:126px;height:126px;font-size:17px}',
        '.bt-info{font-size:11px;margin-top:6px}',
        '.bt-side{width:auto;max-height:none;border-left:0;border-top:1px solid rgba(0,229,255,.2);padding:10px 10px 4px}',
        '.bt-prof{grid-template-columns:repeat(2,1fr)}',
        '.bt-side h3{font-size:9px;letter-spacing:2px;margin:0 0 6px}',
        '#bt-scores,#bt-board{max-height:none}',
        '.bt-chat{min-height:130px;max-height:32vh}',
        '.bt-chat-in{margin-top:7px}',
        '.bt-chat-in input{padding:11px 12px;font-size:13px}',
        '.bt-chat-in button{width:44px}',
        '.bt-bottom{position:sticky;bottom:0;z-index:9;padding:10px;gap:8px;',
          'background:linear-gradient(0deg,rgba(4,6,15,.97),rgba(4,6,15,.78) 70%,transparent)}',
        '.bt-btn{padding:13px 8px;font-size:12px;letter-spacing:1.2px}',
        '#bt-girl-layer{padding-left:0;justify-content:center}',
        '#bt-girl{opacity:.50;min-width:0;height:58%}',
        '.bt-modal-box,.bt-reg-box{width:92vw;max-width:92vw;padding:22px 16px}',
        '#bt-reg-input{font-size:15px}',
      '}',
      '@media (max-width:380px){',
        '.bt-title{display:none}',
        '.bt-clockwrap{width:104px;height:104px}.bt-ring{width:104px;height:104px}',
        '.bt-clock{font-size:26px}#bt-target{width:108px;height:108px;font-size:15px}',
        '.bt-slots{grid-template-columns:repeat(2,1fr)}',
      '}',
      /* уважаем системное «меньше движения» */
      '@media (prefers-reduced-motion:reduce){',
        '*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  // ============================== UI ========================================
  function buildUi() {
    if (root) return;
    injectCss();
    root = document.createElement('div');
    root.id = 'battle-root';
    root.innerHTML = [
      '<canvas id="bt-bg"></canvas>',
      '<div id="bt-girl-layer"><div id="bt-girl">',
        '<svg id="bt-girl-svg" viewBox="0 0 480 1060" preserveAspectRatio="xMidYMax meet" shape-rendering="geometricPrecision">',
'<defs>',
'<linearGradient id="gHair" x1=".16" y1="0" x2=".86" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="18%" stop-color="#eef4ff"/><stop offset="48%" stop-color="#c9d8f8"/><stop offset="76%" stop-color="#93a8de"/><stop offset="100%" stop-color="#6d80b8"/></linearGradient>',
'<linearGradient id="gHairB" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0%" stop-color="#e3ecff"/><stop offset="45%" stop-color="#a9bce8"/><stop offset="100%" stop-color="#66759f"/></linearGradient>',
'<linearGradient id="gHair2" x1=".1" y1="0" x2=".9" y2=".9"><stop offset="0%" stop-color="#ffffff"/><stop offset="28%" stop-color="#dde8ff"/><stop offset="64%" stop-color="#a58cf2"/><stop offset="100%" stop-color="#7a52e0"/></linearGradient>',
'<linearGradient id="gHair3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/><stop offset="60%" stop-color="#ffffff" stop-opacity=".3"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>',
'<linearGradient id="gSkin" x1=".3" y1="0" x2=".72" y2="1"><stop offset="0%" stop-color="#fffbf8"/><stop offset="42%" stop-color="#ffe9da"/><stop offset="100%" stop-color="#eec4a8"/></linearGradient>',
'<linearGradient id="gTop" x1=".12" y1="0" x2=".5" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="36%" stop-color="#eef4ff"/><stop offset="74%" stop-color="#c8d8f6"/><stop offset="100%" stop-color="#a2b3dc"/></linearGradient>',
'<linearGradient id="gCollar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#dbe6ff"/></linearGradient>',
'<linearGradient id="gSkirt" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0%" stop-color="#9aaddc"/><stop offset="40%" stop-color="#60739f"/><stop offset="100%" stop-color="#39456e"/></linearGradient>',
'<linearGradient id="gStock" x1="0" y1="0" x2=".3" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="26%" stop-color="#eaf1ff"/><stop offset="100%" stop-color="#b6c4e4"/></linearGradient>',
'<linearGradient id="gShoe" x1="0" y1="0" x2=".3" y2="1"><stop offset="0%" stop-color="#c9d8f8"/><stop offset="46%" stop-color="#8092c4"/><stop offset="100%" stop-color="#445078"/></linearGradient>',
'<linearGradient id="gBow" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#bda4ff"/><stop offset="48%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#5b34c8"/></linearGradient>',
'<linearGradient id="gLace" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity=".92"/><stop offset="50%" stop-color="#cfe4ff" stop-opacity=".75"/><stop offset="100%" stop-color="#ffffff" stop-opacity=".92"/></linearGradient>',
'<radialGradient id="gIris" cx=".44" cy=".28" r=".84"><stop offset="0%" stop-color="#ffffff"/><stop offset="20%" stop-color="#b6ecff"/><stop offset="50%" stop-color="#46a4e6"/><stop offset="80%" stop-color="#1f5ba8"/><stop offset="100%" stop-color="#061c38"/></radialGradient>',
'<radialGradient id="gIrisLo" cx=".5" cy=".84" r=".68"><stop offset="0%" stop-color="#93f0ff" stop-opacity=".95"/><stop offset="100%" stop-color="#93f0ff" stop-opacity="0"/></radialGradient>',
'<radialGradient id="gBlush" cx=".5" cy=".5" r=".5"><stop offset="0%" stop-color="#ff8fae" stop-opacity=".55"/><stop offset="100%" stop-color="#ff8fae" stop-opacity="0"/></radialGradient>',
'<linearGradient id="gRim" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#d8e6ff"/><stop offset="50%" stop-color="#ffffff"/><stop offset="100%" stop-color="#b7c8ea"/></linearGradient>',
'<radialGradient id="gAura" cx=".5" cy=".46" r=".56"><stop offset="0%" stop-color="#e9f2ff" stop-opacity=".30"/><stop offset="44%" stop-color="#8b5cf6" stop-opacity=".14"/><stop offset="76%" stop-color="#00e5ff" stop-opacity=".09"/><stop offset="100%" stop-color="#000000" stop-opacity="0"/></radialGradient>',
'<linearGradient id="gWing" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity=".34"/><stop offset="55%" stop-color="#a9c8ff" stop-opacity=".14"/><stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient>',
'<filter id="gGlow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
'<filter id="gSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>',
'</defs>',
'<ellipse cx="240" cy="560" rx="232" ry="460" fill="url(#gAura)"/>',
'<g opacity=".45" fill="url(#gWing)">',
'<path d="M162,360 C82,424 46,552 70,694 C120,604 148,508 168,424 Z"/>',
'<path d="M318,360 C398,424 434,552 410,694 C360,604 332,508 312,424 Z"/>',
'</g>',
'<g id="g-halo" opacity=".44">',
'<circle cx="240" cy="322" r="252" fill="none" stroke="url(#gRim)" stroke-width="1.2" opacity=".30" stroke-dasharray="18 28"/>',
'<circle cx="240" cy="322" r="206" fill="none" stroke="#e3ecff" stroke-width=".9" opacity=".18" stroke-dasharray="6 22"/>',
'</g>',
'<g id="g-spark1" opacity=".85"><circle cx="82" cy="238" r="3.8" fill="#ffffff" filter="url(#gGlow)"/></g>',
'<g id="g-spark2" opacity=".85"><circle cx="404" cy="330" r="3.2" fill="#eaf2ff" filter="url(#gGlow)"/></g>',
'<g id="g-spark3" opacity=".85"><circle cx="108" cy="618" r="2.8" fill="#dbe6ff" filter="url(#gGlow)"/></g>',
'<circle cx="372" cy="742" r="2.4" fill="#c9b6ff" opacity=".7" filter="url(#gGlow)"/>',
'<circle cx="196" cy="846" r="2.2" fill="#9fe6ff" opacity=".7" filter="url(#gGlow)"/>',
/* ---------- задняя масса волос ---------- */
'<path d="M240,152 C150,152 106,222 114,306 C118,358 108,428 96,528 C82,642 78,752 94,856 C104,916 124,958 150,986 L200,924 C170,884 154,818 156,740 C158,632 176,536 184,458 L296,458 C304,536 322,632 324,740 C326,818 310,884 280,924 L330,986 C356,958 376,916 386,856 C402,752 398,642 384,528 C372,428 362,358 366,306 C374,222 330,152 240,152 Z" fill="url(#gHairB)"/>',
/* ---------- ноги ---------- */
'<path d="M208,704 C202,782 200,856 204,928 L242,928 C244,856 244,782 242,704 Z" fill="url(#gSkin)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.4"/>',
'<path d="M238,704 C236,782 236,856 238,928 L276,928 C280,856 278,782 272,704 Z" fill="url(#gSkin)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.4"/>',
'<path d="M204,790 C201,850 200,896 204,934 L242,934 C243,896 243,850 242,790 Z" fill="url(#gStock)"/>',
'<path d="M238,790 C237,850 237,896 238,934 L276,934 C279,896 278,850 274,790 Z" fill="url(#gStock)"/>',
'<path d="M202,790 L244,790" stroke="url(#gLace)" stroke-width="6" stroke-linecap="round"/>',
'<path d="M236,790 L278,790" stroke="url(#gLace)" stroke-width="6" stroke-linecap="round"/>',
'<circle cx="223" cy="793" r="3.4" fill="#8b5cf6"/><circle cx="257" cy="793" r="3.4" fill="#8b5cf6"/>',
'<path d="M212,868 q16,10 32,0 M244,868 q16,10 32,0" stroke="#c9d8f4" stroke-width="1.6" fill="none" opacity=".5"/>',
/* ---------- обувь ---------- */
'<path d="M202,924 L246,924 L248,994 C248,1010 240,1019 224,1020 L188,1020 C172,1019 165,1009 170,994 Z" fill="url(#gShoe)" stroke="#2e3a66" stroke-opacity=".25" stroke-width="1.6" stroke-linejoin="round"/>',
'<path d="M234,924 L278,924 L290,994 C294,1009 287,1019 271,1020 L236,1020 C220,1019 212,1010 212,994 Z" fill="url(#gShoe)" stroke="#2e3a66" stroke-opacity=".25" stroke-width="1.6" stroke-linejoin="round"/>',
'<path d="M172,1002 L246,1002 M234,1002 L302,1002" stroke="url(#gLace)" stroke-width="4.6" opacity=".92" stroke-linecap="round"/>',
'<path d="M190,940 q12,-9 25,0 q-13,7 -25,0 M244,940 q12,-9 25,0 q-13,7 -25,0" fill="#a98cff" opacity=".95"/>',
/* ---------- юбка ---------- */
'<g id="g-skirt">',
'<path d="M180,634 L300,634 C338,668 366,720 374,786 L106,786 C114,720 142,668 180,634 Z" fill="url(#gSkirt)" stroke="#2e3a66" stroke-opacity=".22" stroke-width="1.8" stroke-linejoin="round"/>',
'<path d="M164,652 L156,784 M192,640 L188,786 M222,634 L222,786 M258,634 L258,786 M288,640 L292,786 M316,652 L324,784" stroke="#dbe6ff" stroke-width="1.7" opacity=".38"/>',
'<path d="M106,786 L374,786" stroke="url(#gRim)" stroke-width="3.6" opacity=".95" stroke-linecap="round"/>',
'<path d="M106,786 L374,786" stroke="#8b5cf6" stroke-width="7" opacity=".18" filter="url(#gSoft)"/>',
'<path d="M240,654 l16,12 l-16,12 l-16,-12 Z" fill="#8b5cf6" opacity=".9"/><circle cx="240" cy="666" r="3.8" fill="#e3ecff"/>',
'</g>',
/* ---------- торс ---------- */
'<path d="M188,382 C172,428 170,478 192,528 C202,554 204,582 176,612 L304,612 C276,582 278,554 288,528 C310,478 308,428 292,382 C266,360 214,360 188,382 Z" fill="url(#gSkin)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.4"/>',
'<path d="M188,382 C172,428 170,478 192,528 C202,554 204,582 176,612 L304,612 C276,582 278,554 288,528 C310,478 308,428 292,382 C266,360 214,360 188,382 Z" fill="url(#gTop)"/>',
'<path d="M196,382 C186,428 186,478 204,528 L276,528 C296,478 296,428 284,382 C262,362 218,362 196,382 Z" fill="url(#gTop)"/>',
'<path d="M204,470 L276,470" stroke="#ffffff" stroke-width="2.8" opacity=".8" stroke-linecap="round"/>',
'<path d="M208,506 L272,506" stroke="#ffffff" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>',
'<path d="M192,528 L288,528" stroke="url(#gRim)" stroke-width="2.6" opacity=".85"/>',
/* матросский воротник */
'<path d="M196,382 C214,368 266,368 284,382 L292,420 L262,404 L240,430 L218,404 L188,420 Z" fill="url(#gCollar)" stroke="#2e3a66" stroke-opacity=".22" stroke-width="1.6" stroke-linejoin="round"/>',
'<path d="M200,398 L232,414 M280,398 L248,414" stroke="#b9c9ea" stroke-width="1.6" opacity=".7"/>',
/* рукава */
'<path d="M188,382 C160,394 142,424 138,462 L172,478 C176,444 186,416 200,398 Z" fill="url(#gCollar)" stroke="#2e3a66" stroke-opacity=".22" stroke-width="1.6" stroke-linejoin="round"/>',
'<path d="M292,382 C320,394 338,424 342,462 L308,478 C304,444 294,416 280,398 Z" fill="url(#gCollar)" stroke="#2e3a66" stroke-opacity=".22" stroke-width="1.6" stroke-linejoin="round"/>',
'<path d="M140,456 L174,472 M340,456 L306,472" stroke="#c9d8f4" stroke-width="2.2" opacity=".7" stroke-linecap="round"/>',
/* бант */
'<path d="M240,412 l-32,-16 l-5,27 l37,8 Z" fill="url(#gBow)"/><path d="M240,412 l32,-16 l5,27 l-37,8 Z" fill="url(#gBow)"/>',
'<circle cx="240" cy="417" r="10" fill="#7a52e0"/><circle cx="236" cy="413" r="3.2" fill="#ffffff" opacity=".88"/>',
'<path d="M236,426 l-7,34 M244,426 l7,34" stroke="#8b5cf6" stroke-width="4" stroke-linecap="round" opacity=".9"/>',
/* ---------- руки ---------- */
'<path id="g-arm-l" d="M192,404 C168,452 154,516 152,578 C151,602 156,616 166,622 L184,608 C180,584 182,544 190,492 C198,444 206,416 210,400 Z" fill="url(#gSkin)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.4" stroke-linejoin="round"/>',
'<path id="g-arm-r" d="M288,404 C312,452 326,516 328,578 C329,602 324,616 314,622 L296,608 C300,584 298,544 290,492 C282,444 274,416 270,400 Z" fill="url(#gSkin)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.4" stroke-linejoin="round"/>',
'<path d="M160,570 q10,18 26,24 M320,570 q-10,18 -26,24" stroke="#dbe6ff" stroke-width="2.6" fill="none" opacity=".45" stroke-linecap="round"/>',
'<path d="M166,622 C162,634 164,646 174,652 C184,657 192,650 190,638 C188,628 180,620 172,618 Z" fill="url(#gSkin)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.4"/>',
'<path d="M314,622 C318,634 316,646 306,652 C296,657 288,650 290,638 C292,628 300,620 308,618 Z" fill="url(#gSkin)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.4"/>',
/* ---------- шея ---------- */
'<path d="M216,308 L216,376 Q240,392 264,376 L264,308 Z" fill="url(#gSkin)"/>',
'<path d="M216,308 L216,344 Q240,360 264,344 L264,308 Z" fill="#cf8f72" opacity=".38"/>',
/* ---------- лицо ---------- */
'<path d="M240,158 C186,158 160,198 162,250 C164,292 180,324 212,340 C226,347 254,347 268,340 C300,324 316,292 318,250 C320,198 294,158 240,158 Z" fill="url(#gSkin)" stroke="#2e3a66" stroke-opacity=".16" stroke-width="1.4"/>',
'<path d="M162,250 C150,236 146,258 154,276 C160,290 170,296 176,292 Z" fill="url(#gSkin)"/>',
'<path d="M318,250 C330,236 334,258 326,276 C320,290 310,296 304,292 Z" fill="url(#gSkin)"/>',
'<ellipse cx="176" cy="268" rx="10" ry="15" fill="#f2b8a0" opacity=".5"/>',
'<ellipse cx="304" cy="268" rx="10" ry="15" fill="#f2b8a0" opacity=".5"/>',
/* глаза */
'<ellipse cx="208" cy="264" rx="25" ry="29" fill="#ffffff" stroke="#2e3a66" stroke-opacity=".2" stroke-width="1.2"/>',
'<ellipse cx="208" cy="266" rx="22" ry="26" fill="url(#gIris)"/>',
'<ellipse cx="208" cy="276" rx="18" ry="15" fill="url(#gIrisLo)" opacity=".55"/>',
'<ellipse cx="208" cy="268" rx="8.6" ry="12" fill="#05162e"/>',
'<circle cx="199" cy="252" r="7.6" fill="#ffffff" opacity=".98"/>',
'<circle cx="217" cy="280" r="3.6" fill="#ffffff" opacity=".82"/>',
'<circle cx="212" cy="250" r="2.2" fill="#ffffff" opacity=".9"/>',
'<path d="M182,240 C195,224 221,224 234,240" stroke="#2f3d5c" stroke-width="6.6" fill="none" stroke-linecap="round"/>',
'<path d="M182,237 C195,221 221,221 234,237" stroke="#0a1224" stroke-width="2.4" fill="none" opacity=".35" stroke-linecap="round"/>',
'<path d="M184,286 C192,292 202,293 210,290" stroke="#2f3d5c" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>',
'<ellipse cx="272" cy="264" rx="25" ry="29" fill="#ffffff" stroke="#2e3a66" stroke-opacity=".2" stroke-width="1.2"/>',
'<ellipse cx="272" cy="266" rx="22" ry="26" fill="url(#gIris)"/>',
'<ellipse cx="272" cy="276" rx="18" ry="15" fill="url(#gIrisLo)" opacity=".55"/>',
'<ellipse cx="272" cy="268" rx="8.6" ry="12" fill="#05162e"/>',
'<circle cx="263" cy="252" r="7.6" fill="#ffffff" opacity=".98"/>',
'<circle cx="281" cy="280" r="3.6" fill="#ffffff" opacity=".82"/>',
'<circle cx="276" cy="250" r="2.2" fill="#ffffff" opacity=".9"/>',
'<path d="M246,240 C259,224 285,224 298,240" stroke="#2f3d5c" stroke-width="6.6" fill="none" stroke-linecap="round"/>',
'<path d="M246,237 C259,221 285,221 298,237" stroke="#0a1224" stroke-width="2.4" fill="none" opacity=".35" stroke-linecap="round"/>',
'<path d="M270,286 C278,292 288,293 296,290" stroke="#2f3d5c" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>',
/* брови, нос, рот, румяна */
'<path d="M190,214 C204,206 222,207 232,214" stroke="#8492b8" stroke-width="3" fill="none" stroke-linecap="round"/>',
'<path d="M248,214 C258,207 276,206 290,214" stroke="#8492b8" stroke-width="3" fill="none" stroke-linecap="round"/>',
'<path d="M238,290 l4,7 l-6,0" stroke="#cf8f72" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
'<path d="M226,316 q14,11 28,0" stroke="#c85f7c" stroke-width="2.8" fill="none" stroke-linecap="round"/>',
'<path d="M231,319 q9,6 18,0" stroke="#ffffff" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>',
'<ellipse cx="182" cy="296" rx="20" ry="11" fill="url(#gBlush)"/>',
'<ellipse cx="298" cy="296" rx="20" ry="11" fill="url(#gBlush)"/>',
/* ---------- чёлка ---------- */
'<path d="M240,150 C158,150 114,214 120,300 C126,254 140,216 160,196 C168,236 180,268 198,288 C204,244 210,206 222,178 C230,216 242,252 256,274 C260,232 268,196 280,170 C292,208 304,250 312,296 C326,252 346,214 356,300 C368,210 322,150 240,150 Z" fill="url(#gHair)" stroke="#2e3a66" stroke-opacity=".22" stroke-width="1.8" stroke-linejoin="round"/>',
'<path d="M160,196 C192,166 288,166 320,196" stroke="url(#gHair3)" stroke-width="8" fill="none" opacity=".6" stroke-linecap="round"/>',
'<path d="M196,214 C206,244 216,268 228,286" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".28" stroke-linecap="round"/>',
'<path d="M272,214 C266,244 258,268 250,286" stroke="#ffffff" stroke-width="2" fill="none" opacity=".22" stroke-linecap="round"/>',
/* боковые пряди у лица */
'<path d="M132,262 C120,344 122,424 138,488 L164,476 C148,424 146,346 154,270 Z" fill="url(#gHair)"/>',
'<path d="M348,262 C360,344 358,424 342,488 L316,476 C332,424 334,346 326,270 Z" fill="url(#gHair)"/>',
'<path d="M138,300 C132,364 134,424 144,470" stroke="#ffffff" stroke-width="2.2" fill="none" opacity=".35" stroke-linecap="round"/>',
'<path d="M342,300 C348,364 346,424 336,470" stroke="#ffffff" stroke-width="2.2" fill="none" opacity=".35" stroke-linecap="round"/>',
/* ---------- хвосты ---------- */
'<path id="g-tail-l" d="M104,290 C74,392 60,516 78,630 C88,706 114,758 142,778 L164,724 C134,696 116,644 114,576 C110,474 126,376 148,308 Z" fill="url(#gHair2)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.8" stroke-linejoin="round"/>',
'<path id="g-tail-r" d="M376,290 C406,392 420,516 402,630 C392,706 366,758 338,778 L316,724 C346,696 364,644 366,576 C370,474 354,376 332,308 Z" fill="url(#gHair2)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.8" stroke-linejoin="round"/>',
'<path d="M120,420 q20,154 8,306 M360,420 q-20,154 -8,306" stroke="#ffffff" stroke-width="3.2" fill="none" opacity=".3" stroke-linecap="round"/>',
'<path d="M136,300 C118,344 108,404 110,462 M344,300 C362,344 372,404 370,462" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".22" stroke-linecap="round"/>',
/* ---------- ахоге ---------- */
'<path id="g-ahoge" d="M230,156 C208,106 230,62 278,48 C246,82 236,120 254,156 Z" fill="url(#gHair2)" stroke="#2e3a66" stroke-opacity=".18" stroke-width="1.6" stroke-linejoin="round"/>',
/* ---------- ободок с бантом ---------- */
'<path d="M168,206 C198,184 282,184 312,206" stroke="#c9d8f4" stroke-width="8" fill="none" stroke-linecap="round" opacity=".95"/>',
'<path d="M310,198 l26,-17 l3,29 Z" fill="url(#gBow)"/><path d="M310,198 l-6,-29 l26,17 Z" fill="url(#gBow)"/><circle cx="312" cy="198" r="6" fill="#7a52e0"/>',
/* ---------- финальные блики ---------- */
'<path d="M240,150 C158,150 114,214 120,300" stroke="#e6efff" stroke-width="3.4" fill="none" opacity=".9" stroke-linecap="round" filter="url(#gGlow)"/>',
'<path d="M104,290 C74,392 60,516 78,630" stroke="#e6efff" stroke-width="2.8" fill="none" opacity=".6" stroke-linecap="round"/>',
'<path d="M180,634 C142,668 114,720 106,786" stroke="#dbe6ff" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/>',
'<ellipse cx="240" cy="1036" rx="158" ry="15" fill="url(#gRim)" opacity=".16"/>',
'</svg>',
      '</div></div>',
      '<div id="bt-vignette"></div>',
      '<div id="bt-scan"></div>',
      '<div class="bt-top">',
        '<span class="bt-title">КЛИКЕР-АРЕНА</span>',
        '<span class="bt-phase" id="bt-phase">ОЖИДАНИЕ</span>',
        '<button class="bt-exit" id="bt-sound" title="Звук вкл/выкл">🔊</button>',
        '<button class="bt-exit" id="bt-exit">ВЫЙТИ</button>',
      '</div>',
      '<div class="bt-slots" id="bt-slots"></div>',
      '<div class="bt-body">',
        '<div class="bt-stage" id="bt-stage">',
          '<div class="bt-clockwrap">',
            '<svg class="bt-ring" viewBox="0 0 120 120">',
              '<defs><linearGradient id="btgrad" x1="0" y1="0" x2="1" y2="1">',
                '<stop offset="0%" stop-color="#d8e6ff"/><stop offset="60%" stop-color="#c8d6f4"/>',
                '<stop offset="100%" stop-color="#c0cee8"/></linearGradient></defs>',
              '<circle class="bt-ring-bg" cx="60" cy="60" r="54"></circle>',
              '<circle class="bt-ring-fg" id="bt-ring" cx="60" cy="60" r="54" stroke-dasharray="339.29" stroke-dashoffset="339.29"></circle>',
            '</svg>',
            '<div class="bt-clock" id="bt-clock">--:--</div>',
          '</div>',
          '<div class="bt-info" id="bt-info"></div>',
          '<div id="bt-target">КЛИК</div>',
        '</div>',
        '<div class="bt-side">',
          '<h3>СЧЁТ РАУНДА</h3><div id="bt-scores"></div>',
          '<h3 style="margin-top:18px">ЛИДЕРБОРД · ВСЁ ВРЕМЯ</h3><div id="bt-board"></div>',
          '<h3 style="margin-top:18px">ЧАТ АРЕНЫ <span id="bt-chat-online" class="bt-online">0</span></h3>',
          '<div id="bt-chat-log" class="bt-chat"></div>',
          '<div class="bt-chat-in">',
            '<input id="bt-chat-input" maxlength="120" placeholder="Сообщение…" autocomplete="off">',
            '<button id="bt-chat-send" title="Отправить">➤</button>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="bt-bottom">',
        '<button class="bt-btn bt-btn-acc" id="bt-vote">НАЧАТЬ СЕЙЧАС</button>',
        '<button class="bt-btn" id="bt-profile">ПРОФИЛЬ</button>',
      '</div>',
      '<div id="bt-modal-host"></div>',
      '<div id="bt-register"><div class="bt-reg-box">',
        '<h2>РЕГИСТРАЦИЯ</h2>',
        '<p>Ник создаётся в чате и общий для арены.<br>Введи ник, чтобы играть.</p>',
        '<input id="bt-reg-input" maxlength="16" placeholder="Ник (2–16 символов)" autocomplete="off">',
        '<button id="bt-reg-btn">ВОЙТИ В АРЕНУ</button>',
        '<div class="bt-reg-err" id="bt-reg-err"></div>',
      '</div></div>'
    ].join('');    document.body.appendChild(root);

    el.phase = root.querySelector('#bt-phase'); el.slots = root.querySelector('#bt-slots');
    el.clock = root.querySelector('#bt-clock'); el.ring = root.querySelector('#bt-ring');
    el.info = root.querySelector('#bt-info'); el.target = root.querySelector('#bt-target');
    el.scores = root.querySelector('#bt-scores'); el.board = root.querySelector('#bt-board');
    el.vote = root.querySelector('#bt-vote'); el.profile = root.querySelector('#bt-profile');
    el.stage = root.querySelector('#bt-stage'); el.modal = root.querySelector('#bt-modal-host');
    el.reg = root.querySelector('#bt-register'); el.regInput = root.querySelector('#bt-reg-input');
    el.regBtn = root.querySelector('#bt-reg-btn'); el.regErr = root.querySelector('#bt-reg-err');
    el.chatLog = root.querySelector('#bt-chat-log');
    el.chatInput = root.querySelector('#bt-chat-input');
    el.chatSend = root.querySelector('#bt-chat-send');
    var gEl = root.querySelector('#bt-girl');
    // Своя картинка вместо нарисованной девушки: впиши имя файла в GIRL_IMG (выше).
    // Пусто = показывается SVG-девушка, лишних сетевых запросов нет.
    if (gEl && GIRL_IMG) {
      var im = new Image();
      im.onload = function () {
        gEl.classList.add('has-img');
        gEl.style.backgroundImage = 'url("' + GIRL_IMG + '")';
        console.log('[battle] персонаж из файла:', GIRL_IMG);
      };
      im.src = GIRL_IMG;
    }

    root.querySelector('#bt-exit').addEventListener('click', close);
    root.querySelector('#bt-sound').addEventListener('click', function () {
      var v = sfx.toggle(!sfx.isOn());
      this.textContent = v ? '🔊' : '🔇';
    });
    el.vote.addEventListener('click', onVoteClick);
    el.profile.addEventListener('click', showProfile);
    el.target.addEventListener('pointerdown', onTargetDown);
    el.target.addEventListener('pointerup', onTargetUp);
    el.target.addEventListener('pointerleave', onTargetUp);
    el.regBtn.addEventListener('click', submitRegister);
    el.regInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitRegister(); });
    el.chatSend.addEventListener('click', sendChat);
    el.chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChat(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !root || !root.classList.contains('open')) return;
      if (el.modal && el.modal.innerHTML) { clearModal(); e.preventDefault(); }
    });
  }

  function showModal(html, autoCloseMs) {
    clearModal();
    var m = document.createElement('div'); m.className = 'bt-modal bt-fade';
    m.innerHTML = '<div class="bt-modal-in">' + html + '</div>';
    el.modal.appendChild(m);
    if (autoCloseMs) setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, autoCloseMs);
    return m;
  }
  function clearModal() { if (el.modal) el.modal.innerHTML = ''; }

  var PHASE_LABEL = { WAITING: 'ОЖИДАНИЕ', PLAYING: 'РАУНД', RESULTS: 'РЕЗУЛЬТАТЫ', BREAK: 'ПЕРЕРЫВ' };
  function initials(n) {
    var raw = String(n || '');
    if (!raw || raw.charAt(0) === '#') return '•'; // плейсхолдер #N — нейтральный значок
    var s = raw.replace(/[^0-9A-Za-zА-Яа-яЁё]/g, '');
    if (!s) return '•';
    return esc(s.slice(0, 2).toUpperCase());
  }

  // Плейсхолдер #N -> «Игрок N»: решётки в интерфейсе не показываем.
function dispNick(n) {
  var s = String(n == null ? '' : n);
  if (!s) return 'Игрок';
  if (s.charAt(0) === '#') return 'Игрок ' + s.slice(1);
  return s;
}

function scoreList() {
    var ids = aliveIds(), out = [], i;
    for (i = 0; i < ids.length; i++) out.push({ id: ids[i], nick: players[ids[i]].nick, score: players[ids[i]].score || 0 });
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }
  function renderSlots() {
    if (!el.slots) return;
    var list = scoreList(), html = '', i;
    for (i = 0; i < MAX_PLAYERS; i++) {
      var p = list[i];
      var cls = 'bt-slot' + (p ? ' on' : '') + (p && p.id === myId ? ' me' : '');
      html += '<div class="' + cls + '">' + (p ? '<span class="bt-av">' + initials(p.nick) + '</span><span class="bt-nm">' + esc(dispNick(p.nick)) + '</span>' : '<span class="bt-nm bt-empty">— свободно —</span>') + '</div>';
    }
    if (html !== _h.slots) { _h.slots = html; el.slots.innerHTML = html; }
    renderOnline();
  }
  function renderScores() {
    if (!el.scores) return;
    var list = scoreList(), html = '', i;
    for (i = 0; i < list.length; i++) {
      var cls = 'bt-row' + (list[i].id === myId ? ' me' : '') + (i === 0 && list[i].score > 0 ? ' top' : '');
      html += '<div class="' + cls + '"><span class="r">' + medal(i) + '</span><span class="n">' + esc(dispNick(list[i].nick)) + '</span><span class="c">' + list[i].score + '</span></div>';
    }
    html = html || '<div class="bt-row">пусто</div>';
    if (html !== _h.scores) { _h.scores = html; el.scores.innerHTML = html; }
  }
  function renderLeaderboard() {
    if (!el.board) return;
    getLeaderboard(function (top) {
      var html = '<div class="bt-lb-head"><span>ИГРОК</span><span>КЛИКИ ЗА ВСЁ ВРЕМЯ</span></div>', i;
      for (i = 0; i < top.length; i++) {
        html += '<div class="bt-row"><span class="r">' + medal(i) + '</span>' +
          '<span class="n">' + esc(dispNick(top[i].nick)) + (top[i].rounds ? ' <i class="bt-dim">(' + top[i].rounds + ' р.)</i>' : '') + '</span>' +
          '<span class="c">' + (top[i].total || 0) + '</span></div>';
      }
      el.board.innerHTML = html;
    });
  }
  function renderPhase() {
    if (!el.phase) return;
    var label = PHASE_LABEL[st.phase] || st.phase;
    if (label !== _h.phase) { _h.phase = label; el.phase.textContent = label; }
    el.target.classList.toggle('off', st.phase !== PH.PLAYING);
    el.vote.disabled = (st.phase === PH.PLAYING);
    var vt = st.phase === PH.WAITING ? 'НАЧАТЬ СЕЙЧАС' : 'НАЧАТЬ СЕЙЧАС (' + st.votes + ')';
    if (el.vote.textContent !== vt) el.vote.textContent = vt;
  }
  function renderClock() {
    if (!el.clock) return;
    var total = st.phase === PH.PLAYING ? ROUND_SEC : st.phase === PH.BREAK ? BREAK_SEC : st.phase === PH.RESULTS ? RESULTS_SEC : st.phase === PH.WAITING ? WAIT_SEC : 0;
    if (!st.endsAt || !total) {
      if (_h.clock !== '--:--') { _h.clock = '--:--'; el.clock.textContent = '--:--'; el.clock.classList.remove('low'); }
      el.ring.style.strokeDashoffset = 339.29; el.ring.classList.remove('low'); return;
    }
    var leftMs = Math.max(0, st.endsAt - now()), left = Math.ceil(leftMs / 1000);
    var m = Math.floor(left / 60), s = left % 60, txt = ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
    if (txt !== _h.clock) { _h.clock = txt; el.clock.textContent = txt; }
    var low = left <= 10 && st.phase === PH.PLAYING;
    el.clock.classList.toggle('low', low); el.ring.classList.toggle('low', low);
    el.ring.style.strokeDashoffset = String(339.29 * (1 - Math.max(0, Math.min(1, leftMs / (total * 1000)))));
  }
  function renderInfo() {
    if (!el.info) return;
    var t = '';
    if (!joined) t = 'Подключение (' + MODE + ')…';
    else if (st.phase === PH.WAITING) {
      var secs = st.endsAt ? Math.max(0, Math.ceil((st.endsAt - now()) / 1000)) : WAIT_SEC;
      t = 'Автораунд через ' + secs + ' с · жми «Начать сейчас»' + (myIsMaster() ? ' · ВЫ ХОСТ' : '');
    }
    else if (st.phase === PH.PLAYING) t = 'Кликай! · раунд ' + st.round;
    else if (st.phase === PH.RESULTS) t = 'Итоги раунда ' + st.round;
    else if (st.phase === PH.BREAK) t = 'Перерыв до следующего раунда';
    if (t !== _h.info) { _h.info = t; el.info.textContent = t; }
  }
  function renderAll() { renderSlots(); renderScores(); renderPhase(); renderClock(); renderInfo(); }
  function flyText(txt) {
    if (!el.stage) return;
    var d = document.createElement('div'); d.className = 'bt-fly'; d.textContent = txt;
    d.style.left = (42 + Math.random() * 16) + '%'; d.style.top = '48%';
    el.stage.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1000);
  }
  function burst() {
    if (!el.stage) return;
    for (var i = 0; i < 5; i++) {
      var sp = document.createElement('div'); sp.className = 'bt-spark';
      var a = Math.random() * 6.283, r = 40 + Math.random() * 40;
      sp.style.setProperty('--dx', Math.cos(a) * r + 'px'); sp.style.setProperty('--dy', Math.sin(a) * r + 'px');
      sp.style.left = '90px'; sp.style.top = '90px'; el.target.appendChild(sp);
      (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 650); })(sp);
    }
  }

  // ====================== ФОН (canvas: звёзды, туманности, ЧД) ==============
  // ---- Звуковые эффекты (WebAudio, создаётся после первого касания) ----
  var sfx = (function () {
    var ctx = null, on = true;
    function ac() {
      if (!ctx) { try { var C = window.AudioContext || window.webkitAudioContext; ctx = new C(); } catch (e) { ctx = null; } }
      if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
      return ctx;
    }
    function tone(f1, f2, dur, type, vol) {
      if (!on) return; var c = ac(); if (!c) return;
      try {
        var o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(f1, c.currentTime);
        if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), c.currentTime + dur);
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(vol || 0.1, c.currentTime + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        o.connect(g); g.connect(c.destination);
        o.start(); o.stop(c.currentTime + dur + 0.02);
      } catch (e) {}
    }
    return {
      click: function () { tone(620, 900, 0.055, 'square', 0.05); },
      tick:  function () { tone(900, 900, 0.05, 'sine', 0.09); },
      go:    function () { tone(440, 1320, 0.3, 'triangle', 0.15); },
      end:   function () { tone(680, 220, 0.5, 'sawtooth', 0.09); },
      join:  function () { tone(520, 1040, 0.16, 'sine', 0.09); },
      msg:   function () { tone(1150, 1500, 0.07, 'sine', 0.06); },
      unlock: function () { ac(); },
      toggle: function (v) { on = !!v; return on; },
      isOn: function () { return on; }
    };
  })();
  var IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  // ---- фон: звёзды, туманности, лепестки сакуры, силуэт, параллакс ----
  var bg = { raf: 0, stars: [], clouds: [], petals: [], t: 0, cv: null, ctx: null, W: 0, H: 0, dpr: 1, mx: 0, my: 0, px: 0, py: 0, last: 0 };
  function bgSize() {
    var cv = bg.cv; if (!cv) return;
    bg.W = window.innerWidth; bg.H = window.innerHeight;
    cv.width = Math.floor(bg.W * bg.dpr); cv.height = Math.floor(bg.H * bg.dpr);
    cv.style.width = bg.W + 'px'; cv.style.height = bg.H + 'px';
    bg.ctx.setTransform(bg.dpr, 0, 0, bg.dpr, 0, 0);
  }
  function startBg() {
    var cv = root && root.querySelector('#bt-bg'); if (!cv || bg.raf) return;
    bg.cv = cv; bg.ctx = cv.getContext('2d');
    bg.dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1 : 1.6); // 1.6: чётко и дешевле для GPU
    bgSize(); window.addEventListener('resize', bgSize);

    // параллакс от мыши — тонкий, без рывков
    if (!bg._mv) {
      bg._mv = true;
      window.addEventListener('mousemove', function (e) {
        bg.mx = (e.clientX / window.innerWidth - 0.5) * 2;
        bg.my = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    var i, n = IS_MOBILE ? 80 : 170;
    bg.stars.length = 0;
    for (i = 0; i < n; i++) {
      bg.stars.push({ x: Math.random(), y: Math.random(), r: 0.3 + Math.random() * 1.25, p: Math.random() * 6.283, s: 0.4 + Math.random() * 1.6 });
    }
    var cn = IS_MOBILE ? 3 : 5, cols = ['0,229,255', '139,92,255', '255,92,176', '90,255,200', '255,180,90'];
    bg.clouds.length = 0;
    for (i = 0; i < cn; i++) {
      bg.clouds.push({ x: Math.random(), y: Math.random(), r: 0.26 + Math.random() * 0.30, c: cols[i % cols.length], a: 0.05 + Math.random() * 0.07, vx: (Math.random() - 0.5) * 0.00009, vy: (Math.random() - 0.5) * 0.00009 });
    }
    // лепестки сакуры — anime-атмосфера
    var pn = IS_MOBILE ? 16 : 34;
    bg.petals.length = 0;
    for (i = 0; i < pn; i++) {
      bg.petals.push({ x: Math.random(), y: Math.random(), s: 2 + Math.random() * 3.2, v: 0.00016 + Math.random() * 0.00030, sw: 0.6 + Math.random() * 1.6, ph: Math.random() * 6.283, rot: Math.random() * 6.283, rs: (Math.random() - 0.5) * 0.02 });
    }
    bg.t = 0; bg.last = performance.now(); bgLoop();
  }
  function stopBg() {
    if (bg.raf) { cancelAnimationFrame(bg.raf); bg.raf = 0; }
    window.removeEventListener('resize', bgSize);
  }
  function bgLoop() {
    var cv = bg.cv, ctx = bg.ctx; if (!cv || !ctx) return;
    bg.raf = requestAnimationFrame(bgLoop);
    var nowMs = performance.now();
    var dt = Math.min(48, nowMs - (bg.last || nowMs)); bg.last = nowMs;
    bg.t += dt * 0.001;
    var W = bg.W, H = bg.H, t = bg.t, i;
    // плавный догоняющий параллакс
    bg.px += (bg.mx - bg.px) * 0.04; bg.py += (bg.my - bg.py) * 0.04;
    var ox = bg.px * 12, oy = bg.py * 8;
    ctx.clearRect(0, 0, W, H);

    // туманности — дышат и дрейфуют
    for (i = 0; i < bg.clouds.length; i++) {
      var c = bg.clouds[i]; c.x += c.vx * dt * 0.06; c.y += c.vy * dt * 0.06;
      if (c.x < -0.25) c.x = 1.25; if (c.x > 1.25) c.x = -0.25;
      if (c.y < -0.25) c.y = 1.25; if (c.y > 1.25) c.y = -0.25;
      var rr = Math.max(W, H) * c.r * (0.92 + 0.08 * Math.sin(t * 0.5 + i));
      var cxp = c.x * W + ox, cyp = c.y * H + oy;
      var g = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, rr);
      g.addColorStop(0, 'rgba(' + c.c + ',' + c.a + ')'); g.addColorStop(1, 'rgba(' + c.c + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cxp, cyp, rr, 0, 6.283); ctx.fill();
    }

    // силуэт чёрной дыры за интерфейсом
    var bhx = W * 0.5, bhy = H * 0.5, bhr = Math.min(W, H) * 0.085;
    var ring = ctx.createRadialGradient(bhx, bhy, bhr * 0.55, bhx, bhy, bhr * 2.6);
    ring.addColorStop(0, 'rgba(255,180,90,0.20)'); ring.addColorStop(0.35, 'rgba(255,90,140,0.09)'); ring.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(bhx, bhy, bhr * 2.6, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.beginPath(); ctx.arc(bhx, bhy, bhr, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,120,0.30)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(bhx, bhy, bhr * 1.12, 0, 6.283); ctx.stroke();

    // звёзды — мерцание + лёгкий параллакс
    for (i = 0; i < bg.stars.length; i++) {
      var stx = bg.stars[i];
      var a = 0.32 + 0.68 * (0.5 + 0.5 * Math.sin(t * stx.s + stx.p));
      ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(stx.x * W + ox * 0.5, stx.y * H + oy * 0.5, stx.r, 0, 6.283); ctx.fill();
    }

    // лепестки сакуры — падают и покачиваются
    for (i = 0; i < bg.petals.length; i++) {
      var p = bg.petals[i];
      p.y += p.v * dt; p.rot += p.rs * dt * 0.06;
      p.ph += 0.0016 * dt;
      if (p.y > 1.08) { p.y = -0.08; p.x = Math.random(); }
      var pxp = p.x * W + Math.sin(p.ph * p.sw) * 26 + ox * 1.4;
      var pyp = p.y * H + oy * 1.4;
      ctx.save();
      ctx.translate(pxp, pyp); ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(255,150,200,0.42)';
      ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.283); ctx.fill();
      ctx.restore();
    }
  }

  // ============================ РЕГИСТРАЦИЯ =================================
  function submitRegister() {
    var v = String(el.regInput.value || '').trim();
    if (!/^[A-Za-z0-9_\-А-Яа-яЁё]{2,16}$/u.test(v)) { el.regErr.textContent = 'Ник: 2–16 символов (буквы, цифры, _ и -)'; return; }
    nick = v; try { sessionStorage.setItem(NICK_KEY, v); } catch (e) {}
    el.regErr.textContent = ''; el.reg.classList.remove('on'); startArena();
  }

  // ============================ ТРАНСПОРТ ===================================
  // Интерфейс: { join(nick), send(obj), leave() }
  // Колбэки в общий onNet* ниже.

  function onNetJoin(id, nk) {
    var isNew = !players[id]; // heartbeat тоже зовёт onNetJoin — системку шлём только на реальный вход
    players[id] = players[id] || { nick: nk, score: 0, seen: now() };
    players[id].nick = nk; players[id].seen = now();
    if (id === myId) joined = true;
    else if (isNew) { addChatSys(nk + ' зашёл в арену'); sfx.join(); }
    renderAll();
  }
  function onNetLeave(id) {
    if (players[id] && players[id].nick) addChatSys(players[id].nick + ' покинул арену');
    delete players[id]; delete st.voters[id];
    recalcVotes();
    if (isMasterNow()) masterSyncState();
    renderAll();
  }
  function announceName() { send({ t: 'n', n: nick }); }
  function onNetMsg(fromId, obj) {
    if (!obj || !obj.t) return;
    if (players[fromId]) {
      players[fromId].seen = now();
      // Пришло настоящее имя, а у нас плейсхолдер #N — заменяем
      if (obj.n && players[fromId].nick !== obj.n && String(players[fromId].nick).charAt(0) === '#') {
        players[fromId].nick = obj.n;
        renderAll();
      }
    }
    switch (obj.t) {
      case 'h': onNetJoin(fromId, obj.n); break;
      case 'j': onNetJoin(fromId, obj.n); if (isMasterNow()) masterSyncState(); break;
      case 'c': if (isMasterNow()) masterOnClick(fromId, obj.n); break;
      case 'sc': onScore(fromId, obj); break;
      case 'v': if (isMasterNow()) masterOnVote(fromId, obj.n); break;
      case 'st': onStateMsg(obj); break;
      case 'm': addChatLine(obj.n || fromId, obj.m, false); break;
      case 'n':
        // Явная рассылка ника: не ждём Photon-свойства (они приходят с задержкой)
        if (!players[fromId]) players[fromId] = { nick: obj.n || fromId, score: 0, seen: now() };
        if (obj.n && players[fromId].nick !== obj.n) { players[fromId].nick = obj.n; renderAll(); }
        break;
      case 'f': onFinish(obj); break;
    }
  }
  function isMasterNow() { return myIsMaster(); }

  // ---- CHAT-транспорт (работает на Chat App ID) ----
  function createChatNet() {
    var client = null, sub = false, chan = CHANNEL;
    return {
      mode: 'chat',
      join: function () {
        if (typeof Photon === 'undefined' || !Photon.Chat) { showJoinProblem('SDK НЕ ЗАГРУЖЕН', 'libs/photon.js не подключён.'); return; }
        client = new Photon.Chat.ChatClient(Photon.ConnectionProtocol.Wss, APP_ID_CHAT, APP_VERSION);
        // userId ОБЯЗАН отличаться от chat.js: у чата и арены ОДИН App ID, и при
        // одинаковом userId Photon разрывает одно из двух соединений -> реконнект-петля.
        myUid = nick + '#arena';
        try { client.setUserId(myUid); } catch (e) {}
        client.onError = function (c, m) { if (el.info) el.info.textContent = 'Ошибка чата: ' + m; };
        client.onStateChange = function (stateStr) {
          var CS = Photon.Chat.ChatClient.ChatState;
          if (stateStr === CS.Disconnected || stateStr === CS.Error) { if (el.info) el.info.textContent = 'Чат отключён, переподключение…'; }
          if (stateStr === CS.ConnectedToFrontEnd && !sub) subscribeTier();
        };
        // Подписка с фолбэками. Причина отклонения: у Chat-приложения может быть
        // выключен PublishSubscribers -> сервер отбивает subscribe с Properties.
        var tier = 0;
        function subscribeTier() {
          if (tier === 2) chan = CHANNEL + '_' + Math.random().toString(36).slice(2, 6);
          var opts = (tier === 0) ? { createOptions: { publishSubscribers: true, maxSubscribers: 50 } } : undefined;
          console.log('[battle] subscribe: попытка ' + (tier + 1) + '/3, канал ' + chan + (opts ? ' (с publishSubscribers)' : ' (обычная)'));
          try { client.subscribe([chan], opts); } catch (e) { console.warn('[battle] subscribe threw', e); }
        }
        // ВАЖНО: res — ОБЪЕКТ вида { 'имя_канала': true|false }, НЕ массив!
        client.onSubscribeResult = function (res) {
          console.log('[battle] onSubscribeResult', res);
          // Игнорируем результаты по ЧУЖИМ каналам: SDK шлёт сюда и служебные
          // события (напр. {global:true}). Раньше они запускали фолбэк -> цикл.
          if (!res || !(chan in res)) return;
          if (res[chan] === true) {
            if (sub) return;
            sub = true; myId = myUid; joined = true;
            console.log('[battle] ПОДПИСАН на канал', chan, '| id:', myId);
            players[myId] = players[myId] || { nick: nick, score: 0, seen: now() };
            startHeartbeat();
            send({ t: 'j', n: nick });
            renderAll();
            return;
          }
          if (tier < 2) { tier++; subscribeTier(); return; }
          showJoinProblem('НЕ ВОШЁЛ В КАНАЛ', 'Канал ' + chan + ' отклонён 3 раза. Ответ: ' + JSON.stringify(res));
        };
        client.onUserSubscribe = function (ch, u) { if (u) onNetJoin(u, u); };
        client.onUserUnsubscribe = function (ch, u) { if (u) onNetLeave(u); };
        client.onChatMessages = function (ch, msgs) {
          for (var i = 0; i < msgs.length; i++) {
            var sender = msgs[i].getSender(), raw = msgs[i].getContent();
            if (!sender || sender === myUid) continue;
            var obj = null; try { obj = JSON.parse(raw); } catch (e) { continue; }
            onNetMsg(sender, obj);
          }
        };
        client.connectToNameServer({ region: REGION });
      },
      send: function (obj) { if (client && sub) { try { client.publishMessage(chan, JSON.stringify(obj)); } catch (e) {} } },
      leave: function () { if (client) { try { client.unsubscribe([chan]); } catch (e) {} try { client.disconnect(); } catch (e) {} } client = null; }
    };
  }
  function send(obj) { if (net) net.send(obj); }

  // ---- REALTIME-транспорт (нужен Realtime App ID) ----
  function createRealtimeNet() {
    var client = null, RCV_ALL = 1;
    var EV = { CLICK: 11, VOTE: 12, STATE: 13, SCORE: 14, FINISH: 15, CHAT: 16, NAME: 17 };
    var self = {
      mode: 'realtime',
      actorNr: 0,
      roomMasterNr: -1,
      refresh: function () { if (client) { try { self.roomMasterNr = client.myRoomMasterActorNr(); } catch (e) {} } },
      join: function () {
        if (typeof Photon === 'undefined' || !Photon.LoadBalancing) { showJoinProblem('SDK НЕ ЗАГРУЖЕН', 'libs/photon.js не подключён.'); return; }
        client = new Photon.LoadBalancing.LoadBalancingClient(Photon.ConnectionProtocol.Wss, APP_ID_REALTIME, APP_VERSION);
        client.onError = function (c, m) { console.warn('[battle-rt] error', c, m); };
        client.onOperationResponse = function (errorCode, errorMsg, code) {
          if (!errorCode) return;
          var EC = Photon.LoadBalancing.Constants.ErrorCode;
          if (errorCode === EC.GameFull) { showJoinProblem('КОМНАТА ЗАПОЛНЕНА', 'Лимит ' + MAX_PLAYERS + ' игроков.'); return; }
          if (errorCode === EC.GameClosed) { showJoinProblem('КОМНАТА ЗАКРЫТА', 'Вход закрыт.'); return; }
          showJoinProblem('ОШИБКА ' + errorCode, errorMsg || ('операция ' + code));
        };
        client.onStateChange = function (state) {
          var S = Photon.LoadBalancing.LoadBalancingClient.State;
          if (el.info && state !== S.Joined) el.info.textContent = 'Realtime: ' + Photon.LoadBalancing.LoadBalancingClient.StateToName(state) + '…';
          if (state === S.ConnectedToMaster) client.joinRoom(ROOM_NAME, { createIfNotExists: true }, { maxPlayers: MAX_PLAYERS, isVisible: true, isOpen: true, playerTTL: 0, roomTTL: 0 });
        };
        client.onJoinRoom = function () {
          joined = true;
          try { client.myActor().setName(nick); } catch (e) {}
          try { self.actorNr = client.myActor().actorNr; self.roomMasterNr = client.myRoomMasterActorNr(); } catch (e) {}
          // Ключ игрока = 'a<actorNr>'. Тогда имя можно обновить, а игрок остаётся тем же.
          myId = 'a' + self.actorNr; myUid = myId;
          players = {};
          players[myId] = { nick: nick, score: 0, seen: now() };
          console.log('[battle-rt] вошёл в', ROOM_NAME, 'actorNr=' + self.actorNr, 'master=' + self.roomMasterNr);
          var act = client.myRoomActorsArray() || [], i;
          for (i = 0; i < act.length; i++) onNetJoin('a' + act[i].actorNr, act[i].name || ('#' + act[i].actorNr));
          syncMaster(); renderAll(); renderLeaderboard();
          announceName();
        };
        client.onActorJoin = function (a) { onNetJoin('a' + a.actorNr, a.name || ('#' + a.actorNr)); self.refresh(); syncMaster(); announceName(); };
        client.onActorLeave = function (a) { onNetLeave('a' + a.actorNr); self.refresh(); syncMaster(); };
        // Имя приходит отдельным свойством — обновляем слот, когда оно доехало
        client.onActorPropertiesChange = function (a) {
          var id = 'a' + a.actorNr;
          if (players[id] && a.name && players[id].nick !== a.name) { players[id].nick = a.name; renderAll(); }
        };
        client.onEvent = function (code, content, actorNr) {
          var from = 'a' + actorNr;
          if (code === EV.CLICK) onNetMsg(from, { t: 'c', n: from });
          else if (code === EV.VOTE) onNetMsg(from, { t: 'v', n: from });
          else if (code === EV.STATE) onNetMsg(from, content);
          else if (code === EV.SCORE) onNetMsg(from, content);
          else if (code === EV.FINISH) onNetMsg(from, content);
          else if (code === EV.CHAT) { if (actorNr !== self.actorNr) onNetMsg(from, content); } // свои уже показали локально
          else if (code === EV.NAME) onNetMsg(from, content);
        };
        client.connectToRegionMaster(REGION);
      },
      send: function (obj) {
        if (!client) return;
        if (obj.t === 'c') client.raiseEvent(EV.CLICK, obj, { receivers: RCV_ALL });
        else if (obj.t === 'v') client.raiseEvent(EV.VOTE, obj, { receivers: RCV_ALL });
        else if (obj.t === 'st' || obj.t === 'cd') client.raiseEvent(EV.STATE, obj, { receivers: RCV_ALL });
        else if (obj.t === 'sc') client.raiseEvent(EV.SCORE, obj, { receivers: RCV_ALL });
        else if (obj.t === 'f') client.raiseEvent(EV.FINISH, obj, { receivers: RCV_ALL });
        else if (obj.t === 'm') client.raiseEvent(EV.CHAT, obj, { receivers: RCV_ALL });
        else if (obj.t === 'n') client.raiseEvent(EV.NAME, obj, { receivers: RCV_ALL });
      },
      leave: function () { if (client) { try { client.leaveRoom(); } catch (e) {} try { client.disconnect(); } catch (e) {} } client = null; }
    };
    return self;
  }
  function syncMaster() { isMaster = myIsMaster(); }

  // Heartbeat + реап умерших (Chat-режим)
  function startHeartbeat() {
    stopHeartbeat();
    hbTimer = setInterval(function () {
      if (players[myId]) players[myId].seen = now(); // ВАЖНО: своё seen, иначе сам «протухну»
      send({ t: 'h', n: nick });
      send({ t: 'n', n: nick }); // имя догоняет, если EV.NAME потерялся
    }, HB_MS);
    reapTimer = setInterval(function () {
      var changed = false, k;
      for (k in players) { if (k !== myId && now() - players[k].seen > STALE_MS) { delete players[k]; delete st.voters[k]; changed = true; } }
      if (changed) { recalcVotes(); if (isMasterNow()) masterSyncState(); renderAll(); }
    }, 1000);
  }
  function stopHeartbeat() { if (hbTimer) { clearInterval(hbTimer); hbTimer = null; } if (reapTimer) { clearInterval(reapTimer); reapTimer = null; } }

  // ============================ ИГРА ========================================
  function onTargetDown(e) {
    if (e && e.preventDefault) e.preventDefault();
    el.target.classList.add('press');
    if (st.phase !== PH.PLAYING) return;
    var t = now();
    clickStamps.push(t); while (clickStamps.length && t - clickStamps[0] > 1000) clickStamps.shift();
    if (clickStamps.length > CLICK_LIMIT) return;
    send({ t: 'c', n: nick });
    sfx.click();
    burst(); flyText('+1');
  }
  function onTargetUp() { if (el.target) el.target.classList.remove('press'); }

  function masterOnClick(id, nk) {
    if (!isMasterNow() || st.phase !== PH.PLAYING) return;
    var t = now();
    if (!masterClicks[id]) masterClicks[id] = [];
    var arr = masterClicks[id]; arr.push(t);
    while (arr.length && t - arr[0] > 1000) arr.shift();
    if (arr.length > CLICK_LIMIT) return;
    if (!players[id]) players[id] = { nick: nk || id, score: 0, seen: now() };
    players[id].score++;
    send({ t: 'sc', u: id, n: nk || id, s: players[id].score });
    renderAll();
  }
  function onScore(fromId, obj) {
    var key = obj.u || fromId;
    if (!players[key]) players[key] = { nick: obj.n || key, score: 0, seen: now() };
    players[key].nick = obj.n || players[key].nick;
    players[key].score = obj.s; players[key].seen = now();
    if (key === myId) flyText('+1');
    renderAll();
  }

  function onVoteClick() {
    if (!joined || st.phase === PH.PLAYING || st.voters[myId]) return;
    st.voters[myId] = true;
    send({ t: 'v', n: nick });
  }
  function masterOnVote(id, nk) {
    if (!isMasterNow() || st.phase === PH.PLAYING || st.voters[id]) return;
    st.voters[id] = true; recalcVotes();
    send({ t: 'st', ph: st.phase, end: st.endsAt, rd: st.round, vt: st.votes });
    if (st.votes >= VOTE_NEEDED) masterCountdown(); // 1 голос = мгновенный старт
  }
  // ---------------- ЧАТ АРЕНЫ ----------------
  function hhmm() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function addChatLine(who, text, mine) {
    if (!el.chatLog) return;
    var d = document.createElement('div');
    d.className = 'bt-chat-msg' + (mine ? ' me' : '');
    d.innerHTML = '<span class="t">' + hhmm() + '</span><b>' + esc(who) + '</b> ' + esc(text);
    el.chatLog.appendChild(d);
    while (el.chatLog.childNodes.length > 80) el.chatLog.removeChild(el.chatLog.firstChild);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
    if (!mine) { el.chatLog.scrollTop = el.chatLog.scrollHeight; sfx.msg(); }
  }
  function addChatSys(text) {
    if (!el.chatLog) return;
    var d = document.createElement('div');
    d.className = 'bt-chat-sys';
    d.textContent = text + ' · ' + hhmm();
    el.chatLog.appendChild(d);
    while (el.chatLog.childNodes.length > 80) el.chatLog.removeChild(el.chatLog.firstChild);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
  }
  function renderOnline() {
    var o = document.getElementById('bt-chat-online');
    if (o) o.textContent = String(aliveCount());
  }
  function sendChat() {
    if (!el.chatInput) return;
    var v = String(el.chatInput.value || '').trim();
    if (!v) return;
    el.chatInput.value = '';
    addChatLine(nick, v, true);
    send({ t: 'm', n: nick, m: v });
  }
  function recalcVotes() { var c = 0, k; for (k in st.voters) if (st.voters[k]) c++; st.votes = c; renderPhase(); }

  function aliveCount() { return aliveIds().length; }

  function masterSyncState() { if (!isMasterNow()) return; send({ t: 'st', ph: st.phase, end: st.endsAt, rd: st.round, vt: st.votes }); }
  function masterToWaiting() {
    clearTimers(); st.phase = PH.WAITING; st.voters = {}; st.votes = 0;
    st.endsAt = now() + WAIT_SEC * 1000;
    masterSyncState();
    // АВТО-РАУНД: через 30 секунд стартуем сами, без голосования
    phaseTimer = setTimeout(masterAutoStart, WAIT_SEC * 1000);
  }
  function masterAutoStart() {
    if (aliveCount() >= 1) masterToPlaying();
    else masterToWaiting(); // никого нет — ждём ещё 30с
  }
  function masterToPlaying() {
    clearTimers(); st.phase = PH.PLAYING; st.round++; st.voters = {}; st.votes = 0; masterClicks = {};
    var k; for (k in players) players[k].score = 0;
    st.endsAt = now() + ROUND_SEC * 1000;
    masterSyncState(); masterBroadcastScores();
    phaseTimer = setTimeout(masterToResults, ROUND_SEC * 1000);
  }
  function masterBroadcastScores() { var k; for (k in players) send({ t: 'sc', n: players[k].nick, s: players[k].score || 0 }); }
  function masterCountdown() {
    clearTimers(); var n = COUNTDOWN; send({ t: 'cd', n: n });
    countdownTimer = setInterval(function () {
      n--;
      if (n <= 0) { clearInterval(countdownTimer); send({ t: 'cd', n: 0 }); masterToPlaying(); }
      else send({ t: 'cd', n: n });
    }, 1000);
  }
  function masterToResults() {
    clearTimers(); st.phase = PH.RESULTS; st.endsAt = now() + RESULTS_SEC * 1000;
    var list = scoreList();
    send({ t: 'f', rd: st.round, top: list.slice(0, 5).map(function (p) { return { nick: p.nick, score: p.score }; }) });
    masterSyncState(); phaseTimer = setTimeout(masterToBreak, RESULTS_SEC * 1000);
  }
  function masterToBreak() {
    clearTimers(); st.phase = PH.BREAK; st.endsAt = now() + BREAK_SEC * 1000;
    masterSyncState(); phaseTimer = setTimeout(masterToWaiting, BREAK_SEC * 1000);
  }
  function clearTimers() {
    if (phaseTimer) { clearTimeout(phaseTimer); phaseTimer = null; }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }
  function onStateMsg(obj) {
    if (typeof obj.n === 'number') { showCountdown(obj.n); return; } // countdown
    if (obj.ph) { st.phase = obj.ph; st.endsAt = obj.end; st.round = obj.rd; st.votes = obj.vt; clearModal(); }
    renderAll();
  }
  function onFinish(obj) {
    var top = obj.top || [], html = '<h2>ИТОГИ РАУНДА ' + obj.rd + '</h2>', i;
    for (i = 0; i < top.length; i++) html += '<p>' + medal(i) + ' <b>' + esc(dispNick(top[i].nick)) + '</b> — ' + top[i].score + '</p>';
    showModal(html, RESULTS_SEC * 1000);
    sfx.end();
    if (players[myId]) { var p = getProfile(); p.rounds++; p.total += players[myId].score || 0; if ((players[myId].score || 0) > (p.best || 0)) p.best = players[myId].score; saveProfile(p); }
    renderLeaderboard();
  }
  function showCountdown(n) {
    clearModal();
    if (n > 0) sfx.tick(); else sfx.go();
    if (n <= 0) return;
    var m = document.createElement('div'); m.className = 'bt-modal';
    m.innerHTML = '<div class="bt-count">' + n + '</div>'; el.modal.appendChild(m);
    setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 900);
  }

  function showJoinProblem(title, detail) {
    joined = false; el.target.classList.add('off'); if (el.vote) el.vote.disabled = true; clearModal();
    var m = document.createElement('div'); m.className = 'bt-modal bt-fade';
    m.innerHTML = '<div class="bt-modal-in"><h2>' + esc(title) + '</h2><p>' + esc(detail) + '</p>' +
      '<p style="margin-top:18px;display:flex"><button class="bt-btn" id="bt-rj" style="flex:1">ПОВТОРИТЬ</button>' +
      '<button class="bt-btn" id="bt-rc" style="flex:1;margin-left:10px">ВЫЙТИ</button></p></div>';
    el.modal.appendChild(m);
    m.querySelector('#bt-rj').addEventListener('click', function () { clearModal(); startArena(true); });
    m.querySelector('#bt-rc').addEventListener('click', function () { clearModal(); close(); });
  }

  function pcell(v, l) { return '<div class="bt-prof-cell"><b>' + v + '</b><span>' + l + '</span></div>'; }
  function showProfile() {
    var p = getProfile();
    var avg = p.rounds ? Math.round((p.total || 0) / p.rounds) : 0;
    var lb = localLeaderboard(), rank = 0, i;
    for (i = 0; i < lb.length; i++) if (lb[i].nick === nick) { rank = i + 1; break; }
    var pct = (p.total && p.best) ? Math.round(p.best / p.total * 100) : 0;
    var html = '<button class="bt-x" id="bt-prof-x" title="Закрыть">✕</button>' +
      '<div class="bt-prof-head">' +
        '<div class="bt-prof-av">' + esc(initials(nick) || '★') + '</div>' +
        '<div><div class="bt-prof-name">' + esc(dispNick(nick)) + '</div>' +
        '<div class="bt-prof-sub">' + (rank ? 'МЕСТО #' + rank + ' В ЛИДЕРБОРДЕ' : 'СТАТИСТИКА НА ЭТОМ УСТРОЙСТВЕ') + '</div></div>' +
      '</div>' +
      '<div class="bt-prof">' +
        pcell(p.rounds || 0, 'раундов') +
        pcell(p.best || 0, 'лучший раунд') +
        pcell(p.total || 0, 'всего кликов') +
        pcell(avg, 'в среднем') +
        pcell(rank ? '#' + rank : '—', 'место') +
        pcell(pct + '%', 'лучший от суммы') +
      '</div>' +
      '<p class="bt-prof-hint">Клик по фону, ✕ или Esc — закрыть</p>';
    var m = showModal(html);
    m.addEventListener('click', function (e) { if (e.target === m) clearModal(); });
    var xb = m.querySelector('#bt-prof-x');
    if (xb) xb.addEventListener('click', function (e) { e.stopPropagation(); clearModal(); });
  }

  // ============================ OPEN/CLOSE ==================================
  function open(nickArg) {
    // Браузеры не дают звук до жеста пользователя — снимаем блок при первом клике
    document.addEventListener('pointerdown', function once() { sfx.unlock(); document.removeEventListener('pointerdown', once); }, { once: true });
    nick = String(nickArg || '').slice(0, 16) || resolveNick();
    buildUi(); root.classList.add('open'); document.body.classList.add('battle-active');
    if (window.__spCam) window.__spCam.enabled = false;
    window.__uiPaused = true;
    startBg(); renderAll(); renderLeaderboard();
    if (!nick) { el.reg.classList.add('on'); el.regErr.textContent = ''; el.regInput.value = ''; setTimeout(function () { try { el.regInput.focus(); } catch (e) {} }, 100); return; }
    startArena();
  }

  function startArena(force) {
    if (started && !force) return;
    if (force && net) { try { net.leave(); } catch (e) {} net = null; }
    started = true; startedAt = now();
    players = {}; st = { phase: PH.WAITING, endsAt: 0, round: 0, votes: 0, voters: {} };
    joined = false;
    myUid = (MODE === 'chat') ? (nick + '#arena') : nick;
    myId = myUid;
    players[myId] = { nick: nick, score: 0, seen: now() };
    net = MODE === 'chat' ? createChatNet() : createRealtimeNet();
    el.info.textContent = 'Подключение (' + MODE + ')…';
    net.join();

    if (uiTimer) clearInterval(uiTimer);
    uiTimer = setInterval(function () {
      renderClock(); renderSlots(); renderScores();
      if (MODE === 'realtime' && net && net.refresh) net.refresh();
      var mNow = isMasterNow();
      // Хост сам ЗАПУСКАЕТ цикл: если я мастер и раунд не идёт — стартую ожидание
      if (mNow && !st.endsAt) { masterToWaiting(); return; }
      if (mNow && st.endsAt && now() > st.endsAt + 500) {
        if (st.phase === PH.PLAYING) masterToResults();
        else if (st.phase === PH.RESULTS) masterToBreak();
        else if (st.phase === PH.BREAK) masterToWaiting();
        else if (st.phase === PH.WAITING) masterAutoStart(); // страховка, если таймер не сработал
      }
      if (MODE === 'chat' && mNow && st.phase === PH.WAITING) {
        // синхронизируем состояние раз в секунду, а не 4 раза
        if (now() - syncTick > 1000) { syncTick = now(); masterSyncState(); }
      }
    }, 250);
  }

  function close() {
    try { if (players[myId]) saveProfile(getProfile()); } catch (e) {}
    if (uiTimer) { clearInterval(uiTimer); uiTimer = null; }
    stopHeartbeat(); clearTimers(); stopBg();
    if (net) { try { net.leave(); } catch (e) {} net = null; }
    started = false; joined = false; isMaster = false;
    players = {}; st = { phase: PH.WAITING, endsAt: 0, round: 0, votes: 0, voters: {} };
    _h = { slots: '', scores: '', phase: '', clock: '', info: '' };
    if (root) root.classList.remove('open');
    if (el.reg) el.reg.classList.remove('on');
    document.body.classList.remove('battle-active');
    if (window.__spCam) window.__spCam.enabled = true;
    window.__uiPaused = false;
    clearModal();
  }

  window.BattleRoom = { open: open, close: close, mode: MODE };
  console.log('[battle] v3, режим:', MODE, MODE === 'chat' ? '(Chat App ID — работает сразу)' : '(Realtime App ID)');
})();
