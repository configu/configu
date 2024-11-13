import test, { describe } from 'node:test';
import * as assert from 'node:assert';
import { CompactJSON } from './CompactJSON';

describe('CompactJSON', () => {
  test('should return a stringified JSON', () => {
    const json = { a: 1, b: 2, c: 3 };
    const expected = '{"a":1,"b":2,"c":3}';

    assert.equal(CompactJSON({ json }), expected);
  });
});
