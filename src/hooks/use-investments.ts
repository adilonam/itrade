'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Investment {
  id: string;
  title: string;
  description?: string | null;
  country: string;
  duration: number;
  rentability: number;
  minInvestment: number;
  maxInvestment?: number | null;
  autoReinvestment: boolean;
  totalCapacity?: number | null;
  currentCapacity: number;
  riskLevel: string;
  imageUrl?: string | null;
  createdAt: Date;
  _count?: {
    userInvestments: number;
  };
}

export interface UserInvestmentData {
  id: string;
  amount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: Date;
  endDate: Date;
  expectedReturn: number;
  actualReturn?: number | null;
  autoReinvest: boolean;
  investment: {
    id: string;
    title: string;
    country: string;
    duration: number;
    rentability: number;
    riskLevel: string;
    imageUrl?: string | null;
  };
}

export interface UseInvestmentsResult {
  investments: Investment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseUserInvestmentsResult {
  userInvestments: UserInvestmentData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface EnrollmentData {
  amount: number;
  autoReinvest: boolean;
}

export interface UseInvestmentEnrollmentResult {
  enrollInInvestment: (
    investmentId: string,
    data: EnrollmentData
  ) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useInvestments = (filters?: {
  country?: string;
  riskLevel?: string;
  minDuration?: number;
  maxDuration?: number;
}): UseInvestmentsResult => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (filters?.country) searchParams.append('country', filters.country);
      if (filters?.riskLevel)
        searchParams.append('riskLevel', filters.riskLevel);
      if (filters?.minDuration)
        searchParams.append('minDuration', filters.minDuration.toString());
      if (filters?.maxDuration)
        searchParams.append('maxDuration', filters.maxDuration.toString());

      const response = await fetch(
        `/api/investments?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch investments');
      }

      const data = await response.json();
      setInvestments(data.investments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  return {
    investments,
    loading,
    error,
    refetch: fetchInvestments
  };
};

export const useUserInvestments = (): UseUserInvestmentsResult => {
  const [userInvestments, setUserInvestments] = useState<UserInvestmentData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInvestments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/investments');

      if (!response.ok) {
        throw new Error('Failed to fetch user investments');
      }

      const data = await response.json();
      setUserInvestments(data.userInvestments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserInvestments();
  }, [fetchUserInvestments]);

  return {
    userInvestments,
    loading,
    error,
    refetch: fetchUserInvestments
  };
};

export const useInvestmentEnrollment = (): UseInvestmentEnrollmentResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrollInInvestment = useCallback(
    async (investmentId: string, data: EnrollmentData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/user/investments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            investmentId,
            amount: data.amount,
            autoReinvest: data.autoReinvest
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to enroll in investment');
        }

        return response.json();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    enrollInInvestment,
    loading,
    error
  };
};
