'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';

import { useDataTable } from '@/hooks/use-data-table';

import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import * as React from 'react';
import type { SellerSearchFilters } from '../seller-user-listing';

const FILTER_IDS_NO_URL = ['name', 'email', 'role'];

interface SellerUserTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
  onDataChange?: () => void;
  searchFilters?: SellerSearchFilters;
  onSearchApply?: (filters: SellerSearchFilters) => void;
}

export function SellerUserTable<TData, TValue>({
  data,
  totalItems,
  columns,
  onDataChange,
  searchFilters,
  onSearchApply
}: SellerUserTableParams<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const pageCount = Math.ceil(totalItems / pageSize);

  const initialFilterState = searchFilters
    ? {
        name: searchFilters.name || null,
        email: searchFilters.email || null,
        role: searchFilters.role.length ? searchFilters.role : null
      }
    : undefined;

  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500,
    excludeFilterIdsFromUrl: FILTER_IDS_NO_URL,
    initialFilterState: initialFilterState ?? undefined,
    meta: {
      onDataChange
    }
  });

  const appliedFilters = React.useMemo(
    () =>
      searchFilters
        ? {
            name: searchFilters.name,
            email: searchFilters.email,
            role: searchFilters.role
          }
        : undefined,
    [searchFilters]
  );

  const handleSearchApply = onSearchApply
    ? (filters: Record<string, string | string[]>) => {
        onSearchApply({
          name: (filters.name as string) ?? '',
          email: (filters.email as string) ?? '',
          role: Array.isArray(filters.role) ? filters.role : []
        });
      }
    : undefined;

  return (
    <div className='relative flex min-h-[600px] flex-col'>
      <DataTable table={table}>
        <DataTableToolbar
          table={table}
          appliedFilters={appliedFilters}
          onSearchApply={handleSearchApply}
        />
      </DataTable>
    </div>
  );
}
