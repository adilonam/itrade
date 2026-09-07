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
import { CountryCallingCodePicker } from '@/components/phone/country-calling-code-picker';
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneE164,
  parsePrefillPhone
} from '@/lib/country-calling-codes';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { IconBrandGoogle } from '@tabler/icons-react';
import type { CountryCode } from 'libphonenumber-js';

export function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneCountry, setPhoneCountry] =
    useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [phoneNational, setPhoneNational] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const prefillName = searchParams.get('name');
    const prefillEmail = searchParams.get('email');
    const prefillPhone = parsePrefillPhone(searchParams.get('phone'));
    if (prefillName) setName(prefillName);
    if (prefillEmail) setEmail(prefillEmail);
    if (prefillPhone) {
      setPhoneCountry(prefillPhone.country);
      setPhoneNational(prefillPhone.nationalNumber);
    }
  }, [searchParams]);

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

    const phone = formatPhoneE164(phoneCountry, phoneNational);
    if (!phone) {
      toast.error('Please enter a valid phone number');
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
          password,
          phone
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created successfully! Please sign in.');
        router.push('/auth/sign-in');
      } else {
        toast.error(data.error || 'An error occurred');
      }
    } catch {
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
            <Label htmlFor='phone' className='text-[var(--trade-text-muted)]'>
              Phone
            </Label>
            <div className='flex items-center gap-2' dir='ltr'>
              <CountryCallingCodePicker
                value={phoneCountry}
                onChange={setPhoneCountry}
                disabled={isLoading}
                searchPlaceholder='Search country…'
                emptyLabel='No country found'
              />
              <Input
                id='phone'
                type='tel'
                inputMode='tel'
                autoComplete='tel-national'
                placeholder='50 123 4567'
                value={phoneNational}
                onChange={(e) => setPhoneNational(e.target.value)}
                className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
                required
              />
            </div>
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
