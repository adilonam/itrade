import Image from 'next/image';
import Link from 'next/link';
import { brandLogoSrc, landingPageLinks, pricePredictionLinks } from '@/constants/data';
import { cn } from '@/lib/utils';

type PricePredictionShellProps = {
  children: React.ReactNode;
  appName: string;
  session?: boolean;
  className?: string;
};

export function PricePredictionShell({
  children,
  appName,
  session = false,
  className
}: PricePredictionShellProps) {
  return (
    <div className={cn('dark theme-match-trader h-dvh overflow-y-auto bg-trade-dark text-trade-text', className)}>
      <header className='sticky top-0 z-50 border-b border-trade-border bg-trade-dark/95 backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6'>
          <div className='flex min-w-0 items-center gap-6'>
            <Link href='/' className='inline-flex shrink-0 items-center' aria-label={appName}>
              <Image
                src={brandLogoSrc}
                alt={`${appName} logo`}
                width={120}
                height={32}
                className='h-8 w-auto'
                priority
              />
            </Link>
            <nav className='hidden items-center gap-4 sm:flex'>
              <Link
                href={pricePredictionLinks.listing}
                className='text-sm font-medium text-trade-text transition hover:text-white'
              >
                Markets
              </Link>
            </nav>
          </div>
          <div className='flex items-center gap-3'>
            {session ? (
              <Link
                href={landingPageLinks.trade}
                className='rounded-md bg-trade-accent-blue px-4 py-1.5 text-sm font-medium text-white transition hover:bg-trade-accent-blue/90'
              >
                Trade
              </Link>
            ) : (
              <>
                <Link
                  href={landingPageLinks.signIn}
                  className='text-sm font-medium text-trade-text-muted transition hover:text-trade-text'
                >
                  Log in
                </Link>
                <Link
                  href={landingPageLinks.signUp}
                  className='rounded-md bg-trade-accent-blue px-4 py-1.5 text-sm font-medium text-white transition hover:bg-trade-accent-blue/90'
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6'>{children}</main>
    </div>
  );
}
