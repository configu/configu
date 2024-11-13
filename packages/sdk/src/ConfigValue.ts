import _ from 'lodash';
import { Jsonify, Merge } from 'type-fest';

import { Cfgu } from './Cfgu';
import { Config } from './Config';
import { ConfigStore } from './ConfigStore';
import { ConfigSet } from './ConfigSet';
import { ConfigSchema } from './ConfigSchema';
import { ConfigExpression, ExpressionString } from './ConfigExpression';
import { JSONSchema, FromSchema } from './expressions/JSONSchema';

export type ConfigValueAny = FromSchema<typeof JSONSchema.AnyPropertySchema>;

export type ConfigValueString = Config['value'];

export type ConfigWithCfgu = Config & { cfgu: Cfgu };

type ConfigExpressionContext = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  key?: string;
  configs: {
    [key: string]: ConfigWithCfgu;
  };
};

type ConfigContext = Merge<
  ConfigWithCfgu,
  {
    value: ConfigValueAny;
    storedValue: string;
  }
>;

export type ConfigEvaluationContext = {
  $: Partial<ConfigContext> & {
    input: {
      store: Jsonify<ConfigStore>;
      set: Jsonify<ConfigSet>;
      schema: Jsonify<ConfigSchema>;
    };
    configs: {
      [key: string]: ConfigContext;
    };
  };
};

export class ConfigValue {
  static {
    ConfigExpression.register('_', _);
    ConfigExpression.register('JSONSchema', JSONSchema);
  }

  static parse(value: ConfigValueString): ConfigValueAny {
    try {
      // numeric, boolean, object, array
      return JSON.parse(value);
    } catch (error) {
      // string
      return value;
    }
  }

  static stringify(value: ConfigValueAny): ConfigValueString {
    if (_.isString(value)) {
      return value;
    }
    return JSON.stringify(value);
  }

  static createEvaluationContext(context: ConfigExpressionContext): ConfigEvaluationContext {
    const configs = _.mapValues(context.configs, (current) => ({
      ...current,
      storedValue: current.value,
      value: ConfigValue.parse(current.value),
    }));

    let $ = {
      input: {
        store: { ...context.store },
        set: { ...context.set },
        schema: { ...context.schema },
      },
      configs,
    };

    if (context.key) {
      const currentConfig = configs[context.key];
      if (!currentConfig) {
        throw new Error(`Failed to create evaluation context for key "${context.key}"`);
      }
      $ = { ...currentConfig, ...$ };
    }

    return { $ };
  }

  static test({
    test,
    errorSuffix = `test "${test}"`,
    context,
  }: {
    test: ExpressionString;
    errorSuffix?: string;
    context: Required<ConfigExpressionContext>;
  }) {
    try {
      const isValid = ConfigExpression.evaluateBoolean(test, ConfigValue.createEvaluationContext(context));
      if (!isValid) {
        throw new Error();
      }
    } catch (error) {
      throw new Error(`ConfigValue failed ${errorSuffix}\n${error.message}`);
    }
  }

  static validate(context: Required<ConfigExpressionContext>) {
    const currentConfig = context.configs[context.key];
    if (!currentConfig) {
      throw new Error(`Failed to create evaluation context for key "${context.key}"`);
    }

    const { cfgu } = currentConfig;

    if (cfgu.pattern) {
      ConfigValue.test({
        test: `JSONSchema.validate({ "type": "string", "pattern": $.cfgu.pattern }, $.valueString) || true`,
        errorSuffix: 'Cfgu.pattern test',
        context,
      });
    }

    if (cfgu.enum) {
      ConfigValue.test({
        test: `JSONSchema.validate({ "enum": $.cfgu.enum }, $.value) || true`,
        errorSuffix: 'Cfgu.enum test',
        context,
      });
    }

    if (cfgu.schema) {
      ConfigValue.test({
        test: `JSONSchema.validate($.cfgu.schema, $.value) || true`,
        errorSuffix: 'Cfgu.schema test',
        context,
      });
    }

    if (cfgu.test) {
      const tests = Array.isArray(cfgu.test) ? cfgu.test : [cfgu.test];
      tests.forEach((test, idx) => {
        ConfigValue.test({
          test,
          errorSuffix: `Cfgu.test[${idx}] "${test}"`,
          context,
        });
      });
    }
  }
}

// ConfigValue.validate({
//   set: 'set',
//   key: 'key',
//   value: '{"z": 1}',
//   cfgu: {
//     // test: ['$.value.endsWith("com")', 'validator.isEmail($.value)', 'false'],
//     // schema: {
//     //   type: 'object',
//     //   required: ['name'],
//     //   properties: {
//     //     name: {
//     //       type: 'string',
//     //       minLength: 1,
//     //     },
//     //   },
//     //   additionalProperties: true,
//     // },
//     // pattern: '^(hello|hey|welcome|hola|salute|bonjour|shalom|marhabaan)$',
//     // enum: ['hello', 'hey', 'welcome', 'hola', 'salute', 'bonjour', 'shalom', 'marhabaan'],
//     // enum: ['{ a: 1 }', '{ a: 2 }', '[1, 2]'],
//     // pattern: '^[0-9]*$',
//     // pattern: '^\\{(.|[\\r\\n])*\\}$',
//     // type: 'object',
//   },
// });
