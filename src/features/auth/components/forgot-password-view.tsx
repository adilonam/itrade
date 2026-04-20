'use client';

import { AuthSidebarBrandLink } from '@/components/auth/auth-sidebar-brand-link';
import { usePublicAppName } from '@/hooks/use-public-app-name';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordView() {
  const appName = usePublicAppName();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSent(false);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        return;
      }
      setSent(true);
      toast.success(
        'If an account exists with that email, you will receive a reset link.'
      );
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='trade-room flex min-h-screen w-full bg-[var(--trade-dark)] text-[var(--trade-text)]'>
      <div className='hidden w-full max-w-xl flex-col border-r border-[var(--trade-border)] bg-[var(--trade-panel)] p-10 lg:flex'>
        <AuthSidebarBrandLink appName={appName} />
        <div className='mt-8 rounded-xl border border-[var(--trade-border)] bg-[var(--trade-dark)]/70 p-5'>
          <p className='text-sm text-[var(--trade-text-muted)]'>
            Request a secure reset link to regain access. Links expire after a
            short window to protect your account.
          </p>
        </div>
        <div className='mt-auto text-sm text-[var(--trade-text-muted)]'>
          Password recovery with the same protections as sign-in.
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
          <Card className='w-full max-w-md border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-sm'>
            <CardHeader>
              <CardTitle className='text-[var(--trade-text)]'>
                {sent ? 'Check your email' : 'Forgot password'}
              </CardTitle>
              <CardDescription className='text-[var(--trade-text-muted)]'>
                {sent
                  ? 'We sent instructions if an account matches that address.'
                  : 'Enter your email and we will send you a link to reset your password.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className='space-y-4'>
                  <p className='text-sm text-[var(--trade-text-muted)]'>
                    If an account exists for{' '}
                    <span className='text-[var(--trade-text)]'>{email}</span>,
                    you will receive a link to reset your password shortly.
                  </p>
                  <Button
                    variant='outline'
                    className='w-full border-[var(--trade-border)] bg-transparent text-[var(--trade-text)] hover:bg-[var(--trade-dark)]/50'
                    asChild
                  >
                    <Link href='/auth/sign-in'>Back to sign in</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='email'
                      className='text-[var(--trade-text-muted)]'
                    >
                      Email
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='Enter your email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
                      required
                    />
                  </div>
                  <Button
                    type='submit'
                    className='w-full bg-[#45a29e] text-white hover:opacity-90'
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              )}
              {!sent && (
                <p className='mt-4 text-center text-sm text-[var(--trade-text-muted)]'>
                  <Link
                    href='/auth/sign-in'
                    className='text-[var(--trade-accent-blue)] underline underline-offset-4 hover:text-[var(--trade-text)]'
                  >
                    Back to sign in
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
          <p className='px-4 text-center text-xs text-[var(--trade-text-muted)]'>
            By continuing, you agree to our{' '}
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
