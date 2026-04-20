'use client';

import { AuthSidebarBrandLink } from '@/components/auth/auth-sidebar-brand-link';
import { usePublicAppName } from '@/hooks/use-public-app-name';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function ResetPasswordView() {
  const appName = usePublicAppName();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [valid, setValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateToken = useCallback(async () => {
    if (!token) {
      setValid(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`
      );
      const data = await res.json();
      setValid(data.valid === true);
      setEmail(data.email ?? null);
    } catch {
      setValid(false);
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  useEffect(() => {
    if (valid === false) {
      router.replace('/auth/sign-in');
    }
  }, [valid, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password');
        return;
      }
      setSuccess(true);
      toast.success(
        'Password updated. You can sign in with your new password.'
      );
      setTimeout(() => router.replace('/auth/sign-in'), 2000);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (valid === null) {
    return (
      <div className='trade-room flex min-h-screen w-full items-center justify-center bg-[var(--trade-dark)] text-[var(--trade-text-muted)]'>
        <p className='text-sm'>Checking link...</p>
      </div>
    );
  }

  if (valid === false) {
    return null;
  }

  return (
    <div className='trade-room flex min-h-screen w-full bg-[var(--trade-dark)] text-[var(--trade-text)]'>
      <div className='hidden w-full max-w-xl flex-col border-r border-[var(--trade-border)] bg-[var(--trade-panel)] p-10 lg:flex'>
        <AuthSidebarBrandLink appName={appName} />
        <div className='mt-8 rounded-xl border border-[var(--trade-border)] bg-[var(--trade-dark)]/70 p-5'>
          <p className='text-sm text-[var(--trade-text-muted)]'>
            Choose a strong password you have not used elsewhere. You will be
            signed out of other sessions until you sign in again.
          </p>
        </div>
        <div className='mt-auto text-sm text-[var(--trade-text-muted)]'>
          Secure password update for your trader account.
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
                {success ? 'Password updated' : 'Reset password'}
              </CardTitle>
              <CardDescription className='text-[var(--trade-text-muted)]'>
                {success
                  ? 'You can sign in with your new password.'
                  : email
                    ? `Set a new password for ${email}`
                    : 'Enter your new password below'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <p className='text-sm text-[var(--trade-text-muted)]'>
                  Redirecting you to sign in...
                </p>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='newPassword'
                      className='text-[var(--trade-text-muted)]'
                    >
                      New password
                    </Label>
                    <Input
                      id='newPassword'
                      type='password'
                      placeholder='At least 8 characters'
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
                      required
                      minLength={8}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='confirmPassword'
                      className='text-[var(--trade-text-muted)]'
                    >
                      Confirm password
                    </Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      placeholder='Confirm your password'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
                      required
                      minLength={8}
                    />
                  </div>
                  <Button
                    type='submit'
                    className='w-full bg-[#45a29e] text-white hover:opacity-90'
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update password'}
                  </Button>
                </form>
              )}
              {!success && (
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
