import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const email = process.env.QA_PHARMACIST_EMAIL;
const password = process.env.QA_PASSWORD;

test.describe('Core business UI E2E', () => {
  test.skip(!email || !password, 'QA credentials must be supplied through environment variables');

  test('E2E-POS-001 open POS terminal and search medicines', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    const pos = page.getByText(/POS Terminal/i).first();
    if (await pos.count()) await pos.click();
    await expect(page.getByPlaceholder(/Search Medicine Name/i)).toBeVisible();
    await page.getByPlaceholder(/Search Medicine Name/i).fill('Dolo 650');
    await expect(page.getByText(/Dolo 650/i).first()).toBeVisible();
  });

  test('E2E-INV-001 open inventory and verify search/stock controls', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await page.getByText(/Inventory/i).first().click();
    await expect(page.getByText(/Pharmacy Inventory & Stock Catalog/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Search Medicine Name/i)).toBeVisible();
    await expect(page.getByText(/Low Stock Items/i)).toBeVisible();
  });

  test('E2E-RPT-001 open reports and verify date/report controls', async ({ page }) => {
    await new LoginPage(page).signIn(email!, password!);
    await page.getByText(/Reports/i).first().click();
    await expect(page.getByText(/Sales Reports & GST Analytics/i)).toBeVisible();
    await expect(page.getByText(/LAST 7 DAYS/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
  });
});
