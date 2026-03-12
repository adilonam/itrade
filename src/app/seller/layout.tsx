import KBar from '@/components/kbar';
import Header from '@/components/layout/header';
import { RoomTradingTopNav } from '@/components/layout/room-trading-top-nav';
import ForbiddenPage from '@/components/errors/forbidden';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seller Dashboard - Next Shadcn Dashboard',
  description: 'Seller management dashboard with Next.js and Shadcn'
};

export default async function SellerLayout({
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

  // Check if user has seller, admin or superadmin role
  const userRole = session.user?.role;
  if (
    userRole !== 'SELLER' &&
    userRole !== 'ADMIN' &&
    userRole !== 'SUPERADMIN'
  ) {
    return (
      <ForbiddenPage
        title='Seller Access Required'
        description='You need seller, administrator, or super administrator privileges to access this section. Please contact your system administrator if you believe you should have access to this area.'
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
