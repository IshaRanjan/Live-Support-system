'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealtimeMessages } from '@/lib/support/hooks/useRealtimeMessages';
import { useTypingIndicator } from '@/lib/support/hooks/useTypingIndicator';
import { TypingDots } from '@/components/support/shared/TypingDots';
import type { Conversation, ConversationStatus } from '@/types/support';
import { StatusBadge } from './StatusBadge';

interface Props {
  conversation: Conversation | null;
  onStatusChange: (id: string, status: ConversationStatus) => Promise<void>;
}

export function ChatWindow({ conversation, onStatusChange }: Props) {
  const { messages, loading } = useRealtimeMessages(conversation?.id ?? null, '/api/support/conversations');
  const { otherTyping: memberTyping, notifyTyping, notifyStoppedTyping } = useTypingIndicator(
    conversation?.id ?? null,
    'agent'
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Select a conversation to start replying.</p>
      </div>
    );
  }

  const isArchived = conversation.status === 'archived';
  const isClosed = conversation.status === 'closed';

  function handleDraftChange(value: string) {
    setDraft(value);
    if (value.trim()) notifyTyping();
  }

  async function sendReply() {
    if (!draft.trim() || !conversation) return;
    setSending(true);
    notifyStoppedTyping();
    await fetch(`/api/support/conversations/${conversation.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: draft.trim() }),
    });
    setDraft('');
    setSending(false);
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {conversation.member_name ?? conversation.visitor_name ?? 'Conversation'}
            </p>
            <StatusBadge status={conversation.status} />
          </div>
          <div className="flex gap-2">
            {conversation.status === 'active' && (
              <button
                onClick={() => onStatusChange(conversation.id, 'closed')}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close conversation
              </button>
            )}
            {isClosed && (
              <button
                onClick={() => onStatusChange(conversation.id, 'archived')}
                className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
              >
                Archive
              </button>
            )}
          </div>
        </div>
        {/* Member typing indicator, directly below the header as specified */}
        {conversation.status === 'active' && memberTyping && (
          <p className="mt-1 text-xs italic text-slate-400">Member is typing…</p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && <p className="text-sm text-slate-400">Loading messages…</p>}
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isAgent = msg.sender_role === 'agent';
            return (
              <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md rounded-2xl px-4 py-2 text-sm ${
                    isAgent
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-800 ring-1 ring-slate-200'
                  }`}
                >
                  <p>{msg.body}</p>
                  <p className={`mt-1 text-[10px] ${isAgent ? 'text-teal-100' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white p-3">
        {isArchived ? (
          <p className="text-center text-xs text-slate-400">
            This conversation is archived and read-only.
          </p>
        ) : (
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
              onBlur={() => !draft.trim() && notifyStoppedTyping()}
              rows={1}
              placeholder={
                isClosed ? 'This conversation is closed — the member can reopen it' : 'Type a reply…'
              }
              disabled={isClosed || sending}
              className="flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              onClick={sendReply}
              disabled={isClosed || sending || !draft.trim()}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              Send
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}