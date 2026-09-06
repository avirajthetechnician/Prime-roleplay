(() => {
  const sb=window.primeSupabase, id=new URLSearchParams(location.search).get('id');
  const $=x=>document.getElementById(x), esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  async function load(){
    if(!sb){$('threadBody').textContent='Supabase is not configured yet.';return}
    if(!id){$('threadTitle').textContent='Discussion not found';return}
    const {data:t,error}=await sb.from('forum_thread_list').select('*').eq('id',id).single();
    if(error){$('threadTitle').textContent='Discussion not found';$('threadBody').textContent=error.message;return}
    $('threadTitle').textContent=t.title;$('threadMeta').textContent=`${t.category_name} · Started by ${t.author_name} · ${new Date(t.created_at).toLocaleString()} · ${t.reply_count||0} replies`;
    $('threadBody').innerHTML=`<div class="thread-meta" style="margin-bottom:12px">${esc(t.category_name)} · ${esc(t.author_name)}</div><div style="white-space:pre-wrap;line-height:1.8">${esc(t.body)}</div>`;
    const {data:posts,error:pe}=await sb.from('forum_posts').select('id,body,author_id,created_at,profiles(display_name,username)').eq('thread_id',id).order('created_at');
    if(pe){$('replyList').innerHTML=`<div class="forum-empty">${esc(pe.message)}</div>`;return}
    $('replyList').innerHTML=(posts||[]).map(p=>`<article class="thread-row"><div><div style="font-weight:600;margin-bottom:8px">${esc(p.profiles?.display_name||p.profiles?.username||'Prime Member')}</div><div style="white-space:pre-wrap;color:var(--muted)">${esc(p.body)}</div></div><div class="thread-meta">${new Date(p.created_at).toLocaleString()}</div></article>`).join('')||'<div class="forum-empty">No replies yet.</div>';
  }
  $('replyForm').addEventListener('submit',async e=>{e.preventDefault();const msg=$('replyMessage');if(!sb){msg.textContent='Connect Supabase first.';return}const {data:{user}}=await sb.auth.getUser();if(!user){location.href=`login.html?redirect=forum-thread.html?id=${encodeURIComponent(id)}`;return}const body=$('replyBody').value.trim();if(!body){msg.textContent='Write something first.';return}msg.textContent='Posting...';const {error}=await sb.from('forum_posts').insert({thread_id:id,author_id:user.id,body});if(error){msg.textContent=error.message;return}$('replyBody').value='';msg.textContent='Reply posted.';load()});
  load();
})();
