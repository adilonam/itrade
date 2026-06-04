import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { AppSettingsForm } from '@/components/super-admin/app-settings-form';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'App settings'
};

export default async function AppSettingsPage() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 'default' }
  });

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div>
          <h2 className='text-xl font-bold tracking-tight text-[var(--trade-text)]'>
            App settings
          </h2>
          <p className='mt-1 text-sm text-[var(--trade-text-muted)]'>
            Database-stored operational values. Public fields are available via
            GET /api/app-settings with an optional label query.
          </p>
        </div>
        <Separator className='bg-[var(--trade-border)]' />
        <div className='max-w-3xl pb-8'>
          <AppSettingsForm initialSettings={settings} />
        </div>
      </div>
    </PageContainer>
  );
}
