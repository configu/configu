import _ from 'lodash';
import { Command } from '../Command';
import { Cfgu } from '../types';
import { ERR, TMPL } from '../utils';
import { ConfigStore } from '../ConfigStore';
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
  validate?: boolean;
  previous?: EvalCommandReturn;
};

export class EvalCommand extends Command<EvalCommandReturn> {
  constructor(public parameters: EvalCommandParameters) {
    super(parameters);
  }

  private evalFromConfigsOverride(result: EvalCommandReturn): EvalCommandReturn {
    return _.mapValues(result, (current) => {
      const { context } = current;
      const configOverrideValue = this.parameters.configs?.[context.key];

      if (!configOverrideValue) {
        return current;
      }

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

  private evalPrevious(result: EvalCommandReturn): EvalCommandReturn {
    const { previous } = this.parameters;

    if (!previous) {
      return result;
    }

    const mergedResults = _([previous, result])
      .flatMap((current) => _.values(current))
      .reduceRight<EvalCommandReturn>((merged, current) => {
        const { key } = current.context;
        const mergedResult = merged[key];
        if (
          !mergedResult ||
          (mergedResult.result.origin === EvaluatedConfigOrigin.EmptyValue &&
            current.result.origin !== EvaluatedConfigOrigin.EmptyValue)
        ) {
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
        const { key, cfgu } = current.context;
        const evaluatedValue = current.result.value;

        if (!ConfigSchema.CFGU.TESTS.VAL_TYPE[cfgu.type]({ ...cfgu, value: evaluatedValue })) {
          throw new Error(
            ERR(`invalid value type for key "${key}"`, {
              location: [`EvalCommand`, 'run'],
              suggestion: `value "${evaluatedValue}" must be a "${cfgu.type}"`,
            }),
          );
        }

        if (cfgu.required && !evaluatedValue) {
          throw new Error(ERR(`required key "${key}" is missing a value`, { location: [`EvalCommand`, 'run'] }));
        }

        if (evaluatedValue && cfgu.depends && cfgu.depends.some((depend) => !evaluatedConfigsDict[depend])) {
          throw new Error(
            ERR(`one or more depends of key "${key}" is missing a value`, { location: [`EvalCommand`, 'run'] }),
          );
        }
      });
  }

  async run() {
    const { store, set, schema } = this.parameters;

    await store.init();
    const schemaContents = await ConfigSchema.parse(schema);

    let result = _.mapValues<typeof schemaContents, EvalCommandReturn['string']>(schemaContents, (cfgu, key) => {
      return {
        context: {
          store: store.type,
          set: set.path,
          schema: schema.path,
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
