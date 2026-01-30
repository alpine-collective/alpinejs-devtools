import { test, expect } from '@playwright/test';
import { target } from './helpers';

test.describe('History', () => {
  test('should display "history", open the flyout and display messages when clicked', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { value: 'en-US' });
    });

    const fixedDate = new Date('2025-01-15T10:30:00');
    await page.clock.setSystemTime(fixedDate);

    await page.goto('/simulator?target=v3.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();

    const formattedHourMinute = fixedDate
      .toLocaleTimeString('en-US')
      .split(':')
      .slice(0, 2)
      .join(':');
    const formattedDate = fixedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    await page.getByTestId('component-name').filter({ hasText: 'model-no-render' }).click();

    await expect(page.getByTestId('history-flyout').getByText('History')).toBeVisible();
    await page.getByTestId('history-flyout').getByText('History').click();

    await expect(page.getByTestId('history-message-0')).toBeVisible();
    await expect(page.getByTestId('history-message-0')).toContainText('+0ms');
    await expect(page.getByTestId('history-message-0')).toContainText(formattedHourMinute);

    await target(page).getByTestId('model-no-render').clear();
    await expect(page.getByTestId('history-flyout').locator('li')).toHaveCount(2);

    await target(page).getByTestId('model-no-render').pressSequentially('new', { delay: 20 });
    await expect(page.getByTestId('history-flyout').locator('li')).toHaveCount(5);

    await page.getByTestId('history-message-3').click();

    const header = page.getByTestId('attr-list-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText(formattedDate);
    await expect(header).toContainText(formattedHourMinute);
    await expect(page.getByTestId('data-property-name-text')).toBeVisible();
    await expect(page.getByTestId('data-property-name-text')).toHaveText('text');
    await expect(page.getByTestId('data-property-value-text')).toBeVisible();
    await expect(page.getByTestId('data-property-value-text')).toHaveText('"ne"');

    await page.getByTestId('history-message-3').click();

    await expect(page.getByTestId('data-property-name-text')).toBeVisible();
    await expect(page.getByTestId('data-property-name-text')).toHaveText('text');
    await expect(page.getByTestId('data-property-value-text')).toBeVisible();
    await expect(page.getByTestId('data-property-value-text')).toHaveText('"new"');

    await expect(page.getByTestId('apply-snapshot')).toHaveCount(0);

    await page.getByTestId('history-message-3').click();
    await expect(page.getByTestId('apply-snapshot')).toBeVisible();
    await page.getByTestId('apply-snapshot').click();

    await expect(target(page).getByTestId('model-no-render')).toHaveValue('ne');
  });

  test('pinning a field works across messages', async ({ page }) => {
    await page.goto('/simulator?target=v3.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();

    await page.getByTestId('component-name').filter({ hasText: 'model-no-render' }).click();

    await expect(page.getByTestId('history-flyout').getByText('History')).toBeVisible();
    await page.getByTestId('history-flyout').getByText('History').click();

    const nestedInput = target(page).getByTestId('nested-model-no-render');
    await nestedInput.fill('');
    await expect(page.getByTestId('history-flyout').locator('li')).toHaveCount(2);
    await nestedInput.fill('new');

    await expect(page.getByTestId('history-flyout').locator('li')).toHaveCount(3);

    await page.getByTestId('history-message-0').click();

    await page.getByTestId('data-property-name-model').click();
    await expect(page.getByTestId('data-property-name-nested')).toBeVisible();
    await expect(page.getByTestId('data-property-name-nested')).toHaveText('nested');
    await expect(page.getByTestId('data-property-value-nested')).toBeVisible();
    await expect(page.getByTestId('data-property-value-nested')).toHaveText('"nested-initial"');

    await expect(page.getByTestId('pin-model.nested')).toBeVisible();
    await expect(page.getByTestId('pin-model.nested')).toHaveText('(pin)');
    await page.getByTestId('pin-model.nested').click();

    await expect(page.getByTestId('data-property-name-text')).toHaveCount(0);
    await expect(page.getByTestId('apply-snapshot')).toBeVisible();

    await page.getByTestId('history-message-1').click();
    await expect(page.getByTestId('data-property-name-text')).toHaveCount(0);
    await expect(page.getByTestId('data-property-name-nested')).toBeVisible();
    await expect(page.getByTestId('data-property-name-nested')).toHaveText('nested');
    await expect(page.getByTestId('data-property-value-nested')).toBeVisible();
    await expect(page.getByTestId('data-property-value-nested')).toHaveText('""');

    await page.getByTestId('unpin-model.nested').click();

    await expect(page.getByTestId('data-property-name-text')).toBeVisible();
  });

  test('opening attributes syncs across live component data and messages', async ({ page }) => {
    await page.goto('/simulator?target=v3.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();

    await page.getByTestId('component-name').filter({ hasText: 'model-no-render' }).click();

    await expect(page.getByTestId('history-flyout').getByText('History')).toBeVisible();
    await page.getByTestId('history-flyout').getByText('History').click();

    const nestedInput = target(page).getByTestId('nested-model-no-render');
    await nestedInput.fill('');
    await expect(page.getByTestId('history-flyout').locator('li')).toHaveCount(2);
    await nestedInput.fill('new');

    await expect(page.getByTestId('history-flyout').locator('li')).toHaveCount(3);

    await page.getByTestId('data-property-name-model').click();
    await expect(page.getByTestId('data-property-name-nested')).toBeVisible();
    await expect(page.getByTestId('data-property-name-nested')).toHaveText('nested');

    await page.getByTestId('history-message-2').click();

    await expect(page.getByTestId('data-property-name-nested')).toBeVisible();
    await expect(page.getByTestId('data-property-name-nested')).toHaveText('nested');
    await expect(page.getByTestId('data-property-value-nested')).toBeVisible();
    await expect(page.getByTestId('data-property-value-nested')).toHaveText('"new"');

    await page.getByTestId('data-property-name-model').click();
    await expect(page.getByTestId('data-property-name-nested')).toHaveCount(0);
  });
});
