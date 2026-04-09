import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('SauceDemo Product and Cart Checkout', () => {
  test('should add product to cart and checkout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    expect(await inventoryPage.isLoaded()).toBeTruthy();

    await productPage.addFirstProductToCart();
    await productPage.goToCart();
    expect(await cartPage.getCartItemsCount()).toBeGreaterThan(0);

    await cartPage.checkout();
    await checkoutPage.fillCheckoutInfo('John', 'Doe', '12345');
    await checkoutPage.finishCheckout();
    expect(await checkoutPage.isOrderComplete()).toBeTruthy();
  });
});
