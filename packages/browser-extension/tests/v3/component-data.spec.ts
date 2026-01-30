import { test, expect } from '@playwright/test';
import { target } from '../helpers';

test('v3 - should display read-only function/HTMLElement attributes + allow editing of booleans, numbers and strings', async ({
  page,
}) => {
  await page.goto('/simulator?target=v3.html');
  await expect(page.getByTestId('component-name').first()).toBeVisible();

  await page.getByTestId('component-container').first().click();

  await expect(page.getByTestId('data-property-name-myFunction')).toBeVisible();
  await expect(page.getByTestId('data-property-name-myFunction')).toContainText('myFunction');
  await expect(page.getByTestId('data-property-value-myFunction')).toContainText('function');

  await expect(page.getByTestId('data-property-name-el')).toContainText('el');
  await expect(page.getByTestId('data-property-value-el')).toContainText('HTMLElement');
  await page.getByTestId('data-property-value-el').click();

  await expect(page.getByTestId('data-property-name-name')).toBeVisible();
  await expect(page.getByTestId('data-property-value-name')).toContainText('div');
  await expect(page.getByTestId('data-property-name-attributes')).toBeVisible();
  await expect(page.getByTestId('data-property-value-attributes')).toContainText('Array[1]');
  await expect(page.getByTestId('data-property-name-children')).toBeVisible();
  await expect(page.getByTestId('data-property-value-children')).toContainText('Array[8]');

  await page.getByTestId('data-property-value-el').click();
  await expect(page.getByTestId('data-property-value-name')).toHaveCount(0);
  await expect(page.getByTestId('data-property-name-attributes')).toHaveCount(0);
  await expect(page.getByTestId('data-property-name-children')).toHaveCount(0);

  await expect(page.getByTestId('data-property-name-bool')).toBeVisible();
  await expect(page.getByTestId('data-property-value-bool')).toContainText('true');
  await page
    .getByTestId('data-property-value-bool')
    .locator('[type=checkbox]')
    .click({ force: true });
  await expect(page.getByTestId('data-property-name-bool')).toBeVisible();
  await expect(page.getByTestId('data-property-value-bool')).toContainText('false');
  await expect(target(page).locator('body')).toContainText('Bool, type: "boolean", value: "false"');

  await expect(page.getByTestId('data-property-name-num')).toBeVisible();
  await expect(page.getByTestId('data-property-value-num')).toContainText('5');
  await page.getByTestId('edit-icon-num').click({ force: true });
  await page.getByTestId('input-num').clear({ force: true });
  await page.getByTestId('input-num').fill('20', { force: true });
  await page.getByTestId('save-icon').click({ force: true });
  await expect(target(page).locator('body')).toContainText('Num, type: "number", value: "20"');

  await expect(page.getByTestId('data-property-name-str')).toBeVisible();
  await expect(page.getByTestId('data-property-value-str')).toContainText('string');
  await page.getByTestId('edit-icon-str').click({ force: true });
  await page.getByTestId('input-str').clear({ force: true });
  await page.getByTestId('input-str').fill('devtools', { force: true });
  await page.getByTestId('save-icon').click({ force: true });
  await expect(target(page).locator('body')).toContainText(
    'Str, type: "string", value: "devtools"',
  );
});

test('v3 - should display nested arrays/object attributes and support editing', async ({
  page,
}) => {
  await page.goto('/simulator?target=v3.html');
  await expect(page.getByTestId('component-name').first()).toBeVisible();

  await page.getByTestId('component-name').first().click();

  await expect(page.getByTestId('data-property-name-nestedObjArr')).toContainText('nestedObjArr');
  await expect(page.getByTestId('data-property-value-nestedObjArr')).toContainText('Object');

  await page.getByTestId('data-property-value-nestedObjArr').click();
  await expect(page.getByTestId('data-property-name-array')).toBeVisible();
  await expect(page.getByTestId('data-property-value-array')).toContainText('Array[1]');

  await page.getByTestId('data-property-value-array').click();
  await expect(page.getByTestId('data-property-name-0')).toBeVisible();
  await expect(page.getByTestId('data-property-value-0')).toContainText('Object');

  await page.getByTestId('data-property-name-0').click();
  await expect(page.getByTestId('data-property-name-nested')).toBeVisible();
  await expect(page.getByTestId('data-property-value-nested')).toContainText('property');

  await page.getByTestId('edit-icon-nested').click({ force: true });
  await page.getByTestId('input-nested').clear({ force: true });
  await page.getByTestId('input-nested').fill('from-devtools', { force: true });
  await page.getByTestId('save-icon').click({ force: true });

  await expect(target(page).getByTestId('nested-obj-arr')).toHaveText(
    JSON.stringify({ array: [{ nested: 'from-devtools' }] }),
  );

  await page.getByTestId('data-property-name-0').click();
  await expect(page.getByTestId('data-property-name-nested')).toHaveCount(0);
  await expect(page.getByTestId('data-property-value-nested')).toHaveCount(0);

  await page.getByTestId('data-property-value-array').click();
  await expect(page.getByTestId('data-property-name-0')).toHaveCount(0);
  await expect(page.getByTestId('data-property-value-0')).toHaveCount(0);

  await page.getByTestId('data-property-value-nestedObjArr').click();
  await expect(page.getByTestId('data-property-name-array')).toHaveCount(0);
  await expect(page.getByTestId('data-property-value-array')).toHaveCount(0);

  await page.getByTestId('data-property-value-nestedObjArr').click();
  await page.getByTestId('data-property-value-array').click();
  await page.getByTestId('data-property-name-0').click();
});

test('v3 - should support x-model updates and editing values', async ({ page }) => {
  await page.goto('/simulator?target=v3.html');
  await expect(page.getByTestId('component-name').first()).toBeVisible();

  await page.getByTestId('component-name').filter({ hasText: 'model-no-render' }).click();

  await page.getByTestId('component-name').last().dispatchEvent('mouseenter');
  await page.getByTestId('component-name').last().dispatchEvent('mouseleave');

  await expect(page.getByTestId('data-property-name-text')).toBeVisible();
  await expect(page.getByTestId('data-property-value-text')).toContainText('initial');

  const input = target(page).getByTestId('model-no-render');
  await input.clear();
  await input.fill('updated');
  await expect(page.getByTestId('data-property-value-text')).toContainText('updated');

  await page.getByTestId('edit-icon-text').click({ force: true });
  await page.getByTestId('input-text').clear({ force: true });
  await page.getByTestId('input-text').fill('from-devtools', { force: true });
  await page.getByTestId('save-icon').click({ force: true });
  await expect(input).toHaveValue('from-devtools');

  await page.getByTestId('data-property-name-model').click();
  await expect(page.getByTestId('data-property-name-nested')).toBeVisible();
  await expect(page.getByTestId('data-property-value-nested')).toContainText('nested-initial');

  const nestedInput = target(page).getByTestId('nested-model-no-render');
  await nestedInput.clear();
  await nestedInput.fill('nested-update');
  await expect(page.getByTestId('data-property-name-nested')).toBeVisible();
  await expect(page.getByTestId('data-property-value-nested')).toContainText('nested-update');

  await page.getByTestId('edit-icon-nested').click({ force: true });
  await page.getByTestId('input-nested').clear({ force: true });
  await page.getByTestId('input-nested').fill('nested-from-devtools', { force: true });
  await page.getByTestId('save-icon').click({ force: true });
  await expect(nestedInput).toHaveValue('nested-from-devtools');
});

test('v3 - should reset component selection when changing page', async ({ page }) => {
  await page.goto('/simulator?target=v3.html');
  await expect(page.getByTestId('component-name').first()).toBeVisible();

  await page.getByTestId('component-name').first().click();
  await expect(page.getByTestId('component-container').first()).toHaveClass(/bg-alpine-300/);
  await expect(page.getByTestId('data-property-name-myFunction')).toBeVisible();

  await target(page).getByTestId('navigation-target').click();

  await expect(page.getByTestId('component-container').first()).not.toHaveClass(/bg-alpine-300/);
  await expect(page.getByTestId('data-property-name-myFunction')).toHaveCount(0);
});
