import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.0/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.warn('⚠️ Supabase credentials not set! Please update js/config.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
