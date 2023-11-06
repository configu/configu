import _ from 'lodash';
import { Command } from '../Command';
import { type Cfgu } from '../types';
import { ConfigError, TMPL } from '../utils';
import { type ConfigStore } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';

export enum EvaluatedConfigOrigin {
  ConfigsOverride = 'CONFIGS_OVERRIDE',
  StoreSet = 'STORE_SET',
  SchemaTemplate = 'SCHEMA_TEMPLATE',
  SchemaDefault = 'SCHEMA_DEFAULT',
  EmptyValue = 'EMPTY_VALUE',
}

export type EvalCommandReturn = {
  [key: string]: {
    context: { store: string; set: string; schema: string; key: string; cfgu: Cfgu };
    result: { origin: EvaluatedConfigOrigin; source: string; value: string };
  };
};

export type EvalCommandParameters = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs?: { [key: string]: string };
  pipe?: EvalCommandReturn;
  validate?: boolean;
};

export class EvalCommand extends Command<EvalCommandReturn> {
  constructor(public parameters: EvalCommandParameters) {
    super(parameters);
  }

  private evalFromConfigsOverride(result: EvalCommandReturn): EvalCommandReturn {
    if (!this.parameters.configs) {
      return result;
    }

    return _.mapValues(result, (current) => {
      const { context } = current;
      const hasConfigOverrideValue = Object.prototype.hasOwnProperty.call(this.parameters.configs, context.key);

      if (!hasConfigOverrideValue) {
        return current;
      }

      const configOverrideValue = this.parameters.configs?.[context.key] ?? '';
      return {
        ...current,
        result: {
          origin: EvaluatedConfigOrigin.ConfigsOverride,
          source: `parameters.configs.${context.key}=${configOverrideValue}`,
          value: configOverrideValue,
        },
      };
    });
  }

  private async evalFromStoreSet(result: EvalCommandReturn): Promise<EvalCommandReturn> {
    const { store, set } = this.parameters;

    const storeQueries = _(result)
      .values()
      .flatMap((current) => {
        const { key } = current.context;
        return set.hierarchy.map((node) => ({ set: node, key }));
      })
      .value();
    const storeConfigsArray = await store.get(storeQueries);
    const storeConfigsDict = _(storeConfigsArray)
      .orderBy([(config) => set.hierarchy.indexOf(config.set)], ['desc'])
      .uniqBy((config) => config.key)
      .keyBy((config) => config.key)
      .value();

    return _.mapValues(result, (current) => {
      const { context } = current;
      const storeConfig = storeConfigsDict[context.key];

      if (!storeConfig) {
        return current;
      }

      return {
        ...current,
        result: {
          origin: EvaluatedConfigOrigin.StoreSet,
          source: `parameters.store=${context.store},parameters.set=${context.set}`,
          value: storeConfig.value,
        },
      };
    });
  }

  private evalFromSchema(result: EvalCommandReturn): EvalCommandReturn {
    return _.mapValues(result, (current) => {
      const { context } = current;
      const { cfgu } = context;

      if (cfgu.template) {
        return {
          ...current,
          result: {
            origin: EvaluatedConfigOrigin.SchemaTemplate,
            source: `parameters.schema=${context.schema}.template=${cfgu.template}`,
            value: '',
          },
        };
      }

      if (cfgu.default) {
        return {
          ...current,
          result: {
            origin: EvaluatedConfigOrigin.SchemaDefault,
            source: `parameters.schema=${context.schema}.default=${cfgu.default}`,
            value: cfgu.default,
          },
        } as const;
      }

      return current;
    });
  }

  private shouldOverrideOrigin(nextOrigin: EvaluatedConfigOrigin, previousOrigin?: EvaluatedConfigOrigin): boolean {
    switch (previousOrigin) {
      case undefined:
        return true;
      case EvaluatedConfigOrigin.EmptyValue:
        return nextOrigin !== EvaluatedConfigOrigin.EmptyValue;
      case EvaluatedConfigOrigin.SchemaDefault:
        return [
          EvaluatedConfigOrigin.SchemaDefault,
          EvaluatedConfigOrigin.StoreSet,
          EvaluatedConfigOrigin.ConfigsOverride,
          EvaluatedConfigOrigin.SchemaTemplate,
        ].includes(nextOrigin);
      default:
        return [
          EvaluatedConfigOrigin.StoreSet,
          EvaluatedConfigOrigin.ConfigsOverride,
          EvaluatedConfigOrigin.SchemaTemplate,
        ].includes(nextOrigin);
    }
  }

  private evalPrevious(result: EvalCommandReturn): EvalCommandReturn {
    const { pipe } = this.parameters;

    if (!pipe) {
      return result;
    }

    const mergedResults = _([pipe, result])
      .flatMap((current) => _.values(current))
      .reduce<EvalCommandReturn>((merged, current) => {
        const { key } = current.context;
        const mergedResult = merged[key];
        const shouldOverrideMerged = this.shouldOverrideOrigin(current.result.origin, mergedResult?.result.origin);
        if (shouldOverrideMerged) {
          return { ...merged, [key]: current };
        }
        return merged;
      }, {});

    return mergedResults;
  }

  private evalTemplates(result: EvalCommandReturn): EvalCommandReturn {
    const templateKeys = _(result)
      .pickBy((current) => current.result.origin === EvaluatedConfigOrigin.SchemaTemplate)
      .keys()
      .value();
    const resultWithTemplates = { ...result };

    let shouldRerenderTemplates = true;
    while (!_.isEmpty(templateKeys) && shouldRerenderTemplates) {
      let hasRenderedAtLeastOnce = false;

      templateKeys.forEach((key) => {
        const { context } = resultWithTemplates[key] as EvalCommandReturn['string'];
        const template = context.cfgu.template as string;

        const expressions = TMPL.parse(template);
        if (expressions.some((exp) => templateKeys.includes(exp.key))) {
          return;
        }

        const contextConfigSet = new ConfigSet(context.set);
        const renderContext = {
          ..._.mapValues(resultWithTemplates, (current) => current.result.value),
          CONFIGU_STORE: {
            type: context.store,
          },
          CONFIGU_SET: {
            path: contextConfigSet.path,
            hierarchy: contextConfigSet.hierarchy,
            first: _.first(contextConfigSet.hierarchy), // always the root set which is ''
            last: _.last(contextConfigSet.hierarchy),
            ...contextConfigSet.hierarchy.reduce((o, c, i) => ({ ...o, [i]: c }), {}),
          },
          CONFIGU_SCHEMA: {
            path: context.schema,
          },
        };

        (resultWithTemplates[key] as EvalCommandReturn['string']).result.value = TMPL.render(template, renderContext);
        _.pull(templateKeys, key);
        hasRenderedAtLeastOnce = true;
      });

      shouldRerenderTemplates = hasRenderedAtLeastOnce;
    }

    // if (!_.isEmpty(templateKeys)) {
    //   warn.push(`failed to render template of keys "${templateKeys.join(', ')}", check for reference loop`);
    // }

    return resultWithTemplates;
  }

  private validateResult(result: EvalCommandReturn): void {
    const { validate = true } = this.parameters;

    if (!validate) {
      return;
    }

    const evaluatedConfigsDict = _.mapValues(result, (current) => current.result.value);
    // * validate the eval result against the provided schema
    _(result)
      .values()
      .forEach((current) => {
        const { store, set, schema, key, cfgu } = current.context;
        const evaluatedValue = current.result.value;

        const errorScope: [string, string][] = [
          ['EvalCommand', `store:${store};set:${set};schema:${schema};key:${key}`],
        ];

        if (evaluatedValue) {
          try {
            ConfigSchema.CFGU.VALIDATORS.valueOptions(cfgu, evaluatedValue);
            ConfigSchema.CFGU.VALIDATORS.valueType(cfgu, evaluatedValue);
          } catch (error) {
            throw error?.appendScope?.(errorScope) ?? error;
          }

          if (cfgu.depends && cfgu.depends.some((depend) => !evaluatedConfigsDict[depend])) {
            throw new ConfigError(
              'invalid config value',
              `one or more depends of key "${key}" is missing a value`,
              errorScope,
            );
          }
        } else if (cfgu.required) {
          throw new ConfigError('invalid config value', `required key "${key}" is missing a value`, errorScope);
        }
      });
  }

  async run() {
    const { store, set, schema } = this.parameters;

    await store.init();

    let result = _.mapValues<typeof schema.contents, EvalCommandReturn['string']>(schema.contents, (cfgu, key) => {
      return {
        context: {
          store: store.type,
          set: set.path,
          schema: schema.name,
          key,
          cfgu,
        },
        result: {
          origin: EvaluatedConfigOrigin.EmptyValue,
          source: '',
          value: '',
        },
      };
    });
    result = { ...result, ...this.evalFromConfigsOverride(result) };
    result = {
      ...result,
      ...(await this.evalFromStoreSet(
        _.pickBy(
          result,
          (current) => current.result.origin === EvaluatedConfigOrigin.EmptyValue && !current.context.cfgu.template,
        ),
      )),
    };
    result = {
      ...result,
      ...this.evalFromSchema(_.pickBy(result, (current) => current.result.origin === EvaluatedConfigOrigin.EmptyValue)),
    };
    result = {
      ...result,
      ...this.evalPrevious(result),
    };
    result = {
      ...result,
      ...this.evalTemplates(result),
    };

    this.validateResult(result);

    return result;
  }
}
