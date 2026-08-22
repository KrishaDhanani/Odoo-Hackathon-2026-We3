requireAuth();
renderNav('trips');

const params = new URLSearchParams(location.search);
const tripId = params.get('id');
const msg = document.getElementById('msg');

if (!tripId) {
  location.href = 'my-trips.html';
}

let trip = null;
let citySearchTimer = null;

async function load() {
  trip = await api(`/trips/${tripId}`);
  renderHeader();
  renderStops();
  document.getElementById('budgetLink').href = `budget.html?id=${tripId}`;
  if (!document.getElementById('calendarView').classList.contains('hidden')) {
    renderCalendar();
  }
}

function renderHeader() {
  document.getElementById('tripName').textContent = trip.name;
  document.getElementById('tripDates').textContent =
    trip.start_date || trip.end_date ? `${fmtDate(trip.start_date)} — ${fmtDate(trip.end_date)}` : 'Dates not set';
  document.getElementById('tripDescription').textContent = trip.description || '';
}

function renderStops() {
  const container = document.getElementById('stopsContainer');
  if (!trip.stops.length) {
    container.innerHTML = `<div class="empty-state"><p>No stops yet — add your first city below.</p></div>`;
    return;
  }
  container.innerHTML = trip.stops
    .map((stop, idx) => stopHtml(stop, idx, trip.stops.length))
    .join('');

  trip.stops.forEach((stop) => {
    document.getElementById(`up-${stop.id}`)?.addEventListener('click', () => moveStop(stop.id, -1));
    document.getElementById(`down-${stop.id}`)?.addEventListener('click', () => moveStop(stop.id, 1));
    document.getElementById(`delstop-${stop.id}`).addEventListener('click', () => deleteStop(stop.id, stop.city_name));
    document.getElementById(`addact-${stop.id}`).addEventListener('click', () => toggleActivitySearch(stop));
    stop.activities.forEach((a) => {
      document.getElementById(`delact-${a.stop_activity_id}`)?.addEventListener('click', () =>
        removeActivity(stop.id, a.stop_activity_id)
      );
    });
  });
}

function stopHtml(stop, idx, total) {
  const activitiesHtml = stop.activities.length
    ? stop.activities
        .map(
          (a) => `
        <div class="activity-row">
          <div>
            <div class="name">${escapeHtml(a.name)} <span class="badge muted">${escapeHtml(a.type)}</span></div>
            <div class="meta">${fmtMoney(a.cost)} · ${a.duration_hours}h${a.scheduled_time ? ' · ' + escapeHtml(a.scheduled_time) : ''}</div>
          </div>
          <button class="link-btn" id="delact-${a.stop_activity_id}" title="Remove">✕</button>
        </div>`
        )
        .join('')
    : `<p class="text-muted" style="margin:8px 0;">No activities added yet.</p>`;

  return `
    <div class="stop-block">
      <div class="stop-header">
        <div>
          <h3>${idx + 1}. ${escapeHtml(stop.city_name)}, ${escapeHtml(stop.country)}</h3>
          <div class="dates">${fmtDate(stop.start_date)} — ${fmtDate(stop.end_date)}</div>
        </div>
        <div class="btn-row">
          ${idx > 0 ? `<button class="btn small secondary" id="up-${stop.id}">↑</button>` : ''}
          ${idx < total - 1 ? `<button class="btn small secondary" id="down-${stop.id}">↓</button>` : ''}
          <button class="btn small secondary" id="addact-${stop.id}">+ Activity</button>
          <button class="btn small danger" id="delstop-${stop.id}">Remove Stop</button>
        </div>
      </div>
      <div class="stop-body">
        <div id="activities-${stop.id}">${activitiesHtml}</div>
        <div id="actsearch-${stop.id}" class="search-panel hidden"></div>
      </div>
    </div>`;
}

async function moveStop(stopId, direction) {
  const idx = trip.stops.findIndex((s) => s.id === stopId);
  const swapIdx = idx + direction;
  if (swapIdx < 0 || swapIdx >= trip.stops.length) return;
  const a = trip.stops[idx];
  const b = trip.stops[swapIdx];
  try {
    await Promise.all([
      api(`/stops/${a.id}`, { method: 'PUT', body: { order_index: swapIdx } }),
      api(`/stops/${b.id}`, { method: 'PUT', body: { order_index: idx } }),
    ]);
    await load();
  } catch (err) {
    showMsg(msg, err.message);
  }
}

async function deleteStop(stopId, cityName) {
  if (!confirm(`Remove ${cityName} from this trip?`)) return;
  try {
    await api(`/stops/${stopId}`, { method: 'DELETE' });
    await load();
  } catch (err) {
    showMsg(msg, err.message);
  }
}

async function removeActivity(stopId, stopActivityId) {
  try {
    await api(`/stops/${stopId}/activities/${stopActivityId}`, { method: 'DELETE' });
    await load();
  } catch (err) {
    showMsg(msg, err.message);
  }
}

function toggleActivitySearch(stop) {
  const panel = document.getElementById(`actsearch-${stop.id}`);
  const isHidden = panel.classList.contains('hidden');
  document.querySelectorAll('.search-panel').forEach((p) => p.classList.add('hidden'));
  if (!isHidden) return;
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <div class="field-row">
      <div class="field">
        <label>Type</label>
        <select id="actType-${stop.id}">
          <option value="">All types</option>
          <option value="sightseeing">Sightseeing</option>
          <option value="culture">Culture</option>
          <option value="food">Food</option>
          <option value="adventure">Adventure</option>
          <option value="relaxation">Relaxation</option>
        </select>
      </div>
      <div class="field">
        <label>Max cost (USD)</label>
        <input type="number" id="actMaxCost-${stop.id}" min="0" placeholder="Any">
      </div>
    </div>
    <button class="btn small" id="actSearchBtn-${stop.id}">Search</button>
    <div id="actResults-${stop.id}" class="search-results"></div>
  `;
  const run = () => searchActivities(stop);
  document.getElementById(`actSearchBtn-${stop.id}`).addEventListener('click', run);
  run();
}

async function searchActivities(stop) {
  const type = document.getElementById(`actType-${stop.id}`).value;
  const maxCost = document.getElementById(`actMaxCost-${stop.id}`).value;
  const resultsEl = document.getElementById(`actResults-${stop.id}`);
  resultsEl.innerHTML = `<p class="text-muted">Searching…</p>`;
  try {
    const q = new URLSearchParams({ city_id: stop.city_id, type: type || '' });
    if (maxCost) q.set('maxCost', maxCost);
    const activities = await api(`/activities?${q.toString()}`);
    if (!activities.length) {
      resultsEl.innerHTML = `<p class="text-muted">No matching activities in ${escapeHtml(stop.city_name)}.</p>`;
      return;
    }
    resultsEl.innerHTML = activities
      .map(
        (a) => `
        <div class="search-result-item">
          <div>
            <div class="name">${escapeHtml(a.name)} <span class="badge muted">${escapeHtml(a.type)}</span></div>
            <div class="meta">${fmtMoney(a.cost)} · ${a.duration_hours}h — ${escapeHtml(a.description || '')}</div>
          </div>
          <button class="btn small" data-add-activity="${a.id}">Add</button>
        </div>`
      )
      .join('');
    resultsEl.querySelectorAll('[data-add-activity]').forEach((btn) => {
      btn.addEventListener('click', () => addActivity(stop.id, Number(btn.dataset.addActivity)));
    });
  } catch (err) {
    resultsEl.innerHTML = `<p class="msg error">${escapeHtml(err.message)}</p>`;
  }
}

async function addActivity(stopId, activityId) {
  try {
    await api(`/stops/${stopId}/activities`, { method: 'POST', body: { activity_id: activityId } });
    await load();
  } catch (err) {
    showMsg(msg, err.message);
  }
}

// ---- Add stop: city search ----
const citySearchInput = document.getElementById('citySearch');
const cityResultsEl = document.getElementById('cityResults');

citySearchInput.addEventListener('input', () => {
  clearTimeout(citySearchTimer);
  const query = citySearchInput.value.trim();
  citySearchTimer = setTimeout(() => searchCities(query), 250);
});

async function searchCities(query) {
  if (!query) {
    cityResultsEl.innerHTML = '';
    return;
  }
  try {
    const cities = await api(`/cities?search=${encodeURIComponent(query)}`);
    cityResultsEl.innerHTML = cities
      .slice(0, 8)
      .map(
        (c) => `
        <div class="search-result-item">
          <div>
            <div class="name">${escapeHtml(c.name)}</div>
            <div class="meta">${escapeHtml(c.country)} · cost index ${c.cost_index}/10 · popularity ${c.popularity}</div>
          </div>
          <button class="btn small" data-pick-city="${c.id}" data-city-name="${escapeHtml(c.name)}" data-city-country="${escapeHtml(c.country)}">Add to Trip</button>
        </div>`
      )
      .join('');
    cityResultsEl.querySelectorAll('[data-pick-city]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('selectedCityId').value = btn.dataset.pickCity;
        const label = document.getElementById('selectedCityLabel');
        label.textContent = `Selected: ${btn.dataset.cityName}, ${btn.dataset.cityCountry}`;
        label.classList.remove('hidden');
        cityResultsEl.innerHTML = '';
        citySearchInput.value = btn.dataset.cityName;
      });
    });
  } catch (err) {
    cityResultsEl.innerHTML = `<p class="msg error">${escapeHtml(err.message)}</p>`;
  }
}

document.getElementById('addStopBtn').addEventListener('click', async () => {
  const cityId = document.getElementById('selectedCityId').value;
  const startDate = document.getElementById('stopStart').value;
  const endDate = document.getElementById('stopEnd').value;
  if (!cityId) return showMsg(msg, 'Search for and select a city first.');
  if (!startDate || !endDate) return showMsg(msg, 'Choose arrival and departure dates.');
  if (endDate < startDate) return showMsg(msg, 'Departure date must be on or after arrival date.');
  try {
    await api(`/trips/${tripId}/stops`, {
      method: 'POST',
      body: { city_id: Number(cityId), start_date: startDate, end_date: endDate, order_index: trip.stops.length },
    });
    document.getElementById('selectedCityId').value = '';
    document.getElementById('selectedCityLabel').classList.add('hidden');
    citySearchInput.value = '';
    document.getElementById('stopStart').value = '';
    document.getElementById('stopEnd').value = '';
    msg.classList.add('hidden');
    await load();
  } catch (err) {
    showMsg(msg, err.message);
  }
});

// ---- Edit trip ----
const editPanel = document.getElementById('editPanel');
document.getElementById('editTripBtn').addEventListener('click', () => {
  document.getElementById('editName').value = trip.name;
  document.getElementById('editStart').value = trip.start_date || '';
  document.getElementById('editEnd').value = trip.end_date || '';
  document.getElementById('editDescription').value = trip.description || '';
  editPanel.classList.remove('hidden');
});
document.getElementById('cancelEditBtn').addEventListener('click', () => editPanel.classList.add('hidden'));
document.getElementById('saveTripBtn').addEventListener('click', async () => {
  try {
    await api(`/trips/${tripId}`, {
      method: 'PUT',
      body: {
        name: document.getElementById('editName').value.trim(),
        start_date: document.getElementById('editStart').value || null,
        end_date: document.getElementById('editEnd').value || null,
        description: document.getElementById('editDescription').value.trim(),
      },
    });
    editPanel.classList.add('hidden');
    await load();
  } catch (err) {
    showMsg(msg, err.message);
  }
});

// ---- Share ----
const sharePanel = document.getElementById('sharePanel');
document.getElementById('shareBtn').addEventListener('click', async () => {
  try {
    const { share_token } = await api(`/trips/${tripId}/share`, { method: 'POST' });
    document.getElementById('shareLink').value = `${location.origin}/shared.html?token=${share_token}`;
    sharePanel.classList.remove('hidden');
  } catch (err) {
    showMsg(msg, err.message);
  }
});
document.getElementById('copyShareBtn').addEventListener('click', () => {
  const input = document.getElementById('shareLink');
  input.select();
  navigator.clipboard?.writeText(input.value).catch(() => {});
});
document.getElementById('revokeShareBtn').addEventListener('click', async () => {
  try {
    await api(`/trips/${tripId}/share`, { method: 'DELETE' });
    sharePanel.classList.add('hidden');
  } catch (err) {
    showMsg(msg, err.message);
  }
});

// ---- View toggle ----
const listViewBtn = document.getElementById('listViewBtn');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const listView = document.getElementById('listView');
const calendarView = document.getElementById('calendarView');

listViewBtn.addEventListener('click', () => {
  listViewBtn.classList.add('active');
  calendarViewBtn.classList.remove('active');
  listView.classList.remove('hidden');
  calendarView.classList.add('hidden');
});
calendarViewBtn.addEventListener('click', () => {
  calendarViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
  calendarView.classList.remove('hidden');
  listView.classList.add('hidden');
  renderCalendar();
});

function renderCalendar() {
  if (!trip.stops.length) {
    calendarView.innerHTML = `<div class="empty-state"><p>Add stops to see your day-by-day calendar.</p></div>`;
    return;
  }
  const days = [];
  for (const stop of trip.stops) {
    const start = new Date(stop.start_date);
    const end = new Date(stop.end_date);
    const nights = Math.max(1, Math.round((end - start) / 86400000));
    for (let d = 0; d < nights; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      days.push({ date: day, stop });
    }
  }
  calendarView.innerHTML = days
    .map(({ date, stop }) => {
      const dayActs = stop.activities;
      return `
      <div class="calendar-day">
        <div class="day-title">${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} — <span class="city">${escapeHtml(stop.city_name)}</span></div>
        ${
          dayActs.length
            ? dayActs
                .map((a) => `<div class="activity-row"><div><span class="name">${escapeHtml(a.name)}</span> <span class="badge muted">${escapeHtml(a.type)}</span></div><div class="meta">${fmtMoney(a.cost)}</div></div>`)
                .join('')
            : `<p class="text-muted" style="margin:4px 0;">Free day / no activities scheduled.</p>`
        }
      </div>`;
    })
    .join('');
}

load().catch((err) => showMsg(msg, err.message));
