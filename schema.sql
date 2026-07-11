-- ============================================================
-- TAPLINK — PRODUCTION DATABASE SCHEMA & SECURITY POLICIES
-- ============================================================

-- 1. Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
    id TEXT PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    card_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce one card per account at DB level (belt-and-suspenders with frontend checks)
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_user_id_unique;
ALTER TABLE public.cards ADD CONSTRAINT cards_user_id_unique UNIQUE (user_id);


-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for cards table
-- Drop any old versions to ensure clean replacement
DROP POLICY IF EXISTS "Users can create their own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON public.cards;
DROP POLICY IF EXISTS "Cards are viewable by everyone" ON public.cards;
DROP POLICY IF EXISTS "cards_public_select" ON public.cards;
DROP POLICY IF EXISTS "cards_owner_insert" ON public.cards;
DROP POLICY IF EXISTS "cards_owner_update" ON public.cards;
DROP POLICY IF EXISTS "cards_owner_delete" ON public.cards;

-- SELECT: Anyone (even anonymous/non-logged-in visitors) can view a profile card by ID
CREATE POLICY "cards_public_select"
    ON public.cards
    FOR SELECT
    USING (true);

-- INSERT: Logged-in users can only insert cards where user_id matches their authenticated UID
CREATE POLICY "cards_owner_insert"
    ON public.cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Logged-in users can only update cards they own, and they cannot transfer ownership (WITH CHECK matches USING)
CREATE POLICY "cards_owner_update"
    ON public.cards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Logged-in users can only delete cards they own
CREATE POLICY "cards_owner_delete"
    ON public.cards
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Performance Indexes (Highly recommended for production scale)
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON public.cards(created_at DESC);

-- 5. Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.cards;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Storage Bucket RLS Policies (For profile picture / banner uploads)
-- Execute this once you create the 'avatars' storage bucket in Supabase Dashboard.
/*
-- Make sure the bucket is created, then allow public reading of items:
CREATE POLICY "avatars_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Allow authenticated users to upload files only to their own subfolders (e.g. avatars/{auth.uid()}/...)
CREATE POLICY "avatars_owner_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "avatars_owner_update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "avatars_owner_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
*/

-- 7. Admin Dashboard SQL Functions
-- Run this in your Supabase SQL Editor to enable admin reports securely.
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS json
SECURITY DEFINER
AS $$
DECLARE
  caller_email text;
  result json;
BEGIN
  -- Get user email from the JWT
  caller_email := auth.jwt() ->> 'email';
  
  -- Strict email check (replace with your admin email if needed)
  IF caller_email = 'mihiretabbedilu@gmail.com' THEN
    result := json_build_object(
      'total_users', (SELECT count(*) FROM auth.users),
      'total_cards', (SELECT count(*) FROM public.cards),
      'users_list', (
         SELECT json_agg(u_data) FROM (
           SELECT 
             u.id,
             u.email,
             u.created_at,
             c.id IS NOT NULL AS has_card,
             c.id AS card_id,
             c.card_data->>'name' AS card_name
           FROM auth.users u
           LEFT JOIN public.cards c ON u.id = c.user_id
           ORDER BY u.created_at DESC
         ) u_data
      )
    );
    RETURN result;
  ELSE
    RAISE EXCEPTION 'Access denied. Only mihiretabbedilu@gmail.com can access the admin panel.';
  END IF;
END;
$$ LANGUAGE plpgsql;


