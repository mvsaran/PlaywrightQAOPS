import { Page } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly addToCartButton = 'button[data-test^="add-to-cart-"]';
  readonly cartIcon = '.shopping_cart_link';

  constructor(page: Page) {
    this.page = page;
  }

  async addFirstProductToCart() {
    await this.page.click(this.addToCartButton);
  }

  async goToCart() {
    await this.page.click(this.cartIcon);
  }
}
