import { test, expect } from '@playwright/test';
import { target } from './helpers';

test.describe('Trial Mode', () => {
  test('should handle the stores trial mode flow correctly', async ({ page }) => {
    await page.goto('/simulator?sa-enabled=true');

    await page.getByTestId('tab-link-stores').click();

    await expect(
      page.locator('.grid').filter({ hasText: 'The Stores feature is part of our' }),
    ).toBeVisible();
    await expect(page.getByTestId('start-trial-button')).toBeVisible();

    await expect(page.getByTestId('start-trial-button')).toHaveText('Start 7 day trial');
    await page.getByTestId('start-trial-button').click();
    await expect(page.getByTestId('start-trial-button')).toHaveCount(0);

    await page.getByTestId('tab-link-stores').click();
    await expect(page.getByTestId('store-name')).toHaveCount(2);
    await expect(page.getByTestId('store-name').filter({ hasText: 'sampleStore' })).toBeVisible();
    await expect(page.getByTestId('store-name').filter({ hasText: 'primitiveVal' })).toBeVisible();
    await expect(page.getByTestId('start-trial-button')).toHaveCount(0);

    await expect(page.getByTestId('footer-left')).toContainText('Trial expires in: 7.0 days');

    await page.getByTestId('debug-menu-button').click();
    await page.getByTestId('expire-trial-button').click();

    await page.reload();
    await expect(page.getByTestId('footer-left')).toContainText('Trial expired');

    await page.getByTestId('tab-link-stores').click();
    await expect(page.getByTestId('get-access-button')).toBeVisible();
  });

  test('should handle the warnings trial mode flow correctly', async ({ page }) => {
    await page.goto('/simulator?sa-enabled=true');

    await page.getByTestId('tab-link-warnings').click();
    const brokenClick = target(page).getByTestId('broken-click');
    for (let i = 0; i < 5; i++) {
      await brokenClick.click();
    }

    await page.getByTestId('eval-error-button').last().click();
    await expect(
      page.locator('.grid').filter({ hasText: 'The Warnings feature is part of our' }),
    ).toBeVisible();

    await expect(page.getByTestId('start-trial-button')).toBeVisible();
    await expect(page.getByTestId('start-trial-button')).toHaveText('Start 7 day trial');
    await page.getByTestId('start-trial-button').click();

    await page.getByTestId('eval-error-button').last().click();
    await expect(page.getByTestId('eval-error-button')).toHaveCount(5);

    await expect(page.getByTestId('footer-left')).toContainText('Trial expires in: 7.0 days');

    await page.getByTestId('debug-menu-button').click();
    await page.getByTestId('expire-trial-button').click();

    await page.reload();

    await page.getByTestId('tab-link-warnings').click();
    for (let i = 0; i < 5; i++) {
      await brokenClick.click();
    }

    await expect(page.getByTestId('footer-left')).toContainText('Trial expired');

    await page.getByTestId('eval-error-button').last().click();
    await expect(page.getByTestId('get-access-button')).toBeVisible();
  });

  test('should handle the history flyout trial mode flow correctly', async ({ page }) => {
    await page.goto('/simulator?sa-enabled=true&target=v3.html');

    await page.getByTestId('component-name').filter({ hasText: 'model-no-render' }).click();
    await page.getByTestId('history-flyout').getByText('History').click();

    await target(page).getByTestId('model-no-render').pressSequentially('ne', { delay: 20 });

    await expect(page.getByTestId('history-flyout').locator('li')).toHaveCount(3);

    await page.getByTestId('history-message-0').click();
    await expect(page.getByTestId('attr-list-header')).toBeVisible();

    await page.getByTestId('history-message-1').click();
    await expect(page.getByTestId('early-access-notice')).toBeVisible();
    await expect(page.getByTestId('early-access-notice')).toContainText(
      'The Time Travel Debugging feature is part of our',
    );

    await page.getByTestId('start-trial-button').click();

    await page.getByTestId('history-message-1').click();
    await expect(page.getByTestId('attr-list-header')).toBeVisible();
    await expect(page.getByTestId('early-access-notice')).toHaveCount(0);

    await page.getByTestId('debug-menu-button').click();
    await page.getByTestId('expire-trial-button').click();

    await page.reload();

    await expect(
      page.getByTestId('component-name').filter({ hasText: 'model-no-render' }),
    ).toBeVisible();

    await target(page).getByTestId('model-no-render').fill('new');

    await page.getByTestId('component-name').filter({ hasText: 'model-no-render' }).click();
    await page.getByTestId('history-flyout').getByText('History').click();
    await page.getByTestId('history-message-1').click();
    await expect(page.getByTestId('early-access-notice')).toBeVisible();
    await expect(page.getByTestId('early-access-notice')).toContainText('Your trial has expired');
    await expect(page.getByTestId('get-access-button')).toBeVisible();
  });
});
