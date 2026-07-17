import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isMember, mockMember } from '@/lib/support/mock-member';

// GET: a member's own conversations (used to resume an existing chat
// instead of always starting a new one).
export async function GET() {
  if (!isMember) {
    return NextResponse.json({ error: 'Live Support is available to members only.' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('type', 'member_support')
    .eq('member_id', mockMember.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data });
}

// POST: start a new conversation
export async function POST(req: NextRequest) {
  if (!isMember) {
    return NextResponse.json({ error: 'Live Support is available to members only.' }, { status: 403 });
  }

  const { subject } = (await req.json().catch(() => ({}))) as { subject?: string };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      type: 'member_support',
      status: 'active',
      member_id: mockMember.id,
      member_name: mockMember.name,
      member_email: mockMember.email,
      subject: subject?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}
