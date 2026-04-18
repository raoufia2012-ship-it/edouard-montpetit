const FUNNY_POSTS = [
  "POV: tu es arrivé en retard et le prof te demande pourquoi devant toute la classe 💀",
  "Le son de la cloche de fin de cours > n'importe quelle musique 😂",
  "Moi qui révise 5 minutes avant l'examen vs moi qui pleure après 😭",
  "Quelqu'un peut expliquer pourquoi la cafét sent toujours la même chose depuis 1969? 😈",
  "Le prof: 'Ça va prendre juste 5 minutes' — 45 minutes plus tard… 💀",
  "Arriver à l'école à 7h30 devrait être illégal 😭",
  "Moi en sport-études: j'ai pas eu le temps d'étudier, j'avais pratique 😂",
  "Le wifi de l'école vs le wifi de ma maison: combat du siècle 😈",
  "Quand le prof dit 'on continue la semaine prochaine' en plein milieu d'un exam 💀",
  "Les Bulldogs en finale mais personne m'a averti 😂",
  "La bibliothèque à l'heure d'étude: 99% sur leur phone, 1% qui étudient vraiment 😭",
  "Être en danse-études c'est avoir mal partout mais sourire quand même 😂",
  "Le labo de robotique: les robots marchent mieux que certains élèves le lundi matin 💀",
  "L'auditorium: pour les vrais, pas pour les simples 😈",
  "Quelqu'un a vu mes notes de sciences? Je les cherche encore 😭",
];

const DAILY_CHALLENGES = [
  { title: "La pire excuse de retard", desc: "Poste la meilleure (ou pire) excuse que tu as utilisée pour un retard!" },
  { title: "Ton prof en 3 mots", desc: "Décris ton prof de maths en exactement 3 mots. Pas un de plus." },
  { title: "Le repas mystère", desc: "Décris le repas de la cafét d'aujourd'hui sans le nommer." },
  { title: "Confessions anonymes", desc: "Un secret d'école que tu peux enfin révéler (rien de méchant!)" },
  { title: "Mème du jour", desc: "Quel personnage de film es-tu à 7h30 du matin à l'école?" },
  { title: "La question philosophique", desc: "Si tu pouvais changer une règle de l'école, laquelle?" },
  { title: "Défi sport-études", desc: "Toi vs un élève en sport-études: qui gagne au bras de fer?" },
  { title: "Le titre de ton autobiographie", desc: "Si ta vie à Édouard-Montpetit était un livre, quel serait son titre?" },
  { title: "Ton horaire idéal", desc: "Si tu faisais ton propre horaire de cours, à quoi ça ressemblerait?" },
  { title: "La vraie question", desc: "Piscine ou gymnase? Défends ta réponse en moins de 30 mots." },
  { title: "Citation du jour", desc: "Invente une citation inspirante que ton prof dirait. Plus c'est bizarre, mieux c'est." },
  { title: "Bulldog de la semaine", desc: "Nomme quelqu'un qui mérite d'être reconnu cette semaine et pourquoi!" },
  { title: "Moment le plus gênant", desc: "Partage ton moment le plus awkward à l'école (prénom facultatif 😂)" },
  { title: "Skills cachés", desc: "Quel talent caché as-tu que personne à l'école ne connaît?" },
  { title: "Vs le monde", desc: "Bulldogs vs n'importe quelle autre école — pourquoi on gagne?" },
];

const USER_TITLES = [
  { min: 0,  max: 0,  title: "Fantôme de la classe" },
  { min: 1,  max: 2,  title: "Nouveau Bulldog" },
  { min: 3,  max: 7,  title: "Génie silencieux" },
  { min: 8,  max: 15, title: "Membre actif" },
  { min: 16, max: 30, title: "Pilier des Bulldogs" },
  { min: 31, max: 999, title: "Légende d'ÉM" },
];

function getUserTitle(postCount, totalReactions) {
  if (totalReactions >= 50) return "Clown officiel 😂";
  if (totalReactions >= 20) return "Créateur de vibes 😈";
  const t = USER_TITLES.find(t => postCount >= t.min && postCount <= t.max);
  return t ? t.title : "Bulldog";
}

function generateFunnyPost() {
  const text = FUNNY_POSTS[Math.floor(Math.random() * FUNNY_POSTS.length)];
  document.getElementById('post-text').value = text;
  document.getElementById('post-text').focus();
}

function getDailyChallenge() {
  const day = Math.floor(Date.now() / 86400000);
  return DAILY_CHALLENGES[day % DAILY_CHALLENGES.length];
}

function renderChallenge() {
  const c = getDailyChallenge();
  const el = document.getElementById('challenge-title');
  const el2 = document.getElementById('challenge-desc');
  if (el) el.textContent = c.title;
  if (el2) el2.textContent = c.desc;
}

async function toggleReaction(postId, emoji) {
  if (!currentUser) { openAuth(); return; }
  const ref = db.collection('posts').doc(postId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const data = snap.data();
  const reactedBy = data.reactedBy || {};
  const reactions = data.reactions || {};
  const prev = reactedBy[currentUser.uid];

  const updates = { reactedBy: { ...reactedBy }, reactions: { ...reactions } };
  if (prev === emoji) {
    delete updates.reactedBy[currentUser.uid];
    updates.reactions[emoji] = Math.max(0, (updates.reactions[emoji] || 1) - 1);
  } else {
    if (prev) updates.reactions[prev] = Math.max(0, (updates.reactions[prev] || 1) - 1);
    updates.reactedBy[currentUser.uid] = emoji;
    updates.reactions[emoji] = (updates.reactions[emoji] || 0) + 1;
  }
  await ref.update(updates);
}

function renderLeaderboard(posts) {
  const counts = {};
  posts.forEach(p => {
    const d = p.data();
    if (!d.author) return;
    const key = d.author;
    if (!counts[key]) counts[key] = { name: key, initials: d.initials || '?', posts: 0, reactions: 0 };
    counts[key].posts++;
    const r = d.reactions || {};
    counts[key].reactions += Object.values(r).reduce((a, b) => a + b, 0);
  });
  const sorted = Object.values(counts).sort((a, b) => (b.posts + b.reactions) - (a.posts + a.reactions)).slice(0, 3);
  const ranks = ['gold', 'silver', 'bronze'];
  const medals = ['🥇', '🥈', '🥉'];
  const el = document.getElementById('lb-rows');
  if (!el) return;
  if (sorted.length === 0) { el.innerHTML = '<div style="padding:.8rem 1.1rem;font-size:.78rem;color:rgba(255,255,255,.25);text-align:center">Aucune activité encore</div>'; return; }
  el.innerHTML = sorted.map((u, i) => `
    <div class="lb-row">
      <div class="lb-rank ${ranks[i]}">${medals[i]}</div>
      <div class="lb-av">${u.initials}</div>
      <div class="lb-info"><strong>${u.name}</strong><span>${u.posts} posts · ${u.reactions} réactions</span></div>
      <div class="lb-score">${u.posts + u.reactions}</div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', renderChallenge);
