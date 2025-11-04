import { User } from '@prisma/client';

export type GetSellerUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type SellerUsersApiResponse = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export async function fetchSellerUsers(
  params: GetSellerUsersParams = {}
): Promise<SellerUsersApiResponse> {
  const { page = 1, limit = 10, search } = params;

  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', limit.toString());

  if (search) {
    searchParams.set('search', search);
  }

  const response = await fetch(`/api/seller/users?${searchParams.toString()}`);

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
