import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Short-lived GET cache + request de-duplication. This prevents multiple React
// components from requesting the same resource at the same time and avoids
// repeated dashboard/list fetches during normal navigation.
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

    // Any write can make previously cached GET responses stale. Invalidating
    // here also avoids wrapping Axios mutation methods and breaking their tuple types.
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
      // Only cache successful GET responses and keep the cache deliberately short.
      getCache.set(key, { data: response.data, expiresAt: Date.now() + DEFAULT_TTL });
      return response;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
}) as typeof api.get;

export default api;
