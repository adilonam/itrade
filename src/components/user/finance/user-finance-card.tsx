'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface UserFinanceCardProps {
  balance: number;
  usedMargin: number;
  equity?: number;
  showMarginLevel?: boolean;
  /** Use trade room panel colors, type scale, and tabular figures (default keeps shadcn card look). */
  variant?: 'default' | 'trade';
}

export function UserFinanceCard({
  balance,
  usedMargin,
  equity,
  showMarginLevel = true,
  variant = 'default'
}: UserFinanceCardProps) {
  const t = useTranslations('Trade.finance');
  const calculatedEquity = equity ?? balance;
  const freeMargin = calculatedEquity - usedMargin;
  const marginLevel =
    usedMargin > 0 ? (calculatedEquity / usedMargin) * 100 : 0;

  const isTrade = variant === 'trade';

  const labelClass = cn(
    'font-medium',
    isTrade
      ? 'text-[11px] text-[var(--trade-text-muted)] sm:text-xs'
      : 'text-xs text-muted-foreground sm:text-sm'
  );

  const valueBase = cn(
    'truncate font-bold',
    isTrade
      ? 'font-mono text-sm tabular-nums sm:text-base'
      : 'text-lg sm:text-2xl'
  );

  const metricCellClass = cn(
    'min-w-0',
    isTrade ? 'space-y-0.5' : 'space-y-1 sm:space-y-2'
  );

  return (
    <Card
      className={cn(
        isTrade && TRADE_ROOM_CARD_CLASS,
        isTrade && 'gap-2 py-2'
      )}
    >
      <CardHeader
        className={cn(isTrade && 'gap-0.5 px-3 pb-0 pt-0 [.border-b]:pb-0')}
      >
        <CardTitle
          className={cn(
            isTrade && 'text-xs font-semibold leading-tight text-[var(--trade-text)] sm:text-sm'
          )}
        >
          {isTrade ? t('title') : 'Account Overview'}
        </CardTitle>
        <CardDescription
          className={cn(
            isTrade &&
              'text-[11px] leading-snug text-[var(--trade-text-muted)] sm:text-xs'
          )}
        >
          {isTrade
            ? t('description')
            : 'Your current financial status and margin information'}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(isTrade && 'px-3 pb-0 pt-2')}>
        <div
          className={cn(
            'grid grid-cols-2',
            isTrade
              ? cn(
                  'gap-x-2 gap-y-1 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-1',
                  showMarginLevel ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
                )
              : cn(
                  'xs:gap-3 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-3',
                  showMarginLevel ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
                )
          )}
        >
          <div className={metricCellClass}>
            <div className={labelClass}>{isTrade ? t('balance') : 'Balance'}</div>
            <div
              className={cn(
                valueBase,
                isTrade && 'text-[var(--trade-text)]'
              )}
            >
              ${balance.toFixed(2)}
            </div>
          </div>

          <div className={metricCellClass}>
            <div className={labelClass}>{isTrade ? t('usedMargin') : 'Used Margin'}</div>
            <div
              className={cn(
                valueBase,
                isTrade ? 'text-amber-500' : 'text-orange-600'
              )}
            >
              ${usedMargin.toFixed(2)}
            </div>
          </div>

          <div className={metricCellClass}>
            <div className={labelClass}>{isTrade ? t('equity') : 'Equity'}</div>
            <div
              className={cn(
                valueBase,
                isTrade
                  ? 'text-[var(--trade-accent-blue)]'
                  : 'text-blue-600'
              )}
            >
              ${calculatedEquity.toFixed(2)}
            </div>
          </div>

          <div className={metricCellClass}>
            <div className={labelClass}>{isTrade ? t('freeMargin') : 'Free Margin'}</div>
            <div
              className={cn(
                valueBase,
                freeMargin >= 0
                  ? isTrade
                    ? 'text-[var(--trade-green)]'
                    : 'text-green-600'
                  : isTrade
                    ? 'text-[var(--trade-red)]'
                    : 'text-red-600'
              )}
            >
              ${freeMargin.toFixed(2)}
            </div>
          </div>

          {showMarginLevel && (
            <div className={cn('col-span-2 sm:col-span-1', metricCellClass)}>
              <div className={labelClass}>{isTrade ? t('marginLevel') : 'Margin Level'}</div>
              <div
                className={cn(
                  valueBase,
                  marginLevel >= 200
                    ? isTrade
                      ? 'text-[var(--trade-green)]'
                      : 'text-green-600'
                    : marginLevel >= 100
                      ? isTrade
                        ? 'text-amber-500'
                        : 'text-yellow-600'
                      : isTrade
                        ? 'text-[var(--trade-red)]'
                        : 'text-red-600'
                )}
              >
                {marginLevel.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
