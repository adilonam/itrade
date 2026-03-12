'use client';

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
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ResetPasswordView() {
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
      toast.success('Password updated. You can sign in with your new password.');
      setTimeout(() => router.replace('/auth/sign-in'), 2000);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (valid === null) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-900'>
        <div className='text-zinc-400'>Checking link...</div>
      </div>
    );
  }

  if (valid === false) {
    return null;
  }

  return (
    <div className='relative flex h-screen flex-col items-center justify-center bg-zinc-900 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/auth/sign-in'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 left-4 text-zinc-100 hover:bg-zinc-800 hover:text-white md:top-8 md:left-8'
        )}
      >
        Back to Sign In
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
              &ldquo;This trading platform has revolutionized how I manage my
              investments and analyze market trends.&rdquo;
            </p>
            <footer className='text-sm'>Satisfied Trader</footer>
          </blockquote>
        </div>
      </div>
      <div className='dark flex h-full items-center justify-center bg-zinc-900 p-4 text-zinc-100 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <Card className='w-full max-w-md'>
            <CardHeader>
              <CardTitle>Reset password</CardTitle>
              <CardDescription>
                {email
                  ? `Set a new password for ${email}`
                  : 'Enter your new password below'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <p className='text-muted-foreground text-sm'>
                  Redirecting you to sign in...
                </p>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='newPassword'>New password</Label>
                    <Input
                      id='newPassword'
                      type='password'
                      placeholder='At least 8 characters'
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword'>Confirm password</Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      placeholder='Confirm your password'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update password'}
                  </Button>
                </form>
              )}
              {!success && (
                <p className='mt-4 text-center text-sm text-muted-foreground'>
                  <Link
                    href='/auth/sign-in'
                    className='hover:text-primary underline underline-offset-4'
                  >
                    Back to sign in
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
