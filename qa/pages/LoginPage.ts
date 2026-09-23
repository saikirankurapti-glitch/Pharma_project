import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/');
    const signIn = this.page.getByRole('button', { name: /sign in/i }).first();
    if (await signIn.count()) await signIn.click();
    await expect(this.page.getByText('GENQUANTAA POS', { exact: true }).first()).toBeVisible();
  }

  async signIn(email: string, password: string) {
    await this.open();
    await this.page.locator('input[type="email"]').first().fill(email);
    await this.page.locator('input[type="password"]').first().fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).last().click();
    await expect(this.page.locator('header').getByText(/GENQUANTAA POS/i)).toBeVisible();
  }

  async submitInvalid(email: string, password: string) {
    await this.open();
    await this.page.locator('input[type="email"]').first().fill(email);
    await this.page.locator('input[type="password"]').first().fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).last().click();
  }
}
