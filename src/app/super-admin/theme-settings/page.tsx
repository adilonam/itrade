import { Breadcrumbs } from '@/components/breadcrumbs';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { ThemeControlsCard } from '@/components/admin/theme-controls-card';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import ForbiddenPage from '@/components/errors/forbidden';

export default async function ThemeSettingsPage() {
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
        description='You need super administrator privileges to access theme settings. This feature is restricted to system administrators only.'
        showBackButton={true}
        showHomeButton={true}
      />
    );
  }

  return (
    <div className='flex h-full w-full flex-col overflow-y-auto'>
      <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
        <div className='space-y-4'>
          <Breadcrumbs />
          <div className='flex items-center justify-between'>
            <Heading
              title='Theme Settings'
              description='Customize the appearance and visual theme of the application'
            />
          </div>
          <Separator />
        </div>

        {/* Theme Controls Card */}
        <div className='max-w-3xl pb-8'>
          <ThemeControlsCard />
        </div>
      </div>
    </div>
  );
}
