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
  static readonly protocol = 'configu';
  private client: Axios;
  constructor({ credentials, endpoint = `https://api.configu.com`, source = 'sdk' }: ConfiguStoreConfiguration) {
    super(ConfiguStore.protocol, { supportsGlobQuery: true });

    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        Authorization: `${credentials.type} ${credentials.token}`,
        Org: credentials.org,
        Source: source,
      },
      responseType: 'json',
    });
  }

  async get(query: StoreQuery): Promise<StoreContents> {
    const { data } = await this.client.post('/config', { query });
    return data;
  }

  async set(configs: StoreContents): Promise<void> {
    await this.client.put('/config', { configs });
  }
}
