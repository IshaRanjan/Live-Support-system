import { NextRequest, NextResponse } from 'next/server';
import { getAgentSession } from '@/lib/support/agent-session';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  const session = await getAgentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // 'active' | 'closed' | 'archived' | null (= all)
  const search = searchParams.get('search')?.trim();

  const supabase = createServiceClient();
  let query = supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(
      `member_name.ilike.%${search}%,member_email.ilike.%${search}%,subject.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data });
}
