import _ from 'lodash';
import { ConfigStore } from '../ConfigStore';
import { ConfigStoreQuery, Config } from '../types';

export abstract class KeyValueConfigStore extends ConfigStore {
  constructor(type: string) {
    super(type);
  }

  protected abstract getByKey(key: string): Promise<string>;

  protected abstract upsert(key: string, value: string): Promise<void>;

  protected abstract delete(key: string): Promise<void>;

  private calcKey({ set, key }: ConfigStoreQuery): string {
    return set || key;
  }

  private stringifyValue(value: any) {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  private safeJsonParse(value: any) {
    let jsonValue: Record<string, unknown> = {};
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
        const { set, key } = q;

        const value = kvDict[this.calcKey(q)];
        if (!set) {
          return { ...q, value: value ?? '' };
        }

        const jsonValue = this.safeJsonParse(value);
        return {
          set,
          key,
          value: this.stringifyValue(_.get(jsonValue, key)) ?? '',
        };
      })
      .filter('value')
      .value();

    return storedConfigs;
  }

  async set(configs: Config[]): Promise<void> {
    const kvDict: Record<string, string | Record<string, string>> = {};
    configs.forEach((config) => {
      const key = this.calcKey(config);
      if (!config.set) {
        kvDict[key] = config.value;
        return;
      }
      if (!kvDict[key] || !(kvDict[key] instanceof Object)) {
        kvDict[key] = {};
      }
      kvDict[key] = { ...(kvDict[key] as Record<string, string>), [config.key]: config.value };
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
