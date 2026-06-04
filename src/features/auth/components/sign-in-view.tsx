import { AuthSidebarBrandLink } from '@/components/auth/auth-sidebar-brand-link';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default async function SignInViewPage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'Trade Nova';

  return (
    <div className='trade-room flex min-h-screen w-full bg-[var(--trade-dark)] text-[var(--trade-text)]'>
      <div className='hidden w-full max-w-xl flex-col border-r border-[var(--trade-border)] bg-[var(--trade-panel)] p-10 lg:flex'>
        <AuthSidebarBrandLink appName={appName} />
        <div className='mt-8 rounded-xl border border-[var(--trade-border)] bg-[var(--trade-dark)]/70 p-5'>
          <p className='text-sm text-[var(--trade-text-muted)]'>
            Sign in to monitor positions, manage wallet activity, and securely
            access your trader dashboard.
          </p>
        </div>
        <div className='mt-auto text-sm text-[var(--trade-text-muted)]'>
          Secure authentication with MFA verification.
        </div>
      </div>
      <div className='flex flex-1 items-center justify-center p-4 lg:p-10'>
        <div className='w-full max-w-md space-y-5'>
          <div className='flex items-center text-sm'>
            <Link
              href='/'
              className='text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]'
            >
              Back to home
            </Link>
          </div>
          <SignInForm />
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
