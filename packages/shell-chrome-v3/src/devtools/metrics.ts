import { isEarlyAccess } from '../lib/isEarlyAccess';
import { version } from '../../package.json';

class Sampler {
  private sampleRate: number;
  private counter: number;
  /**
   * @param sampleRate Number between 0 (never sample) and 1 (always sample).
   */
  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.counter = Math.random();
  }
  shouldSample(): boolean {
    this.counter += this.sampleRate;
    if (this.counter < 1) {
      return false;
    } else {
      this.counter = Math.random(); // reset
      return true;
    }
  }
}

export function bucketCount(num: number) {
  if (num === 0) return '0';
  if (num === 1) return '1';
  if (num <= 5) return '2-5';
  if (num <= 10) return '6-10';
  if (num <= 20) return '11-20';
  if (num <= 50) return '21-50';
  return '>=51';
}

export function bucketTime(ms: number) {
  if (ms < 5) return '<5ms';
  if (ms <= 10) return '6-10ms';
  if (ms <= 50) return '11-50ms';
  if (ms <= 100) return '51-100ms';
  if (ms <= 150) return '101-150ms';
  if (ms <= 200) return '151-200ms';
  if (ms <= 300) return '201-300ms';
  if (ms <= 500) return '301-500ms';
  if (ms <= 1000) return '501-1000ms';
  if (ms <= 2000) return '1001-2000ms';
  if (ms <= 5000) return '2001-5000ms';
  return `>5000ms`;
}

const sampler = new Sampler(0.1);

export function runWithMeasure(
  label: string,
  fn: Function,
  options: { sampled: boolean; minValueMs: number } = { sampled: false, minValueMs: 0 },
) {
  const start = performance.now();
  fn();
  const time = performance.now() - start;
  if ((!options.sampled || sampler.shouldSample()) && time >= options.minValueMs) {
    metric(`${label}_exec_time`, { time: bucketTime(time) });
  }
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
  } else {
    console.info('metric', {
      name,
      metadata: {
        build: isEarlyAccess() ? 'ea' : 'ga',
        buildNum: version,
        ...metadata,
      },
    });
  }
}
