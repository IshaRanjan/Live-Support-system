import { redirect } from 'next/navigation';
import { getAgentSession } from '@/lib/support/agent-session';

export default async function SupportDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAgentSession();

  if (!session) {
    redirect('/support/login');
  }

  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
