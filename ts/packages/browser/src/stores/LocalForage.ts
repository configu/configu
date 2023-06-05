import localForage from 'localforage';
import { KeyValueConfigStore } from '@configu/ts';

export class LocalForageConfigStore extends KeyValueConfigStore {
  private client: LocalForage;
  constructor(configuration: LocalForageOptions) {
    super('localforage');
    this.client = localForage.createInstance(configuration);
  }

  // * https://localforage.github.io/localForage/#data-api-getitem
  async getByKey(key: string): Promise<string> {
    const data = await this.client.getItem(key);
    if (typeof data === 'string') {
      return data ?? '';
    }
    return JSON.stringify(data) ?? '';
  }

  // * https://localforage.github.io/localForage/#data-api-setitem
  async upsert(key: string, value: string): Promise<void> {
    await this.client.setItem(key, value);
  }

  // * https://localforage.github.io/localForage/#data-api-removeitem
  async delete(key: string): Promise<void> {
    await this.client.removeItem(key);
  }
}
