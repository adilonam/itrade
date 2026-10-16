'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { CountryCode } from 'libphonenumber-js';
import { CountryCallingCodePicker } from '@/components/phone/country-calling-code-picker';
import { landingPageLinks, landingSiteLinks } from '@/constants/data';
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneE164
} from '@/lib/country-calling-codes';

export function SmxHeroRegisterForm() {
  const t = useTranslations('SmxLanding.registerForm');
  const locale = useLocale();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneCountry, setPhoneCountry] =
    useState<CountryCode>(DEFAULT_PHONE_COUNTRY);
  const [phoneNational, setPhoneNational] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      toast.error(t('passwordMismatch'));
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      toast.error(t('passwordTooShort'));
      setIsSubmitting(false);
      return;
    }

    const phone = formatPhoneE164(phoneCountry, phoneNational);
    if (!phone) {
      toast.error(t('phoneInvalid'));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          password,
          phone
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(t('success'));
        router.push(landingPageLinks.signIn);
        return;
      }

      toast.error(
        typeof data.error === 'string' ? data.error : t('errorGeneric')
      );
    } catch {
      toast.error(t('errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id='register'
      className='smx-glass-panel relative rounded-2xl border-t-2 border-t-[#D8A84E] p-6 shadow-2xl sm:p-8'
    >
      <div className='mb-6 text-center'>
        <h3 className='mb-2 text-2xl font-bold text-white'>{t('title')}</h3>
        <p className='text-xs text-gray-400 sm:text-sm'>{t('subtitle')}</p>
      </div>

      <form className='space-y-4' onSubmit={handleSubmit}>
        <div>
          <label
            className='mb-1.5 block text-start text-xs font-medium text-gray-300'
            htmlFor='smx-full-name'
          >
            {t('fullName')}
          </label>
          <input
            id='smx-full-name'
            className='smx-glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:ring-0'
            placeholder={t('fullNamePlaceholder')}
            type='text'
            name='name'
            autoComplete='name'
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label
            className='mb-1.5 block text-start text-xs font-medium text-gray-300'
            htmlFor='smx-email'
          >
            {t('email')}
          </label>
          <input
            id='smx-email'
            className='smx-glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:ring-0'
            placeholder='name@example.com'
            type='email'
            name='email'
            autoComplete='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label
            className='mb-1.5 block text-start text-xs font-medium text-gray-300'
            htmlFor='smx-phone'
          >
            {t('phone')}
          </label>
          <div className='flex items-center gap-2' dir='ltr'>
            <CountryCallingCodePicker
              id='smx-phone-country'
              value={phoneCountry}
              onChange={setPhoneCountry}
              locale={locale}
              variant='smx'
              disabled={isSubmitting}
              searchPlaceholder={t('searchCountry')}
              emptyLabel={t('noCountry')}
            />
            <input
              id='smx-phone'
              className='smx-glass-input w-full rounded-xl px-4 py-3 text-start text-sm text-white placeholder-gray-500 focus:ring-0'
              placeholder={t('phonePlaceholder')}
              type='tel'
              inputMode='tel'
              name='phone'
              autoComplete='tel-national'
              required
              value={phoneNational}
              onChange={(e) => setPhoneNational(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label
            className='mb-1.5 block text-start text-xs font-medium text-gray-300'
            htmlFor='smx-password'
          >
            {t('password')}
          </label>
          <input
            id='smx-password'
            className='smx-glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:ring-0'
            placeholder={t('passwordPlaceholder')}
            type='password'
            name='password'
            autoComplete='new-password'
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label
            className='mb-1.5 block text-start text-xs font-medium text-gray-300'
            htmlFor='smx-confirm-password'
          >
            {t('confirmPassword')}
          </label>
          <input
            id='smx-confirm-password'
            className='smx-glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:ring-0'
            placeholder={t('confirmPasswordPlaceholder')}
            type='password'
            name='confirmPassword'
            autoComplete='new-password'
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          className='smx-gold-gradient-bg mt-2 w-full rounded-xl px-6 py-3.5 text-base font-extrabold text-black shadow-lg shadow-[#D8A84E]/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-70'
          type='submit'
          disabled={isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>

        <p className='pt-1 text-center text-[11px] leading-relaxed text-gray-400'>
          {t('privacyPrefix')}{' '}
          <Link
            className='text-[#D8A84E] underline underline-offset-2'
            href={landingSiteLinks.legal}
          >
            {t('privacyLink')}
          </Link>{' '}
          {t('privacySuffix')}
        </p>
      </form>

      <p className='mt-4 text-center text-[11px] text-gray-500'>
        {t('haveAccount')}{' '}
        <Link
          href={landingPageLinks.signIn}
          className='text-[#D8A84E] hover:underline'
        >
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
