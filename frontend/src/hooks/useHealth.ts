import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { HealthStatus } from '../types';

export const HEALTH_QUERY_KEY = ['health'] as const;

export function useHealth() {
  return useQuery<HealthStatus, Error>({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: () => apiService.getHealth(),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
}
