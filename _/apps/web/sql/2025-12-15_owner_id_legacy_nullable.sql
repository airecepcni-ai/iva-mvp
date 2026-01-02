-- Enforce legacy owner_id constraints state for Auth.js multi-tenant mapping
-- =======================================================================
--
-- Why:
-- `apps/web/src/app/api/businesses/route.js` auto-creates a default business row
-- with:
--   owner_id = NULL
--   auth_user_id = <Auth.js user id>
--
-- Because Auth.js users are NOT Supabase Auth users, any FK chain that forces
-- businesses.owner_id -> public.users -> auth.users will break new-user onboarding.
--
-- This migration makes owner_id truly "legacy" and non-blocking:
-- 1) Remove FK that blocks inserts (if present)
-- 2) Make owner_id nullable
--
-- Safe to run multiple times.

alter table public.businesses drop constraint if exists businesses_owner_fk;
alter table public.businesses alter column owner_id drop not null;








