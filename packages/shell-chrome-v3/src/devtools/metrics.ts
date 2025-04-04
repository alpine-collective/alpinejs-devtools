export function bucketCount(num: number) {
  if (num === 0) return '0';
  if (num === 1) return '1';
  if (num <= 5) return '2-5';
  if (num <= 10) return '6-10';
  if (num <= 20) return '11-20';
  if (num <= 50) return '21-50';
  return '>=51';
}
