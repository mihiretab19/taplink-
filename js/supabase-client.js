import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.warn('⚠️ Supabase credentials not set! Please update js/config.js');
}

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  console.error('CRITICAL ERROR: Supabase UMD script not loaded! Make sure <script src="..."> is included in HTML.');
}

export const supabase = window.supabase && window.supabase.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
