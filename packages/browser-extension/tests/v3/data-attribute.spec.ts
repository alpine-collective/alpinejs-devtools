import { test, expect } from '@playwright/test';

test('v3 - should get names of components from data-x-data attributes', async ({ page }) => {
  await page.goto('/simulator?target=v3-data-attribute.html');
  const names = page.getByTestId('component-name');
  await expect(names.first()).toBeVisible();
  await expect(names).toHaveCount(2);
  const nameTexts = await names.allTextContents();
  expect(nameTexts).toContain('component1');
  expect(nameTexts).toContain('component2');
});
