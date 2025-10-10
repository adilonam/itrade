'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { IconPhotoUp } from '@tabler/icons-react';

interface AppBrandingProps {
  className?: string;
}

export function AppBranding({ className }: AppBrandingProps) {
  const [appName, setAppName] = useState('Trading Dashboard');
  const [appIcon, setAppIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const response = await fetch('/api/app-settings');
        if (response.ok) {
          const data = await response.json();
          setAppName(data.appName || 'Trading Dashboard');
          setAppIcon(data.appIcon);
        }
      } catch (error) {
        // Use defaults on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppSettings();
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className='bg-muted flex h-10 w-10 animate-pulse items-center justify-center rounded-lg'>
          <IconPhotoUp className='text-muted-foreground h-5 w-5' />
        </div>
        <div className='flex flex-col gap-1'>
          <div className='bg-muted h-4 w-24 animate-pulse rounded' />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className='bg-primary flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg'>
        {appIcon ? (
          <Image
            src={appIcon}
            alt={`${appName} logo`}
            width={40}
            height={40}
            className='h-full w-full object-cover'
          />
        ) : (
          <IconPhotoUp className='text-primary-foreground h-5 w-5' />
        )}
      </div>
      <div className='flex flex-col group-data-[collapsible=icon]:hidden'>
        <span className='text-sm font-semibold'>{appName}</span>
        <span className='text-muted-foreground text-xs'>Dashboard</span>
      </div>
    </div>
  );
}
