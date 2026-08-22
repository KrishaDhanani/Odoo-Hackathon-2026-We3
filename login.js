if (getToken()) location.href = 'dashboard.html';

const msg = document.getElementById('msg');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const toggleLink = document.getElementById('toggleLink');
const toggleText = document.getElementById('toggleText');
let showingLogin = true;

toggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  showingLogin = !showingLogin;
  loginForm.classList.toggle('hidden', !showingLogin);
  signupForm.classList.toggle('hidden', showingLogin);
  toggleLink.textContent = showingLogin ? 'Sign up' : 'Log in';
  toggleText.textContent = showingLogin ? "Don't have an account?" : 'Already have an account?';
  msg.classList.add('hidden');
});

document.getElementById('forgotLink').addEventListener('click', (e) => {
  e.preventDefault();
  showMsg(msg, 'Password resets aren’t wired up in this demo build — sign up for a new account instead.', 'error');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.classList.add('hidden');
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    location.href = 'dashboard.html';
  } catch (err) {
    showMsg(msg, err.message);
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.classList.add('hidden');
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  try {
    const data = await api('/auth/signup', { method: 'POST', body: { name, email, password } });
    setToken(data.token);
    setUser(data.user);
    location.href = 'dashboard.html';
  } catch (err) {
    showMsg(msg, err.message);
  }
});
