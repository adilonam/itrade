'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AdminInvestment,
  fetchInvestments,
  GetInvestmentsParams
} from '../services/investments';
import { InvestmentTable } from './investment-tables';
import { columns } from './investment-tables/columns';
import { AddInvestmentDialog } from './add-investment-dialog';
import UserInvestmentListing from './user-investment-listing';
import { Button } from '@/components/ui/button';
import {
  parseAsInteger,
  parseAsString,
  useQueryStates,
  parseAsStringEnum
} from 'nuqs';
import { IconPlus } from '@tabler/icons-react';

type InvestmentListingPageProps = {};

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

export default function InvestmentListingPage({}: InvestmentListingPageProps) {
  const [investments, setInvestments] = useState<AdminInvestment[]>([]);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Use query states to sync with URL parameters
  const [queryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString,
    riskLevel: parseAsStringEnum(RISK_LEVELS),
    isActive: parseAsString
  });

  const fetchInvestmentsData = useCallback(async () => {
    setError(null);

    try {
      const params: GetInvestmentsParams = {
        page: queryParams.page,
        limit: queryParams.perPage,
        search: queryParams.search || undefined,
        riskLevel: queryParams.riskLevel || undefined,
        isActive:
          queryParams.isActive === 'true'
            ? true
            : queryParams.isActive === 'false'
              ? false
              : undefined
      };

      const response = await fetchInvestments(params);
      setInvestments(response.investments);
      setTotalInvestments(response.pagination.total);
    } catch (err) {
      setError('Failed to fetch investments');
    }
  }, [queryParams]);

  useEffect(() => {
    fetchInvestmentsData();
  }, [fetchInvestmentsData]);

  const handleAddInvestment = () => {
    setIsAddDialogOpen(true);
  };

  const handleInvestmentAdded = () => {
    setIsAddDialogOpen(false);
    fetchInvestmentsData(); // Refresh the list
  };

  if (error) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-center'>
          <p className='mb-2 text-red-600'>Error loading investments</p>
          <p className='text-sm text-gray-500'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>Investments Management</h2>
          <p className='text-muted-foreground text-sm'>
            Total: {totalInvestments} investments
          </p>
        </div>
        <Button onClick={handleAddInvestment}>
          <IconPlus className='mr-2 h-4 w-4' />
          Add Investment
        </Button>
      </div>

      <InvestmentTable
        columns={columns}
        data={investments}
        totalItems={totalInvestments}
        onRefresh={fetchInvestmentsData}
      />

      <UserInvestmentListing />

      <AddInvestmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleInvestmentAdded}
      />
    </div>
  );
}
