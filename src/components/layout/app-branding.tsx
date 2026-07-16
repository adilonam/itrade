'use client';

import Link from 'next/link';
import { AppLogo } from '@/components/brand/app-logo';
import { usePublicAppName } from '@/hooks/use-public-app-name';

interface AppBrandingProps {
  className?: string;
}

export function AppBranding({ className }: AppBrandingProps) {
  const appName = usePublicAppName();

  return (
    <Link
      href='/trade'
      className={`flex items-center gap-3 ${className ?? ''}`}
      aria-label={appName}
    >
      <AppLogo alt={`${appName} logo`} className='h-10 max-h-10' priority />
    </Link>
  );
}
