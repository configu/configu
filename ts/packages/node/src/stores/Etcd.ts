import { KeyValueConfigStore } from '@configu/ts';
import { Etcd3, type IOptions } from 'etcd3';

export type EtcdConfigStoreConfiguration = IOptions;

/**
 * EtcdConfigStore is a KeyValueConfigStore implementation that uses etcd3 as a backend.
 * @description
 * etcd3 is a Node.js client for etcd, a distributed key-value store.
 * @see https://www.npmjs.com/package/etcd3
 * @example
 * ```ts
 * import { EtcdConfigStore } from './EtcdConfigStore';
 * const configStore = new EtcdConfigStore({ hosts: '127.0.0.1:2379' });
 * ```
 */
export class EtcdConfigStore extends KeyValueConfigStore {
  client: Etcd3;

  constructor(config: EtcdConfigStoreConfiguration) {
    super('etcd');
    this.client = new Etcd3(config);
  }

  protected async getByKey(key: string): Promise<string> {
    const value = await this.client.get(key).string();
    return value ?? '';
  }

  protected async upsert(key: string, value: string): Promise<void> {
    await this.client.put(key).value(value);
  }

  protected async delete(key: string): Promise<void> {
    await this.client.delete().key(key);
  }
}
