/* cspell:disable */
import { KeyValueConfigStore } from '@configu/ts';
import type Keyv from 'keyv';

// TODO: rework KeyvConfigStoreConfiguration for CLI support and then add KeyvConfigStore to `@configu/lib` & `@configu/cli`. Adapters are missing (https://www.npmjs.com/package/keyv#official-storage-adapters). Consider this strategy for reworking KeyvConfigStoreConfiguration: https://github.com/configu/configu/pull/167#discussion_r1268823038.
export type KeyvConfigStoreConfiguration = { keyvInstance: Keyv };

/**
 * KeyvConfigStore is a KeyValueConfigStore implementation that uses Keyv as a backend.
 * @description
 * Keyv is a simple key-value store for Node.js with support for multiple backends.
 * @see https://www.npmjs.com/package/keyv
 * @example
 * ```ts
 * import Keyv from 'keyv';
 * import { KeyvConfigStore } from '@configu/ts-node';
 * const keyvMongo = new Keyv('mongodb://user:pass@localhost:27017/dbname');
 * const configStore = new KeyvConfigStore({ keyvInstance: keyvMongo });
 * ```
 */
export class KeyvConfigStore extends KeyValueConfigStore {
  client: Keyv;

  constructor({ keyvInstance }: KeyvConfigStoreConfiguration) {
    super('keyv');
    this.client = keyvInstance;
  }

  protected async getByKey(key: string): Promise<string> {
    const value = await this.client.get(key);
    return value ?? '';
  }

  protected async upsert(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  protected async delete(key: string): Promise<void> {
    await this.client.delete(key);
  }
}
