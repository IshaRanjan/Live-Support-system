import { NextResponse } from 'next/server';
import { destroyAgentSession } from '@/lib/support/agent-session';

export async function POST() {
  await destroyAgentSession();
  return NextResponse.json({ ok: true });
}
