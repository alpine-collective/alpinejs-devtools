export function isEarlyAccess() {
  return import.meta.env.VITE_MAINLINE_PUBLISH !== 'true';
}
