import { cookies } from 'next/headers';
import crypto from 'crypto';

// Simple signed-cookie session for the single support agent.
// No Supabase Auth here on purpose — credentials come from env vars per
// the spec, so a lightweight HMAC-signed cookie is all that's needed.

const COOKIE_NAME = 'support_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getSecret() {
  const secret = process.env.SUPPORT_SESSION_SECRET;
  if (!secret) {
    throw new Error('Missing SUPPORT_SESSION_SECRET env var.');
  }
  return secret;
}

function sign(payload: string) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export async function createAgentSession(username: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = JSON.stringify({ username, expiresAt });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = sign(encodedPayload);
  const cookieValue = `${encodedPayload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyAgentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAgentSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [encodedPayload, signature] = raw.split('.');
  if (!encodedPayload || !signature) return null;
  if (sign(encodedPayload) !== signature) return null; // tampered

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    if (typeof payload.expiresAt !== 'number' || Date.now() > payload.expiresAt) {
      return null; // expired
    }
    return { username: payload.username };
  } catch {
    return null;
  }
}

export const SUPPORT_SESSION_COOKIE_NAME = COOKIE_NAME;
