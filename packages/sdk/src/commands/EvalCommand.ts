import _ from 'lodash';
import { Jsonify } from 'type-fest';
import { ConfigCommand } from './ConfigCommand';
import { Cfgu, CfguValidator } from '../core/Cfgu';
import { ConfigStore, ConfigQuery } from '../core/ConfigStore';
import { ConfigSet } from '../core/ConfigSet';
import { ConfigSchema, ConfigSchemaContents } from '../core/ConfigSchema';
import { Template } from '../utils/Template';

export enum EvaluatedConfigOrigin {
  Override = 'override',
  Store = 'store',
  Schema = 'schema',
  Empty = 'empty',
}

export type EvaluatedConfig = {
  context: {
    store: Jsonify<ConfigStore>;
    set: Jsonify<ConfigSet>;
    schema: Jsonify<ConfigSchema>;
    key: string;
    cfgu: Cfgu;
  };
  value: string;
  origin: EvaluatedConfigOrigin;
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

export class EvalCommand extends ConfigCommand<EvalCommandInput, EvalCommandOutput> {
  async execute() {
    const { store } = this.input;

    await store.init();

    let result: EvalCommandOutput = { ...this.evalEmpty() };
    result = { ...result, ...this.evalOverride(result) };
    result = { ...result, ...(await this.evalStore(result)) };
    result = { ...result, ...this.evalSchema(result) };
    result = { ...result, ...this.evalPipe(result) };
    result = { ...result, ...this.renderTemplates(result) };

    this.validateResult(result);

    return result;
  }

  private evalEmpty(): EvalCommandOutput {
    const { store, set, schema } = this.input;

    return _.mapValues<ConfigSchemaContents, EvaluatedConfig>(schema.contents, (cfgu, key) => {
      return {
        context: {
          store: { ...store },
          set: { ...set },
          schema: { ...schema },
          key,
          cfgu,
        },
        value: '',
        origin: !cfgu.template ? EvaluatedConfigOrigin.Empty : EvaluatedConfigOrigin.Schema,
      };
    });
  }

  private evalOverride(result: EvalCommandOutput): EvalCommandOutput {
    const { configs = {} } = this.input;

    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) {
        return current;
      }

      const isOverridden = Object.prototype.hasOwnProperty.call(configs, current.context.key);
      const isLazy = Boolean(current.context.cfgu.lazy);

      if (!isOverridden && !isLazy) {
        return current;
      }

      const overrideValue = configs?.[current.context.key] ?? '';
      return {
        ...current,
        value: overrideValue,
        origin: EvaluatedConfigOrigin.Override,
      };
    });
  }

  private async evalStore(result: EvalCommandOutput): Promise<EvalCommandOutput> {
    const { store, set } = this.input;

    const storeQueries = _(result)
      .values()
      .filter((current) => current.origin === EvaluatedConfigOrigin.Empty)
      .flatMap((current) => set.hierarchy.map((node) => ({ set: node, key: current.context.key })))
      .value() satisfies ConfigQuery[];
    const storeConfigsArray = await store.get(storeQueries);
    const storeConfigsDict = _(storeConfigsArray)
      .orderBy([(config) => set.hierarchy.indexOf(config.set)], ['asc']) // "asc" because _.keyBy will keep the last element for each key
      // .uniqBy((config) => config.key)
      .keyBy((config) => config.key) // https://lodash.com/docs#keyBy
      .value();

    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) {
        return current;
      }

      const storeConfig = storeConfigsDict?.[current.context.key];

      if (!storeConfig) {
        return current;
      }

      return _.merge(current, {
        context: { set: { ...new ConfigSet(storeConfig.set) } },
        value: storeConfig.value,
        origin: EvaluatedConfigOrigin.Store,
      });
    });
  }

  private evalSchema(result: EvalCommandOutput): EvalCommandOutput {
    return _.mapValues(result, (current) => {
      if (current.origin !== EvaluatedConfigOrigin.Empty) {
        return current;
      }

      if (current.context.cfgu.default) {
        return {
          ...current,
          value: current.context.cfgu.default,
          origin: EvaluatedConfigOrigin.Schema,
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

      const isCurrentDefault =
        current.origin === EvaluatedConfigOrigin.Schema && current.value === current.context.cfgu.default;
      const isPipedDefault =
        piped.origin === EvaluatedConfigOrigin.Schema && piped.value === piped.context.cfgu.default;
      if (isCurrentDefault && !isPipedDefault) {
        return piped;
      }

      return current;
    });

    return mergedResults;
  }

  private sortTemplates(templatesDict: Record<string, string>): string[] {
    // Initialize templates to references graph
    const graph: Record<string, string[]> = _(templatesDict)
      .mapValues((template) => Template.parse(template).references)
      .value();

    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    // Helper function for DFS
    const visit = (node: string, ancestors: string[] = []) => {
      if (visiting.has(node)) {
        throw new Error(`Cyclic dependency detected: ${ancestors.join(' -> ')} -> ${node}`);
      }

      if (!visited.has(node)) {
        visiting.add(node);

        (graph[node] || []).forEach((neighbor) => {
          visit(neighbor, [...ancestors, node]);
        });

        visiting.delete(node);
        visited.add(node);
        sorted.push(node);
      }
    };

    // Perform DFS for each node
    _.forEach(graph, (referances, key) => {
      if (!visited.has(key)) {
        visit(key);
      }
    });

    // Filter sorted to include only the initial template keys
    return sorted.filter((key) => Object.prototype.hasOwnProperty.call(templatesDict, key));
  }

  private getTemplateContext(key: string, result: EvalCommandOutput): Record<string, unknown> {
    const { context } = result[key] as EvaluatedConfig;
    const renderContext = {
      ..._.mapValues(result, (current) => current.value),
      _: context,
      this: context,
    };
    return renderContext;
  }

  private renderTemplates(result: EvalCommandOutput): EvalCommandOutput {
    const resultWithTemplates = { ...result };

    const templatesRefDict = _(result)
      .pickBy((current) => current.context.cfgu.template)
      .mapValues((current) => current.context.cfgu.template as string)
      .value();

    const templatesSortedByDependency = this.sortTemplates(templatesRefDict);
    templatesSortedByDependency.forEach((key) => {
      const template = templatesRefDict[key] as string;
      const context = this.getTemplateContext(key, resultWithTemplates);

      (resultWithTemplates[key] as EvaluatedConfig).value = Template.render({ template, context });
    });
    return resultWithTemplates;
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
      .forEach((current) => {
        const { key, cfgu } = current.context;
        const evaluatedValue = current.value;

        try {
          if (current.origin !== EvaluatedConfigOrigin.Empty) {
            CfguValidator.validateOptions({ ...cfgu, value: evaluatedValue });
            CfguValidator.validateType({ ...cfgu, value: evaluatedValue });

            if (cfgu.depends && cfgu.depends.some((depend) => !evaluatedConfigsDict[depend])) {
              throw new Error(`ConfigValue is missing for depends`);
            }
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
