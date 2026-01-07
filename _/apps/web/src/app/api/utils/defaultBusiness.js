import sql from "./sql.js";

const DEFAULT_TIMEZONE = "Europe/Prague";
const DEFAULT_BUSINESS_NAME = "Můj nový salon";

function userIdToLockKey(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 2147483647;
}

/** Select businesses for the user, including legacy owner_id rows. */
async function selectBusinessesForUser(tx, userId) {
  // NOTE: Stripe-related columns vary across deployments.
  // Use SELECT * to avoid crashing on missing columns like stripe_status/stripe_current_period_end.
  const businesses = await tx`
    SELECT *
    FROM businesses
    WHERE auth_user_id = ${userId}
    ORDER BY created_at ASC
  `;
  if (businesses.length > 0) {
    return businesses;
  }

  const legacyBusinesses = await tx`
    SELECT *
    FROM businesses
    WHERE owner_id = ${userId}
    ORDER BY created_at ASC
  `;

  if (legacyBusinesses.length > 0) {
    for (const biz of legacyBusinesses) {
      await tx`
        UPDATE businesses
        SET auth_user_id = ${userId}
        WHERE id = ${biz.id} AND auth_user_id IS NULL
      `;
    }
    return legacyBusinesses;
  }

  return [];
}

/** Auto-create a default business if user owns none. */
export async function ensureDefaultBusinessForUser(userId, clientTimezone = DEFAULT_TIMEZONE) {
  if (!userId) {
    throw new Error("ensureDefaultBusinessForUser requires a userId");
  }

  const result = await sql.transaction(async (tx) => {
    const lockKey = userIdToLockKey(userId);
    await tx`SELECT pg_advisory_xact_lock(${lockKey})`;

    let businesses = await selectBusinessesForUser(tx, userId);
    let created = false;
    if (businesses.length === 0) {
      const insertResult = await tx`
        INSERT INTO businesses (owner_id, auth_user_id, name, timezone, is_subscribed, created_at)
        VALUES (NULL, ${userId}, ${DEFAULT_BUSINESS_NAME}, ${clientTimezone}, false, NOW())
        RETURNING *
      `;
      if (insertResult.length > 0) {
        created = true;
        businesses = insertResult;
      }
    }

    return { businesses, created };
  });

  return result;
}

