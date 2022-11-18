import _ from 'lodash';
import { URI } from '@configu/ts';
import { SchemeToInit } from './types';
import { NoopStorePTI } from './Noop';
import { ConfiguStoreSTI } from './Configu';
import { JsonFileStoreSTI } from './JsonFile';
import { HashiCorpVaultStoreSTI } from './HashiCorpVault';
import { AwsSecretsManagerStoreSTI } from './AwsSecretsManager';
import { KubernetesSecretStoreSTI } from './Kubernetes';
import { GcpSecretManagerStoreSTI } from './GcpSecretManager';
import { AzureKeyVaultStoreSTI } from './AzureKeyVault';

const SCHEME_TO_STORE_INIT_FN_DICT: SchemeToInit = {
  ...NoopStorePTI,
  ...ConfiguStoreSTI,
  ...JsonFileStoreSTI,
  ...HashiCorpVaultStoreSTI,
  ...AwsSecretsManagerStoreSTI,
  ...KubernetesSecretStoreSTI,
  ...GcpSecretManagerStoreSTI,
  ...AzureKeyVaultStoreSTI,
};

export const constructStoreFromUri = (uri: string) => {
  const parsedUri = URI.parse(uri);
  const queryDict = _.fromPairs(parsedUri.query?.split('&').map((query) => query.split('=')));
  const [user, password] = parsedUri.userinfo ? parsedUri.userinfo.split(':') : [];
  const storeInitFunction = SCHEME_TO_STORE_INIT_FN_DICT[parsedUri.scheme as string];
  if (!storeInitFunction) {
    throw new Error(`invalid store uri ${uri}, scheme unidentified`);
  }
  return storeInitFunction({ uri, parsedUri, queryDict, userinfo: [user, password] });
};
