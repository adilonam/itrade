'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { UserFinanceCard } from '@/components/user/finance/user-finance-card';
import {
  UserPositionsTableRoomTrading,
  type PositionsTablePagination
} from '@/components/user/positions/user-positions-table-room-trading';
import type { Market, Position } from '@/lib/prisma/generated/client';
import { useTradeBalanceSelection } from '@/hooks/use-trade-balance-selection';

type PositionWithMarket = Position & {
  market: Market | null;
};

type FinancialData = {
  balance: number;
  usedMargin: number;
  equity: number;
};

export function TradingPortfolioOverview() {
  const t = useTranslations('Trade.portfolioPage');
  const { selectedBalanceType } = useTradeBalanceSelection();
  const [positions, setPositions] = useState<PositionWithMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [realTimePnL, setRealTimePnL] = useState<Record<string, number>>({});
  const [closingPositionIds, setClosingPositionIds] = useState<
    Record<string, boolean>
  >({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    pages: number;
  } | null>(null);

  const loadPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        room: 'TRADING',
        balanceType: selectedBalanceType
      });

      const response = await fetch(`/api/user/positions?${params}`);
      if (!response.ok) throw new Error(t('errors.loadPositions'));

      const data = await response.json();
      const fetchedPositions = Array.isArray(data?.positions)
        ? (data.positions as PositionWithMarket[])
        : [];
      setPositions(fetchedPositions);

      const p = data?.pagination;
      if (p && typeof p.total === 'number' && typeof p.pages === 'number') {
        setPaginationMeta({ total: p.total, pages: Math.max(1, p.pages) });
      } else {
        setPaginationMeta(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadPositions'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedBalanceType, t]);

  const loadFinancial = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/user/financial?room=TRADING&balanceType=${selectedBalanceType}`
      );
      if (!response.ok) throw new Error(t('errors.loadFinancial'));

      const data = await response.json();
      setFinancial({
        balance: typeof data?.balance === 'number' ? data.balance : 0,
        usedMargin: typeof data?.usedMargin === 'number' ? data.usedMargin : 0,
        equity: typeof data?.equity === 'number' ? data.equity : 0
      });
    } catch {
      // Keep UI usable when finance endpoint is temporarily unavailable.
      setFinancial(null);
    }
  }, [selectedBalanceType, t]);

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    void loadFinancial();
    const id = setInterval(() => {
      void loadFinancial();
    }, 15_000);
    return () => clearInterval(id);
  }, [loadFinancial]);

  useEffect(() => {
    if (paginationMeta && page > paginationMeta.pages && paginationMeta.pages >= 1) {
      setPage(paginationMeta.pages);
    }
  }, [paginationMeta, page]);

  const handleClosePosition = useCallback(
    async (positionId: string) => {
      try {
        setClosingPositionIds((prev) => ({ ...prev, [positionId]: true }));

        const response = await fetch(`/api/user/positions/${positionId}/close`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'CLOSED',
            balanceType: selectedBalanceType
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            typeof payload?.error === 'string'
              ? payload.error
              : t('errors.closePosition')
          );
        }

        toast.success(t('closeSuccess'));
        await Promise.all([loadPositions(), loadFinancial()]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t('errors.closePosition')
        );
      } finally {
        setClosingPositionIds((prev) => {
          const next = { ...prev };
          delete next[positionId];
          return next;
        });
      }
    },
    [loadFinancial, loadPositions, selectedBalanceType, t]
  );

  const updateRealTimePnL = useCallback((positionId: string, pnl: number) => {
    setRealTimePnL((prev) => ({ ...prev, [positionId]: pnl }));
  }, []);

  const pagination: PositionsTablePagination | undefined = useMemo(() => {
    if (!paginationMeta || paginationMeta.total <= 0) return undefined;
    return {
      page,
      pageSize,
      total: paginationMeta.total,
      totalPages: paginationMeta.pages,
      onPageChange: setPage,
      onPageSizeChange: setPageSize
    };
  }, [page, pageSize, paginationMeta]);

  return (
    <div className="flex min-h-0 w-full flex-col gap-4 p-3 md:p-4">
      <section className="space-y-1">
        <h1 className="text-base font-semibold text-[var(--trade-text)] md:text-lg">
          {t('title')}
        </h1>
        <p className="text-xs text-[var(--trade-text-muted)] md:text-sm">
          {t('description')}
        </p>
      </section>

      {financial ? (
        <UserFinanceCard
          variant="trade"
          balance={financial.balance}
          usedMargin={financial.usedMargin}
          equity={financial.equity}
          showMarginLevel
        />
      ) : null}

      {error ? (
        <div className="rounded border border-[var(--trade-border)] bg-[var(--trade-panel)] p-3 text-xs text-red-400">
          {error}
        </div>
      ) : null}

      <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded border border-[var(--trade-border)] bg-[var(--trade-panel)]">
        <div className="border-b border-[var(--trade-border)] px-3 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--trade-text-muted)]">
            {t('positionsTitle')}
          </h2>
        </div>
        <div className="min-h-0 flex-1">
          <UserPositionsTableRoomTrading
            positions={positions}
            loading={loading}
            onUpdateRealTimePnL={updateRealTimePnL}
            realTimePnL={realTimePnL}
            onClosePosition={handleClosePosition}
            closingPositionIds={closingPositionIds}
            panelVariant="trade"
            embeddedInTradePanel
            showCloseAction
            pagination={pagination}
          />
        </div>
      </section>
    </div>
  );
}
