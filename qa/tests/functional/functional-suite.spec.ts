import { test, expect, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const pharmacistEmail = process.env.QA_PHARMACIST_EMAIL;
const managerEmail = process.env.QA_MANAGER_EMAIL;
const password = process.env.QA_PASSWORD;

test.describe.configure({ mode: 'serial' });

let pharmacistPage: Page;
let managerPage: Page;
let pharmacistContext: BrowserContext;
let managerContext: BrowserContext;

async function signIn(page: Page, email: string) {
  await new LoginPage(page).signIn(email, password!);
}

test.beforeAll(async ({ browser }) => {
  test.skip(!pharmacistEmail || !managerEmail || !password, 'QA credentials must be supplied by the workflow');
  pharmacistContext = await browser.newContext();
  managerContext = await browser.newContext();
  pharmacistPage = await pharmacistContext.newPage();
  managerPage = await managerContext.newPage();
  await signIn(pharmacistPage, pharmacistEmail!);
  await signIn(managerPage, managerEmail!);
});

test.afterAll(async () => {
  await pharmacistContext?.close();
  await managerContext?.close();
});

test('WEB-AUTH-001 sign in successfully', async () => {
  await expect(pharmacistPage.locator('header').getByText(/GENQUANTAA POS/i)).toBeVisible();
});

test('WEB-POS-001 open POS terminal', async () => {
  await pharmacistPage.getByTitle('POS Billing Terminal').click();
  await expect(pharmacistPage.getByPlaceholder(/Search Medicine Name/i)).toBeVisible();
  await expect(pharmacistPage.getByText(/Billing Summary/i).first()).toBeVisible();
});

test('WEB-POS-002 search medicine and display result', async () => {
  await pharmacistPage.getByTitle('POS Billing Terminal').click();
  const search = pharmacistPage.getByPlaceholder(/Search Medicine Name/i);
  await search.fill('Dolo 650');
  await expect(pharmacistPage.getByText(/Dolo 650/i).first()).toBeVisible();
});

test('WEB-INV-001 open inventory and search products', async () => {
  await pharmacistPage.getByTitle('Inventory Catalog').click();
  await expect(pharmacistPage.getByText(/Pharmacy Inventory & Stock Catalog/i)).toBeVisible();
  await expect(pharmacistPage.getByPlaceholder(/Search Medicine Name/i)).toBeVisible();
});

test('WEB-INV-002 inventory stock indicators are visible', async () => {
  await pharmacistPage.getByTitle('Inventory Catalog').click();
  await expect(pharmacistPage.getByText(/Low Stock Items/i)).toBeVisible();
});

test('WEB-GRN-001 open GRN/purchase module', async () => {
  await managerPage.getByTitle('Stock Purchase GRN (Manager)').click();
  await expect(managerPage.locator('body')).toContainText(/GRN|Purchase|Goods Receipt/i);
});

test('WEB-RET-001 open returns module', async () => {
  await pharmacistPage.getByTitle('Returns & Refund Credit Notes').click();
  await expect(pharmacistPage.locator('body')).toContainText(/Returns|Refund/i);
});

test('WEB-EXP-001 open expiry/disposal management', async () => {
  await managerPage.getByTitle('Expiry & Stock Disposal Management (Manager)').click();
  await expect(managerPage.locator('body')).toContainText(/Expiry|Disposal/i);
});

test('WEB-PAT-001 open patients/CRM', async () => {
  await pharmacistPage.getByTitle('Patients History Directory').click();
  await expect(pharmacistPage.locator('body')).toContainText(/Patient|Clinical|CRM/i);
});

test('WEB-SUP-001 open suppliers', async () => {
  await managerPage.getByTitle('Suppliers & Vendors Directory (Manager)').click();
  await expect(managerPage.locator('body')).toContainText(/Supplier|Vendor/i);
});

test('WEB-RPT-001 open reports', async () => {
  await managerPage.getByTitle('Sales Reports & GST Analytics (Manager)').click();
  await expect(managerPage.getByText(/Sales Reports & GST Analytics/i)).toBeVisible();
  await expect(managerPage.getByText(/LAST 7 DAYS/i)).toBeVisible();
});

test('WEB-SET-001 open settings', async () => {
  await managerPage.getByTitle('Store Settings & Hardware Config (Manager)').click();
  await expect(managerPage.locator('body')).toContainText(/Settings|Security|Store/i);
});

test('WEB-DEL-001 open online delivery', async () => {
  await pharmacistPage.getByTitle('Online Home Delivery Dashboard').click();
  await expect(pharmacistPage.locator('body')).toContainText(/Delivery|Order/i);
});

test('WEB-PO-001 purchase order UI is reachable', async () => {
  await managerPage.getByTitle('Stock Purchase GRN (Manager)').click();
  await expect(managerPage.locator('body')).toContainText(/Purchase|Order|Supplier/i);
});

test('WEB-CLI-001 clinical/consultation UI is reachable', async () => {
  await pharmacistPage.getByTitle('Customer Voice Record & Discussion Notes').click();
  await expect(pharmacistPage.locator('body')).toContainText(/Voice|Consultation|Discussion|Patient/i);
});

test('WEB-SEC-001 authenticated session is retained after navigation', async () => {
  await pharmacistPage.getByTitle('Dashboard').click();
  await expect(pharmacistPage.locator('header').getByText(/GENQUANTAA POS/i)).toBeVisible();
});
