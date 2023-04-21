import _ from 'lodash';
import { Command } from '../Command';
import { Config, Cfgu } from '../types';
import { ERR, TMPL } from '../utils';
import { ConfigStore } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';

export type EvalCommandFromParameter = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
};
export type EvalCommandConfigsParameter = { [key: string]: string }; // override feature
export type EvalCommandParameters = {
  from: Array<
    EvalCommandFromParameter & {
      configs?: EvalCommandConfigsParameter;
    }
  >;
  configs?: EvalCommandConfigsParameter;
};

export type EvaluatedConfigSource =
  | 'global-override'
  | 'local-override'
  | 'store-set'
  | 'schema-template'
  | 'schema-default'
  | 'empty';

type ConfigEvalScope = {
  context: EvalCommandFromParameter & { key: string; from: number };
  cfgu: Cfgu;
  result: { value: string; from: { source: EvaluatedConfigSource; which: string } };
};

type EvalScope = {
  [key: string]: ConfigEvalScope;
};

export type EvalCommandReturn = {
  result: { [key: string]: string };
  metadata: { [key: string]: Pick<Config, 'key' | 'value'> & ConfigEvalScope };
};

export type EvaluatedConfigs = EvalCommandReturn['result'];

export class EvalCommand extends Command<EvalCommandReturn> {
  constructor(public parameters: EvalCommandParameters) {
    super(parameters);
  }

  private evalFromOverride(scope: EvalScope): EvalScope {
    return _.mapValues(scope, (current) => {
      const { context } = current;

      const globalOverride = this.parameters.configs?.[context.key];
      if (globalOverride) {
        return <ConfigEvalScope>{
          ...current,
          result: {
            value: globalOverride,
            from: {
              source: 'global-override',
              which: `parameters.configs.${context.key}=${globalOverride}`,
            },
          },
        };
      }

      const localOverride = this.parameters.from[context.from]?.configs?.[context.key];
      if (localOverride) {
        return <ConfigEvalScope>{
          ...current,
          result: {
            value: localOverride,
            from: {
              source: 'local-override',
              which: `parameters.from[${context.from}].configs.${context.key}=${localOverride}`,
            },
          },
        };
      }

      return current;
    });
  }

  private async evalFromStore(scope: EvalScope): Promise<EvalScope> {
    const scopeSample = _.sample(scope);
    if (!scopeSample) {
      return scope;
    }
    const { store, set } = scopeSample.context;

    const storeQueries = _(scope)
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

    return _.mapValues(scope, (current) => {
      const { context } = current;

      const storeConfig = storeConfigsDict[context.key];
      if (storeConfig) {
        return <ConfigEvalScope>{
          ...current,
          result: {
            value: storeConfig.value,
            from: {
              source: 'store-set',
              which: `parameters.from[${context.from}]:store=${context.store.type}:set=${context.set.path}`,
            },
          },
        };
      }

      return current;
    });
  }

  private evalFromSchema(scope: EvalScope): EvalScope {
    return _.mapValues(scope, (current) => {
      const { cfgu, context } = current;

      if (cfgu.template) {
        return <ConfigEvalScope>{
          ...current,
          result: {
            value: '',
            from: {
              source: 'schema-template',
              which: `parameters.from[${context.from}]:schema.template=${cfgu.template}`,
            },
          },
        };
      }

      if (cfgu.default) {
        return <ConfigEvalScope>{
          ...current,
          result: {
            value: cfgu.default,
            from: {
              source: 'schema-default',
              which: `parameters.from[${context.from}]:schema.default=${cfgu.default}`,
            },
          },
        };
      }

      return current;
    });
  }

  private evalScope(scopeArray: EvalScope[]): EvalScope {
    // calculate final scope keys according to "from parameter" ordered right to left
    const evalScope = _(scopeArray)
      .flatMap((scope) => _.values(scope))
      .reduceRight<EvalScope>((scope, current) => {
        const { key } = current.context;
        const configScope = scope[key];
        if (!configScope || (configScope.result.from.source === 'empty' && current.result.from.source !== 'empty')) {
          return { ...scope, [key]: current };
        }
        return scope;
      }, {});

    // evaluate templates until done with all of them or can't render (e.g. because of reference loop etc..)
    const templateKeys = _(evalScope)
      .pickBy((current) => current.result.from.source === 'schema-template')
      .keys()
      .value();
    let runAgain = true;
    while (!_.isEmpty(templateKeys) && runAgain) {
      let hasRendered = false;
      const renderContext = _.mapValues(evalScope, (current) => current.result.value);
      _(templateKeys)
        .cloneDeep()
        .forEach((key) => {
          const current = evalScope[key] as ConfigEvalScope;
          const template = current.cfgu.template as string;

          const expressions = TMPL.parse(template);
          if (expressions.some((exp) => templateKeys.includes(exp.key))) {
            return;
          }

          (evalScope[key] as ConfigEvalScope).result.value = TMPL.render(template, {
            ...renderContext,
            CONFIGU_SET: {
              path: current.context.set.path,
              hierarchy: current.context.set.hierarchy,
              first: _.first(current.context.set.hierarchy), // always the root set which is ''
              last: _.last(current.context.set.hierarchy),
              ...current.context.set.hierarchy.reduce((o, c, i) => ({ ...o, [i]: c }), {}),
            },
          });
          _.pull(templateKeys, key);
          hasRendered = true;
        });
      runAgain = hasRendered;
    }
    // if (!_.isEmpty(templateKeys)) {
    //   warn.push(`failed to render template of keys "${templateKeys.join(', ')}", check for reference loop`);
    // }

    return evalScope;
  }

  private validateScope(scope: EvalScope): void {
    const evaluatedConfigsDict = _.mapValues(scope, (current) => current.result.value);
    // * validate the eval result against the provided schema
    _(scope)
      .values()
      .forEach((current) => {
        const { key } = current.context;
        const { cfgu } = current;
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
    const evalScopePromises = this.parameters.from.map(async ({ store, set, schema }, index) => {
      await store.init();
      const schemaContents = await ConfigSchema.parse(schema);

      let evalScope: EvalScope = _.mapValues<typeof schemaContents, ConfigEvalScope>(schemaContents, (cfgu, key) => ({
        context: {
          store,
          set,
          schema,
          key,
          from: index,
        },
        cfgu,
        result: { value: '', from: { source: 'empty', which: `` } },
      }));

      evalScope = { ...evalScope, ...this.evalFromOverride(evalScope) };
      const evaluatedStoreConfigs = await this.evalFromStore(
        _.pickBy(evalScope, (current) => current.result.from.source === 'empty' && !current.cfgu.template),
      );
      evalScope = { ...evalScope, ...evaluatedStoreConfigs };
      evalScope = {
        ...evalScope,
        ...this.evalFromSchema(_.pickBy(evalScope, (current) => current.result.from.source === 'empty')),
      };

      return evalScope;
    });
    const evalScopeArray = await Promise.all(evalScopePromises);
    const evalScope = this.evalScope(evalScopeArray);
    this.validateScope(evalScope);

    return {
      result: _.mapValues(evalScope, (current) => current.result.value),
      metadata: _.mapValues(evalScope, (current) => ({
        key: current.context.key,
        value: current.result.value,
        ...current,
      })),
    };
  }
}
