'use client';

import { useState, useMemo } from 'react';
import { ViewType, Market } from '@/types';
import { MarketCard } from './market-card';
import { MarketList } from './market-list';
import { ViewToggle } from './view-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { IconSearch } from '@tabler/icons-react';

interface MarketsViewProps {
  markets: Market[];
}

export function MarketsView({ markets }: MarketsViewProps) {
  const [currentView, setCurrentView] = useState<ViewType>('cards');
  const [selectedType, setSelectedType] = useState<'all' | 'forex' | 'crypto'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMarkets = useMemo(() => {
    let filtered = markets;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((market) => market.type === selectedType);
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

  const marketCounts = useMemo(() => {
    const forexCount = markets.filter((m) => m.type === 'forex').length;
    const cryptoCount = markets.filter((m) => m.type === 'crypto').length;
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
          Showing {filteredMarkets.length} of {markets.length} markets
          {selectedType !== 'all' && ` (${selectedType})`}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
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
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <MarketList markets={filteredMarkets} />
      )}
    </div>
  );
}
