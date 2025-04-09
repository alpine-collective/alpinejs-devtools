import { isEarlyAccess } from '../lib/isEarlyAccess';
import { version } from '../../package.json';

export function bucketCount(num: number) {
  if (num === 0) return '0';
  if (num === 1) return '1';
  if (num <= 5) return '2-5';
  if (num <= 10) return '6-10';
  if (num <= 20) return '11-20';
  if (num <= 50) return '21-50';
  return '>=51';
}

export function view(pathname: string) {
  window.sa_metadata ??= {
    build: isEarlyAccess() ? 'ea' : 'ga',
    buildNum: version,
  };
  if (!import.meta.env.DEV && window?.sa_pageview) {
    window.sa_pageview(pathname);
  }
}

export function metric(
  name: string,
  metadata: Record<string, string | number | boolean> = {},
): void {
  if (!import.meta.env.DEV && window.sa_event) {
    window.sa_event(name, {
      build: isEarlyAccess() ? 'ea' : 'ga',
      buildNum: version,
      ...metadata,
    });
  }
}
