'use client';

import { useMemo, useState } from 'react';
import { Sidebar } from '@/components/support/dashboard/Sidebar';
import { ConversationList } from '@/components/support/dashboard/ConversationList';
import { ChatWindow } from '@/components/support/dashboard/ChatWindow';
import { MemberInfoPanel } from '@/components/support/dashboard/MemberInfoPanel';
import { useRealtimeConversations } from '@/lib/support/hooks/useRealtimeConversations';
import type { Conversation, ConversationStatus } from '@/types/support';

export default function SupportDashboardPage() {
  const [filter, setFilter] = useState<ConversationStatus>('active');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Conversation | null>(null);

  // ONE subscription for the whole page. Counts and the filtered/searched
  // list are both derived from this single source with useMemo, instead of
  // opening a separate realtime channel per status (the old approach).
  const { conversations, loading, refetch } = useRealtimeConversations();

  const counts = useMemo(() => {
    const result: Record<ConversationStatus, number> = { active: 0, closed: 0, archived: 0 };
    for (const conv of conversations) {
      result[conv.status] += 1;
    }
    return result;
  }, [conversations]);

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((conv) => {
      if (conv.status !== filter) return false;
      if (!query) return true;
      return (
        conv.member_name?.toLowerCase().includes(query) ||
        conv.member_email?.toLowerCase().includes(query) ||
        conv.subject?.toLowerCase().includes(query)
      );
    });
  }, [conversations, filter, search]);

  async function handleStatusChange(id: string, status: ConversationStatus) {
    const res = await fetch(`/api/support/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { conversation } = await res.json();
      setSelected(conversation);
      // Realtime will pick up the change too, but refetching immediately
      // avoids a visible lag in the sidebar counts / list.
      refetch();
    }
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar activeFilter={filter} onFilterChange={setFilter} counts={counts} />
      <ConversationList
        conversations={visibleConversations}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
      />
      <ChatWindow conversation={selected} onStatusChange={handleStatusChange} />
      <MemberInfoPanel conversation={selected} />
    </div>
  );
}
