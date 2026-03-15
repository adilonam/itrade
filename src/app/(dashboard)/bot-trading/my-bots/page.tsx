'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconRobot,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconChartLine,
  IconTrendingUp,
  IconRefresh
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Bot } from '@/lib/prisma/generated/client';
import { UserPositionsTableCardRoomTrading } from '@/components/user/positions/user-positions-table-room-trading';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    amount
  );

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

function formatDuration(dateStart: string, dateStop: string) {
  const now = Date.now();
  const start = new Date(dateStart).getTime();
  const stop = new Date(dateStop).getTime();
  if (now < start) return 'Scheduled';
  if (now > stop) return 'Ended';
  const diffMs = now - start;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getBotDisplayName(bot: Bot): string {
  switch (bot) {
    case 'RSI':
      return 'RSI Bot';
    case 'GRID_TRADING':
      return 'Grid Trading';
    case 'TREND_FOLLOWING':
      return 'Trend Following';
    default:
      return String(bot);
  }
}

function getBotStrategyLabel(bot: Bot): string {
  switch (bot) {
    case 'RSI':
      return 'RSI';
    case 'GRID_TRADING':
      return 'Grid';
    case 'TREND_FOLLOWING':
      return 'Trend';
    default:
      return String(bot);
  }
}

function getBotStatus(
  dateStart: string,
  dateStop: string,
  active: boolean
): 'RUNNING' | 'STOPPED' | 'SCHEDULED' | 'PAUSED' {
  const now = Date.now();
  const start = new Date(dateStart).getTime();
  const stop = new Date(dateStop).getTime();
  if (now > stop) return 'STOPPED';
  if (now < start) return 'SCHEDULED';
  if (!active) return 'PAUSED';
  return 'RUNNING';
}

const BOT_STATUS_TABS = [
  { id: 'active', label: 'Active bots', icon: IconPlayerPlay },
  { id: 'paused', label: 'Paused bots', icon: IconPlayerPause },
  { id: 'ended', label: 'Ended bots', icon: IconPlayerStop }
] as const;

interface BotUserFromApi {
  id: string;
  userId: string;
  bot: Bot;
  dateStart: string;
  dateStop: string;
  quantityLot: number;
  marketId: string;
  botParams: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  market: {
    id: string;
    symbol: string;
    name: string;
  };
}

const STRATEGY_ICON: Record<string, React.ReactNode> = {
  RSI: <IconChartLine className='h-5 w-5' />,
  Grid: <IconTrendingUp className='h-5 w-5' />,
  Trend: <IconTrendingUp className='h-5 w-5' />
};

export default function MyBotsPage() {
  const [bots, setBots] = useState<BotUserFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [botStatusFilter, setBotStatusFilter] = useState<
    'active' | 'paused' | 'ended'
  >('active');

  const updateBot = async (id: string, action: 'pause' | 'stop' | 'resume') => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/user/bot-trading/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Failed to ${action} bot`);
        return;
      }
      setBots((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...data.botUser } : b))
      );
    } catch {
      setError(`Failed to ${action} bot`);
    } finally {
      setActioningId(null);
    }
  };

  const fetchBots = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/user/bot-trading');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load bots');
        setBots([]);
        return;
      }
      setBots(data.bots ?? []);
    } catch {
      setError('Failed to load bots');
      setBots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-8'>
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1'>
            <Heading
              title='Bot Management'
              description='Monitor your active automated strategies.'
            />
          </div>
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex items-center gap-2 rounded-lg px-4 py-2'>
              <span className='bg-primary size-2 animate-pulse rounded-full' />
              <span className='text-muted-foreground text-xs font-bold uppercase tracking-wider'>
                Live System Status
              </span>
            </div>
            <Button variant='outline' size='sm' onClick={fetchBots} disabled={loading}>
              <IconRefresh className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button asChild>
              <Link href='/bot-trading'>
                <IconRobot className='mr-2 h-4 w-4' />
                Browse marketplace
              </Link>
            </Button>
          </div>
        </div>
        <Separator />

        {error && (
          <Card className='border-destructive/50 bg-destructive/5'>
            <CardContent className='flex items-center justify-between py-4'>
              <p className='text-destructive text-sm'>{error}</p>
              <Button variant='outline' size='sm' onClick={fetchBots}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && bots.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <IconRefresh className='text-muted-foreground mb-4 h-10 w-10 animate-spin' />
              <p className='text-muted-foreground'>Loading your bots…</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className='space-y-4'>
              {(() => {
                const filteredBots = bots
                  .map((bot) => ({
                    bot,
                    status: getBotStatus(
                      bot.dateStart,
                      bot.dateStop,
                      bot.active ?? true
                    )
                  }))
                  .filter(({ status }) => {
                    if (botStatusFilter === 'active')
                      return status === 'RUNNING' || status === 'SCHEDULED';
                    if (botStatusFilter === 'paused') return status === 'PAUSED';
                    return status === 'STOPPED';
                  });
                return (
                  <>
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                      <h3 className='text-xl font-bold'>Trading Bots</h3>
                      <div className='flex gap-1 rounded-lg bg-muted/50 p-1'>
                        {BOT_STATUS_TABS.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <Button
                              key={tab.id}
                              variant={botStatusFilter === tab.id ? 'default' : 'ghost'}
                              size='sm'
                              className='rounded-md'
                              onClick={() =>
                                setBotStatusFilter(tab.id as 'active' | 'paused' | 'ended')
                              }
                            >
                              <Icon className='mr-1.5 h-4 w-4' />
                              {tab.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                      {filteredBots.length === 0 ? (
                        <Card className='sm:col-span-2 lg:col-span-3'>
                          <CardContent className='flex flex-col items-center justify-center py-12'>
                            <p className='text-muted-foreground text-center'>
                              {botStatusFilter === 'active' &&
                                'No active or scheduled bots.'}
                              {botStatusFilter === 'paused' && 'No paused bots.'}
                              {botStatusFilter === 'ended' && 'No ended bots.'}
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        filteredBots.map(({ bot, status }) => {
                          const strategy = getBotStrategyLabel(bot.bot);
                          const isActioning = actioningId === bot.id;
                          return (
                            <Card
                              key={bot.id}
                              className='border-border/50 transition-all hover:border-primary/30'
                            >
                              <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-primary'>
                                    {STRATEGY_ICON[strategy] ?? <IconRobot className='h-5 w-5' />}
                                  </span>
                                  <span className='text-muted-foreground text-xs font-bold uppercase tracking-widest'>
                                    {strategy}
                                  </span>
                                </div>
                                <Badge
                                  className={cn(
                                    'text-[10px] font-bold uppercase',
                                    status === 'RUNNING' && 'bg-primary/10 text-primary',
                                    status === 'STOPPED' && 'bg-muted text-muted-foreground',
                                    status === 'SCHEDULED' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                                    status === 'PAUSED' && 'bg-muted text-amber-600 dark:text-amber-400'
                                  )}
                                >
                                  {status}
                                </Badge>
                              </CardHeader>
                              <CardContent className='space-y-4'>
                                <h4 className='text-xl font-bold'>{getBotDisplayName(bot.bot)}</h4>
                                <p className='text-muted-foreground text-sm'>
                                  {bot.market.symbol} – {bot.market.name}
                                </p>
                                <div className='space-y-4'>
                                  <div className='grid grid-cols-2 gap-2'>
                                    <div className='flex flex-col'>
                                      <span className='text-muted-foreground text-[10px] font-bold uppercase'>
                                        Lot size
                                      </span>
                                      <span className='text-sm font-medium'>{bot.quantityLot}</span>
                                    </div>
                                    <div className='flex flex-col'>
                                      <span className='text-muted-foreground text-[10px] font-bold uppercase'>
                                        Duration
                                      </span>
                                      <span className='text-sm'>
                                        {formatDuration(bot.dateStart, bot.dateStop)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className='grid grid-cols-2 gap-2 border-t border-border/50 pt-4'>
                                    <div className='flex flex-col'>
                                      <span className='text-muted-foreground text-[10px] font-bold uppercase'>
                                        Start
                                      </span>
                                      <span className='text-xs'>{formatDate(bot.dateStart)}</span>
                                    </div>
                                    <div className='flex flex-col'>
                                      <span className='text-muted-foreground text-[10px] font-bold uppercase'>
                                        Stop
                                      </span>
                                      <span className='text-xs'>{formatDate(bot.dateStop)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className='mt-6 flex gap-3'>
                                  {status === 'RUNNING' && (
                                    <Button
                                      variant='secondary'
                                      className='flex-1'
                                      size='sm'
                                      disabled={isActioning}
                                      onClick={() => updateBot(bot.id, 'pause')}
                                    >
                                      <IconPlayerPause className='mr-1 h-3 w-3' />
                                      Pause
                                    </Button>
                                  )}
                                  {status === 'PAUSED' && (
                                    <Button
                                      variant='secondary'
                                      className='flex-1'
                                      size='sm'
                                      disabled={isActioning}
                                      onClick={() => updateBot(bot.id, 'resume')}
                                    >
                                      <IconPlayerPlay className='mr-1 h-3 w-3' />
                                      Resume
                                    </Button>
                                  )}
                                  {(status === 'SCHEDULED' || status === 'RUNNING' || status === 'PAUSED') && (
                                    <Button
                                      variant='ghost'
                                      className='flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive'
                                      size='sm'
                                      disabled={isActioning}
                                      onClick={() => updateBot(bot.id, 'stop')}
                                    >
                                      Stop
                                    </Button>
                                  )}
                                  {status === 'STOPPED' && (
                                    <span className='text-muted-foreground flex flex-1 items-center text-sm'>
                                      Ended
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </section>

            {bots.length > 0 && (
              <section className='space-y-4'>
                <h3 className='text-xl font-bold'>Opened Positions</h3>
                <UserPositionsTableCardRoomTrading />
              </section>
            )}

            {bots.length === 0 && !loading && (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <IconRobot className='text-muted-foreground mb-4 h-12 w-12' />
                  <p className='text-muted-foreground mb-2 text-center'>
                    You have no bots yet.
                  </p>
                  <Button asChild>
                    <Link href='/bot-trading'>Browse Bot Marketplace</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
