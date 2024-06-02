import {
  SecretsManagerClient,
  type SecretsManagerClientConfig,
  GetSecretValueCommand,
  UpdateSecretCommand,
  CreateSecretCommand,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { KeyValueConfigStore } from '@configu/ts';

export type AWSSecretsManagerConfigStoreConfiguration = SecretsManagerClientConfig;

export class AWSSecretsManagerConfigStore extends KeyValueConfigStore {
  private client: SecretsManagerClient;
  constructor(configuration: AWSSecretsManagerConfigStoreConfiguration) {
    super('aws-secrets-manager');
    this.client = new SecretsManagerClient(configuration);
  }

  // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html
  async getByKey(key: string): Promise<string> {
    const command = new GetSecretValueCommand({ SecretId: key });
    const res = await this.client.send(command);
    return res?.SecretString ?? '';
  }

  async upsert(key: string, value: string): Promise<void> {
    try {
      // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/updatesecretcommand.html
      const command = new UpdateSecretCommand({ SecretId: key, SecretString: value });
      await this.client.send(command);
    } catch (error) {
      // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/createsecretcommand.html
      const command = new CreateSecretCommand({ Name: key, SecretString: value });
      await this.client.send(command);
    }
  }

  // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/deletesecretcommand.html
  async delete(key: string): Promise<void> {
    const command = new DeleteSecretCommand({ SecretId: key });
    await this.client.send(command);
  }
}
