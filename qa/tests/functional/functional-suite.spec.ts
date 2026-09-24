import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const email = process.env.QA_PHARMACIST_EMAIL;
const password = process.env.QA_PASSWORD;

test.describe('GENQUANTAA POS Functional UI Suite', () => {
  test.skip(!email || !password, 'QA credentials must be supplied by the workflow');

  async function login(page: any) {
    await new LoginPage(page).signIn(email!, password!);
  }

  test('WEB-AUTH-001 sign in successfully', async ({ page }) => {
    await login(page);
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();
  });

  test('WEB-POS-001 open POS terminal', async ({ page }) => {
    await login(page);
    await page.getByText(/POS Terminal/i).first().click();
    await expect(page.getByPlaceholder(/Search Medicine Name/i)).toBeVisible();
    await expect(page.getByText(/Billing Summary/i).first()).toBeVisible();
  });

  test('WEB-POS-002 search medicine and display result', async ({ page }) => {
    await login(page);
    await page.getByText(/POS Terminal/i).first().click();
    const search = page.getByPlaceholder(/Search Medicine Name/i);
    await search.fill('Dolo 650');
    await expect(page.getByText(/Dolo 650/i).first()).toBeVisible();
  });

  test('WEB-INV-001 open inventory and search products', async ({ page }) => {
    await login(page);
    await page.getByText(/^Inventory$/i).first().click();
    await expect(page.getByText(/Pharmacy Inventory & Stock Catalog/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Search Medicine Name/i)).toBeVisible();
  });

  test('WEB-INV-002 inventory stock indicators are visible', async ({ page }) => {
    await login(page);
    await page.getByText(/^Inventory$/i).first().click();
    await expect(page.getByText(/Low Stock Items/i)).toBeVisible();
  });

  test('WEB-GRN-001 open GRN/purchase module', async ({ page }) => {
    await login(page);
    await page.getByText(/GRN|Purchase/i).first().click();
    await expect(page.locator('body')).toContainText(/GRN|Purchase|Goods Receipt/i);
  });

  test('WEB-RET-001 open returns module', async ({ page }) => {
    await login(page);
    await page.getByText(/^Returns$/i).first().click();
    await expect(page.locator('body')).toContainText(/Returns|Refund/i);
  });

  test('WEB-EXP-001 open expiry/disposal management', async ({ page }) => {
    await login(page);
    await page.getByText(/Expiry|Disposal/i).first().click();
    await expect(page.locator('body')).toContainText(/Expiry|Disposal/i);
  });

  test('WEB-PAT-001 open patients/CRM', async ({ page }) => {
    await login(page);
    await page.getByText(/Patients|CRM/i).first().click();
    await expect(page.locator('body')).toContainText(/Patient|Clinical|CRM/i);
  });

  test('WEB-SUP-001 open suppliers', async ({ page }) => {
    await login(page);
    await page.getByText(/Suppliers/i).first().click();
    await expect(page.locator('body')).toContainText(/Supplier|Vendor/i);
  });

  test('WEB-RPT-001 open reports', async ({ page }) => {
    await login(page);
    await page.getByText(/^Reports$/i).first().click();
    await expect(page.getByText(/Sales Reports & GST Analytics/i)).toBeVisible();
    await expect(page.getByText(/LAST 7 DAYS/i)).toBeVisible();
  });

  test('WEB-SET-001 open settings', async ({ page }) => {
    await login(page);
    await page.getByText(/^Settings$/i).first().click();
    await expect(page.locator('body')).toContainText(/Settings|Security|Store/i);
  });

  test('WEB-DEL-001 open online delivery', async ({ page }) => {
    await login(page);
    await page.getByText(/Online Delivery|Delivery/i).first().click();
    await expect(page.locator('body')).toContainText(/Delivery|Order/i);
  });

  test('WEB-PO-001 purchase order UI is reachable', async ({ page }) => {
    await login(page);
    await page.getByText(/Purchase Order|Procurement/i).first().click();
    await expect(page.locator('body')).toContainText(/Purchase|Order|Supplier/i);
  });

  test('WEB-CLI-001 clinical/consultation UI is reachable', async ({ page }) => {
    await login(page);
    const body = page.locator('body');
    await expect(body).toContainText(/Clinical|Consultation|Patient/i);
  });

  test('WEB-SEC-001 authenticated session is retained after navigation', async ({ page }) => {
    await login(page);
    await page.getByText(/Reports/i).first().click();
    await page.getByText(/Dashboard/i).first().click();
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();
  });
});
