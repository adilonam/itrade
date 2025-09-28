'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AdminMarket,
  fetchMarkets,
  GetMarketsParams
} from '../services/markets';
import { MarketTable } from './market-tables';
import { columns } from './market-tables/columns';
import { AddMarketDialog } from './add-market-dialog';
import { Button } from '@/components/ui/button';
import {
  parseAsInteger,
  parseAsString,
  useQueryStates,
  parseAsStringEnum
} from 'nuqs';
import { IconPlus } from '@tabler/icons-react';

type MarketListingPageProps = {};

const MARKET_TYPES = ['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES'];

export default function MarketListingPage({}: MarketListingPageProps) {
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Use query states to sync with URL parameters
  const [queryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString,
    type: parseAsStringEnum(MARKET_TYPES),
    visible: parseAsString
  });

  const loadMarkets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: GetMarketsParams = {
        page: queryParams.page,
        limit: queryParams.perPage,
        ...(queryParams.search && { search: queryParams.search }),
        ...(queryParams.type && { type: queryParams.type as any }),
        ...(queryParams.visible && {
          visible: queryParams.visible === 'true'
        })
      };

      const data = await fetchMarkets(params);
      setMarkets(data.markets);
      setTotalMarkets(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch markets');
    } finally {
      setIsLoading(false);
    }
  }, [
    queryParams.page,
    queryParams.perPage,
    queryParams.search,
    queryParams.type,
    queryParams.visible
  ]);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  if (isLoading) {
    return (
      <div className='flex justify-center py-6'>
        <div className='text-muted-foreground'>Loading markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center py-6'>
        <div className='text-red-600'>Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-4 flex justify-end'>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <IconPlus className='mr-2 h-4 w-4' />
          Add Market
        </Button>
      </div>

      <MarketTable
        data={markets}
        totalItems={totalMarkets}
        columns={columns}
        onDataChange={loadMarkets}
      />

      <AddMarketDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={loadMarkets}
      />
    </>
  );
}
