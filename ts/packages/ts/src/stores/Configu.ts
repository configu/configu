import axios, { type Axios } from 'axios';
import validator from 'validator';
import { ConfigStore } from '../ConfigStore';
import { type ConfigStoreQuery, type Config } from '../types';

export type ConfiguConfigStoreConfiguration = {
  credentials: { org: string; token: string };
  endpoint?: string;
  source?: string;
};

export class ConfiguConfigStoreApprovalQueueError extends Error {
  queueUrl: string;
  constructor(message: string, queueUrl: string) {
    super(message);
    this.name = 'ConfiguConfigStoreApprovalQueueError';
    this.queueUrl = queueUrl;
  }
}

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
    const response = await this.client.put('/config', { configs });
    if (response.status === 202) {
      const protectedSet = response.data.diff.pending[0].set;
      const queueUrl = `${response.data.queueUrl}?sp=${protectedSet}`;
      throw new ConfiguConfigStoreApprovalQueueError(
        `Your recent upsert to the ${protectedSet} ConfigSet is currently pending in its approval queue, as ${protectedSet} is a "protected set". To proceed with these changes, please review and approve them at ${queueUrl}. If you lack the necessary permissions, reach out to an authorized org member.`,
        queueUrl,
      );
    }
  }
}
