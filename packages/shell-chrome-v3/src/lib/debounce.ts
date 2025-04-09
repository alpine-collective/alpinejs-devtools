const timeouts = new Map<string, number>();

// Debounce by key
export function debounce(fn: Function, keyFn: (args: any[]) => string, delay: number) {
  const debounced = (...args: any[]) => {
    const key = keyFn(args);
    const timeout = timeouts.get(key);
    if (typeof timeout === 'number') {
      clearTimeout(timeout);
    }
    const newTimeout = setTimeout(() => {
      fn(...args);
    }, delay) as unknown as number; // uses Node.js types, but we run in the browser
    timeouts.set(key, newTimeout);
  };
  return debounced;
}
