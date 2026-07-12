'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PositionsTable } from './positions-table';
import { PositionForm } from './positions-form';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';
import type {
  Market,
  Position,
  PositionStatus,
  PositionType,
  User,
  UserBalance
} from '@/lib/prisma/generated/client';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh
} from '@tabler/icons-react';

type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
  userBalance?: UserBalance | null;
  calculatedPnL?: number | null;
};

type PositionFilters = {
  userId?: string;
  type?: string;
  status?: string;
  room?: string;
  marketId?: string;
  balanceType?: string;
  search?: string;
};

type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const POSITION_STATUSES: PositionStatus[] = [
  'PLACED',
  'CLOSED',
  'FAILED',
  'PENDING',
  'SPLITTED'
];

const POSITION_TYPES: PositionType[] = ['BUY', 'SELL'];

export function PositionsView() {
  const [positions, setPositions] = useState<PositionWithRelations[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPosition, setEditingPosition] =
    useState<PositionWithRelations | null>(null);

  const [filters, setFilters] = useState<PositionFilters>({
    search: '',
    type: undefined,
    status: undefined,
    room: undefined,
    marketId: undefined,
    userId: undefined,
    balanceType: undefined
  });
  const [currentFilters, setCurrentFilters] = useState<PositionFilters>({});

  const [userEmailQuery, setUserEmailQuery] = useState('');
  const [debouncedUserQuery, setDebouncedUserQuery] = useState('');
  const [userCandidates, setUserCandidates] = useState<AdminUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserLabel, setSelectedUserLabel] = useState<string | null>(
    null
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserQuery(userEmailQuery), 400);
    return () => clearTimeout(t);
  }, [userEmailQuery]);

  useEffect(() => {
    if (debouncedUserQuery.trim().length < 2) {
      setUserCandidates([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const params = new URLSearchParams({
          limit: '30',
          page: '1',
          search: debouncedUserQuery.trim()
        });
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setUserCandidates((data.users ?? []) as AdminUserRow[]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedUserQuery]);

  const loadPositions = useCallback(
    async (page = 1, newFilters: PositionFilters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
        });

        Object.entries(newFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.set(key, value.toString());
          }
        });

        const response = await fetch(`/api/admin/positions?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch positions');
        }

        const data = await response.json();
        setPositions(data.positions);
        setPagination(data.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load positions'
        );
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  const loadMarkets = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/markets?limit=1000');
      if (!response.ok) return;
      const data = await response.json();
      setMarkets(data.markets || []);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadPositions(1, currentFilters);
  }, [currentFilters, loadPositions]);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const handleFilterChange = (
    key: keyof PositionFilters,
    value: string | undefined
  ) => {
    const filterValue = value === 'all' ? undefined : value;
    setFilters((prev) => ({ ...prev, [key]: filterValue }));
  };

  const selectUserFilter = (user: AdminUserRow) => {
    setFilters((prev) => ({ ...prev, userId: user.id }));
    setUserEmailQuery(user.email);
    setSelectedUserLabel(user.name ? `${user.name} (${user.email})` : user.email);
    setUserCandidates([]);
  };

  const clearUserFilter = () => {
    setFilters((prev) => ({ ...prev, userId: undefined }));
    setUserEmailQuery('');
    setSelectedUserLabel(null);
  };

  const applyFilters = () => {
    setCurrentFilters(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentFilters({});
    setUserEmailQuery('');
    setSelectedUserLabel(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    loadPositions(newPage, currentFilters);
  };

  const handlePositionSaved = () => {
    setEditingPosition(null);
    setShowForm(false);
    loadPositions(pagination.page, currentFilters);
  };

  const handleEditPosition = (position: PositionWithRelations) => {
    setEditingPosition(position);
    setShowForm(true);
  };

  const handleRefresh = () => {
    loadPositions(pagination.page, currentFilters);
  };

  return (
    <div className='space-y-6'>
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
            <IconFilter className='h-4 w-4 text-[var(--trade-accent-blue)]' />
            Filters
          </CardTitle>
          <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
            Filter client positions by user, status, market, and more
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            <div className='space-y-2 md:col-span-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>
                User (email)
              </label>
              <div className='relative'>
                <IconSearch className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-[var(--trade-text-muted)]' />
                <Input
                  placeholder='Search user by email…'
                  value={userEmailQuery}
                  onChange={(e) => {
                    setUserEmailQuery(e.target.value);
                    setFilters((prev) => ({ ...prev, userId: undefined }));
                    setSelectedUserLabel(null);
                  }}
                  className='border-[var(--trade-border)] bg-[var(--trade-dark)] pl-10 text-sm text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)]'
                />
              </div>
              {loadingUsers && (
                <p className='text-xs text-[var(--trade-text-muted)]'>
                  Searching users…
                </p>
              )}
              {userCandidates.length > 0 && (
                <ul className='bg-popover text-popover-foreground max-h-40 overflow-auto rounded-md border p-1 text-sm shadow-md'>
                  {userCandidates.map((user) => (
                    <li key={user.id}>
                      <button
                        type='button'
                        className='hover:bg-accent focus:bg-accent w-full rounded px-2 py-1.5 text-left'
                        onClick={() => selectUserFilter(user)}
                      >
                        <span className='font-medium'>{user.email}</span>
                        {user.name ? (
                          <span className='text-muted-foreground ml-2'>
                            {user.name}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedUserLabel ? (
                <div className='flex items-center gap-2 text-xs text-[var(--trade-text-muted)]'>
                  <span>Selected: {selectedUserLabel}</span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='h-6 px-2'
                    onClick={clearUserFilter}
                  >
                    Clear
                  </Button>
                </div>
              ) : null}
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>
                Search
              </label>
              <Input
                placeholder='Symbol, description, ID…'
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)]'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>
                Status
              </label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  {POSITION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>
                Type
              </label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All types</SelectItem>
                  {POSITION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>
                Room
              </label>
              <Select
                value={filters.room || 'all'}
                onValueChange={(value) => handleFilterChange('room', value)}
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All rooms' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All rooms</SelectItem>
                  <SelectItem value='STOCK'>STOCK</SelectItem>
                  <SelectItem value='TRADING'>TRADING</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>
                Balance type
              </label>
              <Select
                value={filters.balanceType || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('balanceType', value)
                }
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All balance types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All balance types</SelectItem>
                  <SelectItem value='REAL'>REAL</SelectItem>
                  <SelectItem value='DEMO'>DEMO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>
                Market
              </label>
              <Select
                value={filters.marketId || 'all'}
                onValueChange={(value) => handleFilterChange('marketId', value)}
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All markets' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All markets</SelectItem>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.symbol} - {market.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='mt-4 flex flex-wrap gap-2'>
            <Button onClick={applyFilters}>Apply filters</Button>
            <Button variant='outline' onClick={clearFilters}>
              Clear filters
            </Button>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={loading}
            >
              <IconRefresh className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='flex items-center justify-between'>
        <Button onClick={() => setShowForm(true)}>
          <IconPlus className='mr-2 h-4 w-4' />
          Add position
        </Button>
        <div className='font-mono text-sm text-[var(--trade-text-muted)]'>
          Showing {positions.length} of {pagination.total} positions
        </div>
      </div>

      {error && (
        <Alert
          variant='destructive'
          className='border-[var(--trade-border)] bg-[var(--trade-panel)] text-sm text-[var(--trade-text)]'
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PositionsTable
        positions={positions}
        loading={loading}
        onEdit={handleEditPosition}
        onDelete={handlePositionSaved}
        omitBalanceColumn
        cardDescription='All client positions across users'
      />

      {pagination.pages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <IconChevronLeft className='h-4 w-4' />
            Previous
          </Button>

          <div className='flex items-center gap-1'>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={pagination.page === page ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handlePageChange(page)}
                  className='h-8 w-8 p-0'
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next
            <IconChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}

      {showForm && (
        <PositionForm
          position={editingPosition}
          hideBalanceInfo
          onClose={() => {
            setShowForm(false);
            setEditingPosition(null);
          }}
          onSuccess={handlePositionSaved}
        />
      )}
    </div>
  );
}
