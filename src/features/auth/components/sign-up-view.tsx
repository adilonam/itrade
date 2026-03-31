import { SignUpForm } from '@/components/auth/sign-up-form';
import { Metadata } from 'next';
import Link from 'next/link';
import { IconBolt } from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default function SignUpViewPage() {
  return (
    <div className='trade-room flex min-h-screen w-full bg-[var(--trade-dark)] text-[var(--trade-text)]'>
      <div className='hidden w-full max-w-xl flex-col border-r border-[var(--trade-border)] bg-[var(--trade-panel)] p-10 lg:flex'>
        <Link href='/' className='inline-flex items-center gap-2'>
          <span className='flex size-9 items-center justify-center rounded-md bg-[var(--trade-accent-blue)] text-white'>
            <IconBolt className='size-5' stroke={2} />
          </span>
          <span className='text-base font-bold tracking-tight'>
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'PaySnap'}
          </span>
        </Link>
        <div className='mt-8 rounded-xl border border-[var(--trade-border)] bg-[var(--trade-dark)]/70 p-5'>
          <p className='text-sm text-[var(--trade-text-muted)]'>
            Open your account to start depositing funds, managing transfers, and
            tracking activity from one secure trader workspace.
          </p>
        </div>
        <div className='mt-auto text-sm text-[var(--trade-text-muted)]'>
          Fast onboarding with protected account setup.
        </div>
      </div>
      <div className='flex flex-1 items-center justify-center p-4 lg:p-10'>
        <div className='w-full max-w-md space-y-5'>
          <div className='flex items-center justify-between text-sm'>
            <Link
              href='/'
              className='text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]'
            >
              Back to home
            </Link>
            <Link
              href='/auth/sign-in'
              className='text-[var(--trade-accent-blue)] hover:underline'
            >
              Sign in
            </Link>
          </div>
          <SignUpForm />
          <p className='px-4 text-center text-xs text-[var(--trade-text-muted)]'>
            By clicking continue, you agree to our{' '}
            <Link
              href='/terms'
              className='text-[var(--trade-accent-blue)] hover:underline'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy'
              className='text-[var(--trade-accent-blue)] hover:underline'
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
