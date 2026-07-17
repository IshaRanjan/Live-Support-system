import { StatusBadge } from './StatusBadge';
import type { Conversation } from '@/types/support';

export function MemberInfoPanel({ conversation }: { conversation: Conversation | null }) {
  if (!conversation) {
    return (
      <aside className="w-72 shrink-0 border-l border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-400">Select a conversation to see details.</p>
      </aside>
    );
  }

  const isVisitor = conversation.type === 'visitor_support';
  const name = isVisitor ? conversation.visitor_name : conversation.member_name;
  const email = isVisitor ? conversation.visitor_email : conversation.member_email;

  return (
    <aside className="w-72 shrink-0 border-l border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        {isVisitor ? 'Visitor details' : 'Member details'}
      </h3>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Name</dt>
          <dd className="mt-0.5 text-slate-800">{name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
          <dd className="mt-0.5 text-slate-800">{email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Subject</dt>
          <dd className="mt-0.5 text-slate-800">{conversation.subject ?? 'None provided'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Status</dt>
          <dd className="mt-1"><StatusBadge status={conversation.status} /></dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Started</dt>
          <dd className="mt-0.5 text-slate-800">
            {new Date(conversation.created_at).toLocaleString()}
          </dd>
        </div>
        {conversation.closed_at && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Closed</dt>
            <dd className="mt-0.5 text-slate-800">
              {new Date(conversation.closed_at).toLocaleString()}
            </dd>
            {conversation.status === 'closed' && (
              <p className="mt-1 text-xs text-amber-600">
                Auto-deletes 72h after close unless archived.
              </p>
            )}
          </div>
        )}
        {conversation.archived_at && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Archived</dt>
            <dd className="mt-0.5 text-slate-800">
              {new Date(conversation.archived_at).toLocaleString()}
            </dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
