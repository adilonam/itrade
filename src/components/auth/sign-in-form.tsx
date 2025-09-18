'use client';

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
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import MfaVerification from './mfa-verification';

export function SignInForm() {
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
        router.push('/dashboard/markets');
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
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              placeholder='Enter your password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className='mt-4 text-center text-sm'>
          Don&apos;t have an account?{' '}
          <Link
            href='/auth/sign-up'
            className='hover:text-primary underline underline-offset-4'
          >
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
