import axios, { type Axios } from 'axios';
import { KeyValueConfigStore } from '@configu/key-value';

export type HCPVaultSecretsConfigStoreConfiguration = {
  clientId: string;
  clientSecret: string;
  organizationId: string;
  projectId: string;
  appName: string;
};

export class HCPVaultSecretsConfigStore extends KeyValueConfigStore {
  private client: Axios;
  constructor(configuration: HCPVaultSecretsConfigStoreConfiguration) {
    super();

    const { organizationId, projectId, appName } = configuration;
    this.client = axios.create({
      baseURL: `https://api.cloud.hashicorp.com/secrets/2023-11-28/organizations/${organizationId}/projects/${projectId}/apps/${appName}`,
      responseType: 'json',
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await this.getApiToken(configuration);
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  private async getApiToken({ clientId, clientSecret }: HCPVaultSecretsConfigStoreConfiguration): Promise<string> {
    if (!clientId || !clientSecret) {
      throw new Error('Missing clientId or clientSecret');
    }

    if (process.env.HCP_API_TOKEN) {
      return process.env.HCP_API_TOKEN;
    }

    const { data } = await axios.get('https://auth.idp.hashicorp.com/oauth2/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: {
        client_id: clientId ?? process.env.HCP_CLIENT_ID,
        client_secret: clientSecret ?? process.env.HCP_CLIENT_SECRET,
        grant_type: 'client_credentials',
        audience: 'https://api.hashicorp.cloud',
      },
    });
    return data.access_token;
  }

  // * OpenAppSecret - https://developer.hashicorp.com/hcp/api-docs/vault-secrets/openappsecret
  async getByKey(key: string): Promise<string> {
    const { data } = await this.client.get(`/secrets/${key}:open`);
    return JSON.stringify(data?.static_version?.value) ?? '';
  }

  // * CreateAppKVSecret - https://developer.hashicorp.com/hcp/api-docs/vault-secrets/createappkvsecret
  async upsert(key: string, value: string): Promise<void> {
    await this.client.post(`/secret/kv`, { data: { name: key, value } });
  }

  // * DeleteAppSecret - https://developer.hashicorp.com/hcp/api-docs/vault-secrets/deleteappsecret
  async delete(key: string): Promise<void> {
    await this.client.delete(`/secrets/${key}`);
  }
}
