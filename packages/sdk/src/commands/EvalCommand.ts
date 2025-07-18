import { ConfigCommand } from '../ConfigCommand';
import { ConfigValue, ConfigValueAny, ConfigWithCfgu } from '../ConfigValue';
import { ConfigStore, ConfigQuery } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';
import { ConfigExpression } from '../ConfigExpression';
import { _ } from '../expressions';

export enum EvaluatedConfigOrigin {
  Empty = 'empty',
  Store = 'store',
  Override = 'override',
  Default = 'default',
  // Pipe = 'pipe' -> pipped configs brings their own origin
  Const = 'const',
}

export type EvaluatedConfig = ConfigWithCfgu & {
  origin: EvaluatedConfigOrigin;
};

export type EvalCommandOutput = {
  [key: string]: EvaluatedConfig;
};

export type EvalCommandInput = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs?: { [key: string]: ConfigValueAny };
  pipe?: EvalCommandOutput;
  depth?: number;
  validate?: boolean;
};

export class EvalCommand extends ConfigCommand<EvalCommandInput, EvalCommandOutput> {
  async execute() {
    const { store } = this.input;

    await store.init();

    let result: EvalCommandOutput = { ...this.evalEmpty() };
    result = { ...result, ...(await this.evalStore(result)) };
    result = { ...result, ...this.evalOverride(result) };
    result = { ...result, ...this.evalDefault(result) };
    result = { ...result, ...this.evalPipe(result) };
    result = { ...result, ...this.evalConst(result) };

    this.validateResult(result);

    return result;
  }

  private evalEmpty(): EvalCommandOutput {
    const { schema } = this.input;

    return _.mapValues<ConfigSchema['keys'], EvaluatedConfig>(schema.keys, (cfgu, key) => {
      return {
        set: this.input.set.path,
        key,
        value: '',
        cfgu,
        origin: EvaluatedConfigOrigin.Empty,
      };
    });
  }

  private evalOverride(result: EvalCommandOutput): EvalCommandOutput {
    const { configs = {} } = this.input;

    return _.mapValues(result, (current) => {
      const isOverridden = _.has(configs, current.key);
      const isLazy = Boolean(current.cfgu?.lazy);

      if (isOverridden || isLazy) {
        const overrideValue = configs?.[current.key] ?? '';
        return {
          ...current,
          value: ConfigValue.stringify(overrideValue),
          origin: EvaluatedConfigOrigin.Override,
        };
      }

      return current;
    });
  }

  private async evalStore(result: EvalCommandOutput): Promise<EvalCommandOutput> {
    const { store, set, depth = Infinity } = this.input;

    const setHierarchy = _.takeRight(set.hierarchy, depth);
    const storeQueries = _.chain(result)
      .values()
      .flatMap((current) => setHierarchy.map((node) => ({ set: node, key: current.key })))
      .value() satisfies ConfigQuery[];
    const storeConfigsArray = await store.get(storeQueries);
    const storeConfigsDict = _.chain(storeConfigsArray)
      .orderBy([(config) => setHierarchy.indexOf(config.set)], ['asc']) // "asc" because _.keyBy will keep the last element for each key
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

      return _.merge(current, storeConfig, {
        origin: EvaluatedConfigOrigin.Store,
      });
    });
  }

  private evalDefault(result: EvalCommandOutput): EvalCommandOutput {
    return _.mapValues(result, (current) => {
      const isEmpty = current.origin === EvaluatedConfigOrigin.Empty;

      if (current.cfgu?.default && isEmpty) {
        return {
          ...current,
          value: ConfigValue.stringify(current.cfgu.default),
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

    return _.assignWith(result, pipe, (current, piped) => {
      if (_.isUndefined(current)) {
        return piped;
      }

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
  }

  private evalConst(result: EvalCommandOutput): EvalCommandOutput {
    const { store, set, schema } = this.input;

    const resultWithConstExpressions = _.mapValues(result, (current) => {
      if (current.cfgu?.const) {
        return {
          ...current,
          value: '',
          origin: EvaluatedConfigOrigin.Const,
        };
      }
      return current;
    });

    const constExpressionsDict = _.chain(resultWithConstExpressions)
      .pickBy((current) => current.cfgu?.const)
      // .mapValues((current) => (current.cfgu?.const ? `\`${current.cfgu.const}\`` : ''))
      .mapValues((current) => current.cfgu?.const ?? '')
      .value();

    ConfigExpression.sort(constExpressionsDict).forEach((key) => {
      const expression = constExpressionsDict[key] as string;
      const value =
        ConfigExpression.evaluate(
          expression,
          ConfigValue.createEvaluationContext({
            store,
            set,
            schema,
            current: key,
            configs: resultWithConstExpressions,
          }),
        ) ?? '';
      (resultWithConstExpressions[key] as EvaluatedConfig).value = value;
    });

    return resultWithConstExpressions;
  }

  private validateResult(result: EvalCommandOutput): void {
    const { store, set, schema, validate = true } = this.input;

    if (!validate) {
      return;
    }

    // const evaluatedConfigsDict = _.mapValues(result, (current) => current.value);

    // * validate the eval result against the provided schema
    _.chain(result)
      .values()
      .forEach((current) => {
        const { cfgu, origin, key } = current;
        // const evaluatedValue = current.value;

        try {
          if (cfgu?.required && origin === EvaluatedConfigOrigin.Empty) {
            throw new Error('ConfigValue is required');
          }

          // todo: think about when should we run the tests
          ConfigValue.validate({
            store,
            set,
            schema,
            current: key,
            configs: result,
          });

          // todo: think about reviving depends on cfgu
          // if (origin !== EvaluatedConfigOrigin.Empty) {
          // if (cfgu.depends && cfgu.depends.some((depend) => !evaluatedConfigsDict[depend])) {
          //   throw new Error(`ConfigValue is missing for depends`);
          // }
          // } else if (cfgu?.required) {
          //   throw new Error('ConfigValue is required');
          // }
        } catch (error) {
          throw new Error(`Validation failed for Config: "${current.key}"\n${error.message}`);
        }
      })
      .value();
  }
}
