import { AwsSecretsManagerStore } from '@configu/node';
import { SchemeToInit } from './types';

// todo: try to utilize aws sdk's builtin configurations detection - https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html
export const AwsSecretsManagerStoreSTI: SchemeToInit = {
  [AwsSecretsManagerStore.scheme]: async ({ uri, parsedUri, queryDict, userinfo }) => {
    const endpoint = queryDict.endpoint ?? undefined;
    const accessKeyId = userinfo[0];

    // * aws-secrets-manager://-[?endpoint=]
    if (parsedUri.host === '-') {
      const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

      if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
        throw new Error(`invalid store uri ${uri}`);
      }

      return {
        uri: `${AwsSecretsManagerStore.scheme}://${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}@${AWS_REGION}${
          endpoint ? `?endpoint=${endpoint}` : ''
        }`,
        store: new AwsSecretsManagerStore({
          credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
          region: AWS_REGION,
          endpoint,
        }),
      };
    }

    if (!accessKeyId || !queryDict.secretAccessKey || !parsedUri.host) {
      throw new Error(`invalid store uri ${uri}`);
    }

    // * aws-secrets-manager://accessKeyId@region[?secretAccessKey=][&endpoint=]
    return {
      uri,
      store: new AwsSecretsManagerStore({
        credentials: { accessKeyId, secretAccessKey: queryDict.secretAccessKey },
        region: parsedUri.host,
        endpoint,
      }),
    };
  },
};
