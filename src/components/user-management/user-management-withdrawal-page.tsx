'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FinancialSnapshot } from '@/components/dashboard/dashboard-overview-trade-analytics';
import type { BalanceType } from '@/lib/prisma/generated/client';

const STEPS = ['Amount', 'Crypto & address', 'Review'] as const;

const REAL_BALANCE_TYPE = 'REAL' satisfies BalanceType;
const REAL_WALLET_LABEL = 'Real';

const CRYPTOS = [
  {
    id: 'btc' as const,
    symbol: 'BTC',
    name: 'Bitcoin',
    hint: 'On-chain BTC to your external wallet',
    addressPlaceholder: 'bc1… or 1… or 3…'
  },
  {
    id: 'usdc' as const,
    symbol: 'USDC',
    name: 'USD Coin',
    hint: 'ERC-20 (and supported networks)',
    addressPlaceholder: '0x… (42 characters)'
  },
  {
    id: 'usdt' as const,
    symbol: 'USDT',
    name: 'Tether',
    hint: 'ERC-20 / TRC-20 — match the network',
    addressPlaceholder: '0x… or T… (by network)'
  }
] as const;

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

type StepIndex = 0 | 1 | 2;

function addressLooksPlausible(asset: (typeof CRYPTOS)[number]['id'], raw: string) {
  const t = raw.trim();
  if (t.length < 8) return false;
  if (asset === 'btc') {
    return /^(bc1|[13])[a-zA-Z0-9]{25,62}$/.test(t);
  }
  if (asset === 'usdc' || asset === 'usdt') {
    if (/^T[a-zA-Z0-9]{33}$/.test(t)) return true;
    return /^0x[a-fA-F0-9]{40}$/.test(t);
  }
  return false;
}

export function UserManagementWithdrawalPage() {
  const [step, setStep] = useState<StepIndex>(0);
  const [amountRaw, setAmountRaw] = useState('');
  const [crypto, setCrypto] = useState<(typeof CRYPTOS)[number]['id'] | null>(
    null
  );
  const [address, setAddress] = useState('');
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
    amountOk &&
    withinBalance &&
    !loadingBalances &&
    !balanceError;

  const selectedCrypto = crypto ? CRYPTOS.find((c) => c.id === crypto) : null;
  const addressOk =
    crypto !== null &&
    addressLooksPlausible(crypto, address);

  const canNextFromCrypto = crypto !== null && addressOk;

  const goNext = () => {
    if (step === 0 && !canNextFromAmount) return;
    if (step === 1 && !canNextFromCrypto) return;
    setStep((s) => (s < 2 ? ((s + 1) as StepIndex) : s));
  };

  const goBack = () => {
    setStep((s) => (s > 0 ? ((s - 1) as StepIndex) : s));
  };

  const handleSubmit = async () => {
    if (!crypto || !amountOk || !addressOk) return;
    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 600));
      toast.success('Withdrawal request recorded (UI preview — backend pending)');
      setStep(0);
      setAmountRaw('');
      setCrypto(null);
      setAddress('');
      void loadBalances();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="shrink-0 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6 py-4">
        <h1 className="text-base font-semibold text-[var(--trade-text)]">
          Withdraw
        </h1>
        <p className="mt-1 text-sm text-[var(--trade-text-muted)]">
          Send funds from your real balance as BTC, USDC, or USDT to an external
          address. Amounts are expressed in USD equivalent.
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
                    Real wallet
                  </h2>
                  <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                    Withdrawals debit your live balance only (not demo or
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
                    htmlFor="withdraw-amount"
                    className="text-sm font-semibold text-[var(--trade-text)]"
                  >
                    How much (USD equivalent)?
                  </label>
                  <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                    We convert and send the chosen asset to your address.
                  </p>
                  <input
                    id="withdraw-amount"
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
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--trade-text)]">
                      Asset & destination
                    </h2>
                    <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                      Pick the cryptocurrency you want to receive and paste a
                      valid address for that network.
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-xs text-[var(--trade-text-muted)] sm:mt-0">
                    <span className="font-medium text-[var(--trade-text)]">
                      Double-check network
                    </span>
                    <span className="opacity-70">·</span>
                    <span>Wrong chain = loss of funds</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {CRYPTOS.map((c) => {
                    const selected = crypto === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCrypto(c.id);
                          setAddress('');
                        }}
                        className={cn(
                          'flex flex-col rounded-xl border px-4 py-4 text-left transition-colors',
                          selected
                            ? 'border-[var(--trade-accent-blue)] bg-[var(--trade-accent-blue)]/[0.08] ring-1 ring-[var(--trade-accent-blue)]/30'
                            : 'border-[var(--trade-border)] bg-[var(--trade-dark)] hover:border-[var(--trade-text-muted)]/40'
                        )}
                      >
                        <span className="font-mono text-lg font-bold tracking-tight text-[var(--trade-text)]">
                          {c.symbol}
                        </span>
                        <span className="mt-1 text-sm text-[var(--trade-text)]">
                          {c.name}
                        </span>
                        <span className="mt-2 text-xs leading-snug text-[var(--trade-text-muted)]">
                          {c.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label
                    htmlFor="withdraw-address"
                    className="text-sm font-semibold text-[var(--trade-text)]"
                  >
                    Recipient address
                  </label>
                  <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                    {selectedCrypto
                      ? `Expected format: ${selectedCrypto.addressPlaceholder}`
                      : 'Select an asset first.'}
                  </p>
                  <input
                    id="withdraw-address"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={
                      selectedCrypto?.addressPlaceholder ?? 'Select asset above'
                    }
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!crypto}
                    className={cn(
                      'mt-3 w-full rounded-lg border bg-[var(--trade-dark)] px-4 py-3 font-mono text-sm text-[var(--trade-text)] outline-none transition-[box-shadow,border-color]',
                      'border-[var(--trade-border)] placeholder:text-[var(--trade-text-muted)]/60',
                      'focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25',
                      !crypto && 'cursor-not-allowed opacity-50'
                    )}
                  />
                  {crypto && address.trim() !== '' && !addressOk && (
                    <p className="mt-2 text-xs text-[var(--trade-red)]">
                      Address does not match a typical {selectedCrypto?.symbol}{' '}
                      format.
                    </p>
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
                    disabled={!canNextFromCrypto}
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
                    Confirm the withdrawal before submitting.
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
                    <dt className="text-[var(--trade-text-muted)]">Asset</dt>
                    <dd className="font-mono font-semibold text-[var(--trade-text)]">
                      {selectedCrypto?.symbol}{' '}
                      <span className="text-[var(--trade-text-muted)]">
                        ({selectedCrypto?.name})
                      </span>
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
                      Destination
                    </dt>
                    <dd className="break-all font-mono text-xs text-[var(--trade-text)]">
                      {address.trim()}
                    </dd>
                  </div>
                </dl>

                <p className="text-xs leading-relaxed text-[var(--trade-text-muted)]">
                  You are requesting to withdraw{' '}
                  <span className="font-mono text-[var(--trade-text)]">
                    {fmtUsd(amountNum)}
                  </span>{' '}
                  USD equivalent as {selectedCrypto?.symbol} from your{' '}
                  {REAL_WALLET_LABEL} wallet. Network fees may reduce the
                  amount received.
                </p>

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
                    disabled={submitting || !amountOk || !crypto || !addressOk}
                    className={cn(
                      'inline-flex min-w-[160px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                      'bg-[var(--trade-red)] text-white hover:opacity-90',
                      'disabled:pointer-events-none disabled:opacity-40'
                    )}
                  >
                    {submitting ? (
                      <>
                        <IconLoader2 className="size-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Confirm withdrawal'
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
