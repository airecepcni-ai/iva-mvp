CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  type text NOT NULL,
  title text,
  body text,
  status text NOT NULL DEFAULT 'open',
  severity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alerts_business_status_created_idx
  ON alerts (business_id, status, created_at DESC);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- TODO: Add RLS policies for alerts once tenant auth mapping is finalized.
