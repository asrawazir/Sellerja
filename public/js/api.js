const BASE = '';

function getToken() {
  return localStorage.getItem('sellerja_token');
}

function getUser() {
  const u = localStorage.getItem('sellerja_user');
  return u ? JSON.parse(u) : null;
}

function setAuth(token, user) {
  localStorage.setItem('sellerja_token', token);
  localStorage.setItem('sellerja_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('sellerja_token');
  localStorage.removeItem('sellerja_user');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => apiFetch(path, { method: 'DELETE' }),
};

// Toast notification system
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: '★' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '•'}</span> ${message}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Auth guard for protected pages
function requireAuth() {
  if (!getToken()) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?redirect=${redirect}`;
    return false;
  }
  return true;
}

// Update cart badge in header
async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  if (!getToken()) {
    badge.textContent = '0';
    return;
  }

  try {
    const items = await api.get('/api/cart');
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    badge.textContent = count;
    if (count > 0) {
      badge.style.display = 'inline-flex';
    }
  } catch {
    badge.textContent = '0';
  }
}

// Render header nav based on auth state
function renderNav() {
  const user = getUser();
  const authArea = document.getElementById('auth-area');
  const userGreeting = document.getElementById('user-greeting');

  if (!authArea) return;

  if (user) {
    authArea.innerHTML = `
      <button class="btn-auth btn-logout" onclick="logout()">Logout</button>
    `;
    if (userGreeting) {
      userGreeting.textContent = `Hi, ${user.name.split(' ')[0]}`;
      userGreeting.style.display = 'block';
    }
  } else {
    authArea.innerHTML = `
      <a href="/login.html" class="btn-auth btn-login">Login</a>
      <a href="/register.html" class="btn-auth btn-primary btn" style="font-size:0.88rem;padding:8px 18px;">Register</a>
    `;
  }
}

function logout() {
  clearAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = '/', 800);
}

// Format price
function formatPrice(n) {
  return '$' + Number(n).toFixed(2);
}

// Format date
function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

window.api = api;
window.getToken = getToken;
window.getUser = getUser;
window.setAuth = setAuth;
window.clearAuth = clearAuth;
window.showToast = showToast;
window.requireAuth = requireAuth;
window.updateCartBadge = updateCartBadge;
window.renderNav = renderNav;
window.logout = logout;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
