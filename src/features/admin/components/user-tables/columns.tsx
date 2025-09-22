'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { User } from '@/constants/data';
import { format } from 'date-fns';
import { Column, ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle2,
  Mail,
  Shield,
  User as UserIcon,
  XCircle
} from 'lucide-react';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { ROLE_OPTIONS } from './options';

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'image',
    header: 'AVATAR',
    cell: ({ row }) => {
      const image = row.getValue('image') as string | null;
      const name = row.getValue('name') as string | null;
      const email = row.getValue('email') as string;

      return (
        <div className='flex h-10 w-10 items-center justify-center'>
          {image ? (
            <Image
              src={image}
              alt={name || email}
              width={40}
              height={40}
              className='rounded-full object-cover'
            />
          ) : (
            <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-full'>
              <UserIcon className='text-muted-foreground h-5 w-5' />
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string | null;
      const email = row.getValue('email') as string;

      return (
        <div className='flex flex-col'>
          <div className='font-medium'>{name || 'No Name'}</div>
          <div className='text-muted-foreground text-sm'>{email}</div>
        </div>
      );
    },
    meta: {
      label: 'Name',
      placeholder: 'Search users...',
      variant: 'text',
      icon: UserIcon
    },
    enableColumnFilter: true
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => {
      const email = row.getValue('email') as string;
      const emailVerified = row.original.emailVerified;

      return (
        <div className='flex items-center space-x-2'>
          <Mail className='text-muted-foreground h-4 w-4' />
          <span>{email}</span>
          {emailVerified && <CheckCircle2 className='h-4 w-4 text-green-600' />}
        </div>
      );
    },
    meta: {
      label: 'Email',
      placeholder: 'Search by email...',
      variant: 'text',
      icon: Mail
    },
    enableColumnFilter: true
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = row.getValue('role') as User['role'];
      const roleConfig = {
        USER: { variant: 'secondary' as const, icon: UserIcon },
        ADMIN: { variant: 'default' as const, icon: Shield },
        SUPERADMIN: { variant: 'destructive' as const, icon: Shield }
      };

      const config = roleConfig[role];
      const Icon = config.icon;

      return (
        <Badge variant={config.variant} className='capitalize'>
          <Icon className='mr-1 h-3 w-3' />
          {role.toLowerCase().replace('admin', ' Admin')}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'roles',
      variant: 'multiSelect',
      options: ROLE_OPTIONS
    }
  },
  {
    id: 'emailVerified',
    accessorKey: 'emailVerified',
    header: 'STATUS',
    cell: ({ row }) => {
      const emailVerified = row.getValue('emailVerified') as Date | null;
      const Icon = emailVerified ? CheckCircle2 : XCircle;

      return (
        <Badge variant={emailVerified ? 'default' : 'secondary'}>
          <Icon className='mr-1 h-3 w-3' />
          {emailVerified ? 'Verified' : 'Unverified'}
        </Badge>
      );
    }
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as Date;
      return (
        <span className='text-muted-foreground text-sm'>
          {format(createdAt, 'MMM dd, yyyy')}
        </span>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
