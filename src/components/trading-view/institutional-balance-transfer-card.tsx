'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  IconArrowsTransferDown,
  IconLoader2
} from '@tabler/icons-react';

type FinancialData = {
  balance: number;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const tradeRoomCardClass =
  'border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-none py-4 gap-4';

type TransferDirection =
  | 'REAL_TO_INSTITUTIONAL'
  | 'INSTITUTIONAL_TO_REAL';

export function InstitutionalBalanceTransferCard() {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] =
    useState<TransferDirection>('REAL_TO_INSTITUTIONAL');
  const [realBalance, setRealBalance] = useState<number>(0);
  const [institutionalBalance, setInstitutionalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadBalances = useCallback(async () => {
    setLoading(true);
    try {
      const [realRes, institutionalRes] = await Promise.all([
        fetch('/api/user/financial?room=ALL&balanceType=REAL'),
        fetch('/api/user/financial?room=INSTITUTIONAL&balanceType=INSTITUTIONAL')
      ]);

      if (!realRes.ok || !institutionalRes.ok) {
        throw new Error('Failed to fetch balances');
      }

      const realData: FinancialData = await realRes.json();
      const institutionalData: FinancialData = await institutionalRes.json();

      setRealBalance(realData.balance || 0);
      setInstitutionalBalance(institutionalData.balance || 0);
    } catch {
      toast.error('Failed to load balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const parsedAmount = useMemo(() => Number(amount), [amount]);
  const isValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const sourceBalance =
    direction === 'REAL_TO_INSTITUTIONAL' ? realBalance : institutionalBalance;
  const hasEnoughBalance = isValidAmount && parsedAmount <= sourceBalance;

  const handleTransfer = async () => {
    if (!isValidAmount) {
      toast.error('Enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/user/balance-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parsedAmount, direction })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      setAmount('');
      setRealBalance(data.realBalance ?? realBalance);
      setInstitutionalBalance(data.institutionalBalance ?? institutionalBalance);
      toast.success('Transfer completed');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('room-institutional-balances-refresh')
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={tradeRoomCardClass}>
      <CardHeader className='px-4 pb-0 pt-0'>
        <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
          <IconArrowsTransferDown className='h-4 w-4 shrink-0' />
          Transfer between balances
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 px-4'>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            size='sm'
            variant={
              direction === 'REAL_TO_INSTITUTIONAL' ? 'default' : 'outline'
            }
            className='h-8 flex-1 text-xs sm:flex-none'
            onClick={() => setDirection('REAL_TO_INSTITUTIONAL')}
          >
            REAL → INSTITUTIONAL
          </Button>
          <Button
            type='button'
            size='sm'
            variant={
              direction === 'INSTITUTIONAL_TO_REAL' ? 'default' : 'outline'
            }
            className='h-8 flex-1 text-xs sm:flex-none'
            onClick={() => setDirection('INSTITUTIONAL_TO_REAL')}
          >
            INSTITUTIONAL → REAL
          </Button>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='rounded-md border border-[var(--trade-border)] bg-[var(--trade-dark)]/30 p-3'>
            <p className='text-xs text-[var(--trade-text-muted)]'>REAL Balance</p>
            <p className='font-mono text-sm font-bold'>
              {loading ? 'Loading...' : currencyFormatter.format(realBalance)}
            </p>
          </div>
          <div className='rounded-md border border-[var(--trade-border)] bg-[var(--trade-dark)]/30 p-3'>
            <p className='text-xs text-[var(--trade-text-muted)]'>
              INSTITUTIONAL Balance
            </p>
            <p className='font-mono text-sm font-bold'>
              {loading
                ? 'Loading...'
                : currencyFormatter.format(institutionalBalance)}
            </p>
          </div>
        </div>

        <div className='space-y-2'>
          <Label
            htmlFor='institutional-transfer-amount'
            className='text-xs font-medium text-[var(--trade-text-muted)]'
          >
            {direction === 'REAL_TO_INSTITUTIONAL'
              ? 'Amount to transfer from REAL'
              : 'Amount to transfer from INSTITUTIONAL'}
          </Label>
          <Input
            id='institutional-transfer-amount'
            type='number'
            min='0'
            step='0.01'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder='Enter amount'
          />
          {isValidAmount && !hasEnoughBalance ? (
            <p className='text-destructive text-xs'>
              {direction === 'REAL_TO_INSTITUTIONAL'
                ? 'Insufficient REAL balance for this transfer.'
                : 'Insufficient INSTITUTIONAL balance for this transfer.'}
            </p>
          ) : null}
        </div>

        <Button
          onClick={handleTransfer}
          disabled={submitting || !isValidAmount || !hasEnoughBalance || loading}
          className='h-9 w-full text-sm'
        >
          {submitting ? <IconLoader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
          Transfer
        </Button>
      </CardContent>
    </Card>
  );
}
