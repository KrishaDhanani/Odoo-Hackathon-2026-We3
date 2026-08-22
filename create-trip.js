requireAuth();
renderNav('create');

const msg = document.getElementById('msg');

document.getElementById('tripForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.classList.add('hidden');

  const name = document.getElementById('name').value.trim();
  const start_date = document.getElementById('startDate').value;
  const end_date = document.getElementById('endDate').value;
  const description = document.getElementById('description').value.trim();
  const cover_photo = document.getElementById('coverPhoto').value.trim();
  const budgetLimitVal = document.getElementById('budgetLimit').value;

  if (end_date < start_date) {
    showMsg(msg, 'End date must be on or after the start date.');
    return;
  }

  try {
    const trip = await api('/trips', {
      method: 'POST',
      body: {
        name,
        start_date,
        end_date,
        description,
        cover_photo: cover_photo || null,
        budget_limit: budgetLimitVal ? Number(budgetLimitVal) : null,
      },
    });
    location.href = `itinerary.html?id=${trip.id}`;
  } catch (err) {
    showMsg(msg, err.message);
  }
});
