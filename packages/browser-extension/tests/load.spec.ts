import { test, expect } from '@playwright/test';

test('should load devtools', async ({ page }) => {
  await page.goto('/simulator');
  await expect(page.getByTestId('component-name').first()).toBeVisible();
  await expect(page.getByTestId('select-component-message')).toHaveText(
    'Select a component to view',
  );
  await expect(page.getByTestId('no-components-message')).toHaveCount(0);
});

test('should load devtools when no components found', async ({ page }) => {
  await page.goto('/simulator?target=no-components.html');
  await expect(page.getByTestId('component-name')).toHaveCount(0);
  await expect(page.getByTestId('no-components-message')).toBeVisible();
  await expect(page.getByTestId('no-components-message')).toContainText('No components found');
  await expect(page.getByTestId('select-component-message')).not.toContainText(
    'Select a component to view',
  );
});
