import _ from 'lodash';
import { GcpSecretManagerStore } from '@configu/node';
import { ProtocolToInit } from './types';

export const GcpSecretManagerStorePTI: ProtocolToInit = {
  [GcpSecretManagerStore.protocol]: async (url) => {
    // * gcp-secret-manager://-[?endpoint=]
    if (url.hostname === '-') {
      const { GCP_PROJECT, GCP_KEY_FILE } = process.env;

      if (!GCP_PROJECT || !GCP_KEY_FILE) {
        throw new Error(`invalid store url ${url}`);
      }

      return {
        url: `${GcpSecretManagerStore.protocol}://${GCP_KEY_FILE}@${GCP_PROJECT}`,
        store: new GcpSecretManagerStore({
          project: GCP_PROJECT,
          keyFile: GCP_KEY_FILE,
        }),
      };
    }

    // TODO - this is a mess - find a better approach
    const splittedHref = url.href.split('@');
    const keyFilePath = _([url.hostname, url.pathname.split('@')[0]])
      .compact()
      .join('');
    const project = splittedHref[1];

    // * gcp-secret-manager://path/to/key/file.json@project
    return {
      url: url.href,
      store: new GcpSecretManagerStore({
        project,
        keyFile: `/${keyFilePath}`, // TODO - this does not support relative paths
      }),
    };
  },
};
