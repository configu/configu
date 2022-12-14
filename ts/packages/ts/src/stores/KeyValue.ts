import _ from 'lodash';
import { ConfigStore } from '../ConfigStore';
import { ConfigStoreQuery, Config } from '../types';

type KeyValueStoreConfiguration = {
  keySeparator?: string;
};
export abstract class KeyValueStore extends ConfigStore {
  constructor(type: string, protected configuration: KeyValueStoreConfiguration = {}) {
    super(type);
  }

  protected abstract getByKey(key: string): Promise<string>;

  protected abstract upsert(key: string, value: string): Promise<void>;

  protected abstract delete(key: string): Promise<void>;

  private calcKey({ set, schema }: ConfigStoreQuery): string {
    if (set === '*' || schema === '*') {
      throw new Error(`store ${this.constructor.name} don't support bulk operations`);
    }

    let key = `${set}/${schema}`;
    if (!set && schema) {
      key = schema;
    }

    if (this.configuration.keySeparator) {
      return key.split('/').join(this.configuration.keySeparator);
    }
    return key;
  }

  private stringifyValue(value: any) {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  private safeJsonParse(value: any) {
    let jsonValue: Record<string, any> = {};
    try {
      jsonValue = JSON.parse(value);
    } catch (error) {
      jsonValue = {};
    }
    return jsonValue;
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const keys = _(queries)
      .map((q) => this.calcKey(q))
      .uniq()
      .value();

    const kvPromises = keys.map(async (key) => {
      try {
        const value = await this.getByKey(key);
        if (!value) {
          throw new Error(`key ${key} has no value at ${this.constructor.name}`);
        }
        return { key, value };
      } catch (error) {
        return { key, value: '' };
      }
    });
    const kvArray = await Promise.all(kvPromises);
    const kvDict = _(kvArray).keyBy('key').mapValues('value').value();

    const storedConfigs = _(queries)
      .map((q) => {
        const { set, schema, key } = q;
        const value = kvDict[this.calcKey(q)];

        if (!key) {
          return {
            set,
            schema,
            key,
            value,
          };
        }

        const jsonValue = this.safeJsonParse(value);

        if (key === '*') {
          return Object.entries(jsonValue).map(([k, v]) => {
            return {
              set,
              schema,
              key: k,
              value: this.stringifyValue(v),
            };
          });
        }

        return {
          set,
          schema,
          key,
          value: this.stringifyValue(_.get(jsonValue, key)) ?? '',
        };
      })
      .flatten()
      .filter('value')
      .value();

    return storedConfigs;
  }

  async set(configs: Config[]): Promise<void> {
    const kvDict: Record<string, Record<string, string>> = {};
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

      await this.upsert(key, JSON.stringify(value));
    });

    await Promise.all(setConfigsPromises);
  }
}
