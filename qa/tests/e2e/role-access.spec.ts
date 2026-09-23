import { test, expect } from '@playwright/test';
import { loginApi, authHeaders } from '../../utils/api';

const pharmacistEmail = process.env.QA_PHARMACIST_EMAIL;
const managerEmail = process.env.QA_MANAGER_EMAIL;
const password = process.env.QA_PASSWORD;

test.describe('RBAC E2E/API', () => {
  test.skip(!pharmacistEmail || !managerEmail || !password, 'QA credentials must be supplied through environment variables');

  test('E2E-SEC-001 pharmacist cannot create products', async ({ request }) => {
    const token = await loginApi(request, pharmacistEmail!, password!);
    const response = await request.post('/api/products', { headers: authHeaders(token), data: {} });
    expect(response.status()).toBe(403);
  });

  test('E2E-SEC-002 manager can access staff roster', async ({ request }) => {
    const token = await loginApi(request, managerEmail!, password!);
    const response = await request.get('/api/auth/users', { headers: authHeaders(token) });
    expect(response.status()).toBe(200);
  });

  test('E2E-SEC-003 pharmacist cannot export invoice CSV', async ({ request }) => {
    const token = await loginApi(request, pharmacistEmail!, password!);
    const response = await request.get('/api/invoices/export/csv', { headers: authHeaders(token) });
    expect(response.status()).toBe(403);
  });
});
