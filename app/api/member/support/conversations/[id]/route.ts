import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isMember, mockMember } from '@/lib/support/mock-member';

// Lets the member's conversation-detail view (and its realtime hook)
// re-fetch a single conversation's current row — status, has_been_reopened,
// etc. — instead of re-fetching the whole list.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isMember) {
    return NextResponse.json({ error: 'Live Support is available to members only.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !conversation || conversation.member_id !== mockMember.id) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}