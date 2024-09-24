import _ from 'lodash';
import { Jsonify } from 'type-fest';
import { ConfigCommand } from './ConfigCommand';
import { Cfgu } from '../core/Cfgu';
import { ConfigStore, ConfigQuery } from '../core/ConfigStore';
import { ConfigSet } from '../core/ConfigSet';
import { ConfigSchema } from '../core/ConfigSchema';
import { Expression } from '../utils/Expression';

export enum EvaluatedConfigOrigin {
  Const = 'const',
  Override = 'override',
  Store = 'store',
  Default = 'default',
  Empty = 'empty',
}

export type EvaluatedConfig = {
  key: string;
  cfgu: Cfgu;
  origin: EvaluatedConfigOrigin;
  value: string;
};

export type EvalCommandOutput = {
  [key: string]: EvaluatedConfig;
};

export type EvalCommandInput = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs?: { [key: string]: string };
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
  _: EvaluatedConfig;
};

export class EvalCommand extends ConfigCommand<EvalCommandInput, EvalCommandOutput> {
  async execute() {
    const { store } = this.input;

    await store.init();

    let result: EvalCommandOutput = { ...this.evalEmpty() };
    result = { ...result, ...this.evalOverride(result) };
    result = { ...result, ...(await this.evalStore(result)) };
    result = { ...result, ...this.evalDefault(result) };
    result = { ...result, ...this.evalPipe(result) };
    result = { ...result, ...this.evalConst(result) };

    this.validateResult(result);

    return result;
  }

  private evalEmpty(): EvalCommandOutput {
    const { schema } = this.input;

    return _.mapValues<ConfigSchema['keys'], EvaluatedConfig>(schema.keys, (cfgu, key) => {
      let origin = EvaluatedConfigOrigin.Empty;
      if (cfgu.const) {
        origin = EvaluatedConfigOrigin.Const;
      }

      return {
        key,
        cfgu,
        origin,
        value: '',
      };
    });
  }

  private evalOverride(result: EvalCommandOutput): EvalCommandOutput {
    const { configs = {} } = this.input;

    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) {
        return current;
      }

      const isOverridden = Object.prototype.hasOwnProperty.call(configs, current.key);
      const isLazy = Boolean(current.cfgu.lazy);

      if (!isOverridden && !isLazy) {
        return current;
      }

      const overrideValue = configs?.[current.key] ?? '';
      return {
        ...current,
        origin: EvaluatedConfigOrigin.Override,
        value: overrideValue,
      };
    });
  }

  private async evalStore(result: EvalCommandOutput): Promise<EvalCommandOutput> {
    const { store, set } = this.input;

    const storeQueries = _(result)
      .values()
      .filter((current) => current.origin === EvaluatedConfigOrigin.Empty)
      .flatMap((current) => set.hierarchy.map((node) => ({ set: node, key: current.key })))
      .value() satisfies ConfigQuery[];
    const storeConfigsArray = await store.get(storeQueries);
    const storeConfigsDict = _(storeConfigsArray)
      .orderBy([(config) => set.hierarchy.indexOf(config.set)], ['asc']) // "asc" because _.keyBy will keep the last element for each key
      .keyBy((config) => config.key) // https://lodash.com/docs#keyBy
      .value();

    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) {
        return current;
      }

      const storeConfig = storeConfigsDict?.[current.key];

      if (!storeConfig || !storeConfig.value) {
        return current;
      }

      return _.merge(current, {
        // todo: add the evaluated set to the context somehow
        // context: { set: { ...new ConfigSet(storeConfig.set) } },
        origin: EvaluatedConfigOrigin.Store,
        value: storeConfig.value,
      });
    });
  }

  private evalDefault(result: EvalCommandOutput): EvalCommandOutput {
    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) {
        return current;
      }

      if (current.cfgu.default) {
        return {
          ...current,
          value: current.cfgu.default,
          origin: EvaluatedConfigOrigin.Default,
        };
      }

      return current;
    });
  }

  private evalPipe(result: EvalCommandOutput): EvalCommandOutput {
    const { pipe } = this.input;

    if (!pipe) {
      return result;
    }

    const mergedResults = _.assignWith(result, pipe, (current, piped) => {
      if (piped.origin === EvaluatedConfigOrigin.Empty) {
        return current;
      }

      if (current.origin === EvaluatedConfigOrigin.Empty) {
        return piped;
      }

      const isCurrentDefault = current.origin === EvaluatedConfigOrigin.Default;
      const isPipedDefault = piped.origin === EvaluatedConfigOrigin.Default;

      if (isCurrentDefault && !isPipedDefault) {
        return piped;
      }

      return current;
    });

    return mergedResults;
  }

  private evalConst(result: EvalCommandOutput): EvalCommandOutput {
    const { store, set, schema } = this.input;

    const resultWithConstExpressions = { ...result };

    const constExpressionsDict = _(result)
      .pickBy((current) => current.origin === EvaluatedConfigOrigin.Const)
      .mapValues((current) => current.cfgu.const as string)
      .value();

    Expression.sort(constExpressionsDict).forEach((key) => {
      const expression = constExpressionsDict[key] as string;
      const evaluatedConfig = resultWithConstExpressions[key] as EvaluatedConfig;
      const context: EvalCommandExpressionContext = {
        context: {
          store: { ...store },
          set: { ...set },
          schema: { ...schema },
        },
        $: evaluatedConfig,
        _: evaluatedConfig,
        ..._.mapValues(resultWithConstExpressions, (current) => current.value),
      };

      (resultWithConstExpressions[key] as EvaluatedConfig).value = Expression.eval({ expression, context });
    });
    return resultWithConstExpressions;
  }

  private validateResult(result: EvalCommandOutput): void {
    const { validate = true } = this.input;

    if (!validate) {
      return;
    }

    const evaluatedConfigsDict = _.mapValues(result, (current) => current.value);

    // * validate the eval result against the provided schema
    _(result)
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
