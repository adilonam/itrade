'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  IconCalendar,
  IconMapPin,
  IconTrendingUp,
  IconUsers,
  IconShield
} from '@tabler/icons-react';

interface Investment {
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
  _count?: {
    userInvestments: number;
  };
}

interface InvestmentCardProps {
  investment: Investment;
  className?: string;
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
    currency: 'USD'
  }).format(amount);
};

const calculateAvailableCapacity = (investment: Investment) => {
  if (!investment.totalCapacity) return null;
  return investment.totalCapacity - investment.currentCapacity;
};

export function InvestmentCard({ investment, className }: InvestmentCardProps) {
  const availableCapacity = calculateAvailableCapacity(investment);
  const capacityPercentage = investment.totalCapacity
    ? (investment.currentCapacity / investment.totalCapacity) * 100
    : 0;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-lg',
        className
      )}
    >
      {investment.imageUrl && (
        <div className='relative h-48 bg-gradient-to-br from-green-400 to-green-600'>
          <Image
            src={investment.imageUrl}
            alt={investment.title}
            fill
            className='object-cover'
          />
          <div className='absolute inset-0 bg-black/20' />
          <Badge
            className={cn(
              'absolute top-3 right-3',
              getRiskColor(investment.riskLevel)
            )}
          >
            <IconShield className='mr-1 h-3 w-3' />
            {investment.riskLevel}
          </Badge>
        </div>
      )}

      <CardHeader className='space-y-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='line-clamp-1 text-lg font-semibold'>
            {investment.title}
          </CardTitle>
          {!investment.imageUrl && (
            <Badge className={cn(getRiskColor(investment.riskLevel))}>
              <IconShield className='mr-1 h-3 w-3' />
              {investment.riskLevel}
            </Badge>
          )}
        </div>

        <div className='text-muted-foreground flex items-center space-x-4 text-sm'>
          <div className='flex items-center'>
            <IconMapPin className='mr-1 h-4 w-4' />
            {investment.country}
          </div>
          <div className='flex items-center'>
            <IconCalendar className='mr-1 h-4 w-4' />
            {investment.duration} months
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {investment.description && (
          <p className='text-muted-foreground line-clamp-2 text-sm'>
            {investment.description}
          </p>
        )}

        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-muted-foreground font-medium'>Annual Return</p>
            <div className='flex items-center font-semibold text-green-600'>
              <IconTrendingUp className='mr-1 h-4 w-4' />
              {investment.rentability}%
            </div>
          </div>
          <div>
            <p className='text-muted-foreground font-medium'>Min. Investment</p>
            <p className='font-semibold'>
              {formatCurrency(investment.minInvestment)}
            </p>
          </div>
        </div>

        {investment.totalCapacity && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Capacity</span>
              <span className='font-medium'>
                {Math.round(capacityPercentage)}%
              </span>
            </div>
            <div className='bg-muted h-2 overflow-hidden rounded-full'>
              <div
                className='h-full bg-gradient-to-r from-green-500 to-green-600 transition-all'
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
            <p className='text-muted-foreground text-xs'>
              {formatCurrency(availableCapacity || 0)} available
            </p>
          </div>
        )}

        <div className='flex items-center justify-between pt-2'>
          <div className='text-muted-foreground flex items-center text-sm'>
            <IconUsers className='mr-1 h-4 w-4' />
            {investment._count?.userInvestments || 0} investors
          </div>
          <Button asChild size='sm'>
            <Link href={`/investments/${investment.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
