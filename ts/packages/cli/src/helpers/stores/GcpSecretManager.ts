import { GcpSecretManagerStore } from '@configu/node';
import { SchemeToInit } from './types';

export const GcpSecretManagerStoreSTI: SchemeToInit = {
  [GcpSecretManagerStore.scheme]: async ({ uri, parsedUri, queryDict }) => {
    const keyFilePath = `${parsedUri.host}${parsedUri.path}`;
    const { projectId } = queryDict;

    if (!projectId) {
      throw new Error(`invalid store uri ${uri}`);
    }

    // * gcp-secret-manager://path/to/keyfile.json[?projectId=]
    return {
      uri,
      store: new GcpSecretManagerStore({ keyFile: keyFilePath, projectId }),
    };
  },
};
