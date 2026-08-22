requireAuth();
renderNav('profile');

const msg = document.getElementById('msg');

async function load() {
  const me = await api('/auth/me');
  document.getElementById('name').value = me.name;
  document.getElementById('email').value = me.email;
  document.getElementById('photo').value = me.photo || '';
  document.getElementById('language').value = me.language || 'en';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const updated = await api('/auth/me', {
      method: 'PUT',
      body: {
        name: document.getElementById('name').value.trim(),
        photo: document.getElementById('photo').value.trim(),
        language: document.getElementById('language').value,
      },
    });
    const user = getUser();
    setUser({ ...user, name: updated.name });
    renderNav('profile');
    showMsg(msg, 'Profile updated.', 'success');
  } catch (err) {
    showMsg(msg, err.message);
  }
});

document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
  if (!confirm('This will permanently delete your account and all trips. Continue?')) return;
  try {
    await api('/auth/me', { method: 'DELETE' });
    clearAuth();
    location.href = 'index.html';
  } catch (err) {
    showMsg(msg, err.message);
  }
});

load().catch((err) => showMsg(msg, err.message));
