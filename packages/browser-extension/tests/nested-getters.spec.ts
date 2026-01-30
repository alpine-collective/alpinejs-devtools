import { test, expect } from '@playwright/test';
import { target } from './helpers';

test.describe('Nested Getters', () => {
  test('should display getters using parent component data correctly', async ({ page }) => {
    await page.goto('/simulator?target=nested-getters.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();

    await page
      .getByTestId('component-name')
      .filter({ hasText: 'child', hasNotText: 'Component' })
      .click();

    await expect(page.getByTestId('data-property-name-doubledCount')).toBeVisible();
    await expect(page.getByTestId('data-property-name-doubledCount')).toHaveText('doubledCount');
    await expect(page.getByTestId('data-property-value-doubledCount')).toBeVisible();
    await expect(page.getByTestId('data-property-value-doubledCount')).toHaveText('0');

    await expect(page.getByTestId('data-property-name-doubledHello')).toBeVisible();
    await expect(page.getByTestId('data-property-name-doubledHello')).toHaveText('doubledHello');
    await expect(page.getByTestId('data-property-value-doubledHello')).toBeVisible();
    await expect(page.getByTestId('data-property-value-doubledHello')).toHaveText(
      '"one, two, three"',
    );
  });

  test('should use the leaf component own data when getter references a shadowed property', async ({
    page,
  }) => {
    await page.goto('/simulator?target=nested-getters.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();

    await page.getByTestId('component-name').filter({ hasText: 'parentComponent' }).click();

    await expect(page.getByTestId('data-property-name-getterParent')).toBeVisible();
    await expect(page.getByTestId('data-property-name-getterParent')).toHaveText('getterParent');
    await expect(page.getByTestId('data-property-value-getterParent')).toBeVisible();
    await expect(page.getByTestId('data-property-value-getterParent')).toHaveText('"Parent"');

    await page.getByTestId('component-name').filter({ hasText: 'childComponent' }).click();

    await expect(page.getByTestId('data-property-name-getterChild')).toBeVisible();
    await expect(page.getByTestId('data-property-name-getterChild')).toHaveText('getterChild');
    await expect(page.getByTestId('data-property-value-getterChild')).toBeVisible();
    await expect(page.getByTestId('data-property-value-getterChild')).toHaveText('"Child"');
  });

  test('should display update getter values when parent component data changes', async ({
    page,
  }) => {
    await page.goto('/simulator?target=nested-getters.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();

    await page
      .getByTestId('component-name')
      .filter({ hasText: 'child', hasNotText: 'Component' })
      .click();

    await expect(page.getByTestId('data-property-name-doubledCount')).toBeVisible();
    await expect(page.getByTestId('data-property-value-doubledCount')).toHaveText('0');
    await expect(page.getByTestId('data-property-name-doubledHello')).toBeVisible();
    await expect(page.getByTestId('data-property-value-doubledHello')).toHaveText(
      '"one, two, three"',
    );

    await target(page).getByTestId('click-target').click();

    await expect(page.getByTestId('data-property-value-doubledCount')).toHaveText('2');
    await expect(page.getByTestId('data-property-value-doubledHello')).toHaveText(
      '"one, two, three, new"',
    );
  });
});
