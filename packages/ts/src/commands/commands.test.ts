import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import _ from 'lodash';
import {
  InMemoryConfigStore,
  ConfigSet,
  ConfigSchema,
  UpsertCommand,
  UpsertCommandParameters,
  EvalCommand,
  EvalCommandParameters,
  DeleteCommand,
  EvalCommandReturn,
  ExportCommand,
  ConfigError,
} from '..';

describe(`commands`, () => {
  const store1 = new InMemoryConfigStore();
  const store2 = new InMemoryConfigStore();

  const set1 = new ConfigSet('test');
  const set11 = new ConfigSet('test1/test11');
  const set2 = new ConfigSet('test2');

  const schema1 = new ConfigSchema('s1', {
    K11: {
      type: 'Boolean',
      default: 'true',
      depends: ['K12'],
    },
    K12: {
      type: 'Number',
    },
    K13: {
      type: 'String',
      required: true,
    },
  });
  const schema2 = new ConfigSchema('s2', {
    K21: {
      type: 'RegEx',
      pattern: '^(foo|bar|baz)$',
    },
    K22: {
      type: 'String',
      template: '{{K21}}::{{K11}}:{{K12}}:{{K13}}',
    },
  });
  const schema3 = new ConfigSchema('s3', {
    K31: {
      type: 'String',
      description: "email's prefix",
      template: '{{CONFIGU_SET.1}}-{{CONFIGU_SET.hierarchy.1}}',
    },
    K32: {
      type: 'Domain',
      description: "email's suffix",
    },
    K33: {
      type: 'Email',
      template: '{{CONFIGU_SET.last}}-{{K31}}@{{K32}}',
      required: true,
      depends: ['K31', 'K32'],
    },
  });

  describe(`UpsertCommand`, () => {
    describe('Tests for lazy configs', () => {
      test('run UpsertCommand with lazy config', async () => {
        await assert.rejects(
          () =>
            new UpsertCommand({
              store: store1,
              set: set1,
              schema: new ConfigSchema('lazy', {
                K1: {
                  type: 'String',
                  lazy: true,
                },
              }),
              configs: {
                K1: '1',
              },
            }).run(),
          (error) => error instanceof ConfigError,
        );
      });
    });
  });

  describe(`EvalCommand`, async () => {
    const cases: {
      name: string;
      parameters: { upsert: UpsertCommandParameters[]; eval: EvalCommandParameters[] };
      expected: { [key: string]: string } | string;
    }[] = [
      {
        name: '[ store1 ⋅ set1 ⋅ schema1 ]',
        parameters: {
          upsert: [
            {
              store: store1,
              set: set1,
              schema: schema1,
              configs: {
                K12: '4',
                K13: 'test',
              },
            },
          ],
          eval: [{ store: store1, set: set1, schema: schema1 }],
        },
        expected: { K11: 'true', K12: '4', K13: 'test' },
      },
      {
        name: '[ store2 ⋅ set2 ⋅ schema2 ] - override',
        parameters: {
          upsert: [],
          eval: [{ store: store2, set: set2, schema: schema2, configs: { K21: 'baz', K22: 'test' } }],
        },
        expected: { K21: 'baz', K22: 'test' },
      },
      {
        name: '[ store1 ⋅ set1 ⋅ schema1 ] - fail required',
        parameters: {
          upsert: [
            {
              store: store1,
              set: set1,
              schema: schema1,
              configs: { K12: '7' },
            },
          ],
          eval: [{ store: store1, set: set1, schema: schema1 }],
        },
        expected: 'required',
      },
      {
        name: '[ store1 ⋅ set1 ⋅ schema1 ] - fail depends',
        parameters: {
          upsert: [
            {
              store: store1,
              set: set1,
              schema: schema1,
              configs: { K13: 'test' },
            },
          ],
          eval: [{ store: store1, set: set1, schema: schema1 }],
        },
        expected: 'depends',
      },
      {
        name: '[ store1 ⋅ set1 ⋅ schema1 ] + [ store1 ⋅ set2 ⋅ schema1 ]',
        parameters: {
          upsert: [
            {
              store: store1,
              set: set1,
              schema: schema1,
              configs: {
                K12: '4',
                K13: 'test',
              },
            },
            {
              store: store1,
              set: set2,
              schema: schema1,
              configs: {
                K12: '7',
              },
            },
          ],
          eval: [
            { store: store1, set: set1, schema: schema1 },
            { store: store1, set: set2, schema: schema1 },
          ],
        },
        expected: { K11: 'true', K12: '7', K13: 'test' },
      },
      {
        name: '[ store1 ⋅ set1 ⋅ schema1 ] + [ store1 ⋅ set1 ⋅ schema2 ]',
        parameters: {
          upsert: [
            {
              store: store1,
              set: set1,
              schema: schema1,
              configs: {
                K11: 'false',
                K12: '4',
                K13: 'test',
              },
            },
            {
              store: store1,
              set: set1,
              schema: schema2,
              configs: {
                K21: 'foo',
              },
            },
          ],
          eval: [
            { store: store1, set: set1, schema: schema1 },
            { store: store1, set: set1, schema: schema2 },
          ],
        },
        expected: { K11: 'false', K12: '4', K13: 'test', K21: 'foo', K22: 'foo::false:4:test' },
      },
      {
        name: '[ store2 ⋅ set1 ⋅ schema3 ] - template of a template & CONFIGU_SET',
        parameters: {
          upsert: [
            {
              store: store2,
              set: set1,
              schema: schema3,
              configs: {
                K32: 'configu.com',
              },
            },
          ],
          eval: [{ store: store2, set: set1, schema: schema3 }],
        },
        expected: { K31: 'test-test', K32: 'configu.com', K33: 'test-test-test@configu.com' },
      },
    ];

    await Promise.allSettled(
      cases.map(({ name, parameters, expected }) =>
        test.test(name, async () => {
          try {
            const upsertPromises = parameters.upsert.map((p) => new UpsertCommand(p).run());
            await Promise.all(upsertPromises);

            const evalResult = await parameters.eval.reduce<Promise<EvalCommandReturn>>(
              async (promisedPrevious, current) => {
                const previous = await promisedPrevious;
                return new EvalCommand({ ...current, pipe: previous }).run();
              },
              undefined as any,
            );
            const evaluatedConfigs = _.mapValues(evalResult, (current) => current.result.value);
            assert.deepStrictEqual(evaluatedConfigs, expected);
          } catch (error) {
            assert(error.message.includes(expected));
          } finally {
            const deletePromises = parameters.upsert.map((p) => new DeleteCommand(p).run());
            await Promise.all(deletePromises);
          }
        }),
      ),
    );

    describe('Tests for lazy configs', () => {
      before(async () => {
        await store1.init();
        await new UpsertCommand({
          store: store1,
          set: set1,
          schema: new ConfigSchema('lazy', {
            K1: {
              type: 'String',
            },
          }),
          configs: {
            K1: '2',
          },
        }).run();
      });

      test('run EvalCommand WITHOUT configs overrides but one config is `cfgu.lazy && cfgu.required = true`', async () => {
        assert.rejects(
          () =>
            new EvalCommand({
              store: store1,
              set: set1,
              schema: new ConfigSchema('lazy', {
                K1: {
                  type: 'String',
                  lazy: true,
                  required: true,
                },
              }),
            }).run(),
          (error) => error instanceof ConfigError,
        );
      });
      test('run EvalCommand WITHOUT configs overrides but one config is `cfgu.lazy && cfgu.required = false`', async () => {
        const result = await new EvalCommand({
          store: store1,
          set: set1,
          schema: new ConfigSchema('lazy', {
            K1: {
              type: 'String',
              lazy: true,
            },
          }),
        }).run();
        assert.deepEqual(result.K1?.result?.value, '');
      });
      test('run EvalCommand WITH configs overrides but not for the one config is `cfgu.lazy && cfgu.required = true`', async () => {
        assert.rejects(
          () =>
            new EvalCommand({
              store: store1,
              set: set1,
              schema: new ConfigSchema('lazy', {
                K1: {
                  type: 'String',
                  lazy: true,
                  required: true,
                },
                K2: {
                  type: 'String',
                },
              }),
              configs: {
                K2: '2',
              },
            }).run(),
          (error) => error instanceof ConfigError,
        );
      });
      test('run EvalCommand WITH configs overrides for the one config is `cfgu.lazy && cfgu.required = false`', async () => {
        const result = await new EvalCommand({
          store: store1,
          set: set1,
          schema: new ConfigSchema('lazy', {
            K1: {
              type: 'String',
              lazy: true,
              required: false,
            },
          }),
          configs: {
            K1: '1',
          },
        }).run();
        assert.deepEqual(result.K1?.result?.value, '1');
      });
      test('run EvalCommand WITH configs overrides for the one config is `cfgu.lazy && cfgu.required = true`', async () => {
        const result = await new EvalCommand({
          store: store1,
          set: set1,
          schema: new ConfigSchema('lazy', {
            K1: {
              type: 'String',
              lazy: true,
              required: true,
            },
          }),
          configs: {
            K1: '1',
          },
        }).run();
        assert.deepEqual(result.K1?.result?.value, '1');
      });
      test('run EvalCommand with override for lazy config when there is a value in the store and get the override value in the result', async () => {
        const result = await new EvalCommand({
          store: store1,
          set: set1,
          schema: new ConfigSchema('lazy', {
            K1: {
              type: 'String',
              lazy: true,
            },
          }),
          configs: {
            K1: '1',
          },
        }).run();
        assert.deepEqual(result.K1?.result?.value, '1');
      });
      test("run EvalCommand without override for lazy config when there is a value in the store and don't get it back in the result", async () => {
        const result = await new EvalCommand({
          store: store1,
          set: set1,
          schema: new ConfigSchema('lazy', {
            K1: {
              type: 'String',
              lazy: true,
            },
          }),
        }).run();
        assert.deepEqual(result.K1?.result?.value, '');
      });
    });
  });
  describe(`ExportCommand`, () => {
    const getEvalResult = async (schema?: ConfigSchema) => {
      return new EvalCommand({
        store: store1,
        set: set1,
        schema:
          schema ||
          new ConfigSchema('mutate', {
            KEY0: {
              type: 'String',
            },
            KEY1: {
              type: 'String',
            },
          }),
        configs: {
          KEY0: 'KEY0',
          KEY1: 'KEY1',
        },
      }).run();
    };
    test('Export with filter', async () => {
      const evalResult = await getEvalResult();
      const exportedConfigs = await new ExportCommand({
        pipe: evalResult,
        filter: ({ context, result }) => result.value !== 'KEY0',
      }).run();
      assert.deepStrictEqual(exportedConfigs, { KEY1: 'KEY1' });
    });
    test('Export with hidden configs', async () => {
      const evalResult = await getEvalResult(
        new ConfigSchema('mutate', {
          KEY0: {
            type: 'String',
          },
          KEY1: {
            type: 'String',
            hidden: true,
          },
        }),
      );
      const exportedConfigs = await new ExportCommand({ pipe: evalResult }).run();
      assert.deepStrictEqual(exportedConfigs, { KEY0: 'KEY0' });
    });
    describe(`Keys Mutation Callback`, () => {
      test('Export without keys mutation callback', async () => {
        const evalResult = await getEvalResult();
        const exportedConfigs = await new ExportCommand({ pipe: evalResult }).run();
        assert.deepStrictEqual(exportedConfigs, { KEY0: 'KEY0', KEY1: 'KEY1' });
      });
    });
    test('Export with keys mutation callback', async () => {
      const evalResult = await getEvalResult();
      const exportedConfigs = await new ExportCommand({ pipe: evalResult, keys: (key) => `MY_${key}` }).run();
      assert.deepStrictEqual(exportedConfigs, { MY_KEY0: 'KEY0', MY_KEY1: 'KEY1' });
    });
    test('Export with bad keys mutation callback that returns non-string', async () => {
      const evalResult = await getEvalResult();
      await assert.rejects(
        () =>
          new ExportCommand({
            pipe: evalResult,
            // @ts-expect-error - should throw ConfigError
            keys: (key) => ({ key }),
          }).run(),
        (error) => error instanceof ConfigError,
      );
    });
    test('Export with bad keys mutation callback that returns number', async () => {
      const evalResult = await getEvalResult();
      // @ts-expect-error - should throw ConfigError
      const exportedConfigs = await new ExportCommand({ pipe: evalResult, keys: (key) => 5 }).run();
      assert.deepStrictEqual(exportedConfigs, { '5': 'KEY1' });
    });
    test('Export with bad keys mutation callback that returns empty string', async () => {
      const evalResult = await getEvalResult();
      await assert.rejects(
        () =>
          new ExportCommand({
            pipe: evalResult,
            keys: (key) => '',
          }).run(),
        (error) => error instanceof ConfigError,
      );
    });
    test('Export with bad keys mutation callback that returns !NAME()', async () => {
      const evalResult = await getEvalResult();
      await assert.rejects(
        () =>
          new ExportCommand({
            pipe: evalResult,
            keys: (key) => `!${key}`,
          }).run(),
        (error) => error instanceof ConfigError,
      );
    });
    test('Export with bad keys mutation callback that raise exception', async () => {
      const evalResult = await getEvalResult();
      await assert.rejects(
        () =>
          new ExportCommand({
            pipe: evalResult,
            keys: (key) => {
              throw new Error('test');
            },
          }).run(),
        (error) => error instanceof Error,
      );
    });
  });
});
