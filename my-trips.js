requireAuth();
renderNav('trips');

const msg = document.getElementById('msg');
const tripList = document.getElementById('tripList');

async function load() {
  const trips = await api('/trips');
  if (!trips.length) {
    tripList.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <p>No trips yet — plan your first adventure.</p>
      <a class="btn accent" href="create-trip.html">Plan a trip</a>
    </div>`;
    return;
  }
  tripList.innerHTML = trips.map(cardHtml).join('');
  trips.forEach((t) => {
    document.getElementById(`del-${t.id}`).addEventListener('click', () => deleteTrip(t.id, t.name));
  });
}

function cardHtml(t) {
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
        <a class="btn small" href="itinerary.html?id=${t.id}">View / Edit</a>
        <a class="btn small secondary" href="budget.html?id=${t.id}">Budget</a>
        <button class="btn small danger" id="del-${t.id}">Delete</button>
      </div>
    </div>`;
}

async function deleteTrip(id, name) {
  if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
  try {
    await api(`/trips/${id}`, { method: 'DELETE' });
    load();
  } catch (err) {
    showMsg(msg, err.message);
  }
}

load().catch((err) => showMsg(msg, err.message));
