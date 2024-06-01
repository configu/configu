import axios, { type Axios } from 'axios';
import { KeyValueConfigStore } from '@configu/ts';

export type HashiCorpVaultConfigStoreConfiguration = { address?: string; token?: string; engine: string };

// ! supports K/V2 engine only
export class HashiCorpVaultConfigStore extends KeyValueConfigStore {
  private client: Axios;
  private engine: string;
  constructor(configuration: HashiCorpVaultConfigStoreConfiguration) {
    super('hashicorp-vault');

    const address = configuration.address ?? process.env.VAULT_ADDR;
    const token = configuration.token ?? process.env.VAULT_TOKEN;

    this.client = axios.create({
      baseURL: `${address}/v1`,
      headers: {
        'X-Vault-Token': token,
      },
      responseType: 'json',
    });
    this.engine = configuration.engine;
  }

  private formatKey(key: string): string {
    return `${this.engine}/data/${key}`;
  }

  // * K/V2 Read Secret Version - https://www.vaultproject.io/api-docs/secret/kv/kv-v2#read-secret-version
  async getByKey(key: string): Promise<string> {
    const { data } = await this.client.get(this.formatKey(key));
    return JSON.stringify(data?.data?.data) ?? '';
  }

  // * K/V2 Create/Update Secret Version - https://www.vaultproject.io/api-docs/secret/kv/kv-v2#create-update-secret
  async upsert(key: string, value: string): Promise<void> {
    await this.client.post(this.formatKey(key), { data: JSON.parse(value) });
  }

  async delete(key: string): Promise<void> {
    await this.client.delete(this.formatKey(key).replace('data', 'metadata'));
  }
}
