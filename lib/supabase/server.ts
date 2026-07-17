import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Used from server components / route handlers when you want a
// Supabase client scoped to the request's cookies (anon key, respects RLS).
// The support system's own routes use lib/supabase/service.ts instead,
// since agent/member identity here isn't a Supabase Auth session — but this
// is here for anything else you build on top (e.g. real member auth later).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from a Server Component where cookies
            // can't be mutated — safe to ignore if you have middleware
            // refreshing sessions elsewhere.
          }
        },
      },
    }
  );
}
