import type { ConversationStatus } from '@/types/support';

const STYLES: Record<ConversationStatus, string> = {
  active: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  closed: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  archived: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

const DOT: Record<ConversationStatus, string> = {
  active: 'bg-teal-500',
  closed: 'bg-slate-400',
  archived: 'bg-amber-500',
};

const LABEL: Record<ConversationStatus, string> = {
  active: 'Active',
  closed: 'Closed',
  archived: 'Archived',
};

export function StatusBadge({ status }: { status: ConversationStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {LABEL[status]}
    </span>
  );
}
