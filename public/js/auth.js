document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) initLogin();
  if (registerForm) initRegister();
});

function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || '/';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  // Support both plain element and element with inner text span
  const textEl = document.getElementById(id + '-text');
  if (textEl) textEl.textContent = msg;
  else el.textContent = msg;
  el.style.display = 'flex';
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function setLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.textContent;
    btn.innerHTML = '<span class="btn-spinner"></span> Please wait...';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.original || btn.textContent;
  }
}

function initLogin() {
  const form = document.getElementById('login-form');
  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('login-error');

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      showError('login-error', 'Please fill in all fields');
      return;
    }

    setLoading(btn, true);
    try {
      const data = await api.post('/api/auth/login', { email, password });
      setAuth(data.token, data.user);
      showToast('Welcome back, ' + data.user.name.split(' ')[0] + '!', 'success');
      setTimeout(() => window.location.href = getRedirectUrl(), 600);
    } catch (err) {
      showError('login-error', err.message);
      setLoading(btn, false);
    }
  });
}

function initRegister() {
  const form = document.getElementById('register-form');
  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('register-error');

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm_password.value;

    if (!name || !email || !password) {
      showError('register-error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      showError('register-error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      showError('register-error', 'Passwords do not match');
      return;
    }

    setLoading(btn, true);
    try {
      const data = await api.post('/api/auth/register', { name, email, password });
      setAuth(data.token, data.user);
      showToast('Account created! Welcome, ' + data.user.name.split(' ')[0] + '!', 'success');
      setTimeout(() => window.location.href = getRedirectUrl(), 600);
    } catch (err) {
      showError('register-error', err.message);
      setLoading(btn, false);
    }
  });
}
