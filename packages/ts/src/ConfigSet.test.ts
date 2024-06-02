import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigSet } from './ConfigSet';

describe.only(`ConfigSet`, () => {
  describe(`constructor`, () => {
    test(`treats ROOT_LABEL as ROOT`, async () => {
      const set = new ConfigSet(ConfigSet.ROOT_LABEL);
      assert.strictEqual(set.path, ConfigSet.ROOT);
      assert.deepStrictEqual(set.hierarchy, [ConfigSet.ROOT]);
      // expect(set.path).toBe(ConfigSet.ROOT);
      // expect(set.hierarchy).toEqual([ConfigSet.ROOT]);
    });
  });
});
