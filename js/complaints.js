(() => {
  const sb = window.primeSupabase;
  const $ = id => document.getElementById(id);
  const form = $('complaintForm');
  const message = $('complaintMessage');
  const type = $('complaintType');
  const target = $('targetName');
  const subject = $('complaintSubject');
  const description = $('complaintDescription');
  const evidence = $('evidenceUrl');
  const list = $('myComplaints');

  document.querySelectorAll('[data-type]').forEach(card => card.addEventListener('click', () => {
    type.value = card.dataset.type;
  }));

  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  async function loadMine() {
    if (!sb) return;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data, error } = await sb.from('complaints').select('id,complaint_type,target_name,subject,status,created_at').eq('complainant_id', user.id).order('created_at', { ascending:false }).limit(8);
    if (error) { list.innerHTML = `<div class="forum-empty">${esc(error.message)}</div>`; return; }
    if (!data?.length) { list.innerHTML = '<div class="forum-empty">You have not submitted any complaints.</div>'; return; }
    list.innerHTML = data.map(c => `<div class="complaint-mini"><strong>${esc(c.subject)}</strong><span>${c.complaint_type === 'administrator' ? 'Administrator' : 'Player'} · ${esc(c.target_name)} · ${new Date(c.created_at).toLocaleDateString()}</span><span class="status-badge">${esc(c.status.replace('_',' '))}</span></div>`).join('');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    message.textContent = '';
    if (!sb) { message.textContent = 'Supabase is not configured.'; return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { location.href = 'login.html?redirect=complaints.html'; return; }
    if (!type.value) { message.textContent = 'Select a complaint type.'; return; }
    if (evidence.value && !/^https?:\\/\\//i.test(evidence.value)) { message.textContent = 'Evidence must be a valid https:// or http:// link.'; return; }
    message.textContent = 'Submitting complaint...';
    const { error } = await sb.from('complaints').insert({
      complainant_id: user.id,
      complaint_type: type.value,
      target_name: target.value.trim(),
      subject: subject.value.trim(),
      description: description.value.trim(),
      evidence_url: evidence.value.trim() || null
    });
    if (error) { message.textContent = error.message; return; }
    form.reset();
    message.textContent = 'Complaint submitted successfully. Staff will review it.';
    await loadMine();
  });

  loadMine();
})();
