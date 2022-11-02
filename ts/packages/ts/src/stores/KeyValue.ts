import _ from 'lodash';
import { Store } from '../Store';
import { StoreQuery, StoreContents, StoreConfiguration } from '../types';

export type Value = Record<string, string>;

export abstract class KeyValueStore extends Store {
  constructor(protocol: string, configuration: Omit<StoreConfiguration, 'supportsGlobQuery'>) {
    super(protocol, { ...configuration, supportsGlobQuery: false });
    this.calcKey = this.calcKey.bind(this); // TODO: review with Ran
  }

  abstract getByKey(key: string): Promise<Value>;

  abstract upsert(key: string, value: Value): Promise<void>;

  abstract delete(key: string): Promise<void>;

  calcKey({ set, schema }: StoreQuery[number]): string {
    const { slashDisallowedOnKey } = this.configuration;

    // TODO: review with Ran
    if (slashDisallowedOnKey) {
      const adjustedSet = set.split('/').join('-');
      let key = `${adjustedSet}-${schema}`;
      if (!set && schema) {
        key = schema;
      }
      return key;
    }

    let key = `${set}/${schema}`;
    if (!set && schema) {
      key = schema;
    }
    return key;
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    const { enforceRootSet } = this.configuration;
    let keys: string[];
    let adjustedQuery = query;

    // TODO: review with Ran - maybe 'disregardRootSet'
    if (enforceRootSet) {
      adjustedQuery = _.filter(query, 'set');

      if (adjustedQuery.length === 0) {
        throw new Error(`root set missing at ${this.constructor.name}`);
      }

      keys = _(adjustedQuery).map(this.calcKey).uniq().value();
    } else {
      keys = _(query).map(this.calcKey).uniq().value();
    }

    const kvPromises = keys.map(async (key) => {
      try {
        const value = await this.getByKey(key);
        if (!value) {
          throw new Error(`key ${key} has no value at ${this.constructor.name}`);
        }
        return {
          key,
          value,
        };
      } catch (error) {
        return { key, value: {} };
      }
    });
    const kvArray = await Promise.all(kvPromises);
    const kvDict = _(kvArray).keyBy('key').mapValues('value').value();

    const storedConfigs = _(adjustedQuery)
      .map((q) => {
        const { set, schema, key } = q;
        const value = kvDict[this.calcKey(q)];

        if (key === '*') {
          return Object.entries(value).map(([k, v]) => {
            return {
              set,
              schema,
              key: k,
              value: v,
            };
          });
        }

        return {
          set,
          schema,
          key,
          value: value[key],
        };
      })
      .flatten()
      .filter('value')
      .value();

    return storedConfigs;
  }

  async set(configs: StoreContents): Promise<void> {
    const kvDict: Record<string, Value> = {};
    configs.forEach((config) => {
      const key = this.calcKey(config);
      if (!kvDict[key]) {
        kvDict[key] = {};
      }
      if (!config.value) {
        return;
      }
      kvDict[key] = { ...kvDict[key], [config.key]: config.value };
    });

    const setConfigsPromises = Object.entries(kvDict).map(async ([key, value]) => {
      if (_.isEmpty(value)) {
        await this.delete(key);
        return;
      }

      await this.upsert(key, value);
    });

    await Promise.all(setConfigsPromises);
  }
}
