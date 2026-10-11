import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('provas.auth');
    if (stored) {
      const parsed = JSON.parse(stored) as { token?: string };
      if (parsed.token) config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  } catch {
    localStorage.removeItem('provas.auth');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    if (status === 401 && !requestUrl.includes('/sessions')) {
      localStorage.removeItem('provas.auth');
      window.dispatchEvent(new CustomEvent('provas:auth-expired'));
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;
    if (error.code === 'ERR_NETWORK') return 'Não foi possível conectar à API. Verifique a URL e se o servidor está ativo.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function responseArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}
