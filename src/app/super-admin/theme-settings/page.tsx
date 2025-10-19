import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { GlobalThemeControls } from '@/components/super-admin/global-theme-controls';

export const metadata = {
  title: 'Super Admin: Global Theme Settings'
};

export default function SuperAdminThemeSettingsPage() {
  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center justify-between space-y-2'>
        <Heading
          title='Global Theme Settings'
          description='Configure the global theme settings that apply to all users.'
        />
      </div>
      <Separator />
      <GlobalThemeControls />
    </div>
  );
}
