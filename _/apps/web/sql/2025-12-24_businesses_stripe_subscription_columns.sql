-- Add Stripe subscription debugging + portal fields to public.businesses
-- Safe to run multiple times.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS stripe_status text,
  ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamptz;

-- Helpful indexes for lookups from webhooks / debugging
CREATE INDEX IF NOT EXISTS businesses_stripe_customer_id_idx
  ON public.businesses (stripe_customer_id);

CREATE INDEX IF NOT EXISTS businesses_stripe_subscription_id_idx
  ON public.businesses (stripe_subscription_id);


