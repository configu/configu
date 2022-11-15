import _ from 'lodash';
import { URI } from '@configu/ts';
import { AwsSecretsManagerStore } from '@configu/node';
import { SchemeToInit } from './types';

// todo: try to utilize aws sdk's builtin configurations detection - https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html
export const AwsSecretsManagerStoreSTI: SchemeToInit = {
  [AwsSecretsManagerStore.scheme]: async (uri) => {
    const parsedUri = URI.parse(uri);
    const queryDict = _.fromPairs(parsedUri.query?.split('&').map((query) => query.split('=')));
    const endpoint = queryDict.endpoint ?? undefined;
    const splittedUserinfo = parsedUri.userinfo?.split(':');

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

    if (!splittedUserinfo || !splittedUserinfo[0] || !splittedUserinfo[1] || !parsedUri.host) {
      throw new Error(`invalid store uri ${uri}`);
    }

    // * aws-secrets-manager://accessKeyId:secretAccessKey@region[?endpoint=]
    return {
      uri,
      store: new AwsSecretsManagerStore({
        credentials: { accessKeyId: splittedUserinfo[0], secretAccessKey: splittedUserinfo[1] },
        region: parsedUri.host,
        endpoint,
      }),
    };
  },
};
