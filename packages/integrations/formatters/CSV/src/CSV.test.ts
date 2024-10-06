import test, { describe } from 'node:test';
import * as assert from 'node:assert';

import { CSV } from './CSV';

describe('CSV', () => {
  test('should return a CSV structure', () => {
    const props: any = { json: { a: '1', b: '2', c: '3' } };

    assert.equal(CSV(props), 'a,b,c\n1,2,3');
  });
});
