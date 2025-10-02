'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatDate } from '@/lib/format';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { AdminMarket } from '../../services/markets';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AdminMarket>[] = [
  {
    accessorKey: 'symbol',
    header: ({ column }: { column: Column<AdminMarket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Symbol' />
    ),
    cell: ({ row }) => {
      const symbol = row.getValue('symbol') as string;
      const type = row.original.type;

      return (
        <div className='flex flex-col space-y-1'>
          <span className='font-medium'>{symbol}</span>
          <Badge variant='secondary' className='w-fit text-xs'>
            {type}
          </Badge>
        </div>
      );
    }
  },
  {
    accessorKey: 'name',
    header: ({ column }: { column: Column<AdminMarket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return <span className='text-sm'>{name}</span>;
    }
  },
  {
    accessorKey: 'lastPrice',
    header: ({ column }: { column: Column<AdminMarket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Last Price' />
    ),
    cell: ({ row }) => {
      const lastPrice = row.getValue('lastPrice') as number;
      const lastChange = row.original.lastChange;

      return (
        <div className='flex items-center space-x-2'>
          <span className='font-mono text-sm'>{lastPrice.toFixed(5)}</span>
          {lastChange !== 0 && (
            <div
              className={`flex items-center space-x-1 ${
                lastChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {lastChange > 0 ? (
                <TrendingUp className='h-3 w-3' />
              ) : (
                <TrendingDown className='h-3 w-3' />
              )}
              <span className='font-mono text-xs'>
                {lastChange > 0 ? '+' : ''}
                {lastChange.toFixed(5)}
              </span>
            </div>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'spread',
    header: ({ column }: { column: Column<AdminMarket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Spread' />
    ),
    cell: ({ row }) => {
      const spread = row.getValue('spread') as number;
      return <span className='font-mono text-sm'>{spread.toFixed(5)}</span>;
    }
  },
  {
    accessorKey: 'visible',
    header: ({ column }: { column: Column<AdminMarket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const visible = row.getValue('visible') as boolean;

      return (
        <div className='flex items-center space-x-2'>
          {visible ? (
            <Eye className='h-4 w-4 text-green-600' />
          ) : (
            <EyeOff className='h-4 w-4 text-gray-400' />
          )}
          <Badge variant={visible ? 'default' : 'secondary'}>
            {visible ? 'Visible' : 'Hidden'}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'type',
    header: ({ column }: { column: Column<AdminMarket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string;

      const getTypeColor = (type: string) => {
        switch (type) {
          case 'FOREX':
            return 'bg-blue-100 text-blue-800';
          case 'CRYPTO':
            return 'bg-orange-100 text-orange-800';
          case 'STOCKS':
            return 'bg-green-100 text-green-800';
          case 'COMMODITIES':
            return 'bg-yellow-100 text-yellow-800';
          case 'INDICES':
            return 'bg-purple-100 text-purple-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      };

      return <Badge className={getTypeColor(type)}>{type}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<AdminMarket, unknown> }) => (
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
        onDataChange={(table.options.meta as any)?.onDataChange}
      />
    )
  }
];
