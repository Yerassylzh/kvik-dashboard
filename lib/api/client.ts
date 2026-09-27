import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { ApiError } from '@/types/api';
import { transformI18nMessages } from '@/lib/i18n/transformer';
import { getCurrentLocale } from '@/lib/i18n/config';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// ---------------------------------------------------------------------------
// Singleton Token Refresh Promise
// ---------------------------------------------------------------------------
let refreshPromise: Promise<string> | null = null;

export async function getOrRefreshToken(): Promise<string> {
  const currentToken = useAuthStore.getState().accessToken;
  if (currentToken) {
    return currentToken;
  }

  // Reuse ongoing refresh promise if one is already in flight
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post<{ access_token: string }>(
        '/api/auth/refresh',
        {},
        { withCredentials: true }
      );
      const newToken = data.access_token;
      useAuthStore.getState().setAccessToken(newToken);
      return newToken;
    } catch (err) {
      useAuthStore.getState().clearAuth();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Request Interceptor: Attach Access Token and Accept-Language
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (config.headers) {
      config.headers['Accept-Language'] = getCurrentLocale();

      // For FormData payloads, remove manual Content-Type to allow browser/Axios to set multipart boundary
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    }

    const isAuthRoute =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh');

    if (isAuthRoute) {
      return config;
    }

    let token = useAuthStore.getState().accessToken;

    // If no token in memory on startup (e.g. after page refresh), wait for singleton refresh
    if (!token && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isPublicPath =
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/register-staff') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/verify-email') ||
        pathname.startsWith('/claim-workspace') ||
        pathname.startsWith('/auth/handoff') ||
        pathname.includes('callback');

      if (!isPublicPath) {
        try {
          token = await getOrRefreshToken();
        } catch {
          // Refresh failed — proceed without token and let response interceptor handle status
        }
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor: Handle 401, Silent Refresh & i18n Translation
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = transformI18nMessages(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.data) {
      error.response.data = transformI18nMessages(error.response.data);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;

      try {
        useAuthStore.getState().setAccessToken(null);
        const newAccessToken = await getOrRefreshToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();

        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          const isPublicPath =
            pathname.startsWith('/login') ||
            pathname.startsWith('/register') ||
            pathname.startsWith('/register-staff') ||
            pathname.startsWith('/forgot-password') ||
            pathname.startsWith('/verify-email') ||
            pathname.startsWith('/claim-workspace') ||
            pathname.startsWith('/auth/handoff') ||
            pathname.includes('callback');

          if (!isPublicPath) {
            const from = encodeURIComponent(pathname + window.location.search);
            window.location.href = `/login?from=${from}`;
          }
        }

        return Promise.reject(
          new ApiError(401, 'Session expired. Please log in again.', error.response?.data)
        );
      }
    }

    console.error(
      '[apiClient Error]',
      error.config?.method?.toUpperCase(),
      error.config?.url,
      'Status:',
      error.response?.status,
      'Response Body:',
      error.response?.data,
      'Request Payload:',
      error.config?.data
    );

    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'An unexpected error occurred';
    const status = error.response?.status || 500;

    return Promise.reject(new ApiError(status, message, error.response?.data));
  }
);


