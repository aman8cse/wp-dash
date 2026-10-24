import axios from 'axios';
import type {
  ActualsResponse,
  DayAheadForecastsResponse,
  VintageResponse,
  LatestForecastResponse,
  AnalyticsResponse,
  MergedAnalyticsResponse,
  HealthStatus,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging in dev
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const apiService = {
  /** Fetch all actuals for January 2026 */
  getActuals: async (): Promise<ActualsResponse> => {
    const { data } = await apiClient.get<ActualsResponse>('/actuals');
    return data;
  },

  /** Fetch day-ahead forecasts */
  getDayAheadForecasts: async (): Promise<DayAheadForecastsResponse> => {
    const { data } = await apiClient.get<DayAheadForecastsResponse>('/forecasts/day-ahead');
    return data;
  },

  /** Fetch vintage forecasts for a specific date */
  getVintageForecasts: async (date: string): Promise<VintageResponse> => {
    const { data } = await apiClient.get<VintageResponse>('/forecasts/vintage', {
      params: { date },
    });
    return data;
  },

  /** Fetch latest forecast data */
  getLatestForecast: async (): Promise<LatestForecastResponse> => {
    const { data } = await apiClient.get<LatestForecastResponse>('/forecasts/latest');
    return data;
  },

  /** Fetch analytics summary, heatmaps, distributions */
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const { data } = await apiClient.get<AnalyticsResponse>('/analytics');
    return data;
  },

  /** Fetch merged forecast vs actual data with confidence bands */
  getMergedAnalytics: async (): Promise<MergedAnalyticsResponse> => {
    const { data } = await apiClient.get<MergedAnalyticsResponse>('/analytics/merged');
    return data;
  },

  /** Fetch health/status of the backend */
  getHealth: async (): Promise<HealthStatus> => {
    const { data } = await apiClient.get<HealthStatus>('/health');
    return data;
  },
};

export default apiClient;
