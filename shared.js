const params = new URLSearchParams(location.search);
const token = params.get('token');
const msg = document.getElementById('msg');
const content = document.getElementById('content');

async function load() {
  if (!token) {
    showMsg(msg, 'No share token provided.');
    return;
  }
  const trip = await api(`/public/${token}`);

  const cover = trip.cover_photo || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900';
  const copyBtnHtml = getToken()
    ? `<button class="btn accent" id="copyTripBtn">Copy this trip to my account</button>`
    : `<a class="btn accent" href="index.html">Log in to copy this trip</a>`;

  content.innerHTML = `
    <div class="cover" style="background-image:url('${escapeHtml(cover)}');height:220px;border-radius:12px;margin-bottom:20px;"></div>
    <div class="page-header">
      <div>
        <h1>${escapeHtml(trip.name)}</h1>
        <p class="text-muted">${fmtDate(trip.start_date)} — ${fmtDate(trip.end_date)} · shared by ${escapeHtml(trip.owner_name)}</p>
        <p>${escapeHtml(trip.description || '')}</p>
      </div>
      ${copyBtnHtml}
    </div>
    <div id="stopsContainer"></div>
  `;

  const stopsEl = document.getElementById('stopsContainer');
  if (!trip.stops.length) {
    stopsEl.innerHTML = `<p class="text-muted">This trip has no stops yet.</p>`;
  } else {
    stopsEl.innerHTML = trip.stops
      .map(
        (stop, idx) => `
      <div class="stop-block">
        <div class="stop-header">
          <div>
            <h3>${idx + 1}. ${escapeHtml(stop.city_name)}, ${escapeHtml(stop.country)}</h3>
            <div class="dates">${fmtDate(stop.start_date)} — ${fmtDate(stop.end_date)}</div>
          </div>
        </div>
        <div class="stop-body">
          ${
            stop.activities.length
              ? stop.activities
                  .map(
                    (a) => `
              <div class="activity-row">
                <div><span class="name">${escapeHtml(a.name)}</span> <span class="badge muted">${escapeHtml(a.type)}</span></div>
                <div class="meta">${fmtMoney(a.cost)}</div>
              </div>`
                  )
                  .join('')
              : `<p class="text-muted">No activities planned.</p>`
          }
        </div>
      </div>`
      )
      .join('');
  }

  const copyBtn = document.getElementById('copyTripBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        const result = await api(`/public/${token}/copy`, { method: 'POST' });
        location.href = `itinerary.html?id=${result.trip_id}`;
      } catch (err) {
        showMsg(msg, err.message);
      }
    });
  }
}

load().catch((err) => showMsg(msg, err.message));
