(() => {
  const sb = window.primeSupabase;
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const orgNames = {
    sahp:'SAHP', lspd:'LSPD', ng:'NG', li:'LI', ballas:'Ballas',
    'marabunta-grande':'Marabunta Grande', vagos:'Vagos', families:'Families', bloods:'Bloods'
  };
  let currentRole = 'player';

  async function loadRole(userId) {
    const { data } = await sb.from('profiles').select('role').eq('id', userId).maybeSingle();
    currentRole = data?.role || 'player';
    if (currentRole === 'admin') {
      $('organization')?.removeAttribute('required');
      const label = document.querySelector('label[for="organization"]');
      if (label) label.textContent = 'Organization (optional for admins)';
      const help = document.createElement('small');
      help.className = 'text-muted';
      help.textContent = 'Admins can leave this as “Select an organization” to submit an unassigned application.';
      $('organization')?.insertAdjacentElement('afterend', help);
    }
  }

  async function loadApplications() {
    const grid = $('applicationsGrid');
    if (!sb) { grid.innerHTML = '<div class="forum-empty">Supabase is not configured.</div>'; return; }
    const { data, error } = await sb.from('org_leader_applications').select('id,organization_name,organization_slug,status,answers,created_at').eq('status','approved').order('created_at',{ascending:false});
    if (error) { grid.innerHTML = `<div class="forum-empty">${esc(error.message)}</div>`; return; }
    grid.innerHTML = (data || []).map(a => {
      const answer = typeof a.answers === 'object' ? (a.answers.summary || a.answers.application || '') : String(a.answers || '');
      return `<article class="app-card"><span class="status">APPROVED · EN1</span><h3>${esc(a.organization_name || orgNames[a.organization_slug] || 'Organization')}</h3><p>${esc(answer).slice(0,260)}${String(answer).length > 260 ? '…' : ''}</p><small class="text-muted">Published ${new Date(a.created_at).toLocaleDateString()}</small></article>`;
    }).join('') || '<div class="forum-empty">No approved leader applications have been published yet.</div>';
  }

  $('applicationForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('applicationMessage');
    if (!sb) { msg.textContent = 'Supabase is not configured.'; return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { location.href = 'login.html?redirect=applications.html'; return; }
    const slug = $('organization').value;
    const text = $('applicationAnswers').value.trim();
    if (!text) { msg.textContent = 'Complete your application before submitting.'; return; }
    if (!slug && currentRole !== 'admin') { msg.textContent = 'Please select an organization and complete your application.'; return; }
    const applicationSlug = slug || 'unassigned';
    const applicationName = slug ? (orgNames[slug] || slug) : 'Unassigned';
    const button = e.currentTarget.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = 'Submitting...'; }
    const { error } = await sb.from('org_leader_applications').insert({
      applicant_id: user.id,
      organization_name: applicationName,
      organization_slug: applicationSlug,
      answers: { application: text }
    });
    if (button) { button.disabled = false; button.textContent = 'Submit Application'; }
    if (error) { msg.textContent = error.message; return; }
    $('applicationAnswers').value = '';
    msg.textContent = applicationSlug === 'unassigned'
      ? 'Unassigned application submitted successfully. Staff will review it.'
      : 'Application submitted successfully. Staff will review it before publication.';
  });

  async function init() {
    if (!sb) { loadApplications(); return; }
    const { data: { user } } = await sb.auth.getUser();
    if (user) await loadRole(user.id);
    await loadApplications();
  }

  init();
})();
