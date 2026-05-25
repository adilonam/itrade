'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MOCK_CALENDAR, MOCK_NEWS } from './mock-data';
import { IconNews, IconCalendar, IconChartBar, IconInfoCircle } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

/** sidebar: right-edge column; underMarkets: below symbol list in left column */
type NewsVariant = 'sidebar' | 'underMarkets';

interface TradingRoomNewsPanelProps {
  variant?: NewsVariant;
  symbol?: string;
  symbolFullName?: string;
}

export function TradingRoomNewsPanel({
  variant = 'underMarkets',
  symbol = 'EURUSD',
  symbolFullName = 'Euro vs US Dollar'
}: TradingRoomNewsPanelProps) {
  const t = useTranslations('Trade.news');
  const [activeTab, setActiveTab] = useState<'news' | 'calendar' | 'market' | 'symbol'>('news');

  const shell =
    variant === 'underMarkets'
      ? 'h-full min-h-0 border-t border-[var(--trade-border)] bg-[var(--trade-dark)]/40'
      : 'h-full min-h-0 border-l border-[var(--trade-border)] bg-[var(--trade-panel)]';

  const tabTriggerClass =
    'inline-flex h-[calc(100%-1px)] min-h-0 min-w-0 max-w-full flex-1 flex-row items-center justify-center gap-0 overflow-hidden rounded-none border-b-2 border-transparent bg-transparent px-0.5 py-1 text-[10px] font-medium whitespace-normal text-[var(--trade-text-muted)] shadow-none transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--trade-accent-blue)]/40 data-[state=active]:border-[var(--trade-accent-blue)] data-[state=active]:font-bold data-[state=active]:text-[var(--trade-text)] data-[state=active]:shadow-none @[300px]/news-tabs:gap-1 @[300px]/news-tabs:px-1 @[300px]/news-tabs:text-xs';

  const tabLabelClass =
    'hidden min-w-0 flex-1 truncate text-center @[300px]/news-tabs:block';

  return (
    <aside
      className={cn(
        '@container/news-tabs flex min-h-0 h-full min-w-0 flex-1 flex-col overflow-hidden',
        shell
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex h-9 min-w-0 shrink-0 items-center border-b border-[var(--trade-border)]">
          <TabsList className="h-full min-w-0 w-full justify-stretch gap-0 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger
              value="news"
              aria-label={t('news')}
              title={t('news')}
              className={tabTriggerClass}
            >
              <IconNews className="size-3.5 shrink-0 @[300px]/news-tabs:size-3" />
              <span className={tabLabelClass}>{t('news')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              aria-label={t('calendar')}
              title={t('calendar')}
              className={tabTriggerClass}
            >
              <IconCalendar className="size-3.5 shrink-0 @[300px]/news-tabs:size-3" />
              <span className={tabLabelClass}>{t('calendar')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="market"
              aria-label={t('market')}
              title={t('market')}
              className={tabTriggerClass}
            >
              <IconChartBar className="size-3.5 shrink-0 @[300px]/news-tabs:size-3" />
              <span className={tabLabelClass}>{t('market')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="symbol"
              aria-label={t('symbolInfo')}
              title={t('info')}
              className={tabTriggerClass}
            >
              <IconInfoCircle className="size-3.5 shrink-0 @[300px]/news-tabs:size-3" />
              <span className={tabLabelClass}>{t('info')}</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="news"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 p-3">
              {MOCK_NEWS.map((item) => (
                <div
                  key={item.id}
                  className="space-y-1 border-b border-[var(--trade-border)]/60 pb-3 last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded border border-[var(--trade-border)] bg-[var(--trade-dark)]/60 text-[11px] leading-none"
                      title={item.source}
                    >
                      {item.flag ?? item.title.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold leading-snug text-[var(--trade-text)]">
                        {item.title}
                      </div>
                      {item.source ? (
                        <div className="mt-0.5 truncate text-[9px] text-[var(--trade-text-muted)]">
                          {item.source}
                        </div>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--trade-text-muted)]">
                      {item.time}
                    </span>
                  </div>
                  <p className="pl-8 text-[10px] leading-relaxed text-[var(--trade-text-muted)]">
                    {item.snippet}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent
          value="calendar"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <ScrollArea className="min-h-0 flex-1">
            <ul className="space-y-2 p-3">
              {MOCK_CALENDAR.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-start justify-between gap-2 rounded border border-[var(--trade-border)]/80 bg-[var(--trade-dark)]/40 px-2 py-2 text-[10px]"
                >
                  <div>
                    <div className="font-mono text-[var(--trade-text-muted)]">{ev.time}</div>
                    <div className="font-semibold text-[var(--trade-text)]">{ev.title}</div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase',
                      ev.impact === 'high' && 'bg-[var(--trade-red)]/25 text-[var(--trade-red)]',
                      ev.impact === 'medium' &&
                        'bg-[var(--trade-accent-blue)]/20 text-[var(--trade-accent-blue)]',
                      ev.impact === 'low' && 'bg-[var(--trade-border)] text-[var(--trade-text-muted)]'
                    )}
                  >
                    {t(
                      ev.impact === 'high'
                        ? 'impactHigh'
                        : ev.impact === 'medium'
                          ? 'impactMedium'
                          : 'impactLow'
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </TabsContent>
        <TabsContent
          value="market"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-3 text-[10px] text-[var(--trade-text-muted)]">
              <p className="font-semibold text-[var(--trade-text)]">{t('sessionOverview')}</p>
              <p>{t('sessionBody')}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 font-mono">
                <div className="rounded border border-[var(--trade-border)] p-2">
                  <div className="text-[9px] uppercase">VIX</div>
                  <div className="text-[var(--trade-text)]">14.2</div>
                </div>
                <div className="rounded border border-[var(--trade-border)] p-2">
                  <div className="text-[9px] uppercase">DXY</div>
                  <div className="text-[var(--trade-text)]">104.08</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent
          value="symbol"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-3 text-[10px]">
              <div className="text-xs font-bold text-[var(--trade-text)]">{symbol}</div>
              <p className="text-[var(--trade-text-muted)]">{symbolFullName}</p>
              <dl className="grid grid-cols-2 gap-x-2 gap-y-1.5 font-mono">
                <dt className="text-[var(--trade-text-muted)]">{t('digits')}</dt>
                <dd className="text-right text-[var(--trade-text)]">5</dd>
                <dt className="text-[var(--trade-text-muted)]">{t('contract')}</dt>
                <dd className="text-right text-[var(--trade-text)]">100k</dd>
                <dt className="text-[var(--trade-text-muted)]">{t('spreadTyp')}</dt>
                <dd className="text-right text-[var(--trade-green)]">0.1</dd>
                <dt className="text-[var(--trade-text-muted)]">{t('swapLong')}</dt>
                <dd className="text-right text-[var(--trade-text)]">-4.2</dd>
                <dt className="text-[var(--trade-text-muted)]">{t('swapShort')}</dt>
                <dd className="text-right text-[var(--trade-text)]">+1.1</dd>
                <dt className="text-[var(--trade-text-muted)]">{t('margin')}</dt>
                <dd className="text-right text-[var(--trade-text)]">3.33%</dd>
              </dl>
              <p className="pt-2 text-[9px] italic text-[var(--trade-text-muted)]">
                {t('mockSpecs')}
              </p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
