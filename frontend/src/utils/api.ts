import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// Local development uses Vite's /api proxy. Production is deployed as a
// separate Azure Static Web App, so API calls must target the Azure backend.
const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

type CacheEntry = { expiresAt: number; data: unknown };
const getCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<any>>();
const DEFAULT_TTL = 15_000;

const cacheKey = (url: string, params?: unknown) => `${url}|${JSON.stringify(params ?? {})}`;
const invalidateCache = () => getCache.clear();

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    if (config.method && config.method.toLowerCase() !== 'get') invalidateCache();
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      invalidateCache();
    }
    return Promise.reject(error);
  }
);

const originalGet = api.get.bind(api);
api.get = ((url: string, config?: AxiosRequestConfig) => {
  const key = cacheKey(url, config?.params);
  const now = Date.now();
  const cached = getCache.get(key);

  if (cached && cached.expiresAt > now) {
    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK (cache)',
      headers: {},
      config: config as any,
    }) as any;
  }

  const existing = inFlight.get(key);
  if (existing) return existing;

  const request = originalGet(url, config)
    .then((response) => {
      getCache.set(key, { data: response.data, expiresAt: Date.now() + DEFAULT_TTL });
      return response;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
}) as typeof api.get;

export default api;
