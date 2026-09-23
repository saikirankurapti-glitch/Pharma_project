import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { getRuntime } from '../../utils/runtime';

const runtime = getRuntime();
const email = runtime.pharmacistEmail;
const password = runtime.password;

test.describe('Smoke', () => {
  test('SMOKE-001 application loads and login succeeds', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await expect(page.locator('header')).toBeVisible();
  });

  test('SMOKE-002 authenticated shell exposes core navigation', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await expect(page.getByText(/Inventory/i).first()).toBeVisible();
    await expect(page.getByText(/Reports/i).first()).toBeVisible();
  });

  test('SMOKE-003 logout returns to authentication', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await page.locator('header').getByRole('button').last().click();
    await page.getByRole('button', { name: /sign out account/i }).click();
    await expect(page.getByText(/Already Have Account/i)).toBeVisible();
  });
});
