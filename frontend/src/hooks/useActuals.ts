import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { ActualsResponse } from '../types';

export const ACTUALS_QUERY_KEY = ['actuals'] as const;

export function useActuals() {
  return useQuery<ActualsResponse, Error>({
    queryKey: ACTUALS_QUERY_KEY,
    queryFn: () => apiService.getActuals(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}
