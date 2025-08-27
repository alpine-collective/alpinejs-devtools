import test from 'node:test';
import assert from 'node:assert';
import { daysToMs, msToDays } from './time-utils.ts';

test('daysToMs', () => {
  assert.equal(daysToMs(7), 604800000);
});

test('msToDays', () => {
  assert.equal(msToDays(604800000), 7);
});
