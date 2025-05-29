import { ConfigCommand } from '../ConfigCommand';
import { ConfigValue, ConfigValueAny, ConfigWithCfgu } from '../ConfigValue';
import { ConfigQuery, ConfigStore } from '../ConfigStore';
import { ConfigSet } from '../ConfigSet';
import { ConfigSchema } from '../ConfigSchema';
import { EvalCommandOutput, EvaluatedConfigOrigin } from './EvalCommand';
import { _ } from '../expressions';

export type UpsertedConfig = ConfigWithCfgu & {
  prev: string;
  next: string;
};

export type UpsertCommandOutput = {
  [key: string]: UpsertedConfig;
};

export type UpsertCommandInput = {
  store: ConfigStore;
  set: ConfigSet;
  schema: ConfigSchema;
  configs?: { [key: string]: ConfigValueAny };
  pipe?: EvalCommandOutput;
  delete?: boolean;
  dry?: boolean;
  validate?: boolean;
};

export class UpsertCommand extends ConfigCommand<UpsertCommandInput, UpsertCommandOutput> {
  private validateNextConfigs(configs: { [key: string]: string }) {
    const { store, set, schema, validate = true } = this.input;

    if (!validate) {
      return;
    }

    const differentKeys = _.difference(_.keys(configs), _.keys(schema.keys));
    if (!_.isEmpty(differentKeys)) {
      throw new Error(`Keys ${differentKeys.map((key) => `"${key}"`).join(', ')} are not declared on schema`);
    }

    // validate assigned configs
    _.forEach(configs, (value, key) => {
      try {
        if (value) {
          const cfgu = schema.keys[key];
          if (!cfgu) {
            throw new Error(`Key is not declared on schema`);
          }
          if (cfgu?.lazy) {
            throw new Error(`Key declared as "lazy" cannot be assigned a value`);
          }
          if (cfgu?.const) {
            throw new Error(`Key declared as "const" cannot be assigned a value`);
          }

          ConfigValue.validate({
            store,
            set,
            schema,
            current: key,
            configs: { [key]: { set: set.path, key, value, cfgu } },
          });
        }
      } catch (error) {
        throw new Error(`Validation failed for Config: "${key}"\n${error.message}`);
      }
    });
  }

  private async getPrevConfigs() {
    const { store, set, schema } = this.input;

    const storeQueries = _.chain(schema.keys)
      .keys()
      .map((key) => ({ set: set.path, key }))
      .value() satisfies ConfigQuery[];
    const storeConfigsArray = await store.get(storeQueries);
    const storeConfigsDict = _.chain(storeConfigsArray)
      .keyBy((config) => config.key)
      .mapValues((config) => config.value)
      .value();

    const currentConfigs = _.chain(schema.keys)
      .mapValues((cfgu, key) => ({
        set: set.path,
        key,
        value: storeConfigsDict[key] ?? '',
        cfgu,
        origin: EvaluatedConfigOrigin.Store,
      }))
      .value() satisfies EvalCommandOutput;

    return currentConfigs;
  }

  async execute() {
    const { store, set, schema, configs = {}, pipe = {} } = this.input;

    await store.init();

    // prepare input configs
    const inputConfigs = _.mapValues(configs, (value) => ConfigValue.stringify(value));
    // prepare pipe configs, contains irrelevant keys
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
    // shallow merge pipe and configs, configs will override pipe if key exists in both
    const nextConfigs = { ...pipeConfigs, ...inputConfigs };
    this.validateNextConfigs(nextConfigs);

    const prevConfigs = await this.getPrevConfigs();

    const result = _.chain(schema.keys)
      .mapValues<UpsertedConfig>((cfgu, key) => {
        const prev = prevConfigs[key]?.value ?? '';
        let next = nextConfigs[key];
        if (!next) {
          next = !this.input.delete ? prev : '';
        }

        return {
          set: set.path,
          key,
          value: next,
          cfgu,
          prev,
          next,
        };
      })
      .value();

    if (!this.input.dry) {
      const upsertConfigsArray = _.chain(result)
        .pickBy((diff) => diff.prev !== diff.next)
        .entries()
        .map(([key, diff]) => {
          const config = { set: set.path, key, value: diff.next };
          if (store.configuration.cfgu) {
            return { ...config, cfgu: diff.cfgu };
          }
          return config;
        })
        .value();

      await store.set(upsertConfigsArray);
    }

    return result;
  }
}
