import { NextRequest, NextResponse } from 'next/server';
import { getAgentSession } from '@/lib/support/agent-session';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAgentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAgentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { body } = (await req.json()) as { body: string };

  if (!body?.trim()) {
    return NextResponse.json({ error: 'Message body is required.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Don't allow replying into an archived conversation from the wire —
  // the UI shouldn't offer this, but enforce it server-side too.
  const { data: conversation } = await supabase
    .from('conversations')
    .select('status')
    .eq('id', id)
    .single();

  if (conversation?.status === 'archived') {
    return NextResponse.json({ error: 'Cannot reply to an archived conversation.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: id,
      sender_role: 'agent',
      sender_id: session.username,
      sender_name: session.username,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // touch the conversation so it sorts to the top of the list
  await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);

  return NextResponse.json({ message: data });
}
