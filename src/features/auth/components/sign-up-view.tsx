import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default function SignUpViewPage() {
  return (
    <div className='relative flex h-screen flex-col items-center justify-center bg-zinc-900 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/auth/sign-in'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden text-zinc-100 hover:bg-zinc-800 hover:text-white md:top-8 md:right-8'
        )}
      >
        Sign In
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'Trade Nova'}
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;Getting started with this trading platform was incredibly
              easy. The sign-up process is smooth and intuitive.&rdquo;
            </p>
            <footer className='text-sm'>New User</footer>
          </blockquote>
        </div>
      </div>
      <div className='dark flex h-full items-center justify-center bg-zinc-900 p-4 text-zinc-100 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <SignUpForm />

          <p className='px-8 text-center text-sm text-zinc-400'>
            By clicking continue, you agree to our{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
