import {
  InMemoryStore,
  ConfigSet,
  ConfigSchema as BaseConfigSchema,
  UpsertCommand,
  UpsertCommandParameters,
  EvalCommand,
  EvalCommandParameters,
  EvaluatedConfigs,
  DeleteCommand,
} from '..';
import { Cfgu, Convert } from '../types/generated';

class ConfigSchema extends BaseConfigSchema {
  constructor(public contents: { [key: string]: Cfgu }) {
    super('.cfgu.json');
  }

  async read(): Promise<string> {
    return Convert.configSchemaContentsToJson(this.contents);
  }
}

describe(`EvalCommand`, () => {
  const store1 = new InMemoryStore();
  const store2 = new InMemoryStore();

  const set1 = new ConfigSet('test');
  const set11 = new ConfigSet('test1/test11');
  const set2 = new ConfigSet('test2');

  const schema1 = new ConfigSchema({
    K11: {
      type: 'Boolean',
      default: 'true',
    },
    K12: {
      type: 'Number',
    },
    K13: {
      type: 'String',
      required: true,
      depends: ['K12'],
    },
  });
  const schema2 = new ConfigSchema({
    K21: {
      type: 'RegEx',
      pattern: '^(foo|bar|baz)$',
    },
    K22: {
      type: 'String',
      template: '{{K21}}::{{K11}}:{{K12}}:{{K13}}',
    },
  });

  describe(`EvalCommand`, () => {
    test.each<{
      name: string;
      parameters: { upsert: UpsertCommandParameters[]; eval: EvalCommandParameters };
      expected: EvaluatedConfigs | string;
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
          eval: { from: [{ store: store1, set: set1, schema: schema1 }] },
        },
        expected: { K11: 'true', K12: '4', K13: 'test' },
      },
      {
        name: '[ store2 ⋅ set2 ⋅ schema2 ] - override',
        parameters: {
          upsert: [],
          eval: {
            from: [{ store: store2, set: set2, schema: schema2, configs: { K21: 'baz' } }],
            configs: { K22: 'test' },
          },
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
          eval: { from: [{ store: store1, set: set1, schema: schema1 }] },
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
          eval: { from: [{ store: store1, set: set1, schema: schema1 }] },
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
          eval: {
            from: [
              { store: store1, set: set1, schema: schema1 },
              { store: store1, set: set2, schema: schema1 },
            ],
          },
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
          eval: {
            from: [
              { store: store1, set: set1, schema: schema1 },
              { store: store1, set: set1, schema: schema2 },
            ],
          },
        },
        expected: { K11: 'false', K12: '4', K13: 'test', K21: 'foo', K22: 'foo::false:4:test' },
      },
    ])('$name', async ({ parameters, expected }) => {
      const upsertPromises = parameters.upsert.map((p) => new UpsertCommand(p).run());
      await Promise.all(upsertPromises);

      try {
        const { result } = await new EvalCommand(parameters.eval).run();
        expect(result).toStrictEqual(expected);
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toContain(expected);
      } finally {
        const deletePromises = parameters.upsert.map((p) => new DeleteCommand(p).run());
        await Promise.all(deletePromises);
      }
    });
  });
});
