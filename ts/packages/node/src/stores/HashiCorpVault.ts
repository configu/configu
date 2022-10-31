import axios, { Axios } from 'axios';
import _ from 'lodash';
import { KeyValueStore, Value, StoreQuery } from '@configu/ts';

type HashiCorpVaultConfiguration = { address: string; token: string };

// ! supports K/V2 engine only
export class HashiCorpVaultStore extends KeyValueStore {
  static readonly protocol = 'hashicorp-vault';
  private client: Axios;
  constructor({ address, token }: HashiCorpVaultConfiguration) {
    super(HashiCorpVaultStore.protocol, { enforceRootSet: true });

    this.client = axios.create({
      baseURL: `${address}/v1`,
      headers: {
        'X-Vault-Token': token,
      },
      responseType: 'json',
    });
  }

  // * K/V2 Read Secret Version - https://www.vaultproject.io/api-docs/secret/kv/kv-v2#read-secret-version
  calcKey({ set, schema }: StoreQuery[number]): string {
    // * set first element used as vault engine
    if (!set) {
      throw new Error(`invalid secret path is at ${this.constructor.name}`);
    }
    const splittedSet = set.split('/');
    const engine = splittedSet.shift();
    const path = _.isEmpty(splittedSet) ? schema : `${splittedSet.join('/')}/${schema}`;
    return `${engine}/data/${path}`;
  }

  async getByKey(key: string): Promise<Value> {
    const { data } = await this.client.get(key);
    const secretData = data?.data?.data;
    return secretData;
  }

  async upsert(key: string, value: Value): Promise<void> {
    await this.client.post(key, { data: value });
  }

  async delete(key: string): Promise<void> {
    await this.client.delete(key.replace('data', 'metadata'));
  }
}
