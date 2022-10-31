import {
  SecretsManagerClient,
  SecretsManagerClientConfig,
  GetSecretValueCommand,
  UpdateSecretCommand,
  CreateSecretCommand,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { KeyValueStore, Value } from '@configu/ts';

// ! supports JSON secrets only
export class AwsSecretsManagerStore extends KeyValueStore {
  static readonly protocol = 'aws-secrets-manager';
  private client: SecretsManagerClient;
  constructor(configuration: SecretsManagerClientConfig) {
    super(AwsSecretsManagerStore.protocol);

    this.client = new SecretsManagerClient(configuration);
  }

  // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html
  async getByKey(key: string): Promise<Value> {
    const command = new GetSecretValueCommand({ SecretId: key });
    const res = await this.client.send(command);
    return res?.SecretString ? JSON.parse(res.SecretString) : {};
  }

  async upsert(key: string, value: Value): Promise<void> {
    // TODO: Wrap with try catch and throw with the extracted error message
    const secretString = JSON.stringify(value);
    try {
      // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/updatesecretcommand.html
      const command = new UpdateSecretCommand({ SecretId: key, SecretString: secretString });
      await this.client.send(command);
    } catch (error) {
      // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/createsecretcommand.html
      const command = new CreateSecretCommand({ Name: key, SecretString: secretString });
      await this.client.send(command);
    }
  }

  // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/deletesecretcommand.html
  async delete(key: string): Promise<void> {
    // TODO: Wrap with try catch and throw with the extracted error message
    const command = new DeleteSecretCommand({ SecretId: key });
    await this.client.send(command);
  }
}
