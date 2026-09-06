(() => {
  const sb=window.primeSupabase, id=new URLSearchParams(location.search).get('id');
  const $=x=>document.getElementById(x), esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let thread=null, isStaff=false;
  async function getUser(){if(!sb)return null;const {data:{user}}=await sb.auth.getUser();return user||null;}
  async function checkStaff(user){if(!user)return false;const {data}=await sb.from('profiles').select('role').eq('id',user.id).maybeSingle();return data?.role==='admin'||data?.role==='moderator';}
  function closeMenu(){ $('threadMenu')?.classList.remove('open'); $('threadMenuBtn')?.setAttribute('aria-expanded','false'); }
  async function load(){
    if(!sb){$('threadBody').textContent='Supabase is not configured yet.';return}
    if(!id){$('threadTitle').textContent='Discussion not found';return}
    const user=await getUser(); isStaff=await checkStaff(user); if(isStaff)$('threadActions')?.style.setProperty('display','block');
    const {data:t,error}=await sb.from('forum_thread_list').select('*').eq('id',id).single();
    if(error){$('threadTitle').textContent='Discussion not found';$('threadBody').textContent=error.message;return}
    thread=t;$('threadTitle').textContent=t.title;$('threadMeta').textContent=`${t.category_name} · Started by ${t.author_name} · ${new Date(t.created_at).toLocaleString()} · ${t.reply_count||0} replies`;
    $('threadBody').innerHTML=`<div class="thread-meta" style="margin-bottom:12px">${t.is_pinned?'📌 Pinned · ':''}${esc(t.category_name)} · ${esc(t.author_name)}</div><div style="white-space:pre-wrap;line-height:1.8">${esc(t.body)}</div>`;
    const {data:posts,error:pe}=await sb.from('forum_posts').select('id,body,author_id,created_at,profiles(display_name,username)').eq('thread_id',id).order('created_at');
    if(pe){$('replyList').innerHTML=`<div class="forum-empty">${esc(pe.message)}</div>`;return}
    $('replyList').innerHTML=(posts||[]).map(p=>`<article class="thread-row"><div><div style="font-weight:600;margin-bottom:8px">${esc(p.profiles?.display_name||p.profiles?.username||'Prime Member')}</div><div style="white-space:pre-wrap;color:var(--muted)">${esc(p.body)}</div></div><div class="thread-meta">${new Date(p.created_at).toLocaleString()}</div></article>`).join('')||'<div class="forum-empty">No replies yet.</div>';
    const pinBtn=document.querySelector('[data-action="pin"]');if(pinBtn)pinBtn.textContent=t.is_pinned?'📌 Unpin':'📌 Pin';
  }
  async function action(action){
    if(!isStaff)return; closeMenu();
    if(action==='reply'){ $('replyBody')?.focus(); $('replyForm')?.scrollIntoView({behavior:'smooth',block:'center'}); return; }
    const labels={delete:'delete this thread',hide:'hide this thread',accept:'accept this thread',reject:'reject this thread',pin:'pin this thread',unpin:'unpin this thread'};
    if(!confirm(`Are you sure you want to ${labels[action]||action}?`))return;
    const {error}=await sb.rpc('manage_forum_thread',{p_thread:id,p_action:action});
    if(error){alert(error.message);return;}
    if(action==='delete'){location.href='forum.html';return;}
    await load();
  }
  $('threadMenuBtn')?.addEventListener('click',e=>{e.stopPropagation();const menu=$('threadMenu');menu.classList.toggle('open');$('threadMenuBtn').setAttribute('aria-expanded',menu.classList.contains('open')?'true':'false');});
  document.querySelectorAll('#threadMenu [data-action]').forEach(btn=>btn.addEventListener('click',()=>{let a=btn.dataset.action;if(a==='pin'&&thread?.is_pinned)a='unpin';action(a);}));
  document.addEventListener('click',e=>{if(!e.target.closest('.thread-menu-wrap'))closeMenu();});
  $('replyForm')?.addEventListener('submit',async e=>{e.preventDefault();const msg=$('replyMessage');if(!sb){msg.textContent='Connect Supabase first.';return}const user=await getUser();if(!user){location.href=`login.html?redirect=forum-thread.html?id=${encodeURIComponent(id)}`;return}const body=$('replyBody').value.trim();if(!body){msg.textContent='Write something first.';return}msg.textContent='Posting...';const {error}=await sb.from('forum_posts').insert({thread_id:id,author_id:user.id,body});if(error){msg.textContent=error.message;return}$('replyBody').value='';msg.textContent='Reply posted.';load()});
  load();
})();