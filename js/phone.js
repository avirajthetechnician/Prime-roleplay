(() => {
  const sb = window.primeSupabase;
  const $ = id => document.getElementById(id);
  const screens = [...document.querySelectorAll('[data-screen]')];
  const titles = {home:'Home',account:'Prime ID',messages:'Messages',contacts:'Contacts',bank:'Wallet',jobs:'Job Board',map:'City Map',garage:'Garage',settings:'Settings'};
  function open(name){ screens.forEach(s=>s.hidden=s.dataset.screen!==name); $('screenTitle').textContent=titles[name]||'Home'; document.querySelector('.phone-content').scrollTop=0; }
  document.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.app)));
  document.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',()=>open('home')));
  $('profileBtn').addEventListener('click',()=>open('account'));

  function accountView(user){
    $('accountLoggedOut').hidden=!!user; $('accountLogin').hidden=true; $('accountLoggedIn').hidden=!user;
    if(user){ $('phoneUserName').textContent=user.user_metadata?.display_name||user.user_metadata?.username||'Prime Citizen'; $('phoneUserEmail').textContent=user.email||''; }
  }
  async function refreshUser(){ if(!sb)return; const {data}=await sb.auth.getUser(); accountView(data.user); }

  $('showPhoneLogin').addEventListener('click',()=>{ $('accountLoggedOut').hidden=true; $('accountLogin').hidden=false; });
  $('showPhoneRegister').addEventListener('click',()=>{ $('accountLogin').hidden=true; $('accountLoggedOut').hidden=false; });

  $('phoneRegisterForm').addEventListener('submit',async e=>{
    e.preventDefault(); const msg=$('phoneAuthMessage'); const username=$('phoneUsername').value.trim(); const email=$('phoneEmail').value.trim(); const password=$('phonePassword').value; const confirm=$('phoneConfirm').value;
    if(password!==confirm){msg.textContent='Passwords do not match.';return;} if(!sb){msg.textContent='Account service is unavailable.';return;} msg.textContent='Creating Prime ID...';
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{username,display_name:username}}});
    if(error){msg.textContent=error.message;return;} msg.textContent=data.session?'Account created. Welcome to Prime.':'Account created. Check your email to verify it.'; if(data.session)accountView(data.user);
  });
  $('phoneLoginForm').addEventListener('submit',async e=>{
    e.preventDefault(); const msg=$('phoneLoginMessage'); if(!sb){msg.textContent='Account service is unavailable.';return;} msg.textContent='Signing in...';
    const {data,error}=await sb.auth.signInWithPassword({email:$('phoneLoginEmail').value.trim(),password:$('phoneLoginPassword').value}); if(error){msg.textContent=error.message;return;} msg.textContent='Signed in.'; accountView(data.user);
  });
  $('phoneLogout').addEventListener('click',async()=>{if(sb)await sb.auth.signOut();accountView(null);$('accountLoggedOut').hidden=false;});
  if(sb)sb.auth.onAuthStateChange((_event,session)=>accountView(session?.user||null));
  refreshUser();

  function clock(){const d=new Date();$('phoneTime').textContent=d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});$('phoneDate').textContent=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();}
  clock();setInterval(clock,30000);
})();
