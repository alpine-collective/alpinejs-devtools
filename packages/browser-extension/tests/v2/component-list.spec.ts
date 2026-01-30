import { test, expect } from '@playwright/test';
import { target } from '../helpers';

test('v2 - should get names of components', async ({ page }) => {
  await page.goto('/simulator?target=example.html');
  const names = page.getByTestId('component-name');
  await expect(names.first()).toBeVisible();
  const nameTexts = await names.allTextContents();
  expect(nameTexts).toContain('div');
  expect(nameTexts).toContain('app');
  expect(nameTexts).toContain('myFn');
  expect(nameTexts).toContain('component');
  expect(nameTexts).toContain('combobox');
});

test('v2 - should create globals + add annotation for each component', async ({ page }) => {
  await page.goto('/simulator?target=example.html');
  await expect(page.getByTestId('component-name').first()).toBeVisible();

  const iframeHandle = await page.locator('#target').elementHandle();
  const frame = await iframeHandle!.contentFrame();
  expect(frame).not.toBeNull();

  const componentCount = await frame!.locator('[x-data]').count();

  for (let i = 0; i < componentCount; i++) {
    const isValid = await frame!.evaluate((idx) => {
      const components = document.querySelectorAll('[x-data]');
      const xData = (window as any)[`$x${idx}`];
      if (!xData) return false;
      return xData.$el === components[idx] && xData === (components[idx] as any).__x;
    }, i);
    expect(isValid).toBe(true);
  }

  const consoleGlobals = page.getByTestId('console-global');
  const allGlobalTexts = await consoleGlobals.allTextContents();
  expect(allGlobalTexts.some((t) => t.includes('= $x0'))).toBe(true);
  await expect(consoleGlobals.first()).toHaveAttribute(
    'data-tooltip',
    'Available as $x0 in the console',
  );
  for (let i = 1; i < componentCount; i++) {
    expect(allGlobalTexts.some((t) => t.includes(`= $x${i}`))).toBe(true);
  }
});

test('v2 - should handle adding and removing new components', async ({ page }) => {
  await page.goto('/simulator?target=example.html');
  const names = page.getByTestId('component-name');
  await expect(names.first()).toBeVisible();
  const initialCount = await names.count();

  await target(page).getByTestId('add-component-button').click();
  await expect(names).toHaveCount(initialCount + 1);

  await target(page).getByTestId('delete-component-button').click();
  await expect(names).toHaveCount(initialCount);
});

test('v2 - should handle replacing a component and keep its listed position', async ({ page }) => {
  await page.goto('/simulator?target=example.html');
  await expect(page.getByTestId('component-name').first()).toBeVisible();

  const namesBefore = await page.getByTestId('component-name').allTextContents();
  const replaceableIndex = namesBefore.findIndex((n) => n.includes('Replaceable'));
  expect(replaceableIndex).toBeGreaterThanOrEqual(0);

  await target(page).getByTestId('replace-component-button').click();
  await expect(page.getByTestId('component-name').filter({ hasText: 'Span' })).toBeVisible();

  const namesAfter = await page.getByTestId('component-name').allTextContents();
  const spanIndex = namesAfter.findIndex((n) => n.includes('Span'));
  expect(spanIndex).toBe(replaceableIndex);
});

test('v2 - should add/remove hover overlay on component mouseenter/leave', async ({ page }) => {
  await page.goto('/simulator?target=example.html');

  const t = target(page);
  await page.getByTestId('component-container').first().hover();
  await expect(t.getByTestId('hover-element')).toBeVisible();

  const iframeHandle = await page.locator('#target').elementHandle();
  const frame = await iframeHandle!.contentFrame();

  const hoverStyle = await t.getByTestId('hover-element').getAttribute('style');
  expect(hoverStyle).toContain('position: absolute;');
  expect(hoverStyle).toContain('background-color: rgba(104, 182, 255, 0.35);');
  expect(hoverStyle).toContain('border-radius: 4px;');
  expect(hoverStyle).toContain('z-index: 9999;');

  const appRect = await frame!.evaluate(() => {
    const el = document.querySelector('[x-data]')!;
    const r = el.getClientRects()[0];
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });
  expect(hoverStyle).toContain(`width: ${appRect.width}px;`);
  expect(hoverStyle).toContain(`height: ${appRect.height}px;`);
  expect(hoverStyle).toContain(`top: ${appRect.top}px;`);
  expect(hoverStyle).toContain(`left: ${appRect.left}px;`);

  await page.mouse.move(0, 0);
  await expect(t.getByTestId('hover-element')).toHaveCount(0);

  await page.getByTestId('component-container').last().hover();
  await expect(t.getByTestId('hover-element')).toBeVisible();

  const hoverStyle2 = await t.getByTestId('hover-element').getAttribute('style');
  expect(hoverStyle2).toContain('position: absolute;');
  expect(hoverStyle2).toContain('background-color: rgba(104, 182, 255, 0.35);');
  expect(hoverStyle2).toContain('border-radius: 4px;');
  expect(hoverStyle2).toContain('z-index: 9999;');

  await page.mouse.move(0, 0);
  await expect(t.getByTestId('hover-element')).toHaveCount(0);
});

test('v2 - should support selecting/unselecting a component', async ({ page }) => {
  await page.goto('/simulator?target=example.html');

  await page.getByTestId('component-container').last().click();
  await expect(page.getByTestId('component-container').last()).toHaveClass(/bg-alpine-300/);

  await page.getByTestId('component-container').first().click();
  await expect(page.getByTestId('component-container').first()).toHaveClass(/bg-alpine-300/);
  await expect(page.getByTestId('component-container').last()).not.toHaveClass(/bg-alpine-300/);
});

test('v2 - should display message with number of components watched', async ({ page }) => {
  await page.goto('/simulator?target=example.html');
  await expect(page.getByTestId('component-name').first()).toBeVisible();

  const count = await page.getByTestId('component-name').count();
  const expectedText = `${count} ${count > 1 ? 'components' : 'component'}`;
  await expect(page.getByTestId('footer-line')).toContainText(expectedText);
});
