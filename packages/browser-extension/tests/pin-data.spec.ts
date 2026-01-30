import { test, expect } from '@playwright/test';

test.describe('Pin data', () => {
  test('should display (pin) and filter/toggle to (unpin) when clicked', async ({ page }) => {
    await page.goto('/simulator?target=v3.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();

    await page.getByTestId('component-name').first().click();

    await page.getByTestId('data-property-name-el').click();
    await expect(page.getByTestId('data-property-name-children')).toBeVisible();
    await page.getByTestId('data-property-name-children').click();

    await expect(page.getByTestId('pin-el.children')).toBeVisible();
    await expect(page.getByTestId('pin-el.children')).toHaveText('(pin)');

    await expect(page.getByTestId('data-property-name-myFunction')).not.toHaveCount(0);

    await page.getByTestId('pin-el.children').click();

    await expect(page.getByTestId('pin-el.children')).toHaveCount(0);
    await expect(page.getByTestId('unpin-el.children')).toBeVisible();
    await expect(page.getByTestId('unpin-el.children')).toHaveText('(unpin)');

    await expect(page.getByTestId('data-property-name-myFunction')).toHaveCount(0);

    await expect(page.getByTestId('data-property-name-0')).toBeVisible();
    await expect(page.getByTestId('data-property-name-1')).toBeVisible();
    await page.getByTestId('pin-el.children.2').click();
    await expect(page.getByTestId('data-property-name-0')).toHaveCount(0);
    await expect(page.getByTestId('data-property-name-1')).toHaveCount(0);

    await expect(page.getByTestId('unpin-el.children.2')).toHaveText('(unpin)');
    await page.getByTestId('unpin-el.children.2').click();

    await expect(page.getByTestId('pin-el.children')).toBeVisible();
    await expect(page.getByTestId('pin-el.children')).toHaveText('(pin)');
    await expect(page.getByTestId('unpin-el.children')).toHaveCount(0);
    await expect(page.getByTestId('data-property-name-myFunction')).not.toHaveCount(0);
  });

  test('displays pinned path, clicking on path loosens the filtering', async ({ page }) => {
    await page.goto('/simulator?target=v3.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();

    await page.getByTestId('component-name').first().click();

    await page.getByTestId('data-property-name-el').click();
    await expect(page.getByTestId('data-property-name-children')).toBeVisible();
    await page.getByTestId('data-property-name-children').click();

    await expect(page.getByTestId('pinned-path')).toHaveCount(0);

    await page.getByTestId('pin-el.children').click();

    await expect(page.getByTestId('data-property-name-myFunction')).toHaveCount(0);
    await expect(page.getByTestId('pinned-path')).toBeVisible();
    await expect(page.getByTestId('pinned-path')).toHaveText('el>children');

    await expect(page.getByTestId('pinned-path-children')).toBeVisible();
    await expect(page.getByTestId('pinned-path-children')).toHaveText('children');
    await page.getByTestId('pinned-path-el').click();
    await expect(page.getByTestId('pinned-path-children')).toHaveCount(0);

    await page.getByTestId('pinned-path-el').click();

    await expect(page.getByTestId('pinned-path')).toHaveCount(0);
    await expect(page.getByTestId('data-property-name-myFunction')).not.toHaveCount(0);
  });
});
