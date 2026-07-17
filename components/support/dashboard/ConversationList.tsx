'use client';

import { SearchBar } from './SearchBar';
import { StatusBadge } from './StatusBadge';
import type { Conversation } from '@/types/support';

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  loading,
}: Props) {
  return (
    <div className="flex h-full w-80 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <SearchBar value={search} onChange={onSearchChange} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <p className="p-4 text-sm text-slate-400">Loading conversations…</p>}

        {!loading && conversations.length === 0 && (
          <p className="p-4 text-sm text-slate-400">No conversations here yet.</p>
        )}

        {conversations.map((conv) => {
          const isSelected = conv.id === selectedId;
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium text-slate-900">
                  {conv.member_name ?? conv.visitor_name ?? 'Unknown'}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-slate-400">
                  {timeAgo(conv.updated_at)}
                </span>
              </div>
              <span className="truncate text-xs text-slate-500">
                {conv.subject ?? conv.member_email ?? 'No subject'}
              </span>
              <StatusBadge status={conv.status} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
