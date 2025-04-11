import type { ComponentData, NoValueSerializedData } from '../types';

export const MESSAGE_HISTORY_SIZE = 500;

function convertSingleValue(
  singleValue: Exclude<ComponentData[string], NoValueSerializedData>['value'],
): Exclude<ComponentData[string], NoValueSerializedData>['value'] {
  if (Array.isArray(singleValue)) {
    return singleValue.map((el) => convertSingleValue(el));
  }
  if (typeof singleValue === 'object' && singleValue) {
    return Object.fromEntries(
      Object.entries(singleValue).map(([k, v]) => [k, convertSingleValue(v)]),
    );
  }
  if (['string', 'number', 'boolean'].includes(typeof singleValue)) {
    return singleValue;
  }
}
export function snapshotToDataObj(obj: ComponentData) {
  const newObj: Record<string, Exclude<ComponentData[string], NoValueSerializedData>['value']> = {};
  for (const k in obj) {
    switch (obj[k].type) {
      case 'Unserializable':
      case 'function':
      case 'HTMLElement': {
        continue;
      }
      default: {
        const { value } = obj[k];
        const convertedVal = convertSingleValue(value);
        if (convertedVal) {
          newObj[k] = convertedVal;
        }
      }
    }
  }
  return newObj;
}
