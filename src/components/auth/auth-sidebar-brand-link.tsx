import Image from 'next/image';
import Link from 'next/link';
import { brandLogoSrc } from '@/constants/data';

export function AuthSidebarBrandLink({ appName }: { appName: string }) {
  return (
    <Link
      href='/'
      className='inline-flex items-center gap-2'
      aria-label={`Go to home, ${appName}`}
    >
      <span className='relative flex h-10 shrink-0 items-center'>
        <Image
          src={brandLogoSrc}
          alt=''
          width={200}
          height={48}
          className='h-10 max-h-10 w-auto'
          priority
        />
      </span>
    </Link>
  );
}
