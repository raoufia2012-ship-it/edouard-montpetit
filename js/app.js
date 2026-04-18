function toggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.querySelector('.eye-off').style.display = isHidden ? 'none' : 'block';
  btn.querySelector('.eye-on').style.display  = isHidden ? 'block' : 'none';
}

function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');
  document.querySelector('.app-main').scrollTo({ top: 0, behavior: 'smooth' });
}

function goToInfo(tab) {
  goTo('info');
  if (typeof switchInfoTab === 'function') switchInfoTab(tab);
}
