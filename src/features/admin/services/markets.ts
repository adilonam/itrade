import { Market } from '@prisma/client';

export interface AdminMarket extends Market {}

export interface GetMarketsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'FOREX' | 'CRYPTO' | 'STOCKS' | 'COMMODITIES' | 'INDICES';
  visible?: boolean;
}

export interface CreateMarketParams {
  symbol: string;
  type: 'FOREX' | 'CRYPTO' | 'STOCKS' | 'COMMODITIES' | 'INDICES';
  room: 'STOCK' | 'TRADING';
  spread?: number;
  visible?: boolean;
}

export interface UpdateMarketParams {
  visible?: boolean;
  spread?: number;
  room?: 'STOCK' | 'TRADING';
}

export interface MarketsResponse {
  markets: AdminMarket[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export async function fetchMarkets(
  params: GetMarketsParams = {}
): Promise<MarketsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.type) searchParams.set('type', params.type);
  if (params.visible !== undefined)
    searchParams.set('visible', params.visible.toString());

  const response = await fetch(`/api/admin/markets?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch markets');
  }

  return response.json();
}

export async function createMarket(
  data: CreateMarketParams
): Promise<AdminMarket> {
  const response = await fetch('/api/admin/markets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to create market');
  }

  return response.json();
}

export async function updateMarket(
  id: string,
  data: UpdateMarketParams
): Promise<AdminMarket> {
  const response = await fetch(`/api/admin/markets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to update market');
  }

  return response.json();
}

export async function deleteMarket(id: string): Promise<void> {
  const response = await fetch(`/api/admin/markets/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to delete market');
  }
}
