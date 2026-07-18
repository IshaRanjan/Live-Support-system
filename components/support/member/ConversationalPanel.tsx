'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealtimeMessages } from '@/lib/support/hooks/useRealtimeMessages';
import { useTypingIndicator } from '@/lib/support/hooks/useTypingIndicator';
import { ClosedConversationPanel } from './ClosedConversationPanel';
import { WaitingForAgent } from './WaitingForAgent';
import { TypingDots } from '@/components/support/shared/TypingDots';
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
  const { otherTyping: agentTyping, notifyTyping, notifyStoppedTyping } = useTypingIndicator(
    conversation.id,
    'member'
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentTyping]);

  useEffect(() => {
    setDraft('');
  }, [conversation.id]);

  function handleDraftChange(value: string) {
    setDraft(value);
    if (value.trim()) notifyTyping();
  }

  async function sendMessage() {
    if (!draft.trim()) return;
    const body = draft.trim();
    setDraft('');
    notifyStoppedTyping();
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
  const alreadyReopened = isClosed && conversation.has_been_reopened;

  const hasAgentReply = messages.some((m) => m.sender_role === 'agent');
  const showWaiting = isActive && !hasAgentReply;

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

        {showWaiting && <WaitingForAgent />}

        {/* "Support agent is typing…" only makes sense once an agent has
            actually joined the thread; before that it's covered by the
            waiting state above. */}
        {isActive && hasAgentReply && agentTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
              <span>Support agent is typing…</span>
              <TypingDots className="text-slate-400" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input only exists while active — disappears entirely (not just
          disabled) the instant status flips to closed/archived, since the
          parent's live conversation list re-renders this immediately. */}
      {isActive && (
        <div className="flex gap-2 border-t border-slate-200 p-3">
          <input
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            onBlur={() => !draft.trim() && notifyStoppedTyping()}
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

      {isClosed && (
        <ClosedConversationPanel
          canReopen={canReopen}
          alreadyReopened={alreadyReopened}
          onReopen={onReopen}
          reopening={reopening}
          reopenError={reopenError}
        />
      )}

      {isArchived && (
        <div className="border-t border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-400">This conversation is archived and read-only.</p>
        </div>
      )}
    </div>
  );
}