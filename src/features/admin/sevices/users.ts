import { User } from '@/constants/data';

export type GetUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'USER' | 'ADMIN' | 'SUPERADMIN';
};

export type UsersApiResponse = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export async function fetchUsers(
  params: GetUsersParams = {}
): Promise<UsersApiResponse> {
  const { page = 1, limit = 10, search, role } = params;

  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());

  if (search) {
    searchParams.set('search', search);
  }

  if (role) {
    searchParams.set('role', role);
  }

  const response = await fetch(`/api/admin/users?${searchParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  const data = await response.json();

  // Transform the API response to match our expected format
  return {
    users: data.users.map((user: any) => ({
      ...user,
      emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      password: null // Never expose passwords on client
    })),
    pagination: data.pagination
  };
}
