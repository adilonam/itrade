import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client';
import ForbiddenPage from '@/components/errors/forbidden';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAuthSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Application branding and global configuration'
};

export default async function SuperAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/sign-in');
  }

  const userRole = session.user?.role;
  if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
    return (
      <ForbiddenPage
        title='Admin Access Required'
        description='You need administrator privileges to access this section. Please contact your system administrator if you believe you should have access to this area.'
        showBackButton={true}
        showHomeButton={true}
      />
    );
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
