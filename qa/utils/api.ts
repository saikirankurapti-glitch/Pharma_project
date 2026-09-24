import { APIRequestContext, expect } from '@playwright/test';

export async function loginApi(request: APIRequestContext, email: string, password: string) {
  const response = await request.post('/api/auth/login', { data: { email, password } });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.token).toBeTruthy();
  return body.token as string;
}

export function authHeaders(token: string) {
  return { Authorization: 'Bearer ' + token };
}
