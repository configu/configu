import _ from 'lodash';
import { Jsonify } from 'type-fest';
import { ConfigCommand } from './ConfigCommand';
import { Cfgu } from '../core/Cfgu';
import { ConfigStore, ConfigQuery } from '../core/ConfigStore';
import { ConfigSet } from '../core/ConfigSet';
import { ConfigSchema } from '../core/ConfigSchema';
import { Expression } from '../utils';

// Enum for config evaluation origins
export enum EvaluatedConfigOrigin {
  Const = 'const',
  Override = 'override',
  Store = 'store',
  Default = 'default',
  Empty = 'empty',
}

// Types for the evaluated config and command input/output
export type EvaluatedConfig = {
  key: string;
  cfgu: Cfgu;
  origin: EvaluatedConfigOrigin;
  value: string;
};

export type EvalCommandOutput = Record<string, EvaluatedConfig>;

export type EvalCommandInput = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs?: Record<string, string>;
  pipe?: EvalCommandOutput;
  validate?: boolean;
};

export type EvalCommandExpressionContext = {
  context: {
    store: Jsonify<ConfigStore>;
    set: Jsonify<ConfigSet>;
    schema: Jsonify<ConfigSchema>;
  };
  $: EvaluatedConfig;
};

// Main EvalCommand class extending ConfigCommand
export class EvalCommand extends ConfigCommand<EvalCommandInput, EvalCommandOutput> {
  
  // Execute the command
  async execute(): Promise<EvalCommandOutput> {
    const { store } = this.input;
    await store.init();

    let result = this.initializeResult();
    result = this.applyOverrides(result);
    result = await this.applyStoreValues(result);
    result = this.applyDefaultValues(result);
    result = this.applyPipeValues(result);
    result = this.applyConstValues(result);

    this.validateResult(result);

    return result;
  }

  // Initialize the result with empty or constant values
  private initializeResult(): EvalCommandOutput {
    const { schema } = this.input;

    return _.mapValues(schema.keys, (cfgu, key) => {
      const origin = cfgu.const ? EvaluatedConfigOrigin.Const : EvaluatedConfigOrigin.Empty;
      return { key, cfgu, origin, value: '' };
    });
  }

  // Apply overrides from the input configs
  private applyOverrides(result: EvalCommandOutput): EvalCommandOutput {
    const { configs = {} } = this.input;

    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) return current;

      const isOverridden = configs.hasOwnProperty(current.key);
      if (isOverridden || Boolean(current.cfgu.lazy)) {
        return { ...current, origin: EvaluatedConfigOrigin.Override, value: configs[current.key] || '' };
      }

      return current;
    });
  }

  // Apply values from the store
  private async applyStoreValues(result: EvalCommandOutput): Promise<EvalCommandOutput> {
    const { store, set } = this.input;

    const queries = _.chain(result)
      .filter((current) => current.origin === EvaluatedConfigOrigin.Empty)
      .flatMap((current) => set.hierarchy.map((node) => ({ set: node, key: current.key })))
      .value() satisfies ConfigQuery[];

    const storeConfigs = await store.get(queries);
    const storeConfigsDict = _.keyBy(storeConfigs, 'key');

    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) return current;

      const storeConfig = storeConfigsDict[current.key];
      if (storeConfig && storeConfig.value) {
        return { ...current, origin: EvaluatedConfigOrigin.Store, value: storeConfig.value };
      }

      return current;
    });
  }

  // Apply default values
  private applyDefaultValues(result: EvalCommandOutput): EvalCommandOutput {
    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) return current;

      if (current.cfgu.default) {
        return { ...current, origin: EvaluatedConfigOrigin.Default, value: current.cfgu.default };
      }

      return current;
    });
  }

  // Apply piped values if provided
  private applyPipeValues(result: EvalCommandOutput): EvalCommandOutput {
    const { pipe } = this.input;

    if (!pipe) return result;

    return _.assignWith(result, pipe, (current, piped) => {
      if (piped.origin === EvaluatedConfigOrigin.Empty) return current;
      if (current.origin === EvaluatedConfigOrigin.Empty) return piped;

      const isCurrentDefault = current.origin === EvaluatedConfigOrigin.Default;
      const isPipedDefault = piped.origin === EvaluatedConfigOrigin.Default;

      if (isCurrentDefault && !isPipedDefault) return piped;

      return current;
    });
  }

  // Apply constant values from expressions
  private applyConstValues(result: EvalCommandOutput): EvalCommandOutput {
    const { store, set, schema } = this.input;
    const constExpressionsDict = _.mapValues(
      _.pickBy(result, (current) => current.origin === EvaluatedConfigOrigin.Const),
      (current) => current.cfgu.const as string
    );

    const sortedKeys = Expression.sort(constExpressionsDict);
    sortedKeys.forEach((key) => {
      const expression = constExpressionsDict[key];
      const context: EvalCommandExpressionContext = {
        context: { store: { ...store }, set: { ...set }, schema: { ...schema } },
        $: result[key],
        ..._.mapValues(result, (current) => current.value),
      };

      const { value } = Expression.parse(expression).tryEvaluate(context);
      result[key].value = value || '';
    });

    return result;
  }

private validateResult(result: EvalCommandOutput): void {
    const { validate = true } = this.input;

    if (!validate) {
      return;
    }

    const evaluatedConfigsDict = _.mapValues(result, (current) => current.value);

    // * validate the eval result against the provided schema
    _.chain(result)
      .values()
      .forEach(({ key, cfgu, origin, value }) => {
        // const { key, cfgu } = current;
        // const evaluatedValue = current.value;

        try {
          if (origin !== EvaluatedConfigOrigin.Empty) {
            // todo: validate type, enum, pattern, schema, test
            // CfguValidator.validateOptions({ ...cfgu, value: evaluatedValue });
            // CfguValidator.validateType({ ...cfgu, value: evaluatedValue });
            // if (cfgu.depends && cfgu.depends.some((depend) => !evaluatedConfigsDict[depend])) {
            //   throw new Error(`ConfigValue is missing for depends`);
            // }
          } else if (cfgu.required) {
            throw new Error('ConfigValue is required');
          }
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Validation failed for key: "${key}"\n${error.message}`);
          }
          throw new Error(`Validation failed for key: "${key}"`); // code flow should never reach here
        }
      });
  }
}
