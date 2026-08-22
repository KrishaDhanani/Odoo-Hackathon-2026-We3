requireAuth();
renderNav('trips');

const params = new URLSearchParams(location.search);
const tripId = params.get('id');
const msg = document.getElementById('msg');

if (!tripId) location.href = 'my-trips.html';

document.getElementById('backLink').href = `itinerary.html?id=${tripId}`;

const CATEGORY_COLORS = {
  transport: '#0e7c8c',
  accommodation: '#ff7a59',
  activities: '#2e9e5b',
  meals: '#8a6fd4',
};

async function load() {
  const [trip, budget] = await Promise.all([api(`/trips/${tripId}`), api(`/trips/${tripId}/budget`)]);
  document.getElementById('tripName').textContent = `Budget — ${trip.name}`;

  const overBudgetBadge = budget.over_budget
    ? `<span class="badge warn">Over budget</span>`
    : `<span class="badge">On track</span>`;

  document.getElementById('stats').innerHTML = `
    <div class="stat-tile"><div class="value">${fmtMoney(budget.total)}</div><div class="label">Estimated total</div></div>
    <div class="stat-tile"><div class="value">${fmtMoney(budget.avg_per_day)}</div><div class="label">Average per day</div></div>
    <div class="stat-tile"><div class="value">${budget.budget_limit ? fmtMoney(budget.budget_limit) : '—'}</div><div class="label">Your budget limit ${overBudgetBadge}</div></div>
  `;

  const maxCat = Math.max(...Object.values(budget.breakdown), 1);
  document.getElementById('breakdownChart').innerHTML = Object.entries(budget.breakdown)
    .map(([cat, val]) => {
      const pct = Math.round((val / maxCat) * 100);
      return `
      <div class="bar-row">
        <div style="text-transform:capitalize;">${escapeHtml(cat)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${CATEGORY_COLORS[cat] || '#0e7c8c'};"></div></div>
        <div>${fmtMoney(val)}</div>
      </div>`;
    })
    .join('');

  if (!budget.daily.length) {
    document.getElementById('dailyChart').innerHTML = `<p class="text-muted">Add stops with dates to see a daily breakdown.</p>`;
  } else {
    const maxDay = Math.max(...budget.daily.map((d) => d.cost), 1);
    document.getElementById('dailyChart').innerHTML = budget.daily
      .map((d) => {
        const pct = Math.round((d.cost / maxDay) * 100);
        const over = budget.over_budget_days.includes(d.date);
        return `
        <div class="bar-row ${over ? 'overbudget' : ''}">
          <div>${fmtDate(d.date)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%;"></div></div>
          <div>${fmtMoney(d.cost)}</div>
        </div>`;
      })
      .join('');
  }

  document.getElementById('overBudgetNote').textContent = budget.over_budget_days.length
    ? `Heads up: ${budget.over_budget_days.map(fmtDate).join(', ')} run notably above your average daily spend.`
    : 'No days stand out as unusually expensive.';
}

load().catch((err) => showMsg(msg, err.message));
