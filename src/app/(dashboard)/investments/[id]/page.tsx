'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { InvestmentEnrollmentForm } from '@/components/investments/investment-enrollment-form';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconChevronLeft, IconWallet } from '@tabler/icons-react';
import type { Investment } from '@/lib/prisma/generated/client';

const tradeRoomCardClass =
  'border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-none py-4 gap-4';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

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
  const [realFreeMargin, setRealFreeMargin] = useState(0);
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
          setRealFreeMargin(financialData?.freeMargin ?? 0);
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
          <div className='h-8 w-48 animate-pulse rounded bg-[var(--trade-border)]' />
        </div>
      </PageContainer>
    );
  }

  if (notFound || (!loading && !investment)) {
    return (
      <PageContainer>
        <Card className={tradeRoomCardClass}>
          <CardContent className='flex flex-col items-center justify-center px-4 py-12 text-center'>
            <p className='text-sm font-semibold text-[var(--trade-text)]'>
              Investment not found
            </p>
            <Button
              className='mt-4 border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40'
              variant='outline'
              onClick={() => router.push('/investments')}
            >
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
          <div className='h-8 w-48 animate-pulse rounded bg-[var(--trade-border)]' />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6 text-sm text-[var(--trade-text)]'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start'>
            <Button
              asChild
              variant='outline'
              size='sm'
              className='w-fit shrink-0 border-[var(--trade-border)] bg-[var(--trade-dark)]/40 text-[var(--trade-text)] hover:bg-[var(--trade-dark)]'
            >
              <Link
                href='/investments'
                className='inline-flex items-center gap-1'
              >
                <IconChevronLeft className='size-4' />
                Investments
              </Link>
            </Button>
            <div className='min-w-0'>
              <h1 className='text-xl font-bold tracking-tight text-[var(--trade-text)] sm:text-2xl'>
                {investment.title}
              </h1>
              <p className='text-xs text-[var(--trade-text-muted)]'>
                Review terms, projected returns, and allocate from your free
                margin
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3 sm:text-right'>
            <div>
              <p className='text-xs text-[var(--trade-text-muted)]'>
                Real balance · free margin
              </p>
              <p className='font-mono text-sm font-bold text-[var(--trade-green)]'>
                {currencyFormatter.format(realFreeMargin)}
              </p>
            </div>
            <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
              <IconWallet className='size-4 text-[var(--trade-accent-blue)]' />
            </div>
          </div>
        </div>

        <InvestmentEnrollmentForm
          investment={investment}
          userBalance={realFreeMargin}
        />
      </div>
    </PageContainer>
  );
}
