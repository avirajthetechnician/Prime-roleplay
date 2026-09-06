/* PRIME ROLEPLAY — SUPABASE AUTH */
(() => {
  const sb = window.primeSupabase;
  if (!sb) return;

  const toast = (message, type = 'info') => {
    if (typeof window.showToast === 'function') { window.showToast(message, type); return; }
    alert(message);
  };
  const setMessage = (id, message, error = false) => {
    const el = document.getElementById(id); if (!el) return;
    el.textContent = message; el.style.color = error ? '#ff6b7a' : 'var(--blue-light)';
  };
  const apiBase = `${window.PRIME_SUPABASE_CONFIG?.url || ''}/functions/v1`;

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('registerUsername')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const confirm = document.getElementById('registerConfirm')?.value;
    const agree = document.getElementById('registerAgree')?.checked;
    const button = registerForm.querySelector('button[type="submit"]');
    if (!username || username.length < 3) return setMessage('authMessage', 'Username must be at least 3 characters.', true);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return setMessage('authMessage', 'Enter a valid email address.', true);
    if (!password || password.length < 8) return setMessage('authMessage', 'Password must be at least 8 characters.', true);
    if (password !== confirm) return setMessage('authMessage', 'Passwords do not match.', true);
    if (!agree) return setMessage('authMessage', 'You must agree to the rules.', true);
    if (button) { button.disabled = true; button.textContent = 'Creating Account...'; }
    try {
      const response = await fetch(`${apiBase}/register-user`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,email,password}) });
      const result = await response.json();
      if (!response.ok) { setMessage('authMessage', result.error || 'Could not create account.', true); return; }
      if (result.access_token && result.refresh_token) await sb.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
      setMessage('authMessage', 'Account created! Redirecting...');
      setTimeout(() => { window.location.href = 'forum.html'; }, 500);
    } catch (error) { setMessage('authMessage', 'Registration failed. Please try again.', true); }
    finally { if (button) { button.disabled = false; button.textContent = 'Create Account'; } }
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const identifier = document.getElementById('loginIdentifier')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const button = loginForm.querySelector('button[type="submit"]');
    if (!identifier) return setMessage('authMessage', 'Enter your email or username.', true);
    if (!password) return setMessage('authMessage', 'Enter your password.', true);
    if (button) { button.disabled = true; button.textContent = 'Logging In...'; }
    try {
      const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
      let result;
      if (isEmail) {
        const response = await sb.auth.signInWithPassword({ email: identifier, password });
        if (response.error) { setMessage('authMessage', response.error.message, true); return; }
      } else {
        const response = await fetch(`${apiBase}/username-login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({identifier,password}) });
        result = await response.json();
        if (!response.ok) { setMessage('authMessage', result.error || 'Invalid username/email or password.', true); return; }
        await sb.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
      }
      setMessage('authMessage', 'Login successful! Redirecting...');
      const redirect = new URLSearchParams(location.search).get('redirect');
      setTimeout(() => { window.location.href = redirect || 'forum.html'; }, 400);
    } catch (error) { setMessage('authMessage', 'Login failed. Please try again.', true); }
    finally { if (button) { button.disabled = false; button.textContent = 'Login'; } }
  });

  window.primeAuth = {
    async getUser() { const { data } = await sb.auth.getUser(); return data.user || null; },
    async signOut() { const { error } = await sb.auth.signOut(); if (error) toast(error.message, 'error'); else window.location.href = 'index.html'; }
  };
})();
