/**
 * Test endpoint for the Auth.js adapter
 */
import '../../__create/neon-setup';

import { Pool } from '@neondatabase/serverless';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  
  if (!email) {
    return Response.json({ error: 'Provide ?email= parameter' }, { status: 400 });
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Test 1: Check if user exists
    const userResult = await pool.query(
      'SELECT id, name, email, "emailVerified", image FROM auth_users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0] || null;
    
    // Test 2: Check linked accounts for user
    let accounts: any[] = [];
    if (user) {
      const accountsResult = await pool.query(
        'SELECT id, "userId", provider, type, "providerAccountId" FROM auth_accounts WHERE "userId" = $1',
        [user.id]
      );
      accounts = accountsResult.rows;
    }
    
    // Test 3: Check sessions for user
    let sessions: any[] = [];
    if (user) {
      const sessionsResult = await pool.query(
        'SELECT id, "sessionToken", "userId", expires FROM auth_sessions WHERE "userId" = $1',
        [user.id]
      );
      sessions = sessionsResult.rows;
    }
    
    await pool.end();
    
    return Response.json({
      ok: true,
      timestamp: new Date().toISOString(),
      email,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        hasEmailVerified: user.emailVerified !== null,
      } : null,
      accounts: accounts.map(a => ({
        provider: a.provider,
        type: a.type,
        providerAccountId: a.providerAccountId?.substring(0, 10) + '...',
      })),
      sessionsCount: sessions.length,
    });
  } catch (error) {
    await pool.end();
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

