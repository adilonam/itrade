import Image from 'next/image';
import Link from 'next/link';

export function AuthSidebarBrandLink({ appName }: { appName: string }) {
  return (
    <Link
      href='/'
      className='inline-flex items-center gap-2'
      aria-label={`Go to home, ${appName}`}
    >
      <span className='relative flex h-10 shrink-0 items-center'>
        <Image
          src='/images/logo-light.png'
          alt=''
          width={200}
          height={48}
          className='h-10 w-auto max-h-10 dark:hidden'
          priority
        />
        <Image
          src='/images/logo-dark.png'
          alt=''
          width={200}
          height={48}
          className='hidden h-10 w-auto max-h-10 dark:block'
          priority
        />
      </span>
    </Link>
  );
}
