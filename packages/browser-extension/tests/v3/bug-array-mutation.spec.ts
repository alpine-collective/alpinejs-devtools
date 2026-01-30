import { test, expect } from '@playwright/test';
import { target } from '../helpers';

// fixes https://github.com/alpine-collective/alpinejs-devtools/issues/165
test('v3 - should update the devtools when an array item is added or removed', async ({ page }) => {
  await page.goto('/simulator?target=bug-array-mutation.html');
  await expect(page.getByTestId('component-name').first()).toBeVisible();

  await page.getByTestId('component-container').nth(1).click();

  await expect(page.getByTestId('data-property-name-alternatives')).toBeVisible();
  await expect(page.getByTestId('data-property-value-alternatives')).toContainText('Array[1]');

  await target(page).getByRole('button', { name: '+' }).click({ force: true });
  await expect(page.getByTestId('data-property-value-alternatives')).toContainText('Array[2]');

  await target(page).getByRole('button', { name: '-' }).first().click({ force: true });
  await expect(page.getByTestId('data-property-value-alternatives')).toContainText('Array[1]');
});
