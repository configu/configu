import _ from 'lodash';
import { Jsonify } from 'type-fest';
import { ConfigCommand } from './ConfigCommand';
import { Config } from '../core/Config';
import { ConfigStore, ConfigQuery } from '../core/ConfigStore';
import { ConfigSet } from '../core/ConfigSet';
import { ConfigSchema } from '../core/ConfigSchema';
import { EvalCommandOutput, EvaluatedConfigOrigin } from './EvalCommand';

export enum ConfigDiffAction {
  Add = 'add',
  Update = 'update',
  Delete = 'delete',
}

export type ConfigDiff = {
  prev: string;
  next: string;
  action: ConfigDiffAction;
};

export type UpsertCommandOutput = {
  [key: string]: ConfigDiff;
};

export type UpsertCommandInput = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs?: { [key: string]: string };
  pipe?: EvalCommandOutput;
  dry?: boolean;
};

export class UpsertCommand extends ConfigCommand<UpsertCommandInput, UpsertCommandOutput> {
  async execute() {
    const { store, set, schema, configs = {}, pipe = {} } = this.input;

    await store.init();

    let result: UpsertCommandOutput = {};

    // delete all configs if input is empty
    if (_.isEmpty(configs) && _.isEmpty(pipe)) {
      const currentConfigs = await this.getCurrentConfigs(Object.keys(schema.keys));
      result = _(schema.keys)
        .mapValues<ConfigDiff>((cfgu, key) => ({
          prev: currentConfigs[key] ?? '',
          next: '',
          action: ConfigDiffAction.Delete,
        }))
        .pickBy((diff) => diff.prev !== diff.next)
        .value();
    } else {
      // prepare pipe configs
      const pipeConfigs = _(pipe)
        .pickBy((value, key) => {
          const cfgu = schema.keys[key];
          return (
            cfgu && // key exists in current schema
            !cfgu.const && // key is not a const in current schema
            !cfgu.lazy && // key is not lazy in current schema
            value.origin === EvaluatedConfigOrigin.Store // key is not empty and comes from store
          );
        })
        .mapValues((value) => value.value)
        .value();

      // validate configs input
      _(configs)
        .entries()
        .forEach(([key, value]) => {
          const cfgu = schema.keys[key];

          try {
            if (!cfgu) {
              throw new Error(`Key is not declared on schema`);
            }
            if (value) {
              if (cfgu.lazy) {
                throw new Error(`Key declared as "lazy" cannot be assigned a value`);
              }
              if (cfgu.const) {
                throw new Error(`Key declared as "const" cannot be assigned a value`);
              }

              // todo: validate type, enum, pattern, schema, test
              // CfguValidator.validateOptions({ ...cfgu, value });
              // CfguValidator.validateType({ ...cfgu, value });
            }
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`Validation failed for config: "${key}"\n${error.message}`);
            }
            throw new Error(`Validation failed for config "${key}"`); // code flow should never reach here
          }
        });

      // merge pipe and configs, configs will override pipe
      const upsertConfigsDict = { ...pipeConfigs, ...configs };
      const currentConfigs = await this.getCurrentConfigs(Object.keys(upsertConfigsDict));
      result = _(upsertConfigsDict)
        .mapValues((value, key) => {
          const prev = currentConfigs[key] ?? '';
          const next = value;
          if (prev === next) {
            // no change will be omitted by the pickBy
            return { prev, next, action: ConfigDiffAction.Add };
          }
          if (next === '') {
            return { prev, next, action: ConfigDiffAction.Delete };
          }
          if (prev) {
            return { prev, next, action: ConfigDiffAction.Update };
          }
          return { prev, next, action: ConfigDiffAction.Add };
        })
        .pickBy((diff) => diff.prev !== diff.next)
        .value();
    }

    if (!this.input.dry) {
      const upsertConfigsArray = _(result)
        .entries()
        .map<Config>(([key, diff]) => ({ set: set.path, key, value: diff.next }))
        .value();
      await store.set(upsertConfigsArray);
    }

    return result;
  }

  private async getCurrentConfigs(keys: string[]) {
    const { store, set } = this.input;

    const storeQueries = _(keys)
      .map((key) => ({ set: set.path, key }))
      .value() satisfies ConfigQuery[];
    const storeConfigsArray = await store.get(storeQueries);
    const storeConfigsDict = _(storeConfigsArray)
      .keyBy((config) => config.key)
      .mapValues((config) => config.value)
      .value();

    return storeConfigsDict;
  }
}
