import { NextRequest, NextResponse } from 'next/server';
import { getAgentSession } from '@/lib/support/agent-session';
import { createServiceClient } from '@/lib/supabase/service';
import type { ConversationStatus } from '@/types/support';

// Agents can only move a conversation forward: active -> closed -> archived.
// Reopening (closed -> active) is member-only now — see
// /api/member/support/conversations/[id]/reopen — and is capped at once
// per conversation via `has_been_reopened`.
const ALLOWED_TRANSITIONS: Record<ConversationStatus, ConversationStatus[]> = {
  active: ['closed'],
  closed: ['archived'],
  archived: [],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAgentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('conversations').select('*').eq('id', id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ conversation: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAgentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status: nextStatus } = (await req.json()) as { status: ConversationStatus };

  const supabase = createServiceClient();
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  const currentStatus = existing.status as ConversationStatus;
  if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Cannot move conversation from "${currentStatus}" to "${nextStatus}".` },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === 'closed') update.closed_at = new Date().toISOString();
  if (nextStatus === 'archived') update.archived_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('conversations')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}