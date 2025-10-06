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
import { PositionStats, PositionEnums } from './positions-stats';
import type { Position, Market, User } from '@prisma/client';

// Extended position type with relations
type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
};

// Position filters interface
type PositionFilters = {
  userId?: string;
  type?: string;
  status?: string;
  room?: string;
  marketId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

// Position stats type
type PositionStats = {
  totalPositions: number;
  totalVolume: number;
  totalPnL: number;
  completedPositions: number;
  pendingPositions: number;
  failedPositions: number;
};
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh
} from '@tabler/icons-react';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function PositionsView() {
  const [positions, setPositions] = useState<PositionWithRelations[]>([]);
  const [stats, setStats] = useState<PositionStats | null>(null);
  const [enums, setEnums] = useState<{
    positionTypes: string[];
    positionStatuses: string[];
  } | null>(null);
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

  // Filters
  const [filters, setFilters] = useState<PositionFilters>({
    search: '',
    type: undefined,
    status: undefined,
    userId: undefined
  });

  const [currentFilters, setCurrentFilters] = useState<PositionFilters>({});

  // Load positions
  const loadPositions = useCallback(
    async (page = 1, newFilters: PositionFilters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
        });

        // Add filter values, handling Date objects and undefined values
        Object.entries(newFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            if (value instanceof Date) {
              params.set(key, value.toISOString());
            } else {
              params.set(key, value.toString());
            }
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

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (currentFilters.userId) params.set('userId', currentFilters.userId);
      if (currentFilters.dateFrom)
        params.set('dateFrom', currentFilters.dateFrom.toISOString());
      if (currentFilters.dateTo)
        params.set('dateTo', currentFilters.dateTo.toISOString());

      const response = await fetch(`/api/admin/positions/stats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setEnums(data.enums);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load stats:', err);
    }
  }, [currentFilters]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadPositions(1, currentFilters);
  }, [currentFilters, loadPositions]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle filter changes
  const handleFilterChange = (key: keyof PositionFilters, value: any) => {
    // Convert 'all' to undefined to clear the filter
    const filterValue = value === 'all' ? undefined : value;
    setFilters((prev) => ({ ...prev, [key]: filterValue }));
  };

  const applyFilters = () => {
    setCurrentFilters(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    loadPositions(newPage, currentFilters);
  };

  // Handle position actions
  const handlePositionCreated = () => {
    setShowForm(false);
    loadPositions(pagination.page, currentFilters);
    loadStats();
  };

  const handlePositionUpdated = () => {
    setEditingPosition(null);
    loadPositions(pagination.page, currentFilters);
    loadStats();
  };

  const handlePositionDeleted = () => {
    loadPositions(pagination.page, currentFilters);
    loadStats();
  };

  const handleEditPosition = (position: PositionWithRelations) => {
    setEditingPosition(position);
    setShowForm(true);
  };

  const handleRefresh = () => {
    loadPositions(pagination.page, currentFilters);
    loadStats();
  };

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      {stats && <PositionStats stats={stats} enums={enums || undefined} />}

      {/* Enums Display */}
      {enums && <PositionEnums enums={enums} />}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconFilter className='h-5 w-5' />
            Filters
          </CardTitle>
          <CardDescription>
            Filter positions by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Search</label>
              <div className='relative'>
                <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='Search descriptions...'
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Type</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All types</SelectItem>
                  {enums?.positionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  {enums?.positionStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>User ID</label>
              <Input
                placeholder='User ID...'
                value={filters.userId || ''}
                onChange={(e) =>
                  handleFilterChange('userId', e.target.value || undefined)
                }
              />
            </div>
          </div>

          <div className='mt-4 flex gap-2'>
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant='outline' onClick={clearFilters}>
              Clear Filters
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

      {/* Actions */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button onClick={() => setShowForm(true)}>
            <IconPlus className='mr-2 h-4 w-4' />
            Add Position
          </Button>
        </div>

        <div className='text-muted-foreground text-sm'>
          Showing {positions.length} of {pagination.total} positions
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Positions Table */}
      <PositionsTable
        positions={positions}
        loading={loading}
        onEdit={handleEditPosition}
        onDelete={handlePositionDeleted}
      />

      {/* Pagination */}
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

      {/* Position Form Modal */}
      {showForm && (
        <PositionForm
          position={editingPosition}
          onClose={() => {
            setShowForm(false);
            setEditingPosition(null);
          }}
          onSuccess={
            editingPosition ? handlePositionUpdated : handlePositionCreated
          }
        />
      )}
    </div>
  );
}
