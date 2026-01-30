import { test, expect } from '@playwright/test';
import { target } from './helpers';

test('should show "no stores" messages when none detected', async ({ page }) => {
  await page.goto('/simulator?target=no-stores.html');
  await page.getByTestId('tab-link-stores').click();
  await expect(page.getByText('No stores found')).toBeVisible();
});

test('should populate stores list when present', async ({ page }) => {
  await page.goto('/simulator?target=v3.html');
  await page.getByTestId('tab-link-stores').click();
  await expect(page.getByTestId('store-name')).toHaveCount(2);
  await expect(page.getByTestId('store-name').filter({ hasText: 'sampleStore' })).toBeVisible();
  await expect(page.getByTestId('store-name').filter({ hasText: 'primitiveVal' })).toBeVisible();
});

test('primitive store - should populate data, allow edits and receive state updates when selected', async ({
  page,
}) => {
  await page.goto('/simulator?target=v3.html');
  await page.getByTestId('tab-link-stores').click();
  await page.getByTestId('store-name').filter({ hasText: 'primitiveVal' }).click();
  await expect(page.getByTestId('data-property-name-__root_value')).toHaveCount(0);
  await expect(page.getByTestId('data-property-value-__root_value')).toContainText('true');
  await page
    .getByTestId('data-property-value-__root_value')
    .locator('[type=checkbox]')
    .click({ force: true });
  await expect(page.getByTestId('data-property-value-__root_value')).toContainText('false');
  await expect(target(page).locator('body')).toContainText('primitiveVal false');
  await target(page).getByTestId('reset-primitive-store').click();
  await expect(page.getByTestId('data-property-value-__root_value')).toContainText('false');
});

test('object store - should populate data, allow edits and receive state updates when selected', async ({
  page,
}) => {
  await page.goto('/simulator?target=v3.html');
  await page.getByTestId('tab-link-stores').click();
  await page.getByTestId('store-name').filter({ hasText: 'sampleStore' }).click();
  await expect(page.getByTestId('data-property-name-nested')).toBeVisible();
  await expect(page.getByTestId('data-property-value-nested')).toContainText('Object');
  await page.getByTestId('data-property-value-nested').click();
  await expect(page.getByTestId('data-property-name-array')).toBeVisible();
  await expect(page.getByTestId('data-property-value-array')).toContainText('Array[2]');
  await expect(page.getByTestId('data-property-name-on')).toBeVisible();
  await expect(page.getByTestId('data-property-value-on')).toContainText('false');
  await page
    .getByTestId('data-property-value-on')
    .locator('[type=checkbox]')
    .click({ force: true });
  await expect(page.getByTestId('data-property-value-on')).toContainText('true');
  await expect(target(page).locator('body')).toContainText('sampleStore.on true');
  await target(page).getByTestId('reset-nested-store').click();
  await expect(page.getByTestId('data-property-value-nested')).toContainText('Array[0]');
});
