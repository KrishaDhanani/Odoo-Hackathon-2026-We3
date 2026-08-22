const API_BASE = '/api';

function getToken() { return localStorage.getItem('gt_token'); }
function setToken(t) { localStorage.setItem('gt_token', t); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('gt_user')); } catch (e) { return null; }
}
function setUser(u) { localStorage.setItem('gt_user', JSON.stringify(u)); }
function clearAuth() {
  localStorage.removeItem('gt_token');
  localStorage.removeItem('gt_user');
}

async function api(path, opts = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/signup')) {
    clearAuth();
    if (!/index\.html$|\/$/.test(location.pathname)) {
      location.href = 'index.html';
    }
  }

  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body */ }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function requireAuth() {
  if (!getToken()) location.href = 'index.html';
}

function renderNav(activePage) {
  const navEl = document.getElementById('gt-nav');
  if (!navEl) return;
  const user = getUser();
  navEl.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="dashboard.html">&#127760; GlobeTrotter</a>
      <div class="nav-links">
        <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
        <a href="my-trips.html" class="${activePage === 'trips' ? 'active' : ''}">My Trips</a>
        <a href="create-trip.html" class="${activePage === 'create' ? 'active' : ''}">Plan Trip</a>
        ${user && user.is_admin ? `<a href="admin.html" class="${activePage === 'admin' ? 'active' : ''}">Admin</a>` : ''}
        <a href="profile.html" class="${activePage === 'profile' ? 'active' : ''}">Profile</a>
        <a href="#" id="gt-logout">Logout</a>
      </div>
    </div>`;
  const logout = document.getElementById('gt-logout');
  if (logout) {
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      location.href = 'index.html';
    });
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtMoney(n) {
  return '$' + Number(n || 0).toLocaleString();
}

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  if (isNaN(date)) return d;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function showMsg(el, text, type = 'error') {
  el.textContent = text;
  el.className = 'msg ' + type;
  el.classList.remove('hidden');
}
