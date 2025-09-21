import { User } from '@/constants/data';
import { getUsers } from '../lib/users-api';
import { searchParamsCache } from '@/lib/searchparams';
import { UserTable } from './user-tables';
import { columns } from './user-tables/columns';

type UserListingPageProps = {};

export default async function UserListingPage({}: UserListingPageProps) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const role = searchParamsCache.get('role');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(role && { role })
  };

  const data = await getUsers(filters);
  const totalUsers = data.total;
  const users: User[] = data.users;

  return <UserTable data={users} totalItems={totalUsers} columns={columns} />;
}
