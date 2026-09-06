/* PRIME ROLEPLAY — PROFILE */
(() => {
  const sb = window.primeSupabase;
  const $ = id => document.getElementById(id);
  const setMessage = (text, error = false) => { const el = $('profileMessage'); if (el) { el.textContent = text; el.style.color = error ? '#ff6b7a' : 'var(--blue-light)'; } };
  const fallbackAvatar = username => `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'Prime Member')}&background=1677ff&color=ffffff&bold=true&size=256`;

  async function loadProfile() {
    if (!sb) { $('profileLoading').textContent = 'Supabase is not configured.'; return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { location.href = `login.html?redirect=${encodeURIComponent('profile.html')}`; return; }

    const { data: profile, error } = await sb.from('profiles').select('id,username,display_name,avatar_url,pfp_url,contact_email,ingame_name,ingame_id,role,created_at').eq('id', user.id).maybeSingle();
    if (error) { $('profileLoading').textContent = error.message; return; }
    if (!profile) { $('profileLoading').textContent = 'Profile could not be found.'; return; }

    const username = profile.username || user.user_metadata?.username || 'Prime Member';
    $('profileUsername').textContent = username;
    $('profileEmail').value = profile.contact_email || user.email || '';
    $('profileIngame').value = profile.ingame_name || '';
    $('profileIngameId').value = profile.ingame_id || '';
    $('profileJoined').textContent = profile.created_at ? `Member since ${new Date(profile.created_at).toLocaleDateString()}` : 'Prime Member';
    $('profileAvatar').src = profile.pfp_url || profile.avatar_url || fallbackAvatar(username);
    $('profileAvatar').onerror = () => { $('profileAvatar').src = fallbackAvatar(username); };
    $('profileLoading').hidden = true;
    $('profileContent').hidden = false;
  }

  $('profileForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!sb) return setMessage('Supabase is not configured.', true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return location.href = `login.html?redirect=${encodeURIComponent('profile.html')}`;
    const email = $('profileEmail').value.trim();
    const ingame = $('profileIngame').value.trim();
    const ingameId = $('profileIngameId').value.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setMessage('Enter a valid email address.', true);
    if (ingameId && !/^\d+$/.test(ingameId)) return setMessage('In-Game ID must contain numbers only.', true);
    const button = $('saveProfileBtn');
    button.disabled = true; button.textContent = 'Saving...';
    const { error } = await sb.from('profiles').update({ contact_email: email || null, ingame_name: ingame || null, ingame_id: ingameId || null, updated_at: new Date().toISOString() }).eq('id', user.id);
    button.disabled = false; button.textContent = 'Save Changes';
    if (error) return setMessage(error.message, true);
    setMessage('Profile saved successfully.');
  });

  $('avatarInput')?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file || !sb) return;
    if (file.size > 5 * 1024 * 1024) { setMessage('PFP must be 5 MB or smaller.', true); e.target.value = ''; return; }
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) { setMessage('Use PNG, JPG, WEBP or GIF.', true); e.target.value = ''; return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    setMessage('Uploading profile picture...');
    const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await sb.storage.from('profile-avatars').upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type });
    if (uploadError) { setMessage(uploadError.message, true); return; }
    const { data: publicUrl } = sb.storage.from('profile-avatars').getPublicUrl(path);
    const { error: profileError } = await sb.from('profiles').update({ pfp_url: publicUrl.publicUrl, avatar_url: publicUrl.publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (profileError) { setMessage(profileError.message, true); return; }
    $('profileAvatar').src = `${publicUrl.publicUrl}?v=${Date.now()}`;
    setMessage('Profile picture updated.');
    e.target.value = '';
  });

  $('signOutBtn')?.addEventListener('click', async () => {
    if (window.primeAuth) return window.primeAuth.signOut();
    await sb.auth.signOut(); location.href = 'index.html';
  });

  loadProfile();
})();
