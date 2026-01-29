/**
 * GET /api/setup-waitlist - Creates the waitlist_signups table if it doesn't exist
 * 
 * Run this once to set up the waitlist table in production.
 */
import sql from "../utils/sql.js";

export async function GET(request) {
  try {
    // Create the waitlist_signups table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist_signups (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email 
      ON waitlist_signups (email)
    `;

    // Verify table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'waitlist_signups'
    `;

    return Response.json({ 
      success: true, 
      message: "waitlist_signups table created successfully",
      tableExists: tables.length > 0
    });
  } catch (error) {
    console.error("Setup waitlist error:", error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
