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
    | 'country'
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

function InvestmentsSkeleton() {
  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className='overflow-hidden'>
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

  const userBalance = financial?.freeMargin ?? 0;
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
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <p className='text-destructive font-medium'>{error}</p>
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
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Investments</h1>
            <p className='text-muted-foreground'>
              Discover and manage your investment opportunities
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='text-right'>
              <p className='text-sm font-medium'>
                Available Balance (Free Margin)
              </p>
              <p className='text-xl font-bold text-green-600'>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(userBalance)}
              </p>
            </div>
            <IconWallet className='text-muted-foreground h-6 w-6' />
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Invested
              </CardTitle>
              <IconPigMoney className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(userStats.totalInvested)}
              </div>
              <p className='text-muted-foreground text-xs'>
                {userStats.activeInvestments > 0
                  ? `Across ${userStats.activeInvestments} investment${userStats.activeInvestments > 1 ? 's' : ''}`
                  : 'No active investments'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Expected Returns
              </CardTitle>
              <IconTrendingUp className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {userStats.totalExpectedReturns > 0 ? (
                  <span className='text-green-600'>
                    +
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(userStats.totalExpectedReturns)}
                  </span>
                ) : (
                  '$0'
                )}
              </div>
              <p className='text-muted-foreground text-xs'>
                {userStats.totalInvested > 0
                  ? 'Projected at maturity'
                  : 'Projected earnings'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active Investments
              </CardTitle>
              <IconCalendar className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {userStats.activeInvestments}
              </div>
              <p className='text-muted-foreground text-xs'>
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
          <TabsList>
            <TabsTrigger value='available'>Available Investments</TabsTrigger>
            <TabsTrigger value='my-investments'>My Investments</TabsTrigger>
            <TabsTrigger value='transactions'>Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value='available' className='space-y-4'>
            {/* Filters */}
            <Card>
              <CardContent className='pt-6'>
                <div className='flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4'>
                  <div className='flex-1'>
                    <div className='relative'>
                      <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                      <Input
                        placeholder='Search investments...'
                        className='pl-10'
                      />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className='w-full md:w-[180px]'>
                      <IconFilter className='mr-2 h-4 w-4' />
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
                    <SelectTrigger className='w-full md:w-[180px]'>
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
              <Card className='py-12'>
                <CardContent className='text-center'>
                  <IconPigMoney className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
                  <h3 className='mb-2 text-lg font-semibold'>
                    No investments available
                  </h3>
                  <p className='text-muted-foreground'>
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
              <Card className='py-12'>
                <CardContent className='text-center'>
                  <IconCalendar className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
                  <h3 className='mb-2 text-lg font-semibold'>
                    No investments yet
                  </h3>
                  <p className='text-muted-foreground mb-4'>
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
