export interface AdminInvestment {
  id: string;
  title: string;
  description: string | null;
  duration: number; // calendar days
  rentability: number; // annual percentage
  minInvestment: number;
  maxInvestment: number | null;
  autoReinvestment: boolean;
  totalCapacity: number | null;
  currentCapacity: number;
  riskLevel: string;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    userInvestments: number;
  };
}

export interface GetInvestmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  riskLevel?: string;
  isActive?: boolean;
}

export interface GetInvestmentsResponse {
  investments: AdminInvestment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateInvestmentParams {
  title: string;
  description?: string;
  duration: number;
  rentability: number;
  minInvestment: number;
  maxInvestment?: number;
  autoReinvestment: boolean;
  totalCapacity?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isActive: boolean;
  imageUrl?: string;
}

export interface UpdateInvestmentParams
  extends Partial<CreateInvestmentParams> {}

export async function fetchInvestments(
  params: GetInvestmentsParams = {}
): Promise<GetInvestmentsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.riskLevel) searchParams.append('riskLevel', params.riskLevel);
  if (params.isActive !== undefined)
    searchParams.append('isActive', params.isActive.toString());

  const response = await fetch(
    `/api/admin/investments?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch investments: ${response.statusText}`);
  }

  return response.json();
}

export async function createInvestment(
  data: CreateInvestmentParams
): Promise<AdminInvestment> {
  const response = await fetch('/api/admin/investments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create investment');
  }

  return response.json();
}

export async function updateInvestment(
  id: string,
  data: UpdateInvestmentParams
): Promise<AdminInvestment> {
  const response = await fetch(`/api/admin/investments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update investment');
  }

  return response.json();
}

export async function deleteInvestment(id: string): Promise<void> {
  const response = await fetch(`/api/admin/investments/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete investment');
  }
}

export async function getInvestment(id: string): Promise<AdminInvestment> {
  const response = await fetch(`/api/admin/investments/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch investment: ${response.statusText}`);
  }

  return response.json();
}
