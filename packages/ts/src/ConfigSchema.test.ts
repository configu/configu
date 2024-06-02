import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigSchema } from './ConfigSchema';
import { ConfigError } from './utils';

describe(`ConfigSchema`, () => {
  describe('cfguStructureValidator', () => {
    test('Empty SchemaContents', () => {
      assert.throws(() => new ConfigSchema('empty', {}), ConfigError);
    });
    describe('Tests for lazy configs', () => {
      test('parse ConfigSchema with `lazy=true` and `default=any`', () => {
        assert.throws(
          () =>
            new ConfigSchema('lazy', {
              K1: {
                type: 'String',
                lazy: true,
                default: '1',
              },
            }),
          ConfigError,
        );
      });
      test('parse ConfigSchema with `lazy=true` and `template=any`', () => {
        assert.throws(
          () =>
            new ConfigSchema('lazy', {
              T1: {
                type: 'String',
                default: 'Template',
              },
              K1: {
                type: 'String',
                lazy: true,
                template: '{{ T1 }}',
              },
            }),
          ConfigError,
        );
      });
    });
  });
});
