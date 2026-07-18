import { MemberSupportWorkspace } from '@/components/support/member/MemberSupportWorkspace';
import { isMember } from '@/lib/support/mock-member';

// Stand-in for where this will live in your Member Dashboard later.
// Previous conversations and the active thread live side-by-side here —
// no separate History route to navigate to.
export default function MemberSupportPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-lg font-semibold text-slate-900">Support</h1>
      <p className="mt-1 text-sm text-slate-500">Chat live with our support team.</p>
      <div className="mt-4">
        <MemberSupportWorkspace isMember={isMember} />
      </div>
    </main>
  );
}