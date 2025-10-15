import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
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
import { prisma } from '@/lib/prisma';

async function getInvestments() {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/investments`,
      {
        cache: 'no-store' // Ensure fresh data
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch investments');
    }

    const data = await response.json();
    return data.investments || [];
  } catch (error) {
    // Log error server-side only
    return [];
  }
}

async function getUserBalance(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return (user as any)?.balance || 0;
  } catch (error) {
    // Return fallback value if error occurs
    return 0;
  }
}

async function getUserInvestmentStats(userId: string) {
  try {
    const userInvestments = await (prisma as any).userInvestment.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE'
      },
      include: {
        investment: {
          select: {
            rentability: true,
            duration: true
          }
        }
      }
    });

    let totalInvested = 0;
    let totalExpectedReturns = 0;
    let activeInvestments = userInvestments.length;

    userInvestments.forEach((userInvestment: any) => {
      totalInvested += userInvestment.amount;
      totalExpectedReturns += userInvestment.expectedReturn;
    });

    return {
      totalInvested,
      totalExpectedReturns,
      activeInvestments
    };
  } catch (error) {
    // Return fallback values if error occurs
    return {
      totalInvested: 0,
      totalExpectedReturns: 0,
      activeInvestments: 0
    };
  }
}

export default async function InvestmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return redirect('/auth/sign-in');
  }

  const userBalance = await getUserBalance(session.user.id);
  const investments = await getInvestments();
  const userStats = await getUserInvestmentStats(session.user.id);

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Investments</h1>
            <p className='text-muted-foreground'>
              Discover and manage your investment opportunities
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='text-right'>
              <p className='text-sm font-medium'>Available Balance</p>
              <p className='text-xl font-bold text-green-600'>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EUR'
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
                  currency: 'EUR'
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
                      currency: 'EUR'
                    }).format(userStats.totalExpectedReturns)}
                  </span>
                ) : (
                  '€0'
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
            <Suspense fallback={<InvestmentsSkeleton />}>
              <AvailableInvestments
                investments={investments}
                userBalance={userBalance}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value='my-investments' className='space-y-4'>
            <Suspense fallback={<InvestmentsSkeleton />}>
              <UserInvestments userId={session.user.id} />
            </Suspense>
          </TabsContent>

          <TabsContent value='transactions' className='space-y-4'>
            <InvestmentTransactionsListing />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

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

async function AvailableInvestments({
  investments
}: {
  investments: Investment[];
  userBalance: number;
}) {
  return (
    <div>
      {investments.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {investments.map((investment) => (
            <InvestmentCard key={investment.id} investment={investment} />
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
    </div>
  );
}

async function UserInvestments({ userId }: { userId: string }) {
  try {
    const userInvestments = await (prisma as any).userInvestment.findMany({
      where: { userId },
      include: {
        investment: {
          select: {
            id: true,
            title: true,
            country: true,
            duration: true,
            rentability: true,
            riskLevel: true,
            imageUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return (
      <div>
        {userInvestments.length > 0 ? (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {userInvestments.map((userInvestment: any) => (
              <UserInvestmentCard
                key={userInvestment.id}
                userInvestment={userInvestment}
              />
            ))}
          </div>
        ) : (
          <Card className='py-12'>
            <CardContent className='text-center'>
              <IconCalendar className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>No investments yet</h3>
              <p className='text-muted-foreground mb-4'>
                Start investing to see your portfolio here.
              </p>
              <Button>Browse Investments</Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    // Return empty state if error occurs
    return (
      <Card className='py-12'>
        <CardContent className='text-center'>
          <IconCalendar className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
          <h3 className='mb-2 text-lg font-semibold'>
            Error loading investments
          </h3>
          <p className='text-muted-foreground mb-4'>
            Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }
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
