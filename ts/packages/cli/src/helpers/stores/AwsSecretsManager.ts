import { AwsSecretsManagerStore } from '@configu/node';
import { ProtocolToInit } from './types';

// todo: try to utilize aws sdk's builtin configurations detection - https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html
export const AwsSecretsManagerStorePTI: ProtocolToInit = {
  [AwsSecretsManagerStore.protocol]: async (url) => {
    const endpoint = url.searchParams.get('endpoint') ?? undefined;

    // * aws-secrets-manager://-[?endpoint=]
    if (url.hostname === '-') {
      const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

      if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
        throw new Error(`invalid store url ${url}`);
      }

      return {
        url: `${AwsSecretsManagerStore.protocol}://${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}@${AWS_REGION}${
          endpoint ? `?endpoint=${endpoint}` : ''
        }`,
        store: new AwsSecretsManagerStore({
          credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
          region: AWS_REGION,
          endpoint,
        }),
      };
    }

    // * aws-secrets-manager://accessKeyId:secretAccessKey@region[?endpoint=]
    return {
      url: url.href,
      store: new AwsSecretsManagerStore({
        credentials: { accessKeyId: url.username, secretAccessKey: url.password },
        region: url.hostname,
        endpoint,
      }),
    };
  },
};
