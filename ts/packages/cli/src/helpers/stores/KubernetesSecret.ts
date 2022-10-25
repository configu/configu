import _ from 'lodash';
import { KubernetesSecretStore } from '@configu/node';
import { ProtocolToInit } from './types';

export const KubernetesSecretStorePTI: ProtocolToInit = {
  [KubernetesSecretStore.protocol]: async (url) => {
    // * kubernetes-secret://-
    if (url.hostname === '-') {
      const { KUBECONFIG_FILE_PATH, NAMESPACE } = process.env;

      if (!NAMESPACE || !KUBECONFIG_FILE_PATH) {
        throw new Error(`invalid store url ${url}`);
      }

      return {
        url: `${KubernetesSecretStorePTI.protocol}://${KUBECONFIG_FILE_PATH}@${NAMESPACE}`,
        store: new KubernetesSecretStore({ kubeconfigFilePath: KUBECONFIG_FILE_PATH, namespace: NAMESPACE }),
      };
    }

    const splittedHref = url.href.split('://')[1];
    const [kubeconfigFilePath, namespace] = splittedHref.split('@');

    if (!kubeconfigFilePath || !namespace) {
      throw new Error(`invalid store url ${url}`);
    }

    // * kubernetes-secret://path/to/kubeconfig.yaml@namespace
    return { url: url.href, store: new KubernetesSecretStore({ kubeconfigFilePath, namespace }) };
  },
};
