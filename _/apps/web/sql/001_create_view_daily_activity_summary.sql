CREATE OR REPLACE VIEW daily_activity_summary AS
SELECT
  COALESCE(c.business_id, b.business_id) AS business_id,
  COALESCE(c.date, b.date) AS date,
  COALESCE(c.calls_count, 0) AS calls_count,
  COALESCE(b.bookings_count, 0) AS bookings_count
FROM (
  SELECT business_id, created_at::date AS date, COUNT(*) AS calls_count
  FROM contacts
  GROUP BY business_id, created_at::date
) AS c
FULL JOIN (
  SELECT business_id, created_at::date AS date, COUNT(*) AS bookings_count
  FROM bookings
  GROUP BY business_id, created_at::date
) AS b
ON c.business_id = b.business_id AND c.date = b.date;
