import { Breadcrumbs } from '@/components/breadcrumbs';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { AppSettingsForm } from '@/components/super-admin/app-settings-form';
import { prisma } from '@/lib/prisma';

export default async function AppSettingsPage() {
  // Fetch current app settings
  const settings = await prisma.appSettings.findUnique({
    where: { id: 'default' }
  });

  return (
    <div className='flex h-full w-full flex-col overflow-y-auto'>
      <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
        <div className='space-y-4'>
          <Breadcrumbs />
          <div className='flex items-center justify-between'>
            <Heading
              title='App Settings'
              description='Configure application branding and global settings'
            />
          </div>
          <Separator />
        </div>

        <div className='max-w-2xl pb-8'>
          <AppSettingsForm
            initialIcon={settings?.appIcon}
            initialName={settings?.appName}
          />
        </div>
      </div>
    </div>
  );
}
