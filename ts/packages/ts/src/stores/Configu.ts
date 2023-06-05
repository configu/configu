import axios, { Axios } from 'axios';
import validator from 'validator';
import { ConfigStore } from '../ConfigStore';
import { ConfigStoreQuery, Config } from '../types';

// todo: add support for env vars auth
type ConfiguConfigStoreConfiguration = {
  credentials: { org: string; token: string };
  endpoint?: string;
  source?: string;
};

export class ConfiguConfigStore extends ConfigStore {
  private client: Axios;
  constructor({ credentials, endpoint = `https://api.configu.com`, source = 'sdk' }: ConfiguConfigStoreConfiguration) {
    super('configu');

    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        Org: credentials.org,
        Source: source,
      },
      responseType: 'json',
    });

    if (validator.isJWT(credentials.token)) {
      this.client.defaults.headers.common.Authorization = `Bearer ${credentials.token}`;
    } else {
      this.client.defaults.headers.common.Token = credentials.token;
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
