interface Props {
  canReopen: boolean;
  alreadyReopened: boolean;
  onReopen: () => void;
  reopening: boolean;
  reopenError: string | null;
}

// Professional information panel shown in place of the input once a
// conversation is closed. The member reads the resolution message first;
// Reopen Case sits below with clear spacing so it isn't the first thing
// they see.
export function ClosedConversationPanel({
  canReopen,
  alreadyReopened,
  onReopen,
  reopening,
  reopenError,
}: Props) {
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Conversation Closed</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            This support conversation has been marked as resolved by our support team.
          </p>
          {canReopen && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              If you still require assistance regarding this issue, you may reopen this conversation.
            </p>
          )}
        </div>
      </div>

      {canReopen && (
        <div className="mt-4 border-t border-slate-200 pt-4 text-center">
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

      {alreadyReopened && (
        <p className="mt-4 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          This conversation has already been reopened once. Please start a new conversation
          for further assistance.
        </p>
      )}
    </div>
  );
}