'use client';

import { useEffect, useMemo, useState } from 'react';
import { ViewType } from '@/types';
import { MarketCard } from './market-card';
import { MarketList } from './market-list';
import { ViewToggle } from './view-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Market } from '@prisma/client';
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconWifi,
  IconWifiOff,
  IconRefresh
} from '@tabler/icons-react';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';

interface StockMarketsViewProps {
  markets?: Market[];
}

export function StockMarketsView({
  markets: initialMarkets = []
}: StockMarketsViewProps) {
  const [currentView, setCurrentView] = useState<ViewType>('cards');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // WebSocket context
  const {
    isConnected,
    isConnecting,
    error: wsError,
    updateMarkets,
    refreshPrices
  } = useMarketsWebSocket();

  useEffect(() => {
    async function loadMarkets() {
      try {
        const res = await fetch('/api/markets/get-stock-markets', {
          method: 'GET'
        });
        if (!res.ok) return;
        const { markets: dbMarkets } = (await res.json()) as {
          markets: Market[];
        };

        setMarkets(dbMarkets);
        // Update WebSocket context with new markets
        updateMarkets(dbMarkets);
      } catch (err) {
        // Best-effort; keep initial markets if any
      }
    }

    // Only fetch if we don't have markets yet
    if (markets.length === 0) {
      loadMarkets();
    }
  }, [markets.length, updateMarkets]); // Include dependencies to satisfy linter

  const filteredMarkets = useMemo(() => {
    let filtered = markets;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((market) => {
        const marketType = market.type.toLowerCase();
        return marketType === selectedType.toLowerCase();
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (market) =>
          market.symbol.toLowerCase().includes(query) ||
          market.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [markets, selectedType, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMarkets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMarkets = filteredMarkets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, searchQuery]);

  const marketTypes = useMemo(() => {
    const types = new Set(markets.map((m) => m.type.toLowerCase()));
    return Array.from(types).sort();
  }, [markets]);

  const marketCounts = useMemo(() => {
    const counts: Record<string, number> = { all: markets.length };
    marketTypes.forEach((type) => {
      counts[type] = markets.filter(
        (m) => m.type.toLowerCase() === type
      ).length;
    });
    return counts;
  }, [markets, marketTypes]);

  return (
    <div className='space-y-6'>
      {/* WebSocket Status */}
      {wsError && (
        <Alert variant='destructive'>
          <AlertDescription>WebSocket Error: {wsError}</AlertDescription>
        </Alert>
      )}

      {/* Header Controls */}
      <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div className='flex items-center space-x-2'>
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedType('all')}
          >
            All Stocks
            <Badge variant='secondary' className='ml-2'>
              {marketCounts.all}
            </Badge>
          </Button>
          {marketTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              <Badge variant='secondary' className='ml-2'>
                {marketCounts[type]}
              </Badge>
            </Button>
          ))}
        </div>

        <div className='flex items-center space-x-4'>
          {/* WebSocket Status Indicator */}
          <div className='flex items-center space-x-2'>
            {isConnected ? (
              <div className='flex items-center space-x-1 text-green-600'>
                <IconWifi className='h-4 w-4' />
                <span className='text-xs font-medium'>Live</span>
              </div>
            ) : isConnecting ? (
              <div className='flex items-center space-x-1 text-yellow-600'>
                <IconWifiOff className='h-4 w-4' />
                <span className='text-xs font-medium'>Connecting...</span>
              </div>
            ) : (
              <div className='flex items-center space-x-1 text-gray-500'>
                <IconWifiOff className='h-4 w-4' />
                <span className='text-xs font-medium'>Offline</span>
              </div>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={refreshPrices}
              disabled={!isConnected}
              className='h-7 px-2'
            >
              <IconRefresh className='h-3 w-3' />
            </Button>
          </div>

          <div className='relative'>
            <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='Search stocks...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-64 pl-10'
            />
          </div>
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
        </div>
      </div>

      {/* Results Info */}
      <div className='text-muted-foreground flex items-center justify-between text-sm'>
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredMarkets.length)}{' '}
          of {filteredMarkets.length} stocks
          {selectedType !== 'all' &&
            ` (${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)})`}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Market Display */}
      {filteredMarkets.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>
            No stocks found matching your criteria.
          </p>
        </div>
      ) : currentView === 'cards' ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {paginatedMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              tradingRoute='/dashboard/stock-trading'
            />
          ))}
        </div>
      ) : (
        <MarketList
          markets={paginatedMarkets}
          tradingRoute='/dashboard/stock-trading'
        />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center space-x-2 pt-6'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <IconChevronLeft className='h-4 w-4' />
            Previous
          </Button>

          <div className='flex items-center space-x-1'>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size='sm'
                onClick={() => setCurrentPage(page)}
                className='h-8 w-8 p-0'
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
            <IconChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
