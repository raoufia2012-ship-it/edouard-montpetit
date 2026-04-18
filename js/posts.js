let unsubPosts = null;
let currentFilter = 'recent';
let allPostDocs = [];

function searchPosts(q) {
  const query = q.trim().toLowerCase();
  if (!query) { renderFeed(allPostDocs); return; }
  renderFeed(allPostDocs.filter(doc => {
    const d = doc.data();
    return (d.content||'').toLowerCase().includes(query) ||
           (d.author||'').toLowerCase().includes(query);
  }));
}

function updateCharCount() {
  const len = document.getElementById('post-text').value.length;
  const el = document.getElementById('char-count');
  if (!el) return;
  const left = 280 - len;
  el.textContent = left;
  el.className = 'char-count' + (left < 40 ? ' warn' : '') + (left < 0 ? ' over' : '');
}

function openPostModal() {
  if (!currentUser) { openAuth(); return; }
  const av = document.getElementById('cpb-initials');
  const name = currentUser.displayName || currentUser.email;
  av.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('post-modal').classList.add('open');
  document.getElementById('post-text').value = '';
}

function closePostModal() {
  document.getElementById('post-modal').classList.remove('open');
}

async function submitPost() {
  const text = document.getElementById('post-text').value.trim();
  if (!text || !currentUser) return;
  const btn = document.getElementById('post-submit-btn');
  btn.disabled = true;
  try {
    const name = currentUser.displayName || 'Élève';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    await db.collection('posts').add({
      content: text, author: name, initials,
      uid: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closePostModal();
  } catch(e) { console.error(e); }
  btn.disabled = false;
}

async function deletePost(postId) {
  if (!currentUser) return;
  if (!confirm('Supprimer cette publication?')) return;
  await db.collection('posts').doc(postId).delete();
  loadProfilePosts(currentUser.uid);
}

function switchPostFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById('ptab-' + f);
  if (tab) tab.classList.add('active');
  loadPosts();
}

function buildPostCard(doc) {
  const d = doc.data();
  const time = d.createdAt ? timeAgo(d.createdAt.toDate()) : 'À l\'instant';
  const isMine = currentUser && d.uid === currentUser.uid;
  const r = d.reactions || {};
  const myReact = currentUser && d.reactedBy ? d.reactedBy[currentUser.uid] : null;
  const total = Object.values(r).reduce((a, b) => a + b, 0);
  const emojis = ['😂','😭','💀','😈'];
  const reactHtml = emojis.map(e =>
    `<button class="react-btn${myReact===e?' active':''}" onclick="toggleReaction('${doc.id}','${e}')"><span class="rc">${e}</span><span class="rn">${r[e]||0}</span></button>`
  ).join('');
  return `<div class="post-card">
    <div class="post-card-top">
      <div class="post-av">${d.initials || '?'}</div>
      <div class="post-meta">
        <span class="post-author">${d.author || 'Élève'} ${isMine ? '<span class="post-badge">MOI</span>' : ''}</span>
        <span class="post-time">${time} · ${total} réaction${total!==1?'s':''}</span>
      </div>
      ${isMine ? `<button class="post-del-btn" onclick="deletePost('${doc.id}')" title="Supprimer"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>` : ''}
    </div>
    <div class="post-content">${escHtml(d.content)}</div>
    <div class="post-reactions">${reactHtml}</div>
  </div>`;
}

function renderFeed(docs) {
  const feed = document.getElementById('posts-feed');
  const empty = document.getElementById('posts-empty');
  if (!docs.length) { feed.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  feed.innerHTML = docs.map(buildPostCard).join('');
}

function storeDocs(docs) {
  allPostDocs = docs;
  renderFeed(docs);
}

function loadPosts() {
  if (unsubPosts) unsubPosts();
  if (currentFilter === 'mine') {
    if (!currentUser) { currentFilter = 'recent'; loadPosts(); return; }
    unsubPosts = db.collection('posts').where('uid','==',currentUser.uid)
      .orderBy('createdAt','desc').limit(30)
      .onSnapshot(snap => {
        if (typeof renderLeaderboard === 'function') renderLeaderboard(snap.docs);
        renderFeed(snap.docs);
      });
  } else if (currentFilter === 'tendance') {
    unsubPosts = db.collection('posts').orderBy('createdAt','desc').limit(50)
      .onSnapshot(snap => {
        if (typeof renderLeaderboard === 'function') renderLeaderboard(snap.docs);
        const sorted = snap.docs.slice().sort((a, b) => {
          const ra = Object.values(a.data().reactions||{}).reduce((x,y)=>x+y,0);
          const rb = Object.values(b.data().reactions||{}).reduce((x,y)=>x+y,0);
          return rb - ra;
        });
        renderFeed(sorted);
      });
  } else {
    unsubPosts = db.collection('posts').orderBy('createdAt','desc').limit(30)
      .onSnapshot(snap => {
        if (typeof renderLeaderboard === 'function') renderLeaderboard(snap.docs);
        renderFeed(snap.docs);
      });
  }
}

function loadProfilePosts(uid) {
  db.collection('posts').where('uid','==',uid).orderBy('createdAt','desc').get().then(snap => {
    const el = document.getElementById('prof-posts-list');
    if (!el) return;
    if (snap.empty) {
      el.innerHTML = '<p class="ppi-empty">Aucune publication encore</p>';
      return;
    }
    el.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const r = d.reactions || {};
      const total = Object.values(r).reduce((a,b)=>a+b,0);
      const time = d.createdAt ? timeAgo(d.createdAt.toDate()) : '';
      return `<div class="ppi">
        <div class="ppi-content">${escHtml(d.content)}</div>
        <div class="ppi-footer">
          <span class="ppi-stat">❤️ ${total}</span>
          <span class="ppi-time">${time}</span>
          <button class="ppi-del" onclick="deletePost('${doc.id}')">Supprimer</button>
        </div>
      </div>`;
    }).join('');
  });
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)}h`;
  return `il y a ${Math.floor(diff/86400)}j`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function switchInfoTab(tabName) {
  document.querySelectorAll('.info-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.info-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-btn-' + tabName).classList.add('active');
  document.getElementById('info-' + tabName).classList.add('active');
}

document.addEventListener('DOMContentLoaded', loadPosts);
