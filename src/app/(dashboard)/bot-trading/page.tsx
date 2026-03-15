'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  MOCK_BOT_MARKETPLACE,
  DEFAULT_BOT_PARAMS,
  type BotMarketplaceItem,
  type BotParamsMap
} from '@/constants/bot-trading-mock';
import { BotTradingStatsCards } from '@/components/bot-trading/bot-trading-stats-cards';
import {
  IconRobot,
  IconTrendingUp,
  IconShield,
  IconSearch
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { Bot } from '@/lib/prisma/generated/client';

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

function getDefaultDates() {
  const start = new Date();
  const stop = new Date();
  stop.setDate(stop.getDate() + 30);
  return {
    dateStart: start.toISOString(),
    dateStop: stop.toISOString()
  };
}

interface MarketOption {
  id: string;
  symbol: string;
  name: string;
}

function BotCard({
  bot,
  onUseBot
}: {
  bot: BotMarketplaceItem;
  onUseBot: (bot: BotMarketplaceItem) => void;
}) {
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
            <Button className='w-full' onClick={() => onUseBot(bot)}>
              Use bot
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
  { id: 'low', label: 'Low Risk' },
  { id: 'high', label: 'High Risk' }
] as const;

export default function BotMarketplacePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('performance');
  const [selectedBot, setSelectedBot] = useState<BotMarketplaceItem | null>(null);
  const [markets, setMarkets] = useState<MarketOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateStart, setDateStart] = useState('');
  const [dateStop, setDateStop] = useState('');
  const [quantityLot, setQuantityLot] = useState(0.01);
  const [marketId, setMarketId] = useState('');
  const [botParams, setBotParams] = useState<BotParamsMap[Bot]>(DEFAULT_BOT_PARAMS.RSI);

  const openModal = useCallback((bot: BotMarketplaceItem) => {
    setSelectedBot(bot);
    const { dateStart: ds, dateStop: de } = getDefaultDates();
    setDateStart(ds);
    setDateStop(de);
    setQuantityLot(0.01);
    setMarketId('');
    setBotParams({ ...DEFAULT_BOT_PARAMS[bot.bot] });
    setError(null);
  }, []);

  useEffect(() => {
    if (!selectedBot) return;
    fetch('/api/markets?room=TRADING')
      .then((res) => res.json())
      .then((data) => {
        if (data.markets?.length) {
          setMarkets(
            data.markets.map((m: { id: string; symbol: string; name: string }) => ({
              id: m.id,
              symbol: m.symbol,
              name: m.name
            }))
          );
          setMarketId((prev) => prev || data.markets[0]?.id || '');
        }
      })
      .catch(() => setMarkets([]));
  }, [selectedBot]);

  const handleConfirm = async () => {
    if (!selectedBot) return;
    setError(null);
    if (!marketId) {
      setError('Please select a market.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/user/bot-trading/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot: selectedBot.bot,
          dateStart: new Date(dateStart).toISOString(),
          dateStop: new Date(dateStop).toISOString(),
          quantityLot,
          marketId,
          botParams
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to start bot.');
        setSubmitting(false);
        return;
      }
      setSelectedBot(null);
      router.push('/bot-trading/my-bots');
    } catch {
      setError('Failed to start bot.');
    } finally {
      setSubmitting(false);
    }
  };

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
            description='RSI, Grid Trading, and Trend Following bots. Configure and start from here.'
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

        <BotTradingStatsCards />

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
            <BotCard key={bot.id} bot={bot} onUseBot={openModal} />
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

      <Dialog open={!!selectedBot} onOpenChange={(open) => !open && setSelectedBot(null)}>
        <DialogContent className='max-w-md sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Start bot: {selectedBot?.name}</DialogTitle>
            <DialogDescription>
              Set schedule, market, lot size, and bot parameters. The bot will run between the
              start and stop dates.
            </DialogDescription>
          </DialogHeader>
          {selectedBot && (
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <DateTimePicker
                  id='dateStart'
                  label='Start date & time'
                  value={dateStart}
                  onChange={setDateStart}
                />
                <DateTimePicker
                  id='dateStop'
                  label='Stop date & time'
                  value={dateStop}
                  onChange={setDateStop}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='quantityLot'>Quantity (lots)</Label>
                  <Input
                    id='quantityLot'
                    type='number'
                    min={0.01}
                    step={0.01}
                    value={quantityLot}
                    onChange={(e) => setQuantityLot(Number(e.target.value) || 0.01)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Market</Label>
                  <Select value={marketId} onValueChange={setMarketId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select market' />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.symbol} – {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className='space-y-2'>
                <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Bot parameters
                </Label>
                {selectedBot.bot === 'RSI' && (
                  <div className='grid grid-cols-3 gap-3'>
                    <div className='space-y-1'>
                      <Label htmlFor='rsi-period' className='text-xs'>
                        Period
                      </Label>
                      <Input
                        id='rsi-period'
                        type='number'
                        min={2}
                        max={50}
                        value={(botParams as BotParamsMap['RSI']).period}
                        onChange={(e) =>
                          setBotParams((p) => ({
                            ...p,
                            period: Number(e.target.value) || 14
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='rsi-overbought' className='text-xs'>
                        Overbought
                      </Label>
                      <Input
                        id='rsi-overbought'
                        type='number'
                        min={50}
                        max={100}
                        value={(botParams as BotParamsMap['RSI']).overbought}
                        onChange={(e) =>
                          setBotParams((p) => ({
                            ...p,
                            overbought: Number(e.target.value) || 70
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='rsi-oversold' className='text-xs'>
                        Oversold
                      </Label>
                      <Input
                        id='rsi-oversold'
                        type='number'
                        min={0}
                        max={50}
                        value={(botParams as BotParamsMap['RSI']).oversold}
                        onChange={(e) =>
                          setBotParams((p) => ({
                            ...p,
                            oversold: Number(e.target.value) || 30
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
                {selectedBot.bot === 'GRID_TRADING' && (
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1'>
                      <Label htmlFor='grid-levels' className='text-xs'>
                        Grid levels
                      </Label>
                      <Input
                        id='grid-levels'
                        type='number'
                        min={2}
                        max={50}
                        value={(botParams as BotParamsMap['GRID_TRADING']).gridLevels}
                        onChange={(e) =>
                          setBotParams((p) => ({
                            ...p,
                            gridLevels: Number(e.target.value) || 10
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='grid-step' className='text-xs'>
                        Step (%)
                      </Label>
                      <Input
                        id='grid-step'
                        type='number'
                        min={0.1}
                        step={0.1}
                        value={(botParams as BotParamsMap['GRID_TRADING']).stepPercent}
                        onChange={(e) =>
                          setBotParams((p) => ({
                            ...p,
                            stepPercent: Number(e.target.value) || 0.5
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
                {selectedBot.bot === 'TREND_FOLLOWING' && (
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1'>
                      <Label htmlFor='trend-ema' className='text-xs'>
                        EMA period
                      </Label>
                      <Input
                        id='trend-ema'
                        type='number'
                        min={5}
                        max={200}
                        value={(botParams as BotParamsMap['TREND_FOLLOWING']).emaPeriod}
                        onChange={(e) =>
                          setBotParams((p) => ({
                            ...p,
                            emaPeriod: Number(e.target.value) || 20
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='trend-strength' className='text-xs'>
                        Trend strength
                      </Label>
                      <Input
                        id='trend-strength'
                        type='number'
                        min={0.5}
                        step={0.5}
                        value={(botParams as BotParamsMap['TREND_FOLLOWING']).trendStrength}
                        onChange={(e) =>
                          setBotParams((p) => ({
                            ...p,
                            trendStrength: Number(e.target.value) || 2
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {error && (
            <p className='text-destructive text-sm' role='alert'>
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setSelectedBot(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={submitting}>
              {submitting ? 'Starting…' : 'Confirm & start bot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
