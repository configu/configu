import _ from 'lodash';
import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import { Store, StoreQuery, StoreContents } from '@configu/ts';
import { getConfigsHelper } from './util';

type KubernetesSecretConfiguration = {
  kubeconfigFilePath: string;
  namespace: string;
};

export class KubernetesSecretStore extends Store {
  static readonly protocol = 'aws-secrets-manager';
  private client: CoreV1Api;
  private namespace: string;
  constructor({ kubeconfigFilePath, namespace }: KubernetesSecretConfiguration) {
    super(KubernetesSecretStore.protocol, { supportsGlobQuery: false });
    const kubernetesConfig = new KubeConfig();
    kubernetesConfig.loadFromFile(kubeconfigFilePath);
    this.client = kubernetesConfig.makeApiClient(CoreV1Api);
    this.namespace = namespace;
  }

  private getSecretName({ set, schema }: StoreQuery[number]) {
    // * The secret path cannot contain the character '/'
    // TODO: consult
    const adjustedSet = set.split('/').join('-');
    const adjustedSchema = schema.split('/').join('-');
    let secretPath = `${adjustedSet}-${adjustedSchema}`;
    if (!set) {
      secretPath = adjustedSchema;
    }
    return secretPath;
  }

  private fetchSecret = async (secretId: string) => {
    try {
      const response = await this.client.readNamespacedSecret(secretId, this.namespace);
      const secret = response?.body?.data?.[secretId];

      if (!secret) {
        throw new Error(`secret ${secretId} has no value at ${this.constructor.name}`);
      }
      return { secretId, data: JSON.parse(Buffer.from(secret, 'base64').toString()) };
    } catch (error) {
      return { secretId, data: {} };
    }
  };

  async get(query: StoreQuery): Promise<StoreContents> {
    return getConfigsHelper(query, 'secretId', this.getSecretName, this.fetchSecret);
  }

  async set(configs: StoreContents): Promise<void> {
    const secrets: Record<string, Record<string, string>> = {};
    configs.forEach((config) => {
      const secretId = this.getSecretName(config);
      if (!secrets[secretId]) {
        secrets[secretId] = {};
      }
      if (!config.value) {
        return;
      }
      secrets[secretId] = { ...secrets[secretId], [config.key]: config.value };
    });

    const setConfigsPromises = Object.entries(secrets).map(async ([secretName, secretData]) => {
      if (_.isEmpty(secretData)) {
        await this.client.deleteNamespacedSecret(secretName, this.namespace);
        return;
      }

      try {
        await this.client.createNamespacedSecret(this.namespace, {
          metadata: { name: secretName },
          data: _(secretData)
            .mapValues((value) => Buffer.from(JSON.stringify(value)).toString('base64'))
            .value(),
        });
      } catch (err) {
        // * Creating a secret with a conflicting secretName creates an error
        // TODO: patch vs replace
        // await this.client.patchNamespacedSecret(secretName, this.namespace, {
        await this.client.replaceNamespacedSecret(secretName, this.namespace, {
          metadata: { name: secretName },
          data: _(secretData)
            .mapValues((value) => Buffer.from(JSON.stringify(value)).toString('base64'))
            .value(),
        });
      }
    });

    await Promise.all(setConfigsPromises);
  }
}
