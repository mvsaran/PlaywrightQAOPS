import { Page } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly checkoutButton = '[data-test="checkout"]';
  readonly cartItem = '.cart_item';

  constructor(page: Page) {
    this.page = page;
  }

  async getCartItemsCount() {
    return this.page.locator(this.cartItem).count();
  }

  async checkout() {
    await this.page.click(this.checkoutButton);
  }
}
