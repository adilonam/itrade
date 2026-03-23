'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { InvestmentEnrollmentForm } from '@/components/investments/investment-enrollment-form';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Investment } from '@/lib/prisma/generated/client';

type InvestmentWithDetails = Investment & {
  availableCapacity?: number | null;
  _count?: { userInvestments: number };
};

export default function InvestmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [investment, setInvestment] = useState<InvestmentWithDetails | null>(
    null
  );
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/sign-in');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (!id || !session?.user?.id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const [investmentRes, financialRes] = await Promise.all([
          fetch(`/api/investments/${id}`),
          fetch('/api/user/financial?balanceType=REAL')
        ]);

        if (investmentRes.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!investmentRes.ok || !financialRes.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }

        const [investmentData, financialData] = await Promise.all([
          investmentRes.json(),
          financialRes.json()
        ]);

        if (!cancelled) {
          setInvestment(investmentData);
          setUserBalance(financialData?.freeMargin ?? 0);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, session?.user?.id]);

  if (status === 'loading' || !session?.user) {
    return (
      <PageContainer>
        <div className='flex min-h-[200px] items-center justify-center'>
          <div className='bg-muted h-8 w-48 animate-pulse rounded' />
        </div>
      </PageContainer>
    );
  }

  if (notFound || (!loading && !investment)) {
    return (
      <PageContainer>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <p className='font-medium'>Investment not found</p>
            <Button className='mt-4' onClick={() => router.push('/investments')}>
              Back to Investments
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (loading || !investment) {
    return (
      <PageContainer>
        <div className='flex min-h-[200px] items-center justify-center'>
          <div className='bg-muted h-8 w-48 animate-pulse rounded' />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        <InvestmentEnrollmentForm
          investment={investment}
          userBalance={userBalance}
        />
      </div>
    </PageContainer>
  );
}
