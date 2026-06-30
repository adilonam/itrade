'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
import { isMeaningfulWsErrorMessage } from '@/lib/twelve-data-websocket-manager';
import { cn } from '@/lib/utils';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

interface MarketsWebSocketStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketsWebSocketStatusModal({
  open,
  onOpenChange
}: MarketsWebSocketStatusModalProps) {
  const t = useTranslations('Trade.header.wsStatus');
  const {
    isFallbackMode,
    restOnlyMode,
    isPriceFeedConnected,
    priceFeedStatus,
    subscribedSymbols,
    excludedSymbols,
    desiredSymbols,
    error,
    errorLog
  } = useMarketsWebSocket();

  const connectionLabel =
    priceFeedStatus === 'connecting'
      ? t('connecting')
      : priceFeedStatus === 'connected'
        ? t('connected')
        : t('disconnected');

  const connectionColor =
    priceFeedStatus === 'connecting'
      ? 'text-yellow-400'
      : priceFeedStatus === 'connected'
        ? 'text-[var(--trade-green)]'
        : 'text-red-400';

  const priceSourceLabel =
    restOnlyMode
      ? t('priceSourceRestOnly')
      : isFallbackMode || excludedSymbols.length > 0
        ? excludedSymbols.length > 0 && !isFallbackMode
          ? t('priceSourceMixed')
          : t('priceSourceRest')
        : t('priceSourceWs');

  const symbols = desiredSymbols.length > 0 ? desiredSymbols : subscribedSymbols;

  const isDisconnected = priceFeedStatus === 'disconnected';
  const displayErrors = Array.from(
    new Set(
      [
        ...(isMeaningfulWsErrorMessage(error) ? [error.trim()] : []),
        ...errorLog.filter(isMeaningfulWsErrorMessage)
      ].map((message) => message.trim())
    )
  );
  if (displayErrors.length === 0 && isDisconnected) {
    displayErrors.push(t('connectionError'));
  }
  const showErrorSection = displayErrors.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="watch-trader-shell border-[var(--trade-border)] !bg-[var(--trade-panel,#161b22)] text-[var(--trade-text)] shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--trade-text)]">
            {isPriceFeedConnected || priceFeedStatus === 'connecting' ? (
              <IconWifi className={cn('size-5', connectionColor)} />
            ) : (
              <IconWifiOff className={cn('size-5', connectionColor)} />
            )}
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-[var(--trade-text-muted)]">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2">
            <span className="text-[var(--trade-text-muted)]">{t('connectionStatus')}</span>
            <span className={cn('font-medium', connectionColor)}>{connectionLabel}</span>
          </div>

          <div className="flex items-center justify-between rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2">
            <span className="text-[var(--trade-text-muted)]">{t('priceSource')}</span>
            <span
              className={cn(
                'font-medium',
                restOnlyMode || isFallbackMode || excludedSymbols.length > 0
                  ? 'text-yellow-400'
                  : 'text-[var(--trade-green)]'
              )}
            >
              {priceSourceLabel}
            </span>
          </div>

          {restOnlyMode ? (
            <div className="rounded border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-300">
              <p>{t('restOnlyNotice')}</p>
            </div>
          ) : isFallbackMode ? (
            <div className="rounded border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-300">
              <p>{t('rateLimitNotice')}</p>
            </div>
          ) : null}

          <div className="rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2">
            <p className="mb-2 text-[var(--trade-text-muted)]">
              {t('subscribedMarkets', { count: symbols.length })}
            </p>
            {symbols.length === 0 ? (
              <p className="text-xs text-[var(--trade-text-muted)]">{t('noSubscriptions')}</p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
                {symbols.map((symbol) => (
                  <li
                    key={symbol}
                    className="flex items-center justify-between rounded px-1.5 py-0.5 hover:bg-[var(--trade-panel)]"
                  >
                    <span>{symbol}</span>
                    {subscribedSymbols.includes(symbol) ? (
                      <span className="text-[10px] text-[var(--trade-green)]">
                        {t('wsActive')}
                      </span>
                    ) : excludedSymbols.includes(symbol) || restOnlyMode || isFallbackMode ? (
                      <span className="text-[10px] text-yellow-400">{t('restOnly')}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showErrorSection ? (
            <div className="space-y-1 rounded border border-[var(--trade-red)]/40 bg-[var(--trade-dark,#12151c)] px-3 py-2 text-xs text-[var(--trade-red,#ff6b8a)]">
              {displayErrors.length === 1 ? (
                <p>{displayErrors[0]}</p>
              ) : (
                <ul className="space-y-1">
                  {displayErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
