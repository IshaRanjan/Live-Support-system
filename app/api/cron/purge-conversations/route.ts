import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// Call this on a schedule (Vercel Cron, an external cron hitting the URL,
// a GitHub Actions scheduled workflow, etc.) — see README for options.
// Deletes conversations that have been closed (not archived) for more than
// 72 hours; messages cascade-delete via the FK.
//
// Protected by CRON_SECRET so this can't be hit by anyone who finds the URL.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc('purge_expired_conversations');

  if (error) {
    console.error('Purge job failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
