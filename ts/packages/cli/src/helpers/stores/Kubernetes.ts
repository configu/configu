import { KubernetesSecretStore } from '@configu/node';
import { SchemeToInit } from './types';

export const KubernetesSecretStoreSTI: SchemeToInit = {
  [KubernetesSecretStore.scheme]: async ({ uri, parsedUri, queryDict }) => {
    const kubeconfigFilePath = `${parsedUri.host}${parsedUri.path}`;
    const namespace = queryDict.namespace ?? 'default';

    // * kubernetes-secret://path/to/kubeconfig.yaml[?namespace=]
    return {
      uri,
      store: new KubernetesSecretStore({ kubeconfigFilePath, namespace }),
    };
  },
};
