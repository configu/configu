import axios, { Axios } from 'axios';
import { ConfigStore } from '../ConfigStore';
import { ConfigStoreQuery, Config } from '../types';

type ConfiguStoreCredentialsConfiguration = { org: string; token: string; type: 'Token' | 'Bearer' };

type ConfiguStoreConfiguration = {
  credentials: ConfiguStoreCredentialsConfiguration;
  endpoint?: string;
  source?: string;
};

export class ConfiguStore extends ConfigStore {
  private client: Axios;
  constructor({ credentials, endpoint = `https://api.configu.com`, source = 'sdk' }: ConfiguStoreConfiguration) {
    super('configu');

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

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const { data } = await this.client.post('/config', { queries });
    return data;
  }

  async set(configs: Config[]): Promise<void> {
    await this.client.put('/config', { configs });
  }
}
