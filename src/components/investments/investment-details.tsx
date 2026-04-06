'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  IconCalendar,
  IconTrendingUp,
  IconUsers,
  IconShield,
  IconInfoCircle,
  IconCalculator,
  IconArrowRight
} from '@tabler/icons-react';

const tradeRoomCardClass =
  'border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-none py-4 gap-4';

const inputTradeClass =
  'border-[var(--trade-border)] bg-[var(--trade-dark)]/40 text-sm text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)] focus-visible:border-[var(--trade-accent-blue)] focus-visible:ring-[var(--trade-accent-blue)]/25';

interface InvestmentWithDetails {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  rentability: number;
  minInvestment: number;
  maxInvestment?: number | null;
  autoReinvestment: boolean;
  totalCapacity?: number | null;
  currentCapacity: number;
  riskLevel: string;
  imageUrl?: string | null;
  createdAt: Date;
  availableCapacity?: number | null;
  _count?: {
    userInvestments: number;
  };
}

interface InvestmentDetailsProps {
  investment: InvestmentWithDetails;
  userBalance?: number;
  onEnroll?: (data: { amount: number; autoReinvest: boolean }) => void;
  isLoading?: boolean;
}

const getRiskBadgeClass = (riskLevel: string) => {
  switch (riskLevel) {
    case 'LOW':
      return 'border-[var(--trade-green)]/40 bg-[var(--trade-green)]/15 text-[var(--trade-green)]';
    case 'HIGH':
      return 'border-[var(--trade-red)]/40 bg-[var(--trade-red)]/15 text-[var(--trade-red)]';
    default:
      return 'border-[var(--trade-accent-blue)]/40 bg-[var(--trade-accent-blue)]/15 text-[var(--trade-accent-blue)]';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const DAYS_PER_YEAR = 365;

const calculateReturns = (
  amount: number,
  rentability: number,
  durationDays: number
) => {
  const annualReturn = (amount * rentability) / 100;
  const dailyReturn = annualReturn / DAYS_PER_YEAR;
  const totalReturn = dailyReturn * durationDays;
  const totalAmount = amount + totalReturn;

  return {
    dailyReturn,
    totalReturn,
    totalAmount
  };
};

export function InvestmentDetails({
  investment,
  userBalance = 0,
  onEnroll,
  isLoading = false
}: InvestmentDetailsProps) {
  const [amount, setAmount] = useState(investment.minInvestment);
  const [autoReinvest, setAutoReinvest] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const capacityPercentage = investment.totalCapacity
    ? (investment.currentCapacity / investment.totalCapacity) * 100
    : 0;

  const returns = calculateReturns(
    amount,
    investment.rentability,
    investment.duration
  );

  const validateAmount = (value: number): string[] => {
    const validationErrors: string[] = [];

    if (value < investment.minInvestment) {
      validationErrors.push(
        `Minimum investment is ${formatCurrency(investment.minInvestment)}`
      );
    }

    if (investment.maxInvestment && value > investment.maxInvestment) {
      validationErrors.push(
        `Maximum investment is ${formatCurrency(investment.maxInvestment)}`
      );
    }

    if (value > userBalance) {
      validationErrors.push('Insufficient balance');
    }

    if (investment.availableCapacity && value > investment.availableCapacity) {
      validationErrors.push('Amount exceeds available capacity');
    }

    return validationErrors;
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setAmount(numValue);
    setErrors(validateAmount(numValue));
  };

  const handleEnroll = () => {
    const validationErrors = validateAmount(amount);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onEnroll?.({ amount, autoReinvest });
  };

  const canEnroll = errors.length === 0 && amount >= investment.minInvestment;

  return (
    <div className='grid gap-6 lg:grid-cols-3'>
      <div className='space-y-6 lg:col-span-2'>
        <Card className={cn('overflow-hidden', tradeRoomCardClass)}>
          {investment.imageUrl && (
            <div className='relative h-56 border-b border-[var(--trade-border)] bg-[var(--trade-dark)] sm:h-64'>
              <Image
                src={investment.imageUrl}
                alt={investment.title}
                fill
                className='object-cover opacity-90'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-[var(--trade-dark)] via-[var(--trade-dark)]/40 to-transparent' />
              <Badge
                className={cn(
                  'absolute top-4 right-4 border',
                  getRiskBadgeClass(investment.riskLevel)
                )}
                variant='outline'
              >
                <IconShield className='mr-1 h-4 w-4' />
                {investment.riskLevel} risk
              </Badge>
            </div>
          )}

          <CardHeader className='px-4 pb-2 pt-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 space-y-2'>
                <CardTitle className='text-lg text-[var(--trade-text)] sm:text-xl'>
                  {investment.title}
                </CardTitle>
                <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--trade-text-muted)]'>
                  <div className='flex items-center gap-1'>
                    <IconCalendar className='size-3.5 shrink-0' />
                    {investment.duration} days
                  </div>
                  <div className='flex items-center gap-1'>
                    <IconUsers className='size-3.5 shrink-0' />
                    {investment._count?.userInvestments ?? 0} investors
                  </div>
                </div>
              </div>
              {!investment.imageUrl && (
                <Badge
                  className={cn('shrink-0 border', getRiskBadgeClass(investment.riskLevel))}
                  variant='outline'
                >
                  <IconShield className='mr-1 h-4 w-4' />
                  {investment.riskLevel} risk
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className='space-y-6 px-4 pb-4'>
            {investment.description && (
              <div>
                <h3 className='mb-2 text-sm font-semibold text-[var(--trade-text)]'>
                  About this investment
                </h3>
                <p className='text-sm leading-relaxed text-[var(--trade-text-muted)]'>
                  {investment.description}
                </p>
              </div>
            )}

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div className='space-y-4'>
                <div>
                  <h3 className='mb-3 text-sm font-semibold text-[var(--trade-text)]'>
                    Investment terms
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div className='flex justify-between gap-2'>
                      <span className='text-[var(--trade-text-muted)]'>
                        Annual return
                      </span>
                      <div className='flex items-center font-mono font-semibold text-[var(--trade-green)]'>
                        <IconTrendingUp className='mr-1 size-4 shrink-0' />
                        {investment.rentability}%
                      </div>
                    </div>
                    <div className='flex justify-between gap-2'>
                      <span className='text-[var(--trade-text-muted)]'>
                        Duration
                      </span>
                      <span className='font-medium text-[var(--trade-text)]'>
                        {investment.duration} days
                      </span>
                    </div>
                    <div className='flex justify-between gap-2'>
                      <span className='text-[var(--trade-text-muted)]'>
                        Min. investment
                      </span>
                      <span className='font-mono font-medium text-[var(--trade-text)]'>
                        {formatCurrency(investment.minInvestment)}
                      </span>
                    </div>
                    {investment.maxInvestment && (
                      <div className='flex justify-between gap-2'>
                        <span className='text-[var(--trade-text-muted)]'>
                          Max. investment
                        </span>
                        <span className='font-mono font-medium text-[var(--trade-text)]'>
                          {formatCurrency(investment.maxInvestment)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <div>
                  <h3 className='mb-3 text-sm font-semibold text-[var(--trade-text)]'>
                    Capacity
                  </h3>
                  {investment.totalCapacity ? (
                    <div className='space-y-3'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-[var(--trade-text-muted)]'>
                          Progress
                        </span>
                        <span className='font-mono font-medium text-[var(--trade-text)]'>
                          {Math.round(capacityPercentage)}%
                        </span>
                      </div>
                      <div className='h-2 overflow-hidden rounded-full bg-[var(--trade-dark)]/80'>
                        <div
                          className='h-full rounded-full bg-[var(--trade-accent-blue)] transition-all'
                          style={{ width: `${capacityPercentage}%` }}
                        />
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-[var(--trade-text-muted)]'>
                          Available
                        </span>
                        <span className='font-mono font-medium text-[var(--trade-text)]'>
                          {formatCurrency(investment.availableCapacity || 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-[var(--trade-text-muted)]'>
                      Unlimited capacity
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='space-y-6'>
        <Card className={tradeRoomCardClass}>
          <CardHeader className='px-4 pb-2 pt-0'>
            <CardTitle className='flex items-center gap-2 text-sm font-semibold text-[var(--trade-text)]'>
              <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
                <IconCalculator className='size-4 text-[var(--trade-accent-blue)]' />
              </div>
              Investment calculator
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 px-4 pt-0'>
            <div className='space-y-2'>
              <Label
                htmlFor='amount'
                className='text-xs text-[var(--trade-text-muted)]'
              >
                Investment amount
              </Label>
              <Input
                id='amount'
                type='number'
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder='Enter amount'
                min={investment.minInvestment}
                max={investment.maxInvestment || undefined}
                className={inputTradeClass}
              />
              <p className='text-xs text-[var(--trade-text-muted)]'>
                Your balance:{' '}
                <span className='font-mono text-[var(--trade-text)]'>
                  {formatCurrency(userBalance)}
                </span>
              </p>
            </div>

            {errors.length > 0 && (
              <Alert
                variant='destructive'
                className='border-[var(--trade-red)]/40 bg-[var(--trade-red)]/10 text-[var(--trade-text)] [&_svg]:text-[var(--trade-red)]'
              >
                <IconInfoCircle className='h-4 w-4' />
                <AlertDescription>
                  <ul className='list-inside list-disc space-y-1 text-sm'>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Separator className='bg-[var(--trade-border)]' />

            <div className='space-y-3'>
              <h4 className='text-xs font-semibold uppercase tracking-wide text-[var(--trade-text-muted)]'>
                Projected returns
              </h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between gap-2'>
                  <span className='text-[var(--trade-text-muted)]'>
                    Daily return (avg.)
                  </span>
                  <span className='font-mono font-medium text-[var(--trade-text)]'>
                    {formatCurrency(returns.dailyReturn)}
                  </span>
                </div>
                <div className='flex justify-between gap-2'>
                  <span className='text-[var(--trade-text-muted)]'>
                    Total return
                  </span>
                  <span className='font-mono font-medium text-[var(--trade-green)]'>
                    +{formatCurrency(returns.totalReturn)}
                  </span>
                </div>
                <Separator className='bg-[var(--trade-border)]' />
                <div className='flex justify-between gap-2 font-semibold'>
                  <span className='text-[var(--trade-text)]'>Total at maturity</span>
                  <span className='font-mono text-[var(--trade-green)]'>
                    {formatCurrency(returns.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className='w-full bg-[var(--trade-accent-blue)] text-[var(--trade-panel)] shadow-none hover:opacity-90'
              onClick={handleEnroll}
              disabled={!canEnroll || isLoading}
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  Invest {formatCurrency(amount)}
                  <IconArrowRight className='ml-2 h-4 w-4' />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {investment.autoReinvestment && (
          <Card className={tradeRoomCardClass}>
            <CardHeader className='px-4 pb-2 pt-0'>
              <CardTitle className='text-sm font-semibold text-[var(--trade-text)]'>
                Auto-reinvestment
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 px-4 pt-0'>
              <p className='text-xs leading-relaxed text-[var(--trade-text-muted)]'>
                When enabled, returns are reinvested automatically at the end of
                each term.
              </p>
              <div className='flex items-center justify-between gap-3 border-t border-[var(--trade-border)] pt-3'>
                <Label
                  htmlFor='auto-reinvest'
                  className='text-sm text-[var(--trade-text)]'
                >
                  Enable auto-reinvestment
                </Label>
                <Switch
                  id='auto-reinvest'
                  checked={autoReinvest}
                  onCheckedChange={setAutoReinvest}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
