import test, { describe } from 'node:test';
import * as assert from 'node:assert';
import { HelmValues } from './HelmValues';

describe('HelmValues', () => {
  test('should return a stringified Helm Values', () => {
    const json = { a: '1', b: '2', c: '3' };
    const props = { label: '', json };

    const expected = "a: '1'\nb: '2'\nc: '3'\n";

    assert.equal(HelmValues(props), expected);
  });

  test('should return a stringified Helm Values with camel case keys', () => {
    const json = { 'aa-bb': '1', 'bb-cc': '2', 'cc-dd': '3' };
    const props = { label: '', json };

    const expected = "aaBb: '1'\nbbCc: '2'\nccDd: '3'\n";

    assert.equal(HelmValues(props), expected);
  });
});
