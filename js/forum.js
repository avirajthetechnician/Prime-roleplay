(() => {
  const sb = window.primeSupabase;
  const categories = [
    {slug:'announcements', name:'Announcements', icon:'01', description:'Official Prime Roleplay news, updates and maintenance.'},
    {slug:'general', name:'General Discussion', icon:'02', description:'Talk about the city, community and anything Prime.'},
    {slug:'roleplay', name:'Roleplay', icon:'03', description:'Characters, stories, factions and in-city discussion.'},
    {slug:'guides', name:'Guides & Tutorials', icon:'04', description:'Share tips and learn how to master the city.'},
    {slug:'support', name:'Support', icon:'05', description:'Questions, technical help and account support.'},
    {slug:'suggestions', name:'Suggestions', icon:'06', description:'Ideas that could make Prime Roleplay better.'}
  ];
  const $ = id => document.getElementById(id);
  const list = $('threadList'), cats = $('forumCategories'), status = $('forumStatus');
  const notice = $('forumNotice'), modal = $('threadModal'), form = $('threadForm');
  let threads = [];
  function showNotice(text,error=false){notice.textContent=text;notice.classList.toggle('error',error);notice.hidden=false}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function timeAgo(date){const s=Math.max(1,Math.floor((Date.now()-new Date(date))/1000));if(s<60)return `${s}s ago`;const m=Math.floor(s/60);if(m<60)return `${m}m ago`;const h=Math.floor(m/60);if(h<24)return `${h}h ago`;return `${Math.floor(h/24)}d ago`}
  function renderCategories(){cats.innerHTML=categories.map(c=>`<button class="forum-category" data-category="${c.slug}"><span class="cat-icon">${c.icon}</span><h3>${c.name}</h3><p>${c.description}</p></button>`).join('');cats.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>filter(b.dataset.category)))}
  function render(data=threads){if(!data.length){list.innerHTML='<div class="forum-empty">No discussions found. Be the first to start one.</div>';return}list.innerHTML=data.map(t=>`<article class="thread-row"><div class="thread-main"><a class="thread-title" href="forum-thread.html?id=${encodeURIComponent(t.id)}">${esc(t.title)}</a><div class="thread-meta"><span class="thread-category">${esc(t.category_name||t.category)}</span> Started by <strong>${esc(t.author_name||'Prime Member')}</strong> · ${timeAgo(t.created_at)}</div></div><div class="thread-activity"><strong>${Number(t.reply_count||0)}</strong> replies</div></article>`).join('')}
  function filter(category){render(threads.filter(t=>t.category===category));status.textContent=`Showing ${category} discussions`}
  async function load(){renderCategories();if(!sb){status.textContent='Forum preview mode — connect Supabase to load live discussions.';render([]);showNotice('Supabase is not configured yet. Add your Project URL and publishable key to supabase-config.js.');return}const {data,error}=await sb.from('forum_thread_list').select('id,title,category,category_name,author_name,reply_count,created_at').order('created_at',{ascending:false}).limit(50);if(error){console.error(error);status.textContent='Could not load discussions';showNotice(error.message,true);render([]);return}threads=data||[];status.textContent=`${threads.length} recent discussions`;render()}
  async function openModal(){if(!sb){showNotice('Connect Supabase first, then sign in to create discussions.',true);return}const {data}=await sb.auth.getUser();if(!data.user){location.href='login.html?redirect=forum.html';return}modal.hidden=false}
  $('newThreadBtn').addEventListener('click',openModal);$('closeThreadModal').addEventListener('click',()=>modal.hidden=true);modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
  $('forumSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();render(!q?threads:threads.filter(t=>(t.title||'').toLowerCase().includes(q)||(t.category_name||t.category||'').toLowerCase().includes(q)))})
  form.addEventListener('submit',async e=>{e.preventDefault();const msg=$('threadFormMessage');msg.textContent='Publishing...';if(!sb){msg.textContent='Supabase is not configured.';return}const {data:{user}}=await sb.auth.getUser();if(!user){msg.textContent='Please log in first.';return}const title=$('threadTitle').value.trim(),category=$('threadCategory').value,body=$('threadBody').value.trim();const {error}=await sb.from('forum_threads').insert({title,category,body,author_id:user.id});if(error){msg.textContent=error.message;return}form.reset();modal.hidden=true;await load();showNotice('Discussion published successfully.')});
  $('threadCategory').innerHTML=categories.map(c=>`<option value="${c.slug}">${c.name}</option>`).join('');load();
})();
