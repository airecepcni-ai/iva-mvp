/**
 * GET /api/businesses - List businesses for authenticated user
 * POST /api/businesses - Create a new business for authenticated user
 */
import sql from "../utils/sql.js";
import { auth } from "../../../auth.js";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized", businesses: [], userId: null }, { status: 401 });
    }

    const userId = session.user.id;

    // Get client timezone from header (for auto-creating business with correct tz)
    const clientTimezone = request.headers.get('x-client-timezone') || 'Europe/Prague';

    // Get all businesses owned by this user (via auth_user_id column)
    let businesses = await sql`
      SELECT 
        id,
        name,
        auth_user_id,
        timezone,
        phone,
        vapi_phone,
        is_subscribed,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        created_at,
        updated_at
      FROM businesses
      WHERE auth_user_id = ${userId}
      ORDER BY created_at ASC
    `;

    // If no businesses found, also check legacy owner_id column for backwards compatibility
    if (businesses.length === 0) {
      businesses = await sql`
        SELECT 
          id,
          name,
          owner_id,
          timezone,
          phone,
          vapi_phone,
          is_subscribed,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          created_at,
          updated_at
        FROM businesses
        WHERE owner_id = ${userId}
        ORDER BY created_at ASC
      `;

      // If found via owner_id, migrate them to auth_user_id
      if (businesses.length > 0) {
        for (const biz of businesses) {
          await sql`
            UPDATE businesses 
            SET auth_user_id = ${userId}
            WHERE id = ${biz.id} AND auth_user_id IS NULL
          `;
        }
      }
    }

    // Return mapped businesses
    const mappedBusinesses = businesses.map((b) => ({
      id: b.id,
      name: b.name || 'Můj Salon',
      authUserId: b.auth_user_id || b.owner_id,
      timezone: b.timezone || clientTimezone,
      phone: b.phone || null,
      vapiPhone: b.vapi_phone || null,
      isSubscribed: b.is_subscribed === true,
      stripeCustomerId: b.stripe_customer_id || null,
    }));

    return Response.json({
      businesses: mappedBusinesses,
      userId,
    });
  } catch (error) {
    console.error("GET /api/businesses error:", error);
    return Response.json({ error: "Internal Server Error", businesses: [], userId: null }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ ok: false, error: "Unauthorized", userId: null }, { status: 401 });
    }

    const userId = session.user.id;
    
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const name = typeof body.name === 'string' && body.name.trim() 
      ? body.name.trim() 
      : 'Můj Salon';
    
    const clientTimezone = request.headers.get('x-client-timezone') || 'Europe/Prague';

    // Check if user already has businesses (limit for free tier)
    const existingCount = await sql`
      SELECT COUNT(*) as count FROM businesses WHERE auth_user_id = ${userId}
    `;
    
    const count = parseInt(existingCount[0]?.count || '0', 10);
    if (count >= 5) {
      return Response.json({ 
        ok: false, 
        error: "max_businesses_reached",
        userId 
      }, { status: 400 });
    }

    // Create new business
    const result = await sql`
      INSERT INTO businesses (name, auth_user_id, timezone, is_subscribed, created_at, updated_at)
      VALUES (${name}, ${userId}, ${clientTimezone}, false, NOW(), NOW())
      RETURNING id, name, auth_user_id, timezone, phone, vapi_phone, is_subscribed
    `;

    const newBusiness = result[0];

    return Response.json({
      ok: true,
      userId,
      business: {
        id: newBusiness.id,
        name: newBusiness.name,
        authUserId: newBusiness.auth_user_id,
        timezone: newBusiness.timezone,
        phone: newBusiness.phone,
        vapiPhone: newBusiness.vapi_phone,
        isSubscribed: newBusiness.is_subscribed === true,
      },
    });
  } catch (error) {
    console.error("POST /api/businesses error:", error);
    return Response.json({ ok: false, error: "Internal Server Error", userId: null }, { status: 500 });
  }
}
