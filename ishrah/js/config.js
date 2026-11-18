/* اشرح لي: connection settings. Empty = PREVIEW MODE (everything is kept on this device only, so every page can be tried before the
   database exists). Fill these two from the new Supabase project (Project Settings → API) to switch the whole platform to the real database.
   Both values are public by design (the anon key only allows what the database rules allow). */
window.ISH_CONFIG = {
  supabaseUrl: 'https://fglawgpusfbgkokpnoej.supabase.co',
  supabaseAnonKey: 'sb_publishable_kEhLRQjZuYzKNFyyMGKhPA_QGuC3q25',  // publishable key (public)
  googleClientId: '989457790089-fus9tth5n26bcpkhansb0539glvfummi.apps.googleusercontent.com',  // public; Google's own button shows ishrahli.org
  bunnyLibrary: ''          // Bunny Stream library id (public number); the API key stays secret in Cloudflare
};
