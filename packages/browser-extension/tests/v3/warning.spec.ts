import { test, expect } from '@playwright/test';
import { target } from '../helpers';

test.describe('warnings v3', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulator?target=v3.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();
    await page.getByTestId('tab-link-warnings').click();
  });

  test('v3 - should catch component initialisation errors', async ({ page }) => {
    await expect(page.getByTestId('warnings-tab-content')).toBeVisible();
    await expect(page.getByTestId('warnings-tab-content')).toContainText('No warnings found');

    await target(page).getByTestId('inject-broken').click();

    await expect(page.getByTestId('footer-line')).toContainText('1 warning');
    await expect(page.getByTestId('warnings-tab-content')).toBeVisible();
    await expect(page.getByTestId('warnings-tab-content')).not.toContainText('No warnings found');

    const errorDiv = page.getByTestId('eval-error-div');
    await expect(errorDiv).toHaveCount(1);
    await expect(errorDiv).toContainText('Error evaluating');
    await expect(errorDiv).toContainText(`"{ foo: 'aaa' "`);
    await expect(errorDiv).toContainText("Unexpected token ')'");
  });

  test('v3 - should catch x-on errors', async ({ page }) => {
    const t = target(page);
    await t.getByTestId('inject-broken').click();
    await t.getByTestId('broken-click').click();

    await expect(page.getByTestId('eval-error-button')).toHaveCount(1);
    await expect(page.getByTestId('footer-line')).toContainText('2 warnings');
    await expect(page.getByTestId('warnings-tab-content')).not.toContainText('No warnings found');

    const errorButton = page.getByTestId('eval-error-button');
    await expect(errorButton).toContainText('Error evaluating');
    await expect(errorButton).toContainText('"foo.bar.baz"');
    await expect(errorButton).toContainText('foo is not defined');
  });

  test('v3 - should scroll to newest error when warnings tab is open', async ({ page }) => {
    const t = target(page);
    await t.getByTestId('inject-broken').click();
    for (let i = 0; i < 4; i++) {
      await t.getByTestId('broken-click').click();
    }

    await expect(page.getByTestId('eval-error-button')).toHaveCount(4);
    await expect(page.getByTestId('footer-line')).toContainText('5 warnings');

    await expect
      .poll(() => page.getByTestId('warnings-scroll-container').evaluate((el) => el.scrollTop))
      .not.toBe(0);
  });

  test('v3 - should scroll to newest error when switching from components to warnings tab', async ({
    page,
  }) => {
    const t = target(page);
    await t.getByTestId('inject-broken').click();
    for (let i = 0; i < 4; i++) {
      await t.getByTestId('broken-click').click();
    }

    await page.getByTestId('warnings-scroll-container').evaluate((el) => (el.scrollTop = 0));
    const scrollTop = await page
      .getByTestId('warnings-scroll-container')
      .evaluate((el) => el.scrollTop);
    expect(scrollTop).toBe(0);

    await page.getByTestId('tab-link-components').click();
    await expect(page.getByTestId('warnings-tab-content')).toHaveCount(0);

    await page.getByTestId('tab-link-warnings').click();
    await expect(page.getByTestId('warnings-tab-content')).toBeVisible();

    await expect
      .poll(() => page.getByTestId('warnings-scroll-container').evaluate((el) => el.scrollTop))
      .not.toBe(0);
  });

  test('v3 - should toggle using footer links', async ({ page }) => {
    await target(page).getByTestId('inject-broken').click();

    await expect(page.getByTestId('warnings-tab-content')).toBeVisible();
    await page.getByTestId('footer-components-link').click();
    await expect(page.getByTestId('warnings-tab-content')).toHaveCount(0);
    await page.getByTestId('footer-warnings-link').click();
    await expect(page.getByTestId('warnings-tab-content')).toBeVisible();
  });
});
