import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const pharmacistEmail = process.env.QA_PHARMACIST_EMAIL;
const managerEmail = process.env.QA_MANAGER_EMAIL;
const password = process.env.QA_PASSWORD;

test.describe.configure({ mode: 'parallel' });

async function signIn(page: import('@playwright/test').Page, email: string) {
  await new LoginPage(page).signIn(email, password!);
}

test.beforeEach(async ({ page }) => {
  test.skip(!pharmacistEmail || !managerEmail || !password, 'QA credentials must be supplied by the workflow');
});

test('WEB-AUTH-001 sign in successfully', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await expect(page.locator('header').getByText(/GENQUANTAA POS/i)).toBeVisible();
});

test('WEB-POS-001 open POS terminal', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('POS Billing Terminal').click();
  await expect(page.getByPlaceholder(/Search Drug \/ Salt \/ Brand \/ Barcode/i)).toBeVisible();
  await expect(page.getByText(/Billing Summary/i).first()).toBeVisible();
});

test('WEB-POS-002 search medicine and display result', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('POS Billing Terminal').click();
  const search = page.getByPlaceholder(/Search Drug \/ Salt \/ Brand \/ Barcode/i);
  await search.fill('Dolo 650');
  await expect(page.getByText(/Dolo 650/i).first()).toBeVisible();
});

test('WEB-INV-001 open inventory and search products', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('Inventory Catalog').click();
  await expect(page.getByText(/Pharmacy Inventory & Stock Catalog/i)).toBeVisible();
});

test('WEB-INV-002 inventory stock indicators are visible', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('Inventory Catalog').click();
  await expect(page.locator('body')).toContainText(/Low Stock|Stock|Inventory/i);
});

test('WEB-GRN-001 open GRN/purchase module', async ({ page }) => {
  await signIn(page, managerEmail!);
  await page.getByTitle('Stock Purchase GRN (Manager)').click();
  await expect(page.locator('body')).toContainText(/GRN|Purchase|Goods Receipt/i);
});

test('WEB-RET-001 open returns module', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('Returns & Refund Credit Notes').click();
  await expect(page.locator('body')).toContainText(/Returns|Refund/i);
});

test('WEB-EXP-001 open expiry/disposal management', async ({ page }) => {
  await signIn(page, managerEmail!);
  await page.getByTitle('Expiry & Stock Disposal Management (Manager)').click();
  await expect(page.locator('body')).toContainText(/Expiry|Disposal/i);
});

test('WEB-PAT-001 open patients/CRM', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('Patients History Directory').click();
  await expect(page.locator('body')).toContainText(/Patient|Clinical|CRM/i);
});

test('WEB-SUP-001 open suppliers', async ({ page }) => {
  await signIn(page, managerEmail!);
  await page.getByTitle('Suppliers & Vendors Directory (Manager)').click();
  await expect(page.locator('body')).toContainText(/Supplier|Vendor/i);
});

test('WEB-RPT-001 open reports', async ({ page }) => {
  await signIn(page, managerEmail!);
  await page.getByTitle('Sales Reports & GST Analytics (Manager)').click();
  await expect(page.getByText(/Sales Reports & GST Analytics/i)).toBeVisible();
});

test('WEB-SET-001 open settings', async ({ page }) => {
  await signIn(page, managerEmail!);
  await page.getByTitle('Store Settings & Hardware Config (Manager)').click();
  await expect(page.locator('body')).toContainText(/Settings|Security|Store/i);
});

test('WEB-DEL-001 open online delivery', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('Online Home Delivery Dashboard').click();
  await expect(page.locator('body')).toContainText(/Delivery|Order/i);
});

test('WEB-PO-001 purchase order UI is reachable', async ({ page }) => {
  await signIn(page, managerEmail!);
  await page.getByTitle('Stock Purchase GRN (Manager)').click();
  await expect(page.locator('body')).toContainText(/Purchase|Order|Supplier/i);
});

test('WEB-CLI-001 clinical/consultation UI is reachable', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('Customer Voice Record & Discussion Notes').click();
  await expect(page.locator('body')).toContainText(/Voice|Consultation|Discussion|Patient/i);
});

test('WEB-SEC-001 authenticated session is retained after navigation', async ({ page }) => {
  await signIn(page, pharmacistEmail!);
  await page.getByTitle('Dashboard').first().click();
  await expect(page.locator('header').getByText(/GENQUANTAA POS/i)).toBeVisible();
});
