import _ from 'lodash';
import {
  InMemoryConfigStore,
  ConfigSet,
  ConfigSchema,
  UpsertCommand,
  type UpsertCommandParameters,
  EvalCommand,
  type EvalCommandParameters,
  DeleteCommand,
  type EvalCommandReturn,
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
        await expect(() =>
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
        ).rejects.toBeInstanceOf(ConfigError);
      });
    });
  });
  describe(`EvalCommand`, () => {
    test.each<{
      name: string;
      parameters: { upsert: UpsertCommandParameters[]; eval: EvalCommandParameters[] };
      expected: { [key: string]: string } | string;
    }>([
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
    ])('$name', async ({ parameters, expected }) => {
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
        expect(evaluatedConfigs).toStrictEqual(expected);
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toContain(expected);
      } finally {
        const deletePromises = parameters.upsert.map((p) => new DeleteCommand(p).run());
        await Promise.all(deletePromises);
      }
    });
    describe('Tests for lazy configs', () => {
      test('run EvalCommand WITHOUT configs overrides but one config is `cfgu.lazy && cfgu.required = true`', async () => {
        expect.assertions(1);
        await expect(() =>
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
        ).rejects.toBeInstanceOf(ConfigError);
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
        expect(result).toMatchObject({ K1: { result: { value: '' } } });
      });
      test('run EvalCommand WITH configs overrides but not for the one config is `cfgu.lazy && cfgu.required = true`', async () => {
        expect.assertions(1);
        await expect(() =>
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
        ).rejects.toBeInstanceOf(ConfigError);
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
        expect(result).toMatchObject({ K1: { result: { value: '1' } } });
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
        expect(result).toMatchObject({ K1: { result: { value: '1' } } });
      });
      test('run EvalCommand with override for lazy config when there is a value in the store and get the override value in the result', async () => {
        await store1.set([{ set: set1.path, key: 'K1', value: '2' }]);
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
        expect(result).toMatchObject({ K1: { result: { value: '1' } } });
      });
      test("run EvalCommand without override for lazy config when there is a value in the store and don't get it back in the result", async () => {
        await store1.set([{ set: set1.path, key: 'K1', value: '2' }]);
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
        expect(result).toMatchObject({ K1: { result: { value: '' } } });
      });
    });
  });
});
