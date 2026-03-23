'use client';

import { useTransition } from 'react';
import { InvestmentDetails } from './investment-details';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

interface InvestmentEnrollmentFormProps {
  investment: InvestmentWithDetails;
  userBalance: number;
}

export function InvestmentEnrollmentForm({
  investment,
  userBalance
}: InvestmentEnrollmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleEnroll = async (data: {
    amount: number;
    autoReinvest: boolean;
  }) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/user/investments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            investmentId: investment.id,
            amount: data.amount,
            autoReinvest: data.autoReinvest,
            balanceType: 'REAL'
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to process investment');
        }

        toast.success(
          `Successfully invested ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(data.amount)} in ${investment.title}!`
        );

        // Redirect to investments page after success
        router.push('/investments');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to process investment'
        );
      }
    });
  };

  return (
    <InvestmentDetails
      investment={investment}
      userBalance={userBalance}
      onEnroll={handleEnroll}
      isLoading={isPending}
    />
  );
}
