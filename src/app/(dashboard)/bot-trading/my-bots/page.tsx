'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MOCK_MY_BOTS,
  MOCK_BOT_POSITIONS,
  type MyBotItem,
  type BotPositionItem
} from '@/constants/bot-trading-mock';
import {
  IconRobot,
  IconPlayerPlay,
  IconPlayerPause,
  IconChartLine,
  IconTrendingUp
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

function formatDuration(startedAt: string) {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const STRATEGY_ICON: Record<string, React.ReactNode> = {
  Momentum: <IconChartLine className='h-5 w-5' />,
  Grid: <IconTrendingUp className='h-5 w-5' />
};

export default function MyBotsPage() {
  const positionsByBot = MOCK_BOT_POSITIONS.reduce(
    (acc, pos) => {
      if (!acc[pos.myBotId]) acc[pos.myBotId] = [];
      acc[pos.myBotId].push(pos);
      return acc;
    },
    {} as Record<string, BotPositionItem[]>
  );

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-8'>
        {/* Header - Stitch Bot Management style */}
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1'>
            <Heading
              title='Bot Management'
              description='Monitoring active automated strategies in real-time. Mock data.'
            />
          </div>
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex items-center gap-2 rounded-lg px-4 py-2'>
              <span className='bg-primary size-2 animate-pulse rounded-full' />
              <span className='text-muted-foreground text-xs font-bold uppercase tracking-wider'>
                Live System Status
              </span>
            </div>
            <Button asChild>
              <Link href='/bot-trading'>
                <IconRobot className='mr-2 h-4 w-4' />
                Browse marketplace
              </Link>
            </Button>
          </div>
        </div>
        <Separator />

        {/* Active Trading Bots - Stitch card grid */}
        <section className='space-y-4'>
          <h3 className='text-xl font-bold flex items-center gap-2'>
            <IconPlayerPlay className='text-primary h-6 w-6' />
            Active Trading Bots
          </h3>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {MOCK_MY_BOTS.map((bot) => (
              <Card
                key={bot.id}
                className='border-border/50 transition-all hover:border-primary/30'
              >
                <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-primary'>
                      {STRATEGY_ICON[bot.strategy] ?? <IconRobot className='h-5 w-5' />}
                    </span>
                    <span className='text-muted-foreground text-xs font-bold uppercase tracking-widest'>
                      {bot.strategy}
                    </span>
                  </div>
                  <Badge className='bg-primary/10 text-primary text-[10px] font-bold uppercase'>
                    {bot.status}
                  </Badge>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <h4 className='text-xl font-bold'>{bot.botName}</h4>
                  <div className='space-y-4'>
                    <div className='flex flex-col'>
                      <span className='text-muted-foreground mb-1 text-[10px] font-bold uppercase'>
                        Total PNL
                      </span>
                      <span
                        className={cn(
                          'text-2xl font-black',
                          bot.pnl >= 0 ? 'text-primary' : 'text-destructive'
                        )}
                      >
                        {bot.pnl >= 0 ? '+' : ''}
                        {formatCurrency(bot.pnl)}{' '}
                        <span className='text-sm font-bold opacity-80'>
                          ({bot.pnlPercent >= 0 ? '+' : ''}{bot.pnlPercent}%)
                        </span>
                      </span>
                    </div>
                    <div className='grid grid-cols-2 gap-4 border-t border-border/50 pt-4'>
                      <div className='flex flex-col'>
                        <span className='text-muted-foreground text-[10px] font-bold uppercase'>
                          Duration
                        </span>
                        <span className='text-sm'>{formatDuration(bot.startedAt)}</span>
                      </div>
                      <div className='flex flex-col'>
                        <span className='text-muted-foreground text-[10px] font-bold uppercase'>
                          Status
                        </span>
                        <span className='text-primary text-sm'>{bot.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className='mt-6 flex gap-3'>
                    <Button
                      variant='secondary'
                      className='flex-1'
                      size='sm'
                    >
                      {bot.status === 'RUNNING' ? (
                        <>
                          <IconPlayerPause className='mr-1 h-3 w-3' />
                          Pause
                        </>
                      ) : (
                        <>
                          <IconPlayerPlay className='mr-1 h-3 w-3' />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      variant='ghost'
                      className='flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive'
                      size='sm'
                    >
                      Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Opened positions table */}
        {MOCK_MY_BOTS.length > 0 && (
          <section className='space-y-4'>
            <h3 className='text-xl font-bold'>Opened Positions</h3>
            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        <th className='px-4 py-3 text-left font-medium'>Bot</th>
                        <th className='px-4 py-3 text-left font-medium'>Symbol</th>
                        <th className='px-4 py-3 text-left font-medium'>Type</th>
                        <th className='px-4 py-3 text-right font-medium'>Quantity</th>
                        <th className='px-4 py-3 text-right font-medium'>Entry</th>
                        <th className='px-4 py-3 text-right font-medium'>Current</th>
                        <th className='px-4 py-3 text-right font-medium'>P&L</th>
                        <th className='px-4 py-3 text-left font-medium'>Opened</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_BOT_POSITIONS.map((pos) => {
                        const bot = MOCK_MY_BOTS.find((b) => b.id === pos.myBotId);
                        return (
                          <tr key={pos.id} className='border-b last:border-0'>
                            <td className='px-4 py-3 font-medium'>
                              {bot?.botName ?? '-'}
                            </td>
                            <td className='px-4 py-3'>{pos.symbol}</td>
                            <td className='px-4 py-3'>
                              <span
                                className={cn(
                                  pos.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                                )}
                              >
                                {pos.type}
                              </span>
                            </td>
                            <td className='px-4 py-3 text-right'>{pos.quantity}</td>
                            <td className='px-4 py-3 text-right'>
                              {pos.entryPrice.toFixed(4)}
                            </td>
                            <td className='px-4 py-3 text-right'>
                              {pos.currentPrice.toFixed(4)}
                            </td>
                            <td
                              className={cn(
                                'px-4 py-3 text-right font-medium',
                                pos.pnl >= 0 ? 'text-primary' : 'text-destructive'
                              )}
                            >
                              {pos.pnl >= 0 ? '+' : ''}
                              {formatCurrency(pos.pnl)}
                            </td>
                            <td className='text-muted-foreground px-4 py-3 text-left text-xs'>
                              {formatDate(pos.openedAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {MOCK_MY_BOTS.length === 0 && (
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
      </div>
    </PageContainer>
  );
}
