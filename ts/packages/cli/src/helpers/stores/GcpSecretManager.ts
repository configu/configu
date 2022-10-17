import { GcpSecretManagerStore } from '@configu/node';
import { ProtocolToInit } from './types';

export const GcpSecretManagerStorePTI: ProtocolToInit = {
  [GcpSecretManagerStore.protocol]: async (url) => {
    const endpoint = url.searchParams.get('endpoint') ?? undefined;

    // * aws-secrets-manager://-[?endpoint=]
    if (url.hostname === '-') {
      const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

      if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
        throw new Error(`invalid store url ${url}`);
      }

      return {
        url: `${GcpSecretManagerStore.protocol}://${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}@${AWS_REGION}${
          endpoint ? `?endpoint=${endpoint}` : ''
        }`,
        store: new GcpSecretManagerStore({
          credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
          region: AWS_REGION,
          endpoint,
        }),
      };
    }

    // TODO: * gcp-secrets-manager://accessKeyId:secretAccessKey@region[?endpoint=]
    return {
      url: url.href,
      store: new GcpSecretManagerStore({
        credentials: { accessKeyId: url.username, secretAccessKey: url.password },
        region: url.hostname,
        endpoint,
      }),
    };
  },
};
