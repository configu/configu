import _ from 'lodash';
import { Store } from '../Store';
import { StoreQuery, StoreContents } from '../types';

export type Value = Record<string, string>;

export abstract class KeyValueStore extends Store {
  constructor(public protocol: string) {
    super(protocol, { supportsGlobQuery: false });
  }

  abstract getByKey(key: string): Promise<Value>;

  abstract upsert(key: string, value: Value): Promise<void>;

  abstract delete(key: string): Promise<void>;

  calcKey({ set, schema }: StoreQuery[number]): string {
    let key = `${set}/${schema}`;
    if (!set && schema) {
      key = schema;
    }
    return key;
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    const keys = _(query).map(this.calcKey).uniq().value();
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

    const storedConfigs = _(query)
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
