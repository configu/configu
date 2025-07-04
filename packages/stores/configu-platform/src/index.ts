// eslint-disable-next-line import/no-extraneous-dependencies
import axios, { type Axios } from 'axios';
import { Config, ConfigWithCfgu, ConfigStore, ConfigQuery, validator } from '@configu/sdk';

export type ConfiguPlatformConfigStoreConfiguration = {
  credentials: { org: string; token: string };
  endpoint?: string;
  source?: string;
  tag?: string;
};

export const CONFIGU_DEFAULT_DOMAIN = 'configu.com';
export const CONFIGU_DEFAULT_API_URL = `https://api.${CONFIGU_DEFAULT_DOMAIN}`;
export const CONFIGU_DEFAULT_APP_URL = `https://app.${CONFIGU_DEFAULT_DOMAIN}`;

export class ConfiguPlatformConfigStoreApprovalQueueError extends Error {
  readonly queueUrl: string;
  constructor(protectedSet: string, queueUrl: string) {
    super(
      `Your recent upsert to the ${protectedSet} ConfigSet is currently pending in its approval queue, as ${protectedSet} is a "protected set". To proceed with these changes, please review and approve them at ${queueUrl}. If you lack the necessary permissions, reach out to an authorized org member.`,
    );
    this.queueUrl = queueUrl;
    this.name = 'ConfiguPlatformConfigStoreApprovalQueueError';
  }
}

export class ConfiguPlatformConfigStore extends ConfigStore {
  public readonly client: Axios;
  public readonly tag?: string;
  constructor({
    credentials,
    endpoint = CONFIGU_DEFAULT_API_URL,
    source = 'sdk',
    tag,
  }: ConfiguPlatformConfigStoreConfiguration) {
    super({ cfgu: true });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { CONFIGU_ORG, CONFIGU_TOKEN, CONFIGU_HOST } = import.meta?.env || (process as any)?.env || {};

    const org = credentials.org || CONFIGU_ORG;
    const token = credentials.token || CONFIGU_TOKEN;
    const baseURL = endpoint || CONFIGU_HOST;

    if (!org || !token) {
      throw new Error('ConfiguPlatformConfigStore: credentials.org and credentials.token are required');
    }

    this.client = axios.create({
      baseURL,
      headers: {
        Org: org,
        Source: source,
      },
      responseType: 'json',
    });

    if (validator.isJWT(token)) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      this.client.defaults.headers.common.Token = token;
    }

    this.tag = tag;
  }

  get appUrl(): string {
    return this.client.defaults.baseURL?.replace('api.', 'app.') ?? CONFIGU_DEFAULT_APP_URL;
  }

  async get(queries: ConfigQuery[]): Promise<Config[]> {
    const { data } = await this.client.post(`/config${this.tag ? `?tag=${this.tag}` : ''}`, { queries });
    return data;
  }

  async set(configs: ConfigWithCfgu[]): Promise<void> {
    const response = await this.client.put('/config', { configs });
    if (response.status === 202) {
      const protectedSet = response.data.diff.pending[0].set;
      const queueUrl = `${response.data.queueUrl}?set=${protectedSet}`;
      throw new ConfiguPlatformConfigStoreApprovalQueueError(protectedSet, queueUrl);
    }
  }
}
