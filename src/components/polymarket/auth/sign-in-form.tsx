'use client';

import { Lock, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import NextLink from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/polymarket/ui/button';
import { Link, useRouter } from '@/lib/polymarket/routing';

import { AuthCard } from './auth-card';
import { AuthDivider } from './auth-divider';
import { AuthGoogleButton } from './auth-google-button';
import { AuthInputField } from './auth-input-field';

/**
 * Polymarket sign-in uses itrade's MFA login API + next-auth `mfa` provider.
 */
export function SignInForm() {
  const t = useTranslations('Auth.signIn');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!mfaToken) {
        const response = await fetch('/api/auth/mfa/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || t('invalidCredentials'));
          return;
        }
        setMfaToken(data.token);
        return;
      }

      const result = await signIn('mfa', {
        token: mfaToken,
        code: mfaCode,
        redirect: false
      });

      if (result?.error) {
        setError(t('invalidCredentials'));
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard mode='sign-in'>
      <div className='mb-6 space-y-1'>
        <h2 className='font-headline text-headline-lg text-on-surface dark:text-inverse-on-surface'>
          {t('title')}
        </h2>
        <p className='text-secondary dark:text-secondary-fixed-dim text-sm'>
          {t('subtitle')}
        </p>
      </div>

      <AuthGoogleButton />
      <AuthDivider label={t('or')} />

      <form onSubmit={handleSubmit} className='space-y-4'>
        {error ? (
          <p
            className='border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm'
            role='alert'
          >
            {error}
          </p>
        ) : null}

        {!mfaToken ? (
          <>
            <AuthInputField
              id='email'
              name='email'
              type='email'
              label={t('email')}
              placeholder='you@example.com'
              icon={Mail}
              value={email}
              onChange={setEmail}
              required
              autoComplete='email'
            />

            <AuthInputField
              id='password'
              name='password'
              type='password'
              label={t('password')}
              placeholder='••••••••'
              icon={Lock}
              value={password}
              onChange={setPassword}
              required
              autoComplete='current-password'
            />

            <div className='flex items-center justify-between gap-4 pt-1'>
              <label className='text-on-surface-variant dark:text-secondary-fixed-dim flex cursor-pointer items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className='border-outline-variant text-primary-container size-4 rounded border accent-[var(--color-primary-container)]'
                />
                {t('rememberMe')}
              </label>
              <NextLink
                href='/auth/forgot-password'
                className='text-primary-container dark:text-primary-fixed-dim text-sm font-medium hover:underline'
              >
                {t('forgotPassword')}
              </NextLink>
            </div>
          </>
        ) : (
          <AuthInputField
            id='mfa'
            name='mfa'
            type='text'
            label='Verification code'
            placeholder='6-digit code'
            icon={Lock}
            value={mfaCode}
            onChange={setMfaCode}
            required
            autoComplete='one-time-code'
          />
        )}

        <Button
          type='submit'
          className='bg-primary-container hover:bg-primary mt-2 h-11 w-full rounded-xl text-sm font-semibold text-white'
          disabled={isLoading}
        >
          {isLoading ? t('submitting') : t('submit')}
        </Button>
      </form>

      <p className='text-on-surface-variant dark:text-secondary-fixed-dim mt-6 text-center text-sm'>
        {t('newAccount')}{' '}
        <Link
          href='/sign-up'
          className='text-primary-container dark:text-primary-fixed-dim font-medium hover:underline'
        >
          {t('createAccount')}
        </Link>
      </p>
    </AuthCard>
  );
}
