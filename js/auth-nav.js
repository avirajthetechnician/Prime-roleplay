/* PRIME ROLEPLAY — AUTH NAVBAR */
(() => {
  const sb = window.primeSupabase;
  if (!sb) return;

  const setLoggedInNav = async () => {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    let username = user.user_metadata?.username || user.user_metadata?.display_name;
    if (!username) {
      const { data: profile } = await sb.from('profiles').select('username,display_name').eq('id', user.id).maybeSingle();
      username = profile?.username || profile?.display_name;
    }
    username = username || 'Account';

    document.querySelectorAll('.nav-actions a[href="login.html"]').forEach(link => {
      link.textContent = username;
      link.href = 'profile.html';
      link.setAttribute('aria-label', `Open ${username}'s profile`);
    });

    document.querySelectorAll('.mobile-panel .nav-actions a[href="login.html"]').forEach(link => {
      link.textContent = username;
      link.href = 'profile.html';
    });

    document.querySelectorAll('.nav-actions a[href="register.html"]').forEach(link => {
      link.textContent = 'Profile';
      link.href = 'profile.html';
    });
  };

  setLoggedInNav();
  sb.auth.onAuthStateChange(() => setTimeout(setLoggedInNav, 0));
})();
