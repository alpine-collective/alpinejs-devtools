import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPartialPrefixes } from './prefix.ts';

test('getPartialPrefixes - outputs partial paths by .', () => {
  assert.deepStrictEqual(getPartialPrefixes('data.arr.0.id'), [
    'data',
    'data.arr',
    'data.arr.0',
    'data.arr.0.id',
  ]);
});
