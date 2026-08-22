requireAuth();
renderNav('admin');

const msg = document.getElementById('msg');
const user = getUser();
if (!user || !user.is_admin) {
  location.href = 'dashboard.html';
}

async function load() {
  const stats = await api('/admin/stats');

  document.getElementById('stats').innerHTML = `
    <div class="stat-tile"><div class="value">${stats.totalUsers}</div><div class="label">Total users</div></div>
    <div class="stat-tile"><div class="value">${stats.totalTrips}</div><div class="label">Trips created</div></div>
    <div class="stat-tile"><div class="value">${stats.totalStops}</div><div class="label">Cities added across all trips</div></div>
  `;

  document.querySelector('#topCitiesTable tbody').innerHTML = stats.topCities
    .map((c) => `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.country)}</td><td>${c.uses}</td></tr>`)
    .join('') || `<tr><td colspan="3" class="text-muted">No data yet.</td></tr>`;

  document.querySelector('#topActivitiesTable tbody').innerHTML = stats.topActivities
    .map((a) => `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.type)}</td><td>${a.uses}</td></tr>`)
    .join('') || `<tr><td colspan="3" class="text-muted">No data yet.</td></tr>`;

  document.querySelector('#usersTable tbody').innerHTML = stats.users
    .map(
      (u) => `<tr>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${u.trip_count}</td>
        <td>${fmtDate(u.created_at.slice(0, 10))}</td>
        <td>${u.is_admin ? '<span class="badge">Admin</span>' : '<span class="badge muted">Traveler</span>'}</td>
      </tr>`
    )
    .join('');
}

load().catch((err) => showMsg(msg, err.message));
