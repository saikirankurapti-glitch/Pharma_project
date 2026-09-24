import { test, expect } from '@playwright/test';
import { loginApi, authHeaders } from '../../utils/api';

const pharmacistEmail = process.env.QA_PHARMACIST_EMAIL;
const managerEmail = process.env.QA_MANAGER_EMAIL;
const password = process.env.QA_PASSWORD;

test.describe('API contract validation', () => {
  test.skip(!pharmacistEmail || !managerEmail || !password, 'QA credentials must be supplied through environment variables');

  test('API-001 health endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect((await response.json()).success).toBe(true);
  });

  test('API-002 pharmacist authentication and identity', async ({ request }) => {
    const token = await loginApi(request, pharmacistEmail!, password!);
    const response = await request.get('/api/auth/me', { headers: authHeaders(token) });
    expect(response.status()).toBe(200);
    expect((await response.json()).user.role).toBe('PHARMACIST');
  });

  test('API-003 manager authentication and staff access', async ({ request }) => {
    const token = await loginApi(request, managerEmail!, password!);
    const response = await request.get('/api/auth/users', { headers: authHeaders(token) });
    expect(response.status()).toBe(200);
    expect((await response.json()).success).toBe(true);
  });

  test('API-004 inventory response contract', async ({ request }) => {
    const token = await loginApi(request, pharmacistEmail!, password!);
    const response = await request.get('/api/products?limit=10', { headers: authHeaders(token) });
    expect(response.status()).toBe(200);
    expect(Array.isArray((await response.json()).data)).toBe(true);
  });

  test('API-005 reports response contract', async ({ request }) => {
    const token = await loginApi(request, managerEmail!, password!);
    const response = await request.get('/api/reports/dashboard-stats', { headers: authHeaders(token) });
    expect(response.status()).toBe(200);
    expect((await response.json()).success).toBe(true);
  });

  test('API-006 untrusted CORS origin is rejected', async ({ request }) => {
    const response = await request.get('/api/health', { headers: { Origin: 'https://evil.example' } });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
