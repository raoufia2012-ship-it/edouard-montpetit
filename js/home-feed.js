let unsubHomeFeed = null;
let homeFeedFilter = 'recent';

function switchHomeFeed(f) {
  homeFeedFilter = f;
  document.querySelectorAll('.hftab').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById('hftab-' + f);
  if (tab) tab.classList.add('active');
  loadHomeFeed();
}

function loadHomeFeed() {
  if (unsubHomeFeed) unsubHomeFeed();
  const render = (docs) => {
    const el = document.getElementById('home-feed-posts');
    if (!el) return;
    if (!docs.length) {
      el.innerHTML = '<p class="hf-empty">Aucune publication encore — sois le premier!</p>';
      return;
    }
    el.innerHTML = docs.slice(0, 8).map(doc => {
      const d = doc.data();
      const r = d.reactions || {};
      const myReact = currentUser && d.reactedBy ? d.reactedBy[currentUser.uid] : null;
      const total = Object.values(r).reduce((a, b) => a + b, 0);
      const time = d.createdAt ? timeAgo(d.createdAt.toDate()) : 'À l\'instant';
      const emojis = ['😂','😭','💀','😈'];
      const reacts = emojis.map(e =>
        `<button class="hf-react${myReact===e?' active':''}" onclick="toggleReaction('${doc.id}','${e}')"><span>${e}</span><span class="hfr-n">${r[e]||0}</span></button>`
      ).join('');
      return `<div class="hf-card">
        <div class="hf-top">
          <div class="hf-av">${d.initials||'?'}</div>
          <div class="hf-meta">
            <span class="hf-author">${d.author||'Élève'}</span>
            <span class="hf-time">${time}</span>
          </div>
          ${total > 0 ? `<span class="hf-total">❤️ ${total}</span>` : ''}
        </div>
        <div class="hf-content">${escHtml(d.content)}</div>
        <div class="hf-reactions">${reacts}</div>
      </div>`;
    }).join('');
  };

  if (homeFeedFilter === 'tendance') {
    unsubHomeFeed = db.collection('posts').orderBy('createdAt','desc').limit(30)
      .onSnapshot(snap => {
        const sorted = snap.docs.slice().sort((a,b) => {
          const ra = Object.values(a.data().reactions||{}).reduce((x,y)=>x+y,0);
          const rb = Object.values(b.data().reactions||{}).reduce((x,y)=>x+y,0);
          return rb - ra;
        });
        render(sorted);
      });
  } else {
    unsubHomeFeed = db.collection('posts').orderBy('createdAt','desc').limit(8)
      .onSnapshot(snap => render(snap.docs));
  }
}

document.addEventListener('DOMContentLoaded', loadHomeFeed);
