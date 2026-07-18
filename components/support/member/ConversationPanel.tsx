'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealtimeMessages } from '@/lib/support/hooks/useRealtimeMessages';
import type { Conversation } from '@/types/support';

interface Props {
  conversation: Conversation;
  onReopen: () => void;
  reopening: boolean;
  reopenError: string | null;
}

export function ConversationPanel({ conversation, onReopen, reopening, reopenError }: Props) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages } = useRealtimeMessages(conversation.id, '/api/member/support/conversations');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear any in-progress draft when switching threads so it never leaks
  // into the wrong conversation.
  useEffect(() => {
    setDraft('');
  }, [conversation.id]);

  async function sendMessage() {
    if (!draft.trim()) return;
    const body = draft.trim();
    setDraft('');
    await fetch(`/api/member/support/conversations/${conversation.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
  }

  const isActive = conversation.status === 'active';
  const isClosed = conversation.status === 'closed';
  const isArchived = conversation.status === 'archived';
  const canReopen = isClosed && !conversation.has_been_reopened;
  const alreadyReopenedAndClosedAgain = isClosed && conversation.has_been_reopened;

  return (
    <div className="flex h-full flex-1 flex-col bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{conversation.subject ?? 'Conversation'}</p>
        <p className="text-xs text-slate-500">
          {isActive && "We're here to help."}
          {isClosed && 'This conversation has ended.'}
          {isArchived && 'This conversation is archived.'}
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

      {/* Input only exists while active — it disappears entirely (not
          just disabled) the instant status flips to closed/archived,
          since that flows in live via useRealtimeMemberConversations. */}
      {isActive && (
        <div className="flex gap-2 border-t border-slate-200 p-3">
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

      {canReopen && (
        <div className="border-t border-slate-200 p-3 text-center">
          {reopenError && <p className="mb-2 text-xs text-red-600">{reopenError}</p>}
          <button
            onClick={onReopen}
            disabled={reopening}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-slate-300"
          >
            {reopening ? 'Reopening…' : 'Reopen Case'}
          </button>
        </div>
      )}

      {alreadyReopenedAndClosedAgain && (
        <div className="border-t border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">
            This conversation has already been reopened once. Please start a new conversation
            for further assistance.
          </p>
        </div>
      )}

      {isArchived && (
        <div className="border-t border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-400">This conversation is archived and read-only.</p>
        </div>
      )}
    </div>
  );
}