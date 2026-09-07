import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE + '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Request interceptor — attach JWT access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(original);
        } catch {
          useAuthStore.getState().logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } else {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// Typed error extractor
// ─────────────────────────────────────────────────────────────

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
