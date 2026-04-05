'use client';

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
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      toast.success('If an account exists with that email, you will receive a reset link.');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          {appName}
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
              <CardTitle>Forgot password</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className='space-y-4'>
                  <p className='text-muted-foreground text-sm'>
                    Check your inbox. If an account exists for {email}, you will
                    receive a link to reset your password.
                  </p>
                  <Button variant='outline' className='w-full' asChild>
                    <Link href='/auth/sign-in'>Back to Sign In</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='Enter your email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              )}
              {!sent && (
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
