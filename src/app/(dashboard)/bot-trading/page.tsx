'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  MOCK_BOT_MARKETPLACE,
  type BotMarketplaceItem
} from '@/constants/bot-trading-mock';
import {
  IconRobot,
  IconTrendingUp,
  IconShield,
  IconSearch
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'LOW':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'HIGH':
      return 'bg-red-500/10 text-red-600 dark:text-red-400';
    default:
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    amount
  );

function BotCard({ bot }: { bot: BotMarketplaceItem }) {
  const isComingSoon = bot.status === 'COMING_SOON';

  return (
    <Card className='border-border/50 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-xl'>
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
        <div>
          <CardTitle className='text-lg'>{bot.name}</CardTitle>
          <p className='text-muted-foreground text-xs'>{bot.strategy}</p>
        </div>
        <Badge
          variant='secondary'
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider',
            getRiskColor(bot.riskLevel)
          )}
        >
          <IconShield className='mr-1 h-3 w-3' />
          {bot.riskLevel}
        </Badge>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-end justify-between py-2'>
          <span
            className={cn(
              'text-2xl font-bold tracking-tight',
              bot.performance30d >= 0 ? 'text-primary' : 'text-destructive'
            )}
          >
            {bot.performance30d >= 0 ? '+' : ''}{bot.performance30d}%
          </span>
          <span className='text-muted-foreground flex items-center text-sm'>
            <IconTrendingUp className='mr-1 h-4 w-4 text-primary' />
            30d
          </span>
        </div>
        <div className='grid grid-cols-2 gap-y-3 border-t border-border/50 pt-4'>
          <div>
            <p className='text-muted-foreground text-[10px] font-bold uppercase tracking-wider'>
              90d
            </p>
            <p
              className={cn(
                'text-sm font-medium',
                bot.performance90d >= 0 ? 'text-primary' : 'text-destructive'
              )}
            >
              {bot.performance90d >= 0 ? '+' : ''}{bot.performance90d}%
            </p>
          </div>
          <div className='text-right'>
            <p className='text-muted-foreground text-[10px] font-bold uppercase tracking-wider'>
              Min. capital
            </p>
            <p className='text-sm font-medium'>{formatCurrency(bot.minCapital)}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-[10px] font-bold uppercase tracking-wider'>
              Subscribers
            </p>
            <p className='text-sm font-medium'>{bot.subscribers}</p>
          </div>
        </div>
        {isComingSoon ? (
          <Button className='w-full' variant='outline' disabled>
            Coming soon
          </Button>
        ) : (
          <div className='grid grid-cols-2 gap-2 pt-2'>
            <Button className='w-full' asChild>
              <Link href='/bot-trading/my-bots'>Use bot</Link>
            </Button>
            <Button variant='secondary' className='w-full' disabled>
              Stop
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const FILTER_TABS = [
  { id: 'all', label: 'All Bots' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'high', label: 'High Frequency' },
  { id: 'low', label: 'Low Risk' }
] as const;

export default function BotMarketplacePage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('performance');

  const filtered = MOCK_BOT_MARKETPLACE.filter((bot) => {
    const matchSearch =
      bot.name.toLowerCase().includes(search.toLowerCase()) ||
      bot.strategy.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'low' && bot.riskLevel !== 'LOW') return false;
    if (filter === 'high' && bot.riskLevel !== 'HIGH') return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'performance') return b.performance30d - a.performance30d;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return b.subscribers - a.subscribers;
  });

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <Heading
            title='Bot Marketplace'
            description='Browse and connect trading bots. Stitch-inspired layout with mock data.'
          />
          <div className='relative w-full max-w-xs'>
            <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search bots or strategies...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
        <Separator />

        {/* Stats bar - Stitch style */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card className='border-border/50'>
            <CardContent className='p-5'>
              <p className='text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider'>
                Active Bots
              </p>
              <p className='text-2xl font-bold'>
                2 <span className='text-muted-foreground ml-1 text-sm font-normal'>/ 20</span>
              </p>
            </CardContent>
          </Card>
          <Card className='border-border/50'>
            <CardContent className='p-5'>
              <p className='text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider'>
                24h Profit
              </p>
              <p className='text-2xl font-bold text-primary'>+$50.70</p>
            </CardContent>
          </Card>
          <Card className='border-border/50'>
            <CardContent className='p-5'>
              <p className='text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider'>
                Total Equity
              </p>
              <p className='text-2xl font-bold'>$1,500.00</p>
            </CardContent>
          </Card>
          <Card className='border-border/50'>
            <CardContent className='p-5'>
              <p className='text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider'>
                Success Rate
              </p>
              <p className='text-2xl font-bold text-primary'>78.4%</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter tabs + sort - Stitch style */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex gap-1 rounded-lg bg-muted/50 p-1'>
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={filter === tab.id ? 'default' : 'ghost'}
                size='sm'
                className='rounded-md'
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>Sort by:</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='performance'>Performance (30d)</SelectItem>
                <SelectItem value='name'>Bot Name</SelectItem>
                <SelectItem value='subscribers'>Subscribers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {sorted.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>

        {sorted.length === 0 && (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <IconRobot className='text-muted-foreground mb-4 h-12 w-12' />
              <p className='text-muted-foreground text-center'>
                No bots match your search.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
