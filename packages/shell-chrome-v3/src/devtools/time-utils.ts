export function daysToMs(dayCount: number) {
  return dayCount * 24 * 60 * 60 * 1000;
}

export function msToDays(ms: number) {
  return ms / (24 * 60 * 60 * 1000);
}
