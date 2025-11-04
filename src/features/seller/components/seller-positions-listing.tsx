'use client';

import { useState, useEffect, useCallback } from 'react';
import { SellerPositionsTable } from './seller-positions/seller-positions-table';
import { SellerPositionCreation } from './seller-positions/seller-position-creation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';
import { toast } from 'sonner';

type PositionWithUser = {
  id: string;
  type: string;
  status: string;
  room: string;
  quantity: number;
  executedPrice: number | null;
  closedPrice: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  executedAt: Date | null;
  closedAt: Date | null;
  pnl: number | null;
  calculatedPnL?: number | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  market: {
    id: string;
    symbol: string;
    name: string;
    lastPrice: number;
  } | null;
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function SellerPositionsListing() {
  const [positions, setPositions] = useState<PositionWithUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<'TRADING' | 'STOCK'>('TRADING');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadPositions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        room: room
      });

      const response = await fetch(
        `/api/seller/positions?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }

      const data = await response.json();
      setPositions(data.positions || []);
      setPagination({
        ...pagination,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load positions'
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, room]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  const handleClosePosition = async (positionId: string) => {
    try {
      const response = await fetch(
        `/api/seller/positions/${positionId}/close`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'CLOSED' })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close position');
      }

      toast.success('Position closed successfully');
      loadPositions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to close position'
      );
    }
  };

  const handleCreatePosition = () => {
    setShowCreateForm(true);
  };

  const handlePositionCreated = () => {
    setShowCreateForm(false);
    loadPositions();
  };

  const handleRefresh = () => {
    loadPositions();
  };

  return (
    <div className='space-y-6'>
      {/* Filters and Actions */}
      <Card className='p-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='room-filter'>Room</Label>
              <Select
                value={room}
                onValueChange={(value: 'TRADING' | 'STOCK') => {
                  setRoom(value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger id='room-filter' className='w-[180px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='TRADING'>Trading Room</SelectItem>
                  <SelectItem value='STOCK'>Stock Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handleRefresh}>
              <IconRefresh className='mr-2 h-4 w-4' />
              Refresh
            </Button>
            <Button variant='default' size='sm' onClick={handleCreatePosition}>
              Create Position
            </Button>
          </div>
        </div>
      </Card>

      {/* Position Creation Form */}
      {showCreateForm && (
        <SellerPositionCreation
          initialRoom={room}
          onPositionCreated={handlePositionCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Positions Table */}
      <SellerPositionsTable
        positions={positions}
        loading={loading}
        room={room}
        pagination={pagination}
        onClose={handleClosePosition}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
      />
    </div>
  );
}
