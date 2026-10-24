import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { DayAheadForecastsResponse, VintageResponse, LatestForecastResponse } from '../types';

export const DAY_AHEAD_QUERY_KEY = ['forecasts', 'day-ahead'] as const;
export const LATEST_FORECAST_QUERY_KEY = ['forecasts', 'latest'] as const;
export const vintageQueryKey = (date: string) => ['forecasts', 'vintage', date] as const;

export function useDayAheadForecasts() {
  return useQuery<DayAheadForecastsResponse, Error>({
    queryKey: DAY_AHEAD_QUERY_KEY,
    queryFn: () => apiService.getDayAheadForecasts(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

export function useVintageForecasts(date: string) {
  return useQuery<VintageResponse, Error>({
    queryKey: vintageQueryKey(date),
    queryFn: () => apiService.getVintageForecasts(date),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!date,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

export function useLatestForecast() {
  return useQuery<LatestForecastResponse, Error>({
    queryKey: LATEST_FORECAST_QUERY_KEY,
    queryFn: () => apiService.getLatestForecast(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}
