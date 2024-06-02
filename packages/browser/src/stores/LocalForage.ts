import localForage from 'localforage';
import { KeyValueConfigStore } from '@configu/ts';

export type LocalForageConfigStoreConfiguration = LocalForageOptions;

export class LocalForageConfigStore extends KeyValueConfigStore {
  private client: LocalForage;
  constructor(configuration: LocalForageConfigStoreConfiguration) {
    super('localforage');
    this.client = localForage.createInstance(configuration);
  }

  // * https://localforage.github.io/localForage/#data-api-getitem
  async getByKey(key: string): Promise<string> {
    const data = await this.client.getItem(key);
    if (typeof data === 'string') {
      return data ?? '';
    }
    return data === null ? '' : JSON.stringify(data) ?? '';
  }

  // * https://localforage.github.io/localForage/#data-api-setitem
  async upsert(key: string, value: string): Promise<void> {
    let parsedValue;
    try {
      parsedValue = JSON.parse(value, (__, jsonValue) => {
        if (typeof jsonValue === 'string') {
          try {
            return JSON.parse(jsonValue);
          } catch (e) {
            return jsonValue;
          }
        }
        return jsonValue;
      });
    } catch {
      parsedValue = value;
    }
    await this.client.setItem(key, parsedValue);
  }

  // * https://localforage.github.io/localForage/#data-api-removeitem
  async delete(key: string): Promise<void> {
    await this.client.removeItem(key);
  }
}
