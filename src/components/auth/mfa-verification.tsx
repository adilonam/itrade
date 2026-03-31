'use client';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield } from 'lucide-react';
import { IconAlertCircle } from '@tabler/icons-react';

interface MfaVerificationProps {
  email: string;
  onVerificationSubmit: (code: string) => void;
  onBack: () => void;
}

export default function MfaVerification({
  email,
  onVerificationSubmit,
  onBack
}: MfaVerificationProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');
    try {
      await onVerificationSubmit(code);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-md border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-sm'>
      <CardHeader className='space-y-1'>
        <div className='mb-4 flex items-center justify-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[var(--trade-accent-blue)]/15'>
            <Shield className='h-6 w-6 text-[var(--trade-accent-blue)]' />
          </div>
        </div>
        <CardTitle className='text-center text-2xl text-[var(--trade-text)]'>
          Two-Factor Authentication
        </CardTitle>
        <CardDescription className='text-center text-[var(--trade-text-muted)]'>
          We&apos;ve sent a verification code to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-center rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] p-3'>
          <Mail className='mr-2 h-4 w-4 text-[var(--trade-accent-blue)]' />
          <span className='text-sm text-[var(--trade-text)]'>{email}</span>
        </div>

        {error && (
          <Alert variant='destructive'>
            <IconAlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerifyCode} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='mfa-code' className='text-[var(--trade-text-muted)]'>
              Verification Code
            </Label>
            <Input
              id='mfa-code'
              type='text'
              placeholder='Enter 6-digit code'
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-center text-lg tracking-widest text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:ring-[var(--trade-accent-blue)]'
              maxLength={6}
              autoComplete='one-time-code'
              disabled={isVerifying}
            />
          </div>

          <Button
            type='submit'
            className='w-full bg-[#45a29e] text-white hover:opacity-90'
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>
        </form>

        <div className='text-center'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]'
            onClick={onBack}
          >
            Back to Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
