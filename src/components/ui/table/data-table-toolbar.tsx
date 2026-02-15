'use client';

import type { Column, Table } from '@tanstack/react-table';
import * as React from 'react';

import { DataTableDateFilter } from '@/components/ui/table/data-table-date-filter';
import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter';
import { DataTableSliderFilter } from '@/components/ui/table/data-table-slider-filter';
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  /** When provided, toolbar syncs pending state from here (e.g. after API refetch) */
  appliedFilters?: Record<string, string | string[]>;
  /** When provided, Search button calls this instead of only updating table state (no URL push for these filters) */
  onSearchApply?: (filters: Record<string, string | string[]>) => void;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  appliedFilters,
  onSearchApply,
  ...props
}: DataTableToolbarProps<TData>) {
  const columnFilters = table.getState().columnFilters;

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  );

  const searchOnClickColumns = React.useMemo(
    () => columns.filter((col) => col.columnDef.meta?.searchOnClick),
    [columns]
  );

  const [pendingFilters, setPendingFilters] = React.useState<
    Record<string, string | string[]>
  >(() => {
    const initial: Record<string, string | string[]> = {};
    searchOnClickColumns.forEach((col) => {
      const v = col.getFilterValue();
      if (col.id == null) return;
      if (Array.isArray(v)) initial[col.id] = v.length ? v : [];
      else if (typeof v === 'string' || v == null)
        initial[col.id] = (v as string) ?? '';
    });
    return initial;
  });

  React.useEffect(() => {
    const next: Record<string, string | string[]> = {};
    searchOnClickColumns.forEach((col) => {
      const v = col.getFilterValue();
      if (col.id == null) return;
      if (Array.isArray(v)) next[col.id] = v.length ? v : [];
      else if (typeof v === 'string' || v == null)
        next[col.id] = (v as string) ?? '';
    });
    setPendingFilters((prev) => (Object.keys(next).length > 0 ? next : prev));
  }, [columnFilters, searchOnClickColumns]);

  React.useEffect(() => {
    if (!appliedFilters || Object.keys(appliedFilters).length === 0) return;
    setPendingFilters((prev) => ({ ...prev, ...appliedFilters }));
  }, [appliedFilters]);

  const onApplyAll = React.useCallback(() => {
    if (onSearchApply) {
      onSearchApply(pendingFilters);
    }
    searchOnClickColumns.forEach((col) => {
      if (col.id == null || pendingFilters[col.id] === undefined) return;
      const val = pendingFilters[col.id];
      col.setFilterValue(
        Array.isArray(val) ? (val.length ? val : undefined) : val
      );
    });
  }, [searchOnClickColumns, pendingFilters, onSearchApply]);

  const hasSearchOnClick = searchOnClickColumns.length > 0;

  return (
    <div
      role='toolbar'
      aria-orientation='horizontal'
      className={cn(
        'flex w-full items-start justify-between gap-2 p-1',
        className
      )}
      {...props}
    >
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        {columns.map((column) => (
          <DataTableToolbarFilter
            key={column.id}
            column={column}
            pendingValue={
              column.id != null && column.columnDef.meta?.searchOnClick
                ? (pendingFilters[column.id] ??
                  (column.columnDef.meta?.options ? [] : ''))
                : undefined
            }
            setPendingValue={
              column.id != null && column.columnDef.meta?.searchOnClick
                ? (value: string | string[]) =>
                    setPendingFilters((p) => ({
                      ...p,
                      [column.id!]: value
                    }))
                : undefined
            }
            onApplyAll={hasSearchOnClick ? onApplyAll : undefined}
          />
        ))}
        {hasSearchOnClick && (
          <Button
            type='button'
            variant='secondary'
            size='sm'
            className='h-8 shrink-0'
            onClick={onApplyAll}
          >
            <MagnifyingGlassIcon className='h-4 w-4' />
            Search
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
  pendingValue?: string | string[];
  setPendingValue?: (value: string | string[]) => void;
  onApplyAll?: () => void;
}

function DataTableToolbarFilter<TData>({
  column,
  pendingValue,
  setPendingValue,
  onApplyAll
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;
  const filterValue = column.getFilterValue();
  const [localPending, setLocalPending] = React.useState<string>(
    () => (filterValue as string) ?? ''
  );

  const isControlledSearchOnClick =
    columnMeta?.searchOnClick && pendingValue !== undefined && setPendingValue;

  React.useEffect(() => {
    if (!isControlledSearchOnClick)
      setLocalPending((filterValue as string) ?? '');
  }, [filterValue, isControlledSearchOnClick]);

  const onFilterRender = React.useCallback(() => {
    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
      case 'text':
        if (columnMeta.searchOnClick) {
          const value = isControlledSearchOnClick
            ? pendingValue!
            : localPending;
          const setValue = isControlledSearchOnClick
            ? setPendingValue!
            : setLocalPending;
          return (
            <Input
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onApplyAll?.() ?? column.setFilterValue(value);
                }
              }}
              className='h-8 w-40 lg:w-56'
            />
          );
        }
        return (
          <Input
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={(column.getFilterValue() as string) ?? ''}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className='h-8 w-40 lg:w-56'
          />
        );

      case 'number':
        return (
          <div className='relative'>
            <Input
              type='number'
              inputMode='numeric'
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ''}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className={cn('h-8 w-[120px]', columnMeta.unit && 'pr-8')}
            />
            {columnMeta.unit && (
              <span className='bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm'>
                {columnMeta.unit}
              </span>
            )}
          </div>
        );

      case 'range':
        return (
          <DataTableSliderFilter
            column={column}
            title={columnMeta.label ?? column.id}
          />
        );

      case 'date':
      case 'dateRange':
        return (
          <DataTableDateFilter
            column={column}
            title={columnMeta.label ?? column.id}
            multiple={columnMeta.variant === 'dateRange'}
          />
        );

      case 'select':
      case 'multiSelect':
        return (
          <DataTableFacetedFilter
            column={column}
            title={columnMeta.label ?? column.id}
            options={columnMeta.options ?? []}
            multiple={columnMeta.variant === 'multiSelect'}
            pendingValues={
              columnMeta.searchOnClick && Array.isArray(pendingValue)
                ? pendingValue
                : undefined
            }
            setPendingValues={
              columnMeta.searchOnClick && setPendingValue
                ? (v: string[]) => setPendingValue(v)
                : undefined
            }
          />
        );

      default:
        return null;
    }
  }, [
    column,
    columnMeta,
    localPending,
    pendingValue,
    setPendingValue,
    isControlledSearchOnClick,
    onApplyAll
  ]);

  return onFilterRender();
}
