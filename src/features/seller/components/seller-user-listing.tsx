'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@prisma/client';
import { SellerUserTable } from './seller-user-tables';
import { createSellerUserColumns } from './seller-user-tables/columns';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { fetchSellerUsers, GetSellerUsersParams } from '../services/users';
import { useSession } from 'next-auth/react';

type SellerUserListingPageProps = {};

export default function SellerUserListingPage({}: SellerUserListingPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Use query states to sync with URL parameters
  const [queryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: GetSellerUsersParams = {
        page: queryParams.page,
        limit: queryParams.perPage,
        ...(queryParams.name && { search: queryParams.name })
      };

      const data = await fetchSellerUsers(params);
      setUsers(data.users);
      setTotalUsers(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [queryParams.page, queryParams.perPage, queryParams.name]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDataChange = () => {
    loadUsers();
  };

  if (error) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <h3 className='text-lg font-medium text-red-600'>
            Error Loading Users
          </h3>
          <p className='mt-2 text-sm text-gray-600'>{error}</p>
          <button
            onClick={loadUsers}
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
        <SellerUserTable
          data={users}
          totalItems={totalUsers}
          columns={createSellerUserColumns(session?.user?.id)}
          onDataChange={handleDataChange}
        />
      )}
    </div>
  );
}
