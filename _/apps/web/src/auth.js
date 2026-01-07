/**
 * WARNING: This file connects this app to Anythings's internal auth system. Do
 * not attempt to edit it. Modifying it will have no effect on your project as it is controlled by our system.
 * Do not import @auth/create or @auth/create anywhere else or it may break. This is an internal package.
 */
import CreateAuth from "@auth/create"
import Credentials from "@auth/core/providers/credentials"
import Google from "@auth/core/providers/google"
import { Pool } from '@neondatabase/serverless'
import { hash, verify } from 'argon2'
import * as jose from 'jose'
import { ensureDefaultBusinessForUser } from "./app/api/utils/defaultBusiness.js";

const missingDatabaseError = new Error(
  'No database connection string was provided. Perhaps process.env.DATABASE_URL has not been set'
)

let poolInitPromise
let poolInstance

async function getPool() {
  if (poolInstance) {
    return poolInstance
  }

  if (!poolInitPromise) {
    poolInitPromise = (async () => {
      const connectionString = process.env.DATABASE_URL
      if (!connectionString) {
        return null
      }
      return new Pool({
        connectionString,
      })
    })()
  }

  poolInstance = await poolInitPromise

  if (!poolInstance) {
    throw missingDatabaseError
  }

  return poolInstance
}

function Adapter(getClient) {
  async function withClient(callback) {
    const client = await getClient()
    return callback(client)
  }

  return {
    async createVerificationToken(verificationToken) {
      return withClient(async (client) => {
        const { identifier, expires, token } = verificationToken
        const sql = `
          INSERT INTO auth_verification_token ( identifier, expires, token )
          VALUES ($1, $2, $3)
        `
        await client.query(sql, [identifier, expires, token])
        return verificationToken
      })
    },
    async useVerificationToken({ identifier, token }) {
      return withClient(async (client) => {
        const sql = `
          delete from auth_verification_token
          where identifier = $1 and token = $2
          RETURNING identifier, expires, token
        `
        const result = await client.query(sql, [identifier, token])
        return result.rowCount !== 0 ? result.rows[0] : null
      })
    },
    async createUser(user) {
      return withClient(async (client) => {
        const { name, email, emailVerified, image } = user
        const sql = `
          INSERT INTO auth_users (name, email, email_verified, image)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, email, email_verified as "emailVerified", image
        `
        const result = await client.query(sql, [
          name,
          email,
          emailVerified,
          image,
        ])
        return result.rows[0]
      })
    },
    async getUser(id) {
      return withClient(async (client) => {
        const sql = 'select id, name, email, email_verified as "emailVerified", image from auth_users where id = $1'
        try {
          const result = await client.query(sql, [id])
          return result.rowCount === 0 ? null : result.rows[0]
        } catch {
          return null
        }
      })
    },
    async getUserByEmail(email) {
      return withClient(async (client) => {
        const sql = 'select id, name, email, email_verified as "emailVerified", image from auth_users where email = $1'
        const result = await client.query(sql, [email])
        if (result.rowCount === 0) {
          return null
        }
        const userData = result.rows[0]
        const accountsData = await client.query(
          'select id, user_id as "userId", provider, type, provider_account_id as "providerAccountId", access_token, expires_at, refresh_token, id_token, scope, session_state, token_type, password from auth_accounts where user_id = $1',
          [userData.id]
        )
        return {
          ...userData,
          accounts: accountsData.rows,
        }
      })
    },
    async getUserByAccount({ providerAccountId, provider }) {
      return withClient(async (client) => {
        const sql = `
          select u.* from auth_users u join auth_accounts a on u.id = a.user_id
          where
          a.provider = $1
          and
          a.provider_account_id = $2
        `
        const result = await client.query(sql, [provider, providerAccountId])
        return result.rowCount !== 0 ? result.rows[0] : null
      })
    },
    async updateUser(user) {
      return withClient(async (client) => {
        const fetchSql = 'select * from auth_users where id = $1'
        const query1 = await client.query(fetchSql, [user.id])
        const oldUser = query1.rows[0]

        const newUser = {
          ...oldUser,
          ...user,
        }

        const { id, name, email, emailVerified, image } = newUser
        const updateSql = `
          UPDATE auth_users set
          name = $2, email = $3, email_verified = $4, image = $5
          where id = $1
          RETURNING name, id, email, email_verified as "emailVerified", image
        `
        const query2 = await client.query(updateSql, [
          id,
          name,
          email,
          emailVerified,
          image,
        ])
        return query2.rows[0]
      })
    },
    async linkAccount(account) {
      return withClient(async (client) => {
        const sql = `
          insert into auth_accounts
          (
            user_id,
            provider,
            type,
            provider_account_id,
            access_token,
            expires_at,
            refresh_token,
            id_token,
            scope,
            session_state,
            token_type,
            password
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          returning
            id,
            user_id as "userId",
            provider,
            type,
            provider_account_id as "providerAccountId",
            access_token,
            expires_at,
            refresh_token,
            id_token,
            scope,
            session_state,
            token_type,
            password
        `
        const params = [
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
          account.extraData?.password,
        ]

        const result = await client.query(sql, params)
        return result.rows[0]
      })
    },
    async createSession({ sessionToken, userId, expires }) {
      if (userId === undefined) {
        throw Error('userId is undef in createSession')
      }
      return withClient(async (client) => {
        const sql = `
          insert into auth_sessions (user_id, expires, session_token)
          values ($1, $2, $3)
          RETURNING id, session_token as "sessionToken", user_id as "userId", expires
        `
        const result = await client.query(sql, [userId, expires, sessionToken])
        return result.rows[0]
      })
    },
    async getSessionAndUser(sessionToken) {
      if (sessionToken === undefined) {
        return null
      }
      return withClient(async (client) => {
        const result1 = await client.query(
          `select id, session_token as "sessionToken", user_id as "userId", expires from auth_sessions where session_token = $1`,
          [sessionToken]
        )
        if (result1.rowCount === 0) {
          return null
        }
        const session = result1.rows[0]

        const result2 = await client.query(
          'select id, name, email, email_verified as "emailVerified", image from auth_users where id = $1',
          [session.userId]
        )
        if (result2.rowCount === 0) {
          return null
        }
        const user = result2.rows[0]
        return {
          session,
          user,
        }
      })
    },
    async updateSession(session) {
      return withClient(async (client) => {
        const { sessionToken } = session
        const result1 = await client.query(
          `select * from auth_sessions where session_token = $1`,
          [sessionToken]
        )
        if (result1.rowCount === 0) {
          return null
        }
        const originalSession = result1.rows[0]

        const newSession = {
          ...originalSession,
          ...session,
        }
        const sql = `
          UPDATE auth_sessions set
          expires = $2
          where session_token = $1
        `
        const result = await client.query(sql, [
          newSession.sessionToken,
          newSession.expires,
        ])
        return result.rows[0]
      })
    },
    async deleteSession(sessionToken) {
      return withClient(async (client) => {
        const sql = `delete from auth_sessions where session_token = $1`
        await client.query(sql, [sessionToken])
      })
    },
    async unlinkAccount(partialAccount) {
      return withClient(async (client) => {
        const { provider, providerAccountId } = partialAccount
        const sql = `delete from auth_accounts where provider_account_id = $1 and provider = $2`
        await client.query(sql, [providerAccountId, provider])
      })
    },
    async deleteUser(userId) {
      return withClient(async (client) => {
        await client.query('delete from auth_users where id = $1', [userId])
        await client.query('delete from auth_sessions where user_id = $1', [userId])
        await client.query('delete from auth_accounts where user_id = $1', [userId])
      })
    },
  }
}

const adapter = Adapter(getPool)

// Shared callbacks for both auth configs
const sharedCallbacks = {
  async jwt({ token, user }) {
    // When user signs in, include their ID in the token
    if (user?.id) {
      token.userId = user.id;
      token.email = user.email;
      token.name = user.name;
    }
    return token;
  },
  async session({ session, token }) {
    // Include user ID in session from JWT token
    if (token?.userId) {
      session.user.id = token.userId;
    }
    return session;
  },
};

const sharedEvents = {
  async createUser({ user }) {
    if (!user?.id) return;
    try {
      await ensureDefaultBusinessForUser(user.id);
    } catch (err) {
      console.error("[auth] createUser ensureDefaultBusinessForUser failed:", err);
    }
  },
  async signIn({ user }) {
    if (!user?.id) return;
    try {
      await ensureDefaultBusinessForUser(user.id);
    } catch (err) {
      console.error("[auth] signIn ensureDefaultBusinessForUser failed:", err);
    }
  },
};

// Auth.js configuration factory - used by Hono middleware
export function createAuthConfig() {
  return {
    adapter,
    secret: process.env.AUTH_SECRET,
    trustHost: process.env.AUTH_TRUST_HOST === 'true' || process.env.NODE_ENV !== 'production',
    basePath: '/api/auth',
    // Use JWT strategy - this is what works with Credentials provider
    // The JWT contains the user ID which we use to look up the user
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
      signIn: '/account/signin',
      signOut: '/account/logout',
      error: '/account/signin',
    },
    callbacks: sharedCallbacks,
    events: sharedEvents,
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
      Credentials({
        id: 'credentials-signin',
        name: 'Credentials Sign in',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: async (credentials) => {
          const { email, password } = credentials
          if (!email || !password) return null
          if (typeof email !== 'string' || typeof password !== 'string') return null
          const user = await adapter.getUserByEmail(email)
          if (!user) return null
          const matchingAccount = user.accounts.find((a) => a.provider === 'credentials')
          if (!matchingAccount?.password) return null
          const isValid = await verify(matchingAccount.password, password)
          return isValid ? user : null
        },
      }),
      Credentials({
        id: 'credentials-signup',
        name: 'Credentials Sign up',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
          name: { label: 'Name', type: 'text', required: false },
          image: { label: 'Image', type: 'text', required: false },
        },
        authorize: async (credentials) => {
          const { email, password } = credentials
          if (!email || !password) return null
          if (typeof email !== 'string' || typeof password !== 'string') return null
          const existing = await adapter.getUserByEmail(email)
          if (existing) return null
          const newUser = await adapter.createUser({
            id: crypto.randomUUID(),
            emailVerified: null,
            email,
            name: typeof credentials.name === 'string' && credentials.name.trim().length > 0 ? credentials.name : undefined,
            image: typeof credentials.image === 'string' ? credentials.image : undefined,
          })
          await adapter.linkAccount({
            extraData: { password: await hash(password) },
            type: 'credentials',
            userId: newUser.id,
            providerAccountId: newUser.id,
            provider: 'credentials',
          })
          return newUser
        },
      }),
    ],
  }
}


/**
 * Decode JWT using jose library with proper Auth.js key derivation
 * Matches @auth/core jwt.ts getDerivedEncryptionKey function
 */
async function getDerivedEncryptionKey(secret, salt = '') {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const saltBytes = encoder.encode(salt);
  // Auth.js format: "Auth.js Generated Encryption Key (${salt})"
  const info = encoder.encode(`Auth.js Generated Encryption Key (${salt})`);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
  
  // Auth.js uses SHA-512 for HKDF
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-512',
      salt: saltBytes,
      info: info,
    },
    baseKey,
    512 // 64 bytes for A256CBC-HS512
  );
  
  return new Uint8Array(derivedBits);
}

/**
 * Get session from a Request object - works in React Router resource routes
 * 
 * Uses Auth.js's /api/auth/session endpoint internally to decode the JWT,
 * since that endpoint handles the key derivation correctly.
 */
export async function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  
  if (!cookieHeader) {
    return null;
  }
  
  // Parse cookies to check if session token exists
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...vals] = c.trim().split('=');
      return [key, decodeURIComponent(vals.join('='))];
    }).filter(([k]) => k)
  );
  
  const isSecure = request.url?.startsWith('https://') || process.env.NODE_ENV === 'production';
  const cookiePrefix = isSecure ? '__Secure-' : '';
  const sessionTokenName = `${cookiePrefix}authjs.session-token`;
  const sessionToken = cookies[sessionTokenName] || cookies['authjs.session-token'];
  
  if (!sessionToken) {
    return null;
  }
  
  // Call Auth.js session endpoint internally
  // This uses Auth.js's own key derivation which is guaranteed to match
  try {
    const url = new URL(request.url);
    const sessionUrl = `${url.protocol}//${url.host}/api/auth/session`;
    
    const sessionResponse = await fetch(sessionUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
      },
    });
    
    if (!sessionResponse.ok) {
      console.log('[getSessionFromRequest] Session endpoint returned:', sessionResponse.status);
      return null;
    }
    
    const session = await sessionResponse.json();
    
    // Auth.js returns {} for no session, or { user: {...}, expires: "..." }
    if (!session || !session.user || !session.user.id) {
      // Try to get id from email or other fields
      if (session?.user?.email) {
        // Look up user by email in database
        try {
          const user = await adapter.getUserByEmail(session.user.email);
          if (user) {
            return {
              user: {
                id: user.id,
                name: session.user.name || user.name,
                email: session.user.email,
                image: session.user.image || user.image,
              },
              expires: session.expires,
            };
          }
        } catch (dbError) {
          console.error('[getSessionFromRequest] DB lookup error:', dbError);
        }
      }
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[getSessionFromRequest] Error calling session endpoint:', error);
    
    // Fallback to database session lookup
    try {
      const result = await adapter.getSessionAndUser(sessionToken);
      if (!result) {
        return null;
      }
      
      const { session, user } = result;
      
      if (session.expires && new Date(session.expires) < new Date()) {
        return null;
      }
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        expires: session.expires?.toISOString?.() || session.expires,
      };
    } catch (dbError) {
      console.error('[getSessionFromRequest] DB fallback error:', dbError);
      return null;
    }
  }
}

// Export auth() function that uses the full config with adapter
// This is used by API routes to get the session (requires Hono context)
export const { auth } = CreateAuth({
  adapter,
  secret: process.env.AUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === 'true' || process.env.NODE_ENV !== 'production',
  basePath: '/api/auth',
  // Use JWT strategy - this is what works with Credentials provider
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: sharedCallbacks,
  events: sharedEvents,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: 'credentials-signin',
      name: 'Credentials Sign in',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials
        if (!email || !password) return null
        if (typeof email !== 'string' || typeof password !== 'string') return null
        const user = await adapter.getUserByEmail(email)
        if (!user) return null
        const matchingAccount = user.accounts.find((a) => a.provider === 'credentials')
        if (!matchingAccount?.password) return null
        const isValid = await verify(matchingAccount.password, password)
        return isValid ? user : null
      },
    }),
    Credentials({
      id: 'credentials-signup',
      name: 'Credentials Sign up',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text', required: false },
        image: { label: 'Image', type: 'text', required: false },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials
        if (!email || !password) return null
        if (typeof email !== 'string' || typeof password !== 'string') return null
        const existing = await adapter.getUserByEmail(email)
        if (existing) return null
        const newUser = await adapter.createUser({
          id: crypto.randomUUID(),
          emailVerified: null,
          email,
          name: typeof credentials.name === 'string' && credentials.name.trim().length > 0 ? credentials.name : undefined,
          image: typeof credentials.image === 'string' ? credentials.image : undefined,
        })
        await adapter.linkAccount({
          extraData: { password: await hash(password) },
          type: 'credentials',
          userId: newUser.id,
          providerAccountId: newUser.id,
          provider: 'credentials',
        })
        return newUser
      },
    }),
  ],
  pages: {
    signIn: '/account/signin',
    signOut: '/account/logout',
    error: '/account/signin',
  },
})
