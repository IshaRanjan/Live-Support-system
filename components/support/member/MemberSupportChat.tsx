'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealtimeMessages } from '@/lib/support/hooks/useRealtimeMessages';
import type { Conversation } from '@/types/support';

// This is what you'll eventually mount inside your real Member Dashboard.
// It handles: resuming an existing open conversation, starting a new one,
// and live back-and-forth with the support agent.
export function MemberSupportChat({ isMember }: { isMember: boolean }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages } = useRealtimeMessages(conversation?.id ?? null, '/api/member/support/conversations');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isMember) {
      setInitializing(false);
      return;
    }
    (async () => {
      const res = await fetch('/api/member/support/conversations');
      const data = await res.json();
      const openConversation = (data.conversations ?? []).find(
        (c: Conversation) => c.status === 'active'
      );
      setConversation(openConversation ?? null);
      setInitializing(false);
    })();
  }, [isMember]);

  async function startConversation() {
    const res = await fetch('/api/member/support/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setConversation(data.conversation);
  }

  async function sendMessage() {
    if (!draft.trim() || !conversation) return;
    const body = draft.trim();
    setDraft('');
    await fetch(`/api/member/support/conversations/${conversation.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
  }

  if (!isMember) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Live Support is available to members with an active package or booked session.
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-400">
        Loading Live Support…
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-600">Need help? Start a conversation with our support team.</p>
        <button
          onClick={startConversation}
          className="mt-3 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Start Live Support
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-96 flex-col rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-2">
        <p className="text-sm font-semibold text-slate-900">Live Support</p>
        <p className="text-xs text-slate-500">
          {conversation.status === 'active' ? "We're here to help." : 'This conversation has ended.'}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((msg) => {
          const isMine = msg.sender_role === 'member';
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  isMine ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {conversation.status === 'active' && (
        <div className="flex gap-2 border-t border-slate-200 p-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            onClick={sendMessage}
            className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
