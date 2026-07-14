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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { IconBrandGoogle } from '@tabler/icons-react';

export function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/trade',
        redirect: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created successfully! Please sign in.');
        router.push('/auth/sign-in');
      } else {
        toast.error(data.error || 'An error occurred');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='w-full max-w-md border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-sm'>
      <CardHeader>
        <CardTitle className='text-[var(--trade-text)]'>Sign Up</CardTitle>
        <CardDescription className='text-[var(--trade-text-muted)]'>
          Create a new account to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type='button'
          variant='outline'
          className='mb-4 w-full border-[var(--trade-border)] bg-transparent text-[var(--trade-text)] hover:bg-[var(--trade-dark)]'
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <IconBrandGoogle className='mr-2 h-4 w-4' />
          Continue with Google
        </Button>
        <div className='mb-4 h-px bg-[var(--trade-border)]' />
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-[var(--trade-text-muted)]'>
              Name
            </Label>
            <Input
              id='name'
              type='text'
              placeholder='Enter your name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
              required
            />
          </div>
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
            <Label
              htmlFor='password'
              className='text-[var(--trade-text-muted)]'
            >
              Password
            </Label>
            <Input
              id='password'
              type='password'
              placeholder='Enter your password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
              required
              minLength={6}
            />
          </div>
          <div className='space-y-2'>
            <Label
              htmlFor='confirmPassword'
              className='text-[var(--trade-text-muted)]'
            >
              Confirm Password
            </Label>
            <Input
              id='confirmPassword'
              type='password'
              placeholder='Confirm your password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
              required
              minLength={6}
            />
          </div>
          <Button
            type='submit'
            className='w-full bg-[#45a29e] text-white hover:opacity-90'
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>
        <div className='mt-4 text-center text-sm text-[var(--trade-text-muted)]'>
          Already have an account?{' '}
          <Link
            href='/auth/sign-in'
            className='text-[var(--trade-accent-blue)] underline underline-offset-4'
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
