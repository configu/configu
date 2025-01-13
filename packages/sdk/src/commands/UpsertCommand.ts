import _ from 'lodash';
import { ConfigCommand } from '../ConfigCommand';
import { Config } from '../Config';
import { ConfigValue, ConfigValueAny, ConfigWithCfgu } from '../ConfigValue';
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

export type UpsertedConfig = ConfigWithCfgu & ConfigDiff;

export type UpsertCommandOutput = {
  [key: string]: UpsertedConfig;
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

    const keys = Object.keys(schema.keys);

    const storeQueries = _.chain(keys)
      .map((key) => ({ set: set.path, key }))
      .value() satisfies ConfigQuery[];
    const storeConfigsArray = await store.get(storeQueries);
    const storeConfigsDict = _.chain(storeConfigsArray)
      .keyBy((config) => config.key)
      .mapValues((config) => config.value)
      .value();

    const currentConfigs = _.chain(keys)
      .keyBy()
      .mapValues((key) => ({ set: set.path, key, value: storeConfigsDict[key] ?? '', cfgu: schema.keys[key] as Cfgu }))
      .value() satisfies { [key: string]: ConfigWithCfgu };

    let result: UpsertCommandOutput = {};

    // delete all configs if input is empty
    if (_.isEmpty(configs) && _.isEmpty(pipe)) {
      result = _.chain(schema.keys)
        .mapValues<UpsertedConfig>((cfgu, key) => ({
          set: set.path,
          key,
          value: '',
          cfgu,
          prev: currentConfigs[key]?.value ?? '',
          next: '',
          action: ConfigDiffAction.Delete,
        }))
        .pickBy((diff) => diff.prev !== diff.next)
        .value();
    } else {
      // prepare input configs
      const kvConfigs = _.mapValues(configs, (value) => ConfigValue.stringify(value));

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

      // merge pipe and configs, configs will override pipe
      const upsertConfigsDict = { ...pipeConfigs, ...kvConfigs };
      result = _.chain(upsertConfigsDict)
        .mapValues<UpsertedConfig>((value, key) => {
          try {
            const cfgu = schema.keys[key];

            if (!cfgu) {
              throw new Error(`Key is not declared on schema`);
            }

            const prev = currentConfigs[key]?.value ?? '';
            const next = value;

            const context = {
              set: set.path,
              key,
              value,
              cfgu,
              prev,
              next,
              action: ConfigDiffAction.Update,
            };

            if (prev === next) {
              // no change will be omitted by the pickBy
              return context;
            }
            if (next === '') {
              return { ...context, action: ConfigDiffAction.Delete };
            }
            if (prev) {
              return { ...context, action: ConfigDiffAction.Update };
            }
            return { ...context, action: ConfigDiffAction.Add };
          } catch (error) {
            throw new Error(`Validation failed for Config: "${key}"\n${error.message}`);
          }
        })
        .pickBy((diff) => diff.prev !== diff.next)
        .value();
    }

    // validate result
    _.chain(result)
      .entries()
      .forEach(([key, current]) => {
        try {
          if (current.value) {
            if (current.cfgu?.lazy) {
              throw new Error(`Key declared as "lazy" cannot be assigned a value`);
            }
            if (current.cfgu?.const) {
              throw new Error(`Key declared as "const" cannot be assigned a value`);
            }

            ConfigValue.validate({
              store,
              set,
              schema,
              current: key,
              configs: result,
            });
          }
        } catch (error) {
          throw new Error(`Validation failed for Config: "${key}"\n${error.message}`);
        }
      })
      .value();

    if (!this.input.dry) {
      const upsertConfigsArray = _.chain(result)
        .entries()
        .map<Config>(([key, diff]) => ({ set: set.path, key, value: diff.next }))
        .value();
      await store.set(upsertConfigsArray);
    }

    return result;
  }
}
