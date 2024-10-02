import test, { describe } from 'node:test';
import * as assert from 'node:assert';

import { Dotenv } from './Dotenv';

describe('Dotenv', () => {
  test('should return a basic dotenv structure', () => {
    const props: any = { label: '', json: { a: '1', b: '2', c: '3' } };

    assert.equal(Dotenv(props), 'a=1\nb=2\nc=3');
  });

  test('should wrap values with quotes if they have whitespace', () => {
    const json = { a: 'hello world', b: 'foo', c: 'bar' };
    const props: any = { label: '', json };
    const expected = 'a="hello world"\nb=foo\nc=bar';

    assert.equal(Dotenv(props), expected);
  });

  test('should wrap values with quotes if wrap is true', () => {
    const json = { a: 'hello world', b: 'foo', c: 'bar' };
    const props = { label: '', json, wrap: true };

    const expected = 'a="hello world"\nb="foo"\nc="bar"';

    assert.equal(Dotenv(props), expected);
  });
});
