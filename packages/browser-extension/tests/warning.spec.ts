import { test, expect } from '@playwright/test';
import { target } from './helpers';

test.describe('warnings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulator?target=v3.html');
    await expect(page.getByTestId('component-name').first()).toBeVisible();
    await page.getByTestId('tab-link-warnings').click();
  });

  test('can show a warning for x-on error', async ({ page }) => {
    await target(page).getByTestId('broken-click').click();
    const errorButton = page.getByTestId('eval-error-button');
    await expect(errorButton).toContainText('Error evaluating');
    await expect(errorButton).toContainText('"foo.bar.baz"');
    await expect(errorButton).toContainText('foo is not defined');
  });

  test('can show a warning from an injected script for component initialisation error', async ({
    page,
  }) => {
    await target(page).getByTestId('inject-broken').click();
    const errorDiv = page.getByTestId('eval-error-div');
    await expect(errorDiv).toContainText('Error evaluating');
    await expect(errorDiv).toContainText(`"{ foo: 'aaa' "`);
    await expect(errorDiv).toContainText("Unexpected token ')'");
  });

  test('can show multiple warnings', async ({ page }) => {
    await target(page).getByTestId('broken-click').click();
    await target(page).getByTestId('inject-broken').click();
    await expect(page.getByTestId('eval-error-button')).toHaveCount(1);
    await expect(page.getByTestId('eval-error-div')).toHaveCount(1);
    await expect(page.getByTestId('footer-line')).toContainText('2 warnings');
  });

  test('scrolls to the bottom as warnings are added', async ({ page }) => {
    const scrollContainer = page.getByTestId('warnings-scroll-container');
    const startScrollTop = await scrollContainer.evaluate((el) => el.scrollTop);

    const t = target(page);
    await t.getByTestId('inject-broken').click();
    await t.getByTestId('broken-click').click();
    await t.getByTestId('broken-click').click();
    await t.getByTestId('broken-click').click();
    await t.getByTestId('broken-click').click();

    await expect(page.getByTestId('footer-line')).toContainText('5 warnings');
    await expect
      .poll(() => scrollContainer.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(startScrollTop);
  });
});
