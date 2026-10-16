'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CONSENT_SIGNED_EVENT,
  consentPagePath,
  shouldSkipConsentGate
} from '@/lib/consent';

export function ConsentGateProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [hasSignedConsent, setHasSignedConsent] = useState<boolean | null>(
    null
  );
  const [ready, setReady] = useState(false);

  const loadConsent = useCallback(async () => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || !session?.user?.id) {
      setHasSignedConsent(true);
      setReady(true);
      return;
    }

    try {
      const res = await fetch('/api/user/consent');
      if (!res.ok) {
        setHasSignedConsent(null);
        return;
      }
      const data = (await res.json()) as { hasSignedConsent: boolean };
      setHasSignedConsent(data.hasSignedConsent);
    } catch {
      setHasSignedConsent(null);
    } finally {
      setReady(true);
    }
  }, [session?.user?.id, status]);

  useEffect(() => {
    void loadConsent();
  }, [loadConsent, pathname]);

  useEffect(() => {
    const onSigned = () => {
      setHasSignedConsent(true);
      setReady(true);
    };
    window.addEventListener(CONSENT_SIGNED_EVENT, onSigned);
    return () => window.removeEventListener(CONSENT_SIGNED_EVENT, onSigned);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (status !== 'authenticated') return;
    if (hasSignedConsent !== false) return;
    if (shouldSkipConsentGate(pathname || '')) return;

    router.replace(consentPagePath);
  }, [ready, status, hasSignedConsent, pathname, router]);

  return children;
}
