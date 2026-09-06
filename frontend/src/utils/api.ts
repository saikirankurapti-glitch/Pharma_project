import axios, { AxiosRequestConfig } from 'axios';

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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) localStorage.removeItem('token');
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

// Mutations invalidate cached GETs so the UI never serves stale data after a write.
const invalidateCache = () => getCache.clear();
for (const method of ['post', 'put', 'patch', 'delete'] as const) {
  const original = api[method].bind(api);
  (api as any)[method] = (...args: any[]) => original(...args).finally(invalidateCache);
}

export default api;
