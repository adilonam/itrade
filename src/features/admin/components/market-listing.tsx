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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  parseAsInteger,
  parseAsString,
  useQueryStates,
  parseAsStringEnum
} from 'nuqs';
import {
  IconPlus,
  IconExternalLink,
  IconLockOpen,
  IconLock,
  IconSearch
} from '@tabler/icons-react';
import { toast } from 'sonner';

type MarketListingPageProps = {};

const MARKET_TYPES = ['FOREX', 'CRYPTO', 'STOCKS', 'COMMODITIES', 'INDICES'];

export default function MarketListingPage({}: MarketListingPageProps) {
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [openMarket, setOpenMarket] = useState<boolean>(true);
  const [openMarketLoading, setOpenMarketLoading] = useState(false);
  const [openMarketSettingLoading, setOpenMarketSettingLoading] = useState(true);

  // Use query states to sync with URL parameters
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString,
    type: parseAsStringEnum(MARKET_TYPES),
    visible: parseAsString
  });

  const [tableFilter, setTableFilter] = useState(queryParams.search ?? '');

  useEffect(() => {
    setTableFilter(queryParams.search ?? '');
  }, [queryParams.search]);

  const commitTableFilter = useDebouncedCallback((value: string) => {
    const trimmed = value.trim();
    void setQueryParams({
      search: trimmed ? trimmed : null,
      page: 1
    });
  }, 400);

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

  const loadOpenMarket = useCallback(async () => {
    try {
      setOpenMarketSettingLoading(true);
      const res = await fetch('/api/admin/app-settings');
      if (res.ok) {
        const data = await res.json();
        setOpenMarket(data.openMarket ?? true);
      }
    } catch {
      setOpenMarket(true);
    } finally {
      setOpenMarketSettingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpenMarket();
  }, [loadOpenMarket]);

  const handleOpenMarketChange = async (checked: boolean) => {
    try {
      setOpenMarketLoading(true);
      const res = await fetch('/api/admin/app-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openMarket: checked })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update');
      }
      setOpenMarket(checked);
      toast.success(
        checked
          ? 'Market opened. Users can create and close positions.'
          : 'Market closed. Only admins can create or close positions.'
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update setting');
    } finally {
      setOpenMarketLoading(false);
    }
  };

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
      <Card className='mb-6'>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-base'>
            {openMarket ? (
              <IconLockOpen className='h-5 w-5 text-green-600' />
            ) : (
              <IconLock className='h-5 w-5 text-amber-600' />
            )}
            Open market
          </CardTitle>
          <CardDescription>
            When on, users can create and close positions. When off, only Admin and Superadmin can.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex items-center gap-3'>
          {openMarketSettingLoading ? (
            <span className='text-muted-foreground text-sm'>Loading...</span>
          ) : (
            <>
              <Switch
                id='open-market'
                checked={openMarket}
                onCheckedChange={handleOpenMarketChange}
                disabled={openMarketLoading}
              />
              <Label htmlFor='open-market' className='text-sm font-medium'>
                {openMarket ? 'Market open' : 'Market closed'}
              </Label>
            </>
          )}
        </CardContent>
      </Card>

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex max-w-lg flex-1 flex-col gap-1.5'>
          <Label htmlFor='market-table-filter' className='text-muted-foreground text-xs'>
            Filter table
          </Label>
          <div className='relative'>
            <IconSearch
              className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2'
              aria-hidden
            />
            <Input
              id='market-table-filter'
              type='search'
              value={tableFilter}
              onChange={(e) => {
                const v = e.target.value;
                setTableFilter(v);
                commitTableFilter(v);
              }}
              placeholder='Search symbol, name, type, room, prices, visible/hidden, date…'
              className='h-9 pl-9'
              autoComplete='off'
            />
          </div>
        </div>
        <div className='flex shrink-0 items-center justify-end gap-2'>
          <Button
            variant='outline'
            onClick={() =>
              window.open('https://twelvedata.com/markets', '_blank')
            }
          >
            <IconExternalLink className='mr-2 h-4 w-4' />
            Available Data
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <IconPlus className='mr-2 h-4 w-4' />
            Add Market
          </Button>
        </div>
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
