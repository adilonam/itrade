'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import MfaVerification from './mfa-verification';

export function SignInForm({
  googleSignInEnabled = true
}: {
  googleSignInEnabled?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, initiate MFA flow
      const response = await fetch('/api/auth/mfa/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Invalid email or password');
        return;
      }

      if (data.success && data.token) {
        setMfaToken(data.token);
        setShowMfa(true);
        toast.success('Verification code sent to your email');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false
      });

      if (result?.error) {
        toast.error('Failed to sign in with Google');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleMfaVerification = async (code: string) => {
    try {
      const result = await signIn('mfa', {
        token: mfaToken,
        code,
        redirect: false
      });

      if (result?.error) {
        throw new Error('Invalid verification code');
      } else {
        toast.success('Signed in successfully');
        router.push('/');
      }
    } catch (error) {
      throw error; // Re-throw to let MfaVerification component handle it
    }
  };

  const handleBackToSignIn = () => {
    setShowMfa(false);
    setMfaToken('');
  };

  if (showMfa) {
    return (
      <MfaVerification
        email={email}
        onVerificationSubmit={handleMfaVerification}
        onBack={handleBackToSignIn}
      />
    );
  }

  return (
    <Card className='w-full max-w-md border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-sm'>
      <CardHeader>
        <CardTitle className='text-[var(--trade-text)]'>Sign In</CardTitle>
        <CardDescription className='text-[var(--trade-text-muted)]'>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {googleSignInEnabled ? (
          <div className='space-y-4'>
            <Button
              type='button'
              variant='outline'
              className='w-full border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40'
              onClick={handleGoogleSignIn}
            >
              <IconBrandGoogle className='mr-2 h-4 w-4' />
              Continue with Google
            </Button>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <Separator className='w-full bg-[var(--trade-border)]' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-[var(--trade-panel)] px-2 text-[var(--trade-text-muted)]'>
                  Or continue with
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className={googleSignInEnabled ? 'mt-4 space-y-4' : 'space-y-4'}
        >
          <div className='space-y-2'>
            <Label htmlFor='email' className='text-[var(--trade-text-muted)]'>
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
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label
                htmlFor='password'
                className='text-[var(--trade-text-muted)]'
              >
                Password
              </Label>
              <Link
                href='/auth/forgot-password'
                className='text-xs text-[var(--trade-text-muted)] underline underline-offset-4 hover:text-[var(--trade-accent-blue)]'
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id='password'
              type='password'
              placeholder='Enter your password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
              required
            />
          </div>
          <Button
            type='submit'
            className='w-full bg-[#45a29e] text-white hover:opacity-90'
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className='mt-4 text-center text-sm text-[var(--trade-text-muted)]'>
          Don&apos;t have an account?{' '}
          <Link
            href='/auth/sign-up'
            className='text-[var(--trade-accent-blue)] underline underline-offset-4'
          >
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
