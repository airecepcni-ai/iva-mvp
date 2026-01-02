-- Add dedicated inbound phone mapping for IVA (Twilio/Vapi "To" number).
-- Run in Supabase SQL editor (or via your migration runner) once.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS vapi_phone TEXT;

-- Optional backfill for existing setups that previously stored the inbound number in businesses.phone.
UPDATE public.businesses
SET vapi_phone = phone
WHERE (vapi_phone IS NULL OR vapi_phone = '')
  AND phone IS NOT NULL
  AND phone <> '';

-- Ensure unique mapping per inbound number (ignore NULL/empty).
CREATE UNIQUE INDEX IF NOT EXISTS businesses_vapi_phone_unique
ON public.businesses (vapi_phone)
WHERE vapi_phone IS NOT NULL AND vapi_phone <> '';

-- Basic E.164-ish check (allow NULL/empty).
ALTER TABLE public.businesses
  ADD CONSTRAINT IF NOT EXISTS businesses_vapi_phone_e164_check
  CHECK (
    vapi_phone IS NULL OR vapi_phone = '' OR vapi_phone ~ '^\+[1-9]\d{6,14}$'
  );








