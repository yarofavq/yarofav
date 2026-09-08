// ==================== PHOTON CHAT ====================
(function () {
'use strict';
var APP_ID = '90811467-76f1-400a-b211-eb58e6d08c08';
var CHANNEL = 'global';
var NICK_KEY = 'spaceChatNick';
var client = null;
var nick = '';
var online = {};
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
cssAdd('#chat-open-btn{position:fixed;left:18px;bottom:174px;z-index:9400;width:58px;height:58px;border-radius:16px;border:1px solid rgba(120,255,220,.45);background:linear-gradient(145deg,#0e3a34,#0a2030);color:#7dffd9;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 14px rgba(60,220,180,.3);transition:transform .18s;display:flex;align-items:center;justify-content:center;}');
cssAdd('#chat-open-btn:hover{transform:translateY(-3px) scale(1.05);}');
cssAdd('#chat-open-btn:active{transform:scale(.9);}');
cssAdd('#chat-win{position:fixed;left:18px;bottom:244px;z-index:9410;width:min(340px,92vw);height:420px;max-height:70vh;display:none;flex-direction:column;background:linear-gradient(160deg,#0d1230,#101a38);border:1px solid rgba(120,220,255,.3);border-radius:18px;overflow:hidden;font-family:Segoe UI,system-ui,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.6);animation:chIn .25s ease;}');
cssAdd('#chat-win.open{display:flex;}');
cssAdd('@keyframes chIn{from{transform:translateY(16px) scale(.95);opacity:0}}');
cssAdd('#chat-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(90,130,255,.25);background:rgba(8,12,32,.8);}');
cssAdd('#chat-title{color:#aee9ff;font-weight:700;font-size:14px;letter-spacing:1.5px;display:flex;align-items:center;}');
cssAdd('#chat-status{width:9px;height:9px;border-radius:50%;background:#e05555;display:inline-block;margin-right:7px;}');
cssAdd('#chat-status.on{background:#57e389;box-shadow:0 0 8px #57e389;}');
cssAdd('#chat-online{color:#9fb8ff;font-size:12px;margin-left:auto;}');
cssAdd('#chat-close{background:none;border:none;color:#9fb8ff;font-size:15px;cursor:pointer;padding:2px 6px;font-family:inherit;}');
cssAdd('#chat-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:7px;}');
cssAdd('#chat-msgs::-webkit-scrollbar{width:7px;}');
cssAdd('#chat-msgs::-webkit-scrollbar-thumb{background:#2b3f7a;border-radius:4px;}');
cssAdd('.ch-msg{background:rgba(14,20,48,.85);border:1px solid rgba(80,110,220,.25);border-radius:11px;padding:7px 10px;font-size:13px;color:#e6ecff;line-height:1.45;overflow-wrap:anywhere;}');
cssAdd('.ch-msg b{color:#7db2ff;}');
cssAdd('.ch-msg .ch-t{color:#5f6f9e;font-size:11px;margin-right:6px;}');
cssAdd('.ch-msg.ch-sys{border-color:rgba(255,210,90,.3);color:#ffd76a;background:rgba(30,26,10,.5);font-size:12px;}');
cssAdd('.ch-msg.ch-me{border-color:rgba(87,227,137,.4);}');
cssAdd('#chat-nickbar,#chat-sendbar{display:none;padding:10px 12px;border-top:1px solid rgba(90,130,255,.25);gap:8px;}');
cssAdd('#chat-nickbar.open,#chat-sendbar.open{display:flex;}');
cssAdd('#chat-nickinput,#chat-input{flex:1;min-width:0;background:#0a0f2a;border:1px solid #33407f;border-radius:9px;color:#fff;padding:9px 11px;font-family:inherit;font-size:13px;outline:none;}');
cssAdd('#chat-input:focus,#chat-nickinput:focus{border-color:#4f8dff;}');
cssAdd('#chat-nick-btn{background:linear-gradient(135deg,#2e9e8f,#145a52);border:none;border-radius:9px;color:#fff;font-weight:700;padding:9px 14px;cursor:pointer;font-family:inherit;}');
cssAdd('#chat-send{background:linear-gradient(135deg,#3a86ff,#7b2cbf);border:none;border-radius:9px;color:#fff;font-weight:700;padding:9px 14px;cursor:pointer;font-family:inherit;}');
var btn = el('button', 'chat-open-btn', 'clicker-ui');
btn.title = 'Чат';
btn.innerHTML = "<svg viewBox='0 0 24 24' width='26' height='26' fill='none' stroke='#7dffd9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path></svg>";
document.body.appendChild(btn);
var win = el('div', 'chat-win', 'clicker-ui');
var head = el('div', 'chat-head');
var ttl = el('div', 'chat-title');
ttl.appendChild(el('span', 'chat-status'));
ttl.appendChild(document.createTextNode('ЧАТ'));
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
function timeStr() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function addMsg(sender, text, cls) {
  var d = el('div', '', 'ch-msg' + (cls ? ' ' + cls : ''));
  d.appendChild(el('span', '', 'ch-t', timeStr()));
  if (sender) d.appendChild(el('b', '', '', sender + ': '));
  d.appendChild(document.createTextNode(text));
  msgs.appendChild(d);
  while (msgs.children.length > 120) msgs.removeChild(msgs.firstChild);
  msgs.scrollTop = msgs.scrollHeight;
}
function sys(text) { addMsg('', text, 'ch-sys'); }
function setOnline() {
  var n = 0;
  for (var k in online) n++;
  onlineEl.textContent = 'в сети: ' + n;
}
function onState(state) {
  var CS = Photon.Chat.ChatClient.ChatState;
  if (state === CS.ConnectedToFrontEnd) {
    document.getElementById('chat-status').classList.add('on');
    client.subscribe([CHANNEL], { historyLength: 12, createOptions: { publishSubscribers: true, maxSubscribers: 100 } });
  } else if (state === CS.Disconnected || state === CS.Error) {
    document.getElementById('chat-status').classList.remove('on');
    online = {};
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
    online[s] = 1;
    addMsg(s, String(m.getContent()), s === nick ? 'ch-me' : '');
  }
  setOnline();
}
function connect() {
  if (typeof Photon === 'undefined' || !Photon.Chat) { sys('Ошибка: SDK чата не загружен (libs/photon.js)'); return; }
  client = new Photon.Chat.ChatClient(Photon.ConnectionProtocol.Wss, APP_ID, '1.0');
  client.setUserId(nick);
  client.onStateChange = onState;
  client.onError = function (ec, em) { sys('Ошибка чата: ' + em); };
  client.onChatMessages = onMessages;
  client.onSubscribeResult = function (res) {
    if (res && res[CHANNEL]) {
      online[nick] = 1;
      setOnline();
      sys('Вы в чате. Пиши!');
      nickbar.classList.remove('open');
      sendbar.classList.add('open');
      input.focus();
    } else {
      sys('Канал недоступен');
    }
  };
  client.onUserSubscribe = function (ch, u) { if (u && !online[u]) { online[u] = 1; setOnline(); } };
  client.onUserUnsubscribe = function (ch, u) { if (u) { delete online[u]; setOnline(); } };
  client.connectToNameServer({ region: 'EU' });
}
function sendMsg() {
  var t = input.value.replace(/\s+/g, ' ').trim();
  if (!t) return;
  if (t.length > 200) t = t.slice(0, 200);
  if (Date.now() - lastSend < 600) { sys('Слишком часто. Подожди секунду'); return; }
  if (!client || !client.isConnectedToFrontEnd()) { sys('Нет соединения с сервером'); return; }
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
