'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconCheck, IconLoader2, IconShieldCheck } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { landingPageLinks } from '@/constants/data';
import {
  SignaturePad,
  type SignaturePadHandle
} from '@/components/consent/signature-pad';
import { markConsentSignedEvent } from '@/lib/consent';

const CONSENT_POINTS = [
  'Trading involves a high level of risk and may result in the loss of some or all of your capital. You are solely responsible for any losses arising from your trading activity.',
  'You alone are responsible for how you use this application, including the decisions you make to open, manage, or close positions.',
  'Past performance is not a guarantee of future results. Market prices can move rapidly and leverage can magnify both gains and losses.',
  'You confirm that you understand trading is risky, that you are trading with funds you can afford to lose, and that you accept full responsibility for your trading outcomes.'
] as const;

export function ConsentPage() {
  const router = useRouter();
  const signatureRef = useRef<SignaturePadHandle | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [signedName, setSignedName] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/user/consent');
      if (!res.ok) {
        toast.error('Could not load consent status');
        return;
      }
      const data = (await res.json()) as {
        hasSignedConsent: boolean;
        consentSignedAt: string | null;
        consentSignatureName: string | null;
      };
      setAlreadySigned(data.hasSignedConsent);
      setSignedAt(data.consentSignedAt);
      setSignedName(data.consentSignatureName);
    } catch {
      toast.error('Could not load consent status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const submit = async () => {
    const name = fullName.trim();
    if (name.length < 2) {
      toast.error('Enter your full legal name');
      return;
    }
    if (!acknowledged) {
      toast.error('Confirm that you understand and accept the risks');
      return;
    }
    const signatureDataUrl = signatureRef.current?.toDataURL();
    if (!signatureDataUrl || signatureEmpty) {
      toast.error('Please draw your digital signature');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureName: name,
          signatureDataUrl
        })
      });
      const data = (await res.json()) as {
        error?: string;
        hasSignedConsent?: boolean;
        consentSignedAt?: string | null;
        consentSignatureName?: string | null;
      };
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save consent');
        return;
      }

      markConsentSignedEvent();
      setAlreadySigned(true);
      setSignedAt(data.consentSignedAt ?? new Date().toISOString());
      setSignedName(data.consentSignatureName ?? name);
      toast.success('Trading consent signed successfully');
      router.push(landingPageLinks.trade);
    } catch {
      toast.error('Failed to save consent');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <IconLoader2 className='size-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className='mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-8'>
        <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6'>
          <div className='mb-4 flex items-center gap-2 text-emerald-600'>
            <IconCheck className='size-5' />
            <h1 className='text-lg font-semibold text-[var(--trade-text)]'>
              Trading consent signed
            </h1>
          </div>
          <p className='text-sm text-[var(--trade-text-muted)]'>
            You have already signed the trading risk consent
            {signedName ? (
              <>
                {' '}
                as <span className='font-medium text-[var(--trade-text)]'>{signedName}</span>
              </>
            ) : null}
            {signedAt ? (
              <>
                {' '}
                on {new Date(signedAt).toLocaleString()}.
              </>
            ) : (
              '.'
            )}
          </p>
          <div className='mt-6'>
            <Button asChild>
              <Link href={landingPageLinks.trade}>Continue to trade</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-8'>
      <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6'>
        <div className='mb-2 flex items-center gap-2'>
          <IconShieldCheck className='size-5 text-[var(--trade-text)]' />
          <h1 className='text-lg font-semibold text-[var(--trade-text)]'>
            Trading risk consent
          </h1>
        </div>
        <p className='text-sm text-[var(--trade-text-muted)]'>
          Before you continue using this trading platform, you must read and
          digitally sign this consent. Trading is risky and you are responsible
          for your losses and for how you use this app.
        </p>

        <ul className='mt-5 space-y-3 text-sm text-[var(--trade-text)]'>
          {CONSENT_POINTS.map((point) => (
            <li
              key={point}
              className='rounded-md border border-[var(--trade-border)]/70 bg-background/40 px-3 py-2.5 leading-relaxed'
            >
              {point}
            </li>
          ))}
        </ul>

        <div className='mt-6 space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='consent-full-name'>Full legal name</Label>
            <Input
              id='consent-full-name'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder='Type your full name'
              autoComplete='name'
            />
          </div>

          <div className='space-y-2'>
            <Label>Digital signature</Label>
            <SignaturePad
              handleRef={signatureRef}
              onChange={setSignatureEmpty}
            />
          </div>

          <label className='flex items-start gap-3 text-sm text-[var(--trade-text)]'>
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(value) => setAcknowledged(value === true)}
              className='mt-0.5'
            />
            <span>
              I have read and understand this consent. I accept that trading is
              risky, that I am responsible for any losses, and that I am
              responsible for my use of this application.
            </span>
          </label>

          <Button
            type='button'
            className='w-full sm:w-auto'
            disabled={submitting || signatureEmpty || !acknowledged || fullName.trim().length < 2}
            onClick={() => void submit()}
          >
            {submitting ? (
              <>
                <IconLoader2 className='size-4 animate-spin' />
                Signing…
              </>
            ) : (
              'Sign consent digitally'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
