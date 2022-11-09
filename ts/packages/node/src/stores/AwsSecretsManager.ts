import {
  SecretsManagerClient,
  SecretsManagerClientConfig,
  GetSecretValueCommand,
  UpdateSecretCommand,
  CreateSecretCommand,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import _ from 'lodash';
import { Store, KeyValueStore, StoreQuery, StoreContents } from '@configu/ts';

// todo: use KeyValueStore instead of Store

// ! supports JSON secrets only
export class AwsSecretsManagerStore extends Store {
  static readonly scheme = 'aws-secrets-manager';
  private client: SecretsManagerClient;
  constructor(configuration: SecretsManagerClientConfig) {
    super(AwsSecretsManagerStore.scheme);
    this.client = new SecretsManagerClient(configuration);
  }

  private getSecretId({ set, schema }: StoreQuery[number]) {
    let secretId = `${set}/${schema}`;
    if (!set && schema) {
      secretId = schema;
    }
    return secretId;
  }

  // * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html
  async get(query: StoreQuery): Promise<StoreContents> {
    const secretsIds = _(query)
      .map((q) => this.getSecretId(q))
      .uniq()
      .value();

    const secretsPromises = secretsIds.map(async (secretId) => {
      try {
        const command = new GetSecretValueCommand({ SecretId: secretId });
        const res = await this.client.send(command);
        if (!res?.SecretString) {
          throw new Error(`secret ${secretId} has no value at ${this.constructor.name}`);
        }
        return { secretId, data: JSON.parse(res.SecretString) };
      } catch (error) {
        return { secretId, data: {} };
      }
    });
    const secretsArray = await Promise.all(secretsPromises);
    const secrets = _(secretsArray).keyBy('secretId').mapValues('data').value();

    const storedConfigs = _(query)
      .map((q) => {
        const { set, schema, key } = q;
        const secretId = this.getSecretId(q);
        const secretData = secrets[secretId];

        if (key === '*') {
          return Object.entries(secretData).map((data) => {
            return {
              set,
              schema,
              key: data[0],
              value: data[1] as any,
            };
          });
        }

        return {
          set,
          schema,
          key,
          value: secretData[key],
        };
      })
      .flatten()
      .filter('value')
      .value();

    return storedConfigs;
  }

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
        const command = new DeleteSecretCommand({ SecretId: secretId });
        await this.client.send(command);
        return;
      }

      const secretString = JSON.stringify(secretData);
      try {
        const command = new UpdateSecretCommand({ SecretId: secretId, SecretString: secretString });
        await this.client.send(command);
      } catch (error) {
        const command = new CreateSecretCommand({ Name: secretId, SecretString: secretString });
        await this.client.send(command);
      }
    });

    await Promise.all(setConfigsPromises);
  }
}
