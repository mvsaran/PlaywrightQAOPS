import { Page } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly firstNameInput = '[data-test="firstName"]';
  readonly lastNameInput = '[data-test="lastName"]';
  readonly postalCodeInput = '[data-test="postalCode"]';
  readonly continueButton = '[data-test="continue"]';
  readonly finishButton = '[data-test="finish"]';
  readonly completeHeader = '.complete-header';

  constructor(page: Page) {
    this.page = page;
  }

  async fillCheckoutInfo(first: string, last: string, postal: string) {
    await this.page.fill(this.firstNameInput, first);
    await this.page.fill(this.lastNameInput, last);
    await this.page.fill(this.postalCodeInput, postal);
    await this.page.click(this.continueButton);
  }

  async finishCheckout() {
    await this.page.click(this.finishButton);
  }

  async isOrderComplete() {
    return this.page.isVisible(this.completeHeader);
  }
}
