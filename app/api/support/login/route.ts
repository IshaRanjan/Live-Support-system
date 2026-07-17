import { NextRequest, NextResponse } from 'next/server';
import { createAgentSession } from '@/lib/support/agent-session';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUsername = process.env.SUPPORT_AGENT_USERNAME;
  const validPassword = process.env.SUPPORT_AGENT_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error('SUPPORT_AGENT_USERNAME / SUPPORT_AGENT_PASSWORD not set.');
    return NextResponse.json({ error: 'Support login is not configured.' }, { status: 500 });
  }

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  await createAgentSession(username);
  return NextResponse.json({ ok: true });
}
