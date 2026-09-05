// Prime Roleplay — Supabase browser client
(() => {
  const cfg = window.PRIME_SUPABASE_CONFIG;
  if (!cfg || !cfg.url || cfg.url.startsWith('YOUR_') || !cfg.publishableKey || cfg.publishableKey.startsWith('YOUR_')) {
    console.warn('Prime Roleplay Supabase is not configured yet.');
    return;
  }
  if (!window.supabase?.createClient) {
    console.error('Supabase JS library did not load.');
    return;
  }
  window.primeSupabase = window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
})();
