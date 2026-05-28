'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DashboardOverviewTradeAnalytics,
  type FinancialSnapshot
} from '@/components/dashboard/dashboard-overview-trade-analytics';
import type { DashboardPosition } from '@/lib/dashboard-position-analytics';
import { useTranslations } from 'next-intl';

interface UserLite {
  name: string | null;
  email: string;
}

interface DashboardData {
  user: UserLite;
  financialReal: FinancialSnapshot;
  financialDemo: FinancialSnapshot;
  positions: DashboardPosition[];
}

export function DashboardOverview() {
  const t = useTranslations('Overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        financialRealRes,
        financialDemoRes,
        positionsRes,
        userRes
      ] = await Promise.all([
        fetch('/api/user/financial?balanceType=REAL'),
        fetch('/api/user/financial?balanceType=DEMO'),
        fetch('/api/user/positions?limit=5000&status=PLACED,CLOSED'),
        fetch('/api/user/profile?balanceType=REAL')
      ]);

      if (
        !financialRealRes.ok ||
        !financialDemoRes.ok ||
        !positionsRes.ok ||
        !userRes.ok
      ) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [
        financialReal,
        financialDemo,
        positionsJson,
        userResponse
      ] = await Promise.all([
        financialRealRes.json(),
        financialDemoRes.json(),
        positionsRes.json(),
        userRes.json()
      ]);

      const raw = (positionsJson.positions ?? []) as DashboardPosition[];

      setData({
        user: {
          name: userResponse.user.name,
          email: userResponse.user.email
        },
        financialReal,
        financialDemo,
        positions: raw
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--trade-text)]">
            {t('title')}
          </h2>
          <p className="text-sm text-[var(--trade-text-muted)]">
            {t('welcome', { name: data.user.name || data.user.email })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] hover:bg-[var(--trade-border)]"
          onClick={loadDashboardData}
          disabled={loading}
        >
          <IconRefresh
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          {t('refresh')}
        </Button>
      </div>

      <DashboardOverviewTradeAnalytics
        positions={data.positions}
        financialReal={data.financialReal}
        financialDemo={data.financialDemo}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded bg-[var(--trade-border)]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg bg-[var(--trade-border)]"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-[var(--trade-border)]" />
    </div>
  );
}
