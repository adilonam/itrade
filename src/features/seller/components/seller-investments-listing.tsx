'use client';

import { useState, useEffect, useCallback } from 'react';
import { SellerInvestmentsTable } from './seller-investments/seller-investments-table';
import { SellerInvestmentCreation } from './seller-investments/seller-investment-creation';
import type { UserInvestmentWithRelations } from './seller-investments/seller-investments-table';
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
import { IconRefresh, IconPlus } from '@tabler/icons-react';
import { toast } from 'sonner';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function SellerInvestmentsListing() {
  const [userInvestments, setUserInvestments] = useState<
    UserInvestmentWithRelations[]
  >([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadInvestments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      if (status && ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
        params.set('status', status);
      }

      const response = await fetch(
        `/api/seller/investments?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch investments');
      }

      const data = await response.json();
      setUserInvestments(data.userInvestments ?? []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total ?? 0,
        pages: data.pagination?.pages ?? 0
      }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load investments'
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, status]);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    loadInvestments();
  };

  const handleInvestmentCreated = () => {
    setShowCreateForm(false);
    loadInvestments();
  };

  return (
    <div className='space-y-6'>
      <Card className='p-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='status-filter'>Status</Label>
              <Select
                value={status || 'all'}
                onValueChange={(value) => {
                  setStatus(value === 'all' ? '' : value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger id='status-filter' className='w-[180px]'>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='ACTIVE'>Active</SelectItem>
                  <SelectItem value='COMPLETED'>Completed</SelectItem>
                  <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={handleRefresh}>
              <IconRefresh className='mr-2 h-4 w-4' />
              Refresh
            </Button>
            <Button size='sm' onClick={() => setShowCreateForm(true)}>
              <IconPlus className='mr-2 h-4 w-4' />
              Create Investment
            </Button>
          </div>
        </div>
      </Card>

      {showCreateForm && (
        <SellerInvestmentCreation
          onInvestmentCreated={handleInvestmentCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <SellerInvestmentsTable
        userInvestments={userInvestments}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
