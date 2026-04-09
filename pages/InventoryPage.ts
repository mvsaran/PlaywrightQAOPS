import { Page } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly inventoryList = '.inventory_list';
  readonly inventoryItem = '.inventory_item';
  readonly burgerMenu = '#react-burger-menu-btn';
  readonly logoutLink = '#logout_sidebar_link';

  constructor(page: Page) {
    this.page = page;
  }

  async isLoaded() {
    return this.page.isVisible(this.inventoryList);
  }

  async getInventoryItemsCount() {
    return this.page.locator(this.inventoryItem).count();
  }

  async logout() {
    await this.page.click(this.burgerMenu);
    await this.page.click(this.logoutLink);
  }
}
