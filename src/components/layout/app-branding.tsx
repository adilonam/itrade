'use client';

import { IconPhotoUp } from '@tabler/icons-react';
import { usePublicAppName } from '@/hooks/use-public-app-name';

interface AppBrandingProps {
  className?: string;
}

export function AppBranding({ className }: AppBrandingProps) {
  const appName = usePublicAppName();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className='flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg'>
        <IconPhotoUp className='text-primary-foreground h-5 w-5' />
      </div>
      <div className='flex flex-col group-data-[collapsible=icon]:hidden'>
        <span className='text-sm font-semibold'>{appName}</span>
        <span className='text-muted-foreground text-xs'>Dashboard</span>
      </div>
    </div>
  );
}
