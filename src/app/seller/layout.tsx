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

  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* page main content */}
          {children}
          {/* page main content ends */}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
