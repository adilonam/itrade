'use client';

import { useEffect, useMemo, useState } from 'react';
import { MarketCard } from './market-card';
import { MarketList } from './market-list';
import { ViewToggle } from './view-toggle';
import { Button } from '@/components/ui/button';
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

interface MarketTradingProps {
  markets?: Market[];
}

export function TradingMarketsView({
  markets: initialMarkets = []
}: MarketTradingProps) {
  const [currentView, setCurrentView] = useState<'cards' | 'list'>('cards');
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
    realTimePrices,
    updateMarkets,
    refreshPrices
  } = useMarketsWebSocket();

  useEffect(() => {
    async function loadMarkets() {
      try {
        const res = await fetch('/api/markets?room=TRADING', {
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
  }, [markets.length]);

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

  const handleRefresh = async () => {
    try {
      const res = await fetch('/api/markets?room=TRADING', {
        method: 'GET'
      });
      if (!res.ok) return;
      const { markets: dbMarkets } = (await res.json()) as {
        markets: Market[];
      };

      setMarkets(dbMarkets);
      updateMarkets(dbMarkets);
      refreshPrices();
    } catch (err) {
      // Handle error silently
    }
  };

  const marketTypes = useMemo(() => {
    const types = new Set(markets.map((market) => market.type));
    return Array.from(types).sort();
  }, [markets]);

  return (
    <div className='space-y-6'>
      {/* Connection Status */}
      {wsError && (
        <Alert variant='destructive'>
          <AlertDescription>
            WebSocket connection error: {wsError}
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className='flex flex-col space-y-4'>
        {/* Type Filter Buttons */}
        <div className='flex flex-wrap gap-2'>
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedType('all')}
          >
            All
          </Button>
          {marketTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedType(type)}
            >
              {type}
            </Button>
          ))}
        </div>

        {/* Search and Controls */}
        <div className='flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
          {/* Search */}
          <div className='relative flex-1 sm:max-w-sm'>
            <IconSearch className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <Input
              placeholder='Search markets...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          {/* Status and Controls */}
          <div className='flex items-center justify-between space-x-2 sm:justify-end'>
            {/* Connection Status */}
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              {isConnecting ? (
                <div className='flex items-center space-x-1'>
                  <div className='h-2 w-2 animate-pulse rounded-full bg-yellow-500' />
                  <span>Connecting...</span>
                </div>
              ) : isConnected ? (
                <div className='flex items-center space-x-1'>
                  <IconWifi className='h-4 w-4 text-green-500' />
                  <span>Live</span>
                </div>
              ) : (
                <div className='flex items-center space-x-1'>
                  <IconWifiOff className='h-4 w-4 text-red-500' />
                  <span>Offline</span>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isConnecting}
              className='h-7 px-2'
            >
              <IconRefresh className='h-3 w-3' />
            </Button>

            {/* View Toggle */}
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
            />
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className='text-muted-foreground flex items-center justify-between text-sm'>
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredMarkets.length)}{' '}
          of {filteredMarkets.length} trading markets
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
            No trading markets found matching your criteria.
          </p>
        </div>
      ) : currentView === 'cards' ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {paginatedMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              tradingRoute='/dashboard/trading-view-room-trading'
              realTimeData={realTimePrices.get(market.symbol)}
              isConnected={isConnected}
            />
          ))}
        </div>
      ) : (
        <MarketList
          markets={paginatedMarkets}
          tradingRoute='/dashboard/trading-view-room-trading'
          realTimePrices={realTimePrices}
          isConnected={isConnected}
        />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <IconChevronLeft className='h-4 w-4' />
            Previous
          </Button>

          <div className='flex items-center space-x-1'>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => (
                <div key={page} className='flex items-center'>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className='px-2 text-gray-400'>...</span>
                  )}
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(page)}
                    className='h-8 w-8 p-0'
                  >
                    {page}
                  </Button>
                </div>
              ))}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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
