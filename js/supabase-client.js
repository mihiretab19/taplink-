import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.warn('⚠️ Supabase credentials not set! Please update js/config.js');
}

let createClientFn;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  createClientFn = window.supabase.createClient;
} else {
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.2/+esm');
    createClientFn = module.createClient;
  } catch (e) {
    console.error('Failed to load Supabase library:', e);
  }
}

export const supabase = createClientFn
  ? createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
