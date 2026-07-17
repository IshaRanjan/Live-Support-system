import { MemberSupportChat } from '@/components/support/member/MemberSupportChat';
import { isMember } from '@/lib/support/mock-member';

// Stand-in for where this will live in your Member Dashboard later.
// When you integrate: import MemberSupportChat and drop it into whatever
// route/layout your real dashboard already uses, passing your real
// membership check instead of the mock.
export default function MemberSupportPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-lg font-semibold text-slate-900">Support</h1>
      <p className="mt-1 text-sm text-slate-500">Chat live with our support team.</p>
      <div className="mt-4">
        <MemberSupportChat isMember={isMember} />
      </div>
    </main>
  );
}
