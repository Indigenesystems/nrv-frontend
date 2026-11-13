import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosProgressEvent, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/config/constant';
// Make sure to install @tanstack/react-query: npm install @tanstack/react-query
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  clearAuthSession,
  expireIdleSession,
  isSessionIdleExpired,
  touchSessionActivity,
} from '@/lib/sessionIdle';
import { restoreSessionFromRememberMe } from '@/lib/rememberMe';
import { getSessionAccessToken } from '@/lib/authSession';

const AUTH_BYPASS_PATHS = [
  '/auth/login',
  '/auth/session',
  '/auth/logout',
  '/users/confirm-account',
  '/users/resend-verification',
];

const shouldBypassAuth = (url?: string) => {
  if (!url) {
    return false;
  }
  return AUTH_BYPASS_PATHS.some((path) => url.includes(path));
};

const applyBearerToken = (headers: any, accessToken: string) => {
  if (!headers || !accessToken) {
    return;
  }
  const value = `Bearer ${accessToken}`;
  if (typeof headers.set === 'function') {
    headers.set('Authorization', value);
  }
  headers.Authorization = value;
  headers.authorization = value;
};

const getRequestAuthHeader = (headers: any): string => {
  if (!headers) {
    return '';
  }
  if (typeof headers.get === 'function') {
    return String(
      headers.get('Authorization') || headers.get('authorization') || '',
    );
  }
  return String(headers.Authorization || headers.authorization || '');
};

let restoreInFlight: Promise<boolean> | null = null;

const tryRestoreSession = async (): Promise<boolean> => {
  if (!restoreInFlight) {
    restoreInFlight = restoreSessionFromRememberMe()
      .then((session) => Boolean(session?.accessToken))
      .finally(() => {
        restoreInFlight = null;
      });
  }
  return restoreInFlight;
};

const attachAuthRequestInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window === 'undefined') {
        return config;
      }
      if (shouldBypassAuth(config.url)) {
        return config;
      }
      if (isSessionIdleExpired()) {
        expireIdleSession();
        return Promise.reject(new Error('Session expired due to inactivity'));
      }
      const accessToken = getSessionAccessToken();
      if (accessToken) {
        config.headers = config.headers || ({} as InternalAxiosRequestConfig['headers']);
        applyBearerToken(config.headers, accessToken);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
};

const attachAuthResponseInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (typeof window !== 'undefined' && localStorage.getItem('nrv-user')) {
        touchSessionActivity();
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      const requestUrl = String(originalRequest?.url || '');
      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retryRememberMe ||
        shouldBypassAuth(requestUrl) ||
        requestUrl.includes('/notifications')
      ) {
        if (error.response?.status === 403) {
          console.error('Access forbidden');
        } else if (error.response?.status >= 500) {
          console.error('Server error:', error.response.data);
        }
        return Promise.reject(error);
      }

      const sentAuth = getRequestAuthHeader(originalRequest.headers);
      originalRequest._retryRememberMe = true;
      const restored = await tryRestoreSession();
      if (restored) {
        const accessToken = getSessionAccessToken();
        if (accessToken) {
          originalRequest.headers = originalRequest.headers || {};
          applyBearerToken(originalRequest.headers, accessToken);
        }
        return client(originalRequest);
      }

      // Only force logout when a token was actually sent and rejected.
      if (sentAuth) {
        clearAuthSession();
        window.location.href =
          '/sign-in?reason=' +
          encodeURIComponent('Your session has expired. Please sign in again.');
      }
      return Promise.reject(error);
    },
  );
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

attachAuthRequestInterceptor(apiClient);
attachAuthResponseInterceptor(apiClient);

// Allow multipart uploads: drop default JSON content-type when sending FormData
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers) {
      if (typeof (config.headers as any).delete === 'function') {
        (config.headers as any).delete('Content-Type');
        (config.headers as any).delete('content-type');
      } else {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      }
    }
  }
  return config;
});

// Redux slices still use the default axios instance; attach the same auth headers.
attachAuthRequestInterceptor(axios);
attachAuthResponseInterceptor(axios);

// Generic GET query hook
export function useApiQuery<T = unknown>(
  key: any[],
  url: string,
  config?: AxiosRequestConfig,
  options?: UseQueryOptions<T, Error, T, any[]>
) {
  return useQuery<T, Error, T, any[]>({
    ...options,
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    },
  });
}

// Generic mutation hook (POST, PUT, DELETE, PATCH)
export function useApiMutation<T = unknown, TVariables = any>(
  method: 'post' | 'put' | 'delete' | 'patch',
  url: string,
  options?: UseMutationOptions<T, Error, TVariables>
) {
  return useMutation<T, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      let response: AxiosResponse<T>;
      switch (method) {
        case 'post':
          response = await apiClient.post<T>(url, variables);
          break;
        case 'put':
          response = await apiClient.put<T>(url, variables);
          break;
        case 'patch':
          response = await apiClient.patch<T>(url, variables);
          break;
        case 'delete':
          response = await apiClient.delete<T>(url, { data: variables });
          break;
        default:
          throw new Error('Unsupported method');
      }
      return response.data;
    },
    ...options,
  });
}

// File upload mutation hook (single file)
export function useFileUploadMutation<T = unknown>(
  url: string,
  options?: UseMutationOptions<T, Error, { file: File; onProgress?: (progress: number) => void }>
) {
  return useMutation<T, Error, { file: File; onProgress?: (progress: number) => void }>({
    mutationFn: async ({ file, onProgress }: { file: File; onProgress?: (progress: number) => void }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    },
    ...options,
  });
}

// Multiple files upload mutation hook
export function useFilesUploadMutation<T = unknown>(
  url: string,
  options?: UseMutationOptions<T, Error, { files: File[]; onProgress?: (progress: number) => void }>
) {
  return useMutation<T, Error, { files: File[]; onProgress?: (progress: number) => void }>({
    mutationFn: async ({ files, onProgress }: { files: File[]; onProgress?: (progress: number) => void }) => {
      const formData = new FormData();
      files.forEach((file: File, index: number) => {
        formData.append(`files[${index}]`, file);
      });
      const response = await apiClient.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    },
    ...options,
  });
}

// Export the axios instance for direct use if needed
export { apiClient };

// Export types for convenience
export type { AxiosRequestConfig, AxiosResponse };

// Restore ApiService class for legacy axios usage
class ApiService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<any> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<any> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await this.client.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async uploadFiles<T>(url: string, files: File[], onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    files.forEach((file: File, index: number) => {
      formData.append(`files[${index}]`, file);
    });
    try {
      const response = await this.client.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}

export const apiService = new ApiService(apiClient); 