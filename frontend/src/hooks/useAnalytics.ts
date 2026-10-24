import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { AnalyticsResponse, MergedAnalyticsResponse } from '../types';

export const ANALYTICS_QUERY_KEY = ['analytics'] as const;
export const MERGED_ANALYTICS_QUERY_KEY = ['analytics', 'merged'] as const;

export function useAnalytics() {
  return useQuery<AnalyticsResponse, Error>({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: () => apiService.getAnalytics(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

export function useMergedAnalytics() {
  return useQuery<MergedAnalyticsResponse, Error>({
    queryKey: MERGED_ANALYTICS_QUERY_KEY,
    queryFn: () => apiService.getMergedAnalytics(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}
