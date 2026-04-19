'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconLoader2, IconShield, IconUpload } from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { KycStatus } from '@/lib/prisma/generated/client';

const DOC_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID card' },
  { value: 'drivers_license', label: "Driver's license" }
] as const;

type KycRequestHistoryItem = {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';
  documentType: string;
  createdAt: string;
  reviewedAt: string | null;
};

export function UserManagementKycPage() {
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [kycDocType, setKycDocType] = useState('');
  const [kycFront, setKycFront] = useState<File | null>(null);
  const [kycBack, setKycBack] = useState<File | null>(null);
  const [kycSelfie, setKycSelfie] = useState<File | null>(null);
  const [kycBill, setKycBill] = useState<File | null>(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycRequests, setKycRequests] = useState<KycRequestHistoryItem[]>([]);

  const loadKycMeta = useCallback(async () => {
    try {
      const res = await fetch('/api/user/kyc');
      if (!res.ok) {
        toast.error('Could not load KYC status');
        return;
      }
      const data = (await res.json()) as {
        kycStatus: KycStatus;
        requests?: KycRequestHistoryItem[];
      };
      setKycStatus(data.kycStatus);
      setKycRequests(data.requests ?? []);
    } catch {
      toast.error('Could not load KYC status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKycMeta();
  }, [loadKycMeta]);

  const submitKyc = async () => {
    if (!kycDocType) {
      toast.error('Select a document type');
      return;
    }
    if (!kycFront || !kycBack || !kycSelfie || !kycBill) {
      toast.error('Upload all required images');
      return;
    }
    try {
      setKycSubmitting(true);
      const fd = new FormData();
      fd.set('documentType', kycDocType);
      fd.set('front', kycFront);
      fd.set('back', kycBack);
      fd.set('selfie', kycSelfie);
      fd.set('utilityBill', kycBill);
      const res = await fetch('/api/user/kyc', { method: 'POST', body: fd });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Submit failed');
        return;
      }
      toast.success('Documents submitted for review');
      setKycFront(null);
      setKycBack(null);
      setKycSelfie(null);
      setKycBill(null);
      void loadKycMeta();
    } catch {
      toast.error('Submit failed');
    } finally {
      setKycSubmitting(false);
    }
  };

  const kycBanner = useMemo(() => {
    const s = kycStatus;
    if (!s || s === 'NOT_SUBMITTED') {
      return {
        tone: 'muted' as const,
        text: 'You have not submitted documents yet. Your account is unverified until KYC is completed.'
      };
    }
    if (s === 'PENDING') {
      return {
        tone: 'pending' as const,
        text: 'Your documents are under review. We will notify you when verification is complete.'
      };
    }
    if (s === 'APPROVED') {
      return {
        tone: 'ok' as const,
        text: 'Your identity has been verified.'
      };
    }
    return {
      tone: 'bad' as const,
      text: 'Your submission was rejected. You may upload new documents.'
    };
  }, [kycStatus]);

  const kycLocked =
    kycStatus === 'PENDING' || kycStatus === 'APPROVED';

  const kycStatusLabel = (value: KycRequestHistoryItem['status']) => {
    switch (value) {
      case 'IN_PROGRESS':
        return 'In progress';
      case 'VERIFIED':
        return 'Verified';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const kycDocTypeLabel = (value: string) => {
    switch (value) {
      case 'passport':
        return 'Passport';
      case 'national_id':
        return 'National ID';
      case 'drivers_license':
        return "Driver's license";
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-12 text-[var(--trade-text-muted)]">
        <IconLoader2 className="size-6 animate-spin" />
        Loading KYC…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6 py-4">
        <h1 className="text-base font-semibold text-[var(--trade-text)]">
          KYC verification
        </h1>
        <p className="mt-1 text-sm text-[var(--trade-text-muted)]">
          Submit identity documents for account verification.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="mx-auto w-full max-w-3xl space-y-4">
          <div
            className={cn(
              'flex gap-3 rounded-lg border px-4 py-3 text-sm',
              kycBanner.tone === 'ok' &&
                'border-[var(--trade-green)]/40 bg-[var(--trade-green)]/10 text-[var(--trade-text)]',
              kycBanner.tone === 'pending' &&
                'border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)]',
              kycBanner.tone === 'muted' &&
                'border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text-muted)]',
              kycBanner.tone === 'bad' &&
                'border-[var(--trade-red)]/40 bg-[var(--trade-red)]/10 text-[var(--trade-text)]'
            )}
          >
            <IconShield
              className="mt-0.5 size-5 shrink-0 text-[var(--trade-accent-blue)]"
              stroke={1.75}
            />
            <p>{kycBanner.text}</p>
          </div>

          {kycRequests.length > 0 ? (
            <div className="rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                Previous KYC requests
              </p>
              <ul className="mt-2 space-y-1.5">
                {kycRequests.slice(0, 5).map((request) => (
                  <li
                    key={request.id}
                    className="text-xs text-[var(--trade-text-muted)]"
                  >
                    <span className="text-[var(--trade-text)]">
                      {kycDocTypeLabel(request.documentType)}
                    </span>{' '}
                    - {kycStatusLabel(request.status)} -{' '}
                    {new Date(request.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <section className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--trade-text)]">
              Documents
            </h2>
            <div className="mt-4">
              <label
                htmlFor="doctype"
                className="text-xs font-medium text-[var(--trade-text-muted)]"
              >
                Document type
              </label>
              <select
                id="doctype"
                disabled={kycLocked}
                value={kycDocType}
                onChange={(e) => setKycDocType(e.target.value)}
                className="mt-1.5 w-full max-w-md rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none disabled:opacity-50"
              >
                <option value="">Select document type</option>
                {DOC_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
              Attach images
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <KycDrop
                label="Front side"
                disabled={kycLocked}
                file={kycFront}
                onFile={setKycFront}
              />
              <KycDrop
                label="Back side"
                disabled={kycLocked}
                file={kycBack}
                onFile={setKycBack}
              />
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
              Attach selfie
            </p>
            <div className="mt-3">
              <KycDrop
                label="Selfie"
                disabled={kycLocked}
                file={kycSelfie}
                onFile={setKycSelfie}
              />
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
              Proof of address (utility bill)
            </p>
            <div className="mt-3">
              <KycDrop
                label="Utility bill"
                disabled={kycLocked}
                file={kycBill}
                onFile={setKycBill}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={kycLocked || kycSubmitting}
                onClick={() => void submitKyc()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#45a29e] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {kycSubmitting ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : null}
                Submit for review
              </button>
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
}

function KycDrop({
  label,
  file,
  onFile,
  disabled
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}) {
  const id = `kyc-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div>
      <p className="text-xs font-medium text-[var(--trade-text-muted)]">
        {label}
      </p>
      <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-8 text-center">
        <IconUpload
          className="mx-auto size-8 text-[#45a29e]"
          stroke={1.25}
        />
        <p className="mt-2 text-xs text-[var(--trade-text-muted)]">
          Drag and drop a file here or upload
        </p>
        {file ? (
          <p className="mt-2 truncate text-xs font-medium text-[var(--trade-text)]">
            {file.name}
          </p>
        ) : null}
        <input
          id={id}
          type="file"
          accept="image/*,.pdf"
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0] ?? null);
            e.currentTarget.blur();
          }}
        />
        <label
          htmlFor={id}
          className={cn(
            'mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#45a29e] px-4 py-2 text-xs font-semibold text-white hover:opacity-90',
            disabled && 'pointer-events-none opacity-40'
          )}
        >
          <IconUpload className="size-3.5" />
          Upload
        </label>
      </div>
    </div>
  );
}
