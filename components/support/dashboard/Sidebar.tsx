'use client';

import { useRouter } from 'next/navigation';
import type { ConversationStatus } from '@/types/support';

interface Props {
  activeFilter: ConversationStatus;
  onFilterChange: (status: ConversationStatus) => void;
  counts: Record<ConversationStatus, number>;
}

const FILTERS: { key: ConversationStatus; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
  { key: 'archived', label: 'Archived' },
];

export function Sidebar({ activeFilter, onFilterChange, counts }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/support/logout', { method: 'POST' });
    router.push('/support/login');
    router.refresh();
  }

  return (
    <aside className="flex h-full w-56 flex-col justify-between border-r border-slate-200 bg-white">
      <div>
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-sm font-semibold text-slate-900">Live Support</p>
          <p className="text-xs text-slate-500">Agent console</p>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {FILTERS.map((filter) => {
            const isActive = filter.key === activeFilter;
            return (
              <button
                key={filter.key}
                onClick={() => onFilterChange(filter.key)}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${
                    isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {counts[filter.key]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
