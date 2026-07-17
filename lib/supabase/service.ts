import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SERVER-ONLY. Never import this from a client component — it holds the
// service-role key, which bypasses Row Level Security entirely.
//
// Used by the support system's API routes (both agent-side and
// member-side) so writes work correctly without needing real member auth
// wired into RLS yet. See the RLS comments in the migration file.
//
// Deliberately untyped against the Database generic: hand-written partial
// Insert/Update types fight the query builder's inference (turns rows into
// `never` on insert/update chains). Runtime shape is enforced by the SQL
// schema; `types/support.ts` covers type-safety for everything that reads
// data back out of these API routes.

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.'
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
