import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const email = process.env.QA_PHARMACIST_EMAIL;
const password = process.env.QA_PASSWORD;

test.describe('Regression - critical workflows', () => {
  test.skip(!email || !password, 'QA credentials must be supplied through environment variables');

  test('REGRESSION-001 login → POS search remains functional', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await page.getByText(/POS Terminal/i).first().click();
    await page.getByPlaceholder(/Search Medicine Name/i).fill('Dolo 650');
    await expect(page.getByText(/Dolo 650/i).first()).toBeVisible();
  });

  test('REGRESSION-002 login → inventory remains functional', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await page.getByText(/Inventory/i).first().click();
    await expect(page.getByText(/Pharmacy Inventory & Stock Catalog/i)).toBeVisible();
  });

  test('REGRESSION-003 login → reports remains functional', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await page.getByText(/Reports/i).first().click();
    await expect(page.getByRole('button', { name: /Print Report/i })).toBeVisible();
  });
});
