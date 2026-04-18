let currentUser = null;

const screens = {
  landing:  document.getElementById('auth-landing'),
  login:    document.getElementById('auth-login'),
  signup:   document.getElementById('auth-signup'),
  profile:  document.getElementById('auth-profile'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('visible'));
  if (name) screens[name].classList.add('visible');
}

function openAuth() {
  if (currentUser) showScreen('profile');
  else showScreen('landing');
}

function closeAuth() { showScreen(null); }

auth.onAuthStateChanged(async user => {
  currentUser = user;
  const btn = document.getElementById('topbar-profile-btn');
  if (user) {
    const initials = (user.displayName || user.email)
      .split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    btn.innerHTML = `<div class="avatar-circle">${initials}</div>`;
    await renderProfile(user);
  } else {
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
  }
});

async function renderProfile(user) {
  const doc = await db.collection('students').doc(user.uid).get();
  const d = doc.exists ? doc.data() : {};
  const name = user.displayName || d.name || 'Élève';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('prof-initials').textContent = initials;
  document.getElementById('prof-name').textContent = name;
  document.getElementById('prof-email').textContent = user.email;
  document.getElementById('prof-niveau').textContent = d.niveau || 'Sec. 4';
  document.getElementById('prof-groupe').textContent = d.groupe || 'Groupe B';
  const postsSnap = await db.collection('posts').where('uid','==',user.uid).get();
  const postCount = postsSnap.size;
  let totalReactions = 0;
  postsSnap.forEach(p => { const r = p.data().reactions || {}; totalReactions += Object.values(r).reduce((a,b)=>a+b,0); });
  const titleEl = document.getElementById('prof-title');
  if (titleEl && typeof getUserTitle === 'function') titleEl.textContent = getUserTitle(postCount, totalReactions);
  const sp = document.getElementById('prof-stat-posts');
  const sr = document.getElementById('prof-stat-reactions');
  if (sp) sp.textContent = postCount;
  if (sr) sr.textContent = totalReactions;
  if (typeof loadProfilePosts === 'function') loadProfilePosts(user.uid);
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-err');
  const btn   = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = '...';
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    showScreen('profile'); err.textContent = '';
  } catch(e) { err.textContent = errMsg(e.code); }
  btn.disabled = false; btn.textContent = 'Se connecter';
}

async function doSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-pass').value;
  const err   = document.getElementById('signup-err');
  const btn   = document.getElementById('signup-btn');
  btn.disabled = true; btn.textContent = '...';
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });
    await db.collection('students').doc(cred.user.uid).set({
      name, email, niveau: 'Sec. 4', groupe: 'Groupe B',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showScreen('profile'); err.textContent = '';
  } catch(e) { err.textContent = errMsg(e.code); }
  btn.disabled = false; btn.textContent = 'Créer mon compte';
}

async function doLogout() {
  await auth.signOut();
  closeAuth();
}

function errMsg(code) {
  return ({
    'auth/user-not-found':      'Aucun compte avec ce courriel.',
    'auth/wrong-password':      'Mot de passe incorrect.',
    'auth/email-already-in-use':'Courriel déjà utilisé.',
    'auth/weak-password':       'Mot de passe trop court (6 car. min).',
    'auth/invalid-email':       'Courriel invalide.',
    'auth/invalid-credential':  'Courriel ou mot de passe incorrect.',
  })[code] || 'Une erreur est survenue.';
}
