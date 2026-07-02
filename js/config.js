// ============================================================
// TAPLINK — CONFIGURATION
// ============================================================

// Supabase credentials — anon key is safe to expose publicly.
// It is protected by Row Level Security (RLS) policies.
// NEVER put the service_role key here.
export const SUPABASE_URL      = 'https://cubscjzhnwhmmqtpzmfu.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1YnNjanpobndobW1xdHB6bWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Nzg3NDQsImV4cCI6MjA5ODE1NDc0NH0.-mUzaNDluC4EUnCCkUi8F5oIUSAqnm_i6ok2Wzw39xw';

// Dynamic base URL — works in dev (localhost) and production (Vercel) automatically.
export const APP_BASE_URL = window.location.origin;

// Builds a canonical public profile URL for a given card ID.
// Use this everywhere instead of building URLs manually.
export const profileUrl = (cardId) =>
  `${APP_BASE_URL}/profile.html?id=${encodeURIComponent(cardId)}`;
