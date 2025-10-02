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
  IconMapPin,
  IconTrendingUp,
  IconUsers,
  IconShield,
  IconInfoCircle,
  IconCalculator,
  IconArrowRight
} from '@tabler/icons-react';

interface InvestmentWithDetails {
  id: string;
  title: string;
  description?: string | null;
  country: string;
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

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'LOW':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'HIGH':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: // MEDIUM
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const calculateReturns = (
  amount: number,
  rentability: number,
  duration: number
) => {
  const annualReturn = (amount * rentability) / 100;
  const monthlyReturn = annualReturn / 12;
  const totalReturn = monthlyReturn * duration;
  const totalAmount = amount + totalReturn;

  return {
    monthlyReturn,
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
      {/* Investment Details */}
      <div className='space-y-6 lg:col-span-2'>
        <Card>
          {investment.imageUrl && (
            <div className='relative h-64 bg-gradient-to-br from-green-400 to-green-600'>
              <Image
                src={investment.imageUrl}
                alt={investment.title}
                fill
                className='object-cover'
              />
              <div className='absolute inset-0 bg-black/20' />
              <Badge
                className={cn(
                  'absolute top-4 right-4',
                  getRiskColor(investment.riskLevel)
                )}
              >
                <IconShield className='mr-1 h-4 w-4' />
                {investment.riskLevel} Risk
              </Badge>
            </div>
          )}

          <CardHeader>
            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl'>{investment.title}</CardTitle>
                <div className='text-muted-foreground flex items-center space-x-4'>
                  <div className='flex items-center'>
                    <IconMapPin className='mr-1 h-4 w-4' />
                    {investment.country}
                  </div>
                  <div className='flex items-center'>
                    <IconCalendar className='mr-1 h-4 w-4' />
                    {investment.duration} months
                  </div>
                  <div className='flex items-center'>
                    <IconUsers className='mr-1 h-4 w-4' />
                    {investment._count?.userInvestments || 0} investors
                  </div>
                </div>
              </div>
              {!investment.imageUrl && (
                <Badge className={cn(getRiskColor(investment.riskLevel))}>
                  <IconShield className='mr-1 h-4 w-4' />
                  {investment.riskLevel} Risk
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            {investment.description && (
              <div>
                <h3 className='mb-2 font-semibold'>About this Investment</h3>
                <p className='text-muted-foreground leading-relaxed'>
                  {investment.description}
                </p>
              </div>
            )}

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div className='space-y-4'>
                <div>
                  <h3 className='mb-3 font-semibold'>Investment Terms</h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Annual Return
                      </span>
                      <div className='flex items-center font-semibold text-green-600'>
                        <IconTrendingUp className='mr-1 h-4 w-4' />
                        {investment.rentability}%
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Duration</span>
                      <span className='font-medium'>
                        {investment.duration} months
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Min. Investment
                      </span>
                      <span className='font-medium'>
                        {formatCurrency(investment.minInvestment)}
                      </span>
                    </div>
                    {investment.maxInvestment && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Max. Investment
                        </span>
                        <span className='font-medium'>
                          {formatCurrency(investment.maxInvestment)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <div>
                  <h3 className='mb-3 font-semibold'>Capacity</h3>
                  {investment.totalCapacity ? (
                    <div className='space-y-3'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Progress</span>
                        <span className='font-medium'>
                          {Math.round(capacityPercentage)}%
                        </span>
                      </div>
                      <div className='bg-muted h-3 overflow-hidden rounded-full'>
                        <div
                          className='h-full bg-gradient-to-r from-green-500 to-green-600 transition-all'
                          style={{ width: `${capacityPercentage}%` }}
                        />
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Available</span>
                        <span className='font-medium'>
                          {formatCurrency(investment.availableCapacity || 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className='text-muted-foreground'>Unlimited capacity</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Form */}
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <IconCalculator className='mr-2 h-5 w-5' />
              Investment Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='amount'>Investment Amount</Label>
              <Input
                id='amount'
                type='number'
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder='Enter amount'
                min={investment.minInvestment}
                max={investment.maxInvestment || undefined}
              />
              <p className='text-muted-foreground text-xs'>
                Your balance: {formatCurrency(userBalance)}
              </p>
            </div>

            <div className='flex items-center space-x-2'>
              <Switch
                id='auto-reinvest'
                checked={autoReinvest}
                onCheckedChange={setAutoReinvest}
              />
              <Label htmlFor='auto-reinvest' className='text-sm'>
                Auto-reinvest returns
              </Label>
            </div>

            {errors.length > 0 && (
              <Alert variant='destructive'>
                <IconInfoCircle className='h-4 w-4' />
                <AlertDescription>
                  <ul className='list-inside list-disc space-y-1'>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className='space-y-3'>
              <h4 className='text-sm font-semibold'>Projected Returns</h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Monthly Return</span>
                  <span className='font-medium'>
                    {formatCurrency(returns.monthlyReturn)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Total Return</span>
                  <span className='font-medium text-green-600'>
                    +{formatCurrency(returns.totalReturn)}
                  </span>
                </div>
                <Separator />
                <div className='flex justify-between font-semibold'>
                  <span>Total Amount</span>
                  <span className='text-green-600'>
                    {formatCurrency(returns.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className='w-full'
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
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>
                Auto-Reinvestment Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground text-xs'>
                This investment supports automatic reinvestment of returns. When
                enabled, your returns will be automatically reinvested at the
                end of each term.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
