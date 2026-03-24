'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconUserSearch
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FinancialSnapshot } from '@/components/dashboard/dashboard-overview-trade-analytics';
import type { BalanceType } from '@/lib/prisma/generated/client';

const STEPS = ['Wallet & amount', 'Recipient', 'Review'] as const;

const REAL_BALANCE_TYPE = 'REAL' satisfies BalanceType;
const REAL_WALLET_LABEL = 'Real';

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

type StepIndex = 0 | 1 | 2;

type RecipientPreview = {
  id: string;
  name: string | null;
  email: string;
};

export function UserManagementTransferPage() {
  const [step, setStep] = useState<StepIndex>(0);
  const [amountRaw, setAmountRaw] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipient, setRecipient] = useState<RecipientPreview | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loadingBalances, setLoadingBalances] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [realBalance, setRealBalance] = useState<FinancialSnapshot | null>(
    null
  );

  const loadBalances = useCallback(async () => {
    try {
      setLoadingBalances(true);
      setBalanceError(null);
      const res = await fetch(
        `/api/user/financial?balanceType=${REAL_BALANCE_TYPE}`
      );
      if (res.status === 401) {
        setBalanceError('Sign in to view wallets.');
        setRealBalance(null);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load balances');
      }
      const json = (await res.json()) as FinancialSnapshot;
      setRealBalance(json);
    } catch {
      setBalanceError('Could not load wallet balances.');
      setRealBalance(null);
    } finally {
      setLoadingBalances(false);
    }
  }, []);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  const amountNum = useMemo(() => {
    const n = parseFloat(amountRaw.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }, [amountRaw]);

  const amountOk = Number.isFinite(amountNum) && amountNum > 0;

  const snap = realBalance;
  const availableUsd = snap?.balance ?? NaN;
  const withinBalance =
    !Number.isFinite(availableUsd) ||
    !amountOk ||
    amountNum <= availableUsd + 1e-9;

  const canNextFromAmount =
    amountOk && withinBalance && !loadingBalances && !balanceError;

  const emailTrimmed = recipientEmail.trim();
  const emailLooksOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);

  const canNextFromRecipient =
    emailLooksOk && recipient !== null && !lookupLoading;

  const lookupRecipient = useCallback(async () => {
    if (!emailLooksOk) {
      setLookupError('Enter a valid email address.');
      setRecipient(null);
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setRecipient(null);
    try {
      const res = await fetch(
        `/api/user/peer-transfer?email=${encodeURIComponent(emailTrimmed)}`
      );
      const data = (await res.json()) as {
        error?: string;
        recipient?: RecipientPreview;
      };
      if (!res.ok) {
        setLookupError(data.error ?? 'Could not verify recipient');
        return;
      }
      if (data.recipient) {
        setRecipient(data.recipient);
      }
    } catch {
      setLookupError('Could not verify recipient');
    } finally {
      setLookupLoading(false);
    }
  }, [emailLooksOk, emailTrimmed]);

  const goNext = () => {
    if (step === 0 && !canNextFromAmount) return;
    if (step === 1 && !canNextFromRecipient) return;
    setStep((s) => (s < 2 ? ((s + 1) as StepIndex) : s));
  };

  const goBack = () => {
    setStep((s) => (s > 0 ? ((s - 1) as StepIndex) : s));
  };

  const handleSubmit = async () => {
    if (!recipient || !amountOk) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/user/peer-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          balanceType: REAL_BALANCE_TYPE,
          recipientEmail: recipient.email
        })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Transfer failed');
        return;
      }
      toast.success('Transfer completed');
      setStep(0);
      setAmountRaw('');
      setRecipientEmail('');
      setRecipient(null);
      setLookupError(null);
      void loadBalances();
    } catch {
      toast.error('Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="shrink-0 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6 py-4">
        <h1 className="text-base font-semibold text-[var(--trade-text)]">
          Transfer
        </h1>
        <p className="mt-1 text-sm text-[var(--trade-text-muted)]">
          Send funds from your real balance to another PaySnap user by email.
          The recipient is credited on their real balance.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <nav aria-label="Progress" className="w-full">
            <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
              {STEPS.map((label, i) => {
                const active = step === i;
                const done = step > i;
                return (
                  <li key={label} className="flex min-w-0 flex-1 items-center">
                    <div
                      className={cn(
                        'flex w-full flex-col border-b-2 pb-3 transition-colors',
                        active || done
                          ? 'border-[var(--trade-accent-blue)]'
                          : 'border-[var(--trade-border)]'
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs font-medium uppercase tracking-wide',
                          active
                            ? 'text-[var(--trade-accent-blue)]'
                            : 'text-[var(--trade-text-muted)]'
                        )}
                      >
                        {label}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--trade-text)]">
                        {done ? (
                          <span className="flex size-6 items-center justify-center rounded-full bg-[var(--trade-accent-blue)]/20 text-[var(--trade-accent-blue)]">
                            <IconCheck className="size-3.5" stroke={2.5} />
                          </span>
                        ) : (
                          <span className="font-mono text-[var(--trade-text-muted)]">
                            {i + 1}
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          <section
            className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6 shadow-sm"
            aria-live="polite"
          >
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--trade-text)]">
                    From real wallet
                  </h2>
                  <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                    Peer transfers use your live balance only (not demo or
                    institutional).
                  </p>
                </div>

                {balanceError && (
                  <p className="text-sm text-[var(--trade-red)]">{balanceError}</p>
                )}

                {loadingBalances ? (
                  <div className="h-[112px] animate-pulse rounded-xl bg-[var(--trade-border)]/60" />
                ) : (
                  <div className="rounded-xl border border-[var(--trade-accent-blue)]/40 bg-[var(--trade-accent-blue)]/[0.08] px-4 py-3 ring-1 ring-[var(--trade-accent-blue)]/30">
                    <div className="text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
                      {REAL_WALLET_LABEL}
                    </div>
                    <div className="mt-2 text-xs text-[var(--trade-text-muted)]">
                      Available
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--trade-text)]">
                      {realBalance ? fmtUsd(realBalance.balance) : '—'}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="transfer-amount"
                    className="text-sm font-semibold text-[var(--trade-text)]"
                  >
                    Amount
                  </label>
                  <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                    Transferred in account currency (USD).
                  </p>
                  <input
                    id="transfer-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={amountRaw}
                    onChange={(e) => setAmountRaw(e.target.value)}
                    className={cn(
                      'mt-3 w-full rounded-lg border bg-[var(--trade-dark)] px-4 py-3 font-mono text-[var(--trade-text)] outline-none transition-[box-shadow,border-color]',
                      'border-[var(--trade-border)] placeholder:text-[var(--trade-text-muted)]/60',
                      'focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25'
                    )}
                  />
                  {!amountOk && amountRaw.trim() !== '' && (
                    <p className="mt-2 text-xs text-[var(--trade-red)]">
                      Enter a valid amount greater than zero.
                    </p>
                  )}
                  {amountOk && !withinBalance && snap && (
                    <p className="mt-2 text-xs text-[var(--trade-red)]">
                      Amount exceeds available {fmtUsd(snap.balance)} for this
                      wallet.
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canNextFromAmount}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                      'bg-[var(--trade-accent-blue)] text-[var(--trade-dark)] hover:opacity-90',
                      'disabled:pointer-events-none disabled:opacity-40'
                    )}
                  >
                    Next
                    <IconChevronRight className="size-4" stroke={2} />
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--trade-text)]">
                    Recipient
                  </h2>
                  <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                    Enter the other user&apos;s PaySnap account email, then
                    verify before continuing.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="transfer-recipient-email"
                    className="text-sm font-semibold text-[var(--trade-text)]"
                  >
                    Email address
                  </label>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      id="transfer-recipient-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={recipientEmail}
                      onChange={(e) => {
                        setRecipientEmail(e.target.value);
                        setRecipient(null);
                        setLookupError(null);
                      }}
                      className={cn(
                        'min-h-[44px] w-full flex-1 rounded-lg border bg-[var(--trade-dark)] px-4 py-3 text-[var(--trade-text)] outline-none transition-[box-shadow,border-color]',
                        'border-[var(--trade-border)] placeholder:text-[var(--trade-text-muted)]/60',
                        'focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => void lookupRecipient()}
                      disabled={lookupLoading || !emailTrimmed}
                      className={cn(
                        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-3 text-sm font-semibold text-[var(--trade-text)]',
                        'hover:bg-[var(--trade-border)]/40 disabled:pointer-events-none disabled:opacity-40'
                      )}
                    >
                      {lookupLoading ? (
                        <IconLoader2 className="size-4 animate-spin" />
                      ) : (
                        <IconUserSearch className="size-4" stroke={2} />
                      )}
                      Verify
                    </button>
                  </div>
                  {lookupError && (
                    <p className="mt-2 text-xs text-[var(--trade-red)]">
                      {lookupError}
                    </p>
                  )}
                  {recipient && (
                    <div className="mt-4 rounded-lg border border-[var(--trade-accent-blue)]/40 bg-[var(--trade-accent-blue)]/[0.06] px-4 py-3">
                      <p className="text-xs font-medium text-[var(--trade-text-muted)]">
                        Verified recipient
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--trade-text)]">
                        {recipient.name?.trim() || recipient.email}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[var(--trade-text-muted)]">
                        {recipient.email}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-2.5 text-sm font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40"
                  >
                    <IconChevronLeft className="size-4" stroke={2} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canNextFromRecipient}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                      'bg-[var(--trade-accent-blue)] text-[var(--trade-dark)] hover:opacity-90',
                      'disabled:pointer-events-none disabled:opacity-40'
                    )}
                  >
                    Next
                    <IconChevronRight className="size-4" stroke={2} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--trade-text)]">
                    Review
                  </h2>
                  <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                    Confirm the transfer. This cannot be undone from here.
                  </p>
                </div>

                <dl className="divide-y divide-[var(--trade-border)] rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]">
                  <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-[var(--trade-text-muted)]">Wallet</dt>
                    <dd className="font-medium text-[var(--trade-text)]">
                      {REAL_WALLET_LABEL}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-[var(--trade-text-muted)]">Amount</dt>
                    <dd className="font-mono font-semibold tabular-nums text-[var(--trade-text)]">
                      {fmtUsd(amountNum)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-3 text-sm">
                    <dt className="text-[var(--trade-text-muted)]">
                      Recipient
                    </dt>
                    <dd className="text-[var(--trade-text)]">
                      {recipient?.name?.trim() || recipient?.email}
                    </dd>
                    <dd className="font-mono text-xs text-[var(--trade-text-muted)]">
                      {recipient?.email}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-2.5 text-sm font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40 disabled:opacity-50"
                  >
                    <IconChevronLeft className="size-4" stroke={2} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !recipient || !amountOk}
                    className={cn(
                      'inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                      'bg-[var(--trade-accent-blue)] text-[var(--trade-dark)] hover:opacity-90',
                      'disabled:pointer-events-none disabled:opacity-40'
                    )}
                  >
                    {submitting ? (
                      <>
                        <IconLoader2 className="size-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Confirm transfer'
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
