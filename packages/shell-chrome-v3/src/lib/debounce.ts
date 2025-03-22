export function debounce(fn: Function, delay: number) {
  let timeout: number;
  const debounced = (...args: any[]) => {
    clearTimeout(timeout);
    // uses Node.js types, but we run in the browser
    timeout = setTimeout(() => fn(...args), delay) as unknown as number;
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}
