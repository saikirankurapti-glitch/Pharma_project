import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const email = process.env.QA_PHARMACIST_EMAIL;
const password = process.env.QA_PASSWORD;

test.describe('Authentication E2E', () => {
  test.skip(!email || !password, 'QA credentials must be supplied through environment variables');

  test('E2E-AUTH-001 valid login', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await expect(page.locator('header')).toBeVisible();
  });

  test('E2E-AUTH-002 invalid password is rejected', async ({ page }) => {
    const login = new LoginPage(page);
    await login.submitInvalid(email!, 'invalid-password-for-test');
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('E2E-AUTH-003 protected API rejects missing authentication', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(401);
  });
});
