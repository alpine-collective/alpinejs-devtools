import type { Page, FrameLocator } from '@playwright/test';

export function target(page: Page): FrameLocator {
  return page.frameLocator('#target');
}
