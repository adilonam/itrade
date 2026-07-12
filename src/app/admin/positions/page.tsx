import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { PositionsView } from '@/components/admin/positions/positions-view';

export const metadata = {
  title: 'Admin: Client Positions'
};

export default async function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6 text-sm text-[var(--trade-text)]'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-lg font-bold tracking-tight text-[var(--trade-text)]'>
              Client Positions
            </h1>
            <p className='mt-1 max-w-2xl text-xs leading-relaxed text-[var(--trade-text-muted)]'>
              View and edit all client positions across users. Changes to P&amp;L
              or status may update the linked user balance.
            </p>
          </div>
        </div>
        <Separator />
        <PositionsView />
      </div>
    </PageContainer>
  );
}
