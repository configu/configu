import _ from 'lodash';
import { Jsonify, Merge } from 'type-fest';

import { type Cfgu } from './Cfgu';
import { type Config } from './Config';
import { type ConfigStore } from './ConfigStore';
import { type ConfigSet } from './ConfigSet';
import { type ConfigSchema } from './ConfigSchema';
import { ConfigExpression, ExpressionString } from './ConfigExpression';
import { JSONSchema, FromSchema } from './expressions/JSONSchema';

export type ConfigValueAny = FromSchema<typeof JSONSchema.AnyPropertySchema>;

export type ConfigValueString = Config['value'];

export type ConfigWithCfgu = Config & { cfgu: Cfgu };

type ConfigExpressionContext = {
  store?: ConfigStore;
  set?: ConfigSet;
  schema?: ConfigSchema;
  current?: string;
  configs: {
    [key: string]: ConfigWithCfgu;
  };
};

type ConfigContext = Merge<
  ConfigWithCfgu,
  {
    labels: string[];
    value: ConfigValueAny;
    storedValue: string;
  }
>;

export type ConfigEvaluationContext = {
  $: Partial<ConfigContext> & {
    input?: {
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
      labels: Array.isArray(current.cfgu.label) ? current.cfgu.label : _.compact([current.cfgu.label]),
    }));

    let $ = {
      configs,
    } as ConfigEvaluationContext['$'];

    if (context.store && context.set && context.schema) {
      $ = {
        input: {
          store: { ...context.store },
          set: { ...context.set },
          schema: { ...context.schema },
        },
        ...$,
      };
    }

    if (context.current) {
      const currentConfig = configs[context.current];
      if (!currentConfig) {
        throw new Error(`Failed to create evaluation context for key "${context.current}"`);
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
    // todo: consider optimizing this code by creating a concatenated test string and evaluating it once

    const currentConfig = context.configs[context.current];
    if (!currentConfig) {
      throw new Error(`Failed to create evaluation context for key "${context.current}"`);
    }

    const { cfgu } = currentConfig;

    if (cfgu.pattern) {
      ConfigValue.test({
        test: `JSONSchema.validate({ "type": "string", "pattern": $.cfgu.pattern }, $.storedValue) || true`,
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
