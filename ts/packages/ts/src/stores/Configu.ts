import axios, { Axios } from 'axios';
import { Store } from '../Store';
import { StoreQuery, StoreContents } from '../types';

type ConfiguStoreCredentialsConfiguration = { org: string; token: string; type: 'Token' | 'Bearer' };

type ConfiguStoreConfiguration = {
  credentials: ConfiguStoreCredentialsConfiguration;
  endpoint?: string;
  source?: string;
};

export class ConfiguStore extends Store {
  static readonly scheme = 'configu';
  private client: Axios;
  constructor({ credentials, endpoint = `https://api.configu.com`, source = 'sdk' }: ConfiguStoreConfiguration) {
    super(ConfiguStore.scheme, credentials.org);

    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        Org: credentials.org,
        Source: source,
      },
      responseType: 'json',
    });

    if (credentials.type === 'Token') {
      this.client.defaults.headers.common[credentials.type] = credentials.token;
    }
    if (credentials.type === 'Bearer') {
      this.client.defaults.headers.common.Authorization = `${credentials.type} ${credentials.token}`;
    }
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    const { data } = await this.client.post('/config', { query });
    return data;
  }

  async set(configs: StoreContents): Promise<void> {
    await this.client.put('/config', { configs });
  }
}
