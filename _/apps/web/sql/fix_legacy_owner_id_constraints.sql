-- Fix legacy owner_id constraints so Auth.js users can create businesses
-- ====================================================================
--
-- Facts we confirmed from your DB:
-- - public.businesses.owner_id has FK: businesses_owner_fk -> public.users(id)
-- - public.users.id has FK: users_id_fkey -> auth.users(id)   (Supabase Auth)
--
-- This means it is IMPOSSIBLE to create a public.users row for an Auth.js user id
-- unless that same UUID exists in auth.users (it doesn't, because you're not using Supabase Auth).
--
-- Therefore, for Auth.js multi-tenant mapping (businesses.auth_user_id), owner_id must be
-- treated as legacy and must NOT block inserts.
--
-- Run in Supabase SQL Editor.

-- 1) Discover the FK constraint name on businesses.owner_id (should be businesses_owner_fk)
select
  c.conname as constraint_name,
  c.conrelid::regclass as table_name,
  c.confrelid::regclass as referenced_table,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_attribute a
  on a.attrelid = c.conrelid
 and a.attnum = any (c.conkey)
where c.conrelid = 'public.businesses'::regclass
  and c.contype = 'f'
  and a.attname = 'owner_id';

-- 2) Drop the FK constraint (replace <constraint_name> if different)
alter table public.businesses drop constraint if exists businesses_owner_fk;

-- 3) Make owner_id nullable (so inserts can set it to NULL)
alter table public.businesses alter column owner_id drop not null;

-- Done.








