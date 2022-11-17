import { KubernetesSecretStore } from '@configu/node';
import { SchemeToInit } from './types';

export const KubernetesSecretStoreSTI: SchemeToInit = {
  [KubernetesSecretStore.protocol]: async ({ uri, parsedUri, queryDict }) => {
    const kubeconfigFilePath = `${parsedUri.host}${parsedUri.path}`;
    const namespace = queryDict.namespace ?? 'default';

    if (!kubeconfigFilePath) {
      throw new Error(`invalid store uri ${uri}`);
    }

    // * kubernetes-secret://path/to/kubeconfig.yaml[?namespace=]
    return {
      uri,
      store: new KubernetesSecretStore({ kubeconfigFilePath, namespace }),
    };
  },
};
