import { Breadcrumbs } from '@/components/breadcrumbs';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconSettings, IconPalette, IconPhoto } from '@tabler/icons-react';
import Link from 'next/link';

export default function SuperAdminPage() {
  return (
    <div className='flex h-full w-full flex-col overflow-y-auto'>
      <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
        <div className='space-y-4'>
          <Breadcrumbs />
          <div className='flex items-center justify-between'>
            <Heading
              title='Super Admin Dashboard'
              description='Manage global application settings and configurations'
            />
          </div>
          <Separator />
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <Link href='/super-admin/app-settings'>
            <Card className='transition-all hover:shadow-lg'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-lg font-medium'>
                  App Settings
                </CardTitle>
                <IconPhoto className='text-muted-foreground h-5 w-5' />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage application icon, name, and global branding settings.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href='/super-admin/theme-settings'>
            <Card className='transition-all hover:shadow-lg'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-lg font-medium'>
                  Theme Settings
                </CardTitle>
                <IconPalette className='text-muted-foreground h-5 w-5' />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Configure application themes, colors, and visual preferences.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href='/admin'>
            <Card className='transition-all hover:shadow-lg'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-lg font-medium'>
                  Admin Panel
                </CardTitle>
                <IconSettings className='text-muted-foreground h-5 w-5' />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access standard admin features for managing users, markets,
                  and more.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
