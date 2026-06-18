'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserDepositRequestsSection } from '@/components/user-management/user-deposit-requests-section';
import {
  MANUAL_USDT_DEPOSIT_NETWORKS,
  type ManualUsdtDepositNetworkId
} from '@/constants/data';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconLoader2
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { UserManagementPageHeader } from '@/components/user-management/user-management-page-header';
import type { FinancialSnapshot } from '@/components/dashboard/dashboard-overview-trade-analytics';
import type { BalanceType } from '@/lib/prisma/generated/client';

const DEPOSIT_STEP_KEYS = ['stepAmount', 'stepPayment', 'stepReview'] as const;

/** User-management deposits credit the live (real) balance only. */
const REAL_BALANCE_TYPE = 'REAL' satisfies BalanceType;
const REAL_WALLET_LABEL = 'Real';

const CRYPTOS = [
  {
    id: 'btc' as const,
    symbol: 'BTC',
    name: 'Bitcoin',
    hint: 'On-chain BTC deposit'
  },
  {
    id: 'usdc' as const,
    symbol: 'USDC',
    name: 'USD Coin',
    hint: 'ERC-20 / supported networks'
  }
];

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

type StepIndex = 0 | 1 | 2;

type UserManagementDepositPageProps = {
  paymentReturnStatus?: string | null;
};

export function UserManagementDepositPage({
  paymentReturnStatus = null
}: UserManagementDepositPageProps) {
  const t = useTranslations('UserManagement.deposit');
  const tShared = useTranslations('UserManagement.shared');
  const depositSteps = DEPOSIT_STEP_KEYS.map((key) => t(key));
  const urlRefreshPart =
    paymentReturnStatus === 'success' || paymentReturnStatus === 'cancelled'
      ? 1
      : 0;
  const [depositListExtraRefresh, setDepositListExtraRefresh] = useState(0);
  const depositListRefreshKey = urlRefreshPart + depositListExtraRefresh;

  const [step, setStep] = useState<StepIndex>(0);
  const [amountRaw, setAmountRaw] = useState('');
  const [crypto, setCrypto] = useState<(typeof CRYPTOS)[number]['id'] | null>(
    null
  );
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

  const canNextFromAmount = amountOk && !loadingBalances && !balanceError;
  const canNextFromCrypto = crypto !== null;

  const goNext = () => {
    if (step === 0 && !canNextFromAmount) return;
    if (step === 1 && !canNextFromCrypto) return;
    setStep((s) => (s < 2 ? ((s + 1) as StepIndex) : s));
  };

  const goBack = () => {
    setStep((s) => (s > 0 ? ((s - 1) as StepIndex) : s));
  };

  const handleSubmit = async () => {
    if (!crypto || !amountOk) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod: crypto,
          balanceType: REAL_BALANCE_TYPE
        })
      });
      const data = (await res.json()) as { error?: string; checkoutUrl?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Deposit failed');
        return;
      }
      if (!data.checkoutUrl) {
        toast.error('Payment gateway URL is missing.');
        return;
      }
      toast.success('Redirecting to NOWPayments...');
      window.location.assign(data.checkoutUrl);
      setStep(0);
      setAmountRaw('');
      setCrypto(null);
    } catch {
      toast.error('Deposit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCrypto = CRYPTOS.find((c) => c.id === crypto);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <UserManagementPageHeader title={t('title')} description={t('description')} />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          {/* Stepper */}
          <nav aria-label={tShared('progress')} className="w-full">
            <ol className="flex w-full items-stretch">
              {depositSteps.map((label, i) => {
                const active = step === i;
                const done = step > i;
                return (
                  <li key={label} className="flex min-w-0 flex-1">
                    <div
                      className={cn(
                        'flex w-full flex-col items-center border-b-2 pb-3 text-center transition-colors',
                        active || done
                          ? 'border-[var(--trade-accent-blue)]'
                          : 'border-[var(--trade-border)]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex min-h-8 items-center justify-center px-1 text-xs font-medium uppercase leading-tight tracking-wide',
                          active
                            ? 'text-[var(--trade-accent-blue)]'
                            : 'text-[var(--trade-text-muted)]'
                        )}
                      >
                        {label}
                      </span>
                      <span className="mt-1 flex size-6 items-center justify-center text-sm font-semibold text-[var(--trade-text)]">
                        {done ? (
                          <span className="flex size-6 items-center justify-center rounded-full bg-[var(--trade-accent-blue)]/20 text-[var(--trade-accent-blue)]">
                            <IconCheck className="size-3.5" stroke={2.5} />
                          </span>
                        ) : (
                          <span className="flex size-6 items-center justify-center font-mono text-[var(--trade-text-muted)]">
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
                    Deposits apply to your live balance only (not demo or
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
                      Your balance
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--trade-text)]">
                      {realBalance ? fmtUsd(realBalance.balance) : '—'}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="deposit-amount"
                    className="text-sm font-semibold text-[var(--trade-text)]"
                  >
                    How much?
                  </label>
                  <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                    Enter the deposit amount (USD equivalent).
                  </p>
                  <input
                    id="deposit-amount"
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
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canNextFromAmount}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                      'bg-[var(--trade-accent-blue)] text-[var(--trade-panel)] hover:opacity-90',
                      'disabled:pointer-events-none disabled:opacity-40'
                    )}
                  >
                    {tShared('next')}
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
                      Select payment asset
                    </h2>
                    <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                      Choose the cryptocurrency you will send. Settlement is
                      tracked in USD on your {REAL_WALLET_LABEL} wallet.
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-xs text-[var(--trade-text-muted)] sm:mt-0">
                    <span className="font-medium text-[var(--trade-text)]">
                      Crypto
                    </span>
                    <span className="opacity-70">·</span>
                    <span>Network fees may apply</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {CRYPTOS.map((c) => {
                    const selected = crypto === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCrypto(c.id)}
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

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-2.5 text-sm font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40"
                  >
                    <IconChevronLeft className="size-4" stroke={2} />
                    {tShared('back')}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canNextFromCrypto}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                      'bg-[var(--trade-accent-blue)] text-[var(--trade-panel)] hover:opacity-90',
                      'disabled:pointer-events-none disabled:opacity-40'
                    )}
                  >
                    {tShared('next')}
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
                    Confirm your deposit details before submitting.
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
                </dl>

                <p className="text-xs leading-relaxed text-[var(--trade-text-muted)]">
                  By confirming, you will be redirected to NOWPayments to complete{' '}
                  payment for{' '}
                  <span className="font-mono text-[var(--trade-text)]">
                    {fmtUsd(amountNum)}
                  </span>
                  . Your {REAL_WALLET_LABEL} balance will be credited after
                  on-chain confirmation and webhook verification.
                </p>

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-2.5 text-sm font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40 disabled:opacity-50"
                  >
                    <IconChevronLeft className="size-4" stroke={2} />
                    {tShared('back')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !amountOk || !crypto}
                    className={cn(
                      'inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                      'bg-[var(--trade-green)] text-[var(--trade-panel)] hover:opacity-90',
                      'disabled:pointer-events-none disabled:opacity-40'
                    )}
                  >
                    {submitting ? (
                      <>
                        <IconLoader2 className="size-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      'Confirm deposit'
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          <UserManagementManualDepositSection
            onRequestCreated={() =>
              setDepositListExtraRefresh((n) => n + 1)
            }
          />
        </div>

        <div className="mx-auto w-full max-w-5xl pb-6">
          <UserDepositRequestsSection refreshKey={depositListRefreshKey} />
        </div>
      </div>
    </div>
  );
}

type ManualDepositResult = {
  walletAddress: string;
  orderId: string;
  amountUsd: number;
  networkLabel: string;
};

function ManualDepositAmountField({
  value,
  onChange,
  showError
}: {
  value: string;
  onChange: (value: string) => void;
  showError: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <label
        htmlFor="manual-deposit-amount"
        className="shrink-0 text-sm font-semibold text-[var(--trade-text)]"
      >
        Amount (USDT)
      </label>
      <div className="min-w-0 flex-1 sm:max-w-xs">
        <input
          id="manual-deposit-amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full rounded-lg border bg-[var(--trade-dark)] px-4 py-3 font-mono text-[var(--trade-text)] outline-none transition-[box-shadow,border-color]',
            'border-[var(--trade-border)] placeholder:text-[var(--trade-text-muted)]/60',
            'focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25'
          )}
        />
        {showError && (
          <p className="mt-2 text-xs text-[var(--trade-red)]">
            Enter a valid amount greater than zero.
          </p>
        )}
      </div>
    </div>
  );
}

function UserManagementManualDepositSection({
  onRequestCreated
}: {
  onRequestCreated?: () => void;
}) {
  const [network, setNetwork] = useState<ManualUsdtDepositNetworkId>('trc20');
  const [amountRaw, setAmountRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ManualDepositResult | null>(null);

  const selectedNetwork = useMemo(
    () =>
      MANUAL_USDT_DEPOSIT_NETWORKS.find((item) => item.id === network) ??
      MANUAL_USDT_DEPOSIT_NETWORKS[0],
    [network]
  );

  const amountNum = useMemo(() => {
    const n = parseFloat(amountRaw.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }, [amountRaw]);

  const amountOk = Number.isFinite(amountNum) && amountNum > 0;

  const submitManual = async () => {
    if (!amountOk) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/user/deposit/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          network,
          balanceType: REAL_BALANCE_TYPE
        })
      });
      const data = (await res.json()) as {
        error?: string;
        walletAddress?: string;
        orderId?: string;
        amountUsd?: number;
        networkLabel?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not create deposit request');
        return;
      }
      if (
        !data.walletAddress ||
        !data.orderId ||
        data.amountUsd === undefined ||
        !data.networkLabel
      ) {
        toast.error('Invalid response from server.');
        return;
      }
      toast.success('Deposit request created');
      onRequestCreated?.();
      setResult({
        walletAddress: data.walletAddress,
        orderId: data.orderId,
        amountUsd: data.amountUsd,
        networkLabel: data.networkLabel
      });
      setAmountRaw('');
    } catch {
      toast.error('Could not create deposit request');
    } finally {
      setSubmitting(false);
    }
  };

  const displayWalletAddress = result?.walletAddress ?? selectedNetwork.address;

  const copyAddress = async () => {
    if (!displayWalletAddress) return;
    try {
      await navigator.clipboard.writeText(displayWalletAddress);
      toast.success('Address copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <section
      className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6 shadow-sm"
      aria-labelledby="manual-deposit-heading"
    >
      <h2
        id="manual-deposit-heading"
        className="text-sm font-semibold text-[var(--trade-text)]"
      >
        Manual USDT deposit
      </h2>
      <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
        USDT only. Choose a network, send funds to the platform wallet below,
        then create a deposit request with the USD amount you transferred. Your
        balance is updated after an administrator verifies your transfer.
      </p>

      <div className="mt-4 space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold text-[var(--trade-text)]">
            Network
          </legend>
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-label="USDT network"
          >
            {MANUAL_USDT_DEPOSIT_NETWORKS.map((item) => {
              const selected = network === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setNetwork(item.id)}
                  className={cn(
                    'flex flex-col rounded-xl border px-4 py-4 text-left transition-colors',
                    selected
                      ? 'border-[var(--trade-accent-blue)] bg-[var(--trade-accent-blue)]/[0.08] ring-1 ring-[var(--trade-accent-blue)]/30'
                      : 'border-[var(--trade-border)] bg-[var(--trade-dark)] hover:border-[var(--trade-text-muted)]/40'
                  )}
                >
                  <span className="font-mono text-base font-bold tracking-tight text-[var(--trade-text)]">
                    USDT
                  </span>
                  <span className="mt-1 text-sm text-[var(--trade-text)]">
                    {item.label.replace(/^USDT\s+/, '')}
                  </span>
                  <span className="mt-2 text-xs leading-snug text-[var(--trade-text-muted)]">
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--trade-text-muted)]">
            {selectedNetwork.label} deposit address
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <div className="min-w-0 flex-1 break-all rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-3 font-mono text-xs text-[var(--trade-text)]">
              {displayWalletAddress}
            </div>
            <button
              type="button"
              onClick={() => void copyAddress()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-3 text-sm font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40"
            >
              <IconCopy className="size-4" stroke={2} />
              Copy
            </button>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="mt-6 space-y-4">
          <ManualDepositAmountField
            value={amountRaw}
            onChange={setAmountRaw}
            showError={!amountOk && amountRaw.trim() !== ''}
          />
          <button
            type="button"
            onClick={() => void submitManual()}
            disabled={submitting || !amountOk}
            className={cn(
              'inline-flex min-w-[200px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
              'bg-[var(--trade-accent-blue)] text-[var(--trade-panel)] hover:opacity-90',
              'disabled:pointer-events-none disabled:opacity-40'
            )}
          >
            {submitting ? (
              <>
                <IconLoader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create deposit request'
            )}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="rounded-lg border border-[var(--trade-green)]/40 bg-[var(--trade-green)]/10 px-4 py-3 text-sm text-[var(--trade-text)]">
            Request created. Send{' '}
            <span className="font-mono font-semibold tabular-nums">
              {fmtUsd(result.amountUsd)}
            </span>{' '}
            USDT on {result.networkLabel} to the address above.
          </p>
          <p className="text-xs text-[var(--trade-text-muted)]">
            Reference / order ID:{' '}
            <span className="font-mono text-[var(--trade-text)]">
              {result.orderId}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="text-sm font-medium text-[var(--trade-accent-blue)] hover:underline"
          >
            Create another request
          </button>
        </div>
      )}
    </section>
  );
}
