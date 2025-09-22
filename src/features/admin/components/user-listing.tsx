'use client';

import { useState, useEffect } from 'react';
import { User } from '@/constants/data';
import { fetchUsers, GetUsersParams } from '../sevices/users';
import { UserTable } from './user-tables';
import { columns } from './user-tables/columns';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

type UserListingPageProps = {};

export default function UserListingPage({}: UserListingPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use query states to sync with URL parameters
  const [queryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    role: parseAsString
  });

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true);
        setError(null);

        const filters: GetUsersParams = {
          page: queryParams.page,
          limit: queryParams.perPage,
          ...(queryParams.name && { search: queryParams.name }),
          ...(queryParams.role && {
            role: queryParams.role as 'USER' | 'ADMIN' | 'SUPERADMIN'
          })
        };

        const data = await fetchUsers(filters);

        setUsers(data.users);
        setTotalUsers(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        setUsers([]);
        setTotalUsers(0);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [
    queryParams.page,
    queryParams.perPage,
    queryParams.name,
    queryParams.role
  ]);

  if (error) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <h3 className='text-lg font-medium text-red-600'>
            Error Loading Users
          </h3>
          <p className='mt-2 text-sm text-gray-600'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='mt-4 rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {isLoading && (
        <div className='flex items-center justify-center p-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900'></div>
          <span className='ml-2 text-gray-600'>Loading users...</span>
        </div>
      )}

      {!isLoading && (
        <UserTable data={users} totalItems={totalUsers} columns={columns} />
      )}
    </div>
  );
}
