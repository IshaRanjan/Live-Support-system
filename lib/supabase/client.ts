import { createBrowserClient } from '@supabase/ssr';

// Singleton: creating a new client (and therefore a new Realtime socket) on
// every call is wasteful, and with several components mounting at once it
// can contribute to duplicate-subscription races. One client per browser
// tab is the correct pattern here.
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
