import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isMember, mockMember } from '@/lib/support/mock-member';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isMember) {
    return NextResponse.json({ error: 'Live Support is available to members only.' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: conversation } = await supabase
    .from('conversations')
    .select('member_id')
    .eq('id', id)
    .single();

  if (!conversation || conversation.member_id !== mockMember.id) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

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
  if (!isMember) {
    return NextResponse.json({ error: 'Live Support is available to members only.' }, { status: 403 });
  }

  const { id } = await params;
  const { body } = (await req.json()) as { body: string };

  if (!body?.trim()) {
    return NextResponse.json({ error: 'Message body is required.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: conversation } = await supabase
    .from('conversations')
    .select('member_id, status')
    .eq('id', id)
    .single();

  if (!conversation || conversation.member_id !== mockMember.id) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (conversation.status !== 'active') {
    return NextResponse.json({ error: 'This conversation is no longer active.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: id,
      sender_role: 'member',
      sender_id: mockMember.id,
      sender_name: mockMember.name,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);

  return NextResponse.json({ message: data });
}
