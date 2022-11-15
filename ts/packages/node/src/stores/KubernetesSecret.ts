import _ from 'lodash';
import { KubeConfig, CoreV1Api, PatchUtils } from '@kubernetes/client-node';
import { KeyValueStore } from '@configu/ts';

type KubernetesSecretConfiguration = {
  kubeconfigFilePath: string;
  namespace: string;
};

export class KubernetesSecretStore extends KeyValueStore {
  static readonly protocol = 'kubernetes-secret';
  private client: CoreV1Api;
  private namespace: string;
  constructor({ kubeconfigFilePath, namespace }: KubernetesSecretConfiguration) {
    super(KubernetesSecretStore.protocol, { keySeparator: '-' });
    const kubernetesConfig = new KubeConfig();
    kubernetesConfig.loadFromFile(kubeconfigFilePath);
    this.client = kubernetesConfig.makeApiClient(CoreV1Api);
    this.namespace = namespace;
  }

  async init() {
    super.init(this.namespace);
  }

  async getByKey(key: string): Promise<string> {
    const response = await this.client.readNamespacedSecret(key, this.namespace);
    const secret = response?.body?.data;
    const decodedSecret = _.mapValues(secret, (value) => Buffer.from(value, 'base64').toString());
    return JSON.stringify(decodedSecret);
  }

  async upsert(key: string, value: string): Promise<void> {
    // * Values must be base64 strings - https://kubernetes.io/docs/concepts/configuration/secret/#restriction-names-data
    const encodedData = _.mapValues(JSON.parse(value), (v) => Buffer.from(v).toString('base64'));

    try {
      await this.client.createNamespacedSecret(this.namespace, {
        metadata: { name: key },
        data: encodedData,
      });
    } catch (err) {
      // * Creating a secret with a conflicting secretName creates an error
      await this.client.patchNamespacedSecret(
        key,
        this.namespace,
        [
          {
            op: 'replace',
            path: '/data',
            value: encodedData,
          },
        ],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_PATCH } },
      );
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.deleteNamespacedSecret(key, this.namespace);
  }
}
