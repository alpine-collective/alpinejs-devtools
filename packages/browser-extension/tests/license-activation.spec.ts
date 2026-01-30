import { test, expect } from '@playwright/test';

test.describe('License Activation', () => {
  test('should handle the license activation flow successfully', async ({ page }) => {
    await page.goto('/simulator?sa-enabled=true');

    await page.getByTestId('debug-menu-button').click();
    await page.getByTestId('expire-trial-button').click();
    await page.reload();

    await expect(page.getByTestId('footer-left')).toContainText('Trial expired');

    await page.getByTestId('tab-link-stores').click();

    await page.getByTestId('activate-license-button').click();
    await page.getByTestId('license-key-input').fill('VALID-LICENSE-KEY');
    await page.getByTestId('activate-button').click();

    await page.getByTestId('tab-link-stores').click();
    await expect(page.getByTestId('store-name')).toHaveCount(2);
    await expect(page.getByTestId('store-name').filter({ hasText: 'sampleStore' })).toBeVisible();
    await expect(page.getByTestId('store-name').filter({ hasText: 'primitiveVal' })).toBeVisible();
    await expect(page.getByTestId('footer-left')).not.toContainText('Trial');
  });

  test('should activate license during an active trial', async ({ page }) => {
    await page.goto('/simulator?sa-enabled=true');

    await page.getByTestId('tab-link-stores').click();
    await page.getByTestId('start-trial-button').click();

    await expect(page.getByTestId('footer-left')).toContainText('Trial expires in: 7.0 days');

    await page.getByTestId('activate-license-button').click();
    await page.getByTestId('license-key-input').fill('VALID-LICENSE-KEY');
    await page.getByTestId('activate-button').click();

    await expect(page.getByTestId('footer-left')).not.toContainText('Trial');

    await page.getByTestId('tab-link-stores').click();
    await expect(page.getByTestId('store-name')).toHaveCount(2);
  });

  test('should handle an invalid license key error during activation', async ({ page }) => {
    await page.goto('/simulator?sa-enabled=true');

    await page.getByTestId('debug-menu-button').click();
    await page.getByTestId('expire-trial-button').click();
    await page.reload();

    await expect(page.getByTestId('footer-left')).toContainText('Trial expired');

    await page.getByTestId('tab-link-stores').click();

    await page.getByTestId('activate-license-button').click();
    await page.getByTestId('license-key-input').fill('INVALID-LICENSE-KEY');
    await page.getByTestId('activate-button').click();

    await expect(page.getByTestId('license-error-message')).toBeVisible();
    await expect(page.getByTestId('license-error-message')).toContainText(
      'This license key is not valid.',
    );

    await page.locator('dialog[open] [aria-label="Close dialog"]').click();

    await page.getByTestId('tab-link-stores').click();
    await expect(page.getByTestId('get-access-button')).not.toHaveCount(0);
    await expect(page.getByTestId('footer-left')).toContainText('Trial expired');
  });
});
