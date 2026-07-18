import { TypingDots } from '@/components/support/shared/TypingDots';

// Shown in the message area for an active conversation until the first
// agent message arrives — replaced automatically the moment
// messages.some(m => m.sender_role === 'agent') becomes true.
export function WaitingForAgent() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
        <p className="font-medium text-slate-700">Connecting you with a support agent…</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Our support team has received your request and we&apos;re assigning the next available
          support representative. This usually takes only a few moments.
        </p>
        <TypingDots className="mt-2 text-slate-400" />
      </div>
    </div>
  );
}