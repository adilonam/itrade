'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { InvestmentCard } from '@/components/investments/investment-card';
import { UserInvestmentCard } from '@/components/investments/user-investment-card';
import InvestmentTransactionsListing from '@/components/investments/investment-transactions-listing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconSearch,
  IconFilter,
  IconTrendingUp,
  IconWallet,
  IconPigMoney,
  IconCalendar
} from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import type {
  Investment,
  UserInvestment
} from '@/lib/prisma/generated/client';

type InvestmentFromApi = Investment & {
  _count?: { userInvestments: number };
};

type UserInvestmentWithDetails = UserInvestment & {
  investment: Pick<
    Investment,
    | 'id'
    | 'title'
    | 'duration'
    | 'rentability'
    | 'riskLevel'
    | 'imageUrl'
  >;
};

interface FinancialInfo {
  freeMargin: number;
  balance?: number;
}

const tradeRoomCardClass =
  'border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-none py-4 gap-4';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

function InvestmentsSkeleton() {
  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className={`overflow-hidden ${tradeRoomCardClass}`}>
          <div className='bg-muted h-48 animate-pulse' />
          <CardHeader>
            <div className='bg-muted h-6 animate-pulse rounded' />
            <div className='bg-muted h-4 w-3/4 animate-pulse rounded' />
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='bg-muted h-4 animate-pulse rounded' />
            <div className='bg-muted h-4 w-1/2 animate-pulse rounded' />
            <div className='bg-muted h-10 animate-pulse rounded' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function InvestmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [investments, setInvestments] = useState<InvestmentFromApi[]>([]);
  const [userInvestments, setUserInvestments] = useState<
    UserInvestmentWithDetails[]
  >([]);
  const [financial, setFinancial] = useState<FinancialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [investmentsRes, userInvestmentsRes, financialRes] =
        await Promise.all([
          fetch('/api/investments'),
          fetch('/api/user/investments'),
          fetch('/api/user/financial?balanceType=REAL')
        ]);

      if (!investmentsRes.ok) throw new Error('Failed to fetch investments');
      if (!userInvestmentsRes.ok)
        throw new Error('Failed to fetch your investments');
      if (!financialRes.ok) throw new Error('Failed to fetch balance');

      const [investmentsData, userInvestmentsData, financialData] =
        await Promise.all([
          investmentsRes.json(),
          userInvestmentsRes.json(),
          financialRes.json()
        ]);

      setInvestments(investmentsData.investments ?? []);
      setUserInvestments(userInvestmentsData.userInvestments ?? []);
      setFinancial(financialData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load investment data'
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/sign-in');
      return;
    }
    if (session?.user?.id) {
      loadData();
    }
  }, [status, session?.user?.id, router, loadData]);

  if (status === 'loading' || !session?.user) {
    return (
      <PageContainer>
        <div className='flex min-h-[200px] items-center justify-center'>
          <div className='bg-muted h-8 w-48 animate-pulse rounded' />
        </div>
      </PageContainer>
    );
  }

  /** Real-account free margin (equity minus margin on STOCK/TRADING positions). */
  const realFreeMargin = financial?.freeMargin ?? 0;
  const activeUserInvestments = userInvestments.filter(
    (i) => i.status === 'ACTIVE'
  );
  const userStats = {
    totalInvested: activeUserInvestments.reduce((sum, i) => sum + i.amount, 0),
    totalExpectedReturns: activeUserInvestments.reduce(
      (sum, i) => sum + i.expectedReturn,
      0
    ),
    activeInvestments: activeUserInvestments.length
  };

  if (error) {
    return (
      <PageContainer>
        <Card className={tradeRoomCardClass}>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <p className='text-destructive text-sm font-medium'>{error}</p>
            <Button className='mt-4' onClick={() => loadData()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6 text-sm text-[var(--trade-text)]'>
        {/* Header */}
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-[var(--trade-text)]'>
              Investments
            </h1>
            <p className='text-xs text-[var(--trade-text-muted)]'>
              Discover and manage your investment opportunities
            </p>
          </div>
          <div className='flex items-start space-x-3'>
            <div className='text-right'>
              <p className='text-xs text-[var(--trade-text-muted)]'>
                Real balance · free margin
              </p>
              <p className='font-mono text-sm font-bold text-[var(--trade-green)]'>
                {currencyFormatter.format(realFreeMargin)}
              </p>
            </div>
            <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
              <IconWallet className='h-4 w-4 text-[var(--trade-accent-blue)]' />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card className={tradeRoomCardClass}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-0'>
              <CardTitle className='text-sm font-semibold'>
                Total Invested
              </CardTitle>
              <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
                <IconPigMoney className='h-4 w-4 text-[var(--trade-accent-blue)]' />
              </div>
            </CardHeader>
            <CardContent className='px-4 pt-0'>
              <p className='font-mono text-sm font-bold'>
                {currencyFormatter.format(userStats.totalInvested)}
              </p>
              <p className='text-xs text-[var(--trade-text-muted)]'>
                {userStats.activeInvestments > 0
                  ? `Across ${userStats.activeInvestments} investment${userStats.activeInvestments > 1 ? 's' : ''}`
                  : 'No active investments'}
              </p>
            </CardContent>
          </Card>
          <Card className={tradeRoomCardClass}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-0'>
              <CardTitle className='text-sm font-semibold'>
                Expected Returns
              </CardTitle>
              <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
                <IconTrendingUp className='h-4 w-4 text-[var(--trade-green)]' />
              </div>
            </CardHeader>
            <CardContent className='px-4 pt-0'>
              <p className='font-mono text-sm font-bold'>
                {userStats.totalExpectedReturns > 0 ? (
                  <span className='text-[var(--trade-green)]'>
                    +
                    {currencyFormatter.format(userStats.totalExpectedReturns)}
                  </span>
                ) : (
                  <span>{currencyFormatter.format(0)}</span>
                )}
              </p>
              <p className='text-xs text-[var(--trade-text-muted)]'>
                {userStats.totalInvested > 0
                  ? 'Projected at maturity'
                  : 'Projected earnings'}
              </p>
            </CardContent>
          </Card>
          <Card className={tradeRoomCardClass}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-0'>
              <CardTitle className='text-sm font-semibold'>
                Active Investments
              </CardTitle>
              <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
                <IconCalendar className='h-4 w-4 text-[var(--trade-text-muted)]' />
              </div>
            </CardHeader>
            <CardContent className='px-4 pt-0'>
              <p className='font-mono text-sm font-bold'>
                {userStats.activeInvestments}
              </p>
              <p className='text-xs text-[var(--trade-text-muted)]'>
                {userStats.activeInvestments === 1
                  ? 'Currently running'
                  : userStats.activeInvestments > 1
                    ? 'Currently running'
                    : 'No active investments'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue='available' className='space-y-4'>
          <TabsList className='border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text-muted)]'>
            <TabsTrigger
              value='available'
              className='data-[state=active]:bg-[var(--trade-dark)]/40 data-[state=active]:text-[var(--trade-text)]'
            >
              Available Investments
            </TabsTrigger>
            <TabsTrigger
              value='my-investments'
              className='data-[state=active]:bg-[var(--trade-dark)]/40 data-[state=active]:text-[var(--trade-text)]'
            >
              My Investments
            </TabsTrigger>
            <TabsTrigger
              value='transactions'
              className='data-[state=active]:bg-[var(--trade-dark)]/40 data-[state=active]:text-[var(--trade-text)]'
            >
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value='available' className='space-y-4'>
            {/* Filters */}
            <Card className={tradeRoomCardClass}>
              <CardContent className='px-4 pt-6'>
                <div className='flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4'>
                  <div className='flex-1'>
                    <div className='relative'>
                      <IconSearch className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--trade-text-muted)]' />
                      <Input
                        placeholder='Search investments...'
                        className='border-[var(--trade-border)] bg-[var(--trade-dark)]/40 pl-10 text-sm text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)]'
                      />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className='w-full border-[var(--trade-border)] bg-[var(--trade-dark)]/40 text-sm text-[var(--trade-text)] md:w-[180px]'>
                      <IconFilter className='mr-2 h-4 w-4 text-[var(--trade-text-muted)]' />
                      <SelectValue placeholder='Risk Level' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Risk Levels</SelectItem>
                      <SelectItem value='LOW'>Low Risk</SelectItem>
                      <SelectItem value='MEDIUM'>Medium Risk</SelectItem>
                      <SelectItem value='HIGH'>High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className='w-full border-[var(--trade-border)] bg-[var(--trade-dark)]/40 text-sm text-[var(--trade-text)] md:w-[180px]'>
                      <SelectValue placeholder='Country' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Countries</SelectItem>
                      <SelectItem value='luxembourg'>Luxembourg</SelectItem>
                      <SelectItem value='switzerland'>Switzerland</SelectItem>
                      <SelectItem value='germany'>Germany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Available Investments */}
            {loading ? (
              <InvestmentsSkeleton />
            ) : investments.length > 0 ? (
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {investments.map((investment) => (
                  <InvestmentCard
                    key={investment.id}
                    investment={investment}
                  />
                ))}
              </div>
            ) : (
              <Card className={`${tradeRoomCardClass} py-12`}>
                <CardContent className='px-4 text-center'>
                  <IconPigMoney className='mx-auto mb-4 h-12 w-12 text-[var(--trade-text-muted)]/50' />
                  <h3 className='mb-2 text-sm font-semibold text-[var(--trade-text)]'>
                    No investments available
                  </h3>
                  <p className='text-xs text-[var(--trade-text-muted)]'>
                    Check back later for new investment opportunities.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='my-investments' className='space-y-4'>
            {loading ? (
              <InvestmentsSkeleton />
            ) : userInvestments.length > 0 ? (
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {userInvestments.map((userInvestment) => (
                  <UserInvestmentCard
                    key={userInvestment.id}
                    userInvestment={userInvestment as never}
                  />
                ))}
              </div>
            ) : (
              <Card className={`${tradeRoomCardClass} py-12`}>
                <CardContent className='px-4 text-center'>
                  <IconCalendar className='mx-auto mb-4 h-12 w-12 text-[var(--trade-text-muted)]/50' />
                  <h3 className='mb-2 text-sm font-semibold text-[var(--trade-text)]'>
                    No investments yet
                  </h3>
                  <p className='mb-4 text-xs text-[var(--trade-text-muted)]'>
                    Start investing to see your portfolio here.
                  </p>
                  <Button onClick={() => router.push('/investments')}>
                    Browse Investments
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='transactions' className='space-y-4'>
            <InvestmentTransactionsListing />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
