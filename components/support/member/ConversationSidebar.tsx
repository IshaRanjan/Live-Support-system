'use client';

import { StatusBadge } from '@/components/support/dashboard/StatusBadge';
import type { Conversation } from '@/types/support';

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onStartNew: () => void;
  startingNew: boolean;
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

// No search bar here on purpose — members typically have a handful of
// conversations, unlike the agent dashboard's full queue.
export function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  onStartNew,
  startingNew,
  loading,
}: Props) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <button
          onClick={onStartNew}
          disabled={startingNew}
          className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-slate-300"
        >
          {startingNew ? 'Starting…' : '+ Start New Conversation'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <p className="p-4 text-sm text-slate-400">Loading conversations…</p>}

        {!loading && conversations.length === 0 && (
          <p className="p-4 text-sm text-slate-400">No conversations yet.</p>
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
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-900">
                  {conv.subject ?? `Conversation from ${new Date(conv.created_at).toLocaleDateString()}`}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-slate-400">{timeAgo(conv.updated_at)}</span>
              </div>
              <StatusBadge status={conv.status} />
            </button>
          );
        })}
      </div>
    </div>
  );
}