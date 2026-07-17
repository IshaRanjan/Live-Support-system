import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-600">Standalone demo</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Live Support System</h1>
        <p className="mt-2 text-sm text-slate-500">
          This runs independently of your main app for now. Pick an entry point below —
          both update in real time against the same Supabase project.
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            href="/dashboard/support"
            className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/40"
          >
            <p className="text-sm font-semibold text-slate-900">Member view</p>
            <p className="mt-0.5 text-xs text-slate-500">Start or continue a Live Support chat as a member.</p>
          </Link>

          <Link
            href="/support/login"
            className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/40"
          >
            <p className="text-sm font-semibold text-slate-900">Support agent console</p>
            <p className="mt-0.5 text-xs text-slate-500">Sign in to reply to members and manage conversations.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
