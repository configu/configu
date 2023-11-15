/* eslint-disable jest/expect-expect */
import _ from 'lodash';
import {
  InMemoryConfigStore,
  ConfigSet,
  ConfigSchema,
  UpsertCommand,
  UpsertCommandParameters,
  EvalCommand,
  EvalCommandParameters,
  EvalCommandReturn,
  DeleteCommand,
} from '.';

describe(`playground`, () => {
  const store = new InMemoryConfigStore();

  const set = new ConfigSet('test');

  const schema = new ConfigSchema('test', {
    K11: {
      type: 'JSONSchema',
      schema: { type: 'string', maxLength: 5 },
    },
    K12: {
      type: 'JSONSchema',
      schema: { type: 'number', maximum: 5 },
    },
    K13: {
      type: 'JSONSchema',
      schema: {
        type: 'object',
        properties: {
          foo: { type: 'integer' },
          bar: { type: 'string' },
        },
        required: ['foo'],
        additionalProperties: false,
      },
      // default: 'true',
      // depends: ['K12'],
    },
  });

  it(`a`, async () => {
    await new UpsertCommand({
      store,
      set,
      schema,
      configs: {
        K11: 'abcde',
        K12: '5',
        K13: JSON.stringify({
          foo: 7,
          bar: 'yaya',
        }),
      },
    }).run();
    const resp = await new EvalCommand({ store, set, schema }).run();
    // try {
    //   // expect(evaluatedConfigs).toStrictEqual(expected);
    // } catch (error) {
    //   // eslint-disable-next-line jest/no-conditional-expect
    //   // expect(error.message).toContain(expected);
    // } finally {
    //   const deletePromises = parameters.upsert.map((p) => new DeleteCommand(p).run());
    //   await Promise.all(deletePromises);
    // }
  });
});
