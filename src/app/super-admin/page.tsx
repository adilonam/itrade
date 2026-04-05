import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconSettings, IconPhoto } from '@tabler/icons-react';
import Link from 'next/link';

export const metadata = {
  title: 'Settings'
};

export default function SuperAdminHomePage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Settings'
            description='Branding and links to other admin tools.'
          />
        </div>
        <Separator />
        <div className='grid gap-4 pb-8 md:grid-cols-2'>
          <Link href='/super-admin/app-settings'>
            <Card className='h-full transition-all hover:shadow-md'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-lg font-medium'>
                  App settings
                </CardTitle>
                <IconPhoto className='text-muted-foreground h-5 w-5' />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Application name, icon, and branding.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href='/admin/users'>
            <Card className='h-full transition-all hover:shadow-md'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-lg font-medium'>
                  Admin panel
                </CardTitle>
                <IconSettings className='text-muted-foreground h-5 w-5' />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Users, markets, investments, and operational tools.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
