export interface AdminUserInvestment {
  id: string;
  userId: string;
  investmentId: string;
  amount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: Date;
  endDate: Date;
  expectedReturn: number;
  actualReturn: number | null;
  autoReinvest: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  investment: {
    id: string;
    title: string;
    duration: number;
    rentability: number;
    riskLevel: string;
  };
}

export interface GetAdminUserInvestmentsParams {
  page?: number;
  limit?: number;
  user?: string;
  investment?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  search?: string;
}

export interface GetAdminUserInvestmentsResponse {
  userInvestments: AdminUserInvestment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchAdminUserInvestments(
  params: GetAdminUserInvestmentsParams = {}
): Promise<GetAdminUserInvestmentsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.user) searchParams.set('user', params.user);
  if (params.investment) searchParams.set('investment', params.investment);
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);

  const response = await fetch(
    `/api/admin/user-investments?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user investments');
  }

  return response.json();
}