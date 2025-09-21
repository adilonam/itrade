import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Admin: Users'
};

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Users'
            description='Manage user accounts and permissions.'
          />
        </div>
        <Separator />
        {/* Users View */}
      </div>
    </PageContainer>
  );
}
