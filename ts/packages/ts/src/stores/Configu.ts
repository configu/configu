import axios, { type Axios } from 'axios';
import validator from 'validator';
import { ConfigStore } from '../ConfigStore';
import { type ConfigStoreQuery, type Config } from '../types';

export type ConfiguConfigStoreConfiguration = {
  credentials: { org: string; token: string };
  endpoint?: string;
  source?: string;
  tag?: string;
};

export class ConfiguConfigStoreApprovalQueueError extends Error {
  readonly queueUrl: string;
  constructor(protectedSet: string, queueUrl: string) {
    super(
      `Your recent upsert to the ${protectedSet} ConfigSet is currently pending in its approval queue, as ${protectedSet} is a "protected set". To proceed with these changes, please review and approve them at ${queueUrl}. If you lack the necessary permissions, reach out to an authorized org member.`,
    );
    this.queueUrl = queueUrl;
    this.name = 'ConfiguConfigStoreApprovalQueueError';
  }
}

export class ConfiguConfigStore extends ConfigStore {
  private client: Axios;
  public tag?: string;
  constructor({
    credentials,
    endpoint = `https://api.configu.com`,
    source = 'sdk',
    tag,
  }: ConfiguConfigStoreConfiguration) {
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

    this.tag = tag;
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const { data } = await this.client.post(`/config${this.tag ? `?tag=${this.tag}` : ''}`, { queries });
    return data;
  }

  async set(configs: Config[]): Promise<void> {
    const response = await this.client.put('/config', { configs });
    if (response.status === 202) {
      const protectedSet = response.data.diff.pending[0].set;
      const queueUrl = `${response.data.queueUrl}?set=${protectedSet}`;
      throw new ConfiguConfigStoreApprovalQueueError(protectedSet, queueUrl);
    }
  }
}
