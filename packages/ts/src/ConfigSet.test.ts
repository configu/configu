import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigSet } from './ConfigSet';
import { ConfigError } from './utils';

describe(`ConfigSet`, () => {
  describe(`constructor`, () => {
    test(`uses ROOT path by default`, () => {
      const set = new ConfigSet();
      assert.strictEqual(set.path, ConfigSet.ROOT);
      assert.deepStrictEqual(set.hierarchy, [ConfigSet.ROOT]);
    });

    test(`Should throw an error when the path includes special characters.`, () => {
      assert.throws(
        () => new ConfigSet(`some-path${ConfigSet.SEPARATOR}`),
        (error) => {
          assert.ok(error instanceof ConfigError);
          assert.match(error.message, new RegExp(`path mustn't end with ${ConfigSet.SEPARATOR} character`));

          return true;
        },
      );
    });

    test(`Should throw an error when the path includes reserved names ('_', '-', 'this', 'cfgu')`, () => {
      const reservedNames = ['_', '-', 'this', 'cfgu'];
      reservedNames.forEach((name) => {
        assert.throws(
          () => new ConfigSet(name),
          (error) => {
            assert.ok(error instanceof ConfigError);
            assert.match(error.message, new RegExp(`path nodes mustn't contain reserved words "${name}"`));

            return true;
          },
        );
      });
    });
  });
});
