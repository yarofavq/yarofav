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
    for (n in all) arr.push({ nick: n, total: all[n].total || 0, best: all[n].best || 0 });
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
      '#battle-root{position:fixed;inset:0;z-index:9900;display:none;flex-direction:column;color:#dff3ff;font-family:"Segoe UI",system-ui,-apple-system,sans-serif;overflow:hidden;',
        'background:radial-gradient(1200px 700px at 15% -10%,#12224d 0%,transparent 60%),radial-gradient(900px 600px at 90% 10%,#3a1550 0%,transparent 55%),radial-gradient(1000px 800px at 50% 120%,#05243a 0%,transparent 60%),#04060f}',
      '#battle-root.open{display:flex;animation:btIn .4s cubic-bezier(.2,.9,.3,1.1)}',
      '#bt-bg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}',
      '#battle-root>.bt-top,#battle-root>.bt-slots,#battle-root>.bt-body,#battle-root>.bt-bottom{position:relative;z-index:2}',
      '#battle-root::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(60% 40% at 20% 8%,rgba(0,229,255,.10),transparent 60%),radial-gradient(50% 40% at 85% 14%,rgba(139,92,255,.13),transparent 60%),radial-gradient(70% 50% at 50% 112%,rgba(255,92,176,.09),transparent 60%);animation:btAurora 15s ease-in-out infinite alternate}',
      '@keyframes btAurora{from{opacity:.65;transform:scale(1)}to{opacity:1;transform:scale(1.07)}}',
      '@keyframes btIn{from{opacity:0;transform:scale(1.02)}}',
      '.bt-top{display:flex;align-items:center;gap:14px;padding:14px 22px;background:rgba(8,16,32,.55);backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,229,255,.25)}',
      '.bt-title{flex:1;font-size:17px;letter-spacing:5px;font-weight:700;background:linear-gradient(90deg,#00e5ff,#8b5cff 60%,#ff5cb0);-webkit-background-clip:text;background-clip:text;color:transparent}',
      '.bt-phase{font-size:11px;letter-spacing:3px;padding:6px 14px;border-radius:20px;color:#a9f0ff;border:1px solid rgba(0,229,255,.45);background:rgba(0,229,255,.08)}',
      '.bt-exit{background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.4);color:#bfeeff;padding:8px 18px;border-radius:10px;cursor:pointer;letter-spacing:1.5px;font-size:12px;transition:.2s}',
      '.bt-exit:hover{border-color:#00e5ff;box-shadow:0 0 18px rgba(0,229,255,.5);transform:translateY(-1px)}',
      '.bt-slots{display:flex;gap:12px;padding:16px 22px}',
      '.bt-slot{flex:1;min-width:0;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:#5f7f94;padding:0 10px;border:1px dashed rgba(0,229,255,.22);background:rgba(0,229,255,.03);transition:.25s;overflow:hidden}',
      '.bt-slot.on{color:#eafcff;border-style:solid;border-color:rgba(139,92,255,.55);background:linear-gradient(160deg,rgba(139,92,255,.16),rgba(0,229,255,.06))}',
      '.bt-slot.me{border-color:#00e5ff;box-shadow:0 0 20px rgba(0,229,255,.45)}',
      '.bt-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#04121c;flex:0 0 auto;background:linear-gradient(135deg,#00e5ff,#8b5cff)}',
      '.bt-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.bt-body{flex:1;display:flex;min-height:0}',
      '.bt-stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}',
      '.bt-clockwrap{position:relative;width:210px;height:210px;display:flex;align-items:center;justify-content:center}',
      '.bt-ring{position:absolute;inset:0;width:210px;height:210px;transform:rotate(-90deg)}',
      '.bt-ring-bg{fill:none;stroke:rgba(0,229,255,.12);stroke-width:4}',
      '.bt-ring-fg{fill:none;stroke:#00e5ff;stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset .35s linear,stroke .3s;filter:drop-shadow(0 0 8px rgba(0,229,255,.9))}',
      '.bt-ring-fg.low{stroke:#ff5b7a}',
      '.bt-clock{font-size:52px;font-weight:200;letter-spacing:2px;color:#eafcff;text-shadow:0 0 26px rgba(0,229,255,.6)}',
      '.bt-clock.low{color:#ff8098}',
      '.bt-info{font-size:13px;color:#82a7bb;margin-top:14px;letter-spacing:1.5px;min-height:18px}',
      '#bt-target{margin-top:24px;width:190px;height:190px;border-radius:50%;cursor:pointer;user-select:none;position:relative;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#04121c;letter-spacing:2px;background:radial-gradient(circle at 34% 28%,#8b5cff 0%,#00b4e6 42%,#062033 100%);box-shadow:0 0 46px rgba(0,229,255,.6),0 0 90px rgba(139,92,255,.35),inset 0 0 40px rgba(255,255,255,.28);transition:transform .07s ease}',
      '#bt-target::after{content:"";position:absolute;inset:-10px;border-radius:50%;border:1px solid rgba(0,229,255,.35);animation:btPulse 2.2s ease-out infinite}',
      '@keyframes btPulse{0%{transform:scale(.94);opacity:.8}70%{transform:scale(1.12);opacity:0}100%{opacity:0}}',
      '#bt-target:active,#bt-target.press{transform:scale(.9)}',
      '#bt-target.off{filter:grayscale(1) brightness(.42);cursor:not-allowed;box-shadow:none}',
      '#bt-target.off::after{display:none}',
      '.bt-fly{position:absolute;font-size:20px;font-weight:800;color:#8dffb8;pointer-events:none;text-shadow:0 0 12px rgba(125,255,176,.9);animation:btFly 1s ease-out forwards}',
      '@keyframes btFly{to{transform:translateY(-96px) scale(1.35);opacity:0}}',
      '.bt-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#8dffb8;box-shadow:0 0 10px #8dffb8;pointer-events:none;animation:btSpark .6s ease-out forwards}',
      '@keyframes btSpark{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}',
      '.bt-side{width:250px;border-left:1px solid rgba(0,229,255,.18);padding:18px;overflow-y:auto;background:rgba(6,12,24,.4);backdrop-filter:blur(6px)}',
      '.bt-side h3{font-size:11px;letter-spacing:3px;color:#5f7f94;margin:0 0 12px;font-weight:600}',
      '.bt-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;margin-bottom:6px;font-size:14px;background:rgba(0,229,255,.05);border:1px solid transparent;transition:.25s}',
      '.bt-row.me{background:rgba(0,229,255,.16);border-color:rgba(0,229,255,.4)}',
      '.bt-row .r{width:22px;text-align:center;color:#9fe6ff;font-weight:700}',
      '.bt-row .n{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.bt-row .c{font-weight:800;color:#fff}',
      '.bt-bottom{display:flex;gap:12px;padding:14px 22px;border-top:1px solid rgba(0,229,255,.18);background:rgba(8,16,32,.5);backdrop-filter:blur(12px)}',
      '.bt-btn{flex:1;background:linear-gradient(160deg,rgba(0,229,255,.14),rgba(139,92,255,.1));border:1px solid rgba(0,229,255,.4);color:#dff3ff;padding:13px;border-radius:12px;cursor:pointer;letter-spacing:1.5px;font-size:13px;transition:.2s}',
      '.bt-btn:hover{border-color:#00e5ff;box-shadow:0 0 20px rgba(0,229,255,.45)}',
      '.bt-btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}',
      '.bt-modal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,5,12,.8);backdrop-filter:blur(4px);z-index:5}',
      '.bt-modal-in{background:linear-gradient(160deg,#0e1533,#05070f);border:1px solid rgba(0,229,255,.35);border-radius:18px;padding:30px 36px;min-width:320px;max-width:min(560px,92vw);box-shadow:0 28px 80px rgba(0,0,0,.75)}',
      '.bt-modal-in h2{margin:0 0 16px;font-size:18px;letter-spacing:3px;color:#9fe6ff}',
      '.bt-modal-in p{margin:8px 0;font-size:14px;color:#b9d6e2}',
      '.bt-modal-in b{color:#fff}',
      '.bt-fade{animation:btFade .35s ease}',
      '@keyframes btFade{from{opacity:0;transform:translateY(10px)}}',
      '.bt-count{font-size:140px;font-weight:900;color:#fff;text-shadow:0 0 50px rgba(0,229,255,.95);animation:btCount .9s ease}',
      '@keyframes btCount{from{transform:scale(2);opacity:0}}',
      '#bt-register{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:9;background:rgba(2,5,12,.9);backdrop-filter:blur(6px)}',
      '#bt-register.on{display:flex}',
      '.bt-reg-box{background:linear-gradient(160deg,#0e1533,#05070f);border:1px solid rgba(0,229,255,.4);border-radius:20px;padding:34px 38px;width:min(420px,92vw);text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.8)}',
      '.bt-reg-box h2{margin:0 0 8px;font-size:19px;letter-spacing:3px;color:#9fe6ff}',
      '.bt-reg-box p{margin:0 0 20px;font-size:13px;color:#7fa6b8;line-height:1.5}',
      '#bt-reg-input{width:100%;box-sizing:border-box;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.35);border-radius:12px;padding:14px 16px;color:#eafcff;font-size:15px;outline:none}',
      '#bt-reg-btn{margin-top:16px;width:100%;padding:14px;border-radius:12px;cursor:pointer;border:1px solid rgba(0,229,255,.5);color:#04121c;font-weight:700;letter-spacing:2px;font-size:14px;background:linear-gradient(135deg,#00e5ff,#8b5cff)}',
      '.bt-reg-err{margin-top:12px;font-size:12px;color:#ff8098;min-height:16px}',
      '.bt-btn-acc{background:linear-gradient(135deg,#00e5ff,#8b5cff)!important;color:#04121c!important;font-weight:800!important;border:0!important}',
      '.bt-row.top{background:linear-gradient(90deg,rgba(255,215,0,.18),rgba(0,229,255,.06));border-color:rgba(255,215,0,.5)}',
      '.bt-row.top .c{color:#ffe45b}',
      '.bt-chat{height:150px;overflow-y:auto;background:rgba(0,0,0,.28);border:1px solid rgba(0,229,255,.18);border-radius:10px;padding:8px;font-size:12.5px;line-height:1.45}',
      '.bt-chat-msg{margin-bottom:6px;word-wrap:break-word;color:#b9d6e2}',
      '.bt-chat-msg .t{font-size:10px;color:#4d6b7d;margin-right:5px}',
      '.bt-chat-sys{color:#7fa6b8;font-style:italic;font-size:11.5px;text-align:center;margin:6px 0;opacity:.8}',
      '.bt-online{display:inline-block;min-width:16px;padding:1px 6px;margin-left:6px;border-radius:9px;font-size:10px;background:rgba(0,229,255,.16);color:#8fe9ff;border:1px solid rgba(0,229,255,.3)}',
      '#bt-chat-send.badge{position:relative;animation:btPulseBtn 1s ease infinite}',
      '@keyframes btPulseBtn{50%{box-shadow:0 0 14px rgba(0,229,255,.9)}}',
      '.bt-chat-msg b{color:#8fe9ff}',
      '.bt-chat-msg.me b{color:#8dffb8}',
      '.bt-chat-in{display:flex;gap:6px;margin-top:8px}',
      '#bt-chat-input{flex:1;min-width:0;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.3);border-radius:8px;padding:8px 10px;color:#eafcff;font-size:12.5px;outline:none}',
      '#bt-chat-input:focus{border-color:#00e5ff;box-shadow:0 0 14px rgba(0,229,255,.3)}',
      '#bt-chat-send{background:linear-gradient(135deg,#00e5ff,#8b5cff);border:0;border-radius:8px;color:#04121c;font-weight:800;padding:0 12px;cursor:pointer}',
      '@media (max-width:760px){.bt-body{flex-direction:column}.bt-side{width:auto;border-left:0;border-top:1px solid rgba(0,229,255,.18);max-height:38vh}.bt-clockwrap{width:170px;height:170px}.bt-ring{width:170px;height:170px}.bt-clock{font-size:42px}#bt-target{width:150px;height:150px;font-size:20px}.bt-chat{height:96px}}'
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
      '<div class="bt-top">',
        '<span class="bt-title">КЛИКЕР-АРЕНА</span>',
        '<span class="bt-phase" id="bt-phase">ОЖИДАНИЕ</span>',
        '<button class="bt-exit" id="bt-exit">ВЫЙТИ</button>',
      '</div>',
      '<div class="bt-slots" id="bt-slots"></div>',
      '<div class="bt-body">',
        '<div class="bt-stage" id="bt-stage">',
          '<div class="bt-clockwrap">',
            '<svg class="bt-ring" viewBox="0 0 120 120"><circle class="bt-ring-bg" cx="60" cy="60" r="54"></circle>',
            '<circle class="bt-ring-fg" id="bt-ring" cx="60" cy="60" r="54" stroke-dasharray="339.29" stroke-dashoffset="339.29"></circle></svg>',
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
    ].join('');
    document.body.appendChild(root);

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

    root.querySelector('#bt-exit').addEventListener('click', close);
    el.vote.addEventListener('click', onVoteClick);
    el.profile.addEventListener('click', showProfile);
    el.target.addEventListener('pointerdown', onTargetDown);
    el.target.addEventListener('pointerup', onTargetUp);
    el.target.addEventListener('pointerleave', onTargetUp);
    el.regBtn.addEventListener('click', submitRegister);
    el.regInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitRegister(); });
    el.chatSend.addEventListener('click', sendChat);
    el.chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChat(); });
  }

  function showModal(html, autoCloseMs) {
    var m = document.createElement('div'); m.className = 'bt-modal bt-fade';
    m.innerHTML = '<div class="bt-modal-in">' + html + '</div>';
    el.modal.appendChild(m);
    if (autoCloseMs) setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, autoCloseMs);
    return m;
  }
  function clearModal() { if (el.modal) el.modal.innerHTML = ''; }

  var PHASE_LABEL = { WAITING: 'ОЖИДАНИЕ', PLAYING: 'РАУНД', RESULTS: 'РЕЗУЛЬТАТЫ', BREAK: 'ПЕРЕРЫВ' };
  function initials(n) { return esc(String(n || '?').slice(0, 2).toUpperCase()); }

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
      html += '<div class="' + cls + '">' + (p ? '<span class="bt-av">' + initials(p.nick) + '</span><span class="bt-nm">' + esc(p.nick) + '</span>' : '— свободно —') + '</div>';
    }
    if (html !== _h.slots) { _h.slots = html; el.slots.innerHTML = html; }
    renderOnline();
  }
  function renderScores() {
    if (!el.scores) return;
    var list = scoreList(), html = '', i;
    for (i = 0; i < list.length; i++) {
      var cls = 'bt-row' + (list[i].id === myId ? ' me' : '') + (i === 0 && list[i].score > 0 ? ' top' : '');
      html += '<div class="' + cls + '"><span class="r">' + medal(i) + '</span><span class="n">' + esc(list[i].nick) + '</span><span class="c">' + list[i].score + '</span></div>';
    }
    html = html || '<div class="bt-row">пусто</div>';
    if (html !== _h.scores) { _h.scores = html; el.scores.innerHTML = html; }
  }
  function renderLeaderboard() {
    if (!el.board) return;
    getLeaderboard(function (top) {
      var html = '', i;
      for (i = 0; i < top.length; i++) html += '<div class="bt-row"><span class="r">' + medal(i) + '</span><span class="n">' + esc(top[i].nick) + '</span><span class="c">' + (top[i].total || 0) + '</span></div>';
      el.board.innerHTML = html || '<div class="bt-row">пока нет данных</div>';
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
  var IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  var bg = { raf: 0, stars: [], clouds: [], t: 0, cv: null, ctx: null, W: 0, H: 0, dpr: 1 };
  function bgSize() {
    var cv = bg.cv; if (!cv) return;
    bg.W = window.innerWidth; bg.H = window.innerHeight;
    cv.width = Math.floor(bg.W * bg.dpr); cv.height = Math.floor(bg.H * bg.dpr);
    cv.style.width = bg.W + 'px'; cv.style.height = bg.H + 'px';
    bg.ctx.setTransform(bg.dpr, 0, 0, bg.dpr, 0, 0);
  }
  function startBg() {
    var cv = root && root.querySelector('#bt-bg'); if (!cv || bg.raf) return;
    bg.cv = cv; bg.ctx = cv.getContext('2d'); bg.dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1 : 2);
    bgSize(); window.addEventListener('resize', bgSize);
    var i, n = IS_MOBILE ? 90 : 190;
    bg.stars.length = 0;
    for (i = 0; i < n; i++) bg.stars.push({ x: Math.random(), y: Math.random(), r: 0.3 + Math.random() * 1.3, p: Math.random() * 6.283, s: 0.4 + Math.random() * 1.7 });
    var cn = IS_MOBILE ? 3 : 5, cols = ['0,229,255', '139,92,255', '255,92,176', '90,255,200', '255,180,90'];
    bg.clouds.length = 0;
    for (i = 0; i < cn; i++) bg.clouds.push({ x: Math.random(), y: Math.random(), r: 0.25 + Math.random() * 0.30, c: cols[i % cols.length], a: 0.05 + Math.random() * 0.07, vx: (Math.random() - 0.5) * 0.00009, vy: (Math.random() - 0.5) * 0.00009 });
    bg.t = 0; bgLoop();
  }
  function stopBg() { if (bg.raf) { cancelAnimationFrame(bg.raf); bg.raf = 0; } window.removeEventListener('resize', bgSize); }
  function bgLoop() {
    var cv = bg.cv, ctx = bg.ctx; if (!cv || !ctx) return;
    bg.raf = requestAnimationFrame(bgLoop); bg.t += 0.016;
    var W = bg.W, H = bg.H, i; ctx.clearRect(0, 0, W, H);
    for (i = 0; i < bg.clouds.length; i++) {
      var c = bg.clouds[i]; c.x += c.vx; c.y += c.vy;
      if (c.x < -0.25) c.x = 1.25; if (c.x > 1.25) c.x = -0.25;
      if (c.y < -0.25) c.y = 1.25; if (c.y > 1.25) c.y = -0.25;
      var rr = Math.max(W, H) * c.r * (0.92 + 0.08 * Math.sin(bg.t * 0.5 + i));
      var g = ctx.createRadialGradient(c.x * W, c.y * H, 0, c.x * W, c.y * H, rr);
      g.addColorStop(0, 'rgba(' + c.c + ',' + c.a + ')'); g.addColorStop(1, 'rgba(' + c.c + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x * W, c.y * H, rr, 0, 6.283); ctx.fill();
    }
    var bhx = W * 0.5, bhy = H * 0.52, bhr = Math.min(W, H) * 0.10;
    var ring = ctx.createRadialGradient(bhx, bhy, bhr * 0.55, bhx, bhy, bhr * 2.4);
    ring.addColorStop(0, 'rgba(255,180,90,0.22)'); ring.addColorStop(0.35, 'rgba(255,90,140,0.10)'); ring.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(bhx, bhy, bhr * 2.4, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.beginPath(); ctx.arc(bhx, bhy, bhr, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,120,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bhx, bhy, bhr * 1.12, 0, 6.283); ctx.stroke();
    for (i = 0; i < bg.stars.length; i++) {
      var stx = bg.stars[i], a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(bg.t * stx.s + stx.p));
      ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(stx.x * W, stx.y * H, stx.r, 0, 6.283); ctx.fill();
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
    else if (isNew) addChatSys(nk + ' зашёл в арену');
    renderAll();
  }
  function onNetLeave(id) {
    if (players[id] && players[id].nick) addChatSys(players[id].nick + ' покинул арену');
    delete players[id]; delete st.voters[id];
    recalcVotes();
    if (isMasterNow()) masterSyncState();
    renderAll();
  }
  function onNetMsg(fromId, obj) {
    if (!obj || !obj.t) return;
    if (players[fromId]) players[fromId].seen = now();
    switch (obj.t) {
      case 'h': onNetJoin(fromId, obj.n); break;
      case 'j': onNetJoin(fromId, obj.n); if (isMasterNow()) masterSyncState(); break;
      case 'c': if (isMasterNow()) masterOnClick(fromId, obj.n); break;
      case 'sc': onScore(fromId, obj); break;
      case 'v': if (isMasterNow()) masterOnVote(fromId, obj.n); break;
      case 'st': onStateMsg(obj); break;
      case 'm': addChatLine(obj.n || fromId, obj.m, false); break;
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
    var EV = { CLICK: 11, VOTE: 12, STATE: 13, SCORE: 14, FINISH: 15, CHAT: 16 };
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
          joined = true; myId = nick;
          try { client.myActor().setName(nick); } catch (e) {}
          try { self.actorNr = client.myActor().actorNr; self.roomMasterNr = client.myRoomMasterActorNr(); } catch (e) {}
          console.log('[battle-rt] вошёл в', ROOM_NAME, 'actorNr=' + self.actorNr, 'master=' + self.roomMasterNr);
          var act = client.myRoomActorsArray() || [], i;
          for (i = 0; i < act.length; i++) onNetJoin(act[i].name || ('#' + act[i].actorNr), act[i].name || ('#' + act[i].actorNr));
          onNetJoin(nick, nick); syncMaster(); renderLeaderboard();
        };
        client.onActorJoin = function (a) { var n = a.name || ('#' + a.actorNr); onNetJoin(n, n); self.refresh(); syncMaster(); };
        client.onActorLeave = function (a) { onNetLeave(a.name || ('#' + a.actorNr)); self.refresh(); syncMaster(); };
        client.onEvent = function (code, content, actorNr) {
          var from = '#' + actorNr;
          try { var act = client.myRoomActorsArray() || []; for (var i = 0; i < act.length; i++) if (act[i].actorNr === actorNr) from = act[i].name || from; } catch (e) {}
          if (code === EV.CLICK) onNetMsg(from, { t: 'c', n: from });
          else if (code === EV.VOTE) onNetMsg(from, { t: 'v', n: from });
          else if (code === EV.STATE) onNetMsg(from, content);
          else if (code === EV.SCORE) onNetMsg(from, content);
          else if (code === EV.FINISH) onNetMsg(from, content);
          else if (code === EV.CHAT) { if (actorNr !== self.actorNr) onNetMsg(from, content); } // свои уже показали локально
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
    // Автоскролл вниз, если сообщение не своё
    if (!mine) el.chatLog.scrollTop = el.chatLog.scrollHeight;
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
    for (i = 0; i < top.length; i++) html += '<p>' + medal(i) + ' <b>' + esc(top[i].nick) + '</b> — ' + top[i].score + '</p>';
    showModal(html, RESULTS_SEC * 1000);
    if (players[myId]) { var p = getProfile(); p.rounds++; p.total += players[myId].score || 0; if ((players[myId].score || 0) > (p.best || 0)) p.best = players[myId].score; saveProfile(p); }
    renderLeaderboard();
  }
  function showCountdown(n) {
    clearModal(); if (n <= 0) return;
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

  function showProfile() {
    var p = getProfile();
    var m = showModal('<h2>ПРОФИЛЬ · ' + esc(nick) + '</h2><p>Сыграно раундов: <b>' + (p.rounds || 0) + '</b></p><p>Лучший результат: <b>' + (p.best || 0) + '</b></p><p>Всего накликано: <b>' + (p.total || 0) + '</b></p><p style="color:#5f7f94;font-size:12px;margin-top:14px">Нажми, чтобы закрыть</p>');
    m.addEventListener('click', clearModal);
  }

  // ============================ OPEN/CLOSE ==================================
  function open(nickArg) {
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
