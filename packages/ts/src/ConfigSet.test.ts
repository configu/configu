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

    test(`should throw an error when path mustn't end with / character`, () => {
      assert.throws(
        () => new ConfigSet(`some-path${ConfigSet.SEPARATOR}`),
        (error) => {
          assert.ok(error instanceof ConfigError);
          assert.match(error.message, new RegExp(`path mustn't end with ${ConfigSet.SEPARATOR} character`));

          return true;
        },
      );
    });

    test(`should throw an error when the path includes special characters`, () => {
      const reservedNames = ['&', '@', ':'];
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

    test(`should throw an error when the path includes reserved names ('_', '-', 'this', 'cfgu')`, () => {
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

    test(`should remove / from path`, () => {
      const set = new ConfigSet('/some/path');
      assert.deepEqual(set.path, 'some/path');
    });

    test(`builds hierarchy for single segment path`, () => {
      const set = new ConfigSet('some');
      assert.strictEqual(set.path, 'some');
      assert.deepStrictEqual(set.hierarchy, ['', 'some']);
    });

    test(`builds hierarchy for multi-segment path`, () => {
      const set = new ConfigSet('a/b/c');
      assert.strictEqual(set.path, 'a/b/c');
      assert.deepStrictEqual(set.hierarchy, ['', 'a', 'a/b', 'a/b/c']);
    });
  });
});
