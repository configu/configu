import test from 'node:test';
import assert from 'node:assert';

import { hasWhitespace } from './utils.js';

test('utils.hasWhitespace 1', async (t) => {
  const act = hasWhitespace('foo bar');
  assert.strictEqual(act, true);
});

test('utils.hasWhitespace 2', async (t) => {
  const act = hasWhitespace('foobar');
  assert.strictEqual(act, false);
});
