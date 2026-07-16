import Link from 'next/link';
import { AppLogo } from '@/components/brand/app-logo';

export function AuthSidebarBrandLink({ appName }: { appName: string }) {
  return (
    <Link
      href='/'
      className='inline-flex items-center gap-2'
      aria-label={`Go to home, ${appName}`}
    >
      <span className='relative flex h-10 shrink-0 items-center'>
        <AppLogo alt='' className='h-10 max-h-10' priority />
      </span>
    </Link>
  );
}
