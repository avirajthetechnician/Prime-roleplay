(() => {
  const sb = window.primeSupabase;
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const orgNames = {
    sahp:'SAHP', lspd:'LSPD', ng:'NG', li:'LI', ballas:'Ballas',
    'marabunta-grande':'Marabunta Grande', vagos:'Vagos', families:'Families', bloods:'Bloods'
  };

  let currentRole = 'player';

  function message(text, error = false) {
    const el = $('applicationMessage');
    if (!el) return;
    el.textContent = text;
    el.style.color = error ? '#ff6b7a' : '';
  }

  async function getCurrentUser() {
    if (!sb) throw new Error('Supabase is not configured.');
    const { data, error } = await sb.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  async function loadRole(userId) {
    const { data, error } = await sb.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (error) throw error;
    currentRole = data?.role || 'player';

    const select = $('organization');
    const label = document.querySelector('label[for="organization"]');
    if (currentRole === 'admin') {
      select?.removeAttribute('required');
      if (label) label.textContent = 'Organization (optional for admins)';
      let help = document.getElementById('adminOrgHelp');
      if (!help && select) {
        help = document.createElement('small');
        help.id = 'adminOrgHelp';
        help.className = 'text-muted';
        help.textContent = 'Admin mode: leave this on “Select an organization” for an unassigned application.';
        select.insertAdjacentElement('afterend', help);
      }
    }
  }

  async function loadApplications() {
    const grid = $('applicationsGrid');
    if (!grid) return;
    if (!sb) {
      grid.innerHTML = '<div class="forum-empty">Supabase is not configured.</div>';
      return;
    }

    const { data, error } = await sb
      .from('org_leader_applications')
      .select('id,organization_name,organization_slug,status,answers,created_at')
      .eq('status','approved')
      .order('created_at',{ascending:false});

    if (error) {
      grid.innerHTML = `<div class="forum-empty">${esc(error.message)}</div>`;
      return;
    }

    grid.innerHTML = (data || []).map(a => {
      const answer = typeof a.answers === 'object' ? (a.answers.summary || a.answers.application || '') : String(a.answers || '');
      return `<article class="app-card"><span class="status">APPROVED · EN1</span><h3>${esc(a.organization_name || orgNames[a.organization_slug] || 'Organization')}</h3><p>${esc(answer).slice(0,260)}${String(answer).length > 260 ? '…' : ''}</p><small class="text-muted">Published ${new Date(a.created_at).toLocaleDateString()}</small></article>`;
    }).join('') || '<div class="forum-empty">No approved leader applications have been published yet.</div>';
  }

  async function submitApplication(e) {
    e.preventDefault();
    message('Submitting...');

    try {
      if (!sb) throw new Error('Supabase is not configured.');

      const user = await getCurrentUser();
      if (!user) {
        location.href = 'login.html?redirect=applications.html';
        return;
      }

      // Refresh the role immediately before submission so an old page cannot
      // accidentally use a stale role value.
      await loadRole(user.id);

      const slug = ($('organization')?.value || '').trim();
      const text = ($('applicationAnswers')?.value || '').trim();

      if (!text) {
        message('Complete your application before submitting.', true);
        return;
      }

      if (!slug && currentRole !== 'admin') {
        message('Please select an organization.', true);
        return;
      }

      const applicationSlug = slug || 'unassigned';
      const applicationName = slug ? (orgNames[slug] || slug) : 'Unassigned';
      const button = $('applicationForm')?.querySelector('button[type="submit"]');
      if (button) { button.disabled = true; button.textContent = 'Submitting...'; }

      const { error } = await sb.from('org_leader_applications').insert({
        applicant_id: user.id,
        organization_name: applicationName,
        organization_slug: applicationSlug,
        answers: { application: text }
      });

      if (button) { button.disabled = false; button.textContent = 'Submit Application'; }

      if (error) throw error;

      $('applicationAnswers').value = '';
      if ($('organization')) $('organization').value = '';
      message(applicationSlug === 'unassigned'
        ? 'Unassigned application submitted successfully. Staff will review it.'
        : 'Application submitted successfully. Staff will review it before publication.');
      await loadApplications();
    } catch (err) {
      const text = err?.message || String(err) || 'Unknown error while submitting.';
      console.error('Prime Roleplay application submission error:', err);
      message(`Submission failed: ${text}`, true);
      const button = $('applicationForm')?.querySelector('button[type="submit"]');
      if (button) { button.disabled = false; button.textContent = 'Submit Application'; }
    }
  }

  async function init() {
    try {
      if (sb) {
        const user = await getCurrentUser();
        if (user) await loadRole(user.id);
      }
    } catch (err) {
      console.error('Prime Roleplay applications init error:', err);
      // Do not block the page; submission will show the exact error.
    }

    $('applicationForm')?.addEventListener('submit', submitApplication);
    await loadApplications();
  }

  init();
})();