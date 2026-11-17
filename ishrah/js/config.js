/* اشرح لي: connection settings. Empty = PREVIEW MODE (everything is kept on this device only, so every page can be tried before the
   database exists). Fill these two from the new Supabase project (Project Settings → API) to switch the whole platform to the real database.
   Both values are public by design (the anon key only allows what the database rules allow). */
window.ISH_CONFIG = {
  supabaseUrl: '',          // e.g. https://abcdxyz.supabase.co
  supabaseAnonKey: '',      // the "anon public" key
  bunnyLibrary: ''          // Bunny Stream library id (public number); the API key stays secret in Cloudflare
};
