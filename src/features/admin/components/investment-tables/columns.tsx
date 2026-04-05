'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatDate } from '@/lib/format';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Eye, EyeOff, TrendingUp, Users } from 'lucide-react';
import { AdminInvestment } from '../../services/investments';
import { CellAction } from './cell-action';

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'LOW':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'HIGH':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: // MEDIUM
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const columns: ColumnDef<AdminInvestment>[] = [
  {
    accessorKey: 'title',
    header: ({ column }: { column: Column<AdminInvestment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Investment' />
    ),
    cell: ({ row }) => {
      const title = row.getValue('title') as string;
      const riskLevel = row.original.riskLevel;

      return (
        <div className='flex flex-col space-y-2'>
          <span className='text-sm font-medium'>{title}</span>
          <div className='flex items-center space-x-2'>
            <Badge
              variant='outline'
              className={`text-xs ${getRiskColor(riskLevel)}`}
            >
              {riskLevel}
            </Badge>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'duration',
    header: ({ column }: { column: Column<AdminInvestment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Duration' />
    ),
    cell: ({ row }) => {
      const duration = row.getValue('duration') as number;
      return <span className='text-sm'>{duration} months</span>;
    }
  },
  {
    accessorKey: 'rentability',
    header: ({ column }: { column: Column<AdminInvestment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Annual Return' />
    ),
    cell: ({ row }) => {
      const rentability = row.getValue('rentability') as number;

      return (
        <div className='flex items-center font-medium text-green-600'>
          <TrendingUp className='mr-1 h-4 w-4' />
          {rentability}%
        </div>
      );
    }
  },
  {
    accessorKey: 'minInvestment',
    header: ({ column }: { column: Column<AdminInvestment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Min Investment' />
    ),
    cell: ({ row }) => {
      const minInvestment = row.getValue('minInvestment') as number;
      const maxInvestment = row.original.maxInvestment;

      return (
        <div className='text-sm'>
          <div>{formatCurrency(minInvestment)}</div>
          {maxInvestment && (
            <div className='text-muted-foreground text-xs'>
              Max: {formatCurrency(maxInvestment)}
            </div>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'currentCapacity',
    header: ({ column }: { column: Column<AdminInvestment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Capacity' />
    ),
    cell: ({ row }) => {
      const currentCapacity = row.getValue('currentCapacity') as number;
      const totalCapacity = row.original.totalCapacity;

      if (!totalCapacity) {
        return <span className='text-muted-foreground text-sm'>Unlimited</span>;
      }

      const percentage = Math.round((currentCapacity / totalCapacity) * 100);

      return (
        <div className='text-sm'>
          <div className='font-medium'>{percentage}%</div>
          <div className='text-muted-foreground text-xs'>
            {formatCurrency(currentCapacity)} / {formatCurrency(totalCapacity)}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: '_count.userInvestments',
    header: ({ column }: { column: Column<AdminInvestment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Investors' />
    ),
    cell: ({ row }) => {
      const count = row.original._count?.userInvestments || 0;

      return (
        <div className='flex items-center text-sm'>
          <Users className='text-muted-foreground mr-1 h-4 w-4' />
          {count}
        </div>
      );
    }
  },
  {
    accessorKey: 'isActive',
    header: ({ column }: { column: Column<AdminInvestment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;

      return (
        <div className='flex items-center'>
          {isActive ? (
            <>
              <Eye className='mr-2 h-4 w-4 text-green-600' />
              <Badge variant='default' className='bg-green-600'>
                Active
              </Badge>
            </>
          ) : (
            <>
              <EyeOff className='mr-2 h-4 w-4 text-red-600' />
              <Badge variant='destructive'>Inactive</Badge>
            </>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<AdminInvestment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as Date;
      return (
        <span className='text-muted-foreground text-sm'>
          {formatDate(createdAt)}
        </span>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row, table }) => (
      <CellAction
        data={row.original}
        onDataChange={(table.options.meta as any)?.onRefresh}
      />
    )
  }
];
