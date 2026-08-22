requireAuth();
renderNav('dashboard');

async function load() {
  const [me, trips, cities] = await Promise.all([
    api('/auth/me'),
    api('/trips'),
    api('/cities'),
  ]);

  document.getElementById('welcome').textContent = `Welcome back, ${me.name.split(' ')[0]}!`;

  const totalCities = trips.reduce((s, t) => s + t.stop_count, 0);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter((t) => t.start_date && t.start_date >= today).sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  let nextTripLabel = 'No trips planned yet';
  if (upcoming.length) {
    const days = Math.max(0, Math.round((new Date(upcoming[0].start_date) - new Date(today)) / 86400000));
    nextTripLabel = days === 0 ? 'Starting today!' : `${days} day${days === 1 ? '' : 's'} to go`;
  }

  document.getElementById('highlights').innerHTML = `
    <div class="stat-tile"><div class="value">${trips.length}</div><div class="label">Trips planned</div></div>
    <div class="stat-tile"><div class="value">${totalCities}</div><div class="label">Cities across all trips</div></div>
    <div class="stat-tile"><div class="value">${escapeHtml(nextTripLabel)}</div><div class="label">${upcoming.length ? escapeHtml(upcoming[0].name) : 'Next trip'}</div></div>
  `;

  const recent = trips.slice(0, 3);
  const recentEl = document.getElementById('recentTrips');
  if (!recent.length) {
    recentEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <p>You haven't planned any trips yet.</p>
      <a class="btn accent" href="create-trip.html">Plan your first trip</a>
    </div>`;
  } else {
    recentEl.innerHTML = recent.map(tripCardHtml).join('');
  }

  const popular = [...cities].sort((a, b) => b.popularity - a.popularity).slice(0, 8);
  document.getElementById('popularCities').innerHTML = popular.map(cityCardHtml).join('');
}

function tripCardHtml(t) {
  const cover = t.cover_photo || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600';
  return `
    <div class="trip-card">
      <div class="cover" style="background-image:url('${escapeHtml(cover)}')"></div>
      <div class="body">
        <h3>${escapeHtml(t.name)}</h3>
        <div class="meta">${fmtDate(t.start_date)} — ${fmtDate(t.end_date)}</div>
        <div class="meta">${t.stop_count} ${t.stop_count === 1 ? 'city' : 'cities'}</div>
      </div>
      <div class="card-actions">
        <a class="btn small" href="itinerary.html?id=${t.id}">Open</a>
      </div>
    </div>`;
}

function cityCardHtml(c) {
  const cover = c.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600';
  return `
    <div class="city-card">
      <div class="cover" style="background-image:url('${escapeHtml(cover)}')"></div>
      <div class="body">
        <h3>${escapeHtml(c.name)}</h3>
        <div class="meta">${escapeHtml(c.country)}</div>
        <div class="meta">Popularity ${c.popularity}/100</div>
      </div>
    </div>`;
}

load().catch((err) => {
  document.querySelector('.page').insertAdjacentHTML('afterbegin', `<div class="msg error">${escapeHtml(err.message)}</div>`);
});
