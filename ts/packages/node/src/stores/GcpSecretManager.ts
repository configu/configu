import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import _ from 'lodash';
import { Store, StoreQuery, StoreContents } from '@configu/ts';
import { getConfigsHelper } from './utils';

type GcpSecretManagerConfiguration = { keyFile: string; project: string };

export class GcpSecretManagerStore extends Store {
  static readonly protocol = 'gcp-secret-manager';
  private client: SecretManagerServiceClient;
  private project: string;
  constructor({ keyFile, project }: GcpSecretManagerConfiguration) {
    super(GcpSecretManagerStore.protocol, { supportsGlobQuery: false });

    this.client = new SecretManagerServiceClient({ keyFile });
    this.project = project;
  }

  private getSecretId({ set, schema }: StoreQuery[number]) {
    // * Secret names can only contain English letters (A-Z), numbers (0-9), dashes (-), and underscores (_)
    // TODO - consult
    let secretId = `${set}-${schema}`.split('/').join('-');
    if (!set && schema) {
      secretId = schema.split('/').join('-');
    }
    return secretId;
  }

  private addSecretVersion = async (secretId: string, secretData: Record<string, string>) => {
    await this.client.addSecretVersion({
      parent: `projects/${this.project}/secrets/${secretId}`,
      payload: {
        data: Buffer.from(JSON.stringify(secretData), 'utf-8'), // TODO - Review this
      },
    });
  };

  // * https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets#access
  private fetchSecret = async (secretId: string) => {
    try {
      const [accessResponse] = await this.client.accessSecretVersion({
        name: `projects/${this.project}/secrets/${secretId}/version/latest`,
      });
      const secret = accessResponse?.payload?.data?.toString();

      if (!secret) {
        throw new Error(`secret ${secretId} has no value at ${this.constructor.name}`);
      }
      return { secretId, data: JSON.parse(secret) };
    } catch (error) {
      return { secretId, data: {} };
    }
  };

  async get(query: StoreQuery): Promise<StoreContents> {
    return getConfigsHelper(query, 'secretId', this.getSecretId, this.fetchSecret);
  }

  // * https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets#create
  async set(configs: StoreContents): Promise<void> {
    const secrets: Record<string, Record<string, string>> = {};
    configs.forEach((config) => {
      const secretId = this.getSecretId(config);
      if (!secrets[secretId]) {
        secrets[secretId] = {};
      }
      if (!config.value) {
        return;
      }
      secrets[secretId] = { ...secrets[secretId], [config.key]: config.value };
    });

    const setConfigsPromises = Object.entries(secrets).map(async ([secretId, secretData]) => {
      if (_.isEmpty(secretData)) {
        await this.client.deleteSecret({ name: secretId });
        return;
      }

      try {
        await this.client.createSecret({
          parent: `projects/${this.project}`,
          secretId,
          secret: {
            replication: {
              automatic: {},
            },
          },
        });

        await this.addSecretVersion(secretId, secretData);
      } catch (error) {
        await this.addSecretVersion(secretId, secretData);
      }
    });

    await Promise.all(setConfigsPromises);
  }
}
