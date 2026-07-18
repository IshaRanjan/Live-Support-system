import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isMember, mockMember } from '@/lib/support/mock-member';

// Member-only "Reopen Case" action. Agents cannot reopen conversations
// (see app/api/support/conversations/[id]/route.ts — closed only
// transitions to archived from the agent side now).
//
// A conversation may be reopened at most once in its lifetime, tracked by
// `has_been_reopened`. Once true, this endpoint refuses and the member is
// told to start a new conversation instead.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isMember) {
    return NextResponse.json({ error: 'Live Support is available to members only.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: conversation, error: fetchError } = await supabase
    .from('conversations')
    .select('member_id, status, has_been_reopened')
    .eq('id', id)
    .single();

  if (fetchError || !conversation || conversation.member_id !== mockMember.id) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (conversation.status === 'archived') {
    return NextResponse.json({ error: 'Archived conversations cannot be reopened.' }, { status: 400 });
  }

  if (conversation.status !== 'closed') {
    return NextResponse.json({ error: 'Only closed conversations can be reopened.' }, { status: 400 });
  }

  if (conversation.has_been_reopened) {
    return NextResponse.json(
      {
        error:
          'This conversation has already been reopened once. Please start a new conversation if you need further assistance.',
      },
      { status: 400 }
    );
  }

  // Reopen: back to active, clear closed_at (this cancels the 72h purge
  // timer — purge_expired_conversations() only targets rows where
  // status = 'closed'), and permanently flip has_been_reopened so this
  // can never happen a second time. `updated_at` is bumped automatically
  // by the existing trg_conversations_updated_at trigger, which is what
  // resorts it to the top of the agent dashboard's list.
  const { data, error } = await supabase
    .from('conversations')
    .update({
      status: 'active',
      closed_at: null,
      has_been_reopened: true,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // No extra notification step is needed here: `conversations` is already
  // in the supabase_realtime publication, and the agent dashboard's
  // useRealtimeConversations hook subscribes to '*' events on it — so this
  // UPDATE is pushed to the dashboard the moment it commits, and the
  // conversation reappears in the "Active" filter automatically.
  return NextResponse.json({ conversation: data });
}