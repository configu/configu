import _ from 'lodash';
import { ConfigCommand } from '../ConfigCommand';
import { Config } from '../Config';
import { ConfigValue, ConfigValueAny } from '../ConfigValue';
import { ConfigStore, ConfigQuery } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';
import { EvalCommandOutput, EvaluatedConfigOrigin } from './EvalCommand';
import { Cfgu } from '../Cfgu';

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
  configs?: { [key: string]: ConfigValueAny };
  pipe?: EvalCommandOutput;
  dry?: boolean;
};

export class UpsertCommand extends ConfigCommand<UpsertCommandInput, UpsertCommandOutput> {
  async execute() {
    const { store, set, schema, configs = {}, pipe = {} } = this.input;

    await store.init();

    const currentConfigs = await this.getCurrentConfigs(Object.keys(schema.keys));

    let result: UpsertCommandOutput = {};

    // delete all configs if input is empty
    if (_.isEmpty(configs) && _.isEmpty(pipe)) {
      result = _.chain(schema.keys)
        .mapValues<ConfigDiff>((cfgu, key) => ({
          prev: currentConfigs[key]?.value ?? '',
          next: '',
          action: ConfigDiffAction.Delete,
        }))
        .pickBy((diff) => diff.prev !== diff.next)
        .value();
    } else {
      // prepare pipe configs
      const pipeConfigs = _.chain(pipe)
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

      const kvConfigs = _.mapValues(configs, (value) => ConfigValue.stringify(value));
      // validate configs input
      _.chain(kvConfigs)
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

              ConfigValue.validate({
                store,
                set,
                schema,
                key,
                label: Array.isArray(cfgu.label) ? cfgu.label : _.compact([cfgu.label]),
                configs: _.mapValues(currentConfigs, (current) => ({
                  ...current,
                  cfgu: schema.keys[current.key] as Cfgu,
                })),
              });
            }
          } catch (error) {
            throw new Error(`Validation failed for Config: "${key}"\n${error.message}`);
          }
        })
        .value();

      // merge pipe and configs, configs will override pipe
      const upsertConfigsDict = { ...pipeConfigs, ...kvConfigs };
      result = _.chain(upsertConfigsDict)
        .mapValues((value, key) => {
          const prev = currentConfigs[key]?.value ?? '';
          const next = value;
          if (prev === next) {
            // no change will be omitted by the pickBy
            return { prev, next, action: ConfigDiffAction.Update };
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
      const upsertConfigsArray = _.chain(result)
        .entries()
        .map<Config>(([key, diff]) => ({ set: set.path, key, value: diff.next }))
        .value();
      await store.set(upsertConfigsArray);
    }

    return result;
  }

  private async getCurrentConfigs(keys: string[]) {
    const { store, set } = this.input;

    const storeQueries = _.chain(keys)
      .map((key) => ({ set: set.path, key }))
      .value() satisfies ConfigQuery[];
    const storeConfigsArray = await store.get(storeQueries);
    const storeConfigsDict = _.chain(storeConfigsArray)
      .keyBy((config) => config.key)
      .mapValues((config) => config.value)
      .value();

    return _.chain(keys)
      .keyBy()
      .mapValues((key) => ({ set: set.path, key, value: storeConfigsDict[key] ?? '' }))
      .value() satisfies { [key: string]: Config };
  }
}
