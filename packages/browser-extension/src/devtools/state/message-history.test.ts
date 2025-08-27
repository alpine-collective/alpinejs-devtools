import test, { describe } from 'node:test';
import assert from 'node:assert';
import { snapshotToDataObj } from './message-history.ts';

describe('snapshotToDataObj', () => {
  test('ignores HTMLElement, Unserializable, function', () => {
    assert.deepStrictEqual(
      snapshotToDataObj({
        el: {
          value: {
            name: 'div',
            attributes: ['x-data'],
            children: ['div', 'div', 'div', 'div', 'div', 'div', 'div', 'div'],
          },
          type: 'HTMLElement',
        },
        els: {
          type: 'Unserializable',
        },
        nestedUnserializable: {
          type: 'Unserializable',
        },
        myFunction: {
          type: 'function',
        },
      }),
      {},
    );
  });
  test('extracts boolean, number and string', () => {
    assert.deepStrictEqual(
      snapshotToDataObj({
        bool: {
          value: true,
          type: 'boolean',
        },
        num: {
          value: 5,
          type: 'number',
        },
        str: {
          value: 'string',
          type: 'string',
        },
      }),
      {
        bool: true,
        num: 5,
        str: 'string',
      },
    );
  });
  test('extracts arrays and objects recursively', () => {
    assert.deepStrictEqual(
      snapshotToDataObj({
        arr: {
          value: ['world', 'bar'],
          type: 'object',
        },
        nestedObjArr: {
          value: {
            array: [
              {
                nested: 'property',
              },
            ],
          },
          type: 'object',
        },
      }),
      {
        arr: ['world', 'bar'],
        nestedObjArr: {
          array: [
            {
              nested: 'property',
            },
          ],
        },
      },
    );
  });
});
