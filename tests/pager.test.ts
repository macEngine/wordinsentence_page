import test from 'node:test';
import assert from 'node:assert/strict';
import { pageNumbers } from '../src/core/pager.ts';

test('pageNumbers lists every page when there are few', () => {
  assert.deepEqual(pageNumbers(0, 1), [0]);
  assert.deepEqual(pageNumbers(2, 7), [0, 1, 2, 3, 4, 5, 6]);
});

test('pageNumbers collapses the far side into a gap', () => {
  assert.deepEqual(pageNumbers(0, 15), [0, 1, 2, 3, null, 14]);
  assert.deepEqual(pageNumbers(7, 15), [0, null, 6, 7, 8, null, 14]);
  assert.deepEqual(pageNumbers(14, 15), [0, null, 11, 12, 13, 14]);
});
