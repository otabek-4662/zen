// ============================================================
// ClaudeTelegram - renderer UI
// Mirrors the Electron client's auth flow, chat list, and chat
// window. Real Telegram connectivity would be wired through the
// preload bridge (window.electronAPI) to a TDLib-backed main
// process; this build uses mock data for the UI demo.
// ============================================================

const MOCK_CHATS = [
  { id: 1, title: 'Otabek', preview: 'See you tomorrow!', unread: 2, messages: [
    { text: 'Hey, did you finish the build config?', out: false, time: '09:12' },
    { text: 'Yes, electron-builder is all set up.', out: true, time: '09:14' },
    { text: 'Nice work. See you tomorrow!', out: false, time: '09:15' },
  ]},
  { id: 2, title: 'Design Team', preview: 'Aziza: love the new palette', unread: 5, messages: [
    { text: 'The Claude theme looks incredible', out: false, time: '08:40' },
    { text: 'love the new palette', out: false, time: '08:41' },
  ]},
  { id: 3, title: 'Project Zen', preview: 'You: pushed the changes', unread: 0, messages: [
    { text: 'Anyone reviewing the PR?', out: false, time: 'Mon' },
    { text: 'pushed the changes', out: true, time: 'Mon' },
  ]},
  { id: 4, title: 'Mom', preview: 'Call me when you can', unread: 1, messages: [
    { text: 'Call me when you can', out: false, time: 'Sun' },
  ]},
  { id: 5, title: 'Dev Notes', preview: 'Reminder: ship Phase 1', unread: 0, messages: [
    { text: 'Reminder: ship Phase 1', out: true, time: 'Sat' },
  ]},
];

const app = document.getElementById('app');
let authStage = 'phone';
let activeChatId = null;

// Confirm the secure preload bridge is available (Electron desktop runtime).
if (window.electronAPI && window.electronAPI.isDesktop) {
  console.log(
    `ClaudeTelegram running on ${window.electronAPI.platform} | Electron ${window.electronAPI.versions.electron}`
  );
}

// ---------- AUTH ----------
function renderAuth() {
  const stages = {
    phone: { h: 'Claude Telegram', p: 'Enter your phone number to sign in', ph: '+1 234 567 8900', btn: 'Continue', type: 'tel' },
    code:  { h: 'Enter Code', p: 'We sent a verification code to your phone', ph: '12345', btn: 'Verify', type: 'text' },
    password: { h: 'Two-Factor Authentication', p: 'Enter your cloud password', ph: 'Password', btn: 'Sign In', type: 'password' },
  };
  const s = stages[authStage];
  app.innerHTML = `
    <div class="auth-view">
      <div class="auth-card">
        <h1>${s.h}</h1>
        <p>${s.p}</p>
        <input type="${s.type}" id="auth-input" placeholder="${s.ph}" autofocus>
        <button id="auth-submit">${s.btn}</button>
      </div>
    </div>`;

  const input = document.getElementById('auth-input');
  const btn = document.getElementById('auth-submit');
  const submit = () => {
    if (!input.value.trim()) return;
    if (authStage === 'phone') { authStage = 'code'; renderAuth(); }
    else if (authStage === 'code') { authStage = 'password'; renderAuth(); }
    else { renderMain(); }
  };
  btn.addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
}

// ---------- MAIN ----------
function renderMain() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header"><span>Chats</span></div>
        <div class="chat-list" id="chat-list"></div>
      </aside>
      <main class="chat-window" id="chat-window">
        <div class="empty-state">Select a chat to start messaging</div>
      </main>
    </div>`;
  renderChatList();
}

function renderChatList() {
  const list = document.getElementById('chat-list');
  list.innerHTML = '';
  MOCK_CHATS.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'chat-item' + (chat.id === activeChatId ? ' chat-item--active' : '');

    const badge = chat.unread > 0
      ? `<div class="chat-item-badge">${chat.unread}</div>` : '';

    item.innerHTML = `
      <div class="avatar">${chat.title.charAt(0).toUpperCase()}</div>
      <div class="chat-item-info">
        <div class="chat-item-name">${chat.title}</div>
        <div class="chat-item-preview">${chat.preview}</div>
      </div>
      ${badge}`;

    item.addEventListener('click', () => { openChat(chat.id); });
    list.appendChild(item);
  });
}

function openChat(chatId) {
  activeChatId = chatId;
  const chat = MOCK_CHATS.find(c => c.id === chatId);
  chat.unread = 0;
  renderChatList();

  const win = document.getElementById('chat-window');
  win.innerHTML = `
    <div class="chat-window-header">${chat.title}</div>
    <div class="messages-container" id="messages"></div>
    <div class="message-input">
      <textarea id="msg-text" placeholder="Type a message..." rows="1"></textarea>
      <button class="send-button" id="send-btn" aria-label="Send">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>`;

  renderMessages(chat);

  const textarea = document.getElementById('msg-text');
  const sendBtn = document.getElementById('send-btn');
  const send = () => {
    const val = textarea.value.trim();
    if (!val) return;
    chat.messages.push({ text: val, out: true, time: nowTime() });
    chat.preview = 'You: ' + val;
    textarea.value = '';
    textarea.style.height = '40px';
    renderMessages(chat);
    renderChatList();
  };
  sendBtn.addEventListener('click', send);
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  textarea.addEventListener('input', () => {
    textarea.style.height = '40px';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });
}

function renderMessages(chat) {
  const box = document.getElementById('messages');
  box.innerHTML = '';
  chat.messages.forEach(m => {
    const row = document.createElement('div');
    row.className = 'msg-row ' + (m.out ? 'msg-row--out' : 'msg-row--in');
    row.innerHTML = `
      <div class="message-bubble ${m.out ? 'message-bubble--outgoing' : 'message-bubble--incoming'}">${escapeHtml(m.text)}</div>
      <div class="message-timestamp">${m.time}</div>`;
    box.appendChild(row);
  });
  box.scrollTop = box.scrollHeight;
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// boot
renderAuth();
