'use client';

import { useEffect, useMemo, useState } from 'react';
import { ViewType } from '@/types';
import { MarketCard } from './market-card';
import { MarketList } from './market-list';
import { ViewToggle } from './view-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Market } from '@prisma/client';
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';

interface MarketsViewProps {
  markets?: Market[];
}

export function MarketsView({
  markets: initialMarkets = []
}: MarketsViewProps) {
  const [currentView, setCurrentView] = useState<ViewType>('cards');
  const [selectedType, setSelectedType] = useState<'all' | 'forex' | 'crypto'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function loadMarkets() {
      try {
        const res = await fetch('/api/markets/get-all-markets', {
          method: 'GET'
        });
        if (!res.ok) return;
        const { markets: dbMarkets } = (await res.json()) as {
          markets: Market[];
        };

        setMarkets(dbMarkets);
      } catch (err) {
        // Best-effort; keep initial markets if any
      }
    }

    loadMarkets();
  }, []);

  const filteredMarkets = useMemo(() => {
    let filtered = markets;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((market) => {
        const marketType = market.type.toLowerCase();
        return selectedType === 'forex'
          ? marketType === 'forex'
          : marketType === 'crypto';
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

  const marketCounts = useMemo(() => {
    const forexCount = markets.filter(
      (m) => m.type.toLowerCase() === 'forex'
    ).length;
    const cryptoCount = markets.filter(
      (m) => m.type.toLowerCase() === 'crypto'
    ).length;
    return { forex: forexCount, crypto: cryptoCount, total: markets.length };
  }, [markets]);

  return (
    <div className='space-y-6'>
      {/* Header Controls */}
      <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div className='flex items-center space-x-2'>
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedType('all')}
          >
            All Markets
            <Badge variant='secondary' className='ml-2'>
              {marketCounts.total}
            </Badge>
          </Button>
          <Button
            variant={selectedType === 'forex' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedType('forex')}
          >
            Forex
            <Badge variant='secondary' className='ml-2'>
              {marketCounts.forex}
            </Badge>
          </Button>
          <Button
            variant={selectedType === 'crypto' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedType('crypto')}
          >
            Crypto
            <Badge variant='secondary' className='ml-2'>
              {marketCounts.crypto}
            </Badge>
          </Button>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='relative'>
            <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='Search markets...'
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
          of {filteredMarkets.length} markets
          {selectedType !== 'all' && ` (${selectedType})`}
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
            No markets found matching your criteria.
          </p>
        </div>
      ) : currentView === 'cards' ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {paginatedMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <MarketList markets={paginatedMarkets} />
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
