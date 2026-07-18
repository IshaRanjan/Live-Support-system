'use client';

import { useMemo, useState } from 'react';
import { ConversationSidebar } from './ConversationSidebar';
import { ConversationPanel } from './ConversationPanel';
import { useRealtimeMemberConversations } from '@/lib/support/hooks/useRealtimeMemberConversations';
import type { Conversation } from '@/types/support';

export function MemberSupportWorkspace({ isMember }: { isMember: boolean }) {
  const { conversations, loading, refetch } = useRealtimeMemberConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingConversation, setPendingConversation] = useState<Conversation | null>(null);
  const [startingNew, setStartingNew] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Merge in a just-created (or just-reopened) conversation until the
  // realtime list catches up, so the panel updates instantly instead of
  // flashing empty for a beat while waiting on the round trip.
  const merged = useMemo(() => {
    if (pendingConversation && !conversations.some((c) => c.id === pendingConversation.id)) {
      return [pendingConversation, ...conversations];
    }
    return conversations;
  }, [conversations, pendingConversation]);

  const sorted = useMemo(
    () => [...merged].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
    [merged]
  );

  const selected = sorted.find((c) => c.id === selectedId) ?? null;

  async function startNewConversation() {
    setStartingNew(true);
    const res = await fetch('/api/member/support/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setStartingNew(false);
    if (res.ok && data.conversation) {
      setPendingConversation(data.conversation);
      setSelectedId(data.conversation.id);
      setReopenError(null);
      refetch();
    }
  }

  async function reopenSelected() {
    if (!selected) return;
    setReopening(true);
    setReopenError(null);
    const res = await fetch(`/api/member/support/conversations/${selected.id}/reopen`, {
      method: 'POST',
    });
    const data = await res.json();
    setReopening(false);
    if (!res.ok) {
      setReopenError(data.error ?? 'Could not reopen this conversation.');
      return;
    }
    // Belt-and-suspenders: apply the response immediately rather than
    // waiting on the postgres_changes round trip, then refetch to
    // reconcile with the canonical list.
    setPendingConversation(data.conversation);
    refetch();
  }

  if (!isMember) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Live Support is available to members with an active package or booked session.
      </div>
    );
  }

  return (
    <div className="flex h-[32rem] overflow-hidden rounded-lg border border-slate-200">
      <ConversationSidebar
        conversations={sorted}
        selectedId={selectedId}
        onSelect={(conv) => {
          setSelectedId(conv.id);
          setReopenError(null);
        }}
        onStartNew={startNewConversation}
        startingNew={startingNew}
        loading={loading}
      />
      {selected ? (
        <ConversationPanel
          key={selected.id}
          conversation={selected}
          onReopen={reopenSelected}
          reopening={reopening}
          reopenError={reopenError}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-400">
            {loading ? 'Loading conversations…' : 'Select a conversation, or start a new one.'}
          </p>
        </div>
      )}
    </div>
  );
}