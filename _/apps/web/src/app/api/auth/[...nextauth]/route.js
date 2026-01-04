/**
 * Auth.js catch-all route handler
 * Handles all /api/auth/* routes for NextAuth/Auth.js
 */
import { Auth } from "@auth/core";
import Google from "@auth/core/providers/google";
import Credentials from "@auth/core/providers/credentials";
import { Pool } from '@neondatabase/serverless';
import { hash, verify } from 'argon2';

let poolInstance = null;

async function getPool() {
  if (poolInstance) return poolInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  poolInstance = new Pool({ connectionString });
  return poolInstance;
}

// Simplified adapter for Auth.js
function createAdapter() {
  return {
    async createUser(user) {
      const pool = await getPool();
      const { name, email, emailVerified, image } = user;
      const result = await pool.query(
        `INSERT INTO auth_users (name, email, "emailVerified", image)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, "emailVerified", image`,
        [name, email, emailVerified, image]
      );
      return result.rows[0];
    },
    async getUser(id) {
      const pool = await getPool();
      const result = await pool.query('SELECT * FROM auth_users WHERE id = $1', [id]);
      return result.rows[0] || null;
    },
    async getUserByEmail(email) {
      const pool = await getPool();
      const result = await pool.query('SELECT * FROM auth_users WHERE email = $1', [email]);
      return result.rows[0] || null;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const pool = await getPool();
      const result = await pool.query(
        `SELECT u.* FROM auth_users u 
         JOIN auth_accounts a ON u.id = a."userId"
         WHERE a.provider = $1 AND a."providerAccountId" = $2`,
        [provider, providerAccountId]
      );
      return result.rows[0] || null;
    },
    async updateUser(user) {
      const pool = await getPool();
      const { id, name, email, emailVerified, image } = user;
      const result = await pool.query(
        `UPDATE auth_users SET name = $2, email = $3, "emailVerified" = $4, image = $5
         WHERE id = $1
         RETURNING id, name, email, "emailVerified", image`,
        [id, name, email, emailVerified, image]
      );
      return result.rows[0];
    },
    async linkAccount(account) {
      const pool = await getPool();
      const result = await pool.query(
        `INSERT INTO auth_accounts 
         ("userId", provider, type, "providerAccountId", access_token, expires_at, refresh_token, id_token, scope, session_state, token_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          account.userId,
          account.provider,
          account.type,
          account.providerAccountId,
          account.access_token,
          account.expires_at,
          account.refresh_token,
          account.id_token,
          account.scope,
          account.session_state,
          account.token_type,
        ]
      );
      return result.rows[0];
    },
    async createSession({ sessionToken, userId, expires }) {
      const pool = await getPool();
      const result = await pool.query(
        `INSERT INTO auth_sessions ("userId", expires, "sessionToken")
         VALUES ($1, $2, $3)
         RETURNING id, "sessionToken", "userId", expires`,
        [userId, expires, sessionToken]
      );
      return result.rows[0];
    },
    async getSessionAndUser(sessionToken) {
      const pool = await getPool();
      const sessionResult = await pool.query(
        'SELECT * FROM auth_sessions WHERE "sessionToken" = $1',
        [sessionToken]
      );
      if (sessionResult.rowCount === 0) return null;
      const session = sessionResult.rows[0];
      const userResult = await pool.query(
        'SELECT * FROM auth_users WHERE id = $1',
        [session.userId]
      );
      if (userResult.rowCount === 0) return null;
      return { session, user: userResult.rows[0] };
    },
    async updateSession(session) {
      const pool = await getPool();
      await pool.query(
        'UPDATE auth_sessions SET expires = $2 WHERE "sessionToken" = $1',
        [session.sessionToken, session.expires]
      );
      return session;
    },
    async deleteSession(sessionToken) {
      const pool = await getPool();
      await pool.query('DELETE FROM auth_sessions WHERE "sessionToken" = $1', [sessionToken]);
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const pool = await getPool();
      await pool.query(
        'DELETE FROM auth_accounts WHERE "providerAccountId" = $1 AND provider = $2',
        [providerAccountId, provider]
      );
    },
    async deleteUser(userId) {
      const pool = await getPool();
      await pool.query('DELETE FROM auth_users WHERE id = $1', [userId]);
      await pool.query('DELETE FROM auth_sessions WHERE "userId" = $1', [userId]);
      await pool.query('DELETE FROM auth_accounts WHERE "userId" = $1', [userId]);
    },
  };
}

const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  basePath: "/api/auth",
  adapter: createAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: 'credentials-signin',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const pool = await getPool();
        const userResult = await pool.query(
          'SELECT * FROM auth_users WHERE email = $1',
          [credentials.email]
        );
        if (userResult.rowCount === 0) return null;
        const user = userResult.rows[0];
        const accountResult = await pool.query(
          'SELECT * FROM auth_accounts WHERE "userId" = $1 AND provider = $2',
          [user.id, 'credentials']
        );
        if (accountResult.rowCount === 0) return null;
        const account = accountResult.rows[0];
        if (!account.password) return null;
        const isValid = await verify(account.password, credentials.password);
        return isValid ? user : null;
      },
    }),
  ],
  pages: {
    signIn: '/account/signin',
    signOut: '/account/logout',
    error: '/account/signin',
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

async function handler(request) {
  return Auth(request, authConfig);
}

export const GET = handler;
export const POST = handler;

