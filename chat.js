// ==================== PHOTON CHAT ====================
(function () {
'use strict';
var APP_ID = '90811467-76f1-400a-b211-eb58e6d08c08';
var CHANNEL = 'global';
var NICK_KEY = 'spaceChatNick';
var client = null;
var nick = '';
var lastSeen = {};
var subscribed = false;
var subAttempt = 0;
var subResultGot = false;
var reconnectTries = 0;
var lastSend = 0;

function el(tag, id, cls, txt) {
  var e = document.createElement(tag);
  if (id) e.id = id;
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}
var styleEl = document.createElement('style');
document.head.appendChild(styleEl);
function cssAdd(s) { styleEl.textContent += s; }
cssAdd('#chat-open-btn{position:fixed;left:18px;bottom:174px;z-index:9400;width:58px;height:58px;border-radius:16px;border:1px solid rgba(255,90,90,.55);background:linear-gradient(145deg,#2a070b,#120406);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.55),0 0 18px rgba(220,40,40,.35);transition:transform .18s,box-shadow .18s;display:flex;align-items:center;justify-content:center;}');
cssAdd('#chat-open-btn:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 12px 30px rgba(0,0,0,.6),0 0 30px rgba(255,60,60,.6);}');
cssAdd('#chat-open-btn:active{transform:scale(.9);}');
cssAdd('#chat-win{position:fixed;left:18px;bottom:244px;z-index:9410;width:min(340px,92vw);height:420px;max-height:70vh;display:none;flex-direction:column;background:rgba(11,4,6,.82);border:1px solid rgba(255,70,70,.4);border-radius:18px;overflow:hidden;font-family:Georgia,Times New Roman,serif;box-shadow:0 24px 60px rgba(0,0,0,.7),0 0 40px rgba(180,20,20,.22);animation:chIn .25s ease;}');
cssAdd('#chat-bg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;}');
cssAdd('#chat-win.open{display:flex;}');
cssAdd('@keyframes chIn{from{transform:translateY(16px) scale(.95);opacity:0}}');
cssAdd('#chat-head{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid rgba(255,70,70,.3);background:linear-gradient(90deg,rgba(60,8,12,.92),rgba(20,5,8,.92));position:relative;z-index:2;}');
cssAdd('#chat-title{color:#ff9a9a;font-weight:700;font-size:14px;letter-spacing:2px;display:flex;align-items:center;text-shadow:0 0 10px rgba(255,60,60,.5);}');
cssAdd('#chat-status{width:9px;height:9px;border-radius:50%;background:#4a4a4a;display:inline-block;margin-right:7px;}');
cssAdd('#chat-status.on{background:#ff3b4f;box-shadow:0 0 10px #ff3b4f;}');
cssAdd('#chat-online{color:#c98a8a;font-size:12px;margin-left:auto;}');
cssAdd('#chat-close{background:none;border:none;color:#c98a8a;font-size:15px;cursor:pointer;padding:2px 8px;font-family:inherit;border-radius:6px;transition:background .15s,color .15s;}');
cssAdd('#chat-close:hover{background:rgba(255,60,60,.15);color:#ff6b6b;}');
cssAdd('#chat-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:7px;background:transparent;position:relative;z-index:1;}');
cssAdd('#chat-msgs::-webkit-scrollbar{width:7px;}');
cssAdd('#chat-msgs::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8f1020,#4a0810);border-radius:4px;}');
cssAdd('.ch-msg{background:linear-gradient(135deg,rgba(38,10,14,.9),rgba(18,6,9,.9));border:1px solid rgba(255,80,80,.22);border-radius:14px 4px 14px 4px;padding:7px 11px;font-size:13.5px;color:#f0dfe0;line-height:1.5;overflow-wrap:anywhere;transition:transform .2s,border-color .2s;}');
cssAdd('.ch-msg:nth-child(odd){transform:rotate(-.4deg);}');
cssAdd('.ch-msg:nth-child(even){transform:rotate(.35deg);}');
cssAdd('.ch-msg:hover{transform:rotate(0deg) scale(1.015);border-color:rgba(255,90,90,.5);}');
cssAdd('.ch-msg b{color:#ff7a7a;text-shadow:0 0 8px rgba(255,60,60,.35);font-style:italic;}');
cssAdd('.ch-wave{font-weight:700;font-size:15px;}');
cssAdd('.ch-wave span span{display:inline-block;animation:chBob 1.5s ease-in-out infinite;}');
cssAdd('@keyframes chBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}');
cssAdd('.ch-msg .ch-t{color:#7a5a5e;font-size:11px;margin-right:6px;}');
cssAdd('.ch-msg.ch-sys{border-color:rgba(255,120,90,.3);color:#ffb39a;background:rgba(40,12,8,.55);font-size:12px;}');
cssAdd('.ch-msg.ch-me{border-color:rgba(255,60,60,.55);background:linear-gradient(135deg,rgba(70,12,18,.95),rgba(30,7,10,.95));}');
cssAdd('.ch-s{display:inline-block;font-weight:700;font-size:15px;animation:chColor 6s steps(1) infinite;}');
cssAdd('@keyframes chColor{0%{color:#ff5b5b}16.6%{color:#ffa14f}33.3%{color:#ffe45b}50%{color:#7dff8f}66.6%{color:#5bc9ff}83.3%{color:#c95bff}100%{color:#ff5b5b}}');
cssAdd('#chat-nickbar,#chat-sendbar{display:none;padding:10px 12px;border-top:1px solid rgba(255,70,70,.3);gap:8px;background:rgba(16,5,8,.8);position:relative;z-index:2;}');
cssAdd('#chat-nickbar.open,#chat-sendbar.open{display:flex;}');
cssAdd('#chat-nickinput,#chat-input{flex:1;min-width:0;background:#120608;border:1px solid #5a1a22;border-radius:9px;color:#ffe9e9;padding:9px 11px;font-family:inherit;font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s;}');
cssAdd('#chat-input:focus,#chat-nickinput:focus{border-color:#e03040;box-shadow:0 0 10px rgba(255,50,60,.3);}');
cssAdd('#chat-nick-btn{background:linear-gradient(135deg,#8f1020,#4a0810);border:1px solid rgba(255,90,90,.4);border-radius:9px;color:#ffd9d9;font-weight:700;padding:9px 14px;cursor:pointer;font-family:inherit;transition:filter .15s,transform .15s;}');
cssAdd('#chat-send{background:linear-gradient(135deg,#d41430,#7a0a1c);border:1px solid rgba(255,120,120,.45);border-radius:9px;color:#fff;font-weight:700;padding:9px 14px;cursor:pointer;font-family:inherit;transition:filter .15s,transform .15s;box-shadow:0 4px 14px rgba(200,20,40,.35);}');
cssAdd('#chat-nick-btn:hover,#chat-send:hover{filter:brightness(1.18);transform:translateY(-1px);}');
cssAdd('#chat-nick-btn:active,#chat-send:active{transform:scale(.94);}');
var btn = el('button', 'chat-open-btn', 'clicker-ui');
btn.title = 'Чат';
btn.innerHTML = "<svg viewBox='0 0 24 24' width='26' height='26' fill='none' stroke='#ff6b6b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path></svg>";
document.body.appendChild(btn);
var win = el('div', 'chat-win', 'clicker-ui');
var head = el('div', 'chat-head');
var ttl = el('div', 'chat-title');
ttl.appendChild(el('span', 'chat-status'));
ttl.appendChild(document.createTextNode('ЧАТ \u2740'));
head.appendChild(ttl);
var onlineEl = el('span', 'chat-online', '', 'в сети: -');
head.appendChild(onlineEl);
var closeB = el('button', 'chat-close', '', 'X');
head.appendChild(closeB);
var msgs = el('div', 'chat-msgs');
var nickbar = el('div', 'chat-nickbar');
var nickInput = el('input', 'chat-nickinput');
nickInput.placeholder = 'Ник (2-16 символов)';
nickInput.maxLength = 16;
var nickGo = el('button', 'chat-nick-btn', '', 'ВОЙТИ');
nickbar.appendChild(nickInput);
nickbar.appendChild(nickGo);
var sendbar = el('div', 'chat-sendbar');
var input = el('input', 'chat-input');
input.placeholder = 'Сообщение...';
input.maxLength = 200;
var sendBtn = el('button', 'chat-send', '', 'Отправить');
sendbar.appendChild(input);
sendbar.appendChild(sendBtn);
win.appendChild(head);
win.appendChild(msgs);
win.appendChild(nickbar);
win.appendChild(sendbar);
document.body.appendChild(win);
var bg = el('canvas', 'chat-bg');
win.insertBefore(bg, win.firstChild);
var bctx = bg.getContext('2d');
var treeC = document.createElement('canvas');
var petals = [];
function timeStr() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function addMsg(sender, text, cls) {
  var d = el('div', '', 'ch-msg' + (cls ? ' ' + cls : ''));
  d.appendChild(el('span', '', 'ch-t', timeStr()));
  if (sender) d.appendChild(el('b', '', '', sender + ': '));
  if (text.length > 3 && text.slice(0, 3) === '/s ') {
    var body = text.slice(3);
    for (var wi = 0; wi < body.length; wi++) {
      var sp = document.createElement('span');
      sp.className = 'ch-s';
      sp.textContent = body[wi] === ' ' ? '\u00A0' : body[wi];
      sp.style.animationDelay = (wi * 0.08).toFixed(2) + 's';
      d.appendChild(sp);
    }
  } else {
    d.appendChild(document.createTextNode(text));
  }
  msgs.appendChild(d);
  while (msgs.children.length > 120) msgs.removeChild(msgs.firstChild);
  msgs.scrollTop = msgs.scrollHeight;
}
function sys(text) { addMsg('', text, 'ch-sys'); }
function sizeBg() {
  bg.width = win.clientWidth || 320;
  bg.height = win.clientHeight || 400;
  var w = bg.width, h = bg.height;
  treeC.width = w; treeC.height = h;
  var t = treeC.getContext('2d');
  t.strokeStyle = '#4a2b31';
  t.lineCap = 'round';
  function fl(fx, fy, fr) {
    var cs = ['#ffb7c9', '#ff9db6', '#ffd6e0', '#ff8fae'];
    for (var p = 0; p < 5; p++) {
      var a = p / 5 * 6.283 + Math.random();
      t.fillStyle = cs[(Math.random() * 4) | 0];
      t.beginPath();
      t.arc(fx + Math.cos(a) * fr * 0.7, fy + Math.sin(a) * fr * 0.7, fr * 0.75, 0, 6.283);
      t.fill();
    }
    t.fillStyle = '#ffe9a8';
    t.beginPath();
    t.arc(fx, fy, fr * 0.32, 0, 6.283);
    t.fill();
  }
  function limb(x, y, ang, len, wd, d) {
    if (d > 4 || len < 9) { fl(x, y, 4 + Math.random() * 3); return; }
    var nx = x + Math.cos(ang) * len, ny = y + Math.sin(ang) * len;
    t.lineWidth = wd;
    t.beginPath();
    t.moveTo(x, y);
    t.quadraticCurveTo(x + Math.cos(ang - 0.3) * len * 0.55, y + Math.sin(ang - 0.3) * len * 0.55, nx, ny);
    t.stroke();
    var n = 2 + (Math.random() > 0.45 ? 1 : 0);
    for (var i = 0; i < n; i++) limb(nx, ny, ang + (Math.random() - 0.55) * 0.95, len * (0.58 + Math.random() * 0.2), wd * 0.62, d + 1);
    if (d >= 2) fl(x + (nx - x) * 0.5, y + (ny - y) * 0.5, 3 + Math.random() * 2.5);
  }
  limb(w * 0.9, h + 4, -1.45, h * 0.32, 9, 0);
  limb(w * 0.82, h + 4, -1.9, h * 0.25, 7, 1);
  petals = [];
  for (var i = 0; i < 24; i++) {
    petals.push({ x: w * (0.4 + Math.random() * 0.6), y: Math.random() * h, s: 2.5 + Math.random() * 3.5, vy: 0.3 + Math.random() * 0.55, ph: Math.random() * 6.283, sp: 0.012 + Math.random() * 0.02, r: Math.random() * 6.283, vr: (Math.random() - 0.5) * 0.05 });
  }
}
(function sakuraLoop() {
  requestAnimationFrame(sakuraLoop);
  if (!win.classList.contains('open')) return;
  if (!bg.width) sizeBg();
  bctx.clearRect(0, 0, bg.width, bg.height);
  bctx.drawImage(treeC, 0, 0);
  for (var i = 0; i < petals.length; i++) {
    var p = petals[i];
    p.ph += p.sp;
    p.x += Math.sin(p.ph) * 0.6 - 0.15;
    p.y += p.vy;
    p.r += p.vr;
    if (p.y > bg.height + 12 || p.x < -12) { p.x = bg.width * (0.45 + Math.random() * 0.55); p.y = -10; }
    bctx.save();
    bctx.translate(p.x, p.y);
    bctx.rotate(p.r);
    bctx.fillStyle = 'rgba(255,168,195,0.85)';
    bctx.beginPath();
    bctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.283);
    bctx.fill();
    bctx.restore();
  }
})();
function setOnline() {
  var now = Date.now();
  var n = 0;
  for (var k in lastSeen) { if (now - lastSeen[k] < 150000) n++; }
  if (subscribed && !lastSeen[nick]) n++;
  onlineEl.textContent = 'в сети: ' + n;
}
function onState(state) {
  var CS = Photon.Chat.ChatClient.ChatState;
  if (state === CS.ConnectedToFrontEnd) {
    document.getElementById('chat-status').classList.add('on');
    subAttempt = 1;
    trySubscribe();
    sendbar.classList.add('open');
  } else if (state === CS.Disconnected || state === CS.Error) {
    document.getElementById('chat-status').classList.remove('on');
    lastSeen = {};
    subscribed = false;
    subAttempt = 0;
    setOnline();
    sendbar.classList.remove('open');
    if (nick && reconnectTries < 6) {
      reconnectTries++;
      sys('Переподключение (' + reconnectTries + ')...');
      setTimeout(connect, 4000);
    }
  }
}
function onMessages(channelName, messages) {
  for (var i = 0; i < messages.length; i++) {
    var m = messages[i];
    var s = String(m.getSender());
    lastSeen[s] = Date.now();
    addMsg(s, String(m.getContent()), s === nick ? 'ch-me' : '');
  }
  setOnline();
}
function trySubscribe() {
  if (!client || !client.isConnectedToFrontEnd()) return;
  subResultGot = false;
  if (subAttempt === 1) client.subscribe([CHANNEL], { historyLength: 12, createOptions: { publishSubscribers: true, maxSubscribers: 100 } });
  else if (subAttempt === 2) client.subscribe([CHANNEL], { historyLength: 12 });
  else client.subscribe([CHANNEL]);
  setTimeout(function () {
    if (!subResultGot && subAttempt < 3) {
      subAttempt++;
      sys('Подписка не подтверждена, повтор (' + subAttempt + '/3)...');
      trySubscribe();
    }
  }, 5000);
}
function connect() {
  if (typeof Photon === 'undefined' || !Photon.Chat) { sys('Ошибка: SDK чата не загружен (libs/photon.js)'); return; }
  client = new Photon.Chat.ChatClient(Photon.ConnectionProtocol.Wss, APP_ID, '1.0');
  client.setUserId(nick);
  client.onStateChange = onState;
  client.onError = function (ec, em) { sys('Ошибка чата: ' + em); };
  client.onChatMessages = onMessages;
  client.onSubscribeResult = function (res) {
    subResultGot = true;
    var dump = '';
    try { dump = JSON.stringify(res); } catch (e) { dump = String(res); }
    sys('Ответ сервера (ур.' + subAttempt + '): ' + dump);
    if (res && res[CHANNEL] === true) {
      subscribed = true;
      lastSeen[nick] = Date.now();
      setOnline();
      sys('Вы в чате. Пиши!');
      nickbar.classList.remove('open');
      sendbar.classList.add('open');
      input.focus();
      return;
    }
    if (subAttempt < 3) {
      subAttempt++;
      sys('Повторная подписка (' + subAttempt + '/3)...');
      trySubscribe();
    } else {
      sys('Все попытки не удались. Финальный ответ: ' + dump);
    }
  };
  client.onUserSubscribe = function (ch, u) { if (u) { lastSeen[u] = Date.now(); setOnline(); } };
  client.onUserUnsubscribe = function (ch, u) { if (u) { delete lastSeen[u]; setOnline(); } };
  client.connectToNameServer({ region: 'EU' });
}
function sendMsg() {
  var t = input.value.replace(/\s+/g, ' ').trim();
  if (!t) return;
  if (t.length > 200) t = t.slice(0, 200);
  if (Date.now() - lastSend < 600) { sys('Слишком часто. Подожди секунду'); return; }
  if (!client || !client.isConnectedToFrontEnd()) { sys('Нет соединения с сервером'); return; }
  if (!subscribed) { sys('Нет подписки на канал'); return; }
  if (client.publishMessage(CHANNEL, t)) {
    lastSend = Date.now();
    input.value = '';
  }
}
btn.addEventListener('click', function () {
  var open = win.classList.toggle('open');
  if (open) {
    if (!nick) {
      try { nickInput.value = sessionStorage.getItem(NICK_KEY) || ''; } catch (e) {}
      nickbar.classList.add('open');
      nickInput.focus();
    }
    msgs.scrollTop = msgs.scrollHeight;
  }
});
closeB.addEventListener('click', function () { win.classList.remove('open'); });
nickGo.addEventListener('click', function () {
  var v = nickInput.value.replace(/\s+/g, ' ').trim().slice(0, 16);
  if (v.length < 2) { sys('Ник должен быть от 2 символов'); return; }
  nick = v;
  try { sessionStorage.setItem(NICK_KEY, v); } catch (e) {}
  nickbar.classList.remove('open');
  sys('Ник: ' + nick + '. Подключение...');
  connect();
});
nickInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') nickGo.click(); });
sendBtn.addEventListener('click', sendMsg);
input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMsg(); });
})();
