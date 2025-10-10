import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import ForbiddenPage from '@/components/errors/forbidden';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

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

  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
