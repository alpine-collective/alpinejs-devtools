/**
 *
 * @param prefix dot-separated path eg. `data.arr.0.id`
 * @returns
 */
export function getPartialPrefixes(prefix: string) {
  const partialPrefixes: string[] = [];
  let prevPart = '';
  prefix.split('.').forEach((part) => {
    if (prevPart.length > 0) {
      prevPart += '.';
    }
    prevPart += part;
    partialPrefixes.push(prevPart);
  });
  return partialPrefixes;
}
