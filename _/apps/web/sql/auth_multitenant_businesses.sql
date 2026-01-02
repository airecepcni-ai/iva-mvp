-- Multi-tenant Auth: Link businesses to Auth.js users
-- ==================================================
-- Run this SQL against the same database as DATABASE_URL and Supabase.
-- (Supabase SQL Editor → paste and run)
--
-- This adds an `auth_user_id` column to the `businesses` table so we can
-- associate businesses with Auth.js users (stored in auth_users.id).
--
-- The column is TEXT to match the Auth.js user.id format (UUID as text).
-- It's nullable so existing businesses continue to work.

-- Add auth_user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'businesses'
      AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.businesses
    ADD COLUMN auth_user_id TEXT;
    
    COMMENT ON COLUMN public.businesses.auth_user_id IS 
      'Auth.js user ID (from auth_users.id) who owns this business';
  END IF;
END $$;

-- Create index for faster lookups by auth_user_id
CREATE INDEX IF NOT EXISTS idx_businesses_auth_user_id 
ON public.businesses(auth_user_id);

-- Optional: If you want to migrate existing owner_id values to auth_user_id,
-- uncomment and run this UPDATE (only if owner_id contains Auth.js user IDs):
-- UPDATE public.businesses 
-- SET auth_user_id = owner_id::text 
-- WHERE auth_user_id IS NULL AND owner_id IS NOT NULL;









