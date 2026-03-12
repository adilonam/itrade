import KBar from '@/components/kbar';
import Header from '@/components/layout/header';
import { RoomTradingTopNav } from '@/components/layout/room-trading-top-nav';
import ForbiddenPage from '@/components/errors/forbidden';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin Dashboard',
  description: 'Super administrator dashboard with full system control'
};

export default async function SuperAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Get the user session
  const session = await getServerSession(authOptions);

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect('/auth/sign-in');
  }

  // Check if user has superadmin role
  const userRole = session.user?.role;
  if (userRole !== 'SUPERADMIN') {
    return (
      <ForbiddenPage
        title='Super Admin Access Required'
        description='You need super administrator privileges to access this section. This area is restricted to system administrators only.'
        showBackButton={true}
        showHomeButton={true}
      />
    );
  }

  return (
    <KBar>
      <div className="flex min-h-screen w-full flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
          <RoomTradingTopNav />
          <Header variant="compact" />
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</main>
      </div>
    </KBar>
  );
}
